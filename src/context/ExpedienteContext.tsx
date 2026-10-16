/**
 * ARK TOOLS — Expediente Único Context (Sprint 9)
 *
 * Catálogo unificado de clientes y trabajadores con aislamiento multi-tenant:
 * - Selección centralizada de Cliente/Trabajador activo.
 * - Auto-hidratación (prefill) para SBC, Nómina, Finiquitos e ISN.
 * - Sellado y guardado de cálculos en el historial del expediente (D1 + SHA-256).
 * - Resiliencia offline con persistencia en localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AuthContext from './AuthContext';
import {
  apiClient,
  type ClientRecord,
  type ExpedienteRecord,
  type TipoCliente,
  type EstadoCliente,
} from '../lib/apiClient';

export interface CreateClientInput {
  nombre: string;
  tipo?: TipoCliente;
  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;
  salario_diario?: number;
  salario_diario_integrado?: number;
  fecha_ingreso?: string | null;
  factor_integracion?: number;
  estado?: EstadoCliente;
  parent_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ExpedienteContextType {
  // Estado
  activeClient: ClientRecord | null;
  clients: ClientRecord[];
  expedientes: ExpedienteRecord[];
  isLoadingClients: boolean;
  isLoadingExpedientes: boolean;
  error: string | null;
  tenantId: string;

  // Acciones de Cliente
  setActiveClient: (client: ClientRecord | null) => void;
  createClient: (input: CreateClientInput) => Promise<ClientRecord>;
  updateClient: (id: string, updates: Partial<ClientRecord>) => Promise<ClientRecord>;
  deleteClient: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;

  // Acciones de Expediente / Historial
  saveCalculoExpediente: (
    toolId: string,
    titulo: string,
    inputs: Record<string, unknown>,
    outputs: Record<string, unknown>,
    force?: boolean
  ) => Promise<{ expediente: ExpedienteRecord; deduplicated?: boolean } | null>;
  refreshExpedientes: () => Promise<void>;

  // Auto-llenado para herramientas
  getPrefillForTool: (toolId: string) => Record<string, unknown> | null;
}

const STORAGE_ACTIVE_CLIENT = 'ark_tools_active_client';
const STORAGE_CLIENTS_CACHE = 'ark_tools_clients_cache';
const STORAGE_EXPEDIENTES_CACHE = 'ark_tools_expedientes_cache';

const ExpedienteContext = createContext<ExpedienteContextType | undefined>(undefined);

export function ExpedienteProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const authTenantId = auth?.tenantId;
  const getToken = auth?.getToken ?? (async () => null);
  const tenantId = authTenantId || 'default-tenant';

  const [activeClient, setActiveClientState] = useState<ClientRecord | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem(STORAGE_ACTIVE_CLIENT);
      return stored ? (JSON.parse(stored) as ClientRecord) : null;
    } catch {
      return null;
    }
  });

  const [clients, setClients] = useState<ClientRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = window.localStorage.getItem(`${STORAGE_CLIENTS_CACHE}_${tenantId}`);
      return cached ? (JSON.parse(cached) as ClientRecord[]) : [];
    } catch {
      return [];
    }
  });

  const [expedientes, setExpedientes] = useState<ExpedienteRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = window.localStorage.getItem(`${STORAGE_EXPEDIENTES_CACHE}_${tenantId}`);
      return cached ? (JSON.parse(cached) as ExpedienteRecord[]) : [];
    } catch {
      return [];
    }
  });

  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingExpedientes, setIsLoadingExpedientes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar activeClient en localStorage
  const setActiveClient = useCallback((client: ClientRecord | null) => {
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      if (client) {
        window.localStorage.setItem(STORAGE_ACTIVE_CLIENT, JSON.stringify(client));
      } else {
        window.localStorage.removeItem(STORAGE_ACTIVE_CLIENT);
      }
    }
  }, []);

  // Cargar lista de clientes desde la API (con fallback de caché)
  const refreshClients = useCallback(async () => {
    setIsLoadingClients(true);
    setError(null);
    try {
      const token = await getToken();
      const list = await apiClient.clients.list({ tenant_id: tenantId }, token);
      setClients(list);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${STORAGE_CLIENTS_CACHE}_${tenantId}`, JSON.stringify(list));
      }

      // Si el cliente activo ya no existe en la lista o se actualizó, sincronizarlo
      if (activeClient) {
        const found = list.find((c) => c.id === activeClient.id);
        if (found) {
          setActiveClientState(found);
          window.localStorage.setItem(STORAGE_ACTIVE_CLIENT, JSON.stringify(found));
        }
      }
    } catch (err) {
      console.warn('[ExpedienteContext] Modo offline/fallback en refreshClients:', err);
      // Mantener caché local sin interrumpir la UX
    } finally {
      setIsLoadingClients(false);
    }
  }, [tenantId, getToken, activeClient]);

  // Cargar expedientes del cliente activo (o los últimos del tenant)
  const refreshExpedientes = useCallback(async () => {
    setIsLoadingExpedientes(true);
    try {
      const token = await getToken();
      const list = await apiClient.expedientes.list(
        {
          tenant_id: tenantId,
          client_id: activeClient?.id,
          limit: 100,
        },
        token
      );
      setExpedientes(list);
      if (typeof window !== 'undefined') {
        const cacheKey = activeClient
          ? `${STORAGE_EXPEDIENTES_CACHE}_${tenantId}_${activeClient.id}`
          : `${STORAGE_EXPEDIENTES_CACHE}_${tenantId}`;
        window.localStorage.setItem(cacheKey, JSON.stringify(list));
      }
    } catch (err) {
      console.warn('[ExpedienteContext] Modo offline/fallback en refreshExpedientes:', err);
    } finally {
      setIsLoadingExpedientes(false);
    }
  }, [tenantId, activeClient, getToken]);

  // Recargar al cambiar de tenant o de cliente activo
  useEffect(() => {
    void refreshClients();
  }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refreshExpedientes();
  }, [tenantId, activeClient?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Crear cliente
  const createClient = useCallback(
    async (input: CreateClientInput): Promise<ClientRecord> => {
      setError(null);
      try {
        const token = await getToken();
        let newClient: ClientRecord;

        try {
          newClient = await apiClient.clients.create(
            {
              ...input,
              tenant_id: tenantId,
            },
            token
          );
        } catch (apiErr) {
          console.warn('[ExpedienteContext] Error en API al crear cliente, creando localmente:', apiErr);
          // Fallback local cuando D1 no responde o no está disponible
          const fallbackId = `local_${crypto.randomUUID()}`;
          newClient = {
            id: fallbackId,
            tenant_id: tenantId,
            user_id: null,
            parent_id: input.parent_id || null,
            tipo: input.tipo || 'trabajador',
            nombre: input.nombre.trim(),
            rfc: input.rfc?.toUpperCase() || null,
            curp: input.curp?.toUpperCase() || null,
            nss: input.nss || null,
            salario_diario: input.salario_diario || 0,
            salario_diario_integrado: input.salario_diario_integrado || 0,
            fecha_ingreso: input.fecha_ingreso || null,
            factor_integracion: input.factor_integracion || 1.049315,
            estado: input.estado || 'activo',
            metadata: input.metadata || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        setClients((prev) => [newClient, ...prev]);
        setActiveClient(newClient);
        return newClient;
      } catch (err) {
        const msg = String(err);
        setError(msg);
        throw err;
      }
    },
    [tenantId, getToken, setActiveClient]
  );

  // Actualizar cliente
  const updateClient = useCallback(
    async (id: string, updates: Partial<ClientRecord>): Promise<ClientRecord> => {
      setError(null);
      try {
        const token = await getToken();
        let updated: ClientRecord;

        try {
          updated = await apiClient.clients.update(id, { ...updates, tenant_id: tenantId }, token);
        } catch {
          // Fallback local
          const existing = clients.find((c) => c.id === id);
          if (!existing) throw new Error('Cliente no encontrado');
          updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
        }

        setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
        if (activeClient?.id === id) {
          setActiveClient(updated);
        }
        return updated;
      } catch (err) {
        const msg = String(err);
        setError(msg);
        throw err;
      }
    },
    [tenantId, getToken, clients, activeClient, setActiveClient]
  );

  // Eliminar cliente
  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        const token = await getToken();
        try {
          await apiClient.clients.delete(id, tenantId, token);
        } catch (apiErr) {
          console.warn('[ExpedienteContext] Eliminando localmente:', apiErr);
        }

        setClients((prev) => prev.filter((c) => c.id !== id));
        if (activeClient?.id === id) {
          setActiveClient(null);
        }
      } catch (err) {
        const msg = String(err);
        setError(msg);
        throw err;
      }
    },
    [tenantId, getToken, activeClient, setActiveClient]
  );

  // Guardar cálculo en el expediente
  const saveCalculoExpediente = useCallback(
    async (
      toolId: string,
      titulo: string,
      inputs: Record<string, unknown>,
      outputs: Record<string, unknown>,
      force = false
    ): Promise<{ expediente: ExpedienteRecord; deduplicated?: boolean } | null> => {
      if (!activeClient) return null;

      try {
        const token = await getToken();
        const res = await apiClient.expedientes.save(
          {
            tenant_id: tenantId,
            client_id: activeClient.id,
            tool_id: toolId,
            titulo,
            inputs,
            outputs,
            force,
          },
          token
        );

        // Actualizar lista local de expedientes si no es duplicado o si es nuevo
        setExpedientes((prev) => {
          const exists = prev.some((e) => e.id === res.expediente.id);
          if (exists) {
            return prev.map((e) => (e.id === res.expediente.id ? res.expediente : e));
          }
          return [res.expediente, ...prev];
        });

        return res;
      } catch (err) {
        console.warn('[ExpedienteContext] Error al guardar expediente en remoto:', err);
        return null;
      }
    },
    [tenantId, activeClient, getToken]
  );

  // Mapear campos del cliente activo para pre-llenar las calculadoras
  const getPrefillForTool = useCallback(
    (toolId: string): Record<string, unknown> | null => {
      if (!activeClient) return null;

      switch (toolId) {
        case 'sbc':
          return {
            salarioDiario: activeClient.salario_diario > 0 ? activeClient.salario_diario : undefined,
            // Si el cliente tiene fecha de ingreso, calcular años para vacaciones sugeridas
            fechaIngreso: activeClient.fecha_ingreso || undefined,
          };

        case 'nomina':
          return {
            sueldoBruto:
              activeClient.salario_diario > 0
                ? Math.round(activeClient.salario_diario * 30 * 100) / 100
                : undefined,
            sbcDiario:
              activeClient.salario_diario_integrado > 0
                ? activeClient.salario_diario_integrado
                : undefined,
          };

        case 'finiquitos':
          return {
            salarioDiario: activeClient.salario_diario > 0 ? activeClient.salario_diario : undefined,
            sdi:
              activeClient.salario_diario_integrado > 0
                ? activeClient.salario_diario_integrado
                : undefined,
            fechaIngreso: activeClient.fecha_ingreso || undefined,
          };

        case 'isn':
          return {
            nombreEmpresa: activeClient.tipo === 'empresa' ? activeClient.nombre : undefined,
            rfc: activeClient.rfc || undefined,
            salarioBase: activeClient.salario_diario > 0 ? activeClient.salario_diario * 30 : undefined,
          };

        default:
          return null;
      }
    },
    [activeClient]
  );

  const value = useMemo<ExpedienteContextType>(
    () => ({
      activeClient,
      clients,
      expedientes,
      isLoadingClients,
      isLoadingExpedientes,
      error,
      tenantId,
      setActiveClient,
      createClient,
      updateClient,
      deleteClient,
      refreshClients,
      saveCalculoExpediente,
      refreshExpedientes,
      getPrefillForTool,
    }),
    [
      activeClient,
      clients,
      expedientes,
      isLoadingClients,
      isLoadingExpedientes,
      error,
      tenantId,
      setActiveClient,
      createClient,
      updateClient,
      deleteClient,
      refreshClients,
      saveCalculoExpediente,
      refreshExpedientes,
      getPrefillForTool,
    ]
  );

  return <ExpedienteContext.Provider value={value}>{children}</ExpedienteContext.Provider>;
}

const defaultExpedienteContext: ExpedienteContextType = {
  activeClient: null,
  clients: [],
  expedientes: [],
  isLoadingClients: false,
  isLoadingExpedientes: false,
  error: null,
  tenantId: 'default-tenant',
  setActiveClient: () => {},
  createClient: async () => ({
    id: 'fallback-client',
    tenant_id: 'default-tenant',
    user_id: null,
    parent_id: null,
    tipo: 'trabajador',
    nombre: '',
    rfc: null,
    curp: null,
    nss: null,
    salario_diario: 0,
    salario_diario_integrado: 0,
    fecha_ingreso: null,
    factor_integracion: 1.049315,
    estado: 'activo',
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  updateClient: async (_, updates) => updates as ClientRecord,
  deleteClient: async () => {},
  refreshClients: async () => {},
  saveCalculoExpediente: async () => null,
  refreshExpedientes: async () => {},
  getPrefillForTool: () => null,
};

export function useExpediente(): ExpedienteContextType {
  const context = useContext(ExpedienteContext);
  return context || defaultExpedienteContext;
}

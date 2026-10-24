/**
 * ARK LEDGER — Expediente Único Context (Sprint 9)
 *
 * Catálogo unificado de clientes y trabajadores con aislamiento multi-tenant:
 * - Selección centralizada de Cliente/Trabajador activo.
 * - Auto-hidratación (prefill) para SBC, Nómina, Finiquitos e ISN.
 * - Sellado y guardado de cálculos en el historial del expediente (D1 + SHA-256).
 * - Resiliencia offline con persistencia en localStorage.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import AuthContext from './AuthContext';
import {
  apiClient,
  ApiAuthorizationError,
  type ClientRecord,
  type ExpedienteRecord,
  type TipoCliente,
  type EstadoCliente,
} from '../lib/apiClient';
import {
  DEMO_EMPRESA,
  DEMO_TRABAJADOR,
  DEMO_EXPEDIENTE_EJEMPLO,
  DEMO_CLIENT_EMPRESA_ID,
  DEMO_CLIENT_TRABAJADOR_ID,
} from '@/data/demo-onboarding';

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

  // Demostración y Onboarding
  isDemoActive: boolean;
  loadDemoData: () => void;
  clearDemoData: () => void;

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

function clearTenantCache(tenantId: string): void {
  if (typeof window === 'undefined') return;
  const expedientePrefix = `${STORAGE_EXPEDIENTES_CACHE}_${tenantId}`;
  try {
    window.localStorage.removeItem(`${STORAGE_ACTIVE_CLIENT}_${tenantId}`);
    window.localStorage.removeItem(`${STORAGE_CLIENTS_CACHE}_${tenantId}`);
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(expedientePrefix)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('[ExpedienteContext] No se pudo limpiar la caché del tenant.', error);
  }
}

const ExpedienteContext = createContext<ExpedienteContextType | undefined>(undefined);

export function ExpedienteProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const authTenantId = auth?.tenantId;
  const tenantId = authTenantId || 'default-tenant';

  const [activeClient, setActiveClientState] = useState<ClientRecord | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [expedientes, setExpedientes] = useState<ExpedienteRecord[]>([]);

  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingExpedientes, setIsLoadingExpedientes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!auth?.isLoaded) return;
    if (!auth.isSignedIn || !authTenantId) {
      setActiveClientState(null);
      setClients([]);
      setExpedientes([]);
      return;
    }

    try {
      const activeKey = `${STORAGE_ACTIVE_CLIENT}_${tenantId}`;
      const storedClient = window.localStorage.getItem(activeKey);
      const parsedClient = storedClient ? (JSON.parse(storedClient) as ClientRecord) : null;
      const active = parsedClient?.tenant_id === tenantId ? parsedClient : null;
      setActiveClientState(active);

      const cachedClients = window.localStorage.getItem(`${STORAGE_CLIENTS_CACHE}_${tenantId}`);
      const parsedClients = cachedClients ? (JSON.parse(cachedClients) as ClientRecord[]) : [];
      setClients(
        Array.isArray(parsedClients) ? parsedClients.filter((c) => c.tenant_id === tenantId) : []
      );

      const expedienteKey = active
        ? `${STORAGE_EXPEDIENTES_CACHE}_${tenantId}_${active.id}`
        : `${STORAGE_EXPEDIENTES_CACHE}_${tenantId}`;
      const cachedExpedientes = window.localStorage.getItem(expedienteKey);
      const parsedExpedientes = cachedExpedientes
        ? (JSON.parse(cachedExpedientes) as ExpedienteRecord[])
        : [];
      setExpedientes(
        Array.isArray(parsedExpedientes)
          ? parsedExpedientes.filter((record) => record.tenant_id === tenantId)
          : []
      );
    } catch (err) {
      console.warn('[ExpedienteContext] No se pudo leer la caché local.', err);
      setActiveClientState(null);
      setClients([]);
      setExpedientes([]);
    }
  }, [auth?.isLoaded, auth?.isSignedIn, authTenantId, tenantId]);

  // Persistir el cliente activo dentro del tenant seleccionado.
  const setActiveClient = useCallback(
    (client: ClientRecord | null) => {
      const scopedClient = client?.tenant_id === tenantId ? client : null;
      setActiveClientState(scopedClient);
      if (typeof window !== 'undefined') {
        const key = `${STORAGE_ACTIVE_CLIENT}_${tenantId}`;
        if (scopedClient) {
          window.localStorage.setItem(key, JSON.stringify(scopedClient));
        } else {
          window.localStorage.removeItem(key);
        }
      }
    },
    [tenantId]
  );

  const refreshSession = auth?.refreshSession;
  const handleAuthorizationError = useCallback(
    (error: unknown) => {
      if (!(error instanceof ApiAuthorizationError)) return;
      setClients([]);
      setExpedientes([]);
      setActiveClient(null);
      clearTenantCache(tenantId);
      void refreshSession?.().catch((refreshError: unknown) => {
        console.error('[ExpedienteContext] No se pudo renovar la sesión.', refreshError);
      });
    },
    [refreshSession, setActiveClient, tenantId]
  );

  // Cargar lista de clientes desde la API.
  const refreshClients = useCallback(async () => {
    if (!auth?.isLoaded || !auth.isSignedIn || !authTenantId) return;
    setIsLoadingClients(true);
    setError(null);
    try {
      const list = await apiClient.clients.list({ tenant_id: tenantId });
      setClients((prev) => {
        const demoClients = prev.filter(
          (c) =>
            c.metadata?.is_demo ||
            c.id === DEMO_CLIENT_EMPRESA_ID ||
            c.id === DEMO_CLIENT_TRABAJADOR_ID
        );
        return [...demoClients, ...list.filter((c) => !demoClients.some((d) => d.id === c.id))];
      });
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${STORAGE_CLIENTS_CACHE}_${tenantId}`, JSON.stringify(list));
      }

      // Si el cliente activo es demo, conservarlo; si es de API y ya no existe, limpiarlo
      if (
        activeClient &&
        !activeClient.metadata?.is_demo &&
        activeClient.id !== DEMO_CLIENT_EMPRESA_ID &&
        activeClient.id !== DEMO_CLIENT_TRABAJADOR_ID
      ) {
        const found = list.find((c) => c.id === activeClient.id);
        if (found) {
          setActiveClientState(found);
          window.localStorage.setItem(
            `${STORAGE_ACTIVE_CLIENT}_${tenantId}`,
            JSON.stringify(found)
          );
        } else {
          setActiveClient(null);
        }
      }
    } catch (err) {
      console.error('[ExpedienteContext] No se pudieron actualizar los clientes.', err);
      handleAuthorizationError(err);
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar los clientes.');
    } finally {
      setIsLoadingClients(false);
    }
  }, [
    auth?.isLoaded,
    auth?.isSignedIn,
    authTenantId,
    tenantId,
    activeClient,
    setActiveClient,
    handleAuthorizationError,
  ]);

  // Cargar expedientes del cliente activo (o los últimos del tenant)
  const refreshExpedientes = useCallback(async () => {
    if (!auth?.isLoaded || !auth.isSignedIn || !authTenantId) return;
    setIsLoadingExpedientes(true);
    setError(null);
    try {
      const list = await apiClient.expedientes.list({
        tenant_id: tenantId,
        client_id: activeClient?.id,
        limit: 100,
      });
      setExpedientes(list);
      if (typeof window !== 'undefined') {
        const cacheKey = activeClient
          ? `${STORAGE_EXPEDIENTES_CACHE}_${tenantId}_${activeClient.id}`
          : `${STORAGE_EXPEDIENTES_CACHE}_${tenantId}`;
        window.localStorage.setItem(cacheKey, JSON.stringify(list));
      }
    } catch (err) {
      console.error('[ExpedienteContext] No se pudieron actualizar los expedientes.', err);
      handleAuthorizationError(err);
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar los expedientes.');
    } finally {
      setIsLoadingExpedientes(false);
    }
  }, [
    auth?.isLoaded,
    auth?.isSignedIn,
    authTenantId,
    tenantId,
    activeClient,
    handleAuthorizationError,
  ]);

  // Recargar al cambiar de tenant o de cliente activo
  useEffect(() => {
    void refreshClients();
  }, [refreshClients]);

  useEffect(() => {
    void refreshExpedientes();
  }, [refreshExpedientes]);

  // Crear cliente
  const createClient = useCallback(
    async (input: CreateClientInput): Promise<ClientRecord> => {
      setError(null);
      try {
        const newClient = await apiClient.clients.create({
          ...input,
          tenant_id: tenantId,
        });
        setClients((prev) => [newClient, ...prev]);
        setActiveClient(newClient);
        return newClient;
      } catch (err) {
        const msg = String(err);
        handleAuthorizationError(err);
        setError(msg);
        throw err;
      }
    },
    [tenantId, setActiveClient, handleAuthorizationError]
  );

  // Actualizar cliente
  const updateClient = useCallback(
    async (id: string, updates: Partial<ClientRecord>): Promise<ClientRecord> => {
      setError(null);
      try {
        const updated = await apiClient.clients.update(id, { ...updates, tenant_id: tenantId });
        setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
        if (activeClient?.id === id) {
          setActiveClient(updated);
        }
        return updated;
      } catch (err) {
        const msg = String(err);
        handleAuthorizationError(err);
        setError(msg);
        throw err;
      }
    },
    [tenantId, activeClient, setActiveClient, handleAuthorizationError]
  );

  // Eliminar cliente
  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      setError(null);
      try {
        await apiClient.clients.delete(id, tenantId);
        setClients((prev) => prev.filter((c) => c.id !== id));
        if (activeClient?.id === id) {
          setActiveClient(null);
        }
      } catch (err) {
        const msg = String(err);
        handleAuthorizationError(err);
        setError(msg);
        throw err;
      }
    },
    [tenantId, activeClient, setActiveClient, handleAuthorizationError]
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

      // Si es un cliente demo en modo sandbox, generar SHA-256 localmente de forma criptográfica y transparente
      if (
        activeClient.metadata?.is_demo ||
        activeClient.id === DEMO_CLIENT_TRABAJADOR_ID ||
        activeClient.id === DEMO_CLIENT_EMPRESA_ID
      ) {
        const canonicalPayload = JSON.stringify({
          tenant_id: tenantId,
          client_id: activeClient.id,
          tool_id: toolId,
          titulo,
          inputs,
          outputs,
          timestamp: Date.now(),
        });
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalPayload));
        const hashSha256 = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const demoRecord: ExpedienteRecord = {
          id: `exp-demo-${Date.now()}`,
          tenant_id: tenantId,
          client_id: activeClient.id,
          tool_id: toolId,
          titulo,
          input_hash: hashSha256,
          inputs,
          outputs,
          catalog_version: 'DOF-2026-OFICIAL',
          created_by: auth?.user?.id || 'demo-user',
          created_at: new Date().toISOString(),
        };

        setExpedientes((prev) => [demoRecord, ...prev]);
        return { expediente: demoRecord, deduplicated: false };
      }

      try {
        const res = await apiClient.expedientes.save({
          tenant_id: tenantId,
          client_id: activeClient.id,
          tool_id: toolId,
          titulo,
          inputs,
          outputs,
          force,
        });

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
        handleAuthorizationError(err);
        setError(err instanceof Error ? err.message : 'No se pudo guardar el expediente.');
        throw err;
      }
    },
    [tenantId, activeClient, auth?.user?.id, handleAuthorizationError]
  );

  const loadDemoData = useCallback(() => {
    const demoEmpresa = { ...DEMO_EMPRESA, tenant_id: tenantId };
    const demoTrabajador = { ...DEMO_TRABAJADOR, tenant_id: tenantId };
    const demoExpediente = { ...DEMO_EXPEDIENTE_EJEMPLO, tenant_id: tenantId };

    setClients((prev) => {
      const withoutDemo = prev.filter(
        (c) =>
          !c.metadata?.is_demo &&
          c.id !== DEMO_CLIENT_EMPRESA_ID &&
          c.id !== DEMO_CLIENT_TRABAJADOR_ID
      );
      return [demoEmpresa, demoTrabajador, ...withoutDemo];
    });
    setActiveClientState(demoTrabajador);
    setExpedientes((prev) => [demoExpediente, ...prev.filter((e) => e.id !== demoExpediente.id)]);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        `${STORAGE_ACTIVE_CLIENT}_${tenantId}`,
        JSON.stringify(demoTrabajador)
      );
    }
  }, [tenantId]);

  const clearDemoData = useCallback(() => {
    setClients((prev) =>
      prev.filter(
        (c) =>
          !c.metadata?.is_demo &&
          c.id !== DEMO_CLIENT_EMPRESA_ID &&
          c.id !== DEMO_CLIENT_TRABAJADOR_ID
      )
    );
    setActiveClientState((prev) => {
      if (
        prev?.metadata?.is_demo ||
        prev?.id === DEMO_CLIENT_TRABAJADOR_ID ||
        prev?.id === DEMO_CLIENT_EMPRESA_ID
      ) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(`${STORAGE_ACTIVE_CLIENT}_${tenantId}`);
        }
        return null;
      }
      return prev;
    });
    setExpedientes((prev) => prev.filter((e) => e.id !== DEMO_EXPEDIENTE_EJEMPLO.id));
  }, [tenantId]);

  const isDemoActive = useMemo(
    () =>
      Boolean(
        activeClient?.metadata?.is_demo ||
        activeClient?.id === DEMO_CLIENT_TRABAJADOR_ID ||
        activeClient?.id === DEMO_CLIENT_EMPRESA_ID ||
        clients.some(
          (c) =>
            c.metadata?.is_demo ||
            c.id === DEMO_CLIENT_TRABAJADOR_ID ||
            c.id === DEMO_CLIENT_EMPRESA_ID
        )
      ),
    [activeClient, clients]
  );

  // Mapear campos del cliente activo para pre-llenar las calculadoras
  const getPrefillForTool = useCallback(
    (toolId: string): Record<string, unknown> | null => {
      if (!activeClient) return null;

      switch (toolId) {
        case 'sbc':
          return {
            salarioDiario:
              activeClient.salario_diario > 0 ? activeClient.salario_diario : undefined,
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
            salarioDiario:
              activeClient.salario_diario > 0 ? activeClient.salario_diario : undefined,
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
            salarioBase:
              activeClient.salario_diario > 0 ? activeClient.salario_diario * 30 : undefined,
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
      isDemoActive,
      loadDemoData,
      clearDemoData,
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
      isDemoActive,
      loadDemoData,
      clearDemoData,
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
  isDemoActive: false,
  loadDemoData: () => {},
  clearDemoData: () => {},
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

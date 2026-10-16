/**
 * ARK TOOLS — Frontend API Client (Multi-Tenant)
 *
 * Cliente tipado para interactuar con los endpoints de D1 en el Cloudflare Worker.
 * Soporta autenticación de sesión nativa y aislamiento por tenant_id.
 */

export interface GuiaStepProgress {
  step_id: number;
  user_id: string;
  checklist_state: string; // JSON
  draft_text: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: number;
  tenant_id: string;
  user_id: string;
  caso_id: string;
  conducta_id: string;
  estado: 'BLOQUEADO' | 'PERMITIDO';
  hash_sha256: string;
  prev_hash: string;
  timestamp: string;
}

export interface WatchlistEntry {
  conducta_id: number;
  user_id: string;
  notes: string;
  created_at: string;
}

export type TipoCliente = 'empresa' | 'trabajador' | 'persona_fisica';
export type EstadoCliente = 'activo' | 'inactivo' | 'archivado';

export interface ClientRecord {
  id: string;
  tenant_id: string;
  user_id: string | null;
  parent_id: string | null;
  tipo: TipoCliente;
  nombre: string;
  rfc: string | null;
  curp: string | null;
  nss: string | null;
  salario_diario: number;
  salario_diario_integrado: number;
  fecha_ingreso: string | null;
  factor_integracion: number;
  estado: EstadoCliente;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ExpedienteRecord {
  id: string;
  client_id: string;
  tenant_id: string;
  tool_id: string;
  titulo: string | null;
  input_hash: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  catalog_version: string;
  created_by: string | null;
  created_at: string;
}

export interface CertificadoVerificacion {
  input_hash: string;
  tool_id: string;
  titulo: string | null;
  catalog_version: string;
  created_at: string;
  despacho: string;
  cliente: {
    nombre: string;
    rfc: string | null;
    tipo: string;
  };
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

function getHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const apiClient = {
  // ─────────────────────────────────────────────────────────────────
  // 0. AUTH SYNC (USUARIO Y TENANT)
  // ─────────────────────────────────────────────────────────────────
  auth: {
    async sync(
      payload: {
        user_id: string;
        email: string;
        full_name?: string | null;
        tenant_id?: string | null;
        tenant_name?: string | null;
        tenant_slug?: string | null;
      },
      token?: string | null
    ): Promise<{ success: boolean }> {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || 'Error al sincronizar sesión');
      }
      return (await res.json()) as { success: boolean };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 1. GUÍA SAT / IMSS
  // ─────────────────────────────────────────────────────────────────
  guia: {
    async getProgress(tenantId: string, token?: string | null): Promise<GuiaStepProgress[]> {
      const res = await fetch(`/api/guia/progress?tenant_id=${encodeURIComponent(tenantId)}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) {
        throw new Error(`Error al consultar progreso: ${res.statusText}`);
      }
      const data = (await res.json()) as { progress?: GuiaStepProgress[] };
      return data.progress || [];
    },

    async saveStep(
      payload: {
        tenant_id: string;
        user_id: string;
        step_id: number;
        checklist_state: Record<string, boolean> | string;
        draft_text?: string;
      },
      token?: string | null
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch('/api/guia/progress', {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || `Error al guardar paso ${payload.step_id}`);
      }
      return (await res.json()) as { success: boolean; message: string };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 2. ARKANGEL LEDGER
  // ─────────────────────────────────────────────────────────────────
  ledger: {
    async getEntries(
      tenantId: string,
      casoId?: string,
      token?: string | null
    ): Promise<LedgerEntry[]> {
      let url = `/api/ledger?tenant_id=${encodeURIComponent(tenantId)}`;
      if (casoId) {
        url += `&caso_id=${encodeURIComponent(casoId)}`;
      }
      const res = await fetch(url, {
        headers: getHeaders(token),
      });
      if (!res.ok) {
        throw new Error(`Error al consultar ledger: ${res.statusText}`);
      }
      const data = (await res.json()) as { entries?: LedgerEntry[] };
      return data.entries || [];
    },

    async addEntry(
      payload: {
        tenant_id: string;
        user_id: string;
        caso_id: string;
        conducta_id: string;
        estado: 'BLOQUEADO' | 'PERMITIDO';
      },
      token?: string | null
    ): Promise<{ success: boolean; id: number; hash_sha256: string; prev_hash: string; timestamp: string }> {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || 'Error al registrar dictamen en ledger');
      }
      return (await res.json()) as {
        success: boolean;
        id: number;
        hash_sha256: string;
        prev_hash: string;
        timestamp: string;
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 3. ACTIVOS VIRTUALES WATCHLIST
  // ─────────────────────────────────────────────────────────────────
  activos: {
    async getWatchlist(tenantId: string, token?: string | null): Promise<WatchlistEntry[]> {
      const res = await fetch(`/api/activos/watchlist?tenant_id=${encodeURIComponent(tenantId)}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) {
        throw new Error(`Error al consultar watchlist: ${res.statusText}`);
      }
      const data = (await res.json()) as { watchlist?: WatchlistEntry[] };
      return data.watchlist || [];
    },

    async saveConducta(
      payload: {
        tenant_id: string;
        user_id: string;
        conducta_id: number;
        notes?: string;
      },
      token?: string | null
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch('/api/activos/watchlist', {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || 'Error al guardar conducta en watchlist');
      }
      return (await res.json()) as { success: boolean; message: string };
    },

    async removeConducta(
      tenantId: string,
      conductaId: number,
      token?: string | null
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch(
        `/api/activos/watchlist?tenant_id=${encodeURIComponent(tenantId)}&conducta_id=${conductaId}`,
        {
          method: 'DELETE',
          headers: getHeaders(token),
        }
      );
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || 'Error al eliminar conducta');
      }
      return (await res.json()) as { success: boolean; message: string };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 4. WORKERS AI (CHAT & TOOL-CALLING)
  // ─────────────────────────────────────────────────────────────────
  ai: {
    async getStatus(): Promise<{ status: string; binding_ai: boolean; binding_d1: boolean; default_model: string }> {
      const res = await fetch('/api/ai/status');
      return (await res.json()) as { status: string; binding_ai: boolean; binding_d1: boolean; default_model: string };
    },

    async chat(
      payload: {
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        tenant_id?: string;
        model?: string;
      },
      token?: string | null
    ): Promise<{
      model: string;
      tenant_id: string;
      tools_executed?: string[];
      result: string;
    }> {
      const headers = getHeaders(token) as Record<string, string>;
      if (payload.tenant_id) {
        headers['x-tenant-id'] = payload.tenant_id;
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.message || error.error || 'Error al comunicarse con Workers AI');
      }

      return (await res.json()) as {
        model: string;
        tenant_id: string;
        tools_executed?: string[];
        result: string;
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 5. EXPEDIENTE ÚNICO: CLIENTES (SPRINT 9)
  // ─────────────────────────────────────────────────────────────────
  clients: {
    async list(
      params: { tenant_id: string; q?: string; tipo?: string; estado?: string },
      token?: string | null
    ): Promise<ClientRecord[]> {
      const q = new URLSearchParams();
      q.set('tenant_id', params.tenant_id);
      if (params.q) q.set('q', params.q);
      if (params.tipo) q.set('tipo', params.tipo);
      if (params.estado) q.set('estado', params.estado);

      const res = await fetch(`/api/clients?${q.toString()}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al listar clientes');
      }
      const data = (await res.json()) as { clients?: ClientRecord[] };
      return data.clients || [];
    },

    async get(id: string, tenantId: string, token?: string | null): Promise<ClientRecord> {
      const res = await fetch(`/api/clients/${encodeURIComponent(id)}?tenant_id=${encodeURIComponent(tenantId)}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al obtener cliente');
      }
      const data = (await res.json()) as { client: ClientRecord };
      return data.client;
    },

    async create(
      payload: Partial<ClientRecord> & {
        tenant_id: string;
        nombre: string;
      },
      token?: string | null
    ): Promise<ClientRecord> {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al crear cliente');
      }
      const data = (await res.json()) as { client: ClientRecord };
      return data.client;
    },

    async update(
      id: string,
      payload: Partial<ClientRecord> & { tenant_id: string },
      token?: string | null
    ): Promise<ClientRecord> {
      const res = await fetch(`/api/clients/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al actualizar cliente');
      }
      const data = (await res.json()) as { client: ClientRecord };
      return data.client;
    },

    async delete(
      id: string,
      tenantId: string,
      token?: string | null
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/clients/${encodeURIComponent(id)}?tenant_id=${encodeURIComponent(tenantId)}`, {
        method: 'DELETE',
        headers: getHeaders(token),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al eliminar cliente');
      }
      return (await res.json()) as { success: boolean; message: string };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // 6. EXPEDIENTE ÚNICO: EXPEDIENTES / HISTORIAL DE CÁLCULOS (SPRINT 9)
  // ─────────────────────────────────────────────────────────────────
  expedientes: {
    async list(
      params: { tenant_id: string; client_id?: string; tool_id?: string; limit?: number; offset?: number },
      token?: string | null
    ): Promise<ExpedienteRecord[]> {
      const q = new URLSearchParams();
      q.set('tenant_id', params.tenant_id);
      if (params.client_id) q.set('client_id', params.client_id);
      if (params.tool_id) q.set('tool_id', params.tool_id);
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));

      const res = await fetch(`/api/expedientes?${q.toString()}`, {
        headers: getHeaders(token),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al listar expedientes');
      }
      const data = (await res.json()) as { expedientes?: ExpedienteRecord[] };
      return data.expedientes || [];
    },

    async get(id: string, tenantId: string, token?: string | null): Promise<ExpedienteRecord> {
      const res = await fetch(
        `/api/expedientes/${encodeURIComponent(id)}?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          headers: getHeaders(token),
        }
      );
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al obtener expediente');
      }
      const data = (await res.json()) as { expediente: ExpedienteRecord };
      return data.expediente;
    },

    async save(
      payload: {
        tenant_id: string;
        client_id: string;
        tool_id: string;
        titulo?: string;
        inputs: Record<string, unknown>;
        outputs: Record<string, unknown>;
        catalog_version?: string;
        created_by?: string | null;
        force?: boolean;
      },
      token?: string | null
    ): Promise<{ expediente: ExpedienteRecord; deduplicated?: boolean }> {
      const res = await fetch('/api/expedientes', {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al guardar expediente');
      }
      return (await res.json()) as { expediente: ExpedienteRecord; deduplicated?: boolean };
    },

    async delete(
      id: string,
      tenantId: string,
      token?: string | null
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch(
        `/api/expedientes/${encodeURIComponent(id)}?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          method: 'DELETE',
          headers: getHeaders(token),
        }
      );
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al eliminar expediente');
      }
      return (await res.json()) as { success: boolean; message: string };
    },

    async verify(
      hash: string
    ): Promise<{ verified: boolean; certificado?: CertificadoVerificacion; message?: string }> {
      const res = await fetch(`/api/expedientes/verify?hash=${encodeURIComponent(hash)}`);
      return (await res.json()) as { verified: boolean; certificado?: CertificadoVerificacion; message?: string };
    },
  },
};

export default apiClient;

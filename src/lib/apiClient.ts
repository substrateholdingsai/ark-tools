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
};

export default apiClient;

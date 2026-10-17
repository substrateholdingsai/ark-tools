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
}

export interface AdminOverview {
  counts: {
    totalUsers: number;
    verifiedUsers: number;
    totalTenants: number;
    totalClients: number;
    totalExpedientes: number;
    totalLedgerEntries: number;
  };
  recentUsers: Array<{
    id: string;
    email: string;
    full_name: string | null;
    platform_role: string;
    created_at: string;
    email_verified_at: number | null;
  }>;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    created_at: string;
    member_count: number;
  }>;
  systemHealth: {
    database: string;
    aiWorkers: boolean;
    resendEmail: boolean;
    clipPayments: boolean;
    environment: string;
    appVersion: string;
    timestamp: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  platform_role: 'user' | 'super_admin';
  created_at: string;
  email_verified_at: number | null;
  tenants: Array<{ id: string; name: string; role: string }>;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  member_count: number;
  client_count: number;
  expediente_count: number;
}

export interface TenantMember {
  userId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
}

export interface TenantPendingInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: number;
  expiresAt: number;
  invitedByEmail: string;
  invitedByName: string;
}

export interface TenantMembersResponse {
  tenantId: string;
  currentUserRole: 'owner' | 'admin' | 'member';
  members: TenantMember[];
  invitations: TenantPendingInvitation[];
}

export interface InvitationInfoResponse {
  valid: boolean;
  error?: string;
  invitation?: {
    id: string;
    email: string;
    tenantName: string;
    role: 'admin' | 'member';
    inviterName: string;
    expiresAt: number;
  };
  userExists?: boolean;
}

export interface AlegraAccount {
  tenant_id: string;
  alegra_account_id: string;
  alegra_email: string;
  alegra_company_name: string | null;
  alegra_company_id: string | null;
  alegra_rfc: string | null;
  csd_configured: boolean;
  is_default: boolean;
  status: 'active' | 'revoked' | 'error';
  last_checked_at: number | null;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

export interface AlegraInvoiceRecord {
  id: string;
  tenant_id: string;
  alegra_account_id: string;
  alegra_invoice_id: string | null;
  client_id: string | null;
  uuid: string | null;
  folio: string | null;
  customer_name: string;
  customer_rfc: string;
  total: number;
  currency: string;
  status: 'open' | 'paid' | 'void' | 'draft';
  pdf_url: string | null;
  xml_url: string | null;
  created_by: string | null;
  created_at: number;
}

export interface AlegraInvoiceInputPayload {
  date: string;
  dueDate?: string;
  client: {
    name: string;
    identification: string;
    email?: string;
    cfdiUse?: string;
    regime?: string;
    address?: {
      zipCode: string;
      street?: string;
      exteriorNumber?: string;
      city?: string;
      state?: string;
    };
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
    productKey?: string;
    unit?: string;
    tax?: Array<{
      percentage: number;
      name?: string;
    }>;
  }>;
  paymentMethod?: 'PUE' | 'PPD';
  paymentForm?: string;
  observations?: string;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: 'owner' | 'admin' | 'member';
  }>;
  platformRole: 'user' | 'super_admin';
}

async function authRequest<T>(path: string, payload?: unknown, method = 'POST'): Promise<T> {
  const res = await apiFetch(path, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorResponse;
  if (!res.ok) {
    throw new Error(data.error || 'No se pudo completar la solicitud de autenticación.');
  }
  return data;
}

export class ApiAuthorizationError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403
  ) {
    super(message);
    this.name = 'ApiAuthorizationError';
  }
}

async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(input, { ...init, credentials: 'same-origin' });
  if (response.status === 401 || response.status === 403) {
    const data = (await response
      .clone()
      .json()
      .catch(() => ({}))) as ApiErrorResponse;
    throw new ApiAuthorizationError(
      data.error || 'No tienes autorización para esta operación.',
      response.status
    );
  }
  return response;
}

function getHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export const apiClient = {
  // ─────────────────────────────────────────────────────────────────
  // 0. AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────
  auth: {
    register: (payload: { email: string; fullName?: string; tenantName?: string }) =>
      authRequest<{ success: boolean; message: string }>('/api/auth/register', payload),
    login: (payload: { email: string; password: string }) =>
      authRequest<AuthSession>('/api/auth/login', payload),
    verifyEmail: (token: string, password: string) =>
      authRequest<AuthSession>('/api/auth/verify-email', { token, password }),
    requestPasswordReset: (email: string) =>
      authRequest<{ success: boolean; message: string }>('/api/auth/request-password-reset', {
        email,
      }),
    resetPassword: (token: string, password: string) =>
      authRequest<{ success: boolean; message: string }>('/api/auth/reset-password', {
        token,
        password,
      }),
    session: async (): Promise<AuthSession | null> => {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.status === 401) return null;
      const data = (await res.json().catch(() => ({}))) as AuthSession & ApiErrorResponse;
      if (!res.ok) throw new Error(data.error || 'No se pudo validar la sesión.');
      return data;
    },
    logout: () => authRequest<{ success: boolean }>('/api/auth/logout'),
    createTenant: (name: string) =>
      authRequest<{
        success: boolean;
        tenant: AuthSession['tenants'][number];
      }>('/api/auth/tenants', { name }),
  },

  // ─────────────────────────────────────────────────────────────────
  // 1. GUÍA SAT / IMSS
  // ─────────────────────────────────────────────────────────────────
  guia: {
    async getProgress(tenantId: string): Promise<GuiaStepProgress[]> {
      const res = await apiFetch(`/api/guia/progress?tenant_id=${encodeURIComponent(tenantId)}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Error al consultar progreso: ${res.statusText}`);
      }
      const data = (await res.json()) as { progress?: GuiaStepProgress[] };
      return data.progress || [];
    },

    async saveStep(payload: {
      tenant_id: string;
      step_id: number;
      checklist_state: Record<string, boolean> | string;
      draft_text?: string;
    }): Promise<{ success: boolean; message: string }> {
      const res = await apiFetch('/api/guia/progress', {
        method: 'POST',
        headers: getHeaders(),
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
    async getEntries(tenantId: string, casoId?: string): Promise<LedgerEntry[]> {
      let url = `/api/ledger?tenant_id=${encodeURIComponent(tenantId)}`;
      if (casoId) {
        url += `&caso_id=${encodeURIComponent(casoId)}`;
      }
      const res = await apiFetch(url, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Error al consultar ledger: ${res.statusText}`);
      }
      const data = (await res.json()) as { entries?: LedgerEntry[] };
      return data.entries || [];
    },

    async addEntry(payload: {
      tenant_id: string;
      caso_id: string;
      conducta_id: string;
      estado: 'BLOQUEADO' | 'PERMITIDO';
    }): Promise<{
      success: boolean;
      id: number;
      hash_sha256: string;
      prev_hash: string;
      timestamp: string;
    }> {
      const res = await apiFetch('/api/ledger', {
        method: 'POST',
        headers: getHeaders(),
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
    async getWatchlist(tenantId: string): Promise<WatchlistEntry[]> {
      const res = await apiFetch(
        `/api/activos/watchlist?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          headers: getHeaders(),
        }
      );
      if (!res.ok) {
        throw new Error(`Error al consultar watchlist: ${res.statusText}`);
      }
      const data = (await res.json()) as { watchlist?: WatchlistEntry[] };
      return data.watchlist || [];
    },

    async saveConducta(payload: {
      tenant_id: string;
      conducta_id: number;
      notes?: string;
    }): Promise<{ success: boolean; message: string }> {
      const res = await apiFetch('/api/activos/watchlist', {
        method: 'POST',
        headers: getHeaders(),
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
      conductaId: number
    ): Promise<{ success: boolean; message: string }> {
      const res = await apiFetch(
        `/api/activos/watchlist?tenant_id=${encodeURIComponent(tenantId)}&conducta_id=${conductaId}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
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
    async getStatus(): Promise<{
      status: string;
      binding_ai: boolean;
      binding_d1: boolean;
      default_model: string;
    }> {
      const res = await apiFetch('/api/ai/status');
      return (await res.json()) as {
        status: string;
        binding_ai: boolean;
        binding_d1: boolean;
        default_model: string;
      };
    },

    async chat(payload: {
      messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
      tenant_id?: string;
      model?: string;
    }): Promise<{
      model: string;
      tenant_id: string;
      tools_executed?: string[];
      result: string;
    }> {
      const headers = getHeaders() as Record<string, string>;
      if (payload.tenant_id) {
        headers['x-tenant-id'] = payload.tenant_id;
      }

      const res = await apiFetch('/api/ai/chat', {
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
    async list(params: {
      tenant_id: string;
      q?: string;
      tipo?: string;
      estado?: string;
    }): Promise<ClientRecord[]> {
      const q = new URLSearchParams();
      q.set('tenant_id', params.tenant_id);
      if (params.q) q.set('q', params.q);
      if (params.tipo) q.set('tipo', params.tipo);
      if (params.estado) q.set('estado', params.estado);

      const res = await apiFetch(`/api/clients?${q.toString()}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al listar clientes');
      }
      const data = (await res.json()) as { clients?: ClientRecord[] };
      return data.clients || [];
    },

    async get(id: string, tenantId: string): Promise<ClientRecord> {
      const params = new URLSearchParams({ tenant_id: tenantId, id });
      const res = await apiFetch(`/api/clients?${params.toString()}`, { headers: getHeaders() });
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
      }
    ): Promise<ClientRecord> {
      const res = await apiFetch('/api/clients', {
        method: 'POST',
        headers: getHeaders(),
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
      payload: Partial<ClientRecord> & { tenant_id: string }
    ): Promise<ClientRecord> {
      const res = await apiFetch('/api/clients', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ ...payload, id }),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al actualizar cliente');
      }
      const data = (await res.json()) as { client: ClientRecord };
      return data.client;
    },

    async delete(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
      const params = new URLSearchParams({ tenant_id: tenantId, id });
      const res = await apiFetch(`/api/clients?${params.toString()}`, {
        method: 'DELETE',
        headers: getHeaders(),
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
    async list(params: {
      tenant_id: string;
      client_id?: string;
      id?: string;
      tool_id?: string;
      limit?: number;
      offset?: number;
    }): Promise<ExpedienteRecord[]> {
      const q = new URLSearchParams();
      q.set('tenant_id', params.tenant_id);
      if (params.client_id) q.set('client_id', params.client_id);
      if (params.id) q.set('id', params.id);
      if (params.tool_id) q.set('tool_id', params.tool_id);
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));

      const res = await apiFetch(`/api/expedientes?${q.toString()}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al listar expedientes');
      }
      const data = (await res.json()) as { expedientes?: ExpedienteRecord[] };
      return data.expedientes || [];
    },

    async get(id: string, tenantId: string): Promise<ExpedienteRecord> {
      const [expediente] = await apiClient.expedientes.list({ tenant_id: tenantId, id, limit: 1 });
      if (!expediente) throw new Error('Expediente no encontrado.');
      return expediente;
    },

    async save(payload: {
      tenant_id: string;
      client_id: string;
      tool_id: string;
      titulo?: string;
      inputs: Record<string, unknown>;
      outputs: Record<string, unknown>;
      catalog_version?: string;
      force?: boolean;
    }): Promise<{ expediente: ExpedienteRecord; deduplicated?: boolean }> {
      const res = await apiFetch('/api/expedientes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al guardar expediente');
      }
      return (await res.json()) as { expediente: ExpedienteRecord; deduplicated?: boolean };
    },

    async delete(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
      const params = new URLSearchParams({ tenant_id: tenantId, id });
      const res = await apiFetch(`/api/expedientes?${params.toString()}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al eliminar expediente');
      }
      return (await res.json()) as { success: boolean; message: string };
    },

    async verify(
      hash: string
    ): Promise<{ verified: boolean; certificado?: CertificadoVerificacion; message?: string }> {
      const res = await apiFetch(`/api/expedientes/verify?hash=${encodeURIComponent(hash)}`);
      return (await res.json()) as {
        verified: boolean;
        certificado?: CertificadoVerificacion;
        message?: string;
      };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // SUPER ADMIN API
  // ─────────────────────────────────────────────────────────────────
  admin: {
    async getOverview(): Promise<AdminOverview> {
      const res = await apiFetch('/api/admin/overview');
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al obtener métricas');
      }
      return (await res.json()) as AdminOverview;
    },

    async getUsers(): Promise<AdminUser[]> {
      const res = await apiFetch('/api/admin/users');
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al obtener usuarios');
      }
      const data = (await res.json()) as { users: AdminUser[] };
      return data.users;
    },

    async getTenants(): Promise<AdminTenant[]> {
      const res = await apiFetch('/api/admin/tenants');
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al obtener despachos');
      }
      const data = (await res.json()) as { tenants: AdminTenant[] };
      return data.tenants;
    },

    async updateUserRole(
      userId: string,
      role: 'user' | 'super_admin'
    ): Promise<{ success: boolean; message: string }> {
      const res = await apiFetch('/api/admin/users/role', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al actualizar rol');
      }
      return (await res.json()) as { success: boolean; message: string };
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // INVITACIONES Y GESTIÓN DE EQUIPO
  // ─────────────────────────────────────────────────────────────────
  teams: {
    async getMembers(tenantId: string): Promise<TenantMembersResponse> {
      const res = await apiFetch(`/api/tenants/${tenantId}/members`);
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al obtener miembros del despacho');
      }
      return (await res.json()) as TenantMembersResponse;
    },

    async inviteMember(
      tenantId: string,
      email: string,
      role: 'admin' | 'member' = 'member'
    ): Promise<{
      success: boolean;
      message: string;
      invitation: { id: string; email: string; role: string; expiresAt: number };
    }> {
      const res = await apiFetch(`/api/tenants/${tenantId}/invitations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al enviar invitación');
      }
      return (await res.json()) as {
        success: boolean;
        message: string;
        invitation: { id: string; email: string; role: string; expiresAt: number };
      };
    },

    async revokeInvitation(
      tenantId: string,
      invitationId: string
    ): Promise<{ success: boolean; message: string }> {
      const res = await apiFetch(`/api/tenants/${tenantId}/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al revocar invitación');
      }
      return (await res.json()) as { success: boolean; message: string };
    },

    async removeMember(
      tenantId: string,
      userId: string
    ): Promise<{ success: boolean; message: string }> {
      const res = await apiFetch(`/api/tenants/${tenantId}/members/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al remover miembro');
      }
      return (await res.json()) as { success: boolean; message: string };
    },

    async updateMemberRole(
      tenantId: string,
      userId: string,
      role: 'admin' | 'member'
    ): Promise<{ success: boolean; message: string; role: string }> {
      const res = await apiFetch(`/api/tenants/${tenantId}/members/${userId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al actualizar rol');
      }
      return (await res.json()) as { success: boolean; message: string; role: string };
    },

    async getInvitationInfo(token: string): Promise<InvitationInfoResponse> {
      const res = await apiFetch(`/api/invitations/info?token=${encodeURIComponent(token)}`);
      return (await res.json()) as InvitationInfoResponse;
    },

    async acceptInvitation(params: {
      token: string;
      password?: string;
      fullName?: string;
    }): Promise<{ success: boolean; message: string; session: AuthSession }> {
      const res = await apiFetch('/api/invitations/accept', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al aceptar invitación');
      }
      return (await res.json()) as { success: boolean; message: string; session: AuthSession };
    },
  },

  alegra: {
    async getAccounts(tenantId: string): Promise<AlegraAccount[]> {
      const res = await apiFetch(`/api/alegra/accounts?tenant_id=${encodeURIComponent(tenantId)}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al consultar cuentas de Alegra');
      }
      const data = (await res.json()) as { accounts: AlegraAccount[] };
      return data.accounts || [];
    },

    async connectAccount(params: {
      tenant_id: string;
      alegra_email: string;
      alegra_token: string;
      is_default?: boolean;
    }): Promise<{ ok: boolean; account: AlegraAccount }> {
      const res = await apiFetch('/api/alegra/accounts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al conectar cuenta con Alegra');
      }
      return (await res.json()) as { ok: boolean; account: AlegraAccount };
    },

    async getAccountStatus(
      tenantId: string,
      accountId: string
    ): Promise<{ ok: boolean; account: AlegraAccount; error?: string }> {
      const res = await apiFetch(
        `/api/alegra/accounts/${encodeURIComponent(accountId)}/status?tenant_id=${encodeURIComponent(tenantId)}`,
        { headers: getHeaders() }
      );
      return (await res.json()) as { ok: boolean; account: AlegraAccount; error?: string };
    },

    async setDefaultAccount(tenantId: string, accountId: string): Promise<{ ok: boolean }> {
      const res = await apiFetch(`/api/alegra/accounts/${encodeURIComponent(accountId)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ tenant_id: tenantId, is_default: true }),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al marcar cuenta como predeterminada');
      }
      return (await res.json()) as { ok: boolean };
    },

    async disconnectAccount(tenantId: string, accountId: string): Promise<{ ok: boolean }> {
      const res = await apiFetch(
        `/api/alegra/accounts/${encodeURIComponent(accountId)}?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          method: 'DELETE',
          headers: getHeaders(),
        }
      );
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al desconectar cuenta');
      }
      return (await res.json()) as { ok: boolean };
    },

    async createInvoice(params: {
      tenant_id: string;
      alegra_account_id?: string;
      client_id?: string;
      invoice: AlegraInvoiceInputPayload;
    }): Promise<{ ok: boolean; invoice: any }> {
      const res = await apiFetch('/api/alegra/invoices', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al timbrar factura CFDI 4.0');
      }
      return (await res.json()) as { ok: boolean; invoice: any };
    },

    async getInvoices(
      tenantId: string,
      options?: { clientId?: string; limit?: number }
    ): Promise<AlegraInvoiceRecord[]> {
      const query = new URLSearchParams({ tenant_id: tenantId });
      if (options?.clientId) query.set('client_id', options.clientId);
      if (options?.limit) query.set('limit', String(options.limit));

      const res = await apiFetch(`/api/alegra/invoices?${query.toString()}`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as ApiErrorResponse;
        throw new Error(error.error || error.message || 'Error al consultar historial de facturas');
      }
      const data = (await res.json()) as { invoices: AlegraInvoiceRecord[] };
      return data.invoices || [];
    },
  },
};

export default apiClient;

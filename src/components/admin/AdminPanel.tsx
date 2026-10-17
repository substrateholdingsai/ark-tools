import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Building2,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Crown,
  Database,
  Cpu,
  CreditCard,
  Mail,
  Search,
  UserCheck,
} from 'lucide-react';
import {
  apiClient,
  type AdminOverview,
  type AdminUser,
  type AdminTenant,
} from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'users'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);

  // Filtros de búsqueda
  const [userSearch, setUserSearch] = useState('');
  const [tenantSearch, setTenantSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setActionSuccess(null);

    try {
      const [overviewData, usersData, tenantsData] = await Promise.all([
        apiClient.admin.getOverview(),
        apiClient.admin.getUsers(),
        apiClient.admin.getTenants(),
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setTenants(tenantsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con la consola de administración.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRole = async (targetUser: AdminUser) => {
    const nextRole = targetUser.platform_role === 'super_admin' ? 'user' : 'super_admin';
    const confirmText =
      nextRole === 'super_admin'
        ? `¿Promover a ${targetUser.email} a SUPER ADMIN? Tendrá acceso total al sistema.`
        : `¿Remover privilegios de SUPER ADMIN a ${targetUser.email}?`;

    if (!window.confirm(confirmText)) return;

    try {
      const res = await apiClient.admin.updateUserRole(targetUser.id, nextRole);
      setActionSuccess(res.message);
      // Actualizar estado local
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, platform_role: nextRole } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el rol.');
    }
  };

  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.full_name && u.full_name.toLowerCase().includes(term)) ||
        u.tenants.some((t) => t.name.toLowerCase().includes(term))
    );
  }, [users, userSearch]);

  const filteredTenants = useMemo(() => {
    const term = tenantSearch.toLowerCase().trim();
    if (!term) return tenants;
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.slug.toLowerCase().includes(term)
    );
  }, [tenants, tenantSearch]);

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-line bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-3 text-[12px] font-semibold text-ink transition hover:bg-surface"
            >
              <ArrowLeft size={16} />
              Volver al Dashboard
            </button>
            <div className="h-6 w-px bg-line" />
            <div>
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-gold" />
                <h1 className="font-orbitron text-base font-bold tracking-wider text-navy">
                  SUPER ADMIN CONSOLE
                </h1>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                  ROOT
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Auditoría Global, Métricas de Adopción y Gobernanza Multi-Tenant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[12px] font-medium text-ink transition hover:bg-surface-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-navy' : 'text-muted'} />
              <span>{refreshing ? 'Actualizando...' : 'Recargar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-800">
            <AlertCircle size={20} className="shrink-0 text-rose-600" />
            <p className="flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-[11px] font-bold text-rose-600 hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] text-emerald-800">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <p className="flex-1">{actionSuccess}</p>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-[11px] font-bold text-emerald-600 hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="mb-6 flex border-b border-line">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-orbitron text-[12px] font-bold tracking-wider transition ${
              activeTab === 'overview'
                ? 'border-navy text-navy'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Activity size={16} />
            MÉTRICAS & SALUD
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-orbitron text-[12px] font-bold tracking-wider transition ${
              activeTab === 'tenants'
                ? 'border-navy text-navy'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Building2 size={16} />
            DESPACHOS ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 font-orbitron text-[12px] font-bold tracking-wider transition ${
              activeTab === 'users'
                ? 'border-navy text-navy'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Users size={16} />
            USUARIOS ({users.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Despachos
                  </span>
                  <Building2 size={18} className="text-navy" />
                </div>
                <div className="mt-2 font-orbitron text-2xl font-bold text-navy">
                  {overview?.counts.totalTenants ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-muted">Organizaciones</p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Usuarios
                  </span>
                  <Users size={18} className="text-navy" />
                </div>
                <div className="mt-2 font-orbitron text-2xl font-bold text-navy">
                  {overview?.counts.totalUsers ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-emerald-600">
                  {overview?.counts.verifiedUsers ?? 0} verificados
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Clientes
                  </span>
                  <UserCheck size={18} className="text-navy" />
                </div>
                <div className="mt-2 font-orbitron text-2xl font-bold text-navy">
                  {overview?.counts.totalClients ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-muted">En catálogos D1</p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Expedientes
                  </span>
                  <FileSpreadsheet size={18} className="text-navy" />
                </div>
                <div className="mt-2 font-orbitron text-2xl font-bold text-navy">
                  {overview?.counts.totalExpedientes ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-muted">Sellados SHA-256</p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Ledger
                  </span>
                  <ShieldCheck size={18} className="text-navy" />
                </div>
                <div className="mt-2 font-orbitron text-2xl font-bold text-navy">
                  {overview?.counts.totalLedgerEntries ?? '—'}
                </div>
                <p className="mt-1 text-[11px] text-muted">Asientos auditables</p>
              </div>

              <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-navy">
                    Adopción
                  </span>
                  <Crown size={18} className="text-gold" />
                </div>
                <div className="mt-2 font-orbitron text-2xl font-bold text-navy">
                  100%
                </div>
                <p className="mt-1 text-[11px] font-medium text-gold-dark">
                  Multi-Tenant Nativo
                </p>
              </div>
            </div>

            {/* Health Grid */}
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-orbitron text-sm font-bold uppercase tracking-wider text-navy">
                <Activity size={16} className="text-gold" />
                Salud de Infraestructura Edge
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                  <Database size={20} className="text-emerald-600" />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-muted">Cloudflare D1</p>
                    <p className="text-[13px] font-semibold text-emerald-700">Operativo (Dallas WNAM)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                  <Cpu size={20} className={overview?.systemHealth.aiWorkers ? 'text-emerald-600' : 'text-muted'} />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-muted">Workers AI</p>
                    <p className="text-[13px] font-semibold text-ink">
                      {overview?.systemHealth.aiWorkers ? 'Llama 3.3 70B Activo' : 'No enlazado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                  <Mail size={20} className={overview?.systemHealth.resendEmail ? 'text-emerald-600' : 'text-rose-500'} />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-muted">Email Transaccional</p>
                    <p className="text-[13px] font-semibold text-ink">
                      {overview?.systemHealth.resendEmail ? 'Resend (mail.arksystems.site)' : 'Sin Secret'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
                  <CreditCard size={20} className={overview?.systemHealth.clipPayments ? 'text-emerald-600' : 'text-amber-600'} />
                  <div>
                    <p className="text-[11px] font-bold uppercase text-muted">Pasarela Clip</p>
                    <p className="text-[13px] font-semibold text-ink">
                      {overview?.systemHealth.clipPayments ? 'Producción Conectada' : 'Modo Simulación'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tables (2 Columns) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Users */}
              <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-orbitron text-sm font-bold uppercase tracking-wider text-navy">
                  Últimos Registros
                </h3>
                <div className="divide-y divide-line">
                  {overview?.recentUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">
                          {u.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-[11px] text-muted">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            u.email_verified_at
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {u.email_verified_at ? 'Verificado' : 'Pendiente'}
                        </span>
                        <p className="mt-1 text-[10px] text-muted">
                          {new Date(u.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!overview || overview.recentUsers.length === 0) && (
                    <p className="py-4 text-center text-[12px] text-muted">No hay usuarios registrados aún.</p>
                  )}
                </div>
              </div>

              {/* Recent Tenants */}
              <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-orbitron text-sm font-bold uppercase tracking-wider text-navy">
                  Últimos Despachos Creados
                </h3>
                <div className="divide-y divide-line">
                  {overview?.recentTenants.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                        <p className="font-mono text-[11px] text-muted">/{t.slug}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[11px] font-medium text-navy">
                          {t.member_count} miembro(s)
                        </span>
                        <p className="mt-1 text-[10px] text-muted">
                          {new Date(t.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!overview || overview.recentTenants.length === 0) && (
                    <p className="py-4 text-center text-[12px] text-muted">No hay despachos creados aún.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TENANTS */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar despacho por nombre o slug..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-4 text-[13px] text-ink outline-none focus:border-navy"
                />
              </div>
              <p className="text-[12px] text-muted">
                Mostrando {filteredTenants.length} de {tenants.length} despachos
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-line bg-surface font-orbitron text-[11px] font-bold uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-6 py-3.5">Despacho</th>
                      <th className="px-6 py-3.5">Slug</th>
                      <th className="px-6 py-3.5 text-center">Miembros</th>
                      <th className="px-6 py-3.5 text-center">Clientes</th>
                      <th className="px-6 py-3.5 text-center">Expedientes</th>
                      <th className="px-6 py-3.5">Fecha Alta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="transition hover:bg-surface/50">
                        <td className="px-6 py-4 font-semibold text-navy">{t.name}</td>
                        <td className="px-6 py-4 font-mono text-[12px] text-muted">/{t.slug}</td>
                        <td className="px-6 py-4 text-center font-bold text-ink">
                          {t.member_count}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-ink">
                          {t.client_count}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-ink">
                          {t.expediente_count}
                        </td>
                        <td className="px-6 py-4 text-muted">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {filteredTenants.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted">
                          No se encontraron despachos coincidentes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar por correo, nombre o despacho..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-4 text-[13px] text-ink outline-none focus:border-navy"
                />
              </div>
              <p className="text-[12px] text-muted">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-line bg-surface font-orbitron text-[11px] font-bold uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-6 py-3.5">Usuario</th>
                      <th className="px-6 py-3.5">Despacho(s)</th>
                      <th className="px-6 py-3.5">Estado Email</th>
                      <th className="px-6 py-3.5">Rol Plataforma</th>
                      <th className="px-6 py-3.5">Registro</th>
                      <th className="px-6 py-3.5 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === user?.id;
                      return (
                        <tr key={u.id} className="transition hover:bg-surface/50">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-ink">{u.full_name || 'Sin nombre'}</p>
                            <p className="text-[11px] text-muted">{u.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {u.tenants.map((t) => (
                                <span
                                  key={t.id}
                                  className="rounded-lg bg-surface-2 px-2 py-0.5 text-[11px] text-ink border border-line"
                                >
                                  {t.name} ({t.role})
                                </span>
                              ))}
                              {u.tenants.length === 0 && (
                                <span className="text-[11px] italic text-muted">Sin despacho</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                u.email_verified_at
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {u.email_verified_at ? (
                                <>
                                  <CheckCircle2 size={12} /> Verificado
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={12} /> Pendiente
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.platform_role === 'super_admin' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[11px] font-bold text-navy">
                                <Crown size={12} className="text-gold" /> SUPER ADMIN
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted">
                                Usuario
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={isSelf}
                              title={isSelf ? 'No puedes revocar tu propio rol' : ''}
                              className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                                isSelf
                                  ? 'border-line text-muted cursor-not-allowed opacity-50'
                                  : u.platform_role === 'super_admin'
                                  ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                  : 'border-navy/20 text-navy hover:bg-navy/5'
                              }`}
                            >
                              {u.platform_role === 'super_admin' ? 'Quitar Admin' : 'Hacer Admin'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

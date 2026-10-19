import { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Download,
  RefreshCw,
  Search,
  Users,
  MessageSquare,
  Sparkles,
  Phone,
  ShieldAlert,
  Globe,
  Mail,
  MapPin,
  ExternalLink,
  Clock,
  FilterX,
  Building2,
} from 'lucide-react';

interface Lead {
  id: string;
  web: string | null;
  whatsapp: string | null;
  email: string | null;
  ciudad: string | null;
  especialidad: string | null;
  status: string | null;
  last_contact: string | null;
  contacto_nombre: string | null;
  notas: string | null;
}

const STATUSES = [
  'Nuevo',
  'Mail_enviado_091026',
  'Mail_enviado_121026',
  'WhatsApp_enviado',
  'Respondio_2_whats',
  'Anti_spam',
  'Bloqueado',
];

const STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  Nuevo: {
    label: 'Nuevo',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Mail_enviado_091026: {
    label: 'Mail (09/Oct)',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  Mail_enviado_121026: {
    label: 'Mail (12/Oct)',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  WhatsApp_enviado: {
    label: 'WhatsApp Enviado',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Respondio_2_whats: {
    label: 'Respondió 2 WA',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
  },
  Anti_spam: {
    label: 'Anti-Spam',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  Bloqueado: {
    label: 'Bloqueado',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export default function LeadsApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState('');
  const [status, setStatus] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (ciudad) params.set('ciudad', ciudad);
      if (status) params.set('status', status);
      if (especialidad) params.set('especialidad', especialidad);
      if (q) params.set('q', q);
      const res = await fetch(`/api/admin/leads?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { leads?: Lead[]; results?: Lead[]; data?: Lead[] };
      setLeads(data.leads || data.results || data.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar prospectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciudad, status, especialidad]);

  const stats = useMemo(() => {
    const total = leads.length;
    const nuevos = leads.filter((l) => l.status === 'Nuevo').length;
    const contactados = leads.filter(
      (l) => l.status && l.status !== 'Nuevo' && l.status !== 'Anti_spam' && l.status !== 'Bloqueado'
    ).length;
    const respondieron = leads.filter((l) => l.status === 'Respondio_2_whats').length;
    const antispam = leads.filter((l) => l.status === 'Anti_spam' || l.status === 'Bloqueado').length;
    return { total, nuevos, contactados, respondieron, antispam };
  }, [leads]);

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, last_contact: today }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus, last_contact: today } : l))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al actualizar estatus');
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = () => {
    const header = [
      'ID',
      'Web',
      'WhatsApp',
      'Email',
      'Contacto',
      'Ciudad',
      'Especialidad',
      'Status',
      'Last Contact',
      'Notas',
    ];
    const rows = leads.map((l) => [
      l.id,
      l.web || '',
      l.whatsapp || '',
      l.email || '',
      l.contacto_nombre || '',
      l.ciudad || '',
      l.especialidad || '',
      l.status || '',
      l.last_contact || '',
      l.notas || '',
    ]);
    const csvContent = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-ark-tools-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setCiudad('');
    setStatus('');
    setEspecialidad('');
    setQ('');
  };

  const hasActiveFilters = ciudad !== '' || status !== '' || especialidad !== '' || q !== '';

  return (
    <div className="space-y-6">
      {/* Header institucional */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
              <Target size={18} />
            </span>
            <h2 className="font-orbitron text-lg font-bold text-navy">
              CRM Prospectos Contables
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Embudo pericial de prospección y captación de despachos para ARK Tools Platform.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-navy' : 'text-muted'} />
            Actualizar
          </button>
          <button
            onClick={exportCsv}
            disabled={leads.length === 0}
            className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gradient-to-r from-amber-50 to-amber-100/60 px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-navy shadow-sm transition hover:bg-amber-100 active:scale-95 disabled:opacity-50"
          >
            <Download size={14} className="text-gold-dark" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards — ARK Design System */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
              Total Leads
            </span>
            <Users size={16} className="text-navy" />
          </div>
          <div className="mt-2 font-orbitron text-2xl font-bold text-navy">{stats.total}</div>
          <p className="mt-1 text-[11px] text-muted">Catálogo consolidado</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
              Nuevos
            </span>
            <Sparkles size={16} className="text-blue-600" />
          </div>
          <div className="mt-2 font-orbitron text-2xl font-bold text-blue-600">{stats.nuevos}</div>
          <p className="mt-1 text-[11px] text-muted">Pendientes de contacto</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
              Contactados
            </span>
            <Phone size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2 font-orbitron text-2xl font-bold text-indigo-600">
            {stats.contactados}
          </div>
          <p className="mt-1 text-[11px] text-muted">Mail / WA emitido</p>
        </div>

        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-navy">
              Respondieron
            </span>
            <MessageSquare size={16} className="text-gold" />
          </div>
          <div className="mt-2 font-orbitron text-2xl font-bold text-emerald-600">
            {stats.respondieron}
          </div>
          <p className="mt-1 text-[11px] font-medium text-gold-dark">Interés calificado</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
              Bajas / Spam
            </span>
            <ShieldAlert size={16} className="text-purple-600" />
          </div>
          <div className="mt-2 font-orbitron text-2xl font-bold text-purple-600">
            {stats.antispam}
          </div>
          <p className="mt-1 text-[11px] text-muted">Descartados</p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Buscar por despacho, web, email o contacto..."
              className="w-full rounded-xl border border-line bg-slate-50/60 py-2 pl-9 pr-3 text-xs font-medium text-ink transition placeholder:text-muted focus:border-navy focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              className="rounded-xl border border-line bg-slate-50/60 px-3 py-2 text-xs font-medium text-ink transition focus:border-navy focus:bg-white focus:outline-none"
            >
              <option value="">Todas las ciudades</option>
              <option value="Merida">Mérida</option>
              <option value="Metropolitana">Metropolitana</option>
              <option value="Durango">Durango</option>
            </select>

            <select
              value={especialidad}
              onChange={(e) => setEspecialidad(e.target.value)}
              className="rounded-xl border border-line bg-slate-50/60 px-3 py-2 text-xs font-medium text-ink transition focus:border-navy focus:bg-white focus:outline-none"
            >
              <option value="">Todas las especialidades</option>
              <option value="Crypto">Crypto</option>
              <option value="General">General</option>
              <option value="Cobranza">Cobranza</option>
              <option value="Abogados">Abogados</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-line bg-slate-50/60 px-3 py-2 text-xs font-medium text-ink transition focus:border-navy focus:bg-white focus:outline-none"
            >
              <option value="">Todos los estatus</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]?.label || s}
                </option>
              ))}
            </select>

            <button
              onClick={load}
              className="rounded-xl bg-navy px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-navy-dark active:scale-95"
            >
              Filtrar
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                title="Limpiar filtros"
                className="flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted hover:text-ink hover:bg-slate-50 transition"
              >
                <FilterX size={14} />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          {error}
        </div>
      )}

      {/* Tabla de Prospectos */}
      <div className="rounded-3xl border border-line bg-white shadow-sm overflow-hidden">
        <div className="border-b border-line bg-slate-50/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-navy" />
            <h3 className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
              Directorio de Prospectos ({leads.length})
            </h3>
          </div>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <RefreshCw size={12} className="animate-spin text-navy" />
              Cargando registros...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-line bg-slate-50/60 font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3.5">Despacho / Web</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5">Canales Directos</th>
                <th className="px-5 py-3.5">Ubicación</th>
                <th className="px-5 py-3.5">Especialidad</th>
                <th className="px-5 py-3.5">Estatus (Acción)</th>
                <th className="px-5 py-3.5">Último Contacto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted">
                      <Target size={24} />
                    </div>
                    <p className="mt-3 font-orbitron text-xs font-semibold text-navy">
                      No se encontraron prospectos
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Prueba ajustando los filtros de búsqueda o consulta la base de datos.
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((l) => {
                  const statusConfig = STATUS_LABELS[l.status || 'Nuevo'] || {
                    label: l.status || 'Nuevo',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      {/* Web / Dominio */}
                      <td className="px-5 py-3.5 font-medium">
                        {l.web ? (
                          <a
                            href={l.web.startsWith('http') ? l.web : `https://${l.web}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-navy hover:text-navy-dark hover:underline"
                          >
                            <Globe size={13} className="text-muted" />
                            {l.web.replace(/^https?:\/\/(www\.)?/, '')}
                            <ExternalLink size={11} className="text-muted" />
                          </a>
                        ) : (
                          <span className="text-muted italic">Sin web registrada</span>
                        )}
                        {l.notas && (
                          <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-muted">
                            {l.notas}
                          </p>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-ink">
                          {l.contacto_nombre || 'Despacho Contable'}
                        </span>
                      </td>

                      {/* Canales: WhatsApp y Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          {l.whatsapp ? (
                            <a
                              href={`https://wa.me/${l.whatsapp}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 hover:underline"
                            >
                              <Phone size={12} className="text-emerald-600" />
                              {l.whatsapp}
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted">—</span>
                          )}
                          {l.email && (
                            <a
                              href={`mailto:${l.email}`}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-muted hover:text-navy hover:underline"
                            >
                              <Mail size={12} />
                              {l.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Ciudad */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-ink">
                          <MapPin size={12} className="text-muted" />
                          {l.ciudad || 'No especificada'}
                        </span>
                      </td>

                      {/* Especialidad */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-lg border px-2 py-0.5 text-[11px] font-medium ${
                            l.especialidad === 'Crypto'
                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {l.especialidad || 'General'}
                        </span>
                      </td>

                      {/* Estatus interactivo */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={l.status || 'Nuevo'}
                            disabled={updatingId === l.id}
                            onChange={(e) => handleUpdateStatus(l.id, e.target.value)}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-medium transition focus:outline-none focus:ring-1 focus:ring-navy ${statusConfig.badgeClass}`}
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]?.label || s}
                              </option>
                            ))}
                          </select>
                          {updatingId === l.id && (
                            <RefreshCw size={12} className="animate-spin text-navy" />
                          )}
                        </div>
                      </td>

                      {/* Último contacto */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                          <Clock size={12} />
                          {l.last_contact || 'Sin registrar'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

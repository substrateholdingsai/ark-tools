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
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
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

function getStatusBadge(status: string | null): { label: string; badgeClass: string } {
  const s = status || 'Nuevo';
  if (STATUS_LABELS[s]) return STATUS_LABELS[s];
  if (s.startsWith('Mail_enviado')) {
    const match = s.match(/Mail_enviado_(\d{2})(\d{2})(\d{2})/);
    const dateLabel = match ? `Mail (${match[1]}/${match[2]})` : 'Mail Enviado';
    return {
      label: dateLabel,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  }
  return {
    label: s,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

export default function LeadsApp() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState('');
  const [status, setStatus] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [q, setQ] = useState('');

  // Modal de envío de email
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);
  const [emailRecipientName, setEmailRecipientName] = useState('');
  const [emailTestTarget, setEmailTestTarget] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

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

  const openEmailModal = (lead: Lead) => {
    setSelectedLeadForEmail(lead);
    setEmailRecipientName(lead.contacto_nombre?.trim() || 'Director(a)');
    setEmailTestTarget('');
    setEmailFeedback(null);
    setShowHtmlPreview(false);
  };

  const closeEmailModal = () => {
    setSelectedLeadForEmail(null);
    setEmailFeedback(null);
  };

  const handleSendProposalEmail = async () => {
    if (!selectedLeadForEmail) return;
    setSendingEmail(true);
    setEmailFeedback(null);

    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(selectedLeadForEmail.id)}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipient_name: emailRecipientName,
          test_email: emailTestTarget.trim() || undefined,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string; lead?: Lead };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al enviar el correo');
      }

      setEmailFeedback({
        type: 'success',
        message: data.message || 'Correo entregado exitosamente a Resend.',
      });

      if (data.lead && (!emailTestTarget || emailTestTarget === selectedLeadForEmail.email)) {
        const updated = data.lead;
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      }
    } catch (e) {
      setEmailFeedback({
        type: 'error',
        message: e instanceof Error ? e.message : 'Error inesperado al conectar con Resend',
      });
    } finally {
      setSendingEmail(false);
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
                <th className="px-5 py-3.5">Estatus</th>
                <th className="px-5 py-3.5">Último Contacto</th>
                <th className="px-5 py-3.5 text-right">Acción Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-muted">
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
                  const statusConfig = getStatusBadge(l.status);

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
                          <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-muted">
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

                      {/* Acción Comercial: Botón Enviar Mail */}
                      <td className="px-5 py-3.5 text-right">
                        {l.email ? (
                          <button
                            onClick={() => openEmailModal(l)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-navy/20 bg-navy/5 px-3 py-1.5 font-orbitron text-[11px] font-semibold text-navy transition hover:bg-navy hover:text-white active:scale-95 shadow-sm"
                            title={`Enviar propuesta a ${l.email}`}
                          >
                            <Send size={12} />
                            Enviar Propuesta
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted italic">Sin email</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ENVÍO Y PREVISUALIZACIÓN DE CORREO */}
      {selectedLeadForEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-8">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-orbitron text-base font-bold text-navy">
                    Enviar Propuesta Institucional
                  </h3>
                  <p className="text-xs text-muted">
                    Arrendamiento de Infraestructura Fiscal + IA (Marca Blanca)
                  </p>
                </div>
              </div>
              <button
                onClick={closeEmailModal}
                disabled={sendingEmail}
                className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-ink transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario de parámetros */}
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-orbitron font-semibold uppercase tracking-wider text-muted mb-1">
                    Destinatario Oficial
                  </label>
                  <div className="rounded-xl border border-line bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-ink">
                    {selectedLeadForEmail.email}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-orbitron font-semibold uppercase tracking-wider text-muted mb-1">
                    Nombre del Socio / Director
                  </label>
                  <input
                    value={emailRecipientName}
                    onChange={(e) => setEmailRecipientName(e.target.value)}
                    placeholder="ej. Lic. Pérez / Director(a)"
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Opción de prueba */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5">
                <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-amber-900 mb-1">
                  Dirección de Prueba (Opcional)
                </label>
                <input
                  value={emailTestTarget}
                  onChange={(e) => setEmailTestTarget(e.target.value)}
                  placeholder="ej. tu-correo@ejemplo.com (dejar vacío para enviar al prospecto real)"
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-mono font-medium text-ink placeholder:text-muted focus:border-navy focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-amber-800">
                  Si escribes un correo aquí, Resend lo enviará solo a esa dirección para que lo revises primero y no cambiará el estatus del prospecto en la base de datos.
                </p>
              </div>

              {/* Botón para alternar Previsualización */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-muted">
                  Remitente: <strong className="text-navy">Pavel Cortés &lt;pavel@mail.arksystems.site&gt;</strong> (Reply-To: pavel@arksystems.site)
                </span>
                <button
                  type="button"
                  onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
                >
                  <Eye size={14} />
                  {showHtmlPreview ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}
                </button>
              </div>

              {/* Vista previa colapsable */}
              {showHtmlPreview && (
                <div className="rounded-2xl border border-line bg-slate-50 p-4 max-h-[280px] overflow-y-auto text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-orbitron font-bold text-navy">Asunto: Infraestructura Tecnológica para su Firma</span>
                    <span className="text-[11px] text-muted">Logo: /logo-email.png</span>
                  </div>
                  <p className="text-ink font-semibold">
                    Hola <strong>{emailRecipientName || 'Director(a)'}</strong>,
                  </p>
                  <p className="text-muted leading-relaxed">
                    Notamos que las grandes firmas contables buscan integrar Inteligencia Artificial y automatización masiva, pero las opciones del mercado los obligan a usar software genérico de terceros donde pierden el control y privacidad de sus datos...
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-700">
                    <strong>Plan Corporate Firm (Marca Blanca)</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      <li>Branding Total en su propio subdominio</li>
                      <li>Aislamiento Estricto en D1 dedicado</li>
                      <li>Cédulas PDF con Sello SHA-256 + QR oficial</li>
                      <li>ARK Contable AI Privado</li>
                    </ul>
                  </div>
                  <p className="text-muted text-[11px]">
                    Llamada de coordinación vía WhatsApp: <strong>+52 56 5706 2511</strong>
                  </p>
                </div>
              )}

              {/* Feedback de resultado */}
              {emailFeedback && (
                <div
                  className={`flex items-center gap-2 rounded-2xl border p-3.5 text-xs font-medium ${
                    emailFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {emailFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  )}
                  <span>{emailFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={closeEmailModal}
                disabled={sendingEmail}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted hover:bg-slate-50 hover:text-ink transition active:scale-95"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSendProposalEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-navy-dark active:scale-95 disabled:opacity-50"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Enviando vía Resend...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    {emailTestTarget.trim() ? 'Enviar Correo de Prueba' : 'Confirmar y Enviar al Prospecto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

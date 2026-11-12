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
  UserPlus,
  Trash2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import {
  WS_TEMPLATES,
  WS_TENANT_CONFIGS,
  buildWhatsAppDeepLink,
  buildWhatsAppVariables,
  compileWhatsAppMessage,
  inferDefaultTemplateId,
  inferWhatsAppTenant,
  normalizeMexicanPhone,
  type WhatsAppTenantKey,
} from '../../lib/whatsappStudio';

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
  const [emailFeedback, setEmailFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  // Modal de creación de lead
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newLeadForm, setNewLeadForm] = useState({
    contacto_nombre: '',
    web: '',
    whatsapp: '',
    email: '',
    ciudad: 'Merida',
    especialidad: 'General',
    status: 'Nuevo',
    notas: '',
  });

  // Modal de eliminación de lead
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState(false);

  // Modal de WhatsApp Studio ("Cero Costo" Outbound Deep-Linking)
  const [selectedLeadForWa, setSelectedLeadForWa] = useState<Lead | null>(null);
  const [waTenant, setWaTenant] = useState<WhatsAppTenantKey>('ark');
  const [waTemplateId, setWaTemplateId] = useState<string>('ark_marca_blanca');
  const [waRecipientName, setWaRecipientName] = useState<string>('');
  const [waSenderName, setWaSenderName] = useState<string>(WS_TENANT_CONFIGS.ark.defaultSender);
  const [waSenderPhone, setWaSenderPhone] = useState<string>(
    WS_TENANT_CONFIGS.ark.defaultSenderPhone
  );
  const [waCustomMessage, setWaCustomMessage] = useState<string>('');
  const [waIsCustomEdited, setWaIsCustomEdited] = useState<boolean>(false);
  const [sendingWa, setSendingWa] = useState<boolean>(false);
  const [waFeedback, setWaFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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
      (l) =>
        l.status && l.status !== 'Nuevo' && l.status !== 'Anti_spam' && l.status !== 'Bloqueado'
    ).length;
    const respondieron = leads.filter((l) => l.status === 'Respondio_2_whats').length;
    const antispam = leads.filter(
      (l) => l.status === 'Anti_spam' || l.status === 'Bloqueado'
    ).length;
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

  const recompileWaTemplate = (
    lead: Lead,
    tenantKey: WhatsAppTenantKey,
    templateId: string,
    recipientName: string,
    senderName: string,
    senderPhone: string
  ) => {
    const tpl =
      WS_TEMPLATES.find((t) => t.id === templateId) ||
      WS_TEMPLATES.find((t) => t.tenant === tenantKey) ||
      WS_TEMPLATES[0]!;
    const vars = buildWhatsAppVariables(lead, {
      tenant: tenantKey,
      recipientName,
      senderName,
      senderPhone,
    });
    return compileWhatsAppMessage(tpl.body, vars);
  };

  const openWhatsAppStudioModal = (lead: Lead) => {
    const inferredTenant = inferWhatsAppTenant(lead);
    const defaultTplId = inferDefaultTemplateId(lead, inferredTenant);
    const defaultRecipient = lead.contacto_nombre?.trim() || 'Socio(a) Director(a)';
    const defaultSender = WS_TENANT_CONFIGS[inferredTenant].defaultSender;
    const defaultPhone = WS_TENANT_CONFIGS[inferredTenant].defaultSenderPhone;

    setSelectedLeadForWa(lead);
    setWaTenant(inferredTenant);
    setWaTemplateId(defaultTplId);
    setWaRecipientName(defaultRecipient);
    setWaSenderName(defaultSender);
    setWaSenderPhone(defaultPhone);
    setWaIsCustomEdited(false);
    setWaFeedback(null);
    setWaCustomMessage(
      recompileWaTemplate(
        lead,
        inferredTenant,
        defaultTplId,
        defaultRecipient,
        defaultSender,
        defaultPhone
      )
    );
  };

  const closeWhatsAppStudioModal = () => {
    setSelectedLeadForWa(null);
    setWaFeedback(null);
  };

  const handleChangeWaTenant = (newTenant: WhatsAppTenantKey) => {
    if (!selectedLeadForWa) return;
    const newTplId = inferDefaultTemplateId(selectedLeadForWa, newTenant);
    const newSender = WS_TENANT_CONFIGS[newTenant].defaultSender;
    const newPhone = WS_TENANT_CONFIGS[newTenant].defaultSenderPhone;

    setWaTenant(newTenant);
    setWaTemplateId(newTplId);
    setWaSenderName(newSender);
    setWaSenderPhone(newPhone);
    setWaIsCustomEdited(false);
    setWaCustomMessage(
      recompileWaTemplate(
        selectedLeadForWa,
        newTenant,
        newTplId,
        waRecipientName,
        newSender,
        newPhone
      )
    );
  };

  const handleChangeWaTemplate = (newTplId: string) => {
    if (!selectedLeadForWa) return;
    setWaTemplateId(newTplId);
    setWaIsCustomEdited(false);
    setWaCustomMessage(
      recompileWaTemplate(
        selectedLeadForWa,
        waTenant,
        newTplId,
        waRecipientName,
        waSenderName,
        waSenderPhone
      )
    );
  };

  const handleUpdateWaVars = (
    nextRecipient: string,
    nextSender: string,
    nextSenderPhone: string
  ) => {
    setWaRecipientName(nextRecipient);
    setWaSenderName(nextSender);
    setWaSenderPhone(nextSenderPhone);
    if (selectedLeadForWa && !waIsCustomEdited) {
      setWaCustomMessage(
        recompileWaTemplate(
          selectedLeadForWa,
          waTenant,
          waTemplateId,
          nextRecipient,
          nextSender,
          nextSenderPhone
        )
      );
    }
  };

  const handleDispatchWhatsApp = async () => {
    if (!selectedLeadForWa) return;
    const deepLink = buildWhatsAppDeepLink(selectedLeadForWa.whatsapp, waCustomMessage);
    if (!deepLink) {
      setWaFeedback({
        type: 'error',
        message: 'Número de WhatsApp inválido para construir el enlace wa.me.',
      });
      return;
    }

    setSendingWa(true);
    setWaFeedback(null);

    const activeTpl = WS_TEMPLATES.find((t) => t.id === waTemplateId);

    try {
      // Abrir ventana de WhatsApp con mensaje pre-compilado (Cero costo de API)
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(deepLink, '_blank', 'noopener,noreferrer');
      }

      // Registrar actividad comercial y actualizar estatus en D1
      const res = await fetch(
        `/api/admin/leads/${encodeURIComponent(selectedLeadForWa.id)}/log-whatsapp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tenant_profile: waTenant,
            template_id: waTemplateId,
            template_name: activeTpl?.name || 'Mensaje personalizado',
            message: waCustomMessage,
          }),
        }
      );

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        lead?: Lead;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al registrar actividad de WhatsApp');
      }

      if (data.lead) {
        const updated = data.lead;
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setSelectedLeadForWa(updated);
      }

      setWaFeedback({
        type: 'success',
        message:
          data.message || 'WhatsApp abierto y actividad registrada en el expediente del prospecto.',
      });
    } catch (e) {
      setWaFeedback({
        type: 'error',
        message: e instanceof Error ? e.message : 'Error al registrar actividad en el CRM',
      });
    } finally {
      setSendingWa(false);
    }
  };

  const handleSendProposalEmail = async () => {
    if (!selectedLeadForEmail) return;
    setSendingEmail(true);
    setEmailFeedback(null);

    try {
      const res = await fetch(
        `/api/admin/leads/${encodeURIComponent(selectedLeadForEmail.id)}/send-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            recipient_name: emailRecipientName,
            test_email: emailTestTarget.trim() || undefined,
          }),
        }
      );

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        lead?: Lead;
      };
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

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLead(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newLeadForm),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string; lead?: Lead };
      if (!res.ok || !data.ok || !data.lead) {
        throw new Error(data.error || 'Error al crear el prospecto');
      }

      setLeads((prev) => [data.lead!, ...prev]);
      setIsCreateModalOpen(false);
      setNewLeadForm({
        contacto_nombre: '',
        web: '',
        whatsapp: '',
        email: '',
        ciudad: 'Merida',
        especialidad: 'General',
        status: 'Nuevo',
        notas: '',
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error inesperado al guardar');
    } finally {
      setCreatingLead(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    setDeletingLead(true);

    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadToDelete.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al eliminar el prospecto');
      }

      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      setLeadToDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar prospecto');
    } finally {
      setDeletingLead(false);
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
            <h2 className="font-orbitron text-lg font-bold text-navy">CRM Prospectos Contables</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Embudo pericial de prospección y captación de despachos para ARK Tools Platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://notebook.google.com/notebook/e61dfb18-d19d-4424-b29e-1d74e63046ee"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir Manual de Usuario del Ecosistema en Google NotebookLM"
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-blue-800 shadow-sm transition hover:bg-blue-100 hover:text-blue-900 active:scale-95"
          >
            <BookOpen size={14} className="text-blue-600" />
            <span>Manual del Ecosistema</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>
          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-navy-dark active:scale-95"
          >
            <UserPlus size={14} />
            Nuevo Prospecto
          </button>
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
                className="flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted transition hover:bg-slate-50 hover:text-ink"
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
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-line bg-slate-50/80 px-6 py-4">
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
                    <tr key={l.id} className="transition hover:bg-slate-50/80">
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
                          <span className="italic text-muted">Sin web registrada</span>
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

                      {/* Acción Comercial & Eliminación */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {l.whatsapp && (
                            <button
                              onClick={() => openWhatsAppStudioModal(l)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 font-orbitron text-[11px] font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-600 hover:text-white active:scale-95"
                              title={`Abrir WhatsApp Studio para ${l.whatsapp}`}
                            >
                              <MessageSquare size={11} />
                              WhatsApp Studio
                            </button>
                          )}
                          {l.email ? (
                            <button
                              onClick={() => openEmailModal(l)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-navy/20 bg-navy/5 px-2.5 py-1.5 font-orbitron text-[11px] font-semibold text-navy shadow-sm transition hover:bg-navy hover:text-white active:scale-95"
                              title={`Enviar propuesta a ${l.email}`}
                            >
                              <Send size={11} />
                              Enviar Propuesta
                            </button>
                          ) : (
                            <span className="text-[11px] italic text-muted">Sin email</span>
                          )}
                          <button
                            onClick={() => setLeadToDelete(l)}
                            disabled={deletingLead && leadToDelete?.id === l.id}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
                            title="Eliminar prospecto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CREACIÓN DE PROSPECTO */}
      {isCreateModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-orbitron text-base font-bold text-navy">
                    Añadir Nuevo Prospecto
                  </h3>
                  <p className="text-xs text-muted">
                    Registrar despacho o contacto en el CRM de ARK Tools
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                disabled={creatingLead}
                className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="mt-5 space-y-4">
              {createError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Nombre del Despacho o Contacto *
                </label>
                <input
                  required
                  value={newLeadForm.contacto_nombre}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, contacto_nombre: e.target.value })
                  }
                  placeholder="ej. Despacho Pérez & Asociados / CP Juan Pérez"
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="contacto@despacho.mx"
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    WhatsApp (E.164 o 10 dígitos)
                  </label>
                  <input
                    value={newLeadForm.whatsapp}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, whatsapp: e.target.value })}
                    placeholder="ej. 5219991234567 o 9991234567"
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Sitio Web
                  </label>
                  <input
                    value={newLeadForm.web}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, web: e.target.value })}
                    placeholder="https://despacho.mx"
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Ciudad
                  </label>
                  <select
                    value={newLeadForm.ciudad}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, ciudad: e.target.value })}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  >
                    <option value="Merida">Mérida</option>
                    <option value="Metropolitana">Metropolitana</option>
                    <option value="Durango">Durango</option>
                    <option value="Guadalajara">Guadalajara</option>
                    <option value="Monterrey">Monterrey</option>
                    <option value="Nacional">Nacional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Especialidad
                  </label>
                  <select
                    value={newLeadForm.especialidad}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, especialidad: e.target.value })
                    }
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Cobranza">Cobranza</option>
                    <option value="Abogados">Abogados</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Estatus Inicial
                  </label>
                  <select
                    value={newLeadForm.status}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, status: e.target.value })}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]?.label || s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={3}
                  value={newLeadForm.notas}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notas: e.target.value })}
                  placeholder="Información relevante sobre el despacho o necesidades de software..."
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creatingLead}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:bg-slate-50 hover:text-ink active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-navy-dark active:scale-95 disabled:opacity-50"
                >
                  {creatingLead ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Guardar Prospecto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {leadToDelete && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="font-orbitron text-base font-bold text-navy">
                  ¿Eliminar Prospecto?
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  ¿Estás seguro de que deseas eliminar a{' '}
                  <strong className="text-ink">
                    {leadToDelete.contacto_nombre ||
                      leadToDelete.web ||
                      leadToDelete.email ||
                      'este prospecto'}
                  </strong>{' '}
                  del CRM? Esta acción eliminará permanentemente su registro de la base de datos D1.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                disabled={deletingLead}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:bg-slate-50 hover:text-ink active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteLead}
                disabled={deletingLead}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
              >
                {deletingLead ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Eliminar Definitivamente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedLeadForEmail && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-8">
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
                className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario de parámetros */}
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Destinatario Oficial
                  </label>
                  <div className="rounded-xl border border-line bg-slate-50 px-3 py-2 font-mono text-xs font-medium text-ink">
                    {selectedLeadForEmail.email}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
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
                <label className="mb-1 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Dirección de Prueba (Opcional)
                </label>
                <input
                  value={emailTestTarget}
                  onChange={(e) => setEmailTestTarget(e.target.value)}
                  placeholder="ej. tu-correo@ejemplo.com (dejar vacío para enviar al prospecto real)"
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-xs font-medium text-ink placeholder:text-muted focus:border-navy focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-amber-800">
                  Si escribes un correo aquí, Resend lo enviará solo a esa dirección para que lo
                  revises primero y no cambiará el estatus del prospecto en la base de datos.
                </p>
              </div>

              {/* Botón para alternar Previsualización */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-muted">
                  Remitente:{' '}
                  <strong className="text-navy">
                    Pavel Cortés &lt;pavel@mail.arksystems.site&gt;
                  </strong>{' '}
                  (Reply-To: pavel@arksystems.site)
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
                <div className="max-h-[280px] space-y-3 overflow-y-auto rounded-2xl border border-line bg-slate-50 p-4 text-xs">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="font-orbitron font-bold text-navy">
                      Asunto: Infraestructura Tecnológica para su Firma
                    </span>
                    <span className="text-[11px] text-muted">Logo: /logo-email.png</span>
                  </div>
                  <p className="font-semibold text-ink">
                    Hola <strong>{emailRecipientName || 'Director(a)'}</strong>,
                  </p>
                  <p className="leading-relaxed text-muted">
                    Notamos que las grandes firmas contables buscan integrar Inteligencia Artificial
                    y automatización masiva, pero las opciones del mercado los obligan a usar
                    software genérico de terceros donde pierden el control y privacidad de sus
                    datos...
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-700">
                    <strong>Plan Corporate Firm (Marca Blanca)</strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      <li>Branding Total en su propio subdominio</li>
                      <li>Aislamiento Estricto en D1 dedicado</li>
                      <li>Cédulas PDF con Sello SHA-256 + QR oficial</li>
                      <li>Noah (AI Privado)</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-muted">
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
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
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
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:bg-slate-50 hover:text-ink active:scale-95"
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
                    {emailTestTarget.trim()
                      ? 'Enviar Correo de Prueba'
                      : 'Confirmar y Enviar al Prospecto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP STUDIO (ENVÍO OUTBOUND CERO COSTO + AUDITORÍA D1) */}
      {selectedLeadForWa && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-8">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-orbitron text-base font-bold text-navy">WhatsApp Studio</h3>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Cero Costo API · wa.me
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Compilación de plantillas dinámicas y registro automático en expediente D1
                  </p>
                </div>
              </div>
              <button
                onClick={closeWhatsAppStudioModal}
                disabled={sendingWa}
                className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Selector de Tenant / Remitente y Teléfono Destino */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Identidad / Tenant Emisor
                  </label>
                  <select
                    aria-label="Identidad Emisor WhatsApp"
                    value={waTenant}
                    onChange={(e) => handleChangeWaTenant(e.target.value as WhatsAppTenantKey)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-navy focus:border-navy focus:outline-none"
                  >
                    <option value="ark">Ark Financial Technologies (Marca Blanca)</option>
                    <option value="canaco_merida">CANACO SERVYTUR Mérida (Institucional)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    WhatsApp Destino Normalizado (E.164)
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 font-mono text-xs font-semibold text-emerald-900">
                    <span>+{normalizeMexicanPhone(selectedLeadForWa.whatsapp)}</span>
                    <span className="text-[10px] font-normal text-emerald-700">
                      {selectedLeadForWa.ciudad || 'México'} ·{' '}
                      {selectedLeadForWa.especialidad || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector de Plantilla Dinámica */}
              <div>
                <label className="mb-1 block font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Plantilla Comercial ({WS_TENANT_CONFIGS[waTenant].badge})
                </label>
                <select
                  aria-label="Plantilla Comercial WhatsApp"
                  value={waTemplateId}
                  onChange={(e) => handleChangeWaTemplate(e.target.value)}
                  className="w-full rounded-xl border border-line bg-slate-50/70 px-3 py-2 text-xs font-medium text-ink focus:border-navy focus:bg-white focus:outline-none"
                >
                  {WS_TEMPLATES.filter((t) => t.tenant === waTenant).map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      [{tpl.category}] {tpl.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted">
                  {WS_TEMPLATES.find((t) => t.id === waTemplateId)?.description}
                </p>
              </div>

              {/* Variables en tiempo real */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-orbitron text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Destinatario (&#123;NOMBRE&#125;)
                  </label>
                  <input
                    value={waRecipientName}
                    onChange={(e) =>
                      handleUpdateWaVars(e.target.value, waSenderName, waSenderPhone)
                    }
                    placeholder="Socio(a) Director(a)"
                    className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-orbitron text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Ejecutivo (&#123;REMITENTE&#125;)
                  </label>
                  <input
                    value={waSenderName}
                    onChange={(e) =>
                      handleUpdateWaVars(waRecipientName, e.target.value, waSenderPhone)
                    }
                    className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-orbitron text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Teléfono Firma (&#123;TEL_REMITENTE&#125;)
                  </label>
                  <input
                    value={waSenderPhone}
                    onChange={(e) =>
                      handleUpdateWaVars(waRecipientName, waSenderName, e.target.value)
                    }
                    className="w-full rounded-xl border border-line bg-white px-3 py-1.5 font-mono text-xs font-medium text-ink focus:border-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Editor de mensaje en vivo */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-orbitron text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Mensaje Compilado (Editable antes de abrir WhatsApp)
                  </label>
                  {waIsCustomEdited && (
                    <button
                      type="button"
                      onClick={() => {
                        setWaIsCustomEdited(false);
                        setWaCustomMessage(
                          recompileWaTemplate(
                            selectedLeadForWa,
                            waTenant,
                            waTemplateId,
                            waRecipientName,
                            waSenderName,
                            waSenderPhone
                          )
                        );
                      }}
                      className="text-[11px] font-semibold text-navy hover:underline"
                    >
                      Restaurar plantilla original
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={waCustomMessage}
                  onChange={(e) => {
                    setWaIsCustomEdited(true);
                    setWaCustomMessage(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-emerald-200 bg-emerald-50/20 p-3.5 font-sans text-xs leading-relaxed text-ink focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                  <span>
                    Al disparar el envío se marcará como <strong>WhatsApp Enviado</strong> y se
                    anexará nota de auditoría.
                  </span>
                  <span className="font-mono">{waCustomMessage.length} caracteres</span>
                </div>
              </div>

              {/* Feedback de resultado */}
              {waFeedback && (
                <div
                  className={`flex items-center gap-2 rounded-2xl border p-3.5 text-xs font-medium ${
                    waFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  {waFeedback.type === 'success' ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  )}
                  <span>{waFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Footer con acciones */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={closeWhatsAppStudioModal}
                disabled={sendingWa}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:bg-slate-50 hover:text-ink active:scale-95"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleDispatchWhatsApp}
                disabled={sendingWa || !waCustomMessage.trim()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                {sendingWa ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Registrando y Abriendo...
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} />
                    Abrir en WhatsApp y Registrar Actividad
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

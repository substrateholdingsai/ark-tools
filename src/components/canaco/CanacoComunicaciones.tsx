import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  MessageSquareText,
  PhoneCall,
  Plus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { determinarEstrato, extraerNumEmpleados } from './calculoCuota';

interface Lead {
  id: string;
  web: string | null;
  whatsapp: string | null;
  email: string | null;
  especialidad: string | null;
  is_demo?: number | null;
  consent_accepted_at?: string | null;
  arkangel_share_consent?: number | null;
  sales_share_consent?: number | null;
  verified_payment_num_empleados?: number | null;
  verified_payment_sector?: string | null;
  contacto_nombre: string | null;
  notas: string | null;
}

interface Delegacion {
  id: string;
  nombre: string;
}

interface Template {
  id: string;
  name: string;
  language: string;
  status: string;
  variables: Array<string | { name?: string; key?: string; label?: string }>;
  body: string;
}

interface CommsJob {
  job_id: string;
  channel: string;
  audience_size: number;
  status: string;
  cost_estimate: unknown;
  preview: unknown;
  detail: unknown;
  receipt: unknown;
  ledger_contact_ids?: string[];
  created_at: string;
}

interface Props {
  leads: Lead[];
  delegaciones: Delegacion[];
  asignaciones: Array<{ lead_id: string; delegacion_id: string }>;
  canManage: boolean;
  onBack: () => void;
  initialLeadId?: string | null;
}

type Channel = 'whatsapp' | 'email' | 'voice_ai';
type Section = 'jobs' | 'compose' | 'preview' | 'approval' | 'detail';

const CHANNELS: Array<{ id: Channel; label: string }> = [
  { id: 'whatsapp', label: 'WhatsApp · Telnyx' },
  { id: 'email', label: 'Email · Resend' },
  { id: 'voice_ai', label: 'Voice AI · No disponible' },
];
function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nestedValue(value: unknown, key: string): unknown {
  const record = asObject(value);
  const job = asObject(record.job);
  return record[key] ?? job[key];
}

function readExpiry(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : Date.now() + value * 1000;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric > 1_000_000_000_000 ? numeric : Date.now() + numeric * 1000;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatExact(value: unknown): string {
  if (value === undefined || value === null) return '—';
  return typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? String(value));
}

function templateVariables(value: unknown): Template['variables'] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Template['variables'][number] =>
      typeof item === 'string' ||
      (item !== null && typeof item === 'object' && !Array.isArray(item))
  );
}

function templateJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return JSON.parse(value) as unknown;
}

function variableName(variable: Template['variables'][number]): string {
  if (typeof variable === 'string') return variable;
  return variable.name || variable.key || variable.label || 'variable';
}

function interpolate(
  text: string,
  values: Record<string, string>,
  sample: Lead | undefined
): string {
  const data: Record<string, string> = {
    nombre: sample?.contacto_nombre || 'Nombre de contacto',
    empresa: sample?.web || 'Empresa',
    ...values,
  };
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => data[key] || '');
}

function isQuietHours(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date())
  );
  return hour >= 21 || hour < 8;
}

function eligible(lead: Lead, channel: Channel): boolean {
  if (lead.is_demo === 1 || lead.sales_share_consent !== 1 || !lead.consent_accepted_at) {
    return false;
  }
  if (channel === 'email') return Boolean(lead.email?.trim());
  return Boolean(lead.whatsapp?.trim());
}

export function CanacoComunicaciones({
  leads,
  delegaciones,
  asignaciones,
  canManage,
  onBack,
  initialLeadId,
}: Props) {
  const [section, setSection] = useState<Section>('jobs');
  const [jobs, setJobs] = useState<CommsJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<CommsJob | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [delegation, setDelegation] = useState('all');
  const [size, setSize] = useState('all');
  const [sector, setSector] = useState('all');
  const [consentFilter, setConsentFilter] = useState<'authorized' | 'no-consent'>('authorized');
  const [templateId, setTemplateId] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [previewResponse, setPreviewResponse] = useState<Record<string, unknown> | null>(null);
  const [previewExpiresAt, setPreviewExpiresAt] = useState<number | null>(null);
  const [freshPreviewJobId, setFreshPreviewJobId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeTemplate = templates.find((template) => template.id === templateId);
  const quietHours = useMemo(isQuietHours, []);
  const selectedIds = useMemo(() => {
    if (consentFilter === 'no-consent') return [];
    return leads
      .filter((lead) => {
        const assignment = asignaciones.find((item) => item.lead_id === lead.id);
        const employees = lead.verified_payment_num_empleados || extraerNumEmpleados(lead.notas);
        const leadSize = employees ? determinarEstrato(employees) : 'sin_clasificar';
        const leadSector = lead.verified_payment_sector || lead.especialidad || '';
        return (
          eligible(lead, channel) &&
          (delegation === 'all' ||
            (delegation === 'unassigned' && !assignment) ||
            assignment?.delegacion_id === delegation) &&
          (size === 'all' || leadSize === size) &&
          (sector === 'all' || leadSector.toLowerCase() === sector) &&
          lead.sales_share_consent === 1
        );
      })
      .map((lead) => lead.id);
  }, [leads, asignaciones, channel, delegation, size, sector, consentFilter]);

  const sampleContact = leads.find((lead) => selectedIds.includes(lead.id));
  const previewText = interpolate(messageBody, variables, sampleContact);
  const unsupportedEmailVariables =
    channel === 'email' && /\{\{|\}\}|\{[\w.-]+\}/.test(`${subject}\n${messageBody}`);

  const loadJobs = useCallback(async () => {
    const response = await fetch('/api/comms/jobs');
    const data = (await response.json()) as { jobs?: CommsJob[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los trabajos.');
    setJobs(Array.isArray(data.jobs) ? data.jobs : []);
  }, []);

  const loadTemplates = useCallback(async () => {
    const response = await fetch('/api/comms/templates');
    const responseData: unknown = await response.json();
    const data = asObject(responseData);
    if (!response.ok) {
      throw new Error(String(data.error || 'No se pudieron cargar las plantillas.'));
    }
    const rows = Array.isArray(data.templates)
      ? data.templates.map(asObject)
      : Array.isArray(responseData)
        ? responseData.map(asObject)
        : [];
    setTemplates(
      rows
        .filter((row) => row.status === 'approved')
        .map((row) => ({
          id: String(row.id ?? row.template_id ?? ''),
          name: String(row.template_name ?? row.name ?? row.friendly_name ?? row.id ?? ''),
          language: String(row.language_code ?? row.language ?? row.locale ?? ''),
          status: String(row.status ?? ''),
          variables: templateVariables(templateJson(row.variables_json ?? row.variables)),
          body: String(
            row.body ??
              row.content ??
              (Array.isArray(templateJson(row.components_json ?? row.components))
                ? (
                    (templateJson(row.components_json ?? row.components) as unknown[]).find(
                      (component) =>
                        asObject(component).type === 'BODY' &&
                        typeof asObject(component).text === 'string'
                    ) as Record<string, unknown> | undefined
                  )?.text
                : '') ??
              ''
          ),
        }))
        .filter((template) => template.id)
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    void Promise.all([loadJobs(), loadTemplates()])
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar Comunicaciones.');
      })
      .finally(() => setLoading(false));
  }, [loadJobs, loadTemplates]);

  useEffect(() => {
    if (previewExpiresAt === null) {
      setSecondsRemaining(null);
      return;
    }
    const update = () =>
      setSecondsRemaining(Math.max(0, Math.ceil((previewExpiresAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [previewExpiresAt]);

  const editDraft = (change: () => void) => {
    change();
    setIdempotencyKey(crypto.randomUUID());
    setPreviewResponse(null);
    setPreviewExpiresAt(null);
    setFreshPreviewJobId(null);
    setFreshPreviewJobId(null);
  };

  const startNewJob = () => {
    setChannel('whatsapp');
    setDelegation('all');
    setSize('all');
    setSector('all');
    setConsentFilter('authorized');
    setTemplateId('');
    setVariables({});
    setSubject('');
    setMessageBody('');
    setIdempotencyKey(crypto.randomUUID());
    setPreviewResponse(null);
    setPreviewExpiresAt(null);
    setFreshPreviewJobId(null);
    setError('');
    setSection('compose');
  };

  const refreshPreview = async () => {
    if (!canManage || !idempotencyKey || selectedIds.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/comms/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          contact_ids: selectedIds,
          dry_run: true,
          idempotency_key: idempotencyKey,
          ...(channel === 'whatsapp' ? { template_id: templateId, variables } : {}),
          ...(channel === 'email' ? { subject, body: messageBody } : {}),
          ...(channel === 'voice_ai' ? { script: messageBody } : {}),
        }),
      });
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok)
        throw new Error(String(data.error || 'No se pudo generar la vista previa.'));
      const previewData = { ...asObject(data.preview), ...data };
      const expiry = readExpiry(previewData.preview_ttl);
      setPreviewResponse(previewData);
      setPreviewExpiresAt(expiry);
      const jobId = nestedValue(data, 'job_id');
      if (typeof jobId === 'string') {
        setFreshPreviewJobId(jobId);
        setSelectedJob({
          job_id: jobId,
          channel,
          audience_size: selectedIds.length,
          status: 'pending_approval',
          cost_estimate: data.cost_estimate,
          preview: data.preview ?? data,
          detail: data,
          receipt: null,
          created_at: new Date().toISOString(),
        });
        await loadJobs();
      }
      setSection('preview');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo generar la vista previa.');
    } finally {
      setLoading(false);
    }
  };

  const openJob = async (job: CommsJob) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/comms/jobs/${encodeURIComponent(job.job_id)}`);
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw new Error(String(data.error || 'No se pudo cargar el trabajo.'));
      setPreviewResponse(null);
      setPreviewExpiresAt(null);
      setFreshPreviewJobId(null);
      const updated = {
        ...job,
        status: String(nestedValue(data, 'status') ?? job.status),
        detail: data,
        receipt: data.receipt_error ? null : (nestedValue(data, 'receipt') ?? job.receipt),
        preview: nestedValue(data, 'preview') ?? job.preview,
        cost_estimate: nestedValue(data, 'cost_estimate') ?? job.cost_estimate,
      };
      setSelectedJob(updated);
      setPreviewResponse(null);
      setPreviewExpiresAt(null);
      setFreshPreviewJobId(null);
      setSection('detail');
      await loadJobs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el trabajo.');
    } finally {
      setLoading(false);
    }
  };

  const refreshStoredPreview = async () => {
    if (!selectedJob || !canManage) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/comms/jobs/${encodeURIComponent(selectedJob.job_id)}/preview`,
        { method: 'POST' }
      );
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok)
        throw new Error(String(data.error || 'No se pudo renovar la vista previa.'));
      const previewData = { ...asObject(data.preview), ...data };
      const expiry = readExpiry(previewData.preview_ttl);
      setPreviewResponse(previewData);
      setPreviewExpiresAt(expiry);
      setFreshPreviewJobId(selectedJob.job_id);
      setSelectedJob({
        ...selectedJob,
        status: 'pending_approval',
        preview: data.preview ?? data,
        detail: data,
        cost_estimate: data.cost_estimate ?? selectedJob.cost_estimate,
      });
      setSection('preview');
      await loadJobs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo renovar la vista previa.');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action: 'approve' | 'pause' | 'resume') => {
    if (!selectedJob || !canManage) return;
    if (
      action === 'approve' &&
      (!previewResponse ||
        freshPreviewJobId !== selectedJob.job_id ||
        typeof previewResponse.preview_revision !== 'string' ||
        secondsRemaining === null ||
        secondsRemaining <= 0)
    ) {
      setError('La vista previa venció o no está disponible. Genera otra antes de aprobar.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/comms/jobs/${encodeURIComponent(selectedJob.job_id)}/${action}`,
        {
          method: 'POST',
          ...(action === 'approve'
            ? {
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preview_revision: previewResponse?.preview_revision }),
              }
            : {}),
        }
      );
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw new Error(String(data.error || 'No se pudo actualizar el trabajo.'));
      const status = String(
        data.status ??
          (action === 'approve' ? 'approved' : action === 'pause' ? 'paused' : 'running')
      );
      setSelectedJob({ ...selectedJob, status, detail: data });
      if (action === 'approve') setSection('detail');
      await loadJobs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el trabajo.');
    } finally {
      setLoading(false);
    }
  };

  const canApprove =
    canManage &&
    Boolean(selectedJob?.job_id) &&
    freshPreviewJobId === selectedJob?.job_id &&
    previewResponse !== null &&
    typeof previewResponse.preview_revision === 'string' &&
    previewResponse.preview_revision.length > 0 &&
    secondsRemaining !== null &&
    secondsRemaining > 0;
  const receiptError = asObject(selectedJob?.detail).receipt_error;
  const displayReceipt = receiptError
    ? null
    : (selectedJob?.receipt ??
      nestedValue(selectedJob?.detail, 'receipt') ??
      nestedValue(selectedJob?.detail, 'summary'));
  const initialLead = initialLeadId ? leads.find((lead) => lead.id === initialLeadId) : undefined;
  const visibleJobs = initialLeadId
    ? jobs.filter((job) => job.ledger_contact_ids?.includes(initialLeadId))
    : jobs;

  return (
    <section className="space-y-5 rounded-2xl border border-henequen-arena bg-white p-4 text-henequen-grafito shadow-sm sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-henequen-arena pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={section === 'jobs' ? onBack : () => setSection('jobs')}
            className="rounded-lg border border-henequen-arena p-2 text-henequen-anil hover:bg-henequen-cal"
            aria-label={section === 'jobs' ? 'Volver al padrón' : 'Volver a trabajos'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-henequen-terra">
              CANACO SERVYTUR Mérida · CRM
            </p>
            <h1 className="font-fraunces text-2xl font-bold text-henequen-anil">Comunicaciones</h1>
          </div>
        </div>
        {section === 'jobs' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadJobs().catch((cause: unknown) => setError(String(cause)))}
              className="inline-flex items-center gap-2 rounded-lg border border-henequen-arena px-3 py-2 text-xs font-semibold"
            >
              <RefreshCw size={14} /> Actualizar
            </button>
            <button
              type="button"
              onClick={startNewJob}
              disabled={!canManage}
              className="inline-flex items-center gap-2 rounded-lg bg-henequen-anil px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              <Plus size={14} /> Nuevo trabajo
            </button>
          </div>
        )}
      </header>

      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-relaxed text-sky-950">
        <div className="flex items-start gap-2">
          <Clock3 size={15} className="mt-0.5 shrink-0" />
          <p>
            Los envíos respetan el horario CDMX de 08:00 a 21:00. Los contactos en horario
            restringido se difieren a la siguiente ventana; no se descartan.
            {quietHours && (
              <strong className="mt-1 block">
                Ahora es horario restringido: los destinos se diferirán.
              </strong>
            )}
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {section === 'jobs' && (
        <div className="space-y-3">
          {initialLead && (
            <div className="rounded-xl border border-henequen-anil/20 bg-henequen-cal/60 p-3 text-xs">
              <strong>Historial de comunicaciones:</strong> {initialLead.web || 'Socio'}
              <span className="ml-2 font-semibold">
                · Sales: {initialLead.sales_share_consent === 1 ? 'autorizado' : 'sin autorización'}
              </span>
            </div>
          )}
          <div className="overflow-x-auto rounded-xl border border-henequen-arena">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-henequen-cal text-henequen-piedra">
                <tr>
                  <th className="p-3">Trabajo</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Audiencia</th>
                  <th className="p-3">Costo devuelto</th>
                  <th className="p-3">Creado</th>
                  <th className="p-3"> </th>
                </tr>
              </thead>
              <tbody>
                {visibleJobs.map((job) => (
                  <tr key={job.job_id} className="border-t border-henequen-arena">
                    <td className="p-3 font-mono">{job.job_id}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-henequen-sisal px-2 py-1">{job.status}</span>
                    </td>
                    <td className="p-3">{job.audience_size}</td>
                    <td className="max-w-40 whitespace-pre-wrap break-words p-3 text-[10px]">
                      {formatExact(job.cost_estimate)}
                    </td>
                    <td className="p-3">{new Date(job.created_at).toLocaleString('es-MX')}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="font-semibold underline"
                        onClick={() => void openJob(job)}
                      >
                        Detalle
                      </button>
                    </td>
                  </tr>
                ))}
                {!visibleJobs.length && !loading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-henequen-piedra">
                      {initialLead
                        ? 'No hay trabajos de comunicaciones registrados para este socio.'
                        : 'No hay trabajos registrados en el CRM.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && (
            <LoaderCircle className="mx-auto animate-spin text-henequen-anil" size={20} />
          )}
          <p className="text-[11px] text-henequen-piedra">
            El estado, costo y recibo son devueltos por Sales; Ledger conserva el índice y el recibo
            en D1.
          </p>
        </div>
      )}

      {section === 'compose' && (
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-henequen-arena p-4">
              <h2 className="font-fraunces text-lg font-bold text-henequen-anil">
                1. Audiencia del padrón
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold">
                  Delegación
                  <select
                    value={delegation}
                    onChange={(event) => editDraft(() => setDelegation(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-henequen-arena bg-white p-2"
                  >
                    <option value="all">Todas</option>
                    <option value="unassigned">Sin delegación</option>
                    {delegaciones.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold">
                  Estrato / tamaño
                  <select
                    value={size}
                    onChange={(event) => editDraft(() => setSize(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-henequen-arena bg-white p-2"
                  >
                    <option value="all">Todos</option>
                    <option value="micro">Micro</option>
                    <option value="pequena">Pequeña</option>
                    <option value="mediana">Mediana</option>
                    <option value="grande">Grande</option>
                  </select>
                </label>
                <label className="text-xs font-semibold">
                  Sector
                  <select
                    value={sector}
                    onChange={(event) => editDraft(() => setSector(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-henequen-arena bg-white p-2"
                  >
                    <option value="all">Todos</option>
                    <option value="comercio">Comercio</option>
                    <option value="servicios">Servicios</option>
                    <option value="turismo">Turismo</option>
                  </select>
                </label>
                <label className="text-xs font-semibold">
                  Estado de consentimiento
                  <select
                    value={consentFilter}
                    onChange={(event) =>
                      editDraft(() =>
                        setConsentFilter(event.target.value as 'authorized' | 'no-consent')
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-henequen-arena bg-white p-2"
                  >
                    <option value="authorized">Con autorización para compartir</option>
                    <option value="no-consent">Sin autorización (excluidos)</option>
                  </select>
                </label>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
                <ShieldCheck size={17} /> {selectedIds.length} contactos elegibles seleccionados
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-henequen-piedra">
                Registros de demo y personas sin consentimiento de privacidad y autorización para
                compartir nunca se incluyen. Esta cifra es el padrón filtrado, no una estimación de
                entrega; el worker devuelve las cifras finales.
              </p>
            </div>

            <div className="rounded-xl border border-henequen-arena p-4">
              <h2 className="font-fraunces text-lg font-bold text-henequen-anil">
                2. Canal y contenido
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {CHANNELS.map((item) => {
                  const Icon =
                    item.id === 'email'
                      ? Mail
                      : item.id === 'voice_ai'
                        ? PhoneCall
                        : MessageSquareText;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      disabled={item.id === 'voice_ai'}
                      onClick={() => editDraft(() => setChannel(item.id))}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-xs font-semibold disabled:opacity-50 ${channel === item.id ? 'border-henequen-anil bg-henequen-anil text-white' : 'border-henequen-arena'}`}
                    >
                      <Icon size={14} /> {item.label}
                    </button>
                  );
                })}
              </div>
              {channel === 'whatsapp' && (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold">
                    Plantilla HSM aprobada
                    <select
                      value={templateId}
                      onChange={(event) =>
                        editDraft(() => {
                          setTemplateId(event.target.value);
                          setVariables({});
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-henequen-arena bg-white p-2"
                    >
                      <option value="">Selecciona una plantilla aprobada</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} · {template.language}
                        </option>
                      ))}
                    </select>
                  </label>
                  {activeTemplate?.variables.map((item) => {
                    const name = variableName(item);
                    return (
                      <label key={name} className="block text-xs font-semibold">
                        Variable · {name}
                        <input
                          value={variables[name] || ''}
                          onChange={(event) =>
                            editDraft(() =>
                              setVariables({ ...variables, [name]: event.target.value })
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-henequen-arena p-2"
                        />
                      </label>
                    );
                  })}
                  {!templates.length && (
                    <p className="text-xs text-amber-800">
                      Sales no devolvió plantillas aprobadas. No se permite usar una plantilla no
                      aprobada.
                    </p>
                  )}
                  {activeTemplate && (
                    <div className="rounded-lg bg-henequen-cal p-3 text-xs">
                      <strong>
                        Vista para {sampleContact?.contacto_nombre || 'contacto de muestra'}
                      </strong>
                      <p className="mt-2 whitespace-pre-wrap">
                        {interpolate(activeTemplate.body, variables, sampleContact) ||
                          previewText ||
                          `Plantilla ${activeTemplate.name} · ${activeTemplate.language}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {channel === 'email' && (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold">
                    Asunto
                    <input
                      value={subject}
                      onChange={(event) => editDraft(() => setSubject(event.target.value))}
                      className="mt-1 w-full rounded-lg border border-henequen-arena p-2"
                    />
                  </label>
                  <label className="block text-xs font-semibold">
                    Cuerpo
                    <textarea
                      value={messageBody}
                      onChange={(event) => editDraft(() => setMessageBody(event.target.value))}
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-henequen-arena p-2"
                    />
                  </label>
                  <div className="rounded-lg bg-henequen-cal p-3 text-xs">
                    <strong>Vista previa</strong>
                    <p className="mt-2">Asunto: {subject}</p>
                    <p className="mt-2 whitespace-pre-wrap">{messageBody}</p>
                    <p className="mt-2">El correo no admite variables de contacto.</p>
                  </div>
                </div>
              )}
              {channel === 'voice_ai' && (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold">
                    Guion de Voice AI
                    <textarea
                      value={messageBody}
                      onChange={(event) => editDraft(() => setMessageBody(event.target.value))}
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-henequen-arena p-2"
                    />
                  </label>
                  <div className="rounded-lg bg-henequen-cal p-3 text-xs">
                    <strong>
                      Vista previa para {sampleContact?.contacto_nombre || 'contacto de muestra'}
                    </strong>
                    <p className="mt-2 whitespace-pre-wrap">{previewText}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="h-fit space-y-4 rounded-xl border border-henequen-arena bg-henequen-cal p-4">
            <h2 className="font-fraunces text-lg font-bold text-henequen-anil">
              Revisión antes de previsualizar
            </h2>
            <p className="text-xs leading-relaxed">
              El envío queda en <strong>pending_approval</strong>. Ningún mensaje se envía al
              componer o previsualizar. Editar el borrador genera una clave de idempotencia nueva.
            </p>
            {quietHours && (
              <p className="rounded-lg bg-amber-100 p-3 text-xs text-amber-950">
                Horario restringido ahora; los destinos se diferirán a la siguiente ventana.
              </p>
            )}
            <button
              type="button"
              onClick={() => void refreshPreview()}
              disabled={
                !canManage ||
                loading ||
                selectedIds.length === 0 ||
                (channel === 'whatsapp' && !templateId) ||
                (channel === 'whatsapp' &&
                  activeTemplate?.variables.some(
                    (item) => !variables[variableName(item)]?.trim()
                  )) ||
                (channel === 'email' &&
                  (!subject.trim() || !messageBody.trim() || unsupportedEmailVariables)) ||
                (channel === 'voice_ai' && !messageBody.trim())
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-henequen-terra px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Generar vista previa dry-run
            </button>
            {!canManage && (
              <p className="text-xs text-red-800">
                Tu sesión no tiene permiso para crear o aprobar trabajos.
              </p>
            )}
          </aside>
        </div>
      )}

      {section === 'preview' && previewResponse && (
        <div className="space-y-4">
          <h2 className="font-fraunces text-xl font-bold text-henequen-anil">
            3. Vista previa dry-run
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['would_send', 'excluded_by_rule', 'deferred', 'cost_estimate'] as const).map(
              (field) => (
                <div key={field} className="rounded-xl border border-henequen-arena p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-henequen-piedra">
                    {field}
                  </h3>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs">
                    {formatExact(previewResponse[field])}
                  </pre>
                </div>
              )
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-henequen-cal p-4">
            <div>
              <p className="text-xs font-bold">Vencimiento de la vista previa</p>
              <p className="mt-1 font-mono text-sm">
                {previewExpiresAt
                  ? secondsRemaining
                    ? `${secondsRemaining}s restantes · ${new Date(previewExpiresAt).toLocaleTimeString('es-MX')}`
                    : 'Vencida'
                  : formatExact(previewResponse.preview_ttl)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refreshPreview()}
                disabled={loading || !canManage}
                className="rounded-lg border border-henequen-anil px-3 py-2 text-xs font-bold"
              >
                Re-previsualizar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSection('compose');
                  setIdempotencyKey(crypto.randomUUID());
                  setPreviewResponse(null);
                  setPreviewExpiresAt(null);
                  setFreshPreviewJobId(null);
                }}
                className="rounded-lg border border-henequen-arena px-3 py-2 text-xs font-semibold"
              >
                Editar · nuevo borrador
              </button>
              <button
                type="button"
                onClick={() => setSection('approval')}
                disabled={!canApprove || loading}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                Revisar aprobación
              </button>
            </div>
          </div>
          <p className="text-[11px] text-henequen-piedra">
            La aprobación requiere vista previa vigente; el worker revalida TTL y reglas al aprobar.
          </p>
        </div>
      )}

      {section === 'approval' && selectedJob && previewResponse && (
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
            <h2 className="font-fraunces text-xl font-bold text-amber-950">
              4. Aprobación humana requerida
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-950">
              Autorizar este trabajo permite a Ark Sales iniciar el despacho. Ledger no envía
              mensajes. Al aprobar, el borrador queda bloqueado y no se puede editar.
            </p>
          </div>
          <dl className="grid gap-3 rounded-xl border border-henequen-arena p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-henequen-piedra">Trabajo</dt>
              <dd className="mt-1 break-all font-mono">{selectedJob.job_id}</dd>
            </div>
            <div>
              <dt className="text-xs text-henequen-piedra">Estado</dt>
              <dd className="mt-1 font-semibold">{selectedJob.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-henequen-piedra">Vigencia de la vista previa</dt>
              <dd className="mt-1 font-mono">
                {secondsRemaining && secondsRemaining > 0
                  ? `${secondsRemaining}s restantes`
                  : 'Vencida'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-henequen-piedra">Costo devuelto por el worker</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-xs">
                {formatExact(previewResponse.cost_estimate)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setSection('preview')}
              className="rounded-lg border border-henequen-arena px-4 py-2 text-xs font-semibold"
            >
              Volver a la vista previa
            </button>
            <button
              type="button"
              onClick={() => void runAction('approve')}
              disabled={!canApprove || loading}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              Aprobar y autorizar envío
            </button>
          </div>
          {!canApprove && (
            <p role="alert" className="text-right text-xs text-red-800">
              Solo se puede aprobar este trabajo con una vista previa vigente.
            </p>
          )}
        </div>
      )}

      {section === 'detail' && selectedJob && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-fraunces text-xl font-bold text-henequen-anil">
                Detalle del trabajo
              </h2>
              <p className="font-mono text-xs">
                {selectedJob.job_id} · {selectedJob.status}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedJob.status === 'pending_approval' && (
                <button
                  type="button"
                  onClick={() => void refreshStoredPreview()}
                  disabled={!canManage || loading}
                  className="rounded-lg border border-henequen-anil px-3 py-2 text-xs font-bold"
                >
                  Renovar vista previa
                </button>
              )}
              {selectedJob.status === 'pending_approval' && (
                <button
                  type="button"
                  onClick={() => void runAction('approve')}
                  disabled={!canApprove || loading}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  Aprobar
                </button>
              )}
              {selectedJob.status === 'running' && (
                <button
                  type="button"
                  onClick={() => void runAction('pause')}
                  disabled={!canManage || loading}
                  className="rounded-lg border px-3 py-2 text-xs font-bold"
                >
                  Pausar
                </button>
              )}
              {selectedJob.status === 'paused' && (
                <button
                  type="button"
                  onClick={() => void runAction('resume')}
                  disabled={!canManage || loading}
                  className="rounded-lg border px-3 py-2 text-xs font-bold"
                >
                  Reanudar
                </button>
              )}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-henequen-arena p-4">
              <h3 className="font-bold">Vista previa recibida</h3>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">
                {formatExact(selectedJob.preview)}
              </pre>
            </div>
            <div className="rounded-xl border border-henequen-arena p-4">
              <h3 className="font-bold">Recibo · resultados y costo real</h3>
              {typeof receiptError === 'string' ? (
                <p className="mt-2 text-xs text-red-700">{receiptError}</p>
              ) : displayReceipt ? (
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">
                  {formatExact(displayReceipt)}
                </pre>
              ) : (
                <p className="mt-2 text-xs text-henequen-piedra">
                  El worker aún no ha registrado un recibo.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-henequen-arena p-4">
            <h3 className="font-bold">Detalle devuelto por Sales</h3>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs">
              {formatExact(selectedJob.detail)}
            </pre>
          </div>
        </div>
      )}
      {loading && section !== 'jobs' && (
        <LoaderCircle className="mx-auto animate-spin text-henequen-anil" size={20} />
      )}
    </section>
  );
}

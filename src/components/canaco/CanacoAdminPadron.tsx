/**
 * CANACO SERVYTUR MÉRIDA — Consola interna de registros de afiliación
 *
 * Panel de control para la Dirección de Afiliaciones y Tesorería de la Cámara.
 * Permite consultar los registros internos de CANACO y exportarlos para revisión.
 *
 * Usuario Administrador Designado: horus.i2d@gmail.com
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Download,
  RefreshCw,
  Search,
  MessageSquare,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  FilterX,
  UserPlus,
  FileText,
  DollarSign,
  Radio,
  Crown,
  PhoneCall,
  X,
  Inbox,
  Compass,
  Calculator,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useOptionalAuth } from '@/context/AuthContext';
import { CanacoLogo } from '@/components/brand/CanacoLogo';
import { ConstanciaSocioModal } from './ConstanciaSocioModal';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';
import { AdminExpedienteModal } from './AdminExpedienteModal';
import { CanacoComunicaciones } from './CanacoComunicaciones';
import type { SocioCanacoRegistro } from './types';
import {
  calcularCuotaAfiliacion,
  determinarEstrato,
  extraerNumEmpleados,
  generarFolioIntegridad,
} from './calculoCuota';

interface LeadRow {
  id: string;
  web: string | null;
  whatsapp: string | null;
  email: string | null;
  ciudad: string | null;
  especialidad: string | null;
  status: string | null;
  lifecycle_stage?: string | null;
  is_demo?: number | null;
  consent_aviso_version?: string | null;
  consent_accepted_at?: string | null;
  consent_medium?: string | null;
  arkangel_share_consent?: number | null;
  sales_share_consent?: number | null;
  sales_consent_accepted_at?: string | null;
  origin?: string | null;
  payment_environment?: string | null;
  canonical_rfc?: string | null;
  verified_payment_amount_cents?: number | null;
  verified_payment_channel?: string | null;
  verified_payment_environment?: string | null;
  verified_payment_rfc?: string | null;
  verified_payment_folio_siem?: string | null;
  verified_payment_razon_social?: string | null;
  verified_payment_num_empleados?: number | null;
  verified_payment_sector?: string | null;
  last_contact: string | null;
  contacto_nombre: string | null;
  notas: string | null;
}

interface Delegacion {
  id: string;
  nombre: string;
  registros: number;
  socios_activos: number;
  con_contacto: number;
}

interface DelegacionesData {
  delegaciones: Delegacion[];
  asignaciones: Array<{ lead_id: string; delegacion_id: string }>;
  sinAsignar: number;
}

interface ArcoRequestRow {
  id: string;
  requester_email: string;
  right_requested: string;
  status: string;
  assigned_to: string;
  response_due_at: string;
  execution_due_at: string | null;
}

function getConfirmedPaymentAmount(lead: LeadRow): number | null {
  const employees = lead.verified_payment_num_empleados;
  const sector = lead.verified_payment_sector;
  if (
    lead.lifecycle_stage !== 'socio_activo' ||
    lead.status !== 'Socio Activo' ||
    lead.payment_environment !== 'production' ||
    lead.verified_payment_environment !== 'production' ||
    !lead.canonical_rfc ||
    lead.verified_payment_rfc !== lead.canonical_rfc ||
    !employees ||
    !['comercio', 'servicios', 'turismo'].includes(sector || '') ||
    lead.verified_payment_amount_cents == null ||
    !Number.isInteger(lead.verified_payment_amount_cents)
  ) {
    return null;
  }
  const expected = calcularCuotaAfiliacion(
    employees,
    sector as SocioCanacoRegistro['sector']
  ).totalAnual;
  const amountCents = lead.verified_payment_amount_cents;
  return amountCents === Math.round(expected * 100) ? amountCents / 100 : null;
}

interface CanacoAdminPadronProps {
  onNavigateToSuite?: () => void;
}

export function CanacoAdminPadron({ onNavigateToSuite }: CanacoAdminPadronProps = {}) {
  const auth = useOptionalAuth();
  const isSuperAdmin = auth?.platformRole === 'super_admin';
  const isPavel = auth?.user?.email?.toLowerCase() === 'pavel@arksystems.site';
  const delegacionesHabilitadas =
    import.meta.env.VITE_CANACO_DELEGACIONES === 'true' &&
    (isSuperAdmin ||
      auth?.tenants.some((tenant) => tenant.id === 'canaco_merida' && tenant.role !== 'member'));
  const [delegaciones, setDelegaciones] = useState<DelegacionesData | null>(null);
  const [delegacionesError, setDelegacionesError] = useState<string | null>(null);
  const [nombreDelegacion, setNombreDelegacion] = useState('');
  const [filtroDelegacion, setFiltroDelegacion] = useState('todas');
  const [guardandoDelegacion, setGuardandoDelegacion] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'padron' | 'comunicaciones'>('padron');
  const [commsLeadId, setCommsLeadId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');
  const [filtroSector, setFiltroSector] = useState<string>('todos');
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioCanacoRegistro | null>(null);
  const [expedienteAdminSocio, setExpedienteAdminSocio] = useState<LeadRow | null>(null);
  const [modalAltaOpen, setModalAltaOpen] = useState(false);
  const [modalRecordatorioMasivoOpen, setModalRecordatorioMasivoOpen] = useState(false);
  const [syncingArkangel, setSyncingArkangel] = useState(false);
  const [arkangelPreview, setArkangelPreview] = useState<{
    approvalId: string;
    expiresAt: string;
    rows: Array<{
      id: string;
      nombre: string;
      telefono: string;
      email: string;
      rfc: string;
      monto: number;
    }>;
    excludedLeadIds: string[];
    channels: string[];
    content: string;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [arcoRequests, setArcoRequests] = useState<ArcoRequestRow[]>([]);
  const [arcoError, setArcoError] = useState<string | null>(null);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem('canaco_admin_guide_dismissed') !== 'true';
    } catch {
      return true;
    }
  });
  const [syncFeedback, setSyncFeedback] = useState<{
    tipo: 'success' | 'error';
    mensaje: string;
  } | null>(null);
  const canManageComms =
    isPavel ||
    auth?.user?.email?.toLowerCase() === 'horus.i2d@gmail.com' ||
    auth?.tenants.some((tenant) => tenant.id === 'canaco_merida' && tenant.role !== 'member') ||
    false;

  // Enviar al proveedor solo los registros que pasen la validación del servidor.
  const handleSyncArkangel = async () => {
    if (!isPavel) return;
    setSyncingArkangel(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/canaco/sync-arkangel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview' }),
      });
      const data = (await res.json()) as any;
      if (res.ok && data.ok && data.approvalId && data.preview) {
        setArkangelPreview({
          approvalId: data.approvalId,
          expiresAt: data.expiresAt,
          rows: data.preview.rows,
          excludedLeadIds: data.preview.excludedLeadIds,
          channels: data.preview.channels,
          content: data.preview.content,
        });
        return;
      } else {
        setSyncFeedback({
          tipo: 'error',
          mensaje: data.error || 'Error al preparar la vista previa de Arkangel.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        tipo: 'error',
        mensaje: `Fallo de red al invocar Arkangel: ${err.message}`,
      });
    } finally {
      setSyncingArkangel(false);
    }
  };

  const handleDispatchArkangel = async () => {
    if (!isPavel || !arkangelPreview) return;
    setSyncingArkangel(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/canaco/sync-arkangel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch',
          approvalId: arkangelPreview.approvalId,
        }),
      });
      const data = (await res.json()) as any;
      if (res.ok && data.ok) {
        setSyncFeedback({
          tipo: 'success',
          mensaje: data.simulated
            ? `Validación simulada: ${data.socios_enviados} registro(s), $${Number(data.monto_total_cartera || 0).toLocaleString('es-MX')} MXN. No se envió ningún mensaje.`
            : `Lote enviado al proveedor Arkangel: ${data.socios_enviados} registro(s), $${Number(data.monto_total_cartera || 0).toLocaleString('es-MX')} MXN. Esta respuesta no confirma la entrega de mensajes.`,
        });
        setArkangelPreview(null);
        setModalRecordatorioMasivoOpen(false);
        await cargarPadron();
      } else {
        setSyncFeedback({
          tipo: 'error',
          mensaje: data.error || data.mensaje || 'Error al conectar con Arkangel.',
        });
      }
    } catch (err) {
      setSyncFeedback({
        tipo: 'error',
        mensaje:
          err instanceof Error
            ? `Fallo de red al invocar Arkangel: ${err.message}`
            : 'Fallo de red al invocar Arkangel.',
      });
    } finally {
      setSyncingArkangel(false);
    }
  };

  const handleReverseAffiliation = async (lead: LeadRow) => {
    const reason = window.prompt(
      'Motivo documentado para revertir la afiliación (el reembolso se gestiona por separado):'
    );
    if (!reason?.trim()) return;

    try {
      const response = await fetch('/api/afiliaciones/reversar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, reason: reason.trim() }),
      });
      const data = (await response.json()) as { error?: string; refundProcessed?: boolean };
      if (!response.ok) throw new Error(data.error || 'No se pudo revertir la afiliación.');
      setSyncFeedback({
        tipo: 'success',
        mensaje:
          'Afiliación revertida en Ledger. El reembolso no se procesó y requiere gestión aparte.',
      });
      await cargarPadron();
    } catch (error) {
      setSyncFeedback({
        tipo: 'error',
        mensaje: error instanceof Error ? error.message : 'No se pudo revertir la afiliación.',
      });
    }
  };

  const [updatingSalesConsentId, setUpdatingSalesConsentId] = useState<string | null>(null);

  const handleSalesConsent = async (lead: LeadRow, authorized: boolean) => {
    if (lead.is_demo === 1) {
      setSyncFeedback({
        tipo: 'error',
        mensaje: 'Los contactos de demostración no pueden autorizar Comunicaciones.',
      });
      return;
    }
    setUpdatingSalesConsentId(lead.id);
    try {
      const response = await fetch(
        `/api/admin/leads/${encodeURIComponent(lead.id)}?tenant=canaco_merida`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sales_share_consent: authorized }),
        }
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el consentimiento de Sales.');
      }
      setSyncFeedback({
        tipo: 'success',
        mensaje: authorized
          ? 'Consentimiento de Sales autorizado para Comunicaciones.'
          : 'Consentimiento de Sales retirado. El socio quedó excluido.',
      });
      await cargarPadron();
    } catch (error) {
      setSyncFeedback({
        tipo: 'error',
        mensaje:
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar el consentimiento de Sales.',
      });
    } finally {
      setUpdatingSalesConsentId(null);
    }
  };

  // Cargar comercios del tenant CANACO
  const cargarPadron = useCallback(async () => {
    setLoading(true);
    try {
      const registros: LeadRow[] = [];
      let offset = 0;
      let page: LeadRow[];
      do {
        const res = await fetch(
          delegacionesHabilitadas
            ? `/api/admin/leads?tenant=canaco_merida&limit=100&offset=${offset}`
            : '/api/admin/leads?tenant=canaco_merida'
        );
        if (!res.ok) throw new Error('No se pudo consultar el CRM de CANACO.');
        const data = (await res.json()) as { leads?: LeadRow[] };
        if (!Array.isArray(data.leads)) throw new Error('Respuesta inválida del CRM de CANACO.');
        page = data.leads;
        registros.push(...page);
        offset += page.length;
      } while (delegacionesHabilitadas && page.length === 100);
      setLeads(registros);
      setLoadError(null);
    } catch (error) {
      setLeads([]);
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el CRM de CANACO.');
    } finally {
      setLoading(false);
    }
  }, [delegacionesHabilitadas]);

  const cargarDelegaciones = async () => {
    try {
      const response = await fetch('/api/canaco/delegaciones');
      const data = (await response.json()) as DelegacionesData & { error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las delegaciones.');
      setDelegaciones(data);
      setDelegacionesError(null);
    } catch (error) {
      setDelegacionesError(
        error instanceof Error ? error.message : 'Error al cargar delegaciones.'
      );
    }
  };

  const crearDelegacion = async (event: React.FormEvent) => {
    event.preventDefault();
    setGuardandoDelegacion(true);
    try {
      const response = await fetch('/api/canaco/delegaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreDelegacion }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la delegación.');
      setNombreDelegacion('');
      await cargarDelegaciones();
    } catch (error) {
      setDelegacionesError(error instanceof Error ? error.message : 'Error al crear delegación.');
    } finally {
      setGuardandoDelegacion(false);
    }
  };

  const asignarDelegacion = async (leadId: string, delegacionId: string) => {
    setGuardandoDelegacion(true);
    try {
      const response = await fetch(
        `/api/canaco/delegaciones/asignaciones/${encodeURIComponent(leadId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delegacionId: delegacionId || null }),
        }
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudo asignar la delegación.');
      await cargarDelegaciones();
    } catch (error) {
      setDelegacionesError(error instanceof Error ? error.message : 'Error al asignar delegación.');
    } finally {
      setGuardandoDelegacion(false);
    }
  };

  const cargarSolicitudesArco = async () => {
    try {
      const response = await fetch('/api/afiliaciones/arco');
      const data = (await response.json()) as {
        requests?: ArcoRequestRow[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || 'No se pudo consultar la cola ARCO.');
      setArcoRequests(data.requests || []);
      setArcoError(null);
    } catch (error) {
      setArcoError(error instanceof Error ? error.message : 'No se pudo consultar la cola ARCO.');
    }
  };

  const actualizarSolicitudArco = async (item: ArcoRequestRow, status: string) => {
    const completionNotes =
      status === 'completed' || status === 'rejected'
        ? window.prompt('Nota de resolución y confirmación enviada al solicitante:')?.trim()
        : undefined;
    if ((status === 'completed' || status === 'rejected') && !completionNotes) return;
    try {
      const response = await fetch(`/api/afiliaciones/arco/${encodeURIComponent(item.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, completionNotes }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la solicitud ARCO.');
      await cargarSolicitudesArco();
    } catch (error) {
      setArcoError(
        error instanceof Error ? error.message : 'No se pudo actualizar la solicitud ARCO.'
      );
    }
  };

  useEffect(() => {
    void cargarPadron();
    if (delegacionesHabilitadas) void cargarDelegaciones();
    if (isSuperAdmin || auth?.user?.email?.toLowerCase() === 'horus.i2d@gmail.com') {
      void cargarSolicitudesArco();
    }
  }, [auth?.user?.email, isSuperAdmin, delegacionesHabilitadas, cargarPadron]);

  // KPIs
  const kpis = useMemo(() => {
    const reportableLeads = leads.filter((lead) => {
      if (lead.is_demo === 1) return false;
      const asignacion = delegaciones?.asignaciones.find((item) => item.lead_id === lead.id);
      return (
        filtroDelegacion === 'todas' ||
        (filtroDelegacion === 'sin-asignar' && !asignacion) ||
        asignacion?.delegacion_id === filtroDelegacion
      );
    });
    const stageCounts = reportableLeads.reduce(
      (counts, lead) => {
        const stage = lead.lifecycle_stage || 'prospecto';
        if (stage in counts) counts[stage as keyof typeof counts] += 1;
        return counts;
      },
      { prospecto: 0, registrado: 0, pago_pendiente: 0, socio_activo: 0, cancelado: 0 }
    );
    const total = reportableLeads.length;
    const activos = reportableLeads.filter(
      (lead) => getConfirmedPaymentAmount(lead) !== null
    ).length;
    const pendientes = total - activos;

    const recaudacion = reportableLeads.reduce((acc, l) => {
      return acc + (getConfirmedPaymentAmount(l) || 0);
    }, 0);

    // Cartera pendiente de cobro
    const carteraPendiente = reportableLeads.reduce((acc, l) => {
      if (getConfirmedPaymentAmount(l) !== null) return acc;
      const employees = extraerNumEmpleados(l.notas);
      const sector = l.especialidad;
      if (!employees || !['comercio', 'servicios', 'turismo'].includes(sector || '')) return acc;
      const expected = calcularCuotaAfiliacion(
        employees,
        sector as SocioCanacoRegistro['sector']
      ).totalAnual;
      return acc + expected;
    }, 0);

    return { total, activos, pendientes, recaudacion, carteraPendiente, stageCounts };
  }, [leads, filtroDelegacion, delegaciones]);

  // Filtros
  const comerciosFiltrados = useMemo(() => {
    return leads.filter((lead) => {
      if (lead.is_demo === 1) return false;
      const matchTexto =
        !busqueda ||
        (lead.web && lead.web.toLowerCase().includes(busqueda.toLowerCase())) ||
        (lead.contacto_nombre &&
          lead.contacto_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (lead.notas && lead.notas.toLowerCase().includes(busqueda.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(busqueda.toLowerCase())) ||
        (lead.whatsapp && lead.whatsapp.includes(busqueda));

      const matchEstatus =
        filtroEstatus === 'todos' ||
        (filtroEstatus === 'activos' && getConfirmedPaymentAmount(lead) !== null) ||
        (filtroEstatus === 'pendientes' && getConfirmedPaymentAmount(lead) === null);

      const matchSector =
        filtroSector === 'todos' ||
        (lead.especialidad && lead.especialidad.toLowerCase() === filtroSector.toLowerCase());

      const asignacion = delegaciones?.asignaciones.find((item) => item.lead_id === lead.id);
      const matchDelegacion =
        filtroDelegacion === 'todas' ||
        (filtroDelegacion === 'sin-asignar' && !asignacion) ||
        asignacion?.delegacion_id === filtroDelegacion;

      return matchTexto && matchEstatus && matchSector && matchDelegacion;
    });
  }, [leads, busqueda, filtroEstatus, filtroSector, filtroDelegacion, delegaciones]);

  // Exportar padrón a CSV (BOM UTF-8 para Excel)
  const handleExportCsv = () => {
    const headers = [
      'Folio SIEM',
      'Razón Social / Nombre Comercial',
      'Sector',
      'Municipio',
      'Contacto',
      'Teléfono / WhatsApp',
      'Correo Electrónico',
      'Estatus Padrón',
      'Último Contacto',
      'Notas y Cuota',
    ];

    const rows = comerciosFiltrados.map((l) => {
      const folioMatch = l.notas?.match(/Folio SIEM:\s*([^\s|]+)/);
      const folio = folioMatch ? folioMatch[1] : 'PENDIENTE';
      return [
        `"${folio}"`,
        `"${(l.web || '').replace(/"/g, '""')}"`,
        `"${(l.especialidad || 'comercio').toUpperCase()}"`,
        `"${(l.ciudad || 'Mérida').replace(/"/g, '""')}"`,
        `"${(l.contacto_nombre || '').replace(/"/g, '""')}"`,
        `"${l.whatsapp || ''}"`,
        `"${l.email || ''}"`,
        `"${l.status || 'Nuevo'}"`,
        `"${l.last_contact || ''}"`,
        `"${(l.notas || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `REGISTROS_CANACO_MERIDA_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const verResumenPago = (lead: LeadRow) => {
    const montoPagadoValidado = getConfirmedPaymentAmount(lead);
    if (montoPagadoValidado === null) return;
    const folioSiem = lead.verified_payment_folio_siem;
    const rfc = lead.verified_payment_rfc;
    const razonSocial = lead.verified_payment_razon_social;
    const numEmpleados = lead.verified_payment_num_empleados;
    if (!folioSiem || !rfc || !razonSocial || !numEmpleados) return;

    const sector = lead.verified_payment_sector as SocioCanacoRegistro['sector'];
    const folioIntegridad =
      lead.notas?.match(/Folio de Integridad:\s*([^\s|]+)/i)?.[1] ||
      generarFolioIntegridad(folioSiem);

    const socioObj: SocioCanacoRegistro = {
      folioSiem,
      razonSocial,
      nombreComercial: lead.web || '',
      rfc,
      sector,
      estrato: determinarEstrato(numEmpleados),
      numEmpleados,
      direccion: {
        calle: 'Calle Principal',
        colonia: 'Centro',
        codigoPostal: '97000',
        municipio: lead.ciudad || 'Mérida',
        ciudad: `${lead.ciudad || 'Mérida'}, Yucatán`,
      },
      contacto: {
        nombre: lead.contacto_nombre || 'Representante Legal',
        email: lead.email || 'contacto@comercio.mx',
        telefono: lead.whatsapp || '9991234567',
      },
      fechaAfiliacion: lead.last_contact || '2026-10-27',
      fechaVigencia: '',
      estatus: 'activo',
      pagoConfirmado: true,
      montoPagado: montoPagadoValidado,
      metodoPago: lead.verified_payment_channel === 'conekta_spei' ? 'spei' : 'tarjeta',
      cfdiRequerido: /CFDI:\s*Requerido/i.test(lead.notas || ''),
      folioIntegridad,
    };

    setSocioSeleccionado(socioObj);
  };

  if (activeSection === 'comunicaciones') {
    return (
      <CanacoComunicaciones
        leads={leads}
        delegaciones={delegaciones?.delegaciones || []}
        asignaciones={delegaciones?.asignaciones || []}
        canManage={canManageComms}
        initialLeadId={commsLeadId}
        onBack={() => setActiveSection('padron')}
      />
    );
  }

  return (
    <div className="space-y-6 font-inter text-henequen-grafito">
      {/* ═══ BARRA DE UBICACIÓN Y CONMUTADOR DE SECCIÓN CAMERAL ═══ */}
      <div
        aria-label="Ubicación en Consola CANACO"
        className="flex flex-col gap-3 rounded-2xl border border-henequen-arena bg-henequen-muro/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Compass size={14} className="text-henequen-terra" />
          <span className="font-medium text-henequen-piedra">CANACO SERVYTUR Mérida</span>
          <span className="text-henequen-arena">›</span>
          <span className="font-medium text-henequen-piedra">Dirección de Afiliaciones</span>
          <span className="text-henequen-arena">›</span>
          <span className="rounded-md bg-henequen-anil px-2 py-0.5 font-mono text-[11px] font-bold text-white">
            CRM interno CANACO
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-henequen-arena bg-white p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setFiltroEstatus('todos')}
              className={`rounded-lg px-2.5 py-1 transition ${
                filtroEstatus === 'todos'
                  ? 'bg-henequen-anil text-white'
                  : 'text-henequen-piedra hover:text-henequen-anil'
              }`}
            >
              Padrón ({kpis.total})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstatus('pendientes')}
              className={`rounded-lg px-2.5 py-1 transition ${
                filtroEstatus === 'pendientes'
                  ? 'bg-henequen-terra text-white'
                  : 'text-henequen-piedra hover:text-henequen-anil'
              }`}
            >
              Por Cobrar ({kpis.pendientes})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstatus('activos')}
              className={`rounded-lg px-2.5 py-1 transition ${
                filtroEstatus === 'activos'
                  ? 'bg-emerald-700 text-white'
                  : 'text-henequen-piedra hover:text-henequen-anil'
              }`}
            >
              Activos ({kpis.activos})
            </button>
          </div>

          {onNavigateToSuite && (
            <button
              type="button"
              onClick={onNavigateToSuite}
              className="inline-flex items-center gap-1.5 rounded-xl border border-henequen-anil/30 bg-white px-3 py-1.5 text-xs font-semibold text-henequen-anil transition hover:bg-henequen-sisal/50"
            >
              <Calculator size={13} className="text-henequen-terra" />
              <span>Ir a Suite Fiscal (12 Herramientas)</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ PANTALLA DE BIENVENIDA Y GUÍA RÁPIDA OPERATIVA ═══ */}
      {showWelcomeGuide && (
        <div className="rounded-2xl border border-henequen-terra/30 bg-gradient-to-r from-henequen-cal via-white to-henequen-sisal/30 p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-henequen-terra" />
              <h2 className="font-fraunces text-sm font-bold text-henequen-anil sm:text-base">
                Bienvenida a la Consola Cameral · ¿Qué puedes hacer en esta sección?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowWelcomeGuide(false);
                try {
                  window.localStorage.setItem('canaco_admin_guide_dismissed', 'true');
                } catch {
                  // ignore
                }
              }}
              className="rounded-lg px-2 py-0.5 text-[11px] font-semibold text-henequen-piedra hover:bg-henequen-sisal/50 hover:text-henequen-anil"
            >
              Ocultar guía
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <div className="rounded-xl border border-henequen-arena/80 bg-white p-3">
              <div className="font-mono text-[10px] font-bold uppercase text-henequen-terra">
                1. Revisión documental
              </div>
              <p className="mt-1 text-[11px] text-henequen-piedra">
                Pulsa <strong>Expediente</strong> para revisar los documentos que se hayan
                depositado en el Buzón Digital.
              </p>
            </div>
            <div className="rounded-xl border border-henequen-arena/80 bg-white p-3">
              <div className="font-mono text-[10px] font-bold uppercase text-henequen-anil">
                2. Seguimiento de pagos
              </div>
              <p className="mt-1 text-[11px] text-henequen-piedra">
                La sincronización masiva puede enviar un lote al proveedor configurado. No confirma
                que se haya entregado una llamada o mensaje; el recordatorio individual no está
                conectado.
              </p>
            </div>
            <div className="rounded-xl border border-henequen-arena/80 bg-white p-3">
              <div className="font-mono text-[10px] font-bold uppercase text-emerald-800">
                3. Resumen interno
              </div>
              <p className="mt-1 text-[11px] text-henequen-piedra">
                Tras una confirmación de pago, puedes consultar un resumen interno. No se genera una
                constancia SIEM ni una verificación QR.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CABECERA INSTITUCIONAL ═══ */}
      <div className="flex flex-col gap-4 border-b border-henequen-arena pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CanacoLogo size={52} variant="symbol" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-fraunces text-2xl font-bold tracking-tight text-henequen-anil">
                Registros de afiliación CANACO
              </h1>
              <span className="rounded-full border border-henequen-terra/30 bg-henequen-terra/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-henequen-terra-dark">
                Admin: horus.i2d@gmail.com
              </span>
              {isSuperAdmin && (
                <span className="shadow-xs inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100/90 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-900">
                  <Crown size={11} className="text-amber-700" />
                  Super Admin Root ({auth?.user?.email || 'pavel@arksystems.site'})
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-henequen-piedra">
              CANACO SERVYTUR MÉRIDA · CRM interno; no acredita el alta ante SIEM
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManageComms && (
            <button
              type="button"
              onClick={() => setActiveSection('comunicaciones')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-henequen-anil/30 bg-white px-3.5 py-2 text-xs font-bold text-henequen-anil transition hover:bg-henequen-sisal/50"
            >
              <MessageSquare size={13} />
              <span>Comunicaciones</span>
            </button>
          )}

          <button
            type="button"
            onClick={cargarPadron}
            className="inline-flex items-center gap-1.5 rounded-lg border border-henequen-arena bg-white px-3 py-2 text-xs font-semibold text-henequen-piedra transition hover:border-henequen-anil/40 hover:text-henequen-anil"
            title="Refrescar padrón desde D1"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-lg border border-henequen-arena bg-white px-3.5 py-2 text-xs font-semibold text-henequen-anil transition hover:bg-henequen-sisal/50"
          >
            <Download size={13} />
            <span>Exportar CSV del CRM</span>
          </button>

          <button
            type="button"
            onClick={() => setModalRecordatorioMasivoOpen(true)}
            disabled={syncingArkangel || filtroDelegacion !== 'todas'}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-lg border border-amber-300/80 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
            title={
              filtroDelegacion !== 'todas'
                ? 'La sincronización no admite filtros por delegación.'
                : 'Sincronizar los registros que pasen validación con el proveedor Arkangel'
            }
            aria-label="Sincronizar registros"
          >
            <Radio
              size={13}
              className={syncingArkangel ? 'animate-pulse text-amber-600' : 'text-amber-700'}
            />
            <span>{syncingArkangel ? 'Sincronizando...' : 'Sincronizar registros'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalAltaOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-henequen-terra px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-henequen-terra-dark"
          >
            <UserPlus size={14} />
            <span>Nueva Afiliación</span>
          </button>
        </div>
      </div>

      {/* ═══ BANNER DE FEEDBACK SYNC ARKANGEL ═══ */}
      {syncFeedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs ${
            syncFeedback.tipo === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio
              size={15}
              className={syncFeedback.tipo === 'success' ? 'text-emerald-700' : 'text-red-700'}
            />
            <span className="font-medium">{syncFeedback.mensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {delegacionesHabilitadas && (
        <section className="space-y-3 rounded-xl border border-henequen-arena bg-white p-4">
          <h2 className="font-fraunces text-lg font-bold text-henequen-anil">Delegaciones</h2>
          <p className="text-xs text-henequen-piedra">
            Agrupaciones del CRM, independientes de los despachos. Los registros históricos no se
            asignan automáticamente.
          </p>
          {delegacionesError && (
            <p role="alert" className="text-xs text-red-700">
              {delegacionesError}
            </p>
          )}
          <form onSubmit={crearDelegacion} className="flex flex-wrap gap-2">
            <label htmlFor="nombre-delegacion" className="sr-only">
              Nombre de la delegación
            </label>
            <input
              id="nombre-delegacion"
              value={nombreDelegacion}
              onChange={(event) => setNombreDelegacion(event.target.value)}
              maxLength={120}
              required
              className="rounded-lg border border-henequen-arena px-3 py-2 text-xs"
              placeholder="Nombre de la delegación"
            />
            <button
              type="submit"
              disabled={guardandoDelegacion}
              className="rounded-lg bg-henequen-anil px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Crear delegación
            </button>
          </form>
          {delegaciones && (
            <>
              <label className="block text-xs font-semibold">
                Filtrar por delegación
                <select
                  value={filtroDelegacion}
                  onChange={(event) => setFiltroDelegacion(event.target.value)}
                  className="ml-2 rounded-lg border border-henequen-arena px-2 py-1"
                >
                  <option value="todas">Todas</option>
                  <option value="sin-asignar">Sin delegación ({delegaciones.sinAsignar})</option>
                  {delegaciones.delegaciones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </label>
              {filtroDelegacion !== 'todas' && (
                <p className="text-xs text-henequen-piedra">
                  La sincronización masiva no admite filtros por delegación y está desactivada
                  mientras se aplica este filtro.
                </p>
              )}
              <ul className="space-y-1 text-xs">
                {delegaciones.delegaciones.map((item) => (
                  <li key={item.id}>
                    {item.nombre}: {item.registros} registros · {item.socios_activos} en etapa socio
                    activo · {item.con_contacto} con último contacto
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* ═══ TARJETAS DE KPIS ═══ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-henequen-arena bg-henequen-muro p-4 shadow-tarjeta">
          <div className="flex items-center justify-between text-henequen-piedra">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Registros en CRM
            </span>
            <Building2 size={16} className="text-henequen-anil" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-henequen-anil">{kpis.total}</div>
          <div className="mt-0.5 text-[10px] text-henequen-piedra">Registros recibidos</div>
        </div>

        <div className="rounded-xl border border-henequen-arena bg-henequen-muro p-4 shadow-tarjeta">
          <div className="flex items-center justify-between text-henequen-piedra">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Pagos confirmados
            </span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-700">{kpis.activos}</div>
          <div className="mt-0.5 text-[10px] font-semibold text-emerald-800">
            Importe validado contra la cotización de referencia
          </div>
        </div>

        <div className="rounded-xl border border-henequen-arena bg-henequen-muro p-4 shadow-tarjeta">
          <div className="flex items-center justify-between text-henequen-piedra">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pendientes</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-amber-700">{kpis.pendientes}</div>
          <div className="mt-0.5 text-[10px] font-semibold text-amber-800">
            Sin pago validado contra la cotización
          </div>
        </div>

        <div className="rounded-xl border border-henequen-arena bg-henequen-anil p-4 text-white shadow-tarjeta">
          <div className="flex items-center justify-between text-henequen-arena">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Pagos marcados confirmados
            </span>
            <DollarSign size={16} className="text-henequen-sisal" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold">
            ${kpis.recaudacion.toLocaleString('es-MX')}
          </div>
          <div className="mt-0.5 text-[10px] text-henequen-sisal">Importe registrado en el CRM</div>
        </div>
      </div>

      <div
        aria-label="Registros por etapa del ciclo de vida"
        className="flex flex-wrap gap-2 text-xs"
      >
        {Object.entries(kpis.stageCounts).map(([stage, count]) => (
          <span
            key={stage}
            className="rounded-full border border-henequen-arena bg-white px-3 py-1.5"
          >
            {stage.replace('_', ' ')}: <strong>{count}</strong>
          </span>
        ))}
        <a
          href="https://github.com/substrateholdingsai/ark-tools/blob/main/docs/compliance/procedimiento-arco-canaco.md"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-henequen-arena bg-white px-3 py-1.5 font-semibold underline"
        >
          Procedimiento manual ARCO
        </a>
      </div>
      {(isSuperAdmin || auth?.user?.email?.toLowerCase() === 'horus.i2d@gmail.com') && (
        <details className="rounded-xl border border-henequen-arena bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-henequen-anil">
            Solicitudes ARCO (
            {arcoRequests.filter((item) => !['completed', 'rejected'].includes(item.status)).length}{' '}
            abiertas)
          </summary>
          <div className="mt-3 space-y-3">
            {arcoError && (
              <p role="alert" className="text-xs text-red-700">
                {arcoError}
              </p>
            )}
            {arcoRequests.length === 0 && !arcoError && (
              <p className="text-xs text-henequen-piedra">No hay solicitudes registradas.</p>
            )}
            {arcoRequests.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-henequen-arena pt-3 text-xs"
              >
                <div>
                  <strong>{item.right_requested}</strong> · {item.requester_email} · {item.status}
                  <div className="text-henequen-piedra">
                    Responsable: {item.assigned_to} · Respuesta antes de{' '}
                    {new Date(item.response_due_at).toLocaleDateString('es-MX')}
                    {item.execution_due_at &&
                      ` · Ejecución antes de ${new Date(item.execution_due_at).toLocaleDateString('es-MX')}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  {item.status === 'received' && (
                    <button
                      type="button"
                      onClick={() => void actualizarSolicitudArco(item, 'identity_verified')}
                      className="underline"
                    >
                      Identidad verificada
                    </button>
                  )}
                  {item.status === 'identity_verified' && (
                    <button
                      type="button"
                      onClick={() => void actualizarSolicitudArco(item, 'in_progress')}
                      className="underline"
                    >
                      Iniciar atención
                    </button>
                  )}
                  {['identity_verified', 'in_progress'].includes(item.status) && (
                    <>
                      <button
                        type="button"
                        onClick={() => void actualizarSolicitudArco(item, 'completed')}
                        className="underline"
                      >
                        Completar
                      </button>
                      <button
                        type="button"
                        onClick={() => void actualizarSolicitudArco(item, 'rejected')}
                        className="underline"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {loadError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          {loadError} No se muestran datos de demostración como si fueran registros reales.
        </p>
      )}

      {/* ═══ BARRA DE FILTROS Y BÚSQUEDA ═══ */}
      <div className="flex flex-col gap-3 rounded-xl border border-henequen-arena bg-henequen-cal p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-henequen-piedra"
          />
          <input
            type="text"
            placeholder="Buscar por comercio, RFC, contacto o WhatsApp..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-lg border border-henequen-arena bg-white py-2 pl-9 pr-3 text-xs text-henequen-grafito placeholder:text-henequen-piedra/60 focus:border-henequen-anil focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="rounded-lg border border-henequen-arena bg-white px-3 py-2 text-xs font-semibold text-henequen-grafito focus:border-henequen-anil focus:outline-none"
          >
            <option value="todos">Todos los Estatus</option>
            <option value="activos">Sólo Socios Activos</option>
            <option value="pendientes">Sólo Pendientes de Pago</option>
          </select>

          <select
            value={filtroSector}
            onChange={(e) => setFiltroSector(e.target.value)}
            className="rounded-lg border border-henequen-arena bg-white px-3 py-2 text-xs font-semibold text-henequen-grafito focus:border-henequen-anil focus:outline-none"
          >
            <option value="todos">Todos los Sectores</option>
            <option value="comercio">Comercio</option>
            <option value="servicios">Servicios</option>
            <option value="turismo">Turismo</option>
          </select>

          {(busqueda || filtroEstatus !== 'todos' || filtroSector !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setFiltroEstatus('todos');
                setFiltroSector('todos');
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-henequen-arena bg-white px-2.5 py-2 text-xs text-henequen-piedra transition hover:text-henequen-terra"
              title="Limpiar filtros"
            >
              <FilterX size={13} />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ TABLA DEL PADRÓN DE SOCIOS ═══ */}
      <div className="overflow-hidden rounded-xl border border-henequen-arena bg-white shadow-tarjeta">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-inter text-xs">
            <thead className="border-b border-henequen-arena bg-henequen-cal text-[10px] font-bold uppercase tracking-wider text-henequen-piedra">
              <tr>
                <th className="px-4 py-3">Establecimiento & RFC</th>
                <th className="px-4 py-3">Sector & Estrato</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3">Contacto Directo</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-henequen-arena/60">
              {comerciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-henequen-piedra">
                    No se encontraron comercios que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                comerciosFiltrados.map((lead) => {
                  const folioMatch = lead.notas?.match(/Folio SIEM:\s*([^\s|]+)/);
                  const folio = folioMatch ? folioMatch[1] : 'PENDIENTE';
                  const esActivo = getConfirmedPaymentAmount(lead) !== null;
                  const etapa = esActivo ? 'socio_activo' : lead.lifecycle_stage || 'prospecto';

                  // Mensaje para WhatsApp institucional
                  const waNumber = (lead.whatsapp || '').replace(/\D/g, '');
                  const waMsg = encodeURIComponent(
                    `Hola ${lead.contacto_nombre || ''}. Te contactamos de CANACO SERVYTUR Mérida sobre la solicitud de afiliación de "${lead.web || 'tu establecimiento'}". ¿Necesitas apoyo para continuar?`
                  );
                  const waUrl = waNumber ? `https://wa.me/52${waNumber}?text=${waMsg}` : null;

                  return (
                    <tr key={lead.id} className="transition hover:bg-henequen-cal/40">
                      {/* Establecimiento */}
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-semibold text-henequen-anil">
                          {lead.web || 'Comercio Sin Razón Social'}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-henequen-piedra">
                          <MapPin size={10} className="shrink-0" />
                          <span>{lead.ciudad || 'Mérida'}, Yucatán</span>
                        </div>
                        {delegacionesHabilitadas && delegaciones && (
                          <label className="mt-2 block text-[10px]">
                            Delegación
                            <select
                              aria-label={`Delegación de ${lead.web || lead.id}`}
                              value={
                                delegaciones.asignaciones.find((item) => item.lead_id === lead.id)
                                  ?.delegacion_id || ''
                              }
                              disabled={guardandoDelegacion}
                              onChange={(event) =>
                                void asignarDelegacion(lead.id, event.target.value)
                              }
                              className="ml-1 max-w-[150px] rounded border border-henequen-arena p-1"
                            >
                              <option value="">Sin delegación</option>
                              {delegaciones.delegaciones.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.nombre}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </td>

                      {/* Sector */}
                      <td className="px-4 py-3.5">
                        <span className="block font-medium capitalize text-henequen-grafito">
                          {lead.especialidad || 'Comercio'}
                        </span>
                        <span className="block text-[10px] text-henequen-piedra">
                          {lead.notas?.includes('ESTRATO:')
                            ? lead.notas.split('|')[1]?.trim()
                            : 'Micro / MiPyME'}
                        </span>
                        {lead.notas?.includes('Afiliación Simultánea') && (
                          <span className="mt-1 inline-flex items-center rounded bg-henequen-anil/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-henequen-anil">
                            Tripartito AAFY-IMSS
                          </span>
                        )}
                      </td>

                      {/* Folio SIEM */}
                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-henequen-grafito">
                        {folio}
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-henequen-grafito">
                          {lead.contacto_nombre || 'Representante'}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-[10px] text-henequen-piedra">
                          {lead.whatsapp && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              {lead.whatsapp}
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex max-w-[140px] items-center gap-1 truncate">
                              <Mail size={10} />
                              {lead.email}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[9px] text-henequen-piedra">
                          Origen: {lead.origin || 'legacy'} · Aviso:{' '}
                          {lead.consent_accepted_at
                            ? `${lead.consent_medium || 'sin medio'} · ${lead.consent_accepted_at}`
                            : 'sin constancia — capturar en siguiente contacto'}
                          {' · Arkangel: '}
                          {lead.arkangel_share_consent === 1 ? 'autorizado' : 'no autorizado'}
                          {' · Sales / Comunicaciones: '}
                          {lead.is_demo === 1
                            ? 'excluido (demo)'
                            : lead.sales_share_consent === 1
                              ? 'autorizado'
                              : 'sin autorización'}
                        </div>
                      </td>

                      {/* Estatus */}
                      <td className="px-4 py-3.5">
                        {etapa === 'socio_activo' ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 size={11} />
                              Socio Activo
                            </span>
                            {lead.payment_environment && (
                              <div className="mt-1 text-[9px] text-henequen-piedra">
                                Pago: {lead.payment_environment}
                              </div>
                            )}
                          </>
                        ) : etapa === 'cancelado' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            <Clock size={11} />
                            {etapa === 'registrado'
                              ? 'Registrado'
                              : etapa === 'pago_pendiente'
                                ? 'Pago Pendiente'
                                : 'Prospecto'}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!esActivo && (
                            <button
                              type="button"
                              disabled
                              className="shadow-2xs inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 opacity-70"
                              title="El recordatorio individual no está conectado; no se envía ningún mensaje."
                            >
                              <PhoneCall size={11} className="text-amber-700" />
                              <span>Recordatorio no conectado</span>
                            </button>
                          )}

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shadow-2xs inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 transition hover:bg-emerald-100"
                              title="Contactar por WhatsApp institucional"
                            >
                              <MessageSquare size={13} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpedienteAdminSocio(lead)}
                            className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-henequen-terra/40 bg-amber-50/50 px-2.5 py-1 text-[11px] font-semibold text-henequen-terra transition hover:bg-amber-100/60"
                            title="Cotejar expediente documental del socio"
                          >
                            <Inbox size={12} />
                            <span>Expediente</span>
                          </button>

                          {lead.is_demo !== 1 && (
                            <button
                              type="button"
                              disabled={updatingSalesConsentId === lead.id}
                              onClick={() =>
                                void handleSalesConsent(lead, lead.sales_share_consent !== 1)
                              }
                              className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-henequen-anil/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-henequen-anil transition hover:bg-henequen-cal/60"
                              aria-label={
                                lead.sales_share_consent === 1
                                  ? `Retirar consentimiento de Sales de ${lead.web || lead.id}`
                                  : `Autorizar consentimiento de Sales de ${lead.web || lead.id}`
                              }
                            >
                              <ShieldCheck size={12} />
                              <span>
                                {lead.sales_share_consent === 1
                                  ? 'Retirar Sales'
                                  : 'Autorizar Sales'}
                              </span>
                            </button>
                          )}

                          {canManageComms && (
                            <button
                              type="button"
                              onClick={() => {
                                setCommsLeadId(lead.id);
                                setActiveSection('comunicaciones');
                              }}
                              className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
                              aria-label={`Ver comunicaciones de ${lead.web || lead.id}`}
                            >
                              <MessageSquare size={12} />
                              <span>Comunicaciones</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => verResumenPago(lead)}
                            disabled={!esActivo}
                            className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-henequen-arena bg-white px-2.5 py-1 text-[11px] font-semibold text-henequen-anil transition hover:bg-henequen-sisal/40"
                            title="Ver resumen interno de pago confirmado"
                          >
                            <FileText size={12} />
                            <span>Resumen</span>
                          </button>
                          {esActivo && (
                            <button
                              type="button"
                              onClick={() => void handleReverseAffiliation(lead)}
                              className="shadow-2xs inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-800 transition hover:bg-red-100"
                              title="Revertir la afiliación con motivo auditado; no procesa un reembolso."
                            >
                              <X size={11} />
                              <span>Revertir</span>
                            </button>
                          )}
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

      {/* Resumen interno, disponible solo tras confirmación de pago */}
      {socioSeleccionado && (
        <ConstanciaSocioModal
          isOpen={!!socioSeleccionado}
          onClose={() => setSocioSeleccionado(null)}
          socio={socioSeleccionado}
        />
      )}

      {/* Modal de Cotejo Documental (Admin Expedientes) */}
      {expedienteAdminSocio && (
        <AdminExpedienteModal
          isOpen={!!expedienteAdminSocio}
          onClose={() => setExpedienteAdminSocio(null)}
          rfc={expedienteAdminSocio.canonical_rfc || ''}
          razonSocial={expedienteAdminSocio.web || 'Comercio Registrado'}
          whatsapp={expedienteAdminSocio.whatsapp}
          contactoNombre={expedienteAdminSocio.contacto_nombre}
          salesShareConsent={expedienteAdminSocio.sales_share_consent}
          salesConsentAcceptedAt={expedienteAdminSocio.sales_consent_accepted_at}
          isDemo={expedienteAdminSocio.is_demo}
          onDictamenActualizado={() => {
            void cargarPadron();
          }}
        />
      )}

      {/* Modal de Nueva Afiliación */}
      <VentanillaAfiliacionModal
        isOpen={modalAltaOpen}
        onClose={() => setModalAltaOpen(false)}
        consentMedium="admin"
        onRegistroGuardado={() => {
          void cargarPadron();
        }}
      />

      {/* Modal de confirmación de envío al proveedor */}
      {modalRecordatorioMasivoOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-henequen-arena bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setModalRecordatorioMasivoOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-henequen-piedra transition hover:bg-henequen-sisal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-900">
                Integración de proveedor
              </span>
              <span className="rounded-full border border-henequen-anil/20 bg-henequen-cal px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-henequen-anil">
                Arkangel
              </span>
            </div>

            <h3 className="mt-2.5 font-fraunces text-xl font-bold text-henequen-anil">
              Confirmar sincronización de registros
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-henequen-grafito">
              {arkangelPreview
                ? `Vista previa: ${arkangelPreview.rows.length} registro(s); expira ${new Date(arkangelPreview.expiresAt).toLocaleTimeString('es-MX')}.`
                : `Primero se generará una vista previa sin enviar datos. La cartera de referencia es $${kpis.carteraPendiente.toLocaleString('es-MX')} MXN.`}
            </p>

            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              {arkangelPreview ? (
                <>
                  <strong>Canal:</strong> {arkangelPreview.channels.join(', ')}
                  <p className="mt-2">
                    <strong>Filas:</strong>{' '}
                    {arkangelPreview.rows
                      .map((row) => `${row.nombre} (${row.email}, ${row.rfc}, $${row.monto})`)
                      .join('; ') || 'ninguna'}
                  </p>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[10px]">
                    {arkangelPreview.content}
                  </pre>
                </>
              ) : (
                'La vista previa mostrará filas, canal y contenido exactos. Pavel debe revisar y aprobar antes de enviar. No se envían CLABEs ni constancias.'
              )}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-henequen-arena pt-4">
              <button
                type="button"
                onClick={() => setModalRecordatorioMasivoOpen(false)}
                className="rounded-lg border border-henequen-arena px-4 py-2 text-xs font-semibold text-henequen-piedra transition hover:bg-henequen-sisal"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (arkangelPreview) {
                    await handleDispatchArkangel();
                  } else {
                    await handleSyncArkangel();
                  }
                }}
                disabled={syncingArkangel || !isPavel}
                title={
                  isPavel
                    ? 'Requiere aprobación explícita; solo se incluirán registros con consentimiento de compartir.'
                    : 'Solo Pavel puede aprobar envíos a Arkangel.'
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-henequen-anil px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-henequen-anil/90 disabled:opacity-50"
              >
                <Radio size={14} className={syncingArkangel ? 'animate-pulse' : ''} />
                <span>
                  {syncingArkangel
                    ? arkangelPreview
                      ? 'Enviando...'
                      : 'Preparando vista previa...'
                    : arkangelPreview
                      ? 'Pavel aprueba y envía'
                      : 'Generar vista previa'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

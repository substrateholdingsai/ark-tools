/**
 * CANACO SERVYTUR MÉRIDA — Consola interna de registros de afiliación
 *
 * Panel de control para la Dirección de Afiliaciones y Tesorería de la Cámara.
 * Permite consultar los registros internos de CANACO y exportarlos para revisión.
 *
 * Usuario Administrador Designado: horus.i2d@gmail.com
 */

import { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { useOptionalAuth } from '@/context/AuthContext';
import { CanacoLogo } from '@/components/brand/CanacoLogo';
import { ConstanciaSocioModal } from './ConstanciaSocioModal';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';
import { AdminExpedienteModal } from './AdminExpedienteModal';
import type { SocioCanacoRegistro } from './types';
import {
  calcularCuotaAfiliacion,
  determinarEstrato,
  extraerNumEmpleados,
  generarFolioIntegridad,
  tienePagoConfirmado,
} from './calculoCuota';

interface LeadRow {
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

function getConfirmedPaymentAmount(lead: LeadRow): number | null {
  if (lead.status !== 'Socio Activo' || !tienePagoConfirmado(lead.notas)) return null;
  const employees = extraerNumEmpleados(lead.notas);
  const sector = lead.especialidad;
  const amountMatch = lead.notas?.match(/Pago Confirmado [^(]+\(\$([\d,]+(?:\.\d+)?)\s*MXN\)/i);
  const quoteMatch = lead.notas?.match(/Cuota:\s*\$([\d,]+(?:\.\d+)?)/i);
  if (
    !employees ||
    !['comercio', 'servicios', 'turismo'].includes(sector || '') ||
    !amountMatch?.[1] ||
    !quoteMatch?.[1]
  ) {
    return null;
  }
  const amount = Number(amountMatch[1].replace(/,/g, ''));
  const quotedAmount = Number(quoteMatch[1].replace(/,/g, ''));
  const expected = calcularCuotaAfiliacion(
    employees,
    sector as SocioCanacoRegistro['sector']
  ).totalAnual;
  return Number.isFinite(amount) &&
    Math.round(amount * 100) === Math.round(expected * 100) &&
    Math.round(quotedAmount * 100) === Math.round(expected * 100)
    ? amount
    : null;
}

interface CanacoAdminPadronProps {
  onNavigateToSuite?: () => void;
}

export function CanacoAdminPadron({ onNavigateToSuite }: CanacoAdminPadronProps = {}) {
  const auth = useOptionalAuth();
  const isSuperAdmin = auth?.platformRole === 'super_admin';
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');
  const [filtroSector, setFiltroSector] = useState<string>('todos');
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioCanacoRegistro | null>(null);
  const [expedienteAdminSocio, setExpedienteAdminSocio] = useState<LeadRow | null>(null);
  const [modalAltaOpen, setModalAltaOpen] = useState(false);
  const [modalRecordatorioMasivoOpen, setModalRecordatorioMasivoOpen] = useState(false);
  const [syncingArkangel, setSyncingArkangel] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  // Enviar al proveedor solo los registros que pasen la validación del servidor.
  const handleSyncArkangel = async () => {
    setSyncingArkangel(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/canaco/sync-arkangel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as any;
      if (res.ok && data.ok) {
        setSyncFeedback({
          tipo: 'success',
          mensaje: data.simulated
            ? `Validación simulada: ${data.socios_enviados} registro(s), $${Number(data.monto_total_cartera || 0).toLocaleString('es-MX')} MXN. No se envió ningún mensaje.`
            : `Lote enviado al proveedor Arkangel: ${data.socios_enviados} registro(s), $${Number(data.monto_total_cartera || 0).toLocaleString('es-MX')} MXN. Esta respuesta no confirma la entrega de mensajes.`,
        });
        await cargarPadron();
      } else {
        setSyncFeedback({
          tipo: 'error',
          mensaje: data.error || data.mensaje || 'Error al conectar con Arkangel.',
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

  // Cargar comercios del tenant CANACO
  const cargarPadron = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads?tenant=canaco_merida');
      if (!res.ok) {
        throw new Error('No se pudo consultar el CRM de CANACO.');
      }
      const data = (await res.json()) as { leads?: LeadRow[]; data?: LeadRow[] };
      setLeads(data.leads || data.data || []);
      setLoadError(null);
    } catch (error) {
      setLeads([]);
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el CRM de CANACO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarPadron();
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const total = leads.length;
    const activos = leads.filter((lead) => getConfirmedPaymentAmount(lead) !== null).length;
    const pendientes = total - activos;

    // Estimar recaudación a partir de las notas o cuota base
    const recaudacion = leads.reduce((acc, l) => {
      return acc + (getConfirmedPaymentAmount(l) || 0);
    }, 0);

    // Cartera pendiente de cobro
    const carteraPendiente = leads.reduce((acc, l) => {
      if (getConfirmedPaymentAmount(l) !== null) return acc;
      const employees = extraerNumEmpleados(l.notas);
      const sector = l.especialidad;
      if (!employees || !['comercio', 'servicios', 'turismo'].includes(sector || '')) return acc;
      const expected = calcularCuotaAfiliacion(
        employees,
        sector as SocioCanacoRegistro['sector']
      ).totalAnual;
      const amountMatch = l.notas?.match(/Cuota:\s*\$([\d,]+(?:\.\d+)?)/i);
      const amount = amountMatch?.[1] ? Number(amountMatch[1].replace(/,/g, '')) : 0;
      return Math.round(amount * 100) === Math.round(expected * 100) ? acc + amount : acc;
    }, 0);

    return { total, activos, pendientes, recaudacion, carteraPendiente };
  }, [leads]);

  // Filtros
  const comerciosFiltrados = useMemo(() => {
    return leads.filter((lead) => {
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

      return matchTexto && matchEstatus && matchSector;
    });
  }, [leads, busqueda, filtroEstatus, filtroSector]);

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
    const folioSiem = lead.notas?.match(/Folio SIEM:\s*([^\s|]+)/i)?.[1];
    const rfc = lead.notas?.match(/RFC:\s*([A-Z0-9]+)/i)?.[1];
    const razonSocial = lead.notas?.match(/Razón Social:\s*([^|]+)/i)?.[1]?.trim();
    const numEmpleados = extraerNumEmpleados(lead.notas);
    if (!folioSiem || !rfc || !razonSocial || !numEmpleados) return;

    const sector = ['comercio', 'servicios', 'turismo'].includes(lead.especialidad || '')
      ? (lead.especialidad as SocioCanacoRegistro['sector'])
      : 'comercio';
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
      metodoPago: /Pago Confirmado Call Center:/i.test(lead.notas || '') ? 'spei' : 'tarjeta',
      cfdiRequerido: /CFDI:\s*Requerido/i.test(lead.notas || ''),
      folioIntegridad,
    };

    setSocioSeleccionado(socioObj);
  };

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
            disabled={syncingArkangel}
            className="shadow-xs inline-flex items-center gap-1.5 rounded-lg border border-amber-300/80 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50"
            title="Sincronizar los registros que pasen validación con el proveedor Arkangel"
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
                      </td>

                      {/* Estatus */}
                      <td className="px-4 py-3.5">
                        {esActivo ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 size={11} />
                            Socio Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                            <Clock size={11} />
                            Pendiente Pago
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
          rfc={
            expedienteAdminSocio.notas?.match(/RFC:\s*([A-Z0-9]{12,13})/i)?.[1] || 'AMA200101AB1'
          }
          razonSocial={expedienteAdminSocio.web || 'Comercio Registrado'}
          whatsapp={expedienteAdminSocio.whatsapp}
          contactoNombre={expedienteAdminSocio.contacto_nombre}
          onDictamenActualizado={() => {
            void cargarPadron();
          }}
        />
      )}

      {/* Modal de Nueva Afiliación */}
      <VentanillaAfiliacionModal
        isOpen={modalAltaOpen}
        onClose={() => setModalAltaOpen(false)}
        onRegistroGuardado={() => {
          void cargarPadron();
        }}
      />

      {/* Modal de confirmación de envío al proveedor */}
      {modalRecordatorioMasivoOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-henequen-arena bg-white p-6 shadow-2xl">
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
              Se enviarán los registros que pasen la validación al proveedor Arkangel. El importe
              agregado de referencia es ${kpis.carteraPendiente.toLocaleString('es-MX')} MXN; la
              operación no confirma entrega de llamadas o mensajes.
            </p>

            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              Se transmiten razón social, teléfono, correo, RFC, importe, concepto, vencimiento y
              sector al proveedor configurado. No se envían CLABEs ni constancias. Continúa solo si
              cuentas con autorización para compartir esos datos; si el proveedor no está
              configurado, la operación será simulada y no se enviarán mensajes.
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
                  setModalRecordatorioMasivoOpen(false);
                  await handleSyncArkangel();
                }}
                disabled={syncingArkangel}
                className="inline-flex items-center gap-1.5 rounded-lg bg-henequen-anil px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-henequen-anil/90 disabled:opacity-50"
              >
                <Radio size={14} className={syncingArkangel ? 'animate-pulse' : ''} />
                <span>{syncingArkangel ? 'Sincronizando...' : 'Enviar lote al proveedor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

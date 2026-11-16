/**
 * CANACO SERVYTUR MÉRIDA — Ventanilla Digital de Afiliación & Refrendo SIEM
 *
 * Módulo institucional para la captación, registro comercial, liquidación de cuotas
 * y emisión automática de membresía bajo el Design System HENEQUÉN.
 */

import { useState, useId } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  QrCode,
  ArrowRight,
  FileCheck2,
  FlaskConical,
  Sparkles,
  Inbox,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { CanacoLogo } from '@/components/brand/CanacoLogo';
import { COMPLIANCE_LAST_UPDATED } from '@/data/compliance-legal';
import {
  calcularCuotaAfiliacion,
  determinarEstrato,
  generarFolioIntegridad,
  generarFolioSiem,
} from './calculoCuota';
import { BuzonDocumentalModal } from './BuzonDocumentalModal';
import { CANACO_WALKTHROUGH_SOCIO_DEMO, useCanacoDemoMode } from './canacoDemoMode';
import type { SectorEconomico, SocioCanacoRegistro } from './types';

interface VentanillaAfiliacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistroGuardado?: (registro: SocioCanacoRegistro) => void;
  onOpenPrivacyNotice?: () => void;
  consentMedium?: 'ventanilla' | 'admin' | 'import';
}

export function VentanillaAfiliacionModal({
  isOpen,
  onClose,
  onRegistroGuardado,
  onOpenPrivacyNotice,
  consentMedium = 'ventanilla',
}: VentanillaAfiliacionModalProps) {
  const razonSocialId = useId();
  const nombreComercialId = useId();
  const rfcId = useId();
  const sectorId = useId();
  const numEmpleadosId = useId();
  const municipioId = useId();
  const calleId = useId();
  const cpId = useId();
  const contactoNombreId = useId();
  const emailId = useId();
  const telefonoId = useId();
  const nrpId = useId();
  const recId = useId();

  // Estados del flujo
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState<SocioCanacoRegistro | null>(null);
  const [leadIdRegistrado, setLeadIdRegistrado] = useState<string | null>(null);
  const [socioGuardado, setSocioGuardado] = useState<SocioCanacoRegistro | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migracionError, setMigracionError] = useState<string | null>(null);
  const [buzonOpen, setBuzonOpen] = useState(false);
  const [errorVentanilla, setErrorVentanilla] = useState<string | null>(null);
  const [mensajePendiente, setMensajePendiente] = useState(
    'Registro recibido, aún sin confirmación. Este recorrido no emite una Cédula, un alta SIEM ni un CFDI.'
  );

  // Formulario
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [rfc, setRfc] = useState('');
  const [sector, setSector] = useState<SectorEconomico>('comercio');
  const [numEmpleados, setNumEmpleados] = useState<number>(5);
  const [municipio, setMunicipio] = useState('Mérida');
  const [calle, setCalle] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('97000');
  const [contactoNombre, setContactoNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'spei' | 'clip'>('tarjeta');
  const [cfdiRequerido, setCfdiRequerido] = useState(true);
  const [avisoAceptado, setAvisoAceptado] = useState(false);
  const [consentimientoArkangel, setConsentimientoArkangel] = useState(false);

  // Datos opcionales para que CANACO pueda orientar sobre trámites relacionados.
  const [afiliacionSimultanea, setAfiliacionSimultanea] = useState(true);
  const [registroPatronalImss, setRegistroPatronalImss] = useState('');
  const [tramiteImssSolicitado, setTramiteImssSolicitado] = useState(false);
  const [registroEstatalAafy, setRegistroEstatalAafy] = useState('');

  // Modo Demo / Walkthrough
  const { isDemoMode } = useCanacoDemoMode();

  if (!isOpen) return null;

  const cotizacion = calcularCuotaAfiliacion(numEmpleados, sector);

  const handleAutollenarWalkthrough = (saltarAPago = false) => {
    setRazonSocial(CANACO_WALKTHROUGH_SOCIO_DEMO.razonSocial);
    setNombreComercial(CANACO_WALKTHROUGH_SOCIO_DEMO.nombreComercial);
    setRfc(CANACO_WALKTHROUGH_SOCIO_DEMO.rfc);
    setSector(CANACO_WALKTHROUGH_SOCIO_DEMO.sector);
    setNumEmpleados(CANACO_WALKTHROUGH_SOCIO_DEMO.numEmpleados);
    setMunicipio(CANACO_WALKTHROUGH_SOCIO_DEMO.municipio);
    setCalle(CANACO_WALKTHROUGH_SOCIO_DEMO.calle);
    setCodigoPostal(CANACO_WALKTHROUGH_SOCIO_DEMO.codigoPostal);
    setContactoNombre(CANACO_WALKTHROUGH_SOCIO_DEMO.contactoNombre);
    setEmail(CANACO_WALKTHROUGH_SOCIO_DEMO.email);
    setTelefono(CANACO_WALKTHROUGH_SOCIO_DEMO.telefono);
    if (saltarAPago) {
      setPaso(3);
    }
  };

  const crearRegistroPendienteLocal = (): SocioCanacoRegistro => {
    const estrato = determinarEstrato(numEmpleados);
    const folioSiem = generarFolioSiem(rfc, estrato);
    const fechaHoy = new Date().toISOString().split('T')[0] || '';
    const fechaVigencia =
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';

    return {
      folioSiem,
      razonSocial: razonSocial.trim().toUpperCase() || 'EMPRESA COMERCIAL DE YUCATÁN',
      nombreComercial: nombreComercial.trim() || razonSocial.trim(),
      rfc: rfc.trim().toUpperCase() || 'XAXX010101000',
      sector,
      estrato,
      numEmpleados,
      direccion: {
        calle: calle.trim() || 'Calle 60 Centro',
        colonia: 'Centro Histórico',
        codigoPostal,
        municipio,
        ciudad: 'Mérida, Yucatán',
      },
      contacto: {
        nombre: contactoNombre.trim() || 'Representante Acreditado',
        email: email.trim() || 'contacto@empresa.com',
        telefono: telefono.trim() || '9991234567',
      },
      fechaAfiliacion: fechaHoy,
      fechaVigencia,
      estatus: 'pendiente_pago',
      pagoConfirmado: false,
      montoPagado: 0,
      metodoPago,
      cfdiRequerido,
      folioIntegridad: generarFolioIntegridad(folioSiem),
      registroPatronalImss: registroPatronalImss.trim()
        ? registroPatronalImss.trim().toUpperCase()
        : undefined,
      registroEstatalAafy: registroEstatalAafy.trim()
        ? registroEstatalAafy.trim().toUpperCase()
        : undefined,
      afiliacionSimultanea,
      tramiteImssSolicitado,
    };
  };

  const registrarEnCrm = async (): Promise<{ leadId: string; socio: SocioCanacoRegistro }> => {
    const payload = {
      razonSocial: razonSocial.trim().toUpperCase() || 'EMPRESA COMERCIAL DE YUCATÁN',
      nombreComercial: nombreComercial.trim() || razonSocial.trim(),
      rfc: rfc.trim().toUpperCase() || 'XAXX010101000',
      sector,
      numEmpleados,
      municipio,
      calle,
      codigoPostal,
      contactoNombre: contactoNombre.trim() || 'Representante Acreditado',
      email: email.trim(),
      telefono: telefono.trim(),
      metodoPago,
      cfdiRequerido,
      tenantId: 'canaco_merida',
      registroPatronalImss: registroPatronalImss.trim() || undefined,
      registroEstatalAafy: registroEstatalAafy.trim() || undefined,
      afiliacionSimultanea,
      tramiteImssSolicitado,
    };

    const res = await fetch('/api/afiliaciones/captura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        consentimiento: {
          aceptado: avisoAceptado,
          avisoVersion: COMPLIANCE_LAST_UPDATED,
          fecha: new Date().toISOString(),
          medio: consentMedium,
        },
        consentimientoArkangel,
        isDemo: isDemoMode && rfc === CANACO_WALKTHROUGH_SOCIO_DEMO.rfc,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      leadId?: string;
      socio?: SocioCanacoRegistro;
    };
    if (!res.ok || !data.socio || !data.leadId) {
      throw new Error(data.error || 'No se pudo guardar el registro como pendiente.');
    }
    return { leadId: data.leadId, socio: data.socio };
  };

  const handleAvanzarPaso2 = async () => {
    setErrorVentanilla(null);
    if (
      !razonSocial.trim() ||
      !rfc.trim() ||
      !contactoNombre.trim() ||
      !email.trim() ||
      !telefono.trim()
    ) {
      setErrorVentanilla('Completa razón social, RFC, contacto, correo y teléfono para continuar.');
      return;
    }
    if (!isDemoMode && !avisoAceptado) {
      setErrorVentanilla('Acepta el Aviso de Privacidad para guardar tu solicitud.');
      return;
    }
    if (!isDemoMode) {
      setIsSaving(true);
      try {
        const registro = await registrarEnCrm();
        setLeadIdRegistrado(registro.leadId);
        setSocioGuardado(registro.socio);
        onRegistroGuardado?.(registro.socio);
      } catch (error) {
        setErrorVentanilla(
          error instanceof Error ? error.message : 'No se pudo guardar el registro.'
        );
        return;
      } finally {
        setIsSaving(false);
      }
    }
    setPaso(2);
  };

  const handleCompletarPago = async (forceSimulated = false) => {
    setIsProcessing(true);
    setErrorVentanilla(null);
    try {
      if (isDemoMode || forceSimulated) {
        setMensajePendiente(
          'Esta simulación no confirma un pago ni activa el registro. No se emite una Cédula, un alta SIEM ni un CFDI.'
        );
        setRegistroExitoso(crearRegistroPendienteLocal());
        return;
      }

      let registro = socioGuardado;
      let leadId = leadIdRegistrado;
      if (!registro || !leadId) {
        const guardado = await registrarEnCrm();
        registro = guardado.socio;
        leadId = guardado.leadId;
        setSocioGuardado(registro);
        setLeadIdRegistrado(leadId);
      }

      const registroRes = await fetch('/api/afiliaciones/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      const registroData = (await registroRes.json().catch(() => ({}))) as { error?: string };
      if (!registroRes.ok) {
        throw new Error(registroData.error || 'No se pudo validar el registro.');
      }

      if (metodoPago === 'clip') {
        setMensajePendiente(
          'Clip no está conectado a una confirmación de pago en este portal. El registro sigue pendiente y no se emitirá una Cédula hasta confirmar el pago.'
        );
        setRegistroExitoso(registro);
        return;
      }

      const conektaRes = await fetch('/api/canaco/conekta/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          metodoPago,
        }),
      });
      const conektaData = (await conektaRes.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        simulated?: boolean;
        error?: string;
      };
      if (!conektaRes.ok || !conektaData.ok) {
        throw new Error(conektaData.error || 'No se pudo iniciar el checkout de pago.');
      }
      if (conektaData.simulated || !conektaData.url) {
        setMensajePendiente(
          'El checkout está en modo simulación y no confirma un pago. Tu registro sigue pendiente; no se activó ni se emitió una Cédula.'
        );
        setRegistroExitoso(registro);
        return;
      }
      window.location.assign(conektaData.url);
    } catch (error) {
      setErrorVentanilla(
        error instanceof Error ? error.message : 'No se pudo confirmar el inicio del pago.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMigrarALedger = async () => {
    if (!registroExitoso) return;
    setIsMigrating(true);
    setMigracionError(null);

    try {
      const res = await fetch('/api/afiliaciones/migrar-a-ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folioSiem: registroExitoso.folioSiem,
          rfc: registroExitoso.rfc,
          razonSocial: registroExitoso.razonSocial,
          nombreComercial: registroExitoso.nombreComercial,
          email: registroExitoso.contacto.email,
          telefono: registroExitoso.contacto.telefono,
          contactoNombre: registroExitoso.contacto.nombre,
          numEmpleados: registroExitoso.numEmpleados,
          sector: registroExitoso.sector,
          municipio: registroExitoso.direccion.municipio,
          codigoPostal: registroExitoso.direccion.codigoPostal,
          registroPatronalImss: registroExitoso.registroPatronalImss,
          registroEstatalAafy: registroExitoso.registroEstatalAafy,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        tenantId?: string;
        client?: any;
        redirectTo?: string;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo vincular la empresa con el Expediente Único.');
      }

      if (typeof window !== 'undefined') {
        if (data.tenantId && data.client) {
          window.localStorage.setItem('ark.auth.active-tenant.v1', data.tenantId);
          window.localStorage.setItem(
            `ark_tools_active_client_${data.tenantId}`,
            JSON.stringify(data.client)
          );
          window.localStorage.setItem(
            `ark_tools_clients_cache_${data.tenantId}`,
            JSON.stringify([data.client])
          );
          window.localStorage.setItem('ark_onboarding_completed', 'true');
        }
        window.location.href = data.redirectTo || '/?tool=nomina&welcome=siem';
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con ARK LEDGER';
      setMigracionError(msg);
      setIsMigrating(false);
    }
  };

  const resetForm = () => {
    setPaso(1);
    setRegistroExitoso(null);
    setLeadIdRegistrado(null);
    setSocioGuardado(null);
    setErrorVentanilla(null);
    setMensajePendiente(
      'Registro recibido, aún sin confirmación. Este recorrido no emite una Cédula, un alta SIEM ni un CFDI.'
    );
    setIsSaving(false);
    setIsMigrating(false);
    setMigracionError(null);
    setRegistroPatronalImss('');
    setTramiteImssSolicitado(false);
    setRegistroEstatalAafy('');
    setAfiliacionSimultanea(true);
    setAvisoAceptado(false);
    setConsentimientoArkangel(false);
    onClose();
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-henequen-arena bg-henequen-cal p-6 font-inter text-henequen-grafito shadow-2xl sm:p-8">
        {/* Cabecera institucional HENEQUÉN */}
        <div className="flex items-start justify-between border-b border-henequen-arena pb-5">
          <div className="flex items-center gap-3">
            <CanacoLogo size={42} variant="symbol" />
            <div>
              <div className="font-fraunces text-lg font-bold tracking-tight text-henequen-anil sm:text-xl">
                Ventanilla Digital de Afiliación
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-henequen-terra">
                CANACO SERVYTUR MÉRIDA · SOLICITUD DE SEGUIMIENTO SIEM 2026
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full p-2 text-henequen-piedra transition hover:bg-henequen-sisal hover:text-henequen-anil"
            aria-label="Cerrar ventanilla"
          >
            <X size={18} />
          </button>
        </div>

        {/* Un registro pendiente nunca debe presentarse como una afiliación activa. */}
        {registroExitoso ? (
          registroExitoso.estatus !== 'activo' || registroExitoso.pagoConfirmado !== true ? (
            <div
              className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-left"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={22} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <h3 className="font-fraunces text-xl font-bold text-amber-950">
                    Registro pendiente de pago
                  </h3>
                  <p className="mt-1 text-sm text-amber-900">{mensajePendiente}</p>
                </div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-white p-3 text-xs">
                <div className="font-semibold text-henequen-grafito">
                  {registroExitoso.razonSocial} · RFC {registroExitoso.rfc}
                </div>
                <div className="mt-1 font-mono text-henequen-piedra">
                  Referencia interna: {registroExitoso.folioIntegridad}
                </div>
                <p className="mt-1 text-henequen-piedra">
                  Esta referencia no es un hash SHA-256, una constancia oficial ni una constancia
                  NOM-151. No se ha emitido una Cédula ni un CFDI.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href="mailto:pavel@arksystems.site?subject=Ayuda%20Ventanilla%20CANACO"
                  className="text-xs font-semibold text-henequen-anil underline"
                >
                  Contactar soporte técnico de ARK Systems
                </a>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-xs font-semibold text-amber-950"
                >
                  Volver al portal
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="font-fraunces text-2xl font-bold text-henequen-anil">
                  Pago confirmado
                </h3>
                <p className="mx-auto max-w-md text-sm text-henequen-piedra">
                  El pago se confirmó. Esto no acredita por sí solo el alta en el SIEM ni la emisión
                  de un CFDI.
                </p>
              </div>

              {/* Resumen de pago, no constancia oficial */}
              <div className="space-y-3 rounded-xl border border-henequen-arena bg-henequen-muro p-5 text-left shadow-tarjeta">
                <div className="flex items-center justify-between border-b border-henequen-arena/60 pb-3">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-henequen-terra">
                      Referencia SIEM generada por el portal
                    </span>
                    <span className="font-mono text-xs font-bold text-henequen-anil">
                      {registroExitoso.folioSiem}
                    </span>
                  </div>
                  <p className="text-[10px] text-henequen-piedra">
                    El pago no confirma que la Secretaría de Economía haya registrado el SIEM. Esta
                    pantalla no es una Cédula oficial.
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <ShieldCheck size={12} />
                    Pago confirmado
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-[10px] text-henequen-piedra">Razón Social</span>
                    <span className="font-semibold text-henequen-grafito">
                      {registroExitoso.razonSocial}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-henequen-piedra">RFC Registrado</span>
                    <span className="font-mono font-semibold text-henequen-grafito">
                      {registroExitoso.rfc}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-henequen-piedra">Estado del CFDI</span>
                    <span className="font-semibold text-henequen-grafito">
                      {registroExitoso.cfdiRequerido ? 'Pendiente de emisión' : 'No solicitado'}
                    </span>
                  </div>
                </div>

                {(registroExitoso.registroPatronalImss ||
                  registroExitoso.registroEstatalAafy ||
                  registroExitoso.afiliacionSimultanea) && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-henequen-arena/40 pt-2 text-[10px]">
                    <span className="rounded-full bg-henequen-anil/10 px-2 py-0.5 font-mono font-bold uppercase text-henequen-anil">
                      Ventanilla Única Tripartita
                    </span>
                    {registroExitoso.registroPatronalImss && (
                      <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono font-semibold text-emerald-800">
                        NRP IMSS: {registroExitoso.registroPatronalImss}
                      </span>
                    )}
                    {registroExitoso.tramiteImssSolicitado && (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono font-semibold text-amber-800">
                        Alta Patronal IMSS en gestión
                      </span>
                    )}
                    {registroExitoso.registroEstatalAafy && (
                      <span className="rounded-full border border-purple-300 bg-purple-50 px-2 py-0.5 font-mono font-semibold text-purple-800">
                        REC AAFY: {registroExitoso.registroEstatalAafy}
                      </span>
                    )}
                  </div>
                )}

                <div className="break-all rounded border border-henequen-arena/60 bg-henequen-sisal/40 p-2 font-mono text-[9.5px] text-henequen-piedra">
                  Folio de Integridad (referencia interna): {registroExitoso.folioIntegridad}. No es
                  un hash SHA-256 ni una constancia NOM-151.
                </div>
              </div>

              {/* ═══ ACCESO DIRECTO AL BUZÓN DOCUMENTAL ═══ */}
              <div className="rounded-xl border border-henequen-arena bg-henequen-muro p-4 text-left shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-henequen-anil text-white shadow">
                      <Inbox size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-henequen-anil">
                        Carga de documentos al buzón CANACO
                      </h4>
                      <p className="mt-0.5 text-[11px] text-henequen-piedra">
                        Puedes consultar o completar tu expediente desde el buzón documental. El
                        depósito de archivos no equivale a una emisión oficial.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBuzonOpen(true)}
                    className="shadow-xs inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-henequen-terra px-4 py-2.5 text-xs font-bold text-white transition hover:bg-henequen-terra-dark"
                  >
                    <Inbox size={14} />
                    <span>Abrir Buzón de Expediente</span>
                  </button>
                </div>
              </div>

              {/* ═══ PUENTE DE HANDOFF AL EXPEDIENTE ÚNICO ARK LEDGER ═══ */}
              <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-5 text-left shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow">
                    <Building2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      <Sparkles size={11} />
                      Beneficio Exclusivo Socio CANACO
                    </div>
                    <h4 className="font-fraunces text-base font-bold text-henequen-anil">
                      Pago confirmado; continúa el registro con CANACO
                    </h4>
                    <p className="text-xs leading-relaxed text-henequen-grafito">
                      La importación de datos abre herramientas de ARK LEDGER. No emite CFDI ni
                      acredita por sí sola el alta ante el SIEM.
                    </p>
                  </div>
                </div>

                {migracionError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    {migracionError}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-henequen-arena bg-white px-4 py-2.5 text-xs font-semibold text-henequen-piedra transition hover:text-henequen-anil"
                  >
                    Continuar navegando en el portal
                  </button>
                  <button
                    type="button"
                    onClick={handleMigrarALedger}
                    disabled={isMigrating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isMigrating ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Importando a Expediente Único...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Importar Empresa y Abrir herramientas</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* ═══ PASOS DE CAPTURA ═══ */
          <div className="space-y-6 py-5">
            {/* Indicador de pasos */}
            <div className="flex items-center justify-between border-b border-henequen-arena/80 pb-3 text-xs font-semibold">
              <div
                className={`flex items-center gap-1.5 ${paso === 1 ? 'font-bold text-henequen-terra' : 'text-henequen-piedra'}`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                  1
                </span>
                <span>Datos del Negocio</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${paso === 2 ? 'font-bold text-henequen-terra' : 'text-henequen-piedra'}`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                  2
                </span>
                <span>Cotización & Beneficios</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${paso === 3 ? 'font-bold text-henequen-terra' : 'text-henequen-piedra'}`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                  3
                </span>
                <span>Pago & Factura</span>
              </div>
            </div>

            {/* PASO 1: DATOS */}
            {paso === 1 && (
              <div className="space-y-4 text-xs">
                {isDemoMode && (
                  <div className="flex flex-col gap-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <FlaskConical size={16} className="mt-0.5 shrink-0 text-amber-700" />
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-900">
                          Modo Walkthrough Directivo Activo
                        </span>
                        <span className="text-[11px] text-amber-800">
                          Autollena en 1 clic el caso de 15 empleados (Comercializadora del Mayab ·
                          Mérida).
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAutollenarWalkthrough(false)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-amber-700"
                      >
                        <Zap size={12} />
                        <span>Autollenar Socio Demo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAutollenarWalkthrough(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100"
                      >
                        <span>Ir directo a Pago (Paso 3) →</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor={razonSocialId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Razón Social o Nombre del Contribuyente *
                    </label>
                    <input
                      id={razonSocialId}
                      type="text"
                      placeholder="Ej. Comercializadora del Mayab S.A. de C.V."
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={nombreComercialId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Nombre Comercial
                    </label>
                    <input
                      id={nombreComercialId}
                      type="text"
                      placeholder="Ej. Tiendas Mayab"
                      value={nombreComercial}
                      onChange={(e) => setNombreComercial(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor={rfcId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      RFC *
                    </label>
                    <input
                      id={rfcId}
                      type="text"
                      placeholder="CMA200101AB1"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 font-mono text-xs uppercase focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={sectorId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Sector
                    </label>
                    <select
                      id={sectorId}
                      value={sector}
                      onChange={(e) => setSector(e.target.value as SectorEconomico)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    >
                      <option value="comercio">Comercio al por Menor / Mayor</option>
                      <option value="servicios">Servicios Profesionales / Técnicos</option>
                      <option value="turismo">Turismo, Hotelería y Restaurantes</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={numEmpleadosId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Empleados (para estimar tamaño)
                    </label>
                    <input
                      id={numEmpleadosId}
                      type="number"
                      min={1}
                      max={5000}
                      value={numEmpleados}
                      onChange={(e) =>
                        setNumEmpleados(Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 font-mono text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-950">
                  En el flujo real, los datos fiscales, de contacto y domicilio se envían al CRM
                  CANACO (Cloudflare D1) para dar seguimiento; no se envían a SAT, IMSS o AAFY. En
                  modo demo no se transmiten ni guardan.{' '}
                  <button
                    type="button"
                    onClick={onOpenPrivacyNotice}
                    className="font-bold underline"
                  >
                    Consultar Aviso de Privacidad
                  </button>
                </div>

                <div className="space-y-2 rounded-lg border border-henequen-arena bg-white p-3 text-[11px]">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={avisoAceptado}
                      onChange={(event) => setAvisoAceptado(event.target.checked)}
                      aria-describedby="canaco-privacy-consent-help"
                    />
                    <span>
                      He leído y acepto el Aviso de Privacidad (versión {COMPLIANCE_LAST_UPDATED}).
                    </span>
                  </label>
                  <p id="canaco-privacy-consent-help" className="text-henequen-piedra">
                    La aceptación se registra con fecha y medio de captura.
                  </p>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={consentimientoArkangel}
                      onChange={(event) => setConsentimientoArkangel(event.target.checked)}
                    />
                    <span>
                      Autorizo compartir mis datos de contacto con el proveedor de seguimiento
                      Arkangel para recibir comunicaciones sobre esta solicitud. Es opcional.
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor={municipioId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Municipio en Yucatán
                    </label>
                    <input
                      id={municipioId}
                      type="text"
                      value={municipio}
                      onChange={(e) => setMunicipio(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={calleId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Calle y Número
                    </label>
                    <input
                      id={calleId}
                      type="text"
                      placeholder="Calle 60 #450 x 53"
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={cpId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Código Postal
                    </label>
                    <input
                      id={cpId}
                      type="text"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 font-mono text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor={contactoNombreId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Nombre de Contacto *
                    </label>
                    <input
                      id={contactoNombreId}
                      type="text"
                      placeholder="Lic. María Méndez"
                      value={contactoNombre}
                      onChange={(e) => setContactoNombre(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={emailId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Correo Electrónico (Para seguimiento) *
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      placeholder="facturacion@mayab.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={telefonoId}
                      className="mb-1 block font-semibold text-henequen-grafito"
                    >
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      id={telefonoId}
                      type="tel"
                      placeholder="999 123 4567"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full rounded-lg border border-henequen-arena bg-henequen-muro px-3 py-2 text-xs focus:border-henequen-anil focus:outline-none"
                    />
                  </div>
                </div>

                {/* ═══ PROGRAMA DE AFILIACIÓN SIMULTÁNEA AAFY — SAT — IMSS ═══ */}
                <div className="space-y-3 rounded-xl border border-henequen-anil/25 bg-gradient-to-br from-henequen-cal to-henequen-sisal/30 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      id="check-afiliacion-simultanea"
                      type="checkbox"
                      checked={afiliacionSimultanea}
                      onChange={(e) => setAfiliacionSimultanea(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-henequen-arena text-henequen-terra focus:ring-henequen-anil"
                    />
                    <label htmlFor="check-afiliacion-simultanea" className="cursor-pointer">
                      <span className="block text-xs font-bold text-henequen-anil">
                        Solicitar orientación sobre trámites relacionados
                      </span>
                      <span className="block text-[11px] leading-relaxed text-henequen-piedra">
                        Estos datos se usan para seguimiento. Este formulario no registra ni
                        modifica trámites ante IMSS, SAT o AAFY; CANACO debe confirmar los pasos y
                        requisitos aplicables.
                      </span>
                    </label>
                  </div>

                  {afiliacionSimultanea && (
                    <div className="grid grid-cols-1 gap-3 border-t border-henequen-arena/60 pt-2 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={nrpId}
                          className="mb-1 block text-[11px] font-semibold text-henequen-grafito"
                        >
                          Registro Patronal IMSS (NRP - 11 caracteres)
                        </label>
                        <input
                          id={nrpId}
                          type="text"
                          maxLength={11}
                          disabled={tramiteImssSolicitado}
                          placeholder={
                            tramiteImssSolicitado
                              ? 'Trámite de alta patronal solicitado'
                              : 'Ej. Y1234567101'
                          }
                          value={registroPatronalImss}
                          onChange={(e) => setRegistroPatronalImss(e.target.value.toUpperCase())}
                          className="w-full rounded-lg border border-henequen-arena bg-white px-3 py-1.5 font-mono text-xs uppercase focus:border-henequen-anil focus:outline-none disabled:bg-henequen-muro disabled:text-henequen-piedra"
                        />
                        <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-[10px] text-henequen-piedra">
                          <input
                            type="checkbox"
                            checked={tramiteImssSolicitado}
                            onChange={(e) => {
                              setTramiteImssSolicitado(e.target.checked);
                              if (e.target.checked) setRegistroPatronalImss('');
                            }}
                            className="h-3 w-3 rounded text-henequen-terra"
                          />
                          <span>Aún no tengo NRP, requiero asesoría para mi Alta Patronal</span>
                        </label>
                      </div>

                      <div>
                        <label
                          htmlFor={recId}
                          className="mb-1 block text-[11px] font-semibold text-henequen-grafito"
                        >
                          Padrón Estatal AAFY (REC / ISN Yucatán)
                        </label>
                        <input
                          id={recId}
                          type="text"
                          placeholder="Ej. REC-MID-2026 / Opcional"
                          value={registroEstatalAafy}
                          onChange={(e) => setRegistroEstatalAafy(e.target.value.toUpperCase())}
                          className="w-full rounded-lg border border-henequen-arena bg-white px-3 py-1.5 font-mono text-xs uppercase focus:border-henequen-anil focus:outline-none"
                        />
                        <span className="mt-1 block text-[10px] text-henequen-piedra">
                          Este portal no genera una cédula ISN ni presenta declaraciones ante AAFY.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {errorVentanilla && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                  >
                    {errorVentanilla}
                  </p>
                )}

                <div className="space-y-2 border-t border-henequen-arena/60 pt-3">
                  <p className="text-[11px] leading-relaxed text-henequen-piedra">
                    {isDemoMode
                      ? 'En el modo demo, estos datos no se envían ni guardan.'
                      : 'Al continuar, guardamos estos datos en el CRM de Ark/CANACO (Cloudflare D1) para dar seguimiento al registro. El registro queda pendiente de pago.'}
                  </p>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleAvanzarPaso2()}
                      disabled={isSaving || (!isDemoMode && !avisoAceptado)}
                      className="inline-flex items-center gap-2 rounded-lg bg-henequen-terra px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-henequen-terra-dark disabled:opacity-50"
                    >
                      <span>
                        {isSaving ? 'Guardando registro...' : 'Calcular Cuota y Ver Beneficios'}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: COTIZACIÓN */}
            {paso === 2 && (
              <div className="space-y-4 text-xs">
                {/* Cuadro de resumen tarifario */}
                <div className="space-y-4 rounded-xl border border-henequen-arena bg-henequen-muro p-5 shadow-tarjeta">
                  <div className="flex items-center justify-between border-b border-henequen-arena/60 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-henequen-terra">
                        Estrato de referencia
                      </span>
                      <div className="font-fraunces text-base font-bold capitalize text-henequen-anil">
                        Empresa {cotizacion.estrato} ({numEmpleados} colaboradores)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-henequen-piedra">
                        Importe de referencia (prototipo)
                      </span>
                      <span className="font-mono text-xl font-bold text-henequen-anil">
                        ${cotizacion.totalAnual.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-amber-900">
                    Estos importes del prototipo están pendientes de confirmación por CANACO; no son
                    una tarifa oficial. No pagues hasta recibir una cotización confirmada.
                  </p>

                  {/* Desglose de referencia */}
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-henequen-arena/40 bg-henequen-sisal/30 p-3">
                    <div>
                      <span className="block text-[10px] text-henequen-piedra">
                        SIEM 2026 (referencia del prototipo)
                      </span>
                      <span className="font-mono font-semibold text-henequen-grafito">
                        ${cotizacion.cuotaSiem.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-henequen-piedra">
                        Membresía anual (referencia del prototipo)
                      </span>
                      <span className="font-mono font-semibold text-henequen-grafito">
                        ${cotizacion.cuotaMembresia.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                  </div>

                  {/* Beneficios */}
                  <div>
                    <span className="mb-2 block text-[11px] font-bold text-henequen-anil">
                      Beneficios y Respaldos Incluidos:
                    </span>
                    <ul className="grid grid-cols-1 gap-2 text-[11px] text-henequen-grafito sm:grid-cols-2">
                      {cotizacion.beneficios.map((b) => (
                        <li key={b} className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-henequen-verde" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="rounded-lg border border-henequen-arena bg-white px-4 py-2 text-xs font-semibold text-henequen-piedra transition hover:text-henequen-anil"
                  >
                    Volver a Datos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaso(3)}
                    className="inline-flex items-center gap-2 rounded-lg bg-henequen-terra px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-henequen-terra-dark"
                  >
                    <span>Revisar métodos de pago</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: OPCIONES DE PAGO */}
            {paso === 3 && (
              <div className="space-y-4 text-xs">
                {/* Selector de método de pago */}
                <div className="space-y-2">
                  <label className="block font-semibold text-henequen-grafito">
                    Selecciona el Método de Liquidación:
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setMetodoPago('tarjeta')}
                      className={`rounded-xl border p-3 text-center transition ${
                        metodoPago === 'tarjeta'
                          ? 'shadow-xs border-henequen-anil bg-henequen-sisal/40 font-bold text-henequen-anil'
                          : 'border-henequen-arena bg-white text-henequen-piedra hover:border-henequen-anil/40'
                      }`}
                    >
                      <CreditCard size={18} className="mx-auto mb-1 text-henequen-anil" />
                      <span className="block text-[11px]">Tarjeta Bancaria</span>
                      <span className="text-[9px] text-henequen-piedra">Débito / Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMetodoPago('spei')}
                      className={`rounded-xl border p-3 text-center transition ${
                        metodoPago === 'spei'
                          ? 'shadow-xs border-henequen-anil bg-henequen-sisal/40 font-bold text-henequen-anil'
                          : 'border-henequen-arena bg-white text-henequen-piedra hover:border-henequen-anil/40'
                      }`}
                    >
                      <Building2 size={18} className="mx-auto mb-1 text-henequen-terra" />
                      <span className="block text-[11px]">Transferencia SPEI</span>
                      <span className="text-[9px] text-henequen-piedra">SPEI por Conekta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMetodoPago('clip')}
                      className={`rounded-xl border p-3 text-center transition ${
                        metodoPago === 'clip'
                          ? 'shadow-xs border-henequen-anil bg-henequen-sisal/40 font-bold text-henequen-anil'
                          : 'border-henequen-arena bg-white text-henequen-piedra hover:border-henequen-anil/40'
                      }`}
                    >
                      <QrCode size={18} className="mx-auto mb-1 text-henequen-verde" />
                      <span className="block text-[11px]">Clip</span>
                      <span className="text-[9px] text-henequen-piedra">No conectado</span>
                    </button>
                  </div>
                </div>

                {/* Simulador Interactivo de Pasarela (Visible solo en Modo Walkthrough / Demo) */}
                {isDemoMode && (
                  <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-amber-950">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                        <FlaskConical size={14} className="text-amber-700" />
                        Simulador de Pasarela (Modo Walkthrough)
                      </span>
                      <span className="rounded-full bg-amber-200/80 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-900">
                        Visible solo con ?demo=1
                      </span>
                    </div>

                    {metodoPago === 'tarjeta' && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3">
                          <div className="flex items-center gap-2.5">
                            <CreditCard size={18} className="text-henequen-anil" />
                            <div>
                              <div className="font-mono text-xs font-bold text-henequen-grafito">
                                VISA de prueba •••• 4242
                              </div>
                              <div className="text-[10px] text-henequen-piedra">
                                Dato de prueba de Conekta Sandbox; no usar una tarjeta real.
                              </div>
                            </div>
                          </div>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Solo sandbox
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-900">
                          La simulación solo muestra el estado pendiente. No realiza un cargo, no
                          confirma pago ni activa el registro.
                        </p>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => void handleCompletarPago(true)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white"
                        >
                          <FlaskConical size={13} />
                          <span>Simular recorrido (sin pago)</span>
                        </button>
                      </div>
                    )}

                    {metodoPago === 'spei' && (
                      <div className="space-y-2.5">
                        <div className="rounded-lg border border-amber-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-henequen-terra">
                              Transferencia SPEI (prueba)
                            </span>
                            <span className="font-mono text-[10px] font-semibold text-amber-700">
                              Sin datos bancarios
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-henequen-piedra">
                            No se ha proporcionado una CLABE para este modo demo. Una transferencia
                            solo cuenta tras una confirmación recibida por el servidor.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => void handleCompletarPago(true)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <Zap size={13} />
                          <span>Simular recorrido SPEI (sin transferencia)</span>
                        </button>
                      </div>
                    )}

                    {metodoPago === 'clip' && (
                      <div className="space-y-2.5">
                        <p className="text-[11px] text-amber-900">
                          Clip no está conectado a una confirmación segura. No se abrirá ningún link
                          ni se marcará el registro como pagado.
                        </p>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => void handleCompletarPago(true)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={13} />
                          <span>Mostrar registro pendiente (sin pago)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Solicitud de CFDI */}
                <div className="space-y-2 rounded-xl border border-henequen-arena bg-henequen-muro p-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cfdiRequerido}
                      onChange={(e) => setCfdiRequerido(e.target.checked)}
                      className="rounded border-henequen-arena text-henequen-anil focus:ring-henequen-anil"
                    />
                    <span className="text-xs font-semibold text-henequen-grafito">
                      Solicitar CFDI (no se emite desde este flujo)
                    </span>
                  </label>
                  <p className="pl-6 text-[11px] text-henequen-piedra">
                    Si solicitas CFDI, CANACO deberá confirmar los datos y la emisión por separado.
                    Marcar esta opción no timbra ni envía una factura.
                  </p>
                </div>

                {/* Importe final */}
                <div className="flex items-center justify-between rounded-xl bg-henequen-anil p-4 text-white">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-henequen-arena">
                      Importe de referencia (no pagar sin confirmación)
                    </span>
                    <span className="text-xs text-henequen-sisal">
                      SIEM: ${cotizacion.cuotaSiem.toLocaleString('es-MX')} + membresía: $
                      {cotizacion.cuotaMembresia.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <div className="font-mono text-2xl font-bold">
                    ${cotizacion.totalAnual.toLocaleString('es-MX')} MXN
                  </div>
                </div>

                {errorVentanilla && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                  >
                    {errorVentanilla}
                  </p>
                )}

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPaso(2)}
                    disabled={isProcessing}
                    className="rounded-lg border border-henequen-arena bg-white px-4 py-2 text-xs font-semibold text-henequen-piedra transition hover:text-henequen-anil"
                  >
                    Volver a Cotización
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCompletarPago(false)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 rounded-lg bg-henequen-terra px-6 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-henequen-terra-dark disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Iniciando checkout...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck2 size={15} />
                        <span>
                          {isDemoMode ? 'Simular recorrido (sin pago)' : 'Continuar a pago'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {registroExitoso && (
        <BuzonDocumentalModal
          isOpen={buzonOpen}
          onClose={() => setBuzonOpen(false)}
          rfcInicial={registroExitoso.rfc}
          emailInicial={registroExitoso.contacto?.email || ''}
        />
      )}
    </div>
  );
}

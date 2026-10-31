/**
 * CANACO SERVYTUR MÉRIDA — Buzón Documental (Oficialía de Partes Digital)
 *
 * Ventana con metáfora de buzón físico institucional (Design System HENEQUÉN):
 * placa de latón, ranura de depósito y 7 casilleros numerados donde el socio
 * deposita su expediente. Flujo "sube uno, regresa luego": el avance se guarda
 * por RFC y se retoma desde la Consulta de Socio de la landing.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  X,
  Mail,
  Upload,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Inbox,
} from 'lucide-react';
import {
  DOCUMENTOS_BUZON_CANACO,
  MIME_PERMITIDOS_BUZON,
  MAX_BYTES_BUZON_R2,
  type DocumentoCanacoDef,
  type TipoDocumentoCanaco,
  type TipoPersonaCanaco,
} from './documentosBuzon';
import { abrirAnexoCanaco } from './anexosCanaco';

export interface SlotBuzonUI {
  tipo: TipoDocumentoCanaco;
  estatus: 'pendiente' | 'recibido' | 'aprobado' | 'rechazado';
  nombreArchivo?: string;
  tamanoBytes?: number;
  sha256?: string;
  motivoRechazo?: string | null;
  depositadoEn?: string | null;
}

interface ExpedienteBuzon {
  rfc: string;
  razonSocial: string;
  contactoNombre?: string | null;
  folioSiem?: string | null;
  tipoPersona: TipoPersonaCanaco;
  requeridos: number;
  depositados: number;
  completo: boolean;
  slots: SlotBuzonUI[];
}

interface AcuseBuzon {
  folio: string;
  tipoDocumento: TipoDocumentoCanaco;
  nombreArchivo: string;
  sha256: string;
  recibidoEn: string;
}

export interface BuzonDocumentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfcInicial?: string;
  emailInicial?: string;
  /** Notifica el avance para refrescar badges externos (landing / consola). */
  onProgreso?: (depositados: number, requeridos: number) => void;
}

const ACCEPT_ATTR = MIME_PERMITIDOS_BUZON.join(',');

function formatearTamano(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function BuzonDocumentalModal({
  isOpen,
  onClose,
  rfcInicial = '',
  emailInicial = '',
  onProgreso,
}: BuzonDocumentalModalProps) {
  const rfcInputId = useId();
  const emailInputId = useId();
  const [rfc, setRfc] = useState(rfcInicial);
  const [email, setEmail] = useState(emailInicial);
  const [expediente, setExpediente] = useState<ExpedienteBuzon | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<TipoDocumentoCanaco | null>(null);
  const [errorSlot, setErrorSlot] = useState<{ tipo: TipoDocumentoCanaco; msg: string } | null>(
    null
  );
  const [arrastrando, setArrastrando] = useState<TipoDocumentoCanaco | null>(null);
  const [ultimoAcuse, setUltimoAcuse] = useState<AcuseBuzon | null>(null);
  const [sobreCayendo, setSobreCayendo] = useState(false);
  const inputsRef = useRef<Partial<Record<TipoDocumentoCanaco, HTMLInputElement | null>>>({});
  const autoAbiertoRef = useRef(false);

  const abrirBuzon = useCallback(
    async (rfcValor: string, emailValor: string) => {
      setAbriendo(true);
      setErrorAcceso(null);
      try {
        const res = await fetch('/api/canaco/buzon/acceso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rfc: rfcValor.trim().toUpperCase(), email: emailValor.trim() }),
        });
        const data = (await res.json().catch(() => ({}))) as Partial<ExpedienteBuzon> & {
          error?: string;
        };
        if (!res.ok || !data.slots) {
          setErrorAcceso(data.error || 'No fue posible abrir el buzón. Intenta de nuevo.');
          return;
        }
        setExpediente(data as ExpedienteBuzon);
        onProgreso?.(data.depositados || 0, data.requeridos || 0);
      } catch {
        setErrorAcceso('Sin conexión con la Oficialía de Partes. Intenta en unos momentos.');
      } finally {
        setAbriendo(false);
      }
    },
    [onProgreso]
  );

  // Apertura automática cuando venimos de la Ventanilla (RFC + correo ya conocidos)
  useEffect(() => {
    if (!isOpen) {
      autoAbiertoRef.current = false;
      return;
    }
    setRfc(rfcInicial);
    setEmail(emailInicial);
    if (rfcInicial && emailInicial && !autoAbiertoRef.current) {
      autoAbiertoRef.current = true;
      void abrirBuzon(rfcInicial, emailInicial);
    }
  }, [isOpen, rfcInicial, emailInicial, abrirBuzon]);

  if (!isOpen) return null;

  const cerrar = () => {
    setExpediente(null);
    setUltimoAcuse(null);
    setErrorAcceso(null);
    setErrorSlot(null);
    onClose();
  };

  const depositar = async (def: DocumentoCanacoDef, file: File) => {
    if (!expediente) return;
    setErrorSlot(null);

    if (!MIME_PERMITIDOS_BUZON.includes(file.type)) {
      setErrorSlot({ tipo: def.tipo, msg: 'Formato no permitido. Usa PDF, JPG, PNG o WEBP.' });
      return;
    }
    if (file.size > MAX_BYTES_BUZON_R2) {
      setErrorSlot({ tipo: def.tipo, msg: 'El archivo supera 10 MB.' });
      return;
    }

    setSubiendo(def.tipo);
    setSobreCayendo(true);
    try {
      const form = new FormData();
      form.append('rfc', expediente.rfc);
      form.append('email', email.trim());
      form.append('tipoDocumento', def.tipo);
      form.append('archivo', file);

      const res = await fetch('/api/canaco/buzon/upload', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        acuse?: AcuseBuzon;
        slots?: SlotBuzonUI[];
        depositados?: number;
        requeridos?: number;
        completo?: boolean;
      };

      if (!res.ok || !data.slots) {
        setErrorSlot({ tipo: def.tipo, msg: data.error || 'No se pudo depositar el documento.' });
        return;
      }

      setExpediente((prev) =>
        prev
          ? {
              ...prev,
              slots: data.slots || prev.slots,
              depositados: data.depositados ?? prev.depositados,
              requeridos: data.requeridos ?? prev.requeridos,
              completo: Boolean(data.completo),
            }
          : prev
      );
      if (data.acuse) setUltimoAcuse(data.acuse);
      onProgreso?.(data.depositados || 0, data.requeridos || 0);
    } catch {
      setErrorSlot({ tipo: def.tipo, msg: 'Sin conexión. Vuelve a intentarlo.' });
    } finally {
      setSubiendo(null);
      setTimeout(() => setSobreCayendo(false), 900);
    }
  };

  const onArchivoElegido = (def: DocumentoCanacoDef, files: FileList | null) => {
    const file = files?.[0];
    if (file) void depositar(def, file);
    const input = inputsRef.current[def.tipo];
    if (input) input.value = '';
  };

  const progresoPct = expediente
    ? Math.round((expediente.depositados / Math.max(1, expediente.requeridos)) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Buzón Documental CANACO"
    >
      <div className="relative my-6 w-full max-w-4xl font-inter text-henequen-grafito">
        {/* ═══ CUERPO DEL BUZÓN (metal añil con placa de latón) ═══ */}
        <div className="relative overflow-hidden rounded-t-[2.25rem] border-4 border-[#0E2236] bg-gradient-to-b from-henequen-anil to-henequen-anil-deep px-5 pb-8 pt-6 shadow-2xl sm:px-10">
          {/* Remaches */}
          {['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3'].map((pos) => (
            <span
              key={pos}
              aria-hidden="true"
              className={`absolute ${pos} h-3 w-3 rounded-full bg-gradient-to-br from-[#E8D27A] to-[#8A6F1A] shadow-inner`}
            />
          ))}

          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar buzón"
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-henequen-sisal transition hover:bg-white/20"
          >
            <X size={18} />
          </button>

          {/* Placa de latón grabada */}
          <div className="mx-auto max-w-xl rounded-lg border-2 border-[#6B5414] bg-gradient-to-b from-[#E8D27A] via-[#C9A227] to-[#8A6F1A] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_10px_rgba(0,0,0,0.35)]">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#3B2D06]">
              Oficialía de Partes
            </div>
            <div className="font-fraunces text-lg font-bold tracking-wide text-[#2A2004] sm:text-2xl">
              BUZÓN DE EXPEDIENTE CANACO
            </div>
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-[#3B2D06]/80">
              Servytur Mérida · Registro SIEM 2026
            </div>
          </div>

          {/* Ranura de depósito */}
          <div className="relative mx-auto mt-6 max-w-2xl">
            <div
              aria-hidden="true"
              className={`absolute left-1/2 top-0 z-10 -translate-x-1/2 transition-all duration-700 ease-in ${
                sobreCayendo ? 'translate-y-6 opacity-0' : '-translate-y-10 opacity-0'
              }`}
            >
              <div className="flex h-10 w-16 items-center justify-center rounded-sm border border-henequen-arena bg-henequen-muro shadow-lg">
                <Mail size={18} className="text-henequen-terra" />
              </div>
            </div>
            <div className="rounded-xl border-4 border-[#8A6F1A] bg-gradient-to-b from-[#C9A227] to-[#6B5414] p-1.5 shadow-lg">
              <div className="h-4 rounded-md bg-[#05101C] shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)]" />
            </div>
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-henequen-sisal/80">
              ▼ Depósito de documentos oficiales ▼
            </p>
          </div>

          {expediente && (
            <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-white/15 bg-white/5 p-4 text-henequen-sisal">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-semibold text-white">{expediente.razonSocial}</div>
                  <div className="font-mono text-[11px] text-henequen-sisal/80">
                    RFC {expediente.rfc} · Persona{' '}
                    {expediente.tipoPersona === 'moral' ? 'Moral' : 'Física'}
                    {expediente.folioSiem ? ` · Folio ${expediente.folioSiem}` : ''}
                  </div>
                </div>
                <div
                  className="font-mono text-sm font-bold text-white"
                  data-testid="buzon-progreso"
                >
                  {expediente.depositados} de {expediente.requeridos} depositados
                </div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#C9A227] to-emerald-400 transition-all duration-500"
                  style={{ width: `${progresoPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-henequen-sisal/85">
                {expediente.completo
                  ? '¡Expediente completo! La Cámara cotejará tus documentos y te notificará por correo.'
                  : '¿Te falta algún documento? Cierra cuando quieras: tu avance queda guardado. Regresa buscando tu RFC en “Consulta de Socio”.'}
              </p>
            </div>
          )}
        </div>

        {/* ═══ PUERTA DEL BUZÓN: ACCESO O CASILLEROS ═══ */}
        <div className="rounded-b-3xl border-4 border-t-0 border-[#0E2236] bg-henequen-sisal p-5 shadow-2xl sm:p-8">
          {!expediente ? (
            <form
              className="mx-auto max-w-md space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void abrirBuzon(rfc, email);
              }}
            >
              <div className="flex items-center gap-2 text-henequen-anil">
                <Lock size={16} />
                <h3 className="font-fraunces text-lg font-bold">Abre tu buzón</h3>
              </div>
              <p className="text-xs text-henequen-piedra">
                Ingresa el RFC con el que hiciste tu registro SIEM y el correo que capturaste. Solo
                tú y la Cámara pueden ver los documentos depositados.
              </p>
              <div>
                <label
                  htmlFor={rfcInputId}
                  className="mb-1 block text-xs font-semibold text-henequen-grafito"
                >
                  RFC de la empresa o persona física
                </label>
                <input
                  id={rfcInputId}
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  maxLength={13}
                  required
                  className="w-full rounded-lg border border-henequen-arena bg-white px-3 py-2.5 font-mono text-sm uppercase focus:border-henequen-anil focus:outline-none"
                  placeholder="AMA200101AB1"
                />
              </div>
              <div>
                <label
                  htmlFor={emailInputId}
                  className="mb-1 block text-xs font-semibold text-henequen-grafito"
                >
                  Correo registrado en la Ventanilla
                </label>
                <input
                  id={emailInputId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-henequen-arena bg-white px-3 py-2.5 text-sm focus:border-henequen-anil focus:outline-none"
                  placeholder="facturacion@empresa.mx"
                />
              </div>
              {errorAcceso && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {errorAcceso}
                </div>
              )}
              <button
                type="submit"
                disabled={abriendo}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-henequen-anil px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow transition hover:bg-henequen-anil-deep disabled:opacity-50"
              >
                <Inbox size={15} />
                {abriendo ? 'Abriendo buzón...' : 'Abrir mi Buzón'}
              </button>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {DOCUMENTOS_BUZON_CANACO.map((def) => {
                  const aplica = def.aplicaA.includes(expediente.tipoPersona);
                  const slot = expediente.slots.find((s) => s.tipo === def.tipo);
                  const estatus = slot?.estatus || 'pendiente';
                  const ocupado = subiendo === def.tipo;
                  const errorAqui = errorSlot?.tipo === def.tipo ? errorSlot.msg : null;
                  const puedeSubir = aplica && estatus !== 'aprobado' && !ocupado;

                  return (
                    <div
                      key={def.tipo}
                      data-testid={`casillero-${def.tipo}`}
                      onDragOver={(e) => {
                        if (!puedeSubir) return;
                        e.preventDefault();
                        setArrastrando(def.tipo);
                      }}
                      onDragLeave={() => setArrastrando(null)}
                      onDrop={(e) => {
                        if (!puedeSubir) return;
                        e.preventDefault();
                        setArrastrando(null);
                        onArchivoElegido(def, e.dataTransfer.files);
                      }}
                      className={`relative overflow-hidden rounded-xl border-2 p-4 shadow-[inset_0_6px_14px_rgba(60,40,10,0.18)] transition ${
                        !aplica
                          ? 'border-henequen-arena bg-henequen-cal/60 opacity-60'
                          : arrastrando === def.tipo
                            ? 'border-henequen-terra bg-amber-50'
                            : estatus === 'rechazado'
                              ? 'border-red-300 bg-red-50/70'
                              : estatus === 'pendiente'
                                ? 'border-dashed border-[#B8A27A] bg-henequen-muro'
                                : 'border-emerald-300 bg-henequen-muro'
                      }`}
                    >
                      {/* Placa numerada */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#6B5414] bg-gradient-to-b from-[#E8D27A] to-[#8A6F1A] font-mono text-xs font-bold text-[#2A2004] shadow">
                          Nº{def.numero}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-henequen-anil">{def.titulo}</h4>
                          <p className="mt-0.5 text-[11px] leading-snug text-henequen-piedra">
                            {aplica ? def.descripcion : 'No aplica para persona física.'}
                          </p>
                        </div>
                      </div>

                      {/* Sello de estatus */}
                      {aplica && estatus !== 'pendiente' && (
                        <span
                          className={`pointer-events-none absolute right-3 top-3 rotate-[-12deg] rounded border-2 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest ${
                            estatus === 'aprobado'
                              ? 'border-emerald-700 text-emerald-700'
                              : estatus === 'rechazado'
                                ? 'border-red-700 text-red-700'
                                : 'border-henequen-terra text-henequen-terra'
                          }`}
                        >
                          {estatus === 'aprobado'
                            ? 'Cotejado'
                            : estatus === 'rechazado'
                              ? 'Rechazado'
                              : 'Recibido'}
                        </span>
                      )}

                      {aplica && (
                        <div className="mt-3 space-y-2">
                          {slot?.nombreArchivo && (
                            <div className="flex items-center gap-1.5 truncate rounded border border-henequen-arena/70 bg-white/70 px-2 py-1 font-mono text-[10px] text-henequen-grafito">
                              <CheckCircle2 size={11} className="shrink-0 text-emerald-600" />
                              <span className="truncate">{slot.nombreArchivo}</span>
                              <span className="ml-auto shrink-0 text-henequen-piedra">
                                {formatearTamano(slot.tamanoBytes)}
                              </span>
                            </div>
                          )}

                          {estatus === 'rechazado' && slot?.motivoRechazo && (
                            <div className="flex items-start gap-1.5 rounded border border-red-200 bg-white p-2 text-[11px] text-red-700">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                              <span>{slot.motivoRechazo}</span>
                            </div>
                          )}

                          {errorAqui && (
                            <div className="rounded border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                              {errorAqui}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {def.anexo && estatus !== 'aprobado' && (
                              <button
                                type="button"
                                onClick={() =>
                                  abrirAnexoCanaco(def.anexo!, {
                                    rfc: expediente.rfc,
                                    razonSocial: expediente.razonSocial,
                                    contactoNombre: expediente.contactoNombre || '',
                                    folioSiem: expediente.folioSiem || '',
                                    tipoPersona: expediente.tipoPersona,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-henequen-anil/30 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-henequen-anil transition hover:bg-henequen-cal"
                              >
                                <FileDown size={12} />
                                Descargar formato prellenado
                              </button>
                            )}

                            {estatus !== 'aprobado' && (
                              <>
                                <input
                                  ref={(el) => {
                                    inputsRef.current[def.tipo] = el;
                                  }}
                                  type="file"
                                  accept={ACCEPT_ATTR}
                                  className="hidden"
                                  aria-label={`Archivo para ${def.titulo}`}
                                  onChange={(e) => onArchivoElegido(def, e.target.files)}
                                />
                                <button
                                  type="button"
                                  disabled={!puedeSubir}
                                  onClick={() => inputsRef.current[def.tipo]?.click()}
                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition disabled:opacity-50 ${
                                    estatus === 'pendiente'
                                      ? 'bg-henequen-terra text-white hover:bg-henequen-terra-dark'
                                      : 'border border-henequen-arena bg-white text-henequen-grafito hover:bg-henequen-cal'
                                  }`}
                                >
                                  {ocupado ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Upload size={12} />
                                  )}
                                  {ocupado
                                    ? 'Depositando...'
                                    : estatus === 'pendiente'
                                      ? 'Depositar documento'
                                      : estatus === 'rechazado'
                                        ? 'Volver a subir'
                                        : 'Reemplazar'}
                                </button>
                              </>
                            )}
                          </div>

                          {estatus === 'pendiente' && !ocupado && (
                            <p className="text-[10px] text-henequen-piedra">
                              o arrastra aquí tu PDF / foto (máx. 10 MB)
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Acuse de recibo */}
              {ultimoAcuse && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-700" />
                  <div className="min-w-0">
                    <div className="font-bold">
                      Acuse de recibo {ultimoAcuse.folio} ·{' '}
                      {new Date(ultimoAcuse.recibidoEn).toLocaleString('es-MX')}
                    </div>
                    <div className="mt-0.5 truncate">
                      {ultimoAcuse.nombreArchivo} · Huella SHA-256:{' '}
                      <span className="font-mono">{ultimoAcuse.sha256.slice(0, 24)}…</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={cerrar}
                  className="rounded-lg border border-henequen-arena bg-white px-4 py-2.5 text-xs font-semibold text-henequen-piedra transition hover:text-henequen-anil"
                >
                  {expediente.completo ? 'Cerrar buzón' : 'Guardar y terminar después'}
                </button>
                <div className="text-right text-[10px] text-henequen-piedra">
                  Cada documento queda sellado con huella SHA-256 al momento del depósito.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

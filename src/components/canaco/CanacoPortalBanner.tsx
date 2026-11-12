/**
 * CANACO SERVYTUR MÉRIDA — Banner Institucional del Socio (Design System HENEQUÉN)
 *
 * Muestra el estatus de acreditación del comercio, un Stepper visual de 4 etapas
 * ("Ruta del Afiliado") para orientar al usuario en todo momento, acceso directo a la
 * Ventanilla de Afiliación/SIEM, al Buzón Documental (Oficialía de Partes) y a la
 * Cédula Digital de Socio con QR.
 */

import { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Building2,
  FileText,
  ArrowRight,
  Inbox,
  CheckCircle2,
  Calculator,
  Compass,
} from 'lucide-react';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';
import { ConstanciaSocioModal } from './ConstanciaSocioModal';
import { BuzonDocumentalModal } from './BuzonDocumentalModal';
import { TOTAL_HERRAMIENTAS } from '@/data/catalogo-herramientas';
import { getEstadoById } from '@/tools/isn/data/estados';
import type { SocioCanacoRegistro } from './types';

interface CanacoPortalBannerProps {
  className?: string;
}

const STORAGE_SOCIO_KEY = 'canaco_socio_activo_v1';
const STORAGE_BUZON_KEY = 'canaco_buzon_progreso_v1';

export function CanacoPortalBanner({ className = '' }: CanacoPortalBannerProps) {
  const [modalAfiliacionOpen, setModalAfiliacionOpen] = useState(false);
  const [modalConstanciaOpen, setModalConstanciaOpen] = useState(false);
  const [modalBuzonOpen, setModalBuzonOpen] = useState(false);

  const [socioActivo, setSocioActivo] = useState<SocioCanacoRegistro | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = window.localStorage.getItem(STORAGE_SOCIO_KEY);
      return saved ? (JSON.parse(saved) as SocioCanacoRegistro) : null;
    } catch {
      return null;
    }
  });

  const [progresoBuzon, setProgresoBuzon] = useState<{ depositados: number; requeridos: number }>(
    () => {
      if (typeof window === 'undefined') return { depositados: 0, requeridos: 7 };
      try {
        const saved = window.localStorage.getItem(STORAGE_BUZON_KEY);
        return saved ? JSON.parse(saved) : { depositados: 0, requeridos: 7 };
      } catch {
        return { depositados: 0, requeridos: 7 };
      }
    }
  );

  const handleAfiliacionCompletada = (nuevoSocio: SocioCanacoRegistro) => {
    setSocioActivo(nuevoSocio);
    try {
      window.localStorage.setItem(STORAGE_SOCIO_KEY, JSON.stringify(nuevoSocio));
    } catch {
      // ignore storage errors
    }
  };

  const handleProgresoBuzon = (depositados: number, requeridos: number) => {
    const next = { depositados, requeridos: requeridos || 7 };
    setProgresoBuzon(next);
    try {
      window.localStorage.setItem(STORAGE_BUZON_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const buzonCompleto =
    progresoBuzon.requeridos > 0 && progresoBuzon.depositados >= progresoBuzon.requeridos;
  const tasaIsnYucatan = getEstadoById('YUC')?.tasa ?? 2.5;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-henequen-arena bg-gradient-to-r from-henequen-cal via-henequen-muro to-henequen-sisal/40 p-5 font-inter shadow-tarjeta sm:p-6 ${className}`}
      >
        {/* Adorno sutil de greca o patrón en el fondo */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(#1A3A5C_1px,transparent_1px)] opacity-5 [background-size:16px_16px]" />

        <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-xl space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-henequen-terra/30 bg-henequen-terra/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-henequen-terra-dark">
                <Sparkles size={11} />
                Portal del Afiliado · HENEQUÉN
              </span>
              <span className="font-mono text-[10px] text-henequen-piedra">
                120 Años de Autoridad Comercial (1906–2026)
              </span>
            </div>

            <h2 className="font-fraunces text-xl font-bold tracking-tight text-henequen-anil sm:text-2xl">
              {socioActivo ? (
                <>Socio Activo: {socioActivo.nombreComercial || socioActivo.razonSocial}</>
              ) : (
                <>Impulsa tu Negocio con el Respaldo de CANACO SERVYTUR Mérida</>
              )}
            </h2>

            <p className="text-xs leading-relaxed text-henequen-piedra sm:text-sm">
              {socioActivo ? (
                <>
                  Tu registro SIEM está vigente con folio{' '}
                  <strong className="font-mono text-henequen-anil">{socioActivo.folioSiem}</strong>.
                  Dispones de acceso a las {TOTAL_HERRAMIENTAS} herramientas fiscales (12 esenciales
                  PyME CANACO + 8 corporativas/PLD) y cédulas de trabajo.
                </>
              ) : (
                <>
                  Cumple con el Registro Federal SIEM 2026, obtén tu Cédula Oficial con QR y accede
                  a la Suite de Cálculo Tributario (RESICO, Nómina, Finiquitos, ISN Yucatán{' '}
                  {tasaIsnYucatan}%).
                </>
              )}
            </p>
          </div>

          {/* Acciones principales */}
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {socioActivo ? (
              <button
                type="button"
                onClick={() => setModalConstanciaOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-henequen-anil px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-henequen-anil-deep"
              >
                <FileText size={14} className="text-henequen-sisal" />
                <span>Ver Cédula Oficial SIEM</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModalAfiliacionOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-henequen-terra px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-henequen-terra-dark"
              >
                <Building2 size={14} />
                <span>Afiliarse / Refrendo SIEM</span>
                <ArrowRight size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setModalBuzonOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-henequen-anil/30 bg-white px-3.5 py-2 text-xs font-semibold text-henequen-anil transition hover:bg-henequen-sisal/40"
            >
              <Inbox size={14} className="text-henequen-terra" />
              <span>
                Buzón de Expediente ({progresoBuzon.depositados}/{progresoBuzon.requeridos})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModalAfiliacionOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-henequen-arena bg-white px-3.5 py-2 text-xs font-semibold text-henequen-piedra transition hover:border-henequen-anil/40 hover:text-henequen-anil"
            >
              <ShieldCheck size={14} className="text-henequen-verde" />
              <span>Ver Cuotas y Beneficios</span>
            </button>
          </div>
        </div>

        {/* ═══ MAPA DE PROGRESO DEL SOCIO (STEPPER VISUAL DE 4 ETAPAS) ═══ */}
        <div
          className="relative mt-5 border-t border-henequen-arena/80 pt-4"
          aria-label="Ruta del Afiliado CANACO"
        >
          <div className="mb-2.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider text-henequen-anil">
              <Compass size={13} className="text-henequen-terra" />
              Tu Ruta de Cumplimiento Cameral y Fiscal
            </span>
            <span className="text-henequen-piedra">
              Haz clic en cualquier etapa para abrir su módulo
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Etapa 1: Registro SIEM */}
            <button
              type="button"
              onClick={() => setModalAfiliacionOpen(true)}
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                socioActivo
                  ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50'
                  : 'border-henequen-terra/40 bg-white shadow-sm hover:border-henequen-terra'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                  socioActivo ? 'bg-emerald-600 text-white' : 'bg-henequen-terra text-white'
                }`}
              >
                {socioActivo ? <CheckCircle2 size={13} /> : '1'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-henequen-anil">1. Registro SIEM</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      socioActivo
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {socioActivo ? 'Completado' : 'Iniciar aquí'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-henequen-piedra">
                  {socioActivo ? `Folio ${socioActivo.folioSiem}` : 'Alta o refrendo anual 2026'}
                </p>
              </div>
            </button>

            {/* Etapa 2: Buzón Documental */}
            <button
              type="button"
              onClick={() => setModalBuzonOpen(true)}
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                buzonCompleto
                  ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50'
                  : 'border-henequen-arena bg-white hover:border-henequen-anil/40'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                  buzonCompleto ? 'bg-emerald-600 text-white' : 'bg-henequen-anil text-white'
                }`}
              >
                {buzonCompleto ? <CheckCircle2 size={13} /> : '2'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-henequen-anil">2. Buzón Oficialía</span>
                  <span className="rounded bg-henequen-sisal/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-henequen-anil">
                    {progresoBuzon.depositados}/{progresoBuzon.requeridos} docs
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-henequen-piedra">
                  Depósito de CSF, INE y anexos
                </p>
              </div>
            </button>

            {/* Etapa 3: Cédula Oficial QR */}
            <button
              type="button"
              onClick={() =>
                socioActivo ? setModalConstanciaOpen(true) : setModalAfiliacionOpen(true)
              }
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                socioActivo
                  ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50'
                  : 'border-henequen-arena bg-white hover:border-henequen-anil/40'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                  socioActivo
                    ? 'bg-emerald-600 text-white'
                    : 'bg-henequen-piedra/20 text-henequen-grafito'
                }`}
              >
                3
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-henequen-anil">3. Cédula QR</span>
                  <span className="rounded bg-henequen-sisal/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-henequen-anil">
                    {socioActivo ? 'Disponible' : 'Requiere paso 1'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-henequen-piedra">
                  Constancia Carta con Sello SHA-256
                </p>
              </div>
            </button>

            {/* Etapa 4: Suite Fiscal */}
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-left">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-mono text-[11px] font-bold text-white">
                <Calculator size={13} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-henequen-anil">4. Suite Fiscal</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-emerald-800">
                    Estás aquí
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-henequen-piedra">
                  {TOTAL_HERRAMIENTAS} herramientas (12 PyME + 8 Pro) y pre-validación CFDI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <VentanillaAfiliacionModal
        isOpen={modalAfiliacionOpen}
        onClose={() => setModalAfiliacionOpen(false)}
        onAfiliacionCompletada={handleAfiliacionCompletada}
      />

      <BuzonDocumentalModal
        isOpen={modalBuzonOpen}
        onClose={() => setModalBuzonOpen(false)}
        rfcInicial={socioActivo?.rfc || ''}
        emailInicial={socioActivo?.contacto?.email || ''}
        onProgreso={handleProgresoBuzon}
      />

      {socioActivo && (
        <ConstanciaSocioModal
          isOpen={modalConstanciaOpen}
          onClose={() => setModalConstanciaOpen(false)}
          socio={socioActivo}
        />
      )}
    </>
  );
}

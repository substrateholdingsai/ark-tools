/**
 * CANACO SERVYTUR MÉRIDA — Banner Institucional del Socio (Design System HENEQUÉN)
 *
 * Muestra el estatus de acreditación del comercio, acceso a la Ventanilla de Afiliación/SIEM,
 * y opción de emitir la Cédula Digital de Socio.
 */

import { useState } from 'react';
import { ShieldCheck, Sparkles, Building2, FileText, ArrowRight } from 'lucide-react';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';
import { ConstanciaSocioModal } from './ConstanciaSocioModal';
import type { SocioCanacoRegistro } from './types';

interface CanacoPortalBannerProps {
  className?: string;
}

export function CanacoPortalBanner({ className = '' }: CanacoPortalBannerProps) {
  const [modalAfiliacionOpen, setModalAfiliacionOpen] = useState(false);
  const [modalConstanciaOpen, setModalConstanciaOpen] = useState(false);
  const [socioActivo, setSocioActivo] = useState<SocioCanacoRegistro | null>(null);

  const handleAfiliacionCompletada = (nuevoSocio: SocioCanacoRegistro) => {
    setSocioActivo(nuevoSocio);
  };

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-henequen-arena bg-gradient-to-r from-henequen-cal via-henequen-muro to-henequen-sisal/40 p-5 font-inter shadow-tarjeta sm:p-6 ${className}`}
      >
        {/* Adorno sutil de greca o patrón en el fondo */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(#1A3A5C_1px,transparent_1px)] opacity-5 [background-size:16px_16px]" />

        <div className="relative flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-xl space-y-1.5">
            <div className="flex items-center gap-2">
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
                  Dispones de acceso irrestricto a las 12 herramientas fiscales y cédulas de
                  trabajo.
                </>
              ) : (
                <>
                  Cumple con el Registro Federal SIEM 2026, obtén tu Cédula Oficial con QR y accede
                  a la Suite de Cálculo Tributario (RESICO, Nómina, Finiquitos, ISN Yucatán 3%).
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
              onClick={() => setModalAfiliacionOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-henequen-arena bg-white px-3.5 py-2 text-xs font-semibold text-henequen-piedra transition hover:border-henequen-anil/40 hover:text-henequen-anil"
            >
              <ShieldCheck size={14} className="text-henequen-verde" />
              <span>Ver Cuotas y Beneficios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <VentanillaAfiliacionModal
        isOpen={modalAfiliacionOpen}
        onClose={() => setModalAfiliacionOpen(false)}
        onAfiliacionCompletada={handleAfiliacionCompletada}
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

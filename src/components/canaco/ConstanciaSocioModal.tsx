/**
 * Resumen interno del registro CANACO; no es una constancia oficial ni NOM-151.
 */

import { useRef } from 'react';
import { Printer, X, ShieldCheck } from 'lucide-react';
import { CanacoLogo } from '@/components/brand/CanacoLogo';
import type { SocioCanacoRegistro } from './types';

interface ConstanciaSocioModalProps {
  isOpen: boolean;
  onClose: () => void;
  socio: SocioCanacoRegistro;
}

export function ConstanciaSocioModal({ isOpen, onClose, socio }: ConstanciaSocioModalProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const pagoConfirmado = socio.estatus === 'activo' && socio.pagoConfirmado === true;

  const handlePrint = () => {
    window.print();
  };

  if (!pagoConfirmado) {
    return (
      <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold text-amber-950">
              El registro está pendiente de confirmación de pago. No hay un documento para emitir.
            </p>
            <button type="button" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-2 sm:p-4">
      {/* Botones de acción flotantes (no imprimen) */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-henequen-anil px-4 py-2.5 font-fraunces text-xs font-bold uppercase tracking-wider text-white shadow-xl transition hover:bg-henequen-anil-deep"
        >
          <Printer size={15} className="text-henequen-sisal" />
          <span>Imprimir resumen</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border border-henequen-arena bg-white p-2.5 text-henequen-grafito shadow-xl transition hover:bg-henequen-sisal"
          title="Cerrar vista previa"
        >
          <X size={18} />
        </button>
      </div>

      {/* El resumen no sustituye una constancia oficial. */}
      <div
        ref={printContainerRef}
        id="constancia-canaco-print"
        className="my-8 w-full max-w-[850px] rounded-2xl border border-henequen-arena bg-henequen-muro p-8 font-inter text-[12px] leading-relaxed text-henequen-grafito shadow-2xl sm:p-12 print:m-0 print:w-full print:max-w-none print:border-none print:p-8 print:shadow-none"
      >
        {/* Encabezado con Isotipo y Textos Institucionales */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b-2 border-henequen-anil pb-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3">
            <CanacoLogo size={56} variant="full" />
            <div>
              <div className="font-fraunces text-base font-bold uppercase tracking-wide text-henequen-anil sm:text-lg">
                Cámara Nacional de Comercio, Servicios y Turismo de Mérida
              </div>
              <div className="font-mono text-[9.5px] font-semibold uppercase tracking-widest text-henequen-terra">
                Resumen interno · CANACO SERVYTUR Mérida
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block rounded border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-800">
              Pago confirmado
            </span>
            <div className="mt-1 font-mono text-[11px] text-henequen-piedra">
              Folio: <strong className="text-henequen-anil">{socio.folioSiem}</strong>
            </div>
          </div>
        </div>

        {/* Título del resumen */}
        <div className="mb-6 text-center">
          <h2 className="font-fraunces text-xl font-bold uppercase tracking-wider text-henequen-anil sm:text-2xl">
            Resumen de registro y pago
          </h2>
          <p className="mt-1 font-inter text-xs text-henequen-piedra">
            No es una constancia oficial SIEM ni una constancia NOM-151.
          </p>
        </div>

        {/* Datos Generales del Socio */}
        <div className="mb-6 space-y-3 rounded-xl border border-henequen-arena bg-henequen-cal/60 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-[10px] font-bold uppercase text-henequen-piedra">
                Razón Social / Nombre Comercial
              </span>
              <span className="block text-sm font-semibold text-henequen-anil">
                {socio.razonSocial}
              </span>
              {socio.nombreComercial && socio.nombreComercial !== socio.razonSocial && (
                <span className="text-xs italic text-henequen-piedra">
                  Nombre Comercial: {socio.nombreComercial}
                </span>
              )}
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-henequen-piedra">
                Registro Federal de Contribuyentes (RFC)
              </span>
              <span className="font-mono text-sm font-bold text-henequen-grafito">{socio.rfc}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-henequen-arena/60 pt-3 text-xs sm:grid-cols-3">
            <div>
              <span className="block text-[10px] text-henequen-piedra">Sector Económico</span>
              <span className="font-semibold capitalize text-henequen-grafito">{socio.sector}</span>
            </div>
            <div>
              <span className="block text-[10px] text-henequen-piedra"> Estrato de referencia</span>
              <span className="font-semibold capitalize text-henequen-grafito">
                Empresa {socio.estrato} ({socio.numEmpleados} empleados)
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-henequen-piedra">Ubicación</span>
              <span className="font-semibold text-henequen-grafito">
                {socio.direccion.municipio}, Yucatán
              </span>
            </div>
          </div>
        </div>

        {/* Estado informativo */}
        <div className="mb-6 rounded-lg border-l-4 border-henequen-terra bg-henequen-sisal/30 p-3 text-xs leading-relaxed text-henequen-grafito">
          <p>
            Este resumen refleja el estado de pago recibido por el portal. No acredita por sí solo
            un alta en el SIEM, afiliación institucional vigente ni emisión de un CFDI.
          </p>
        </div>

        <div className="border-t-2 border-henequen-arena/80 pt-4 text-[10px]">
          <div className="flex items-center gap-1.5 font-bold text-henequen-anil">
            <ShieldCheck size={14} className="text-henequen-terra" />
            <span>Folio de Integridad (referencia interna)</span>
          </div>
          <div className="mt-1 break-all rounded border border-henequen-arena bg-henequen-sisal/40 p-1.5 font-mono text-henequen-piedra">
            {socio.folioIntegridad}
          </div>
          <p className="mt-1 text-[9px] text-henequen-piedra">
            No es un hash SHA-256, una firma criptográfica ni una constancia NOM-151. No se muestra
            QR hasta verificar un dominio y un destino de consulta válidos.
          </p>
        </div>
      </div>
    </div>
  );
}

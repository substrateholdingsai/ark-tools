/**
 * CANACO SERVYTUR MÉRIDA — Cédula Oficial de Acreditación de Socio
 *
 * Emite la Constancia Institucional de Afiliación y Registro SIEM:
 * - Membrete oficial de CANACO SERVYTUR Mérida y Confederación CONCANACO.
 * - Datos del Socio, RFC, Razón Social, Giro y Dirección en Yucatán.
 * - Folio oficial SIEM 2026 y Sello Digital Inmutable SHA-256.
 * - Código QR de Verificación Institucional en línea.
 * - Optimizado para impresión física o PDF tamaño carta (@media print).
 */

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, ShieldCheck } from 'lucide-react';
import { CanacoLogo } from '@/components/brand/CanacoLogo';
import type { SocioCanacoRegistro } from './types';

interface ConstanciaSocioModalProps {
  isOpen: boolean;
  onClose: () => void;
  socio: SocioCanacoRegistro;
}

export function ConstanciaSocioModal({ isOpen, onClose, socio }: ConstanciaSocioModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const verifyUrl = `https://socios.canacomerida.com.mx/?verify=${encodeURIComponent(
    socio.folioSiem
  )}`;

  useEffect(() => {
    if (!isOpen) return;
    void QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: '#1A3A5C', // Añil CANACO
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  }, [isOpen, verifyUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyHash = () => {
    void navigator.clipboard.writeText(socio.selloDigitalSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

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
          <span>Imprimir / Descargar Cédula PDF</span>
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

      {/* Hoja institucional oficial (Tamaño Carta @media print) */}
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
                Padrón Oficial SIEM · Secretaría de Economía · 1906–2026 (120 Años)
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block rounded border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-800">
              Socio Acreditado y Vigente
            </span>
            <div className="mt-1 font-mono text-[11px] text-henequen-piedra">
              Folio: <strong className="text-henequen-anil">{socio.folioSiem}</strong>
            </div>
          </div>
        </div>

        {/* Título de la Constancia */}
        <div className="mb-6 text-center">
          <h2 className="font-fraunces text-xl font-bold uppercase tracking-wider text-henequen-anil sm:text-2xl">
            Constancia Oficial de Afiliación Comercial
          </h2>
          <p className="mt-1 font-inter text-xs text-henequen-piedra">
            Conforme a la Ley de Cámaras Empresariales y sus Confederaciones (Artículos 4, 30 y 31)
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
              <span className="block text-[10px] text-henequen-piedra">Estrato SIEM</span>
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

        {/* Declaración Institucional */}
        <div className="mb-6 rounded-lg border-l-4 border-henequen-terra bg-henequen-sisal/30 p-3 text-xs leading-relaxed text-henequen-grafito">
          <p>
            Se certifica que la persona física o moral arriba referida se encuentra al corriente de
            sus obligaciones de afiliación institucional ante esta Cámara de Comercio y debidamente
            inscrita en el <strong>Sistema de Información Empresarial Mexicano (SIEM)</strong>,
            contando con la acreditación formal para el ejercicio ordenado de sus actividades
            mercantiles en el Estado de Yucatán para el período 2026–2027.
          </p>
        </div>

        {/* Firmas de Autoridad Cameral */}
        <div className="mb-8 grid grid-cols-2 gap-12 border-t border-henequen-arena pt-8 text-center text-[11px]">
          <div>
            <div className="mx-auto mb-1.5 w-48 border-b border-henequen-grafito" />
            <p className="font-bold text-henequen-anil">Presidente del Consejo Directivo</p>
            <p className="font-mono text-[10px] text-henequen-piedra">CANACO SERVYTUR Mérida</p>
          </div>
          <div>
            <div className="mx-auto mb-1.5 w-48 border-b border-henequen-grafito" />
            <p className="font-bold text-henequen-anil">Dirección General & Afiliaciones</p>
            <p className="font-mono text-[10px] text-henequen-piedra">Ventanilla SIEM Yucatán</p>
          </div>
        </div>

        {/* Sello Criptográfico & Código QR */}
        <div className="flex items-center justify-between gap-4 border-t-2 border-henequen-arena/80 pt-4 font-mono text-[10px]">
          <div className="max-w-[560px] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-henequen-anil">
              <ShieldCheck size={14} className="text-henequen-terra" />
              <span>SELLO DIGITAL DE VALIDEZ INSTITUCIONAL (SHA-256):</span>
              <button
                type="button"
                onClick={copyHash}
                className="ml-1 cursor-pointer text-[9px] text-henequen-piedra underline hover:text-henequen-anil print:hidden"
              >
                {copiedHash ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="break-all rounded border border-henequen-arena bg-henequen-sisal/40 p-1.5 text-[9.5px] leading-tight text-henequen-piedra">
              {socio.selloDigitalSha256}
            </div>
            <p className="text-[9px] text-henequen-piedra">
              Para corroborar la vigencia del registro SIEM de este establecimiento comercial,
              escanee el código QR o consulte en{' '}
              <span className="text-henequen-anil">https://socios.canacomerida.com.mx</span>.
            </p>
          </div>

          {qrDataUrl && (
            <div className="shrink-0 text-center">
              <img
                src={qrDataUrl}
                alt="Código QR de Validación SIEM"
                className="mx-auto h-20 w-20 rounded-lg border border-henequen-arena bg-white p-1"
              />
              <span className="mt-1 block text-[8px] font-bold uppercase text-henequen-anil">
                Escanear para Validar
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

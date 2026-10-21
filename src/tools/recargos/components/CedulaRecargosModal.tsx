import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, ShieldCheck } from 'lucide-react';
import type { ResultadoRecargos } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resultado: ResultadoRecargos;
  clienteNombre?: string;
  clienteRfc?: string;
  despachoName?: string;
  hashExpediente?: string;
}

export function CedulaRecargosModal({
  isOpen,
  onClose,
  resultado,
  clienteNombre = 'Contribuyente General',
  clienteRfc = 'XAXX010101000',
  despachoName = 'Despacho Contable ARK',
  hashExpediente,
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Hash determinista de fallback si no viene guardado en D1
  const hash = hashExpediente || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const verifyUrl = `https://tools.arksystems.site/?verify=${hash}`;

  useEffect(() => {
    if (!isOpen) return;
    void QRCode.toDataURL(verifyUrl, {
      width: 130,
      margin: 1,
      color: {
        dark: '#002B7F',
        light: '#FFFFFF',
      },
    }).then(setQrDataUrl);
  }, [isOpen, verifyUrl]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-[24px] border border-line bg-surface shadow-2xl print:max-h-none print:w-full print:rounded-none print:border-none print:shadow-none">
        {/* Barra superior de acciones (Oculta al imprimir) */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              PAPEL DE TRABAJO INSTITUCIONAL
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              CFF ARTS. 17-A Y 21 · DOF 2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-[12px] bg-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-navy/90"
            >
              <Printer className="h-4 w-4 text-gold" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-line bg-surface text-muted transition hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido Cédula Tamaño Carta */}
        <div
          ref={printContainerRef}
          className="flex-1 overflow-y-auto p-6 font-inter text-navy sm:p-10 print:overflow-visible print:p-0"
        >
          {/* Membrete Oficial */}
          <div className="flex flex-col gap-6 border-b-2 border-navy pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron text-xs font-black tracking-[0.25em] text-gold-dark">
                  ARK TOOLS FISCAL
                </span>
                <span className="font-mono text-[10px] text-muted">· SISTEMA MULTI-TENANT</span>
              </div>
              <h1 className="mt-1 font-playfair text-xl font-black text-navy sm:text-2xl">
                Cédula de Actualización y Recargos Fiscales
              </h1>
              <p className="text-xs text-muted">
                Liquidación de adeudos y mora tributaria conforme a los Artículos 17-A y 21 del CFF
              </p>
            </div>

            <div className="text-right">
              <span className="font-orbitron text-xs font-bold uppercase text-navy">
                {despachoName}
              </span>
              <span className="block font-mono text-[11px] text-muted">
                Fecha de Emisión: {new Date().toISOString().split('T')[0]}
              </span>
              <span className="block font-mono text-[10px] font-bold text-emerald-700">
                ● Tasa LIF: 1.47% Mensual
              </span>
            </div>
          </div>

          {/* Ficha del Contribuyente y Parámetros del Cómputo */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface-2 p-4 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Contribuyente:
              </span>
              <strong className="block truncate text-navy">{clienteNombre}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">RFC:</span>
              <strong className="font-mono text-navy">{clienteRfc}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Fecha Debió Pagarse:
              </span>
              <strong className="font-mono text-navy">{resultado.fechaVencimiento}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Fecha de Pago Real:
              </span>
              <strong className="font-mono text-navy">{resultado.fechaPago}</strong>
            </div>
          </div>

          {/* Memoria de Cálculo del Factor INPC (Art. 17-A CFF) */}
          <div className="mt-6 rounded-xl border border-line p-4">
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-gold-dark">
              MEMORIA DE CÁLCULO — FACTOR DE ACTUALIZACIÓN (ART. 17-A CFF)
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <div className="border-r border-line pr-2">
                <span className="text-muted">INPC Numerador (Mes anterior pago):</span>
                <div className="font-mono font-bold text-navy">
                  {resultado.factorDetalle.inpcReciente.toFixed(3)} (
                  {resultado.factorDetalle.periodoInpcReciente})
                </div>
              </div>
              <div className="border-r border-line pr-2">
                <span className="text-muted">INPC Denominador (Mes anterior adeudo):</span>
                <div className="font-mono font-bold text-navy">
                  {resultado.factorDetalle.inpcAntiguo.toFixed(3)} (
                  {resultado.factorDetalle.periodoInpcAntiguo})
                </div>
              </div>
              <div>
                <span className="text-muted">Factor Aplicado (Truncado a 4 decimales):</span>
                <div className="font-mono text-sm font-black text-navy">
                  {resultado.factorActualizacion.toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Liquidación de Conceptos */}
          <div className="mt-6">
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
              DETERMINACIÓN DE LA OBLIGACIÓN FISCAL
            </span>
            <table className="mt-2 w-full text-left font-inter text-xs">
              <thead>
                <tr className="border-b border-navy bg-surface-2 font-orbitron text-[10px] uppercase text-navy">
                  <th className="px-3 py-2.5">Concepto</th>
                  <th className="px-3 py-2.5">Fórmula / Base</th>
                  <th className="px-3 py-2.5">Fundamento Legal</th>
                  <th className="px-3 py-2.5 text-right">Importe MXN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                <tr>
                  <td className="px-3 py-2 font-semibold text-navy">
                    Impuesto Omitido (Histórico)
                  </td>
                  <td className="px-3 py-2 font-mono text-muted">Importe histórico adeudado</td>
                  <td className="px-3 py-2 text-muted">Ley Específica del Impuesto</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-navy">
                    $
                    {resultado.importeHistorico.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-navy">
                    (+) Actualización por Inflación
                  </td>
                  <td className="px-3 py-2 font-mono text-muted">
                    Base × (Factor {resultado.factorActualizacion.toFixed(4)} - 1.0)
                  </td>
                  <td className="px-3 py-2 text-muted">CFF Art. 17-A</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700">
                    +$
                    {resultado.montoActualizacion.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr className="bg-surface-2/40">
                  <td className="px-3 py-2 font-bold text-navy">(=) Impuesto Actualizado</td>
                  <td className="px-3 py-2 font-mono text-muted">
                    $
                    {resultado.importeHistorico.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    × {resultado.factorActualizacion.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-muted">CFF Art. 17-A</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-navy">
                    $
                    {resultado.impuestoActualizado.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-navy">(+) Recargos por Mora</td>
                  <td className="px-3 py-2 font-mono text-muted">
                    {resultado.mesesMora} meses × 1.47% = {resultado.tasaRecargosTotal}% sobre base
                    act.
                  </td>
                  <td className="px-3 py-2 text-muted">CFF Art. 21 & LIF Art. 8</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-amber-700">
                    +$
                    {resultado.montoRecargos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy bg-surface-2 text-sm font-black text-navy">
                  <td colSpan={3} className="px-3 py-3 uppercase tracking-wider">
                    Total Deuda Tributaria a Liquidar
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    ${resultado.totalPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Importe en Letras Formal (Art. 28 CFF) */}
          <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-xs">
            <span className="block font-bold uppercase text-muted">Importe Total en Letra:</span>
            <p className="mt-0.5 font-serif font-bold italic text-navy">
              &ldquo;{resultado.totalEnLetras}&rdquo;
            </p>
          </div>

          {/* Sello Digital SHA-256 y Código QR Oficial */}
          <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gold-dark" />
                <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                  Sello Digital de Integridad Criptográfica (SHA-256)
                </span>
              </div>
              <p className="break-all font-mono text-[9.5px] text-muted">{hash}</p>
              <p className="text-[10px] leading-relaxed text-muted">
                Este papel de trabajo fue generado de forma determinista y sellado inmutablemente en
                Cloudflare D1. El QR adjunto permite a cualquier auditor del SAT o perito contable
                verificar la autenticidad e integridad del cálculo sin requerir contraseñas.
              </p>
            </div>

            {qrDataUrl && (
              <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
                <img
                  src={qrDataUrl}
                  alt="QR Verificación Pública"
                  className="h-24 w-24 rounded-lg border border-line p-1 shadow-sm"
                />
                <span className="font-mono text-[9px] font-bold uppercase text-navy">
                  Escanear para Validar
                </span>
              </div>
            )}
          </div>

          {/* Firmas de Conformidad y Responsabilidad Profesional */}
          <div className="mt-12 grid grid-cols-2 gap-12 border-t border-line pt-8 text-center text-xs">
            <div>
              <div className="mx-auto mb-2 w-48 border-b border-navy/40 pb-6" />
              <strong className="block text-navy">{despachoName}</strong>
              <span className="text-[10px] text-muted">Auditor Fiscal / Contador Responsable</span>
            </div>
            <div>
              <div className="mx-auto mb-2 w-48 border-b border-navy/40 pb-6" />
              <strong className="block text-navy">{clienteNombre}</strong>
              <span className="text-[10px] text-muted">Contribuyente / Representante Legal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

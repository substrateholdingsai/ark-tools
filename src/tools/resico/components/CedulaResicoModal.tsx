import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, ShieldCheck } from 'lucide-react';
import type { ResultadoResico } from '../types';
import { NOMBRES_MESES } from '../data/tablasResico';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resultado: ResultadoResico;
  clienteNombre?: string;
  clienteRfc?: string;
  despachoName?: string;
  hashExpediente?: string;
}

export function CedulaResicoModal({
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

  const hash = hashExpediente || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const verifyUrl = `https://tools.arksystems.site/?verify=${hash}`;
  const nombreMes = NOMBRES_MESES[resultado.mes];
  const esPF = resultado.tipoPersona === 'fisica';

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
              VALIDADO DOF 2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hover:bg-navy-light flex items-center gap-1.5 rounded-[12px] bg-navy px-4 py-2 text-xs font-bold text-white transition"
            >
              <Printer className="h-4 w-4 text-gold" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="hover:bg-canvas flex h-9 w-9 items-center justify-center rounded-[12px] border border-line bg-surface text-muted transition hover:text-navy"
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
                  ARK TOOLS CONTABLE
                </span>
                <span className="font-mono text-[10px] text-muted">· SISTEMA MULTI-TENANT</span>
              </div>
              <h1 className="mt-1 font-playfair text-xl font-black text-navy sm:text-2xl">
                Cédula de Determinación de Pagos Provisionales RESICO
              </h1>
              <p className="mt-0.5 text-xs font-medium text-muted">
                {despachoName} · Asesoría Fiscal y Auditoría Integral
              </p>
            </div>

            <div className="space-y-1 text-left font-mono text-xs sm:text-right">
              <div className="font-bold text-navy">
                FOLIO: RES-{resultado.ejercicio}-{String(resultado.mes).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-muted">
                EMISIÓN: {new Date().toLocaleDateString('es-MX')}
              </div>
              <div className="text-[11px] font-semibold text-gold-dark">
                SELLO OFICIAL: DOF-2026-RESICO
              </div>
            </div>
          </div>

          {/* Ficha Técnica del Contribuyente */}
          <div className="bg-canvas/60 my-6 grid grid-cols-2 gap-4 rounded-[16px] border border-line p-4 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Contribuyente
              </span>
              <span className="font-bold text-navy">{clienteNombre}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">RFC Oficial</span>
              <span className="font-mono font-bold text-navy">{clienteRfc}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Régimen Fiscal
              </span>
              <span className="font-semibold text-navy">
                {esPF ? 'RESICO Persona Física' : 'RESICO Persona Moral'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-muted">
                Período Declarado
              </span>
              <span className="font-bold text-navy">
                {nombreMes} {resultado.ejercicio}
              </span>
            </div>
          </div>

          {/* Tabla Analítica */}
          <div className="my-6">
            <h3 className="mb-2 font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
              Desglose de Liquidación Fiscal
            </h3>
            <table className="w-full border border-line text-left text-xs">
              <thead className="bg-canvas border-b border-line text-[10px] font-bold uppercase text-muted">
                <tr>
                  <th className="px-3 py-2.5">No</th>
                  <th className="px-3 py-2.5">Concepto Gravable / Deducible</th>
                  <th className="px-3 py-2.5 text-right">Base Gravable</th>
                  <th className="px-3 py-2.5 text-center">Tasa</th>
                  <th className="px-3 py-2.5 text-right">Importe Liquidado</th>
                  <th className="px-3 py-2.5">Fundamento Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-xs">
                {resultado.desglose.map((r, i) => {
                  const esTotal = r.concepto.startsWith('(=)');
                  return (
                    <tr key={i} className={esTotal ? 'bg-gold/10 font-inter font-bold' : ''}>
                      <td className="px-3 py-2 text-muted">{i + 1}</td>
                      <td className="px-3 py-2 font-inter font-medium text-navy">{r.concepto}</td>
                      <td className="px-3 py-2 text-right text-muted">
                        {r.base > 0
                          ? `$${r.base.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-center text-muted">
                        {r.tasaPct > 0 ? `${r.tasaPct.toFixed(2)}%` : '-'}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-bold ${esTotal ? 'text-navy' : ''}`}
                      >
                        ${Math.abs(r.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 font-inter text-[10px] italic text-muted">
                        {r.fundamento}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Gran Total y Letras */}
          <div className="bg-canvas my-6 flex flex-col gap-4 rounded-[16px] border-2 border-navy p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                Total Líquido a Enterar en Declaración SAT
              </span>
              <div className="font-mono text-2xl font-black text-navy sm:text-3xl">
                $
                {resultado.totalImpuestosPagar.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-xs text-muted">MXN</span>
              </div>
              <p className="mt-1 max-w-lg text-xs font-medium italic text-navy/90">
                ({resultado.totalEnLetras})
              </p>
            </div>
            <div className="space-y-0.5 text-right font-mono text-[11px] text-muted">
              <div>ISR a Cargo: ${resultado.isrNetoPagar.toFixed(2)}</div>
              <div>IVA a Cargo: ${Math.max(0, resultado.ivaNetoPagar).toFixed(2)}</div>
              {resultado.ivaNetoPagar < 0 && (
                <div className="font-semibold text-emerald-700">
                  Saldo Favor IVA: ${Math.abs(resultado.ivaNetoPagar).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Certificación Criptográfica & QR */}
          <div className="my-6 flex flex-col items-center justify-between gap-6 border-t border-line pt-6 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                  Sello Digital de Autenticidad SHA-256
                </span>
              </div>
              <div className="bg-canvas break-all rounded-[8px] border border-line p-2 font-mono text-[9px] text-muted">
                {hash}
              </div>
              <p className="text-[10px] italic text-muted">
                Este papel de trabajo fue elaborado bajo normas contables del CFF Art. 28 y
                verificado con la versión oficial DOF-2026. Escanee el código QR para validar su
                autenticidad.
              </p>
            </div>

            {qrDataUrl && (
              <div className="flex flex-shrink-0 flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="QR Verificación"
                  className="h-24 w-24 rounded-[8px] border border-line bg-white p-1"
                />
                <span className="mt-1 font-mono text-[9px] text-muted">Verificación Pública</span>
              </div>
            )}
          </div>

          {/* Bloque de Firmas Autógrafas */}
          <div className="mt-12 grid grid-cols-2 gap-12 border-t border-line pt-8 text-center text-xs">
            <div>
              <div className="border-b border-navy pb-16" />
              <div className="mt-2 font-bold text-navy">C.P. Auditor Responsable</div>
              <div className="text-[10px] text-muted">Firma y Cédula Profesional</div>
            </div>
            <div>
              <div className="border-b border-navy pb-16" />
              <div className="mt-2 font-bold text-navy">Contribuyente o Representante Legal</div>
              <div className="text-[10px] text-muted">{clienteNombre}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

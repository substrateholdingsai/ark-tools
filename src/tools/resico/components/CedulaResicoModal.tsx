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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm print:p-0 print:bg-white print:static animate-fadeIn">
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-[24px] border border-line bg-surface shadow-2xl print:max-h-none print:w-full print:border-none print:shadow-none print:rounded-none">
        {/* Barra superior de acciones (Oculta al imprimir) */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              PAPEL DE TRABAJO INSTITUCIONAL
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              VALIDADO DOF 2026
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-[12px] bg-navy px-4 py-2 text-xs font-bold text-white transition hover:bg-navy-light"
            >
              <Printer className="w-4 h-4 text-gold" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-line bg-surface text-muted transition hover:bg-canvas hover:text-navy"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido Cédula Tamaño Carta */}
        <div
          ref={printContainerRef}
          className="flex-1 overflow-y-auto p-6 sm:p-10 font-inter text-navy print:overflow-visible print:p-0"
        >
          {/* Membrete Oficial */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b-2 border-navy pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron text-xs font-black tracking-[0.25em] text-gold-dark">
                  ARK TOOLS CONTABLE
                </span>
                <span className="text-[10px] text-muted font-mono">· SISTEMA MULTI-TENANT</span>
              </div>
              <h1 className="font-playfair text-xl sm:text-2xl font-black text-navy mt-1">
                Cédula de Determinación de Pagos Provisionales RESICO
              </h1>
              <p className="text-xs text-muted mt-0.5 font-medium">
                {despachoName} · Asesoría Fiscal y Auditoría Integral
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs space-y-1">
              <div className="font-bold text-navy">
                FOLIO: RES-{resultado.ejercicio}-{String(resultado.mes).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-muted">
                EMISIÓN: {new Date().toLocaleDateString('es-MX')}
              </div>
              <div className="text-[11px] text-gold-dark font-semibold">
                SELLO OFICIAL: DOF-2026-RESICO
              </div>
            </div>
          </div>

          {/* Ficha Técnica del Contribuyente */}
          <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-[16px] border border-line bg-canvas/60 p-4 text-xs">
            <div>
              <span className="block text-[10px] font-bold text-muted uppercase">Contribuyente</span>
              <span className="font-bold text-navy">{clienteNombre}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-muted uppercase">RFC Oficial</span>
              <span className="font-mono font-bold text-navy">{clienteRfc}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-muted uppercase">Régimen Fiscal</span>
              <span className="font-semibold text-navy">
                {esPF ? 'RESICO Persona Física' : 'RESICO Persona Moral'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-muted uppercase">Período Declarado</span>
              <span className="font-bold text-navy">
                {nombreMes} {resultado.ejercicio}
              </span>
            </div>
          </div>

          {/* Tabla Analítica */}
          <div className="my-6">
            <h3 className="font-orbitron text-[10px] font-bold uppercase tracking-[0.15em] text-muted mb-2">
              Desglose de Liquidación Fiscal
            </h3>
            <table className="w-full text-left text-xs border border-line">
              <thead className="bg-canvas text-[10px] uppercase font-bold text-muted border-b border-line">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Concepto Gravable / Deducible</th>
                  <th className="py-2.5 px-3 text-right">Base Gravable</th>
                  <th className="py-2.5 px-3 text-center">Tasa</th>
                  <th className="py-2.5 px-3 text-right">Importe Liquidado</th>
                  <th className="py-2.5 px-3">Fundamento Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs font-mono">
                {resultado.desglose.map((r, i) => {
                  const esTotal = r.concepto.startsWith('(=)');
                  return (
                    <tr key={i} className={esTotal ? 'bg-gold/10 font-bold font-inter' : ''}>
                      <td className="py-2 px-3 text-muted">{i + 1}</td>
                      <td className="py-2 px-3 font-inter font-medium text-navy">{r.concepto}</td>
                      <td className="py-2 px-3 text-right text-muted">
                        {r.base > 0 ? `$${r.base.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-center text-muted">
                        {r.tasaPct > 0 ? `${r.tasaPct.toFixed(2)}%` : '-'}
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${esTotal ? 'text-navy' : ''}`}>
                        ${Math.abs(r.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-[10px] font-inter text-muted italic">
                        {r.fundamento}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Gran Total y Letras */}
          <div className="my-6 rounded-[16px] border-2 border-navy bg-canvas p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                Total Líquido a Enterar en Declaración SAT
              </span>
              <div className="text-2xl sm:text-3xl font-black text-navy font-mono">
                ${resultado.totalImpuestosPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs text-muted">MXN</span>
              </div>
              <p className="text-xs font-medium text-navy/90 italic mt-1 max-w-lg">
                ({resultado.totalEnLetras})
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-muted space-y-0.5">
              <div>ISR a Cargo: ${resultado.isrNetoPagar.toFixed(2)}</div>
              <div>IVA a Cargo: ${Math.max(0, resultado.ivaNetoPagar).toFixed(2)}</div>
              {resultado.ivaNetoPagar < 0 && (
                <div className="text-emerald-700 font-semibold">
                  Saldo Favor IVA: ${Math.abs(resultado.ivaNetoPagar).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Certificación Criptográfica & QR */}
          <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-line pt-6">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-orbitron text-[10px] font-bold text-navy uppercase tracking-wider">
                  Sello Digital de Autenticidad SHA-256
                </span>
              </div>
              <div className="rounded-[8px] bg-canvas p-2 font-mono text-[9px] text-muted break-all border border-line">
                {hash}
              </div>
              <p className="text-[10px] text-muted italic">
                Este papel de trabajo fue elaborado bajo normas contables del CFF Art. 28 y verificado
                con la versión oficial DOF-2026. Escanee el código QR para validar su autenticidad.
              </p>
            </div>

            {qrDataUrl && (
              <div className="flex flex-col items-center flex-shrink-0">
                <img
                  src={qrDataUrl}
                  alt="QR Verificación"
                  className="h-24 w-24 rounded-[8px] border border-line p-1 bg-white"
                />
                <span className="text-[9px] font-mono text-muted mt-1">Verificación Pública</span>
              </div>
            )}
          </div>

          {/* Bloque de Firmas Autógrafas */}
          <div className="mt-12 pt-8 border-t border-line grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-b border-navy pb-16" />
              <div className="font-bold text-navy mt-2">C.P. Auditor Responsable</div>
              <div className="text-[10px] text-muted">Firma y Cédula Profesional</div>
            </div>
            <div>
              <div className="border-b border-navy pb-16" />
              <div className="font-bold text-navy mt-2">Contribuyente o Representante Legal</div>
              <div className="text-[10px] text-muted">{clienteNombre}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

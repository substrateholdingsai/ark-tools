import { useState } from 'react';
import { FileSpreadsheet, Share2, Check, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { LiquidGlassDome, TextMagnified, GlassButton, BadgeGold } from '@/components/ui';
import type { ResultadoRecargos } from '../types';
import {
  exportarRecargosCSV,
  generarResumenWhatsApp,
  descargarArchivo,
} from '../lib/exportarRecargos';

interface Props {
  resultado: ResultadoRecargos;
  clienteNombre?: string;
  clienteRfc?: string;
  onVerCedula: () => void;
}

export function ResultadoRecargosCard({
  resultado,
  clienteNombre = 'Contribuyente General',
  clienteRfc = 'XAXX010101000',
  onVerCedula,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyWhatsApp = () => {
    const texto = generarResumenWhatsApp(resultado, clienteNombre);
    void navigator.clipboard.writeText(texto).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDescargarCSV = () => {
    const csv = exportarRecargosCSV(resultado, clienteNombre, clienteRfc);
    const nombre = `Recargos_Actualizacion_${resultado.fechaVencimiento}_vs_${resultado.fechaPago}.csv`;
    descargarArchivo(csv, nombre);
  };

  return (
    <div className="space-y-6 rounded-[24px] border border-line bg-surface p-6 shadow-sm">
      {/* Header del resultado */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            LIQUIDACIÓN FISCAL DETERMINADA
          </span>
          <h2 className="mt-0.5 font-playfair text-xl font-black text-navy">
            Deuda Tributaria Actualizada
          </h2>
        </div>
        <BadgeGold size="sm" className="font-mono text-[11px] font-bold">
          FACTOR INPC: {resultado.factorActualizacion.toFixed(4)}
        </BadgeGold>
      </div>

      {/* Cúpula de Cristal con Cifra Magnificada (LiquidGlassDome) */}
      <LiquidGlassDome className="from-canvas/60 via-canvas/40 bg-gradient-to-b to-surface px-4 py-7 text-center">
        <span className="mb-1 block font-orbitron text-xs font-bold uppercase tracking-wider text-muted">
          TOTAL DEUDA TRIBUTARIA A LIQUIDAR (CFF)
        </span>
        <div className="my-2 flex items-baseline justify-center gap-1.5">
          <span className="text-2xl font-bold text-navy/70">$</span>
          <TextMagnified className="text-4xl font-black tracking-tight text-navy sm:text-6xl">
            {resultado.totalPagar.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </TextMagnified>
          <span className="font-mono text-xs font-bold text-muted">MXN</span>
        </div>
        <p className="mx-auto mt-2 max-w-lg border-t border-line/60 pt-2 text-[11.5px] font-medium italic leading-relaxed text-navy/80">
          &ldquo;{resultado.totalEnLetras}&rdquo;
        </p>
      </LiquidGlassDome>

      {/* Desglose rápido en chips de 3 columnas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Impuesto Histórico */}
        <div className="rounded-[16px] border border-line bg-surface-2 p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase text-muted">Impuesto Histórico</span>
            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-ink">
              Base
            </span>
          </div>
          <div className="font-mono text-base font-black text-navy">
            ${resultado.importeHistorico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">Nominal adeudado</span>
        </div>

        {/* Inflación / Actualización */}
        <div className="rounded-[16px] border border-line bg-surface-2 p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase text-muted">
              Actualización (INPC)
            </span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
              Art. 17-A
            </span>
          </div>
          <div className="font-mono text-base font-black text-emerald-700">
            +${resultado.montoActualizacion.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">
            Base act: $
            {resultado.impuestoActualizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Recargos por Mora */}
        <div className="rounded-[16px] border border-line bg-surface-2 p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase text-muted">Recargos por Mora</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
              Art. 21 CFF
            </span>
          </div>
          <div className="font-mono text-base font-black text-amber-700">
            +${resultado.montoRecargos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">
            {resultado.tasaRecargosTotal}% ({resultado.mesesMora} meses)
          </span>
        </div>
      </div>

      {/* Botones de acción del resultado */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <GlassButton
          variant="primary"
          onClick={onVerCedula}
          className="flex w-full items-center justify-center gap-2 sm:w-auto"
        >
          <FileText size={16} />
          <span>Ver Papel de Trabajo Oficial (PDF/QR)</span>
          <ArrowRight size={14} />
        </GlassButton>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDescargarCSV}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy transition hover:border-navy hover:bg-surface-2 sm:flex-initial"
            title="Descargar archivo CSV compatible con Excel"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <span>Excel CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-navy transition hover:border-navy hover:bg-surface-2 sm:flex-initial"
            title="Copiar resumen para WhatsApp"
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-600" />
                <span className="text-emerald-700">¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 size={15} className="text-navy" />
                <span>WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sello de certeza legal */}
      <div className="flex items-center justify-center gap-2 border-t border-line/60 pt-3 text-[11px] text-muted">
        <ShieldCheck size={14} className="text-navy" />
        <span>Cálculo determinista certificado · Sin redondeo en factor · Sellado en D1</span>
      </div>
    </div>
  );
}

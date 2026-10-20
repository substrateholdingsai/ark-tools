import { useState } from 'react';
import { FileSpreadsheet, Share2, Check, FileText, TrendingUp } from 'lucide-react';
import { LiquidGlassDome, TextMagnified, GlassButton, BadgeGold } from '@/components/ui';
import type { ResultadoResico } from '../types';
import { exportarResicoCSV, generarResumenWhatsApp, descargarArchivo } from '../lib/exportarResico';

interface Props {
  resultado: ResultadoResico;
  clienteNombre?: string;
  clienteRfc?: string;
  onVerCedula: () => void;
}

export function ResultadoResicoCard({
  resultado,
  clienteNombre = 'Contribuyente',
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
    const csv = exportarResicoCSV(resultado, clienteNombre, clienteRfc);
    const nombre = `RESICO_${resultado.tipoPersona.toUpperCase()}_Mes${resultado.mes}_${resultado.ejercicio}.csv`;
    descargarArchivo(csv, nombre);
  };

  const esPF = resultado.tipoPersona === 'fisica';

  return (
    <div className="space-y-6 rounded-[24px] border border-line bg-surface p-6 shadow-sm">
      {/* Header del resultado */}
      <div className="flex items-center justify-between">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            DETERMINACIÓN DE IMPUESTOS A PAGAR
          </span>
          <h2 className="mt-0.5 font-playfair text-xl font-black text-navy">
            Liquidación Mensual {resultado.ejercicio}
          </h2>
        </div>
        <BadgeGold size="sm" className="text-[11px] font-bold">
          {esPF ? `TASA ISR ${resultado.tasaISRPct}%` : 'TASA ISR 30%'}
        </BadgeGold>
      </div>

      {/* Cúpula de Cristal con Cifra Magnificada */}
      <LiquidGlassDome className="from-canvas/60 via-canvas/40 bg-gradient-to-b to-surface px-4 py-6 text-center">
        <span className="mb-1 block font-inter text-xs font-bold uppercase tracking-wider text-muted">
          TOTAL LÍQUIDO A PAGAR (ISR + IVA)
        </span>
        <div className="my-2 flex items-baseline justify-center gap-1.5">
          <span className="text-xl font-bold text-navy/70">$</span>
          <TextMagnified className="text-3xl font-black tracking-tight text-navy sm:text-5xl">
            {resultado.totalImpuestosPagar.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </TextMagnified>
          <span className="font-mono text-xs font-bold text-muted">MXN</span>
        </div>
        <p className="mx-auto mt-2 max-w-md border-t border-line/60 pt-2 text-[11px] font-medium italic leading-relaxed text-navy/80">
          &ldquo;{resultado.totalEnLetras}&rdquo;
        </p>
      </LiquidGlassDome>

      {/* Desglose rápido en chips: ISR vs IVA */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-canvas/60 rounded-[16px] border border-line p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">ISR Neto a Pagar</span>
            <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
              {esPF ? `Art. 113-E` : 'Art. 211'}
            </span>
          </div>
          <div className="text-lg font-black text-navy">
            ${resultado.isrNetoPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">
            {esPF
              ? `Tasa aplicada: ${resultado.tasaISRPct}%`
              : `Utilidad base: $${resultado.utilidadFiscalBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        <div className="bg-canvas/60 rounded-[16px] border border-line p-3.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-muted">
              {resultado.ivaNetoPagar >= 0 ? 'IVA a Pagar' : 'IVA Saldo a Favor'}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                resultado.ivaNetoPagar >= 0
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              Art. 1 LIVA
            </span>
          </div>
          <div
            className={`text-lg font-black ${
              resultado.ivaNetoPagar >= 0 ? 'text-navy' : 'text-emerald-700'
            }`}
          >
            $
            {Math.abs(resultado.ivaNetoPagar).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">
            {resultado.ivaNetoPagar >= 0 ? 'Importe trasladado neto' : 'Acreditable para sig. mes'}
          </span>
        </div>
      </div>

      {/* Monitoreo de Tope $3.5M para Persona Física */}
      {esPF && (
        <div className="bg-canvas space-y-2.5 rounded-[18px] border border-line p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-gold-dark" />
              <span className="font-inter text-xs font-bold text-navy">
                Control de Tope Anual RESICO ($3,500,000.00 MXN)
              </span>
            </div>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                resultado.rebasoTope
                  ? 'border-red-300 bg-red-100 text-red-800'
                  : resultado.alertaTope === 'critico'
                    ? 'border-amber-300 bg-amber-100 text-amber-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {resultado.porcentajeConsumoTope}% Ejercido
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                resultado.rebasoTope
                  ? 'bg-red-500'
                  : resultado.alertaTope === 'critico'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, resultado.porcentajeConsumoTope)}%` }}
            />
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] text-muted">
            <span>
              Acumulado: $
              {resultado.ingresosAcumuladosTotal.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
              })}
            </span>
            <span>
              Disponible: $
              {Math.max(
                0,
                resultado.topeAnualLISR - resultado.ingresosAcumuladosTotal
              ).toLocaleString('es-MX', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="grid grid-cols-1 gap-2.5 border-t border-line pt-2 sm:grid-cols-3">
        <GlassButton
          variant="default"
          size="sm"
          onClick={handleCopyWhatsApp}
          className="flex items-center justify-center gap-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp</span>
            </>
          )}
        </GlassButton>

        <GlassButton
          variant="default"
          size="sm"
          onClick={handleDescargarCSV}
          className="flex items-center justify-center gap-2 text-xs"
        >
          <FileSpreadsheet className="h-4 w-4 text-gold-dark" />
          <span>Excel (CSV)</span>
        </GlassButton>

        <GlassButton
          variant="primary"
          size="sm"
          onClick={onVerCedula}
          className="flex items-center justify-center gap-2 text-xs"
        >
          <FileText className="h-4 w-4 text-gold" />
          <span>Cédula Oficial</span>
        </GlassButton>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  FileSpreadsheet,
  Share2,
  Check,
  FileText,
  TrendingUp,
} from 'lucide-react';
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
    <div className="rounded-[24px] border border-line bg-surface p-6 shadow-sm space-y-6">
      {/* Header del resultado */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark block">
            DETERMINACIÓN DE IMPUESTOS A PAGAR
          </span>
          <h2 className="font-playfair text-xl font-black text-navy mt-0.5">
            Liquidación Mensual {resultado.ejercicio}
          </h2>
        </div>
        <BadgeGold size="sm" className="text-[11px] font-bold">
          {esPF ? `TASA ISR ${resultado.tasaISRPct}%` : 'TASA ISR 30%'}
        </BadgeGold>
      </div>

      {/* Cúpula de Cristal con Cifra Magnificada */}
      <LiquidGlassDome className="text-center py-6 px-4 bg-gradient-to-b from-canvas/60 via-canvas/40 to-surface">
        <span className="text-xs font-bold uppercase tracking-wider text-muted font-inter block mb-1">
          TOTAL LÍQUIDO A PAGAR (ISR + IVA)
        </span>
        <div className="flex items-baseline justify-center gap-1.5 my-2">
          <span className="text-xl font-bold text-navy/70">$</span>
          <TextMagnified className="text-3xl sm:text-5xl font-black text-navy tracking-tight">
            {resultado.totalImpuestosPagar.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </TextMagnified>
          <span className="text-xs font-bold text-muted font-mono">MXN</span>
        </div>
        <p className="text-[11px] font-medium text-navy/80 italic max-w-md mx-auto leading-relaxed border-t border-line/60 pt-2 mt-2">
          "{resultado.totalEnLetras}"
        </p>
      </LiquidGlassDome>

      {/* Desglose rápido en chips: ISR vs IVA */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] border border-line bg-canvas/60 p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-muted uppercase">ISR Neto a Pagar</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
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

        <div className="rounded-[16px] border border-line bg-canvas/60 p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-muted uppercase">
              {resultado.ivaNetoPagar >= 0 ? 'IVA a Pagar' : 'IVA Saldo a Favor'}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                resultado.ivaNetoPagar >= 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
            ${Math.abs(resultado.ivaNetoPagar).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">
            {resultado.ivaNetoPagar >= 0 ? 'Importe trasladado neto' : 'Acreditable para sig. mes'}
          </span>
        </div>
      </div>

      {/* Monitoreo de Tope $3.5M para Persona Física */}
      {esPF && (
        <div className="rounded-[18px] border border-line bg-canvas p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-gold-dark" />
              <span className="text-xs font-bold text-navy font-inter">
                Control de Tope Anual RESICO ($3,500,000.00 MXN)
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                resultado.rebasoTope
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : resultado.alertaTope === 'critico'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {resultado.porcentajeConsumoTope}% Ejercido
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-line rounded-full h-2.5 overflow-hidden">
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

          <div className="flex items-center justify-between text-[11px] text-muted font-mono">
            <span>Acumulado: ${resultado.ingresosAcumuladosTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            <span>
              Disponible: $
              {Math.max(0, resultado.topeAnualLISR - resultado.ingresosAcumuladosTotal).toLocaleString('es-MX', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-line">
        <GlassButton
          variant="default"
          size="sm"
          onClick={handleCopyWhatsApp}
          className="flex items-center justify-center gap-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-emerald-600" />
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
          <FileSpreadsheet className="w-4 h-4 text-gold-dark" />
          <span>Excel (CSV)</span>
        </GlassButton>

        <GlassButton
          variant="primary"
          size="sm"
          onClick={onVerCedula}
          className="flex items-center justify-center gap-2 text-xs"
        >
          <FileText className="w-4 h-4 text-gold" />
          <span>Cédula Oficial</span>
        </GlassButton>
      </div>
    </div>
  );
}

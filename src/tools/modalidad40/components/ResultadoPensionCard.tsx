import { useState } from 'react';
import { FileText, Check, Share2 } from 'lucide-react';
import { LiquidGlassDome, TextMagnified, GlassButton, BadgeGold } from '@/components/ui';
import type { ResultadoModalidad40 } from '../types';

interface Props {
  resultado: ResultadoModalidad40;
  nombreAsegurado?: string;
  nssAsegurado?: string;
  onVerCedula: () => void;
}

export function ResultadoPensionCard({
  resultado,
  nombreAsegurado = 'Asegurado Proyectado',
  nssAsegurado = '0000-00-0000',
  onVerCedula,
}: Props) {
  const [copied, setCopied] = useState(false);
  const { pension, inversion, roi, limites } = resultado;

  const handleCopyWhatsApp = () => {
    const texto = `🏛️ *ARK TOOLS — Dictamen de Pensión Ley 73 & Modalidad 40 (DOF 2026)*
👤 *Asegurado:* ${nombreAsegurado}
📋 *NSS:* ${nssAsegurado}
━━━━━━━━━━━━━━━━━━━━
💰 *Pensión Mensual Estimada:* $${pension.pensionMensualEstimada.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN/mes
🎁 *Aguinaldo Anual:* $${pension.aguinaldoAnual.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
📊 *Semanas Totales:* ${pension.semanasTotales} semanas
⚖️ *SBC Modalidad 40:* $${limites.sbcEfectivo.toFixed(2)} MXN/día (Límite DOF 2026: $${limites.limitePermitidoDof2026.toFixed(2)})
💳 *Aportación Mensual al IMSS:* $${inversion.cuotaMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN (${inversion.tasaCuotaPct}% en 2026)
💵 *Inversión Total (${resultado.parametros.mesesAportacion} meses):* $${inversion.inversionTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
📈 *Ganancia Mensual Neta:* +$${roi.incrementoMensualPension.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
⏱️ *Retorno de Inversión (ROI):* Recuperas el 100% de lo invertido en ${roi.tiempoRecuperacionFormateado}.
━━━━━━━━━━━━━━━━━━━━
🔒 *Sello Criptográfico:* ${resultado.selloSha256.slice(0, 16)}...
🌐 *Generado con ARK TOOLS:* https://tools.arksystems.site`;

    void navigator.clipboard.writeText(texto).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-6 rounded-[24px] border border-line bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            PROYECCIÓN ACTUARIAL LEY 73
          </span>
          <h2 className="mt-0.5 font-playfair text-xl font-black text-navy">
            Pensión Mensual Estimada
          </h2>
        </div>
        <BadgeGold size="sm" className="font-mono text-[11px] font-bold">
          CUOTA 2026: {inversion.tasaCuotaPct}% LSS
        </BadgeGold>
      </div>

      {/* Cúpula de Cristal con Cifra Magnificada */}
      <LiquidGlassDome className="from-canvas/60 via-canvas/40 bg-gradient-to-b to-surface px-4 py-7 text-center">
        <span className="mb-1 block font-orbitron text-xs font-bold uppercase tracking-wider text-muted">
          PENSIÓN MENSUAL NETA ESTIMADA (A LOS {resultado.parametros.edadJubilacion} AÑOS)
        </span>
        <div className="my-2 flex items-baseline justify-center gap-1.5">
          <span className="text-2xl font-bold text-navy/70">$</span>
          <TextMagnified className="text-4xl font-black tracking-tight text-navy sm:text-6xl">
            {pension.pensionMensualEstimada.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </TextMagnified>
          <span className="font-mono text-xs font-bold text-muted">MXN / mes</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-muted">
          <span>
            🎁 Aguinaldo Anual:{' '}
            <strong className="font-bold text-navy">
              ${pension.aguinaldoAnual.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </strong>
          </span>
          <span>•</span>
          <span>
            Semanas Reconocidas:{' '}
            <strong className="font-bold text-navy">{pension.semanasTotales}</strong>
          </span>
          <span>•</span>
          <span>
            Factor Edad ({pension.factorEdadPct}%):{' '}
            <strong className="font-bold text-navy">
              {resultado.parametros.edadJubilacion} Años
            </strong>
          </span>
        </div>
      </LiquidGlassDome>

      {/* Cuadrícula de Métricas de Inversión y ROI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Métrica 1: Cuota Mensual */}
        <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
            Cuota Mensual M40
          </span>
          <div className="mt-1 font-mono text-sm font-black text-navy sm:text-base">
            ${inversion.cuotaMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">Tasa {inversion.tasaCuotaPct}%</span>
        </div>

        {/* Métrica 2: Inversión Total */}
        <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
            Inversión Acumulada
          </span>
          <div className="mt-1 font-mono text-sm font-black text-navy sm:text-base">
            ${inversion.inversionTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-muted">
            {resultado.parametros.mesesAportacion} meses pagados
          </span>
        </div>

        {/* Métrica 3: Ganancia Mensual Neta */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Ganancia Mensual
          </span>
          <div className="mt-1 font-mono text-sm font-black text-emerald-900 sm:text-base">
            +${roi.incrementoMensualPension.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-700">vs. Pensión sin M40</span>
        </div>

        {/* Métrica 4: Recuperación de Inversión (ROI) */}
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gold-dark">
            Retorno de Inversión
          </span>
          <div className="mt-1 font-mono text-sm font-black text-gold-dark sm:text-base">
            {roi.tiempoRecuperacionFormateado}
          </div>
          <span className="text-[10px] text-gold-dark/80">
            {roi.mesesRecuperacionRoi} mensualidades
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={handleCopyWhatsApp}
          className="hover:bg-surface-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-xs font-bold text-navy transition"
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
          {copied ? '¡Copiado para WhatsApp!' : 'Compartir Resumen'}
        </button>

        <GlassButton
          variant="primary"
          onClick={onVerCedula}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
        >
          <FileText size={16} />
          Emitir Cédula Oficial SHA-256 + QR
        </GlassButton>
      </div>
    </div>
  );
}

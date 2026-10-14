/**
 * ARK TOOLS — Calculadora ISN 2026
 * ResumenISN
 *
 * Card de resumen con el resultado del cálculo.
 * Usa LiquidGlassDome + TextMagnified + GlassButton.
 * Es el componente más "Ark" de toda la herramienta.
 */

import { Download, ArrowUpRight } from 'lucide-react';
import { GlassButton, LiquidGlassDome, BadgeGold, GoldDivider, TextMagnified } from '@/components/ui';
import { formatearMXN, formatearPorcentaje } from '../lib/calcularISN';
import type { Estado, ResultadoISN } from '../types';

interface ResumenISNProps {
  /** Resultado del cálculo */
  resultado: ResultadoISN;
  /** Estado seleccionado */
  estado: Estado;
  /** Callback al hacer click en "Descargar Excel" */
  onExport?: () => void;
}

export function ResumenISN({ resultado, estado, onExport }: ResumenISNProps) {
  return (
    <LiquidGlassDome padding="lg" radius="dome">
      {/* Header con badge */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
            Resumen ISN 2026
          </div>
          <div className="mt-1 font-playfair font-black text-[18px] text-ink leading-tight">
            {estado.nombre}
          </div>
        </div>
        <BadgeGold size="md">
          {estado.corto} · {formatearPorcentaje(estado.tasa)}
        </BadgeGold>
      </div>

      <GoldDivider spacing="md" />

      {/* Desglose */}
      <div className="space-y-3 text-[13px] font-inter">
        <div className="flex justify-between items-baseline">
          <span className="text-muted">Estado</span>
          <span className="font-semibold text-ink">{estado.nombre}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-muted">Tasa aplicable</span>
          <span className="font-orbitron font-bold text-navy tabular-nums">
            {formatearPorcentaje(estado.tasa)}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-muted">Base gravable</span>
          <span className="font-orbitron font-semibold text-ink tabular-nums">
            {formatearMXN(resultado.baseGravable)}
          </span>
        </div>

        {resultado.totalExento > 0 && (
          <div className="flex justify-between items-baseline">
            <span className="text-muted">Exento (informativo)</span>
            <span className="font-orbitron font-semibold text-muted tabular-nums">
              {formatearMXN(resultado.totalExento)}
            </span>
          </div>
        )}
      </div>

      <GoldDivider spacing="md" />

      {/* TOTAL — el elemento más importante */}
      <div className="text-center py-2">
        <div className="text-[10px] font-bold tracking-[0.2em] text-gold-dark uppercase mb-3">
          Total a pagar
        </div>
        <TextMagnified size="xl" className="text-navy">
          {formatearMXN(resultado.isn)}
        </TextMagnified>
        <div className="mt-3 text-[10px] tracking-[0.16em] font-semibold text-muted font-orbitron">
          {formatearMXN(resultado.baseGravable)} × {formatearPorcentaje(estado.tasa)}
        </div>
      </div>

      {/* CTA de exportación */}
      {onExport && (
        <>
          <GoldDivider spacing="lg" />
          <GlassButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={onExport}
            className="!orbitron font-orbitron"
          >
            <Download size={16} strokeWidth={2.5} />
            DESCARGAR EXCEL (CSV)
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </GlassButton>

          <div className="mt-3 text-center text-[10px] tracking-[0.12em] text-muted font-orbitron">
            Incluye desglose de percepciones · Compatible con Excel/Sheets
          </div>
        </>
      )}
    </LiquidGlassDome>
  );
}

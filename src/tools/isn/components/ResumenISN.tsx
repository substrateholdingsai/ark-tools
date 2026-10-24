/**
 * ARK LEDGER — Calculadora ISN 2026
 * ResumenISN
 *
 * Card de resumen con el resultado del cálculo.
 * Usa LiquidGlassDome + TextMagnified + GlassButton.
 * Es el componente más "Ark" de toda la herramienta.
 */

import { Download, ArrowUpRight } from 'lucide-react';
import {
  GlassButton,
  LiquidGlassDome,
  BadgeGold,
  GoldDivider,
  TextMagnified,
} from '@/components/ui';
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
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Resumen ISN 2026
          </div>
          <div className="mt-1 font-playfair text-[18px] font-black leading-tight text-ink">
            {estado.nombre}
          </div>
        </div>
        <BadgeGold size="md">
          {estado.corto} · {formatearPorcentaje(estado.tasa)}
        </BadgeGold>
      </div>

      <GoldDivider spacing="md" />

      {/* Desglose */}
      <div className="space-y-3 font-inter text-[13px]">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Estado</span>
          <span className="font-semibold text-ink">{estado.nombre}</span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Tasa aplicable</span>
          <span className="font-orbitron font-bold tabular-nums text-navy">
            {formatearPorcentaje(estado.tasa)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Base gravable</span>
          <span className="font-orbitron font-semibold tabular-nums text-ink">
            {formatearMXN(resultado.baseGravable)}
          </span>
        </div>

        {resultado.totalExento > 0 && (
          <div className="flex items-baseline justify-between">
            <span className="text-muted">Exento (informativo)</span>
            <span className="font-orbitron font-semibold tabular-nums text-muted">
              {formatearMXN(resultado.totalExento)}
            </span>
          </div>
        )}
      </div>

      <GoldDivider spacing="md" />

      {/* TOTAL — el elemento más importante */}
      <div className="py-2 text-center">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
          Total a pagar
        </div>
        <TextMagnified size="xl" className="text-navy">
          {formatearMXN(resultado.isn)}
        </TextMagnified>
        <div className="mt-3 font-orbitron text-[10px] font-semibold tracking-[0.16em] text-muted">
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

          <div className="mt-3 text-center font-orbitron text-[10px] tracking-[0.12em] text-muted">
            Incluye desglose de percepciones · Compatible con Excel/Sheets
          </div>
        </>
      )}
    </LiquidGlassDome>
  );
}

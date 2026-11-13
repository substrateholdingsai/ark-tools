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
  /** Callback para la Cédula AAFY (Yucatán) */
  onExportAafy?: () => void;
}

export function ResumenISN({ resultado, estado, onExport, onExportAafy }: ResumenISNProps) {
  return (
    <LiquidGlassDome padding="lg" radius="dome">
      {/* Header con badge */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Resumen ISN {resultado.ejercicio}
          </div>
          <div className="mt-1 font-playfair text-[18px] font-black leading-tight text-ink">
            {estado.nombre}
          </div>
        </div>
        <BadgeGold size="md">
          {estado.corto} · {formatearPorcentaje(resultado.tasaEfectiva)}
        </BadgeGold>
      </div>

      <GoldDivider spacing="md" />

      {/* Desglose */}
      <div className="space-y-3 font-inter text-[13px]">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Estado / Ejercicio</span>
          <span className="font-semibold text-ink">
            {estado.nombre} ({resultado.ejercicio})
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Base gravable</span>
          <span className="font-orbitron font-semibold tabular-nums text-ink">
            {formatearMXN(resultado.baseGravable)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Tasa bruta</span>
          <span className="font-orbitron font-bold tabular-nums text-navy">
            {formatearPorcentaje(resultado.tasaBruta)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">ISN bruto</span>
          <span className="font-orbitron font-semibold tabular-nums text-ink">
            {formatearMXN(resultado.isnBruto)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Estímulo Decreto 147/2025 (−0.75%)</span>
          <span className="font-orbitron font-semibold tabular-nums text-emerald-700">
            −{formatearMXN(resultado.estimulo)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Tasa efectiva neta</span>
          <span className="font-orbitron font-bold tabular-nums text-navy">
            {formatearPorcentaje(resultado.tasaEfectiva)}
          </span>
        </div>

        {!resultado.estimuloConfirmado && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-900">
            Estímulo no confirmado para gobierno estatal (tasa bruta 4.75%).
          </div>
        )}

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
          ISN neto a pagar
        </div>
        <TextMagnified size="xl" className="text-navy">
          {formatearMXN(resultado.isnNeto)}
        </TextMagnified>
        <div className="mt-3 font-orbitron text-[10px] font-semibold tracking-[0.16em] text-muted">
          {formatearMXN(resultado.baseGravable)} × {formatearPorcentaje(resultado.tasaEfectiva)}
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

          {estado.id === 'YUC' && onExportAafy && (
            <div className="mt-4 border-t border-line/60 pt-3">
              <GlassButton
                variant="default"
                size="md"
                fullWidth
                onClick={onExportAafy}
                className="!orbitron border-amber-500/40 bg-amber-500/10 font-orbitron text-amber-900 transition hover:bg-amber-500/20"
              >
                <Download size={14} strokeWidth={2.5} />
                CÉDULA AAFY (YUCATÁN 3.75% / 3.0% MIPYME)
              </GlassButton>
              <div className="mt-1.5 text-center font-orbitron text-[9px] tracking-[0.08em] text-muted">
                Papel de trabajo oficial conforme a Arts. 21-27 LGHY y Decreto 147/2025
              </div>
            </div>
          )}
        </>
      )}
    </LiquidGlassDome>
  );
}

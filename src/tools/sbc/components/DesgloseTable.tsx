/**
 * ARK TOOLS — Calculadora SBC 2026
 * DesgloseTable
 *
 * Tabla con el desglose del factor de integración.
 * Muestra: Base (1.0), Vacaciones, Aguinaldo, Factor total.
 */

import { formatearFactor, formatearMXN } from '../lib/calcularSBC';
import type { ParametrosSBC, ResultadoSBC } from '../types';

interface DesgloseTableProps {
  /** Parámetros de entrada */
  parametros: ParametrosSBC;
  /** Resultado del cálculo */
  resultado: ResultadoSBC;
}

export function DesgloseTable({ parametros, resultado }: DesgloseTableProps) {
  const { desglose, factor } = resultado;

  return (
    <div className="rounded-[20px] bg-surface border border-line p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
          Desglose del factor
        </h3>
        <span className="text-[10px] font-mono text-muted">
          LSS Art. 27
        </span>
      </div>

      {/* Tabla */}
      <div className="space-y-2.5">
        {/* Renglón 1: Base */}
        <Renglon
          label="Base"
          valor={1.0}
          detalle="Salario diario"
          color="navy"
        />

        {/* Renglón 2: Vacaciones */}
        <Renglon
          label="Vacaciones"
          valor={desglose.aporteVacaciones}
          detalle={`${parametros.diasVacaciones}d × ${parametros.primaVacacional}% ÷ 365`}
          color="gold"
        />

        {/* Renglón 3: Aguinaldo */}
        <Renglon
          label="Aguinaldo"
          valor={desglose.aporteAguinaldo}
          detalle={`${parametros.diasAguinaldo}d ÷ 365`}
          color="navy"
        />

        {/* Divisor */}
        <div className="h-px bg-line my-3" />

        {/* Renglón final: Factor total */}
        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-navy text-white p-3.5">
          <div>
            <div className="text-[10px] font-bold tracking-[0.16em] text-white/60 uppercase">
              Factor de integración
            </div>
            <div className="text-[10px] text-white/50 mt-0.5 font-mono">
              1 + {formatearFactor(desglose.aporteVacaciones)} +{' '}
              {formatearFactor(desglose.aporteAguinaldo)}
            </div>
          </div>
          <div className="font-orbitron font-black text-[20px] tabular-nums tracking-tight">
            {formatearFactor(factor)}
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="mt-4 rounded-[10px] bg-surface-2 border border-line p-3">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <div className="text-muted">Días prima</div>
            <div className="font-bold text-navy mt-0.5 font-orbitron tabular-nums">
              {desglose.diasPrimaVacacional.toFixed(2)} días
            </div>
          </div>
          <div>
            <div className="text-muted">Integración anual</div>
            <div className="font-bold text-navy mt-0.5 font-orbitron tabular-nums">
              {desglose.diasIntegracion.toFixed(2)} días
            </div>
          </div>
          <div>
            <div className="text-muted">SBC bruto</div>
            <div className="font-bold text-navy mt-0.5 font-orbitron tabular-nums">
              {formatearMXN(resultado.sbcBruto)}
            </div>
          </div>
          <div>
            <div className="text-muted">UMA 2026</div>
            <div className="font-bold text-navy mt-0.5 font-orbitron tabular-nums">
              $113.14 × 25
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SUBCOMPONENTE: Renglón
// ─────────────────────────────────────────────────────────────────────

interface RenglonProps {
  label: string;
  valor: number;
  detalle: string;
  color: 'navy' | 'gold';
}

function Renglon({ label, valor, detalle, color }: RenglonProps) {
  const colorClasses = {
    navy: 'text-navy',
    gold: 'text-gold-dark',
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className={`text-[12px] font-bold uppercase tracking-[0.14em] font-orbitron ${colorClasses[color]}`}>
          {label}
        </div>
        <div className="text-[10px] text-muted mt-0.5 font-mono truncate">
          {detalle}
        </div>
      </div>
      <div className={`font-orbitron font-bold text-[16px] tabular-nums shrink-0 ${colorClasses[color]}`}>
        +{formatearFactor(valor)}
      </div>
    </div>
  );
}

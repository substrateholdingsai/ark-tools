/**
 * ARK TOOLS — Calculadora SBC 2026
 * RangoVisual
 *
 * Barra visual que muestra la posición del SBC entre el salario mínimo
 * y el tope de 25 UMAs. Incluye marcador animado y porcentaje.
 */

import { formatearMXN } from '../lib/calcularSBC';
import { CONSTANTES_IMSS } from '../data/uma';
import type { ResultadoSBC } from '../types';

interface RangoVisualProps {
  /** Resultado del cálculo */
  resultado: ResultadoSBC;
}

export function RangoVisual({ resultado }: RangoVisualProps) {
  const { sbcFinal, porcentajeDelTope } = resultado;

  // Porcentaje del salario mínimo respecto al tope (0-100)
  const porcentajeMinimo =
    (CONSTANTES_IMSS.salarioMinimo / CONSTANTES_IMSS.topePesos) * 100;

  return (
    <div className="rounded-[20px] bg-surface border border-line p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
          Posición en el rango IMSS
        </h3>
        <span className="text-[10px] font-mono text-muted tabular-nums">
          {porcentajeDelTope.toFixed(1)}% del tope
        </span>
      </div>

      {/* Labels arriba: mínimo y tope */}
      <div className="flex justify-between text-[10px] font-bold tracking-[0.14em] text-muted uppercase mb-2">
        <span>Mín {formatearMXN(CONSTANTES_IMSS.salarioMinimo)}</span>
        <span>25 UMA {formatearMXN(CONSTANTES_IMSS.topePesos)}</span>
      </div>

      {/* Barra */}
      <div className="relative h-3.5 rounded-full bg-surface-2 border border-line overflow-hidden p-[3px]">
        {/* Progreso (del 0 al %) */}
        <div
          className="h-full rounded-full bg-navy transition-all duration-500 ease-out"
          style={{ width: `${porcentajeDelTope}%` }}
        />

        {/* Marcador del salario mínimo */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-gold/60"
          style={{ left: `${porcentajeMinimo}%` }}
          aria-label="Salario mínimo"
        />

        {/* Marcador del SBC actual */}
        {sbcFinal > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gold border-2 border-white shadow-sm transition-all duration-500"
            style={{
              left: `calc(${Math.min(100, Math.max(0, porcentajeDelTope))}% - 6px)`,
            }}
            aria-label="SBC actual"
          />
        )}
      </div>

      {/* Footer: información contextual */}
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px]">
        <span className="text-muted">
          {sbcFinal > 0
            ? `${porcentajeDelTope.toFixed(1)}% del tope`
            : 'Ingresa un salario para ver la posición'}
        </span>
        {sbcFinal > 0 && (
          <span className="font-semibold text-navy font-orbitron tabular-nums">
            {formatearMXN(CONSTANTES_IMSS.topePesos - sbcFinal)} restantes
          </span>
        )}
      </div>
    </div>
  );
}

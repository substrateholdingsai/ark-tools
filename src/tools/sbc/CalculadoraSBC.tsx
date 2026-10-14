/**
 * ARK TOOLS — Calculadora SBC 2026
 * Componente Principal
 *
 * Ensambla los 5 componentes del Día 3:
 *   1. ParametrosCard  — Inputs + sliders + presets
 *   2. RangoVisual     — Barra de posición en el rango IMSS
 *   3. DesgloseTable   — Tabla con factor y aportes
 *   4. ResultadoSBC    — Card dorada con SBC final
 *   5. ExplicacionSBC  — Card navy informativa
 *
 * Estado local:
 *   - parametros: ParametrosSBC (default del Día 1)
 *   - resultado: calculado con useMemo
 */

import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  ParametrosCard,
  RangoVisual,
  DesgloseTable,
  ResultadoSBC,
  ExplicacionSBC,
} from './components';
import { PARAMETROS_DEFAULT } from './data/uma';
import { calcularResultadoSBC } from './lib/calcularSBC';
import type { ParametrosSBC } from './types';

interface CalculadoraSBCProps {
  /** Callback al volver al dashboard (opcional) */
  onBack?: () => void;
}

export function CalculadoraSBC({ onBack }: CalculadoraSBCProps) {
  // ─────────────────────────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────────────────────────
  const [parametros, setParametros] = useState<ParametrosSBC>(PARAMETROS_DEFAULT);

  // ─────────────────────────────────────────────────────────────
  // CÁLCULOS DERIVADOS
  // ─────────────────────────────────────────────────────────────
  const resultado = useMemo(
    () => calcularResultadoSBC(parametros),
    [parametros]
  );

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Actualiza un campo de parámetros.
   * Sanitiza el valor según el campo.
   */
  const handleChange = useCallback(
    (campo: keyof ParametrosSBC, valor: number) => {
      setParametros((prev) => {
        let valorSanitizado = valor;

        switch (campo) {
          case 'salarioDiario':
            valorSanitizado = Math.max(0, valor);
            break;
          case 'diasVacaciones':
            valorSanitizado = Math.max(6, Math.min(32, valor));
            break;
          case 'primaVacacional':
            valorSanitizado = Math.max(0, Math.min(100, valor));
            break;
          case 'diasAguinaldo':
            valorSanitizado = Math.max(0, valor);
            break;
        }

        return { ...prev, [campo]: valorSanitizado };
      });
    },
    []
  );

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10">
      {/* Botón de volver */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="
            mb-6 inline-flex items-center gap-2
            text-[11px] font-bold tracking-[0.16em] uppercase
            text-muted hover:text-navy transition
            font-orbitron
          "
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-playfair font-black text-[36px] md:text-[44px] leading-[0.95] tracking-[-0.03em] text-ink">
          Calculadora SBC 2026
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-muted max-w-[64ch] inter font-inter">
          Salario Base de Cotización con factor de integración, tope de 25 UMAs
          ($2,828.50) y salario mínimo frontera ($278.80). Cálculo conforme LSS
          Art. 27 y 28.
        </p>
      </header>

      {/* Grid de dos columnas: entrada + resultado */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-start">
        {/* COLUMNA IZQUIERDA: Entradas */}
        <div className="space-y-6 min-w-0">
          <ParametrosCard
            parametros={parametros}
            onChange={handleChange}
            resultado={resultado}
          />

          <RangoVisual resultado={resultado} />

          <DesgloseTable parametros={parametros} resultado={resultado} />
        </div>

        {/* COLUMNA DERECHA: Resultado (sticky en desktop) */}
        <div className="lg:sticky lg:top-[88px] space-y-4">
          <ResultadoSBC parametros={parametros} resultado={resultado} />

          <ExplicacionSBC />
        </div>
      </div>

      {/* Nota al pie */}
      <div className="mt-8 rounded-[16px] bg-surface-2 border border-line p-4 text-[11px] leading-[1.5] text-muted max-w-[760px]">
        <strong className="text-ink">Nota:</strong> Cálculo informativo
        conforme a la Ley del Seguro Social. El SBC integra las prestaciones
        (vacaciones, prima vacacional, aguinaldo) al salario diario. Los valores
        de UMA y salario mínimo son los vigentes a 2026. Verifica con tu área
        contable antes de presentar ante el IMSS.
      </div>
    </div>
  );
}

export default CalculadoraSBC;

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

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
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
  const { activeClient } = useExpediente();

  // Auto-hidratar con datos del cliente/trabajador activo
  useEffect(() => {
    if (activeClient && activeClient.salario_diario > 0) {
      setParametros((prev) => ({
        ...prev,
        salarioDiario: activeClient.salario_diario,
      }));
    }
  }, [activeClient]);

  // ─────────────────────────────────────────────────────────────
  // CÁLCULOS DERIVADOS
  // ─────────────────────────────────────────────────────────────
  const resultado = useMemo(() => calcularResultadoSBC(parametros), [parametros]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Actualiza un campo de parámetros.
   * Sanitiza el valor según el campo.
   */
  const handleChange = useCallback((campo: keyof ParametrosSBC, valor: number) => {
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
  }, []);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
      {/* Botón de volver */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      {/* Header */}
      <header className="mb-6">
        <h1 className="font-playfair text-[36px] font-black leading-[0.95] tracking-[-0.03em] text-ink md:text-[44px]">
          Calculadora SBC 2026
        </h1>
        <p className="inter mt-3 max-w-[64ch] font-inter text-[14px] leading-[1.6] text-muted">
          Salario Base de Cotización con factor de integración, tope de 25 UMAs ($2,932.75) y
          salario mínimo frontera ($440.87). Cálculo conforme LSS Art. 27 y 28.
        </p>
      </header>

      {/* Sincronización con Expediente Único (Sprint 9) */}
      <div className="mb-8">
        <ExpedienteToolBanner
          toolId="sbc"
          titulo="Determinación de Salario Base de Cotización (SBC)"
          inputs={parametros as unknown as Record<string, unknown>}
          outputs={resultado as unknown as Record<string, unknown>}
        />
      </div>

      {/* Grid de dos columnas: entrada + resultado */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        {/* COLUMNA IZQUIERDA: Entradas */}
        <div className="min-w-0 space-y-6">
          <ParametrosCard parametros={parametros} onChange={handleChange} resultado={resultado} />

          <RangoVisual resultado={resultado} />

          <DesgloseTable parametros={parametros} resultado={resultado} />
        </div>

        {/* COLUMNA DERECHA: Resultado (sticky en desktop) */}
        <div className="space-y-4 lg:sticky lg:top-[88px]">
          <ResultadoSBC parametros={parametros} resultado={resultado} />

          <ExplicacionSBC />
        </div>
      </div>

      {/* Nota al pie */}
      <div className="mt-8 max-w-[760px] rounded-[16px] border border-line bg-surface-2 p-4 text-[11px] leading-[1.5] text-muted">
        <strong className="text-ink">Nota:</strong> Cálculo informativo conforme a la Ley del Seguro
        Social. El SBC integra las prestaciones (vacaciones, prima vacacional, aguinaldo) al salario
        diario. Los valores de UMA y salario mínimo son los vigentes a 2026. Verifica con tu área
        contable antes de presentar ante el IMSS.
      </div>
    </div>
  );
}

export default CalculadoraSBC;

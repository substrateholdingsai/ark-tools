/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * Componente Principal
 *
 * Ensambla:
 *   1. PeriodoSelector      — Selector de frecuencia de pago
 *   2. SueldoInput          — Percepciones, presets y días trabajados
 *   3. DesgloseDeducciones  — Detalle de retenciones ISR + IMSS obrero
 *   4. ResultadoNomina      — Card dorada con el sueldo neto final
 */

import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Calculator, BookOpen, AlertCircle } from 'lucide-react';
import {
  PeriodoSelector,
  SueldoInput,
  DesgloseDeducciones,
  ResultadoNomina,
} from './components';
import { PARAMETROS_DEFAULT } from './data/defaults';
import { PERIODOS } from './data/periodos';
import { calcularNomina } from './lib/calcularNomina';
import type { ParametrosNomina, Periodo } from './types';

interface CalculadoraNominaProps {
  /** Callback al volver al dashboard */
  onBack?: () => void;
}

export function CalculadoraNomina({ onBack }: CalculadoraNominaProps) {
  // ─────────────────────────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────────────────────────
  const [parametros, setParametros] = useState<ParametrosNomina>(PARAMETROS_DEFAULT);

  // ─────────────────────────────────────────────────────────────
  // CÁLCULOS DERIVADOS
  // ─────────────────────────────────────────────────────────────
  const resultado = useMemo(
    () => calcularNomina(parametros),
    [parametros]
  );

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handlePeriodoChange = useCallback((nuevoPeriodo: Periodo) => {
    const info = PERIODOS[nuevoPeriodo];
    setParametros((prev) => {
      // Ajustar sueldo estimado según el período
      let nuevoSueldo = prev.sueldoBruto;
      if (prev.periodo !== nuevoPeriodo) {
        // Normalizar a mensual primero
        const factorPrev = PERIODOS[prev.periodo].vecesAlAnio / 12;
        const sueldoMensual = prev.sueldoBruto * factorPrev;
        // Escalar al nuevo período
        const factorNuevo = 12 / info.vecesAlAnio;
        nuevoSueldo = Math.round(sueldoMensual * factorNuevo * 100) / 100;
      }

      return {
        ...prev,
        periodo: nuevoPeriodo,
        sueldoBruto: nuevoSueldo,
        diasPeriodo: info.dias,
        diasTrabajados: info.dias,
      };
    });
  }, []);

  const handleParametroChange = useCallback(
    <K extends keyof ParametrosNomina>(campo: K, valor: ParametrosNomina[K]) => {
      setParametros((prev) => ({
        ...prev,
        [campo]: valor,
      }));
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Botón Volver + Header */}
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="
              inline-flex items-center gap-2 mb-4 text-[12px] font-bold
              text-muted hover:text-navy transition-colors font-orbitron
            "
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al menú de herramientas</span>
          </button>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-navy/5 border border-navy/10 text-navy text-[11px] font-bold font-orbitron tracking-wider uppercase mb-2">
              <Calculator className="w-3.5 h-3.5 text-gold" />
              <span>MÓDULO FISCAL Y LABORAL</span>
            </div>
            <h1 className="text-[28px] md:text-[34px] font-bold text-navy font-playfair tracking-tight">
              Calculadora de Nómina Rápida 2026
            </h1>
            <p className="text-[14px] text-muted max-w-2xl mt-1">
              Determina con exactitud el sueldo neto de colaboradores aplicando las tarifas de ISR 2026, subsidio al empleo y cuotas de retención obrera del IMSS.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-line text-[11px] font-mono font-semibold text-muted">
              RMF 2026 Anexo 8
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-line text-[11px] font-mono font-semibold text-muted">
              LSS 2026
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal de 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Entradas (5 cols en lg) */}
        <div className="lg:col-span-5 space-y-6">
          <PeriodoSelector
            value={parametros.periodo}
            onChange={handlePeriodoChange}
          />

          <SueldoInput
            parametros={parametros}
            onChange={handleParametroChange}
          />
        </div>

        {/* Columna Derecha: Salidas y Desglose (7 cols en lg) */}
        <div className="lg:col-span-7 space-y-6">
          <ResultadoNomina
            parametros={parametros}
            resultado={resultado}
          />

          <DesgloseDeducciones
            resultado={resultado}
          />
        </div>
      </div>

      {/* Nota legal y explicativa inferior */}
      <div className="rounded-[16px] bg-surface border border-line p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div className="space-y-1 text-[12px] text-muted">
            <h4 className="font-bold text-navy uppercase font-orbitron text-[11px] tracking-wider">
              Criterio Normativo y Metodología de Cálculo
            </h4>
            <p>
              La retención de ISR se calcula aplicando la tabla progresiva mensual del Anexo 8 de la Resolución Miscelánea Fiscal (RMF 2026) prorrateada según la periodicidad del pago. Las cuotas obreras de seguridad social corresponden a los ramos de Enfermedades y Maternidad, Invalidez y Vida, y Cesantía en Edad Avanzada y Vejez previstos en la Ley del Seguro Social.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-navy/70">
              <AlertCircle className="w-3.5 h-3.5 text-navy shrink-0" />
              <span>Para nóminas con percepciones exentas (vales, fondo de ahorro, horas extras), utiliza el desglose avanzado.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculadoraNomina;

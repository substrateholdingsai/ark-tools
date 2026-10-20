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

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft, Calculator, BookOpen, AlertCircle } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import { PeriodoSelector, SueldoInput, DesgloseDeducciones, ResultadoNomina } from './components';
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
  const { activeClient } = useExpediente();

  // Auto-hidratar con datos del cliente/trabajador activo
  useEffect(() => {
    if (activeClient) {
      setParametros((prev) => {
        const dias = prev.diasPeriodo || 15;
        const sueldoEstimado =
          activeClient.salario_diario > 0
            ? Math.round(activeClient.salario_diario * dias * 100) / 100
            : prev.sueldoBruto;
        const sbc =
          activeClient.salario_diario_integrado > 0
            ? activeClient.salario_diario_integrado
            : prev.sbcDiario;

        return {
          ...prev,
          sueldoBruto: sueldoEstimado,
          sbcDiario: sbc,
        };
      });
    }
  }, [activeClient]);

  // ─────────────────────────────────────────────────────────────
  // CÁLCULOS DERIVADOS
  // ─────────────────────────────────────────────────────────────
  const resultado = useMemo(() => calcularNomina(parametros), [parametros]);

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
            className="mb-4 inline-flex items-center gap-2 font-orbitron text-[12px] font-bold text-muted transition-colors hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al menú de herramientas</span>
          </button>
        )}

        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-navy/10 bg-navy/5 px-2.5 py-1 font-orbitron text-[11px] font-bold uppercase tracking-wider text-navy">
              <Calculator className="h-3.5 w-3.5 text-gold" />
              <span>MÓDULO FISCAL Y LABORAL</span>
            </div>
            <h1 className="font-playfair text-[28px] font-bold tracking-tight text-navy md:text-[34px]">
              Calculadora de Nómina Rápida 2026
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] text-muted">
              Determina con exactitud el sueldo neto de colaboradores aplicando las tarifas de ISR
              2026, subsidio al empleo y cuotas de retención obrera del IMSS.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="rounded-full border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-semibold text-muted">
              RMF 2026 Anexo 8
            </span>
            <span className="rounded-full border border-line bg-surface-2 px-3 py-1.5 font-mono text-[11px] font-semibold text-muted">
              LSS 2026
            </span>
          </div>
        </div>
      </div>

      {/* Sincronización con Expediente Único (Sprint 9) */}
      <div className="mb-6">
        <ExpedienteToolBanner
          toolId="nomina"
          titulo={`Cálculo de Nómina (${parametros.periodo.toUpperCase()})`}
          inputs={parametros as unknown as Record<string, unknown>}
          outputs={resultado as unknown as Record<string, unknown>}
        />
      </div>

      {/* Grid Principal de 2 Columnas */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Columna Izquierda: Entradas (5 cols en lg) */}
        <div className="space-y-6 lg:col-span-5">
          <PeriodoSelector value={parametros.periodo} onChange={handlePeriodoChange} />

          <SueldoInput parametros={parametros} onChange={handleParametroChange} />
        </div>

        {/* Columna Derecha: Salidas y Desglose (7 cols en lg) */}
        <div className="space-y-6 lg:col-span-7">
          <ResultadoNomina parametros={parametros} resultado={resultado} />

          <DesgloseDeducciones resultado={resultado} />
        </div>
      </div>

      {/* Nota legal y explicativa inferior */}
      <div className="rounded-[16px] border border-line bg-surface p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div className="space-y-1 text-[12px] text-muted">
            <h4 className="font-orbitron text-[11px] font-bold uppercase tracking-wider text-navy">
              Criterio Normativo y Metodología de Cálculo
            </h4>
            <p>
              La retención de ISR se calcula aplicando la tabla progresiva mensual del Anexo 8 de la
              Resolución Miscelánea Fiscal (RMF 2026) prorrateada según la periodicidad del pago.
              Las cuotas obreras de seguridad social corresponden a los ramos de Enfermedades y
              Maternidad, Invalidez y Vida, y Cesantía en Edad Avanzada y Vejez previstos en la Ley
              del Seguro Social.
            </p>
            <div className="flex items-center gap-1.5 pt-2 text-[11px] text-navy/70">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-navy" />
              <span>
                Para nóminas con percepciones exentas (vales, fondo de ahorro, horas extras),
                utiliza el desglose avanzado.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculadoraNomina;

/**
 * ARK TOOLS — Calculadora de Finiquitos y Liquidaciones 2026
 * Componente Principal Ensamblador (Sprint 8 — Cierra 11/11)
 *
 * Fundamentado en la Ley Federal del Trabajo (LFT):
 * - Arts. 50 (Indemnizaciones por despido)
 * - Art. 76 (Reforma Vacaciones Dignas 2023)
 * - Art. 79 (Vacaciones proporcionales)
 * - Art. 80 (Prima vacacional >= 25%)
 * - Art. 87 (Aguinaldo mínimo 15 días o proporcional)
 * - Art. 162 (Prima de antigüedad 12 días/año)
 * - Art. 486 (Tope legal de 2×SMG para prima de antigüedad)
 */

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Sparkles, Scale, Info } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import {
  ParametrosFiniquitoCard,
  AntiguedadCard,
  DesgloseFiniquitoTable,
  ResultadoFiniquitoCard,
} from './components';
import { calcularFiniquito } from './lib/calcularFiniquito';
import type { EntradaFiniquito } from './types';
import type { AntiguedadPreview } from './components/ParametrosFiniquitoCard';

interface CalculadoraFiniquitosProps {
  onBack?: () => void;
}

const ENTRADA_INICIAL: EntradaFiniquito = {
  tipoBaja: 'finiquito',
  fechaIngreso: '2024-01-15',
  fechaBaja: '2026-10-15',
  salarioDiario: 500,
  sdi: 524.66,
  vacacionesPendientes: 0,
  aguinaldoPendiente: 0,
  primaVacacionalPct: 25,
  incluirPrimaAntiguedad: false,
  incluirIndem90Dias: false,
  incluir20DiasAnio: false,
};

export function CalculadoraFiniquitos({ onBack }: CalculadoraFiniquitosProps) {
  const [entrada, setEntrada] = useState<EntradaFiniquito>(ENTRADA_INICIAL);

  // Cálculo en vivo del preview de antigüedad para la ParametrosFiniquitoCard
  const antiguedadPreview = useMemo<AntiguedadPreview | undefined>(() => {
    if (!entrada.fechaIngreso || !entrada.fechaBaja) return undefined;
    const fIngreso = new Date(`${entrada.fechaIngreso}T12:00:00Z`);
    const fBaja = new Date(`${entrada.fechaBaja}T12:00:00Z`);
    if (isNaN(fIngreso.getTime()) || isNaN(fBaja.getTime()) || fBaja < fIngreso) return undefined;

    const msPorDia = 86_400_000;
    const diasTotales = Math.floor((fBaja.getTime() - fIngreso.getTime()) / msPorDia) + 1;

    let anios = fBaja.getUTCFullYear() - fIngreso.getUTCFullYear();
    let meses = fBaja.getUTCMonth() - fIngreso.getUTCMonth();
    let dias = fBaja.getUTCDate() - fIngreso.getUTCDate();

    if (dias < 0) {
      meses--;
      const ultimoDiaMesAnterior = new Date(Date.UTC(fBaja.getUTCFullYear(), fBaja.getUTCMonth(), 0)).getUTCDate();
      dias += ultimoDiaMesAnterior;
    }
    if (meses < 0) {
      anios--;
      meses += 12;
    }

    return {
      anios: Math.max(0, anios),
      meses: Math.max(0, meses),
      dias: Math.max(0, dias),
      diasTotales,
    };
  }, [entrada.fechaIngreso, entrada.fechaBaja]);

  // Ejecución del motor matemático LFT
  const resultadoCalculo = useMemo(() => {
    return calcularFiniquito(entrada);
  }, [entrada]);

  // Sugerencia inteligente de prima de antigüedad (>=15 años en finiquito, o siempre en liquidación)
  const sugerirPrima = useMemo(() => {
    if (entrada.tipoBaja === 'liquidacion') return true;
    if (antiguedadPreview && antiguedadPreview.anios >= 15) return true;
    return false;
  }, [entrada.tipoBaja, antiguedadPreview]);

  const { activeClient } = useExpediente();

  // Auto-hidratar con datos del cliente/trabajador activo
  useEffect(() => {
    if (activeClient) {
      setEntrada((prev) => ({
        ...prev,
        salarioDiario: activeClient.salario_diario > 0 ? activeClient.salario_diario : prev.salarioDiario,
        sdi: activeClient.salario_diario_integrado > 0 ? activeClient.salario_diario_integrado : prev.sdi,
        fechaIngreso: activeClient.fecha_ingreso || prev.fechaIngreso,
      }));
    }
  }, [activeClient]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* Botón de regreso y encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line bg-surface text-muted transition hover:border-navy hover:text-navy"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                HERRAMIENTA LABORAL · LFT 2026
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <Scale className="w-3 h-3" /> OFICIAL LFT
              </span>
            </div>
            <h1 className="font-playfair text-2xl sm:text-4xl font-black tracking-[-0.02em] text-navy mt-1">
              Calculadora de Finiquitos y Liquidaciones
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-muted font-inter">
          <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
          <span>Vacaciones Dignas 2023 · Tope 2×SMG Art. 486</span>
        </div>
      </div>

      {/* Sincronización con Expediente Único (Sprint 9) */}
      <ExpedienteToolBanner
        toolId="finiquitos"
        titulo={`Cálculo de ${entrada.tipoBaja === 'liquidacion' ? 'Liquidación' : 'Finiquito'} LFT`}
        inputs={entrada as unknown as Record<string, unknown>}
        outputs={resultadoCalculo.ok ? (resultadoCalculo.valor as unknown as Record<string, unknown>) : {}}
        disabled={!resultadoCalculo.ok}
      />

      {/* Grid principal de la herramienta: Entrada + Resultado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna izquierda: Parámetros de Entrada (5 de 12 cols en desktop) */}
        <div className="lg:col-span-5 space-y-6">
          <ParametrosFiniquitoCard
            entrada={entrada}
            onChange={setEntrada}
            antiguedadPreview={antiguedadPreview}
            sugerirPrimaAntiguedad={sugerirPrima}
            errores={resultadoCalculo.ok ? [] : resultadoCalculo.errores}
          />
        </div>

        {/* Columna derecha: Resultados, Métricas y Desglose (7 de 12 cols en desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {resultadoCalculo.ok ? (
            <>
              {/* Card visual de impacto: Cifra total, desglose y exportaciones */}
              <ResultadoFiniquitoCard
                entrada={entrada}
                resultado={resultadoCalculo.valor}
              />

              {/* Card de Antigüedad y parámetros derivados */}
              <AntiguedadCard resultado={resultadoCalculo.valor} />

              {/* Tabla detallada de conceptos, fórmulas y fundamentos */}
              <DesgloseFiniquitoTable resultado={resultadoCalculo.valor} />
            </>
          ) : (
            <div className="rounded-[20px] border border-red-200 bg-red-50/40 p-6 text-center">
              <Info className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-playfair font-bold text-lg text-red-900">
                Parámetros Incompletos o Inválidos
              </h3>
              <p className="font-inter text-sm text-red-700 mt-1">
                Por favor revisa los campos señalados en el formulario para generar el cálculo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalculadoraFiniquitos;

/**
 * ARK LEDGER — Calculadora de Leasing
 * Componente: Tarjeta de Métricas Ejecutivas de Ingresos Recurrentes (MRR / ARR / LTV)
 */

import React from 'react';
import { TrendingUp, Download, Layers, Award } from 'lucide-react';
import { LiquidGlassDome, TextMagnified, BadgeGold, GlassButton } from '@/components/ui';
import { formatearMXN } from '../lib/calcularLeasing';
import type { ResumenLeasing } from '../types';

interface ResultadoLeasingCardProps {
  resumen: ResumenLeasing;
  plazoMeses: number;
  onDescargarExcel: () => void;
}

export const ResultadoLeasingCard: React.FC<ResultadoLeasingCardProps> = ({
  resumen,
  plazoMeses,
  onDescargarExcel,
}) => {
  return (
    <LiquidGlassDome padding="lg" radius="dome" className="w-full">
      <div className="flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/20 text-gold">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-playfair text-xl font-bold text-ink">
                  Potencial Financiero del Modelo
                </h3>
                <BadgeGold size="sm">{plazoMeses} MESES</BadgeGold>
              </div>
              <p className="text-xs text-muted">
                Modelo de activación $500 y retención recurrente $2,500/mes
              </p>
            </div>
          </div>

          <GlassButton
            variant="primary"
            size="md"
            onClick={onDescargarExcel}
            className="shadow-lg shadow-gold/20"
          >
            <Download className="h-4 w-4 stroke-[2.2]" />
            EXPORTAR PROYECCIÓN (CSV)
          </GlassButton>
        </div>

        {/* Cifra Clave: MRR al Mes 12 */}
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/5 bg-surface/60 p-6 md:flex-row md:items-end">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              MRR Final Proyectado (Mes {plazoMeses})
            </span>
            <TextMagnified size="2xl" className="mt-1">
              {formatearMXN(resumen.mrrFinal)}/mes
            </TextMagnified>
            <span className="mt-1 block text-xs text-muted">
              Ingresos mensuales recurrentes de facturación garantizada
            </span>
          </div>

          <div className="text-left md:text-right">
            <span className="block text-[10px] font-bold uppercase text-muted">
              ARR Anualizado Equivalente
            </span>
            <span className="font-mono text-xl font-bold text-gold">
              {formatearMXN(resumen.arrProyectado)}/año
            </span>
            <span className="mt-0.5 block text-[10px] text-muted">
              Con {resumen.clientesFinales} clientes activos
            </span>
          </div>
        </div>

        {/* Matriz de Indicadores Clave SaaS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-surface/40 p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              Clientes al Cierre
            </span>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-xl font-semibold text-ink">
              <Layers className="h-4 w-4 text-gold" />
              {resumen.clientesFinales} activos
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-surface/40 p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              LTV Estimado / Cliente
            </span>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-xl font-semibold text-emerald-400">
              <Award className="h-4 w-4 text-emerald-400" />
              {formatearMXN(resumen.ltvEstimado)}
            </p>
            <span className="mt-0.5 block text-[9px] text-muted">
              Permanencia ~{resumen.mesesRetencionPromedio} meses
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-surface/40 p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              Ingreso Total Período
            </span>
            <p className="mt-1 font-mono text-xl font-semibold text-gold">
              {formatearMXN(resumen.ingresoBrutoTotal)}
            </p>
            <span className="mt-0.5 block text-[9px] text-muted">
              Setup: {formatearMXN(resumen.totalSetupAcumulado)}
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-surface/40 p-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              Utilidad Acumulada
            </span>
            <p className="mt-1 font-mono text-xl font-semibold text-emerald-400">
              {formatearMXN(resumen.utilidadTotalAcumulada)}
            </p>
            <span className="mt-0.5 block text-[9px] text-muted">
              Margen: {resumen.margenPromedioPorcentaje}%
            </span>
          </div>
        </div>
      </div>
    </LiquidGlassDome>
  );
};

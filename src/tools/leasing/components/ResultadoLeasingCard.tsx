/**
 * ARK TOOLS — Calculadora de Leasing
 * Componente: Tarjeta de Métricas Ejecutivas de Ingresos Recurrentes (MRR / ARR / LTV)
 */

import React from 'react';
import {
  TrendingUp,
  Download,
  Layers,
  Award,
} from 'lucide-react';
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface/60 rounded-2xl p-6 border border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              MRR Final Proyectado (Mes {plazoMeses})
            </span>
            <TextMagnified size="2xl" className="mt-1">
              {formatearMXN(resumen.mrrFinal)}/mes
            </TextMagnified>
            <span className="text-xs text-muted block mt-1">
              Ingresos mensuales recurrentes de facturación garantizada
            </span>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase font-bold text-muted block">
              ARR Anualizado Equivalente
            </span>
            <span className="font-mono text-xl font-bold text-gold">
              {formatearMXN(resumen.arrProyectado)}/año
            </span>
            <span className="text-[10px] text-muted block mt-0.5">
              Con {resumen.clientesFinales} clientes activos
            </span>
          </div>
        </div>

        {/* Matriz de Indicadores Clave SaaS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Clientes al Cierre
            </span>
            <p className="mt-1 text-xl font-semibold text-ink font-mono flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-gold" />
              {resumen.clientesFinales} activos
            </p>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              LTV Estimado / Cliente
            </span>
            <p className="mt-1 text-xl font-semibold text-emerald-400 font-mono flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-400" />
              {formatearMXN(resumen.ltvEstimado)}
            </p>
            <span className="text-[9px] text-muted block mt-0.5">
              Permanencia ~{resumen.mesesRetencionPromedio} meses
            </span>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Ingreso Total Período
            </span>
            <p className="mt-1 text-xl font-semibold text-gold font-mono">
              {formatearMXN(resumen.ingresoBrutoTotal)}
            </p>
            <span className="text-[9px] text-muted block mt-0.5">
              Setup: {formatearMXN(resumen.totalSetupAcumulado)}
            </span>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">
              Utilidad Acumulada
            </span>
            <p className="mt-1 text-xl font-semibold text-emerald-400 font-mono">
              {formatearMXN(resumen.utilidadTotalAcumulada)}
            </p>
            <span className="text-[9px] text-muted block mt-0.5">
              Margen: {resumen.margenPromedioPorcentaje}%
            </span>
          </div>
        </div>
      </div>
    </LiquidGlassDome>
  );
};

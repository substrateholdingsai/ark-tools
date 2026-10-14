/**
 * ARK TOOLS — Validador de XMLs CFDI
 * Componente: Tarjeta de Resumen de Auditoría Fiscal
 */

import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
} from 'lucide-react';
import { LiquidGlassDome, TextMagnified, BadgeGold, GlassButton } from '@/components/ui';
import type { ResumenAuditoriaLote } from '../types';

interface ResumenAuditoriaCardProps {
  resumen: ResumenAuditoriaLote;
  onDescargarDictamen: () => void;
  onLimpiar: () => void;
}

export const ResumenAuditoriaCard: React.FC<ResumenAuditoriaCardProps> = ({
  resumen,
  onDescargarDictamen,
  onLimpiar,
}) => {
  return (
    <LiquidGlassDome padding="lg" radius="dome" className="w-full">
      <div className="flex flex-col gap-6">
        {/* Cabecera del Dictamen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-playfair text-xl font-bold text-ink">
                  Dictamen Global de Auditoría
                </h3>
                <BadgeGold size="sm">
                  {resumen.totalAnalizados} CFDI AUDITADOS
                </BadgeGold>
              </div>
              <p className="text-xs text-muted">
                Verificación de Anexo 20 RMF, sellos digitales, estructura y reglas CFF
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onLimpiar}
              title="Limpiar comprobantes"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Limpiar</span>
            </button>
            <GlassButton
              variant="primary"
              size="md"
              onClick={onDescargarDictamen}
              className="shadow-lg shadow-gold/20"
            >
              <Download className="h-4 w-4 stroke-[2.2]" />
              DESCARGAR DICTAMEN (CSV)
            </GlassButton>
          </div>
        </div>

        {/* Cifra Clave: Score Promedio de Cumplimiento */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface/60 rounded-2xl p-6 border border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Índice Promedio de Cumplimiento SAT
            </span>
            <TextMagnified size="2xl" className="mt-1">
              {resumen.promedioScore} / 100
            </TextMagnified>
          </div>

          {/* Semáforo de Comprobantes */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {resumen.aprobados} Aprobados
            </span>
            {resumen.conAdvertencias > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                {resumen.conAdvertencias} Observaciones
              </span>
            )}
            {resumen.rechazados > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-950/40 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300">
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                {resumen.rechazados} No Deducibles / Error
              </span>
            )}
          </div>
        </div>

        {/* Métricas de Inconsistencias */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              Archivos Verificados
            </span>
            <p className="mt-1 text-lg font-semibold text-ink">
              {resumen.totalAnalizados}
            </p>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              Tasa de Éxito
            </span>
            <p className="mt-1 text-lg font-semibold text-emerald-400">
              {resumen.totalAnalizados > 0
                ? `${Math.round((resumen.aprobados / resumen.totalAnalizados) * 100)}%`
                : '0%'}
            </p>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              Errores Críticos
            </span>
            <p className="mt-1 text-lg font-semibold text-red-400">
              {resumen.totalErrores}
            </p>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              Advertencias Normativas
            </span>
            <p className="mt-1 text-lg font-semibold text-amber-400">
              {resumen.totalAdvertencias}
            </p>
          </div>
        </div>
      </div>
    </LiquidGlassDome>
  );
};

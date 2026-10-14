/**
 * ARK TOOLS — Conversor XML a Excel
 * Componente: Tarjeta de Resumen Consolidado con el Design System ARK
 */

import React from 'react';
import {
  Receipt,
  Download,
  Trash2,
} from 'lucide-react';
import { LiquidGlassDome, TextMagnified, BadgeGold, GlassButton } from '@/components/ui';
import { formatearMXN } from '../lib/parserCFDI';
import type { ResumenLoteXML } from '../types';

interface ResumenLoteCardProps {
  resumen: ResumenLoteXML;
  onDescargarExcel: () => void;
  onLimpiar: () => void;
}

export const ResumenLoteCard: React.FC<ResumenLoteCardProps> = ({
  resumen,
  onDescargarExcel,
  onLimpiar,
}) => {
  return (
    <LiquidGlassDome padding="lg" radius="dome" className="w-full">
      <div className="flex flex-col gap-6">
        {/* Cabecera del Resumen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-playfair text-xl font-bold text-ink">
                  Consolidado del Lote
                </h3>
                <BadgeGold size="sm">
                  {resumen.totalValidos} / {resumen.totalArchivos} CFDI
                </BadgeGold>
              </div>
              <p className="text-xs text-muted">
                {resumen.totalConError > 0
                  ? `${resumen.totalConError} archivo(s) con inconsistencias o sin comprobante`
                  : 'Todos los comprobantes leídos satisfactoriamente'}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onLimpiar}
              title="Limpiar comprobantes cargados"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Limpiar</span>
            </button>
            <GlassButton
              variant="primary"
              size="md"
              onClick={onDescargarExcel}
              className="shadow-lg shadow-gold/20"
            >
              <Download className="h-4 w-4 stroke-[2.2]" />
              DESCARGAR EXCEL (CSV)
            </GlassButton>
          </div>
        </div>

        {/* Cifra Clave: Total Consolidado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface/60 rounded-2xl p-6 border border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Gran Total Facturado (IVA e Impuestos incluidos)
            </span>
            <TextMagnified size="2xl" className="mt-1">
              {formatearMXN(resumen.sumaTotal)}
            </TextMagnified>
          </div>

          {/* Desglose de Comprobantes por tipo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {resumen.conteoIngresos} Ingreso
            </span>
            {resumen.conteoEgresos > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {resumen.conteoEgresos} Egreso
              </span>
            )}
            {resumen.conteoNomina > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-950/40 border border-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-300">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                {resumen.conteoNomina} Nómina
              </span>
            )}
            {resumen.conteoOtros > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-300">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                {resumen.conteoOtros} Pago/Otro
              </span>
            )}
          </div>
        </div>

        {/* Matriz de Importes Detallados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              Subtotal
            </span>
            <p className="mt-1 text-lg font-semibold text-ink">
              {formatearMXN(resumen.sumaSubtotal)}
            </p>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              Descuentos
            </span>
            <p className="mt-1 text-lg font-semibold text-ink">
              {formatearMXN(resumen.sumaDescuento)}
            </p>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              IVA 16% Trasladado
            </span>
            <p className="mt-1 text-lg font-semibold text-gold">
              {formatearMXN(resumen.sumaIVA16)}
            </p>
          </div>

          <div className="rounded-xl bg-surface/40 p-4 border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
              Retenciones (ISR / IVA)
            </span>
            <p className="mt-1 text-lg font-semibold text-red-300">
              {formatearMXN(resumen.sumaImpuestosRetenidos)}
            </p>
          </div>
        </div>
      </div>
    </LiquidGlassDome>
  );
};

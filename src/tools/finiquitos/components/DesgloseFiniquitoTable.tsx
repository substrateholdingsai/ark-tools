/**
 * ARK TOOLS — Desglose de Conceptos del Finiquito/Liquidación
 * Sprint 8 — Componente #3
 *
 * Tabla tabular con los 6 conceptos del motor.
 * NO calcula — solo presenta ResultadoFiniquito.desglose.
 *
 * Fundamento: LFT Arts. 50, 76, 79, 80, 87, 162, 486.
 */

import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import type { DesgloseConcepto, ResultadoFiniquito } from '../types';

interface Props {
  resultado: ResultadoFiniquito;
}

export function DesgloseConceptosTable({ resultado }: Props) {
  const { desglose, totalFiniquito, totalLiquidacion } = resultado;
  const esLiquidacion = totalLiquidacion > totalFiniquito;
  const totalMostrado = esLiquidacion ? totalLiquidacion : totalFiniquito;

  return (
    <div className="rounded-[20px] border border-line bg-surface p-6 shadow-[0_20px_40px_rgba(0,43,127,0.06)] sm:p-8">
      {/* === Encabezado === */}
      <div className="mb-6">
        <h2 className="font-playfair text-2xl font-black tracking-[-0.02em] text-ink sm:text-3xl">
          Desglose de Conceptos
        </h2>
        <p className="mt-1 font-inter text-sm text-muted">
          {desglose.length} conceptos calculados conforme a la Ley Federal del Trabajo.
        </p>
      </div>

      {/* ═══ Versión Desktop: tabla ═══ */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              <Th align="left" className="w-[22%]">
                Concepto
              </Th>
              <Th align="left" className="w-[34%]">
                Fórmula
              </Th>
              <Th align="right" className="w-[8%]">
                Días
              </Th>
              <Th align="left" className="w-[18%]">
                Fundamento
              </Th>
              <Th align="right" className="w-[18%]">
                Importe
              </Th>
            </tr>
          </thead>
          <tbody>
            {desglose.map((concepto, idx) => (
              <FilaConcepto key={idx} concepto={concepto} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy/30">
              <td colSpan={4} className="py-4 pr-4 text-right">
                <span className="font-inter text-[12px] font-bold uppercase tracking-[0.16em] text-muted">
                  {esLiquidacion ? 'Total Liquidación' : 'Total Finiquito'}
                </span>
              </td>
              <td className="py-4 text-right">
                <span className="font-orbitron text-lg font-bold tabular-nums text-ink">
                  $
                  {totalMostrado.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ═══ Versión Mobile: cards apiladas ═══ */}
      <div className="flex flex-col gap-3 md:hidden">
        {desglose.map((concepto, idx) => (
          <FilaConceptoMobile key={idx} concepto={concepto} />
        ))}

        <div className="mt-2 rounded-[14px] border-2 border-navy/30 bg-surface-2 p-4">
          <div className="mb-1 font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            {esLiquidacion ? 'Total Liquidación' : 'Total Finiquito'}
          </div>
          <div className="font-orbitron text-xl font-bold tabular-nums text-ink">
            $
            {totalMostrado.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Alias para compatibilidad de importación */
export const DesgloseFiniquitoTable = DesgloseConceptosTable;

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES: DESKTOP
   ═══════════════════════════════════════════════════════════════ */

interface ThProps {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

function Th({ children, align = 'left', className }: ThProps) {
  return (
    <th
      className={cn(
        'pb-3 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-muted',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className
      )}
    >
      {children}
    </th>
  );
}

interface FilaConceptoProps {
  concepto: DesgloseConcepto;
}

function FilaConcepto({ concepto }: FilaConceptoProps) {
  const {
    concepto: nombre,
    formula,
    dias,
    importe,
    fundamento,
    esLiquidacion,
    deshabilitado,
  } = concepto;

  return (
    <tr
      className={cn(
        'border-b border-line/60 transition-colors',
        !deshabilitado && 'hover:bg-surface-2/50',
        deshabilitado && 'opacity-50'
      )}
    >
      {/* Concepto — con borde izquierdo navy si es liquidación */}
      <td className="py-4 pr-4 align-top">
        <div className="flex items-start gap-3">
          {esLiquidacion && !deshabilitado && (
            <span className="mt-1.5 h-4 w-1 shrink-0 rounded-full bg-navy" aria-hidden />
          )}
          <span
            className={cn(
              'font-inter text-sm font-bold leading-snug text-ink',
              deshabilitado && 'line-through decoration-muted/40'
            )}
          >
            {nombre}
          </span>
        </div>
      </td>

      {/* Fórmula */}
      <td className="py-4 pr-4 align-top">
        <span className="font-inter text-[12px] leading-snug text-muted">{formula}</span>
      </td>

      {/* Días */}
      <td className="py-4 pr-4 text-right align-top">
        {dias !== undefined && dias > 0 ? (
          <span className="font-orbitron text-sm font-bold tabular-nums text-ink">
            {dias.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="font-inter text-[12px] text-muted">—</span>
        )}
      </td>

      {/* Fundamento */}
      <td className="py-4 pr-4 align-top">
        <span
          className={cn(
            'inline-block rounded-[6px] px-2 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.12em]',
            deshabilitado ? 'bg-surface-2 text-muted' : 'bg-navy/[0.06] text-navy'
          )}
        >
          {fundamento}
        </span>
      </td>

      {/* Importe */}
      <td className="py-4 text-right align-top">
        {deshabilitado || importe === 0 ? (
          <span className="font-inter text-[12px] text-muted">—</span>
        ) : (
          <span className="font-orbitron text-sm font-bold tabular-nums text-ink">
            $
            {importe.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        )}
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES: MOBILE
   ═══════════════════════════════════════════════════════════════ */

function FilaConceptoMobile({ concepto }: FilaConceptoProps) {
  const {
    concepto: nombre,
    formula,
    dias,
    importe,
    fundamento,
    esLiquidacion,
    deshabilitado,
  } = concepto;

  return (
    <div
      className={cn(
        'rounded-[14px] border border-line bg-surface-2 p-4',
        esLiquidacion && !deshabilitado && 'border-l-4 border-l-navy',
        deshabilitado && 'opacity-50'
      )}
    >
      {/* Encabezado: concepto + importe */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex-1 font-inter text-sm font-bold leading-snug text-ink',
            deshabilitado && 'line-through decoration-muted/40'
          )}
        >
          {nombre}
        </span>
        {!deshabilitado && importe > 0 && (
          <span className="shrink-0 font-orbitron text-sm font-bold tabular-nums text-ink">
            $
            {importe.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        )}
      </div>

      {/* Fórmula */}
      <p className="mb-3 font-inter text-[12px] leading-snug text-muted">{formula}</p>

      {/* Metadatos: días + fundamento */}
      <div className="flex flex-wrap items-center gap-2">
        {dias !== undefined && dias > 0 && (
          <span className="rounded-[6px] bg-surface px-2 py-1 font-orbitron text-[11px] font-bold tabular-nums text-ink">
            {dias.toLocaleString('es-MX', { maximumFractionDigits: 2 })} días
          </span>
        )}
        <span
          className={cn(
            'rounded-[6px] px-2 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.12em]',
            deshabilitado ? 'bg-surface text-muted' : 'bg-navy/[0.06] text-navy'
          )}
        >
          {fundamento}
        </span>
      </div>
    </div>
  );
}

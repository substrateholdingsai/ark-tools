/**
 * PasoGuiaCard
 *
 * Card interactiva para cada paso de la guía.
 * Incluye checklist con progreso.
 */

import { useCallback } from 'react';
import { Check, Square } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getIconoGuia } from '../iconos';
import type { PasoGuia } from '../types';

interface PasoGuiaCardProps {
  paso: PasoGuia;
  completedItems: Set<number>;
  onToggle: (pasoId: number, itemIndex: number) => void;
}

export function PasoGuiaCard({ paso, completedItems, onToggle }: PasoGuiaCardProps) {
  const totalItems = paso.checklist.length;
  const completedCount = paso.checklist.filter((_: string, i: number) =>
    completedItems.has(i)
  ).length;
  const isComplete = completedCount === totalItems && totalItems > 0;

  const handleToggle = useCallback(
    (index: number) => {
      onToggle(paso.id, index);
    },
    [paso.id, onToggle]
  );

  const Icono = getIconoGuia(paso.icono);

  return (
    <div
      className={cn(
        'rounded-[16px] border bg-surface p-6 transition-all',
        isComplete ? 'border-emerald-300 bg-emerald-50/30' : 'border-line hover:border-gold/50'
      )}
    >
      <div className="mb-4 flex items-start gap-4">
        <div
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-full',
            isComplete ? 'bg-emerald-500 text-white' : 'bg-gold/10 text-gold-dark'
          )}
        >
          {isComplete ? (
            <Check size={22} strokeWidth={2.5} />
          ) : (
            <Icono size={22} strokeWidth={1.75} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-gold-dark">
              Paso {paso.id}
            </span>
            <span className="font-inter text-[10px] text-muted">{paso.corto}</span>
          </div>
          <h3 className="font-playfair text-[22px] font-black leading-[1.2] text-ink">
            {paso.titulo}
          </h3>
        </div>
      </div>

      <p className="mb-4 font-inter text-[14px] leading-[1.6] text-muted">{paso.descripcion}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {paso.canales.map((canal: string, i: number) => (
          <span
            key={i}
            className="rounded-full bg-surface-2 px-2 py-0.5 font-inter text-[10px] font-medium text-muted"
          >
            {canal}
          </span>
        ))}
      </div>

      <div className="mb-4 space-y-2">
        {paso.checklist.map((item: string, index: number) => {
          const checked = completedItems.has(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleToggle(index)}
              className={cn(
                'flex w-full items-start gap-3 text-left',
                'rounded-[10px] px-3 py-2 transition-colors',
                checked ? 'bg-emerald-50' : 'hover:bg-surface-2'
              )}
            >
              <span className="mt-0.5 shrink-0">
                {checked ? (
                  <Check size={18} strokeWidth={2.5} className="text-emerald-500" />
                ) : (
                  <Square size={18} strokeWidth={1.5} className="text-muted" />
                )}
              </span>
              <span
                className={cn(
                  'font-inter text-[13px] leading-[1.5]',
                  checked ? 'text-emerald-700 line-through' : 'text-ink'
                )}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${totalItems > 0 ? (completedCount / totalItems) * 100 : 0}%` }}
          />
        </div>
        <span className="font-orbitron text-[11px] font-bold text-muted">
          {completedCount}/{totalItems}
        </span>
      </div>

      <div className="mb-3 rounded-[10px] border border-gold/20 bg-gold/5 p-3">
        <div className="mb-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark">
          Tip
        </div>
        <p className="font-inter text-[12px] leading-[1.5] text-ink">{paso.tip}</p>
      </div>

      <div className="font-inter text-[11px] text-muted">
        <span className="font-bold">Fundamento:</span> {paso.fundamento}
      </div>
    </div>
  );
}

export default PasoGuiaCard;

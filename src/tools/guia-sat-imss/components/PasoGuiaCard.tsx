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
  const completedCount = paso.checklist.filter((_: string, i: number) => completedItems.has(i)).length;
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
        isComplete
          ? 'border-emerald-300 bg-emerald-50/30'
          : 'border-line hover:border-gold/50'
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={cn(
            'shrink-0 w-12 h-12 rounded-full grid place-items-center',
            isComplete
              ? 'bg-emerald-500 text-white'
              : 'bg-gold/10 text-gold-dark'
          )}
        >
          {isComplete ? (
            <Check size={22} strokeWidth={2.5} />
          ) : (
            <Icono size={22} strokeWidth={1.75} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-gold-dark font-orbitron">
              Paso {paso.id}
            </span>
            <span className="text-[10px] text-muted font-inter">
              {paso.corto}
            </span>
          </div>
          <h3 className="font-playfair font-black text-[22px] leading-[1.2] text-ink">
            {paso.titulo}
          </h3>
        </div>
      </div>

      <p className="text-[14px] leading-[1.6] text-muted mb-4 font-inter">
        {paso.descripcion}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {paso.canales.map((canal: string, i: number) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full bg-surface-2 text-[10px] font-medium text-muted font-inter"
          >
            {canal}
          </span>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        {paso.checklist.map((item: string, index: number) => {
          const checked = completedItems.has(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleToggle(index)}
              className={cn(
                'w-full flex items-start gap-3 text-left',
                'px-3 py-2 rounded-[10px] transition-colors',
                checked
                  ? 'bg-emerald-50'
                  : 'hover:bg-surface-2'
              )}
            >
              <span className="shrink-0 mt-0.5">
                {checked ? (
                  <Check size={18} strokeWidth={2.5} className="text-emerald-500" />
                ) : (
                  <Square size={18} strokeWidth={1.5} className="text-muted" />
                )}
              </span>
              <span
                className={cn(
                  'text-[13px] leading-[1.5] font-inter',
                  checked ? 'text-emerald-700 line-through' : 'text-ink'
                )}
              >
                {item}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${totalItems > 0 ? (completedCount / totalItems) * 100 : 0}%` }}
          />
        </div>
        <span className="text-[11px] font-bold font-orbitron text-muted">
          {completedCount}/{totalItems}
        </span>
      </div>

      <div className="mb-3 p-3 rounded-[10px] bg-gold/5 border border-gold/20">
        <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-gold-dark font-orbitron mb-1">
          Tip
        </div>
        <p className="text-[12px] leading-[1.5] text-ink font-inter">
          {paso.tip}
        </p>
      </div>

      <div className="text-[11px] text-muted font-inter">
        <span className="font-bold">Fundamento:</span> {paso.fundamento}
      </div>
    </div>
  );
}

export default PasoGuiaCard;
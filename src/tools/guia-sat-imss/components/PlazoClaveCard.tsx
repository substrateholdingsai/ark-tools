/**
 * PlazoClaveCard
 *
 * Card para mostrar un plazo legal clave.
 */

import { memo } from 'react';
import { cn } from '@/lib/cn';
import type { PlazoClave, Autoridad } from '../types';

const autoridadLabel: Record<Autoridad, string> = {
  SAT: 'SAT',
  IMSS: 'IMSS',
};

interface PlazoClaveCardProps {
  plazo: PlazoClave;
}

export const PlazoClaveCard = memo(function PlazoClaveCard({ plazo }: PlazoClaveCardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] border p-5',
        plazo.destacado
          ? 'border-gold bg-gold/5'
          : 'border-line bg-surface'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-navy font-orbitron">
            {autoridadLabel[plazo.autoridad]}
          </span>
          <h3 className="font-playfair font-black text-[18px] leading-[1.2] text-ink mt-1">
            {plazo.concepto}
          </h3>
        </div>
        {plazo.destacado && (
          <span className="shrink-0 px-2 py-1 rounded-full bg-gold text-navy-dark text-[9px] font-bold tracking-[0.1em] uppercase font-orbitron">
            ★ Destacado
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="font-playfair font-black text-[40px] leading-none text-navy">
          {plazo.prefijo || ''}{plazo.cantidad}
        </span>
        <span className="text-[13px] font-bold text-muted font-orbitron uppercase tracking-[0.08em]">
          {plazo.unidad}
        </span>
      </div>

      <div className="text-[11px] text-muted font-inter">
        <span className="font-bold">Fundamento:</span> {plazo.fundamento}
      </div>
    </div>
  );
});

export default PlazoClaveCard;
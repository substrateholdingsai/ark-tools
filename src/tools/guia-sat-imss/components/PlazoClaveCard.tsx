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
        plazo.destacado ? 'border-gold bg-gold/5' : 'border-line bg-surface'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-navy">
            {autoridadLabel[plazo.autoridad]}
          </span>
          <h3 className="mt-1 font-playfair text-[18px] font-black leading-[1.2] text-ink">
            {plazo.concepto}
          </h3>
        </div>
        {plazo.destacado && (
          <span className="shrink-0 rounded-full bg-gold px-2 py-1 font-orbitron text-[9px] font-bold uppercase tracking-[0.1em] text-navy-dark">
            ★ Destacado
          </span>
        )}
      </div>

      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-playfair text-[40px] font-black leading-none text-navy">
          {plazo.prefijo || ''}
          {plazo.cantidad}
        </span>
        <span className="font-orbitron text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
          {plazo.unidad}
        </span>
      </div>

      <div className="font-inter text-[11px] text-muted">
        <span className="font-bold">Fundamento:</span> {plazo.fundamento}
      </div>
    </div>
  );
});

export default PlazoClaveCard;

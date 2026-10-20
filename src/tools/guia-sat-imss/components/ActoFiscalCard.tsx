/**
 * ActoFiscalCard
 *
 * Card para mostrar un acto fiscal (SAT o IMSS).
 */

import { memo } from 'react';
import { cn } from '@/lib/cn';
import { getIconoGuia } from '../iconos';
import type { ActoFiscal, RiesgoActo } from '../types';

const riesgoConfig: Record<RiesgoActo, { label: string; classes: string }> = {
  Bajo: { label: 'BAJO', classes: 'bg-emerald-100 text-emerald-700' },
  Medio: { label: 'MEDIO', classes: 'bg-amber-100 text-amber-700' },
  Alto: { label: 'ALTO', classes: 'bg-orange-100 text-orange-700' },
  Crítico: { label: 'CRÍTICO', classes: 'bg-rose-100 text-rose-700' },
};

interface ActoFiscalCardProps {
  acto: ActoFiscal;
}

export const ActoFiscalCard = memo(function ActoFiscalCard({ acto }: ActoFiscalCardProps) {
  const config = riesgoConfig[acto.riesgo] ?? {
    label: 'SIN RIESGO',
    classes: 'bg-surface-2 text-muted',
  };
  const Icono = getIconoGuia(acto.icono);

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5 transition-colors hover:border-navy/30">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-line bg-surface-2 text-navy">
          <Icono size={20} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
              {acto.codigo}
            </span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]',
                config.classes
              )}
            >
              {config.label}
            </span>
          </div>
          <h3 className="font-playfair text-[18px] font-black leading-[1.2] text-ink">
            {acto.titulo}
          </h3>
        </div>
      </div>

      <p className="mb-3 font-inter text-[13px] leading-[1.5] text-muted">{acto.descripcion}</p>

      <div className="mb-3 rounded-[8px] bg-navy/5 p-2.5">
        <div className="mb-0.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.1em] text-navy">
          Acción recomendada
        </div>
        <p className="font-inter text-[12px] leading-[1.4] text-ink">{acto.accion}</p>
      </div>

      <div className="font-inter text-[11px] text-muted">
        <span className="font-bold">Fundamento:</span> {acto.fundamento}
      </div>
    </div>
  );
});

export default ActoFiscalCard;

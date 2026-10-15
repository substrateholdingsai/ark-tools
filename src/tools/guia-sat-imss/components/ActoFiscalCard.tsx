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
  const config = riesgoConfig[acto.riesgo] ?? { label: 'SIN RIESGO', classes: 'bg-surface-2 text-muted' };
  const Icono = getIconoGuia(acto.icono);

  return (
    <div className="rounded-[16px] border border-line bg-surface p-5 hover:border-navy/30 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="shrink-0 w-10 h-10 rounded-[10px] bg-surface-2 border border-line grid place-items-center text-navy">
          <Icono size={20} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted font-orbitron">
              {acto.codigo}
            </span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.08em] uppercase',
                config.classes
              )}
            >
              {config.label}
            </span>
          </div>
          <h3 className="font-playfair font-black text-[18px] leading-[1.2] text-ink">
            {acto.titulo}
          </h3>
        </div>
      </div>

      <p className="text-[13px] leading-[1.5] text-muted mb-3 font-inter">
        {acto.descripcion}
      </p>

      <div className="mb-3 p-2.5 rounded-[8px] bg-navy/5">
        <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-navy font-orbitron mb-0.5">
          Acción recomendada
        </div>
        <p className="text-[12px] leading-[1.4] text-ink font-inter">
          {acto.accion}
        </p>
      </div>

      <div className="text-[11px] text-muted font-inter">
        <span className="font-bold">Fundamento:</span> {acto.fundamento}
      </div>
    </div>
  );
});

export default ActoFiscalCard;
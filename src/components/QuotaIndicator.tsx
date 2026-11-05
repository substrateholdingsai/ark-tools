/**
 * ARK LEDGER — QuotaIndicator
 *
 * Indicador visual de cuota de consultas Noah AI.
 * Aparece SOLO dentro del chat de Noah (AiAssistantWidget).
 * Barra X / 10 consultas, ámbar a partir de 7/10, rojo al agotar.
 */

import { Crown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface QuotaIndicatorProps {
  used: number;
  limit: number;
  isPro: boolean;
  className?: string;
}

export function QuotaIndicator({ used, limit, isPro, className }: QuotaIndicatorProps) {
  if (isPro) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold">
          <Crown className="h-3 w-3 text-gold" />
          PRO
        </span>
        <span className="text-[10px] text-white/60">Consultas ilimitadas</span>
      </div>
    );
  }

  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isWarning = used >= 7 && used < limit;
  const isExceeded = used >= limit;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-white/70">
          {isExceeded && <AlertCircle className="h-3 w-3 text-rose-400" />}
          <span
            className={cn(
              'font-medium',
              isExceeded ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-white/70'
            )}
          >
            {used}/{limit} consultas gratis
          </span>
        </span>
        <span className="text-white/50">
          {limit - used > 0 ? `${limit - used} restantes` : 'Agotadas'}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

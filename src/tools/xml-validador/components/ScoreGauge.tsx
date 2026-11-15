/**
 * ARK LEDGER — Validador de XMLs CFDI
 * Componente: ScoreGauge — Visualizador de puntaje interno
 */

import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md', showLabel = true }) => {
  const getColor = (val: number) => {
    if (val >= 90)
      return { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' };
    if (val >= 70)
      return { text: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10' };
    return { text: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-500/10' };
  };

  const colors = getColor(score);

  const dimensionClasses = {
    sm: 'h-10 w-10 text-xs',
    md: 'h-14 w-14 text-base font-bold',
    lg: 'h-20 w-20 text-2xl font-black',
  };

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={`flex items-center justify-center rounded-full border-2 font-mono ${colors.bg} ${colors.border} ${colors.text} ${dimensionClasses[size]} shadow-inner`}
      >
        <span>{score}%</span>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
            Evaluación interna
          </span>
          <span className={`text-xs font-semibold ${colors.text}`}>
            {score >= 90 ? 'Score alto' : score >= 70 ? 'Con observaciones' : 'Revisar resultado'}
          </span>
        </div>
      )}
    </div>
  );
};

// src/tools/auditor-cobranza/components/ComparadorCard.tsx

import type { EstadoDictamen } from '../types';
import { ESTADOS_DICTAMEN } from '../types';

interface ComparadorCardProps {
  id: string;
  codigo?: string;
  campo: string;
  pregunta: string;
  riesgo: string;
  fundamento?: string;
  impactoContable?: string;
  recomendacion?: string;
  estado: EstadoDictamen;
  nota?: string;
  onEstadoChange: (estado: EstadoDictamen) => void;
  onNotaChange: (nota: string) => void;
}

const ESTADO_LABELS: Record<string, string> = {
  COINCIDE: 'Coincide',
  DIFIERE: 'Difiere',
  PARCIAL: 'Parcial',
  NO_VERIFICABLE: 'No verificable',
  SIN_DATO: 'Sin dato',
};

const ESTADO_COLORS: Record<string, string> = {
  COINCIDE: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  DIFIERE: 'bg-red-50 border-red-200 text-red-700',
  PARCIAL: 'bg-amber-50 border-amber-200 text-amber-700',
  NO_VERIFICABLE: 'bg-orange-50 border-orange-200 text-orange-700',
  SIN_DATO: 'bg-[var(--cream)] border-[var(--line)] text-[var(--muted)]',
};

const ESTADO_ACTIVE: Record<string, string> = {
  COINCIDE: 'bg-emerald-500 border-emerald-600 text-white',
  DIFIERE: 'bg-red-500 border-red-600 text-white',
  PARCIAL: 'bg-amber-500 border-amber-600 text-white',
  NO_VERIFICABLE: 'bg-orange-50 border-orange-600 text-white',
  SIN_DATO: 'bg-[var(--muted)] border-[var(--muted)] text-white',
};

function obtenerColorRiesgo(riesgo: string): string {
  switch (riesgo) {
    case 'CRITICO':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'ALTO':
      return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'MEDIO':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'BAJO':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    default:
      return 'bg-[var(--cream)] border-[var(--line)] text-[var(--muted)]';
  }
}

export function ComparadorCard({
  id,
  codigo,
  campo,
  pregunta,
  riesgo,
  fundamento,
  impactoContable,
  recomendacion,
  estado,
  nota,
  onEstadoChange,
  onNotaChange,
}: ComparadorCardProps) {
  return (
    <div
      data-comparador-id={id}
      className="rounded-[20px] border border-[var(--line)] bg-white p-5 transition-all hover:shadow-[0_8px_24px_rgba(0,43,127,0.06)]"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {codigo && (
            <span className="mb-2 inline-block rounded-full border border-[var(--line)] bg-white px-2 py-0.5 font-orbitron text-[9px] tracking-widest">
              {codigo}
            </span>
          )}
          <h3 className="font-inter text-[13px] font-bold leading-tight text-[var(--ink)]">
            {campo}
          </h3>
          <p className="mt-1 font-inter text-[11px] leading-[1.4] text-[var(--muted)]">
            {pregunta}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-1 font-inter text-[10px] font-bold ${obtenerColorRiesgo(riesgo)}`}
        >
          {riesgo}
        </span>
      </div>

      {/* Pills de estado */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {ESTADOS_DICTAMEN.map((est) => (
          <button
            key={est}
            type="button"
            onClick={() => onEstadoChange(est)}
            className={`rounded-full border px-3 py-1.5 font-inter text-[11px] font-bold tracking-wide transition-all ${
              estado === est ? ESTADO_ACTIVE[est] : ESTADO_COLORS[est]
            }`}
          >
            {ESTADO_LABELS[est]}
          </button>
        ))}
      </div>

      {/* Nota */}
      <div className="mb-3">
        <textarea
          value={nota ?? ''}
          onChange={(e) => onNotaChange(e.target.value)}
          placeholder="Nota del auditor..."
          rows={2}
          className="focus:ring-[var(--navy)]/20 w-full resize-none rounded-[12px] border border-[var(--line)] bg-[var(--cream)] px-3 py-2 font-inter text-[12px] text-[var(--ink)] outline-none transition focus:border-[var(--navy)] focus:ring-2"
        />
      </div>

      {/* Info adicional */}
      <div className="space-y-1.5">
        {fundamento && (
          <p className="font-inter text-[10px] text-[var(--muted)]">
            <span className="font-bold">Fundamento:</span> {fundamento}
          </p>
        )}
        {impactoContable && (
          <p className="font-inter text-[10px] text-[var(--muted)]">
            <span className="font-bold">Impacto:</span> {impactoContable}
          </p>
        )}
        {recomendacion && (
          <p className="font-inter text-[10px] text-[var(--muted)]">
            <span className="font-bold">Rec.:</span> {recomendacion}
          </p>
        )}
      </div>
    </div>
  );
}

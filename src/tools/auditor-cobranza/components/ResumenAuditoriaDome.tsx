// src/tools/auditor-cobranza/components/ResumenAuditoriaDome.tsx

import { LiquidGlassDome, BadgeGold, TextMagnified } from '@/components/ui';
import type { ResumenDictamen } from '../types';

interface ResumenAuditoriaDomeProps {
  resumen: ResumenDictamen;
  cliente?: string;
  revisor?: string;
}

function obtenerColorNivel(nivel: string): string {
  switch (nivel) {
    case 'CRITICO':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'ALTO':
      return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'MEDIO':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'BAJO':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'SIN_HALLAZGOS':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'SIN_EVALUAR':
    default:
      return 'bg-[var(--cream)] border-[var(--line)] text-[var(--muted)]';
  }
}

function obtenerTextoNivel(nivel: string): string {
  switch (nivel) {
    case 'CRITICO': return 'CRÍTICO';
    case 'ALTO': return 'ALTO';
    case 'MEDIO': return 'MEDIO';
    case 'BAJO': return 'BAJO';
    case 'SIN_HALLAZGOS': return 'SIN HALLAZGOS';
    case 'SIN_EVALUAR': return 'SIN EVALUAR';
    default: return nivel;
  }
}

export function ResumenAuditoriaDome({ resumen, cliente, revisor }: ResumenAuditoriaDomeProps) {
  return (
    <LiquidGlassDome className="p-6 sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="font-orbitron text-[11px] tracking-[0.2em] text-[var(--muted)]">
            RESUMEN EJECUTIVO
          </p>
          {cliente && (
            <p className="font-inter text-[13px] font-semibold text-[var(--ink)] mt-1">
              {cliente}
            </p>
          )}
          {revisor && (
            <p className="font-inter text-[11px] text-[var(--muted)] mt-0.5">
              Revisor: {revisor}
            </p>
          )}
        </div>
        <BadgeGold>
          ARK AUDIT
        </BadgeGold>
      </div>

      {/* Score + Nivel */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <TextMagnified className="text-[36px] sm:text-[42px]">
            {resumen.score}
          </TextMagnified>
          <p className="font-inter text-[10px] tracking-[0.16em] text-[var(--muted)] mt-1">
            SCORE /100
          </p>
        </div>

        <div className="text-center border-l border-[var(--line)] pl-4">
          <p className="font-playfair text-[28px] font-black leading-none text-[var(--navy)]">
            {resumen.hallazgos}
          </p>
          <p className="font-inter text-[10px] tracking-[0.16em] text-[var(--muted)] mt-1">
            HALLAZGOS
          </p>
        </div>

        <div className="text-center border-l border-[var(--line)] pl-4">
          <p className="font-playfair text-[28px] font-black leading-none text-[var(--ink)]">
            {resumen.observaciones}
          </p>
          <p className="font-inter text-[10px] tracking-[0.16em] text-[var(--muted)] mt-1">
            OBSERVACIONES
          </p>
        </div>
      </div>

      {/* Nivel de riesgo */}
      <div className="flex items-center justify-center mb-5">
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-inter text-[12px] font-bold tracking-[0.1em] ${obtenerColorNivel(resumen.nivel)}`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          {obtenerTextoNivel(resumen.nivel)}
        </span>
      </div>

      {/* Desglose por riesgo */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'CRIT', value: resumen.criticos, color: 'text-red-700 bg-red-50' },
          { label: 'ALTO', value: resumen.altos, color: 'text-orange-700 bg-orange-50' },
          { label: 'MED', value: resumen.medios, color: 'text-amber-700 bg-amber-50' },
          { label: 'BAJO', value: resumen.bajos, color: 'text-emerald-700 bg-emerald-50' },
        ].map((item) => (
          <div
            key={item.label}
            className={`rounded-[12px] px-3 py-2 text-center ${item.color}`}
          >
            <p className="font-playfair text-[18px] font-black leading-none">
              {item.value}
            </p>
            <p className="font-inter text-[9px] tracking-widest mt-0.5">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* Puntos */}
      <div className="mt-5 flex items-center justify-between rounded-[12px] bg-[var(--navy)] px-4 py-3">
        <span className="font-inter text-[12px] font-semibold text-white/70">
          Puntos de riesgo
        </span>
        <span className="font-orbitron text-[14px] font-bold text-white">
          {resumen.puntosRiesgo} / {resumen.puntosMaximos}
        </span>
      </div>
    </LiquidGlassDome>
  );
}

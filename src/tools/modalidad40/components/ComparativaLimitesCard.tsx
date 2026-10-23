import { AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import type { LimitesModalidad40 } from '../types';

interface Props {
  limites: LimitesModalidad40;
  ultimoSbc: number;
  sbcDeseado: number;
}

export function ComparativaLimitesCard({ limites, ultimoSbc, sbcDeseado }: Props) {
  const { umaDiaria, topeHistorico25Umas, limitePermitidoDof2026, sbcEfectivo, excedeLimiteDof } =
    limites;

  return (
    <div className="space-y-4 rounded-[24px] border border-line bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            AUDITORÍA DE CRITERIO NORMATIVO
          </span>
          <h2 className="mt-0.5 font-playfair text-xl font-black text-navy">
            Cotejo vs. Acuerdo DOF 21/10/2026
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            excedeLimiteDof
              ? 'border border-amber-300 bg-amber-100 text-amber-800'
              : 'border border-emerald-300 bg-emerald-100 text-emerald-800'
          }`}
        >
          {excedeLimiteDof ? (
            <>
              <AlertTriangle size={14} /> Límite Excedido
            </>
          ) : (
            <>
              <CheckCircle2 size={14} /> Salario Conforme
            </>
          )}
        </span>
      </div>

      {/* Banner Explicativo del Acuerdo */}
      {excedeLimiteDof && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
            <div>
              <strong className="font-bold">
                Aviso Restrictivo — Acuerdo ACDO.AS2.HCT.101026/302.P.DG:
              </strong>{' '}
              El salario que solicitaste (${sbcDeseado.toFixed(2)} MXN) no es admitido por el IMSS.
              Conforme al nuevo acuerdo publicado el 21 de octubre de 2026, tu cotización máxima en
              Modalidad 40 queda acotada a tu último SBC registrado (${ultimoSbc.toFixed(2)}) más 1
              UMA diaria (${umaDiaria.toFixed(2)}), fijando tu techo legal en{' '}
              <span className="font-mono font-bold underline">
                ${limitePermitidoDof2026.toFixed(2)} MXN/día
              </span>
              .
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas Comparativas de 3 Columnas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Col 1: Último SBC */}
        <div className="rounded-xl border border-line bg-surface-2 p-3.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
            1. Salario Base Previo
          </span>
          <div className="mt-1 font-mono text-lg font-black text-navy">
            ${ultimoSbc.toFixed(2)} <span className="text-xs font-normal text-muted">MXN/día</span>
          </div>
          <span className="mt-1 block text-[10px] text-muted">Último registro patronal</span>
        </div>

        {/* Col 2: Nuevo Límite Legal */}
        <div
          className={`rounded-xl border p-3.5 ${
            excedeLimiteDof
              ? 'border-amber-400 bg-amber-50/50'
              : 'border-emerald-300 bg-emerald-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-navy">
              2. Nuevo Techo DOF 2026
            </span>
            <span className="font-orbitron text-[9px] font-bold text-gold-dark">+1 UMA</span>
          </div>
          <div className="mt-1 font-mono text-lg font-black text-navy">
            ${limitePermitidoDof2026.toFixed(2)}{' '}
            <span className="text-xs font-normal text-muted">MXN/día</span>
          </div>
          <span className="mt-1 block text-[10px] text-muted">SBC Previo + 1 UMA ($117.31)</span>
        </div>

        {/* Col 3: Tope Absoluto 25 UMAs */}
        <div className="rounded-xl border border-line bg-surface-2 p-3.5 opacity-80">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
            3. Tope Histórico (25 UMAs)
          </span>
          <div className="mt-1 font-mono text-lg font-black text-muted line-through">
            ${topeHistorico25Umas.toFixed(2)} <span className="text-xs font-normal">MXN</span>
          </div>
          <span className="mt-1 block text-[10px] font-medium text-amber-700">
            Restringido salvo salarios altos previos
          </span>
        </div>
      </div>

      {/* Barra de Progresión Visual del Salario */}
      <div className="rounded-xl border border-line bg-surface-2 p-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-navy">
          <span>SBC Efectivo Aplicado:</span>
          <span className="font-mono font-bold text-navy">
            ${sbcEfectivo.toFixed(2)} MXN diarios
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-navy transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(5, (sbcEfectivo / topeHistorico25Umas) * 100))}%`,
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted">
          <span>Min: ${limites.salarioMinimo.toFixed(2)}</span>
          <span className="flex items-center gap-1 font-bold text-navy">
            SBC Calculado: ${sbcEfectivo.toFixed(2)} <ArrowRight size={10} />
          </span>
          <span>Tope: ${topeHistorico25Umas.toFixed(2)}</span>
        </div>
      </div>

      {/* Nota técnica */}
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <Info size={14} className="shrink-0 text-navy" />
        <span>{limites.mensajeCriterio}</span>
      </div>
    </div>
  );
}

import { CheckCircle2, XCircle } from 'lucide-react';
import type { TotalesBalance } from '../types';

export function ResultadoBalanceCard({ totales }: { totales: TotalesBalance | null }) {
  if (!totales) return null;
  const ok = totales.cuadrado;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-surface to-cream/20 p-6 shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold/10 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-navy">
            Ecuación Contable
          </h3>
          <p className="mt-1 text-lg font-bold text-ink">Activo = Pasivo + Patrimonio</p>
          <p className="text-sm text-muted">
            A=${totales.totalActivo.toFixed(2)} · P+P=${totales.totalPasivoPatrimonio.toFixed(2)} ·
            Dif=${totales.diferencia.toFixed(2)}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase">
          {ok ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span className="text-emerald-700">CUADRADO</span>
            </>
          ) : (
            <>
              <XCircle size={14} className="text-rose-600" />
              <span className="text-rose-700">NO CUADRADO</span>
            </>
          )}
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { k: 'Activo', v: totales.totalActivo },
          { k: 'Pasivo', v: totales.totalPasivo },
          { k: 'Patrimonio', v: totales.totalPatrimonio },
          { k: 'P+P', v: totales.totalPasivoPatrimonio },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-line bg-white/80 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted">{x.k}</p>
            <p className="mt-0.5 text-base font-bold text-ink">
              ${x.v.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

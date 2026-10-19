import type { ResultadoAnalisis } from '../types';

export function TablaBalanceAnalitico({ res }: { res: ResultadoAnalisis | null }) {
  if (!res) return null;
  const fmt = (n: number | null) => (n === null || n === undefined ? '-' : n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const fmtPct = (n: number | null) => (n === null || n === undefined ? '-' : `${n.toFixed(2)}%`);

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="min-w-full divide-y divide-line text-xs">
        <thead className="bg-surface-2">
          <tr>
            <th className="px-4 py-2 text-left font-orbitron text-[10px] uppercase tracking-wider text-navy">Código</th>
            <th className="px-4 py-2 text-left font-orbitron text-[10px] uppercase tracking-wider text-navy">Cuenta</th>
            <th className="px-4 py-2 text-right font-orbitron text-[10px] uppercase tracking-wider text-navy">Monto BG (Actual)</th>
            <th className="px-4 py-2 text-right font-orbitron text-[10px] uppercase tracking-wider text-navy">Monto LY (Anterior)</th>
            <th className="px-4 py-2 text-right font-orbitron text-[10px] uppercase tracking-wider text-navy">Variación $</th>
            <th className="px-4 py-2 text-right font-orbitron text-[10px] uppercase tracking-wider text-navy">AH %</th>
            <th className="px-4 py-2 text-right font-orbitron text-[10px] uppercase tracking-wider text-navy">AV % (Actual)</th>
            <th className="px-4 py-2 text-right font-orbitron text-[10px] uppercase tracking-wider text-navy">AV % (Anterior)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {res.cuentas.map((c) => (
            <tr key={c.id} className="hover:bg-black/2">
              <td className="px-4 py-1.5 font-mono text-muted">{c.codigo}</td>
              <td className="px-4 py-1.5 text-ink">{c.nombre}</td>
              <td className="px-4 py-1.5 text-right font-mono">${fmt(c.montoActual)}</td>
              <td className="px-4 py-1.5 text-right font-mono">${fmt(c.montoAnterior)}</td>
              <td className="px-4 py-1.5 text-right font-mono">{fmt(c.variacionAbsoluta)}</td>
              <td className="px-4 py-1.5 text-right font-mono">{fmtPct(c.variacionPorcentual)}</td>
              <td className="px-4 py-1.5 text-right font-mono">{fmtPct(c.analisisVerticalActual)}</td>
              <td className="px-4 py-1.5 text-right font-mono">{fmtPct(c.analisisVerticalAnterior)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { TotalesBalance } from '../types';

export function GraficosClasificacion({ totales }: { totales: TotalesBalance | null }) {
  if (!totales) return null;
  const items = [
    { label: 'Activo Corriente', val: totales.totalActivo * 0.6 },
    { label: 'Activo No Corriente', val: totales.totalActivo * 0.4 },
    { label: 'Pasivo', val: totales.totalPasivo },
    { label: 'Patrimonio', val: totales.totalPatrimonio },
  ];
  const max = Math.max(...items.map((i) => i.val), 1);

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-navy">
        Composición Patrimonial
      </h3>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <div key={i.label}>
            <div className="flex justify-between text-xs text-muted">
              <span>{i.label}</span>
              <span>${Math.round(i.val).toLocaleString('es-MX')}</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-surface-2">
              <div
                className="h-2 rounded-full bg-navy"
                style={{ width: `${(i.val / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

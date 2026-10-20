// src/tools/auditor-cobranza/components/ListaDetallesDictamen.tsx

import type { DetalleDictamen } from '../types';

interface ListaDetallesDictamenProps {
  detalles: DetalleDictamen[];
}

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

function obtenerColorCategoria(categoria: string): string {
  switch (categoria) {
    case 'hallazgo':
      return 'bg-red-50 text-red-700';
    case 'observacion':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-[var(--cream)] text-[var(--muted)]';
  }
}

export function ListaDetallesDictamen({ detalles }: ListaDetallesDictamenProps) {
  if (detalles.length === 0) {
    return (
      <div className="rounded-[20px] border border-[var(--line)] bg-white p-6 text-center">
        <p className="font-inter text-[13px] text-[var(--muted)]">
          No hay detalles para mostrar. Complete la evaluación de comparadores y conductas.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] bg-[var(--cream)] px-5 py-4">
        <h3 className="font-playfair text-[16px] font-bold text-[var(--ink)]">
          Detalles del Dictamen
        </h3>
        <p className="mt-0.5 font-inter text-[11px] text-[var(--muted)]">
          {detalles.length} elementos ordenados por severidad
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--cream)]">
              <th className="px-4 py-2.5 text-left font-inter text-[10px] font-bold tracking-widest text-[var(--muted)]">
                TIPO
              </th>
              <th className="px-4 py-2.5 text-left font-inter text-[10px] font-bold tracking-widest text-[var(--muted)]">
                ID / CÓDIGO
              </th>
              <th className="px-4 py-2.5 text-left font-inter text-[10px] font-bold tracking-widest text-[var(--muted)]">
                TÍTULO
              </th>
              <th className="px-4 py-2.5 text-left font-inter text-[10px] font-bold tracking-widest text-[var(--muted)]">
                ESTADO
              </th>
              <th className="px-4 py-2.5 text-left font-inter text-[10px] font-bold tracking-widest text-[var(--muted)]">
                RIESGO
              </th>
              <th className="px-4 py-2.5 text-right font-inter text-[10px] font-bold tracking-widest text-[var(--muted)]">
                PUNTOS
              </th>
              <th className="px-4 py-2.5 text-left font-inter text-[10px] font-bold tracking-widest text-[var(--muted)]">
                FUNDAMENTO
              </th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((detalle) => (
              <tr
                key={`${detalle.tipo}-${detalle.id}`}
                className="hover:bg-[var(--cream)]/50 border-b border-[var(--line)] transition-colors"
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 font-inter text-[9px] font-bold ${obtenerColorCategoria(detalle.categoria)}`}
                  >
                    {detalle.tipo.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-orbitron text-[10px] text-[var(--ink)]">
                    {detalle.codigo ?? detalle.id}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-[200px] truncate font-inter text-[12px] font-semibold leading-tight text-[var(--ink)]">
                    {detalle.titulo}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="font-inter text-[11px] text-[var(--muted)]">
                    {detalle.estado ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 font-inter text-[9px] font-bold ${obtenerColorRiesgo(detalle.riesgo)}`}
                  >
                    {detalle.riesgo}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-orbitron text-[12px] font-bold text-[var(--ink)]">
                    {detalle.puntos}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block max-w-[150px] truncate font-inter text-[10px] text-[var(--muted)]">
                    {detalle.fundamento ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

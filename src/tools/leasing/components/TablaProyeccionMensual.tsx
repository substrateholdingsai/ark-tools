/**
 * ARK LEDGER — Simulador Fiscal: Leasing vs Crédito vs Contado
 * Componente: Tabla Anualizada de Desembolsos, Deducción LISR y Flujo Neto
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { formatearMXN } from '../lib/calcularLeasing';
import type { ResultadoComparativaFiscal } from '../types';

interface TablaProyeccionMensualProps {
  resultado: ResultadoComparativaFiscal;
}

export const TablaProyeccionMensual: React.FC<TablaProyeccionMensualProps> = ({ resultado }) => {
  const { flujoAnual, contado, credito, leasing } = resultado;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gold" />
        <h3 className="font-playfair text-xl font-bold text-ink">
          Flujo Anualizado y Escudo Fiscal por Ejercicio
        </h3>
        <span className="text-xs text-muted">
          ({flujoAnual.length} {flujoAnual.length === 1 ? 'ejercicio' : 'ejercicios'} fiscales)
        </span>
      </div>

      <div className="bg-surface-raised/40 overflow-x-auto rounded-2xl border border-white/10 shadow-xl">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-surface/80 text-[10px] font-bold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Ejercicio</th>
              <th className="px-3 py-3 text-right">Contado: Erogación</th>
              <th className="px-3 py-3 text-right text-emerald-400">Contado: Escudo</th>
              <th className="px-3 py-3 text-right font-bold text-ink">Contado: Neto</th>
              <th className="px-3 py-3 text-right">Crédito: Erogación</th>
              <th className="px-3 py-3 text-right text-emerald-400">Crédito: Escudo</th>
              <th className="px-3 py-3 text-right font-bold text-ink">Crédito: Neto</th>
              <th className="px-3 py-3 text-right text-gold">Leasing: Erogación</th>
              <th className="px-3 py-3 text-right text-emerald-400">Leasing: Escudo</th>
              <th className="px-4 py-3 text-right font-bold text-gold">Leasing: Neto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {flujoAnual.map((fa) => (
              <tr key={fa.anio} className="transition-colors hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-ink">
                  Año {fa.anio}{' '}
                  <span className="font-mono text-[10px] text-muted">({fa.mesesEnAnio}m)</span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-muted">
                  {formatearMXN(fa.contadoDesembolso)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-emerald-400">
                  -{formatearMXN(fa.contadoAhorroFiscal)}
                </td>
                <td className="whitespace-nowrap bg-surface/30 px-3 py-3 text-right font-mono font-bold text-ink">
                  {formatearMXN(fa.contadoFlujoNeto)}
                </td>

                <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-muted">
                  {formatearMXN(fa.creditoDesembolso)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-emerald-400">
                  -{formatearMXN(fa.creditoAhorroFiscal)}
                </td>
                <td className="whitespace-nowrap bg-surface/30 px-3 py-3 text-right font-mono font-bold text-ink">
                  {formatearMXN(fa.creditoFlujoNeto)}
                </td>

                <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-ink">
                  {formatearMXN(fa.leasingDesembolso)}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-emerald-400">
                  -{formatearMXN(fa.leasingAhorroFiscal)}
                </td>
                <td className="whitespace-nowrap bg-gold/10 px-4 py-3 text-right font-mono font-bold text-gold">
                  {formatearMXN(fa.leasingFlujoNeto)}
                </td>
              </tr>
            ))}

            {/* Fila de Totales */}
            <tr className="border-t-2 border-gold/30 bg-surface/90 font-bold text-ink">
              <td className="px-4 py-4 font-playfair text-gold">ACUMULADO PLAZO</td>
              <td className="px-3 py-4 text-right font-mono text-muted">
                {formatearMXN(contado.totalErogadoSinIva)}
              </td>
              <td className="px-3 py-4 text-right font-mono text-emerald-400">
                -{formatearMXN(contado.ahorroFiscalTotal)}
              </td>
              <td className="px-3 py-4 text-right font-mono text-ink">
                {formatearMXN(contado.costoNetoDespuesImpuestos)}
              </td>

              <td className="px-3 py-4 text-right font-mono text-muted">
                {formatearMXN(credito.totalErogadoSinIva)}
              </td>
              <td className="px-3 py-4 text-right font-mono text-emerald-400">
                -{formatearMXN(credito.ahorroFiscalTotal)}
              </td>
              <td className="px-3 py-4 text-right font-mono text-ink">
                {formatearMXN(credito.costoNetoDespuesImpuestos)}
              </td>

              <td className="px-3 py-4 text-right font-mono text-ink">
                {formatearMXN(leasing.totalErogadoSinIva)}
              </td>
              <td className="px-3 py-4 text-right font-mono text-emerald-400">
                -{formatearMXN(leasing.ahorroFiscalTotal)}
              </td>
              <td className="bg-gold/15 px-4 py-4 text-right font-mono text-sm text-gold">
                {formatearMXN(leasing.costoNetoDespuesImpuestos)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

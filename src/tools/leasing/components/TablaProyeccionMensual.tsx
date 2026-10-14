/**
 * ARK TOOLS — Calculadora de Leasing
 * Componente: Tabla Detallada de Proyección Mes a Mes
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { formatearMXN } from '../lib/calcularLeasing';
import type { ProyeccionMes, ResumenLeasing } from '../types';

interface TablaProyeccionMensualProps {
  proyeccion: ProyeccionMes[];
  resumen: ResumenLeasing;
}

export const TablaProyeccionMensual: React.FC<TablaProyeccionMensualProps> = ({
  proyeccion,
  resumen,
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gold" />
        <h3 className="font-playfair text-xl font-bold text-ink">
          Cronograma Financiero Mensual
        </h3>
        <span className="text-xs text-muted">({proyeccion.length} meses)</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-surface-raised/40 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-surface/80 text-[11px] font-bold uppercase tracking-wider text-muted">
              <th className="py-3 px-4">Mes</th>
              <th className="py-3 px-3 text-center">Inicio</th>
              <th className="py-3 px-3 text-center text-emerald-400">+Nuevos</th>
              <th className="py-3 px-3 text-center text-amber-400">-Bajas</th>
              <th className="py-3 px-3 text-center font-bold text-ink">Cierre</th>
              <th className="py-3 px-4 text-right">Setup</th>
              <th className="py-3 px-4 text-right">Rentas MRR</th>
              <th className="py-3 px-4 text-right">Total Mes</th>
              <th className="py-3 px-4 text-right text-emerald-400">Utilidad Mes</th>
              <th className="py-3 px-4 text-right font-bold text-gold">Utilidad Acum.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {proyeccion.map((m) => (
              <tr key={m.mes} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 font-semibold text-ink whitespace-nowrap">
                  Mes {m.mes}
                </td>
                <td className="py-3 px-3 text-center font-mono text-muted">
                  {m.clientesInicio}
                </td>
                <td className="py-3 px-3 text-center font-mono text-emerald-400">
                  +{m.clientesNuevos}
                </td>
                <td className="py-3 px-3 text-center font-mono text-amber-400">
                  {m.clientesPerdidos > 0 ? `-${m.clientesPerdidos}` : '0'}
                </td>
                <td className="py-3 px-3 text-center font-mono font-bold text-ink bg-surface/30">
                  {m.clientesFin}
                </td>
                <td className="py-3 px-4 text-right font-mono text-muted whitespace-nowrap">
                  {formatearMXN(m.ingresosSetup)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-ink whitespace-nowrap">
                  {formatearMXN(m.ingresosRentas)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-ink whitespace-nowrap">
                  {formatearMXN(m.ingresoTotalMes)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 whitespace-nowrap">
                  {formatearMXN(m.utilidadMes)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-gold whitespace-nowrap">
                  {formatearMXN(m.utilidadAcumulada)}
                </td>
              </tr>
            ))}

            {/* Fila de Totales */}
            <tr className="border-t-2 border-gold/30 bg-surface/90 font-bold text-ink">
              <td className="py-4 px-4 font-playfair text-gold">TOTALES</td>
              <td className="py-4 px-3 text-center text-muted">—</td>
              <td className="py-4 px-3 text-center text-muted">—</td>
              <td className="py-4 px-3 text-center text-muted">—</td>
              <td className="py-4 px-3 text-center font-mono text-gold">
                {resumen.clientesFinales}
              </td>
              <td className="py-4 px-4 text-right font-mono text-muted">
                {formatearMXN(resumen.totalSetupAcumulado)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-ink">
                {formatearMXN(resumen.totalRentasAcumulado)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-gold">
                {formatearMXN(resumen.ingresoBrutoTotal)}
              </td>
              <td className="py-4 px-4 text-right font-mono text-muted">—</td>
              <td className="py-4 px-4 text-right font-mono text-emerald-400 text-sm">
                {formatearMXN(resumen.utilidadTotalAcumulada)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

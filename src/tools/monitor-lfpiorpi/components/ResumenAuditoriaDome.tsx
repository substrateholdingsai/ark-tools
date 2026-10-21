/**
 * ARK TOOLS — Resumen Ejecutivo de Auditoría Antilavado LFPIORPI
 */

import React from 'react';
import { Users, AlertTriangle, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';
import type { ResumenMonitorLFPIORPI } from '../types';

interface Props {
  resumen: ResumenMonitorLFPIORPI;
}

export const ResumenAuditoriaDome: React.FC<Props> = ({ resumen }) => {
  return (
    <div className="space-y-4">
      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Clientes */}
        <div className="shadow-xs rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between text-muted">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
              Clientes
            </span>
            <Users size={16} className="text-navy" />
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-ink">{resumen.totalClientes}</div>
          <p className="mt-0.5 text-[11px] text-muted">
            {resumen.totalOperaciones} pagos evaluados
          </p>
        </div>

        {/* Clientes en Aviso (ROJO) */}
        <div className="shadow-xs rounded-xl border border-rose-200 bg-rose-50/70 p-4">
          <div className="flex items-center justify-between text-rose-800">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
              Avisos UIF (Rojo)
            </span>
            <ShieldAlert size={16} className="text-rose-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-rose-950">
            {resumen.clientesRojo}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-rose-800">Obligación de reporte</p>
        </div>

        {/* Clientes en Identificación (AMARILLO) */}
        <div className="shadow-xs rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center justify-between text-amber-800">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
              Identificación (Gold)
            </span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-amber-950">
            {resumen.clientesAmarillo}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-amber-800">Integrar expediente</p>
        </div>

        {/* Clientes Sin Alerta (VERDE) */}
        <div className="shadow-xs rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
              Normales (Verde)
            </span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-emerald-950">
            {resumen.clientesVerde}
          </div>
          <p className="mt-0.5 text-[11px] text-emerald-700">Bajo los umbrales</p>
        </div>

        {/* Monto Total */}
        <div className="shadow-xs col-span-2 rounded-xl border border-line bg-surface p-4 lg:col-span-1">
          <div className="flex items-center justify-between text-muted">
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
              Cobranza Total
            </span>
            <DollarSign size={16} className="text-navy" />
          </div>
          <div className="mt-2 font-mono text-lg font-black text-ink">
            $
            {resumen.montoTotalEvaluado.toLocaleString('es-MX', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="mt-0.5 text-[11px] text-muted">Base de cálculo auditada</p>
        </div>
      </div>
    </div>
  );
};

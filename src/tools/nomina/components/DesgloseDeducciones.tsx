/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * DesgloseDeducciones
 *
 * Desglose detallado de las retenciones: ISR (Art. 96 LISR) e IMSS obrero (LSS).
 */

import { useState } from 'react';
import { formatearMXN } from '../lib/calcularISR';
import type { ResultadoNomina } from '../types';

interface DesgloseDeduccionesProps {
  resultado: ResultadoNomina;
}

export function DesgloseDeducciones({ resultado }: DesgloseDeduccionesProps) {
  const [tabActivo, setTabActivo] = useState<'todos' | 'isr' | 'imss'>('todos');

  const { isr, imss, sueldoBruto, totalDeducciones } = resultado;
  const pctRetencion =
    sueldoBruto > 0 ? Math.round((totalDeducciones / sueldoBruto) * 1000) / 10 : 0;

  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="space-y-5 p-5 md:p-6">
        {/* Header con tabs */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
              3. Desglose de Deducciones
            </h3>
            <p className="mt-0.5 text-[12px] font-semibold text-navy">
              Total retenciones: {formatearMXN(totalDeducciones)} ({pctRetencion}% del bruto)
            </p>
          </div>

          {/* Selector de pestañas */}
          <div className="inline-flex rounded-[10px] border border-line bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => setTabActivo('todos')}
              className={`rounded-[8px] px-3 py-1 font-orbitron text-[11px] font-semibold transition-all ${
                tabActivo === 'todos'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => setTabActivo('isr')}
              className={`rounded-[8px] px-3 py-1 font-orbitron text-[11px] font-semibold transition-all ${
                tabActivo === 'isr' ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-navy'
              }`}
            >
              ISR
            </button>
            <button
              type="button"
              onClick={() => setTabActivo('imss')}
              className={`rounded-[8px] px-3 py-1 font-orbitron text-[11px] font-semibold transition-all ${
                tabActivo === 'imss' ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-navy'
              }`}
            >
              IMSS
            </button>
          </div>
        </div>

        {/* Barra visual de distribución */}
        <div className="space-y-1.5">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              style={{
                width: `${totalDeducciones > 0 ? (isr.isrFinal / totalDeducciones) * 100 : 50}%`,
              }}
              className="h-full bg-navy"
              title={`ISR: ${formatearMXN(isr.isrFinal)}`}
            />
            <div
              style={{
                width: `${totalDeducciones > 0 ? (imss.total / totalDeducciones) * 100 : 50}%`,
              }}
              className="h-full bg-gold"
              title={`IMSS: ${formatearMXN(imss.total)}`}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-navy" />
              ISR: {formatearMXN(isr.isrFinal)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-gold" />
              IMSS: {formatearMXN(imss.total)}
            </span>
          </div>
        </div>

        {/* Sección ISR */}
        {(tabActivo === 'todos' || tabActivo === 'isr') && (
          <div className="space-y-3 rounded-[14px] border border-line bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-1.5 rounded-sm bg-navy" />
                <h4 className="font-orbitron text-[11px] font-bold uppercase tracking-[0.12em] text-navy">
                  Impuesto Sobre la Renta (ISR)
                </h4>
              </div>
              <span className="font-mono text-[10px] text-muted">Art. 96 LISR</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="rounded-[10px] border border-line bg-surface p-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
                  Límite Inferior
                </div>
                <div className="mt-0.5 font-orbitron text-[11px] font-bold text-navy">
                  {formatearMXN(isr.rangoTarifa.limiteInferior)}
                </div>
              </div>
              <div className="rounded-[10px] border border-line bg-surface p-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
                  Tasa Marginal
                </div>
                <div className="mt-0.5 font-orbitron text-[11px] font-bold text-navy">
                  {isr.rangoTarifa.tasaExcedente}%
                </div>
              </div>
              <div className="rounded-[10px] border border-line bg-surface p-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
                  Cuota Fija
                </div>
                <div className="mt-0.5 font-orbitron text-[11px] font-bold text-navy">
                  {formatearMXN(isr.rangoTarifa.cuotaFija)}
                </div>
              </div>
              <div className="rounded-[10px] border border-line bg-surface p-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
                  Subsidio
                </div>
                <div className="mt-0.5 font-orbitron text-[11px] font-bold text-navy">
                  {isr.subsidio > 0 ? `-${formatearMXN(isr.subsidio)}` : '$0.00'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-1 text-[12px]">
              <span className="font-semibold text-muted">ISR a retener:</span>
              <span className="font-orbitron font-bold text-navy">
                {formatearMXN(isr.isrFinal)}
              </span>
            </div>
          </div>
        )}

        {/* Sección IMSS Obrero */}
        {(tabActivo === 'todos' || tabActivo === 'imss') && (
          <div className="space-y-3 rounded-[14px] border border-line bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-1.5 rounded-sm bg-gold" />
                <h4 className="font-orbitron text-[11px] font-bold uppercase tracking-[0.12em] text-navy">
                  IMSS Cuotas Obrero
                </h4>
              </div>
              <span className="font-mono text-[10px] text-muted">Ley del Seguro Social</span>
            </div>

            <div className="divide-y divide-line/60">
              {imss.cuotas.map((cuota) => (
                <div
                  key={cuota.ramo}
                  className="flex items-center justify-between py-2 text-[11px]"
                >
                  <div>
                    <span className="font-medium text-navy">{cuota.ramo}</span>
                    <span className="ml-2 font-mono text-[9px] text-muted">
                      ({cuota.porcentaje}%)
                    </span>
                  </div>
                  <span className="font-orbitron font-bold text-navy">
                    {formatearMXN(cuota.monto)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-line pt-2 text-[12px]">
              <span className="font-semibold text-muted">Total IMSS Obrero:</span>
              <span className="font-orbitron font-bold text-navy">{formatearMXN(imss.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

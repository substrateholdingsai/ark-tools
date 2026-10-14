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
    sueldoBruto > 0
      ? Math.round((totalDeducciones / sueldoBruto) * 1000) / 10
      : 0;

  return (
    <div className="rounded-[20px] bg-surface border border-line overflow-hidden">
      {/* Barra decorativa superior */}
      <div className="h-1 w-full bg-gradient-to-r from-navy via-navy to-gold" />

      <div className="p-5 md:p-6 space-y-5">
        {/* Header con tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
              3. Desglose de Deducciones
            </h3>
            <p className="text-[12px] text-navy font-semibold mt-0.5">
              Total retenciones: {formatearMXN(totalDeducciones)} ({pctRetencion}% del bruto)
            </p>
          </div>

          {/* Selector de pestañas */}
          <div className="inline-flex rounded-[10px] bg-surface-2 p-1 border border-line">
            <button
              type="button"
              onClick={() => setTabActivo('todos')}
              className={`px-3 py-1 text-[11px] font-orbitron font-semibold rounded-[8px] transition-all ${
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
              className={`px-3 py-1 text-[11px] font-orbitron font-semibold rounded-[8px] transition-all ${
                tabActivo === 'isr'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              ISR
            </button>
            <button
              type="button"
              onClick={() => setTabActivo('imss')}
              className={`px-3 py-1 text-[11px] font-orbitron font-semibold rounded-[8px] transition-all ${
                tabActivo === 'imss'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-muted hover:text-navy'
              }`}
            >
              IMSS
            </button>
          </div>
        </div>

        {/* Barra visual de distribución */}
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden flex">
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
          <div className="flex items-center justify-between text-[10px] font-mono text-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-navy" />
              ISR: {formatearMXN(isr.isrFinal)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-gold" />
              IMSS: {formatearMXN(imss.total)}
            </span>
          </div>
        </div>

        {/* Sección ISR */}
        {(tabActivo === 'todos' || tabActivo === 'isr') && (
          <div className="rounded-[14px] bg-surface-2 border border-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-navy rounded-sm" />
                <h4 className="text-[11px] font-bold tracking-[0.12em] text-navy uppercase font-orbitron">
                  Impuesto Sobre la Renta (ISR)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-muted">
                Art. 96 LISR
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-surface rounded-[10px] p-2 border border-line">
                <div className="text-[9px] text-muted font-bold tracking-wider uppercase">Límite Inferior</div>
                <div className="text-[11px] font-orbitron font-bold text-navy mt-0.5">
                  {formatearMXN(isr.rangoTarifa.limiteInferior)}
                </div>
              </div>
              <div className="bg-surface rounded-[10px] p-2 border border-line">
                <div className="text-[9px] text-muted font-bold tracking-wider uppercase">Tasa Marginal</div>
                <div className="text-[11px] font-orbitron font-bold text-navy mt-0.5">
                  {isr.rangoTarifa.tasaExcedente}%
                </div>
              </div>
              <div className="bg-surface rounded-[10px] p-2 border border-line">
                <div className="text-[9px] text-muted font-bold tracking-wider uppercase">Cuota Fija</div>
                <div className="text-[11px] font-orbitron font-bold text-navy mt-0.5">
                  {formatearMXN(isr.rangoTarifa.cuotaFija)}
                </div>
              </div>
              <div className="bg-surface rounded-[10px] p-2 border border-line">
                <div className="text-[9px] text-muted font-bold tracking-wider uppercase">Subsidio</div>
                <div className="text-[11px] font-orbitron font-bold text-navy mt-0.5">
                  {isr.subsidio > 0 ? `-${formatearMXN(isr.subsidio)}` : '$0.00'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-line text-[12px]">
              <span className="font-semibold text-muted">ISR a retener:</span>
              <span className="font-orbitron font-bold text-navy">{formatearMXN(isr.isrFinal)}</span>
            </div>
          </div>
        )}

        {/* Sección IMSS Obrero */}
        {(tabActivo === 'todos' || tabActivo === 'imss') && (
          <div className="rounded-[14px] bg-surface-2 border border-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-gold rounded-sm" />
                <h4 className="text-[11px] font-bold tracking-[0.12em] text-navy uppercase font-orbitron">
                  IMSS Cuotas Obrero
                </h4>
              </div>
              <span className="text-[10px] font-mono text-muted">
                Ley del Seguro Social
              </span>
            </div>

            <div className="divide-y divide-line/60">
              {imss.cuotas.map((cuota) => (
                <div
                  key={cuota.ramo}
                  className="py-2 flex items-center justify-between text-[11px]"
                >
                  <div>
                    <span className="font-medium text-navy">{cuota.ramo}</span>
                    <span className="text-[9px] text-muted ml-2 font-mono">
                      ({cuota.porcentaje}%)
                    </span>
                  </div>
                  <span className="font-orbitron font-bold text-navy">
                    {formatearMXN(cuota.monto)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line text-[12px]">
              <span className="font-semibold text-muted">Total IMSS Obrero:</span>
              <span className="font-orbitron font-bold text-navy">{formatearMXN(imss.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

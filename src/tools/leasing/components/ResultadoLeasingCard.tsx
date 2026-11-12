/**
 * ARK LEDGER — Simulador Fiscal: Leasing vs Crédito vs Contado
 * Componente: Resumen Ejecutivo Tripartito y Dictamen Fiscal Comparativo
 */

import React from 'react';
import {
  Scale,
  Download,
  Award,
  ShieldCheck,
  TrendingDown,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { LiquidGlassDome, BadgeGold, GlassButton } from '@/components/ui';
import { formatearMXN } from '../lib/calcularLeasing';
import type { ResultadoComparativaFiscal, DetalleMetodoAdquisicion } from '../types';

interface ResultadoLeasingCardProps {
  resultado: ResultadoComparativaFiscal;
  onDescargarExcel: () => void;
}

export const ResultadoLeasingCard: React.FC<ResultadoLeasingCardProps> = ({
  resultado,
  onDescargarExcel,
}) => {
  const { contado, credito, leasing, parametros } = resultado;
  const metodos: DetalleMetodoAdquisicion[] = [contado, credito, leasing];

  return (
    <LiquidGlassDome padding="lg" radius="dome" className="w-full">
      <div className="flex flex-col gap-6">
        {/* Cabecera Ejecutiva */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/20 text-gold">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-playfair text-xl font-bold text-ink">
                  Dictamen Comparativo Tripartito
                </h3>
                <BadgeGold size="sm">{parametros.plazoMeses} MESES</BadgeGold>
              </div>
              <p className="text-xs text-muted">
                Evaluación simultánea de Costo Neto, Escudo Fiscal ISR/PTU y Liquidez (LISR Arts.
                28, 34 y 36)
              </p>
            </div>
          </div>

          <GlassButton
            variant="primary"
            size="md"
            onClick={onDescargarExcel}
            className="shadow-lg shadow-gold/20"
          >
            <Download className="h-4 w-4 stroke-[2.2]" />
            EXPORTAR CÉDULA COMPARATIVA (CSV)
          </GlassButton>
        </div>

        {/* Dictamen Pericial Automatizado */}
        <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gold">
                Dictamen Fiscal y Financiero Ejecutivo
              </span>
              <p className="text-sm leading-relaxed text-ink">{resultado.dictamenPericial}</p>
            </div>
          </div>
        </div>

        {/* Tarjetas Comparativas de las 3 Opciones */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {metodos.map((m) => {
            const esMejorDeduccion = resultado.mejorOpcionDeduccion === m.metodo;
            const esMejorCosto = resultado.mejorOpcionCostoNeto === m.metodo;
            const esMejorLiquidez = resultado.mejorOpcionLiquidezInicial === m.metodo;
            const esLeasing = m.metodo === 'leasing';

            return (
              <div
                key={m.metodo}
                className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                  esLeasing
                    ? 'border-gold/50 bg-surface/90 shadow-lg shadow-gold/5'
                    : 'border-white/10 bg-surface/50'
                }`}
              >
                <div className="space-y-4">
                  {/* Encabezado de la opción y badges ganadores */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {esMejorDeduccion && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                          <Award className="h-3 w-3" /> MAYOR DEDUCCIÓN FISCAL
                        </span>
                      )}
                      {esMejorCosto && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-2.5 py-0.5 font-mono text-[10px] font-bold text-gold">
                          <TrendingDown className="h-3 w-3" /> MENOR COSTO NETO
                        </span>
                      )}
                      {esMejorLiquidez && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                          <Wallet className="h-3 w-3" /> MEJOR LIQUIDEZ DÍA 1
                        </span>
                      )}
                    </div>

                    <h4 className="font-playfair text-lg font-bold text-ink">{m.etiqueta}</h4>
                    <p className="font-mono text-[10px] text-muted">{m.fundamentoLegal}</p>
                  </div>

                  {/* Costo Neto después de Impuestos */}
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                      Costo Neto Real (Después de ISR/PTU)
                    </span>
                    <span
                      className={`mt-1 block font-mono text-2xl font-black ${
                        esLeasing ? 'text-gold' : 'text-ink'
                      }`}
                    >
                      {formatearMXN(m.costoNetoDespuesImpuestos)}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      Total erogado s/IVA acreditable: {formatearMXN(m.totalErogadoSinIva)}
                    </span>
                  </div>

                  {/* Métricas Fiscales y de Flujo */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-muted">Desembolso Inicial s/IVA:</span>
                      <span className="font-mono font-bold text-ink">
                        {formatearMXN(m.desembolsoInicialSinIva)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-muted">Mensualidad Promedio s/IVA:</span>
                      <span className="font-mono font-bold text-ink">
                        {m.pagoMensualPromedioSinIva > 0
                          ? `${formatearMXN(m.pagoMensualPromedioSinIva)}/mes`
                          : 'N/A (Pago único)'}
                      </span>
                    </div>
                    {m.pagoTerminalSinIva > 0 && (
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                        <span className="text-muted">Opción de Compra Residual:</span>
                        <span className="font-mono font-bold text-ink">
                          {formatearMXN(m.pagoTerminalSinIva)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-muted">Deducción Acumulada LISR:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatearMXN(m.deduccionFiscalTotalPlazo)} (
                        {m.proporcionDeduciblePorcentaje}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-muted">Escudo Fiscal (ISR + PTU):</span>
                      <span className="font-mono font-bold text-emerald-400">
                        -{formatearMXN(m.ahorroFiscalTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">IVA Total Acreditable:</span>
                      <span className="font-mono font-semibold text-ink">
                        {formatearMXN(m.totalIvaAcreditable)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notas Fiscales de la Opción */}
                <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
                  {m.notasFiscales.map((nota, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-muted">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
                      <span>{nota}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </LiquidGlassDome>
  );
};

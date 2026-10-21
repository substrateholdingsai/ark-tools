/**
 * ARK TOOLS — Herramienta #16: Motor de Conciliación Anexo 24
 * ResumenCuadreDome: Visualizador del estado del cuadre (Cuadrado / Diferencias)
 * encapsulado en el LiquidGlassDome institucional con sombra física dorada.
 */

import { LiquidGlassDome } from '@/components/ui/LiquidGlassDome';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Ban,
  ArrowRightLeft,
  DollarSign,
  Scale,
} from 'lucide-react';
import type { ResumenConciliacion } from '../types';

interface ResumenCuadreDomeProps {
  resumen: ResumenConciliacion | null;
}

const fmtMoneda = (val: number) =>
  `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ResumenCuadreDome({ resumen }: ResumenCuadreDomeProps) {
  if (!resumen) return null;

  const {
    cuadrado,
    diferencia,
    totalCFDIsProcesados,
    totalCFDIsVigentes,
    totalCFDIsCancelados,
    totalImporteFacturado,
    totalDebe,
    totalHaber,
    totalIVA16,
    totalRetenciones,
  } = resumen;

  return (
    <LiquidGlassDome
      padding="md"
      radius="dome"
      className="bg-gradient-to-br from-surface to-surface-2 shadow-xl"
    >
      <div className="space-y-6">
        {/* Encabezado del Cuadre con Estatus */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                cuadrado
                  ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border border-amber-300 bg-amber-50 text-amber-700'
              }`}
            >
              {cuadrado ? <CheckCircle2 size={26} /> : <AlertTriangle size={26} />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-muted">
                  Estado del Cuadre Contable Anexo 24
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-orbitron text-[10px] font-bold uppercase tracking-wider ${
                    cuadrado
                      ? 'border border-emerald-300 bg-emerald-100/80 text-emerald-800'
                      : 'border border-red-300 bg-red-100/80 text-red-800'
                  }`}
                >
                  {cuadrado ? 'CUADRADO (Debe = Haber)' : 'DIFERENCIA DETECTADA'}
                </span>
              </div>
              <h2 className="mt-1 font-playfair text-[24px] font-black text-ink md:text-[28px]">
                {cuadrado
                  ? 'Conciliación Cuadrada al Centavo'
                  : `Descuadre de ${fmtMoneda(diferencia)}`}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="shadow-2xs rounded-xl border border-line bg-white px-4 py-2 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Diferencia
              </div>
              <div
                className={`font-mono text-base font-bold ${
                  cuadrado ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {fmtMoneda(diferencia)} MXN
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPIs de Control Financiero y Auditoría */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Facturación Total Vigente */}
          <div className="shadow-2xs rounded-xl border border-line bg-white/70 p-4">
            <div className="flex items-center justify-between text-muted">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
                Total Facturado
              </span>
              <DollarSign size={15} className="text-navy" />
            </div>
            <div className="mt-2 font-mono text-[20px] font-bold text-ink">
              {fmtMoneda(totalImporteFacturado)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
              <FileCheck size={12} className="text-emerald-600" />
              <span>{totalCFDIsVigentes} vigentes a contabilizar</span>
            </div>
          </div>

          {/* Filtro de Cancelados SAT */}
          <div className="shadow-2xs rounded-xl border border-line bg-white/70 p-4">
            <div className="flex items-center justify-between text-muted">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
                Filtro Metadata SAT
              </span>
              <Ban size={15} className="text-red-600" />
            </div>
            <div className="mt-2 font-mono text-[20px] font-bold text-ink">
              {totalCFDIsCancelados}{' '}
              <span className="text-xs font-normal text-muted">/ {totalCFDIsProcesados}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-red-600">
              <span>Descartados de pólizas</span>
            </div>
          </div>

          {/* Cargos (Debe) */}
          <div className="shadow-2xs rounded-xl border border-line bg-white/70 p-4">
            <div className="flex items-center justify-between text-muted">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
                Total Cargos (Debe)
              </span>
              <Scale size={15} className="text-navy" />
            </div>
            <div className="mt-2 font-mono text-[20px] font-bold text-navy">
              {fmtMoneda(totalDebe)}
            </div>
            <div className="mt-1 text-[11px] text-muted">
              Clientes + Retenciones ({fmtMoneda(totalRetenciones)})
            </div>
          </div>

          {/* Abonos (Haber) */}
          <div className="shadow-2xs rounded-xl border border-line bg-white/70 p-4">
            <div className="flex items-center justify-between text-muted">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider">
                Total Abonos (Haber)
              </span>
              <ArrowRightLeft size={15} className="text-gold-dark" />
            </div>
            <div className="mt-2 font-mono text-[20px] font-bold text-ink">
              {fmtMoneda(totalHaber)}
            </div>
            <div className="mt-1 text-[11px] text-muted">
              Ingresos (
              {fmtMoneda(
                resumen.totalSubtotal16 +
                  resumen.totalSubtotal8 +
                  resumen.totalSubtotal0 +
                  resumen.totalSubtotalExento
              )}
              ) + IVA ({fmtMoneda(totalIVA16)})
            </div>
          </div>
        </div>
      </div>
    </LiquidGlassDome>
  );
}

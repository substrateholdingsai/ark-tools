/**
 * ARK LEDGER — Simulador Fiscal: Leasing vs Crédito vs Contado
 * Componente: Panel de Configuración del Activo, Financiamiento y Perfil Fiscal
 */

import React from 'react';
import {
  Car,
  Zap,
  Server,
  Factory,
  DollarSign,
  Percent,
  Calendar,
  Scale,
  Sparkles,
  Calculator,
  CheckCircle2,
} from 'lucide-react';
import {
  PRESETS_ACTIVOS_FISCALES,
  estimarRentaLeasingSugerida,
  obtenerReglasFiscalesActivo,
  formatearMXN,
} from '../lib/calcularLeasing';
import type { ParametrosComparativaFiscal, TipoActivoFiscal, OpcionTerminalCFF } from '../types';

interface ParametrosLeasingCardProps {
  parametros: ParametrosComparativaFiscal;
  onChange: (nuevos: ParametrosComparativaFiscal) => void;
}

const TIPOS_ACTIVO: Array<{
  id: TipoActivoFiscal;
  titulo: string;
  norma: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'auto_combustion',
    titulo: 'Automóvil Gasolina / Diésel',
    norma: 'Tope MOI $175k • Renta $200/día',
    icon: Car,
  },
  {
    id: 'auto_hibrido',
    titulo: 'Automóvil Híbrido / Eléctrico',
    norma: 'Tope MOI $250k • Renta $285/día',
    icon: Zap,
  },
  {
    id: 'equipo_computo',
    titulo: 'Equipo de Cómputo y TI',
    norma: 'Depreciación 30% • Renta 100% deducible',
    icon: Server,
  },
  {
    id: 'maquinaria',
    titulo: 'Maquinaria y Equipo General',
    norma: 'Depreciación 10% • Renta 100% deducible',
    icon: Factory,
  },
];

export const ParametrosLeasingCard: React.FC<ParametrosLeasingCardProps> = ({
  parametros,
  onChange,
}) => {
  const reglas = obtenerReglasFiscalesActivo(parametros.tipoActivo);

  const updateField = <K extends keyof ParametrosComparativaFiscal>(
    campo: K,
    valor: ParametrosComparativaFiscal[K]
  ) => {
    onChange({
      ...parametros,
      [campo]: valor,
    });
  };

  const handleCambiarValorOPlazo = (
    nuevoValor: number,
    nuevoPlazo: number,
    nuevoResidual: number
  ) => {
    const rentaSugerida = estimarRentaLeasingSugerida(nuevoValor, nuevoPlazo, nuevoResidual);
    onChange({
      ...parametros,
      valorFacturaSinIva: nuevoValor,
      plazoMeses: nuevoPlazo,
      valorResidualPorcentaje: nuevoResidual,
      rentaMensualLeasingSinIva: rentaSugerida,
    });
  };

  const handleRecalcularRentaMercado = () => {
    const sugerida = estimarRentaLeasingSugerida(
      parametros.valorFacturaSinIva,
      parametros.plazoMeses,
      parametros.valorResidualPorcentaje
    );
    updateField('rentaMensualLeasingSinIva', sugerida);
  };

  return (
    <div className="w-full space-y-8">
      {/* 1. Presets de Casos Reales */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          Casos Tipo Preconfigurados (Haz clic para cargar)
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS_ACTIVOS_FISCALES.map((preset) => {
            const isSelected =
              parametros.tipoActivo === preset.parametros.tipoActivo &&
              parametros.valorFacturaSinIva === preset.parametros.valorFacturaSinIva &&
              parametros.plazoMeses === preset.parametros.plazoMeses;

            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => onChange(preset.parametros)}
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-gold bg-gold/15 text-ink shadow-md shadow-gold/10'
                    : 'hover:bg-surface-raised border-white/10 bg-surface text-muted hover:text-ink'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gold">
                    {preset.badge}
                  </span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-gold" />}
                </div>
                <span className="mt-1 block text-xs font-bold text-ink">{preset.nombre}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-muted">
                  {preset.subtitulo}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Clasificación Fiscal del Activo */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Scale className="h-3.5 w-3.5 text-gold" />
          1. Clasificación Fiscal del Bien (LISR Arts. 28, 34 y 36)
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {TIPOS_ACTIVO.map((item) => {
            const Icon = item.icon;
            const active = parametros.tipoActivo === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => updateField('tipoActivo', item.id)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  active
                    ? 'border-gold bg-gold/15 text-ink'
                    : 'border-white/10 bg-surface/60 text-muted hover:border-white/20 hover:text-ink'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    active ? 'bg-gold text-navy' : 'bg-white/5 text-gold'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-ink">{item.titulo}</span>
                  <span className="mt-0.5 block text-[10px] text-muted">{item.norma}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Cinta informativa del tope vigente */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/25 bg-gold/5 px-4 py-2.5 text-xs">
          <span className="font-semibold text-ink">
            Regla fiscal aplicada ({reglas.etiquetaActivo}):
          </span>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] text-gold">
            <span>
              Tope MOI Compra:{' '}
              <strong>
                {reglas.topeMoi !== null ? formatearMXN(reglas.topeMoi) : '100% Deducible'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Tope Renta Leasing:{' '}
              <strong>
                {reglas.topeRentaDiaria !== null
                  ? `$${reglas.topeRentaDiaria}/día (${formatearMXN(reglas.topeRentaMensual!)}/mes)`
                  : '100% Deducible'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Depreciación Anual: <strong>{Math.round(reglas.tasaDepreciacionAnual * 100)}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Valor de Factura y Plazo */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <label
            htmlFor="input-valor-factura"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted"
          >
            <DollarSign className="h-3.5 w-3.5 text-gold" />
            Valor Factura sin IVA ($ MXN)
          </label>
          <input
            id="input-valor-factura"
            type="number"
            min="10000"
            step="10000"
            value={parametros.valorFacturaSinIva}
            onChange={(e) =>
              handleCambiarValorOPlazo(
                Math.max(0, Number(e.target.value)),
                parametros.plazoMeses,
                parametros.valorResidualPorcentaje
              )
            }
            className="w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 font-mono text-base font-bold text-ink focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
          <span className="block text-[10px] text-muted">
            Con IVA (16%): {formatearMXN(parametros.valorFacturaSinIva * 1.16)}
          </span>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Calendar className="h-3.5 w-3.5 text-gold" />
            Plazo del Contrato / Crédito
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {[12, 24, 36, 48, 60].map((meses) => (
              <button
                key={meses}
                type="button"
                onClick={() =>
                  handleCambiarValorOPlazo(
                    parametros.valorFacturaSinIva,
                    meses,
                    parametros.valorResidualPorcentaje
                  )
                }
                className={`rounded-xl border py-2.5 font-mono text-xs font-bold transition-all ${
                  parametros.plazoMeses === meses
                    ? 'border-gold bg-gold text-navy shadow-sm'
                    : 'border-white/10 bg-surface text-muted hover:text-ink'
                }`}
              >
                {meses}m
              </button>
            ))}
          </div>
          <span className="block text-[10px] text-muted">
            Equivalente a {(parametros.plazoMeses / 12).toFixed(1)} años de proyección
          </span>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Percent className="h-3.5 w-3.5 text-emerald-400" />
            Tasa ISR y PTU del Contribuyente
          </label>
          <div className="flex items-center gap-2">
            <input
              aria-label="Tasa ISR (%)"
              type="number"
              min="1"
              max="35"
              step="1"
              value={parametros.tasaIsrPorcentaje}
              onChange={(e) => updateField('tasaIsrPorcentaje', Number(e.target.value))}
              className="w-24 rounded-xl border border-white/10 bg-surface px-3 py-2.5 font-mono text-base font-bold text-ink focus:border-gold/60 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => updateField('incluirPtu', !parametros.incluirPtu)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                parametros.incluirPtu
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-surface text-muted'
              }`}
            >
              {parametros.incluirPtu ? '✓ Incluye PTU (10%)' : 'Sin PTU (0%)'}
            </button>
          </div>
          <span className="block text-[10px] text-muted">
            Tasa combinada de escudo fiscal:{' '}
            <strong>{parametros.tasaIsrPorcentaje + (parametros.incluirPtu ? 10 : 0)}%</strong> (30%
            PM + 10% PTU)
          </span>
        </div>
      </div>

      {/* 4. Condiciones de Crédito Bancario vs Arrendamiento Puro */}
      <div className="grid grid-cols-1 gap-6 border-t border-white/10 pt-6 md:grid-cols-2">
        {/* Subpanel Crédito */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-surface/40 p-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            Condiciones de Crédito Bancario
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="input-enganche-credito"
                className="block text-[11px] font-semibold text-muted"
              >
                Enganche Inicial (%)
              </label>
              <input
                id="input-enganche-credito"
                type="number"
                min="0"
                max="80"
                step="5"
                value={parametros.engancheCreditoPorcentaje}
                onChange={(e) => updateField('engancheCreditoPorcentaje', Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 font-mono text-sm font-bold text-ink"
              />
              <span className="block text-[10px] text-muted">
                Monto:{' '}
                {formatearMXN(
                  (parametros.valorFacturaSinIva * parametros.engancheCreditoPorcentaje) / 100
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="input-tasa-credito"
                className="block text-[11px] font-semibold text-muted"
              >
                Tasa Anual Crédito (%)
              </label>
              <input
                id="input-tasa-credito"
                type="number"
                min="0"
                max="40"
                step="0.5"
                value={parametros.tasaInteresCreditoAnual}
                onChange={(e) => updateField('tasaInteresCreditoAnual', Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 font-mono text-sm font-bold text-ink"
              />
              <span className="block text-[10px] text-muted">
                Interés deducible en proporción MOI
              </span>
            </div>
          </div>
        </div>

        {/* Subpanel Leasing */}
        <div className="space-y-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-gold">
              Condiciones de Arrendamiento Puro (Leasing)
            </h3>
            <button
              type="button"
              onClick={handleRecalcularRentaMercado}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold text-gold transition hover:bg-gold/20"
            >
              <Calculator className="h-3 w-3" />
              Estimar Renta
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label
                htmlFor="input-renta-leasing"
                className="block text-[11px] font-semibold text-muted"
              >
                Renta Mensual s/IVA ($)
              </label>
              <input
                id="input-renta-leasing"
                type="number"
                min="500"
                step="500"
                value={parametros.rentaMensualLeasingSinIva}
                onChange={(e) => updateField('rentaMensualLeasingSinIva', Number(e.target.value))}
                className="w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 font-mono text-sm font-bold text-gold"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="input-comision-leasing"
                className="block text-[11px] font-semibold text-muted"
              >
                Apertura Inicial (%)
              </label>
              <input
                id="input-comision-leasing"
                type="number"
                min="0"
                max="15"
                step="0.5"
                value={parametros.comisionAperturaLeasingPorcentaje}
                onChange={(e) =>
                  updateField('comisionAperturaLeasingPorcentaje', Number(e.target.value))
                }
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 font-mono text-sm font-bold text-ink"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="input-residual-leasing"
                className="block text-[11px] font-semibold text-muted"
              >
                Valor Residual (%)
              </label>
              <input
                id="input-residual-leasing"
                type="number"
                min="0"
                max="50"
                step="5"
                value={parametros.valorResidualPorcentaje}
                onChange={(e) =>
                  handleCambiarValorOPlazo(
                    parametros.valorFacturaSinIva,
                    parametros.plazoMeses,
                    Number(e.target.value)
                  )
                }
                className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 font-mono text-sm font-bold text-ink"
              />
            </div>
          </div>

          {/* Opción Terminal CFF Art. 15 */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
              Opción Terminal al Cierre del Contrato (CFF Art. 15):
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'compra_residual', label: 'Ejercer Compra Residual' },
                  { id: 'renovacion', label: 'Renovar Unidad Nueva' },
                  { id: 'devolucion', label: 'Devolver Activo' },
                ] as Array<{ id: OpcionTerminalCFF; label: string }>
              ).map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => updateField('opcionTerminal', op.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                    parametros.opcionTerminal === op.id
                      ? 'border-gold bg-gold/20 text-ink'
                      : 'border-white/10 bg-surface/60 text-muted hover:text-ink'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ARK TOOLS — Parámetros del Cálculo de Finiquito/Liquidación
 * Sprint 8 — Componente #1
 *
 * Captura de entrada. NO calcula importes monetarios (eso es del motor).
 * Emite onChange(EntradaFiniquito) en cada modificación válida.
 */

import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../../lib/cn';
import type { EntradaFiniquito, TipoBaja } from '../types';

/** Factor de integración mínimo de ley (año 1: 15d aguinaldo + 12d vacaciones × 25%) */
export const FACTOR_INTEGRACION_MINIMO = 1.049315;

/** Días base para el factor de integración */
export const DIAS_AGUINALDO_LEY = 15;
export const DIAS_VACACIONES_ANIO_1 = 12;
export const PCT_PRIMA_VACACIONAL_LEY = 0.25;

export interface AntiguedadPreview {
  anios: number;
  meses: number;
  dias: number;
  diasTotales: number;
}

interface Props {
  entrada: EntradaFiniquito;
  onChange: (entrada: EntradaFiniquito) => void;
  /** Preview de antigüedad calculado por el ensamblador (opcional) */
  antiguedadPreview?: AntiguedadPreview;
  /** Sugerencia de pre-marcado de prima de antigüedad (>=15 años o liquidación) */
  sugerirPrimaAntiguedad?: boolean;
  /** Errores de validación del motor */
  errores?: Array<{ campo: string; mensaje: string }>;
}

export function ParametrosFiniquitoCard({
  entrada,
  onChange,
  antiguedadPreview,
  sugerirPrimaAntiguedad = false,
  errores = [],
}: Props) {
  const [sdiManual, setSdiManual] = useState(false);
  const [primaAntiguedadManual, setPrimaAntiguedadManual] = useState(false);

  /** Mapa de errores por campo para acceso rápido */
  const errorPorCampo = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of errores) {
      if (!map[e.campo]) map[e.campo] = e.mensaje;
    }
    return map;
  }, [errores]);

  /** Auto-sync del SDI cuando cambia el salario diario y el usuario no lo ha sobreescrito */
  useEffect(() => {
    if (sdiManual) return;
    if (entrada.salarioDiario > 0) {
      const sdiSugerido = redondear(entrada.salarioDiario * FACTOR_INTEGRACION_MINIMO);
      if (Math.abs(sdiSugerido - entrada.sdi) > 0.01) {
        onChange({ ...entrada, sdi: sdiSugerido });
      }
    }
  }, [entrada.salarioDiario, sdiManual]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Pre-marcado inteligente de prima de antigüedad (Art. 162 Fracc. III) */
  useEffect(() => {
    if (primaAntiguedadManual) return;
    const debeEstarMarcada = sugerirPrimaAntiguedad;
    if (debeEstarMarcada !== entrada.incluirPrimaAntiguedad) {
      onChange({ ...entrada, incluirPrimaAntiguedad: debeEstarMarcada });
    }
  }, [sugerirPrimaAntiguedad, primaAntiguedadManual]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Al cambiar a "finiquito", forzar los flags de liquidación a false */
  useEffect(() => {
    if (entrada.tipoBaja === 'finiquito') {
      const cambios: Partial<EntradaFiniquito> = {};
      if (entrada.incluirIndem90Dias) cambios.incluirIndem90Dias = false;
      if (entrada.incluir20DiasAnio) cambios.incluir20DiasAnio = false;
      if (Object.keys(cambios).length > 0) {
        onChange({ ...entrada, ...cambios });
      }
    }
  }, [entrada.tipoBaja]); // eslint-disable-line react-hooks/exhaustive-deps

  const esLiquidacion = entrada.tipoBaja === 'liquidacion';

  const actualizar = <K extends keyof EntradaFiniquito>(campo: K, valor: EntradaFiniquito[K]) => {
    onChange({ ...entrada, [campo]: valor });
  };

  return (
    <div className="rounded-[20px] border border-line bg-surface p-6 shadow-[0_20px_40px_rgba(0,43,127,0.06)] sm:p-8">
      {/* === Encabezado === */}
      <div className="mb-6">
        <h2 className="font-playfair text-2xl font-black tracking-[-0.02em] text-ink sm:text-3xl">
          Parámetros del Cálculo
        </h2>
        <p className="mt-1 font-inter text-sm text-muted">
          Fundamento: LFT Arts. 50, 76, 79, 80, 87, 162 y 486
        </p>
      </div>

      {/* === Tabs Finiquito / Liquidación === */}
      <div className="mb-8">
        <label className="mb-3 block font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Tipo de Cálculo
        </label>
        <div className="grid grid-cols-2 gap-2 rounded-[14px] bg-surface-2 p-1">
          {(['finiquito', 'liquidacion'] as TipoBaja[]).map((tipo) => {
            const activo = entrada.tipoBaja === tipo;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => actualizar('tipoBaja', tipo)}
                className={cn(
                  'rounded-[10px] px-4 py-3 font-inter text-[12px] font-bold uppercase tracking-[0.12em] transition-all duration-150',
                  activo
                    ? 'bg-surface text-ink shadow-[0_2px_8px_rgba(0,43,127,0.10),inset_0_1px_0_#fff]'
                    : 'text-muted hover:text-ink'
                )}
                aria-pressed={activo}
              >
                {tipo === 'finiquito' ? 'Finiquito' : 'Liquidación'}
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-inter text-[11px] text-muted">
          {esLiquidacion
            ? 'Incluye indemnización constitucional y 20 días por año (despido injustificado).'
            : 'Solo prestaciones devengadas. No incluye indemnización.'}
        </p>
      </div>

      {/* === Fechas === */}
      <section className="mb-8">
        <h3 className="mb-4 font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Fechas de la Relación Laboral
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoFecha
            label="Fecha de Ingreso"
            value={entrada.fechaIngreso}
            onChange={(v) => actualizar('fechaIngreso', v)}
            error={errorPorCampo.fechaIngreso}
          />
          <CampoFecha
            label="Fecha de Baja"
            value={entrada.fechaBaja}
            onChange={(v) => actualizar('fechaBaja', v)}
            error={errorPorCampo.fechaBaja}
          />
        </div>
        {antiguedadPreview && antiguedadPreview.diasTotales > 0 && (
          <p className="mt-3 font-inter text-[12px] text-muted">
            Antigüedad:{' '}
            <span className="font-orbitron font-bold tabular-nums text-ink">
              {antiguedadPreview.anios} años, {antiguedadPreview.meses} meses,{' '}
              {antiguedadPreview.dias} días
            </span>{' '}
            <span className="text-muted">
              ({antiguedadPreview.diasTotales.toLocaleString('es-MX')} días totales)
            </span>
          </p>
        )}
      </section>

      {/* === Salarios === */}
      <section className="mb-8">
        <h3 className="mb-4 font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Salarios
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoMoneda
            label="Salario Diario"
            value={entrada.salarioDiario}
            onChange={(v) => actualizar('salarioDiario', v)}
            error={errorPorCampo.salarioDiario}
            hint="Base para aguinaldo, vacaciones y prima vacacional."
          />
          <div>
            <CampoMoneda
              label="Salario Diario Integrado (SDI)"
              value={entrada.sdi}
              onChange={(v) => {
                setSdiManual(true);
                actualizar('sdi', v);
              }}
              error={errorPorCampo.sdi}
              hint={
                sdiManual
                  ? 'Editado manualmente. Base para indemnizaciones (Art. 50 y 89).'
                  : 'Calculado con factor mínimo de ley; editable si existen prestaciones superiores.'
              }
            />
            {sdiManual && (
              <button
                type="button"
                onClick={() => {
                  setSdiManual(false);
                  const sdiSugerido = redondear(entrada.salarioDiario * FACTOR_INTEGRACION_MINIMO);
                  actualizar('sdi', sdiSugerido);
                }}
                className="mt-2 font-inter text-[11px] font-bold uppercase tracking-[0.12em] text-navy hover:text-navy-dark"
              >
                ↺ Restaurar SDI sugerido
              </button>
            )}
          </div>
        </div>
      </section>

      {/* === Conceptos Devengados === */}
      <section className="mb-8">
        <h3 className="mb-4 font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Conceptos Devengados
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CampoNumero
            label="Vacaciones Pendientes"
            suffix="días"
            value={entrada.vacacionesPendientes}
            onChange={(v) => actualizar('vacacionesPendientes', v)}
            min={0}
            step={1}
            error={errorPorCampo.vacacionesPendientes}
          />
          <CampoNumero
            label="Aguinaldo Pendiente"
            suffix="días"
            value={entrada.aguinaldoPendiente}
            onChange={(v) => actualizar('aguinaldoPendiente', v)}
            min={0}
            step={1}
            error={errorPorCampo.aguinaldoPendiente}
          />
          <CampoNumero
            label="Prima Vacacional"
            suffix="%"
            value={entrada.primaVacacionalPct}
            onChange={(v) => actualizar('primaVacacionalPct', v)}
            min={0}
            step={1}
            error={errorPorCampo.primaVacacionalPct}
          />
        </div>
      </section>

      {/* === Incluir en el cálculo === */}
      <section>
        <h3 className="mb-4 font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Incluir en el Cálculo
        </h3>
        <div className="flex flex-col gap-3">
          <ToggleConcepto
            label="Prima de Antigüedad"
            fundamento="Art. 162 LFT"
            descripcion="12 días por año trabajado con tope de 2× SMG."
            checked={entrada.incluirPrimaAntiguedad}
            onChange={(v) => {
              setPrimaAntiguedadManual(true);
              actualizar('incluirPrimaAntiguedad', v);
            }}
          />
          {esLiquidacion && (
            <>
              <ToggleConcepto
                label="Indemnización Constitucional (90 días)"
                fundamento="Art. 50 Fracc. III LFT"
                descripcion="Indemnización por despido injustificado."
                checked={entrada.incluirIndem90Dias}
                onChange={(v) => actualizar('incluirIndem90Dias', v)}
              />
              <ToggleConcepto
                label="20 días por año"
                fundamento="Art. 50 Fracc. II LFT"
                descripcion="Aplica en negativa de reinstalación patronal."
                checked={entrada.incluir20DiasAnio}
                onChange={(v) => actualizar('incluir20DiasAnio', v)}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES LOCALES
   ═══════════════════════════════════════════════════════════════ */

interface CampoFechaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function CampoFecha({ label, value, onChange, error }: CampoFechaProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-[12px] border bg-surface-2 px-4 py-3 font-inter text-sm text-ink outline-none transition-all',
          'focus:border-navy focus:ring-2 focus:ring-navy/10',
          error ? 'border-red-300' : 'border-line'
        )}
      />
      {error && <p className="mt-1 font-inter text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

interface CampoMonedaProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  error?: string;
  hint?: string;
}

function CampoMoneda({ label, value, onChange, error, hint }: CampoMonedaProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-orbitron text-sm font-bold text-muted">
          $
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={cn(
            'w-full rounded-[12px] border bg-surface-2 py-3 pl-9 pr-4 font-orbitron text-sm font-bold tabular-nums text-ink outline-none transition-all',
            'focus:border-navy focus:ring-2 focus:ring-navy/10',
            error ? 'border-red-300' : 'border-line'
          )}
        />
      </div>
      {hint && !error && <p className="mt-1 font-inter text-[11px] text-muted">{hint}</p>}
      {error && <p className="mt-1 font-inter text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

interface CampoNumeroProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}

function CampoNumero({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  error,
}: CampoNumeroProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={cn(
            'w-full rounded-[12px] border bg-surface-2 px-4 py-3 pr-14 font-orbitron text-sm font-bold tabular-nums text-ink outline-none transition-all',
            'focus:border-navy focus:ring-2 focus:ring-navy/10',
            error ? 'border-red-300' : 'border-line'
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-inter text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1 font-inter text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

interface ToggleConceptoProps {
  label: string;
  fundamento: string;
  descripcion: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleConcepto({
  label,
  fundamento,
  descripcion,
  checked,
  onChange,
}: ToggleConceptoProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        'group flex items-start gap-4 rounded-[14px] border p-4 text-left transition-all',
        checked ? 'border-navy/20 bg-navy/[0.03]' : 'border-line bg-surface-2 hover:border-navy/20'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2 transition-all',
          checked
            ? 'border-navy bg-navy text-white'
            : 'border-line bg-surface group-hover:border-navy/40'
        )}
        aria-hidden
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="flex-1">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="font-inter text-sm font-bold text-ink">{label}</span>
          <span className="font-inter text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {fundamento}
          </span>
        </span>
        <span className="mt-1 block font-inter text-[12px] text-muted">{descripcion}</span>
      </span>
    </button>
  );
}

/** Redondeo financiero a 2 decimales (espejo del motor) */
function redondear(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

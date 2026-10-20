/**
 * ARK TOOLS — Calculadora ISN 2026
 * BaseInput
 *
 * Input de base gravable mensual.
 * Muestra el input + un resumen lateral de la tabla para validación.
 */

import { formatearMXN } from '../lib/calcularISN';

interface BaseInputProps {
  /** Valor actual (string para permitir edición libre) */
  value: string;
  /** Callback al cambiar el valor */
  onChange: (value: string) => void;
  /** Suma de conceptos gravados en la tabla (para validación) */
  sumaTabla: number;
  /** Suma de conceptos exentos en la tabla */
  totalExento: number;
}

export function BaseInput({ value, onChange, sumaTabla, totalExento }: BaseInputProps) {
  // Parsear el valor actual para comparar
  const valorNumerico = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;

  // ¿Coincide con la tabla?
  const coincide = Math.abs(valorNumerico - sumaTabla) < 0.01;

  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="p-6">
        {/* Header */}
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          2. Base Gravable Mensual
        </h2>

        {/* Label */}
        <label
          htmlFor="base-gravable"
          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-muted"
        >
          Importe gravado para ISN
        </label>

        {/* Input con $ y badge MXN */}
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-navy">
            $
          </span>

          <input
            id="base-gravable"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-[14px] border-[1.5px] border-navy bg-surface py-3.5 pl-8 pr-16 font-orbitron text-[22px] font-bold tabular-nums tracking-tight text-navy transition placeholder:text-navy/20 focus:outline-none focus:ring-4 focus:ring-gold/20"
            placeholder="0.00"
          />

          {/* Badge MXN */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="rounded-full bg-navy px-2.5 py-1 font-orbitron text-[10px] font-bold tracking-[0.16em] text-white">
              MXN
            </span>
          </div>
        </div>

        {/* Validación: comparación con la tabla */}
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-muted">Suma de percepciones gravadas</span>
          <span
            className={`font-semibold tabular-nums ${coincide ? 'text-muted' : 'text-amber-600'} `}
          >
            Tabla: {formatearMXN(sumaTabla)} {coincide ? '• Coincide' : '• Diferencia'}
          </span>
        </div>

        {/* Resumen lateral: total exento (informativo) */}
        {totalExento > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-[10px] border border-line bg-surface-2 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Exento (no grava ISN)
            </span>
            <span className="font-orbitron text-[13px] font-bold tabular-nums text-muted">
              {formatearMXN(totalExento)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

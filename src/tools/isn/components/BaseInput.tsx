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

export function BaseInput({
  value,
  onChange,
  sumaTabla,
  totalExento,
}: BaseInputProps) {
  // Parsear el valor actual para comparar
  const valorNumerico = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;

  // ¿Coincide con la tabla?
  const coincide = Math.abs(valorNumerico - sumaTabla) < 0.01;

  return (
    <div className="rounded-[20px] bg-surface border border-line overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <h2 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase mb-4">
          2. Base Gravable Mensual
        </h2>

        {/* Label */}
        <label
          htmlFor="base-gravable"
          className="block text-[10px] font-bold tracking-[0.16em] text-muted uppercase mb-2"
        >
          Importe gravado para ISN
        </label>

        {/* Input con $ y badge MXN */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-navy pointer-events-none">
            $
          </span>

          <input
            id="base-gravable"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            inputMode="decimal"
            className="
              w-full rounded-[14px]
              border-[1.5px] border-navy
              bg-surface
              pl-8 pr-16 py-3.5
              font-orbitron font-bold text-[22px] tracking-tight text-navy
              tabular-nums
              placeholder:text-navy/20
              focus:outline-none focus:ring-4 focus:ring-gold/20
              transition
            "
            placeholder="0.00"
          />

          {/* Badge MXN */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-[10px] font-bold tracking-[0.16em] bg-navy text-white rounded-full px-2.5 py-1 font-orbitron">
              MXN
            </span>
          </div>
        </div>

        {/* Validación: comparación con la tabla */}
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="text-muted">
            Suma de percepciones gravadas
          </span>
          <span
            className={`
              font-semibold tabular-nums
              ${coincide ? 'text-muted' : 'text-amber-600'}
            `}
          >
            Tabla: {formatearMXN(sumaTabla)}{' '}
            {coincide ? '• Coincide' : '• Diferencia'}
          </span>
        </div>

        {/* Resumen lateral: total exento (informativo) */}
        {totalExento > 0 && (
          <div className="mt-3 rounded-[10px] bg-surface-2 border border-line px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.16em] font-bold text-muted uppercase">
              Exento (no grava ISN)
            </span>
            <span className="font-orbitron font-bold text-[13px] text-muted tabular-nums">
              {formatearMXN(totalExento)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

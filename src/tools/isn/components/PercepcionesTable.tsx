/**
 * ARK TOOLS — Calculadora ISN 2026
 * PercepcionesTable
 *
 * Tabla editable de conceptos de percepción.
 * Cada renglón tiene: concepto, monto gravado, monto exento.
 * El total de gravados alimenta la base gravable del ISN.
 */

import { Plus, Trash2 } from 'lucide-react';
import { formatearMXN } from '../lib/calcularISN';
import type { ConceptoPercepcion } from '../types';

interface PercepcionesTableProps {
  /** Lista de conceptos */
  conceptos: ConceptoPercepcion[];
  /** Callback al cambiar un monto (id, campo, valor) */
  onChange: (
    id: number,
    campo: 'gravado' | 'exento',
    valor: number
  ) => void;
  /** Callback al cambiar el nombre del concepto */
  onConceptoChange?: (id: number, concepto: string) => void;
  /** Callback al agregar un nuevo concepto */
  onAdd?: () => void;
  /** Callback al eliminar un concepto */
  onRemove?: (id: number) => void;
}

export function PercepcionesTable({
  conceptos,
  onChange,
  onConceptoChange,
  onAdd,
  onRemove,
}: PercepcionesTableProps) {
  // Cálculos derivados
  const totalGravado = conceptos.reduce((sum, c) => sum + (c.gravado || 0), 0);
  const totalExento = conceptos.reduce((sum, c) => sum + (c.exento || 0), 0);

  return (
    <div className="rounded-[20px] bg-surface border border-line overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">
            3. Percepciones del periodo
          </h2>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="
                inline-flex items-center gap-1.5
                text-[10px] font-bold tracking-[0.16em] text-navy
                px-3 py-1.5 rounded-full
                border border-navy/20 hover:border-gold hover:bg-cream/50
                transition uppercase font-orbitron
              "
            >
              <Plus size={12} strokeWidth={2.5} />
              Añadir
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="rounded-[14px] border border-line overflow-hidden">
          {/* Header de tabla */}
          <div className="grid grid-cols-[1fr_90px_90px_36px] bg-navy text-white text-[9px] tracking-[0.16em] font-bold uppercase">
            <div className="px-3 py-2.5">Concepto</div>
            <div className="px-3 py-2.5 text-right">Gravado</div>
            <div className="px-3 py-2.5 text-right">Exento</div>
            <div className="px-1 py-2.5" />
          </div>

          {/* Filas */}
          {conceptos.length === 0 ? (
            <div className="px-3 py-8 text-center text-[12px] text-muted">
              Sin conceptos. Añade uno para comenzar.
            </div>
          ) : (
            conceptos.map((c, index) => (
              <div
                key={c.id}
                className={`
                  grid grid-cols-[1fr_90px_90px_36px] items-center
                  border-t border-line
                  ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-2/60'}
                `}
              >
                {/* Concepto */}
                <div className="px-3 py-2 min-w-0">
                  {onConceptoChange ? (
                    <input
                      type="text"
                      value={c.concepto}
                      onChange={(e) => onConceptoChange(c.id, e.target.value)}
                      className="
                        w-full bg-transparent border border-transparent
                        hover:border-line focus:border-gold
                        rounded-md px-1 py-0.5
                        text-[12px] font-medium text-ink
                        outline-none transition
                      "
                    />
                  ) : (
                    <span className="text-[12px] font-medium text-ink truncate block">
                      {c.concepto}
                    </span>
                  )}
                </div>

                {/* Gravado */}
                <input
                  type="text"
                  inputMode="decimal"
                  value={c.gravado === 0 ? '' : String(c.gravado)}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0;
                    onChange(c.id, 'gravado', valor);
                  }}
                  placeholder="0"
                  className="
                    text-right text-[12px] font-semibold tabular-nums text-navy
                    bg-transparent border border-transparent
                    hover:border-gold/40 focus:border-gold
                    rounded-md px-2 py-1 mr-2
                    outline-none transition
                    font-orbitron
                  "
                />

                {/* Exento */}
                <input
                  type="text"
                  inputMode="decimal"
                  value={c.exento === 0 ? '' : String(c.exento)}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0;
                    onChange(c.id, 'exento', valor);
                  }}
                  placeholder="0"
                  className="
                    text-right text-[12px] tabular-nums text-muted
                    bg-transparent border border-transparent
                    hover:border-navy/20 focus:border-navy/40
                    rounded-md px-2 py-1 mr-2
                    outline-none transition
                    font-orbitron
                  "
                />

                {/* Botón eliminar */}
                <div className="flex justify-center pr-1">
                  {onRemove && conceptos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(c.id)}
                      className="
                        w-6 h-6 rounded-full
                        grid place-items-center
                        text-muted hover:text-red-500
                        hover:bg-red-50
                        transition
                      "
                      aria-label={`Eliminar ${c.concepto}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Footer de la tabla: totales */}
          <div className="grid grid-cols-[1fr_90px_90px_36px] bg-cream border-t-2 border-gold/40 items-center">
            <div className="px-3 py-2.5 text-[11px] font-bold tracking-[0.16em] text-navy uppercase">
              Total
            </div>
            <div className="px-3 py-2.5 text-right font-orbitron font-black text-[13px] text-navy tabular-nums mr-2">
              {formatearMXN(totalGravado)}
            </div>
            <div className="px-3 py-2.5 text-right font-orbitron font-bold text-[13px] text-muted tabular-nums mr-2">
              {formatearMXN(totalExento)}
            </div>
            <div />
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-3 text-[10px] text-muted leading-[1.5]">
          El <strong className="text-navy">gravado</strong> alimenta la base
          del ISN. El <strong className="text-navy">exento</strong> se suma al
          total de percepciones pero no grava.
        </div>
      </div>
    </div>
  );
}

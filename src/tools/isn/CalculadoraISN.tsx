/**
 * ARK TOOLS — Calculadora ISN 2026
 * Componente Principal
 *
 * Ensambla los 4 componentes del Día 3:
 *   1. EstadoSelector  — selección de entidad
 *   2. BaseInput       — input de base gravable
 *   3. PercepcionesTable — tabla editable
 *   4. ResumenISN      — card dorada con total
 *
 * Estado local:
 *   - estado: Estado seleccionado (default CDMX)
 *   - conceptos: ConceptoPercepcion[] (default del día 1)
 *   - baseGravable: string (input manual, sincronizado con tabla)
 *   - toast: mensaje temporal de confirmación
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import {
  EstadoSelector,
  BaseInput,
  PercepcionesTable,
  ResumenISN,
} from './components';
import { CONCEPTOS_DEFAULT, getEstadoById, ESTADO_DEFAULT_ID } from './data/estados';
import { calcularResultadoISN, formatearMXN } from './lib/calcularISN';
import { descargarCSV } from './lib/exportarCSV';
import type { ConceptoPercepcion, Estado } from './types';

interface CalculadoraISNProps {
  /** Callback al volver al dashboard (opcional) */
  onBack?: () => void;
}

export function CalculadoraISN({ onBack }: CalculadoraISNProps) {
  // ─────────────────────────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────────────────────────
  const [estado, setEstado] = useState<Estado>(() =>
    getEstadoById(ESTADO_DEFAULT_ID)
  );
  const [conceptos, setConceptos] = useState<ConceptoPercepcion[]>(
    CONCEPTOS_DEFAULT
  );

  // Base gravable como string para permitir edición libre
  const [baseGravableStr, setBaseGravableStr] = useState<string>(() => {
    const suma = CONCEPTOS_DEFAULT.reduce((s, c) => s + c.gravado, 0);
    return String(suma);
  });

  // Toast de confirmación (para "Copiado" o "Excel generado")
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Cálculo del resultado usando el hook useMemo
  const resultado = useMemo(
    () => calcularResultadoISN(conceptos, estado),
    [conceptos, estado]
  );

  // ─────────────────────────────────────────────────────────────
  // EFECTOS
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Muestra un toast temporal.
   */
  const mostrarToast = useCallback((mensaje: string) => {
    setToast(mensaje);
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 3000);
  }, []);

  /**
   * Actualiza un monto (gravado o exento) de un concepto.
   * También actualiza la base gravable si estamos editando gravados.
   */
  const handleMontoChange = useCallback(
    (id: number, campo: 'gravado' | 'exento', valor: number) => {
      setConceptos((prev) => {
        const nuevos = prev.map((c) =>
          c.id === id ? { ...c, [campo]: valor } : c
        );
        // Si cambió el gravado, sincronizamos la base gravable
        if (campo === 'gravado') {
          const suma = nuevos.reduce((s, c) => s + c.gravado, 0);
          setBaseGravableStr(String(suma));
        }
        return nuevos;
      });
    },
    []
  );

  /**
   * Actualiza el nombre de un concepto.
   */
  const handleConceptoChange = useCallback((id: number, concepto: string) => {
    setConceptos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, concepto } : c))
    );
  }, []);

  /**
   * Añade un nuevo concepto vacío.
   */
  const handleAddConcepto = useCallback(() => {
    setConceptos((prev) => {
      const nuevoId = Math.max(0, ...prev.map((c) => c.id)) + 1;
      return [
        ...prev,
        { id: nuevoId, concepto: 'Nuevo concepto', gravado: 0, exento: 0 },
      ];
    });
  }, []);

  /**
   * Elimina un concepto por ID.
   * No permite eliminar el último (debe quedar al menos uno).
   */
  const handleRemoveConcepto = useCallback((id: number) => {
    setConceptos((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  /**
   * Cambia el estado y actualiza la base gravable.
   */
  const handleEstadoChange = useCallback((nuevoEstado: Estado) => {
    setEstado(nuevoEstado);
  }, []);

  /**
   * Exporta el resultado actual a CSV.
   */
  const handleExport = useCallback(() => {
    descargarCSV({ estado, conceptos, resultado });
    mostrarToast(`✓ Excel generado: ISN ${estado.corto} ${formatearMXN(resultado.isn)}`);
  }, [estado, conceptos, resultado, mostrarToast]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10">
      {/* Botón de volver (opcional) */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="
            mb-6 inline-flex items-center gap-2
            text-[11px] font-bold tracking-[0.16em] uppercase
            text-muted hover:text-navy transition
            font-orbitron
          "
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="font-playfair font-black text-[36px] md:text-[44px] leading-[0.95] tracking-[-0.03em] text-ink">
          Calculadora ISN 2026
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-muted max-w-[64ch] inter font-inter">
          Impuesto Sobre Nómina en los 32 estados. Tasas oficiales 2026,
          cálculo en tiempo real y exportación a Excel.
        </p>
      </header>

      {/* Grid de dos columnas: entrada + resultado */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-start">
        {/* COLUMNA IZQUIERDA: Entradas */}
        <div className="space-y-6 min-w-0">
          <EstadoSelector value={estado} onChange={handleEstadoChange} />

          <BaseInput
            value={baseGravableStr}
            onChange={setBaseGravableStr}
            sumaTabla={resultado.baseGravable}
            totalExento={resultado.totalExento}
          />

          <PercepcionesTable
            conceptos={conceptos}
            onChange={handleMontoChange}
            onConceptoChange={handleConceptoChange}
            onAdd={handleAddConcepto}
            onRemove={handleRemoveConcepto}
          />
        </div>

        {/* COLUMNA DERECHA: Resultado (sticky en desktop) */}
        <div className="lg:sticky lg:top-[88px] space-y-4">
          <ResumenISN
            resultado={resultado}
            estado={estado}
            onExport={handleExport}
          />

          {/* Nota informativa */}
          <div className="rounded-[16px] bg-surface-2 border border-line p-4 text-[11px] leading-[1.5] text-muted">
            <strong className="text-ink">Nota:</strong> Cálculo informativo.
            Las tasas pueden incluir sobretasas estatales (ej. BC, CHIH).
            Verifica retención y fecha de pago en el portal tributario estatal.
            No sustituye asesoría fiscal.
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed bottom-6 right-6 z-50
            rounded-[14px] bg-navy text-white
            px-4 py-3 shadow-[0_12px_32px_rgba(0,43,127,0.3)]
            flex items-center gap-3
            animate-[slideIn_0.3s_ease-out]
          "
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500 grid place-items-center shrink-0">
            <Check size={14} strokeWidth={3} className="text-white" />
          </div>
          <div className="text-[11px] font-medium font-inter">{toast}</div>
        </div>
      )}
    </div>
  );
}

export default CalculadoraISN;

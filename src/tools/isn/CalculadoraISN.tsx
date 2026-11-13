/**
 * ARK LEDGER — Calculadora ISN 2026
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
import { ArrowLeft, Check, Building2, AlertTriangle } from 'lucide-react';
import { EstadoSelector, BaseInput, PercepcionesTable, ResumenISN } from './components';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import { CONCEPTOS_DEFAULT, getEstadoById, ESTADO_DEFAULT_ID } from './data/estados';
import { calcularResultadoISN, formatearMXN } from './lib/calcularISN';
import { descargarCSV } from './lib/exportarCSV';
import { descargarCedulaAafy } from './lib/exportarCedulaAafy';
import type { ConceptoPercepcion, EjercicioISN, Estado, OpcionesISN } from './types';

interface CalculadoraISNProps {
  /** Callback al volver al dashboard (opcional) */
  onBack?: () => void;
}

export function CalculadoraISN({ onBack }: CalculadoraISNProps) {
  // ─────────────────────────────────────────────────────────────
  // ESTADO
  // ─────────────────────────────────────────────────────────────
  const [estado, setEstado] = useState<Estado>(() => getEstadoById(ESTADO_DEFAULT_ID));
  const [conceptos, setConceptos] = useState<ConceptoPercepcion[]>(CONCEPTOS_DEFAULT);
  const [ejercicio, setEjercicio] = useState<EjercicioISN>(2026);
  const [numEmpleados, setNumEmpleados] = useState<number>(15);
  const [esMicroPequena2026, setEsMicroPequena2026] = useState<boolean>(true);
  const [esGobiernoEstatal, setEsGobiernoEstatal] = useState<boolean>(false);
  const [aplica27A, setAplica27A] = useState<boolean>(false);

  // Base gravable como string para permitir edición libre
  const [baseGravableStr, setBaseGravableStr] = useState<string>(() => {
    const suma = CONCEPTOS_DEFAULT.reduce((s, c) => s + c.gravado, 0);
    return String(suma);
  });

  // Toast de confirmación (para "Copiado" o "Excel generado")
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const opcionesISN: OpcionesISN = useMemo(
    () => ({
      ejercicio,
      numEmpleados,
      esMicroPequena2026,
      esGobiernoEstatal,
      aplica27A,
    }),
    [ejercicio, numEmpleados, esMicroPequena2026, esGobiernoEstatal, aplica27A]
  );

  // Cálculo del resultado usando el hook useMemo
  const resultado = useMemo(
    () => calcularResultadoISN(conceptos, estado, opcionesISN),
    [conceptos, estado, opcionesISN]
  );

  const { activeClient } = useExpediente();

  // Auto-hidratar con datos del cliente/empresa activa
  useEffect(() => {
    if (activeClient && activeClient.salario_diario > 0) {
      const nominaMensual = Math.round(activeClient.salario_diario * 30 * 100) / 100;
      setConceptos([
        {
          id: 1,
          concepto: `Nómina (${activeClient.nombre})`,
          gravado: nominaMensual,
          exento: 0,
        },
      ]);
      setBaseGravableStr(String(nominaMensual));
    }
  }, [activeClient]);

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
        const nuevos = prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c));
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
    setConceptos((prev) => prev.map((c) => (c.id === id ? { ...c, concepto } : c)));
  }, []);

  /**
   * Añade un nuevo concepto vacío.
   */
  const handleAddConcepto = useCallback(() => {
    setConceptos((prev) => {
      const nuevoId = Math.max(0, ...prev.map((c) => c.id)) + 1;
      return [...prev, { id: nuevoId, concepto: 'Nuevo concepto', gravado: 0, exento: 0 }];
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

  /**
   * Exporta la Cédula Oficial AAFY (Yucatán 3.75% bruto / 3.0% neto MIPyME 2026).
   */
  const handleExportAafy = useCallback(() => {
    // Worker count REQUIRED for Decreto 147/2025 stimulus claim in 2026 micro/pequeña
    if (
      ejercicio === 2026 &&
      resultado.regimen === 'micro_pequena' &&
      (!numEmpleados || numEmpleados <= 0)
    ) {
      mostrarToast('Worker count is required for Decreto 147 stimulus — enter number of employees');
      return;
    }
    descargarCedulaAafy({
      estado,
      conceptos,
      resultado,
      ejercicio,
      razonSocial: activeClient?.nombre || undefined,
      rfc: activeClient?.rfc || undefined,
      numEmpleados,
      numEmpleadosSubordinados: undefined,
      numEmpleadosAsimilados: undefined,
    });
    mostrarToast(
      `✓ Cédula AAFY generada: Yucatán 3.75% bruto / 3.0% neto MIPyME 2026 (${formatearMXN(resultado.isnNeto)})`
    );
  }, [estado, conceptos, resultado, ejercicio, activeClient, numEmpleados, mostrarToast]);

  const handleCargarDemoYucatan = useCallback(() => {
    setEstado(getEstadoById('YUC'));
    setEjercicio(2026);
    setNumEmpleados(15);
    setEsMicroPequena2026(true);
    setEsGobiernoEstatal(false);
    setAplica27A(false);
    setConceptos([
      {
        id: 1,
        concepto: 'Nómina gravada (15 empleados Pequeña Empresa)',
        gravado: 250000,
        exento: 0,
      },
    ]);
    setBaseGravableStr('250000');
    mostrarToast('✓ Demo Yucatán 2026 cargada: 15 empleados, $250,000 → $7,500 neto');
  }, [mostrarToast]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
      {/* Botón de volver (opcional) */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      {/* Header */}
      <header className="mb-6">
        <h1 className="font-playfair text-[36px] font-black leading-[0.95] tracking-[-0.03em] text-ink md:text-[44px]">
          Calculadora ISN 2026
        </h1>
        <p className="inter mt-3 max-w-[64ch] font-inter text-[14px] leading-[1.6] text-muted">
          Impuesto Sobre Nómina en los 32 estados. Tasas oficiales 2026, cálculo en tiempo real y
          exportación a Excel.
        </p>
      </header>

      {/* Sincronización con Expediente Único (Sprint 9) */}
      <div className="mb-8">
        <ExpedienteToolBanner
          toolId="isn"
          titulo={`Determinación de ISN — ${estado.nombre}`}
          inputs={{ estado: estado.id, baseGravable: baseGravableStr, conceptos }}
          outputs={resultado as unknown as Record<string, unknown>}
        />
      </div>

      {/* Grid de dos columnas: entrada + resultado */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        {/* COLUMNA IZQUIERDA: Entradas */}
        <div className="min-w-0 space-y-6">
          <EstadoSelector value={estado} onChange={handleEstadoChange} />

          {/* Parámetros de Ejercicio y Estímulos (LGHY / Decreto 147/2025) */}
          <div className="rounded-[20px] border border-line bg-surface p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-navy" />
                <span className="font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-navy">
                  Ejercicio, Plantilla y Estímulos Fiscales
                </span>
              </div>
              <button
                type="button"
                onClick={handleCargarDemoYucatan}
                className="rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy transition hover:bg-gold/20"
              >
                Demo YUC 15 emp ($250k)
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="isn-ejercicio"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted"
                >
                  Ejercicio Fiscal
                </label>
                <select
                  id="isn-ejercicio"
                  value={ejercicio}
                  onChange={(e) => setEjercicio(Number(e.target.value) as EjercicioISN)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink focus:border-navy focus:outline-none"
                >
                  <option value={2026}>2026 (Vigente — YUC 3.75%)</option>
                  <option value={2025}>2025 (Histórico — YUC 3.0%)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="isn-empleados"
                  className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted"
                >
                  Número de empleados (0–999)
                </label>
                <input
                  id="isn-empleados"
                  type="number"
                  min={0}
                  max={999}
                  value={numEmpleados}
                  onChange={(e) =>
                    setNumEmpleados(Math.max(0, Math.min(999, Number(e.target.value) || 0)))
                  }
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-orbitron text-sm font-bold text-ink focus:border-navy focus:outline-none"
                />
                <div className="mt-1 text-[10px] text-muted">
                  {numEmpleados >= 1 && numEmpleados <= 10
                    ? 'Microempresa (1–10 trabajadores)'
                    : numEmpleados >= 11 && numEmpleados <= 50
                      ? 'Pequeña empresa (11–50 trabajadores)'
                      : numEmpleados > 50
                        ? 'Mediana / Grande (>50 trabajadores — sin estímulo Decreto 147/2025)'
                        : 'Sin empleados capturados'}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 border-t border-line/60 pt-3.5 text-xs">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={esMicroPequena2026}
                  onChange={(e) => setEsMicroPequena2026(e.target.checked)}
                  disabled={ejercicio !== 2026 || esGobiernoEstatal}
                  className="mt-0.5 h-4 w-4 rounded border-line text-navy focus:ring-navy"
                />
                <span className="text-ink">
                  <strong>Micro / pequeña empresa 2026</strong> (1–50 empleados, Decreto 147/2025:
                  estímulo −0.75%, tasa neta 3.0%)
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={esGobiernoEstatal}
                  onChange={(e) => setEsGobiernoEstatal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-navy focus:ring-navy"
                />
                <span className="text-ink">
                  <strong>Empleado de gobierno estatal</strong> (+1% adicional Art. 24 párr. 2 LGHY
                  → 4.75% bruto; estímulo no confirmado)
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={aplica27A}
                  onChange={(e) => setAplica27A(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-navy focus:ring-navy"
                />
                <span className="text-ink">
                  <strong>Exención 1er año Art. 27-A LGHY</strong> (no acumulable con Decreto
                  147/2025)
                </span>
              </label>

              {estado.id === 'YUC' && esGobiernoEstatal && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                  <span>
                    <strong>Estímulo no confirmado para gobierno estatal:</strong> Se aplica la tasa
                    bruta del 4.75% (3.75% + 1% Art. 24) sin descuento del Decreto 147/2025 hasta
                    confirmación de la AAFY.
                  </span>
                </div>
              )}
            </div>
          </div>

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
        <div className="space-y-4 lg:sticky lg:top-[88px]">
          <ResumenISN
            resultado={resultado}
            estado={estado}
            onExport={handleExport}
            onExportAafy={handleExportAafy}
          />

          {/* Nota informativa */}
          <div className="rounded-[16px] border border-line bg-surface-2 p-4 text-[11px] leading-[1.5] text-muted">
            <strong className="text-ink">Nota:</strong> Cálculo informativo. Las tasas pueden
            incluir sobretasas estatales (ej. BC, CHIH). Verifica retención y fecha de pago en el
            portal tributario estatal. No sustituye asesoría fiscal.
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex animate-[slideIn_0.3s_ease-out] items-center gap-3 rounded-[14px] bg-navy px-4 py-3 text-white shadow-[0_12px_32px_rgba(0,43,127,0.3)]"
        >
          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500">
            <Check size={14} strokeWidth={3} className="text-white" />
          </div>
          <div className="font-inter text-[11px] font-medium">{toast}</div>
        </div>
      )}
    </div>
  );
}

export default CalculadoraISN;

/**
 * ARK LEDGER — Simulador Fiscal: Arrendamiento Puro (Leasing) vs Crédito vs Contado
 * Componente Principal
 *
 * Evalúa simultáneamente:
 *   1. Compra de Contado (Depreciación MOI topada Art. 34 y 36 LISR)
 *   2. Crédito Bancario Tradicional (Depreciación + Intereses en proporción deducible)
 *   3. Arrendamiento Puro / Leasing (Rentas deducibles Art. 28 Fracc. XIII LISR + Opción CFF Art. 15)
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Building2, Scale, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { ParametrosLeasingCard, ResultadoLeasingCard, TablaProyeccionMensual } from './components';
import { PARAMETROS_FISCAL_DEFAULT, compararLeasingFiscal } from './lib/calcularLeasing';
import { descargarCSVComparativaFiscal } from './lib/exportarProyeccion';
import type { ParametrosComparativaFiscal } from './types';

interface CalculadoraLeasingProps {
  onBack?: () => void;
}

export function CalculadoraLeasing({ onBack }: CalculadoraLeasingProps) {
  const [parametros, setParametros] =
    useState<ParametrosComparativaFiscal>(PARAMETROS_FISCAL_DEFAULT);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const resultado = useMemo(() => compararLeasingFiscal(parametros), [parametros]);

  const handleDescargarExcel = useCallback(() => {
    descargarCSVComparativaFiscal(resultado);
    showToast('Cédula comparativa fiscal descargada en CSV para Excel');
  }, [resultado, showToast]);

  return (
    <div className="mx-auto max-w-[1280px] space-y-10 px-6 py-12 md:px-10">
      {/* Botón Volver */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          VOLVER AL DASHBOARD
        </button>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="orbitron font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              LISR ARTS. 28 XIII, 34, 36 II • CFF ART. 15
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-muted">
              Planeación Patrimonial y Deducción de Activos
            </span>
          </div>
          <h1 className="mt-2 font-playfair text-3xl font-black tracking-tight text-ink md:text-5xl">
            Simulador Fiscal: Leasing vs Crédito vs Contado
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Compara el costo financiero real después de impuestos (ISR y PTU), la proporción de IVA
            acreditable (Art. 5 LIVA) y el impacto en liquidez al adquirir automóviles utilitarios,
            híbridos/eléctricos, equipo de cómputo o maquinaria industrial.
          </p>
        </div>
      </div>

      {/* Panel de Parámetros del Activo y Financiamiento */}
      <section className="bg-surface-raised/40 space-y-6 rounded-2xl border border-white/10 p-6 shadow-xl md:p-8">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Building2 className="h-5 w-5 text-gold" />
          <h2 className="font-playfair text-xl font-bold text-ink">
            Configuración del Activo, Tasa y Perfil Fiscal
          </h2>
        </div>

        <ParametrosLeasingCard parametros={parametros} onChange={setParametros} />
      </section>

      {/* Dictamen y Tarjetas Comparativas Tripartitas */}
      <section>
        <ResultadoLeasingCard resultado={resultado} onDescargarExcel={handleDescargarExcel} />
      </section>

      {/* Tabla Anualizada Comparativa */}
      <section>
        <TablaProyeccionMensual resultado={resultado} />
      </section>

      {/* Badges de Garantía Normativa */}
      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-gold" />
          <span>Topes Oficiales LISR ($175k / $250k MOI y $200 / $285 diarios)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Proporción de IVA Acreditable conforme al Art. 5 Fracc. I LIVA</span>
        </div>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-gold" />
          <span>Cédula Comparativa Exportable a Excel (UTF-8 BOM)</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="animate-fadeIn fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-gold/50 bg-navy px-4 py-3 text-xs font-medium text-ink shadow-2xl shadow-gold/20">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default CalculadoraLeasing;

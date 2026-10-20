/**
 * ARK TOOLS — Calculadora de Leasing y MRR para Despachos Contables
 * Componente Principal
 *
 * Modelo de negocio:
 *   - $500 Setup / Onboarding inicial por cliente
 *   - $2,500 Renta mensual recurrente por cliente
 *
 * Calcula MRR, ARR, LTV y proyección mes a mes para 12, 24 o 36 meses.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Building2, TrendingUp, ShieldCheck, DollarSign } from 'lucide-react';
import { ParametrosLeasingCard, ResultadoLeasingCard, TablaProyeccionMensual } from './components';
import { PARAMETROS_DEFAULT, proyectarMeses, calcularResumenLeasing } from './lib/calcularLeasing';
import { descargarCSVProyeccion } from './lib/exportarProyeccion';
import type { ParametrosLeasing } from './types';

interface CalculadoraLeasingProps {
  onBack?: () => void;
}

export function CalculadoraLeasing({ onBack }: CalculadoraLeasingProps) {
  const [parametros, setParametros] = useState<ParametrosLeasing>(PARAMETROS_DEFAULT);
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

  // Proyección reactiva
  const proyeccion = useMemo(() => proyectarMeses(parametros), [parametros]);

  const resumen = useMemo(
    () => calcularResumenLeasing(parametros, proyeccion),
    [parametros, proyeccion]
  );

  const handleDescargarExcel = useCallback(() => {
    descargarCSVProyeccion(proyeccion, resumen);
    showToast('Proyección financiera descargada en CSV para Excel');
  }, [proyeccion, resumen, showToast]);

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
              MODELO DE NEGOCIO SAAS
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-muted">Despachos & Firmas Contables</span>
          </div>
          <h1 className="mt-2 font-playfair text-3xl font-black tracking-tight text-ink md:text-5xl">
            Calculadora de Leasing y MRR
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Proyecta los ingresos de tu despacho con el modelo de activación accesible ($500 setup)
            y retención recurrente ($2,500 renta mensual). Simula flujo de caja, ingresos anuales y
            valor de por vida del cliente (LTV).
          </p>
        </div>
      </div>

      {/* Tarjeta de Métricas Clave */}
      <section>
        <ResultadoLeasingCard
          resumen={resumen}
          plazoMeses={parametros.plazoMeses}
          onDescargarExcel={handleDescargarExcel}
        />
      </section>

      {/* Panel de Parámetros */}
      <section className="bg-surface-raised/40 space-y-6 rounded-2xl border border-white/10 p-6 shadow-xl md:p-8">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Building2 className="h-5 w-5 text-gold" />
          <h2 className="font-playfair text-xl font-bold text-ink">
            Ajuste de Variables y Supuestos del Negocio
          </h2>
        </div>

        <ParametrosLeasingCard parametros={parametros} onChange={setParametros} />
      </section>

      {/* Tabla Cronológica */}
      <section>
        <TablaProyeccionMensual proyeccion={proyeccion} resumen={resumen} />
      </section>

      {/* Badges de Garantía */}
      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>Fórmulas de Cohorte con Churn Realista</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gold" />
          <span>Ingreso Recurrente Predecible (MRR & ARR)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-gold" />
          <span>Exportable a Excel para Plan de Negocios</span>
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

/**
 * ARK TOOLS — Modal de Onboarding y Quickstart (Aha! Moment en 60s)
 *
 * Recibe a los usuarios recién registrados para:
 * 1. Explicar el valor central: Expediente Único + Cálculos Oficiales + Sellado SHA-256.
 * 2. Permitir probar inmediatamente con una Empresa y Trabajador Demo precargados (zero data friction).
 * 3. O bien dirigir al usuario directamente a la herramienta que necesita resolver hoy.
 */

import { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Calculator,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Play,
  Scale,
} from 'lucide-react';
import type { ToolId } from '@/App';
import { GlassButton } from '@/components/ui/GlassButton';
import { BadgeGold } from '@/components/ui/BadgeGold';

interface OnboardingQuickstartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDemo: () => void;
  onSelectTool: (toolId: ToolId) => void;
}

export function OnboardingQuickstartModal({
  isOpen,
  onClose,
  onStartDemo,
  onSelectTool,
}: OnboardingQuickstartModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      window.localStorage.setItem('ark_onboarding_completed', 'true');
    }
    onClose();
  };

  const handleStartDemo = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ark_onboarding_completed', 'true');
    }
    onStartDemo();
    onClose();
  };

  const handleGoToTool = (toolId: ToolId) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ark_onboarding_completed', 'true');
    }
    onSelectTool(toolId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop con blur */}
      <div
        className="fixed inset-0 bg-navy/60 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Contenedor Modal */}
      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
        {/* Barra superior de acento */}
        <div className="h-1.5 w-full bg-gradient-to-r from-navy via-gold to-navy" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar modal de bienvenida"
          className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <BadgeGold size="sm">
                <Sparkles size={11} className="mr-1 inline text-navy" />
                Bienvenido a ARK TOOLS
              </BadgeGold>
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
                DOF 2026 Vigente
              </span>
            </div>

            <h2
              id="onboarding-title"
              className="font-playfair text-2xl font-black tracking-tight text-ink sm:text-3xl"
            >
              Tus cálculos fiscales, respaldados con evidencia inmutable.
            </h2>

            <p className="font-inter text-xs leading-relaxed text-muted sm:text-sm">
              ARK TOOLS conecta todas tus herramientas fiscales y de nómina a través del{' '}
              <strong className="text-ink">Expediente Único</strong>. Cada cálculo genera un Papel
              de Trabajo oficial sellado con <strong className="text-navy">hash SHA-256</strong> y
              código QR para auditorías del SAT e IMSS.
            </p>
          </div>

          {/* Cards de Opciones */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* OPCIÓN 1: CASO DEMO (RECOMENDADO) */}
            <div className="relative flex flex-col justify-between rounded-xl border-2 border-gold/60 bg-gradient-to-b from-gold/10 to-transparent p-5 transition-all hover:border-gold">
              <div className="absolute -top-2.5 right-4 rounded-full bg-gold px-2.5 py-0.5 font-orbitron text-[9px] font-extrabold uppercase tracking-widest text-navy shadow-sm">
                Recomendado
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-navy">
                  <div className="rounded-lg bg-navy p-2 text-gold">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-orbitron text-xs font-bold uppercase tracking-wider text-ink">
                    Explorar con Caso Demo
                  </h3>
                </div>

                <p className="font-inter text-xs text-muted">
                  Carga una empresa de muestra (
                  <strong className="text-ink">Innovación Contable S.A.</strong>) y un trabajador
                  activo con salario y factor de integración oficial 2026.
                </p>

                <ul className="space-y-1.5 font-inter text-[11px] text-ink/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                    <span>Nómina Rápida precargada</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                    <span>Generación de Papel de Trabajo SHA-256</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                    <span>Zero riesgo: sin ingresar datos confidenciales</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5">
                <GlassButton
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={handleStartDemo}
                  className="group flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play
                    size={12}
                    className="fill-navy text-navy transition-transform group-hover:scale-110"
                  />
                  <span>Probar Caso Demo (1 Clic)</span>
                </GlassButton>
              </div>
            </div>

            {/* OPCIÓN 2: RESOLVER CASO URGENTE */}
            <div className="flex flex-col justify-between rounded-xl border border-line bg-surface-2/60 p-5 transition-all hover:border-navy/40">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-ink">
                  <div className="rounded-lg bg-navy/10 p-2 text-navy">
                    <Calculator size={20} />
                  </div>
                  <h3 className="font-orbitron text-xs font-bold uppercase tracking-wider text-ink">
                    Resolver Caso Real Hoy
                  </h3>
                </div>

                <p className="font-inter text-xs text-muted">
                  Si ya tienes los datos a la mano, elige la herramienta prioritaria para comenzar
                  de inmediato:
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleGoToTool('nomina')}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-left font-inter text-xs font-medium text-ink transition-colors hover:border-gold hover:bg-gold/5"
                  >
                    <span className="flex items-center gap-2">
                      <Calculator size={14} className="text-navy" />
                      <span>Nómina & Finiquitos</span>
                    </span>
                    <ArrowRight size={12} className="text-muted" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoToTool('resico')}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-left font-inter text-xs font-medium text-ink transition-colors hover:border-gold hover:bg-gold/5"
                  >
                    <span className="flex items-center gap-2">
                      <Scale size={14} className="text-navy" />
                      <span>Cálculo RESICO PF & ISN</span>
                    </span>
                    <ArrowRight size={12} className="text-muted" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoToTool('xml-excel')}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-left font-inter text-xs font-medium text-ink transition-colors hover:border-gold hover:bg-gold/5"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet size={14} className="text-navy" />
                      <span>Conversor & Validador XML SAT</span>
                    </span>
                    <ArrowRight size={12} className="text-muted" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 font-inter text-xs text-muted">
            <label className="flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-line text-navy accent-navy focus:ring-navy"
              />
              <span>No mostrar esta bienvenida automáticamente al iniciar sesión</span>
            </label>

            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer text-xs font-semibold text-muted hover:text-ink hover:underline"
            >
              Omitir y explorar libremente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

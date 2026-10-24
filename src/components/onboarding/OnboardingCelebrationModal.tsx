/**
 * ARK LEDGER — Modal de Celebración de Primer Cálculo Blindado (Cierre de Onboarding)
 *
 * Se dispara cuando el usuario archiva un cálculo en modo demo / sandbox para:
 * 1. Celebrar el logro: primer cálculo blindado con hash SHA-256 oficial DOF 2026.
 * 2. Cerrar el loop de onboarding invitándolo a crear su primer cliente real o invitar a su equipo.
 */

import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  X,
  Building2,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import { BadgeGold } from '@/components/ui/BadgeGold';

interface OnboardingCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPapel: () => void;
  onStartRealClient: () => void;
  hash?: string | null;
}

export function OnboardingCelebrationModal({
  isOpen,
  onClose,
  onOpenPapel,
  onStartRealClient,
  hash,
}: OnboardingCelebrationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyHash = () => {
    if (!hash) return;
    void navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor Modal */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-gold/50 bg-surface shadow-2xl">
        {/* Barra superior dorada */}
        <div className="h-2 w-full bg-gradient-to-r from-gold via-amber-300 to-gold" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de felicitación"
          className="absolute right-4 top-4 cursor-pointer rounded-full p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink"
        >
          <X size={18} />
        </button>

        <div className="space-y-6 p-6 sm:p-8">
          {/* Header con icono festivo */}
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gold/40 bg-gold/15 text-gold-dark shadow-sm">
              <ShieldCheck size={32} className="text-navy" />
            </div>

            <div className="pt-2">
              <BadgeGold size="sm" className="mx-auto">
                <Sparkles size={11} className="mr-1 inline text-navy" />
                ¡Cálculo Blindado con Éxito!
              </BadgeGold>
            </div>

            <h2
              id="celebration-title"
              className="font-playfair text-2xl font-black tracking-tight text-ink sm:text-3xl"
            >
              Has generado tu primer Papel de Trabajo oficial.
            </h2>

            <p className="mx-auto max-w-md font-inter text-xs leading-relaxed text-muted sm:text-sm">
              Este cálculo ya cuenta con un{' '}
              <strong className="text-navy">Sello SHA-256 inmutable</strong> y código QR para
              comprobación pericial ante cualquier auditor del SAT o IMSS.
            </p>
          </div>

          {/* Hash preview */}
          {hash && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 p-3 font-mono text-xs">
              <div className="truncate">
                <span className="mr-1 font-bold text-muted">HASH:</span>
                <span className="text-ink">{hash}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyHash}
                title="Copiar hash SHA-256"
                className="shrink-0 cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-ink"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          )}

          {/* Checklist de lo demostrado */}
          <div className="space-y-2 rounded-xl border border-line/60 bg-white/70 p-4 font-inter text-xs text-ink/90">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>
                Cero capturas manuales repetidas gracias al <strong>Expediente Único</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>
                Valores y tarifas actualizadas con el <strong>DOF 2026 oficial</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>Cédula verificable públicamente por clientes o auditores.</span>
            </div>
          </div>

          {/* Acciones de conversión */}
          <div className="space-y-2 pt-2">
            <GlassButton
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                onClose();
                onStartRealClient();
              }}
              className="flex items-center justify-center gap-2 shadow-sm"
            >
              <Building2 size={14} />
              <span>Registrar mi Primer Cliente Real</span>
              <ArrowRight size={14} />
            </GlassButton>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPapel();
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line bg-surface-2 py-2.5 font-orbitron text-xs font-semibold text-navy transition-colors hover:border-gold hover:bg-gold/10"
            >
              <QrCode size={14} className="text-gold-dark" />
              <span>Ver Cédula Oficial con QR y `@media print`</span>
            </button>
          </div>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[11px] font-semibold text-muted hover:text-ink hover:underline"
            >
              Seguir explorando en modo demostración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

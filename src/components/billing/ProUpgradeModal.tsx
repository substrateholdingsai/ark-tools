/**
 * ARK LEDGER — Modal Institucional de Upgrade: Plan Despacho Pro
 *
 * Se presenta al usuario cuando intenta exportar cédulas oficiales Carta con QR,
 * layouts bancarios masivos o al superar el límite de cortesía en Noah AI.
 */

import {
  Sparkles,
  CheckCircle2,
  Lock,
  ExternalLink,
  X,
  FileText,
  Bot,
  Layers,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';

export interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  paymentUrl?: string;
}

export function ProUpgradeModal({
  isOpen,
  onClose,
  reason = 'Desbloquea exportaciones ilimitadas y sellado criptográfico oficial',
  paymentUrl = 'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65',
}: ProUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-300/60 bg-surface p-6 shadow-2xl sm:p-8">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
            <Sparkles className="h-3 w-3 text-gold-dark" />
            Plan Despacho Pro
          </span>
          <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 font-mono text-[10px] text-muted">
            100% Deducible
          </span>
        </div>

        <h3 className="mt-3 text-2xl font-black tracking-tight text-navy">
          Eleva tu Práctica Contable
        </h3>

        {/* Motivo de activación */}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="leading-relaxed">
            <span className="font-bold">Función Pro requerida: </span>
            <span>{reason}</span>
          </div>
        </div>

        {/* Grid de Beneficios */}
        <div className="mt-5 space-y-2.5 text-xs text-ink">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold text-navy">
                Cédulas Oficiales Ilimitadas (Carta PDF):{' '}
              </span>
              <span className="text-muted">
                Sellado digital inmutable SHA-256 y Código QR de verificación pública.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
            <div>
              <span className="font-bold text-navy">Noah AI Consultor Ilimitado: </span>
              <span className="text-muted">
                Consultas sin corte mensual con Llama 3.3 70B y 13 tools fiscales.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
            <div>
              <span className="font-bold text-navy">Layouts de Dispersión Bancaria: </span>
              <span className="text-muted">
                Generador de archivos batch para dispersar nómina en BBVA, Banamex y Santander.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
            <div>
              <span className="font-bold text-navy">Cruce Reloj Checador (LFT Art. 132): </span>
              <span className="text-muted">
                Auditoría masiva de CFDI Nómina vs asistencia y horas extras.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-henequen-terra" />
            <div>
              <span className="font-bold text-navy">Cobranza 1-Click de Honorarios: </span>
              <span className="text-muted">
                Asistente de voz con IA y WhatsApp para cobrar honorarios a tus clientes.
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Precio */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-surface-2 p-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Inversión Mensual
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-black text-navy">$399</span>
              <span className="text-xs font-semibold text-muted">MXN / mes</span>
            </div>
            <div className="text-[10px] text-muted">
              Sin plazos forzosos · Cancela cuando quieras
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Garantía DOF</span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shadow-xs inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 font-orbitron text-xs font-bold text-white transition hover:bg-navy-dark"
          >
            <Sparkles className="h-4 w-4 text-gold" />
            <span>SUSCRIBIRSE PRO ($399 MXN)</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-3 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            Continuar en Modo Libre
          </button>
        </div>
      </div>
    </div>
  );
}

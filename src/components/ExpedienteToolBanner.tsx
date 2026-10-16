/**
 * ARK TOOLS — Banner de Sincronización con Expediente Único (Sprint 9)
 *
 * Se monta en la parte superior de cada calculadora para:
 * 1. Confirmar el cliente/trabajador activo vinculado.
 * 2. Permitir archivar el cálculo con un solo clic, generando hash SHA-256 inmutable y versión DOF.
 * 3. Notificar al usuario cuando el cálculo ya quedó archivado y sellado.
 */

import { useState } from 'react';
import {
  FolderKanban,
  ShieldCheck,
  Check,
  Building2,
  User,
  Briefcase,
  Copy,
  Sparkles,
} from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';

interface ExpedienteToolBannerProps {
  toolId: string;
  titulo: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  disabled?: boolean;
}

export function ExpedienteToolBanner({
  toolId,
  titulo,
  inputs,
  outputs,
  disabled = false,
}: ExpedienteToolBannerProps) {
  const { activeClient, saveCalculoExpediente } = useExpediente();
  const [isSaving, setIsSaving] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [isDeduplicated, setIsDeduplicated] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeClient) {
    return (
      <div className="rounded-xl border border-line/80 bg-surface-2/60 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted font-inter">
        <div className="flex items-center gap-2">
          <FolderKanban size={15} className="text-gold shrink-0" />
          <span>
            <strong className="text-ink font-semibold">Modo libre:</strong> Los cálculos no se guardarán en ningún expediente. Selecciona o crea un cliente en la barra superior para archivar este papel de trabajo con sello SHA-256.
          </span>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (disabled || isSaving) return;
    setIsSaving(true);
    try {
      const res = await saveCalculoExpediente(toolId, titulo, inputs, outputs, false);
      if (res) {
        setLastHash(res.expediente.input_hash);
        setIsDeduplicated(Boolean(res.deduplicated));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyHash = () => {
    if (!lastHash) return;
    void navigator.clipboard.writeText(lastHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-navy/20 bg-navy/5 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-inter shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center shrink-0">
          {activeClient.tipo === 'empresa' ? (
            <Building2 size={16} />
          ) : activeClient.tipo === 'persona_fisica' ? (
            <Briefcase size={16} />
          ) : (
            <User size={16} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-ink truncate max-w-[280px]">
              {activeClient.nombre}
            </span>
            <span className="px-2 py-0.2 rounded-full bg-navy/10 text-navy font-orbitron font-bold text-[9px] uppercase">
              {activeClient.tipo}
            </span>
            {activeClient.rfc && (
              <span className="text-[11px] font-mono text-muted">
                {activeClient.rfc}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
            <ShieldCheck size={13} className="text-gold shrink-0" />
            <span>Vinculado a este expediente. Los parámetros y resultados se archivan auditables.</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {lastHash ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
              <Check size={13} />
              <span>{isDeduplicated ? 'Archivado y vigente' : 'Sellado con éxito'}</span>
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              title="Copiar sello SHA-256"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-line hover:border-navy text-muted hover:text-ink text-[10px] font-mono cursor-pointer"
            >
              <Copy size={11} />
              <span>{lastHash.slice(0, 8)}...</span>
              {copied && <span className="text-emerald-600 font-bold">✓</span>}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-navy/90 disabled:opacity-50 text-xs font-semibold cursor-pointer shadow-2xs transition-all"
          >
            <Sparkles size={13} className="text-gold" />
            <span>{isSaving ? 'Sellando...' : 'Archivar en Expediente'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

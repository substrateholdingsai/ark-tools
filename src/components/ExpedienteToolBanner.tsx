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
  FileText,
} from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { useOptionalAuth } from '@/context/AuthContext';
import type { ExpedienteRecord } from '@/lib/apiClient';
import { PapelDeTrabajoModal } from './PapelDeTrabajoModal';

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
  const auth = useOptionalAuth();
  const tenantName = auth?.tenantName || 'Despacho Contable Especializado';
  const [isSaving, setIsSaving] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [lastExpediente, setLastExpediente] = useState<ExpedienteRecord | null>(null);
  const [isDeduplicated, setIsDeduplicated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPapel, setShowPapel] = useState(false);

  if (!activeClient) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/80 bg-surface-2/60 px-4 py-2.5 font-inter text-xs text-muted">
        <div className="flex items-center gap-2">
          <FolderKanban size={15} className="shrink-0 text-gold" />
          <span>
            <strong className="font-semibold text-ink">Modo libre:</strong> Los cálculos no se
            guardarán en ningún expediente. Selecciona o crea un cliente en la barra superior para
            archivar este papel de trabajo con sello SHA-256.
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
        setLastExpediente(res.expediente);
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
    <>
      <div className="shadow-2xs flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/20 bg-navy/5 px-4 py-3 font-inter text-xs">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
            {activeClient.tipo === 'empresa' ? (
              <Building2 size={16} />
            ) : activeClient.tipo === 'persona_fisica' ? (
              <Briefcase size={16} />
            ) : (
              <User size={16} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="max-w-[280px] truncate font-bold text-ink">
                {activeClient.nombre}
              </span>
              <span className="py-0.2 rounded-full bg-navy/10 px-2 font-orbitron text-[9px] font-bold uppercase text-navy">
                {activeClient.tipo}
              </span>
              {activeClient.rfc && (
                <span className="font-mono text-[11px] text-muted">{activeClient.rfc}</span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck size={13} className="shrink-0 text-gold" />
              <span>
                Vinculado a este expediente. Los parámetros y resultados se archivan auditables.
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {lastHash ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                <Check size={13} />
                <span>{isDeduplicated ? 'Archivado y vigente' : 'Sellado con éxito'}</span>
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                title="Copiar sello SHA-256"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 font-mono text-[10px] text-muted hover:border-navy hover:text-ink"
              >
                <Copy size={11} />
                <span>{lastHash.slice(0, 8)}...</span>
                {copied && <span className="font-bold text-emerald-600">✓</span>}
              </button>
              {lastExpediente && (
                <button
                  type="button"
                  onClick={() => setShowPapel(true)}
                  className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy px-3 py-1 text-[11px] font-semibold text-white hover:bg-navy/90"
                >
                  <FileText size={13} className="text-gold" />
                  <span>Papel de Trabajo (PDF)</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled || isSaving}
              onClick={handleSave}
              className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-navy/90 disabled:opacity-50"
            >
              <Sparkles size={13} className="text-gold" />
              <span>{isSaving ? 'Sellando...' : 'Archivar en Expediente'}</span>
            </button>
          )}
        </div>
      </div>

      {showPapel && lastExpediente && (
        <PapelDeTrabajoModal
          isOpen={showPapel}
          onClose={() => setShowPapel(false)}
          despachoName={tenantName || 'Despacho Contable Especializado'}
          client={activeClient}
          expediente={lastExpediente}
        />
      )}
    </>
  );
}

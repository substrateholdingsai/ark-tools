/**
 * ARK TOOLS — Modal / Vista Pública de Verificación de Autenticidad (Sprint 10)
 *
 * Pantalla que se abre al escanear el Código QR del Papel de Trabajo
 * o al consultar un hash SHA-256 en la plataforma.
 * Valida de forma matemática e inalterable la legitimidad del dictamen ante SAT, IMSS o Tribunales.
 */

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Check,
  Copy,
  X,
  Printer,
  Scale,
  FileText,
} from 'lucide-react';
import { apiClient, type CertificadoVerificacion } from '@/lib/apiClient';

interface Props {
  hash: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VerificacionPublicaModal({ hash, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [certificado, setCertificado] = useState<CertificadoVerificacion | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !hash) return;
    setLoading(true);
    setErrorMsg(null);

    void apiClient.expedientes
      .verify(hash)
      .then((res) => {
        if (res.verified && res.certificado) {
          setCertificado(res.certificado);
        } else {
          setErrorMsg(
            res.message || 'El sello digital no coincide con ningún expediente registrado.'
          );
        }
      })
      .catch((err) => {
        setErrorMsg(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [hash, isOpen]);

  if (!isOpen) return null;

  const copyHash = () => {
    void navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-in fade-in zoom-in-95 max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-2xl border border-line bg-white p-6 font-inter shadow-2xl duration-150">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-navy/15 bg-navy/5 text-navy">
              <Scale size={18} className="text-gold" />
            </div>
            <div>
              <h3 className="font-playfair text-lg font-black text-ink">
                Verificación de Autenticidad Legal
              </h3>
              <p className="text-[11px] text-muted">
                Auditoría Criptográfica de Papel de Trabajo · ARK SYSTEMS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
            <p className="text-xs text-muted">Validando sello SHA-256 en Cloudflare D1...</p>
          </div>
        ) : errorMsg || !certificado ? (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600">
              <ShieldAlert size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="font-playfair text-lg font-bold text-red-950">
                Dictamen No Verificado
              </h4>
              <p className="mx-auto max-w-md text-xs text-red-700">
                {errorMsg ||
                  'El hash no corresponde a ningún cálculo registrado en el sistema o fue manipulado.'}
              </p>
            </div>
            <div className="break-all rounded-xl border border-line bg-surface-2 p-3 font-mono text-[11px] text-muted">
              Hash consultado: {hash}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Banner de Verificación Exitosa */}
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="block font-orbitron text-xs font-bold uppercase tracking-wide text-emerald-900">
                  Dictamen Auténtico e Inalterado
                </span>
                <p className="mt-0.5 text-xs text-emerald-800">
                  Este cálculo fue emitido oficialmente y sellado de forma inmutable con tecnología
                  SHA-256.
                </p>
              </div>
            </div>

            {/* Metadatos del Certificado */}
            <p className="text-xs text-muted">
              La verificación pública confirma el sello sin exponer datos personales ni resultados
              del expediente.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 rounded-xl border border-line bg-surface-2 p-3">
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
                  Herramienta
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <FileText size={13} className="shrink-0 text-navy" />
                  <span className="truncate">{certificado.titulo || certificado.tool_id}</span>
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-line bg-surface-2 p-3">
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
                  Fecha de Sellado
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <Calendar size={13} className="shrink-0 text-navy" />
                  <span>
                    {new Date(certificado.created_at).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-line bg-surface-2 p-3">
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
                  Normativa DOF Vigente
                </span>
                <p className="truncate font-mono text-[10px] font-semibold text-navy">
                  {certificado.catalog_version}
                </p>
                <p className="text-[10px] font-medium text-emerald-700">UMA & SMG Oficiales</p>
              </div>
            </div>

            {/* Hash SHA-256 inmutable */}
            <div className="space-y-1 rounded-xl border border-line bg-white p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-ink">
                  Sello Criptográfico Inmutable (SHA-256):
                </span>
                <button
                  type="button"
                  onClick={copyHash}
                  className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-navy hover:underline"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <div className="break-all rounded-lg border border-line/60 bg-surface-2 p-2 font-mono text-[11px] text-muted">
                {certificado.input_hash}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-mono text-[10px] text-muted">
            ARK SOVEREIGN VERIFICATION · SHA-256 D1
          </span>
          <div className="flex items-center gap-2">
            {certificado && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-navy"
              >
                <Printer size={13} />
                <span>Imprimir Constancia</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

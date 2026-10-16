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
  Building2,
  Calendar,
  Check,
  Copy,
  X,
  Printer,
  Scale,
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
          setErrorMsg(res.message || 'El sello digital no coincide con ningún expediente registrado.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-line p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto font-inter">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy/5 border border-navy/15 flex items-center justify-center text-navy shrink-0">
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
            className="p-1.5 rounded-lg hover:bg-black/5 text-muted hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted">Validando sello SHA-256 en Cloudflare D1...</p>
          </div>
        ) : errorMsg || !certificado ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="font-playfair text-lg font-bold text-red-950">
                Dictamen No Verificado
              </h4>
              <p className="text-xs text-red-700 max-w-md mx-auto">
                {errorMsg || 'El hash no corresponde a ningún cálculo registrado en el sistema o fue manipulado.'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-2 border border-line text-[11px] font-mono text-muted break-all">
              Hash consultado: {hash}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Banner de Verificación Exitosa */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span className="font-orbitron font-bold text-xs text-emerald-900 uppercase tracking-wide block">
                  Dictamen Auténtico e Inalterado
                </span>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Este cálculo fue emitido oficialmente y sellado de forma inmutable con tecnología SHA-256.
                </p>
              </div>
            </div>

            {/* Metadatos del Certificado */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted font-orbitron tracking-wider">
                  Despacho Emisor
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <Building2 size={13} className="text-navy shrink-0" />
                  <span className="truncate">{certificado.despacho}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted font-orbitron tracking-wider">
                  Fecha de Sellado
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  <Calendar size={13} className="text-navy shrink-0" />
                  <span>
                    {new Date(certificado.created_at).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted font-orbitron tracking-wider">
                  Sujeto / Trabajador
                </span>
                <p className="font-semibold text-ink truncate">{certificado.cliente.nombre}</p>
                {certificado.cliente.rfc && (
                  <p className="text-[10px] font-mono text-muted">RFC: {certificado.cliente.rfc}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted font-orbitron tracking-wider">
                  Normativa DOF Vigente
                </span>
                <p className="font-mono text-[10px] text-navy font-semibold truncate">
                  {certificado.catalog_version}
                </p>
                <p className="text-[10px] text-emerald-700 font-medium">UMA & SMG Oficiales</p>
              </div>
            </div>

            {/* Hash SHA-256 inmutable */}
            <div className="p-3 rounded-xl bg-white border border-line space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-ink">Sello Criptográfico Inmutable (SHA-256):</span>
                <button
                  type="button"
                  onClick={copyHash}
                  className="text-xs text-navy font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <div className="font-mono text-[11px] text-muted break-all bg-surface-2 p-2 rounded-lg border border-line/60">
                {certificado.input_hash}
              </div>
            </div>

            {/* Resumen de Resultados Emitidos */}
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-ink">Resultados Matemáticos Registrados:</span>
              <pre className="p-3 rounded-xl bg-surface-2 border border-line text-[11px] font-mono text-ink overflow-x-auto max-h-40">
                {JSON.stringify(certificado.outputs, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-line flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted">
            ARK SOVEREIGN VERIFICATION · SHA-256 D1
          </span>
          <div className="flex items-center gap-2">
            {certificado && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line hover:border-navy text-xs font-semibold text-ink cursor-pointer"
              >
                <Printer size={13} />
                <span>Imprimir Constancia</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

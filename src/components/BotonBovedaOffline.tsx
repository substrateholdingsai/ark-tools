/**
 * ARK LEDGER — Botón Reutilizable de Descarga de Bóveda Offline (.zip)
 *
 * Cumplimiento Art. 30 CFF (5 a 10 años de conservación) y Anti Vendor-Lock-In.
 * Empaqueta datos_expediente.json, papel_de_trabajo.html, offline-viewer.html
 * y manifest.sha256 en un solo clic.
 */

import { useState } from 'react';
import { Archive, Check, Loader2 } from 'lucide-react';
import { descargarBovedaOfflineZip, type BovedaOfflineParams } from '@/lib/bovedaOffline';

interface Props {
  params: BovedaOfflineParams;
  variant?: 'primary' | 'secondary' | 'compact';
  className?: string;
}

export function BotonBovedaOffline({ params, variant = 'primary', className = '' }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) return;
    try {
      setIsGenerating(true);
      await descargarBovedaOfflineZip(params);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (err) {
      console.error('[Bóveda Offline Error]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        title="Descargar Bóveda Offline (.zip) con visor sin conexión y manifest.sha256"
        className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] font-semibold text-ink transition hover:border-gold hover:text-navy disabled:opacity-50 ${className}`}
      >
        {isGenerating ? (
          <Loader2 size={13} className="animate-spin text-gold" />
        ) : downloaded ? (
          <Check size={13} className="text-emerald-600" />
        ) : (
          <Archive size={13} className="text-gold-dark" />
        )}
        <span>{downloaded ? 'Descargado' : 'Bóveda .zip'}</span>
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        title="Descargar paquete de preservación Art. 30 CFF (.zip)"
        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-navy/20 bg-white px-3.5 py-2 font-mono text-[11px] font-bold text-navy shadow-md transition hover:bg-navy/5 disabled:opacity-60 ${className}`}
      >
        {isGenerating ? (
          <Loader2 size={14} className="animate-spin text-gold" />
        ) : downloaded ? (
          <Check size={14} className="text-emerald-600" />
        ) : (
          <Archive size={14} className="text-gold-dark" />
        )}
        <span>
          {isGenerating
            ? 'Generando Bóveda...'
            : downloaded
              ? '✓ Bóveda Descargada'
              : 'Bóveda Offline .zip'}
        </span>
      </button>
    );
  }

  // Variant 'primary' (por defecto en cabeceras de papeles de trabajo)
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      title="Descargar Bóveda Offline (.zip) con offline-viewer.html y manifest.sha256"
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-gold/40 bg-surface-2 px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-wider text-navy shadow-xl transition-all hover:border-gold hover:bg-white disabled:opacity-60 print:hidden ${className}`}
    >
      {isGenerating ? (
        <Loader2 size={15} className="animate-spin text-gold" />
      ) : downloaded ? (
        <Check size={15} className="text-emerald-600" />
      ) : (
        <Archive size={15} className="text-gold" />
      )}
      <span>
        {isGenerating
          ? 'Generando...'
          : downloaded
            ? '✓ Bóveda Descargada'
            : 'Bóveda Offline (.zip)'}
      </span>
    </button>
  );
}

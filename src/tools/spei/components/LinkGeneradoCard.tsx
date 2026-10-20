/**
 * ARK TOOLS — Generador de Links de Pago (Clip)
 * Componente: Tarjeta de Enlace Generado y Acciones de Compartir
 */

import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ExternalLink, MessageCircle, Share2, Info } from 'lucide-react';
import { BadgeGold } from '@/components/ui';
import { generarMensajeWhatsApp, formatearMXN } from '../lib/clipClient';
import type { ClipCheckoutResult } from '../types';

interface LinkGeneradoCardProps {
  resultado: ClipCheckoutResult;
  cliente?: string;
  telefono?: string;
  onCopiarTexto?: (msg: string) => void;
}

export const LinkGeneradoCard: React.FC<LinkGeneradoCardProps> = ({
  resultado,
  cliente,
  telefono,
  onCopiarTexto,
}) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard?.writeText(resultado.payment_request_url);
    setCopiado(true);
    if (onCopiarTexto) onCopiarTexto('Enlace copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2000);
  };

  const whatsappUrl = generarMensajeWhatsApp({
    cliente,
    monto: resultado.amount,
    concepto: resultado.purchase_description,
    linkPago: resultado.payment_request_url,
    telefono,
  });

  return (
    <div className="bg-surface-raised/80 space-y-6 rounded-2xl border-2 border-gold/40 p-6 shadow-2xl shadow-gold/15 md:p-8">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-inner">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-playfair text-xl font-bold text-ink">¡Link de Pago Generado!</h3>
              <BadgeGold size="sm">ACTIVO</BadgeGold>
            </div>
            <p className="text-xs text-muted">
              Listo para enviar a tu cliente por WhatsApp, correo o mensaje
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[10px] font-bold uppercase text-muted">Monto a cobrar</span>
          <span className="font-mono text-xl font-black text-gold">
            {formatearMXN(resultado.amount)}
          </span>
        </div>
      </div>

      {/* URL para Copiar */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Share2 className="h-3.5 w-3.5 text-gold" />
          Enlace Clip Checkout
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 select-all overflow-x-auto rounded-xl border border-white/10 bg-surface p-3 font-mono text-xs text-ink">
            {resultado.payment_request_url}
          </div>
          <button
            onClick={handleCopiar}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gold px-4 py-3 text-xs font-bold text-navy shadow-md transition-all hover:bg-gold/90"
          >
            {copiado ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Botones de Acción Inmediata */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-center text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition-colors hover:bg-emerald-500"
        >
          <MessageCircle className="h-4 w-4" />
          ENVIAR POR WHATSAPP AHORA
        </a>

        <a
          href={resultado.payment_request_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface-raised inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 text-center text-xs font-semibold text-ink transition-colors hover:bg-surface"
        >
          <ExternalLink className="h-4 w-4 text-gold" />
          Probar Link en Clip
        </a>
      </div>

      {/* Aviso de Modo o Certificación */}
      {resultado.is_mock && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-xs text-amber-200/90">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <strong className="font-semibold text-amber-300">Modo de Demostración:</strong>{' '}
            {resultado.notice ||
              'Agrega CLIP_API_KEY y CLIP_API_SECRET en tus variables de Cloudflare para conectar directo con tu cuenta Clip.'}
          </div>
        </div>
      )}
    </div>
  );
};

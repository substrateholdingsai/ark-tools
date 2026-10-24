/**
 * ARK LEDGER — Generador de Links de Pago (Clip)
 * Componente: Historial de Enlaces de Cobro Generados
 */

import React, { useState } from 'react';
import { History, Copy, Check, ExternalLink, Trash2 } from 'lucide-react';
import { formatearMXN } from '../lib/clipClient';
import type { LinkCobroGuardado } from '../types';

interface HistorialCobrosTableProps {
  links: LinkCobroGuardado[];
  onEliminar: (id: string) => void;
  onCopiarTexto?: (msg: string) => void;
}

export const HistorialCobrosTable: React.FC<HistorialCobrosTableProps> = ({
  links,
  onEliminar,
  onCopiarTexto,
}) => {
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const handleCopiar = (url: string, id: string) => {
    navigator.clipboard?.writeText(url);
    setCopiadoId(id);
    if (onCopiarTexto) onCopiarTexto('Enlace copiado al portapapeles');
    setTimeout(() => setCopiadoId(null), 2000);
  };

  if (links.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-gold" />
        <h3 className="font-playfair text-xl font-bold text-ink">Enlaces de Cobro Recientes</h3>
        <span className="text-xs text-muted">({links.length})</span>
      </div>

      <div className="bg-surface-raised/40 overflow-x-auto rounded-2xl border border-white/10 shadow-xl">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-surface/80 text-[11px] font-bold uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Enlace</th>
              <th className="px-3 py-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {links.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-3 text-[11px] text-muted">
                  {new Date(item.fecha).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 font-medium text-ink">
                  {item.concepto}
                </td>
                <td className="px-4 py-3 text-muted">{item.cliente || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-gold">
                  {formatearMXN(item.monto)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopiar(item.url, item.id)}
                      className="hover:bg-surface-raised inline-flex items-center gap-1 rounded-lg border border-white/10 bg-surface px-2.5 py-1 text-[11px] text-muted transition-colors hover:text-gold"
                      title="Copiar link"
                    >
                      {copiadoId === item.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar Link
                        </>
                      )}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-muted transition-colors hover:text-ink"
                      title="Abrir en Clip"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => onEliminar(item.id)}
                    className="rounded p-1 text-muted/60 transition-colors hover:text-red-400"
                    title="Eliminar del historial"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

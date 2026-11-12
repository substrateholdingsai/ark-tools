/**
 * LegalComplianceModal
 *
 * Modal accesible para visualizar el marco de Compliance Multi-Tenant:
 * - Aviso de Privacidad Integral (LFPDPPP)
 * - Términos y Condiciones de Servicio
 * - Política de Seguridad y Manejo de Datos Personales
 *
 * Parametrizado dinámicamente desde BrandConfig (`currentBrand` por defecto).
 */

import { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Printer, AlertTriangle } from 'lucide-react';
import { currentBrand } from '@/config/brand';
import type { BrandConfig } from '@/config/brand/types';
import {
  getComplianceDocuments,
  type LegalDocId,
  type LegalDocumentContent,
} from '@/data/compliance-legal';

export interface LegalComplianceModalProps {
  isOpen: boolean;
  initialTab?: LegalDocId;
  onClose: () => void;
  brand?: BrandConfig;
}

const TAB_ORDER: LegalDocId[] = ['privacidad', 'terminos', 'seguridad'];

const TAB_ICONS: Record<LegalDocId, typeof ShieldCheck> = {
  privacidad: ShieldCheck,
  terminos: FileText,
  seguridad: Lock,
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPrintableLegalHtml(doc: LegalDocumentContent, brand: BrandConfig): string {
  const sectionsHtml = doc.sections
    .map((sec) => {
      const paragraphs = sec.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
      const bullets = sec.bullets?.length
        ? `<ul>${sec.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
      return `<section><h2>${escapeHtml(sec.title)}</h2>${paragraphs}${bullets}</section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(doc.title)} — ${escapeHtml(brand.brandName)}</title>
  <style>
    @page { size: letter; margin: 18mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.55; max-width: 780px; margin: 0 auto; padding: 24px; }
    .draft { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 18px; }
    header { border-bottom: 2px solid #0b132b; padding-bottom: 12px; margin-bottom: 20px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #0b132b; }
    .meta { font-size: 12px; color: #4b5563; }
    h2 { font-size: 14px; color: #0b132b; margin: 18px 0 6px; }
    p, li { font-size: 13px; margin: 6px 0; }
    ul { padding-left: 20px; }
    .actions { margin-bottom: 16px; }
    @media print { .actions { display: none; } }
  </style>
</head>
<body>
  <div class="actions">
    <button type="button" onclick="window.print()" style="padding:8px 14px;background:#0b132b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Imprimir / Guardar PDF</button>
  </div>
  <div class="draft">${escapeHtml(doc.draftNotice)}</div>
  <header>
    <h1>${escapeHtml(doc.title)}</h1>
    <div class="meta">${escapeHtml(doc.subtitle)} · Última actualización: ${escapeHtml(doc.lastUpdated)}</div>
  </header>
  ${sectionsHtml}
</body>
</html>`;
}

export function LegalComplianceModal({
  isOpen,
  initialTab = 'privacidad',
  onClose,
  brand = currentBrand,
}: LegalComplianceModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDocId>(initialTab);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const docs = getComplianceDocuments(brand);
  const currentDoc = docs[activeTab];

  const handleOpenPrintableView = () => {
    const html = buildPrintableLegalHtml(currentDoc, brand);
    const hasObjectUrl = typeof URL.createObjectURL === 'function';
    const url = hasObjectUrl
      ? URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
      : `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    const popup = window.open(url, '_blank', 'noopener,noreferrer');

    if (!popup) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentDoc.id}-${brand.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setPrintStatus('Archivo HTML imprimible descargado.');
    } else {
      setPrintStatus('Vista imprimible abierta en una nueva pestaña.');
    }

    if (hasObjectUrl && typeof URL.revokeObjectURL === 'function') {
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-4 border-b border-line bg-surface-2 px-6 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-navy">
              {brand.brandName} · Compliance Legal
            </div>
            <h2 id="legal-modal-title" className="mt-0.5 text-lg font-bold text-ink">
              {currentDoc.title}
            </h2>
            <p className="text-xs text-muted">
              {currentDoc.subtitle} · Actualizado: {currentDoc.lastUpdated}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal legal"
            className="rounded-lg p-1.5 text-muted transition hover:bg-white hover:text-ink focus:outline-none focus:ring-2 focus:ring-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div
          className="flex flex-wrap gap-1 border-b border-line bg-white px-6 py-2.5"
          role="tablist"
          aria-label="Documentos legales"
        >
          {TAB_ORDER.map((tabId) => {
            const doc = docs[tabId];
            const Icon = TAB_ICONS[tabId];
            const isSelected = activeTab === tabId;
            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  setActiveTab(tabId);
                  setPrintStatus(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-navy ${
                  isSelected
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-surface-2 text-muted hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {doc.tabLabel}
              </button>
            );
          })}
        </div>

        {/* Contenido con scroll interno */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>{currentDoc.draftNotice}</span>
          </div>

          {currentDoc.sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="text-sm font-bold text-navy">{section.title}</h3>
              {section.paragraphs.map((p, idx) => (
                <p key={idx} className="text-xs leading-relaxed text-ink/90">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-ink/90">
                  {section.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Pie del modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2 px-6 py-3.5">
          <div className="text-[11px] text-muted">
            {printStatus ?? `Contacto oficial: ${brand.supportEmail}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPrintableView}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-navy hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <Printer className="h-3.5 w-3.5" />
              Vista Imprimible / Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-navy px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LegalComplianceModal;

/**
 * Footer
 *
 * Footer institucional optimizado para ARK LEDGER.
 * Incluye propuesta de valor fiscal/financiera, soporte empresarial directo,
 * garantías de privacidad de datos, directorio de herramientas y descargo legal.
 */

import { Mail, MessageSquare, ShieldCheck, Lock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BrandLogo } from './brand';
import { currentBrand } from '@/config/brand';

interface FooterProps {
  className?: string;
  onSelectTool?: (toolId: any) => void;
}

export function Footer({ className, onSelectTool }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('border-t border-line bg-white text-ink', className)}>
      {/* ─────────────────────────────────────────────────────────────
          BLOQUE SUPERIOR: CONFIANZA & PRIVACIDAD
      ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-line/60 bg-surface-2/60">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-6 text-center md:flex-row md:px-10 md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy/10 bg-navy/5 text-navy">
              <Lock size={20} />
            </div>
            <div>
              <div className="font-orbitron text-[12px] font-bold uppercase tracking-wider text-navy">
                Privacidad & Confidencialidad Fiscal Garantizada
              </div>
              <p className="font-inter text-[12px] text-muted">
                {currentBrand.footer.confidenceNotice}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
              <CheckCircle2 size={13} className="text-emerald-600" />
              {currentBrand.footer.complianceBadge}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy/5 px-3 py-1 text-[11px] font-semibold text-navy">
              <ShieldCheck size={13} className="text-navy" />
              Cotejo Art. 69-B CFF
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BLOQUE PRINCIPAL: COLUMNAS DE INFORMACIÓN Y NAVEGACIÓN
      ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Columna 1 & 2: Identidad y Contacto Directo */}
          <div className="space-y-5 lg:col-span-2">
            <div className="flex items-center gap-3">
              <BrandLogo size={42} />
              <div>
                <div className="orbitron font-orbitron text-[16px] font-black tracking-[0.16em] text-navy">
                  {currentBrand.brandName}
                </div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
                  {currentBrand.tagline}
                </div>
              </div>
            </div>

            <p className="max-w-[380px] font-inter text-[13px] leading-relaxed text-muted">
              {currentBrand.description}
            </p>

            {/* Tarjeta de Soporte y Contacto Directo */}
            <div className="pt-2">
              <div className="mb-3 font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                Mesa de Ayuda & Atención Institucional
              </div>
              <div className="space-y-2.5">
                <a
                  href={`mailto:${currentBrand.supportEmail}`}
                  className="group flex items-center gap-3 rounded-xl border border-line/80 bg-surface-2 p-2.5 text-[12px] font-medium text-ink transition hover:border-navy/40 hover:bg-white"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy transition group-hover:bg-navy group-hover:text-white">
                    <Mail size={15} />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Correo de Soporte
                    </div>
                    <div className="truncate font-semibold text-navy">
                      {currentBrand.supportEmail}
                    </div>
                  </div>
                </a>

                <a
                  href={currentBrand.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-line/80 bg-surface-2 p-2.5 text-[12px] font-medium text-ink transition hover:border-emerald-500/40 hover:bg-white"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <MessageSquare size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      WhatsApp Directo
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-emerald-700">
                      {currentBrand.supportPhone}
                      <ExternalLink size={11} className="opacity-70" />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Columna 3: Herramientas Fiscales & Nómina */}
          <div className="space-y-4">
            <h4 className="border-b border-line pb-2 font-orbitron text-[12px] font-bold uppercase tracking-wider text-navy">
              Fiscal & Nómina
            </h4>
            <ul className="space-y-2.5 font-inter text-[12px] text-muted">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('isn')}
                  className="text-left transition hover:text-navy"
                >
                  Calculadora ISN 2026 (32 Estados)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('sbc')}
                  className="text-left transition hover:text-navy"
                >
                  Salario Base de Cotización (SBC)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('nomina')}
                  className="text-left transition hover:text-navy"
                >
                  Nómina, ISR y Cuotas IMSS
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('finiquitos')}
                  className="text-left transition hover:text-navy"
                >
                  Finiquitos y Liquidaciones LFT
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('resico')}
                  className="text-left transition hover:text-navy"
                >
                  Calculadora y Cédula RESICO 2026
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('guia-sat-imss')}
                  className="text-left transition hover:text-navy"
                >
                  Guía y Normativa SAT / IMSS
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 4: SAT, CFDI & Auditoría */}
          <div className="space-y-4">
            <h4 className="border-b border-line pb-2 font-orbitron text-[12px] font-bold uppercase tracking-wider text-navy">
              SAT & Auditoría
            </h4>
            <ul className="space-y-2.5 font-inter text-[12px] text-muted">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('xml-excel')}
                  className="text-left transition hover:text-navy"
                >
                  Conversor Lotes XML → Excel
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('validador')}
                  className="text-left transition hover:text-navy"
                >
                  Validador CFDI & Listas EFOS (69-B)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('auditor-cobranza')}
                  className="text-left transition hover:text-navy"
                >
                  Auditor de Cobranza & CRM
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('mapa-activos')}
                  className="text-left transition hover:text-navy"
                >
                  Mapa Legal de Activos Virtuales
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 5: Finanzas & Infraestructura */}
          <div className="space-y-4">
            <h4 className="border-b border-line pb-2 font-orbitron text-[12px] font-bold uppercase tracking-wider text-navy">
              Finanzas & Cloud
            </h4>
            <ul className="space-y-2.5 font-inter text-[12px] text-muted">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('leasing')}
                  className="text-left transition hover:text-navy"
                >
                  Simulador Leasing vs Financiero
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('spei')}
                  className="text-left transition hover:text-navy"
                >
                  Generador Cobros SPEI / Clip
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('timbrado')}
                  className="text-left transition hover:text-navy"
                >
                  Timbrado Facturas CFDI 4.0 (Alegra)
                </button>
              </li>
              <li className="pt-2">
                <div className="rounded-xl border border-line bg-surface-2 p-3 text-[11px] leading-relaxed text-muted">
                  <span className="mb-1 block font-orbitron font-bold tracking-wider text-navy">
                    CLOUD MULTI-TENANT
                  </span>
                  Gestión independiente de expedientes y RFCs por cada cliente o razón social.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BLOQUE INFERIOR: DESCARGO LEGAL & COPYRIGHT
      ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-line/70 bg-surface-2/30">
        <div className="mx-auto max-w-[1280px] space-y-4 px-6 py-6 md:px-10">
          <p className="text-justify font-inter text-[11px] leading-relaxed text-muted/90 md:text-left">
            <strong className="font-semibold text-ink">Descargo de Responsabilidad Legal:</strong>{' '}
            {currentBrand.footer.disclaimer}
          </p>

          {/* Banner B2B / Product-Led Growth para CANACO */}
          {currentBrand.id === 'canaco_merida' && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-henequen-arena bg-white p-3.5 text-center text-xs sm:flex-row sm:text-left">
              <div>
                <span className="font-bold text-henequen-anil">
                  Desarrollado con tecnología de Ark Systems
                </span>
                <span className="mx-2 hidden text-muted sm:inline">·</span>
                <span className="text-muted">
                  ¿Quieres tener un portal similar para los socios o afiliados de tu organización?
                </span>
              </div>
              <a
                href="mailto:pavel@arksystems.site?subject=Portal%20para%20Socios%20u%20Organizaci%C3%B3n%20-%20Informes"
                className="shrink-0 font-semibold text-henequen-terra hover:underline"
              >
                Escríbenos a pavel@arksystems.site →
              </a>
            </div>
          )}

          <div className="flex flex-col items-center justify-between gap-4 border-t border-line/40 pt-2 text-[11px] text-muted sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-navy">{currentBrand.brandName}</span>
              <span>
                · {currentBrand.legalEntity} © {currentYear}. Todos los derechos reservados.
              </span>
            </div>
            <div className="flex items-center gap-4 font-medium">
              <span className="cursor-pointer transition hover:text-navy">Aviso de Privacidad</span>
              <span>·</span>
              <span className="cursor-pointer transition hover:text-navy">
                Términos de Servicio
              </span>
              <span>·</span>
              <span className="cursor-pointer transition hover:text-navy">Seguridad de Datos</span>
              <span>·</span>
              <a
                href={currentBrand.id === 'canaco_merida' ? '?brand=ark' : '?brand=canaco'}
                className="font-mono text-[10px] text-muted hover:text-navy hover:underline"
                title="Conmutar vista de marca para demostración"
              >
                {currentBrand.id === 'canaco_merida' ? 'Vista: ARK LEDGER' : 'Vista: CANACO MÉRIDA'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

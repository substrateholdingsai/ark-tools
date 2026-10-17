/**
 * Footer
 *
 * Footer institucional optimizado para ARK TOOLS.
 * Incluye propuesta de valor fiscal/financiera, soporte empresarial directo,
 * garantías de privacidad de datos, directorio de herramientas y descargo legal.
 */

import { Mail, MessageSquare, ShieldCheck, Lock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';

interface FooterProps {
  className?: string;
  onSelectTool?: (toolId: any) => void;
}

export function Footer({ className, onSelectTool }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-white border-t border-line text-ink', className)}>
      {/* ─────────────────────────────────────────────────────────────
          BLOQUE SUPERIOR: CONFIANZA & PRIVACIDAD
      ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-line/60 bg-surface-2/60">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center text-navy shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <div className="text-[12px] font-bold tracking-wider uppercase text-navy font-orbitron">
                Privacidad & Confidencialidad Fiscal Garantizada
              </div>
              <p className="text-[12px] text-muted font-inter">
                El análisis y procesamiento de tus XMLs, nóminas y CFDI se ejecuta de forma segura en tu navegador. Tus datos no se transfieren ni se comercializan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Tablas Fiscales 2026 Vigentes
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 border border-navy/15 text-[11px] font-semibold text-navy">
              <ShieldCheck size={13} className="text-navy" />
              Cotejo Art. 69-B CFF
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BLOQUE PRINCIPAL: COLUMNAS DE INFORMACIÓN Y NAVEGACIÓN
      ───────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
          {/* Columna 1 & 2: Identidad y Contacto Directo */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <Logo size={42} />
              <div>
                <div className="orbitron font-orbitron font-black text-[16px] tracking-[0.16em] text-navy">
                  ARK TOOLS
                </div>
                <div className="text-[10px] tracking-[0.24em] text-muted font-bold uppercase mt-0.5">
                  Suite Fiscal & Financiera MX
                </div>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed text-muted max-w-[380px] font-inter">
              Plataforma de alta precisión en cálculo tributario, nómina y cumplimiento CFDI. Desarrollada para contadores independientes, firmas de auditoría y directores financieros en México.
            </p>

            {/* Tarjeta de Soporte y Contacto Directo */}
            <div className="pt-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink font-orbitron mb-3">
                Mesa de Ayuda & Atención a Despachos
              </div>
              <div className="space-y-2.5">
                <a
                  href="mailto:pavel@arksystems.site"
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-surface-2 border border-line/80 hover:border-navy/40 hover:bg-white transition text-[12px] font-medium text-ink"
                >
                  <div className="w-8 h-8 rounded-lg bg-navy/5 group-hover:bg-navy group-hover:text-white transition flex items-center justify-center text-navy shrink-0">
                    <Mail size={15} />
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Correo de Soporte</div>
                    <div className="text-navy font-semibold truncate">pavel@arksystems.site</div>
                  </div>
                </a>

                <a
                  href="https://wa.me/525657062511?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20ARK%20TOOLS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-surface-2 border border-line/80 hover:border-emerald-500/40 hover:bg-white transition text-[12px] font-medium text-ink"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition flex items-center justify-center shrink-0">
                    <MessageSquare size={15} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted tracking-wider">WhatsApp Directo</div>
                    <div className="text-emerald-700 font-semibold flex items-center gap-1">
                      +52 56 5706 2511
                      <ExternalLink size={11} className="opacity-70" />
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Columna 3: Herramientas Fiscales & Nómina */}
          <div className="space-y-4">
            <h4 className="font-orbitron font-bold text-[12px] tracking-wider uppercase text-navy border-b border-line pb-2">
              Fiscal & Nómina
            </h4>
            <ul className="space-y-2.5 text-[12px] text-muted font-inter">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('isn')}
                  className="hover:text-navy text-left transition"
                >
                  Calculadora ISN 2026 (32 Estados)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('sbc')}
                  className="hover:text-navy text-left transition"
                >
                  Salario Base de Cotización (SBC)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('nomina')}
                  className="hover:text-navy text-left transition"
                >
                  Nómina, ISR y Cuotas IMSS
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('finiquitos')}
                  className="hover:text-navy text-left transition"
                >
                  Finiquitos y Liquidaciones LFT
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('guia-sat-imss')}
                  className="hover:text-navy text-left transition"
                >
                  Guía y Normativa SAT / IMSS
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 4: SAT, CFDI & Auditoría */}
          <div className="space-y-4">
            <h4 className="font-orbitron font-bold text-[12px] tracking-wider uppercase text-navy border-b border-line pb-2">
              SAT & Auditoría
            </h4>
            <ul className="space-y-2.5 text-[12px] text-muted font-inter">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('xml-excel')}
                  className="hover:text-navy text-left transition"
                >
                  Conversor Lotes XML → Excel
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('validador')}
                  className="hover:text-navy text-left transition"
                >
                  Validador CFDI & Listas EFOS (69-B)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('auditor-cobranza')}
                  className="hover:text-navy text-left transition"
                >
                  Auditor de Cobranza & CRM
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('mapa-activos')}
                  className="hover:text-navy text-left transition"
                >
                  Mapa Legal de Activos Virtuales
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 5: Finanzas & Infraestructura */}
          <div className="space-y-4">
            <h4 className="font-orbitron font-bold text-[12px] tracking-wider uppercase text-navy border-b border-line pb-2">
              Finanzas & Cloud
            </h4>
            <ul className="space-y-2.5 text-[12px] text-muted font-inter">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('leasing')}
                  className="hover:text-navy text-left transition"
                >
                  Simulador Leasing vs Financiero
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('spei')}
                  className="hover:text-navy text-left transition"
                >
                  Generador Cobros SPEI / Clip
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool?.('timbrado')}
                  className="hover:text-navy text-left transition"
                >
                  Timbrado Facturas CFDI 4.0 (Alegra)
                </button>
              </li>
              <li className="pt-2">
                <div className="p-3 rounded-xl bg-surface-2 border border-line text-[11px] leading-relaxed text-muted">
                  <span className="font-bold text-navy block mb-1 font-orbitron tracking-wider">
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
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-6 space-y-4">
          <p className="text-[11px] leading-relaxed text-muted/90 font-inter text-justify md:text-left">
            <strong className="text-ink font-semibold">Descargo de Responsabilidad Legal:</strong> Las calculadoras, módulos de auditoría y reportes provistos por ARK TOOLS tienen propósito de apoyo operativo y técnico fundamentado en la legislación fiscal mexicana vigente (CFF, LISR, LSS y LFT). Los resultados no constituyen una opinión fiscal formal vinculante ni sustituyen la asesoría o dictamen emitido por un Contador Público Colegiado o Asesor Legal Fiscal.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted border-t border-line/40">
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-navy">ARK TOOLS</span>
              <span>· Substrate Holdings LLC © {currentYear}. Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center gap-4 font-medium">
              <span className="hover:text-navy cursor-pointer transition">Aviso de Privacidad</span>
              <span>·</span>
              <span className="hover:text-navy cursor-pointer transition">Términos de Servicio</span>
              <span>·</span>
              <span className="hover:text-navy cursor-pointer transition">Seguridad de Datos</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

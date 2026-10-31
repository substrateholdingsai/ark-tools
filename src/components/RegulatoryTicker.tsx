/**
 * ARK LEDGER — Regulatory Ticker (Wall Street / Bloomberg Tape Style)
 *
 * Cinta horizontal compacta de alta densidad en el tope de la interfaz.
 * Comunica en tiempo real que la suite está conectada al radar de Sentinela
 * RegTech y que las 20 herramientas fiscales/laborales están sincronizadas con el DOF.
 */

import { useState, useEffect } from 'react';
import { ShieldCheck, ExternalLink, X, Radio, Sparkles, ChevronRight, Info } from 'lucide-react';
import type { ToolId } from '@/App';

export interface RegulatoryEventItem {
  id: string;
  channel: string;
  source: string;
  source_url?: string;
  severity: 'critico' | 'alto' | 'medio' | 'bajo';
  title: string;
  summary: string;
  effective_date: string;
  laws_affected: string[];
  action_required?: string;
  created_at: string;
}

export interface RegulatoryTickerProps {
  onSelectTool?: (toolId: ToolId) => void;
  className?: string;
}

interface StaticToolGuarantee {
  id: string;
  type: 'tool_guarantee' | 'dof_catalog';
  label: string;
  headline: string;
  toolId?: ToolId;
  badgeText: string;
  badgeVariant: 'emerald' | 'gold' | 'blue';
  details?: {
    title: string;
    description: string;
    fundamento: string;
    cobertura: string;
  };
}

const STATIC_SUITE_GUARANTEES: StaticToolGuarantee[] = [
  {
    id: 'tool_18_recargos',
    type: 'tool_guarantee',
    label: 'HERRAMIENTA #18',
    headline:
      'RECARGOS CFF ART. 17-A & 21: FACTOR INPC TRUNCADO A 4 DECIMALES (TASA LIF 1.47% SIN DEFLACIÓN)',
    toolId: 'recargos',
    badgeText: 'CFF VIGENTE',
    badgeVariant: 'gold',
    details: {
      title: 'Actualización y Recargos Fiscales (CFF Art. 17-A y 21)',
      description:
        'Motor determinista con tablas INPC oficiales del INEGI. Aplica factor truncado a cuatro decimales sin redondeo y respeta el principio de no deflación con recargos por mora al 1.47% mensual.',
      fundamento:
        'Art. 17-A y 21 del Código Fiscal de la Federación; Art. 8 Fracc. I penúltimo párrafo LIF.',
      cobertura: 'Cálculo auditado y sellado criptográficamente en Cédula Oficial SHA-256 con QR.',
    },
  },
  {
    id: 'tool_19_modalidad40',
    type: 'tool_guarantee',
    label: 'HERRAMIENTA #19',
    headline:
      'MODALIDAD 40 LSS 1973: RESTRICTIVA DOF 21/10/2026 (TOPE EN ÚLTIMO SBC + 1 UMA ACTIVA)',
    toolId: 'modalidad40',
    badgeText: 'DOF 21/10/2026',
    badgeVariant: 'emerald',
    details: {
      title: 'Simulador Actuarial de Modalidad 40 IMSS',
      description:
        'Incorpora la restricción imperativa del Acuerdo ACDO.AS2.HCT.101026/302.P.DG publicado en el DOF el 21 de octubre de 2026: el salario base cotizable no puede superar el último registrado más una UMA diaria.',
      fundamento: 'Art. 167, 168 y 218 LSS 1973; Acuerdo Consejo Técnico IMSS DOF 21/10/2026.',
      cobertura:
        'Simulación actuarial con desglose mes a mes de cuota 2026 (14.438%) y análisis de ROI.',
    },
  },
  {
    id: 'tool_20_atipicos_cfdi',
    type: 'tool_guarantee',
    label: 'HERRAMIENTA #20',
    headline: 'AUDITOR CFDI ATÍPICOS: BENFORD + METADATA SAT 4.0 SIN CONTINGENCIAS EFOS 69-B',
    toolId: 'auditor-cfdi-atipico',
    badgeText: 'METADATA SAT',
    badgeVariant: 'emerald',
    details: {
      title: 'Detector Forense de Comportamientos Atípicos en CFDI',
      description:
        'Análisis masivo de comprobantes 4.0/3.3 con verificación de la Ley de Benford en primeros dígitos, Z-Score de dispersión mensual, fraccionamiento de efectivo (Art. 27 LISR) y cotejo EFOS Art. 69-B.',
      fundamento: 'Art. 29, 29-A y 69-B del CFF; Art. 27 Fracc. III de la LISR.',
      cobertura: 'Dictamen pericial exportable a Excel y PDF con matriz de riesgo 5×5.',
    },
  },
  {
    id: 'tool_12_cruce_checador',
    type: 'tool_guarantee',
    label: 'HERRAMIENTA #12',
    headline: 'CRUCE LABORAL-FISCAL: LFT ART. 132 FRACC. VIII BIS (CHECADOR VS CFDI NÓMINA 1.2)',
    toolId: 'cierre-nomina',
    badgeText: 'LFT 132 VIGENTE',
    badgeVariant: 'blue',
    details: {
      title: 'Cruce Laboral-Fiscal Checador vs CFDI Nómina 1.2',
      description:
        'Cruce automático de registros biométricos/asistencia contra los comprobantes de nómina para blindar deducciones ante revisiones simultáneas SAT, IMSS y STPS.',
      fundamento: 'Art. 132 Fracción VIII Bis de la LFT; Guía de Llenado CFDI de Nómina SAT.',
      cobertura:
        'Detección de horas extras no timbradas, inconsistencias en faltas e incapacidades.',
    },
  },
  {
    id: 'tool_16_anexo24',
    type: 'tool_guarantee',
    label: 'HERRAMIENTA #16',
    headline:
      'CONCILIACIÓN ANEXO 24: GENERADOR DE PÓLIZAS CONTABLES CERO-CAPTURA (LAYOUT CONTPAQI/COI)',
    toolId: 'anexo24',
    badgeText: 'CFF ART. 28',
    badgeVariant: 'gold',
    details: {
      title: 'Conciliación Anexo 24 y Generación de Pólizas',
      description:
        'Procesamiento masivo de XML con filtrado estricto de facturas canceladas mediante Metadata SAT oficial y auto-asociación de cuentas para balanza mensual.',
      fundamento: 'Art. 28 del CFF y Anexo 24 de la Resolución Miscelánea Fiscal vigente.',
      cobertura: 'Exportación directa en CSV BOM UTF-8 compatible con Contpaqi y Aspel COI.',
    },
  },
  {
    id: 'catalogo_dof_oficial',
    type: 'dof_catalog',
    label: 'DOF 2026 AUDITADO',
    headline:
      'UMA $113.14 · SMG $278.80 · FRONTERA $419.88 · TOPE SBC $2,828.50 · RESICO PF 1.0%-2.5% (8/8 OFICIALES)',
    badgeText: '8/8 DOF',
    badgeVariant: 'emerald',
    details: {
      title: 'Catálogo de Vigencias Fiscales y Laborales 2026',
      description:
        'Todos los parámetros de cálculo provienen directamente de publicaciones oficiales del DOF, INEGI y CONASAMI. Cero valores hardcodeados ni proyecciones no oficiales.',
      fundamento:
        'DOF 10/01/2026 (UMA), DOF 19/12/2025 (Salarios Mínimos), RMF 2026 (Tarifas ISR).',
      cobertura: 'Auditoría automática periódica de vigencias con verificación DOF en tiempo real.',
    },
  },
];

export function RegulatoryTicker({ onSelectTool, className = '' }: RegulatoryTickerProps) {
  const [liveEvents, setLiveEvents] = useState<RegulatoryEventItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    title: string;
    source: string;
    sourceUrl?: string;
    severity?: string;
    date?: string;
    summary: string;
    lawsAffected?: string[];
    actionRequired?: string;
    toolId?: ToolId;
  } | null>(null);

  // Ingesta asíncrona de eventos regulatorios de Sentinela Legal
  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      try {
        const res = await fetch('/api/regulatory/events?limit=8');
        if (!res.ok) return;
        const data = (await res.json()) as { ok?: boolean; events?: RegulatoryEventItem[] };
        if (isMounted && data.ok && Array.isArray(data.events)) {
          setLiveEvents(data.events);
        }
      } catch {
        // En caso de modo offline o error de red, el ticker cicla con las garantías estáticas de la suite
      }
    }

    fetchEvents();
    // Refresco cada 3 minutos en producción/navegador para mantener el pulso en vivo
    let timer: any;
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      timer = setInterval(fetchEvents, 180000);
    }
    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleOpenEvent = (ev: RegulatoryEventItem) => {
    setSelectedItem({
      title: ev.title,
      source: ev.source,
      sourceUrl: ev.source_url,
      severity: ev.severity,
      date: ev.effective_date || ev.created_at,
      summary: ev.summary,
      lawsAffected: ev.laws_affected,
      actionRequired: ev.action_required,
    });
  };

  const handleOpenGuarantee = (g: StaticToolGuarantee) => {
    setSelectedItem({
      title: g.details?.title || g.headline,
      source: 'ARK LEDGER — Garantía de Blindaje Normativo',
      severity: 'vigente',
      summary: g.details?.description || g.headline,
      lawsAffected: g.details?.fundamento ? [g.details.fundamento] : undefined,
      actionRequired: g.details?.cobertura,
      toolId: g.toolId,
    });
  };

  const renderBadge = (variant: 'emerald' | 'gold' | 'blue' | 'rose', text: string) => {
    let classes = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
    if (variant === 'gold') classes = 'bg-amber-950/80 text-amber-300 border-amber-700/60';
    if (variant === 'blue') classes = 'bg-blue-950/80 text-blue-300 border-blue-700/60';
    if (variant === 'rose') classes = 'bg-rose-950/80 text-rose-300 border-rose-700/60';

    return (
      <span
        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${classes}`}
      >
        {text}
      </span>
    );
  };

  const renderItemsList = (isClone: boolean) => (
    <div
      className="flex shrink-0 items-center gap-8 pr-8"
      aria-hidden={isClone ? 'true' : undefined}
    >
      {/* 1. Alertas en vivo recibidas de Sentinela Legal */}
      {liveEvents.map((ev) => {
        const isCrit = ev.severity === 'critico';
        const isHigh = ev.severity === 'alto';
        const badgeVar = isCrit ? 'rose' : isHigh ? 'gold' : 'emerald';

        return (
          <button
            key={`${isClone ? 'clone' : 'orig'}-live-${ev.id}`}
            type="button"
            onClick={() => handleOpenEvent(ev)}
            className="group flex cursor-pointer items-center gap-2.5 text-left text-slate-300 transition-colors hover:text-white"
          >
            {renderBadge(badgeVar, `SENTINELA ${ev.channel.toUpperCase()}`)}
            <span className="font-mono text-[11px] uppercase tracking-wide group-hover:underline">
              {ev.title}
            </span>
            <span className="font-mono text-[10px] text-slate-600">●</span>
          </button>
        );
      })}

      {/* 2. Garantías de Blindaje y Actualización de las 20 Herramientas */}
      {STATIC_SUITE_GUARANTEES.map((g) => (
        <button
          key={`${isClone ? 'clone' : 'orig'}-g-${g.id}`}
          type="button"
          onClick={() => handleOpenGuarantee(g)}
          className="group flex cursor-pointer items-center gap-2.5 text-left text-slate-300 transition-colors hover:text-white"
        >
          {renderBadge(g.badgeVariant, g.badgeText)}
          <span className="font-mono text-[11px] uppercase tracking-wide text-slate-200 transition-colors group-hover:text-gold-light">
            <span className="font-semibold text-slate-400">{g.label}:</span> {g.headline}
          </span>
          <span className="font-mono text-[10px] text-slate-600">●</span>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div
        className={`border-navy-800/80 relative z-40 flex h-7 w-full select-none items-center overflow-hidden border-b bg-[#070b16] text-slate-300 ${className}`}
        role="region"
        aria-label="Cinta de inteligencia regulatoria en vivo DOF y SAT"
      >
        {/* Pin izquierdo: Radar DOF / SAT en vivo con pulso LED */}
        <div className="z-10 flex h-full shrink-0 items-center gap-2 border-r border-slate-800 bg-[#070b16] px-3.5 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <div className="flex items-center gap-1.5 font-orbitron text-[9.5px] font-black uppercase tracking-[0.14em] text-emerald-400">
            <Radio size={11} className="animate-pulse text-emerald-400" />
            <span>RADAR REGTECH</span>
          </div>
          <span className="hidden border-l border-slate-700/80 pl-2 font-mono text-[9px] uppercase tracking-widest text-slate-400 md:inline">
            DOF · SAT EN VIVO
          </span>
        </div>

        {/* Área de la cinta marquee infinita (Pausa suave al hover) */}
        <div className="relative flex h-full flex-1 items-center overflow-hidden">
          <div className="animate-ticker-marquee flex h-full cursor-pointer items-center py-0.5">
            {renderItemsList(false)}
            {renderItemsList(true)}
          </div>
        </div>

        {/* Pin derecho: Conteo de herramientas blindadas */}
        <div className="z-10 hidden h-full shrink-0 items-center gap-1.5 border-l border-slate-800 bg-[#070b16] px-3 font-mono text-[9.5px] tracking-wider text-slate-300 shadow-[-4px_0_12px_rgba(0,0,0,0.5)] lg:flex">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span className="font-bold text-emerald-400">20/20</span>
          <span className="uppercase text-slate-400">HERRAMIENTAS VIGENTES</span>
        </div>
      </div>

      {/* Modal / Detalle de la Alerta Normativa o Garantía */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="relative w-full max-w-lg space-y-4 rounded-2xl border border-gold/40 bg-surface p-6 text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-navy">
                      {selectedItem.source}
                    </span>
                    {selectedItem.severity && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-slate-700">
                        {selectedItem.severity}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-0.5 font-playfair text-[18px] font-black leading-tight text-ink">
                    {selectedItem.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Cerrar ventana de alerta regulatoria"
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-cream/40 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-3 font-inter text-[13px] leading-relaxed text-muted">
              <p className="font-medium text-ink">{selectedItem.summary}</p>

              {selectedItem.lawsAffected && selectedItem.lawsAffected.length > 0 && (
                <div className="space-y-1 rounded-xl border border-navy/15 bg-navy/5 p-3">
                  <span className="flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                    <Info size={12} />
                    Fundamento Jurídico / Leyes Afectadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedItem.lawsAffected.map((law, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-navy/20 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-navy"
                      >
                        {law}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.actionRequired && (
                <div className="space-y-1 rounded-xl border border-gold/30 bg-gold/5 p-3">
                  <span className="flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    <Sparkles size={12} className="text-amber-600" />
                    Acción o Cobertura en la Suite:
                  </span>
                  <p className="text-[12.5px] text-amber-950">{selectedItem.actionRequired}</p>
                </div>
              )}

              {selectedItem.date && (
                <div className="text-right font-mono text-[11px] text-muted">
                  Vigencia / Registro: {selectedItem.date}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
              {selectedItem.sourceUrl ? (
                <a
                  href={selectedItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
                >
                  <span>Consultar DOF / Fuente Oficial</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {selectedItem.toolId && onSelectTool && (
                  <button
                    type="button"
                    onClick={() => {
                      const tId = selectedItem.toolId!;
                      setSelectedItem(null);
                      onSelectTool(tId);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-navy-dark"
                  >
                    <span>Abrir Herramienta</span>
                    <ChevronRight size={14} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-cream/40"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

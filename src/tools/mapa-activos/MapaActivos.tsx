// src/tools/mapa-activos/MapaActivos.tsx

import { useState, useMemo } from 'react';
import {
  CONDUCTAS_AV,
  AUTORIDADES_AV,
  TIMELINE_REGULATORIO_AV,
  UMBRALES_REPORTE_AV,
  FRONTERA_LEGAL_AV,
  MARCOS_LEGALES_AV,
  GRAVEDADES_AV,
  RESUMEN_MAPA_AV,
  AVISO_LEGAL_AV,
  FILOSOFIA_AV,
  FUENTES_AV,
} from '@/data/conductas';
import type { GravedadAV, MarcoLegalAV } from '@/data/conductas';
import { BadgeGold } from '@/components/ui';

// ═════════════════════════════════════════════════════════════════
// TYPES LOCALES
// ═════════════════════════════════════════════════════════════════

interface MapaActivosProps {
  onBack?: () => void;
}

type FiltroMarco = MarcoLegalAV | 'TODOS';
type FiltroGravedad = GravedadAV | 'TODAS';

// ═════════════════════════════════════════════════════════════════
// HELPERS DE ESTILO
// ═════════════════════════════════════════════════════════════════

function estiloGravedad(gravedad: GravedadAV): string {
  switch (gravedad) {
    case 'CRITICA_MAX':
      return 'bg-navy text-white ring-2 ring-gold/40';
    case 'CRITICA':
      return 'bg-navy text-white';
    case 'ALTA':
      return 'bg-navy/10 text-navy';
    case 'MEDIA':
      return 'bg-cream text-muted';
    case 'FUTURA':
      return 'bg-surface-2 text-muted border border-dashed border-line';
    default:
      return 'bg-surface-2 text-muted';
  }
}

function etiquetaGravedad(gravedad: GravedadAV): string {
  switch (gravedad) {
    case 'CRITICA_MAX': return 'CRÍTICA MAX';
    case 'CRITICA': return 'CRÍTICA';
    case 'ALTA': return 'ALTA';
    case 'MEDIA': return 'MEDIA';
    case 'FUTURA': return 'FUTURA';
    default: return gravedad;
  }
}

// ═════════════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═════════════════════════════════════════════════════════════════

function ConductaCard({
  conducta,
  expandido,
  onToggle,
}: {
  conducta: (typeof CONDUCTAS_AV)[number];
  expandido: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left rounded-card border border-line bg-surface p-5 transition-all hover:shadow-[0_8px_24px_rgba(0,43,127,0.06)] hover:border-navy/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-cream font-orbitron text-[11px] font-bold text-navy">
            {String(conducta.id).padStart(2, '0')}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-inter text-[9px] font-bold tracking-[0.12em] ${estiloGravedad(conducta.gravedad)}`}
          >
            {etiquetaGravedad(conducta.gravedad)}
          </span>
        </div>
        {conducta.noIgnorable && (
          <span className="rounded-full bg-navy px-2 py-0.5 font-inter text-[8px] font-bold tracking-[0.14em] text-white">
            NO IGNORAR
          </span>
        )}
      </div>

      {/* Título */}
      <h3 className="mt-3 font-inter text-[14px] font-semibold leading-[1.3] text-ink">
        {conducta.conducta}
      </h3>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-surface-2 px-2 py-1 font-orbitron text-[9px] tracking-widest text-muted">
          {conducta.marcoLegal}
        </span>
        <span className="rounded-full bg-cream px-2 py-1 font-inter text-[10px] text-muted">
          {conducta.articulo}
        </span>
        {conducta.relevanteParaContador && (
          <span className="rounded-full bg-navy/5 px-2 py-1 font-inter text-[10px] font-semibold text-navy">
            📋 Contador
          </span>
        )}
      </div>

      {/* Sanción corta */}
      <div className="mt-3 rounded-[12px] border border-line bg-surface-2 p-3">
        <p className="font-inter text-[10px] font-bold tracking-widest text-muted">
          SANCIÓN
        </p>
        <p className="mt-1 font-orbitron text-[13px] font-bold text-ink">
          {conducta.sancionCorta}
        </p>
      </div>

      {/* Calificación */}
      <p className="mt-3 font-inter text-[12px] leading-[1.4] text-muted">
        <span className="font-semibold text-ink">Calificación:</span>{' '}
        {conducta.calificacion}
      </p>

      {/* Detalle expandible */}
      {expandido && (
        <div className="mt-4 rounded-[12px] border border-line bg-cream p-4 animate-[fadeUp_0.3s_ease]">
          <p className="font-inter text-[10px] font-bold tracking-widest text-muted">
            DETALLE COMPLETO
          </p>
          <p className="mt-2 font-inter text-[12px] leading-[1.6] text-ink">
            {conducta.sancionDetalle}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {conducta.anosPrision && (
              <span className="rounded-full bg-white px-2 py-1 font-orbitron text-[9px] text-navy">
                ⚖ {conducta.anosPrision}
              </span>
            )}
            {conducta.multaUMA && (
              <span className="rounded-full bg-white px-2 py-1 font-orbitron text-[9px] text-navy">
                💰 {conducta.multaUMA}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Toggle hint */}
      <div className="mt-3 flex items-center justify-end">
        <span className="font-inter text-[10px] text-muted">
          {expandido ? 'Cerrar ↑' : 'Ver detalle ↓'}
        </span>
      </div>
    </button>
  );
}

function AutoridadCard({ autoridad }: { autoridad: (typeof AUTORIDADES_AV)[number] }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 transition-all hover:shadow-[0_8px_24px_rgba(0,43,127,0.06)]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-navy text-white">
          <span className="font-orbitron text-[10px] font-bold tracking-tight">
            {autoridad.sigla.slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-inter text-[13px] font-bold text-ink">
            {autoridad.sigla}
          </p>
          <p className="truncate font-inter text-[11px] text-muted">
            {autoridad.nombre}
          </p>
        </div>
      </div>
      <p className="mt-3 font-inter text-[11px] leading-[1.5] text-muted">
        {autoridad.funcion}
      </p>
    </div>
  );
}

function TimelineHito({ hito }: { hito: (typeof TIMELINE_REGULATORIO_AV)[number] }) {
  return (
    <div className="flex gap-4">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div
          className={`h-4 w-4 rounded-full border-2 ${
            hito.esCritico
              ? 'border-navy bg-navy'
              : 'border-line bg-cream'
          }`}
        />
        <div className="w-px flex-1 bg-line" />
      </div>

      {/* Content */}
      <div className="pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-navy px-2.5 py-0.5 font-orbitron text-[9px] font-bold tracking-widest text-white">
            {hito.fecha}
          </span>
          {hito.esCritico && (
            <span className="rounded-full bg-navy/10 px-2 py-0.5 font-inter text-[9px] font-bold text-navy">
              CRÍTICO
            </span>
          )}
        </div>
        <h4 className="mt-2 font-inter text-[14px] font-bold text-ink">
          {hito.titulo}
        </h4>
        <p className="mt-1 font-inter text-[12px] leading-[1.5] text-muted">
          {hito.descripcion}
        </p>
      </div>
    </div>
  );
}

function FronteraCard({ regla }: { regla: (typeof FRONTERA_LEGAL_AV)[number] }) {
  const esLegal = regla.estatus === 'LEGAL';
  return (
    <div
      className={`rounded-[16px] border p-4 ${
        esLegal
          ? 'border-navy/20 bg-surface'
          : 'border-navy bg-navy/5'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-full font-inter text-[13px] font-bold ${
            esLegal ? 'bg-navy/10 text-navy' : 'bg-navy text-white'
          }`}
        >
          {esLegal ? '✓' : '✕'}
        </span>
        <p className="font-inter text-[13px] font-bold text-ink">
          {regla.titulo}
        </p>
      </div>
      <p className="mt-2 font-inter text-[12px] leading-[1.5] text-muted">
        {regla.descripcion}
      </p>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════════

export default function MapaActivos({ onBack }: MapaActivosProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMarco, setFiltroMarco] = useState<FiltroMarco>('TODOS');
  const [filtroGravedad, setFiltroGravedad] = useState<FiltroGravedad>('TODAS');
  const [soloRelevantes, setSoloRelevantes] = useState(false);
  const [soloNoIgnorables, setSoloNoIgnorables] = useState(false);
  const [expandidoId, setExpandidoId] = useState<number | null>(null);

  const conductasFiltradas = useMemo(() => {
    let result = [...CONDUCTAS_AV];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        (c) =>
          c.conducta.toLowerCase().includes(q) ||
          c.articulo.toLowerCase().includes(q) ||
          c.calificacion.toLowerCase().includes(q) ||
          c.sancionCorta.toLowerCase().includes(q) ||
          c.sancionDetalle.toLowerCase().includes(q) ||
          c.marcoLegal.toLowerCase().includes(q),
      );
    }

    if (filtroMarco !== 'TODOS') {
      result = result.filter((c) => c.marcoLegal === filtroMarco);
    }

    if (filtroGravedad !== 'TODAS') {
      result = result.filter((c) => c.gravedad === filtroGravedad);
    }

    if (soloRelevantes) {
      result = result.filter((c) => c.relevanteParaContador);
    }

    if (soloNoIgnorables) {
      result = result.filter((c) => c.noIgnorable);
    }

    return result;
  }, [busqueda, filtroMarco, filtroGravedad, soloRelevantes, soloNoIgnorables]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroMarco('TODOS');
    setFiltroGravedad('TODAS');
    setSoloRelevantes(false);
    setSoloNoIgnorables(false);
    setExpandidoId(null);
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HEADER                                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeGold>MAPA ARK</BadgeGold>
          <span className="rounded-full bg-navy px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            Activos Virtuales
          </span>
          <span className="rounded-full border border-line bg-white px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            {RESUMEN_MAPA_AV.totalConductas} conductas
          </span>
        </div>

        <h1 className="mt-4 font-playfair text-[32px] font-black leading-[0.95] tracking-[-0.03em] text-ink sm:text-[42px] lg:text-[52px]">
          Mapa de Activos{' '}
          <span className="text-navy">Virtuales</span>
        </h1>

        <p className="mt-3 max-w-[640px] font-inter text-[14px] leading-[1.6] text-muted">
          {FILOSOFIA_AV}. Matriz de consulta legal con{' '}
          {RESUMEN_MAPA_AV.totalConductas} conductas mapeadas en{' '}
          {MARCOS_LEGALES_AV.length} marcos normativos. Actualizado para el
          contador que asesora clientes con cripto.
        </p>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 font-inter text-[12px] font-semibold text-ink transition hover:bg-cream"
          >
            ← Volver al dashboard
          </button>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RESUMEN EJECUTIVO                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="liquid-glass-dome mb-8 rounded-dome p-6 sm:p-7">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="font-playfair text-[36px] font-black leading-none text-navy">
              {RESUMEN_MAPA_AV.totalConductas}
            </p>
            <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
              Conductas
            </p>
          </div>
          <div className="border-l border-line pl-4 text-center">
            <p className="font-playfair text-[36px] font-black leading-none text-navy">
              {RESUMEN_MAPA_AV.conductasCriticas}
            </p>
            <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
              Críticas
            </p>
          </div>
          <div className="border-l border-line pl-4 text-center">
            <p className="font-playfair text-[36px] font-black leading-none text-ink">
              {RESUMEN_MAPA_AV.conductasRelevantesParaContador}
            </p>
            <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
              Para contador
            </p>
          </div>
          <div className="border-l border-line pl-4 text-center">
            <p className="font-playfair text-[36px] font-black leading-none text-ink">
              {RESUMEN_MAPA_AV.conductasNoIgnorables}
            </p>
            <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
              No ignorables
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FILTROS                                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="mb-6 space-y-4">
        {/* Búsqueda */}
        <div className="relative max-w-[520px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            ⌕
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar conducta, artículo, sanción..."
            className="h-[52px] w-full rounded-input border border-line bg-white pl-11 pr-4 font-inter text-[14px] text-ink outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Marco legal */}
          <select
            value={filtroMarco}
            onChange={(e) => setFiltroMarco(e.target.value as FiltroMarco)}
            className="h-10 rounded-[12px] border border-line bg-white px-3 font-inter text-[12px] text-ink outline-none focus:border-navy"
          >
            <option value="TODOS">Todos los marcos</option>
            {MARCOS_LEGALES_AV.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Gravedad */}
          <select
            value={filtroGravedad}
            onChange={(e) => setFiltroGravedad(e.target.value as FiltroGravedad)}
            className="h-10 rounded-[12px] border border-line bg-white px-3 font-inter text-[12px] text-ink outline-none focus:border-navy"
          >
            <option value="TODAS">Todas las gravedades</option>
            {GRAVEDADES_AV.map((g) => (
              <option key={g} value={g}>{etiquetaGravedad(g)}</option>
            ))}
          </select>

          {/* Toggles */}
          <button
            type="button"
            onClick={() => setSoloRelevantes(!soloRelevantes)}
            className={`h-10 rounded-full border px-4 font-inter text-[12px] font-semibold transition ${
              soloRelevantes
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-white text-muted hover:bg-cream'
            }`}
          >
            📋 Contador
          </button>

          <button
            type="button"
            onClick={() => setSoloNoIgnorables(!soloNoIgnorables)}
            className={`h-10 rounded-full border px-4 font-inter text-[12px] font-semibold transition ${
              soloNoIgnorables
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-white text-muted hover:bg-cream'
            }`}
          >
            ⚠ No ignorables
          </button>

          {/* Limpiar */}
          <button
            type="button"
            onClick={limpiarFiltros}
            className="h-10 rounded-full border border-line bg-white px-4 font-inter text-[12px] text-muted transition hover:bg-cream"
          >
            Limpiar
          </button>
        </div>

        {/* Contador de resultados */}
        <p className="font-inter text-[12px] text-muted">
          {conductasFiltradas.length} de {CONDUCTAS_AV.length} conductas
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* GRID DE CONDUCTAS                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="mb-16">
        {conductasFiltradas.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {conductasFiltradas.map((conducta) => (
              <ConductaCard
                key={conducta.id}
                conducta={conducta}
                expandido={expandidoId === conducta.id}
                onToggle={() =>
                  setExpandidoId(
                    expandidoId === conducta.id ? null : conducta.id,
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-line bg-surface-2 p-12 text-center">
            <p className="font-inter text-[14px] text-muted">
              Sin resultados para la búsqueda actual.
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-4 rounded-full bg-navy px-6 py-2 font-inter text-[12px] font-semibold text-white transition hover:bg-navy/90"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AUTORIDADES                                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="mb-16 scroll-mt-24" id="autoridades">
        <h2 className="font-playfair text-[28px] font-black tracking-tight text-ink">
          Autoridades regulatorias
        </h2>
        <p className="mt-2 max-w-[520px] font-inter text-[13px] text-muted">
          {RESUMEN_MAPA_AV.totalAutoridades} instituciones vigilan el
          ecosistema de activos virtuales en México.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {AUTORIDADES_AV.map((autoridad) => (
            <AutoridadCard key={autoridad.id} autoridad={autoridad} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TIMELINE REGULATORIO                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="mb-16 scroll-mt-24" id="timeline">
        <h2 className="font-playfair text-[28px] font-black tracking-tight text-ink">
          Timeline regulatorio 2026–2029
        </h2>
        <p className="mt-2 max-w-[520px] font-inter text-[13px] text-muted">
          Los próximos hitos que todo contador debe tener en el radar para sus
          clientes con activos virtuales.
        </p>
        <div className="mt-6 max-w-[640px]">
          {TIMELINE_REGULATORIO_AV.map((hito) => (
            <TimelineHito key={hito.orden} hito={hito} />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* UMBRALES DE REPORTE                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="mb-16 scroll-mt-24" id="umbrales">
        <h2 className="font-playfair text-[28px] font-black tracking-tight text-ink">
          Umbrales de reporte LFPIORPI
        </h2>
        <p className="mt-2 max-w-[520px] font-inter text-[13px] text-muted">
          Operaciones con activos virtuales = Actividad Vulnerable. Estos son
          los umbrales de reporte ante la UIF.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {UMBRALES_REPORTE_AV.map((umbral) => (
            <div
              key={umbral.id}
              className="rounded-card border border-line bg-surface p-5"
            >
              <p className="font-inter text-[10px] font-bold tracking-[0.16em] text-muted">
                {umbral.concepto.toUpperCase()}
              </p>
              <p className="mt-3 font-orbitron text-[28px] font-bold text-navy">
                {umbral.tipoUmbral === 'UMA'
                  ? `${umbral.cantidadUMA} UMA`
                  : 'Sin umbral'}
              </p>
              <p className="mt-2 font-inter text-[13px] font-semibold text-ink">
                {umbral.obligacion}
              </p>
              {umbral.nota && (
                <p className="mt-2 font-inter text-[11px] leading-[1.4] text-muted">
                  {umbral.nota}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FRONTERA LEGAL VS ILEGAL                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="mb-16 scroll-mt-24" id="frontera">
        <h2 className="font-playfair text-[28px] font-black tracking-tight text-ink">
          Frontera legal vs ilegal
        </h2>
        <p className="mt-2 max-w-[520px] font-inter text-[13px] text-muted">
          Guía práctica: qué pueden y qué no pueden hacer tus clientes con
          activos virtuales en México.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Legal */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-inter text-[14px] font-bold text-navy">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy/10 text-[13px]">
                ✓
              </span>
              Conductas legales
            </h3>
            <div className="space-y-3">
              {FRONTERA_LEGAL_AV.filter((r) => r.estatus === 'LEGAL').map(
                (regla) => (
                  <FronteraCard key={regla.id} regla={regla} />
                ),
              )}
            </div>
          </div>

          {/* Ilegal */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 font-inter text-[14px] font-bold text-navy">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[13px] text-white">
                ✕
              </span>
              Conductas ilegales / restringidas
            </h3>
            <div className="space-y-3">
              {FRONTERA_LEGAL_AV.filter((r) => r.estatus === 'ILEGAL').map(
                (regla) => (
                  <FronteraCard key={regla.id} regla={regla} />
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AVISO LEGAL Y FUENTES                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-line pt-8 pb-12">
        <div className="rounded-card border border-line bg-cream p-6">
          <p className="font-inter text-[12px] font-bold tracking-widest text-muted">
            AVISO LEGAL
          </p>
          <p className="mt-2 font-inter text-[12px] leading-[1.6] text-muted">
            {AVISO_LEGAL_AV}
          </p>
        </div>

        <div className="mt-6">
          <p className="font-inter text-[10px] font-bold tracking-widest text-muted">
            FUENTES
          </p>
          <ul className="mt-2 space-y-1">
            {FUENTES_AV.map((fuente, i) => (
              <li key={i} className="font-inter text-[11px] text-muted">
                • {fuente}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 font-inter text-[10px] text-muted">
          ARK Tools • Mapa de Activos Virtuales v1.0 • {FILOSOFIA_AV}
        </p>
      </footer>
    </main>
  );
}

export { MapaActivos };

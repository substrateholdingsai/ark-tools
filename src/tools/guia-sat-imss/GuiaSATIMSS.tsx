/**
 * ARK TOOLS — Guía SAT/IMSS
 * Componente Principal
 *
 * Guía interactiva de 8 pasos para responder requerimientos y actos de
 * fiscalización. Incluye catálogo de actos y plazos legales.
 */

import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Filter, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GoldDivider } from '@/components/ui';
import { PasoGuiaCard, ActoFiscalCard, PlazoClaveCard } from './components';
import {
  GUIA_PASOS,
  ACTOS_FISCALES,
  PLAZOS_CLAVE,
  NOTAS_PLAZOS,
} from '@/data/actos';
import type { PasoGuia, ActoFiscal, PlazoClave } from '@/data/actos';

interface GuiaSATIMSSProps {
  onBack?: () => void;
}

type FiltroActos = 'todos' | 'SAT' | 'IMSS';

export function GuiaSATIMSS({ onBack }: GuiaSATIMSSProps) {
  const [checklistProgress, setChecklistProgress] = useState<
    Record<number, Set<number>>
  >({});
  const [filtroActos, setFiltroActos] = useState<FiltroActos>('todos');

  const filteredActos = useMemo(() => {
    if (filtroActos === 'todos') return ACTOS_FISCALES;
    return ACTOS_FISCALES.filter((a: ActoFiscal) => a.autoridad === filtroActos);
  }, [filtroActos]);

  const progressSummary = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    let completedSteps = 0;

    for (const paso of GUIA_PASOS) {
      const completed = checklistProgress[paso.id] ?? new Set<number>();
      totalItems += paso.checklist.length;
      completedItems += completed.size;
      if (completed.size === paso.checklist.length && paso.checklist.length > 0) {
        completedSteps++;
      }
    }

    return {
      totalSteps: GUIA_PASOS.length,
      completedSteps,
      totalItems,
      completedItems,
      percentage:
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  }, [checklistProgress]);

  const handleToggleChecklist = useCallback(
    (pasoId: number, itemIndex: number) => {
      setChecklistProgress((prev) => {
        const prevSet = prev[pasoId] ?? new Set<number>();
        const newSet = new Set(prevSet);
        if (newSet.has(itemIndex)) {
          newSet.delete(itemIndex);
        } else {
          newSet.add(itemIndex);
        }
        return { ...prev, [pasoId]: newSet };
      });
    },
    []
  );

  const handleLimpiarChecklist = useCallback(() => {
    setChecklistProgress({});
  }, []);

  return (
    <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-12 space-y-16">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="
            inline-flex items-center gap-2
            text-[11px] font-bold tracking-[0.16em] uppercase
            text-muted hover:text-navy transition
            font-orbitron
          "
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      <header>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gold-dark uppercase font-orbitron">
            Compliance & Educación
          </span>
          <span className="text-white/20">•</span>
          <span className="text-xs text-muted">Guía de defensa fiscal</span>
        </div>
        <h1 className="font-playfair font-black text-[36px] md:text-[44px] leading-[0.95] tracking-[-0.03em] text-ink">
          Guía SAT / IMSS
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-muted max-w-[64ch] inter font-inter">
          Guía interactiva de 8 pasos para responder requerimientos y actos de
          fiscalización. Checklists, plazos legales y fundamentos.
        </p>
      </header>

      <section className="rounded-[20px] border border-line bg-surface p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-playfair font-black text-[22px] text-ink">
              Progreso de la Guía
            </h2>
            <p className="text-[13px] text-muted mt-1 font-inter">
              Completa cada checklist para seguir el flujo de respuesta.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="font-playfair font-black text-[32px] text-navy leading-none">
                {progressSummary.percentage}%
              </div>
              <div className="text-[10px] text-muted font-orbitron uppercase tracking-[0.1em] mt-1">
                Completado
              </div>
            </div>
            <div className="text-center">
              <div className="font-playfair font-black text-[32px] text-navy leading-none">
                {progressSummary.completedSteps}/{progressSummary.totalSteps}
              </div>
              <div className="text-[10px] text-muted font-orbitron uppercase tracking-[0.1em] mt-1">
                Pasos listos
              </div>
            </div>
            <div className="text-center">
              <div className="font-playfair font-black text-[32px] text-navy leading-none">
                {progressSummary.completedItems}/{progressSummary.totalItems}
              </div>
              <div className="text-[10px] text-muted font-orbitron uppercase tracking-[0.1em] mt-1">
                Items
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-300"
            style={{ width: `${progressSummary.percentage}%` }}
          />
        </div>
        {progressSummary.completedItems > 0 && (
          <button
            type="button"
            onClick={handleLimpiarChecklist}
            className="mt-3 text-[11px] font-medium text-muted hover:text-rose-500 transition font-inter"
          >
            Limpiar progreso
          </button>
        )}
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-navy text-white grid place-items-center">
            <CheckCircle size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-playfair font-black text-[28px] leading-[1] text-ink">
              Guía de Respuesta
            </h2>
            <p className="text-[13px] text-muted font-inter">
              Sigue los pasos en orden para responder correctamente.
            </p>
          </div>
        </div>
        <div className="space-y-6">
          {GUIA_PASOS.map((paso: PasoGuia) => (
            <PasoGuiaCard
              key={paso.id}
              paso={paso}
              completedItems={checklistProgress[paso.id] ?? new Set<number>()}
              onToggle={handleToggleChecklist}
            />
          ))}
        </div>
      </section>

      <GoldDivider spacing="lg" />

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-navy text-white grid place-items-center">
            <Filter size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-playfair font-black text-[28px] leading-[1] text-ink">
              Catálogo de Actos Fiscales
            </h2>
            <p className="text-[13px] text-muted font-inter">
              Conoce los actos más comunes de SAT e IMSS.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['todos', 'SAT', 'IMSS'] as const).map((filtro) => {
            const count =
              filtro === 'todos'
                ? ACTOS_FISCALES.length
                : ACTOS_FISCALES.filter((a: ActoFiscal) => a.autoridad === filtro).length;
            return (
              <button
                key={filtro}
                type="button"
                onClick={() => setFiltroActos(filtro)}
                className={cn(
                  'px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.1em] uppercase font-orbitron transition',
                  filtroActos === filtro
                    ? 'bg-navy text-white'
                    : 'bg-surface-2 text-muted hover:bg-surface-2/80'
                )}
              >
                {filtro === 'todos' ? 'Todos' : filtro} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActos.map((acto: ActoFiscal) => (
            <ActoFiscalCard key={acto.codigo} acto={acto} />
          ))}
        </div>
      </section>

      <GoldDivider spacing="lg" />

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-navy text-white grid place-items-center">
            <Clock size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-playfair font-black text-[28px] leading-[1] text-ink">
              Plazos Clave
            </h2>
            <p className="text-[13px] text-muted font-inter">
              Tiempos de respuesta y defensa según cada autoridad.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLAZOS_CLAVE.map((plazo: PlazoClave) => (
            <PlazoClaveCard key={plazo.id} plazo={plazo} />
          ))}
        </div>
      </section>

      <section>
        <div className="rounded-[16px] border border-line bg-surface p-6">
          <h3 className="font-playfair font-black text-[20px] text-ink mb-4">
            Notas Importantes
          </h3>
          <ul className="space-y-3">
            {NOTAS_PLAZOS.map((nota: string, index: number) => (
              <li
                key={index}
                className="flex items-start gap-3 text-[13px] leading-[1.5] text-muted font-inter"
              >
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
                <span>{nota}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="rounded-[16px] bg-surface-2 border border-line p-4 text-[11px] leading-[1.5] text-muted">
        <strong className="text-ink">Nota:</strong> Esta guía es de carácter
        educativo y no sustituye asesoría fiscal profesional. Los plazos y
        fundamentos pueden actualizarse. Verifica siempre con la normativa
        vigente.
      </div>
    </div>
  );
}

export default GuiaSATIMSS;
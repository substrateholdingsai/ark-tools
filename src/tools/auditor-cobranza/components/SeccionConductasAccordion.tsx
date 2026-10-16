// src/tools/auditor-cobranza/components/SeccionConductasAccordion.tsx

import { useState } from 'react';
import { CONDUCTAS_COBRANZA } from '@/data/conductas-cobranza';

interface SeccionConductasAccordionProps {
  conductasDetectadas: string[];
  onToggleConducta: (id: string) => void;
}

interface SeccionData {
  id: string;
  titulo: string;
  rango: string;
}

const SECCIONES: SeccionData[] = [
  { id: 'I', titulo: 'Identidad y Estructura Legal', rango: '1.1-1.7' },
  { id: 'II', titulo: 'Cobranza y Acoso', rango: '2.1-2.9' },
  { id: 'III', titulo: 'Smishing y Fraude', rango: '3.1-3.7' },
  { id: 'IV', titulo: 'Ciclo Deuda-Extorsión', rango: '4.1-4.7' },
  { id: 'V', titulo: 'Operativos Judiciales', rango: '5.1-5.3' },
  { id: 'VI', titulo: 'Estructura Financiera', rango: '6.1-6.4' },
  { id: 'VII', titulo: 'Contradicciones', rango: '7.1-7.6' },
];

function obtenerColorRiesgo(riesgo: string): string {
  switch (riesgo) {
    case 'CRITICO': return 'bg-red-50 border-red-200 text-red-700';
    case 'ALTO': return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'MEDIO': return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'BAJO': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    default: return 'bg-[var(--cream)] border-[var(--line)] text-[var(--muted)]';
  }
}

export function SeccionConductasAccordion({
  conductasDetectadas,
  onToggleConducta,
}: SeccionConductasAccordionProps) {
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<string[]>(['I', 'II']);

  const toggleSeccion = (id: string) => {
    setSeccionesAbiertas((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const totalDetectadas = conductasDetectadas.length;

  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-playfair font-bold text-[20px] leading-none text-[var(--ink)]">
            Conductas Detectadas
          </h2>
          <p className="font-inter text-[11px] text-[var(--muted)] mt-1">
            Secciones I–VII • Marque las conductas observadas
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--navy)] text-white font-inter text-[11px] font-bold">
          {totalDetectadas} detectadas
        </span>
      </div>

      {/* Secciones */}
      <div className="space-y-3">
        {SECCIONES.map((seccion) => {
          const conductasSeccion = CONDUCTAS_COBRANZA.filter(
            (c) => c.seccion === seccion.id,
          );
          const detectadasSeccion = conductasSeccion.filter((c) =>
            conductasDetectadas.includes(c.id),
          ).length;
          const estaAbierta = seccionesAbiertas.includes(seccion.id);

          return (
            <div
              key={seccion.id}
              className="rounded-[16px] border border-[var(--line)] overflow-hidden"
            >
              {/* Header de sección */}
              <button
                type="button"
                onClick={() => toggleSeccion(seccion.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-[var(--cream)] hover:bg-[var(--parchment)] transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 w-7 h-7 rounded-[8px] bg-[var(--navy)] text-white grid place-items-center font-orbitron text-[11px] font-bold">
                    {seccion.id}
                  </span>
                  <div className="min-w-0">
                    <p className="font-inter font-semibold text-[13px] text-[var(--ink)] leading-tight truncate">
                      {seccion.titulo}
                    </p>
                    <p className="font-orbitron text-[9px] tracking-widest text-[var(--muted)]">
                      [{seccion.rango}] • {conductasSeccion.length} conductas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {detectadasSeccion > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-inter text-[10px] font-bold">
                      {detectadasSeccion}
                    </span>
                  )}
                  <span
                    className={`text-[var(--muted)] transition-transform ${estaAbierta ? 'rotate-180' : ''}`}
                  >
                    ⌄
                  </span>
                </div>
              </button>

              {/* Contenido */}
              {estaAbierta && (
                <div className="px-4 py-3 space-y-2">
                  {conductasSeccion.map((conducta) => {
                    const detectada = conductasDetectadas.includes(conducta.id);
                    return (
                      <label
                        key={conducta.id}
                        className={`flex items-start gap-3 rounded-[12px] border px-3 py-2.5 cursor-pointer transition-all ${
                          detectada
                            ? 'bg-[var(--navy)] border-[var(--navy)] text-white'
                            : 'bg-white border-[var(--line)] hover:border-[var(--navy)]/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={detectada}
                          onChange={() => onToggleConducta(conducta.id)}
                          className="sr-only"
                        />
                        <span
                          className={`mt-0.5 w-4 h-4 rounded border grid place-items-center shrink-0 ${
                            detectada
                              ? 'bg-white border-white text-[var(--navy)]'
                              : 'border-[var(--line)]'
                          }`}
                        >
                          {detectada && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className={`font-inter text-[12px] font-semibold leading-tight ${detectada ? 'text-white' : 'text-[var(--ink)]'}`}>
                            {conducta.id} — {conducta.titulo}
                          </p>
                          <p className={`font-inter text-[10px] leading-[1.3] mt-0.5 ${detectada ? 'text-white/70' : 'text-[var(--muted)]'}`}>
                            {conducta.descripcion}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[8px] font-inter font-bold px-1.5 py-0.5 rounded-full border ${detectada ? 'bg-white/15 text-white border-white/20' : obtenerColorRiesgo(conducta.riesgo)}`}>
                              {conducta.riesgo}
                            </span>
                            {conducta.fundamento && (
                              <span className={`font-inter text-[9px] ${detectada ? 'text-white/60' : 'text-[var(--muted)]'}`}>
                                {conducta.fundamento}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

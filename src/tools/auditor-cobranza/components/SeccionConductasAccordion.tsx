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
    case 'CRITICO':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'ALTO':
      return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'MEDIO':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'BAJO':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    default:
      return 'bg-[var(--cream)] border-[var(--line)] text-[var(--muted)]';
  }
}

export function SeccionConductasAccordion({
  conductasDetectadas,
  onToggleConducta,
}: SeccionConductasAccordionProps) {
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<string[]>(['I', 'II']);

  const toggleSeccion = (id: string) => {
    setSeccionesAbiertas((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const totalDetectadas = conductasDetectadas.length;

  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-playfair text-[20px] font-bold leading-none text-[var(--ink)]">
            Conductas Detectadas
          </h2>
          <p className="mt-1 font-inter text-[11px] text-[var(--muted)]">
            Secciones I–VII • Marque las conductas observadas
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--navy)] px-3 py-1.5 font-inter text-[11px] font-bold text-white">
          {totalDetectadas} detectadas
        </span>
      </div>

      {/* Secciones */}
      <div className="space-y-3">
        {SECCIONES.map((seccion) => {
          const conductasSeccion = CONDUCTAS_COBRANZA.filter((c) => c.seccion === seccion.id);
          const detectadasSeccion = conductasSeccion.filter((c) =>
            conductasDetectadas.includes(c.id)
          ).length;
          const estaAbierta = seccionesAbiertas.includes(seccion.id);

          return (
            <div
              key={seccion.id}
              className="overflow-hidden rounded-[16px] border border-[var(--line)]"
            >
              {/* Header de sección */}
              <button
                type="button"
                onClick={() => toggleSeccion(seccion.id)}
                className="flex w-full items-center justify-between bg-[var(--cream)] px-4 py-3.5 text-left transition-colors hover:bg-[var(--parchment)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-[var(--navy)] font-orbitron text-[11px] font-bold text-white">
                    {seccion.id}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-inter text-[13px] font-semibold leading-tight text-[var(--ink)]">
                      {seccion.titulo}
                    </p>
                    <p className="font-orbitron text-[9px] tracking-widest text-[var(--muted)]">
                      [{seccion.rango}] • {conductasSeccion.length} conductas
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {detectadasSeccion > 0 && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-inter text-[10px] font-bold text-red-700">
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
                <div className="space-y-2 px-4 py-3">
                  {conductasSeccion.map((conducta) => {
                    const detectada = conductasDetectadas.includes(conducta.id);
                    return (
                      <label
                        key={conducta.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-[12px] border px-3 py-2.5 transition-all ${
                          detectada
                            ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                            : 'hover:border-[var(--navy)]/30 border-[var(--line)] bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={detectada}
                          onChange={() => onToggleConducta(conducta.id)}
                          className="sr-only"
                        />
                        <span
                          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                            detectada
                              ? 'border-white bg-white text-[var(--navy)]'
                              : 'border-[var(--line)]'
                          }`}
                        >
                          {detectada && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`font-inter text-[12px] font-semibold leading-tight ${detectada ? 'text-white' : 'text-[var(--ink)]'}`}
                          >
                            {conducta.id} — {conducta.titulo}
                          </p>
                          <p
                            className={`mt-0.5 font-inter text-[10px] leading-[1.3] ${detectada ? 'text-white/70' : 'text-[var(--muted)]'}`}
                          >
                            {conducta.descripcion}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`rounded-full border px-1.5 py-0.5 font-inter text-[8px] font-bold ${detectada ? 'border-white/20 bg-white/15 text-white' : obtenerColorRiesgo(conducta.riesgo)}`}
                            >
                              {conducta.riesgo}
                            </span>
                            {conducta.fundamento && (
                              <span
                                className={`font-inter text-[9px] ${detectada ? 'text-white/60' : 'text-[var(--muted)]'}`}
                              >
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

import React, { useState } from 'react';
import { ShieldAlert, AlertOctagon, CheckCircle2, Filter } from 'lucide-react';
import type { HallazgoRiesgo, NivelRiesgo } from '../types';

interface MatrizRiesgo5x5Props {
  hallazgos: HallazgoRiesgo[];
  onActualizarEstatus: (id: string, nuevoEstatus: HallazgoRiesgo['estatusSeguimiento']) => void;
}

export const MatrizRiesgo5x5: React.FC<MatrizRiesgo5x5Props> = ({
  hallazgos,
  onActualizarEstatus,
}) => {
  const [filtroNivel, setFiltroNivel] = useState<NivelRiesgo | 'TODOS'>('TODOS');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');

  const formatoMoneda = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  // Mapear matriz 5x5 (Probabilidad y de 5 a 1; Impacto x de 1 a 5)
  const contarPorCoordenada = (prob: number, imp: number) =>
    hallazgos.filter((h) => h.probabilidad === prob && h.impacto === imp).length;

  const colorNivel = (nivel: NivelRiesgo) => {
    switch (nivel) {
      case 'Crítico':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'Alto':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'Moderado':
        return 'bg-yellow-950/60 text-yellow-300 border-yellow-800';
      default:
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
    }
  };

  const hallazgosFiltrados = hallazgos.filter((h) => {
    if (filtroNivel !== 'TODOS' && h.nivelRiesgo !== filtroNivel) return false;
    if (filtroEstatus !== 'TODOS' && h.estatusSeguimiento !== filtroEstatus) return false;
    return true;
  });

  const totalInvolucrado = hallazgos.reduce((acc, h) => acc + h.importeInvolucrado, 0);

  return (
    <div className="space-y-6">
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Hallazgos Activos
          </div>
          <div className="font-mono text-2xl font-bold text-white">{hallazgos.length}</div>
          <p className="mt-1 text-xs text-slate-400">Identificados por el motor forense</p>
        </div>

        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-400">
            Riesgo Crítico & Alto
          </div>
          <div className="font-mono text-2xl font-bold text-rose-400">
            {
              hallazgos.filter((h) => h.nivelRiesgo === 'Crítico' || h.nivelRiesgo === 'Alto')
                .length
            }
          </div>
          <p className="mt-1 text-xs text-slate-400">Prioridad inmediata de aclaración</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Importe en Riesgo Fiscal
          </div>
          <div className="font-mono text-2xl font-bold text-amber-400">
            {formatoMoneda(totalInvolucrado)}
          </div>
          <p className="mt-1 text-xs text-slate-400">Monto acumulado con posible rechazo SAT</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Casos Corregidos / Aclarados
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-400">
            {
              hallazgos.filter(
                (h) => h.estatusSeguimiento === 'aclarado' || h.estatusSeguimiento === 'corregido'
              ).length
            }
          </div>
          <p className="mt-1 text-xs text-slate-400">Con expediente de soporte solventado</p>
        </div>
      </div>

      {/* Matriz 5x5 Visual */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-sky-400" />
          <h3 className="text-lg font-bold text-white">Matriz de Calor de Riesgo Fiscal (5 × 5)</h3>
        </div>

        <div className="grid grid-cols-6 gap-2 text-center text-xs">
          {/* Eje Y Header */}
          <div className="flex items-center justify-center font-bold text-slate-400">
            Probabilidad
          </div>
          {[1, 2, 3, 4, 5].map((imp) => (
            <div key={imp} className="p-2 font-bold text-slate-400">
              Impacto {imp}
            </div>
          ))}

          {/* Filas 5 a 1 */}
          {[5, 4, 3, 2, 1].map((prob) => (
            <React.Fragment key={prob}>
              <div className="flex items-center justify-center rounded bg-slate-950/40 p-2 font-bold text-slate-400">
                Nivel {prob}
              </div>
              {[1, 2, 3, 4, 5].map((imp) => {
                const count = contarPorCoordenada(prob, imp);
                const score = prob * imp;
                let bgCell = 'bg-slate-800/40 border-slate-700/40 text-slate-400';
                if (score >= 16) bgCell = 'bg-rose-950/80 border-rose-700 text-rose-300 font-bold';
                else if (score >= 10)
                  bgCell = 'bg-amber-950/70 border-amber-700 text-amber-300 font-semibold';
                else if (score >= 5)
                  bgCell = 'bg-yellow-950/40 border-yellow-800/60 text-yellow-300';
                else bgCell = 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300';

                return (
                  <div
                    key={`${prob}-${imp}`}
                    className={`flex h-14 flex-col items-center justify-center rounded-lg border transition-all ${bgCell}`}
                  >
                    <span className="font-mono text-base">{count > 0 ? count : '—'}</span>
                    <span className="text-[10px] opacity-75">
                      {score >= 16 ? 'CRÍTICO' : score >= 10 ? 'ALTO' : score >= 5 ? 'MOD' : 'BAJO'}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Filtros de la Tabla de Hallazgos */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Filtrar Hallazgos:
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
          >
            <option value="TODOS">Todos los estatus</option>
            <option value="pendiente">Solo Pendientes</option>
            <option value="en_revision">En Revisión</option>
            <option value="aclarado">Aclarados</option>
            <option value="corregido">Corregidos</option>
          </select>
          {(['TODOS', 'Crítico', 'Alto', 'Moderado', 'Bajo'] as const).map((nivel) => (
            <button
              key={nivel}
              onClick={() => setFiltroNivel(nivel)}
              className={`rounded-lg border px-3 py-1 transition-all ${
                filtroNivel === nivel
                  ? 'border-sky-500 bg-sky-600 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {nivel}
            </button>
          ))}
        </div>
      </div>

      {/* Lista / Tabla de Hallazgos */}
      <div className="space-y-3">
        {hallazgosFiltrados.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            No se identificaron hallazgos para los filtros seleccionados.
          </div>
        ) : (
          hallazgosFiltrados.map((h) => (
            <div
              key={h.id}
              className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/90 p-5 transition-all hover:border-slate-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${colorNivel(h.nivelRiesgo)}`}
                  >
                    {h.nivelRiesgo.toUpperCase()}
                  </span>
                  <h4 className="text-base font-bold text-white">{h.criterioNombre}</h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{h.periodo}</span>
                  <select
                    value={h.estatusSeguimiento}
                    onChange={(e) =>
                      onActualizarEstatus(
                        h.id,
                        e.target.value as HallazgoRiesgo['estatusSeguimiento']
                      )
                    }
                    className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="aclarado">Aclarado</option>
                    <option value="corregido">Corregido</option>
                  </select>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-300">{h.descripcion}</p>

              <div className="grid grid-cols-1 gap-3 border-t border-slate-800/60 pt-2 text-xs md:grid-cols-2">
                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <span className="mb-1 flex items-center gap-1 font-semibold text-rose-400">
                    <AlertOctagon className="h-3.5 w-3.5" /> Consecuencia Fiscal SAT:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    {h.posibleConsecuenciaFiscal}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                  <span className="mb-1 flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Recomendación Preventiva:
                  </span>
                  <p className="text-[11px] leading-relaxed text-slate-400">{h.recomendacion}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <span>
                  Importe Involucrado:{' '}
                  <strong className="font-mono text-white">
                    {formatoMoneda(h.importeInvolucrado)}
                  </strong>
                </span>
                <span>
                  Comprobantes Asociados:{' '}
                  <strong className="font-mono text-sky-400">{h.comprobantesUUIDs.length}</strong>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

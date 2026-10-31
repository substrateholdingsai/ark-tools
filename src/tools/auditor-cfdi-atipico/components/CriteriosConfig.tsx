import React from 'react';
import { Sliders, RotateCcw, BookOpen } from 'lucide-react';
import type { CriterioAtipicoConfig } from '../types';

interface CriteriosConfigProps {
  criterios: CriterioAtipicoConfig[];
  onActualizarCriterio: (id: string, activo: boolean, umbral: number) => void;
  onRestablecer: () => void;
}

export const CriteriosConfig: React.FC<CriteriosConfigProps> = ({
  criterios,
  onActualizarCriterio,
  onRestablecer,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Sliders className="h-5 w-5 text-sky-400" />
            Parámetros y Reglas del Motor Forense
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Habilite o ajuste los umbrales estadísticos y fiscales según la política de cumplimiento
            de su despacho.
          </p>
        </div>

        <button
          onClick={onRestablecer}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Restablecer Valores Oficiales
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {criterios.map((c) => (
          <div
            key={c.id}
            className={`space-y-3 rounded-xl border p-4 transition-all ${
              c.activo
                ? 'border-slate-800 bg-slate-900/80'
                : 'border-slate-800/40 bg-slate-950/40 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white">{c.nombre}</h4>
                <p className="mt-0.5 text-xs text-slate-400">{c.descripcion}</p>
              </div>

              <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={c.activo}
                  onChange={(e) => onActualizarCriterio(c.id, e.target.checked, c.umbral)}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-slate-800 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-sky-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            </div>

            <div className="flex items-start gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/60 p-2.5 text-[11px] text-slate-400">
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
              <span>
                <strong>Fundamento:</strong> {c.fundamento}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-400">Umbral Parametrizable:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={c.umbral}
                  disabled={!c.activo}
                  onChange={(e) =>
                    onActualizarCriterio(c.id, c.activo, parseFloat(e.target.value) || 0)
                  }
                  className="w-24 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-right font-mono text-xs text-white focus:border-sky-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

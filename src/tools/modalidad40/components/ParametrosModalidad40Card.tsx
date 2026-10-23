import { useState } from 'react';
import { DollarSign, Calendar, Clock, HelpCircle, UserCheck } from 'lucide-react';
import type { ParametrosModalidad40 } from '../types';
import { VALORES_OFICIALES_M40 } from '../lib/calcularModalidad40';

interface Props {
  params: ParametrosModalidad40;
  onChange: (params: ParametrosModalidad40) => void;
}

export function ParametrosModalidad40Card({ params, onChange }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const aplicarPreset = (
    ultimoSbc: number,
    sbcDeseado: number,
    semanas: number,
    meses: number,
    edad: number
  ) => {
    onChange({
      ...params,
      ultimoSbc,
      sbcDeseado,
      semanasPrevias: semanas,
      mesesAportacion: meses,
      edadJubilacion: edad,
    });
  };

  return (
    <div className="space-y-6 rounded-[24px] border border-line bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            HISTORIAL Y PROYECCIÓN IMSS
          </span>
          <h2 className="mt-0.5 font-playfair text-xl font-black text-navy">
            Parámetros del Asegurado
          </h2>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:border-navy hover:text-navy"
            title="Fundamento Legal LSS Art. 218"
          >
            <HelpCircle size={16} />
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-10 z-20 w-80 rounded-xl border border-line bg-surface p-4 text-[11px] leading-relaxed text-muted shadow-xl">
              <strong className="block font-bold text-navy">Acuerdo DOF 21/10/2026:</strong>
              El Consejo Técnico del IMSS dictó que el nuevo Salario Base de Cotización no puede
              exceder el último salario registrado previo a la baja más 1 UMA diaria ($117.31 MXN),
              con tope de 25 UMAs. Las semanas se acumulan prospectivamente sin opción de pago
              retroactivo.
            </div>
          )}
        </div>
      </div>

      {/* Inputs Principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Último SBC */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Último SBC al causar baja ($ MXN diario) *
          </label>
          <div className="relative mt-1.5">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <DollarSign size={16} />
            </span>
            <input
              type="number"
              min={VALORES_OFICIALES_M40.SMG_DIARIO}
              max={VALORES_OFICIALES_M40.TOPE_25_UMA}
              step="0.01"
              value={params.ultimoSbc || ''}
              onChange={(e) =>
                onChange({ ...params, ultimoSbc: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-10 pr-4 font-mono text-sm font-bold text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              placeholder="Ej. 650.00"
            />
          </div>
          <span className="mt-1 block text-[10px] text-muted">
            Mínimo: ${VALORES_OFICIALES_M40.SMG_DIARIO.toFixed(2)} MXN (SMG 2026)
          </span>
        </div>

        {/* SBC Deseado */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            SBC deseado en Modalidad 40 ($ MXN) *
          </label>
          <div className="relative mt-1.5">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <DollarSign size={16} />
            </span>
            <input
              type="number"
              min={VALORES_OFICIALES_M40.SMG_DIARIO}
              max={VALORES_OFICIALES_M40.TOPE_25_UMA}
              step="0.01"
              value={params.sbcDeseado || ''}
              onChange={(e) =>
                onChange({ ...params, sbcDeseado: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-10 pr-4 font-mono text-sm font-bold text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              placeholder="Ej. 2932.75"
            />
          </div>
          <span className="mt-1 block text-[10px] text-muted">
            Tope 25 UMAs: ${VALORES_OFICIALES_M40.TOPE_25_UMA.toFixed(2)} MXN
          </span>
        </div>

        {/* Semanas Previas */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Semanas Cotizadas Previas *
          </label>
          <div className="relative mt-1.5">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <Clock size={16} />
            </span>
            <input
              type="number"
              min={500}
              max={2500}
              step="1"
              value={params.semanasPrevias || ''}
              onChange={(e) =>
                onChange({
                  ...params,
                  semanasPrevias: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
              className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-10 pr-4 font-mono text-sm font-bold text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
              placeholder="Ej. 1250"
            />
          </div>
          <span className="mt-1 block text-[10px] text-muted">
            Mínimo 500 semanas reconocidas para Ley 73
          </span>
        </div>

        {/* Meses a Aportar */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Meses a Cotizar en Modalidad 40 *
          </label>
          <div className="relative mt-1.5">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
              <Calendar size={16} />
            </span>
            <select
              value={params.mesesAportacion}
              onChange={(e) =>
                onChange({ ...params, mesesAportacion: parseInt(e.target.value, 10) || 12 })
              }
              className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-10 pr-4 font-mono text-sm font-bold text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            >
              <option value={12}>12 Meses (1 Año · ~52 Semanas)</option>
              <option value={24}>24 Meses (2 Años · ~104 Semanas)</option>
              <option value={36}>36 Meses (3 Años · ~156 Semanas)</option>
              <option value={48}>48 Meses (4 Años · ~208 Semanas)</option>
              <option value={60}>60 Meses (5 Años · 250 Semanas Completas)</option>
            </select>
          </div>
          <span className="mt-1 block text-[10px] text-muted">
            El promedio de pensión toma las últimas 250 semanas
          </span>
        </div>

        {/* Edad de Retiro */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            Edad Proyectada de Jubilación *
          </label>
          <select
            value={params.edadJubilacion}
            onChange={(e) =>
              onChange({ ...params, edadJubilacion: parseInt(e.target.value, 10) || 65 })
            }
            className="mt-1.5 w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 font-mono text-sm font-bold text-navy focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          >
            <option value={60}>60 Años (75% de Cuantía)</option>
            <option value={61}>61 Años (80% de Cuantía)</option>
            <option value={62}>62 Años (85% de Cuantía)</option>
            <option value={63}>63 Años (90% de Cuantía)</option>
            <option value={64}>64 Años (95% de Cuantía)</option>
            <option value={65}>65 Años o más (100% de Cuantía Plena)</option>
          </select>
        </div>

        {/* Asignación Familiar */}
        <div className="flex flex-col justify-center pt-2">
          <label className="hover:bg-surface-3 flex cursor-pointer items-center space-x-3 rounded-xl border border-line bg-surface-2 p-3 transition">
            <input
              type="checkbox"
              checked={params.asignacionFamiliar}
              onChange={(e) => onChange({ ...params, asignacionFamiliar: e.target.checked })}
              className="h-4 w-4 rounded border-line text-navy focus:ring-navy"
            />
            <div className="flex items-center space-x-2">
              <UserCheck size={16} className="text-gold-dark" />
              <span className="text-xs font-medium text-navy">
                Asignación Familiar / Soledad (+15% Art. 164)
              </span>
            </div>
          </label>
          <span className="mt-1 block text-[10px] text-muted">
            Aplica 15% por cónyuge/concubina o ayuda asistencial por soledad
          </span>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="border-t border-line pt-4">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted">
          Escenarios Típicos de Despacho:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => aplicarPreset(500, 2932.75, 1200, 36, 65)}
            className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-navy transition hover:border-gold hover:bg-gold/10"
          >
            Baja $500 · 3 Años M40 · 65 Años
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset(1200, 2932.75, 1500, 60, 65)}
            className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-navy transition hover:border-gold hover:bg-gold/10"
          >
            Baja $1,200 · 5 Años M40 (250 Semanas)
          </button>
          <button
            type="button"
            onClick={() => aplicarPreset(350, 2932.75, 900, 24, 60)}
            className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-navy transition hover:border-gold hover:bg-gold/10"
          >
            Salario Mínimo · Retiro a los 60 (75%)
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Building2, Plus, UploadCloud, Sparkles } from 'lucide-react';
import type { Contribuyente } from '../types';

interface GestionContribuyentesProps {
  contribuyenteActivo: Contribuyente;
  todosContribuyentes: Contribuyente[];
  onSeleccionarContribuyente: (c: Contribuyente) => void;
  onAgregarContribuyente: (c: Contribuyente) => void;
  onCargarDemo: () => void;
  onArchivosSeleccionados: (files: File[]) => void;
  cargando: boolean;
  progresoMensaje: string;
}

export const GestionContribuyentes: React.FC<GestionContribuyentesProps> = ({
  contribuyenteActivo,
  todosContribuyentes,
  onSeleccionarContribuyente,
  onAgregarContribuyente,
  onCargarDemo,
  onArchivosSeleccionados,
  cargando,
  progresoMensaje,
}) => {
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoRFC, setNuevoRFC] = useState('');
  const [nuevaRazon, setNuevaRazon] = useState('');
  const [nuevoRegimen, setNuevoRegimen] = useState('601 - General de Ley Personas Morales');
  const [nuevoEjercicio, setNuevoEjercicio] = useState(2026);
  const [nuevaActividad, setNuevaActividad] = useState('');

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRFC.trim() || !nuevaRazon.trim()) return;

    onAgregarContribuyente({
      rfc: nuevoRFC.trim().toUpperCase(),
      razonSocial: nuevaRazon.trim().toUpperCase(),
      regimenFiscal: nuevoRegimen,
      ejercicio: nuevoEjercicio,
      actividadEconomica: nuevaActividad.trim(),
    });

    setModalNuevo(false);
    setNuevoRFC('');
    setNuevaRazon('');
    setNuevaActividad('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onArchivosSeleccionados(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onArchivosSeleccionados(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Contribuyente Activo y Carga Demo */}
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-800 bg-sky-950/80 text-sky-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contribuyente en Auditoría
              </div>
              <h2 className="text-lg font-bold text-white">{contribuyenteActivo.razonSocial}</h2>
              <div className="mt-0.5 flex items-center gap-3 text-xs">
                <span className="font-mono font-semibold text-sky-400">
                  {contribuyenteActivo.rfc}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  Ejercicio Fiscal {contribuyenteActivo.ejercicio}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={contribuyenteActivo.rfc}
              onChange={(e) => {
                const found = todosContribuyentes.find((c) => c.rfc === e.target.value);
                if (found) onSeleccionarContribuyente(found);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-sky-500 focus:outline-none"
            >
              {todosContribuyentes.map((c) => (
                <option key={c.rfc} value={c.rfc}>
                  {c.rfc} — {c.razonSocial.slice(0, 30)}...
                </option>
              ))}
            </select>

            <button
              onClick={() => setModalNuevo(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-700"
            >
              <Plus className="h-4 w-4 text-sky-400" /> Nuevo RFC
            </button>

            <button
              onClick={onCargarDemo}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:from-sky-500 hover:to-indigo-500"
            >
              <Sparkles className="h-4 w-4 text-amber-300" /> Cargar Datos Demo SAT
            </button>
          </div>
        </div>
      </div>

      {/* Zona Drag & Drop de Archivos XML y Metadata */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/60 p-8 text-center transition-all hover:border-sky-500/80"
      >
        <input
          type="file"
          multiple
          accept=".xml,.zip,.txt"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-800/80 bg-sky-950/60 text-sky-400 transition-transform group-hover:scale-110">
            <UploadCloud className="h-7 w-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">
              Arrastra aquí paquetes .ZIP con CFDIs, XMLs sueltos o Metadata del SAT (.txt)
            </h3>
            <p className="mx-auto mt-1 max-w-xl text-xs text-slate-400">
              Todo el procesamiento ocurre <strong>100% en tu navegador</strong> vía Web Workers y
              memoria local IndexedDB. Ninguna factura ni dato fiscal sale de tu equipo.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-sky-400">
            Explorar archivos en este equipo
          </span>
        </div>

        {cargando && (
          <div className="mt-4 flex animate-pulse items-center justify-center gap-2 rounded-xl border border-sky-800 bg-sky-950/90 p-3 text-xs text-sky-300">
            <Sparkles className="h-4 w-4 animate-spin text-amber-300" />
            <span>{progresoMensaje || 'Procesando comprobantes y cruzando metadata...'}</span>
          </div>
        )}
      </div>

      {/* Modal para crear nuevo RFC */}
      {modalNuevo && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-base font-bold text-white">Registrar Nuevo Contribuyente</h3>
            <form onSubmit={handleCrear} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-400">RFC</label>
                <input
                  type="text"
                  required
                  placeholder="AAA010101AAA"
                  value={nuevoRFC}
                  onChange={(e) => setNuevoRFC(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono uppercase text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-400">Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="EMPRESA EJEMPLO S.A. DE C.V."
                  value={nuevaRazon}
                  onChange={(e) => setNuevaRazon(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-400">Ejercicio Fiscal</label>
                <input
                  type="number"
                  required
                  value={nuevoEjercicio}
                  onChange={(e) => setNuevoEjercicio(parseInt(e.target.value) || 2026)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-400">Régimen Fiscal</label>
                <input
                  type="text"
                  value={nuevoRegimen}
                  onChange={(e) => setNuevoRegimen(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-400">
                  Actividad Económica Declarada
                </label>
                <input
                  type="text"
                  placeholder="Ej: Comercio al por mayor de abarrotes"
                  value={nuevaActividad}
                  onChange={(e) => setNuevaActividad(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white shadow hover:bg-sky-500"
                >
                  Guardar Contribuyente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

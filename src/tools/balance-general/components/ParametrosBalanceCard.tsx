import { useState } from 'react';
import { Upload } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  ejercicioActual: string;
  ejercicioAnterior: string;
  onChange: (ea: string, ean: string) => void;
}

export function ParametrosBalanceCard({ onFile, ejercicioActual, ejercicioAnterior, onChange }: Props) {
  const [drag, setDrag] = useState(false);

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-navy">Parámetros</h3>
          <p className="mt-1 text-sm text-muted">
            Carga balanza CSV/Excel (XLSX/XLS/CSV) o captura manual posterior.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={ejercicioActual}
            onChange={(e) => onChange(e.target.value, ejercicioAnterior)}
            placeholder="Ejercicio Actual (ej. 2026)"
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
          />
          <input
            value={ejercicioAnterior}
            onChange={(e) => onChange(ejercicioActual, e.target.value)}
            placeholder="Ejercicio Anterior (ej. 2025)"
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition ${
          drag ? 'border-gold bg-cream/40' : 'border-line'
        }`}
      >
        <Upload className="text-navy" size={28} />
        <p className="text-sm text-ink">Arrastra tu archivo o selecciona desde tu equipo</p>
        <label className="cursor-pointer rounded-full bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          Seleccionar archivo
        </label>
        <p className="text-xs text-muted">Formatos: CSV, XLSX, XLS</p>
      </div>
    </div>
  );
}

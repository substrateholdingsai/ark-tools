import { useState } from 'react';
import { ArrowLeft, FileDown, FileText, Sparkles } from 'lucide-react';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import { ParametrosBalanceCard } from './components/ParametrosBalanceCard';
import { TablaBalanceAnalitico } from './components/TablaBalanceAnalitico';
import { GraficosClasificacion } from './components/GraficosClasificacion';
import { ResultadoBalanceCard } from './components/ResultadoBalanceCard';
import { parseBalanzaFilas } from './lib/parserBalanza';
import { calcularTotales, analizarBalance } from './lib/calcularBalance';
import type { BalanzaFilaCSV, ResultadoAnalisis } from './types';
import * as XLSX from 'xlsx';

interface Props {
  onBack?: () => void;
}

export function CalculadoraBalance({ onBack }: Props) {
  const [ejercicioActual, setEjercicioActual] = useState('2026');
  const [ejercicioAnterior, setEjercicioAnterior] = useState('2025');
  const [res, setRes] = useState<ResultadoAnalisis | null>(null);

  const handleFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const wsname = wb.SheetNames[0];
    if (!wsname) return;
    const ws = wb.Sheets[wsname];
    if (!ws) return;
    const json = XLSX.utils.sheet_to_json<BalanzaFilaCSV>(ws, { defval: '' });

    const parsed = parseBalanzaFilas(json);
    const tot = calcularTotales(parsed.jerarquia);
    const anal = analizarBalance(parsed.jerarquia, tot);
    setRes(anal);
  };

  const exportCSV = () => {
    if (!res) return;
    const header = [
      'codigo',
      'nombre',
      'montoActual',
      'montoAnterior',
      'variacionAbsoluta',
      'variacionPorcentual',
      'avActual',
      'avAnterior',
    ];
    const rows = [header.join(',')].concat(
      res.cuentas.map((c) =>
        [
          c.codigo,
          `"${String(c.nombre).replace(/"/g, '""')}"`,
          c.montoActual,
          c.montoAnterior ?? '',
          c.variacionAbsoluta ?? '',
          c.variacionPorcentual ?? '',
          c.analisisVerticalActual ?? '',
          c.analisisVerticalAnterior ?? '',
        ].join(',')
      )
    );
    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance_general_${ejercicioActual}_vs_${ejercicioAnterior}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-10 md:px-10">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-navy">
            <Sparkles size={14} /> Herramienta #15 · Blindaje Patrimonial
          </div>
          <h1 className="font-playfair text-[38px] font-black leading-[0.95] tracking-[-0.02em] text-ink md:text-[52px]">
            Balance General · Análisis Horizontal/Vertical
          </h1>
          <p className="mt-2 max-w-[78ch] text-sm text-muted">
            Ingesta masiva CSV/Excel, validación A=P+C, AV/AH con precisión 2 decimales.
          </p>
        </div>
        {res && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-surface-2"
            >
              <FileDown size={14} /> CSV con BOM UTF-8
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90">
              <FileText size={14} /> Mensaje Ejecutivo WhatsApp
            </button>
          </div>
        )}
      </div>

      <ExpedienteToolBanner
        toolId="balance-general"
        titulo={`Balance General Comparativo ${ejercicioActual} vs ${ejercicioAnterior}`}
        inputs={{ ejercicioActual, ejercicioAnterior }}
        outputs={(res as unknown as Record<string, unknown>) || {}}
        disabled={!res}
      />

      <ParametrosBalanceCard
        onFile={handleFile}
        ejercicioActual={ejercicioActual}
        ejercicioAnterior={ejercicioAnterior}
        onChange={(a, b) => {
          setEjercicioActual(a);
          setEjercicioAnterior(b);
        }}
      />
      <ResultadoBalanceCard totales={res?.totales || null} />
      <TablaBalanceAnalitico res={res} />
      <GraficosClasificacion totales={res?.totales || null} />
    </div>
  );
}

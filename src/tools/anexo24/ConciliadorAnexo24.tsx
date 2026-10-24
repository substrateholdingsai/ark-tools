/**
 * ARK LEDGER — Herramienta #16: Motor de Conciliación Anexo 24
 * Componente Principal
 *
 * Automatización Cero-Captura:
 * 1. Cruce automático CFDI vs Anexo 24
 * 2. Descarte obligatorio de facturas canceladas con Metadata del SAT
 * 3. Exportación limpia a Excel (CSV BOM UTF-8) y Layout Pólizas (Contpaqi / COI)
 * 4. Integración con Expediente Único (Cloudflare D1) y Papel de Trabajo SHA-256 + QR
 */

import { useState, useMemo } from 'react';
import { ArrowLeft, FileSpreadsheet, Sparkles, Download } from 'lucide-react';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import { DropZoneMulti } from './components/DropZoneMulti';
import { ResumenCuadreDome } from './components/ResumenCuadreDome';
import { TablaConciliacion } from './components/TablaConciliacion';
import {
  ejecutarConciliacionAnexo24,
  exportarConciliacionCSV,
  exportarLayoutContpaqi,
} from './lib/motorConciliacion';
import type { FacturaCFDI } from '@/tools/xml-excel/types';
import type { CatalogoBalanzaAnexo24, MetadataParseResult } from './types';

interface ConciliadorAnexo24Props {
  onBack?: () => void;
}

export function ConciliadorAnexo24({ onBack }: ConciliadorAnexo24Props) {
  const [facturas, setFacturas] = useState<FacturaCFDI[]>([]);
  const [metadata, setMetadata] = useState<MetadataParseResult | null>(null);
  const [catalogo, setCatalogo] = useState<CatalogoBalanzaAnexo24 | null>(null);

  // Ejecución determinista del motor de conciliación en memoria
  const resultado = useMemo(() => {
    return ejecutarConciliacionAnexo24(facturas, metadata, catalogo);
  }, [facturas, metadata, catalogo]);

  const descargarArchivo = (contenido: string, nombreArchivo: string, tipoMime: string) => {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportarCSV = () => {
    if (facturas.length === 0) return;
    const csvContent = exportarConciliacionCSV(resultado);
    descargarArchivo(
      csvContent,
      `conciliacion_anexo24_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleExportarContpaqi = () => {
    if (resultado.polizas.length === 0) return;
    const layoutContent = exportarLayoutContpaqi(resultado);
    descargarArchivo(
      layoutContent,
      `polizas_contpaqi_${new Date().toISOString().slice(0, 10)}.txt`,
      'text/plain;charset=utf-8;'
    );
  };

  const handleLimpiarTodo = () => {
    setFacturas([]);
    setMetadata(null);
    setCatalogo(null);
  };

  const hayDatos = facturas.length > 0;

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-10 md:px-10">
      {/* Botón Volver al Dashboard */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      {/* Encabezado Principal de la Herramienta #16 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-navy">
            <Sparkles size={14} className="text-gold" />
            <span>Herramienta #16 · Automatización Cero-Captura</span>
          </div>
          <h1 className="font-playfair text-[38px] font-black leading-[0.95] tracking-[-0.02em] text-ink md:text-[50px]">
            Motor de Conciliación Anexo 24
          </h1>
          <p className="mt-2 max-w-[80ch] text-sm text-muted">
            Generador automático de pólizas de ingresos. Cruza CFDIs emitidos contra tu catálogo de
            cuentas Anexo 24, valida vigencia con Metadata del SAT y exporta a Excel y Contpaqi/COI.
          </p>
        </div>

        {/* Botones de Exportación */}
        {hayDatos && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportarCSV}
              className="shadow-2xs inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-ink hover:border-navy hover:bg-surface-2"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>CSV (BOM UTF-8)</span>
            </button>

            <button
              type="button"
              onClick={handleExportarContpaqi}
              className="shadow-2xs inline-flex cursor-pointer items-center gap-2 rounded-full bg-navy px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-navy/90"
            >
              <Download size={14} className="text-gold" />
              <span>Layout Pólizas (Contpaqi)</span>
            </button>
          </div>
        )}
      </div>

      {/* Banner de Sincronización con Expediente Único (Cloudflare D1 + SHA-256) */}
      <ExpedienteToolBanner
        toolId="anexo24"
        titulo={`Conciliación Anexo 24 (${facturas.length} CFDIs procesados)`}
        inputs={{
          totalFacturas: facturas.length,
          conMetadata: Boolean(metadata),
          conCatalogo: Boolean(catalogo),
        }}
        outputs={resultado as unknown as Record<string, unknown>}
        disabled={!hayDatos}
      />

      {/* Ingesta Multi-Archivo */}
      <DropZoneMulti
        facturas={facturas}
        metadata={metadata}
        catalogo={catalogo}
        onFacturasCargadas={setFacturas}
        onMetadataCargada={setMetadata}
        onCatalogoCargado={setCatalogo}
        onLimpiarTodo={handleLimpiarTodo}
      />

      {/* Cúpula de Cristal: Estado del Cuadre (LiquidGlassDome) */}
      {hayDatos && <ResumenCuadreDome resumen={resultado.resumen} />}

      {/* Matriz y Pólizas de Conciliación */}
      {hayDatos && <TablaConciliacion resultado={resultado} />}
    </div>
  );
}

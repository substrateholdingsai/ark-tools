/**
 * ARK TOOLS — Conversor XML a Excel
 * Componente: Zona Drag & Drop para carga masiva de XMLs (hasta 200 archivos)
 */

import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileCode, AlertCircle } from 'lucide-react';

interface DropZoneXMLProps {
  onFilesSelected: (files: File[]) => void;
  isLoading?: boolean;
  totalCargados: number;
}

const LIMITE_MAXIMO = 200;

export const DropZoneXML: React.FC<DropZoneXMLProps> = ({
  onFilesSelected,
  isLoading = false,
  totalCargados,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorLimite, setErrorLimite] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const procesarArchivos = useCallback(
    (lista: FileList | File[]) => {
      setErrorLimite(null);
      const arr = Array.from(lista);
      // Filtrar solo archivos con extensión .xml
      const xmls = arr.filter(
        (f) => f.name.toLowerCase().endsWith('.xml') || f.type.includes('xml')
      );

      if (xmls.length === 0) {
        setErrorLimite('Por favor selecciona archivos con formato .xml');
        return;
      }

      if (totalCargados + xmls.length > LIMITE_MAXIMO) {
        setErrorLimite(
          `Límite superado: puedes cargar hasta ${LIMITE_MAXIMO} archivos (tienes ${totalCargados} y se intentaron agregar ${xmls.length}).`
        );
        return;
      }

      onFilesSelected(xmls);
    },
    [onFilesSelected, totalCargados]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      procesarArchivos(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivos(e.target.files);
      // Reset input value to allow selecting the same file again if needed
      e.target.value = '';
    }
  };

  const handleClickZona = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onClick={handleClickZona}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all cursor-pointer select-none ${
          isDragOver
            ? 'border-gold bg-gold/10 scale-[1.01] shadow-lg shadow-gold/10'
            : 'border-white/15 bg-surface-raised/40 hover:border-gold/60 hover:bg-surface-raised/70'
        } ${isLoading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold border border-gold/30 shadow-inner">
          <UploadCloud className="h-8 w-8 stroke-[1.75]" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy border border-gold/40 text-[10px] font-bold text-gold">
            XML
          </span>
        </div>

        <h3 className="font-playfair text-xl md:text-2xl font-bold text-ink">
          {isLoading
            ? 'Extrayendo datos de comprobantes CFDI...'
            : 'Arrastra tus archivos XML aquí'}
        </h3>

        <p className="mt-2 text-sm text-muted max-w-md">
          O haz clic para explorar en tu equipo. Acepta hasta{' '}
          <strong className="text-gold font-semibold">200 comprobantes</strong> CFDI 4.0 o 3.3.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted/80">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 border border-white/10">
            <FileCode className="h-3.5 w-3.5 text-gold" />
            CFDI 4.0 / 3.3
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 border border-white/10">
            🔒 100% privado en tu navegador
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 border border-white/10">
            ⚡ Conversión instantánea a Excel
          </span>
        </div>
      </div>

      {errorLimite && (
        <div className="flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/40 p-3 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorLimite}</span>
        </div>
      )}
    </div>
  );
};

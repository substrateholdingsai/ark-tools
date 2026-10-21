/**
 * ARK TOOLS — Monitor de Actividades Vulnerables LFPIORPI (Herramienta #17)
 *
 * Módulo de Compliance y Prevención de Lavado de Dinero:
 * 1. Ingesta local de sábanas de cobranza (Zero-Data-Leak).
 * 2. Evaluación determinista contra umbrales oficiales en UMA 2026.
 * 3. Regla legal de acumulación móvil de 6 meses por cliente (LFPIORPI Art. 17).
 * 4. Semáforo preventivo (Verde / Identificación / Aviso SAT-UIF).
 * 5. Sellado criptográfico SHA-256 e integración con Expediente Único.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  ArrowDownToLine,
  ShieldCheck,
  FolderKanban,
  Check,
  AlertTriangle,
  Printer,
  Trash2,
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { useExpediente } from '@/context/ExpedienteContext';
import { useOptionalAuth } from '@/context/AuthContext';
import { PapelDeTrabajoModal } from '@/components/PapelDeTrabajoModal';
import type { ExpedienteRecord } from '@/lib/apiClient';

import type { OperacionCobranza, FraccionLFPIORPI, EvaluacionLFPIORPI } from './types';
import {
  evaluarOperacionesLFPIORPI,
  obtenerUmaDiariaVigente,
} from './lib/evaluadorActividadesVulnerables';
import { parsearPlantillaCobranza, generarPlantillaEjemploCobranzaCSV } from './lib/parserCobranza';
import { PanelFiltrosVulnerables } from './components/PanelFiltrosVulnerables';
import { ResumenAuditoriaDome } from './components/ResumenAuditoriaDome';
import { TablaMonitorLFPIORPI } from './components/TablaMonitorLFPIORPI';

interface MonitorLFPIORPIProps {
  onBack?: () => void;
}

export function MonitorLFPIORPI({ onBack }: MonitorLFPIORPIProps) {
  const { activeClient, saveCalculoExpediente } = useExpediente();
  const auth = useOptionalAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fraccion, setFraccion] = useState<FraccionLFPIORPI>('FRACCION_XV');
  const [operaciones, setOperaciones] = useState<OperacionCobranza[]>([]);
  const [evaluacion, setEvaluacion] = useState<EvaluacionLFPIORPI | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [errores, setErrores] = useState<string[]>([]);

  // Estado de archivado en Expediente Único
  const [isArchiving, setIsArchiving] = useState(false);
  const [archivedRecord, setArchivedRecord] = useState<ExpedienteRecord | null>(null);
  const [showPapelModal, setShowPapelModal] = useState(false);

  const umaDiaria = obtenerUmaDiariaVigente();

  // Re-evaluar automáticamente si cambia la fracción seleccionada o la lista de operaciones
  useEffect(() => {
    let cancelado = false;
    async function reevaluar() {
      if (operaciones.length === 0) {
        setEvaluacion(null);
        return;
      }
      setIsProcessing(true);
      try {
        const res = await evaluarOperacionesLFPIORPI(operaciones, fraccion, umaDiaria);
        if (!cancelado) {
          setEvaluacion(res);
        }
      } catch (err) {
        console.error('Error al evaluar operaciones LFPIORPI:', err);
      } finally {
        if (!cancelado) {
          setIsProcessing(false);
        }
      }
    }
    void reevaluar();
    return () => {
      cancelado = true;
    };
  }, [operaciones, fraccion, umaDiaria]);

  // Manejador de carga de archivo (CSV / TSV)
  const handleProcesarArchivo = (contenidoTexto: string) => {
    setErrores([]);
    setAdvertencias([]);
    const res = parsearPlantillaCobranza(contenidoTexto);

    if (!res.esValido) {
      setErrores(res.errores);
      setAdvertencias(res.advertencias);
      return;
    }

    setOperaciones(res.operacionesValidas);
    setAdvertencias(res.advertencias);
    setArchivedRecord(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        handleProcesarArchivo(text);
      }
    };
    reader.readAsText(file);
    // Limpiar input para permitir recargar el mismo archivo
    e.target.value = '';
  };

  // Cargar ejemplo precargado con casos representativos
  const handleCargarEjemplo = () => {
    const csv = generarPlantillaEjemploCobranzaCSV();
    handleProcesarArchivo(csv);
  };

  // Descargar plantilla CSV oficial
  const handleDescargarPlantilla = () => {
    const csv = generarPlantillaEjemploCobranzaCSV();
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Cobranza_LFPIORPI_ARK.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Archivar cálculo y emitir sello SHA-256 en D1 / Expediente
  const handleArchivarEnExpediente = async () => {
    if (!evaluacion || !activeClient) return;
    setIsArchiving(true);
    try {
      const inputs = {
        fraccion,
        actividad: evaluacion.resumen.actividadVulnerable,
        umaDiaria,
        totalOperaciones: operaciones.length,
      };
      const outputs = {
        resumen: evaluacion.resumen,
        clientes: evaluacion.clientes,
      };

      const titulo = `Auditoría Antilavado LFPIORPI — ${evaluacion.resumen.actividadVulnerable}`;
      const res = await saveCalculoExpediente('monitor-lfpiorpi', titulo, inputs, outputs, true);
      if (res?.expediente) {
        setArchivedRecord(res.expediente);
      }
    } catch (err) {
      console.error('Error archivando dictamen LFPIORPI:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleLimpiarDatos = () => {
    setOperaciones([]);
    setEvaluacion(null);
    setAdvertencias([]);
    setErrores([]);
    setArchivedRecord(null);
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-10 font-inter text-ink md:px-10">
      {/* ═══ ENCABEZADO Y ACCIONES PRINCIPALES ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-2 text-ink transition-colors hover:bg-surface-2/80"
              title="Volver al dashboard"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-playfair text-2xl font-black tracking-tight text-ink sm:text-3xl">
                Monitor de Actividades Vulnerables LFPIORPI
              </h1>
              <span className="rounded-full border border-gold/30 bg-gold/15 px-2.5 py-0.5 font-orbitron text-[11px] font-bold tracking-wide text-navy">
                HERRAMIENTA #17 · COMPLIANCE
              </span>
            </div>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Motor determinista contra topes en UMA 2026 con regla de acumulación móvil de 6 meses
              (Art. 17 LFPIORPI).
            </p>
          </div>
        </div>

        {/* Acciones de Plantilla */}
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            type="button"
            variant="default"
            size="sm"
            onClick={handleDescargarPlantilla}
            className="text-xs"
          >
            <ArrowDownToLine size={14} className="mr-1.5 text-navy" />
            Descargar Plantilla CSV
          </GlassButton>
          <GlassButton
            type="button"
            variant="primary"
            size="sm"
            disabled={isProcessing}
            onClick={handleCargarEjemplo}
            className="text-xs font-bold"
          >
            <Sparkles size={14} className="mr-1.5 text-gold-dark" />
            Cargar Muestra 1-Click
          </GlassButton>
        </div>
      </div>

      {/* ═══ CONFIGURACIÓN Y SELECTOR DE FRACCIÓN ═══ */}
      <PanelFiltrosVulnerables
        fraccionSeleccionada={fraccion}
        onCambiarFraccion={setFraccion}
        umaDiaria={umaDiaria}
      />

      {/* ═══ ZONA DE INGESTA / DRAG & DROP ═══ */}
      {operaciones.length === 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
              const text = evt.target?.result;
              if (typeof text === 'string') handleProcesarArchivo(text);
            };
            reader.readAsText(file);
          }}
          className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface-2/40 p-10 text-center transition-all hover:border-navy/40 hover:bg-surface-2/70"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-navy/20 bg-navy/5 text-navy">
            <UploadCloud size={32} />
          </div>
          <h3 className="mt-4 font-playfair text-xl font-bold text-ink">
            Cargar Sábana de Cobranza Mensual o Histórica
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted">
            Arrastra tu archivo CSV o haz clic para seleccionarlo. Procesamiento 100% local en tu
            navegador sin filtración de datos financieros (Zero-Data-Leak).
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <GlassButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet size={15} className="mr-2" />
              Seleccionar Archivo CSV
            </GlassButton>
            <GlassButton type="button" variant="default" size="sm" onClick={handleCargarEjemplo}>
              <Sparkles size={14} className="mr-1.5 text-navy" />
              Probar con Datos de Ejemplo
            </GlassButton>
          </div>

          <div className="mt-4 font-mono text-[11px] text-muted">
            Columnas requeridas: <strong>ID Cliente/RFC</strong>, <strong>Fecha de Pago</strong>,{' '}
            <strong>Monto Cobrado</strong>, <strong>Concepto</strong>.
          </div>
        </div>
      )}

      {/* ═══ MENSAJES DE ERROR O ADVERTENCIA ═══ */}
      {errores.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={15} className="text-rose-600" />
            <span>Errores de importación:</span>
          </div>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {errores.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {advertencias.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle size={15} className="text-amber-600" />
            <span>Avisos de validación ({advertencias.length}):</span>
          </div>
          <ul className="mt-1 max-h-28 list-inside list-disc space-y-0.5 overflow-y-auto text-[11px]">
            {advertencias.map((adv, idx) => (
              <li key={idx}>{adv}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ═══ RESULTADOS Y MONITOREO DETERMINISTA ═══ */}
      {evaluacion && (
        <div className="animate-[fadeIn_0.3s_ease] space-y-6">
          {/* Barra de estado con resumen y botón de reset */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                Resultados del Monitoreo
              </span>
              <span className="rounded-full bg-navy/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-navy">
                {evaluacion.resumen.totalOperaciones} pagos agrupados en{' '}
                {evaluacion.resumen.totalClientes} clientes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLimpiarDatos}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 font-inter text-xs text-muted hover:border-rose-300 hover:text-rose-600"
              >
                <Trash2 size={13} />
                Limpiar datos
              </button>
            </div>
          </div>

          {/* Resumen Ejecutivo KPI Dome */}
          <ResumenAuditoriaDome resumen={evaluacion.resumen} />

          {/* Tabla Semáforo con badges y avance */}
          <TablaMonitorLFPIORPI clientes={evaluacion.clientes} />

          {/* Sello SHA-256 y Barra de Expediente Único */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy/20 bg-gradient-to-r from-navy/5 to-surface-2 p-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-navy">
                <ShieldCheck size={16} className="text-gold-dark" />
                <span>SELLO DIGITAL DE AUDITORÍA SHA-256:</span>
              </div>
              <div className="break-all font-mono text-[10px] text-muted">
                {evaluacion.resumen.hashAuditoria}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {archivedRecord && (
                <GlassButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowPapelModal(true)}
                  className="text-xs"
                >
                  <Printer size={14} className="mr-1.5 text-navy" />
                  Ver Papel de Trabajo Oficial
                </GlassButton>
              )}

              {activeClient ? (
                <GlassButton
                  type="button"
                  variant={archivedRecord ? 'default' : 'primary'}
                  size="sm"
                  disabled={isArchiving || Boolean(archivedRecord)}
                  onClick={handleArchivarEnExpediente}
                  className="text-xs font-bold"
                >
                  {archivedRecord ? (
                    <>
                      <Check size={14} className="mr-1.5 text-emerald-600" />
                      Archivado en Expediente
                    </>
                  ) : isArchiving ? (
                    'Archivando...'
                  ) : (
                    <>
                      <FolderKanban size={14} className="mr-1.5 text-gold-dark" />
                      Archivar Dictamen en {activeClient.nombre.slice(0, 20)}
                    </>
                  )}
                </GlassButton>
              ) : (
                <span className="text-[11px] italic text-muted">
                  Selecciona un cliente arriba para archivar el dictamen en su expediente.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL PAPEL DE TRABAJO OFICIAL ═══ */}
      {archivedRecord && activeClient && (
        <PapelDeTrabajoModal
          isOpen={showPapelModal}
          onClose={() => setShowPapelModal(false)}
          despachoName={auth?.tenantName || 'Despacho Contable Especializado'}
          client={activeClient}
          expediente={archivedRecord}
        />
      )}
    </div>
  );
}

export default MonitorLFPIORPI;

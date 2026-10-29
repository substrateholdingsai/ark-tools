/**
 * ARK LEDGER — Cierre de Nómina Masivo & Cédula Concentradora (Sprint 11)
 *
 * Pantalla principal del procesador de nómina en lote:
 * 1. Parámetros del período (Semanal, Quincenal, Mensual) y Entidad Federativa (ISN).
 * 2. Ingesta de plantilla vía Drag & Drop, archivo CSV o carga de muestra (1-click).
 * 3. Pre-visualización y edición de la nómina con validaciones en tiempo real.
 * 4. Motor de cálculo de retenciones SAT, cuotas IMSS obrero e ISN estatal.
 * 5. Cédula Concentradora Oficial con Sello QR y layout de dispersión bancaria.
 * 6. Vinculación y archivado en el Expediente Único de la empresa cliente activa.
 */

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  Building2,
  AlertTriangle,
  Play,
  Printer,
  ArrowDownToLine,
  Trash2,
  Sparkles,
  ShieldCheck,
  FolderKanban,
  Check,
  Scale,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { ESTADOS } from '../isn/data/estados';
import type { Periodo } from '../nomina/types';
import type {
  TrabajadorFilaInput,
  ParametrosCierreNomina,
  CierreNominaCompleto,
  DictamenCruceJornada,
} from './types';
import { parsearPlantillaNomina, generarPlantillaEjemploCSV } from './lib/parserPlantilla';
import { procesarCierreNomina } from './lib/calcularCierreNomina';
import { descargarArchivo } from './lib/exportarCierre';
import {
  parsearLoteXmlsNomina,
  parsearCsvChecador,
  ejecutarCruceNominaChecador,
  generarLoteMuestraCruce,
  generarPlantillaChecadorCSV,
  generarCsvDiscrepancias,
} from './lib/cruceNominaChecador';
import { CedulaConcentradoraModal } from './components/CedulaConcentradoraModal';
import { CedulaCruceJornadaModal } from './components/CedulaCruceJornadaModal';
import { useExpediente } from '@/context/ExpedienteContext';
import { useOptionalAuth } from '@/context/AuthContext';

interface CierreNominaProps {
  onBack: () => void;
}

export function CierreNomina({ onBack }: CierreNominaProps) {
  const { activeClient, saveCalculoExpediente } = useExpediente();
  const auth = useOptionalAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parámetros de la corrida
  const [periodo, setPeriodo] = useState<Periodo>('quincenal');
  const [diasPeriodo, setDiasPeriodo] = useState<number>(15);
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [fechaFin, setFechaFin] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-15`;
  });
  const [fechaCorte, setFechaCorte] = useState<string>(() => {
    return new Date().toISOString().split('T')[0] || '';
  });

  const [empresaNombre, setEmpresaNombre] = useState<string>(() => {
    return activeClient?.tipo === 'empresa' ? activeClient.nombre : 'Mi Empresa S.A. de C.V.';
  });
  const [empresaRfc, setEmpresaRfc] = useState<string>(() => {
    return activeClient?.rfc || '';
  });

  const [estadoIsnId, setEstadoIsnId] = useState<string>('CDMX');
  const [estadoIsnNombre, setEstadoIsnNombre] = useState<string>('Ciudad de México');
  const [tasaIsn, setTasaIsn] = useState<number>(3.0);

  // Trabajadores y estado del lote
  const [trabajadores, setTrabajadores] = useState<TrabajadorFilaInput[]>([]);
  const [cierreCalculado, setCierreCalculado] = useState<CierreNominaCompleto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCedulaModal, setShowCedulaModal] = useState(false);
  const [advertenciasImport, setAdvertenciasImport] = useState<string[]>([]);
  const [erroresImport, setErroresImport] = useState<string[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archivedHash, setArchivedHash] = useState<string | null>(null);

  // Sincronizar con el cliente activo si cambia en la barra superior
  useEffect(() => {
    if (activeClient && activeClient.tipo === 'empresa') {
      setEmpresaNombre(activeClient.nombre);
      if (activeClient.rfc) setEmpresaRfc(activeClient.rfc);
    }
  }, [activeClient]);

  // Actualizar días de período
  const handlePeriodoChange = (newPeriodo: Periodo) => {
    setPeriodo(newPeriodo);
    if (newPeriodo === 'semanal') setDiasPeriodo(7);
    else if (newPeriodo === 'quincenal') setDiasPeriodo(15);
    else if (newPeriodo === 'mensual') setDiasPeriodo(30);
  };

  // Actualizar estado ISN
  const handleEstadoChange = (id: string) => {
    const est = ESTADOS.find((e) => e.id === id);
    if (est) {
      setEstadoIsnId(est.id);
      setEstadoIsnNombre(est.nombre);
      setTasaIsn(est.tasa);
    }
  };

  // Cargar plantilla de muestra
  const handleCargarEjemplo = () => {
    const csv = generarPlantillaEjemploCSV();
    const resultado = parsearPlantillaNomina(csv);
    setTrabajadores(resultado.trabajadoresValidos);
    setAdvertenciasImport(resultado.advertencias);
    setErroresImport(resultado.errores);
    setCierreCalculado(null);
    setArchivedHash(null);
  };

  // Descargar plantilla vacía
  const handleDescargarPlantilla = () => {
    const csv = generarPlantillaEjemploCSV();
    descargarArchivo(csv, 'Plantilla_Nomina_ARK_TOOLS.csv');
  };

  // Procesar archivo subido
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      const validacion = parsearPlantillaNomina(contenido);

      setTrabajadores(validacion.trabajadoresValidos);
      setAdvertenciasImport(validacion.advertencias);
      setErroresImport(validacion.errores);
      setCierreCalculado(null);
      setArchivedHash(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Ejecutar cálculo
  const handleEjecutarCierre = async () => {
    if (trabajadores.length === 0) return;

    setIsProcessing(true);
    const parametros: ParametrosCierreNomina = {
      periodo,
      diasPeriodo,
      fechaInicio,
      fechaFin,
      fechaCorte,
      empresaNombre,
      empresaRfc,
      estadoIsnId,
      estadoIsnNombre,
      tasaIsn,
      diasAguinaldo: 15,
      primaVacacionalPct: 25,
    };

    try {
      const resultado = await procesarCierreNomina(trabajadores, parametros);
      setCierreCalculado(resultado);
      setShowCedulaModal(true);
    } catch (err) {
      console.error('Error calculando nómina:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Archivar en expediente
  const handleArchivarEnExpediente = async () => {
    if (!cierreCalculado || !activeClient) return;
    setIsArchiving(true);
    try {
      const inputs = {
        parametros: cierreCalculado.parametros,
        totalTrabajadores: cierreCalculado.trabajadores.length,
      };
      const outputs = {
        resumen: cierreCalculado.resumen,
        trabajadores: cierreCalculado.trabajadores,
      };

      const titulo = `Cierre de Nómina ${periodo.toUpperCase()} — ${empresaNombre}`;
      const res = await saveCalculoExpediente('cierre-nomina', titulo, inputs, outputs, true);
      if (res?.expediente) {
        setArchivedHash(res.expediente.input_hash);
      }
    } catch (err) {
      console.error('Error archivando cierre:', err);
    } finally {
      setIsArchiving(false);
    }
  };

  // Eliminar un trabajador de la lista
  const handleEliminarTrabajador = (index: number) => {
    setTrabajadores((prev) => prev.filter((_, idx) => idx !== index));
    setCierreCalculado(null);
  };

  // ═══ ESTADO DEL SELECTOR DE MÓDULO ═══
  const [activeTab, setActiveTab] = useState<'batch' | 'cruce'>('batch');

  // ═══ ESTADO DEL MÓDULO DE CRUCE LABORAL-FISCAL ═══
  const [xmlsCruce, setXmlsCruce] = useState<string[]>([]);
  const [xmlFileNames, setXmlFileNames] = useState<string[]>([]);
  const [csvChecadorCruce, setCsvChecadorCruce] = useState<string>('');
  const [csvChecadorFileName, setCsvChecadorFileName] = useState<string>('');
  const [dictamenCruce, setDictamenCruce] = useState<DictamenCruceJornada | null>(null);
  const [isProcessingCruce, setIsProcessingCruce] = useState(false);
  const [showCedulaCruceModal, setShowCedulaCruceModal] = useState(false);
  const [archivedCruceHash, setArchivedCruceHash] = useState<string | null>(null);
  const [isArchivingCruce, setIsArchivingCruce] = useState(false);

  const xmlInputRef = useRef<HTMLInputElement>(null);
  const checadorInputRef = useRef<HTMLInputElement>(null);

  // Cargar caso de demostración del cruce
  const handleCargarMuestraCruce = async () => {
    setIsProcessingCruce(true);
    try {
      const muestra = generarLoteMuestraCruce();
      setXmlsCruce(muestra.xmls);
      setXmlFileNames([
        'CFDI_Nomina_Roberto_HEGR850101AB1.xml',
        'CFDI_Nomina_Mariana_LOMA900202CD2.xml',
        'CFDI_Nomina_Carlos_RACA920303EF3.xml',
        'CFDI_Nomina_Sofia_SATO950404GH4.xml',
        'CFDI_Nomina_Daniel_MORA880505IJ5.xml',
      ]);
      setCsvChecadorCruce(muestra.csvChecador);
      setCsvChecadorFileName('Checador_Biometrico_Quincena.csv');
      setArchivedCruceHash(null);

      const cfdis = parsearLoteXmlsNomina(muestra.xmls);
      const checador = parsearCsvChecador(muestra.csvChecador);
      const dictamen = await ejecutarCruceNominaChecador(cfdis, checador, {
        empresaNombre,
        empresaRfc,
      });
      setDictamenCruce(dictamen);
    } catch (err) {
      console.error('Error cargando muestra de cruce:', err);
    } finally {
      setIsProcessingCruce(false);
    }
  };

  // Descargar plantilla de checador
  const handleDescargarPlantillaChecador = () => {
    const csv = generarPlantillaChecadorCSV();
    descargarArchivo(csv, 'Plantilla_Reloj_Checador_ARK.csv');
  };

  // Subir XMLs de Nómina
  const handleXmlFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const xmlContents: string[] = [];
    const names: string[] = [];

    for (const f of files) {
      if (f.name.toLowerCase().endsWith('.xml')) {
        const text = await f.text();
        xmlContents.push(text);
        names.push(f.name);
      }
    }

    setXmlsCruce((prev) => [...prev, ...xmlContents]);
    setXmlFileNames((prev) => [...prev, ...names]);
    setDictamenCruce(null);
    setArchivedCruceHash(null);
  };

  // Subir CSV del Checador
  const handleChecadorCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvChecadorCruce(text);
    setCsvChecadorFileName(file.name);
    setDictamenCruce(null);
    setArchivedCruceHash(null);
  };

  // Ejecutar cruce
  const handleEjecutarCruce = async () => {
    if (xmlsCruce.length === 0 && !csvChecadorCruce) return;
    setIsProcessingCruce(true);
    try {
      const cfdis = parsearLoteXmlsNomina(xmlsCruce);
      const checador = parsearCsvChecador(csvChecadorCruce);
      const dictamen = await ejecutarCruceNominaChecador(cfdis, checador, {
        empresaNombre,
        empresaRfc,
      });
      setDictamenCruce(dictamen);
    } catch (err) {
      console.error('Error procesando cruce:', err);
    } finally {
      setIsProcessingCruce(false);
    }
  };

  // Descargar auditoría CSV del cruce
  const handleDescargarCsvDiscrepancias = () => {
    if (!dictamenCruce) return;
    const csv = generarCsvDiscrepancias(dictamenCruce);
    const nombre = `Auditoria_Jornada_Nomina_${empresaNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    descargarArchivo(csv, nombre);
  };

  // Archivar cruce en Expediente Único
  const handleArchivarCruceEnExpediente = async () => {
    if (!dictamenCruce || !activeClient) return;
    setIsArchivingCruce(true);
    try {
      const titulo = `Cruce Laboral-Fiscal Jornada vs Nómina — ${empresaNombre}`;
      const res = await saveCalculoExpediente(
        'cierre-nomina',
        titulo,
        {
          empresaNombre,
          empresaRfc,
          periodoAnalizado: dictamenCruce.periodoAnalizado,
          totalAuditados: dictamenCruce.totalColaboradoresAuditados,
        },
        dictamenCruce as unknown as Record<string, unknown>,
        true
      );
      if (res?.expediente) {
        setArchivedCruceHash(res.expediente.input_hash);
      }
    } catch (err) {
      console.error('Error archivando cruce:', err);
    } finally {
      setIsArchivingCruce(false);
    }
  };

  // Limpiar datos del cruce
  const handleLimpiarCruce = () => {
    setXmlsCruce([]);
    setXmlFileNames([]);
    setCsvChecadorCruce('');
    setCsvChecadorFileName('');
    setDictamenCruce(null);
    setArchivedCruceHash(null);
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-10 font-inter text-ink md:px-10">
      {/* ═══ ENCABEZADO Y REGRESO ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-2 text-ink transition-colors hover:bg-surface-2/80"
            title="Volver al catálogo de herramientas"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-playfair text-2xl font-black tracking-tight text-ink sm:text-3xl">
                Cierre de Nómina Masivo
              </h1>
              <span className="rounded-full border border-gold/30 bg-gold/15 px-2.5 py-0.5 font-orbitron text-[11px] font-bold tracking-wide text-navy">
                BATCH DOF 2026
              </span>
            </div>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Procesamiento de plantilla completa, retenciones LISR Art. 96, cuotas obreras LSS, ISN
              estatal y Cédula Concentradora con Sello QR.
            </p>
          </div>
        </div>

        {/* Acciones de plantilla */}
        <div className="flex items-center gap-2">
          {activeTab === 'batch' ? (
            <>
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
                onClick={handleCargarEjemplo}
                className="text-xs"
              >
                <Sparkles size={14} className="mr-1.5 text-navy" />
                Cargar 5 de Muestra
              </GlassButton>
            </>
          ) : (
            <>
              <GlassButton
                type="button"
                variant="default"
                size="sm"
                onClick={handleDescargarPlantillaChecador}
                className="text-xs"
              >
                <ArrowDownToLine size={14} className="mr-1.5 text-navy" />
                Plantilla Checador CSV
              </GlassButton>
              <GlassButton
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCargarMuestraCruce}
                className="text-xs"
              >
                <Sparkles size={14} className="mr-1.5 text-navy" />
                Cargar Demo (CFDI + Checador)
              </GlassButton>
            </>
          )}
        </div>
      </div>

      {/* ═══ SELECTOR DE PESTAÑAS DEL MÓDULO ═══ */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('batch')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'batch'
              ? 'border border-navy bg-navy text-white shadow-md'
              : 'border border-line bg-surface text-muted hover:border-navy/40 hover:text-navy'
          }`}
        >
          <Building2 size={15} className={activeTab === 'batch' ? 'text-gold' : ''} />
          <span>Cierre de Nómina & Cédula (Batch DOF)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cruce')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'cruce'
              ? 'border border-navy bg-navy text-white shadow-md'
              : 'border border-line bg-surface text-muted hover:border-navy/40 hover:text-navy'
          }`}
        >
          <Scale size={15} className={activeTab === 'cruce' ? 'text-gold' : ''} />
          <span>Cruce Laboral-Fiscal (CFDI vs Checador)</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
              activeTab === 'cruce' ? 'bg-gold text-navy' : 'bg-gold/20 text-navy'
            }`}
          >
            LFT 132 · SAT 27
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PESTAÑA 1: BATCH DOF — CIERRE DE NÓMINA MASIVO
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'batch' && (
        <div className="space-y-8">
          {/* ═══ SECCIÓN 1: PARÁMETROS DEL PERÍODO Y EMPRESA ═══ */}
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
              <Building2 size={16} className="text-gold" />
              <span>Configuración del Cierre & Entidad Federativa</span>
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
              {/* Empresa */}
              <div>
                <label className="mb-1 block font-semibold text-muted">
                  Empresa / Razón Social
                </label>
                <input
                  type="text"
                  value={empresaNombre}
                  onChange={(e) => setEmpresaNombre(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-medium text-ink focus:border-navy focus:outline-none"
                />
              </div>

              {/* RFC Empresa */}
              <div>
                <label className="mb-1 block font-semibold text-muted">RFC de la Empresa</label>
                <input
                  type="text"
                  value={empresaRfc}
                  onChange={(e) => setEmpresaRfc(e.target.value.toUpperCase())}
                  placeholder="OIN180425AB1"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono uppercase text-ink focus:border-navy focus:outline-none"
                />
              </div>

              {/* Período */}
              <div>
                <label className="mb-1 block font-semibold text-muted">Periodicidad de Pago</label>
                <select
                  value={periodo}
                  onChange={(e) => handlePeriodoChange(e.target.value as Periodo)}
                  className="w-full cursor-pointer rounded-xl border border-line bg-surface-2 px-3 py-2 font-semibold text-ink focus:border-navy focus:outline-none"
                >
                  <option value="quincenal">Quincenal (15 días)</option>
                  <option value="semanal">Semanal (7 días)</option>
                  <option value="mensual">Mensual (30 días)</option>
                </select>
              </div>

              {/* Estado para ISN */}
              <div>
                <label className="mb-1 block font-semibold text-muted">
                  Estado (Tasa ISN Estatal)
                </label>
                <select
                  value={estadoIsnId}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-line bg-surface-2 px-3 py-2 font-semibold text-ink focus:border-navy focus:outline-none"
                >
                  {ESTADOS.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre} — {est.tasa}%
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fechas de corte */}
            <div className="grid grid-cols-1 gap-4 border-t border-line/60 pt-2 text-xs sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-semibold text-muted">
                  Fecha Inicio del Período
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-1.5 font-mono text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-muted">Fecha Fin del Período</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-1.5 font-mono text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-muted">
                  Fecha de Corte (Antigüedad LFT)
                </label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-1.5 font-mono text-ink"
                />
              </div>
            </div>
          </div>

          {/* ═══ SECCIÓN 2: ZONA DE CARGA DE ARCHIVO ═══ */}
          {trabajadores.length === 0 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-line bg-surface-2/40 p-10 text-center transition-all hover:border-gold/60 hover:bg-surface-2/70"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/10 text-navy">
                <UploadCloud size={24} />
              </div>
              <h3 className="font-playfair text-lg font-bold text-ink">
                Arrastra tu plantilla de nómina en formato CSV o haz clic aquí
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted">
                Acepta archivos exportados desde Excel, NOI, Compaq o tu ERP con columnas de Nombre,
                Salario Diario, Ingreso, RFC y Percepciones.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <GlassButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCargarEjemplo();
                  }}
                  className="text-xs"
                >
                  <Sparkles size={14} className="mr-1.5 text-navy" />
                  Probar con 5 colaboradores de ejemplo
                </GlassButton>
              </div>
            </div>
          )}

          {/* Errores o advertencias de importación */}
          {erroresImport.length > 0 && (
            <div className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle size={15} />
                Errores detectados en la plantilla:
              </div>
              <ul className="list-disc space-y-0.5 pl-5">
                {erroresImport.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {advertenciasImport.length > 0 && (
            <div className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={14} />
                Avisos de formato:
              </div>
              <ul className="list-disc pl-5 text-[11px]">
                {advertenciasImport.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ═══ SECCIÓN 3: TABLA DE TRABAJADORES CARGADOS ═══ */}
          {trabajadores.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                    Colaboradores Listos ({trabajadores.length})
                  </span>
                  <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    Plantilla Validada
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer px-2 py-1 text-xs font-semibold text-navy hover:underline"
                  >
                    Reemplazar CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrabajadores([]);
                      setCierreCalculado(null);
                    }}
                    className="cursor-pointer px-2 py-1 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Limpiar lista
                  </button>
                </div>
              </div>

              <div className="max-h-[380px] overflow-x-auto overflow-y-auto rounded-xl border border-line">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 border-b border-line bg-surface-2 text-[10px] font-bold uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2.5">No</th>
                      <th className="px-3 py-2.5">Nombre</th>
                      <th className="px-3 py-2.5">RFC / NSS</th>
                      <th className="px-3 py-2.5">Fecha Ingreso</th>
                      <th className="px-3 py-2.5 text-right">Salario Diario</th>
                      <th className="px-3 py-2.5 text-center">Días Trab.</th>
                      <th className="px-3 py-2.5 text-right">Bonos / Extras</th>
                      <th className="px-3 py-2.5 text-right">Otras Deduc.</th>
                      <th className="px-3 py-2.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60 font-mono text-[11px]">
                    {trabajadores.map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-surface-2/40">
                        <td className="px-3 py-2 text-muted">{idx + 1}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-inter font-medium text-ink">
                          {t.nombre}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-muted">
                          <div>{t.rfc || '—'}</div>
                          <div className="text-[9px] text-muted/70">{t.nss || ''}</div>
                        </td>
                        <td className="px-3 py-2 text-muted">{t.fechaIngreso || '—'}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">
                          ${t.salarioDiario.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums">
                          {t.diasTrabajados ?? diasPeriodo}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-emerald-800">
                          $
                          {(
                            (t.bonos || 0) +
                            (t.horasExtras || 0) +
                            (t.otrasPercepciones || 0)
                          ).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-rose-800">
                          ${(t.otrasDeducciones || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarTrabajador(idx)}
                            className="cursor-pointer rounded p-1 text-muted hover:text-rose-600"
                            title="Eliminar trabajador"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* BOTÓN CTA PRINCIPAL DE PROCESAMIENTO */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                <div className="text-xs text-muted">
                  Se calculará la retención de ISR Art. 96, cuotas IMSS obreras y {tasaIsn}% de ISN
                  para los {trabajadores.length} colaboradores.
                </div>

                <GlassButton
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={isProcessing}
                  onClick={handleEjecutarCierre}
                  className="text-xs font-bold uppercase tracking-wider"
                >
                  <Play size={15} className="mr-2 text-navy" />
                  {isProcessing ? 'Procesando Lote...' : 'Procesar Cierre y Generar Cédula'}
                </GlassButton>
              </div>
            </div>
          )}

          {/* ═══ SECCIÓN 4: RESUMEN DEL CIERRE CALCULADO ═══ */}
          {cierreCalculado && (
            <div className="space-y-6 rounded-2xl border-2 border-navy/30 bg-surface p-6 shadow-xl sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                <div>
                  <div className="font-orbitron text-xs font-bold uppercase tracking-wider text-gold">
                    Cierre Procesado & Sellado con Éxito
                  </div>
                  <h2 className="mt-0.5 font-playfair text-xl font-black text-ink sm:text-2xl">
                    Resumen Ejecutivo — {empresaNombre}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <GlassButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setShowCedulaModal(true)}
                    className="text-xs"
                  >
                    <Printer size={14} className="mr-1.5" />
                    Ver Cédula Oficial (PDF & Sello)
                  </GlassButton>
                </div>
              </div>

              {/* 5 KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-xl border border-line bg-surface-2 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                    Nómina Bruta
                  </span>
                  <div className="mt-1 font-orbitron text-lg font-bold tabular-nums text-ink">
                    $
                    {cierreCalculado.resumen.totalPercepcionesBrutas.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    ISR Retenido SAT
                  </span>
                  <div className="mt-1 font-orbitron text-lg font-bold tabular-nums text-rose-950">
                    $
                    {cierreCalculado.resumen.totalISRRetenido.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    IMSS Obrero
                  </span>
                  <div className="mt-1 font-orbitron text-lg font-bold tabular-nums text-blue-950">
                    $
                    {cierreCalculado.resumen.totalIMSSObrero.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    ISN Estatal
                  </span>
                  <div className="mt-1 font-orbitron text-lg font-bold tabular-nums text-amber-950">
                    $
                    {cierreCalculado.resumen.totalISNEstatal.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="col-span-2 rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 sm:col-span-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                    Neto a Dispersar
                  </span>
                  <div className="mt-1 font-orbitron text-xl font-bold tabular-nums text-emerald-950">
                    $
                    {cierreCalculado.resumen.totalNetoDispersar.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              {/* Sello y Guardado en Expediente */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy/15 bg-navy/5 p-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-navy">
                    <ShieldCheck size={14} className="text-gold" />
                    <span>Sello SHA-256: {cierreCalculado.resumen.hashLote.slice(0, 32)}...</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted">
                    {cierreCalculado.resumen.importeNetoEnLetras}
                  </div>
                </div>

                {activeClient ? (
                  <GlassButton
                    type="button"
                    variant={archivedHash ? 'default' : 'primary'}
                    size="sm"
                    disabled={isArchiving || Boolean(archivedHash)}
                    onClick={handleArchivarEnExpediente}
                    className="text-xs"
                  >
                    {archivedHash ? (
                      <>
                        <Check size={14} className="mr-1.5 text-emerald-600" />
                        Archivado en Expediente
                      </>
                    ) : isArchiving ? (
                      'Archivando...'
                    ) : (
                      <>
                        <FolderKanban size={14} className="mr-1.5 text-gold" />
                        Archivar Cédula en {activeClient.nombre.slice(0, 20)}
                      </>
                    )}
                  </GlassButton>
                ) : (
                  <span className="text-[11px] italic text-muted">
                    Selecciona un cliente arriba para archivar esta cédula en su historial.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PESTAÑA 2: CRUCE LABORAL-FISCAL (CFDI NÓMINA VS RELOJ CHECADOR)
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'cruce' && (
        <div className="space-y-8">
          {/* BANNER INFORMATIVO JURÍDICO */}
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-2 font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
              <Scale size={16} className="text-gold" />
              <span>Marco Normativo: Registro de Jornada vs. Deducibilidad de Nómina</span>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              La reforma al{' '}
              <strong>Artículo 132 Fracción VIII Bis de la Ley Federal del Trabajo</strong>{' '}
              establece la obligatoriedad del registro electrónico y fehaciente de jornada. Aunque
              la <strong>STPS</strong> es la autoridad laboral sancionadora, el <strong>SAT</strong>{' '}
              y el <strong>IMSS</strong> emplean la información del reloj checador para auditorías
              cruzadas: discrepancias entre horas extras en CFDI y checador pueden motivar el
              rechazo de la deducción (<strong>Art. 27 Fracc. V LISR</strong> y{' '}
              <strong>Art. 28 CFF</strong>) o fincamientos por omisión de cuotas de seguridad
              social.
            </p>
          </div>

          {/* ZONA DE CARGA DE ARCHIVOS (CFDI XMLs + CHECADOR CSV) */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 1. CARGA DE XMLs DE CFDI NÓMINA */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-navy" />
                  <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                    1. CFDIs de Nómina (XML)
                  </span>
                </div>
                {xmlsCruce.length > 0 && (
                  <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {xmlsCruce.length} CFDI(s) Listos
                  </span>
                )}
              </div>

              <input
                ref={xmlInputRef}
                type="file"
                multiple
                accept=".xml"
                onChange={handleXmlFilesUpload}
                className="hidden"
              />

              {xmlsCruce.length === 0 ? (
                <div
                  onClick={() => xmlInputRef.current?.click()}
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-2/40 p-8 text-center transition-all hover:border-gold/60 hover:bg-surface-2/70"
                >
                  <UploadCloud size={28} className="mb-2 text-navy/70" />
                  <div className="font-playfair text-sm font-bold text-ink">
                    Selecciona o arrastra los XMLs de Nómina
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    Soporta múltiples archivos XML de CFDI 4.0 / 3.3 con Complemento de Nómina 1.2
                  </p>
                  <GlassButton type="button" variant="default" size="sm" className="mt-4 text-xs">
                    Explorar XMLs
                  </GlassButton>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{xmlsCruce.length} archivo(s) XML cargado(s) correctamente</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto rounded-xl border border-line bg-surface-2 p-3 font-mono text-[10px] text-muted">
                    {xmlFileNames.map((name, i) => (
                      <div key={i} className="truncate">
                        &bull; {name}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => xmlInputRef.current?.click()}
                      className="cursor-pointer text-xs font-semibold text-navy hover:underline"
                    >
                      + Agregar más XMLs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setXmlsCruce([]);
                        setXmlFileNames([]);
                        setDictamenCruce(null);
                      }}
                      className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Limpiar XMLs
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CARGA DE CSV DEL RELOJ CHECADOR */}
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-navy" />
                  <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                    2. Reloj Checador (CSV)
                  </span>
                </div>
                {csvChecadorCruce && (
                  <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    CSV Cargado
                  </span>
                )}
              </div>

              <input
                ref={checadorInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleChecadorCsvUpload}
                className="hidden"
              />

              {!csvChecadorCruce ? (
                <div
                  onClick={() => checadorInputRef.current?.click()}
                  className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-2/40 p-8 text-center transition-all hover:border-gold/60 hover:bg-surface-2/70"
                >
                  <FileSpreadsheet size={28} className="mb-2 text-navy/70" />
                  <div className="font-playfair text-sm font-bold text-ink">
                    Selecciona o arrastra el CSV del Checador
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    Columnas: RFC, Fecha, Horas Trabajadas y Horas Extras (o Entrada y Salida)
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <GlassButton type="button" variant="default" size="sm" className="text-xs">
                      Explorar CSV
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Archivo cargado: {csvChecadorFileName || 'Asistencia_Checador.csv'}</span>
                  </div>
                  <div className="rounded-xl border border-line bg-surface-2 p-3 font-mono text-[10px] text-muted">
                    Registros procesados y consolidados listos para cotejo contra CFDI.
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => checadorInputRef.current?.click()}
                      className="cursor-pointer text-xs font-semibold text-navy hover:underline"
                    >
                      Reemplazar CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCsvChecadorCruce('');
                        setCsvChecadorFileName('');
                        setDictamenCruce(null);
                      }}
                      className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Limpiar Checador
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTÓN CTA PRINCIPAL DEL CRUCE */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="text-xs text-muted">
              {xmlsCruce.length > 0 || csvChecadorCruce ? (
                <span>
                  {xmlsCruce.length} CFDI(s) y{' '}
                  {csvChecadorCruce ? '1 archivo de asistencia' : '0 checador'} listos para
                  auditoría cruzada.
                </span>
              ) : (
                <span>
                  Carga tus archivos de CFDI y Checador, o prueba con el caso de demostración con 1
                  clic.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {(xmlsCruce.length > 0 || csvChecadorCruce) && (
                <button
                  type="button"
                  onClick={handleLimpiarCruce}
                  className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-muted hover:text-rose-600"
                >
                  Limpiar Todo
                </button>
              )}
              <GlassButton
                type="button"
                variant="primary"
                size="md"
                disabled={isProcessingCruce || (xmlsCruce.length === 0 && !csvChecadorCruce)}
                onClick={handleEjecutarCruce}
                className="text-xs font-bold uppercase tracking-wider"
              >
                <Play size={15} className="mr-2 text-navy" />
                {isProcessingCruce ? 'Auditando Cruce...' : 'Ejecutar Cruce de Jornada'}
              </GlassButton>
            </div>
          </div>

          {/* ═══ RESULTADO: DICTAMEN DE CRUCE LABORAL-FISCAL ═══ */}
          {dictamenCruce && (
            <div className="space-y-6 rounded-2xl border-2 border-navy/30 bg-surface p-6 shadow-xl sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                <div>
                  <div className="font-orbitron text-xs font-bold uppercase tracking-wider text-gold">
                    Dictamen de Consistencia Generado &bull; Sello SHA-256
                  </div>
                  <h2 className="mt-0.5 font-playfair text-xl font-black text-ink sm:text-2xl">
                    Auditoría de Jornada — {dictamenCruce.empresaNombre}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <GlassButton
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleDescargarCsvDiscrepancias}
                    className="text-xs"
                  >
                    <FileSpreadsheet size={14} className="mr-1.5 text-navy" />
                    Descargar CSV
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setShowCedulaCruceModal(true)}
                    className="text-xs"
                  >
                    <Printer size={14} className="mr-1.5 text-gold" />
                    Ver Cédula Oficial (PDF & Sello)
                  </GlassButton>
                </div>
              </div>

              {/* SEMÁFORO Y SCORE GLOBAL */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-surface-2/40 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="font-orbitron text-3xl font-black text-navy">
                    {dictamenCruce.scoreConsistencia}
                    <span className="text-xs font-normal text-muted">/100</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                      Score de Consistencia
                    </span>
                    <span className="text-xs text-muted">Materialidad LISR & LFT</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-xl border px-3 py-1.5 font-orbitron text-xs font-bold ${
                      dictamenCruce.nivelRiesgoGlobal === 'BAJO'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : dictamenCruce.nivelRiesgoGlobal === 'MEDIO'
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : dictamenCruce.nivelRiesgoGlobal === 'ALTO'
                            ? 'border-orange-300 bg-orange-50 text-orange-800'
                            : 'border-rose-300 bg-rose-50 text-rose-900'
                    }`}
                  >
                    RIESGO {dictamenCruce.nivelRiesgoGlobal}
                  </span>
                  <div className="text-[11px] text-muted">
                    {dictamenCruce.colaboradoresConDiscrepancia === 0
                      ? 'Sin inconsistencias observadas'
                      : `${dictamenCruce.colaboradoresConDiscrepancia} colaborador(es) con observación`}
                  </div>
                </div>

                <div className="flex items-center justify-end font-mono text-xs text-muted">
                  Auditoría cerrada al{' '}
                  {new Date(dictamenCruce.fechaEmision).toLocaleDateString('es-MX')}
                </div>
              </div>

              {/* 4 KPIS */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-line bg-surface-2 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted">
                    Auditados Totales
                  </span>
                  <div className="mt-1 font-orbitron text-xl font-bold text-navy">
                    {dictamenCruce.totalColaboradoresAuditados}
                  </div>
                  <span className="text-[10px] text-muted">colaboradores en el lote</span>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    Con Discrepancia
                  </span>
                  <div className="mt-1 font-orbitron text-xl font-bold text-rose-950">
                    {dictamenCruce.colaboradoresConDiscrepancia}
                  </div>
                  <span className="text-[10px] text-rose-800">requieren aclaración</span>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    Horas Extras Checador
                  </span>
                  <div className="mt-1 font-orbitron text-xl font-bold text-amber-950">
                    {dictamenCruce.totalHorasExtrasChecador} hrs
                  </div>
                  <span className="text-[10px] text-amber-800">registradas en biométrico</span>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-800">
                    Horas Extras CFDI
                  </span>
                  <div className="mt-1 font-orbitron text-xl font-bold text-blue-950">
                    {dictamenCruce.totalHorasExtrasPagadasCfdi} hrs
                  </div>
                  <span className="text-[10px] text-blue-800">
                    Dif: {dictamenCruce.diferenciaNetaHorasExtras > 0 ? '+' : ''}
                    {dictamenCruce.diferenciaNetaHorasExtras} hrs
                  </span>
                </div>
              </div>

              {/* ALERTAS JURÍDICAS */}
              <div className="space-y-2 rounded-xl border border-line bg-surface-2/60 p-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-navy">
                  <AlertTriangle size={15} className="text-gold" />
                  <span>Diagnóstico y Conclusiones de Auditoría Cruzada</span>
                </div>
                <ul className="space-y-1 text-[11px] leading-relaxed">
                  {dictamenCruce.alertasPrincipales.map((alerta, i) => (
                    <li key={i} className="flex items-start gap-1.5 font-medium text-ink">
                      <span>&bull;</span>
                      <span>{alerta}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* TABLA DE DISCREPANCIAS */}
              <div className="space-y-2">
                <span className="font-orbitron text-xs font-bold uppercase tracking-wider text-navy">
                  Detalle por Colaborador ({dictamenCruce.discrepancias.length})
                </span>
                <div className="max-h-[380px] overflow-x-auto overflow-y-auto rounded-xl border border-line">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 border-b border-line bg-surface-2 text-[10px] font-bold uppercase text-muted">
                      <tr>
                        <th className="px-3 py-2.5">No</th>
                        <th className="px-3 py-2.5">Colaborador / RFC</th>
                        <th className="px-3 py-2.5 text-center">Checador Tot / Ext</th>
                        <th className="px-3 py-2.5 text-center">CFDI Ord / Ext</th>
                        <th className="px-3 py-2.5 text-center">Diferencia</th>
                        <th className="px-3 py-2.5">Hallazgo & Fundamento Legal</th>
                        <th className="px-3 py-2.5 text-center">Riesgo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60 font-mono text-[11px]">
                      {dictamenCruce.discrepancias.map((d, idx) => (
                        <tr key={d.rfc} className="hover:bg-surface-2/40">
                          <td className="px-3 py-2 text-muted">{idx + 1}</td>
                          <td className="px-3 py-2 font-inter">
                            <div className="font-medium text-ink">{d.nombre}</div>
                            <div className="font-mono text-[10px] text-muted">{d.rfc}</div>
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums">
                            <div>{d.horasChecadorTotal.toFixed(1)} hrs</div>
                            <div className="text-[10px] font-semibold text-amber-800">
                              {d.horasChecadorExtras > 0
                                ? `+${d.horasChecadorExtras.toFixed(1)} ext`
                                : '0 ext'}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums">
                            <div>{d.horasCfdiOrdinarias.toFixed(1)} hrs</div>
                            <div className="text-[10px] font-semibold text-blue-800">
                              {d.horasCfdiExtras > 0
                                ? `+${d.horasCfdiExtras.toFixed(1)} ext`
                                : '0 ext'}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center font-bold tabular-nums">
                            <span
                              className={
                                d.diferenciaHorasExtras > 0
                                  ? 'text-rose-700'
                                  : d.diferenciaHorasExtras < 0
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                              }
                            >
                              {d.diferenciaHorasExtras > 0
                                ? `+${d.diferenciaHorasExtras.toFixed(1)}`
                                : d.diferenciaHorasExtras.toFixed(1)}
                            </span>
                          </td>
                          <td className="max-w-sm px-3 py-2 font-inter">
                            <div className="text-[11px] font-medium text-ink">{d.detalles}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-navy">
                              {d.fundamentoLegal}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center font-orbitron">
                            <span
                              className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                                d.nivelRiesgo === 'BAJO'
                                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : d.nivelRiesgo === 'MEDIO'
                                    ? 'border border-amber-200 bg-amber-50 text-amber-800'
                                    : d.nivelRiesgo === 'ALTO'
                                      ? 'border border-orange-200 bg-orange-50 text-orange-800'
                                      : 'border border-rose-300 bg-rose-50 text-rose-900'
                              }`}
                            >
                              {d.nivelRiesgo}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SELLO Y ARCHIVADO EN EXPEDIENTE */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-navy/15 bg-navy/5 p-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-navy">
                    <ShieldCheck size={14} className="text-gold" />
                    <span>Sello SHA-256: {dictamenCruce.selloSha256.slice(0, 32)}...</span>
                  </div>
                  <div className="text-[10px] text-muted">
                    Score {dictamenCruce.scoreConsistencia}/100 &bull; Nivel de Riesgo:{' '}
                    {dictamenCruce.nivelRiesgoGlobal} &bull; Auditoría CFF Art. 28
                  </div>
                </div>

                {activeClient ? (
                  <GlassButton
                    type="button"
                    variant={archivedCruceHash ? 'default' : 'primary'}
                    size="sm"
                    disabled={isArchivingCruce || Boolean(archivedCruceHash)}
                    onClick={handleArchivarCruceEnExpediente}
                    className="text-xs"
                  >
                    {archivedCruceHash ? (
                      <>
                        <Check size={14} className="mr-1.5 text-emerald-600" />
                        Archivado en Expediente
                      </>
                    ) : isArchivingCruce ? (
                      'Archivando...'
                    ) : (
                      <>
                        <FolderKanban size={14} className="mr-1.5 text-gold" />
                        Archivar Dictamen en {activeClient.nombre.slice(0, 20)}
                      </>
                    )}
                  </GlassButton>
                ) : (
                  <span className="text-[11px] italic text-muted">
                    Selecciona un cliente arriba para archivar este dictamen en su historial.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL CÉDULA CONCENTRADORA (IMPRESIÓN CARTA) ═══ */}
      {cierreCalculado && (
        <CedulaConcentradoraModal
          isOpen={showCedulaModal}
          onClose={() => setShowCedulaModal(false)}
          cierre={cierreCalculado}
          despachoName={auth?.tenantName || 'Despacho Contable Especializado'}
        />
      )}

      {/* ═══ MODAL CÉDULA CRUCE DE JORNADA (IMPRESIÓN CARTA) ═══ */}
      {dictamenCruce && (
        <CedulaCruceJornadaModal
          isOpen={showCedulaCruceModal}
          onClose={() => setShowCedulaCruceModal(false)}
          dictamen={dictamenCruce}
          despachoName={auth?.tenantName || 'Despacho Contable Especializado'}
        />
      )}
    </div>
  );
}

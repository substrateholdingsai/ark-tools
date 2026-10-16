/**
 * ARK TOOLS — Cierre de Nómina Masivo & Cédula Concentradora (Sprint 11)
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
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { ESTADOS } from '../isn/data/estados';
import type { Periodo } from '../nomina/types';
import type { TrabajadorFilaInput, ParametrosCierreNomina, CierreNominaCompleto } from './types';
import {
  parsearPlantillaNomina,
  generarPlantillaEjemploCSV,
} from './lib/parserPlantilla';
import { procesarCierreNomina } from './lib/calcularCierreNomina';
import { descargarArchivo } from './lib/exportarCierre';
import { CedulaConcentradoraModal } from './components/CedulaConcentradoraModal';
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

  return (
    <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10 space-y-8 font-inter text-ink">
      {/* ═══ ENCABEZADO Y REGRESO ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink hover:bg-surface-2/80 transition-colors cursor-pointer"
            title="Volver al catálogo de herramientas"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-playfair text-2xl sm:text-3xl font-black tracking-tight text-ink">
                Cierre de Nómina Masivo
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-navy font-orbitron font-bold text-[11px] tracking-wide border border-gold/30">
                BATCH DOF 2026
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Procesamiento de plantilla completa, retenciones LISR Art. 96, cuotas obreras LSS, ISN estatal y Cédula Concentradora con Sello QR.
            </p>
          </div>
        </div>

        {/* Acciones de plantilla */}
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* ═══ SECCIÓN 1: PARÁMETROS DEL PERÍODO Y EMPRESA ═══ */}
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy font-orbitron">
          <Building2 size={16} className="text-gold" />
          <span>Configuración del Cierre & Entidad Federativa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Empresa */}
          <div>
            <label className="block text-muted font-semibold mb-1">Empresa / Razón Social</label>
            <input
              type="text"
              value={empresaNombre}
              onChange={(e) => setEmpresaNombre(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface-2 text-ink font-medium focus:outline-none focus:border-navy"
            />
          </div>

          {/* RFC Empresa */}
          <div>
            <label className="block text-muted font-semibold mb-1">RFC de la Empresa</label>
            <input
              type="text"
              value={empresaRfc}
              onChange={(e) => setEmpresaRfc(e.target.value.toUpperCase())}
              placeholder="OIN180425AB1"
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface-2 text-ink font-mono uppercase focus:outline-none focus:border-navy"
            />
          </div>

          {/* Período */}
          <div>
            <label className="block text-muted font-semibold mb-1">Periodicidad de Pago</label>
            <select
              value={periodo}
              onChange={(e) => handlePeriodoChange(e.target.value as Periodo)}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface-2 text-ink font-semibold focus:outline-none focus:border-navy cursor-pointer"
            >
              <option value="quincenal">Quincenal (15 días)</option>
              <option value="semanal">Semanal (7 días)</option>
              <option value="mensual">Mensual (30 días)</option>
            </select>
          </div>

          {/* Estado para ISN */}
          <div>
            <label className="block text-muted font-semibold mb-1">Estado (Tasa ISN Estatal)</label>
            <select
              value={estadoIsnId}
              onChange={(e) => handleEstadoChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface-2 text-ink font-semibold focus:outline-none focus:border-navy cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-line/60 text-xs">
          <div>
            <label className="block text-muted font-semibold mb-1">Fecha Inicio del Período</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface-2 font-mono text-ink"
            />
          </div>
          <div>
            <label className="block text-muted font-semibold mb-1">Fecha Fin del Período</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface-2 font-mono text-ink"
            />
          </div>
          <div>
            <label className="block text-muted font-semibold mb-1">Fecha de Corte (Antigüedad LFT)</label>
            <input
              type="date"
              value={fechaCorte}
              onChange={(e) => setFechaCorte(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface-2 font-mono text-ink"
            />
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 2: ZONA DE CARGA DE ARCHIVO ═══ */}
      {trabajadores.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-line hover:border-gold/60 bg-surface-2/40 p-10 text-center cursor-pointer transition-all hover:bg-surface-2/70"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="mx-auto w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center mb-3">
            <UploadCloud size={24} />
          </div>
          <h3 className="font-playfair text-lg font-bold text-ink">
            Arrastra tu plantilla de nómina en formato CSV o haz clic aquí
          </h3>
          <p className="text-xs text-muted mt-1 max-w-md mx-auto">
            Acepta archivos exportados desde Excel, NOI, Compaq o tu ERP con columnas de Nombre, Salario Diario, Ingreso, RFC y Percepciones.
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle size={15} />
            Errores detectados en la plantilla:
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {erroresImport.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {advertenciasImport.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
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
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-navy">
                Colaboradores Listos ({trabajadores.length})
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
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
                className="text-xs text-navy hover:underline cursor-pointer font-semibold px-2 py-1"
              >
                Reemplazar CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrabajadores([]);
                  setCierreCalculado(null);
                }}
                className="text-xs text-rose-600 hover:underline cursor-pointer font-semibold px-2 py-1"
              >
                Limpiar lista
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-line rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-2 sticky top-0 text-[10px] uppercase font-bold text-muted border-b border-line">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">RFC / NSS</th>
                  <th className="py-2.5 px-3">Fecha Ingreso</th>
                  <th className="py-2.5 px-3 text-right">Salario Diario</th>
                  <th className="py-2.5 px-3 text-center">Días Trab.</th>
                  <th className="py-2.5 px-3 text-right">Bonos / Extras</th>
                  <th className="py-2.5 px-3 text-right">Otras Deduc.</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-mono text-[11px]">
                {trabajadores.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-surface-2/40">
                    <td className="py-2 px-3 text-muted">{idx + 1}</td>
                    <td className="py-2 px-3 font-inter font-medium text-ink whitespace-nowrap">
                      {t.nombre}
                    </td>
                    <td className="py-2 px-3 text-muted text-[10px]">
                      <div>{t.rfc || '—'}</div>
                      <div className="text-[9px] text-muted/70">{t.nss || ''}</div>
                    </td>
                    <td className="py-2 px-3 text-muted">{t.fechaIngreso || '—'}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-ink font-semibold">
                      ${t.salarioDiario.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums">
                      {t.diasTrabajados ?? diasPeriodo}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-800">
                      ${((t.bonos || 0) + (t.horasExtras || 0) + (t.otrasPercepciones || 0)).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-rose-800">
                      ${(t.otrasDeducciones || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleEliminarTrabajador(idx)}
                        className="p-1 rounded text-muted hover:text-rose-600 cursor-pointer"
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
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line">
            <div className="text-xs text-muted">
              Se calculará la retención de ISR Art. 96, cuotas IMSS obreras y {tasaIsn}% de ISN para los {trabajadores.length} colaboradores.
            </div>

            <GlassButton
              type="button"
              variant="primary"
              size="md"
              disabled={isProcessing}
              onClick={handleEjecutarCierre}
              className="text-xs uppercase tracking-wider font-bold"
            >
              <Play size={15} className="mr-2 text-navy" />
              {isProcessing ? 'Procesando Lote...' : 'Procesar Cierre y Generar Cédula'}
            </GlassButton>
          </div>
        </div>
      )}

      {/* ═══ SECCIÓN 4: RESUMEN DEL CIERRE CALCULADO ═══ */}
      {cierreCalculado && (
        <div className="rounded-2xl border-2 border-navy/30 bg-surface p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="font-orbitron font-bold text-xs uppercase tracking-wider text-gold">
                Cierre Procesado & Sellado con Éxito
              </div>
              <h2 className="font-playfair text-xl sm:text-2xl font-black text-ink mt-0.5">
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-xl bg-surface-2 border border-line">
              <span className="text-[10px] font-bold uppercase text-muted tracking-wider block">
                Nómina Bruta
              </span>
              <div className="font-orbitron text-lg font-bold text-ink mt-1 tabular-nums">
                ${cierreCalculado.resumen.totalPercepcionesBrutas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
              <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider block">
                ISR Retenido SAT
              </span>
              <div className="font-orbitron text-lg font-bold text-rose-950 mt-1 tabular-nums">
                ${cierreCalculado.resumen.totalISRRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider block">
                IMSS Obrero
              </span>
              <div className="font-orbitron text-lg font-bold text-blue-950 mt-1 tabular-nums">
                ${cierreCalculado.resumen.totalIMSSObrero.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">
                ISN Estatal
              </span>
              <div className="font-orbitron text-lg font-bold text-amber-950 mt-1 tabular-nums">
                ${cierreCalculado.resumen.totalISNEstatal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-emerald-900 tracking-wider block">
                Neto a Dispersar
              </span>
              <div className="font-orbitron text-xl font-bold text-emerald-950 mt-1 tabular-nums">
                ${cierreCalculado.resumen.totalNetoDispersar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Sello y Guardado en Expediente */}
          <div className="p-4 rounded-xl bg-navy/5 border border-navy/15 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-navy font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-gold" />
                <span>Sello SHA-256: {cierreCalculado.resumen.hashLote.slice(0, 32)}...</span>
              </div>
              <div className="text-[10px] text-muted font-mono">
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
              <span className="text-[11px] text-muted italic">
                Selecciona un cliente arriba para archivar esta cédula en su historial.
              </span>
            )}
          </div>
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
    </div>
  );
}

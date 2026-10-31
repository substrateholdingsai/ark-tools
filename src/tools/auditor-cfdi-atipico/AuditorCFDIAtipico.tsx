import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Calendar, FileCheck, Sliders, FileText, Download } from 'lucide-react';

import type {
  Contribuyente,
  CFDIExtraido,
  SATMetadataItem,
  CriterioAtipicoConfig,
  HallazgoRiesgo,
} from './types';
import {
  CRITERIOS_DEFAULT,
  calcularMallaMensual,
  conciliarConMetadata,
  evaluarCriteriosForense,
} from './lib/motorForense';
import { generarDatosDemostracion } from './lib/generadorDemo';
import { procesarArchivos } from './lib/zipIngestor';
import {
  guardarContribuyente,
  listarContribuyentes,
  guardarLoteCFDI,
  obtenerCFDIs,
  guardarLoteMetadata,
  obtenerMetadata,
} from './lib/indexedDbStorage';

import { MallaMensual } from './components/MallaMensual';
import { MatrizRiesgo5x5 } from './components/MatrizRiesgo5x5';
import { ConciliacionMetadata } from './components/ConciliacionMetadata';
import { CriteriosConfig } from './components/CriteriosConfig';
import { ResumenEjecutivo } from './components/ResumenEjecutivo';
import { DetalleComprobantesModal } from './components/DetalleComprobantesModal';
import { GestionContribuyentes } from './components/GestionContribuyentes';

type TabActivo = 'malla' | 'matriz' | 'conciliacion' | 'criterios' | 'dictamen';

export const AuditorCFDIAtipico: React.FC = () => {
  const [tabActivo, setTabActivo] = useState<TabActivo>('malla');
  const [cargando, setCargando] = useState(false);
  const [progresoMensaje, setProgresoMensaje] = useState('');

  // Estado Multi-RFC
  const [contribuyenteActivo, setContribuyenteActivo] = useState<Contribuyente>({
    rfc: 'ATN180620AA1',
    razonSocial: 'ATENEA LOGÍSTICA & DISTRIBUCIÓN NACIONAL S.A. DE C.V.',
    regimenFiscal: '601 - General de Ley Personas Morales',
    ejercicio: 2026,
    actividadEconomica: '492310 - Autotransporte foráneo de carga y logística de última milla',
  });
  const [todosContribuyentes, setTodosContribuyentes] = useState<Contribuyente[]>([
    contribuyenteActivo,
  ]);

  // Datos
  const [cfdis, setCfdis] = useState<CFDIExtraido[]>([]);
  const [metadata, setMetadata] = useState<SATMetadataItem[]>([]);
  const [criterios, setCriterios] = useState<CriterioAtipicoConfig[]>(CRITERIOS_DEFAULT);
  const [ultimoRespaldo, setUltimoRespaldo] = useState<string | null>(null);

  // Modal Detalle
  const [modalMesAbierto, setModalMesAbierto] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null);
  const [filtroMesTipo, setFiltroMesTipo] = useState<'EMITIDO' | 'RECIBIDO' | 'TODOS'>('TODOS');

  // Inicializar IndexedDB
  useEffect(() => {
    async function cargarInicial() {
      try {
        const contribs = await listarContribuyentes();
        if (contribs.length > 0 && contribs[0]) {
          setTodosContribuyentes(contribs);
          setContribuyenteActivo(contribs[0]);
        }
        const cfdisGuardados = await obtenerCFDIs();
        if (cfdisGuardados.length > 0) {
          setCfdis(cfdisGuardados);
        }
        const metaGuardada = await obtenerMetadata();
        if (metaGuardada.length > 0) {
          setMetadata(metaGuardada);
        }
      } catch {
        // Modo fallback en memoria
      }
    }
    cargarInicial();
  }, []);

  // Cargar datos de demostración
  const handleCargarDemo = () => {
    const demo = generarDatosDemostracion(contribuyenteActivo.ejercicio);
    setContribuyenteActivo(demo.contribuyente);
    setTodosContribuyentes(demo.otrosContribuyentes);
    setCfdis(demo.cfdis);
    setMetadata(demo.metadata);

    // Persistir en IndexedDB
    try {
      guardarContribuyente(demo.contribuyente);
      guardarLoteCFDI(demo.cfdis);
      guardarLoteMetadata(demo.metadata);
      setUltimoRespaldo(new Date().toLocaleTimeString());
    } catch {
      // Ignorar en entorno sin storage
    }
  };

  // Ingesta de archivos
  const handleArchivosSeleccionados = async (files: File[]) => {
    setCargando(true);
    setProgresoMensaje('Iniciando lectura de archivos y descompresión...');
    try {
      const resultado = await procesarArchivos(files, contribuyenteActivo.rfc, (info) => {
        setProgresoMensaje(`${info.etapa} (${info.procesados}/${info.total})`);
      });

      const nuevosCFDIs = [
        ...cfdis.filter((c) => !resultado.cfdis.some((nc) => nc.uuid === c.uuid)),
        ...resultado.cfdis,
      ];
      const nuevaMeta = [
        ...metadata.filter((m) => !resultado.metadata.some((nm) => nm.uuid === m.uuid)),
        ...resultado.metadata,
      ];

      setCfdis(nuevosCFDIs);
      setMetadata(nuevaMeta);

      // Guardar en IndexedDB
      await guardarLoteCFDI(resultado.cfdis);
      await guardarLoteMetadata(resultado.metadata);
      setUltimoRespaldo(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      alert(`Error al procesar archivos: ${(err as Error).message}`);
    } finally {
      setCargando(false);
      setProgresoMensaje('');
    }
  };

  // Cálculos reactivos
  const { malla, promedioMensual, desviacionEstandar } = useMemo(() => {
    return calcularMallaMensual(cfdis, contribuyenteActivo.ejercicio);
  }, [cfdis, contribuyenteActivo.ejercicio]);

  const conciliacion = useMemo(() => {
    return conciliarConMetadata(cfdis, metadata);
  }, [cfdis, metadata]);

  const [hallazgosEstado, setHallazgosEstado] = useState<HallazgoRiesgo[]>([]);

  useEffect(() => {
    const hallazgosCalculados = evaluarCriteriosForense(
      cfdis,
      metadata,
      criterios,
      contribuyenteActivo.ejercicio
    );
    setHallazgosEstado(hallazgosCalculados);
  }, [cfdis, metadata, criterios, contribuyenteActivo.ejercicio]);

  const handleActualizarEstatus = (
    id: string,
    nuevoEstatus: HallazgoRiesgo['estatusSeguimiento']
  ) => {
    setHallazgosEstado((prev) =>
      prev.map((h) => (h.id === id ? { ...h, estatusSeguimiento: nuevoEstatus } : h))
    );
  };

  const handleActualizarCriterio = (id: string, activo: boolean, umbral: number) => {
    setCriterios((prev) => prev.map((c) => (c.id === id ? { ...c, activo, umbral } : c)));
  };

  const handleRestablecerCriterios = () => {
    setCriterios(CRITERIOS_DEFAULT);
  };

  // Respaldo manual JSON
  const handleDescargarRespaldoJSON = () => {
    const backup = {
      version: '1.0.0',
      fecha: new Date().toISOString(),
      contribuyente: contribuyenteActivo,
      cfdis,
      metadata,
      criterios,
      hallazgos: hallazgosEstado,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Forense_${contribuyenteActivo.rfc}_${contribuyenteActivo.ejercicio}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setUltimoRespaldo(new Date().toLocaleTimeString());
  };

  // Filtrado de comprobantes para el modal
  const cfdisModal = useMemo(() => {
    if (mesSeleccionado === null) return [];
    return cfdis.filter((c) => {
      const d = new Date(c.fechaEmision);
      if (d.getMonth() + 1 !== mesSeleccionado) return false;
      if (filtroMesTipo !== 'TODOS' && c.clasificacion !== filtroMesTipo) return false;
      return true;
    });
  }, [cfdis, mesSeleccionado, filtroMesTipo]);

  return (
    <div className="min-h-screen space-y-6 bg-slate-950 p-4 text-slate-100 md:p-8">
      {/* Barra de Título y Marca */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-sky-800 bg-sky-950 px-2.5 py-0.5 text-[11px] font-bold text-sky-400">
              HERRAMIENTA 20
            </span>
            <span className="text-xs text-slate-400">SAT & Auditoría Forense CFDI 4.0</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Detector de Comportamientos Atípicos en CFDI
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Ingesta local, cruce de metadata SAT, Ley de Benford, Z-Score y matriz de riesgo 5×5.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ultimoRespaldo && (
            <span className="hidden font-mono text-[11px] text-slate-400 sm:inline">
              Último snapshot: {ultimoRespaldo}
            </span>
          )}
          <button
            onClick={handleDescargarRespaldoJSON}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition-all hover:border-slate-700 hover:text-white"
            title="Descargar copia de seguridad en JSON"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" /> Respaldo JSON
          </button>
        </div>
      </div>

      {/* Gestión de Contribuyentes & Carga */}
      <GestionContribuyentes
        contribuyenteActivo={contribuyenteActivo}
        todosContribuyentes={todosContribuyentes}
        onSeleccionarContribuyente={setContribuyenteActivo}
        onAgregarContribuyente={(nuevo) => {
          setTodosContribuyentes((prev) => [...prev, nuevo]);
          setContribuyenteActivo(nuevo);
          guardarContribuyente(nuevo);
        }}
        onCargarDemo={handleCargarDemo}
        onArchivosSeleccionados={handleArchivosSeleccionados}
        cargando={cargando}
        progresoMensaje={progresoMensaje}
      />

      {/* Tabs Principales de Navegación */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-px">
        <button
          onClick={() => setTabActivo('malla')}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            tabActivo === 'malla'
              ? 'border-sky-500 bg-sky-950/20 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" /> Malla Mensual (12 Meses)
        </button>

        <button
          onClick={() => setTabActivo('matriz')}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            tabActivo === 'matriz'
              ? 'border-sky-500 bg-sky-950/20 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> Matriz de Riesgo 5×5 ({hallazgosEstado.length})
        </button>

        <button
          onClick={() => setTabActivo('conciliacion')}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            tabActivo === 'conciliacion'
              ? 'border-sky-500 bg-sky-950/20 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="h-4 w-4" /> Conciliación Metadata SAT (
          {conciliacion.canceladosEnSAT} cancelados)
        </button>

        <button
          onClick={() => setTabActivo('criterios')}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            tabActivo === 'criterios'
              ? 'border-sky-500 bg-sky-950/20 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="h-4 w-4" /> Parámetros y Criterios
        </button>

        <button
          onClick={() => setTabActivo('dictamen')}
          className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            tabActivo === 'dictamen'
              ? 'border-sky-500 bg-sky-950/20 text-sky-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" /> Resumen Ejecutivo & Dictamen
        </button>
      </div>

      {/* Contenido de la Pestaña Activa */}
      {tabActivo === 'malla' && (
        <MallaMensual
          malla={malla}
          promedioMensual={promedioMensual}
          desviacionEstandar={desviacionEstandar}
          cfdis={cfdis}
          onSeleccionarMes={(mes, tipo) => {
            setMesSeleccionado(mes);
            setFiltroMesTipo(tipo);
            setModalMesAbierto(true);
          }}
        />
      )}

      {tabActivo === 'matriz' && (
        <MatrizRiesgo5x5
          hallazgos={hallazgosEstado}
          onActualizarEstatus={handleActualizarEstatus}
        />
      )}

      {tabActivo === 'conciliacion' && (
        <ConciliacionMetadata conciliacion={conciliacion} cfdis={cfdis} metadata={metadata} />
      )}

      {tabActivo === 'criterios' && (
        <CriteriosConfig
          criterios={criterios}
          onActualizarCriterio={handleActualizarCriterio}
          onRestablecer={handleRestablecerCriterios}
        />
      )}

      {tabActivo === 'dictamen' && (
        <ResumenEjecutivo
          contribuyente={contribuyenteActivo}
          ejercicio={contribuyenteActivo.ejercicio}
          hallazgos={hallazgosEstado}
          conciliacion={conciliacion}
          malla={malla}
          cfdis={cfdis}
        />
      )}

      {/* Modal Drilldown */}
      <DetalleComprobantesModal
        abierto={modalMesAbierto}
        onCerrar={() => setModalMesAbierto(false)}
        cfdis={cfdisModal}
        titulo={
          mesSeleccionado
            ? `Comprobantes de ${malla[mesSeleccionado - 1]?.nombreMes || ''} (${filtroMesTipo})`
            : 'Detalle de Comprobantes'
        }
      />
    </div>
  );
};

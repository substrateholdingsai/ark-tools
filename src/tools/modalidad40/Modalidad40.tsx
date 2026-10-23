/**
 * ARK TOOLS — Simulador de Modalidad 40 (Herramienta #19)
 *
 * Módulo para la proyección actuarial de pensión bajo el Régimen 1973 de la LSS
 * y auditoría determinista conforme al Acuerdo ACDO.AS2.HCT.101026/302.P.DG (DOF 21/10/2026).
 *
 * Características:
 * - Cotejo legal automático contra la regla restrictiva: Salario previo + 1 UMA diaria (máx 25 UMAs).
 * - Proyección de inversión acumulada con la cuota oficial 2026 (14.438%).
 * - Estimación de pensión Ley 73 con cuantía básica, incrementos anuales, edad, asignaciones y factor Fox.
 * - Análisis de retorno de inversión (ROI) vs. no aportar en Modalidad 40.
 * - Expediente Único D1 y emisión de Papel de Trabajo con Sello SHA-256 + QR de verificación pública.
 */

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Sparkles, ShieldAlert } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import {
  ParametrosModalidad40Card,
  ComparativaLimitesCard,
  ResultadoPensionCard,
  CedulaModalidad40Modal,
} from './components';
import {
  evaluarLimitesModalidad40,
  calcularInversionModalidad40,
  calcularPensionLey73,
  analizarRoi,
  generarSelloSha256,
} from './lib/calcularModalidad40';
import type { ParametrosModalidad40, ResultadoModalidad40 } from './types';

interface Modalidad40Props {
  onBack?: () => void;
}

const PARAMETROS_INICIALES: ParametrosModalidad40 = {
  ultimoSbc: 650,
  sbcDeseado: 2932.75, // Intentará el tope histórico de 25 UMAs
  semanasPrevias: 1250,
  mesesAportacion: 36, // 3 años
  edadJubilacion: 65,
  asignacionFamiliar: true,
};

export function Modalidad40({ onBack }: Modalidad40Props) {
  const { activeClient } = useExpediente();
  const [params, setParams] = useState<ParametrosModalidad40>(PARAMETROS_INICIALES);
  const [showCedulaModal, setShowCedulaModal] = useState<boolean>(false);
  const [selloHash, setSelloHash] = useState<string>('');

  // 1. Evaluación de límites del nuevo acuerdo DOF 21/10/2026
  const limites = useMemo(() => {
    return evaluarLimitesModalidad40(params.ultimoSbc, params.sbcDeseado);
  }, [params.ultimoSbc, params.sbcDeseado]);

  // 2. Inversión mensual y total proyectada
  const inversion = useMemo(() => {
    return calcularInversionModalidad40(limites.sbcEfectivo, params.mesesAportacion);
  }, [limites.sbcEfectivo, params.mesesAportacion]);

  // 3. Proyección actuarial de Pensión Ley 73
  const pension = useMemo(() => {
    return calcularPensionLey73(
      params.ultimoSbc,
      limites.sbcEfectivo,
      params.semanasPrevias,
      params.mesesAportacion,
      params.edadJubilacion,
      params.asignacionFamiliar
    );
  }, [
    params.ultimoSbc,
    limites.sbcEfectivo,
    params.semanasPrevias,
    params.mesesAportacion,
    params.edadJubilacion,
    params.asignacionFamiliar,
  ]);

  // 4. Retorno de inversión (ROI)
  const roi = useMemo(() => {
    return analizarRoi(
      pension.pensionMensualEstimada,
      params.ultimoSbc,
      params.semanasPrevias,
      params.edadJubilacion,
      params.asignacionFamiliar,
      inversion.inversionTotal
    );
  }, [
    pension.pensionMensualEstimada,
    params.ultimoSbc,
    params.semanasPrevias,
    params.edadJubilacion,
    params.asignacionFamiliar,
    inversion.inversionTotal,
  ]);

  // Generación asíncrona del sello SHA-256
  useEffect(() => {
    let cancel = false;
    const payload = {
      params,
      sbcEfectivo: limites.sbcEfectivo,
      pensionEstimada: pension.pensionMensualEstimada,
      inversionTotal: inversion.inversionTotal,
      mesesRoi: roi.mesesRecuperacionRoi,
    };
    void generarSelloSha256(payload).then((h) => {
      if (!cancel) setSelloHash(h);
    });
    return () => {
      cancel = true;
    };
  }, [
    params,
    limites.sbcEfectivo,
    pension.pensionMensualEstimada,
    inversion.inversionTotal,
    roi.mesesRecuperacionRoi,
  ]);

  const resultadoCompleto: ResultadoModalidad40 = useMemo(() => {
    return {
      parametros: params,
      limites,
      inversion,
      pension,
      roi,
      selloSha256: selloHash || 'calculando_sello_criptografico...',
      fechaCalculoIso: new Date().toISOString(),
    };
  }, [params, limites, inversion, pension, roi, selloHash]);

  const inputsActuales = useMemo(() => {
    return params as unknown as Record<string, unknown>;
  }, [params]);

  const outputsActuales = useMemo(() => {
    return {
      limites,
      cuotaMensual: inversion.cuotaMensual,
      inversionTotal: inversion.inversionTotal,
      pensionMensualEstimada: pension.pensionMensualEstimada,
      roiMeses: roi.mesesRecuperacionRoi,
      selloSha256: selloHash,
    };
  }, [limites, inversion, pension, roi, selloHash]);

  const nombreAsegurado = activeClient?.nombre || 'Asegurado Proyectado';
  const nssAsegurado = activeClient?.rfc || '0000-00-0000';

  return (
    <div className="animate-fadeIn mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Encabezado y Navegación */}
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line bg-surface text-muted transition hover:border-navy hover:text-navy"
              title="Volver al Catálogo"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
                HERRAMIENTA #19 · FISCAL & NÓMINA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                <ShieldAlert className="h-3 w-3" /> ACUERDO DOF 21/10/2026
              </span>
            </div>
            <h1 className="mt-1 font-playfair text-2xl font-black tracking-[-0.02em] text-navy sm:text-4xl">
              Simulador de Modalidad 40 (Criterio DOF 2026)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 font-inter text-[12px] text-muted">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-gold" />
          <span>Restricción Último SBC + 1 UMA · Cuota 14.438% · Proyección Ley 73</span>
        </div>
      </div>

      {/* Sello Digital & Expediente Único (Cloudflare D1) */}
      <ExpedienteToolBanner
        toolId="modalidad40"
        titulo={`Modalidad 40 Ley 73 — Pensión Proyectada $${pension.pensionMensualEstimada.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`}
        inputs={inputsActuales}
        outputs={outputsActuales}
      />

      {/* Grid Principal: Parámetros a la izquierda + Límites y Resultados a la derecha */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Parámetros del Asegurado (5 de 12) */}
        <div className="space-y-6 lg:col-span-5">
          <ParametrosModalidad40Card params={params} onChange={setParams} />
        </div>

        {/* Columna Derecha: Comparativa de Límites DOF y Resultado (7 de 12) */}
        <div className="space-y-6 lg:col-span-7">
          <ComparativaLimitesCard
            limites={limites}
            ultimoSbc={params.ultimoSbc}
            sbcDeseado={params.sbcDeseado}
          />

          <ResultadoPensionCard
            resultado={resultadoCompleto}
            nombreAsegurado={nombreAsegurado}
            nssAsegurado={nssAsegurado}
            onVerCedula={() => setShowCedulaModal(true)}
          />
        </div>
      </div>

      {/* Modal de Cédula Oficial Imprimible (Carta / QR) */}
      <CedulaModalidad40Modal
        isOpen={showCedulaModal}
        onClose={() => setShowCedulaModal(false)}
        resultado={resultadoCompleto}
        nombreAsegurado={nombreAsegurado}
        nssAsegurado={nssAsegurado}
      />
    </div>
  );
}

export default Modalidad40;

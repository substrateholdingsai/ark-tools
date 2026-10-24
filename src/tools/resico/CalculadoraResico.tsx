/**
 * ARK LEDGER — Calculadora y Papel de Trabajo RESICO 2026
 *
 * Módulo especializado en el Régimen Simplificado de Confianza:
 * - Personas Físicas: Arts. 113-E a 113-J LISR (Tasas 1.0% a 2.5%, retención 1.25%, IVA)
 * - Personas Morales: Arts. 206 a 215 LISR (Flujo de efectivo, tasa 30%, IVA)
 * - Control de tope legal de $3,500,000 MXN anuales
 * - Integrado con Expediente Único, Sello SHA-256 y Cédula Oficial Carta/QR
 */

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Sparkles, Scale } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import {
  ParametrosResicoCard,
  ResultadoResicoCard,
  DesgloseResicoTable,
  CedulaResicoModal,
} from './components';
import { calcularResicoPF } from './lib/calcularResicoPF';
import { calcularResicoPM } from './lib/calcularResicoPM';
import type { EntradaResicoPF, EntradaResicoPM, TipoPersonaResico, ResultadoResico } from './types';

interface CalculadoraResicoProps {
  onBack?: () => void;
}

const ENTRADA_PF_INICIAL: EntradaResicoPF = {
  ingresosCobradosMes: 65000,
  ingresosAcumuladosPrevios: 120000,
  retencionISREfectuadaPM: 0,
  autoCalcularRetencionPM: true,
  ingresosFacturadosPM: 50000,
  ivaCobrado: 10400,
  ivaAcreditablePagado: 3800,
  retencionIVAEfectuadaPM: 0,
  mes: 3,
  ejercicio: 2026,
};

const ENTRADA_PM_INICIAL: EntradaResicoPM = {
  ingresosCobradosAcumulados: 1200000,
  deduccionesAutorizadasAcumuladas: 750000,
  ptuPagada: 40000,
  perdidasFiscalesPendientes: 0,
  pagosProvisionalesPrevios: 85000,
  retencionesISRAcumuladas: 0,
  ivaCobrado: 32000,
  ivaAcreditablePagado: 14000,
  retencionIVAMes: 0,
  mes: 3,
  ejercicio: 2026,
};

export function CalculadoraResico({ onBack }: CalculadoraResicoProps) {
  const { activeClient } = useExpediente();

  const [tipoPersona, setTipoPersona] = useState<TipoPersonaResico>('fisica');
  const [entradaPF, setEntradaPF] = useState<EntradaResicoPF>(ENTRADA_PF_INICIAL);
  const [entradaPM, setEntradaPM] = useState<EntradaResicoPM>(ENTRADA_PM_INICIAL);
  const [showCedulaModal, setShowCedulaModal] = useState<boolean>(false);

  // Auto-seleccionar tipo de persona si el cliente activo es empresa
  useEffect(() => {
    if (activeClient) {
      if (activeClient.tipo === 'empresa') {
        setTipoPersona('moral');
      } else {
        setTipoPersona('fisica');
      }
    }
  }, [activeClient]);

  // Cálculo en tiempo real según el régimen seleccionado
  const resultado: ResultadoResico = useMemo(() => {
    if (tipoPersona === 'fisica') {
      return calcularResicoPF(entradaPF);
    } else {
      return calcularResicoPM(entradaPM);
    }
  }, [tipoPersona, entradaPF, entradaPM]);

  const inputsActuales = useMemo(() => {
    return tipoPersona === 'fisica'
      ? (entradaPF as unknown as Record<string, unknown>)
      : (entradaPM as unknown as Record<string, unknown>);
  }, [tipoPersona, entradaPF, entradaPM]);

  const outputsActuales = useMemo(() => {
    return resultado as unknown as Record<string, unknown>;
  }, [resultado]);

  const nombreCliente = activeClient?.nombre || 'Contribuyente General';
  const rfcCliente =
    activeClient?.rfc || (tipoPersona === 'fisica' ? 'XAXX010101000' : 'XEXX010101000');

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
                HERRAMIENTA FISCAL · LISR 2026
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <Scale className="h-3 w-3" /> OFICIAL DOF
              </span>
            </div>
            <h1 className="mt-1 font-playfair text-2xl font-black tracking-[-0.02em] text-navy sm:text-4xl">
              Calculadora y Cédula RESICO
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 font-inter text-[12px] text-muted">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-gold" />
          <span>Art. 113-E (PF 1%-2.5%) · Art. 206 (PM 30% Flujo) · Art. 5 LIVA</span>
        </div>
      </div>

      {/* Sello Digital & Expediente Único (Sprint 9) */}
      <ExpedienteToolBanner
        toolId="resico"
        titulo={`Cédula RESICO ${tipoPersona === 'fisica' ? 'Persona Física' : 'Persona Moral'} ${resultado.ejercicio}`}
        inputs={inputsActuales}
        outputs={outputsActuales}
      />

      {/* Grid Principal: Formulario + Resultados */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Parámetros de Entrada (5 de 12) */}
        <div className="space-y-6 lg:col-span-5">
          <ParametrosResicoCard
            tipoPersona={tipoPersona}
            onTipoPersonaChange={setTipoPersona}
            entradaPF={entradaPF}
            onEntradaPFChange={setEntradaPF}
            entradaPM={entradaPM}
            onEntradaPMChange={setEntradaPM}
          />
        </div>

        {/* Columna Derecha: Resultado, Métricas y Cédula Analítica (7 de 12) */}
        <div className="space-y-6 lg:col-span-7">
          <ResultadoResicoCard
            resultado={resultado}
            clienteNombre={nombreCliente}
            clienteRfc={rfcCliente}
            onVerCedula={() => setShowCedulaModal(true)}
          />

          <DesgloseResicoTable resultado={resultado} />
        </div>
      </div>

      {/* Modal de Cédula Oficial Imprimible (Carta / QR) */}
      <CedulaResicoModal
        isOpen={showCedulaModal}
        onClose={() => setShowCedulaModal(false)}
        resultado={resultado}
        clienteNombre={nombreCliente}
        clienteRfc={rfcCliente}
      />
    </div>
  );
}

export default CalculadoraResico;

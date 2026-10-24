/**
 * ARK LEDGER — Calculadora de Actualización y Recargos Fiscales (Herramienta #18)
 *
 * Módulo nativo en la nube para el cálculo exacto y determinista de:
 * - Efecto Inflacionario (INPC) conforme al Art. 17-A del Código Fiscal de la Federación (CFF)
 * - Recargos por mora en concepto de indemnización conforme al Art. 21 del CFF y Ley de Ingresos de la Federación (LIF)
 * - Papel de trabajo auditable con desglose mes a mes, Sello SHA-256 y Cédula Oficial Carta/QR
 */

import { useState, useMemo } from 'react';
import { ArrowLeft, Sparkles, Scale } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import {
  ParametrosRecargosCard,
  DesgloseActualizacionTable,
  ResultadoRecargosCard,
  CedulaRecargosModal,
} from './components';
import { calcularRecargosYActualizacion } from './lib/calcularRecargos';
import type { EntradaRecargos, ResultadoRecargos } from './types';

interface CalculadoraRecargosProps {
  onBack?: () => void;
}

const ENTRADA_INICIAL: EntradaRecargos = {
  importeHistorico: 45000,
  fechaVencimiento: '2024-05-17',
  fechaPago: '2024-09-20',
  tasaRecargosMensual: 1.47,
};

export function CalculadoraRecargos({ onBack }: CalculadoraRecargosProps) {
  const { activeClient } = useExpediente();
  const [entrada, setEntrada] = useState<EntradaRecargos>(ENTRADA_INICIAL);
  const [showCedulaModal, setShowCedulaModal] = useState<boolean>(false);

  // Cálculo en tiempo real reactivo y determinista
  const resultado: ResultadoRecargos = useMemo(() => {
    return calcularRecargosYActualizacion(entrada);
  }, [entrada]);

  const inputsActuales = useMemo(() => {
    return entrada as unknown as Record<string, unknown>;
  }, [entrada]);

  const outputsActuales = useMemo(() => {
    return resultado as unknown as Record<string, unknown>;
  }, [resultado]);

  const nombreCliente = activeClient?.nombre || 'Contribuyente General';
  const rfcCliente = activeClient?.rfc || 'XAXX010101000';

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
                HERRAMIENTA #18 · MOTOR FISCAL CLOUD
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <Scale className="h-3 w-3" /> CFF ARTS. 17-A Y 21
              </span>
            </div>
            <h1 className="mt-1 font-playfair text-2xl font-black tracking-[-0.02em] text-navy sm:text-4xl">
              Calculadora de Actualización y Recargos Fiscales
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 font-inter text-[12px] text-muted">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-gold" />
          <span>INPC Oficial DOF · Tasa LIF 1.47% Mensual · Cero Mantenimiento</span>
        </div>
      </div>

      {/* Sello Digital & Expediente Único (Cloudflare D1) */}
      <ExpedienteToolBanner
        toolId="recargos"
        titulo={`Actualización y Recargos Fiscales — ${resultado.fechaVencimiento} a ${resultado.fechaPago}`}
        inputs={inputsActuales}
        outputs={outputsActuales}
      />

      {/* Grid Principal: Formulario a la izquierda + Resultados y Desglose a la derecha */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Columna Izquierda: Parámetros de Entrada (5 de 12) */}
        <div className="space-y-6 lg:col-span-5">
          <ParametrosRecargosCard entrada={entrada} onChange={setEntrada} />
        </div>

        {/* Columna Derecha: Resultado Liquidación y Cédula Analítica (7 de 12) */}
        <div className="space-y-6 lg:col-span-7">
          <ResultadoRecargosCard
            resultado={resultado}
            clienteNombre={nombreCliente}
            clienteRfc={rfcCliente}
            onVerCedula={() => setShowCedulaModal(true)}
          />

          <DesgloseActualizacionTable resultado={resultado} />
        </div>
      </div>

      {/* Modal de Cédula Oficial Imprimible (Carta / QR) */}
      <CedulaRecargosModal
        isOpen={showCedulaModal}
        onClose={() => setShowCedulaModal(false)}
        resultado={resultado}
        clienteNombre={nombreCliente}
        clienteRfc={rfcCliente}
      />
    </div>
  );
}

export default CalculadoraRecargos;

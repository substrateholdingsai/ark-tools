import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import {
  ParametrosCard,
  RangoVisual,
  DesgloseTable,
  ResultadoSBC,
  ExplicacionSBC,
} from './components';
import { PARAMETROS_DEFAULT, diasVacacionesPorAntiguedad } from './data/uma';
import { calcularResultadoSBC } from './lib/calcularSBC';
import type { ParametrosSBC, ZonaSalarial } from './types';

interface CalculadoraSBCProps {
  onBack?: () => void;
}

export function CalculadoraSBC({ onBack }: CalculadoraSBCProps) {
  const [parametros, setParametros] = useState<ParametrosSBC>({
    ...PARAMETROS_DEFAULT,
    aniosAntiguedad: 1,
    menorDeUnAnio: false,
  });
  const { activeClient } = useExpediente();

  useEffect(() => {
    if (activeClient && activeClient.salario_diario > 0) {
      setParametros((prev) => ({ ...prev, salarioDiario: activeClient.salario_diario }));
    }
  }, [activeClient]);

  const resultado = useMemo(() => calcularResultadoSBC(parametros), [parametros]);

  const handleChange = useCallback(
    (campo: keyof ParametrosSBC, valor: number | string | boolean) => {
      setParametros((prev) => {
        const next: ParametrosSBC = { ...prev };
        switch (campo) {
          case 'salarioDiario':
            next.salarioDiario = Math.max(0, Number(valor) || 0);
            break;
          case 'diasVacaciones':
            next.diasVacaciones = Math.max(0, Math.min(32, Number(valor) || 0));
            break;
          case 'primaVacacional':
            next.primaVacacional = Math.max(0, Math.min(100, Number(valor) || 0));
            break;
          case 'diasAguinaldo':
            next.diasAguinaldo = Math.max(0, Number(valor) || 0);
            break;
          case 'aniosAntiguedad': {
            const anios = Math.max(0, Math.min(35, Math.floor(Number(valor) || 0)));
            next.aniosAntiguedad = anios;
            if (anios >= 1) {
              next.menorDeUnAnio = false;
              next.diasVacaciones = diasVacacionesPorAntiguedad(anios);
            } else {
              next.menorDeUnAnio = true;
            }
            break;
          }
          case 'zona':
            next.zona = valor as ZonaSalarial;
            break;
          case 'menorDeUnAnio':
            next.menorDeUnAnio = Boolean(valor);
            if (next.menorDeUnAnio) next.aniosAntiguedad = 0;
            break;
          default:
            (next as unknown as Record<string, unknown>)[campo] = valor;
        }
        return next;
      });
    },
    []
  );

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      <header className="mb-6">
        <h1 className="font-playfair text-[36px] font-black leading-[0.95] tracking-[-0.03em] text-ink md:text-[44px]">
          Calculadora SBC 2026
        </h1>
        <p className="inter mt-3 max-w-[64ch] font-inter text-[14px] leading-[1.6] text-muted">
          Salario Base de Cotización con factor de integración, tope 25 UMAs ($2,932.75) y límite
          inferior por zona salarial (LSS Arts. 27 y 28). Zona general por defecto.
        </p>
      </header>

      <div className="mb-8">
        <ExpedienteToolBanner
          toolId="sbc"
          titulo="Determinación de Salario Base de Cotización (SBC)"
          inputs={parametros as unknown as Record<string, unknown>}
          outputs={resultado as unknown as Record<string, unknown>}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <ParametrosCard parametros={parametros} onChange={handleChange} resultado={resultado} />
          <RangoVisual resultado={resultado} />
          <DesgloseTable parametros={parametros} resultado={resultado} />
        </div>
        <div className="space-y-4 lg:sticky lg:top-[88px]">
          <ResultadoSBC parametros={parametros} resultado={resultado} />
          <ExplicacionSBC />
        </div>
      </div>

      <div className="mt-8 max-w-[760px] rounded-[16px] border border-line bg-surface-2 p-4 text-[11px] leading-[1.5] text-muted">
        <strong className="text-ink">Nota:</strong> Cálculo informativo conforme a LSS Arts. 27 y
        28, LFT Arts. 76, 80 y 87. UMA 2026 $117.31; SMG zona general $315.04; SMG ZLFN $440.87
        (DOF). Verifica con tu área contable antes de presentar ante el IMSS.
      </div>
    </div>
  );
}

export default CalculadoraSBC;

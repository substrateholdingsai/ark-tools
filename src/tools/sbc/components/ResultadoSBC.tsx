/**
 * ARK TOOLS — Calculadora SBC 2026
 * ResultadoSBC
 *
 * Card dorada con el SBC final. Usa LiquidGlassDome + TextMagnified.
 * Es el componente más "Ark" de la herramienta.
 */

import { Copy, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  GlassButton,
  LiquidGlassDome,
  BadgeGold,
  GoldDivider,
  TextMagnified,
} from '@/components/ui';
import { formatearFactor, formatearMXN, generarResumenTexto } from '../lib/calcularSBC';
import { CONSTANTES_IMSS } from '../data/uma';
import type { ParametrosSBC, ResultadoSBC as ResultadoSBCType } from '../types';

interface ResultadoSBCProps {
  parametros: ParametrosSBC;
  resultado: ResultadoSBCType;
}

export function ResultadoSBC({ parametros, resultado }: ResultadoSBCProps) {
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopiar = async () => {
    const texto = generarResumenTexto(parametros, resultado);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback si clipboard API no está disponible
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      timerRef.current = window.setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <LiquidGlassDome padding="lg" radius="dome">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            SBC 2026
          </div>
          <div className="mt-1 font-playfair text-[18px] font-black leading-tight text-ink">
            Resultado
          </div>
        </div>
        <BadgeGold size="md">Factor {formatearFactor(resultado.factor)}</BadgeGold>
      </div>

      <GoldDivider spacing="md" />

      {/* SBC bruto */}
      <div className="space-y-3 font-inter text-[13px]">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">SBC bruto</span>
          <span className="font-orbitron font-semibold tabular-nums text-ink">
            {formatearMXN(resultado.sbcBruto)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Salario diario</span>
          <span className="font-orbitron font-semibold tabular-nums text-ink">
            {formatearMXN(parametros.salarioDiario)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted">Factor</span>
          <span className="font-orbitron font-bold tabular-nums text-navy">
            × {formatearFactor(resultado.factor)}
          </span>
        </div>
      </div>

      <GoldDivider spacing="md" />

      {/* TOTAL — elemento más importante */}
      <div className="py-2 text-center">
        <div className="mb-3 font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
          SBC final IMSS
        </div>
        <TextMagnified size="xl" className="text-navy">
          {formatearMXN(resultado.sbcFinal)}
        </TextMagnified>
        <div className="mt-3 font-orbitron text-[10px] font-semibold tracking-[0.16em] text-muted">
          {resultado.tipoTope === null
            ? '✓ Dentro de rango IMSS'
            : resultado.tipoTope === 'max'
              ? `⚑ Tope 25 UMAs aplicado`
              : `⚑ Mínimo aplicado`}
        </div>
      </div>

      {/* Alertas según tope */}
      {resultado.tipoTope !== null && (
        <>
          <GoldDivider spacing="md" />
          <div
            className={`flex gap-2.5 rounded-[12px] border p-3 ${
              resultado.tipoTope === 'max'
                ? 'border-amber-200 bg-amber-50'
                : 'border-blue-200 bg-blue-50'
            } `}
          >
            <AlertTriangle
              size={16}
              strokeWidth={2.5}
              className={`mt-0.5 shrink-0 ${
                resultado.tipoTope === 'max' ? 'text-amber-600' : 'text-blue-700'
              }`}
            />
            <div className="text-[11px] leading-[1.5]">
              {resultado.tipoTope === 'max' ? (
                <>
                  <strong className="text-amber-700">Tope de 25 UMAs aplicado:</strong> El SBC bruto
                  ({formatearMXN(resultado.sbcBruto)}) supera el tope de{' '}
                  {formatearMXN(CONSTANTES_IMSS.topePesos)}. El IMSS cotiza sobre el tope.
                </>
              ) : (
                <>
                  <strong className="text-blue-700">Salario mínimo aplicado:</strong> El SBC bruto (
                  {formatearMXN(resultado.sbcBruto)}) está por debajo del mínimo frontera (
                  {formatearMXN(CONSTANTES_IMSS.salarioMinimo)}). Se ajusta al mínimo.
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Botón de copiar resumen */}
      <div className="mt-6">
        <GlassButton
          variant={copiado ? 'default' : 'primary'}
          size="lg"
          fullWidth
          onClick={handleCopiar}
        >
          {copiado ? (
            <>
              <Check size={16} strokeWidth={3} />
              COPIADO
            </>
          ) : (
            <>
              <Copy size={16} strokeWidth={2.5} />
              COPIAR RESUMEN
            </>
          )}
        </GlassButton>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-center font-orbitron text-[10px] tracking-[0.12em] text-muted">
          <CheckCircle2 size={10} strokeWidth={2.5} />
          Cálculo conforme LSS Art. 27
        </div>
      </div>
    </LiquidGlassDome>
  );
}

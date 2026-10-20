/**
 * ARK TOOLS — Calculadora Nómina Rápida 2026
 * ResultadoNomina
 *
 * Card dorada con el Sueldo Neto a Pagar.
 * Usa LiquidGlassDome + TextMagnified + GlassButton (ARK Physical System).
 */

import { useState, useRef, useEffect } from 'react';
import { Copy, Check, ShieldCheck, DollarSign } from 'lucide-react';
import {
  GlassButton,
  LiquidGlassDome,
  BadgeGold,
  GoldDivider,
  TextMagnified,
} from '@/components/ui';
import { formatearMXN } from '../lib/calcularISR';
import { generarResumenTexto } from '../lib/calcularNomina';
import type { ParametrosNomina, ResultadoNomina as ResultadoNominaType } from '../types';

interface ResultadoNominaProps {
  parametros: ParametrosNomina;
  resultado: ResultadoNominaType;
}

export function ResultadoNomina({ parametros, resultado }: ResultadoNominaProps) {
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

  const pctNeto =
    resultado.sueldoBruto > 0
      ? Math.round((resultado.neto / resultado.sueldoBruto) * 1000) / 10
      : 0;

  return (
    <LiquidGlassDome padding="lg" radius="dome">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            RESULTADO FINAL · NÓMINA {resultado.periodo.label.toUpperCase()}
          </span>
          <h3 className="mt-0.5 font-playfair text-[20px] font-bold text-navy">
            Sueldo Neto a Percibir
          </h3>
        </div>
        <BadgeGold size="md">OFICIAL 2026</BadgeGold>
      </div>

      {/* Cifra Magnificada: Sueldo Neto */}
      <div className="my-5 rounded-[18px] border border-gold/30 bg-gradient-to-b from-white/90 to-surface-2/60 p-5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_16px_rgba(212,175,55,0.12)]">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
          <DollarSign className="h-3.5 w-3.5 text-gold" />
          Depósito neto estimado
        </div>
        <TextMagnified size="lg" className="text-navy">
          {formatearMXN(resultado.neto)}
        </TextMagnified>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted">
          <span>{pctNeto}% percibido del salario bruto</span>
          <span className="font-orbitron font-bold text-gold-dark">
            {resultado.periodo.dias} días / período
          </span>
        </div>
      </div>

      <GoldDivider spacing="sm" className="my-4" />

      {/* Métricas clave en grid */}
      <div className="my-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[12px] border border-line bg-surface-2 p-2.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Sueldo Bruto
          </div>
          <div className="mt-1 font-orbitron text-[12px] font-bold text-navy">
            {formatearMXN(resultado.sueldoBruto)}
          </div>
        </div>

        <div className="rounded-[12px] border border-line bg-surface-2 p-2.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Retención ISR
          </div>
          <div className="mt-1 font-orbitron text-[12px] font-bold text-navy">
            -{formatearMXN(resultado.isr.isrFinal)}
          </div>
        </div>

        <div className="rounded-[12px] border border-line bg-surface-2 p-2.5">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
            IMSS Obrero
          </div>
          <div className="mt-1 font-orbitron text-[12px] font-bold text-navy">
            -{formatearMXN(resultado.imss.total)}
          </div>
        </div>
      </div>

      {/* Nota de validez legal */}
      <div className="my-4 flex items-start gap-2.5 rounded-[12px] border border-navy/10 bg-navy/5 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
        <p className="text-[11px] leading-relaxed text-navy/80">
          Cálculo ajustado a la <span className="font-semibold text-navy">RMF 2026 Anexo 8</span>{' '}
          (tarifa y subsidio al empleo) y cuotas obrero del{' '}
          <span className="font-semibold text-navy">IMSS (LSS 2026)</span>.
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <GlassButton
          variant={copiado ? 'primary' : 'default'}
          size="sm"
          onClick={handleCopiar}
          className="w-full justify-center"
        >
          {copiado ? (
            <>
              <Check className="mr-1.5 h-4 w-4 text-gold" />
              <span>¡Copiado al portapapeles!</span>
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-4 w-4 text-muted" />
              <span>Copiar resumen de nómina</span>
            </>
          )}
        </GlassButton>
      </div>
    </LiquidGlassDome>
  );
}

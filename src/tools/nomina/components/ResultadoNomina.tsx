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

export function ResultadoNomina({
  parametros,
  resultado,
}: ResultadoNominaProps) {
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
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase font-orbitron block">
            RESULTADO FINAL · NÓMINA {resultado.periodo.label.toUpperCase()}
          </span>
          <h3 className="text-[20px] font-bold text-navy font-playfair mt-0.5">
            Sueldo Neto a Percibir
          </h3>
        </div>
        <BadgeGold size="md">OFICIAL 2026</BadgeGold>
      </div>

      {/* Cifra Magnificada: Sueldo Neto */}
      <div className="my-5 p-5 rounded-[18px] bg-gradient-to-b from-white/90 to-surface-2/60 border border-gold/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_4px_16px_rgba(212,175,55,0.12)]">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted mb-1 flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-gold" />
          Depósito neto estimado
        </div>
        <TextMagnified size="lg" className="text-navy">
          {formatearMXN(resultado.neto)}
        </TextMagnified>
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted">
          <span>{pctNeto}% percibido del salario bruto</span>
          <span className="text-gold-dark font-bold font-orbitron">
            {resultado.periodo.dias} días / período
          </span>
        </div>
      </div>

      <GoldDivider spacing="sm" className="my-4" />

      {/* Métricas clave en grid */}
      <div className="grid grid-cols-3 gap-2 text-center my-4">
        <div className="p-2.5 rounded-[12px] bg-surface-2 border border-line">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Sueldo Bruto
          </div>
          <div className="text-[12px] font-bold font-orbitron text-navy mt-1">
            {formatearMXN(resultado.sueldoBruto)}
          </div>
        </div>

        <div className="p-2.5 rounded-[12px] bg-surface-2 border border-line">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
            Retención ISR
          </div>
          <div className="text-[12px] font-bold font-orbitron text-navy mt-1">
            -{formatearMXN(resultado.isr.isrFinal)}
          </div>
        </div>

        <div className="p-2.5 rounded-[12px] bg-surface-2 border border-line">
          <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
            IMSS Obrero
          </div>
          <div className="text-[12px] font-bold font-orbitron text-navy mt-1">
            -{formatearMXN(resultado.imss.total)}
          </div>
        </div>
      </div>

      {/* Nota de validez legal */}
      <div className="rounded-[12px] bg-navy/5 border border-navy/10 p-3 my-4 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-navy mt-0.5 shrink-0" />
        <p className="text-[11px] text-navy/80 leading-relaxed">
          Cálculo ajustado a la <span className="font-semibold text-navy">RMF 2026 Anexo 8</span> (tarifa y subsidio al empleo) y cuotas obrero del <span className="font-semibold text-navy">IMSS (LSS 2026)</span>.
        </p>
      </div>

      {/* Acciones */}
      <div className="pt-2 flex items-center justify-end gap-2">
        <GlassButton
          variant={copiado ? 'primary' : 'default'}
          size="sm"
          onClick={handleCopiar}
          className="w-full justify-center"
        >
          {copiado ? (
            <>
              <Check className="w-4 h-4 text-gold mr-1.5" />
              <span>¡Copiado al portapapeles!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-muted mr-1.5" />
              <span>Copiar resumen de nómina</span>
            </>
          )}
        </GlassButton>
      </div>
    </LiquidGlassDome>
  );
}

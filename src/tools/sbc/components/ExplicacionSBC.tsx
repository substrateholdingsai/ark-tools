/**
 * ARK LEDGER — Calculadora SBC 2026
 * ExplicacionSBC
 *
 * Card informativa que explica qué es el SBC y por qué importa.
 * Usa fondo navy (contraste con el resto blanco).
 */

import { Sparkles, ShieldCheck } from 'lucide-react';
import { GoldDivider } from '@/components/ui';

export function ExplicacionSBC() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-navy p-6 text-white md:p-7">
      {/* Decoración de fondo: círculo blur */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-[160px] w-[160px] rounded-full bg-white/[0.05] blur-[1px]" />

      {/* Icono decorativo arriba a la derecha */}
      <div className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-gold/20">
        <Sparkles size={16} className="text-gold" strokeWidth={2} />
      </div>

      <div className="relative">
        {/* Badge superior */}
        <div className="font-orbitron text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
          ¿Por qué cambia en 2026?
        </div>

        {/* Párrafo explicativo */}
        <p className="mt-3 max-w-[42ch] text-[13px] leading-[1.65] text-white/80">
          El SBC integra las prestaciones al salario base. En 2026, la UMA sube a{' '}
          <strong className="font-orbitron tabular-nums text-white">$117.31</strong>, por lo que el
          tope de 25 UMAs llega a{' '}
          <strong className="font-orbitron tabular-nums text-white">$2,932.75</strong>. Si pagas por
          encima, el IMSS topa. Si pagas por debajo del salario mínimo frontera (
          <strong className="text-white">$440.87</strong>), se ajusta al mínimo.
        </p>

        <GoldDivider spacing="md" />

        {/* Grid de dos cards internas */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Card: Qué es SBC */}
          <div className="rounded-[12px] border border-white/10 bg-white/[0.07] p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              <ShieldCheck size={12} strokeWidth={2.5} />
              Qué es SBC
            </div>
            <p className="mt-2 text-[12px] leading-[1.5] text-white/90">
              Base para cuotas IMSS, INFONAVIT y riesgos. Salario + parte proporcional de
              prestaciones.
            </p>
          </div>

          {/* Card: Por qué importa */}
          <div className="rounded-[12px] border border-white/10 bg-white/[0.07] p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              <ShieldCheck size={12} strokeWidth={2.5} />
              Por qué importa
            </div>
            <p className="mt-2 text-[12px] leading-[1.5] text-white/90">
              Un mal SBC = multas, diferencias y capitales constitutivos. Calcula bien desde el día
              1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

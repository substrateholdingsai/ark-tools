/**
 * ARK TOOLS — Calculadora SBC 2026
 * ExplicacionSBC
 *
 * Card informativa que explica qué es el SBC y por qué importa.
 * Usa fondo navy (contraste con el resto blanco).
 */

import { Sparkles, ShieldCheck } from 'lucide-react';
import { GoldDivider } from '@/components/ui';

export function ExplicacionSBC() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-navy text-white p-6 md:p-7">
      {/* Decoración de fondo: círculo blur */}
      <div className="absolute -right-12 -top-12 w-[160px] h-[160px] rounded-full bg-white/[0.05] blur-[1px] pointer-events-none" />

      {/* Icono decorativo arriba a la derecha */}
      <div className="absolute right-6 top-6 w-10 h-10 rounded-full bg-gold/20 border border-gold/30 grid place-items-center">
        <Sparkles size={16} className="text-gold" strokeWidth={2} />
      </div>

      <div className="relative">
        {/* Badge superior */}
        <div className="text-[10px] font-bold tracking-[0.18em] text-gold uppercase font-orbitron">
          ¿Por qué cambia en 2026?
        </div>

        {/* Párrafo explicativo */}
        <p className="mt-3 text-[13px] leading-[1.65] text-white/80 max-w-[42ch]">
          El SBC integra las prestaciones al salario base. En 2026, la UMA sube
          a{' '}
          <strong className="text-white font-orbitron tabular-nums">
            $113.14
          </strong>
          , por lo que el tope de 25 UMAs llega a{' '}
          <strong className="text-white font-orbitron tabular-nums">
            $2,828.50
          </strong>
          . Si pagas por encima, el IMSS topa. Si pagas por debajo del salario
          mínimo (<strong className="text-white">$278.80</strong>), se ajusta al
          mínimo.
        </p>

        <GoldDivider spacing="md" />

        {/* Grid de dos cards internas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card: Qué es SBC */}
          <div className="rounded-[12px] bg-white/[0.07] border border-white/10 p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-white/60 uppercase">
              <ShieldCheck size={12} strokeWidth={2.5} />
              Qué es SBC
            </div>
            <p className="text-[12px] mt-2 leading-[1.5] text-white/90">
              Base para cuotas IMSS, INFONAVIT y riesgos. Salario + parte
              proporcional de prestaciones.
            </p>
          </div>

          {/* Card: Por qué importa */}
          <div className="rounded-[12px] bg-white/[0.07] border border-white/10 p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-white/60 uppercase">
              <ShieldCheck size={12} strokeWidth={2.5} />
              Por qué importa
            </div>
            <p className="text-[12px] mt-2 leading-[1.5] text-white/90">
              Un mal SBC = multas, diferencias y capitales constitutivos.
              Calcula bien desde el día 1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Sparkles, ShieldCheck } from 'lucide-react';
import { GoldDivider } from '@/components/ui';
import { CONSTANTES_IMSS } from '../data/uma';
import { formatearMXN } from '../lib/calcularSBC';

export function ExplicacionSBC() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-navy p-6 text-white md:p-7">
      <div className="pointer-events-none absolute -right-12 -top-12 h-[160px] w-[160px] rounded-full bg-white/[0.05] blur-[1px]" />
      <div className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-gold/30 bg-gold/20">
        <Sparkles size={16} className="text-gold" strokeWidth={2} />
      </div>

      <div className="relative">
        <div className="font-orbitron text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
          ¿Por qué importa en 2026?
        </div>

        <p className="mt-3 max-w-[46ch] text-[13px] leading-[1.65] text-white/80">
          El SBC integra prestaciones al salario base (LSS Art. 27). En 2026, la UMA es{' '}
          <strong className="font-orbitron tabular-nums text-white">
            {formatearMXN(CONSTANTES_IMSS.umaDiaria)}
          </strong>{' '}
          y el tope superior es 25 UMAs ={' '}
          <strong className="font-orbitron tabular-nums text-white">
            {formatearMXN(CONSTANTES_IMSS.topePesos)}
          </strong>{' '}
          (LSS Art. 28). El límite inferior es el salario mínimo general del área geográfica:{' '}
          <strong className="text-white">
            {formatearMXN(CONSTANTES_IMSS.salarioMinimoGeneral)}
          </strong>{' '}
          (zona general) o{' '}
          <strong className="text-white">
            {formatearMXN(CONSTANTES_IMSS.salarioMinimoFrontera)}
          </strong>{' '}
          (ZLFN), según corresponda al trabajador.
        </p>

        <GoldDivider spacing="md" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="rounded-[12px] border border-white/10 bg-white/[0.07] p-3.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              <ShieldCheck size={12} strokeWidth={2.5} />
              Por qué importa
            </div>
            <p className="mt-2 text-[12px] leading-[1.5] text-white/90">
              Un SBC incorrecto genera diferencias, multas y capitales constitutivos. Calcula bien
              desde el día 1.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

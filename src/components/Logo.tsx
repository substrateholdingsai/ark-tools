/**
 * Logo
 *
 * Logo isométrico de ARK Systems. Cubo 3D con la "A" en el centro.
 * Usado en Header y Footer.
 */

import { cn } from '@/lib/cn';

interface LogoProps {
  /** Tamaño en px. Default: 40 */
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className }: LogoProps) {
  const innerSize = Math.round(size * 0.7);

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="relative"
          style={{
            width: innerSize,
            height: innerSize,
            transform: 'rotateX(18deg) rotateY(-32deg) rotateZ(8deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Cara frontal: Navy */}
          <div
            className="absolute inset-0 border border-white/20 bg-navy"
            style={{ transform: `translateZ(${innerSize / 2}px)` }}
          />
          {/* Cara lateral: Navy oscuro */}
          <div
            className="absolute inset-0 border border-white/10 bg-navy-dark"
            style={{ transform: `rotateY(90deg) translateZ(${innerSize / 2}px)` }}
          />
          {/* Cara superior: Gold */}
          <div
            className="absolute inset-0 border border-white/20 bg-gold"
            style={{ transform: `rotateX(90deg) translateZ(${innerSize / 2}px)` }}
          />
          {/* Detalles de la cara frontal */}
          <div className="absolute left-[4px] top-[8px] h-[1px] w-[20px] bg-white/60" />
          <div className="absolute left-[12px] top-[8px] h-[8px] w-[1px] bg-white/60" />
          <div className="absolute bottom-[8px] right-[6px] h-[1px] w-[10px] bg-black/30" />
          {/* Letra A */}
          <div className="orbitron absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-orbitron text-[11px] font-black tracking-[-0.05em] text-white">
            A
          </div>
        </div>
      </div>
      {/* Detalle decorativo: diamante dorado */}
      <div className="absolute -bottom-1 -right-1 h-2 w-2 rotate-45 border border-white bg-gold shadow-sm" />
    </div>
  );
}

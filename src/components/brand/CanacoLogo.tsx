/**
 * CanacoLogo
 *
 * Logotipo oficial de CANACO SERVYTUR MÉRIDA en formato vectorial SVG.
 * Soporta variante de isotipo geométrico puro ('symbol') para headers o avatares,
 * y variante completa institucional ('full') con tipografía y línea decorativa.
 */

import { cn } from '@/lib/cn';

interface CanacoLogoProps {
  /** Tamaño en px (ancho o alto referencial). Default: 40 */
  size?: number;
  /** Variante: 'symbol' para el isotipo triangular compacto; 'full' para el emblema completo */
  variant?: 'symbol' | 'full';
  className?: string;
}

export function CanacoLogo({ size = 40, variant = 'symbol', className }: CanacoLogoProps) {
  if (variant === 'symbol') {
    // Isotipo triangular estilizado (optimizado para viewBox compacto 500x320)
    return (
      <svg
        viewBox="30 10 440 300"
        width={size}
        height={size}
        className={cn('shrink-0 transition-transform', className)}
        aria-label="CANACO SERVYTUR MÉRIDA — Isotipo"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="#1a467e">
          <polygon points="250,15 455,300 405,300 250,70 95,300 45,300" />
          <polygon points="250,135 345,260 155,260" />
        </g>
      </svg>
    );
  }

  // Variante institucional completa
  return (
    <svg
      viewBox="0 0 500 480"
      width={size}
      height={Math.round((size * 480) / 500)}
      className={cn('shrink-0', className)}
      aria-label="CANACO SERVYTUR MÉRIDA — Logotipo Oficial"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        .canaco-text-main {
          font-family: "Times New Roman", Times, serif, "Georgia";
          font-weight: bold;
          font-size: 38px;
          fill: #444444;
          letter-spacing: 2px;
        }
        .canaco-text-sub {
          font-family: "Times New Roman", Times, serif, "Georgia";
          font-weight: bold;
          font-size: 35px;
          fill: #333333;
          letter-spacing: 3px;
        }
      `}</style>

      {/* Isotipo (Logotipo triangular estilizado en forma de C / A) */}
      <g fill="#1a467e">
        <polygon points="250,15 455,300 405,300 250,70 95,300 45,300" />
        <polygon points="250,135 345,260 155,260" />
      </g>

      {/* Texto Principal: CANACO SERVYTUR */}
      <text x="250" y="380" textAnchor="middle" className="canaco-text-main">
        CANACO SERVYTUR
      </text>

      {/* Texto Secundario: MÉRIDA */}
      <text x="250" y="430" textAnchor="middle" className="canaco-text-sub">
        MÉRIDA
      </text>

      {/* Línea inferior decorativa */}
      <rect x="50" y="455" width="400" height="3" fill="#1a467e" />
    </svg>
  );
}

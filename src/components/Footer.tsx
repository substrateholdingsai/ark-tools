/**
 * Footer
 *
 * Footer con info de la empresa, links y badges del sistema.
 */

import { cn } from '@/lib/cn';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'bg-white border-t border-line',
        className
      )}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10 flex flex-wrap gap-6 items-center justify-between">
        {/* Logo + Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-navy grid place-items-center text-white font-black text-[12px] orbitron font-orbitron">
            A
          </div>
          <div>
            <div className="text-[12px] font-bold tracking-[0.12em] text-ink">
              ARK TOOLS · SUBSTRATE HOLDINGS LLC
            </div>
            <div className="text-[11px] text-muted inter font-inter">
              Diseñado para que el dinero se entienda sin leer · México · 2026
            </div>
          </div>
        </div>

        {/* Badges del sistema */}
        <div className="flex items-center gap-2 text-[10px] tracking-[0.14em] font-bold text-muted">
          <span className="px-3 py-1.5 rounded-full bg-surface-2 border border-line">
            LIQUID GLASS
          </span>
          <span className="px-3 py-1.5 rounded-full bg-gold text-navy-dark">
            ORO ESTRATÉGICO
          </span>
          <span className="px-3 py-1.5 rounded-full bg-navy text-white">
            BLANCO = CONFIANZA
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

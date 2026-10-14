/**
 * Header
 *
 * Header sticky con logo, navegación y badge de versión.
 * Se adapta a mobile (sin nav) y desktop (con nav completa).
 */

import { cn } from '@/lib/cn';
import { Logo } from './Logo';

export interface NavItem {
  id: string;
  label: string;
}

interface HeaderProps {
  /** Herramienta activa (para resaltar en nav) */
  activeTool?: string | null;
  /** Callback al hacer click en un item de nav */
  onNavigate?: (id: string) => void;
  /** Items de navegación */
  navItems?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'todas', label: 'HERRAMIENTAS' },
  { id: 'fiscal', label: 'FISCAL' },
  { id: 'sat', label: 'SAT' },
  { id: 'cobros', label: 'COBROS' },
  { id: 'docs', label: 'DOCS' },
];

export function Header({
  activeTool,
  onNavigate,
  navItems = defaultNavItems,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-line',
        className
      )}
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 h-[68px] flex items-center justify-between">
        {/* Logo + Nombre */}
        <div className="flex items-center gap-4">
          <Logo size={40} />
          <div className="leading-none">
            <div className="orbitron font-orbitron font-black text-[14px] tracking-[0.18em] text-navy">
              ARK TOOLS
            </div>
            <div className="text-[9px] tracking-[0.28em] text-muted font-semibold mt-[2px]">
              HERRAMIENTAS MODERNAS
            </div>
          </div>
        </div>

        {/* Nav (desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.14em] font-semibold text-muted">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                'transition hover:text-navy',
                activeTool === item.id && 'text-navy'
              )}
            >
              {item.label}
            </button>
          ))}
          <div className="h-4 w-px bg-line" />
          <span className="px-3 py-1.5 rounded-full bg-navy text-white text-[10px]">
            v1.0.0
          </span>
        </nav>

        {/* CTA (mobile) */}
        <div className="md:hidden flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-navy text-white text-[9px] font-bold tracking-widest">
            v1.0
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;

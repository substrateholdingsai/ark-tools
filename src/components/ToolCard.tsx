/**
 * ToolCard
 *
 * Tarjeta de herramienta. Muestra icono, título, descripción y badge.
 * Se usa en el dashboard y en cada categoría.
 */

import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ToolCardProps {
  /** Icono de Lucide */
  icon: LucideIcon;
  /** Título de la herramienta */
  title: string;
  /** Descripción breve */
  description: string;
  /** Badge opcional (ej. "NUEVO", "IMSS 2026") */
  badge?: string;
  /** Si el badge es dorado (default) o navy */
  badgeVariant?: 'gold' | 'navy' | 'muted';
  /** Callback al hacer click */
  onSelect?: () => void;
  /** Deshabilitado */
  disabled?: boolean;
  className?: string;
}

const badgeVariantClasses = {
  gold: 'bg-gold text-navy-dark',
  navy: 'bg-navy text-white',
  muted: 'bg-surface-2 border border-line text-muted',
} as const;

export function ToolCard({
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = 'gold',
  onSelect,
  disabled = false,
  className,
}: ToolCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'group text-left rounded-[20px] border border-line bg-surface p-6',
        'transition-all duration-200',
        'hover:border-gold hover:shadow-[0_20px_40px_rgba(0,43,127,0.08)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed hover:border-line hover:shadow-none',
        className
      )}
    >
      {/* Header de la card: icono + badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className={cn(
            'w-11 h-11 rounded-[12px] grid place-items-center',
            'bg-surface-2 border border-line text-navy',
            'transition-colors',
            !disabled && 'group-hover:bg-navy group-hover:text-white'
          )}
        >
          <Icon size={20} strokeWidth={1.75} />
        </div>
        {badge && (
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase',
              badgeVariantClasses[badgeVariant]
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Título y descripción */}
      <h3 className="font-playfair font-black text-[20px] leading-[1.15] text-ink">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-[1.5] text-muted inter font-inter">
        {description}
      </p>

      {/* Footer: CTA */}
      <div className="mt-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-navy orbitron font-orbitron">
        <span>ABRIR</span>
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}

export default ToolCard;

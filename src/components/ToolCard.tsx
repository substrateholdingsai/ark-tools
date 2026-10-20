/**
 * ToolCard
 *
 * Tarjeta de herramienta. Muestra icono, título, descripción y badge.
 * Se usa en el dashboard y en cada categoría.
 */

import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ToolCardProps {
  /** Icono de Lucide */
  icon?: LucideIcon;
  /** Título de la herramienta */
  title: string;
  /** Descripción breve */
  description: string;
  /** Badge opcional (ej. "NUEVO", "IMSS 2026") */
  badge?: string;
  /** Si el badge es dorado (default), navy o neutral */
  badgeVariant?: 'gold' | 'navy' | 'muted' | 'neutral';
  /** Categoría opcional */
  category?: string;
  /** Callback al hacer click */
  onSelect?: () => void;
  /** Alias para onSelect */
  onClick?: () => void;
  /** Deshabilitado */
  disabled?: boolean;
  className?: string;
}

const badgeVariantClasses = {
  gold: 'bg-gold text-navy-dark',
  navy: 'bg-navy text-white',
  muted: 'bg-surface-2 border border-line text-muted',
  neutral: 'bg-surface-2 border border-line text-muted',
} as const;

export function ToolCard({
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = 'gold',
  category,
  onSelect,
  onClick,
  disabled = false,
  className,
}: ToolCardProps) {
  const handleClick = onSelect ?? onClick;
  const isPro = badge === 'PRO' || badgeVariant === 'gold';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'group rounded-[20px] border border-line bg-surface p-6 text-left',
        'transition-all duration-200',
        'hover:border-gold hover:shadow-[0_20px_40px_rgba(0,43,127,0.08)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50 hover:border-line hover:shadow-none',
        className
      )}
    >
      {/* Header de la card: icono + badge */}
      <div className="mb-4 flex items-start justify-between gap-3">
        {Icon ? (
          <div
            className={cn(
              'grid h-11 w-11 place-items-center rounded-[12px]',
              'border border-line bg-surface-2 text-navy',
              'transition-colors',
              !disabled && 'group-hover:bg-navy group-hover:text-white'
            )}
          >
            <Icon size={20} strokeWidth={1.75} />
          </div>
        ) : category ? (
          <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
            {category}
          </span>
        ) : (
          <div />
        )}
        {badge && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
              badgeVariantClasses[badgeVariant]
            )}
          >
            {isPro && <Fingerprint size={12} className="text-navy-dark" />}
            <span>{badge}</span>
          </span>
        )}
      </div>

      {/* Título y descripción */}
      <h3 className="font-playfair text-[20px] font-black leading-[1.15] text-ink">{title}</h3>
      <p className="inter mt-2 font-inter text-[13px] leading-[1.5] text-muted">{description}</p>

      {/* Footer: CTA + Reconocimiento Pro */}
      <div className="orbitron mt-5 flex items-center justify-between border-t border-line/40 pt-4 font-orbitron text-[11px] font-bold tracking-[0.14em]">
        {isPro ? (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gold-dark">
            <Fingerprint size={13} className="text-gold-dark" />
            <span>CRÉDITO PRO</span>
          </div>
        ) : (
          <div className="text-[10px] font-medium text-muted">
            <span>LIBRE</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-navy group-hover:text-navy-dark">
          <span>ABRIR</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

export default ToolCard;

/**
 * BadgeGold
 *
 * Badge dorado para destacar valor (ganancia, verificación, etc.).
 * Solo se usa para señales positivas.
 *
 * @see DESIGN_SYSTEM.md §5.7
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface BadgeGoldProps {
  children: ReactNode;
  /** Tamaño. Default: 'md' */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[9px]',
  md: 'px-2.5 py-1 text-[10px]',
  lg: 'px-3 py-1.5 text-[11px]',
} as const;

export function BadgeGold({ children, size = 'md', className }: BadgeGoldProps) {
  return (
    <span
      className={cn(
        'badge-gold orbitron inline-flex items-center gap-1.5 rounded-full font-orbitron font-black tracking-[0.12em]',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * GoldDivider
 *
 * Separador dorado con diamante ◆ centrado.
 * Uso: entre secciones de dinero.
 *
 * @see DESIGN_SYSTEM.md §5.6
 */

import { cn } from '@/lib/cn';

interface GoldDividerProps {
  /** Espaciado vertical. Default: 'md' */
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spacingClasses = {
  sm: 'my-3',
  md: 'my-6',
  lg: 'my-10',
} as const;

export function GoldDivider({ spacing = 'md', className }: GoldDividerProps) {
  return <div className={cn('gold-divider', spacingClasses[spacing], className)} />;
}

/**
 * LCDDisplay
 *
 * Display vintage tipo calculadora HP 12C.
 * Uso: histórico contable, calculadora, valores secundarios.
 *
 * @see DESIGN_SYSTEM.md §5.3
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface LCDDisplayProps {
  children: ReactNode;
  /** Etiqueta superior opcional */
  label?: string;
  /** Alineación del contenido. Default: 'right' */
  align?: 'left' | 'center' | 'right';
  /** Padding interno. Default: 'md' */
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const;

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

export function LCDDisplay({
  children,
  label,
  align = 'right',
  padding = 'md',
  className,
}: LCDDisplayProps) {
  return (
    <div
      className={cn(
        'lcd-display rounded-[12px]',
        paddingClasses[padding],
        className
      )}
    >
      {label && (
        <div className="text-[9px] tracking-[0.2em] opacity-70 mb-1 font-orbitron uppercase">
          {label}
        </div>
      )}
      <div
        className={cn(
          'font-orbitron font-bold tabular-nums tracking-tight',
          alignClasses[align]
        )}
      >
        {children}
      </div>
    </div>
  );
}

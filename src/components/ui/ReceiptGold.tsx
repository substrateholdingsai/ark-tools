/**
 * ReceiptGold
 *
 * Contenedor con doble borde dorado. Para recibos, facturas, folios.
 * Regla: nunca más de 1 por vista.
 *
 * @see DESIGN_SYSTEM.md §5.2
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ReceiptGoldProps {
  children: ReactNode;
  /** Padding interno. Default: 'md' */
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

export function ReceiptGold({
  children,
  padding = 'md',
  className,
}: ReceiptGoldProps) {
  return (
    <div
      className={cn(
        'receipt-gold rounded-[16px] bg-surface',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

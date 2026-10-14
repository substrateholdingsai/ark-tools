/**
 * TextMagnified
 *
 * El componente más importante del sistema. Se usa SOLO para totales de dinero.
 * Aplica Playfair 900 + text-shadow triple + drop-shadow dorado.
 *
 * @see DESIGN_SYSTEM.md §5.5
 */

import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TextMagnifiedProps {
  children: ReactNode;
  /** Elemento HTML a renderizar. Default: 'div' */
  as?: ElementType;
  /** Tamaño del texto. Default: 'lg' */
  size?: 'md' | 'lg' | 'xl' | '2xl';
  /** Clases adicionales */
  className?: string;
}

const sizeClasses = {
  md: 'text-[32px] md:text-[40px]',
  lg: 'text-[40px] md:text-[48px]',
  xl: 'text-[48px] md:text-[56px]',
  '2xl': 'text-[56px] md:text-[68px]',
} as const;

export function TextMagnified({
  children,
  as: Component = 'div',
  size = 'lg',
  className,
}: TextMagnifiedProps) {
  return (
    <Component
      className={cn(
        'font-playfair font-black leading-[0.92] tracking-[-0.04em] text-navy text-magnified',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Component>
  );
}

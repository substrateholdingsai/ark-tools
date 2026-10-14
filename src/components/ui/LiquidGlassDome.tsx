/**
 * LiquidGlassDome
 *
 * Contenedor de dinero. Aplica la cúpula de cristal con sombra física dorada.
 * Es el componente más emblemático del sistema.
 *
 * @see DESIGN_SYSTEM.md §5.1
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface LiquidGlassDomeProps {
  children: ReactNode;
  /** Padding interno. Default: 'md' */
  padding?: 'sm' | 'md' | 'lg';
  /** Radio del borde. Default: 'dome' */
  radius?: 'card' | 'dome';
  className?: string;
}

const paddingClasses = {
  sm: 'p-6',
  md: 'p-8',
  lg: 'p-10',
} as const;

const radiusClasses = {
  card: 'rounded-[20px]',
  dome: 'rounded-[28px]',
} as const;

export function LiquidGlassDome({
  children,
  padding = 'md',
  radius = 'dome',
  className,
}: LiquidGlassDomeProps) {
  return (
    <div
      className={cn(
        'liquid-glass-dome relative overflow-hidden border border-white',
        paddingClasses[padding],
        radiusClasses[radius],
        className
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

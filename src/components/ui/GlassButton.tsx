/**
 * GlassButton
 *
 * Botón principal del sistema. Variante 'primary' usa gradiente dorado.
 * Incluye la animación de presión (translateY 4px) del sistema Ark.
 *
 * @see DESIGN_SYSTEM.md §5.4
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual. Default: 'default' */
  variant?: 'default' | 'primary';
  /** Tamaño. Default: 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Ancho completo */
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: 'px-4 py-2 text-[10px]',
  md: 'px-6 py-3 text-[11px]',
  lg: 'px-8 py-4 text-[13px]',
} as const;

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      fullWidth = false,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'glass-btn rounded-full font-bold tracking-[0.14em] orbitron font-orbitron',
          'inline-flex items-center justify-center gap-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary' && 'glass-btn-primary',
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

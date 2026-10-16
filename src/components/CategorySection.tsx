/**
 * CategorySection
 *
 * Sección de categoría con título, descripción y grid de herramientas.
 * Agrupa visualmente las herramientas por tipo (Fiscal, SAT, Cobros, etc.).
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { GoldDivider } from './ui';

interface CategorySectionProps {
  /** Título de la categoría */
  title: string;
  /** Descripción breve */
  description?: string;
  /** Ícono opcional a la izquierda */
  icon?: ReactNode;
  /** Grid de herramientas (ToolCards) */
  children: ReactNode;
  /** Número de columnas en desktop. Default: 3 */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const columnClasses = {
  1: 'grid-cols-1 md:max-w-[420px]',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
} as const;

export function CategorySection({
  title,
  description,
  icon,
  children,
  columns = 3,
  className,
}: CategorySectionProps) {
  return (
    <section className={cn('', className)}>
      {/* Header de la categoría */}
      <div className="flex items-start gap-4 mb-6">
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-[10px] bg-navy text-white grid place-items-center">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-playfair font-black text-[28px] md:text-[32px] leading-[1] tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-[14px] leading-[1.5] text-muted inter font-inter max-w-[64ch]">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Divider dorado sutil */}
      <GoldDivider spacing="sm" />

      {/* Grid de herramientas */}
      <div className={cn('mt-6 grid gap-4', columnClasses[columns])}>
        {children}
      </div>
    </section>
  );
}

export default CategorySection;

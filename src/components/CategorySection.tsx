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
  id?: string;
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
  id,
  title,
  description,
  icon,
  children,
  columns = 3,
  className,
}: CategorySectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-32', className)}>
      {/* Header de la categoría */}
      <div className="mb-6 flex items-start gap-4">
        {icon && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-navy text-white">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-playfair text-[28px] font-black leading-[1] tracking-[-0.02em] text-ink md:text-[32px]">
            {title}
          </h2>
          {description && (
            <p className="inter mt-2 max-w-[64ch] font-inter text-[14px] leading-[1.5] text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Divider dorado sutil */}
      <GoldDivider spacing="sm" />

      {/* Grid de herramientas */}
      <div className={cn('mt-6 grid gap-4', columnClasses[columns])}>{children}</div>
    </section>
  );
}

export default CategorySection;

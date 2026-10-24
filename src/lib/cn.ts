/**
 * ARK LEDGER — Utilidad para combinar clases Tailwind
 *
 * Combina clsx (condicionales) con tailwind-merge (resolución de conflictos).
 * Uso: cn('px-4 py-2', isActive && 'bg-navy', className)
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

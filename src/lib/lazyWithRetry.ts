import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Determina si un error corresponde a la falla de importación de un chunk diferido
 * ocasionado por un nuevo despliegue en producción o desincronización de caché.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    message
  );
}

/**
 * Ejecuta una recarga de seguridad controlada en caso de desincronización de chunks.
 */
export function reloadForChunkUpdate(): boolean {
  if (typeof window === 'undefined') return false;
  const reloadKey = 'ark_chunk_retry_pending';
  const hasRetried = sessionStorage.getItem(reloadKey);
  if (!hasRetried) {
    sessionStorage.setItem(reloadKey, 'true');
    window.location.reload();
    return true;
  }
  sessionStorage.removeItem(reloadKey);
  return false;
}

/**
 * lazyWithRetry — Carga diferida resiliente a despliegues y desactualización de caché.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: unknown) {
      if (isChunkLoadError(error)) {
        const reloaded = reloadForChunkUpdate();
        if (reloaded) {
          // Fallback temporal mientras la ventana se recarga
          return { default: (() => null) as unknown as T };
        }
      }
      throw error;
    }
  });
}

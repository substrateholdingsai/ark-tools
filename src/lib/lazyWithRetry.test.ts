import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isChunkLoadError, reloadForChunkUpdate, lazyWithRetry } from './lazyWithRetry';

describe('lazyWithRetry utility', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detecta correctamente errores de carga de chunks dinámicos', () => {
    expect(
      isChunkLoadError(
        new Error(
          'Failed to fetch dynamically imported module: https://ledger.arksystems.site/assets/index-BV46_aFI.js'
        )
      )
    ).toBe(true);
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('SyntaxError: Unexpected token'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it('recarga la ventana una sola vez al disparar reloadForChunkUpdate', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });

    // Primera vez: debe recargar y guardar flag
    const reloaded = reloadForChunkUpdate();
    expect(reloaded).toBe(true);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('ark_chunk_retry_pending')).toBe('true');

    // Segunda vez consecutiva: no debe entrar en loop
    const reloadedSecond = reloadForChunkUpdate();
    expect(reloadedSecond).toBe(false);
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('ark_chunk_retry_pending')).toBeNull();
  });

  it('crea un componente lazy con lazyWithRetry', () => {
    const MockComponent = () => null;
    const factory = vi.fn().mockResolvedValue({ default: MockComponent });

    const LazyComponent = lazyWithRetry(factory);
    expect(LazyComponent).toBeDefined();
  });
});

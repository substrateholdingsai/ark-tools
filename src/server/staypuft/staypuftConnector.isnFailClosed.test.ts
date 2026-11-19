import { describe, expect, it, vi } from 'vitest';

vi.mock('../../tools/isn/data/estados', () => ({
  ESTADOS: [],
  getEstadoById: () => {
    throw new Error('getEstadoById no disponible en mock vacío');
  },
}));

describe('staypuftConnector — fail-closed cuando falta YUC en estados.ts', () => {
  it('lanza error explícito si YUC no está en ESTADOS (no default 3.75)', async () => {
    await expect(import('./staypuftConnector')).rejects.toThrow(/YUC missing from ESTADOS/);
  });
});

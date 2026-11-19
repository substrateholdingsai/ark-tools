import { describe, expect, it, vi } from 'vitest';
import { YUCATAN_ISN_TASA } from './staypuftConnector';

vi.mock('../../tools/isn/data/estados', () => ({
  ESTADOS: [
    {
      id: 'YUC',
      nombre: 'Yucatán',
      corto: 'Yuc',
      tasa: 9.99,
      vigencia: '2026',
      articulo: 'Art. 24 LGHY',
      tasasPorEjercicio: {
        2026: {
          general: {
            ejercicio: 2026,
            tasaBruta: 9.99,
            estimuloTasa: 0,
            tasaNeta: 9.99,
            articulo: 'Art. 24 LGHY',
            estimuloConfirmado: true,
          },
        },
      },
    },
  ],
  getEstadoById: () => ({
    id: 'YUC',
    nombre: 'Yucatán',
    corto: 'Yuc',
    tasa: 9.99,
    vigencia: '2026',
    articulo: 'Art. 24 LGHY',
  }),
}));

describe('staypuftConnector — tasa ISN Yucatán desde fuente única (estados.ts)', () => {
  it('usa la tasa de estados.ts (9.99) y no el literal 3.75', () => {
    expect(YUCATAN_ISN_TASA).toBe(9.99);
    expect(YUCATAN_ISN_TASA).not.toBe(3.75);
  });
});

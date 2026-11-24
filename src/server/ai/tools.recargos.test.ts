import { describe, it, expect } from 'vitest';
import { executeAiTool } from './tools';
import type { Env } from '../../index';

describe('executeAiTool — calcular_recargos_fiscales (Monday contract)', () => {
  const mockEnv = {} as Env;
  const tenant = 'tenant_test';

  const dorado = {
    importeHistorico: 45000,
    fechaVencimiento: '2025-06-17',
    fechaPago: '2026-02-17',
  };

  it('rechaza payload vacío (no demo silencioso)', async () => {
    const res = await executeAiTool('calcular_recargos_fiscales', {}, mockEnv, tenant);
    expect(res.success).toBe(false);
    const err = String(res.error);
    expect(err).toContain('importeHistorico');
    expect(err).toContain('fechaVencimiento');
    expect(err).toContain('fechaPago');
  });

  it('rechaza campo desconocido', async () => {
    const res = await executeAiTool(
      'calcular_recargos_fiscales',
      { ...dorado, campoInventado: 1 } as any,
      mockEnv,
      tenant
    );
    expect(res.success).toBe(false);
    expect(String(res.error)).toContain('campoInventado');
  });

  it('rechaza falta un campo requerido', async () => {
    const res = await executeAiTool(
      'calcular_recargos_fiscales',
      { importeHistorico: 45000, fechaVencimiento: '2025-06-17' } as any,
      mockEnv,
      tenant
    );
    expect(res.success).toBe(false);
    expect(String(res.error)).toContain('fechaPago');
  });

  it('rechaza fechaPago anterior a fechaVencimiento', async () => {
    const res = await executeAiTool(
      'calcular_recargos_fiscales',
      { ...dorado, fechaPago: '2025-06-10' } as any,
      mockEnv,
      tenant
    );
    expect(res.success).toBe(false);
    expect(String(res.error)).toContain('fechaPago');
  });

  it('rechaza importe 0 y negativo', async () => {
    for (const importe of [0, -500]) {
      const res = await executeAiTool(
        'calcular_recargos_fiscales',
        { ...dorado, importeHistorico: importe } as any,
        mockEnv,
        tenant
      );
      expect(res.success).toBe(false);
      expect(String(res.error)).toContain('importeHistorico');
    }
  });

  it('vector dorado válido → success con importes exactos', async () => {
    const res = await executeAiTool('calcular_recargos_fiscales', dorado as any, mockEnv, tenant);
    expect(res.success).toBe(true);
    const data = (res.data as any).result.details;
    expect(data.impuestoActualizado).toBe(46134);
    // Nueva lógica: tasa por año (Convention A). Mora jul 2025-feb 2026 = 6 meses 1.47% + 2 meses 2.07% = 12.96%
    // Antes (flat 2.07%): 8 * 2.07 = 16.56% -> 7639.79
    // Ahora: 46134 * 12.96% = 5978.97
    expect(data.montoRecargos).toBe(5978.97);
    expect(data.totalPagar).toBe(52112.97);
    expect(data.mesesMora).toBe(8);
    expect(data.tasaRecargosTotal).toBe(12.96);
    expect(data.factorActualizacion).toBe(1.0252);
    expect(data.folioDeIntegridad).toMatch(/^REC-[0-9a-f]{8}$/);
    expect(data.folioDeIntegridad).not.toContain('e3b0c442');
  });

  it('calcula Yucatán con la tasa estatal verificada', async () => {
    const res = await executeAiTool(
      'calcular_recargos_fiscales',
      { ...dorado, tipoRecargo: 'estatal_yucatan' },
      mockEnv,
      tenant
    );

    expect(res.success).toBe(true);
    const details = (
      res.data as { result: { details: { tipoRecargo: string; tasaRecargosMensual: number } } }
    ).result.details;
    expect(details.tipoRecargo).toBe('estatal_yucatan');
    expect(details.tasaRecargosMensual).toBe(2.07);
  });
});

import { describe, it, expect } from 'vitest';
import { executeAiTool } from './tools';
import type { Env } from '../../index';

describe('executeAiTool — calcular_nomina_rapida (Monday contract)', () => {
  const mockEnv = {} as Env;

  it('rechaza salarioMensual/periodicidad (campos no canónicos)', async () => {
    const res = await executeAiTool(
      'calcular_nomina_rapida',
      { salarioMensual: 15000, periodicidad: 'mensual' } as any,
      mockEnv,
      'tenant_test'
    );
    expect(res.success).toBe(false);
    expect(String(res.error)).toMatch(/salarioMensual|periodicidad/);
  });

  it('rechaza campo desconocido', async () => {
    const res = await executeAiTool(
      'calcular_nomina_rapida',
      { periodo: 'mensual', sueldoBruto: 15000, campoInventado: 1 } as any,
      mockEnv,
      'tenant_test'
    );
    expect(res.success).toBe(false);
    expect(String(res.error)).toContain('campoInventado');
  });

  it('sin sbcDiario usa default 1.0493 y reporta efectivo/fuente', async () => {
    const res = await executeAiTool(
      'calcular_nomina_rapida',
      { periodo: 'mensual', sueldoBruto: 18000, diasTrabajados: 30, diasPeriodo: 30 },
      mockEnv,
      'tenant_test'
    );
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.sbcDiarioEfectivo).toBe(629.58);
    expect(data.sbcDiarioFuente).toBe('default_1.0493');
    expect(data.imss.sbc).toBe(629.58);
    expect(data.imss.total).toBe(427.73);
    expect(data.isr.isrFinal).toBe(2033.23);
  });

  it('con sbcDiario explícito usa exactamente ese valor', async () => {
    const res = await executeAiTool(
      'calcular_nomina_rapida',
      {
        periodo: 'mensual',
        sueldoBruto: 18000,
        diasTrabajados: 30,
        diasPeriodo: 30,
        sbcDiario: 600,
      },
      mockEnv,
      'tenant_test'
    );
    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.sbcDiarioEfectivo).toBe(600);
    expect(data.sbcDiarioFuente).toBe('proporcionado');
    expect(data.imss.sbc).toBe(600);
    expect(data.imss.total).toBe(404.65);
  });

  it('rechaza si faltan campos requeridos (periodo/sueldoBruto)', async () => {
    const res = await executeAiTool(
      'calcular_nomina_rapida',
      { sueldoBruto: 15000 } as any,
      mockEnv,
      't'
    );
    expect(res.success).toBe(false);
    expect(String(res.error)).toContain('periodo');
  });
});

import { describe, expect, it } from 'vitest';
import type { Env } from '../../index';
import { executeAiTool, AI_TOOLS_CATALOG } from './tools';
import { CATALOGO_2026 } from '../../data/valores-vigentes/catalogo';

type Envelope = {
  tool: string;
  tool_version: string;
  deterministic: boolean;
  inputs_echo: Record<string, unknown>;
  result: {
    total: number;
    breakdown: Array<{ label: string; amount: number }>;
    details: Record<string, unknown>;
  };
  legal_basis: Array<{ ordenamiento: string; articulo: string; vigencia: string }>;
  catalog_versions: Array<{
    key: string;
    value: unknown;
    effective_from: string;
    source: string;
  }>;
  integrity: { kind: string; value: string; verify_url: string | null };
  warnings: string[];
};

const mockEnv = {} as Env;

const cases: Array<{
  tool: string;
  input: Record<string, unknown>;
  expected: (envelope: Envelope) => void;
}> = [
  {
    tool: 'calc_isn',
    input: {
      estadoId: 'YUC',
      baseGravable: 250000,
      tasa: 3.75,
      ejercicio: 2026,
      numEmpleados: 15,
      esMicroPequena2026: true,
    },
    expected: (envelope) => {
      expect(envelope.result.total).toBe(7500);
      expect(envelope.result.details.isnBruto).toBe(9375);
      expect(envelope.result.details.estimulo).toBe(1875);
    },
  },
  {
    tool: 'calc_sbc',
    input: {
      salarioDiario: 200,
      diasVacaciones: 12,
      primaVacacional: 25,
      diasAguinaldo: 15,
      zona: 'general',
    },
    expected: (envelope) => {
      expect(envelope.result.total).toBe(315.04);
      expect(envelope.result.details.sbcBruto).toBeCloseTo(209.863013698, 6);
    },
  },
  {
    tool: 'calc_nomina',
    input: {
      periodo: 'mensual',
      sueldoBruto: 18000,
      diasTrabajados: 30,
      diasPeriodo: 30,
    },
    expected: (envelope) => {
      expect(envelope.result.details.sbcDiarioEfectivo).toBe(629.58);
      expect(envelope.result.total).toBe(15615.82);
    },
  },
  {
    tool: 'calc_finiquito',
    input: {
      tipoBaja: 'liquidacion',
      fechaIngreso: '2022-03-01',
      fechaBaja: '2026-10-31',
      salarioDiario: 750,
      sdi: 789.15,
      vacacionesPendientes: 4,
      aguinaldoPendiente: 0,
      primaVacacionalPct: 25,
      incluirPrimaAntiguedad: true,
      incluirIndem90Dias: true,
      incluir20DiasAnio: false,
    },
    expected: (envelope) => {
      expect(envelope.result.total).toBe(132038.65);
      expect(envelope.result.details.importeAguinaldo).toBe(9369.86);
    },
  },
  {
    tool: 'calc_resico',
    input: {
      tipoPersona: 'fisica',
      ingresosCobrados: 50000,
      ingresosAcumuladosPrevios: 0,
      retencionISR: 500,
      ivaCobrado: 8000,
      ivaAcreditable: 3000,
      mes: 3,
    },
    expected: (envelope) => {
      expect(envelope.result.details.tipoPersona).toBe('fisica');
      expect(envelope.result.details.isrCausado).toBe(550);
      expect(envelope.result.total).toBe(5050);
    },
  },
  {
    tool: 'calc_modalidad40',
    input: {
      ultimoSbc: 600,
      sbcDeseado: 2932.75,
      semanasPrevias: 1250,
      mesesAportacion: 24,
      edadJubilacion: 65,
      asignacionFamiliar: true,
    },
    expected: (envelope) => {
      const details = envelope.result.details as {
        limites: { sbcEfectivo: number };
        inversion: { inversionTotal: number; cuotaMensual: number };
        pension: { pensionMensualEstimada: number };
      };
      expect(details.limites.sbcEfectivo).toBe(717.31);
      expect(details.inversion.cuotaMensual).toBe(3148.38);
      expect(details.inversion.inversionTotal).toBe(75561.12);
      expect(details.pension.pensionMensualEstimada).toBe(16783.17);
      expect(details).not.toHaveProperty('fechaCalculoIso');
    },
  },
  {
    tool: 'calc_recargos',
    input: {
      importeHistorico: 45000,
      fechaVencimiento: '2025-06-17',
      fechaPago: '2026-02-17',
    },
    expected: (envelope) => {
      expect(envelope.result.details.impuestoActualizado).toBe(46134);
      // Nueva lógica: tasa por año (Convention A). Mora jul 2025-feb 2026 = 6 meses 1.47% + 2 meses 2.07% = 12.96%
      // Antes (flat 2.07%): 8 * 2.07 = 16.56% -> 7639.79
      // Ahora: 46134 * 12.96% = 5978.97
      expect(envelope.result.details.montoRecargos).toBe(5978.97);
      expect(envelope.result.total).toBe(52112.97);
      expect(envelope.integrity.value).toMatch(/^REC-[0-9a-f]{8}$/);
    },
  },
  {
    tool: 'calc_retencion_clinicas',
    input: {
      estadoId: 'YUC',
      montoHonorarios: 10000,
      fechaPago: '2026-03-15',
    },
    expected: (envelope) => {
      expect(envelope.result.details.retencion2Pct).toBe(200);
      expect(envelope.result.total).toBe(9800);
      expect(envelope.result.details.impuestoEjercicioProfesional3Pct).toBe(300);
    },
  },
  {
    tool: 'get_fiscal_values',
    input: {},
    expected: (envelope) => {
      expect(envelope.result.total).toBe(CATALOGO_2026.length);
      expect(envelope.result.breakdown).toHaveLength(CATALOGO_2026.length);
      expect(envelope.catalog_versions).toHaveLength(CATALOGO_2026.length + 1);
      expect(envelope.catalog_versions[0]?.value).toBe(
        'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75'
      );
    },
  },
];

describe('MCP calculation envelope', () => {
  it.each(cases)('$tool publica el contrato completo con su vector dorado', async (testCase) => {
    const response = await executeAiTool(testCase.tool, testCase.input, mockEnv, 'tenant_test');
    expect(response.success).toBe(true);
    const envelope = response.data as Envelope;

    expect(envelope.tool).toBe(testCase.tool);
    expect(envelope.tool_version).toBe('1.0.0');
    expect(envelope.deterministic).toBe(true);
    expect(envelope.inputs_echo).toEqual(testCase.input);
    expect(envelope.result.breakdown.length).toBeGreaterThan(0);
    expect(
      envelope.result.breakdown.every((item) => item.label && typeof item.amount === 'number')
    ).toBe(true);
    expect(envelope.legal_basis.length).toBeGreaterThan(0);
    expect(
      envelope.legal_basis.every((item) => item.ordenamiento && item.articulo && item.vigencia)
    ).toBe(true);
    expect(envelope.catalog_versions.length).toBeGreaterThan(0);
    expect(
      envelope.catalog_versions.every((item) => item.key && item.effective_from && item.source)
    ).toBe(true);
    expect(envelope.integrity.kind).toBe('folio_referencia');
    expect(envelope.integrity.value).toBeTruthy();
    expect(Array.isArray(envelope.warnings)).toBe(true);
    testCase.expected(envelope);
  });

  it.each(cases)('$tool es determinista en tres llamadas', async (testCase) => {
    const responses = await Promise.all([
      executeAiTool(testCase.tool, testCase.input, mockEnv, 'tenant_test'),
      executeAiTool(testCase.tool, testCase.input, mockEnv, 'tenant_test'),
      executeAiTool(testCase.tool, testCase.input, mockEnv, 'tenant_test'),
    ]);
    expect(responses.map((item) => item.success)).toEqual([true, true, true]);
    expect(responses[1]?.data).toEqual(responses[0]?.data);
    expect(responses[2]?.data).toEqual(responses[0]?.data);
  });

  it('expone los nueve nombres canónicos en tools/list sin los aliases históricos', () => {
    const names = AI_TOOLS_CATALOG.map((tool) => tool.name);
    expect(names).toEqual(expect.arrayContaining(cases.map((testCase) => testCase.tool)));
    expect(names).not.toContain('calcular_nomina_rapida');
    expect(names).not.toContain('calcular_modalidad_40');
    expect(names).not.toContain('calcular_recargos_fiscales');
  });
});

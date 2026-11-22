import { describe, expect, it } from 'vitest';
import { AI_TOOLS_CATALOG } from './tools';

type Schema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

function byName(name: string): Schema {
  const tool = AI_TOOLS_CATALOG.find((t) => t.name === name);
  expect(tool).toBeDefined();
  return tool!.parameters as Schema;
}

function validate(schema: Schema, input: unknown): string[] {
  const errors: string[] = [];
  if (
    schema.type !== 'object' ||
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input)
  ) {
    errors.push('input must be an object');
    return errors;
  }
  const props = (schema.properties || {}) as Record<string, unknown>;
  const propKeys = Object.keys(props);
  const values = input as Record<string, unknown>;
  for (const req of schema.required || []) {
    if (!(req in values)) errors.push(`missing required: ${req}`);
  }
  if (schema.additionalProperties === false) {
    for (const k of Object.keys(values)) {
      if (!propKeys.includes(k)) errors.push(`extra property: ${k}`);
    }
  }
  for (const [k, v] of Object.entries(values)) {
    const pschema = props[k] as
      { type?: string; enum?: unknown[]; minimum?: number; maximum?: number } | undefined;
    if (!pschema) continue;
    if (pschema.type === 'number' && typeof v !== 'number') errors.push(`type: ${k}`);
    if (pschema.type === 'string' && typeof v !== 'string') errors.push(`type: ${k}`);
    if (pschema.type === 'boolean' && typeof v !== 'boolean') errors.push(`type: ${k}`);
    if (pschema.enum && !pschema.enum.includes(v)) errors.push(`enum: ${k}`);
    if (typeof v === 'number') {
      if (pschema.minimum !== undefined && v < pschema.minimum) errors.push(`minimum: ${k}`);
      if (pschema.maximum !== undefined && v > pschema.maximum) errors.push(`maximum: ${k}`);
    }
  }
  return errors;
}

const LEGAL_REFERENCES = ['Ley', 'Código', 'LISR', 'LSS', 'LFT', 'CFF', 'LGHY', 'DOF'];
const REQUIRED_DESCRIPTION_TOKENS = ['MXN', 'Úsalo', 'No lo uses', 'NO es un dictamen'];

function hasLegalReference(description: string): boolean {
  return LEGAL_REFERENCES.some((token) => description.includes(token));
}

const TOOLS: Array<{
  name: string;
  missing?: Record<string, unknown>;
  badRange?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}> = [
  {
    name: 'calc_isn',
    missing: {},
    badRange: { baseGravable: 250000, tasa: 3.75, ejercicio: 2027 },
    extra: { baseGravable: 250000, tasa: 3.75, campoExtra: 'x' },
  },
  {
    name: 'calc_sbc',
    missing: {},
    badRange: { salarioDiario: 200, zona: 'invalida' },
    extra: { salarioDiario: 200, campoExtra: 1 },
  },
  {
    name: 'calc_nomina',
    missing: { periodo: 'mensual' },
    badRange: { periodo: 'mensual', sueldoBruto: 18000, diasPeriodo: 0 },
    extra: { periodo: 'mensual', sueldoBruto: 18000, campoExtra: 1 },
  },
  {
    name: 'calc_finiquito',
    missing: {
      tipoBaja: 'finiquito',
      fechaIngreso: '2022-03-01',
      fechaBaja: '2026-10-31',
      sdi: 789.15,
    },
    badRange: {
      tipoBaja: 'finiquito',
      fechaIngreso: '2022-03-01',
      fechaBaja: '2026-10-31',
      salarioDiario: 750,
      sdi: 789.15,
      primaVacacionalPct: 150,
    },
    extra: {
      tipoBaja: 'finiquito',
      fechaIngreso: '2022-03-01',
      fechaBaja: '2026-10-31',
      salarioDiario: 750,
      sdi: 789.15,
      campoExtra: 1,
    },
  },
  {
    name: 'calc_resico',
    missing: { tipoPersona: 'fisica' },
    badRange: { tipoPersona: 'fisica', ingresosCobrados: 50000, mes: 13 },
    extra: { tipoPersona: 'fisica', ingresosCobrados: 50000, campoExtra: 1 },
  },
  {
    name: 'calc_modalidad40',
    missing: {
      sbcDeseado: 2932.75,
      semanasPrevias: 1250,
      mesesAportacion: 24,
      edadJubilacion: 65,
      asignacionFamiliar: true,
    },
    badRange: {
      ultimoSbc: 600,
      sbcDeseado: 2932.75,
      semanasPrevias: 1250,
      mesesAportacion: 5,
      edadJubilacion: 65,
      asignacionFamiliar: true,
    },
    extra: {
      ultimoSbc: 600,
      sbcDeseado: 2932.75,
      semanasPrevias: 1250,
      mesesAportacion: 24,
      edadJubilacion: 65,
      asignacionFamiliar: true,
      campoExtra: 1,
    },
  },
  {
    name: 'calc_recargos',
    missing: { fechaVencimiento: '2025-06-17', fechaPago: '2026-02-17' },
    badRange: { importeHistorico: -100, fechaVencimiento: '2025-06-17', fechaPago: '2026-02-17' },
    extra: {
      importeHistorico: 45000,
      fechaVencimiento: '2025-06-17',
      fechaPago: '2026-02-17',
      campoExtra: 1,
    },
  },
  {
    name: 'calc_retencion_clinicas',
    missing: { estadoId: 'YUC', fechaPago: '2026-03-15' },
    badRange: { estadoId: 'CDMX', montoHonorarios: 10000, fechaPago: '2026-03-15' },
    extra: { estadoId: 'YUC', montoHonorarios: 10000, fechaPago: '2026-03-15', campoExtra: 1 },
  },
  {
    name: 'get_fiscal_values',
    missing: undefined,
    badRange: undefined,
    extra: { campoExtra: 1 },
  },
];

describe('MCP tool descriptions and schemas (nine calculation tools)', () => {
  it.each(TOOLS.map((t) => t.name))('exposes %s in AI_TOOLS_CATALOG', (name) => {
    expect(AI_TOOLS_CATALOG.map((t) => t.name)).toContain(name);
  });

  it.each(TOOLS)('%s description contains all required elements', ({ name }) => {
    const tool = AI_TOOLS_CATALOG.find((t) => t.name === name)!;
    expect(tool.description.length).toBeGreaterThan(80);
    for (const token of REQUIRED_DESCRIPTION_TOKENS) {
      expect(tool.description).toContain(token);
    }
    expect(hasLegalReference(tool.description)).toBe(true);
  });

  it.each(TOOLS)('%s is annotated readOnly and idempotent', ({ name }) => {
    const tool = AI_TOOLS_CATALOG.find((t) => t.name === name)!;
    expect(tool.annotations).toEqual({
      readOnly: true,
      idempotent: true,
      destructive: false,
      openWorld: false,
    });
  });

  it.each(TOOLS)('%s declares a strict object schema', ({ name }) => {
    const schema = byName(name);
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(Array.isArray(schema.required)).toBe(true);
    // every required key must exist in properties
    for (const req of schema.required ?? []) {
      expect(Object.keys(schema.properties)).toContain(req);
    }
  });

  it('get_fiscal_values takes no arguments', () => {
    const schema = byName('get_fiscal_values');
    expect(schema.properties).toEqual({});
    expect(schema.required).toEqual([]);
  });
  it.each(TOOLS.filter((t) => t.missing !== undefined))(
    '%s schema rejects missing required field',
    ({ name, missing }) => {
      const schema = byName(name);
      const errors = validate(schema, missing!);
      expect(errors.some((e) => e.startsWith('missing required:'))).toBe(true);
    }
  );

  it.each(TOOLS.filter((t) => t.badRange !== undefined))(
    '%s schema rejects out-of-range value',
    ({ name, badRange }) => {
      const schema = byName(name);
      const errors = validate(schema, badRange!);
      expect(errors.length).toBeGreaterThan(0);
    }
  );

  it.each(TOOLS)('%s schema rejects extra property', ({ name, extra }) => {
    const schema = byName(name);
    const errors = validate(schema, extra!);
    expect(errors.some((e) => e.startsWith('extra property:'))).toBe(true);
  });
});

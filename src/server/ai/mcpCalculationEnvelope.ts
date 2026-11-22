import { CATALOGO_2026, TABLA_INPC, TASA_IVA_GENERAL } from '../../data/valores-vigentes/catalogo';
import type { ValorFiscal } from '../../data/valores-vigentes/tipos';
import { ESTADOS } from '../../tools/isn/data/estados';
import type { ResultadoISN } from '../../tools/isn/types';
import type { ResultadoSBC } from '../../tools/sbc/types';
import type { ResultadoNomina } from '../../tools/nomina/types';
import type { ResultadoFiniquito } from '../../tools/finiquitos/types';
import type { ResultadoResico } from '../../tools/resico/types';
import type { ResultadoRecargos } from '../../tools/recargos/types';
import type { ResultadoModalidad40 } from '../../tools/modalidad40/types';
import type { RetencionClinicasResultado } from '../../tools/retencion-clinicas/types';
import { RECARGOS_YUCATAN_2026 } from '../../tools/recargos/data/constantes';
import {
  TASA_IMPUESTO_EJERCICIO_PROFESIONAL_PCT,
  TASA_RETENCION_CLINICAS_PCT,
} from '../../tools/retencion-clinicas/data/constantes';
import {
  TARIFA_RESICO_PF_MENSUAL,
  TASA_ISR_RESICO_PM,
  TASA_RETENCION_PM_RESICO,
  TOPE_ANUAL_RESICO_PF,
  TOPE_ANUAL_RESICO_PM,
} from '../../tools/resico/data/tablasResico';

export const MCP_TOOL_VERSION = '1.0.0';
export const FISCAL_CATALOG_VERSION = 'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75';

export interface McpBreakdownItem {
  label: string;
  amount: number;
  value?: unknown;
}

export interface McpLegalBasis {
  ordenamiento: string;
  articulo: string;
  vigencia: string;
}

export interface McpCatalogVersion {
  key: string;
  value: unknown;
  effective_from: string;
  source: string;
}

export interface McpCalculationEnvelope<TDetails> {
  tool: string;
  tool_version: string;
  deterministic: true;
  inputs_echo: Record<string, unknown>;
  result: {
    total: number;
    breakdown: McpBreakdownItem[];
    details: TDetails;
  };
  legal_basis: McpLegalBasis[];
  catalog_versions: McpCatalogVersion[];
  integrity: {
    kind: 'folio_referencia';
    value: string;
    verify_url: null;
  };
  warnings: string[];
}

interface EnvelopeOptions<TDetails> {
  tool: string;
  inputs: Record<string, unknown>;
  details: TDetails;
  total: number;
  breakdown: McpBreakdownItem[];
  legalBasis: McpLegalBasis[];
  catalogVersions: McpCatalogVersion[];
  warnings?: string[];
  folio?: string;
}

const VIGENCIA_2026 = '2026-01-01';
const SOURCE_RESICO = 'LISR 2026; tabla documentada en src/tools/resico/data/tablasResico.ts';
const SOURCE_RETENCION =
  'Ley General de Hacienda del Estado de Yucatán; D.O. 26-dic-2025; constantes documentadas de la herramienta';
const CATALOG_VERSION_ENTRY: McpCatalogVersion = {
  key: 'CATALOG_VERSION',
  value: FISCAL_CATALOG_VERSION,
  effective_from: VIGENCIA_2026,
  source: 'src/data/valores-vigentes/catalogo.ts',
};

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(',')}}`;
}

function createReferenceFolio(
  tool: string,
  inputs: Record<string, unknown>,
  total: number
): string {
  const payload = stableSerialize({ tool, inputs, total });
  let hash = 2166136261;
  for (const character of payload) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `REF-${tool.toUpperCase()}-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function createEnvelope<TDetails>(
  options: EnvelopeOptions<TDetails>
): McpCalculationEnvelope<TDetails> {
  return {
    tool: options.tool,
    tool_version: MCP_TOOL_VERSION,
    deterministic: true,
    inputs_echo: options.inputs,
    result: {
      total: options.total,
      breakdown: options.breakdown,
      details: options.details,
    },
    legal_basis: options.legalBasis,
    catalog_versions: options.catalogVersions,
    integrity: {
      kind: 'folio_referencia',
      value: options.folio ?? createReferenceFolio(options.tool, options.inputs, options.total),
      verify_url: null,
    },
    warnings: options.warnings ?? [],
  };
}

function catalogVersion(id: string): McpCatalogVersion {
  const item = CATALOGO_2026.find((value) => value.id === id);
  if (!item) {
    throw new Error(`Valor no encontrado en catálogo: ${id}`);
  }
  return fiscalValueVersion(item);
}

function fiscalValueVersion(item: ValorFiscal): McpCatalogVersion {
  return {
    key: item.id,
    value: item.valor,
    effective_from: item.vigencia.inicio,
    source: item.fuente.urlDOF,
  };
}

function catalogVersions(ids: string[]): McpCatalogVersion[] {
  return [CATALOG_VERSION_ENTRY, ...ids.map(catalogVersion)];
}

function customVersion(
  key: string,
  value: unknown,
  source: string,
  effectiveFrom = VIGENCIA_2026
): McpCatalogVersion {
  return { key, value, effective_from: effectiveFrom, source };
}

function isnCatalogVersions(
  estadoId: string,
  ejercicio: number,
  regimen: ResultadoISN['regimen']
): McpCatalogVersion[] {
  if (estadoId !== 'YUC') return [CATALOG_VERSION_ENTRY];
  if (ejercicio === 2025) return catalogVersions(['ISN_YUC_2025_GENERAL']);
  if (regimen === 'micro_pequena') {
    return catalogVersions([
      'ISN_YUC_2026_MICROPEQUENA_BRUTA',
      'ISN_YUC_2026_MICROPEQUENA_ESTIMULO',
      'ISN_YUC_2026_MICROPEQUENA_NETA',
    ]);
  }
  return catalogVersions([
    regimen === 'gobierno_estatal' ? 'ISN_YUC_2026_GOBIERNO_ESTATAL' : 'ISN_YUC_2026_GENERAL',
  ]);
}

function isnLegalBasis(estadoId: string, articulo: string): McpLegalBasis[] {
  const estado = ESTADOS.find((item) => item.id === estadoId);
  return [
    {
      ordenamiento:
        estadoId === 'YUC' ? 'Ley General de Hacienda del Estado de Yucatán' : 'Ley de Hacienda',
      articulo: articulo || estado?.articulo || 'Impuesto sobre nómina',
      vigencia: String(estado?.vigencia ?? VIGENCIA_2026),
    },
  ];
}

export function wrapCalcIsn(
  inputs: Record<string, unknown>,
  estadoId: string,
  result: ResultadoISN
): McpCalculationEnvelope<ResultadoISN> {
  return createEnvelope({
    tool: 'calc_isn',
    inputs,
    details: result,
    total: result.isnNeto,
    breakdown: [
      { label: 'Base gravable', amount: result.baseGravable },
      { label: 'ISN bruto', amount: result.isnBruto },
      { label: 'Estímulo', amount: -result.estimulo },
      { label: 'ISN neto', amount: result.isnNeto },
    ],
    legalBasis: isnLegalBasis(estadoId, result.articuloAplicado),
    catalogVersions: isnCatalogVersions(estadoId, result.ejercicio, result.regimen),
  });
}

export function wrapCalcSbc(
  inputs: Record<string, unknown>,
  result: ResultadoSBC
): McpCalculationEnvelope<ResultadoSBC> {
  const minimumKey =
    result.zona === 'frontera' ? 'SALARIO_MINIMO_FRONTERA_2026' : 'SALARIO_MINIMO_GENERAL_2026';
  return createEnvelope({
    tool: 'calc_sbc',
    inputs,
    details: result,
    total: result.sbcFinal,
    breakdown: [
      { label: 'Salario diario', amount: Number(inputs.salarioDiario) || 0 },
      { label: 'SBC bruto', amount: result.sbcBruto },
      { label: 'Salario mínimo aplicable', amount: result.salarioMinimoAplicado },
      { label: 'SBC final', amount: result.sbcFinal },
    ],
    legalBasis: [
      { ordenamiento: 'Ley del Seguro Social', articulo: 'Artículos 27 y 28', vigencia: '2026' },
      {
        ordenamiento: 'Ley Federal del Trabajo',
        articulo: 'Artículos 76, 80 y 87',
        vigencia: '2026',
      },
    ],
    catalogVersions: catalogVersions([minimumKey, 'TOPE_SBC_25_UMA_2026']),
  });
}

export function wrapCalcNomina(
  inputs: Record<string, unknown>,
  result: ResultadoNomina,
  sbcDiarioEfectivo: number,
  sbcDiarioFuente: 'proporcionado' | 'default'
): McpCalculationEnvelope<
  ResultadoNomina & {
    sbcDiarioEfectivo: number;
    sbcDiarioFuente: 'proporcionado' | 'default';
  }
> {
  return createEnvelope({
    tool: 'calc_nomina',
    inputs,
    details: { ...result, sbcDiarioEfectivo, sbcDiarioFuente },
    total: result.neto,
    breakdown: [
      { label: 'Sueldo bruto', amount: result.sueldoBruto },
      { label: 'ISR', amount: -result.isr.isrFinal },
      { label: 'IMSS obrero', amount: -result.imss.total },
      { label: 'Neto a pagar', amount: result.neto },
    ],
    legalBasis: [
      {
        ordenamiento: 'Ley del Impuesto sobre la Renta',
        articulo: 'Artículos 96 y 152',
        vigencia: '2026',
      },
      {
        ordenamiento: 'Reglas Misceláneas Fiscales 2026',
        articulo: 'Regla 3.12.2; Anexo 8',
        vigencia: '2026',
      },
      {
        ordenamiento: 'Ley del Seguro Social',
        articulo: 'Artículos 25, 147, 168 y 211',
        vigencia: '2026',
      },
    ],
    catalogVersions: catalogVersions(['UMA_DIARIA_2026', 'TARIFA_ISR_MENSUAL_2026']),
  });
}

export function wrapCalcFiniquito(
  inputs: Record<string, unknown>,
  result: ResultadoFiniquito
): McpCalculationEnvelope<ResultadoFiniquito> {
  return createEnvelope({
    tool: 'calc_finiquito',
    inputs,
    details: result,
    total: inputs.tipoBaja === 'liquidacion' ? result.totalLiquidacion : result.totalFiniquito,
    breakdown: result.desglose.map((item) => ({
      label: item.concepto,
      amount: item.importe,
    })),
    legalBasis: [
      {
        ordenamiento: 'Ley Federal del Trabajo',
        articulo: 'Artículos 48 y 50',
        vigencia: 'Vigente 2026',
      },
      {
        ordenamiento: 'Ley Federal del Trabajo',
        articulo: 'Artículos 76 y 79',
        vigencia: 'Vigente 2026',
      },
      {
        ordenamiento: 'Ley Federal del Trabajo',
        articulo: 'Artículo 80',
        vigencia: 'Vigente 2026',
      },
      {
        ordenamiento: 'Ley Federal del Trabajo',
        articulo: 'Artículo 87',
        vigencia: 'Vigente 2026',
      },
      {
        ordenamiento: 'Ley Federal del Trabajo',
        articulo: 'Artículos 162 y 486',
        vigencia: 'Vigente 2026',
      },
    ],
    catalogVersions: catalogVersions(['SALARIO_MINIMO_GENERAL_2026']),
    warnings: result.advertencias,
  });
}

export function wrapCalcResico(
  inputs: Record<string, unknown>,
  result: ResultadoResico
): McpCalculationEnvelope<ResultadoResico> {
  const isPhysical = result.tipoPersona === 'fisica';
  const specificVersions = isPhysical
    ? [
        customVersion('RESICO_PF_TARIFA_MENSUAL_2026', TARIFA_RESICO_PF_MENSUAL, SOURCE_RESICO),
        customVersion('RESICO_PF_TOPE_ANUAL_2026', TOPE_ANUAL_RESICO_PF, SOURCE_RESICO),
        customVersion('RESICO_PF_RETENCION_PM_2026', TASA_RETENCION_PM_RESICO, SOURCE_RESICO),
      ]
    : [
        customVersion('RESICO_PM_TASA_ISR_2026', TASA_ISR_RESICO_PM, SOURCE_RESICO),
        customVersion('RESICO_PM_TOPE_ANUAL_2026', TOPE_ANUAL_RESICO_PM, SOURCE_RESICO),
      ];

  return createEnvelope({
    tool: 'calc_resico',
    inputs,
    details: result,
    total: result.totalImpuestosPagar,
    breakdown: result.desglose.map((item) => ({
      label: item.concepto,
      amount: item.importe,
    })),
    legalBasis: [
      {
        ordenamiento: 'Ley del Impuesto sobre la Renta',
        articulo: isPhysical ? 'Artículos 113-E y 113-J' : 'Artículos 206 al 215',
        vigencia: '2026',
      },
      {
        ordenamiento: 'Ley del Impuesto al Valor Agregado',
        articulo: 'Artículos 1, 1-A y 5',
        vigencia: '2026',
      },
    ],
    catalogVersions: [
      CATALOG_VERSION_ENTRY,
      customVersion(
        'TASA_IVA_GENERAL',
        TASA_IVA_GENERAL,
        'Ley del Impuesto al Valor Agregado, Artículo 1'
      ),
      ...specificVersions,
    ],
    warnings: result.advertencias,
  });
}

export function wrapCalcModalidad40(
  inputs: Record<string, unknown>,
  result: ResultadoModalidad40
): McpCalculationEnvelope<Omit<ResultadoModalidad40, 'fechaCalculoIso' | 'selloSha256'>> {
  const { fechaCalculoIso: _fechaCalculoIso, selloSha256, ...details } = result;
  return createEnvelope({
    tool: 'calc_modalidad40',
    inputs,
    details,
    total: result.inversion.inversionTotal,
    breakdown: [
      { label: 'Cuota mensual estimada', amount: result.inversion.cuotaMensual },
      { label: 'Inversión anual estimada', amount: result.inversion.cuotaAnual },
      { label: 'Inversión total', amount: result.inversion.inversionTotal },
      { label: 'Pensión mensual estimada', amount: result.pension.pensionMensualEstimada },
      { label: 'Incremento mensual de pensión', amount: result.roi.incrementoMensualPension },
    ],
    legalBasis: [
      {
        ordenamiento: 'Ley del Seguro Social de 1973',
        articulo: 'Artículos 164, 167 y 171',
        vigencia: 'Vigente 2026 para derechos transitorios',
      },
      {
        ordenamiento: 'Ley del Seguro Social vigente',
        articulo: 'Artículos 28, 168 y 218',
        vigencia: '2026',
      },
      {
        ordenamiento: 'Acuerdo ACDO.AS2.HCT.101026/302.P.DG',
        articulo: 'Punto Cuarto',
        vigencia: 'Desde 2026-10-22; medida temporal',
      },
    ],
    catalogVersions: catalogVersions([
      'UMA_DIARIA_2026',
      'SALARIO_MINIMO_GENERAL_2026',
      'TOPE_SBC_25_UMA_2026',
      'CUOTA_MODALIDAD_40_2026',
    ]),
    warnings: result.advertencias,
    folio: `REF-M40-${selloSha256.slice(0, 16)}`,
  });
}

export function wrapCalcRecargos(
  inputs: Record<string, unknown>,
  result: ResultadoRecargos
): McpCalculationEnvelope<ResultadoRecargos> {
  const versions =
    result.tipoRecargo === 'estatal_yucatan'
      ? [
          CATALOG_VERSION_ENTRY,
          customVersion(
            'TASA_RECARGOS_MORA_YUCATAN_2026',
            RECARGOS_YUCATAN_2026.tasaMensualPct,
            RECARGOS_YUCATAN_2026.fuente.url
          ),
        ]
      : catalogVersions(['TASA_RECARGOS_MORA_2026']);
  const inpcVersions = [
    {
      key: result.factorDetalle.claveInpcAntiguo,
      value: result.factorDetalle.inpcAntiguo,
    },
    {
      key: result.factorDetalle.claveInpcReciente,
      value: result.factorDetalle.inpcReciente,
    },
  ].map(({ key, value }) => {
    const [year, month] = key.split('-').map(Number);
    const entry = TABLA_INPC.find((item) => item.anio === year && item.mes === month);
    return customVersion(
      `INPC_${key}`,
      entry?.inpc ?? value,
      entry?.fechaPublicacionDOF
        ? `INEGI; publicación DOF ${entry.fechaPublicacionDOF}`
        : 'INEGI; último INPC oficial disponible en el catálogo',
      entry?.fechaPublicacionDOF ?? `${key}-01`
    );
  });

  return createEnvelope({
    tool: 'calc_recargos',
    inputs,
    details: result,
    total: result.totalPagar,
    breakdown: [
      { label: 'Importe histórico', amount: result.importeHistorico },
      { label: 'Actualización', amount: result.montoActualizacion },
      { label: 'Impuesto actualizado', amount: result.impuestoActualizado },
      { label: 'Recargos', amount: result.montoRecargos },
      { label: 'Total a pagar', amount: result.totalPagar },
    ],
    legalBasis: [
      {
        ordenamiento: 'Código Fiscal de la Federación',
        articulo: 'Artículos 17-A y 21',
        vigencia: 'Vigente 2026',
      },
      {
        ordenamiento:
          result.tipoRecargo === 'federal'
            ? 'Ley de Ingresos de la Federación'
            : 'Ley de Ingresos del Estado de Yucatán',
        articulo: result.tipoRecargo === 'federal' ? 'Artículo 8, fracción I' : 'Artículo 56',
        vigencia: '2026',
      },
    ],
    catalogVersions: [...versions, ...inpcVersions],
    warnings: result.advertencias,
    folio: result.folioDeIntegridad,
  });
}

export function wrapCalcRetencionClinicas(
  inputs: Record<string, unknown>,
  result: RetencionClinicasResultado
): McpCalculationEnvelope<RetencionClinicasResultado> {
  return createEnvelope({
    tool: 'calc_retencion_clinicas',
    inputs,
    details: result,
    total: result.netoPagar,
    breakdown: [
      { label: 'Honorarios médicos', amount: result.base },
      { label: 'Retención', amount: -result.retencion2Pct },
      { label: 'Neto a pagar', amount: result.netoPagar },
      {
        label: 'Impuesto profesional informativo',
        amount: result.impuestoEjercicioProfesional3Pct,
      },
    ],
    legalBasis: [
      {
        ordenamiento: 'Ley General de Hacienda del Estado de Yucatán',
        articulo: 'Artículos 20-Bis a 20-Quinquies',
        vigencia: 'Desde D.O. 26-dic-2025',
      },
      {
        ordenamiento: 'Acuerdo AAFY 12/2026',
        articulo: 'III.1.5',
        vigencia: '2026',
      },
    ],
    catalogVersions: [
      CATALOG_VERSION_ENTRY,
      customVersion(
        'TASA_RETENCION_CLINICAS_YUCATAN_2026',
        TASA_RETENCION_CLINICAS_PCT,
        SOURCE_RETENCION
      ),
      customVersion(
        'TASA_IMPUESTO_EJERCICIO_PROFESIONAL_YUCATAN_2026',
        TASA_IMPUESTO_EJERCICIO_PROFESIONAL_PCT,
        SOURCE_RETENCION
      ),
    ],
  });
}

export function getFiscalValuesEnvelope(
  inputs: Record<string, unknown>
): McpCalculationEnvelope<typeof CATALOGO_2026> {
  const legalBasis = CATALOGO_2026.map((item) => ({
    ordenamiento: item.fuente.publicacion,
    articulo: item.fuente.referencia,
    vigencia: item.vigencia.fin
      ? `${item.vigencia.inicio} a ${item.vigencia.fin}`
      : `Desde ${item.vigencia.inicio}`,
  }));

  return createEnvelope({
    tool: 'get_fiscal_values',
    inputs,
    details: CATALOGO_2026,
    total: CATALOGO_2026.length,
    breakdown: CATALOGO_2026.map((item) => ({
      label: item.nombre,
      amount: typeof item.valor === 'number' ? item.valor : 0,
      value: item.valor,
    })),
    legalBasis,
    catalogVersions: [CATALOG_VERSION_ENTRY, ...CATALOGO_2026.map(fiscalValueVersion)],
  });
}

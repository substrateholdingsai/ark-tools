/**
 * ============================================================================
 * ARK LEDGER — StayPuft Operator Internal Connector (v1, Total Access)
 * ============================================================================
 *
 * Proporciona acceso interno total (lectura y acción en modo preview/diagnóstico)
 * para el operador StayPuft / Marina sobre Ark Ledger v3.1.
 *
 * Reglas innegociables implementadas:
 * 1. Fail-closed: Sin `X-StayPuft-Key` válida o sin `LEDGER_STAYPUFT_API_KEY` -> 401.
 * 2. Multi-tenant estricto: Sin tenant válido -> 404. Acceso cruzado entre tenants -> 404.
 *    El tenant demo `tenant-demo-sandbox` permanece aislado (`is_demo: true`).
 * 3. Paginación estricta: `limit` por defecto 20, tope máximo 100 (`cap = 100`).
 *    Nunca se cargan todas las filas sin límite.
 * 4. Calculadoras en modo preview (`POST /api/internal/tools/:id/preview`):
 *    No sellan en Expediente Único, no guardan en D1, no timbran CFDI (ATEB/Alegra)
 *    y no emiten dictámenes oficiales. Citan siempre el fundamento legal vigente.
 * 5. Bitácora de auditoría inmutable (`staypuft_audit_log`):
 *    Registra `timestamp`, `operator: 'staypuft'`, `method`, `path`, `tenant`, `result`.
 *    Redacta automáticamente RFCs, correos y XML de CFDI (cero PII en logs).
 * 6. Approval Gate: Bloquea timbrado CFDI 4.0, sellado de Expediente Único,
 *    dictámenes oficiales, envío real de correos y llamadas/WhatsApp externos
 *    sin aprobación explícita de Pavel.
 */

import {
  CATALOGO_HERRAMIENTAS,
  TOTAL_HERRAMIENTAS,
  type HerramientaSuite,
} from '../../data/catalogo-herramientas';
import { CATALOGO_2026, TABLA_INPC, VALORES_POR_ID } from '../../data/valores-vigentes/catalogo';
import { ACTOS_IMSS, ACTOS_SAT, GUIA_PASOS, PLAZOS_CLAVE } from '../../data/actos';
import { CONDUCTAS_COBRANZA } from '../../data/conductas-cobranza';
import { COMPARADORES_CONTRATO_CRM } from '../../data/comparadores-contrato-crm';
import { AUTORIDADES_AV, CONDUCTAS_AV, UMBRALES_REPORTE_AV } from '../../data/conductas';
import { ESTADOS } from '../../tools/isn/data/estados';
import { calcularResultadoISN } from '../../tools/isn/lib/calcularISN';
import type { ConceptoPercepcion } from '../../tools/isn/types';
import { calcularResultadoSBC } from '../../tools/sbc/lib/calcularSBC';
import type { ParametrosSBC } from '../../tools/sbc/types';
import { calcularNomina } from '../../tools/nomina/lib/calcularNomina';
import type { ParametrosNomina } from '../../tools/nomina/types';
import { calcularFiniquito } from '../../tools/finiquitos';
import { calcularResicoPF, calcularResicoPM, type MesFiscal } from '../../tools/resico';
import { calcularRecargosYActualizacion } from '../../tools/recargos/lib/calcularRecargos';
import { simularModalidad40 } from '../../tools/modalidad40/lib/calcularModalidad40';
import { procesarCierreNomina } from '../../tools/cierre-nomina/lib/calcularCierreNomina';
import { analizarBalance, calcularTotales } from '../../tools/balance-general/lib/calcularBalance';
import type { JerarquiaBalance } from '../../tools/balance-general/types';
import { parsearCFDI } from '../../tools/xml-excel/lib/parserCFDI';
import { validarCFDI } from '../../tools/xml-validador/lib/validadorCFDI';
import { calcularComisionClip } from '../../tools/spei/lib/clipClient';
import {
  PARAMETROS_DEFAULT as LEASING_DEFAULT,
  calcularResumenLeasing,
  proyectarMeses,
} from '../../tools/leasing/lib/calcularLeasing';
import { calcularDictamenCobranza } from '../../tools/auditor-cobranza/lib/calcularDictamen';
import { ejecutarConciliacionAnexo24 } from '../../tools/anexo24/lib/motorConciliacion';
import {
  CATALOGO_ACTIVIDADES_VULNERABLES,
  evaluarOperacionesLFPIORPI,
} from '../../tools/monitor-lfpiorpi/lib/evaluadorActividadesVulnerables';
import type { FraccionLFPIORPI, OperacionCobranza } from '../../tools/monitor-lfpiorpi/types';
import {
  CRITERIOS_DEFAULT,
  evaluarCriteriosForense,
} from '../../tools/auditor-cfdi-atipico/lib/motorForense';
import { generarDatosDemostracion } from '../../tools/auditor-cfdi-atipico/lib/generadorDemo';
import type { CFDIExtraido } from '../../tools/auditor-cfdi-atipico/types';
import {
  calcularRetencionClinicas,
  MENSAJE_SOLO_YUCATAN,
} from '../../tools/retencion-clinicas/lib/calcularRetencionClinicas';
import { DEFAULT_MODEL, FAST_MODEL } from '../ai/agent';
import { timingSafeEqual } from '../canacoConektaService';
import { CURRENT_CATALOG_VERSION } from '../d1Api.expediente';
import type { Env } from '../../index';

// ============================================================================
// Constantes y Valores Fiscales Vigentes (desde Catálogo 2026)
// ============================================================================

export const STAYPUFT_HEADER = 'X-StayPuft-Key';
export const STAYPUFT_OPERATOR_ID = 'staypuft';
export const DEMO_TENANT_ID = 'tenant-demo-sandbox';
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const ARK_LEDGER_VERSION = '3.1';
export const STAYPUFT_AI_RATE_LIMIT_PER_HOUR = 20;
export const STAYPUFT_AI_MAX_PROMPT_CHARS = 2000;
export const STAYPUFT_AI_DEFAULT_MAX_TOOL_CALLS = 3;
export const STAYPUFT_AI_NEURONS_LOCATION_NOTE =
  'Cloudflare Workers AI returns per-call neuron consumption in response.usage.neurons during POST /api/internal/ai/ask (computed by the Workers AI runtime from prompt_tokens + completion_tokens weighted by model neuron rate, e.g. ~89.69 neurons on @cf/meta/llama-3.3-70b-instruct-fp8-fast), which is aggregated in GET /api/internal/metrics and GET /api/internal/status. Account-level historical neuron totals also live in the Cloudflare Dashboard (AI -> Workers AI -> Usage) and Cloudflare GraphQL Analytics API (viewer.accounts.aiInferenceAdaptiveGroups).';
export const CANONICAL_TEST_SUITE_SUMMARY = {
  baseline_tests: 578,
  baseline_suites: 82,
} as const;

function getNumericCatalogValue(id: string, fallback: number): number {
  const entry = VALORES_POR_ID.get(id);
  return typeof entry?.valor === 'number' ? entry.valor : fallback;
}

const UMA_DIARIA_2026 = getNumericCatalogValue('UMA_DIARIA_2026', 117.31);
const SMG_GENERAL_2026 = getNumericCatalogValue('SALARIO_MINIMO_GENERAL_2026', 315.04);
const SMG_FRONTERA_2026 = getNumericCatalogValue('SALARIO_MINIMO_FRONTERA_2026', 440.87);
const TASA_RECARGOS_MORA_2026 = getNumericCatalogValue('TASA_RECARGOS_MORA_2026', 1.47);
const YUCATAN_ISN_ESTADO = ESTADOS.find((e) => e.id === 'YUC');
if (!YUCATAN_ISN_ESTADO) {
  console.error('[staypuft] YUC missing from ESTADOS; failing back to 2026 general rate 3.75%');
}
const YUCATAN_ISN_TASA =
  YUCATAN_ISN_ESTADO?.tasasPorEjercicio?.[2026]?.general.tasaBruta ??
  YUCATAN_ISN_ESTADO?.tasa ??
  3.75; // TODO: fail closed if ESTADOS config is ever missing YUC

const KNOWN_SYSTEM_TENANTS: Record<
  string,
  { id: string; name: string; status: string; is_demo: boolean }
> = {
  ark: {
    id: 'ark',
    name: 'Ark Systems Master Tenant',
    status: 'active',
    is_demo: false,
  },
  canaco_merida: {
    id: 'canaco_merida',
    name: 'CANACO Servytur Mérida',
    status: 'active',
    is_demo: false,
  },
  [DEMO_TENANT_ID]: {
    id: DEMO_TENANT_ID,
    name: 'Ark Ledger Sandbox Demo (Aislado)',
    status: 'sandbox',
    is_demo: true,
  },
};

export interface StayPuftAuditEntry {
  id: string;
  timestamp: string;
  operator: 'staypuft';
  actor: 'staypuft';
  action: string;
  method: string;
  path: string;
  tenant_id: string | null;
  status_code: number;
  result: string;
  details: string | null;
}

export interface PaginationParams {
  limit: number;
  offset: number;
  cap: number;
  default_limit: number;
}

export interface TenantResolution {
  valid: boolean;
  tenantId: string | null;
  tenantName?: string;
  isDemo: boolean;
}

interface ToolInternalSpec {
  id: string;
  name: string;
  route: string;
  category: string;
  description: string;
  status: 'active' | 'preview_only';
  preview_supported: boolean;
  approval_gate_notes?: string;
  law_cited: string[];
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  sample_preview_payload: Record<string, unknown>;
}

// ============================================================================
// Memoria auxiliar para auditoría inmutable, rate-limit y telemetría de IA
// ============================================================================

const MAX_MEMORY_AUDIT_LOG = 500;
const memoryAuditLog: StayPuftAuditEntry[] = [];

const STAYPUFT_AI_RATE_WINDOW_MS = 60 * 60 * 1000;
const stayPuftAiRateLimitMap = new Map<string, number[]>();

interface TenantAiTelemetryState {
  calls: number;
  errors: number;
  durationTotalMs: number;
  toolCallsByTool: Record<string, number>;
  neuronsAvailable: boolean;
  neuronsTotal: number;
  neuronsByModel: Record<string, number>;
  tokensAvailable: boolean;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

const stayPuftAiTelemetryByTenant = new Map<string, TenantAiTelemetryState>();

function getOrCreateTenantAiTelemetry(tenantId: string): TenantAiTelemetryState {
  let state = stayPuftAiTelemetryByTenant.get(tenantId);
  if (!state) {
    state = {
      calls: 0,
      errors: 0,
      durationTotalMs: 0,
      toolCallsByTool: {},
      neuronsAvailable: false,
      neuronsTotal: 0,
      neuronsByModel: {},
      tokensAvailable: false,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    stayPuftAiTelemetryByTenant.set(tenantId, state);
  }
  return state;
}

export function resetStayPuftMemoryAuditForTests(): void {
  memoryAuditLog.length = 0;
  stayPuftAiRateLimitMap.clear();
  stayPuftAiTelemetryByTenant.clear();
}

export function getAiPeriodWindow(date: Date = new Date()): {
  period: string;
  start: string;
  end: string;
} {
  const year = date.getUTCFullYear();
  const monthIdx = date.getUTCMonth();
  const monthStr = String(monthIdx + 1).padStart(2, '0');
  const start = new Date(Date.UTC(year, monthIdx, 1, 0, 0, 0, 0)).toISOString();
  const end = new Date(Date.UTC(year, monthIdx + 1, 0, 23, 59, 59, 999)).toISOString();
  return {
    period: `${year}-${monthStr}`,
    start,
    end,
  };
}

// ============================================================================
// Sanitización anti-PII / anti-RFC / anti-CURP / anti-CFDI XML
// ============================================================================

const CURP_REGEX = /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/gi;
const RFC_REGEX = /\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b/gi;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const XML_REGEX = /<\?xml[\s\S]*?>|<\/?[a-zA-Z0-9_:-]+[^>]*>/g;

export function containsSensitivePii(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return (
    new RegExp(XML_REGEX.source, 'i').test(raw) ||
    new RegExp(CURP_REGEX.source, 'i').test(raw) ||
    new RegExp(RFC_REGEX.source, 'i').test(raw) ||
    new RegExp(EMAIL_REGEX.source, 'i').test(raw)
  );
}

export function sanitizeAuditText(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(XML_REGEX, '[CFDI_XML_REDACTED]')
    .replace(CURP_REGEX, '[CURP_REDACTED]')
    .replace(RFC_REGEX, '[RFC_REDACTED]')
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .slice(0, 500);
}

export function redactAiPromptForAudit(prompt: string): {
  redactedPrompt: string;
  piiRedacted: boolean;
} {
  const piiRedacted = containsSensitivePii(prompt);
  const sanitized = sanitizeAuditText(prompt).replace(/\s+/g, ' ').trim();
  const maxExcerptLen = piiRedacted ? 120 : 200;
  const excerpt =
    sanitized.length > maxExcerptLen ? `${sanitized.slice(0, maxExcerptLen)}...` : sanitized;
  return {
    redactedPrompt: excerpt,
    piiRedacted,
  };
}

export function sanitizeAuditPath(url: URL): string {
  const safeParams = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('rfc') ||
      lowerKey.includes('xml') ||
      lowerKey.includes('email') ||
      lowerKey.includes('token') ||
      lowerKey.includes('key') ||
      lowerKey.includes('secret')
    ) {
      safeParams.set(key, '[REDACTED]');
    } else {
      safeParams.set(key, sanitizeAuditText(value));
    }
  }
  const qs = safeParams.toString();
  return qs ? `${url.pathname}?${qs}` : url.pathname;
}

// ============================================================================
// Autenticación Fail-Closed de StayPuft
// ============================================================================

export function hasStayPuftHeader(request: Request): boolean {
  return request.headers.has(STAYPUFT_HEADER) || request.headers.has('x-staypuft-key');
}

export function verifyStayPuftKey(
  request: Request,
  env: Env
): { authorized: boolean; reason?: string } {
  const configuredKey = env.LEDGER_STAYPUFT_API_KEY;
  if (!configuredKey || configuredKey.trim().length === 0) {
    return { authorized: false, reason: 'LEDGER_STAYPUFT_API_KEY_NOT_CONFIGURED' };
  }

  const providedKey =
    request.headers.get(STAYPUFT_HEADER) ?? request.headers.get('x-staypuft-key') ?? '';
  if (!providedKey || providedKey.trim().length === 0) {
    return { authorized: false, reason: 'MISSING_STAYPUFT_KEY' };
  }

  try {
    const match = timingSafeEqual(providedKey, configuredKey);
    return match ? { authorized: true } : { authorized: false, reason: 'INVALID_STAYPUFT_KEY' };
  } catch {
    return { authorized: false, reason: 'INVALID_STAYPUFT_KEY' };
  }
}

// ============================================================================
// Bitácora Inmutable de Auditoría
// ============================================================================

function getD1(env: Env): D1Database | undefined {
  return env.ARK_TOOLS_DB ?? env.DB;
}

export async function logStayPuftAudit(
  env: Env,
  params: {
    action?: string;
    method: string;
    path: string;
    tenantId?: string | null;
    statusCode: number;
    result: string;
    details?: string | null;
  }
): Promise<StayPuftAuditEntry> {
  const safePath = sanitizeAuditText(params.path);
  const derivedAction =
    params.action ??
    (safePath.startsWith('/api/internal/ai/ask')
      ? 'ai_ask'
      : `${params.method.toUpperCase()} ${safePath}`);

  const entry: StayPuftAuditEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    operator: STAYPUFT_OPERATOR_ID,
    actor: STAYPUFT_OPERATOR_ID,
    action: sanitizeAuditText(derivedAction),
    method: params.method.toUpperCase(),
    path: safePath,
    tenant_id: params.tenantId ? sanitizeAuditText(params.tenantId) : null,
    status_code: params.statusCode,
    result: sanitizeAuditText(params.result),
    details: params.details ? sanitizeAuditText(params.details) : null,
  };

  memoryAuditLog.unshift(entry);
  if (memoryAuditLog.length > MAX_MEMORY_AUDIT_LOG) {
    memoryAuditLog.length = MAX_MEMORY_AUDIT_LOG;
  }

  const db = getD1(env);
  if (db) {
    try {
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS staypuft_audit_log (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          operator TEXT NOT NULL DEFAULT 'staypuft',
          method TEXT NOT NULL,
          path TEXT NOT NULL,
          tenant_id TEXT,
          status_code INTEGER NOT NULL,
          result TEXT NOT NULL,
          details TEXT
        )`
        )
        .run();

      await db
        .prepare(
          `INSERT INTO staypuft_audit_log
          (id, timestamp, operator, method, path, tenant_id, status_code, result, details)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        )
        .bind(
          entry.id,
          entry.timestamp,
          entry.operator,
          entry.method,
          entry.path,
          entry.tenant_id,
          entry.status_code,
          entry.result,
          entry.details
        )
        .run();
    } catch {
      // Si el mock de D1 en tests no implementa la tabla, permanece en memoryAuditLog
    }
  }

  return entry;
}

// ============================================================================
// Paginación Estricta (Default 20, Cap 100)
// ============================================================================

export function parsePagination(url: URL): PaginationParams {
  const rawLimit = url.searchParams.get('limit');
  const rawOffset = url.searchParams.get('offset');

  let limit = DEFAULT_PAGE_LIMIT;
  if (rawLimit !== null && rawLimit.trim() !== '') {
    const parsed = Number.parseInt(rawLimit, 10);
    if (!Number.isNaN(parsed)) {
      limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parsed));
    }
  }

  let offset = 0;
  if (rawOffset !== null && rawOffset.trim() !== '') {
    const parsed = Number.parseInt(rawOffset, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return {
    limit,
    offset,
    cap: MAX_PAGE_LIMIT,
    default_limit: DEFAULT_PAGE_LIMIT,
  };
}

// ============================================================================
// Validación Multi-Tenant y Aislamiento de Sandbox Demo
// ============================================================================

export function extractRequestedTenantId(request: Request, url: URL): string | null {
  const fromQuery =
    url.searchParams.get('tenantId')?.trim() ||
    url.searchParams.get('tenant_id')?.trim() ||
    url.searchParams.get('tenant')?.trim();
  if (fromQuery) return fromQuery;

  const fromHeader =
    request.headers.get('X-Tenant-ID')?.trim() || request.headers.get('x-tenant-id')?.trim();
  if (fromHeader) return fromHeader;

  return null;
}

export async function resolveTenantById(
  rawTenantId: string | null | undefined,
  env: Env
): Promise<TenantResolution> {
  const tenantId = rawTenantId?.trim() ?? '';
  if (!tenantId || !/^[a-zA-Z0-9_-]{2,64}$/.test(tenantId)) {
    return { valid: false, tenantId: null, isDemo: false };
  }

  const known = KNOWN_SYSTEM_TENANTS[tenantId];
  if (known) {
    return {
      valid: true,
      tenantId: known.id,
      tenantName: known.name,
      isDemo: known.is_demo,
    };
  }

  const db = getD1(env);
  if (db) {
    try {
      const row = await db
        .prepare(`SELECT id, name FROM tenants WHERE id = ?1 LIMIT 1`)
        .bind(tenantId)
        .first<{ id: string; name: string }>();

      if (row && row.id) {
        return {
          valid: true,
          tenantId: row.id,
          tenantName: row.name,
          isDemo: row.id === DEMO_TENANT_ID,
        };
      }
    } catch {
      // Fail-closed
    }
  }

  return { valid: false, tenantId, isDemo: false };
}

export async function resolveAndValidateTenant(
  request: Request,
  url: URL,
  env: Env
): Promise<TenantResolution> {
  const fromQuery =
    url.searchParams.get('tenantId')?.trim() ||
    url.searchParams.get('tenant_id')?.trim() ||
    url.searchParams.get('tenant')?.trim() ||
    null;
  const fromHeader =
    request.headers.get('X-Tenant-ID')?.trim() ||
    request.headers.get('x-tenant-id')?.trim() ||
    null;

  // Cross-tenant mismatch entre query y header se bloquea fail-closed (404)
  if (fromQuery && fromHeader && fromQuery !== fromHeader) {
    return { valid: false, tenantId: fromQuery, isDemo: false };
  }

  const tenantId = fromQuery ?? fromHeader;
  return resolveTenantById(tenantId, env);
}

// ============================================================================
// Approval Gate para Acciones Externas / Irreversibles
// ============================================================================

export interface ApprovalGateResult {
  allowed: boolean;
  reason?: string;
  actionType?: string;
}

export function checkStayPuftApprovalGate(request: Request, pathname: string): ApprovalGateResult {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { allowed: true };
  }

  if (
    (pathname === '/api/alegra/invoices' || pathname === '/api/facturapi/invoices') &&
    method === 'POST'
  ) {
    return {
      allowed: false,
      actionType: 'cfdi_timbrado',
      reason:
        'Approval Gate activo: El timbrado real de CFDI 4.0 (Facturapi / ATEB / Alegra) está bloqueado sin aprobación explícita de Pavel en chat.',
    };
  }

  if (
    (pathname.startsWith('/api/alegra/invoices/') ||
      pathname.startsWith('/api/facturapi/invoices/')) &&
    method === 'DELETE'
  ) {
    return {
      allowed: false,
      actionType: 'cfdi_cancelacion',
      reason:
        'Approval Gate activo: La cancelación de un CFDI 4.0 ante el SAT requiere aprobación explícita de Pavel en chat.',
    };
  }

  if (pathname === '/api/expedientes' && method === 'POST') {
    return {
      allowed: false,
      actionType: 'expediente_sealing',
      reason:
        'Approval Gate activo: El sellado inmutable en el Expediente Único requiere aprobación explícita de Pavel en chat. Usa POST /api/internal/tools/:id/preview para cálculos sin sellado.',
    };
  }

  if (/^\/api\/admin\/leads\/[^/]+\/send-email$/.test(pathname) && method === 'POST') {
    return {
      allowed: false,
      actionType: 'real_email_send',
      reason:
        'Approval Gate activo: El envío real de correos externos vía Resend requiere aprobación explícita de Pavel en chat.',
    };
  }

  if (pathname === '/api/canaco/buzon/admin/dictaminar' && method === 'POST') {
    return {
      allowed: false,
      actionType: 'official_dictamen',
      reason:
        'Approval Gate activo: La emisión de dictámenes oficiales en Buzón CANACO requiere aprobación explícita de Pavel en chat.',
    };
  }

  if (pathname === '/api/canaco/sync-arkangel' && method === 'POST') {
    return {
      allowed: false,
      actionType: 'external_voice_whatsapp_dispatch',
      reason:
        'Approval Gate activo: El disparo de llamadas de voz o WhatsApp hacia Ark Angel requiere aprobación explícita de Pavel en chat.',
    };
  }

  return { allowed: true };
}

// ============================================================================
// Especificaciones Vivas de las 20 Herramientas (derivadas de código y catálogos)
// ============================================================================

const SAMPLE_CFDI_XML =
  '<?xml version="1.0" encoding="UTF-8"?><cfdi:Comprobante Version="4.0" Serie="A" Folio="101" Fecha="2026-10-15T12:00:00" SubTotal="10000.00" Total="11600.00" Moneda="MXN" TipoDeComprobante="I" MetodoPago="PUE" FormaPago="03" LugarExpedicion="97000" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"><cfdi:Emisor Rfc="AAA010101AAA" Nombre="EMPRESA DEMO SA DE CV" RegimenFiscal="601"/><cfdi:Receptor Rfc="XAXX010101000" Nombre="PUBLICO EN GENERAL" UsoCFDI="S01" DomicilioFiscalReceptor="97000" RegimenFiscalReceptor="616"/><cfdi:Conceptos><cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="E48" Descripcion="Servicios contables" ValorUnitario="10000.00" Importe="10000.00" ObjetoImp="02"/></cfdi:Conceptos><cfdi:Impuestos TotalImpuestosTrasladados="1600.00"><cfdi:Traslados><cfdi:Traslado Base="10000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="1600.00"/></cfdi:Traslados></cfdi:Impuestos><cfdi:Complemento><tfd:TimbreFiscalDigital Version="1.1" UUID="11111111-2222-3333-4444-555555555555" FechaTimbrado="2026-10-15T12:01:00"/></cfdi:Complemento></cfdi:Comprobante>';

const TOOL_SPECS_MAP: Record<
  string,
  Omit<ToolInternalSpec, 'id' | 'name' | 'category' | 'description'>
> = {
  'cierre-nomina': {
    route: '/#cierre-nomina',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LISR Art. 96 y Art. 99 Fracc. III (Retenciones y expedición de CFDI de nómina)',
      'CFF Art. 28, Art. 29 y Art. 29-A (Contabilidad y conciliación de comprobantes de nómina)',
      'LSS Art. 15 Fracc. I y II, Art. 27 y Art. 28 (Determinación de SBC y cuotas IMSS)',
    ],
    inputs: {
      empresaNombre: 'string',
      periodoLabel: 'string',
      periodo: '"mensual" | "quincenal" | "semanal" | "diario"',
      diasPeriodo: 'number',
      estadoId: 'string (ej. "YUC")',
      trabajadores: 'TrabajadorFilaInput[]',
    },
    outputs: {
      trabajadores: 'ResultadoTrabajadorNomina[]',
      resumen: 'ResumenCierreNomina (totalPercepciones, totalISR, totalIMSS, totalISN, totalNeto)',
      hashBatch: 'string (SHA-256 en memoria, sin sellar en D1)',
    },
    sample_preview_payload: {
      empresaNombre: 'Despacho Demo Preview S.C.',
      periodoLabel: 'Octubre 2026',
      periodo: 'mensual',
      diasPeriodo: 30,
      estadoId: 'YUC',
    },
  },
  nomina: {
    route: '/#nomina',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LISR Art. 96 (Tarifa mensual de ISR 2026 — Anexo 8 RMF 2026)',
      'Decreto de Subsidio para el Empleo vigente 2026 (UMA 2026)',
      'LSS Arts. 25, 27, 28, 106, 107, 147 y 168 (Cuotas obreras IMSS)',
    ],
    inputs: {
      periodo: '"diario" | "semanal" | "quincenal" | "mensual"',
      sueldoBruto: 'number (MXN)',
      diasTrabajados: 'number',
      diasPeriodo: 'number',
      sbcDiario: 'number (MXN)',
    },
    outputs: {
      sueldoBruto: 'number',
      isr: 'ResultadoISR (isrTarifa, subsidio, isrFinal, tasaEfectiva)',
      imss: 'ResultadoIMSS (total y desglose por ramo)',
      sueldoNeto: 'number',
    },
    sample_preview_payload: {
      periodo: 'mensual',
      sueldoBruto: 18000,
      diasTrabajados: 30,
      diasPeriodo: 30,
      sbcDiario: 629.52,
    },
  },
  sbc: {
    route: '/#sbc',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LSS Art. 27 (Integración del Salario Base de Cotización)',
      'LSS Art. 28 (Límite superior de 25 UMAs e inferior de Salario Mínimo General)',
      'LFT Arts. 76, 80 y 87 (Vacaciones Dignas, Prima Vacacional 25% y Aguinaldo 15 días)',
      `INEGI UMA 2026 ($${UMA_DIARIA_2026.toFixed(2)} diarios) y CONASAMI SMG 2026 ($${SMG_GENERAL_2026.toFixed(2)} diarios)`,
    ],
    inputs: {
      salarioDiario: 'number (MXN)',
      diasVacaciones: 'number (default 12)',
      primaVacacional: 'number (default 25)',
      diasAguinaldo: 'number (default 15)',
    },
    outputs: {
      factor: 'number',
      sbcBruto: 'number',
      sbcFinal: 'number',
      topado: 'boolean',
      minimoAplicado: 'boolean',
      cuotaMensualEstimada: 'number',
    },
    sample_preview_payload: {
      salarioDiario: 650,
      diasVacaciones: 16,
      primaVacacional: 25,
      diasAguinaldo: 15,
    },
  },
  isn: {
    route: '/#isn',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'Leyes de Hacienda Estatales 2026 de las 32 Entidades Federativas (Impuesto Sobre Nóminas)',
      `Art. 21 al 27 LGHY, Art. 24 tasa ${YUCATAN_ISN_TASA.toFixed(2)}% (2026), Decreto 138/2025, Decreto 147/2025`,
    ],
    inputs: {
      estadoId: 'string (ej. "YUC", "CMX", "NL", "JAL")',
      baseGravable: 'number (MXN)',
      exento: 'number (MXN, opcional)',
    },
    outputs: {
      estado: 'Estado (id, nombre, tasa, vigencia, articulo)',
      baseGravable: 'number',
      totalExento: 'number',
      totalPercepciones: 'number',
      tasa: 'number',
      isn: 'number',
    },
    sample_preview_payload: {
      estadoId: 'YUC',
      baseGravable: 350000,
      exento: 25000,
    },
  },
  finiquitos: {
    route: '/#finiquitos',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LFT Arts. 47, 48 y 50 (Rescisión, indemnización constitucional de 90 días y 20 días por año)',
      'LFT Arts. 76, 79, 80, 87 y 162 (Vacaciones Dignas, prima vacacional, aguinaldo proporcional y prima de antigüedad topada a 2 SMG)',
      'CPEUM Art. 123 Apartado A Fracc. XXII',
    ],
    inputs: {
      tipoBaja: '"finiquito" | "liquidacion"',
      fechaIngreso: 'string (YYYY-MM-DD)',
      fechaBaja: 'string (YYYY-MM-DD)',
      salarioDiario: 'number (MXN)',
      sdi: 'number (MXN)',
      vacacionesPendientes: 'number',
      aguinaldoPendiente: 'number',
      primaVacacionalPct: 'number (default 25)',
      incluirPrimaAntiguedad: 'boolean',
      incluirIndem90Dias: 'boolean',
      incluir20DiasAnio: 'boolean',
    },
    outputs: {
      antiguedad: 'AntiguedadDetalle',
      partidas: 'PartidaFiniquito[]',
      totalFiniquito: 'number',
      totalIndemnizacion: 'number',
      granTotal: 'number',
    },
    sample_preview_payload: {
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
  },
  resico: {
    route: '/#resico',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LISR Arts. 113-E a 113-J (Régimen Simplificado de Confianza Personas Físicas — tope $3.5M anuales, tasas 1.00% a 2.50%, retención PM 1.25%)',
      'LISR Arts. 206 a 215 (Régimen Simplificado de Confianza Personas Morales — flujo de efectivo y tasa 30% Art. 9)',
      'LIVA Art. 1, Art. 1-A y Art. 5 (Determinación mensual de IVA e IVA acreditable)',
    ],
    inputs: {
      tipoPersona: '"fisica" | "moral"',
      ingresosCobrados: 'number (MXN)',
      deduccionesCobros: 'number (MXN, PM)',
      retencionISR: 'number (MXN)',
      ivaCobrado: 'number (MXN)',
      ivaAcreditable: 'number (MXN)',
      mes: 'number (1..12)',
    },
    outputs: {
      tasaAplicablePct: 'number',
      isrCausado: 'number',
      isrACargo: 'number',
      ivaACargo: 'number',
      totalImpuestosMes: 'number',
      alertas: 'AlertaFiscalResico[]',
    },
    sample_preview_payload: {
      tipoPersona: 'fisica',
      ingresosCobrados: 75000,
      retencionISR: 937.5,
      ivaCobrado: 12000,
      ivaAcreditable: 4500,
      mes: 10,
    },
  },
  'balance-general': {
    route: '/#balance-general',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'NIF A-3 y NIF B-6 (Estado de situación financiera, análisis horizontal y vertical)',
      'CFF Art. 28 Fracc. III y IV (Contabilidad electrónica y cuadre de ecuación patrimonial Activo = Pasivo + Capital)',
    ],
    inputs: {
      activoCorriente: 'CuentaBalance[]',
      activoNoCorriente: 'CuentaBalance[]',
      pasivoCorriente: 'CuentaBalance[]',
      pasivoNoCorriente: 'CuentaBalance[]',
      patrimonio: 'CuentaBalance[]',
    },
    outputs: {
      totales: 'TotalesBalance (totalActivo, totalPasivo, totalPatrimonio, diferencia, cuadrado)',
      analisis: 'ResultadoAnalisis (cuentas con variación horizontal y vertical)',
    },
    sample_preview_payload: {
      activoCorriente: [
        { id: '102', nombre: 'Bancos', montoActual: 600000, montoAnterior: 500000 },
      ],
      activoNoCorriente: [
        { id: '150', nombre: 'Equipo de Cómputo', montoActual: 400000, montoAnterior: 420000 },
      ],
      pasivoCorriente: [
        { id: '201', nombre: 'Proveedores', montoActual: 250000, montoAnterior: 220000 },
      ],
      pasivoNoCorriente: [
        { id: '250', nombre: 'Crédito Bancario LP', montoActual: 150000, montoAnterior: 200000 },
      ],
      patrimonio: [
        { id: '301', nombre: 'Capital Contable', montoActual: 600000, montoAnterior: 500000 },
      ],
    },
  },
  'xml-excel': {
    route: '/#xml-excel',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'CFF Art. 29 y Art. 29-A (Comprobantes Fiscales Digitales por Internet CFDI 3.3 y 4.0)',
      'Anexo 20 RMF 2026 (Extracción estructurada de impuestos, conceptos y Timbre Fiscal Digital)',
    ],
    inputs: {
      xmlContent: 'string (XML CFDI 4.0 o 3.3)',
      fileName: 'string (opcional)',
    },
    outputs: {
      version: 'string',
      uuid: 'string',
      tipoComprobante: 'string',
      subtotal: 'number',
      total: 'number',
      iva16: 'number',
    },
    sample_preview_payload: {
      fileName: 'cfdi-preview.xml',
      xmlContent: SAMPLE_CFDI_XML,
    },
  },
  validador: {
    route: '/#validador',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'CFF Art. 29-A (Requisitos fiscales de los CFDI 4.0)',
      'CFF Art. 69-B (Presunción de inexistencia de operaciones — EFOS / Listas Negras SAT)',
      'Anexo 20 RMF 2026 (Validación de 8 reglas técnicas, coherencia PUE/PPD y cuadratura aritmética)',
    ],
    inputs: {
      xmlContent: 'string (XML CFDI 4.0 / 3.3)',
      fileName: 'string (opcional)',
    },
    outputs: {
      estatusGeneral: '"aprobado" | "advertencia" | "rechazado"',
      score: 'number (0..100)',
      reglas: 'ReglaAuditoria[]',
      erroresCount: 'number',
      advertenciasCount: 'number',
    },
    sample_preview_payload: {
      fileName: 'cfdi-validacion-preview.xml',
      xmlContent: SAMPLE_CFDI_XML,
    },
  },
  timbrado: {
    route: '/#timbrado',
    status: 'preview_only',
    preview_supported: true,
    approval_gate_notes:
      'ATEB en proceso de integración (precios de distribuidor aún no cerrados por escrito). El conector ejecuta únicamente pre-validación matemática y fiscal en modo preview; jamás timbra ni llama a PAC externo.',
    law_cited: [
      'CFF Art. 29 y Art. 29-A (Obligación de expedir CFDI 4.0 y requisitos formales)',
      'LISR Art. 113-J y LIVA Art. 1-A (Retenciones de ISR 1.25% e IVA en RESICO / Personas Morales)',
      'Anexo 20 RMF 2026 (Reglas de redondeo, impuestos trasladados y retenidos)',
    ],
    inputs: {
      regimenEmisor: 'string (ej. "601", "626")',
      usoCfdi: 'string (ej. "G03")',
      metodoPago: '"PUE" | "PPD"',
      formaPago: 'string (ej. "03", "99")',
      conceptos:
        'Array<{ descripcion: string; cantidad: number; valorUnitario: number; tasaIva?: number; retencionIsr?: number; retencionIva?: number }>',
    },
    outputs: {
      prevalidacionOk: 'boolean',
      subtotal: 'number',
      ivaTrasladado: 'number',
      isrRetenido: 'number',
      ivaRetenido: 'number',
      total: 'number',
      observacionesFiscales: 'string[]',
      stamped: 'false (bloqueado por Approval Gate y política ATEB)',
    },
    sample_preview_payload: {
      regimenEmisor: '626',
      usoCfdi: 'G03',
      metodoPago: 'PUE',
      formaPago: '03',
      conceptos: [
        {
          descripcion: 'Servicios contables y asesoría fiscal mensual',
          cantidad: 1,
          valorUnitario: 15000,
          tasaIva: 0.16,
          retencionIsr: 0.0125,
          retencionIva: 0.106667,
        },
      ],
    },
  },
  spei: {
    route: '/#spei',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LISR Art. 27 Fracc. III (Bancarización mediante transferencia electrónica SPEI o tarjeta)',
      'LIVA Art. 1-B (Momento en que se consideran efectivamente cobradas las contraprestaciones)',
      'CFF Art. 29-A Fracc. VII (Forma de pago 03 Transferencia SPEI vs 04/28 Tarjeta)',
    ],
    inputs: {
      monto: 'number (MXN)',
      msiMeses: '0 | 3 | 6 | 9 | 12',
    },
    outputs: {
      montoCobrado: 'number',
      tasaBasePorcentaje: 'number',
      ivaComisionPorcentaje: 'number',
      tasaEfectivaPorcentaje: 'number',
      comisionTotal: 'number',
      netoRecibido: 'number',
    },
    sample_preview_payload: {
      monto: 11600,
      msiMeses: 0,
    },
  },
  leasing: {
    route: '/#leasing',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LISR Art. 27 y Art. 28 Fracc. XIII (Deducción de rentas y arrendamiento de equipo)',
      'NIF D-5 (Arrendamientos y proyección financiera de flujos recurrentes)',
    ],
    inputs: {
      clientesIniciales: 'number',
      clientesNuevosPorMes: 'number',
      tasaChurnPorcentaje: 'number',
      setupFee: 'number',
      rentaMensual: 'number',
      costoDirectoPorCliente: 'number',
      plazoMeses: 'number',
    },
    outputs: {
      resumen: 'ResumenLeasing (mrrFinal, arrFinal, utilidadNetaAcumulada, ltvEstimado)',
      mesesProyectados: 'number',
    },
    sample_preview_payload: { ...LEASING_DEFAULT },
  },
  'guia-sat-imss': {
    route: '/#guia-sat-imss',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'CFF Arts. 17-H Bis, 17-K, 38, 42, 46, 48, 53-B y 69-B (Buzón Tributario, CSD, facultades de comprobación y EFOS)',
      'LSS Arts. 15, 251 y 291 (Fiscalización IMSS y recurso de inconformidad)',
    ],
    inputs: {
      autoridad: '"SAT" | "IMSS" | "TODAS" (opcional)',
      query: 'string (opcional, filtro de acto fiscal)',
    },
    outputs: {
      totalPasosGuia: 'number',
      actosEncontrados: 'number',
      actos: 'ActoFiscal[]',
      plazosClave: 'PlazoClave[]',
      pasosProtocolo: 'Array<{ id, titulo, corto, fundamento }>',
    },
    sample_preview_payload: {
      autoridad: 'SAT',
      query: '69-B',
    },
  },
  'auditor-cobranza': {
    route: '/#auditor-cobranza',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'CFF Art. 28, Art. 29 y Art. 29-A (Integridad contable y coincidencia entre contratos, CRM y CFDI)',
      'LISR Art. 17 y Art. 27 (Momento de acumulación de ingresos y requisitos de las deducciones)',
      'LFPIORPI Art. 17 y Art. 32 (Restricción de uso de efectivo y trazabilidad de medios de pago)',
    ],
    inputs: {
      cliente: 'string (opcional)',
      respuestasComparadores:
        'Record<string, "COINCIDE" | "DIFIERE" | "PARCIAL" | "NO_VERIFICABLE" | "SIN_DATO">',
      conductasDetectadas: 'string[]',
    },
    outputs: {
      resumen: 'ResumenDictamen (hallazgos, observaciones, criticos, altos, score, nivel)',
      alcance: 'AlcanceDictamen',
      recomendaciones: 'string[]',
    },
    sample_preview_payload: {
      cliente: 'Comercializadora Demo (Preview)',
      respuestasComparadores: {
        'comp-1': 'COINCIDE',
        'comp-2': 'DIFIERE',
      },
      conductasDetectadas: ['C1'],
    },
  },
  'mapa-activos': {
    route: '/#mapa-activos',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LFPIORPI Art. 17 Fracc. XVI (Operaciones con Activos Virtuales como Actividad Vulnerable — umbral de aviso 645 UMAs)',
      'Ley para Regular las Instituciones de Tecnología Financiera (Ley Fintech Arts. 30 a 34 y Circular 4/2019 Banxico)',
      'CFF Art. 108 y CPF Art. 400 Bis (Riesgos fiscales y penales por operaciones con recursos de procedencia ilícita)',
    ],
    inputs: {
      marcoLegal: '"Ley Fintech" | "LFPIORPI" | "CPF" | "CFF" | "Iniciativa 2026" | "TODOS"',
      gravedad: '"MEDIA" | "ALTA" | "CRITICA" | "CRITICA_MAX" | "FUTURA" | "TODAS"',
      montoOperacionMxn: 'number (opcional)',
    },
    outputs: {
      umbralAviso645UmasMxn: 'number',
      requiereAvisoUif: 'boolean',
      conductasFiltradas: 'number',
      conductas: 'Array<{ id, conducta, marcoLegal, articulo, gravedad }>',
      autoridadesCompetentes: 'string[]',
    },
    sample_preview_payload: {
      marcoLegal: 'LFPIORPI',
      gravedad: 'TODAS',
      montoOperacionMxn: 95000,
    },
  },
  anexo24: {
    route: '/#anexo24',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'CFF Art. 28 Fracc. III y IV (Contabilidad en medios electrónicos y envío mensual)',
      'RMF 2026 Reglas 2.8.1.5 y 2.8.1.6 (Catálogo de cuentas con código agrupador SAT y Balanza de Comprobación)',
      'Anexo 24 RMF vigente (Partida doble Debe = Haber y descarte de CFDI cancelados)',
    ],
    inputs: {
      xmlContent: 'string (XML CFDI para conciliar contra códigos agrupadores Anexo 24)',
    },
    outputs: {
      resumen:
        'ResumenConciliacion (totalPolizasGeneradas, totalDebe, totalHaber, diferencia, cuadrado)',
      cuentasUtilizadas: 'CuentaUtilizada[]',
    },
    sample_preview_payload: {
      xmlContent: SAMPLE_CFDI_XML,
    },
  },
  'monitor-lfpiorpi': {
    route: '/#monitor-lfpiorpi',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LFPIORPI Art. 17 Fracciones I a XVI (Catálogo de Actividades Vulnerables e Identificación / Aviso UIF)',
      'LFPIORPI Art. 17 penúltimo párrafo y Reglamento Art. 7 (Regla de acumulación móvil de 6 meses)',
      'LFPIORPI Art. 23, Art. 24 y Art. 32 (Avisos día 17 y restricción de efectivo)',
    ],
    inputs: {
      fraccion:
        'FraccionLFPIORPI (ej. "FRACCION_XV", "FRACCION_V", "FRACCION_VIII", "FRACCION_XVI")',
      operaciones: 'OperacionCobranza[] (idCliente, fechaPago, montoCobrado, concepto, metodoPago)',
    },
    outputs: {
      resumen:
        'ResumenMonitorLFPIORPI (umbralIdentificacionMXN, umbralAvisoMXN, clientesRojo, clientesAmarillo, clientesVerde)',
      clientes: 'ResultadoCliente[]',
    },
    sample_preview_payload: {
      fraccion: 'FRACCION_XV',
      operaciones: [
        {
          idOperacion: 'OP-001',
          idCliente: 'CLIENTE-DEMO-01',
          fechaPago: '2026-08-15',
          montoCobrado: 210000,
          concepto: 'Renta mensual local comercial',
          metodoPago: 'SPEI',
        },
        {
          idOperacion: 'OP-002',
          idCliente: 'CLIENTE-DEMO-01',
          fechaPago: '2026-09-15',
          montoCobrado: 210000,
          concepto: 'Renta mensual local comercial',
          metodoPago: 'SPEI',
        },
      ],
    },
  },
  recargos: {
    route: '/#recargos',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'CFF Art. 17-A (Actualización de contribuciones mediante factor de INPC truncado a 4 decimales, sin deflación < 1.0000)',
      'CFF Art. 21 (Recargos por mora sobre contribuciones actualizadas, tope de 60 meses)',
      `LIF Art. 8 y RMF 2026 Regla 2.1.20 (Tasa de recargos por mora vigente: ${TASA_RECARGOS_MORA_2026}% mensual)`,
    ],
    inputs: {
      importeHistorico: 'number (MXN)',
      fechaVencimiento: 'string (YYYY-MM-DD)',
      fechaPago: 'string (YYYY-MM-DD)',
    },
    outputs: {
      factorActualizacion: 'number (4 decimales Art. 17-A CFF)',
      parteActualizada: 'number',
      importeActualizado: 'number',
      mesesRecargo: 'number',
      tasaRecargoAcumuladaPct: 'number',
      montoRecargos: 'number',
      totalPagar: 'number',
    },
    sample_preview_payload: {
      importeHistorico: 45000,
      fechaVencimiento: '2025-06-17',
      fechaPago: '2026-02-17',
    },
  },
  modalidad40: {
    route: '/#modalidad40',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LSS 1997 Arts. 218 a 221 (Continuación Voluntaria en el Régimen Obligatorio — Modalidad 40)',
      'Reforma LSS Art. 168 y Segundo Transitorio (Cuota progresiva Modalidad 40 2026: 14.438%)',
      'LSS 1973 Arts. 167 y 171 (Cuantía básica, incrementos anuales y factor de edad 60-65 años)',
    ],
    inputs: {
      ultimoSbc: 'number (MXN diario)',
      sbcDeseado: 'number (MXN diario, máx 25 UMAs)',
      semanasPrevias: 'number',
      mesesAportacion: 'number (12 a 60)',
      edadJubilacion: 'number (60 a 65)',
      asignacionFamiliar: 'boolean',
    },
    outputs: {
      pensionSinM40: 'number',
      pensionConM40: 'number',
      incrementoMensual: 'number',
      inversionTotalM40: 'number',
      mesesRecuperacion: 'number',
    },
    sample_preview_payload: {
      ultimoSbc: 600,
      sbcDeseado: 2932.75,
      semanasPrevias: 1250,
      mesesAportacion: 24,
      edadJubilacion: 65,
      asignacionFamiliar: true,
    },
  },
  'auditor-cfdi-atipico': {
    route: '/#auditor-cfdi-atipico',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'CFF Art. 29, Art. 29-A y Art. 69-B (Detección forense de operaciones atípicas, cancelaciones extemporáneas y EFOS)',
      'LISR Art. 27 Fracc. III (Límite de efectivo $2,000 MXN y detección de fraccionamiento)',
      'Ley de Benford, Z-Score e Índice Herfindahl-Hirschman (HHI) de concentración fiscal',
    ],
    inputs: {
      ejercicio: 'number (default 2026)',
      cfdis: 'CFDIExtraido[] (opcional; si se omite, evalúa lote sintético de diagnóstico)',
    },
    outputs: {
      totalEvaluados: 'number',
      totalHallazgos: 'number',
      hallazgos: 'HallazgoRiesgo[]',
      criteriosActivos: 'number',
    },
    sample_preview_payload: {
      ejercicio: 2026,
    },
  },
  'retencion-clinicas': {
    route: '/#retencion-clinicas',
    status: 'active',
    preview_supported: true,
    law_cited: [
      'LGHY Yucatán Arts. 16 al 20 (Impuesto sobre el Ejercicio Profesional 3%)',
      'LGHY Yucatán Arts. 20-Bis a 20-Quinquies (D.O. 26-dic-2025: Retención 2% clínicas, entero día 10, AAFY-30 y AAFY-31)',
      'Acuerdo AAFY XX/2026 (Prórroga enero 2026 al 20-feb-2026)',
    ],
    inputs: {
      estadoId: 'string (exclusivo "YUC")',
      montoHonorarios: 'number (MXN)',
      fechaPago: 'string (YYYY-MM-DD)',
    },
    outputs: {
      base: 'number',
      retencion2Pct: 'number',
      netoPagar: 'number',
      impuestoEjercicioProfesional3Pct: 'number',
      fechaLimiteEntero: 'string',
    },
    sample_preview_payload: {
      estadoId: 'YUC',
      montoHonorarios: 10000,
      fechaPago: '2026-03-15',
    },
  },
};

export function buildLiveToolCatalog(): ToolInternalSpec[] {
  return CATALOGO_HERRAMIENTAS.map((item: HerramientaSuite) => {
    const spec = TOOL_SPECS_MAP[item.id];
    return {
      id: item.id,
      name: item.nombre,
      category: item.categoria,
      description: item.descripcion,
      route: spec?.route ?? `/#${item.id}`,
      status: spec?.status ?? 'active',
      preview_supported: spec?.preview_supported ?? true,
      approval_gate_notes: spec?.approval_gate_notes,
      law_cited: spec?.law_cited ?? ['CFF Art. 28 y LISR vigente 2026'],
      inputs: spec?.inputs ?? {},
      outputs: spec?.outputs ?? {},
      sample_preview_payload: spec?.sample_preview_payload ?? {},
    };
  });
}

// ============================================================================
// Motor de Ejecución de Calculadoras en Modo Preview (Sin Sellar, Sin Timbrar)
// ============================================================================

export async function executeToolPreview(
  toolId: string,
  rawPayload: Record<string, unknown>
): Promise<{
  ok: boolean;
  statusCode: number;
  error?: string;
  data?: Record<string, unknown>;
}> {
  const catalogTool = CATALOGO_HERRAMIENTAS.find((t) => t.id === toolId);
  if (!catalogTool) {
    return {
      ok: false,
      statusCode: 404,
      error: `Herramienta '${toolId}' no existe en el catálogo canónico (${TOTAL_HERRAMIENTAS} herramientas).`,
    };
  }

  const spec = TOOL_SPECS_MAP[toolId];
  const payload =
    rawPayload && Object.keys(rawPayload).length > 0
      ? rawPayload
      : (spec?.sample_preview_payload ?? {});

  try {
    let resultOutput: unknown;

    switch (toolId) {
      case 'isn': {
        const rawEstado = String(payload.estadoId ?? payload.estado ?? 'YUC')
          .trim()
          .toUpperCase();
        const estadoObj =
          ESTADOS.find(
            (e) =>
              e.id.toUpperCase() === rawEstado ||
              e.nombre.toLowerCase() === rawEstado.toLowerCase() ||
              e.nombre
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toUpperCase() === rawEstado.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          ) ??
          (rawEstado === '31' ? ESTADOS.find((e) => e.id === 'YUC') : undefined) ??
          ESTADOS[0]!;
        const rawBase =
          payload.baseGravable ??
          payload.nominaBruta ??
          payload.nomina ??
          payload.monto ??
          payload.sueldos ??
          350000;
        const baseGravable =
          typeof rawBase === 'string'
            ? Number(rawBase.replace(/[$,\sMXNmxn]/g, ''))
            : Number(rawBase);
        const rawExento = payload.exento ?? 0;
        const exento =
          typeof rawExento === 'string'
            ? Number(rawExento.replace(/[$,\sMXNmxn]/g, ''))
            : Number(rawExento);
        if (Number.isNaN(baseGravable) || baseGravable < 0) {
          return {
            ok: false,
            statusCode: 400,
            error: 'baseGravable debe ser un número mayor o igual a 0.',
          };
        }
        const conceptos: ConceptoPercepcion[] = [
          {
            id: 1,
            concepto: 'Nómina gravada preview',
            gravado: baseGravable,
            exento: Number.isNaN(exento) ? 0 : exento,
          },
        ];
        const rawEjercicio = payload.ejercicio !== undefined ? Number(payload.ejercicio) : 2026;
        const ejercicio = rawEjercicio === 2025 ? 2025 : 2026;
        const numEmpleados =
          payload.numEmpleados !== undefined ? Number(payload.numEmpleados) : undefined;
        const esGobiernoEstatal = Boolean(payload.esGobiernoEstatal);
        const aplica27A = Boolean(payload.aplica27A);
        const esMicroPequena2026 =
          payload.esMicroPequena2026 !== undefined
            ? Boolean(payload.esMicroPequena2026)
            : numEmpleados !== undefined && numEmpleados >= 1 && numEmpleados <= 50;
        const calc = calcularResultadoISN(conceptos, estadoObj, {
          ejercicio,
          numEmpleados,
          esMicroPequena2026,
          esGobiernoEstatal,
          aplica27A,
        });
        resultOutput = {
          estado: estadoObj,
          ...calc,
        };
        break;
      }

      case 'sbc': {
        const parametros: ParametrosSBC = {
          salarioDiario: Number(payload.salarioDiario ?? 650),
          diasVacaciones: Number(payload.diasVacaciones ?? 16),
          primaVacacional: Number(
            payload.primaVacacional ?? payload.porcentajePrimaVacacional ?? 25
          ),
          diasAguinaldo: Number(payload.diasAguinaldo ?? 15),
        };
        resultOutput = calcularResultadoSBC(parametros);
        break;
      }

      case 'nomina': {
        const sueldoBruto = Number(payload.sueldoBruto ?? payload.sueldoMensual ?? 18000);
        const periodo =
          (payload.periodo as 'diario' | 'semanal' | 'quincenal' | 'mensual') ?? 'mensual';
        const diasPeriodo = Number(payload.diasPeriodo ?? 30);
        const diasTrabajados = Number(payload.diasTrabajados ?? diasPeriodo);
        const sbcDiario = Number(payload.sbcDiario ?? sueldoBruto / 30);
        const parametros: ParametrosNomina = {
          periodo,
          sueldoBruto,
          diasTrabajados,
          diasPeriodo,
          sbcDiario,
        };
        resultOutput = calcularNomina(parametros);
        break;
      }

      case 'finiquitos': {
        const tipoRaw = String(payload.tipoBaja ?? 'liquidacion');
        const tipoBaja: 'finiquito' | 'liquidacion' =
          tipoRaw === 'renuncia' || tipoRaw === 'finiquito' ? 'finiquito' : 'liquidacion';
        const salarioDiario = Number(
          payload.salarioDiario ??
            (payload.salarioMensual ? Number(payload.salarioMensual) / 30 : 750)
        );
        const sdi = Number(payload.sdi ?? salarioDiario * 1.0522);
        const resFin = calcularFiniquito({
          tipoBaja,
          fechaIngreso: String(payload.fechaIngreso ?? '2022-03-01'),
          fechaBaja: String(payload.fechaBaja ?? payload.fechaSalida ?? '2026-10-31'),
          salarioDiario,
          sdi,
          vacacionesPendientes: Number(
            payload.vacacionesPendientes ?? payload.diasVacacionesPendientes ?? 4
          ),
          aguinaldoPendiente: Number(payload.aguinaldoPendiente ?? 0),
          primaVacacionalPct: Number(payload.primaVacacionalPct ?? 25),
          incluirPrimaAntiguedad: Boolean(payload.incluirPrimaAntiguedad ?? true),
          incluirIndem90Dias: Boolean(payload.incluirIndem90Dias ?? tipoBaja === 'liquidacion'),
          incluir20DiasAnio: Boolean(payload.incluir20DiasAnio ?? false),
        });
        if (!resFin.ok) {
          return {
            ok: false,
            statusCode: 400,
            error: resFin.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(', '),
          };
        }
        resultOutput = resFin.valor;
        break;
      }

      case 'resico': {
        const tipoPersona = String(payload.tipoPersona ?? 'fisica').toLowerCase();
        const mes = (Math.min(12, Math.max(1, Number(payload.mes ?? 10))) || 10) as MesFiscal;
        if (tipoPersona === 'moral' || tipoPersona === 'pm') {
          resultOutput = calcularResicoPM({
            ingresosCobradosAcumulados: Number(
              payload.ingresosCobrados ?? payload.ingresosAcumulados ?? 1200000
            ),
            deduccionesAutorizadasAcumuladas: Number(
              payload.deduccionesCobros ?? payload.deduccionesAutorizadas ?? 750000
            ),
            ptuPagada: Number(payload.ptuPagada ?? 0),
            perdidasFiscalesPendientes: Number(payload.perdidasFiscales ?? 0),
            pagosProvisionalesPrevios: Number(payload.pagosProvisionalesPrevios ?? 45000),
            retencionesISRAcumuladas: Number(payload.retencionISR ?? 0),
            ivaCobrado: Number(payload.ivaCobrado ?? 192000),
            ivaAcreditablePagado: Number(payload.ivaAcreditable ?? 120000),
            retencionIVAMes: 0,
            mes,
            ejercicio: 2026,
          });
        } else {
          resultOutput = calcularResicoPF({
            ingresosCobradosMes: Number(
              payload.ingresosCobrados ?? payload.ingresosMensuales ?? 75000
            ),
            ingresosAcumuladosPrevios: Number(payload.ingresosAcumuladosAnio ?? 600000),
            retencionISREfectuadaPM: Number(payload.retencionISR ?? 937.5),
            ivaCobrado: Number(payload.ivaCobrado ?? 12000),
            ivaAcreditablePagado: Number(payload.ivaAcreditable ?? 4500),
            retencionIVAEfectuadaPM: 0,
            mes,
            ejercicio: 2026,
          });
        }
        break;
      }

      case 'recargos': {
        resultOutput = calcularRecargosYActualizacion({
          importeHistorico: Number(payload.importeHistorico ?? 45000),
          fechaVencimiento: String(
            payload.fechaVencimiento ??
              (payload.mesObligacion ? `${String(payload.mesObligacion)}-17` : '2025-06-17')
          ),
          fechaPago: String(
            payload.fechaPago ?? (payload.mesPago ? `${String(payload.mesPago)}-17` : '2026-02-17')
          ),
        });
        break;
      }

      case 'modalidad40': {
        resultOutput = await simularModalidad40({
          ultimoSbc: Number(payload.ultimoSbc ?? payload.sbcActualDiario ?? 600),
          sbcDeseado: Number(payload.sbcDeseado ?? 2932.75),
          semanasPrevias: Number(payload.semanasPrevias ?? payload.semanasActuales ?? 1250),
          mesesAportacion: Number(payload.mesesAportacion ?? payload.mesesModalidad40 ?? 24),
          edadJubilacion: Number(payload.edadJubilacion ?? payload.edadRetiro ?? 65),
          asignacionFamiliar: Boolean(payload.asignacionFamiliar ?? payload.tieneEsposa ?? true),
        });
        break;
      }

      case 'cierre-nomina': {
        const cierre = await procesarCierreNomina(
          [
            {
              id: 'T-01',
              nombre: 'Colaborador Demo 1',
              rfc: 'XAXX010101000',
              nss: '11223344556',
              salarioDiario: 650,
              fechaIngreso: '2023-01-15',
              diasTrabajados: 30,
              horasExtras: 0,
              bonos: 1500,
              otrasPercepciones: 0,
              otrasDeducciones: 0,
            },
          ],
          {
            empresaNombre: String(payload.empresaNombre ?? 'Despacho Demo Preview S.C.'),
            empresaRfc: 'AAA010101AAA',
            periodo:
              (payload.periodo as 'diario' | 'semanal' | 'quincenal' | 'mensual') ?? 'mensual',
            diasPeriodo: Number(payload.diasPeriodo ?? 30),
            fechaInicio: '2026-10-01',
            fechaFin: '2026-10-31',
            fechaCorte: '2026-10-31',
            estadoIsnId: String(payload.estadoId ?? 'YUC'),
            estadoIsnNombre: 'Yucatán',
            tasaIsn: Number(payload.tasaIsn ?? YUCATAN_ISN_TASA),
            primaVacacionalPct: 25,
            diasAguinaldo: 15,
          }
        );
        resultOutput = {
          resumen: cierre.resumen,
          trabajadoresProcesados: cierre.trabajadores.length,
        };
        break;
      }

      case 'balance-general': {
        const defaultBg = TOOL_SPECS_MAP['balance-general']!.sample_preview_payload;
        const jerarquia: JerarquiaBalance = {
          activoCorriente: (Array.isArray(payload.activoCorriente)
            ? payload.activoCorriente
            : defaultBg.activoCorriente) as JerarquiaBalance['activoCorriente'],
          activoNoCorriente: (Array.isArray(payload.activoNoCorriente)
            ? payload.activoNoCorriente
            : defaultBg.activoNoCorriente) as JerarquiaBalance['activoNoCorriente'],
          pasivoCorriente: (Array.isArray(payload.pasivoCorriente)
            ? payload.pasivoCorriente
            : defaultBg.pasivoCorriente) as JerarquiaBalance['pasivoCorriente'],
          pasivoNoCorriente: (Array.isArray(payload.pasivoNoCorriente)
            ? payload.pasivoNoCorriente
            : defaultBg.pasivoNoCorriente) as JerarquiaBalance['pasivoNoCorriente'],
          patrimonio: (Array.isArray(payload.patrimonio)
            ? payload.patrimonio
            : defaultBg.patrimonio) as JerarquiaBalance['patrimonio'],
        };
        const totales = calcularTotales(jerarquia);
        const analisis = analizarBalance(jerarquia, totales);
        resultOutput = { totales, analisis };
        break;
      }

      case 'xml-excel': {
        const xmlContent = String(payload.xmlContent ?? SAMPLE_CFDI_XML);
        const fileName = String(payload.fileName ?? 'cfdi-preview.xml');
        const parsed = parsearCFDI(xmlContent, fileName);
        resultOutput = {
          ...parsed,
          rfcEmisor: '[RFC_PREVIEW]',
          rfcReceptor: '[RFC_PREVIEW]',
        };
        break;
      }

      case 'validador': {
        const xmlContent = String(payload.xmlContent ?? SAMPLE_CFDI_XML);
        const fileName = String(payload.fileName ?? 'cfdi-validacion-preview.xml');
        const validated = validarCFDI(xmlContent, fileName);
        resultOutput = {
          ...validated,
          rfcEmisor: '[RFC_PREVIEW]',
          rfcReceptor: '[RFC_PREVIEW]',
        };
        break;
      }

      case 'timbrado': {
        const defaultTimbrado = TOOL_SPECS_MAP.timbrado!.sample_preview_payload;
        const conceptosRaw = Array.isArray(payload.conceptos)
          ? payload.conceptos
          : (defaultTimbrado.conceptos as Array<Record<string, unknown>>);
        let subtotal = 0;
        let ivaTrasladado = 0;
        let isrRetenido = 0;
        let ivaRetenido = 0;

        for (const item of conceptosRaw) {
          const c = item as Record<string, unknown>;
          const cantidad = Number(c.cantidad ?? 1);
          const valorUnitario = Number(c.valorUnitario ?? 0);
          const importe = Number((cantidad * valorUnitario).toFixed(2));
          const tasaIva = Number(c.tasaIva ?? 0.16);
          const tasaRetIsr = Number(c.retencionIsr ?? 0);
          const tasaRetIva = Number(c.retencionIva ?? 0);

          subtotal += importe;
          ivaTrasladado += Number((importe * tasaIva).toFixed(2));
          isrRetenido += Number((importe * tasaRetIsr).toFixed(2));
          ivaRetenido += Number((importe * tasaRetIva).toFixed(2));
        }

        const total = Number((subtotal + ivaTrasladado - isrRetenido - ivaRetenido).toFixed(2));
        const metodoPago = String(payload.metodoPago ?? 'PUE');
        const formaPago = String(payload.formaPago ?? '03');
        const observacionesFiscales: string[] = [];

        if (metodoPago === 'PUE' && formaPago === '99') {
          observacionesFiscales.push(
            'Inconsistencia CFF Art. 29-A / Anexo 20: Método PUE no admite FormaPago 99 (Por definir).'
          );
        }
        if (metodoPago === 'PPD' && formaPago !== '99') {
          observacionesFiscales.push(
            'Inconsistencia Anexo 20: Método PPD exige FormaPago 99 (Por definir).'
          );
        }

        resultOutput = {
          prevalidacionOk: observacionesFiscales.length === 0,
          subtotal: Number(subtotal.toFixed(2)),
          ivaTrasladado: Number(ivaTrasladado.toFixed(2)),
          isrRetenido: Number(isrRetenido.toFixed(2)),
          ivaRetenido: Number(ivaRetenido.toFixed(2)),
          total,
          metodoPago,
          formaPago,
          observacionesFiscales,
          ateb_status: 'in_progress_preview_only',
          stamped: false,
        };
        break;
      }

      case 'spei': {
        const monto = Number(payload.monto ?? 11600);
        const msiMeses = Number(payload.msiMeses ?? 0);
        resultOutput = calcularComisionClip(monto, msiMeses);
        break;
      }

      case 'leasing': {
        const params = {
          clientesIniciales: Number(payload.clientesIniciales ?? LEASING_DEFAULT.clientesIniciales),
          clientesNuevosPorMes: Number(
            payload.clientesNuevosPorMes ?? LEASING_DEFAULT.clientesNuevosPorMes
          ),
          tasaChurnPorcentaje: Number(
            payload.tasaChurnPorcentaje ?? LEASING_DEFAULT.tasaChurnPorcentaje
          ),
          setupFee: Number(payload.setupFee ?? LEASING_DEFAULT.setupFee),
          rentaMensual: Number(payload.rentaMensual ?? LEASING_DEFAULT.rentaMensual),
          costoDirectoPorCliente: Number(
            payload.costoDirectoPorCliente ?? LEASING_DEFAULT.costoDirectoPorCliente
          ),
          plazoMeses: Number(payload.plazoMeses ?? LEASING_DEFAULT.plazoMeses),
        };
        const proyeccion = proyectarMeses(params);
        const resumen = calcularResumenLeasing(params, proyeccion);
        resultOutput = {
          resumen,
          mesesProyectados: proyeccion.length,
        };
        break;
      }

      case 'guia-sat-imss': {
        const autoridad = String(payload.autoridad ?? 'TODAS').toUpperCase();
        const query = payload.query ? String(payload.query).toLowerCase() : '';
        const todosActos = [...ACTOS_SAT, ...ACTOS_IMSS];
        const filtrados = todosActos.filter((a) => {
          const matchAut = autoridad === 'TODAS' || a.autoridad === autoridad;
          const matchQ =
            !query ||
            a.titulo.toLowerCase().includes(query) ||
            a.codigo.toLowerCase().includes(query) ||
            a.fundamento.toLowerCase().includes(query);
          return matchAut && matchQ;
        });
        resultOutput = {
          totalPasosGuia: GUIA_PASOS.length,
          actosEncontrados: filtrados.length,
          actos: filtrados,
          plazosClave: PLAZOS_CLAVE,
          pasosProtocolo: GUIA_PASOS.map((p) => ({
            id: p.id,
            titulo: p.titulo,
            corto: p.corto,
            fundamento: p.fundamento,
          })),
        };
        break;
      }

      case 'auditor-cobranza': {
        const dictamenPreview = calcularDictamenCobranza({
          cliente: String(payload.cliente ?? 'Preview Operator StayPuft'),
          revisor: 'StayPuft Preview (Sin Dictamen Oficial)',
          respuestasComparadores: (payload.respuestasComparadores as Record<
            string,
            'COINCIDE' | 'DIFIERE' | 'PARCIAL' | 'NO_VERIFICABLE' | 'SIN_DATO'
          >) ?? {
            'comp-1': 'COINCIDE',
            'comp-2': 'DIFIERE',
          },
          conductasDetectadas: Array.isArray(payload.conductasDetectadas)
            ? payload.conductasDetectadas.map(String)
            : ['C1'],
        });
        resultOutput = {
          ...dictamenPreview,
          catalogoComparadoresTotal: COMPARADORES_CONTRATO_CRM.length,
          catalogoConductasTotal: CONDUCTAS_COBRANZA.length,
        };
        break;
      }

      case 'mapa-activos': {
        const marcoLegal = String(payload.marcoLegal ?? 'TODOS');
        const gravedad = String(payload.gravedad ?? 'TODAS').toUpperCase();
        const montoOperacionMxn = Number(payload.montoOperacionMxn ?? 95000);
        const umbral645Umas = Number((645 * UMA_DIARIA_2026).toFixed(2));
        const filtradas = CONDUCTAS_AV.filter((c) => {
          const matchMarco =
            marcoLegal === 'TODOS' || c.marcoLegal.toLowerCase() === marcoLegal.toLowerCase();
          const matchGrav = gravedad === 'TODAS' || c.gravedad === gravedad;
          return matchMarco && matchGrav;
        });
        resultOutput = {
          umaDiaria2026: UMA_DIARIA_2026,
          umbralAviso645UmasMxn: umbral645Umas,
          montoEvaluadoMxn: montoOperacionMxn,
          requiereAvisoUif: montoOperacionMxn >= umbral645Umas,
          conductasFiltradas: filtradas.length,
          conductas: filtradas.map((c) => ({
            id: c.id,
            conducta: c.conducta,
            marcoLegal: c.marcoLegal,
            articulo: c.articulo,
            gravedad: c.gravedad,
          })),
          umbralesReporte: UMBRALES_REPORTE_AV,
          autoridadesCompetentes: AUTORIDADES_AV.map((a) => a.sigla),
        };
        break;
      }

      case 'anexo24': {
        const xmlContent = String(payload.xmlContent ?? SAMPLE_CFDI_XML);
        const factura = parsearCFDI(xmlContent, 'anexo24-preview.xml');
        const conciliacion = ejecutarConciliacionAnexo24([factura]);
        resultOutput = {
          resumen: conciliacion.resumen,
          cuentasUtilizadas: conciliacion.cuentasUtilizadas,
        };
        break;
      }

      case 'monitor-lfpiorpi': {
        const defaultPld = TOOL_SPECS_MAP['monitor-lfpiorpi']!.sample_preview_payload;
        const fraccion = (payload.fraccion as FraccionLFPIORPI) ?? 'FRACCION_XV';
        const operaciones = (
          Array.isArray(payload.operaciones) ? payload.operaciones : defaultPld.operaciones
        ) as OperacionCobranza[];
        resultOutput = await evaluarOperacionesLFPIORPI(operaciones, fraccion);
        break;
      }

      case 'auditor-cfdi-atipico': {
        const ejercicio = Number(payload.ejercicio ?? 2026);
        const demoData = generarDatosDemostracion(ejercicio);
        const cfdis = (
          Array.isArray(payload.cfdis) ? payload.cfdis : demoData.cfdis
        ) as CFDIExtraido[];
        const hallazgos = evaluarCriteriosForense(
          cfdis,
          demoData.metadata,
          CRITERIOS_DEFAULT,
          ejercicio
        );
        resultOutput = {
          totalEvaluados: cfdis.length,
          totalHallazgos: hallazgos.length,
          criteriosActivos: CRITERIOS_DEFAULT.filter((c) => c.activo).length,
          hallazgos,
        };
        break;
      }

      case 'retencion-clinicas': {
        const estadoId = String(payload.estadoId ?? 'YUC')
          .trim()
          .toUpperCase();
        if (estadoId !== 'YUC') {
          return {
            ok: false,
            statusCode: 400,
            error: MENSAJE_SOLO_YUCATAN,
          };
        }
        resultOutput = calcularRetencionClinicas({
          estadoId,
          montoHonorarios: Number(payload.montoHonorarios ?? 10000),
          fechaPago: String(payload.fechaPago ?? '2026-03-15'),
          retenedor: { nombre: 'Clínica Preview', rfc: 'XAXX010101000' },
          prestador: {
            nombre: 'Prestador Preview',
            rfc: 'XAXX010101000',
            tipoPersona: 'fisica',
          },
        });
        break;
      }

      default:
        return {
          ok: false,
          statusCode: 400,
          error: `Modo preview no configurado para '${toolId}'.`,
        };
    }

    return {
      ok: true,
      statusCode: 200,
      data: {
        tool_id: catalogTool.id,
        tool_name: catalogTool.nombre,
        category: catalogTool.categoria,
        preview: true,
        sealed: false,
        saved: false,
        stamped: false,
        dictamen_issued: false,
        catalog_version: CURRENT_CATALOG_VERSION,
        law_cited: spec?.law_cited ?? [],
        result: resultOutput,
      },
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 400,
      error: err instanceof Error ? err.message : 'Error al ejecutar cálculo en modo preview.',
    };
  }
}

// ============================================================================
// Datos aislados para el tenant Sandbox Demo (`tenant-demo-sandbox`)
// ============================================================================

const DEMO_SANDBOX_EXPEDIENTES = [
  {
    id: 'exp-demo-sandbox-001',
    client_id: 'cli-demo-sandbox-001',
    tenant_id: DEMO_TENANT_ID,
    is_demo: true,
    tool_id: 'isn',
    title: 'Simulación ISN Yucatán 2026 (Sandbox Demo)',
    input_data: { estadoId: 'YUC', baseGravable: 350000 },
    output_data: {
      isn: Number((350000 * (YUCATAN_ISN_TASA / 100)).toFixed(2)),
      tasa: YUCATAN_ISN_TASA,
    },
    input_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    catalog_version: CURRENT_CATALOG_VERSION,
    notes: 'Registro sintético exclusivo del entorno demo aislado.',
    created_at: '2026-10-01T10:00:00.000Z',
  },
];

const DEMO_SANDBOX_ACCOUNTS = [
  {
    id: 'acc-demo-sandbox-001',
    tenant_id: DEMO_TENANT_ID,
    is_demo: true,
    name: 'Despacho Contable Demo Sandbox S.C.',
    segment: 'demo_sandbox',
    plan_tier: 'pro_demo',
    subscription_status: 'sandbox',
    arkangel_trigger_state: 'isolated_sandbox_no_trigger',
    created_at: '2026-10-01T09:00:00.000Z',
  },
];

// ============================================================================
// Helper JSON Response & Workers AI Safe Preview Orchestration
// ============================================================================

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

const VALID_PREVIEW_TOOL_IDS = new Set<string>(CATALOGO_HERRAMIENTAS.map((t) => t.id));

const AI_TOOL_NAME_TO_CANONICAL_ID: Record<string, string> = {
  ...Object.fromEntries(CATALOGO_HERRAMIENTAS.map((t) => [t.id, t.id])),
  ...Object.fromEntries(CATALOGO_HERRAMIENTAS.map((t) => [`preview_${t.id}`, t.id])),
  ...Object.fromEntries(
    CATALOGO_HERRAMIENTAS.map((t) => [`preview_${t.id.replace(/-/g, '_')}`, t.id])
  ),
  ...Object.fromEntries(CATALOGO_HERRAMIENTAS.map((t) => [t.id.replace(/-/g, '_'), t.id])),
  calcular_isn: 'isn',
  calcular_sbc: 'sbc',
  calcular_nomina_rapida: 'nomina',
  calcular_finiquito_lft: 'finiquitos',
  calcular_resico: 'resico',
  calcular_recargos_fiscales: 'recargos',
  calcular_modalidad_40: 'modalidad40',
};

function checkStayPuftAiRateLimit(
  operatorKey: string,
  now = Date.now()
): {
  allowed: boolean;
  remaining: number;
  usedInWindow: number;
} {
  const key = operatorKey || 'default_operator';
  const cutoff = now - STAYPUFT_AI_RATE_WINDOW_MS;
  const existing = (stayPuftAiRateLimitMap.get(key) ?? []).filter((ts) => ts > cutoff);

  if (existing.length >= STAYPUFT_AI_RATE_LIMIT_PER_HOUR) {
    stayPuftAiRateLimitMap.set(key, existing);
    return {
      allowed: false,
      remaining: 0,
      usedInWindow: existing.length,
    };
  }

  existing.push(now);
  stayPuftAiRateLimitMap.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, STAYPUFT_AI_RATE_LIMIT_PER_HOUR - existing.length),
    usedInWindow: existing.length,
  };
}

function detectForbiddenPromptIntent(prompt: string): { blocked: boolean; reason?: string } {
  const text = prompt.trim();
  const isExplicitPreview = /\b(preview|simulaci[oó]n|simular|borrador|dry[- ]?run)\b/i.test(text);

  if (
    /\b(sellar?|seal)\b[\s\S]{0,50}\b(expediente|hash|sha-?256|d1)\b/i.test(text) ||
    /\b(expediente)[\s\S]{0,50}\b(sellar?|seal)\b/i.test(text)
  ) {
    return {
      blocked: true,
      reason:
        'Approval Gate activo: El modelo no puede sellar ni persistir en el Expediente Único. Solo modo preview (writes: 0).',
    };
  }

  if (
    !isExplicitPreview &&
    (/\b(timbrar?|stamp)\b[\s\S]{0,50}\b(cfdi|factura|xml|sat|ateb|alegra|pac)\b/i.test(text) ||
      /\b(cfdi|factura)[\s\S]{0,50}\b(timbrar?|stamp)\b/i.test(text))
  ) {
    return {
      blocked: true,
      reason:
        'Approval Gate activo: El modelo no puede timbrar CFDI ante el SAT/ATEB/Alegra. Solo modo preview (stamped: false, writes: 0).',
    };
  }

  if (
    !isExplicitPreview &&
    /\b(emitir?|issue|firmar?|aprobar?)\b[\s\S]{0,50}\b(dictamen)\b/i.test(text)
  ) {
    return {
      blocked: true,
      reason:
        'Approval Gate activo: El modelo no puede emitir dictámenes oficiales. Solo modo preview (writes: 0).',
    };
  }

  if (
    /\b(enviar?|manda[r]?|send|disparar?)\b[\s\S]{0,50}\b(email|correo|whatsapp|resend|telnyx|mensaje|notificaci[oó]n)\b/i.test(
      text
    ) ||
    /\b(email|correo|whatsapp)\b[\s\S]{0,40}\b(enviar?|send)\b/i.test(text)
  ) {
    return {
      blocked: true,
      reason:
        'Approval Gate activo: El modelo no puede enviar correos (Telnyx/Resend), WhatsApp ni notificaciones externas.',
    };
  }

  if (
    /\b(crear?|actualizar?|eliminar?|borrar?|create|update|delete|drop|remove)\b[\s\S]{0,40}\b(usuario|user|tenant|despacho|lead|prospecto|cuenta)\b/i.test(
      text
    )
  ) {
    return {
      blocked: true,
      reason:
        'Approval Gate activo: El modelo no puede crear, actualizar ni eliminar usuarios, tenants o leads.',
    };
  }

  return { blocked: false };
}

async function buildAiMetricsSummary(
  env: Env,
  tenantId: string,
  isDemo: boolean,
  pagination: PaginationParams
): Promise<Record<string, unknown>> {
  const periodWindow = getAiPeriodWindow();
  const tenantMem = getOrCreateTenantAiTelemetry(tenantId);

  let d1TenantCalls = 0;
  let d1TotalCallsAllTenants = 0;
  let d1TenantAskErrors = 0;

  const db = getD1(env);
  if (db && !isDemo) {
    try {
      const tenantUsageRow = await db
        .prepare(`SELECT query_count FROM ai_usage WHERE tenant_id = ?1 AND period = ?2 LIMIT 1`)
        .bind(tenantId, periodWindow.period)
        .first<{ query_count: number }>();
      d1TenantCalls = Number(tenantUsageRow?.query_count ?? 0);
    } catch {
      d1TenantCalls = 0;
    }

    try {
      const totalUsageRow = await db
        .prepare(
          `SELECT COALESCE(SUM(query_count), 0) as total_calls FROM ai_usage WHERE period = ?1 AND tenant_id != ?2`
        )
        .bind(periodWindow.period, DEMO_TENANT_ID)
        .first<{ total_calls: number }>();
      d1TotalCallsAllTenants = Number(totalUsageRow?.total_calls ?? 0);
    } catch {
      d1TotalCallsAllTenants = d1TenantCalls;
    }

    try {
      const errRow = await db
        .prepare(
          `SELECT COUNT(*) as total FROM staypuft_audit_log WHERE tenant_id = ?1 AND path = '/api/internal/ai/ask' AND status_code >= 400`
        )
        .bind(tenantId)
        .first<{ total: number }>();
      d1TenantAskErrors = Number(errRow?.total ?? 0);
    } catch {
      d1TenantAskErrors = 0;
    }

    try {
      const d1TelRow = await db
        .prepare(
          `SELECT neurons_available, neurons_total, prompt_tokens, completion_tokens, total_tokens
           FROM staypuft_ai_telemetry
           WHERE tenant_id = ?1 AND period = ?2 LIMIT 1`
        )
        .bind(tenantId, periodWindow.period)
        .first<{
          neurons_available: number;
          neurons_total: number;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        }>();
      if (d1TelRow) {
        if (d1TelRow.neurons_available && !tenantMem.neuronsAvailable) {
          tenantMem.neuronsAvailable = true;
          tenantMem.neuronsTotal = Number(d1TelRow.neurons_total ?? 0);
          tenantMem.neuronsByModel[DEFAULT_MODEL] = Number(d1TelRow.neurons_total ?? 0);
        }
        if (Number(d1TelRow.total_tokens ?? 0) > 0 && !tenantMem.tokensAvailable) {
          tenantMem.tokensAvailable = true;
          tenantMem.promptTokens = Number(d1TelRow.prompt_tokens ?? 0);
          tenantMem.completionTokens = Number(d1TelRow.completion_tokens ?? 0);
          tenantMem.totalTokens = Number(d1TelRow.total_tokens ?? 0);
        }
      }
    } catch {
      // Tabla opcional si el entorno de test mockea D1 sin staypuft_ai_telemetry
    }
  }

  let memGlobalCalls = 0;
  let memGlobalErrors = 0;
  let memGlobalToolCalls = 0;
  let memGlobalNeuronsAvailable = false;
  let memGlobalNeuronsTotal = 0;
  const memGlobalNeuronsByModel: Record<string, number> = {};

  for (const [tId, state] of stayPuftAiTelemetryByTenant.entries()) {
    if (!isDemo && tId === DEMO_TENANT_ID) continue;
    memGlobalCalls += state.calls;
    memGlobalErrors += state.errors;
    for (const count of Object.values(state.toolCallsByTool)) {
      memGlobalToolCalls += count;
    }
    if (state.neuronsAvailable) {
      memGlobalNeuronsAvailable = true;
      memGlobalNeuronsTotal += state.neuronsTotal;
      for (const [m, n] of Object.entries(state.neuronsByModel)) {
        memGlobalNeuronsByModel[m] = (memGlobalNeuronsByModel[m] ?? 0) + n;
      }
    }
  }

  const tenantCalls = isDemo ? tenantMem.calls : d1TenantCalls + tenantMem.calls;
  const totalCalls = isDemo
    ? tenantMem.calls
    : Math.max(tenantCalls, d1TotalCallsAllTenants + memGlobalCalls);
  const tenantErrors = Math.max(tenantMem.errors, d1TenantAskErrors);

  const toolCallsEntries = Object.entries(tenantMem.toolCallsByTool)
    .map(([tool_id, calls]) => ({
      toolId: tool_id,
      tool_id,
      calls,
    }))
    .sort((a, b) => b.calls - a.calls);

  const paginatedToolCalls = toolCallsEntries.slice(
    pagination.offset,
    pagination.offset + pagination.limit
  );
  const tenantToolCallsTotal = toolCallsEntries.reduce((acc, item) => acc + item.calls, 0);

  const neuronsAvailable = tenantMem.neuronsAvailable;
  const neuronsTotal = neuronsAvailable ? tenantMem.neuronsTotal : null;
  const neuronsPerModel: Record<string, number | null> = {
    [DEFAULT_MODEL]: neuronsAvailable ? (tenantMem.neuronsByModel[DEFAULT_MODEL] ?? 0) : null,
    [FAST_MODEL]: neuronsAvailable ? (tenantMem.neuronsByModel[FAST_MODEL] ?? 0) : null,
  };

  return {
    calls: tenantCalls,
    totalCalls,
    model: DEFAULT_MODEL,
    fastModel: FAST_MODEL,
    models: [DEFAULT_MODEL, FAST_MODEL],
    neuronsAvailable,
    neurons: {
      available: neuronsAvailable,
      total: neuronsTotal,
      perModel: neuronsPerModel,
      byModel: neuronsPerModel,
      whereAccountTotalLives: STAYPUFT_AI_NEURONS_LOCATION_NOTE,
    },
    toolCalls: {
      total: tenantToolCallsTotal,
      byTool: { ...tenantMem.toolCallsByTool },
      items: paginatedToolCalls,
    },
    tokens: {
      available: tenantMem.tokensAvailable,
      promptTokens: tenantMem.tokensAvailable ? tenantMem.promptTokens : null,
      completionTokens: tenantMem.tokensAvailable ? tenantMem.completionTokens : null,
      totalTokens: tenantMem.tokensAvailable ? tenantMem.totalTokens : null,
    },
    durationMs: {
      totalMs: tenantMem.durationTotalMs,
      avgMs: tenantMem.calls > 0 ? Math.round(tenantMem.durationTotalMs / tenantMem.calls) : null,
    },
    errors: tenantErrors,
    period: {
      key: periodWindow.period,
      start: periodWindow.start,
      end: periodWindow.end,
    },
    totals: {
      calls: totalCalls,
      toolCalls: Math.max(tenantToolCallsTotal, memGlobalToolCalls),
      errors: Math.max(tenantErrors, memGlobalErrors),
      neuronsAvailable: memGlobalNeuronsAvailable,
      neurons: {
        available: memGlobalNeuronsAvailable,
        total: memGlobalNeuronsAvailable ? memGlobalNeuronsTotal : null,
        perModel: {
          [DEFAULT_MODEL]: memGlobalNeuronsAvailable
            ? (memGlobalNeuronsByModel[DEFAULT_MODEL] ?? 0)
            : null,
          [FAST_MODEL]: memGlobalNeuronsAvailable
            ? (memGlobalNeuronsByModel[FAST_MODEL] ?? 0)
            : null,
        },
        whereAccountTotalLives: STAYPUFT_AI_NEURONS_LOCATION_NOTE,
      },
    },
  };
}

// ============================================================================
// Handler Principal de `/api/internal/*`
// ============================================================================

export async function handleStayPuftInternalRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();
  const safePath = sanitizeAuditPath(url);
  const requestedTenant = extractRequestedTenantId(request, url);

  // 1. Fail-closed: Verificar X-StayPuft-Key en tiempo constante
  const authCheck = verifyStayPuftKey(request, env);
  if (!authCheck.authorized) {
    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: requestedTenant,
      statusCode: 401,
      result: 'unauthorized',
      details: authCheck.reason ?? 'UNAUTHORIZED',
    });
    return jsonResponse(
      {
        ok: false,
        error: 'No autorizado. Se requiere X-StayPuft-Key válida.',
      },
      401,
      corsHeaders
    );
  }

  // 2. GET /api/internal/status
  if (pathname === '/api/internal/status' && method === 'GET') {
    const db = getD1(env);
    let d1Connected = false;
    if (db) {
      try {
        await db.prepare('SELECT 1 as ok').first();
        d1Connected = true;
      } catch {
        d1Connected = false;
      }
    }

    const r2Configured = Boolean(env.CANACO_DOCS);
    const aiConfigured = Boolean(env.AI);
    const arkangelConfigured = Boolean(env.ARKANGEL || (env.ARKANGEL_URL && env.ARKANGEL_API_KEY));

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: requestedTenant,
      statusCode: 200,
      result: 'ok',
      details: 'status_check',
    });

    return jsonResponse(
      {
        ok: true,
        product: 'Ark Ledger',
        subtitle: 'El Sistema Operativo de la Defensa Fiscal',
        version: ARK_LEDGER_VERSION,
        environment: env.ENVIRONMENT ?? 'production',
        operator: STAYPUFT_OPERATOR_ID,
        health: d1Connected ? 'healthy' : 'degraded_no_d1',
        tool_count: TOTAL_HERRAMIENTAS,
        test_count: CANONICAL_TEST_SUITE_SUMMARY.baseline_tests,
        test_suites: CANONICAL_TEST_SUITE_SUMMARY.baseline_suites,
        catalog_version: CURRENT_CATALOG_VERSION,
        dof_vigencias_count: CATALOGO_2026.length,
        inpc_periods_count: TABLA_INPC.length,
        isn_states_count: ESTADOS.length,
        lfpiorpi_fractions_count: CATALOGO_ACTIVIDADES_VULNERABLES.length,
        bindings: {
          d1: { configured: Boolean(db), connected: d1Connected },
          kv_session: { configured: false, mode: 'd1_native_sessions' },
          r2_buzon: { configured: r2Configured },
          workers_ai: { configured: aiConfigured },
        },
        ai: {
          configured: aiConfigured,
          model: DEFAULT_MODEL,
          fast_model: FAST_MODEL,
          neuronsAvailable: aiConfigured,
          per_call_neurons_supported: aiConfigured,
          neurons_formula:
            'Returned per call by Cloudflare Workers AI runtime in response.usage.neurons (prompt_tokens + completion_tokens weighted by model neuron rate, e.g. ~89.69 neurons on @cf/meta/llama-3.3-70b-instruct-fp8-fast)',
          neurons_location: STAYPUFT_AI_NEURONS_LOCATION_NOTE,
          ask_endpoint: 'POST /api/internal/ai/ask',
          rate_limit_per_hour: STAYPUFT_AI_RATE_LIMIT_PER_HOUR,
          preview_tools_count: TOTAL_HERRAMIENTAS,
        },
        integrations: {
          arkangel_trigger: {
            configured: arkangelConfigured,
            webhook_secret_configured: Boolean(env.ARKANGEL_WEBHOOK_SECRET),
            approval_gate_enforced: true,
          },
          ateb_pac: {
            status: 'in_progress',
            distributor_pricing_in_writing: false,
            production_stamping_enabled: false,
            approval_gate_enforced: true,
          },
          conekta_canaco: {
            configured: Boolean(env.CONEKTA_PRIVATE_KEY),
          },
        },
        chamber_bundle_canaco: {
          siem: 'Cumplimiento SIEM incluido',
          commerce: '$0 MXN',
          ledger_freemium: '$0 MXN (Acceso base afiliados)',
          ledger_pro: '$399 MXN / mes',
        },
      },
      200,
      corsHeaders
    );
  }

  // 3. GET /api/internal/tools
  if (pathname === '/api/internal/tools' && method === 'GET') {
    const tools = buildLiveToolCatalog().map((t) => ({
      id: t.id,
      name: t.name,
      route: t.route,
      category: t.category,
      description: t.description,
      status: t.status,
      preview_supported: t.preview_supported,
      law_cited: t.law_cited,
    }));

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: requestedTenant,
      statusCode: 200,
      result: 'ok',
      details: `listed_${tools.length}_tools`,
    });

    return jsonResponse(
      {
        ok: true,
        total: TOTAL_HERRAMIENTAS,
        catalog_version: CURRENT_CATALOG_VERSION,
        tools,
      },
      200,
      corsHeaders
    );
  }

  // 4. GET /api/internal/tools/:id
  const toolDetailMatch = pathname.match(/^\/api\/internal\/tools\/([a-z0-9-]+)$/);
  if (toolDetailMatch && method === 'GET') {
    const toolId = toolDetailMatch[1] ?? '';
    const tool = buildLiveToolCatalog().find((t) => t.id === toolId);
    if (!tool) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 404,
        result: 'not_found',
        details: `unknown_tool_${toolId}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: `Herramienta '${toolId}' no encontrada.`,
        },
        404,
        corsHeaders
      );
    }

    let liveReferenceData: Record<string, unknown> = {
      uma_diaria_2026: UMA_DIARIA_2026,
      smg_general_2026: SMG_GENERAL_2026,
      smg_frontera_2026: SMG_FRONTERA_2026,
    };

    if (toolId === 'isn') {
      liveReferenceData = {
        ...liveReferenceData,
        total_estados: ESTADOS.length,
        estados: ESTADOS.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          corto: e.corto,
          tasa: e.tasa,
          vigencia: e.vigencia,
          articulo: e.articulo,
        })),
      };
    } else if (toolId === 'monitor-lfpiorpi') {
      liveReferenceData = {
        ...liveReferenceData,
        actividades_vulnerables: CATALOGO_ACTIVIDADES_VULNERABLES,
      };
    } else if (toolId === 'recargos') {
      liveReferenceData = {
        ...liveReferenceData,
        tasa_recargos_mora_mensual: TASA_RECARGOS_MORA_2026,
        periodos_inpc_disponibles: TABLA_INPC.length,
        ultimo_inpc: TABLA_INPC[TABLA_INPC.length - 1],
      };
    }

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: requestedTenant,
      statusCode: 200,
      result: 'ok',
      details: `tool_detail_${toolId}`,
    });

    return jsonResponse(
      {
        ok: true,
        catalog_version: CURRENT_CATALOG_VERSION,
        tool,
        live_reference_data: liveReferenceData,
      },
      200,
      corsHeaders
    );
  }

  // 5. POST /api/internal/tools/:id/preview
  const toolPreviewMatch = pathname.match(/^\/api\/internal\/tools\/([a-z0-9-]+)\/preview$/);
  if (toolPreviewMatch && method === 'POST') {
    const toolId = toolPreviewMatch[1] ?? '';
    let body: Record<string, unknown> = {};
    try {
      const rawText = await request.text();
      if (rawText.trim().length > 0) {
        body = JSON.parse(rawText) as Record<string, unknown>;
      }
    } catch {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 400,
        result: 'bad_request',
        details: `invalid_json_preview_${toolId}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: 'El cuerpo JSON de la solicitud es inválido.',
        },
        400,
        corsHeaders
      );
    }

    const previewResult = await executeToolPreview(toolId, body);
    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: requestedTenant,
      statusCode: previewResult.statusCode,
      result: previewResult.ok
        ? 'ok'
        : previewResult.statusCode === 404
          ? 'not_found'
          : 'bad_request',
      details: `preview_${toolId}`,
    });

    if (!previewResult.ok) {
      return jsonResponse(
        {
          ok: false,
          error: previewResult.error,
        },
        previewResult.statusCode,
        corsHeaders
      );
    }

    return jsonResponse(
      {
        ok: true,
        ...previewResult.data,
      },
      200,
      corsHeaders
    );
  }

  // 6. GET /api/internal/expediente (y alias /api/internal/expedientes)
  if (
    (pathname === '/api/internal/expediente' || pathname === '/api/internal/expedientes') &&
    method === 'GET'
  ) {
    const tenantRes = await resolveAndValidateTenant(request, url, env);
    if (!tenantRes.valid || !tenantRes.tenantId) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 404,
        result: 'not_found',
        details: 'invalid_or_missing_tenant_on_expediente_list',
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Tenant no encontrado o no especificado (404).',
        },
        404,
        corsHeaders
      );
    }

    const pagination = parsePagination(url);

    if (tenantRes.isDemo) {
      const demoSlice = DEMO_SANDBOX_EXPEDIENTES.slice(
        pagination.offset,
        pagination.offset + pagination.limit
      );
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 200,
        result: 'ok',
        details: `expediente_list_demo_count_${demoSlice.length}`,
      });
      return jsonResponse(
        {
          ok: true,
          tenant_id: tenantRes.tenantId,
          is_demo: true,
          pagination,
          expedientes: demoSlice,
        },
        200,
        corsHeaders
      );
    }

    let rows: Array<Record<string, unknown>> = [];
    const db = getD1(env);
    if (db) {
      try {
        const res = await db
          .prepare(
            `SELECT e.id, e.client_id, e.tool_id, e.title, e.input_hash, e.catalog_version, e.notes, e.created_at,
                  COALESCE(e.tenant_id, c.tenant_id, 'ark') as tenant_id
           FROM expedientes e
           LEFT JOIN clients c ON c.id = e.client_id
           WHERE COALESCE(e.tenant_id, c.tenant_id, 'ark') = ?1
             AND COALESCE(e.tenant_id, c.tenant_id, 'ark') != ?2
           ORDER BY e.created_at DESC
           LIMIT ?3 OFFSET ?4`
          )
          .bind(tenantRes.tenantId, DEMO_TENANT_ID, pagination.limit, pagination.offset)
          .all<Record<string, unknown>>();
        rows = (res.results ?? []).slice(0, pagination.limit).map((r) => ({
          ...r,
          tenant_id: tenantRes.tenantId,
          is_demo: false,
        }));
      } catch {
        rows = [];
      }
    }

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: tenantRes.tenantId,
      statusCode: 200,
      result: 'ok',
      details: `expediente_list_count_${rows.length}`,
    });

    return jsonResponse(
      {
        ok: true,
        tenant_id: tenantRes.tenantId,
        is_demo: false,
        pagination,
        expedientes: rows,
      },
      200,
      corsHeaders
    );
  }

  // 7. GET /api/internal/expediente/:id (y alias /api/internal/expedientes/:id)
  const expedienteDetailMatch = pathname.match(/^\/api\/internal\/expedientes?\/([a-zA-Z0-9_-]+)$/);
  if (expedienteDetailMatch && method === 'GET') {
    const expedienteId = expedienteDetailMatch[1] ?? '';
    const tenantRes = await resolveAndValidateTenant(request, url, env);
    if (!tenantRes.valid || !tenantRes.tenantId) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 404,
        result: 'not_found',
        details: 'invalid_or_missing_tenant_on_expediente_detail',
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Tenant no encontrado o no especificado (404).',
        },
        404,
        corsHeaders
      );
    }

    if (tenantRes.isDemo) {
      const demoItem = DEMO_SANDBOX_EXPEDIENTES.find((e) => e.id === expedienteId);
      if (!demoItem) {
        await logStayPuftAudit(env, {
          method,
          path: safePath,
          tenantId: tenantRes.tenantId,
          statusCode: 404,
          result: 'not_found',
          details: `demo_expediente_not_found_${expedienteId}`,
        });
        return jsonResponse(
          { ok: false, error: 'Expediente no encontrado en el tenant demo.' },
          404,
          corsHeaders
        );
      }

      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 200,
        result: 'ok',
        details: `demo_expediente_detail_${expedienteId}`,
      });
      return jsonResponse(
        {
          ok: true,
          tenant_id: tenantRes.tenantId,
          is_demo: true,
          expediente: demoItem,
          seal: {
            algorithm: 'SHA-256',
            input_hash: demoItem.input_hash,
            catalog_version: demoItem.catalog_version,
          },
          audit_trail: [
            {
              action: 'EXPEDIENTE_SEALED_SANDBOX',
              timestamp: demoItem.created_at,
              tenant_id: DEMO_TENANT_ID,
            },
          ],
        },
        200,
        corsHeaders
      );
    }

    if (DEMO_SANDBOX_EXPEDIENTES.some((e) => e.id === expedienteId)) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 404,
        result: 'not_found',
        details: 'cross_tenant_demo_access_blocked',
      });
      return jsonResponse(
        { ok: false, error: 'Expediente no encontrado en este tenant.' },
        404,
        corsHeaders
      );
    }

    let expedienteRow: Record<string, unknown> | null = null;
    let auditTrail: Array<Record<string, unknown>> = [];
    const db = getD1(env);

    if (db) {
      try {
        expedienteRow = await db
          .prepare(
            `SELECT e.id, e.client_id, e.tool_id, e.title, e.input_data, e.output_data,
                  e.input_hash, e.catalog_version, e.notes, e.created_at,
                  COALESCE(e.tenant_id, c.tenant_id, 'ark') as tenant_id
           FROM expedientes e
           LEFT JOIN clients c ON c.id = e.client_id
           WHERE e.id = ?1
             AND COALESCE(e.tenant_id, c.tenant_id, 'ark') = ?2
             AND COALESCE(e.tenant_id, c.tenant_id, 'ark') != ?3
           LIMIT 1`
          )
          .bind(expedienteId, tenantRes.tenantId, DEMO_TENANT_ID)
          .first<Record<string, unknown>>();

        if (expedienteRow) {
          const trailRes = await db
            .prepare(
              `SELECT id, user_id, tool_id, action, metadata, created_at
             FROM arkangel_ledger
             WHERE tenant_id = ?1
             ORDER BY created_at DESC
             LIMIT 20`
            )
            .bind(tenantRes.tenantId)
            .all<Record<string, unknown>>();
          auditTrail = trailRes.results ?? [];
        }
      } catch {
        expedienteRow = null;
      }
    }

    if (!expedienteRow) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 404,
        result: 'not_found',
        details: `expediente_not_found_or_cross_tenant_${expedienteId}`,
      });
      return jsonResponse(
        { ok: false, error: 'Expediente no encontrado en este tenant.' },
        404,
        corsHeaders
      );
    }

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: tenantRes.tenantId,
      statusCode: 200,
      result: 'ok',
      details: `expediente_detail_${expedienteId}`,
    });

    return jsonResponse(
      {
        ok: true,
        tenant_id: tenantRes.tenantId,
        is_demo: false,
        expediente: {
          ...expedienteRow,
          is_demo: false,
        },
        seal: {
          algorithm: 'SHA-256',
          input_hash: expedienteRow.input_hash ?? null,
          catalog_version: expedienteRow.catalog_version ?? CURRENT_CATALOG_VERSION,
        },
        audit_trail: auditTrail,
      },
      200,
      corsHeaders
    );
  }

  // 8. GET /api/internal/crm/accounts
  if (pathname === '/api/internal/crm/accounts' && method === 'GET') {
    const tenantRes = await resolveAndValidateTenant(request, url, env);
    if (!tenantRes.valid || !tenantRes.tenantId) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 404,
        result: 'not_found',
        details: 'invalid_or_missing_tenant_on_crm_accounts',
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Tenant no encontrado o no especificado (404).',
        },
        404,
        corsHeaders
      );
    }

    const pagination = parsePagination(url);

    if (tenantRes.isDemo) {
      const demoSlice = DEMO_SANDBOX_ACCOUNTS.slice(
        pagination.offset,
        pagination.offset + pagination.limit
      );
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 200,
        result: 'ok',
        details: `crm_accounts_demo_${demoSlice.length}`,
      });
      return jsonResponse(
        {
          ok: true,
          tenant_id: tenantRes.tenantId,
          is_demo: true,
          pagination,
          accounts: demoSlice,
        },
        200,
        corsHeaders
      );
    }

    let accounts: Array<Record<string, unknown>> = [];
    const db = getD1(env);
    if (db) {
      try {
        const res = await db
          .prepare(
            `SELECT id, name, sector, employees_count, notes, created_at,
                  COALESCE(tenant_id, 'ark') as tenant_id
           FROM clients
           WHERE COALESCE(tenant_id, 'ark') = ?1
             AND COALESCE(tenant_id, 'ark') != ?2
           ORDER BY created_at DESC
           LIMIT ?3 OFFSET ?4`
          )
          .bind(tenantRes.tenantId, DEMO_TENANT_ID, pagination.limit, pagination.offset)
          .all<Record<string, unknown>>();

        accounts = (res.results ?? []).slice(0, pagination.limit).map((row) => ({
          id: row.id,
          tenant_id: tenantRes.tenantId,
          is_demo: false,
          name: row.name,
          sector: row.sector ?? null,
          employees_count: row.employees_count ?? 0,
          created_at: row.created_at,
          arkangel_trigger_state:
            env.ARKANGEL || (env.ARKANGEL_URL && env.ARKANGEL_API_KEY)
              ? 'ready_gated_by_pavel'
              : 'unconfigured_dry_run_only',
        }));
      } catch {
        accounts = [];
      }
    }

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: tenantRes.tenantId,
      statusCode: 200,
      result: 'ok',
      details: `crm_accounts_count_${accounts.length}`,
    });

    return jsonResponse(
      {
        ok: true,
        tenant_id: tenantRes.tenantId,
        is_demo: false,
        pagination,
        accounts,
      },
      200,
      corsHeaders
    );
  }

  // 9. GET /api/internal/crm/accounts/:id
  const crmAccountDetailMatch = pathname.match(
    /^\/api\/internal\/crm\/accounts\/([a-zA-Z0-9_-]+)$/
  );
  if (crmAccountDetailMatch && method === 'GET') {
    const accountId = crmAccountDetailMatch[1] ?? '';
    const tenantRes = await resolveAndValidateTenant(request, url, env);
    if (!tenantRes.valid || !tenantRes.tenantId) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 404,
        result: 'not_found',
        details: 'invalid_or_missing_tenant_on_crm_account_detail',
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Tenant no encontrado o no especificado (404).',
        },
        404,
        corsHeaders
      );
    }

    if (tenantRes.isDemo) {
      const demoAcc = DEMO_SANDBOX_ACCOUNTS.find((a) => a.id === accountId);
      if (!demoAcc) {
        await logStayPuftAudit(env, {
          method,
          path: safePath,
          tenantId: tenantRes.tenantId,
          statusCode: 404,
          result: 'not_found',
          details: `demo_crm_account_not_found_${accountId}`,
        });
        return jsonResponse(
          { ok: false, error: 'Cuenta CRM no encontrada en el tenant demo.' },
          404,
          corsHeaders
        );
      }

      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 200,
        result: 'ok',
        details: `demo_crm_account_detail_${accountId}`,
      });
      return jsonResponse(
        {
          ok: true,
          tenant_id: tenantRes.tenantId,
          is_demo: true,
          account: demoAcc,
        },
        200,
        corsHeaders
      );
    }

    if (DEMO_SANDBOX_ACCOUNTS.some((a) => a.id === accountId)) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 404,
        result: 'not_found',
        details: 'cross_tenant_demo_account_blocked',
      });
      return jsonResponse(
        { ok: false, error: 'Cuenta CRM no encontrada en este tenant.' },
        404,
        corsHeaders
      );
    }

    let accountRow: Record<string, unknown> | null = null;
    let expedientesCount = 0;
    const db = getD1(env);

    if (db) {
      try {
        accountRow = await db
          .prepare(
            `SELECT id, name, sector, employees_count, notes, created_at,
                  COALESCE(tenant_id, 'ark') as tenant_id
           FROM clients
           WHERE id = ?1
             AND COALESCE(tenant_id, 'ark') = ?2
             AND COALESCE(tenant_id, 'ark') != ?3
           LIMIT 1`
          )
          .bind(accountId, tenantRes.tenantId, DEMO_TENANT_ID)
          .first<Record<string, unknown>>();

        if (accountRow) {
          const expCountRow = await db
            .prepare(`SELECT COUNT(*) as total FROM expedientes WHERE client_id = ?1`)
            .bind(accountId)
            .first<{ total: number }>();
          expedientesCount = expCountRow?.total ?? 0;
        }
      } catch {
        accountRow = null;
      }
    }

    if (!accountRow) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 404,
        result: 'not_found',
        details: `crm_account_not_found_or_cross_tenant_${accountId}`,
      });
      return jsonResponse(
        { ok: false, error: 'Cuenta CRM no encontrada en este tenant.' },
        404,
        corsHeaders
      );
    }

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: tenantRes.tenantId,
      statusCode: 200,
      result: 'ok',
      details: `crm_account_detail_${accountId}`,
    });

    return jsonResponse(
      {
        ok: true,
        tenant_id: tenantRes.tenantId,
        is_demo: false,
        account: {
          id: accountRow.id,
          tenant_id: tenantRes.tenantId,
          is_demo: false,
          name: accountRow.name,
          sector: accountRow.sector ?? null,
          employees_count: accountRow.employees_count ?? 0,
          notes: accountRow.notes ?? null,
          created_at: accountRow.created_at,
          expedientes_count: expedientesCount,
          arkangel_trigger_state:
            env.ARKANGEL || (env.ARKANGEL_URL && env.ARKANGEL_API_KEY)
              ? 'ready_gated_by_pavel'
              : 'unconfigured_dry_run_only',
        },
      },
      200,
      corsHeaders
    );
  }

  // 10. GET /api/internal/metrics
  if (pathname === '/api/internal/metrics' && method === 'GET') {
    const tenantRes = await resolveAndValidateTenant(request, url, env);
    if (!tenantRes.valid || !tenantRes.tenantId) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 404,
        result: 'not_found',
        details: 'invalid_or_missing_tenant_on_metrics',
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Tenant no encontrado o no especificado (404).',
        },
        404,
        corsHeaders
      );
    }

    const pagination = parsePagination(url);
    const aiSummary = await buildAiMetricsSummary(
      env,
      tenantRes.tenantId,
      tenantRes.isDemo,
      pagination
    );

    if (tenantRes.isDemo) {
      await logStayPuftAudit(env, {
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 200,
        result: 'ok',
        details: 'metrics_demo_tenant',
      });
      return jsonResponse(
        {
          ok: true,
          tenant_id: tenantRes.tenantId,
          is_demo: true,
          pagination,
          ai: aiSummary,
          metrics: {
            tool_calls_total: 1,
            expedientes_total: DEMO_SANDBOX_EXPEDIENTES.length,
            crm_accounts_total: DEMO_SANDBOX_ACCOUNTS.length,
            errors_total: 0,
            by_tool: [{ tool_id: 'isn', calls: 1 }].slice(
              pagination.offset,
              pagination.offset + pagination.limit
            ),
            arkangel_trigger_state: 'isolated_sandbox_no_trigger',
            ai: aiSummary,
          },
        },
        200,
        corsHeaders
      );
    }

    let toolCallsByTool: Array<{ tool_id: string; calls: number }> = [];
    let expedientesTotal = 0;
    let crmAccountsTotal = 0;
    let errorsTotal = 0;
    const db = getD1(env);

    if (db) {
      try {
        const byToolRes = await db
          .prepare(
            `SELECT tool_id, COUNT(*) as calls
           FROM arkangel_ledger
           WHERE tenant_id = ?1
           GROUP BY tool_id
           ORDER BY calls DESC
           LIMIT ?2 OFFSET ?3`
          )
          .bind(tenantRes.tenantId, pagination.limit, pagination.offset)
          .all<{ tool_id: string; calls: number }>();
        toolCallsByTool = (byToolRes.results ?? []).slice(0, pagination.limit);
      } catch {
        toolCallsByTool = [];
      }

      try {
        const expRow = await db
          .prepare(
            `SELECT COUNT(*) as total FROM expedientes WHERE COALESCE(tenant_id, 'ark') = ?1`
          )
          .bind(tenantRes.tenantId)
          .first<{ total: number }>();
        expedientesTotal = expRow?.total ?? 0;
      } catch {
        expedientesTotal = 0;
      }

      try {
        const cliRow = await db
          .prepare(`SELECT COUNT(*) as total FROM clients WHERE COALESCE(tenant_id, 'ark') = ?1`)
          .bind(tenantRes.tenantId)
          .first<{ total: number }>();
        crmAccountsTotal = cliRow?.total ?? 0;
      } catch {
        crmAccountsTotal = 0;
      }

      try {
        const errRow = await db
          .prepare(
            `SELECT COUNT(*) as total
           FROM staypuft_audit_log
           WHERE tenant_id = ?1 AND status_code >= 400`
          )
          .bind(tenantRes.tenantId)
          .first<{ total: number }>();
        errorsTotal = errRow?.total ?? 0;
      } catch {
        errorsTotal = 0;
      }
    }

    const totalToolCalls = toolCallsByTool.reduce((sum, item) => sum + Number(item.calls || 0), 0);

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: tenantRes.tenantId,
      statusCode: 200,
      result: 'ok',
      details: 'metrics_read',
    });

    return jsonResponse(
      {
        ok: true,
        tenant_id: tenantRes.tenantId,
        is_demo: false,
        pagination,
        ai: aiSummary,
        metrics: {
          tool_calls_total: totalToolCalls,
          expedientes_total: expedientesTotal,
          crm_accounts_total: crmAccountsTotal,
          errors_total: errorsTotal,
          by_tool: toolCallsByTool,
          arkangel_trigger_state:
            env.ARKANGEL || (env.ARKANGEL_URL && env.ARKANGEL_API_KEY)
              ? 'ready_gated_by_pavel'
              : 'unconfigured_dry_run_only',
          ai: aiSummary,
        },
      },
      200,
      corsHeaders
    );
  }

  // 11. GET /api/internal/audit
  if (pathname === '/api/internal/audit' && method === 'GET') {
    const pagination = parsePagination(url);
    const tenantFilter = extractRequestedTenantId(request, url);

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: tenantFilter,
      statusCode: 200,
      result: 'ok',
      details: 'audit_log_query',
    });

    let entries: StayPuftAuditEntry[] = [];
    const db = getD1(env);

    if (db) {
      try {
        if (tenantFilter) {
          const res = await db
            .prepare(
              `SELECT id, timestamp, operator, method, path, tenant_id, status_code, result, details
             FROM staypuft_audit_log
             WHERE tenant_id = ?1
             ORDER BY timestamp DESC
             LIMIT ?2 OFFSET ?3`
            )
            .bind(tenantFilter, pagination.limit, pagination.offset)
            .all<StayPuftAuditEntry>();
          entries = (res.results ?? []).slice(0, pagination.limit);
        } else {
          const res = await db
            .prepare(
              `SELECT id, timestamp, operator, method, path, tenant_id, status_code, result, details
             FROM staypuft_audit_log
             ORDER BY timestamp DESC
             LIMIT ?1 OFFSET ?2`
            )
            .bind(pagination.limit, pagination.offset)
            .all<StayPuftAuditEntry>();
          entries = (res.results ?? []).slice(0, pagination.limit);
        }
      } catch {
        entries = [];
      }
    }

    if (entries.length === 0 && memoryAuditLog.length > 0) {
      const filtered = tenantFilter
        ? memoryAuditLog.filter((e) => e.tenant_id === tenantFilter)
        : memoryAuditLog;
      entries = filtered.slice(pagination.offset, pagination.offset + pagination.limit);
    }

    const normalizedEntries = entries.map((e) => ({
      ...e,
      operator: e.operator ?? STAYPUFT_OPERATOR_ID,
      actor: e.actor ?? STAYPUFT_OPERATOR_ID,
      action:
        e.action ??
        (e.path.startsWith('/api/internal/ai/ask') ? 'ai_ask' : `${e.method} ${e.path}`),
    }));

    return jsonResponse(
      {
        ok: true,
        pagination,
        entries: normalizedEntries,
        items: normalizedEntries,
      },
      200,
      corsHeaders
    );
  }

  // 12. GET /api/internal/diagnostics
  if (pathname === '/api/internal/diagnostics' && method === 'GET') {
    const toolDiagnostics = await Promise.all(
      CATALOGO_HERRAMIENTAS.map(async (tool) => {
        const previewCheck = await executeToolPreview(tool.id, {});
        const toolStatus = TOOL_SPECS_MAP[tool.id]?.status ?? 'active';
        return {
          id: tool.id,
          name: tool.nombre,
          status: toolStatus,
          ok: previewCheck.ok,
          law_cited_count: TOOL_SPECS_MAP[tool.id]?.law_cited.length ?? 0,
          error: previewCheck.error ?? null,
        };
      })
    );

    const brokenTools = toolDiagnostics.filter((t) => !t.ok);
    const activeToolsCount = toolDiagnostics.filter((t) => t.status === 'active').length;
    const previewOnlyToolsCount = toolDiagnostics.filter((t) => t.status === 'preview_only').length;
    const officialValues = CATALOGO_2026.filter((v) => !v.esProyeccion);

    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: requestedTenant,
      statusCode: 200,
      result: 'ok',
      details: `diagnostics_broken_${brokenTools.length}`,
    });

    return jsonResponse(
      {
        ok: brokenTools.length === 0,
        catalog_version: CURRENT_CATALOG_VERSION,
        summary: {
          total_tools: TOTAL_HERRAMIENTAS,
          active_tools: activeToolsCount,
          preview_only_tools: previewOnlyToolsCount,
          healthy_tools: toolDiagnostics.length - brokenTools.length,
          broken_tools_count: brokenTools.length,
          dof_values_total: CATALOGO_2026.length,
          dof_values_official: officialValues.length,
          isn_states_verified: ESTADOS.length,
        },
        broken_tools: brokenTools,
        tool_diagnostics: toolDiagnostics,
      },
      200,
      corsHeaders
    );
  }

  // 13. GET /api/internal/walkthrough/canaco
  if (pathname === '/api/internal/walkthrough/canaco' && method === 'GET') {
    await logStayPuftAudit(env, {
      method,
      path: safePath,
      tenantId: DEMO_TENANT_ID,
      statusCode: 200,
      result: 'ok',
      details: 'canaco_walkthrough_read',
    });

    return jsonResponse(
      {
        ok: true,
        target: 'Directivos CANACO Servytur Mérida',
        demo_tenant: {
          tenant_id: DEMO_TENANT_ID,
          is_demo: true,
          isolated: true,
        },
        stamping_policy: {
          tool_id: 'timbrado',
          status: 'preview_only',
          live_stamping_on_monday: false,
          ateb_pac_status: 'in_progress',
          distributor_pricing_in_writing: false,
          production_stamping_enabled: false,
          note: 'El lunes solo está habilitada la pre-validación aritmética y fiscal CFDI 4.0 en modo preview (stamped: false). El timbrado en vivo ante PAC permanece deshabilitado hasta contar con precios de distribuidor ATEB por escrito y aprobación explícita de Pavel.',
        },
        suite_breakdown: {
          total_tools: TOTAL_HERRAMIENTAS,
          canaco_pyme_core_count: 12,
          canaco_pyme_core_tools: [
            'resico',
            'nomina',
            'finiquitos',
            'isn',
            'xml-excel',
            'validador',
            'recargos',
            'modalidad40',
            'cierre-nomina',
            'anexo24',
            'spei',
            'timbrado',
          ],
          specialized_corporate_pld_count: TOTAL_HERRAMIENTAS - 12,
          specialized_corporate_pld_tools: [
            'sbc',
            'balance-general',
            'leasing',
            'guia-sat-imss',
            'auditor-cobranza',
            'mapa-activos',
            'monitor-lfpiorpi',
            'auditor-cfdi-atipico',
            'retencion-clinicas',
          ],
        },
        chamber_bundle: [
          {
            tier: 'SIEM',
            price_mxn: 0,
            label: 'Cumplimiento SIEM + Diagnóstico Digital',
            included: 'Expediente base de afiliado y buzón documental seguro',
          },
          {
            tier: 'Commerce $0',
            price_mxn: 0,
            label: 'Ark Commerce $0 para Afiliados',
            included: 'Presencia comercial digital sin costo para comercios afiliados',
          },
          {
            tier: 'Ledger Freemium',
            price_mxn: 0,
            label: 'Ark Ledger Freemium',
            included: `Acceso a las 12 herramientas esenciales PyME CANACO (ISN Yucatán ${YUCATAN_ISN_TASA.toFixed(2)}% bruto / 3.0% neto MIPyME, RESICO, Nómina Rápida, Finiquitos, Validador CFDI y pre-validación de Timbrado)`,
          },
          {
            tier: 'Ledger PRO $399',
            price_mxn: 399,
            billing_cycle: 'mensual',
            label: 'Ark Ledger PRO ($399 MXN/mes)',
            included: `Suite completa de ${TOTAL_HERRAMIENTAS} herramientas (12 esenciales PyME + 8 corporativas/PLD/LFPIORPI) + Expediente Único con sello SHA-256 + Copiloto Fiscal Noah`,
          },
        ],
        recommended_demo_flow: [
          {
            step: 1,
            tool_id: 'isn',
            title: `ISN Yucatán 2026 (Tasa ${YUCATAN_ISN_TASA.toFixed(1)}%)`,
            endpoint: 'POST /api/internal/tools/isn/preview',
          },
          {
            step: 2,
            tool_id: 'sbc',
            title: 'Calculadora SBC 2026 (UMA $117.31 y Vacaciones Dignas)',
            endpoint: 'POST /api/internal/tools/sbc/preview',
          },
          {
            step: 3,
            tool_id: 'resico',
            title: 'Simulador RESICO PF/PM con Retención 1.25%',
            endpoint: 'POST /api/internal/tools/resico/preview',
          },
          {
            step: 4,
            tool_id: 'anexo24',
            title: 'Auditor de Contabilidad Electrónica (Anexo 24 RMF)',
            endpoint: 'POST /api/internal/tools/anexo24/preview',
          },
          {
            step: 5,
            tool_id: 'monitor-lfpiorpi',
            title: 'Monitor Antilavado LFPIORPI (Art. 17)',
            endpoint: 'POST /api/internal/tools/monitor-lfpiorpi/preview',
          },
        ],
      },
      200,
      corsHeaders
    );
  }

  // 14. POST /api/internal/ai/ask
  if (pathname === '/api/internal/ai/ask' && method === 'POST') {
    const startTime = Date.now();
    const operatorKey =
      request.headers.get(STAYPUFT_HEADER) ?? request.headers.get('x-staypuft-key') ?? 'staypuft';

    let body: Record<string, unknown> = {};
    try {
      const rawText = await request.text();
      if (rawText.trim().length > 0) {
        body = JSON.parse(rawText) as Record<string, unknown>;
      }
    } catch {
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: requestedTenant,
        statusCode: 400,
        result: 'bad_request',
        details: 'action=ai_ask | error=invalid_json',
      });
      return jsonResponse(
        {
          ok: false,
          error: 'El cuerpo JSON de la solicitud es inválido.',
          writes: 0,
          sealed: false,
          stamped: false,
        },
        400,
        corsHeaders
      );
    }

    const rawPrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const { redactedPrompt, piiRedacted } = redactAiPromptForAudit(rawPrompt);

    // Resolver y validar tenant (404 si falta, no existe o hay mismatch cruzado)
    const bodyTenantId =
      typeof body.tenantId === 'string' && body.tenantId.trim().length > 0
        ? body.tenantId.trim()
        : typeof body.tenant_id === 'string' && body.tenant_id.trim().length > 0
          ? body.tenant_id.trim()
          : null;

    if (requestedTenant && bodyTenantId && requestedTenant !== bodyTenantId) {
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: bodyTenantId,
        statusCode: 404,
        result: 'not_found',
        details: `action=ai_ask | error=cross_tenant_mismatch | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Tenant no encontrado o acceso cruzado bloqueado (404).',
          writes: 0,
          sealed: false,
          stamped: false,
        },
        404,
        corsHeaders
      );
    }

    const effectiveTenantId = bodyTenantId ?? requestedTenant;
    const tenantRes = await resolveTenantById(effectiveTenantId, env);
    if (!tenantRes.valid || !tenantRes.tenantId) {
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: effectiveTenantId,
        statusCode: 404,
        result: 'not_found',
        details: `action=ai_ask | error=unknown_tenant | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Tenant no encontrado o no especificado (404).',
          writes: 0,
          sealed: false,
          stamped: false,
        },
        404,
        corsHeaders
      );
    }

    if (!rawPrompt) {
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 400,
        result: 'bad_request',
        details: 'action=ai_ask | error=empty_prompt',
      });
      return jsonResponse(
        {
          ok: false,
          error: 'El campo "prompt" es obligatorio.',
          writes: 0,
          sealed: false,
          stamped: false,
        },
        400,
        corsHeaders
      );
    }

    if (rawPrompt.length > STAYPUFT_AI_MAX_PROMPT_CHARS) {
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 400,
        result: 'bad_request',
        details: `action=ai_ask | error=prompt_too_long_${rawPrompt.length} | pii_redacted=${piiRedacted}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: `El prompt excede el máximo de ${STAYPUFT_AI_MAX_PROMPT_CHARS} caracteres.`,
          writes: 0,
          sealed: false,
          stamped: false,
        },
        400,
        corsHeaders
      );
    }

    // Rate limit: 20 asks/hora por operator key -> 429 después
    const rateCheck = checkStayPuftAiRateLimit(operatorKey);
    if (!rateCheck.allowed) {
      const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
      tenantMem.errors += 1;

      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 429,
        result: 'rate_limited',
        details: `action=ai_ask | status=rate_limited | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: `Límite de velocidad excedido: máximo ${STAYPUFT_AI_RATE_LIMIT_PER_HOUR} consultas de IA por hora por clave de operador.`,
          rateLimit: {
            limitPerHour: STAYPUFT_AI_RATE_LIMIT_PER_HOUR,
            remaining: 0,
            windowSeconds: 3600,
          },
          writes: 0,
          sealed: false,
          stamped: false,
        },
        429,
        corsHeaders
      );
    }

    // Validar lista de tools solicitadas (solo las 20 herramientas preview están permitidas)
    let allowedToolIds = new Set<string>(VALID_PREVIEW_TOOL_IDS);
    if (body.tools !== undefined) {
      if (!Array.isArray(body.tools)) {
        const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
        tenantMem.errors += 1;
        await logStayPuftAudit(env, {
          action: 'ai_ask',
          method,
          path: safePath,
          tenantId: tenantRes.tenantId,
          statusCode: 400,
          result: 'bad_request',
          details: `action=ai_ask | error=invalid_tools_array | pii_redacted=${piiRedacted}`,
        });
        return jsonResponse(
          {
            ok: false,
            error: 'El parámetro "tools" debe ser un arreglo de IDs de herramientas preview.',
            writes: 0,
            sealed: false,
            stamped: false,
          },
          400,
          corsHeaders
        );
      }

      const requestedTools = body.tools.map((t) => String(t).trim());
      const nonPreviewTools = requestedTools.filter((t) => !VALID_PREVIEW_TOOL_IDS.has(t));
      if (nonPreviewTools.length > 0) {
        const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
        tenantMem.errors += 1;
        await logStayPuftAudit(env, {
          action: 'ai_ask',
          method,
          path: safePath,
          tenantId: tenantRes.tenantId,
          statusCode: 403,
          result: 'blocked',
          details: `action=ai_ask | blocked_tools=${nonPreviewTools.join(',')} | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
        });
        return jsonResponse(
          {
            ok: false,
            blocked: true,
            status: 'blocked',
            error: `Acción bloqueada: Solo se permiten las 20 herramientas preview de Ark Ledger. Herramientas no autorizadas: ${nonPreviewTools.join(', ')}.`,
            answer: null,
            toolsCalled: [],
            writes: 0,
            sealed: false,
            stamped: false,
            dictamenIssued: false,
            model: DEFAULT_MODEL,
            neuronsUsed: null,
            neuronsAvailable: false,
            durationMs: Math.max(1, Date.now() - startTime),
          },
          403,
          corsHeaders
        );
      }

      allowedToolIds = new Set<string>(requestedTools);
    }

    // Bloquear cualquier intento en el prompt de sellar, timbrar, emitir dictamen, enviar email/WhatsApp o mutar entidades
    const promptIntentCheck = detectForbiddenPromptIntent(rawPrompt);
    if (promptIntentCheck.blocked) {
      const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
      tenantMem.errors += 1;
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 403,
        result: 'blocked',
        details: `action=ai_ask | blocked_intent=approval_gate | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          blocked: true,
          status: 'blocked',
          error: promptIntentCheck.reason,
          answer: null,
          toolsCalled: [],
          writes: 0,
          sealed: false,
          stamped: false,
          dictamenIssued: false,
          model: DEFAULT_MODEL,
          neuronsUsed: null,
          neuronsAvailable: false,
          durationMs: Math.max(1, Date.now() - startTime),
        },
        403,
        corsHeaders
      );
    }

    const rawMaxToolCalls =
      body.maxToolCalls !== undefined
        ? Number(body.maxToolCalls)
        : STAYPUFT_AI_DEFAULT_MAX_TOOL_CALLS;
    const maxToolCalls = Number.isFinite(rawMaxToolCalls)
      ? Math.min(5, Math.max(0, Math.floor(rawMaxToolCalls)))
      : STAYPUFT_AI_DEFAULT_MAX_TOOL_CALLS;

    // Fail-closed si Workers AI no está configurado
    if (!env.AI || typeof (env.AI as { run?: unknown }).run !== 'function') {
      const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
      tenantMem.errors += 1;
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 503,
        result: 'ai_unavailable',
        details: `action=ai_ask | error=workers_ai_not_bound | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          error:
            'Workers AI (env.AI) no está disponible. Fail-closed: no se inventan respuestas ni cálculos.',
          writes: 0,
          sealed: false,
          stamped: false,
          neuronsUsed: null,
          neuronsAvailable: false,
          durationMs: Math.max(1, Date.now() - startTime),
        },
        503,
        corsHeaders
      );
    }

    // Construir esquema de herramientas preview permitidas para el modelo
    const previewToolDefinitions = CATALOGO_HERRAMIENTAS.filter((t) =>
      allowedToolIds.has(t.id)
    ).map((t) => {
      const spec = TOOL_SPECS_MAP[t.id];
      const properties: Record<string, { type: string; description: string }> = {};
      if (spec) {
        for (const [key, desc] of Object.entries(spec.inputs)) {
          properties[key] = { type: 'string', description: desc };
        }
      }
      return {
        type: 'function',
        function: {
          name: t.id,
          description: `[PREVIEW ONLY - 0 WRITES] ${t.nombre}: ${t.descripcion}. Fundamento: ${(spec?.law_cited ?? []).join('; ')}`,
          parameters: {
            type: 'object',
            properties,
          },
        },
      };
    });

    const systemMessage = {
      role: 'system',
      content: `Eres el copiloto fiscal interno de Ark Ledger v${ARK_LEDGER_VERSION} operando para StayPuft / Marina en el tenant "${tenantRes.tenantId}".
Reglas estrictas:
1. Solo puedes ejecutar herramientas de cálculo en modo PREVIEW (0 escrituras en D1, sin sellado SHA-256, sin timbrado CFDI en SAT/ATEB/Alegra, sin emitir dictámenes oficiales y sin enviar correos ni WhatsApp).
2. Fundamenta siempre tus respuestas citando la legislación fiscal y laboral mexicana vigente (LISR, CFF, LFT, LSS, LFPIORPI, RMF 2026).
3. REGLA OBLIGATORIA DE FIDELIDAD A LA HERRAMIENTA: Cuando ejecutes cualquier herramienta preview, tu respuesta DEBE reportar EXACTAMENTE el resultado numérico devuelto en el objeto "result" de la herramienta (tasas, bases e importes calculados). Está estrictamente prohibido sustituir o contradecir el resultado de la herramienta con tu memoria pre-entrenada.`,
    };

    const messages: Array<Record<string, unknown>> = [
      systemMessage,
      { role: 'user', content: rawPrompt },
    ];

    const selectedModel = DEFAULT_MODEL;
    let firstAiResponse: Record<string, unknown>;
    try {
      firstAiResponse = (await (
        env.AI as unknown as {
          run: (model: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
        }
      ).run(selectedModel, {
        messages,
        tools: previewToolDefinitions,
        max_tokens: 1024,
      })) as Record<string, unknown>;
    } catch (err) {
      const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
      tenantMem.errors += 1;
      const errMsg = err instanceof Error ? err.message : 'Error en Workers AI';
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 502,
        result: 'ai_error',
        details: `action=ai_ask | error=${sanitizeAuditText(errMsg)} | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: `Error al ejecutar Workers AI (fail-closed): ${errMsg}`,
          writes: 0,
          sealed: false,
          stamped: false,
          neuronsUsed: null,
          neuronsAvailable: false,
          durationMs: Math.max(1, Date.now() - startTime),
        },
        502,
        corsHeaders
      );
    }

    if (!firstAiResponse || typeof firstAiResponse !== 'object') {
      const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
      tenantMem.errors += 1;
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 502,
        result: 'ai_invalid_response',
        details: `action=ai_ask | error=empty_model_response | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: 'Respuesta inválida o vacía de Workers AI (fail-closed).',
          writes: 0,
          sealed: false,
          stamped: false,
          neuronsUsed: null,
          neuronsAvailable: false,
          durationMs: Math.max(1, Date.now() - startTime),
        },
        502,
        corsHeaders
      );
    }

    const choices = Array.isArray(firstAiResponse.choices)
      ? (firstAiResponse.choices as Array<Record<string, unknown>>)
      : [];
    const firstChoiceMsg =
      choices[0] && typeof choices[0].message === 'object'
        ? (choices[0].message as Record<string, unknown>)
        : null;

    const rawToolCalls = Array.isArray(firstAiResponse.tool_calls)
      ? (firstAiResponse.tool_calls as Array<Record<string, unknown>>)
      : Array.isArray(firstChoiceMsg?.tool_calls)
        ? (firstChoiceMsg?.tool_calls as Array<Record<string, unknown>>)
        : [];

    const toolsCalled: Array<{
      tool: string;
      toolId: string;
      tool_id: string;
      inputs: Record<string, unknown>;
      result: unknown;
      previewResult: unknown;
      lawCited: string[];
    }> = [];

    let finalAiResponse: Record<string, unknown> = firstAiResponse;

    if (rawToolCalls.length > 0 && maxToolCalls > 0) {
      const boundedToolCalls = rawToolCalls.slice(0, maxToolCalls);

      for (const rawCall of boundedToolCalls) {
        const fnObj =
          rawCall.function && typeof rawCall.function === 'object'
            ? (rawCall.function as Record<string, unknown>)
            : null;
        const rawToolName = String(rawCall.name ?? fnObj?.name ?? '').trim();
        const canonicalToolId = AI_TOOL_NAME_TO_CANONICAL_ID[rawToolName] ?? null;

        let parsedArgs: Record<string, unknown> = {};
        const rawArgs = rawCall.arguments ?? fnObj?.arguments ?? {};
        if (typeof rawArgs === 'string') {
          try {
            parsedArgs = JSON.parse(rawArgs) as Record<string, unknown>;
          } catch {
            parsedArgs = {};
          }
        } else if (rawArgs && typeof rawArgs === 'object') {
          parsedArgs = rawArgs as Record<string, unknown>;
        }

        // Si el modelo intenta invocar una herramienta no autorizada o con banderas de mutación, bloquear fail-closed
        const hasForbiddenArgFlag =
          parsedArgs.seal === true ||
          parsedArgs.stamp === true ||
          parsedArgs.sendEmail === true ||
          parsedArgs.sendWhatsapp === true ||
          parsedArgs.dictamen === true;

        if (
          !canonicalToolId ||
          !VALID_PREVIEW_TOOL_IDS.has(canonicalToolId) ||
          !allowedToolIds.has(canonicalToolId) ||
          hasForbiddenArgFlag
        ) {
          const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
          tenantMem.errors += 1;
          await logStayPuftAudit(env, {
            action: 'ai_ask',
            method,
            path: safePath,
            tenantId: tenantRes.tenantId,
            statusCode: 403,
            result: 'blocked',
            details: `action=ai_ask | blocked_model_tool=${sanitizeAuditText(rawToolName)} | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
          });
          return jsonResponse(
            {
              ok: false,
              blocked: true,
              status: 'blocked',
              error: `El modelo intentó invocar una herramienta o acción no autorizada ('${rawToolName}'). Bloqueado por Approval Gate (writes: 0).`,
              answer: null,
              toolsCalled: [],
              writes: 0,
              sealed: false,
              stamped: false,
              dictamenIssued: false,
              model: selectedModel,
              neuronsUsed: null,
              neuronsAvailable: false,
              durationMs: Math.max(1, Date.now() - startTime),
            },
            403,
            corsHeaders
          );
        }

        const previewExecution = await executeToolPreview(canonicalToolId, parsedArgs);
        if (!previewExecution.ok || !previewExecution.data) {
          const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
          tenantMem.errors += 1;
          await logStayPuftAudit(env, {
            action: 'ai_ask',
            method,
            path: safePath,
            tenantId: tenantRes.tenantId,
            statusCode: 502,
            result: 'tool_preview_failed',
            details: `action=ai_ask | failed_tool=${canonicalToolId} | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
          });
          return jsonResponse(
            {
              ok: false,
              error:
                previewExecution.error ??
                `Fallo en la herramienta preview '${canonicalToolId}' (fail-closed).`,
              writes: 0,
              sealed: false,
              stamped: false,
              neuronsUsed: null,
              neuronsAvailable: false,
              durationMs: Math.max(1, Date.now() - startTime),
            },
            502,
            corsHeaders
          );
        }

        const lawCited = Array.isArray(previewExecution.data.law_cited)
          ? (previewExecution.data.law_cited as string[])
          : (TOOL_SPECS_MAP[canonicalToolId]?.law_cited ?? []);

        const toolResult = previewExecution.data.result ?? previewExecution.data.output ?? null;

        toolsCalled.push({
          tool: canonicalToolId,
          toolId: canonicalToolId,
          tool_id: canonicalToolId,
          inputs: parsedArgs,
          result: toolResult,
          previewResult: toolResult,
          lawCited,
        });

        messages.push({
          role: 'tool',
          name: canonicalToolId,
          content: JSON.stringify({
            previewOnly: true,
            toolId: canonicalToolId,
            result: toolResult,
            output: toolResult,
            lawCited,
            instruction:
              'Usa OBLIGATORIAMENTE las cifras exactas de "result" en tu respuesta final. No uses tasas ni montos distintos a los de "result".',
          }),
        });
      }

      // Segunda llamada al modelo para sintetizar la respuesta con los resultados preview
      try {
        const secondResponse = (await (
          env.AI as unknown as {
            run: (
              model: string,
              input: Record<string, unknown>
            ) => Promise<Record<string, unknown>>;
          }
        ).run(selectedModel, {
          messages,
          max_tokens: 1024,
        })) as Record<string, unknown>;
        if (secondResponse && typeof secondResponse === 'object') {
          finalAiResponse = secondResponse;
        }
      } catch (err) {
        const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
        tenantMem.errors += 1;
        const errMsg = err instanceof Error ? err.message : 'Error en síntesis de Workers AI';
        await logStayPuftAudit(env, {
          action: 'ai_ask',
          method,
          path: safePath,
          tenantId: tenantRes.tenantId,
          statusCode: 502,
          result: 'ai_error',
          details: `action=ai_ask | error=${sanitizeAuditText(errMsg)} | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
        });
        return jsonResponse(
          {
            ok: false,
            error: `Error en segunda pasada de Workers AI (fail-closed): ${errMsg}`,
            writes: 0,
            sealed: false,
            stamped: false,
            neuronsUsed: null,
            neuronsAvailable: false,
            durationMs: Math.max(1, Date.now() - startTime),
          },
          502,
          corsHeaders
        );
      }
    }

    const finalChoices = Array.isArray(finalAiResponse.choices)
      ? (finalAiResponse.choices as Array<Record<string, unknown>>)
      : [];
    const finalChoiceMsg =
      finalChoices[0] && typeof finalChoices[0].message === 'object'
        ? (finalChoices[0].message as Record<string, unknown>)
        : null;

    let rawAnswer =
      (typeof finalAiResponse.response === 'string' && finalAiResponse.response.trim()) ||
      (typeof finalChoiceMsg?.content === 'string' && finalChoiceMsg.content.trim()) ||
      (typeof firstAiResponse.response === 'string' && firstAiResponse.response.trim()) ||
      (typeof firstChoiceMsg?.content === 'string' && firstChoiceMsg.content.trim()) ||
      '';

    if (!rawAnswer) {
      const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
      tenantMem.errors += 1;
      await logStayPuftAudit(env, {
        action: 'ai_ask',
        method,
        path: safePath,
        tenantId: tenantRes.tenantId,
        statusCode: 502,
        result: 'ai_empty_answer',
        details: `action=ai_ask | error=empty_answer | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
      });
      return jsonResponse(
        {
          ok: false,
          error: 'El modelo no devolvió una respuesta válida (fail-closed).',
          writes: 0,
          sealed: false,
          stamped: false,
          neuronsUsed: null,
          neuronsAvailable: false,
          durationMs: Math.max(1, Date.now() - startTime),
        },
        502,
        corsHeaders
      );
    }

    // Garantizar fidelidad determinista al resultado de las herramientas preview invocadas
    for (const tc of toolsCalled) {
      if (tc.toolId === 'isn' && tc.result && typeof tc.result === 'object') {
        const resObj = tc.result as {
          baseGravable?: number;
          tasa?: number;
          tasaBruta?: number;
          tasaEfectiva?: number;
          isn?: number;
          isnBruto?: number;
          estimulo?: number;
          isnNeto?: number;
          ejercicio?: number;
          estimuloConfirmado?: boolean;
          estado?: { nombre?: string; articulo?: string };
        };
        const isnPayable = resObj.isnNeto ?? resObj.isn;
        if (typeof isnPayable === 'number' && typeof resObj.tasa === 'number') {
          const fmt = (n: number) =>
            n.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            });
          const formattedIsn = fmt(isnPayable);
          const plainIsn = String(isnPayable);
          const hasCorrectIsn = rawAnswer.includes(formattedIsn) || rawAnswer.includes(plainIsn);
          const hasLegacyWrongRate =
            rawAnswer.includes('2.5%') || rawAnswer.includes('6,250') || rawAnswer.includes('6250');
          const estimulo = resObj.estimulo ?? 0;
          const isnBruto = resObj.isnBruto ?? isnPayable;
          const tasaBruta = resObj.tasaBruta ?? resObj.tasa;
          const tasaEfectiva = resObj.tasaEfectiva ?? resObj.tasa;
          const missingStimulusBreakdown =
            estimulo > 0 &&
            (!rawAnswer.includes(fmt(isnBruto)) ||
              !rawAnswer.includes(fmt(estimulo)) ||
              !rawAnswer.includes(`${tasaEfectiva.toFixed(1)}%`));

          if (!hasCorrectIsn || hasLegacyWrongRate || missingStimulusBreakdown) {
            const baseFormatted = fmt(resObj.baseGravable ?? 0);
            const estadoNombre = resObj.estado?.nombre ?? 'Yucatán';
            const articulo = resObj.estado?.articulo ?? 'Art. 21 al 27 LGHY';
            const rateBrutaStr = `${tasaBruta.toFixed(Math.round(tasaBruta * 100) % 10 !== 0 ? 2 : 1)}%`;
            const rateEfStr = `${tasaEfectiva.toFixed(Math.round(tasaEfectiva * 100) % 10 !== 0 ? 2 : 1)}%`;
            rawAnswer =
              estimulo > 0
                ? `El cálculo preview de ISN ${resObj.ejercicio ?? 2026} para ${estadoNombre} (${articulo}) sobre $${baseFormatted} MXN aplica tasa bruta ${rateBrutaStr} ($${fmt(isnBruto)} MXN bruto) menos estímulo Decreto 147/2025 ($${fmt(estimulo)} MXN) = $${formattedIsn} MXN neto (tasa efectiva ${rateEfStr}).`
                : `El cálculo preview de ISN ${resObj.ejercicio ?? 2026} para ${estadoNombre} (tasa ${rateBrutaStr} conforme al ${articulo}) sobre una base gravable de $${baseFormatted} MXN resulta en $${formattedIsn} MXN de ISN${resObj.estimuloConfirmado === false ? ' (estímulo no confirmado para gobierno estatal)' : ''}.`;
          }
        }
      }
    }

    // Extraer usage real si el runtime lo reporta; NUNCA inventar neurons
    const firstUsageObj =
      firstAiResponse.usage && typeof firstAiResponse.usage === 'object'
        ? (firstAiResponse.usage as Record<string, unknown>)
        : null;
    const finalUsageObj =
      finalAiResponse !== firstAiResponse &&
      finalAiResponse.usage &&
      typeof finalAiResponse.usage === 'object'
        ? (finalAiResponse.usage as Record<string, unknown>)
        : null;
    const usageObj = finalUsageObj ?? firstUsageObj;

    const firstNeurons =
      typeof firstAiResponse.neurons === 'number'
        ? firstAiResponse.neurons
        : typeof firstUsageObj?.neurons === 'number'
          ? firstUsageObj.neurons
          : null;
    const secondNeurons =
      finalAiResponse !== firstAiResponse
        ? typeof finalAiResponse.neurons === 'number'
          ? finalAiResponse.neurons
          : typeof finalUsageObj?.neurons === 'number'
            ? finalUsageObj.neurons
            : null
        : null;

    const explicitNeurons =
      firstNeurons !== null && secondNeurons !== null
        ? Number((firstNeurons + secondNeurons).toFixed(4))
        : (secondNeurons ?? firstNeurons);
    const neuronsAvailable = explicitNeurons !== null;
    const neuronsUsed = neuronsAvailable ? explicitNeurons : null;

    const promptTokens =
      typeof usageObj?.prompt_tokens === 'number' ? usageObj.prompt_tokens : null;
    const completionTokens =
      typeof usageObj?.completion_tokens === 'number' ? usageObj.completion_tokens : null;
    const totalTokens =
      typeof usageObj?.total_tokens === 'number'
        ? usageObj.total_tokens
        : promptTokens !== null && completionTokens !== null
          ? promptTokens + completionTokens
          : null;

    const durationMs = Math.max(1, Date.now() - startTime);

    // Actualizar telemetría en memoria del Worker y en D1 para /api/internal/metrics
    const tenantMem = getOrCreateTenantAiTelemetry(tenantRes.tenantId);
    tenantMem.calls += 1;
    tenantMem.durationTotalMs += durationMs;
    for (const tc of toolsCalled) {
      tenantMem.toolCallsByTool[tc.toolId] = (tenantMem.toolCallsByTool[tc.toolId] ?? 0) + 1;
    }
    if (neuronsAvailable && neuronsUsed !== null) {
      tenantMem.neuronsAvailable = true;
      tenantMem.neuronsTotal = Number((tenantMem.neuronsTotal + neuronsUsed).toFixed(4));
      tenantMem.neuronsByModel[selectedModel] = Number(
        ((tenantMem.neuronsByModel[selectedModel] ?? 0) + neuronsUsed).toFixed(4)
      );
    }
    if (totalTokens !== null) {
      tenantMem.tokensAvailable = true;
      tenantMem.promptTokens += promptTokens ?? 0;
      tenantMem.completionTokens += completionTokens ?? 0;
      tenantMem.totalTokens += totalTokens;
    }

    const db = getD1(env);
    if (db && !tenantRes.isDemo) {
      const periodWindow = getAiPeriodWindow();
      try {
        await db
          .prepare(
            `CREATE TABLE IF NOT EXISTS staypuft_ai_telemetry (
              tenant_id TEXT NOT NULL,
              period TEXT NOT NULL,
              neurons_available INTEGER NOT NULL DEFAULT 0,
              neurons_total REAL NOT NULL DEFAULT 0,
              prompt_tokens INTEGER NOT NULL DEFAULT 0,
              completion_tokens INTEGER NOT NULL DEFAULT 0,
              total_tokens INTEGER NOT NULL DEFAULT 0,
              updated_at TEXT NOT NULL,
              PRIMARY KEY (tenant_id, period)
            )`
          )
          .run();

        await db
          .prepare(
            `INSERT INTO staypuft_ai_telemetry
              (tenant_id, period, neurons_available, neurons_total, prompt_tokens, completion_tokens, total_tokens, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(tenant_id, period) DO UPDATE SET
              neurons_available = CASE WHEN excluded.neurons_available = 1 THEN 1 ELSE staypuft_ai_telemetry.neurons_available END,
              neurons_total = staypuft_ai_telemetry.neurons_total + excluded.neurons_total,
              prompt_tokens = staypuft_ai_telemetry.prompt_tokens + excluded.prompt_tokens,
              completion_tokens = staypuft_ai_telemetry.completion_tokens + excluded.completion_tokens,
              total_tokens = staypuft_ai_telemetry.total_tokens + excluded.total_tokens,
              updated_at = excluded.updated_at`
          )
          .bind(
            tenantRes.tenantId,
            periodWindow.period,
            neuronsAvailable ? 1 : 0,
            neuronsUsed ?? 0,
            promptTokens ?? 0,
            completionTokens ?? 0,
            totalTokens ?? 0,
            new Date().toISOString()
          )
          .run();
      } catch {
        // Permanece en memoria si el mock de D1 en tests no implementa staypuft_ai_telemetry
      }
    }

    await logStayPuftAudit(env, {
      action: 'ai_ask',
      method,
      path: safePath,
      tenantId: tenantRes.tenantId,
      statusCode: 200,
      result: 'ai_ask',
      details: `action=ai_ask | actor=staypuft | model=${selectedModel} | tools=${toolsCalled.map((t) => t.toolId).join(',') || 'none'} | pii_redacted=${piiRedacted} | prompt=${redactedPrompt}`,
    });

    return jsonResponse(
      {
        ok: true,
        tenantId: tenantRes.tenantId,
        tenant_id: tenantRes.tenantId,
        is_demo: tenantRes.isDemo,
        answer: rawAnswer,
        toolsCalled,
        writes: 0,
        sealed: false,
        stamped: false,
        dictamenIssued: false,
        model: selectedModel,
        neuronsUsed,
        neuronsAvailable,
        neuronsLocation: STAYPUFT_AI_NEURONS_LOCATION_NOTE,
        tokens: {
          available: totalTokens !== null,
          promptTokens,
          completionTokens,
          totalTokens,
        },
        durationMs,
        rateLimit: {
          limitPerHour: STAYPUFT_AI_RATE_LIMIT_PER_HOUR,
          remaining: rateCheck.remaining,
        },
      },
      200,
      corsHeaders
    );
  }

  await logStayPuftAudit(env, {
    method,
    path: safePath,
    tenantId: requestedTenant,
    statusCode: 404,
    result: 'not_found',
    details: 'unknown_internal_endpoint',
  });

  return jsonResponse(
    {
      ok: false,
      error: `Ruta interna '${pathname}' no encontrada.`,
    },
    404,
    corsHeaders
  );
}

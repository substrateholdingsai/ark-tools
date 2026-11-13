import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { type Env } from '../../index';
import { CATALOGO_HERRAMIENTAS, TOTAL_HERRAMIENTAS } from '../../data/catalogo-herramientas';
import {
  DEMO_TENANT_ID,
  resetStayPuftMemoryAuditForTests,
  sanitizeAuditText,
} from './staypuftConnector';

const TEST_STAYPUFT_KEY = 'test-staypuft-ephemeral-unit-key-not-a-secret-0001';

interface MockRecords {
  tenants: Array<{ id: string; name: string; slug: string; status: string }>;
  clients: Array<{
    id: string;
    tenant_id: string;
    name: string;
    sector: string;
    employees_count: number;
    notes: string;
    created_at: string;
  }>;
  expedientes: Array<{
    id: string;
    client_id: string;
    tenant_id: string;
    tool_id: string;
    title: string;
    input_data: string;
    output_data: string;
    input_hash: string;
    catalog_version: string;
    notes: string;
    created_at: string;
  }>;
  expedienteInserts: number;
}

function createIsolatedMockEnv(withSecret = true): { env: Env; store: MockRecords } {
  const store: MockRecords = {
    tenants: [
      { id: 'tenant-alpha', name: 'Despacho Alpha Fiscal', slug: 'alpha', status: 'active' },
      { id: 'tenant-beta', name: 'Despacho Beta Contadores', slug: 'beta', status: 'active' },
    ],
    clients: [
      {
        id: 'cli-alpha-1',
        tenant_id: 'tenant-alpha',
        name: 'Corporativo Peninsular SA de CV',
        sector: 'Comercio',
        employees_count: 42,
        notes: 'Cliente activo en Alpha',
        created_at: '2026-10-10T12:00:00Z',
      },
      {
        id: 'cli-beta-1',
        tenant_id: 'tenant-beta',
        name: 'Industrias del Sureste SA de CV',
        sector: 'Manufactura',
        employees_count: 85,
        notes: 'Cliente activo en Beta',
        created_at: '2026-10-11T12:00:00Z',
      },
    ],
    expedientes: [
      {
        id: 'exp-alpha-1',
        client_id: 'cli-alpha-1',
        tenant_id: 'tenant-alpha',
        tool_id: 'isn',
        title: 'Determinación ISN Yucatán Octubre 2026',
        input_data: JSON.stringify({ estadoId: '31', nominaBruta: 500000, numEmpleados: 42 }),
        output_data: JSON.stringify({ impuestoTotal: 15000 }),
        input_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        catalog_version: '2026.1.0-DOF',
        notes: 'Revisión interna',
        created_at: '2026-10-12T15:00:00Z',
      },
      {
        id: 'exp-beta-1',
        client_id: 'cli-beta-1',
        tenant_id: 'tenant-beta',
        tool_id: 'sbc',
        title: 'Integración SBC 2026 Beta',
        input_data: JSON.stringify({ salarioDiario: 800, antiguedadAnios: 4 }),
        output_data: JSON.stringify({ sbcTopado: 840.55 }),
        input_hash: 'f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5',
        catalog_version: '2026.1.0-DOF',
        notes: 'Cálculo Beta',
        created_at: '2026-10-13T15:00:00Z',
      },
    ],
    expedienteInserts: 0,
  };

  const mockDb = {
    prepare: vi.fn((sql: string) => {
      let boundArgs: unknown[] = [];
      const stmt = {
        bind: vi.fn((...args: unknown[]) => {
          boundArgs = args;
          return stmt;
        }),
        first: vi.fn(async () => {
          if (sql.includes('SELECT 1 as ok')) {
            return { ok: 1 };
          }
          if (sql.includes('FROM tenants WHERE id =')) {
            const targetId = String(boundArgs[0] ?? '');
            return store.tenants.find((t) => t.id === targetId) ?? null;
          }
          if (sql.includes('FROM expedientes e') && sql.includes('WHERE e.id = ?1')) {
            const expId = String(boundArgs[0] ?? '');
            const tenantId = String(boundArgs[1] ?? '');
            const found = store.expedientes.find(
              (e) => e.id === expId && e.tenant_id === tenantId && e.tenant_id !== DEMO_TENANT_ID
            );
            return found ?? null;
          }
          if (sql.includes('FROM clients') && sql.includes('WHERE id = ?1')) {
            const accId = String(boundArgs[0] ?? '');
            const tenantId = String(boundArgs[1] ?? '');
            const found = store.clients.find(
              (c) => c.id === accId && c.tenant_id === tenantId && c.tenant_id !== DEMO_TENANT_ID
            );
            return found ?? null;
          }
          if (sql.includes('COUNT(*)') && sql.includes('FROM expedientes')) {
            const tenantOrClient = String(boundArgs[0] ?? '');
            const count = store.expedientes.filter(
              (e) => e.tenant_id === tenantOrClient || e.client_id === tenantOrClient
            ).length;
            return { total: count };
          }
          if (sql.includes('COUNT(*)') && sql.includes('FROM clients')) {
            const tenantId = String(boundArgs[0] ?? '');
            const count = store.clients.filter((c) => c.tenant_id === tenantId).length;
            return { total: count };
          }
          if (sql.includes('COUNT(*)')) {
            return { total: 2 };
          }
          return null;
        }),
        all: vi.fn(async () => {
          if (sql.includes('FROM expedientes e') && sql.includes('LIMIT ?3 OFFSET ?4')) {
            const tenantId = String(boundArgs[0] ?? '');
            const limit = Number(boundArgs[2] ?? 20);
            const offset = Number(boundArgs[3] ?? 0);
            const filtered = store.expedientes
              .filter((e) => e.tenant_id === tenantId && e.tenant_id !== DEMO_TENANT_ID)
              .slice(offset, offset + limit);
            return { results: filtered };
          }
          if (sql.includes('FROM clients') && sql.includes('LIMIT ?3 OFFSET ?4')) {
            const tenantId = String(boundArgs[0] ?? '');
            const limit = Number(boundArgs[2] ?? 20);
            const offset = Number(boundArgs[3] ?? 0);
            const filtered = store.clients
              .filter((c) => c.tenant_id === tenantId && c.tenant_id !== DEMO_TENANT_ID)
              .slice(offset, offset + limit);
            return { results: filtered };
          }
          if (sql.includes('FROM arkangel_ledger') && sql.includes('GROUP BY tool_id')) {
            return {
              results: [
                { tool_id: 'isn', calls: 12 },
                { tool_id: 'sbc', calls: 8 },
              ],
            };
          }
          if (sql.includes('FROM arkangel_ledger')) {
            return {
              results: [
                {
                  id: 'led-1',
                  user_id: 'user-alpha',
                  tool_id: 'isn',
                  action: 'CALCULATION_VERIFIED',
                  metadata: '{}',
                  created_at: '2026-10-12T15:00:00Z',
                },
              ],
            };
          }
          if (sql.includes('FROM leads_ark_tools')) {
            return {
              results: [
                {
                  id: 'lead-canaco-1',
                  web: 'https://comercio-merida.mx',
                  whatsapp: '5219991112233',
                  email: 'info@comercio-merida.mx',
                  ciudad: 'Merida',
                  especialidad: 'Comercio',
                  status: 'Socio Activo',
                  last_contact: '2026-10-10',
                  contacto_nombre: 'Socio Demo',
                  notas: 'Afiliado CANACO',
                  tenant_id: 'canaco_merida',
                  created_at: '2026-10-10',
                  updated_at: '2026-10-10',
                },
              ],
            };
          }
          return { results: [] };
        }),
        run: vi.fn(async () => {
          if (sql.includes('INSERT INTO expedientes')) {
            store.expedienteInserts += 1;
          }
          return { success: true };
        }),
      };
      return stmt;
    }),
  } as unknown as D1Database;

  const mockAi = {
    run: vi.fn(async (_model: string, input: { messages?: Array<{ role: string }> }) => {
      const msgs = input.messages ?? [];
      const hasToolResult = msgs.some((m) => m.role === 'tool');
      if (!hasToolResult) {
        return {
          response: '',
          tool_calls: [
            {
              name: 'isn',
              arguments: { estadoId: 'YUC', nominaBruta: 250000, numEmpleados: 15 },
            },
          ],
          usage: {
            prompt_tokens: 120,
            completion_tokens: 45,
            total_tokens: 165,
          },
        };
      }
      return {
        response:
          'El cálculo preview de ISN para Yucatán (tasa 3.0% conforme al Art. 21 al 27 de la Ley General de Hacienda del Estado de Yucatán) sobre $250,000 MXN resulta en $7,500 MXN.',
        usage: {
          prompt_tokens: 180,
          completion_tokens: 60,
          total_tokens: 240,
        },
      };
    }),
  } as unknown as Ai;

  const env: Env = {
    ASSETS: {
      fetch: vi.fn(async () => new Response('SPA', { status: 200 })),
    } as unknown as Fetcher,
    ENVIRONMENT: 'test',
    APP_NAME: 'ARK LEDGER',
    APP_VERSION: '3.1.0',
    APP_URL: 'https://ledger.arksystems.site',
    COMPANY_NAME: 'Ark Systems',
    COMPANY_EMAIL: 'soporte@arksystems.site',
    SUPPORT_URL: 'https://ledger.arksystems.site',
    ARK_TOOLS_DB: mockDb,
    AI: mockAi,
    ...(withSecret ? { LEDGER_STAYPUFT_API_KEY: TEST_STAYPUFT_KEY } : {}),
  };

  return { env, store };
}

const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

describe('StayPuft Internal Connector for Ark Ledger (v3.1)', () => {
  beforeEach(() => {
    resetStayPuftMemoryAuditForTests();
  });

  // ==========================================================================
  // 1. Fail-Closed Authentication (No key = 401, Wrong key = 401, Valid = 200)
  // ==========================================================================
  describe('Fail-Closed Authentication across all internal routes', () => {
    const internalRoutes: Array<{ method: string; path: string; body?: string }> = [
      { method: 'GET', path: '/api/internal/status' },
      { method: 'GET', path: '/api/internal/tools' },
      { method: 'GET', path: '/api/internal/tools/isn' },
      {
        method: 'POST',
        path: '/api/internal/tools/isn/preview',
        body: JSON.stringify({ estadoId: '31', nominaBruta: 200000, numEmpleados: 10 }),
      },
      { method: 'GET', path: '/api/internal/expediente?tenant_id=tenant-alpha' },
      { method: 'GET', path: '/api/internal/expediente/exp-alpha-1?tenant_id=tenant-alpha' },
      { method: 'GET', path: '/api/internal/crm/accounts?tenant_id=tenant-alpha' },
      { method: 'GET', path: '/api/internal/crm/accounts/cli-alpha-1?tenant_id=tenant-alpha' },
      { method: 'GET', path: '/api/internal/metrics?tenant_id=tenant-alpha' },
      { method: 'GET', path: '/api/internal/audit' },
      { method: 'GET', path: '/api/internal/diagnostics' },
      { method: 'GET', path: '/api/internal/walkthrough/canaco' },
    ];

    it.each(internalRoutes)(
      'returns 401 when X-StayPuft-Key is missing on $method $path',
      async ({ method, path, body }) => {
        const { env } = createIsolatedMockEnv(true);
        const req = new Request(`https://ledger.arksystems.site${path}`, {
          method,
          ...(body ? { body, headers: { 'Content-Type': 'application/json' } } : {}),
        });
        const res = await worker.fetch(req, env, mockCtx);
        expect(res.status).toBe(401);
      }
    );

    it.each(internalRoutes)(
      'returns 401 when X-StayPuft-Key is wrong on $method $path',
      async ({ method, path, body }) => {
        const { env } = createIsolatedMockEnv(true);
        const req = new Request(`https://ledger.arksystems.site${path}`, {
          method,
          headers: {
            'X-StayPuft-Key': 'wrong-key-value-attempt',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(body ? { body } : {}),
        });
        const res = await worker.fetch(req, env, mockCtx);
        expect(res.status).toBe(401);
      }
    );

    it.each(internalRoutes)(
      'returns 401 when LEDGER_STAYPUFT_API_KEY secret is not configured in env on $method $path',
      async ({ method, path, body }) => {
        const { env } = createIsolatedMockEnv(false);
        const req = new Request(`https://ledger.arksystems.site${path}`, {
          method,
          headers: {
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(body ? { body } : {}),
        });
        const res = await worker.fetch(req, env, mockCtx);
        expect(res.status).toBe(401);
      }
    );

    it.each(internalRoutes)(
      'returns 200 when X-StayPuft-Key is valid on $method $path',
      async ({ method, path, body }) => {
        const { env } = createIsolatedMockEnv(true);
        const req = new Request(`https://ledger.arksystems.site${path}`, {
          method,
          headers: {
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(body ? { body } : {}),
        });
        const res = await worker.fetch(req, env, mockCtx);
        expect(res.status).toBe(200);
      }
    );
  });

  // ==========================================================================
  // 2. Existing Admin / Internal Routes Authorized for StayPuft
  // ==========================================================================
  describe('Existing Admin & Internal Routes Authorization', () => {
    const existingAdminRoutes = [
      '/api/admin/overview',
      '/api/admin/users',
      '/api/admin/tenants',
      '/api/admin/leads?tenant_id=canaco_merida',
      '/api/admin/leads/stats?tenant_id=canaco_merida',
      '/api/bots/logs',
      '/api/canaco/buzon/admin/resumen',
      '/api/billing/status?tenant_id=ark',
    ];

    it.each(existingAdminRoutes)(
      'authorizes valid X-StayPuft-Key (200) and rejects wrong X-StayPuft-Key (401) on %s',
      async (routePath) => {
        const { env } = createIsolatedMockEnv(true);

        const badReq = new Request(`https://ledger.arksystems.site${routePath}`, {
          headers: { 'X-StayPuft-Key': 'invalid-key' },
        });
        const badRes = await worker.fetch(badReq, env, mockCtx);
        expect(badRes.status).toBe(401);

        const okReq = new Request(`https://ledger.arksystems.site${routePath}`, {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        });
        const okRes = await worker.fetch(okReq, env, mockCtx);
        expect(okRes.status).toBe(200);
      }
    );
  });

  // ==========================================================================
  // 3. Status & Live 20-Tool Catalog Inspection
  // ==========================================================================
  describe('Status and 21 Tools Live Metadata', () => {
    it('returns live status with version 3.1, 21 tools, 32 ISN states, and ATEB in_progress gate', async () => {
      const { env } = createIsolatedMockEnv(true);
      const res = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/status', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as Record<string, unknown>;
      expect(data.ok).toBe(true);
      expect(data.version).toBe('3.1');
      expect(data.tool_count).toBe(21);
      expect(data.isn_states_count).toBe(32);
      expect(Number(data.lfpiorpi_fractions_count)).toBeGreaterThanOrEqual(5);

      const integrations = data.integrations as Record<string, Record<string, unknown>>;
      expect(integrations.ateb_pac?.status).toBe('in_progress');
      expect(integrations.ateb_pac?.production_stamping_enabled).toBe(false);
      expect(integrations.ateb_pac?.distributor_pricing_in_writing).toBe(false);
    });

    it('lists all 20 canonical tools from CATALOGO_HERRAMIENTAS with law_cited', async () => {
      const { env } = createIsolatedMockEnv(true);
      const res = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/tools', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        ok: boolean;
        total: number;
        tools: Array<{ id: string; law_cited: string[] }>;
      };
      expect(data.ok).toBe(true);
      expect(data.total).toBe(TOTAL_HERRAMIENTAS);
      expect(data.tools).toHaveLength(21);

      for (const tool of data.tools) {
        expect(tool.law_cited.length).toBeGreaterThan(0);
      }
    });

    it('returns detailed live spec for ISN including all 32 states, and 404 for unknown tool', async () => {
      const { env } = createIsolatedMockEnv(true);
      const isnRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/tools/isn', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(isnRes.status).toBe(200);
      const isnData = (await isnRes.json()) as {
        ok: boolean;
        tool: { id: string; law_cited: string[] };
        live_reference_data: { total_estados: number; estados: unknown[] };
      };
      expect(isnData.tool.id).toBe('isn');
      expect(isnData.live_reference_data.total_estados).toBe(32);
      expect(isnData.live_reference_data.estados).toHaveLength(32);

      const unknownRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/tools/no-existe', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(unknownRes.status).toBe(404);
    });
  });

  // ==========================================================================
  // 4. Preview Calculation Mode (Writes nothing, seals nothing, stamps nothing)
  // ==========================================================================
  describe('Preview Mode across all 21 tools', () => {
    it('executes preview calculation for every single one of the 21 tools without writing, sealing, or stamping', async () => {
      const { env, store } = createIsolatedMockEnv(true);

      for (const tool of CATALOGO_HERRAMIENTAS) {
        const res = await worker.fetch(
          new Request(`https://ledger.arksystems.site/api/internal/tools/${tool.id}/preview`, {
            method: 'POST',
            headers: {
              'X-StayPuft-Key': TEST_STAYPUFT_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }),
          env,
          mockCtx
        );

        expect(res.status, `Preview failed for tool ${tool.id}`).toBe(200);
        const body = (await res.json()) as {
          ok: boolean;
          tool_id: string;
          preview: boolean;
          sealed: boolean;
          saved: boolean;
          stamped: boolean;
          dictamen_issued: boolean;
          law_cited: string[];
          result: Record<string, unknown>;
        };

        expect(body.ok).toBe(true);
        expect(body.tool_id).toBe(tool.id);
        expect(body.preview).toBe(true);
        expect(body.sealed).toBe(false);
        expect(body.saved).toBe(false);
        expect(body.stamped).toBe(false);
        expect(body.dictamen_issued).toBe(false);
        expect(body.law_cited.length).toBeGreaterThan(0);
        expect(body.result).toBeDefined();
      }

      // Ningún cálculo en preview puede insertar en expedientes
      expect(store.expedienteInserts).toBe(0);
    });
  });

  // ==========================================================================
  // 5. Pagination Cap 100 and Default 20
  // ==========================================================================
  describe('Strict Pagination (default 20, cap 100)', () => {
    it('enforces default limit 20 and caps limit > 100 to 100 on list endpoints', async () => {
      const { env } = createIsolatedMockEnv(true);

      // Default limit = 20
      const defaultRes = await worker.fetch(
        new Request(
          'https://ledger.arksystems.site/api/internal/expediente?tenant_id=tenant-alpha',
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(defaultRes.status).toBe(200);
      const defaultBody = (await defaultRes.json()) as {
        pagination: { limit: number; offset: number; cap: number; default_limit: number };
      };
      expect(defaultBody.pagination.limit).toBe(20);
      expect(defaultBody.pagination.default_limit).toBe(20);
      expect(defaultBody.pagination.cap).toBe(100);

      // Cap limit = 999 -> 100 on /api/internal/crm/accounts
      const cappedRes = await worker.fetch(
        new Request(
          'https://ledger.arksystems.site/api/internal/crm/accounts?tenant_id=tenant-alpha&limit=999&offset=5',
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(cappedRes.status).toBe(200);
      const cappedBody = (await cappedRes.json()) as {
        pagination: { limit: number; offset: number; cap: number };
      };
      expect(cappedBody.pagination.limit).toBe(100);
      expect(cappedBody.pagination.offset).toBe(5);
      expect(cappedBody.pagination.cap).toBe(100);

      // Cap limit = 500 -> 100 on /api/internal/audit
      const auditRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/audit?limit=500', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(auditRes.status).toBe(200);
      const auditBody = (await auditRes.json()) as {
        pagination: { limit: number; cap: number };
      };
      expect(auditBody.pagination.limit).toBe(100);
      expect(auditBody.pagination.cap).toBe(100);
    });
  });

  // ==========================================================================
  // 6. Multi-Tenant Isolation & Demo Tenant (`tenant-demo-sandbox`) Isolation
  // ==========================================================================
  describe('Multi-Tenant Isolation & Demo Sandbox Isolation', () => {
    it('returns 404 when tenant is missing or does not exist', async () => {
      const { env } = createIsolatedMockEnv(true);

      const noTenantRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/expediente', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(noTenantRes.status).toBe(404);

      const ghostTenantRes = await worker.fetch(
        new Request(
          'https://ledger.arksystems.site/api/internal/crm/accounts?tenant_id=tenant-fantasma',
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(ghostTenantRes.status).toBe(404);
    });

    it('returns 404 on cross-tenant read and leaks zero data from another tenant', async () => {
      const { env } = createIsolatedMockEnv(true);

      // Intentar leer exp-alpha-1 desde tenant-beta -> debe devolver 404
      const crossExpRes = await worker.fetch(
        new Request(
          'https://ledger.arksystems.site/api/internal/expediente/exp-alpha-1?tenant_id=tenant-beta',
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(crossExpRes.status).toBe(404);
      const crossExpBody = (await crossExpRes.json()) as Record<string, unknown>;
      expect(crossExpBody.expediente).toBeUndefined();

      // Intentar leer cli-beta-1 desde tenant-alpha -> debe devolver 404
      const crossAccRes = await worker.fetch(
        new Request(
          'https://ledger.arksystems.site/api/internal/crm/accounts/cli-beta-1?tenant_id=tenant-alpha',
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(crossAccRes.status).toBe(404);
      const crossAccBody = (await crossAccRes.json()) as Record<string, unknown>;
      expect(crossAccBody.account).toBeUndefined();
    });

    it('keeps demo tenant tenant-demo-sandbox strictly isolated with is_demo: true', async () => {
      const { env } = createIsolatedMockEnv(true);

      // Consultar tenant-demo-sandbox devuelve is_demo: true
      const demoRes = await worker.fetch(
        new Request(
          `https://ledger.arksystems.site/api/internal/expediente?tenant_id=${DEMO_TENANT_ID}`,
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(demoRes.status).toBe(200);
      const demoBody = (await demoRes.json()) as {
        is_demo: boolean;
        tenant_id: string;
        expedientes: Array<{ id: string; is_demo: boolean }>;
      };
      expect(demoBody.is_demo).toBe(true);
      expect(demoBody.tenant_id).toBe(DEMO_TENANT_ID);
      expect(demoBody.expedientes[0]?.is_demo).toBe(true);

      // Intentar leer el expediente demo desde un tenant real (tenant-alpha) -> 404
      const leakCheckRes = await worker.fetch(
        new Request(
          'https://ledger.arksystems.site/api/internal/expediente/exp-demo-sandbox-001?tenant_id=tenant-alpha',
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(leakCheckRes.status).toBe(404);

      // Intentar leer un expediente real (exp-alpha-1) desde tenant-demo-sandbox -> 404
      const reverseLeakCheckRes = await worker.fetch(
        new Request(
          `https://ledger.arksystems.site/api/internal/expediente/exp-alpha-1?tenant_id=${DEMO_TENANT_ID}`,
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );
      expect(reverseLeakCheckRes.status).toBe(404);
    });
  });

  // ==========================================================================
  // 7. Immutable Audit Log & PII / RFC / XML Sanitization
  // ==========================================================================
  describe('Immutable Audit Log & Sanitization', () => {
    it('logs every StayPuft operation and strips RFCs, emails, and CFDI XML', async () => {
      const { env } = createIsolatedMockEnv(true);

      await worker.fetch(
        new Request(
          'https://ledger.arksystems.site/api/internal/status?rfc=AAA010101AAA&nota=cliente@correo.mx',
          {
            headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
          }
        ),
        env,
        mockCtx
      );

      const auditRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/audit', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(auditRes.status).toBe(200);
      const auditBody = (await auditRes.json()) as {
        ok: boolean;
        entries: Array<{
          operator: string;
          method: string;
          path: string;
          status_code: number;
          result: string;
        }>;
      };
      expect(auditBody.ok).toBe(true);
      expect(auditBody.entries.length).toBeGreaterThanOrEqual(2);

      const serialized = JSON.stringify(auditBody.entries);
      expect(serialized).not.toContain('AAA010101AAA');
      expect(serialized).not.toContain('cliente@correo.mx');
      expect(serialized).toContain('staypuft');

      // Verificar sanitizador directo contra CFDI XML y RFC
      const dirty =
        '<?xml version="1.0"?><cfdi:Comprobante Rfc="GODE561231GR8" correo="fiscal@despacho.mx"/>';
      const clean = sanitizeAuditText(dirty);
      expect(clean).not.toContain('GODE561231GR8');
      expect(clean).not.toContain('fiscal@despacho.mx');
      expect(clean).not.toContain('<cfdi:Comprobante');
    });
  });

  // ==========================================================================
  // 8. Approval Gate Enforcement on Irreversible / External Actions
  // ==========================================================================
  describe('Approval Gate on external / irreversible actions', () => {
    const gatedEndpoints = [
      { method: 'POST', path: '/api/alegra/invoices', expectedAction: 'cfdi_timbrado' },
      { method: 'POST', path: '/api/expedientes', expectedAction: 'expediente_sealing' },
      {
        method: 'POST',
        path: '/api/admin/leads/lead-1/send-email',
        expectedAction: 'real_email_send',
      },
      {
        method: 'POST',
        path: '/api/canaco/buzon/admin/dictaminar',
        expectedAction: 'official_dictamen',
      },
      {
        method: 'POST',
        path: '/api/canaco/sync-arkangel',
        expectedAction: 'external_voice_whatsapp_dispatch',
      },
    ];

    it.each(gatedEndpoints)(
      'blocks $method $path ($expectedAction) with 403 approval_required even with valid X-StayPuft-Key',
      async ({ method, path, expectedAction }) => {
        const { env } = createIsolatedMockEnv(true);
        const res = await worker.fetch(
          new Request(`https://ledger.arksystems.site${path}`, {
            method,
            headers: {
              'X-StayPuft-Key': TEST_STAYPUFT_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }),
          env,
          mockCtx
        );
        expect(res.status).toBe(403);
        const body = (await res.json()) as {
          ok: boolean;
          approval_required: boolean;
          action_type: string;
        };
        expect(body.ok).toBe(false);
        expect(body.approval_required).toBe(true);
        expect(body.action_type).toBe(expectedAction);
      }
    );
  });

  // ==========================================================================
  // 9. Workers AI Metrics / Neurons & Safe AI Ask Endpoint (POST /api/internal/ai/ask)
  // ==========================================================================
  describe('Workers AI Usage / Neurons in Metrics & POST /api/internal/ai/ask', () => {
    it('exposes AI usage fields and explicitly sets neuronsAvailable: false when runtime does not report per-call neurons', async () => {
      const { env } = createIsolatedMockEnv(true);

      const res = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/metrics?tenantId=tenant-alpha', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        ok: boolean;
        pagination: { limit: number; cap: number };
        ai: {
          calls: number;
          model: string;
          neuronsAvailable: boolean;
          neurons: {
            available: boolean;
            total: number | null;
            perModel: Record<string, number | null>;
            whereAccountTotalLives: string;
          };
          toolCalls: {
            total: number;
            byTool: Record<string, number>;
          };
          errors: number;
          period: { key: string; start: string; end: string };
        };
        metrics: {
          ai: {
            calls: number;
            neuronsAvailable: boolean;
          };
        };
      };

      expect(body.ok).toBe(true);
      expect(body.pagination.limit).toBe(20);
      expect(body.pagination.cap).toBe(100);
      expect(body.ai).toBeDefined();
      expect(body.metrics.ai).toBeDefined();
      expect(body.ai.neuronsAvailable).toBe(false);
      expect(body.ai.neurons.available).toBe(false);
      expect(body.ai.neurons.total).toBeNull();
      expect(body.ai.neurons.whereAccountTotalLives).toContain('Cloudflare Dashboard');
      expect(body.ai.model).toContain('llama');
      expect(typeof body.ai.calls).toBe('number');
      expect(typeof body.ai.errors).toBe('number');
      expect(body.ai.period.start).toMatch(/^\d{4}-\d{2}-01T00:00:00\.000Z$/);
      expect(body.ai.period.end).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59\.999Z$/);
    });

    it('rejects POST /api/internal/ai/ask with 401 when X-StayPuft-Key is missing or wrong', async () => {
      const { env } = createIsolatedMockEnv(true);

      const noKeyRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán para $250,000',
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(noKeyRes.status).toBe(401);

      const wrongKeyRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': 'wrong-key-value-000',
          },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán para $250,000',
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(wrongKeyRes.status).toBe(401);
    });

    it('returns 404 on unknown tenant or cross-tenant mismatch in POST /api/internal/ai/ask', async () => {
      const { env } = createIsolatedMockEnv(true);

      const unknownRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán',
            tenantId: 'tenant-inexistente-999',
          }),
        }),
        env,
        mockCtx
      );
      expect(unknownRes.status).toBe(404);

      const crossTenantRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
            'X-Tenant-ID': 'tenant-beta',
          },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán',
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(crossTenantRes.status).toBe(404);
    });

    it('executes safe AI ask with preview tools only, returns answer + toolsCalled + lawCited, writes 0, and updates AI metrics', async () => {
      const { env, store } = createIsolatedMockEnv(true);

      const askRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Calcula en preview el ISN de Yucatán sobre $250,000 con 15 empleados',
            tenantId: 'tenant-alpha',
            tools: ['isn', 'sbc'],
            maxToolCalls: 2,
          }),
        }),
        env,
        mockCtx
      );

      expect(askRes.status).toBe(200);
      const askBody = (await askRes.json()) as {
        ok: boolean;
        answer: string;
        toolsCalled: Array<{
          tool: string;
          toolId: string;
          inputs: Record<string, unknown>;
          result: {
            baseGravable: number;
            tasa: number;
            isn: number;
            estado: { id: string; tasa: number; articulo: string };
          };
          previewResult: unknown;
          lawCited: string[];
        }>;
        writes: number;
        sealed: boolean;
        stamped: boolean;
        model: string;
        neuronsUsed: number | null;
        neuronsAvailable: boolean;
        durationMs: number;
      };

      expect(askBody.ok).toBe(true);
      expect(askBody.answer).toContain('ISN');
      // Must use the tool's returned 2026 MIPyME breakdown ($9,375 bruto - $1,875 estímulo = $7,500 neto, 3.0% efectiva), never legacy 2.5% / $6,250
      expect(askBody.answer).toContain('7,500');
      expect(askBody.answer).toContain('9,375');
      expect(askBody.answer).toContain('1,875');
      expect(askBody.answer).toContain('3.0%');
      expect(askBody.answer).not.toContain('6,250');
      expect(askBody.answer).not.toContain('2.5%');
      expect(askBody.writes).toBe(0);
      expect(askBody.sealed).toBe(false);
      expect(askBody.stamped).toBe(false);
      expect(askBody.neuronsUsed).toBeNull();
      expect(askBody.neuronsAvailable).toBe(false);
      expect(askBody.durationMs).toBeGreaterThan(0);
      expect(askBody.toolsCalled).toHaveLength(1);
      expect(askBody.toolsCalled[0]?.toolId).toBe('isn');
      expect(askBody.toolsCalled[0]?.result).toBeDefined();
      expect(askBody.toolsCalled[0]?.result.baseGravable).toBe(250000);
      expect(askBody.toolsCalled[0]?.result.tasa).toBe(3.75);
      expect(askBody.toolsCalled[0]?.result.isn).toBe(7500);
      expect(askBody.toolsCalled[0]?.lawCited.length).toBeGreaterThan(0);
      expect(askBody.toolsCalled[0]?.lawCited.join(' ')).toContain('3.75%');
      expect(store.expedienteInserts).toBe(0);

      // Verify metrics reflect the call and tool breakdown
      const metricsRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/metrics?tenantId=tenant-alpha', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      const metricsBody = (await metricsRes.json()) as {
        ai: {
          calls: number;
          toolCalls: { total: number; byTool: Record<string, number> };
          tokens: { available: boolean; totalTokens: number };
        };
      };
      expect(metricsBody.ai.calls).toBeGreaterThanOrEqual(1);
      expect(metricsBody.ai.toolCalls.total).toBe(1);
      expect(metricsBody.ai.toolCalls.byTool.isn).toBe(1);
      expect(metricsBody.ai.tokens.available).toBe(true);
      expect(metricsBody.ai.tokens.totalTokens).toBe(240);
    });

    it('blocks AI ask attempting to seal, stamp CFDI, send email, or invoke non-preview tools with writes: 0', async () => {
      const { env, store } = createIsolatedMockEnv(true);

      // 1. Prompt attempting to seal expediente
      const sealRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Por favor sella el expediente único con SHA-256 en D1 para este cliente',
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(sealRes.status).toBe(403);
      const sealBody = (await sealRes.json()) as {
        blocked: boolean;
        writes: number;
        sealed: boolean;
        stamped: boolean;
      };
      expect(sealBody.blocked).toBe(true);
      expect(sealBody.writes).toBe(0);
      expect(sealBody.sealed).toBe(false);
      expect(sealBody.stamped).toBe(false);

      // 2. Prompt attempting to stamp CFDI and send email
      const stampEmailRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Timbra la factura CFDI en ATEB y envía correo email al cliente',
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(stampEmailRes.status).toBe(403);
      const stampEmailBody = (await stampEmailRes.json()) as {
        blocked: boolean;
        writes: number;
      };
      expect(stampEmailBody.blocked).toBe(true);
      expect(stampEmailBody.writes).toBe(0);

      // 3. Tools array requesting a non-preview tool
      const badToolsRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán',
            tenantId: 'tenant-alpha',
            tools: ['isn', 'seal_expediente', 'send_email'],
          }),
        }),
        env,
        mockCtx
      );
      expect(badToolsRes.status).toBe(403);
      const badToolsBody = (await badToolsRes.json()) as {
        blocked: boolean;
        writes: number;
      };
      expect(badToolsBody.blocked).toBe(true);
      expect(badToolsBody.writes).toBe(0);
      expect(store.expedienteInserts).toBe(0);
    });

    it('enforces rate limit of 20 asks/hour per operator key and returns 429 on the 21st request', async () => {
      const { env } = createIsolatedMockEnv(true);

      for (let i = 1; i <= 20; i += 1) {
        const okRes = await worker.fetch(
          new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-StayPuft-Key': TEST_STAYPUFT_KEY,
            },
            body: JSON.stringify({
              prompt: `Consulta fiscal preview #${i} de ISN Yucatán`,
              tenantId: 'tenant-alpha',
            }),
          }),
          env,
          mockCtx
        );
        expect(okRes.status).toBe(200);
      }

      const rateLimitedRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Consulta fiscal preview #21 que debe recibir 429',
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(rateLimitedRes.status).toBe(429);
      const rateLimitedBody = (await rateLimitedRes.json()) as {
        ok: boolean;
        writes: number;
        rateLimit: { limitPerHour: number; remaining: number };
      };
      expect(rateLimitedBody.ok).toBe(false);
      expect(rateLimitedBody.writes).toBe(0);
      expect(rateLimitedBody.rateLimit.limitPerHour).toBe(20);
      expect(rateLimitedBody.rateLimit.remaining).toBe(0);
    });

    it('records an immutable staypuft_audit_log entry with actor staypuft, action ai_ask, and redacts PII/RFC/CURP/CFDI-XML', async () => {
      const { env } = createIsolatedMockEnv(true);

      const promptWithFakePii =
        'Analiza en preview ISN para RFC GODE561231GR8, CURP GODE561231HGRRND01, contacto prueba.falsa@ejemplo.mx y XML <?xml version="1.0"?><cfdi:Comprobante Rfc="GODE561231GR8"/>';

      const askRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: promptWithFakePii,
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(askRes.status).toBe(200);

      const auditRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/audit?tenantId=tenant-alpha', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      expect(auditRes.status).toBe(200);
      const auditBody = (await auditRes.json()) as {
        entries: Array<{
          operator: string;
          actor: string;
          action: string;
          path: string;
          details: string;
        }>;
      };

      const aiAuditEntry = auditBody.entries.find((e) => e.path === '/api/internal/ai/ask');
      expect(aiAuditEntry).toBeDefined();
      expect(aiAuditEntry?.operator).toBe('staypuft');
      expect(aiAuditEntry?.actor).toBe('staypuft');
      expect(aiAuditEntry?.action).toBe('ai_ask');
      expect(aiAuditEntry?.details).toContain('pii_redacted=true');
      expect(aiAuditEntry?.details).not.toContain('GODE561231GR8');
      expect(aiAuditEntry?.details).not.toContain('GODE561231HGRRND01');
      expect(aiAuditEntry?.details).not.toContain('prueba.falsa@ejemplo.mx');
      expect(aiAuditEntry?.details).not.toContain('<cfdi:Comprobante');
    });

    it('fails closed (503 / 502) without inventing answers when Workers AI is unbound or throws', async () => {
      const { env } = createIsolatedMockEnv(true);
      delete (env as { AI?: unknown }).AI;

      const unboundRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán',
            tenantId: 'tenant-alpha',
          }),
        }),
        env,
        mockCtx
      );
      expect(unboundRes.status).toBe(503);
      const unboundBody = (await unboundRes.json()) as { ok: boolean; answer?: string };
      expect(unboundBody.ok).toBe(false);
      expect(unboundBody.answer).toBeUndefined();
    });

    it('locks in ISN Yucatán 2026 MIPyME ($9,375 bruto - $1,875 estímulo = $7,500 neto on $250,000, 15 emp), per-call neurons (89.69), and 12 vs 20 walkthrough breakdown', async () => {
      const { env } = createIsolatedMockEnv(true);

      // 1. Direct preview POST /api/internal/tools/isn/preview for YUC $250,000, 15 employees
      const previewRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/tools/isn/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            estadoId: 'YUC',
            nominaBruta: 250000,
            numEmpleados: 15,
          }),
        }),
        env,
        mockCtx
      );
      expect(previewRes.status).toBe(200);
      const previewBody = (await previewRes.json()) as {
        ok: boolean;
        law_cited: string[];
        result: {
          tasa: number;
          tasaBruta: number;
          tasaEfectiva: number;
          isnBruto: number;
          estimulo: number;
          isnNeto: number;
          isn: number;
          baseGravable: number;
          estado: { id: string; tasa: number; articulo: string };
        };
      };
      expect(previewBody.ok).toBe(true);
      expect(previewBody.result.tasaBruta).toBe(3.75);
      expect(previewBody.result.isnBruto).toBe(9375);
      expect(previewBody.result.estimulo).toBe(1875);
      expect(previewBody.result.isnNeto).toBe(7500);
      expect(previewBody.result.isn).toBe(7500);
      expect(previewBody.result.tasaEfectiva).toBe(3.0);
      expect(previewBody.result.estado.articulo).toContain('Art. 21 al 27 LGHY');
      expect(previewBody.law_cited.join(' ')).toContain('3.75%');

      // 2. Simulate Workers AI returning usage.neurons = 89.69 (and hallucinating legacy 2.5% / $6,250 so guard rewrites it)
      env.AI = {
        run: vi.fn(async (_model: string, input: { messages?: Array<{ role: string }> }) => {
          const msgs = input.messages ?? [];
          const hasToolResult = msgs.some((m) => m.role === 'tool');
          if (!hasToolResult) {
            return {
              response: '',
              tool_calls: [
                {
                  name: 'isn',
                  arguments: { estadoId: 'YUC', baseGravable: 250000, numEmpleados: 15 },
                },
              ],
              usage: { prompt_tokens: 120, completion_tokens: 45, total_tokens: 165 },
            };
          }
          return {
            response: 'El ISN en Yucatán al 2.5% sobre $250,000 es $6,250.',
            usage: {
              prompt_tokens: 180,
              completion_tokens: 60,
              total_tokens: 240,
              neurons: 89.69,
            },
          };
        }),
      } as unknown as Ai;

      const askRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán para $250,000 con 15 empleados',
            tenantId: 'tenant-alpha',
            tools: ['isn'],
          }),
        }),
        env,
        mockCtx
      );
      expect(askRes.status).toBe(200);
      const askBody = (await askRes.json()) as {
        ok: boolean;
        answer: string;
        neuronsUsed: number;
        neuronsAvailable: boolean;
        toolsCalled: Array<{
          toolId: string;
          result: {
            isn: number;
            isnNeto: number;
            isnBruto: number;
            estimulo: number;
            tasa: number;
          };
        }>;
      };
      expect(askBody.ok).toBe(true);
      expect(askBody.answer).toContain('9,375');
      expect(askBody.answer).toContain('1,875');
      expect(askBody.answer).toContain('7,500');
      expect(askBody.answer).toContain('3.0%');
      expect(askBody.answer).not.toContain('6,250');
      expect(askBody.answer).not.toContain('2.5%');
      expect(askBody.toolsCalled[0]?.result.isn).toBe(7500);
      expect(askBody.toolsCalled[0]?.result.isnBruto).toBe(9375);
      expect(askBody.toolsCalled[0]?.result.estimulo).toBe(1875);
      expect(askBody.neuronsAvailable).toBe(true);
      expect(askBody.neuronsUsed).toBe(89.69);

      // 3. Verify status and metrics agree on neuronsAvailable: true
      const statusRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/status', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      const statusBody = (await statusRes.json()) as {
        ai: { neuronsAvailable: boolean; per_call_neurons_supported: boolean };
      };
      expect(statusBody.ai.neuronsAvailable).toBe(true);
      expect(statusBody.ai.per_call_neurons_supported).toBe(true);

      const metricsRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/metrics?tenantId=tenant-alpha', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      const metricsBody = (await metricsRes.json()) as {
        ai: { neuronsAvailable: boolean; neurons: { available: boolean; total: number } };
      };
      expect(metricsBody.ai.neuronsAvailable).toBe(true);
      expect(metricsBody.ai.neurons.available).toBe(true);
      expect(metricsBody.ai.neurons.total).toBeCloseTo(89.69, 2);

      // 4. Verify CANACO walkthrough exposes timbrado preview_only policy and 12 vs 8 suite breakdown
      const walkRes = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/walkthrough/canaco', {
          headers: { 'X-StayPuft-Key': TEST_STAYPUFT_KEY },
        }),
        env,
        mockCtx
      );
      const walkBody = (await walkRes.json()) as {
        stamping_policy: { status: string; live_stamping_on_monday: boolean };
        suite_breakdown: {
          total_tools: number;
          canaco_pyme_core_count: number;
          specialized_corporate_pld_count: number;
        };
      };
      expect(walkBody.stamping_policy.status).toBe('preview_only');
      expect(walkBody.stamping_policy.live_stamping_on_monday).toBe(false);
      expect(walkBody.suite_breakdown.total_tools).toBe(21);
      expect(walkBody.suite_breakdown.canaco_pyme_core_count).toBe(12);
      expect(walkBody.suite_breakdown.specialized_corporate_pld_count).toBe(9);
    });
  });

  describe('AI ask — coerción estricta de booleanos (string vs boolean)', () => {
    const askIsWithArgs = async (args: Record<string, unknown>) => {
      const { env } = createIsolatedMockEnv(true);
      env.AI = {
        run: vi.fn(async (_model: string, input: { messages?: Array<{ role: string }> }) => {
          const msgs = input.messages ?? [];
          if (!msgs.some((m) => m.role === 'tool')) {
            return { response: '', tool_calls: [{ name: 'isn', arguments: args }] };
          }
          return {
            response: 'Cálculo preview de ISN de Yucatán.',
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          };
        }),
      } as unknown as Ai;

      const res = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify({
            prompt: 'Calcula el ISN de Yucatán para $250,000 con 15 empleados',
            tenantId: 'tenant-alpha',
            tools: ['isn'],
            maxToolCalls: 1,
          }),
        }),
        env,
        mockCtx
      );
      expect(res.status).toBe(200);
      return (await res.json()) as {
        ok: boolean;
        answer: string;
        toolsCalled: Array<{
          result: {
            tasa: number;
            tasaBruta: number;
            tasaEfectiva: number;
            isnBruto: number;
            estimulo: number;
            isnNeto: number;
            regimen: string;
          };
        }>;
      };
    };

    it('string "true"/"false" produce el mismo resultado que booleanos reales (micro/pequeña)', async () => {
      const body = await askIsWithArgs({
        estadoId: 'YUC',
        baseGravable: 250000,
        numEmpleados: 15,
        esMicroPequena2026: 'true',
        esGobiernoEstatal: 'false',
      });

      expect(body.toolsCalled[0]?.result.regimen).toBe('micro_pequena');
      expect(body.toolsCalled[0]?.result.tasaBruta).toBe(3.75);
      expect(body.toolsCalled[0]?.result.isnBruto).toBe(9375);
      expect(body.toolsCalled[0]?.result.estimulo).toBe(1875);
      expect(body.toolsCalled[0]?.result.isnNeto).toBe(7500);
      expect(body.toolsCalled[0]?.result.tasaEfectiva).toBe(3);
      expect(body.answer).toContain('7,500');
    });

    it('string "false"/"true" no se convierten en truthy: gobierno estatal aplica 4.75%', async () => {
      const body = await askIsWithArgs({
        estadoId: 'YUC',
        baseGravable: 250000,
        numEmpleados: 15,
        esMicroPequena2026: 'false',
        esGobiernoEstatal: 'true',
      });

      expect(body.toolsCalled[0]?.result.regimen).toBe('gobierno_estatal');
      expect(body.toolsCalled[0]?.result.tasaBruta).toBe(4.75);
      expect(body.toolsCalled[0]?.result.estimulo).toBe(0);
      expect(body.toolsCalled[0]?.result.isnNeto).toBe(11875);
    });

    it('51 empleados con micro="true" cae a general 3.75%', async () => {
      const body = await askIsWithArgs({
        estadoId: 'YUC',
        baseGravable: 250000,
        numEmpleados: 51,
        esMicroPequena2026: 'true',
        esGobiernoEstatal: 'false',
      });

      expect(body.toolsCalled[0]?.result.regimen).toBe('general');
      expect(body.toolsCalled[0]?.result.tasaBruta).toBe(3.75);
      expect(body.toolsCalled[0]?.result.estimulo).toBe(0);
      expect(body.toolsCalled[0]?.result.isnNeto).toBe(9375);
    });
  });

  describe('Preview cierre-nomina — trabajadores reales e ISN versionado', () => {
    const trabajadores = (n: number): Array<Record<string, unknown>> =>
      Array.from({ length: n }, (_, i) => ({
        id: `w-${i + 1}`,
        nombre: `Trabajador ${i + 1}`,
        rfc: 'XAXX010101000',
        nss: '12345678901',
        salarioDiario: 1111.11,
        fechaIngreso: '2024-01-01',
        diasTrabajados: 15,
      }));

    const previewCierre = async (body: Record<string, unknown>) => {
      const { env } = createIsolatedMockEnv(true);
      const res = await worker.fetch(
        new Request('https://ledger.arksystems.site/api/internal/tools/cierre-nomina/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-StayPuft-Key': TEST_STAYPUFT_KEY,
          },
          body: JSON.stringify(body),
        }),
        env,
        mockCtx
      );
      return { status: res.status, body: (await res.json()) as Record<string, unknown> };
    };

    it('usa los trabajadores del payload (no un empleado demo) y aplica micro/pequeña', async () => {
      const { status, body } = await previewCierre({
        empresaNombre: 'Demo YUC',
        periodo: 'quincenal',
        diasPeriodo: 15,
        estadoId: 'YUC',
        ejercicio: 2026,
        numEmpleados: 15,
        esMicroPequena2026: true,
        esGobiernoEstatal: false,
        aplica27A: false,
        trabajadores: trabajadores(15),
      });

      expect(status).toBe(200);
      const result = body.result as {
        resumen: {
          totalTrabajadores: number;
          totalPercepcionesBrutas: number;
          isnRegimen: string;
          totalISNEstatal: number;
        };
      };
      expect(result.resumen.totalTrabajadores).toBe(15);
      expect(result.resumen.totalPercepcionesBrutas).toBe(249999.75);
      expect(result.resumen.isnRegimen).toBe('micro_pequena');
      expect(result.resumen.totalISNEstatal).toBeCloseTo(7500, 0);
    });

    it('51 trabajadores aplican general 3.75% aunque micro=true', async () => {
      const { status, body } = await previewCierre({
        periodo: 'quincenal',
        diasPeriodo: 15,
        estadoId: 'YUC',
        numEmpleados: 51,
        esMicroPequena2026: true,
        esGobiernoEstatal: false,
        trabajadores: trabajadores(51),
      });

      expect(status).toBe(200);
      const result = body.result as {
        resumen: { isnRegimen: string; totalISNEstatal: number };
      };
      expect(result.resumen.isnRegimen).toBe('general');
      expect(result.resumen.totalISNEstatal).toBeCloseTo(31875, 0);
    });

    it('gobierno estatal aplica 4.75% y sin estímulo', async () => {
      const { status, body } = await previewCierre({
        periodo: 'quincenal',
        diasPeriodo: 15,
        estadoId: 'YUC',
        numEmpleados: 15,
        esMicroPequena2026: false,
        esGobiernoEstatal: true,
        trabajadores: trabajadores(15),
      });

      expect(status).toBe(200);
      const result = body.result as {
        resumen: { isnRegimen: string; isnEstimulo: number; totalISNEstatal: number };
      };
      expect(result.resumen.isnRegimen).toBe('gobierno_estatal');
      expect(result.resumen.isnEstimulo).toBe(0);
      expect(result.resumen.totalISNEstatal).toBeCloseTo(11875, 0);
    });

    it('acepta booleanos como string dentro de opcionesIsn', async () => {
      const { status, body } = await previewCierre({
        periodo: 'quincenal',
        diasPeriodo: 15,
        estadoId: 'YUC',
        opcionesIsn: {
          ejercicio: '2026',
          numEmpleados: '15',
          esMicroPequena2026: 'true',
          esGobiernoEstatal: 'false',
          aplica27A: 'false',
        },
        trabajadores: trabajadores(15),
      });

      expect(status).toBe(200);
      const result = body.result as {
        resumen: { isnRegimen: string; totalISNEstatal: number };
      };
      expect(result.resumen.isnRegimen).toBe('micro_pequena');
      expect(result.resumen.totalISNEstatal).toBeCloseTo(7500, 0);
    });

    it('falla fail-closed 400 si falta trabajadores', async () => {
      const { status, body } = await previewCierre({
        periodo: 'quincenal',
        estadoId: 'YUC',
      });

      expect(status).toBe(400);
      expect(String(body.error)).toContain('trabajadores required');
    });
  });
});

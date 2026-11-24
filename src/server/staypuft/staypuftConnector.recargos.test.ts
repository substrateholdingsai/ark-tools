import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { type Env } from '../../index';
import { resetStayPuftMemoryAuditForTests } from './staypuftConnector';

const TEST_STAYPUFT_KEY = 'test-staypuft-ephemeral-unit-key-not-a-secret-0001';

const mockCtx: ExecutionContext = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

function createMinimalEnv(withSecret = true): Env {
  return {
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
    ARK_TOOLS_DB: undefined as unknown as D1Database,
    AI: undefined as unknown as Ai,
    ...(withSecret ? { LEDGER_STAYPUFT_API_KEY: TEST_STAYPUFT_KEY } : {}),
  } as Env;
}

async function previewRecargos(body: Record<string, unknown>) {
  const env = createMinimalEnv(true);
  const res = await worker.fetch(
    new Request('https://ledger.arksystems.site/api/internal/tools/recargos/preview', {
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
}

describe('StayPuft connector — Recargos preview contract (Monday fixes)', () => {
  beforeEach(() => resetStayPuftMemoryAuditForTests());
  afterEach(() => resetStayPuftMemoryAuditForTests());

  it('rechaza payload vacío (no demo silencioso del vector dorado)', async () => {
    const { status, body } = await previewRecargos({});
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    const err = String(body.error);
    expect(err).toContain('importeHistorico');
    expect(err).toContain('fechaVencimiento');
    expect(err).toContain('fechaPago');
  });

  it('rechaza campo desconocido con 400', async () => {
    const { status, body } = await previewRecargos({
      importeHistorico: 45000,
      fechaVencimiento: '2025-06-17',
      fechaPago: '2026-02-17',
      campoInventado: 1,
    });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(String(body.error)).toContain('campoInventado');
  });

  it('rechaza falta un campo requerido con 400', async () => {
    const { status, body } = await previewRecargos({
      importeHistorico: 45000,
      fechaVencimiento: '2025-06-17',
    });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(String(body.error)).toContain('fechaPago');
  });

  it('rechaza fechaPago anterior a fechaVencimiento con 400', async () => {
    const { status, body } = await previewRecargos({
      importeHistorico: 45000,
      fechaVencimiento: '2025-06-17',
      fechaPago: '2025-06-10',
    });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(String(body.error)).toContain('fechaPago');
  });

  it('rechaza importe 0 y negativo con 400', async () => {
    for (const importe of [0, -500]) {
      const { status, body } = await previewRecargos({
        importeHistorico: importe,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2026-02-17',
      });
      expect(status).toBe(400);
      expect(body.ok).toBe(false);
      expect(String(body.error)).toContain('importeHistorico');
    }
  });

  it('vector dorado válido → 200 con importes exactos', async () => {
    const { status, body } = await previewRecargos({
      importeHistorico: 45000,
      fechaVencimiento: '2025-06-17',
      fechaPago: '2026-02-17',
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    const result = body.result as Record<string, unknown>;
    expect(result).toBeDefined();
    expect((result as any).impuestoActualizado).toBe(46134);
    // Nueva lógica: tasa por año (Convention A). Mora jul 2025-feb 2026 = 6 meses 1.47% + 2 meses 2.07% = 12.96%
    // Antes (flat 2.07%): 8 * 2.07 = 16.56% -> 7639.79
    // Ahora: 46134 * 12.96% = 5978.97
    expect((result as any).montoRecargos).toBe(5978.97);
    expect((result as any).totalPagar).toBe(52112.97);
    expect((result as any).mesesMora).toBe(8);
    expect((result as any).tasaRecargosTotal).toBe(12.96);
    expect((result as any).factorActualizacion).toBe(1.0252);
    const folio = (result as any).folioDeIntegridad;
    expect(typeof folio).toBe('string');
    expect(folio).toMatch(/^REC-[0-9a-f]{8}$/);
    expect(folio).not.toContain('e3b0c442');
  });
});

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

describe('StayPuft connector — Nómina preview contract (Monday fixes)', () => {
  beforeEach(() => resetStayPuftMemoryAuditForTests());
  afterEach(() => resetStayPuftMemoryAuditForTests());

  async function previewNomina(body: Record<string, unknown>) {
    const env = createMinimalEnv(true);
    const res = await worker.fetch(
      new Request('https://ledger.arksystems.site/api/internal/tools/nomina/preview', {
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

  it('rechaza payload vacío (no demo silencioso)', async () => {
    const { status, body } = await previewNomina({});
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(String(body.error)).toContain('Payload vacío');
    expect(String(body.error)).toContain('sueldoBruto');
  });

  it('rechaza salarioMensual/periodicidad (nunca devuelve demo $18k)', async () => {
    const { status, body } = await previewNomina({
      salarioMensual: 15000,
      periodicidad: 'mensual',
    });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    const err = String(body.error);
    expect(err).toMatch(/salarioMensual|periodicidad/);
    expect(err).toContain('sueldoBruto');
    expect(err).toContain('periodo');
  });

  it('rechaza campo desconocido con 400', async () => {
    const { status, body } = await previewNomina({
      periodo: 'mensual',
      sueldoBruto: 15000,
      campoInventado: 1,
    });
    expect(status).toBe(400);
    expect(body.ok).toBe(false);
    expect(String(body.error)).toContain('campoInventado');
  });

  it('sin sbcDiario usa default único 1.0493 y lo reporta efectivo', async () => {
    const { status, body } = await previewNomina({
      periodo: 'mensual',
      sueldoBruto: 18000,
      diasTrabajados: 30,
      diasPeriodo: 30,
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    const result = body.result as Record<string, any>;
    expect(result.sbcDiarioEfectivo).toBe(629.58);
    expect(result.sbcDiarioFuente).toBe('default_1.0493');
    expect(result.imss.sbc).toBe(629.58);
    expect(result.imss.total).toBe(427.73);
    expect(result.isr.isrFinal).toBe(2033.23);
  });

  it('con sbcDiario explícito usa exactamente ese valor', async () => {
    const { status, body } = await previewNomina({
      periodo: 'mensual',
      sueldoBruto: 18000,
      diasTrabajados: 30,
      diasPeriodo: 30,
      sbcDiario: 600,
    });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    const result = body.result as Record<string, any>;
    expect(result.sbcDiarioEfectivo).toBe(600);
    expect(result.sbcDiarioFuente).toBe('proporcionado');
    expect(result.imss.sbc).toBe(600);
    expect(result.imss.total).toBe(404.65);
  });
});

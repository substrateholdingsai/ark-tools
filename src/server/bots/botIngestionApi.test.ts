import { describe, it, expect, vi } from 'vitest';
import { botApp, classifyPayloadDeterministic, computeSha256 } from './botIngestionApi';
import type { Env } from '../../index';

function createMockEnv(overrides: Partial<Env> = {}): Env {
  const dbRunMock = vi.fn().mockResolvedValue({ success: true });
  const dbBindMock = vi.fn().mockReturnValue({
    run: dbRunMock,
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
  });
  const dbPrepareMock = vi.fn().mockReturnValue({
    bind: dbBindMock,
    run: dbRunMock,
    all: vi.fn().mockResolvedValue({ results: [] }),
  });

  return {
    ASSETS: {} as any,
    ENVIRONMENT: 'development',
    APP_NAME: 'ARK LEDGER',
    APP_VERSION: '1.0.0',
    APP_URL: 'https://ledger.arksystems.site',
    COMPANY_NAME: 'Substrate Holdings LLC',
    COMPANY_EMAIL: 'pavel@arksystems.site',
    SUPPORT_URL: 'https://wa.me/525657062511',
    ARK_TOOLS_DB: {
      prepare: dbPrepareMock,
    } as any,
    ...overrides,
  };
}

describe('ARK LEDGER — Bot & Agent Ingestion Pipeline (Grok / Hermes)', () => {
  describe('Clasificador Determinista en el Edge', () => {
    it('calcula un sello SHA-256 inmutable con prefijo SHA256:', async () => {
      const hash = await computeSha256('Transferencia SPEI CANACO 2026');
      expect(hash).toMatch(/^SHA256:[a-f0-9]{64}$/);
    });

    it('clasifica comprobantes de pago SPEI y extrae monto y RFC', () => {
      const text =
        'Comprobante de transferencia SPEI por $2,500.00 MXN con RFC COM850101XYZ y folio de rastreo SPEI-998811.';
      const res = classifyPayloadDeterministic(text, {});

      expect(res.categoria).toBe('comprobante_pago');
      expect(res.confianza).toBeGreaterThan(0.9);
      expect(res.datos_extraidos.rfc).toBe('COM850101XYZ');
      expect(res.datos_extraidos.monto).toBe(2500);
      expect(res.datos_extraidos.folio_rastreo).toBe('SPEI-998811');
      expect(res.datos_extraidos.metodo).toBe('SPEI');
    });

    it('clasifica datos fiscales y constancias CSF del SAT', () => {
      const text =
        'Constancia de Situacion Fiscal SAT para la razon social ABARROTES DEL MAYAB con RFC AMA920315AA1 regimen RESICO';
      const res = classifyPayloadDeterministic(text, {});

      expect(res.categoria).toBe('datos_fiscales');
      expect(res.datos_extraidos.rfc).toBe('AMA920315AA1');
      expect(res.datos_extraidos.regimen_fiscal).toBe('RESICO');
    });

    it('clasifica machotes y plantillas institucionales (Modo Sarita)', () => {
      const text =
        'Machote de circular gremial para envio a pavel@arksystems.site con plantilla de aviso Buen Fin 2026';
      const res = classifyPayloadDeterministic(text, {});

      expect(res.categoria).toBe('plantilla_contenido');
      expect(res.resumen).toContain('Modo Sarita');
    });

    it('clasifica articulos y fundamentos legales de la LFT y CFF', () => {
      const text =
        'Analisis del Articulo 132 fraccion VIII Bis de la LFT sobre obligacion de registro de reloj checador y jornada';
      const res = classifyPayloadDeterministic(text, {});

      expect(res.categoria).toBe('texto_legal');
    });
  });

  describe('Endpoints Hono (/api/bots)', () => {
    it('GET /api/bots/health reporta estado operativo y Modo Sarita activo', async () => {
      const env = createMockEnv();
      const req = new Request('https://ledger.arksystems.site/api/bots/health', {
        method: 'GET',
      });

      const res = await botApp.fetch(req, env);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.supported_bots).toContain('grok');
      expect(json.supported_bots).toContain('hermes');
      expect(json.modo_sarita.activo).toBe(true);
    });

    it('POST /api/bots/ingest procesa payload de bot Grok y sella en D1', async () => {
      const env = createMockEnv();
      const payload = {
        bot: 'grok',
        source: 'grok' as const,
        tenant_id: 'canaco_merida',
        text: 'Notificacion de bot Grok: Comprobante SPEI liquidado $2,125.00 MXN para socio CANACO con RFC CMA9901018X1 y folio SPEI-ARK-2026',
      };

      const req = new Request('https://ledger.arksystems.site/api/bots/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await botApp.fetch(req, env);
      expect(res.status).toBe(201);

      const json = (await res.json()) as any;
      expect(json.success).toBe(true);
      expect(json.bot).toBe('grok');
      expect(json.classification.categoria).toBe('comprobante_pago');
      expect(json.classification.datos_extraidos.rfc).toBe('CMA9901018X1');
      expect(json.sello_sha256).toMatch(/^SHA256:[a-f0-9]{64}$/);
      expect(json.d1_persisted).toBe(true);
    });

    it('POST /api/bots/ingest procesa payload de bot Hermes (Nous Research)', async () => {
      const env = createMockEnv();
      const payload = {
        bot: 'hermes',
        source: 'nous_research' as const,
        text: 'Hermes Agent: Constancia de situacion fiscal SAT extraida para comercio RFC HME201010AB2 regimen RESICO',
      };

      const req = new Request('https://ledger.arksystems.site/api/bots/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await botApp.fetch(req, env);
      expect(res.status).toBe(201);

      const json = (await res.json()) as any;
      expect(json.success).toBe(true);
      expect(json.classification.categoria).toBe('datos_fiscales');
      expect(json.classification.datos_extraidos.rfc).toBe('HME201010AB2');
    });

    it('POST /api/bots/ingest rechaza cuando BOT_INGEST_SECRET es requerido y no coincide', async () => {
      const env = createMockEnv({ BOT_INGEST_SECRET: 'secreto-super-seguro' });
      const req = new Request('https://ledger.arksystems.site/api/bots/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-equivocado',
        },
        body: JSON.stringify({ text: 'test' }),
      });

      const res = await botApp.fetch(req, env);
      expect(res.status).toBe(401);

      const json = (await res.json()) as any;
      expect(json.error).toContain('no autorizado');
    });
  });
});

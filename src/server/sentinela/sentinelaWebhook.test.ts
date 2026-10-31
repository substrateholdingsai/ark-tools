import { describe, it, expect } from 'vitest';
import {
  calculateHmacSha256Hex,
  verifySentinelaSignature,
  handleSentinelaApiRequest,
  type SentinelaWebhookPayload,
} from './sentinelaWebhook';
import type { Env } from '../../index';

describe('Sentinela Legal — Integración Webhook & Alertas Regulatorias', () => {
  const mockSecret = 'super_secret_key_12345';

  const samplePayload: SentinelaWebhookPayload = {
    event: 'regulatory.update_detected',
    timestamp: '2026-10-31T12:00:00Z',
    data: {
      id: 'reg_dof_20261031_001',
      channel: 'fiscal',
      source: 'Diario Oficial de la Federación',
      source_url: 'https://dof.gob.mx/nota_detalle.php?codigo=5712345',
      severity: 'critico',
      title: 'Decreto que reforma disposiciones del CFF y Anexo 20 sobre CFDI 4.0',
      effective_date: '2026-11-01',
      summary: 'El SAT actualiza plazos para la cancelación de CFDI y reglas de validación.',
      laws_affected: ['CFF Art. 29-A', 'RMF 2026 Regla 2.7.1.34'],
      action_required: 'Actualizar catálogos y validar plazos de cancelación en el auditor fiscal.',
    },
  };

  describe('Criptografía & Verificación de Firmas HMAC-SHA256', () => {
    it('calcula la firma HMAC-SHA256 hex determinista', async () => {
      const data = 'test-message';
      const sig1 = await calculateHmacSha256Hex(mockSecret, data);
      const sig2 = await calculateHmacSha256Hex(mockSecret, data);
      expect(sig1).toHaveLength(64);
      expect(sig1).toBe(sig2);
    });

    it('valida una firma correcta con prefijo sha256=', async () => {
      const body = JSON.stringify(samplePayload);
      const hex = await calculateHmacSha256Hex(mockSecret, body);
      const isValid = await verifySentinelaSignature(mockSecret, body, `sha256=${hex}`);
      expect(isValid).toBe(true);
    });

    it('valida una firma correcta sin prefijo sha256=', async () => {
      const body = JSON.stringify(samplePayload);
      const hex = await calculateHmacSha256Hex(mockSecret, body);
      const isValid = await verifySentinelaSignature(mockSecret, body, hex);
      expect(isValid).toBe(true);
    });

    it('rechaza firmas alteradas o inválidas', async () => {
      const body = JSON.stringify(samplePayload);
      const invalidHex = '0'.repeat(64);
      const isValid = await verifySentinelaSignature(mockSecret, body, `sha256=${invalidHex}`);
      expect(isValid).toBe(false);
    });

    it('rechaza cuando falta el secreto o el header', async () => {
      expect(await verifySentinelaSignature('', 'data', 'sig')).toBe(false);
      expect(await verifySentinelaSignature(mockSecret, 'data', null)).toBe(false);
      expect(await verifySentinelaSignature(mockSecret, 'data', undefined)).toBe(false);
    });
  });

  describe('Handler HTTP handleSentinelaApiRequest', () => {
    function createMockDb() {
      const stored: any[] = [];
      return {
        prepare: (_query: string) => {
          let boundParams: any[] = [];
          return {
            bind: (...params: any[]) => {
              boundParams = params;
              return {
                run: async () => {
                  stored.push(boundParams);
                  return { success: true };
                },
                all: async () => {
                  return {
                    results: [
                      {
                        id: 'reg_dof_20261031_001',
                        channel: 'fiscal',
                        source: 'Diario Oficial de la Federación',
                        source_url: 'https://dof.gob.mx/test',
                        severity: 'critico',
                        title: 'Alerta Fiscal de Prueba',
                        summary: 'Resumen de prueba',
                        effective_date: '2026-11-01',
                        laws_affected: JSON.stringify(['CFF']),
                        action_required: 'Revisar sistemas',
                        created_at: '2026-10-31 12:00:00',
                        read_status: 0,
                      },
                    ],
                  };
                },
              };
            },
          };
        },
      } as unknown as D1Database;
    }

    const mockEnv = {
      ARK_TOOLS_DB: createMockDb(),
      SENTINELA_WEBHOOK_SECRET: mockSecret,
      ENVIRONMENT: 'test',
    } as unknown as Env;

    const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

    it('procesa un webhook válido con firma correcta y almacena en D1', async () => {
      const rawBody = JSON.stringify(samplePayload);
      const signature = await calculateHmacSha256Hex(mockSecret, rawBody);

      const request = new Request('https://ledger.arksystems.site/api/webhooks/sentinela', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentinela-Signature': `sha256=${signature}`,
        },
        body: rawBody,
      });

      const response = await handleSentinelaApiRequest(request, mockEnv, corsHeaders);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(200);

      const json = (await response?.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.event_id).toBe(samplePayload.data.id);
      expect(json.channel).toBe('fiscal');
    });

    it('rechaza webhook cuando la firma no coincide', async () => {
      const rawBody = JSON.stringify(samplePayload);
      const badSignature = 'sha256=' + 'a'.repeat(64);

      const request = new Request('https://ledger.arksystems.site/api/webhooks/sentinela', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentinela-Signature': badSignature,
        },
        body: rawBody,
      });

      const response = await handleSentinelaApiRequest(request, mockEnv, corsHeaders);
      expect(response?.status).toBe(401);
      const json = (await response?.json()) as any;
      expect(json.error).toContain('Firma de webhook de Sentinela inválida');
    });

    it('rechaza webhook con JSON malformado', async () => {
      const rawBody = '{ broken json ';
      const signature = await calculateHmacSha256Hex(mockSecret, rawBody);

      const request = new Request('https://ledger.arksystems.site/api/webhooks/sentinela', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentinela-Signature': `sha256=${signature}`,
        },
        body: rawBody,
      });

      const response = await handleSentinelaApiRequest(request, mockEnv, corsHeaders);
      expect(response?.status).toBe(400);
      const json = (await response?.json()) as any;
      expect(json.error).toContain('Payload JSON inválido');
    });

    it('retorna eventos regulatorios en GET /api/regulatory/events', async () => {
      const request = new Request(
        'https://ledger.arksystems.site/api/regulatory/events?channel=fiscal&limit=10',
        {
          method: 'GET',
        }
      );

      const response = await handleSentinelaApiRequest(request, mockEnv, corsHeaders);
      expect(response?.status).toBe(200);
      const json = (await response?.json()) as any;
      expect(json.ok).toBe(true);
      expect(json.total).toBe(1);
      expect(json.events[0].title).toBe('Alerta Fiscal de Prueba');
      expect(json.events[0].laws_affected).toEqual(['CFF']);
    });

    it('retorna null para rutas ajenas a Sentinela', async () => {
      const request = new Request('https://ledger.arksystems.site/api/otra/ruta', {
        method: 'GET',
      });
      const response = await handleSentinelaApiRequest(request, mockEnv, corsHeaders);
      expect(response).toBeNull();
    });
  });
});

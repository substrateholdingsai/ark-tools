import { describe, it, expect, vi } from 'vitest';
import {
  verifyConektaSignature,
  createCanacoConektaCheckout,
  handleCanacoConektaApiRequest,
} from './canacoConektaService';
import type { Env } from '../index';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function generateRsaKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
}

async function exportPublicKeyPem(key: CryptoKey): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', key);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(spki)));
  return `-----BEGIN PUBLIC KEY-----${b64}-----END PUBLIC KEY-----`;
}

async function signPayload(payload: string, privateKey: CryptoKey): Promise<string> {
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(payload)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

describe('CANACO SERVYTUR Mérida — Conekta Service', () => {
  it('verifica exitosamente una firma RSA válida de Conekta (DIGEST)', async () => {
    const { publicKey, privateKey } = await generateRsaKeyPair();
    const pem = await exportPublicKeyPem(publicKey);
    const rawBody = JSON.stringify({ id: 'evt_123', type: 'order.paid' });
    const digest = await signPayload(rawBody, privateKey);

    const result = await verifyConektaSignature(rawBody, digest, pem);
    expect(result.valid).toBe(true);
  });

  it('rechaza una firma Conekta si el payload fue manipulado', async () => {
    const { publicKey, privateKey } = await generateRsaKeyPair();
    const pem = await exportPublicKeyPem(publicKey);
    const rawBody = JSON.stringify({ id: 'evt_123', amount: 2000 });
    const tamperedBody = JSON.stringify({ id: 'evt_123', amount: 9999 });
    const digest = await signPayload(rawBody, privateKey);

    const result = await verifyConektaSignature(tamperedBody, digest, pem);
    expect(result.valid).toBe(false);
  });

  it('crea sesión en modo simulado cuando CONEKTA_PRIVATE_KEY no está configurada', async () => {
    const env = {
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const result = await createCanacoConektaCheckout(env, {
      razonSocial: 'Abarrotes del Mayab S.A.',
      rfc: 'AMA200101AB1',
      folioSiem: 'SIEM-MID-2026-AMA2-MIC-4819',
      email: 'facturas@mayab.mx',
      monto: 2000,
    });

    expect(result.ok).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.url).toContain('conekta_simulated=1');
  });

  it('procesa el webhook order.paid y actualiza el socio a "Socio Activo" en D1', async () => {
    const { publicKey, privateKey } = await generateRsaKeyPair();
    const pem = await exportPublicKeyPem(publicKey);

    const mockLead = {
      id: 'lead-can-conekta-1',
      web: 'Comercializadora Peninsular S.A.',
      email: 'admin@peninsular.mx',
      status: 'Nuevo / Pendiente',
      notas: 'Folio SIEM: SIEM-MID-2026-CPS1-MIC-9988 | Cuota: $2,000 MXN',
      contacto_nombre: 'Ing. Rodrigo Canto',
    };

    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('FROM leads_ark_tools')) return mockLead;
          return null;
        }),
        run: vi.fn(async () => ({ success: true })),
      })),
    };

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      CONEKTA_WEBHOOK_PUBLIC_KEY: pem,
      APP_URL: 'https://ledger.arksystems.site',
    } as unknown as Env;

    const eventPayload = {
      id: 'evt_conekta_test_1',
      type: 'order.paid',
      data: {
        object: {
          id: 'ord_live_12345',
          amount: 200000,
          customer_info: { email: 'admin@peninsular.mx', name: 'Ing. Rodrigo Canto' },
          metadata: {
            folioSiem: 'SIEM-MID-2026-CPS1-MIC-9988',
            rfc: 'CPS200101XYZ',
            razonSocial: 'Comercializadora Peninsular S.A.',
            email: 'admin@peninsular.mx',
          },
        },
      },
    };

    const rawBody = JSON.stringify(eventPayload);
    const digest = await signPayload(rawBody, privateKey);

    const request = new Request('https://ledger.arksystems.site/api/canaco/conekta/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        digest,
      },
      body: rawBody,
    });

    const response = await handleCanacoConektaApiRequest(request, env, corsHeaders);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(200);

    const json = (await response?.json()) as {
      ok: boolean;
      received: boolean;
      status: string;
      folioSiem: string;
    };
    expect(json.ok).toBe(true);
    expect(json.received).toBe(true);
    expect(json.status).toBe('Socio Activo');
    expect(json.folioSiem).toBe('SIEM-MID-2026-CPS1-MIC-9988');
  });

  it('informa el estatus de la conexión en GET /api/canaco/conekta/status', async () => {
    const env = {
      CONEKTA_PRIVATE_KEY: 'key_test_123456789',
      CONEKTA_WEBHOOK_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----',
      CONEKTA_ENVIRONMENT: 'sandbox',
    } as unknown as Env;

    const request = new Request('https://ledger.arksystems.site/api/canaco/conekta/status', {
      method: 'GET',
    });

    const response = await handleCanacoConektaApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(200);

    const json = (await response?.json()) as {
      ok: boolean;
      configured: boolean;
      webhookConfigured: boolean;
      speiTransferEnabled: boolean;
    };
    expect(json.ok).toBe(true);
    expect(json.configured).toBe(true);
    expect(json.webhookConfigured).toBe(true);
    expect(json.speiTransferEnabled).toBe(true);
  });
});

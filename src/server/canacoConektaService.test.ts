import { describe, it, expect, vi } from 'vitest';
import {
  verifyConektaSignature,
  createCanacoConektaCheckout,
  handleCanacoConektaApiRequest,
} from './canacoConektaService';
import { canonicalizarRfc } from './canacoLifecycle';
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
  it('valida fecha calendario y la forma de tres caracteres de la homoclave RFC', () => {
    expect(canonicalizarRfc('CPM2106158A1')).toBe('CPM2106158A1');
    expect(canonicalizarRfc('CPM2102308A1')).toBeNull();
    expect(canonicalizarRfc('CPM0102298A1')).toBeNull();
    expect(canonicalizarRfc('CPM0002298A1')).toBe('CPM0002298A1');
    expect(canonicalizarRfc('CPM210615A1')).toBeNull();
  });

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

  it('mantiene el checkout en simulación mientras precio no está confirmado', async () => {
    const env = {
      APP_URL: 'https://ledger.arksystems.site',
      CONEKTA_PRIVATE_KEY: 'test_private_key',
    } as unknown as Env;

    const result = await createCanacoConektaCheckout(env, {
      razonSocial: 'Comercializadora del Mayab',
      rfc: 'CPM2106158A1',
      folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
      email: 'demo@example.invalid',
      numEmpleados: 15,
      leadId: 'lead-demo-1',
      paymentIntentId: 'intent-demo-1',
      metodoPago: 'tarjeta',
    });

    expect(result.ok).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.url).toContain('conekta_simulated=1');
  });

  it.skip('cobra según empleados estructurados aunque las notas difieran y reconoce la orden original', async () => {
    const { publicKey, privateKey } = await generateRsaKeyPair();
    const pem = await exportPublicKeyPem(publicKey);
    const lead = {
      id: 'lead-repeat-checkout',
      web: 'Comercializadora del Mayab',
      whatsapp: '9999123456',
      email: 'demo@example.invalid',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Registrado',
      lifecycle_stage: 'registrado',
      canonical_rfc: 'CPM2106158A1',
      contacto_nombre: 'Fernando Pech',
      num_empleados: 15,
      notas:
        'Razón Social: COMERCIALIZADORA DEL MAYAB | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Empleados: 5 | Cuota: $2,000 MXN',
    };
    const intentState: { current: Record<string, any> | null } = { current: null };
    let leadStage = 'registrado';
    let activated = false;
    let checkoutMetadata: Record<string, string> | null = null;
    let checkoutPayload: {
      line_items: Array<{ unit_price: number }>;
      metadata: Record<string, string>;
    } | null = null;
    const providerFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const requestBody = JSON.parse(String(init?.body)) as {
        line_items: Array<{ unit_price: number }>;
        metadata: Record<string, string>;
      };
      checkoutPayload = requestBody;
      checkoutMetadata = requestBody.metadata;
      return Response.json({
        id: 'ord-original-checkout',
        checkout: { url: 'https://checkout.test/original' },
      });
    });
    const mockDb = {
      prepare: vi.fn((query: string) => {
        const statement = {
          bind: vi.fn(() => statement),
          first: vi.fn(async () => {
            if (query.includes('FROM canaco_payment_intents')) {
              if (query.includes('WHERE transaction_reference = ?')) {
                return intentState.current?.status === 'paid'
                  ? {
                      id: intentState.current.id,
                      lead_id: intentState.current.lead_id,
                      transaction_reference: intentState.current.transaction_reference,
                      status: intentState.current.status,
                    }
                  : null;
              }
              return intentState.current;
            }
            if (query.includes('FROM leads_ark_tools')) {
              return activated
                ? { ...lead, status: 'Socio Activo', lifecycle_stage: 'socio_activo' }
                : {
                    ...lead,
                    status: leadStage === 'pago_pendiente' ? 'Pago Pendiente' : 'Registrado',
                    lifecycle_stage: leadStage,
                  };
            }
            return null;
          }),
          run: vi.fn(async () => ({ success: true, meta: { changes: 0 } })),
        };
        return statement;
      }),
      batch: vi.fn(async (statements: unknown[]) => {
        if (statements.length === 3 && !intentState.current) {
          const metadata = checkoutMetadata!;
          intentState.current = {
            id: metadata.paymentIntentId,
            lead_id: lead.id,
            rfc: metadata.rfc,
            folio_siem: metadata.folioSiem,
            razon_social: (metadata.razonSocial || '').toUpperCase(),
            email: metadata.email,
            num_empleados: Number(metadata.numEmpleados),
            sector: metadata.sector,
            amount_cents: 370000,
            channel: 'conekta_card',
            environment: 'production',
            order_id: 'ord-original-checkout',
            checkout_url: 'https://checkout.test/original',
            transaction_reference: null,
            status: 'created',
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          };
          leadStage = 'pago_pendiente';
          return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }, { meta: { changes: 1 } }];
        }
        activated = true;
        if (intentState.current) {
          intentState.current.status = 'paid';
          intentState.current.transaction_reference = 'ord-original-checkout';
        }
        return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }, { meta: { changes: 1 } }];
      }),
    };
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
      CONEKTA_PRIVATE_KEY: 'test-private-key',
      CONEKTA_ENVIRONMENT: 'production',
      CANACO_PRICING_CONFIRMED: 'true',
      CONEKTA_WEBHOOK_PUBLIC_KEY: pem,
    } as unknown as Env;

    try {
      const checkoutRequest = () =>
        new Request('https://ledger.arksystems.site/api/canaco/conekta/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: lead.id, metodoPago: 'tarjeta' }),
        });
      const firstCheckout = await handleCanacoConektaApiRequest(
        checkoutRequest(),
        env,
        corsHeaders
      );
      expect(firstCheckout?.status).toBe(200);
      expect(await firstCheckout?.json()).toMatchObject({ orderId: 'ord-original-checkout' });
      expect(checkoutPayload).toMatchObject({
        metadata: { numEmpleados: '15' },
        line_items: [{ unit_price: 370000 }],
      });

      const repeatedCheckout = await handleCanacoConektaApiRequest(
        checkoutRequest(),
        env,
        corsHeaders
      );
      expect(repeatedCheckout?.status).toBe(200);
      expect(await repeatedCheckout?.json()).toMatchObject({
        ok: true,
        reused: true,
        orderId: 'ord-original-checkout',
        url: 'https://checkout.test/original',
      });
      expect(intentState.current?.status).toBe('created');
      expect(providerFetch).toHaveBeenCalledOnce();

      const metadata = checkoutMetadata!;
      const payload = {
        id: 'evt-original-order-paid',
        type: 'order.paid',
        data: {
          object: {
            id: 'ord-original-checkout',
            amount: 370000,
            currency: 'MXN',
            customer_info: { email: metadata.email, name: metadata.razonSocial },
            metadata,
          },
        },
      };
      const rawBody = JSON.stringify(payload);
      const digest = await signPayload(rawBody, privateKey);
      const paymentResponse = await handleCanacoConektaApiRequest(
        new Request('https://ledger.arksystems.site/api/canaco/conekta/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', digest },
          body: rawBody,
        }),
        env,
        corsHeaders
      );
      expect(paymentResponse?.status, await paymentResponse?.clone().text()).toBe(200);
      expect(await paymentResponse?.json()).toMatchObject({ status: 'Socio Activo' });
      expect(intentState.current?.status).toBe('paid');
    } finally {
      providerFetch.mockRestore();
    }
  });

  it('no crea una orden cuando el registro carece de empleados estructurados aunque las notas los incluyan', async () => {
    const lead = {
      id: 'lead-without-structured-employees',
      web: 'Empresa Demo',
      email: 'demo@example.invalid',
      ciudad: 'Mérida',
      especialidad: 'comercio',
      status: 'Registrado',
      lifecycle_stage: 'registrado',
      canonical_rfc: 'CPM2106158A1',
      contacto_nombre: 'Contacto Demo',
      num_empleados: null,
      notas:
        'Razón Social: EMPRESA DEMO | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Empleados: 15 | Cuota: $3,700 MXN',
    };
    const mockDb = {
      prepare: vi.fn((query: string) => {
        const statement = {
          bind: vi.fn(() => statement),
          first: vi.fn(async () => (query.includes('FROM leads_ark_tools') ? lead : null)),
          run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
        };
        return statement;
      }),
      batch: vi.fn(async () => [{ meta: { changes: 1 } }]),
    };
    const providerFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ id: 'ord-should-not-exist' }));
    const env = {
      ARK_TOOLS_DB: mockDb as any,
      APP_URL: 'https://ledger.arksystems.site',
      CONEKTA_PRIVATE_KEY: 'test-private-key',
      CONEKTA_ENVIRONMENT: 'production',
      CANACO_PRICING_CONFIRMED: 'true',
    } as unknown as Env;

    try {
      const response = await handleCanacoConektaApiRequest(
        new Request('https://ledger.arksystems.site/api/canaco/conekta/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: lead.id, metodoPago: 'tarjeta' }),
        }),
        env,
        corsHeaders
      );

      expect(response?.status).toBe(409);
      expect(await response?.json()).toMatchObject({
        error: expect.stringContaining('número de empleados estructurado válido'),
      });
      expect(providerFetch).not.toHaveBeenCalled();
      expect(mockDb.batch).not.toHaveBeenCalled();
    } finally {
      providerFetch.mockRestore();
    }
  });

  it.skip('procesa el webhook order.paid y actualiza el socio a "Socio Activo" en D1', async () => {
    const { publicKey, privateKey } = await generateRsaKeyPair();
    const pem = await exportPublicKeyPem(publicKey);

    const mockLead = {
      id: 'lead-can-conekta-1',
      web: 'Comercializadora del Mayab',
      email: 'demo@example.invalid',
      status: 'Pago Pendiente',
      lifecycle_stage: 'pago_pendiente',
      canonical_rfc: 'CPM2106158A1',
      especialidad: 'comercio',
      notas:
        'Razón Social: COMERCIALIZADORA DEL MAYAB | RFC: CPM2106158A1 | Folio SIEM: SIEM-MID-2026-CPM2-PEQ-4242 | Estrato: PEQUEÑA (15 emp.) | Empleados: 15 | Cuota: $3,700 MXN',
      contacto_nombre: 'Fernando Pech',
    };

    const mockIntent = {
      id: 'intent-can-conekta-1',
      lead_id: mockLead.id,
      rfc: 'CPM2106158A1',
      folio_siem: 'SIEM-MID-2026-CPM2-PEQ-4242',
      razon_social: 'COMERCIALIZADORA DEL MAYAB',
      email: 'demo@example.invalid',
      num_empleados: 15,
      sector: 'comercio',
      amount_cents: 370000,
      channel: 'conekta_card',
      environment: 'production',
      order_id: 'ord_test_12345',
      transaction_reference: null as string | null,
      status: 'created',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    let activated = false;
    const preparedQueries: string[] = [];
    const mockDb = {
      prepare: vi.fn((query: string) => {
        preparedQueries.push(query);
        const statement = {
          bind: vi.fn(() => statement),
          first: vi.fn(async () => {
            if (query.includes('WHERE transaction_reference = ?')) {
              return mockIntent.status === 'paid'
                ? {
                    id: mockIntent.id,
                    lead_id: mockIntent.lead_id,
                    transaction_reference: mockIntent.transaction_reference,
                    status: mockIntent.status,
                  }
                : null;
            }
            if (query.includes('FROM canaco_payment_intents')) return mockIntent;
            if (query.includes('FROM leads_ark_tools')) {
              return activated
                ? { ...mockLead, status: 'Socio Activo', lifecycle_stage: 'socio_activo' }
                : mockLead;
            }
            return null;
          }),
          run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
        };
        return statement;
      }),
      batch: vi.fn(async () => {
        activated = true;
        mockIntent.status = 'paid';
        mockIntent.transaction_reference = 'ord_test_12345';
        return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }, { meta: { changes: 1 } }];
      }),
    };

    const env = {
      ARK_TOOLS_DB: mockDb as any,
      CONEKTA_WEBHOOK_PUBLIC_KEY: pem,
      APP_URL: 'https://ledger.arksystems.site',
      CONEKTA_ENVIRONMENT: 'production',
    } as unknown as Env;

    const eventPayload = {
      id: 'evt_conekta_test_1',
      type: 'order.paid',
      data: {
        object: {
          id: 'ord_test_12345',
          amount: 370000,
          currency: 'MXN',
          customer_info: { email: 'demo@example.invalid', name: 'Fernando Pech' },
          metadata: {
            folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
            rfc: 'CPM2106158A1',
            razonSocial: 'COMERCIALIZADORA DEL MAYAB',
            email: 'demo@example.invalid',
            numEmpleados: '15',
            sector: 'comercio',
            totalCentavos: '370000',
            leadId: 'lead-can-conekta-1',
            paymentIntentId: 'intent-can-conekta-1',
            environment: 'production',
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
    expect(response?.status, await response?.clone().text()).toBe(200);

    const json = (await response?.json()) as {
      ok: boolean;
      received: boolean;
      status: string;
      folioSiem: string;
    };
    expect(json.ok).toBe(true);
    expect(json.received).toBe(true);
    expect(json.status).toBe('Socio Activo');
    expect(json.folioSiem).toBe('SIEM-MID-2026-CPM2-PEQ-4242');
    expect(mockDb.batch).toHaveBeenCalledOnce();
    expect(preparedQueries.some((query) => query.includes('payment_environment = ?'))).toBe(true);

    const replayRequest = new Request('https://ledger.arksystems.site/api/canaco/conekta/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        digest,
      },
      body: rawBody,
    });
    const replayResponse = await handleCanacoConektaApiRequest(replayRequest, env, corsHeaders);
    expect(replayResponse?.status).toBe(200);
    expect(await replayResponse?.json()).toMatchObject({ replay: true });
    expect(mockDb.batch).toHaveBeenCalledTimes(2);
  });

  it.skip('rechaza un importe de webhook distinto de la cotización calculada antes de consultar D1', async () => {
    const { publicKey, privateKey } = await generateRsaKeyPair();
    const pem = await exportPublicKeyPem(publicKey);
    const prepare = vi.fn();
    const env = {
      ARK_TOOLS_DB: { prepare } as unknown as Env['ARK_TOOLS_DB'],
      CONEKTA_WEBHOOK_PUBLIC_KEY: pem,
    } as unknown as Env;
    const eventPayload = {
      id: 'evt_conekta_mismatch',
      type: 'order.paid',
      data: {
        object: {
          id: 'ord_mismatch',
          amount: 200000,
          currency: 'MXN',
          customer_info: { email: 'demo@example.invalid' },
          metadata: {
            folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
            rfc: 'CPM2106158A1',
            razonSocial: 'COMERCIALIZADORA DEL MAYAB',
            email: 'demo@example.invalid',
            numEmpleados: '15',
            sector: 'comercio',
            totalCentavos: '200000',
            leadId: 'lead-demo-1',
          },
        },
      },
    };
    const rawBody = JSON.stringify(eventPayload);
    const digest = await signPayload(rawBody, privateKey);
    const request = new Request('https://ledger.arksystems.site/api/canaco/conekta/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', digest },
      body: rawBody,
    });

    const response = await handleCanacoConektaApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(422);
    expect(prepare).not.toHaveBeenCalled();
  });

  it.skip('rechaza un webhook sin firma y no consulta ni modifica D1', async () => {
    const prepare = vi.fn();
    const env = {
      ARK_TOOLS_DB: { prepare } as unknown as Env['ARK_TOOLS_DB'],
      CONEKTA_WEBHOOK_PUBLIC_KEY: 'configured-key',
    } as unknown as Env;
    const request = new Request('https://ledger.arksystems.site/api/canaco/conekta/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'evt_unsigned', type: 'order.paid' }),
    });

    const response = await handleCanacoConektaApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(400);
    expect(prepare).not.toHaveBeenCalled();
  });

  it.skip('rechaza un RFC del webhook que no coincide con la intención almacenada', async () => {
    const { publicKey, privateKey } = await generateRsaKeyPair();
    const mockIntent = {
      id: 'intent-identity-check',
      lead_id: 'lead-identity-check',
      rfc: 'CPM2106158A1',
      folio_siem: 'SIEM-MID-2026-CPM2-PEQ-4242',
      razon_social: 'COMERCIALIZADORA DEL MAYAB',
      email: 'demo@example.invalid',
      num_empleados: 15,
      sector: 'comercio',
      amount_cents: 370000,
      channel: 'conekta_card',
      environment: 'production',
      order_id: 'ord_identity_check',
      status: 'created',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    const batch = vi.fn();
    const env = {
      ARK_TOOLS_DB: {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () =>
            query.includes('FROM canaco_payment_intents') ? mockIntent : null
          ),
        })),
        batch,
      } as unknown as Env['ARK_TOOLS_DB'],
      CONEKTA_WEBHOOK_PUBLIC_KEY: await exportPublicKeyPem(publicKey),
      CONEKTA_ENVIRONMENT: 'production',
    } as unknown as Env;
    const payload = {
      id: 'evt_identity_check',
      type: 'order.paid',
      data: {
        object: {
          id: 'ord_identity_check',
          amount: 370000,
          currency: 'MXN',
          metadata: {
            folioSiem: 'SIEM-MID-2026-CPM2-PEQ-4242',
            rfc: 'AAA2106158A1',
            razonSocial: 'COMERCIALIZADORA DEL MAYAB',
            email: 'demo@example.invalid',
            numEmpleados: '15',
            sector: 'comercio',
            totalCentavos: '370000',
            leadId: 'lead-identity-check',
            paymentIntentId: 'intent-identity-check',
            environment: 'production',
          },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const digest = await signPayload(rawBody, privateKey);
    const request = new Request('https://ledger.arksystems.site/api/canaco/conekta/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', digest },
      body: rawBody,
    });

    const response = await handleCanacoConektaApiRequest(request, env, corsHeaders);
    expect(response?.status).toBe(409);
    expect(batch).not.toHaveBeenCalled();
  });

  it('informa el estatus de la conexión en GET /api/canaco/conekta/status', async () => {
    const env = {
      CONEKTA_PRIVATE_KEY: 'key_test_123456789',
      CONEKTA_WEBHOOK_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----',
      CONEKTA_ENVIRONMENT: 'sandbox',
      CANACO_PRICING_CONFIRMED: 'true',
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

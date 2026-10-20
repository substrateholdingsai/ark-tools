import { describe, expect, it, vi, beforeEach } from 'vitest';
import { handleAlegraApiRequest } from './alegraApi';
import { AlegraClient } from './alegraClient';
import { decryptToken, encryptToken, getAlegraEncryptionSecret } from './credentials';
import { checkAlegraAccountsHealth } from './cron';
import type { Env } from '../../index';
import type { AuthPrincipal } from '../auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tools.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
};

const mockUser: AuthPrincipal = {
  id: 'user-alegra-owner',
  email: 'despacho@example.com',
  fullName: 'Contador Titular',
  platformRole: 'user',
};

function createMockEnv(dbOverrides?: any): Env {
  return {
    ENVIRONMENT: 'test',
    APP_NAME: 'ARK TOOLS',
    APP_VERSION: '1.0.0',
    APP_URL: 'https://tools.arksystems.site',
    COMPANY_NAME: 'ARK Systems',
    COMPANY_EMAIL: 'soporte@mail.arksystems.site',
    SUPPORT_URL: 'https://arksystems.site',
    ALEGRA_ENCRYPTION_KEY: 'test-secret-key-32-bytes-long!!',
    RESEND_API_KEY: 're_test_key_123',
    AUTH_EMAIL_FROM: 'ARK TOOLS <no-reply@mail.arksystems.site>',
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
    ARK_TOOLS_DB: dbOverrides as unknown as D1Database,
  };
}

describe('Alegra CFDI 4.0 Integration — Backend Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────
  // 1. CREDENTIALS ENCRYPTION / DECRYPTION
  // ─────────────────────────────────────────────────────────────────
  describe('AES-GCM Credentials (credentials.ts)', () => {
    it('encrypts and decrypts Alegra tokens without plaintext exposure', async () => {
      const secret = 'super-secret-key-for-test-999';
      const originalToken = 'alegra_tok_live_1234567890abcdef';

      const encrypted = await encryptToken(originalToken, secret);
      expect(encrypted).not.toEqual(originalToken);
      expect(encrypted).toContain(':');

      const decrypted = await decryptToken(encrypted, secret);
      expect(decrypted).toEqual(originalToken);
    });

    it('throws error when decrypting with wrong key or tampered payload', async () => {
      const secret = 'key-one-12345';
      const wrongSecret = 'key-two-67890';
      const token = 'my-token';

      const encrypted = await encryptToken(token, secret);
      await expect(decryptToken(encrypted, wrongSecret)).rejects.toThrow();
      await expect(decryptToken('invalid-format', secret)).rejects.toThrow();
    });

    it('falls back to default secret when ALEGRA_ENCRYPTION_KEY is unset', () => {
      const env = createMockEnv();
      delete (env as any).ALEGRA_ENCRYPTION_KEY;
      const secret = getAlegraEncryptionSecret(env);
      expect(secret).toBeTruthy();
      expect(typeof secret).toBe('string');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 2. REST CLIENT (alegraClient.ts)
  // ─────────────────────────────────────────────────────────────────
  describe('Alegra REST Client (alegraClient.ts)', () => {
    it('sets correct Basic Auth header and parses company with CSD', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 9988,
          name: 'Despacho Alfa SC',
          identification: 'ALF010101XYZ',
          regime: '601',
          certificate: { status: 'active' },
        }),
      });
      globalThis.fetch = mockFetch;

      const client = new AlegraClient('test@alegra.com', 'tok_123');
      const company = await client.getCompany();

      expect(company.name).toBe('Despacho Alfa SC');
      expect(company.identification).toBe('ALF010101XYZ');
      expect(company.csd_configured).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.alegra.com/api/v1/company',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it('translates HTTP 401 and 403 into friendly AlegraError messages', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Unauthorized' }),
      });

      const client = new AlegraClient('bad@alegra.com', 'bad_tok');
      await expect(client.getCompany()).rejects.toThrow(/Email o token incorrecto/);
    });

    it('creates and stamps CFDI 4.0 invoice with PAC Quadrum', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 5001,
          numberTemplate: { prefix: 'FAC', number: '101' },
          date: '2026-10-16',
          total: 5800,
          status: 'open',
          client: {
            name: 'Cliente SA de CV',
            identification: 'CLI010101AAA',
          },
          stamp: {
            uuid: '3A56D123-BEEF-4567-8901-ABCDEF123456',
            date: '2026-10-16T12:00:00Z',
            xml: 'https://alegra.com/xml/5001',
            pdf: 'https://alegra.com/pdf/5001',
          },
        }),
      });

      const client = new AlegraClient('user@test.com', 'token_ok');
      const invoice = await client.createInvoice({
        date: '2026-10-16',
        client: {
          name: 'Cliente SA de CV',
          identification: 'CLI010101AAA',
          cfdiUse: 'G03',
          regime: '601',
          address: { zipCode: '06600' },
        },
        items: [
          {
            name: 'Honorarios Contables',
            price: 5000,
            quantity: 1,
            tax: [{ percentage: 16 }],
          },
        ],
        stamp: { generateStamp: true },
      });

      expect(invoice.id).toBe('5001');
      expect(invoice.stamp?.uuid).toBe('3A56D123-BEEF-4567-8901-ABCDEF123456');
      expect(invoice.stamp?.pdf).toBe('https://alegra.com/pdf/5001');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. ALEGRA API ENDPOINTS (alegraApi.ts)
  // ─────────────────────────────────────────────────────────────────
  describe('Alegra API Worker Endpoints (alegraApi.ts)', () => {
    it('GET /api/alegra/accounts returns accounts for tenant without token leakage', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho Pinos', role: 'owner' };
            }
            return null;
          }),
          all: vi.fn(async () => {
            if (query.includes('FROM tenant_alegra_accounts')) {
              return {
                results: [
                  {
                    tenant_id: 't-123',
                    alegra_account_id: 'acc-uuid-1',
                    alegra_email: 'alegra@pinos.com',
                    alegra_company_name: 'Pinos SC',
                    alegra_company_id: '99',
                    alegra_rfc: 'PIN010101AAA',
                    csd_configured: 1,
                    is_default: 1,
                    status: 'active',
                    last_checked_at: 1792000000,
                    last_error: null,
                    created_at: 1792000000,
                    updated_at: 1792000000,
                  },
                ],
              };
            }
            return { results: [] };
          }),
        })),
      };
      const env = createMockEnv(mockDb);

      const req = new Request('https://tools.arksystems.site/api/alegra/accounts?tenant_id=t-123', {
        method: 'GET',
      });
      const res = await handleAlegraApiRequest(req, env, corsHeaders, mockUser);
      expect(res?.status).toBe(200);

      const data = (await res?.json()) as any;
      expect(data.accounts).toHaveLength(1);
      expect(data.accounts[0].alegra_company_name).toBe('Pinos SC');
      expect(data.accounts[0].csd_configured).toBe(true);
      expect(data.accounts[0].is_default).toBe(true);
      // Verify token is never exposed to frontend
      expect(data.accounts[0].alegra_token_enc).toBeUndefined();
    });

    it('POST /api/alegra/accounts validates with Alegra, encrypts token, and persists account', async () => {
      // Mock Alegra /company endpoint
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 8877,
          name: 'Consultores Contables SA',
          identification: 'CON010101XYZ',
          csd: true,
        }),
      });

      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho Pinos', role: 'owner' };
            }
            if (query.includes('SELECT COUNT(*) as count FROM tenant_alegra_accounts')) {
              return { count: 0 };
            }
            return null;
          }),
          run: vi.fn(async () => ({ success: true })),
        })),
      };
      const env = createMockEnv(mockDb);

      const req = new Request('https://tools.arksystems.site/api/alegra/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 't-123',
          alegra_email: 'contable@empresa.com',
          alegra_token: 'secret_token_alegra_123',
        }),
      });

      const res = await handleAlegraApiRequest(req, env, corsHeaders, mockUser);
      expect(res?.status).toBe(201);

      const data = (await res?.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.account.alegra_company_name).toBe('Consultores Contables SA');
      expect(data.account.is_default).toBe(true);
      expect(data.account.alegra_token_enc).toBeUndefined();
    });

    it('POST /api/alegra/invoices creates stamped CFDI 4.0 invoice and stores in D1', async () => {
      const secret = 'test-secret-key-32-bytes-long!!';
      const encToken = await encryptToken('real_alegra_token_xyz', secret);

      // Mock Alegra API invoice creation
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 7001,
          numberTemplate: { prefix: 'F', number: '202' },
          date: '2026-10-16',
          total: 1160,
          status: 'open',
          client: {
            name: 'Cliente Final SAS',
            identification: 'CFS020202999',
          },
          stamp: {
            uuid: '8B765432-1234-5678-ABCD-0987654321AB',
            date: '2026-10-16T15:30:00Z',
            xml: 'https://alegra.com/xml/7001',
            pdf: 'https://alegra.com/pdf/7001',
          },
        }),
      });

      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho Pinos', role: 'owner' };
            }
            if (query.includes('FROM tenant_alegra_accounts')) {
              return {
                tenant_id: 't-123',
                alegra_account_id: 'acc-1',
                alegra_email: 'admin@pinos.com',
                alegra_token_enc: encToken,
                alegra_company_name: 'Pinos SC',
                status: 'active',
                csd_configured: 1,
              };
            }
            return null;
          }),
          run: vi.fn(async () => ({ success: true })),
        })),
      };
      const env = createMockEnv(mockDb);

      const req = new Request('https://tools.arksystems.site/api/alegra/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 't-123',
          alegra_account_id: 'acc-1',
          invoice: {
            date: '2026-10-16',
            client: {
              name: 'Cliente Final SAS',
              identification: 'CFS020202999',
              cfdiUse: 'G03',
              regime: '601',
              address: { zipCode: '06600' },
            },
            items: [
              {
                name: 'Servicio Contable',
                price: 1000,
                quantity: 1,
                tax: [{ percentage: 16 }],
              },
            ],
          },
        }),
      });

      const res = await handleAlegraApiRequest(req, env, corsHeaders, mockUser);
      expect(res?.status).toBe(201);

      const data = (await res?.json()) as any;
      expect(data.ok).toBe(true);
      expect(data.invoice.uuid).toBe('8B765432-1234-5678-ABCD-0987654321AB');
      expect(data.invoice.folio).toBe('F-202');
      expect(data.invoice.pdf_url).toBe('https://alegra.com/pdf/7001');
    });

    it('DELETE /api/alegra/accounts/:id removes account from D1', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho Pinos', role: 'owner' };
            }
            return null;
          }),
          run: vi.fn(async () => ({ success: true })),
        })),
      };
      const env = createMockEnv(mockDb);

      const req = new Request(
        'https://tools.arksystems.site/api/alegra/accounts/acc-delete-1?tenant_id=t-123',
        { method: 'DELETE' }
      );

      const res = await handleAlegraApiRequest(req, env, corsHeaders, mockUser);
      expect(res?.status).toBe(200);
      const data = (await res?.json()) as any;
      expect(data.ok).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. PERIODIC HEALTH CHECK (cron.ts)
  // ─────────────────────────────────────────────────────────────────
  describe('Periodic Health Check Cron (cron.ts)', () => {
    it('updates last_checked_at on active accounts and flags revoked accounts', async () => {
      const secret = 'test-secret-key-32-bytes-long!!';
      const encToken = await encryptToken('dummy_tok', secret);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Unauthorized' }),
      });

      const updateMock = vi.fn(async () => ({ success: true }));
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn(async () => {
            if (query.includes("WHERE status = 'active'")) {
              return {
                results: [
                  {
                    tenant_id: 't-123',
                    alegra_account_id: 'acc-health-1',
                    alegra_email: 'contacto@alegra.com',
                    alegra_token_enc: encToken,
                    alegra_company_name: 'Despacho',
                    status: 'active',
                    csd_configured: 1,
                  },
                ],
              };
            }
            return { results: [] };
          }),
          run: updateMock,
        })),
      };
      const env = createMockEnv(mockDb);

      const stats = await checkAlegraAccountsHealth(env);
      expect(stats.checked).toBe(1);
      expect(stats.revoked).toBe(1);
      expect(updateMock).toHaveBeenCalled();
    });
  });
});

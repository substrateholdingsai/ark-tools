import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleAuthApiRequest } from './auth';
import type { Env } from '../index';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tools.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function createVerificationDb() {
  let tokenClaimed = false;
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'Test User',
    platform_role: 'user' as const,
  };
  const tenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    slug: 'test-tenant',
    role: 'owner' as const,
  };

  const db = {
    prepare: vi.fn((query: string) => {
      const statement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('UPDATE auth_tokens SET used_at')) {
            if (tokenClaimed) return null;
            tokenClaimed = true;
            return { user_id: user.id };
          }
          if (query.includes('UPDATE users SET password_hash')) {
            return user;
          }
          if (query.includes('SELECT id, email, full_name, platform_role FROM users')) {
            return user;
          }
          return null;
        }),
        all: vi.fn(async () => ({ results: [tenant] })),
        run: vi.fn(async () => ({ success: true })),
      };
      return statement;
    }),
    batch: vi.fn(async () => []),
  };

  return db;
}

describe('Native auth API', () => {
  it('disables the legacy client-controlled identity endpoint', async () => {
    const response = await handleAuthApiRequest(
      new Request('https://tools.arksystems.site/api/auth/sync', { method: 'POST' }),
      {} as Env,
      corsHeaders,
      null
    );

    expect(response?.status).toBe(410);
  });

  it('claims an email verification token once, even when requests race', async () => {
    const db = createVerificationDb();
    const env = {
      ARK_TOOLS_DB: db,
      APP_URL: 'https://tools.arksystems.site',
    } as unknown as Env;
    const token = 'a'.repeat(64);
    const makeRequest = () =>
      new Request('https://tools.arksystems.site/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: 'a-secure-password-123' }),
      });

    const responses = await Promise.all([
      handleAuthApiRequest(makeRequest(), env, corsHeaders, null),
      handleAuthApiRequest(makeRequest(), env, corsHeaders, null),
    ]);

    expect(responses.map((response) => response?.status).sort()).toEqual([200, 400]);
    const accepted = responses.find((response) => response?.status === 200);
    expect(accepted?.headers.get('Set-Cookie')).toContain('HttpOnly');
    expect(accepted?.headers.get('Set-Cookie')).toContain('Secure');
    const body = await accepted?.json();
    expect(body).toMatchObject({
      user: { email: 'user@example.com' },
      tenants: [{ id: 'tenant-1', role: 'owner' }],
    });
    expect(JSON.stringify(body)).not.toContain(token);
  });

  it('does not set a password during registration for an existing unverified account', async () => {
    const queries: string[] = [];
    const db = {
      prepare: vi.fn((query: string) => {
        queries.push(query);
        return {
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('INSERT INTO auth_rate_limits')) return { attempts: 1 };
            if (query.includes('SELECT id, email_verified_at')) {
              return { id: 'legacy-user', email_verified_at: null };
            }
            return null;
          }),
          all: vi.fn(async () => ({ results: [] })),
          run: vi.fn(async () => ({ success: true })),
        };
      }),
      batch: vi.fn(async () => []),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    const response = await handleAuthApiRequest(
      new Request('https://tools.arksystems.site/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'legacy@example.com',
          password: 'attacker-chosen-password',
        }),
      }),
      {
        ARK_TOOLS_DB: db,
        APP_URL: 'https://tools.arksystems.site',
        RESEND_API_KEY: 'test-key',
        AUTH_EMAIL_FROM: 'ARK TOOLS <no-reply@example.com>',
      } as unknown as Env,
      corsHeaders,
      null
    );

    expect(response?.status).toBe(202);
    expect(queries.some((query) => /UPDATE users SET password_hash/i.test(query))).toBe(false);
    expect(queries.some((query) => /INSERT INTO users/i.test(query))).toBe(false);
  });

  it('returns 400 for malformed authentication JSON', async () => {
    const response = await handleAuthApiRequest(
      new Request('https://tools.arksystems.site/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
      { ARK_TOOLS_DB: {} } as unknown as Env,
      corsHeaders,
      null
    );

    expect(response?.status).toBe(400);
  });
});

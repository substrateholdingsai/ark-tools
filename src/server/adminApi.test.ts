import { describe, expect, it, vi } from 'vitest';
import { handleAdminApiRequest } from './adminApi';
import type { Env } from '../index';
import type { AuthPrincipal } from './auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ledger.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
};

const regularUser: AuthPrincipal = {
  id: 'user-regular',
  email: 'regular@example.com',
  fullName: 'Regular User',
  platformRole: 'user',
};

const superAdminUser: AuthPrincipal = {
  id: 'user-admin',
  email: 'admin@example.com',
  fullName: 'Super Admin',
  platformRole: 'super_admin',
};

function createMockDb() {
  return {
    prepare: vi.fn((query: string) => {
      const statement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('COUNT(*)')) return { total: 42 };
          if (query.includes('UPDATE users SET platform_role')) {
            return {
              id: 'user-target',
              email: 'target@example.com',
              full_name: 'Target User',
              platform_role: 'super_admin',
            };
          }
          return null;
        }),
        all: vi.fn(async () => {
          if (query.includes('FROM users')) {
            return {
              results: [
                {
                  id: 'user-1',
                  email: 'test@example.com',
                  full_name: 'Test',
                  platform_role: 'user',
                  created_at: '2026-10-16 00:00:00',
                  email_verified_at: 1792190000,
                },
              ],
            };
          }
          if (query.includes('FROM tenant_memberships')) {
            return {
              results: [
                {
                  user_id: 'user-1',
                  tenant_id: 'tenant-1',
                  tenant_name: 'Despacho Test',
                  role: 'owner',
                },
              ],
            };
          }
          if (query.includes('FROM tenants')) {
            return {
              results: [
                {
                  id: 'tenant-1',
                  name: 'Despacho Test',
                  slug: 'despacho-test',
                  created_at: '2026-10-16 00:00:00',
                  member_count: 1,
                  client_count: 5,
                  expediente_count: 12,
                },
              ],
            };
          }
          return { results: [] };
        }),
        run: vi.fn(async () => ({ success: true })),
      };
      return statement;
    }),
  };
}

describe('Admin API Handlers', () => {
  it('returns 401 when principal is missing', async () => {
    const response = await handleAdminApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/overview'),
      {} as Env,
      corsHeaders,
      null
    );
    expect(response?.status).toBe(401);
  });

  it('returns 403 when principal is not a super_admin', async () => {
    const response = await handleAdminApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/overview'),
      {} as Env,
      corsHeaders,
      regularUser
    );
    expect(response?.status).toBe(403);
    const body = await response?.json();
    expect(body).toMatchObject({ error: expect.stringContaining('super_admin') });
  });

  it('allows super_admin to access /api/admin/overview', async () => {
    const db = createMockDb();
    const env = {
      ARK_TOOLS_DB: db,
      AI: {},
      RESEND_API_KEY: 'test_key',
      CLIP_API_KEY: 'test_clip',
      CLIP_API_SECRET: 'test_secret',
      ENVIRONMENT: 'production',
      APP_VERSION: '1.0.0',
    } as unknown as Env;

    const response = await handleAdminApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/overview'),
      env,
      corsHeaders,
      superAdminUser
    );

    expect(response?.status).toBe(200);
    const body = await response?.json();
    expect(body).toMatchObject({
      success: true,
      counts: expect.objectContaining({ totalUsers: 42 }),
      systemHealth: expect.objectContaining({
        database: 'operational',
        aiWorkers: true,
        resendEmail: true,
        clipPayments: true,
      }),
    });
  });

  it('allows super_admin to fetch users directory with joined tenants', async () => {
    const db = createMockDb();
    const env = { ARK_TOOLS_DB: db } as unknown as Env;

    const response = await handleAdminApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/users'),
      env,
      corsHeaders,
      superAdminUser
    );

    expect(response?.status).toBe(200);
    const body = (await response?.json()) as {
      success: boolean;
      users: Array<{ id: string; tenants: unknown[] }>;
    };
    expect(body.success).toBe(true);
    expect(body.users.length).toBeGreaterThan(0);
    expect(body.users[0]?.tenants.length).toBe(1);
  });

  it('prevents a super_admin from demoting themselves', async () => {
    const db = createMockDb();
    const env = { ARK_TOOLS_DB: db } as unknown as Env;

    const response = await handleAdminApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: superAdminUser.id, role: 'user' }),
      }),
      env,
      corsHeaders,
      superAdminUser
    );

    expect(response?.status).toBe(400);
    const body = await response?.json();
    expect(body).toMatchObject({ error: expect.stringContaining('no puedes revocar') });
  });

  it('allows super_admin to promote another user to super_admin', async () => {
    const db = createMockDb();
    const env = { ARK_TOOLS_DB: db } as unknown as Env;

    const response = await handleAdminApiRequest(
      new Request('https://ledger.arksystems.site/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-target', role: 'super_admin' }),
      }),
      env,
      corsHeaders,
      superAdminUser
    );

    expect(response?.status).toBe(200);
    const body = await response?.json();
    expect(body).toMatchObject({
      success: true,
      user: expect.objectContaining({ platform_role: 'super_admin' }),
    });
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { handleInvitationsApiRequest } from './invitationsApi';
import type { Env } from '../index';
import type { AuthPrincipal } from './auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tools.arksystems.site',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
};

const ownerUser: AuthPrincipal = {
  id: 'user-owner-1',
  email: 'owner@example.com',
  fullName: 'Despacho Owner',
  platformRole: 'user',
};

const adminUser: AuthPrincipal = {
  id: 'user-admin-1',
  email: 'admin@example.com',
  fullName: 'Despacho Admin',
  platformRole: 'user',
};

const regularMember: AuthPrincipal = {
  id: 'user-member-1',
  email: 'colaborador@example.com',
  fullName: 'Colaborador Regular',
  platformRole: 'user',
};

const superAdmin: AuthPrincipal = {
  id: 'user-super-1',
  email: 'super@example.com',
  fullName: 'Super Admin',
  platformRole: 'super_admin',
};

function createMockEnv(dbOverrides?: Record<string, unknown>): Env {
  return {
    ENVIRONMENT: 'test',
    APP_NAME: 'ARK TOOLS',
    APP_VERSION: '1.0.0',
    APP_URL: 'https://tools.arksystems.site',
    COMPANY_NAME: 'ARK Systems',
    COMPANY_EMAIL: 'soporte@mail.arksystems.site',
    SUPPORT_URL: 'https://arksystems.site',
    RESEND_API_KEY: 're_test_key_123',
    AUTH_EMAIL_FROM: 'ARK TOOLS <no-reply@mail.arksystems.site>',
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
    ARK_TOOLS_DB: dbOverrides as unknown as D1Database,
  };
}

describe('Invitations & Team Collaboration API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/invitations/info', () => {
    it('returns 400 for invalid token format', async () => {
      const env = createMockEnv();
      const req = new Request('https://tools.arksystems.site/api/invitations/info?token=invalid-short', {
        method: 'GET',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, null);
      expect(res?.status).toBe(400);
      const data = await res?.json() as { valid: boolean; error: string };
      expect(data.valid).toBe(false);
      expect(data.error).toContain('Token');
    });

    it('returns 404 when invitation is not found', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => null),
        })),
      };
      const env = createMockEnv(mockDb);
      const validHexToken = 'a'.repeat(64);
      const req = new Request(`https://tools.arksystems.site/api/invitations/info?token=${validHexToken}`, {
        method: 'GET',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, null);
      expect(res?.status).toBe(404);
      const data = await res?.json() as { valid: boolean; error: string };
      expect(data.valid).toBe(false);
      expect(data.error).toContain('no encontrada');
    });

    it('returns 410 when invitation is expired', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const mockDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => ({
            id: 'inv-1',
            tenant_id: 't-1',
            email: 'test@example.com',
            role: 'member',
            created_at: pastTime - 86400,
            expires_at: pastTime,
            accepted_at: null,
            revoked_at: null,
            tenant_name: 'Despacho Contable',
            inviter_email: 'owner@example.com',
            inviter_name: 'Titular',
          })),
        })),
      };
      const env = createMockEnv(mockDb);
      const validHexToken = 'b'.repeat(64);
      const req = new Request(`https://tools.arksystems.site/api/invitations/info?token=${validHexToken}`, {
        method: 'GET',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, null);
      expect(res?.status).toBe(410);
      const data = await res?.json() as { valid: boolean; error: string };
      expect(data.valid).toBe(false);
      expect(data.error).toContain('expirado');
    });

    it('returns 200 with valid invitation details', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 86400 * 5;
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_invitations')) {
              return {
                id: 'inv-123',
                tenant_id: 't-1',
                email: 'invited@example.com',
                role: 'member',
                created_at: 1792190000,
                expires_at: futureTime,
                accepted_at: null,
                revoked_at: null,
                tenant_name: 'Despacho Los Pinos',
                inviter_email: 'owner@example.com',
                inviter_name: 'Lic. Perez',
              };
            }
            if (query.includes('FROM users WHERE lower(email)')) {
              return { id: 'user-already-registered' };
            }
            return null;
          }),
        })),
      };
      const env = createMockEnv(mockDb);
      const validHexToken = 'c'.repeat(64);
      const req = new Request(`https://tools.arksystems.site/api/invitations/info?token=${validHexToken}`, {
        method: 'GET',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, null);
      expect(res?.status).toBe(200);
      const data = await res?.json() as {
        valid: boolean;
        invitation: { email: string; tenantName: string; role: string; inviterName: string };
        userExists: boolean;
      };
      expect(data.valid).toBe(true);
      expect(data.invitation.tenantName).toBe('Despacho Los Pinos');
      expect(data.invitation.role).toBe('member');
      expect(data.userExists).toBe(true);
    });
  });

  describe('GET /api/tenants/:id/members', () => {
    it('returns 401 when not authenticated', async () => {
      const env = createMockEnv();
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/members', {
        method: 'GET',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, null);
      expect(res?.status).toBe(401);
    });

    it('returns 403 when user is not member of tenant', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => null),
        })),
      };
      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/members', {
        method: 'GET',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, regularMember);
      expect(res?.status).toBe(403);
    });

    it('returns members and invitations for owner/admin', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Mi Despacho', role: 'owner' };
            }
            return null;
          }),
          all: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m') && query.includes('JOIN users u')) {
              return {
                results: [
                  { userId: 'user-owner-1', email: 'owner@example.com', fullName: 'Owner', role: 'owner', joinedAt: 1792000000 },
                ],
              };
            }
            if (query.includes('FROM tenant_invitations i')) {
              return {
                results: [
                  { id: 'inv-1', email: 'pending@example.com', role: 'member', createdAt: 1792100000, expiresAt: 1792700000, invitedByEmail: 'owner@example.com', invitedByName: 'Owner' },
                ],
              };
            }
            return { results: [] };
          }),
        })),
      };
      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/members', {
        method: 'GET',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, ownerUser);
      expect(res?.status).toBe(200);
      const data = await res?.json() as {
        tenantId: string;
        currentUserRole: string;
        members: unknown[];
        invitations: unknown[];
      };
      expect(data.tenantId).toBe('t-123');
      expect(data.currentUserRole).toBe('owner');
      expect(data.members.length).toBe(1);
      expect(data.invitations.length).toBe(1);
    });
  });

  describe('POST /api/tenants/:id/invitations', () => {
    it('rejects invitation if caller is regular member', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => ({ id: 't-123', name: 'Despacho', role: 'member' })),
        })),
      };
      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', role: 'member' }),
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, regularMember);
      expect(res?.status).toBe(403);
    });

    it('rejects admin role invitation if caller is not owner or super_admin', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => ({ id: 't-123', name: 'Despacho', role: 'admin' })),
        })),
      };
      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin2@example.com', role: 'admin' }),
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, adminUser);
      expect(res?.status).toBe(403);
      const data = await res?.json() as { error: string };
      expect(data.error).toContain('Solo el titular');
    });

    it('creates invitation and sends email when valid', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return new Response(JSON.stringify({ id: 'resend_email_id' }), { status: 200 });
      });

      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho Fiscal', role: 'owner' };
            }
            if (query.includes('auth_rate_limits')) {
              return { attempts: 1 };
            }
            if (query.includes('FROM tenant_memberships tm')) {
              return null; // not a member yet
            }
            if (query.includes('FROM tenants WHERE id = ?')) {
              return { name: 'Despacho Fiscal' };
            }
            if (query.includes('FROM tenant_invitations')) {
              return null; // no existing invite
            }
            return null;
          }),
          run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
        })),
      };

      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nuevo.contador@example.com', role: 'member' }),
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, ownerUser);
      expect(res?.status).toBe(201);
      const data = await res?.json() as { success: boolean; invitation: { email: string; role: string } };
      expect(data.success).toBe(true);
      expect(data.invitation.email).toBe('nuevo.contador@example.com');
      expect(data.invitation.role).toBe('member');
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe('POST /api/invitations/accept', () => {
    it('accepts invitation for authenticated matching user', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_invitations i') && query.includes('JOIN tenants t')) {
              return {
                id: 'inv-456',
                tenant_id: 't-123',
                email: 'colaborador@example.com',
                role: 'member',
                expires_at: Math.floor(Date.now() / 1000) + 86400,
                accepted_at: null,
                revoked_at: null,
                tenant_name: 'Despacho Alianza',
              };
            }
            if (query.includes('FROM users WHERE id = ?')) {
              return {
                id: 'user-member-1',
                email: 'colaborador@example.com',
                fullName: 'Colaborador Regular',
                platformRole: 'user',
              };
            }
            return null;
          }),
          all: vi.fn(async () => ({
            results: [{ id: 't-123', name: 'Despacho Alianza', slug: 'despacho-alianza', role: 'member' }],
          })),
          run: vi.fn(async () => ({ success: true })),
        })),
        batch: vi.fn(async () => []),
      };

      const env = createMockEnv(mockDb);
      const token = 'd'.repeat(64);
      const req = new Request('https://tools.arksystems.site/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const res = await handleInvitationsApiRequest(req, env, corsHeaders, regularMember);
      expect(res?.status).toBe(200);
      const data = await res?.json() as { success: boolean; session: { user: { email: string } } };
      expect(data.success).toBe(true);
      expect(data.session.user.email).toBe('colaborador@example.com');
      expect(res?.headers.get('Set-Cookie')).toContain('ark_session=');
    });

    it('rejects if logged-in user email does not match invited email', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => ({
            id: 'inv-789',
            tenant_id: 't-123',
            email: 'other@example.com',
            role: 'member',
            expires_at: Math.floor(Date.now() / 1000) + 86400,
            accepted_at: null,
            revoked_at: null,
            tenant_name: 'Despacho Alianza',
          })),
        })),
      };

      const env = createMockEnv(mockDb);
      const token = 'e'.repeat(64);
      const req = new Request('https://tools.arksystems.site/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const res = await handleInvitationsApiRequest(req, env, corsHeaders, regularMember);
      expect(res?.status).toBe(403);
      const data = await res?.json() as { error: string };
      expect(data.error).toContain('La invitación fue enviada a other@example.com');
    });

    it('registers new user when unauthenticated and password valid', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_invitations i') && query.includes('JOIN tenants t')) {
              return {
                id: 'inv-new-user',
                tenant_id: 't-123',
                email: 'newuser@example.com',
                role: 'member',
                expires_at: Math.floor(Date.now() / 1000) + 86400,
                accepted_at: null,
                revoked_at: null,
                tenant_name: 'Despacho Alianza',
              };
            }
            if (query.includes('FROM users WHERE lower(email)')) {
              return null; // user does not exist yet
            }
            if (query.includes('FROM users WHERE id = ?')) {
              return {
                id: 'user-new-id',
                email: 'newuser@example.com',
                fullName: 'Nuevo Contador',
                platformRole: 'user',
              };
            }
            return null;
          }),
          all: vi.fn(async () => ({
            results: [{ id: 't-123', name: 'Despacho Alianza', slug: 'despacho-alianza', role: 'member' }],
          })),
          run: vi.fn(async () => ({ success: true })),
        })),
        batch: vi.fn(async () => []),
      };

      const env = createMockEnv(mockDb);
      const token = 'f'.repeat(64);
      const req = new Request('https://tools.arksystems.site/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: 'PasswordSuperSeguro123456!',
          fullName: 'Nuevo Contador',
        }),
      });

      const res = await handleInvitationsApiRequest(req, env, corsHeaders, null);
      expect(res?.status).toBe(200);
      const data = await res?.json() as { success: boolean; session: { user: { fullName: string } } };
      expect(data.success).toBe(true);
      expect(data.session.user.fullName).toBe('Nuevo Contador');
      expect(res?.headers.get('Set-Cookie')).toContain('ark_session=');
    });
  });

  describe('DELETE & PATCH Member Operations', () => {
    it('revokes an invitation', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho', role: 'owner' };
            }
            return null;
          }),
          run: vi.fn(async () => ({ meta: { changes: 1 } })),
        })),
      };
      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/invitations/inv-1', {
        method: 'DELETE',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, ownerUser);
      expect(res?.status).toBe(200);
      const data = await res?.json() as { success: boolean };
      expect(data.success).toBe(true);
    });

    it('prevents removing tenant owner', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho', role: 'owner' };
            }
            if (query.includes('SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?')) {
              return { role: 'owner' };
            }
            return null;
          }),
        })),
      };
      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/members/user-owner-1', {
        method: 'DELETE',
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, superAdmin);
      expect(res?.status).toBe(403);
      const data = await res?.json() as { error: string };
      expect(data.error).toContain('No se puede remover al titular');
    });

    it('allows owner to change a member role', async () => {
      const mockDb = {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn(async () => {
            if (query.includes('FROM tenant_memberships m JOIN tenants t')) {
              return { id: 't-123', name: 'Despacho', role: 'owner' };
            }
            if (query.includes('SELECT role FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?')) {
              return { role: 'member' };
            }
            return null;
          }),
          run: vi.fn(async () => ({ meta: { changes: 1 } })),
        })),
      };
      const env = createMockEnv(mockDb);
      const req = new Request('https://tools.arksystems.site/api/tenants/t-123/members/user-member-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      const res = await handleInvitationsApiRequest(req, env, corsHeaders, ownerUser);
      expect(res?.status).toBe(200);
      const data = await res?.json() as { success: boolean; role: string };
      expect(data.success).toBe(true);
      expect(data.role).toBe('admin');
    });
  });
});

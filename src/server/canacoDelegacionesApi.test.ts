import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../index';
import type { AuthPrincipal, TenantMembership } from './auth';
import { requireTenantMembership } from './auth';
import { handleCanacoDelegacionesApi } from './canacoDelegacionesApi';

vi.mock('./auth', () => ({ requireTenantMembership: vi.fn() }));

const principal: AuthPrincipal = {
  id: 'user-1',
  email: 'admin@example.test',
  fullName: 'Admin',
  platformRole: 'user',
};
const owner: TenantMembership = {
  id: 'canaco_merida',
  name: 'CANACO',
  slug: 'canaco',
  role: 'owner',
};

function setup({ lead = true, delegation = true, changes = 1 } = {}) {
  const statements: Array<{ query: string; args: unknown[] }> = [];
  const db = {
    prepare(query: string) {
      const statement = { query, args: [] as unknown[] };
      statements.push(statement);
      return {
        bind(...args: unknown[]) {
          statement.args = args;
          return this;
        },
        async first() {
          if (query.includes('COUNT(*) AS total')) return { total: 3 };
          if (query.includes('FROM leads_ark_tools')) return lead ? { id: 'lead-1' } : null;
          if (query.includes('FROM canaco_delegaciones'))
            return delegation ? { id: 'del-1' } : null;
          return null;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          return { success: true, meta: { changes } };
        },
      };
    },
  };
  return { env: { ARK_TOOLS_DB: db } as unknown as Env, statements };
}

function request(path = '', method = 'GET', body?: unknown) {
  return new Request(`https://example.test/api/canaco/delegaciones${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe('CANACO delegaciones API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireTenantMembership).mockResolvedValue(owner);
  });

  it('exige sesión y rechaza socios sin rol de administración', async () => {
    const { env } = setup();
    expect((await handleCanacoDelegacionesApi(request(), env, {}, null))?.status).toBe(401);
    vi.mocked(requireTenantMembership).mockResolvedValue({ ...owner, role: 'member' });
    expect((await handleCanacoDelegacionesApi(request(), env, {}, principal))?.status).toBe(403);
    vi.mocked(requireTenantMembership).mockResolvedValue(null);
    expect((await handleCanacoDelegacionesApi(request(), env, {}, principal))?.status).toBe(403);
  });

  it('permite crear solo nombres válidos y rechaza duplicados', async () => {
    const { env, statements } = setup();
    expect(
      (
        await handleCanacoDelegacionesApi(
          request('', 'POST', { nombre: '  Progreso  ' }),
          env,
          {},
          principal
        )
      )?.status
    ).toBe(201);
    expect(statements[0]?.args[1]).toBe('Progreso');
    expect(
      (await handleCanacoDelegacionesApi(request('', 'POST', { nombre: ' ' }), env, {}, principal))
        ?.status
    ).toBe(400);
    const duplicate = setup({ changes: 0 });
    expect(
      (
        await handleCanacoDelegacionesApi(
          request('', 'POST', { nombre: 'Progreso' }),
          duplicate.env,
          {},
          principal
        )
      )?.status
    ).toBe(409);
  });

  it('admite admins camerales y superadministradores sin dar acceso a otros miembros', async () => {
    const { env } = setup();
    vi.mocked(requireTenantMembership).mockResolvedValue({ ...owner, role: 'admin' });
    expect((await handleCanacoDelegacionesApi(request(), env, {}, principal))?.status).toBe(200);
    expect(vi.mocked(requireTenantMembership)).toHaveBeenCalledWith(
      env,
      principal,
      'canaco_merida'
    );
    vi.mocked(requireTenantMembership).mockResolvedValue(null);
    expect(
      (
        await handleCanacoDelegacionesApi(
          request(),
          env,
          {},
          { ...principal, platformRole: 'super_admin' }
        )
      )?.status
    ).toBe(200);
  });

  it('no asigna registros de otro tenant ni delegaciones inexistentes', async () => {
    const body = { delegacionId: 'del-1' };
    const otherTenant = setup({ lead: false });
    expect(
      (
        await handleCanacoDelegacionesApi(
          request('/asignaciones/lead-1', 'PUT', body),
          otherTenant.env,
          {},
          principal
        )
      )?.status
    ).toBe(404);
    expect(
      otherTenant.statements.some((s) => s.query.includes('INSERT INTO canaco_delegacion_leads'))
    ).toBe(false);
    const missing = setup({ delegation: false });
    expect(
      (
        await handleCanacoDelegacionesApi(
          request('/asignaciones/lead-1', 'PUT', body),
          missing.env,
          {},
          principal
        )
      )?.status
    ).toBe(404);
  });

  it('asigna o desasigna un registro CANACO y cuenta los registros sin asignar', async () => {
    const { env, statements } = setup();
    expect(
      (
        await handleCanacoDelegacionesApi(
          request('/asignaciones/lead-1', 'PUT', { delegacionId: 'del-1' }),
          env,
          {},
          principal
        )
      )?.status
    ).toBe(200);
    expect(
      statements.find((s) => s.query.includes('INSERT INTO canaco_delegacion_leads'))?.args
    ).toEqual(['lead-1', 'del-1', 'user-1']);
    expect(
      (
        await handleCanacoDelegacionesApi(
          request('/asignaciones/lead-1', 'PUT', { delegacionId: null }),
          env,
          {},
          principal
        )
      )?.status
    ).toBe(200);
    const response = await handleCanacoDelegacionesApi(request(), env, {}, principal);
    expect(await response?.json()).toMatchObject({
      sinAsignar: 3,
      delegaciones: [],
      asignaciones: [],
    });
  });
});

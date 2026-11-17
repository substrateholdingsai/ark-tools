import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../index';
import type { AuthPrincipal, TenantMembership } from './auth';
import { requireTenantMembership } from './auth';
import { handleCanacoCommsApiRequest } from './canacoCommsApi';

vi.mock('./auth', () => ({ requireTenantMembership: vi.fn() }));

const admin: AuthPrincipal = {
  id: 'admin-1',
  email: 'pavel@arksystems.site',
  fullName: 'Pavel',
  platformRole: 'user',
};
const member: AuthPrincipal = {
  id: 'member-1',
  email: 'member@example.test',
  fullName: 'Member',
  platformRole: 'user',
};
const owner: TenantMembership = {
  id: 'sales-tenant-123',
  name: 'CANACO',
  slug: 'canaco',
  role: 'owner',
};

function setup(eligibleIds = ['contact-real']) {
  const statements: Array<{ query: string; args: unknown[] }> = [];
  const storedJob = {
    job_id: 'job-123',
    draft_json: JSON.stringify({
      channel: 'email',
      idempotency_key: 'idempotency-key-123456',
      dry_run: true,
      tenant_id: 'sales-tenant-123',
      audience: { contact_ids: ['contact-real'] },
    }),
    status: 'pending_approval',
    preview_expires_at: new Date(Date.now() + 60_000).toISOString() as string | null,
  };
  const db = {
    prepare(query: string) {
      const statement = { query, args: [] as unknown[] };
      statements.push(statement);
      return {
        bind(...args: unknown[]) {
          statement.args = args;
          return this;
        },
        async all() {
          if (query.includes('SELECT id FROM leads_ark_tools')) {
            return { results: eligibleIds.map((id) => ({ id })) };
          }
          return { results: [] };
        },
        async first() {
          return query.includes('SELECT job_id, draft_json') ? storedJob : null;
        },
        async run() {
          return { success: true };
        },
      };
    },
  };
  const env = {
    ARK_TOOLS_DB: db,
    SALES_WORKER_URL: 'https://sales.example.test',
    SALES_WORKER_INTERNAL_KEY: 'test-internal-key',
    CANACO_SALES_TENANT_ID: 'sales-tenant-123',
  } as unknown as Env;
  return { env, statements, storedJob };
}

function makeRequest(path: string, method = 'GET', body?: unknown) {
  return new Request(`https://ledger.example.test${path}`, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
}

describe('CANACO Communications proxy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ job_id: 'job-123', status: 'pending_approval' }))
    );
    vi.mocked(requireTenantMembership).mockResolvedValue(owner);
  });

  it('verifies consent and demo status server-side and overrides the tenant before dispatch', async () => {
    const { env, statements } = setup();
    const response = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs', 'POST', {
        tenant_id: 'attacker-tenant',
        channel: 'email',
        contact_ids: ['contact-real', 'contact-demo'],
        dry_run: true,
        idempotency_key: 'idempotency-key-123456',
        subject: 'Aviso',
        body: 'Hola',
      }),
      env,
      {},
      admin
    );

    expect(response?.status).toBe(200);
    const [target, init] = vi.mocked(fetch).mock.calls[0] || [];
    expect(String(target)).toBe('https://sales.example.test/api/internal/campaigns/dispatch');
    expect((init?.headers as Headers).get('X-Ark-Internal-Key')).toBe('test-internal-key');
    const forwarded = JSON.parse(String(init?.body)) as {
      tenant_id: string;
      audience: { contact_ids: string[] };
    };
    expect(forwarded.tenant_id).toBe('sales-tenant-123');
    expect(forwarded.audience.contact_ids).toEqual(['contact-real']);
    const eligibilityQuery = statements.find((statement) =>
      statement.query.includes('SELECT id FROM leads_ark_tools')
    )?.query;
    expect(eligibilityQuery).toContain('COALESCE(is_demo, 0) = 0');
    expect(eligibilityQuery).toContain('COALESCE(arkangel_share_consent, 0) = 1');
    expect(
      statements.some((statement) => statement.query.includes('INSERT INTO canaco_comms_jobs'))
    ).toBe(true);
  });

  it('fails closed without eligible contacts and does not call Sales', async () => {
    const { env } = setup([]);
    const response = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs', 'POST', {
        channel: 'whatsapp',
        contact_ids: ['demo-contact'],
        dry_run: true,
        idempotency_key: 'idempotency-key-123456',
      }),
      env,
      {},
      admin
    );

    expect(response?.status).toBe(400);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('restricts admin actions and proxies approval only for CRM-known jobs', async () => {
    const { env } = setup();
    vi.mocked(requireTenantMembership).mockResolvedValue({ ...owner, role: 'member' });
    const denied = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/templates'),
      env,
      {},
      member
    );
    expect(denied?.status).toBe(403);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();

    const approved = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/approve', 'POST'),
      env,
      {},
      admin
    );
    expect(approved?.status).toBe(200);
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toBe(
      'https://sales.example.test/api/internal/campaigns/job-123/approve'
    );
  });

  it('re-previews the stored idempotent draft', async () => {
    const { env } = setup();
    const previewResponse = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/preview', 'POST'),
      env,
      {},
      admin
    );
    expect(previewResponse?.status).toBe(200);
    const previewRequest = vi.mocked(fetch).mock.calls[0];
    expect(String(previewRequest?.[0])).toBe(
      'https://sales.example.test/api/internal/campaigns/dispatch'
    );
    expect(JSON.parse(String(previewRequest?.[1]?.body))).toMatchObject({
      idempotency_key: 'idempotency-key-123456',
      audience: { contact_ids: ['contact-real'] },
    });
  });

  it('ignores a forged receipt and stores and returns only the Sales receipt', async () => {
    const { env, statements } = setup();
    const receipt = {
      job_id: 'job-123',
      tenant_id: 'sales-tenant-123',
      status: 'completed',
      results: [{ contact_id: 'contact-real', outcome: 'sent' }],
      summary: { sent: 1, total_cost_usd: 2 },
    };
    const forged = {
      results: [{ contact_id: 'contact-real', outcome: 'failed' }],
      summary: { sent: 0, total_cost_usd: 9999 },
    };
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(receipt));
    const receiptResponse = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/receipt', 'POST', forged),
      env,
      {},
      admin
    );
    expect(receiptResponse?.status).toBe(200);
    expect(await receiptResponse?.json()).toEqual(receipt);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body))).toEqual({});
    const update = statements.find((statement) =>
      statement.query.includes('UPDATE canaco_comms_jobs')
    );
    expect(update?.args).toContain(JSON.stringify(receipt));
    expect(update?.args).not.toContain(JSON.stringify(forged));
  });

  it('rejects expired or missing stored preview TTLs without forwarding approval', async () => {
    for (const expiry of [new Date(Date.now() - 1_000).toISOString(), null, 'invalid']) {
      const { env, storedJob } = setup();
      storedJob.preview_expires_at = expiry;
      const response = await handleCanacoCommsApiRequest(
        makeRequest('/api/comms/jobs/job-123/approve', 'POST'),
        env,
        {},
        admin
      );
      expect(response?.status).toBe(409);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    }
  });

  it('records an absolute preview expiry anchored before the Sales request', async () => {
    const { env, statements } = setup();
    const started = Date.now();
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ job_id: 'job-123', status: 'pending_approval', preview_ttl: 600 })
    );
    const response = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs', 'POST', {
        channel: 'email',
        contact_ids: ['contact-real'],
        dry_run: true,
        idempotency_key: 'idempotency-key-123456',
      }),
      env,
      {},
      admin
    );
    const ended = Date.now();
    expect(response?.status).toBe(200);
    const insert = statements.find((statement) =>
      statement.query.includes('INSERT INTO canaco_comms_jobs')
    );
    const expiry = Date.parse(String(insert?.args[8]));
    expect(expiry).toBeGreaterThanOrEqual(started + 600_000);
    expect(expiry).toBeLessThanOrEqual(ended + 600_000);
  });

  it('stores the Sales ISO expiry and fails closed if a refreshed preview lacks a TTL', async () => {
    const expiry = new Date(Date.now() + 120_000).toISOString();
    const { env, statements } = setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json({ job_id: 'job-123', status: 'pending_approval', preview_ttl: expiry })
      )
      .mockResolvedValueOnce(Response.json({ job_id: 'job-123', status: 'pending_approval' }));
    for (let i = 0; i < 2; i++) {
      const response = await handleCanacoCommsApiRequest(
        makeRequest('/api/comms/jobs/job-123/preview', 'POST'),
        env,
        {},
        admin
      );
      expect(response?.status).toBe(200);
    }
    const inserts = statements.filter((statement) =>
      statement.query.includes('INSERT INTO canaco_comms_jobs')
    );
    expect(inserts[0]?.args[8]).toBe(expiry);
    expect(inserts[1]?.args[8]).toBeNull();
  });

  it('loads the canonical Sales receipt in job detail and stores it', async () => {
    const { env, statements } = setup();
    const receipt = {
      job_id: 'job-123',
      tenant_id: 'sales-tenant-123',
      status: 'completed',
      results: [{ contact_id: 'contact-real', outcome: 'sent' }],
      summary: { sent: 1, total_cost_usd: 2 },
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ job_id: 'job-123', status: 'completed' }))
      .mockResolvedValueOnce(Response.json(receipt));
    const response = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123'),
      env,
      {},
      admin
    );
    expect(response?.status).toBe(200);
    expect(await response?.json()).toMatchObject({ receipt });
    expect(String(vi.mocked(fetch).mock.calls[1]?.[0])).toBe(
      'https://sales.example.test/api/internal/campaigns/job-123/receipt'
    );
    const update = statements.find((statement) =>
      statement.query.includes('UPDATE canaco_comms_jobs')
    );
    expect(update?.args).toContain(JSON.stringify(receipt));
  });

  it('rejects a receipt for a different tenant without storing it', async () => {
    const { env, statements } = setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({
        job_id: 'job-123',
        tenant_id: 'other-tenant',
        results: [],
        summary: {},
      })
    );
    const response = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/receipt', 'POST'),
      env,
      {},
      admin
    );
    expect(response?.status).toBe(502);
    expect(
      statements.some((statement) => statement.query.includes('UPDATE canaco_comms_jobs'))
    ).toBe(false);
  });

  it('propagates Sales receipt errors without storing a receipt', async () => {
    const { env, statements } = setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ error: 'unavailable' }, { status: 503 })
    );
    const response = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/receipt', 'POST'),
      env,
      {},
      admin
    );
    expect(response?.status).toBe(503);
    expect(
      statements.some((statement) => statement.query.includes('UPDATE canaco_comms_jobs'))
    ).toBe(false);
  });

  it('does not forward approval for a job that is no longer pending', async () => {
    const { env, storedJob } = setup();
    storedJob.status = 'approved';
    const response = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/approve', 'POST'),
      env,
      {},
      admin
    );
    expect(response?.status).toBe(409);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('denies a non-admin dispatch and approval without forwarding either', async () => {
    const { env } = setup();
    vi.mocked(requireTenantMembership).mockResolvedValue({ ...owner, role: 'member' });
    const dispatch = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs', 'POST', {
        channel: 'email',
        contact_ids: ['contact-real'],
        dry_run: true,
        idempotency_key: 'idempotency-key-123456',
      }),
      env,
      {},
      member
    );
    const approval = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/approve', 'POST'),
      env,
      {},
      member
    );
    expect(dispatch?.status).toBe(403);
    expect(approval?.status).toBe(403);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
});

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
  return { env, statements };
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

  it('re-previews the stored idempotent draft and saves returned receipts in CRM D1', async () => {
    const { env, statements } = setup();
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

    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ accepted: true, summary: { sent: 1, actual_cost: '2.00 MXN' } })
    );
    const receipt = { outcomes: [{ contact_id: 'contact-real', status: 'sent' }] };
    const receiptResponse = await handleCanacoCommsApiRequest(
      makeRequest('/api/comms/jobs/job-123/receipt', 'POST', receipt),
      env,
      {},
      admin
    );
    expect(receiptResponse?.status).toBe(200);
    const update = statements.find((statement) =>
      statement.query.includes('UPDATE canaco_comms_jobs')
    );
    expect(update?.args).toContain(JSON.stringify(receipt));
  });
});

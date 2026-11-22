import { describe, expect, it } from 'vitest';
import { handleMcpApiRequest } from './mcpApi';

const baseEnv = {
  MCP_API_KEY: 'mcp-secret-key',
  LEDGER_MCP_API_KEY: 'mcp-secret-key',
  LEDGER_MCP_TENANT_ID: 'ark',
  APP_VERSION: '1.0.0',
} as any;

const arkUrl = 'https://ark.test/api/mcp?tenantId=ark';
const toolCall = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

function mcpRequest(
  url: string,
  headers: Record<string, string> = {},
  body: unknown = toolCall
): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function call(url: string, env: any, headers: Record<string, string> = {}) {
  return handleMcpApiRequest(mcpRequest(url, headers), env);
}

async function expectRefused(res: Response) {
  expect([401, 403]).toContain(res.status);
  const payload = (await res.json()) as any;
  expect(payload).toMatchObject({ error: expect.any(String) });
  expect(typeof payload.error).toBe('string');
  expect(payload.error.length).toBeGreaterThan(0);
}

describe('MCP API-key auth (fail-closed)', () => {
  it('refuses every /mcp call when LEDGER_MCP_TENANT_ID is unset', async () => {
    const env = { ...baseEnv, LEDGER_MCP_TENANT_ID: undefined } as any;
    const res = await call(arkUrl, env, { Authorization: 'Bearer mcp-secret-key' });
    expect(res.status).toBe(403);
    await expectRefused(res);
  });

  it('refuses the StayPuft key on /mcp', async () => {
    const res = await call(arkUrl, baseEnv, { 'X-StayPuft-Key': 'staypuft-key' });
    expect(res.status).toBe(401);
    await expectRefused(res);
  });

  it('refuses a call with no API key', async () => {
    const res = await call(arkUrl, baseEnv, {});
    expect(res.status).toBe(401);
    await expectRefused(res);
  });

  it('refuses a call with a wrong API key', async () => {
    const res = await call(arkUrl, baseEnv, { Authorization: 'Bearer wrong-key' });
    expect(res.status).toBe(401);
    await expectRefused(res);
  });

  it('refuses a call with a wrong tenant', async () => {
    const res = await call('https://ark.test/api/mcp?tenantId=canaco_merida', baseEnv, {
      Authorization: 'Bearer mcp-secret-key',
    });
    expect(res.status).toBe(403);
    await expectRefused(res);
  });

  it('accepts the dedicated mcp-api-key for the configured tenant', async () => {
    const res = await call(arkUrl, baseEnv, { Authorization: 'Bearer mcp-secret-key' });
    expect(res.status).toBe(200);
    const payload = (await res.json()) as any;
    expect(payload.jsonrpc).toBe('2.0');
    expect(Array.isArray(payload.result.tools)).toBe(true);
  });
});

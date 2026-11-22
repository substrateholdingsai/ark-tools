import { describe, expect, it, vi } from 'vitest';
import { handleMcpApiRequest } from './mcpApi';
import { MAX_USER_TEXT_LENGTH } from './mcpApi';

const env = {
  MCP_API_KEY: 'test-key',
  LEDGER_MCP_API_KEY: 'test-key',
  LEDGER_MCP_TENANT_ID: 'ark',
  APP_VERSION: '1.0.0',
} as any;

function rpc(body: unknown): Request {
  return new Request('https://ark.test/api/mcp?tenantId=ark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-key' },
    body: JSON.stringify(body),
  });
}

async function callTool(name: string, args: unknown) {
  const res = await handleMcpApiRequest(
    rpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
    env
  );
  expect(res.status).toBe(200);
  const payload = (await res.json()) as any;
  return payload.result;
}

describe('MCP safety', () => {
  it('rejects a user-typed field over the length cap', async () => {
    const result = await callTool('calc_isn', {
      estadoId: 'A'.repeat(MAX_USER_TEXT_LENGTH + 1),
      baseGravable: 1000,
      tasa: 3,
      ejercicio: 2026,
    });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.field).toBe('estadoId');
  });

  it('echoes an instruction-like input as plain data without changing behavior', async () => {
    const input = {
      estadoId: 'YUC',
      baseGravable: 250000,
      tasa: 3.75,
      ejercicio: 2026,
      numEmpleados: 15,
      esMicroPequena2026: true,
    };
    const result = await callTool('calc_isn', input);
    expect(result.isError).toBe(false);
    const data = JSON.parse(result.content[0].text);
    expect(data.inputs_echo).toEqual(input);
    expect(data.result.total).toBe(7500);
  });

  it('logs tool, tenant, status and duration but no input value', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const secret = 'super-secret-input-value';
    await callTool('calc_sbc', {
      salarioDiario: 200,
      diasVacaciones: 12,
      primaVacacional: 25,
      diasAguinaldo: 15,
      zona: 'general',
    });
    const logged = spy.mock.calls.map((c) => c.join(' ')).join(' ');
    expect(logged).toContain('calc_sbc');
    expect(logged).toContain('ark');
    expect(logged).toContain('success');
    expect(logged).toContain('ms');
    expect(logged).not.toContain(secret);
    spy.mockRestore();
  });
});

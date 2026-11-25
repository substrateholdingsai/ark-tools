import { describe, expect, it } from 'vitest';
import { handleMcpApiRequest } from './mcpApi';

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

describe('MCP structured errors', () => {
  it('returns VALIDATION_ERROR with field on missing required field', async () => {
    const result = await callTool('calc_isn', {});
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err).toMatchObject({ code: 'VALIDATION_ERROR', field: 'baseGravable' });
    expect(typeof err.message).toBe('string');
  });

  it('returns VALIDATION_ERROR on out-of-range value', async () => {
    const result = await callTool('calc_resico', {
      tipoPersona: 'fisica',
      ingresosCobrados: 50000,
      mes: 13,
    });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.field).toBe('mes');
  });

  it('returns VALIDATION_ERROR on extra property', async () => {
    const result = await callTool('get_fiscal_values', { campoExtra: 1 });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.field).toBe('campoExtra');
  });

  it('returns VALIDATION_ERROR on wrong type', async () => {
    const result = await callTool('calc_sbc', { salarioDiario: 'abc' });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.field).toBe('salarioDiario');
  });

  it('returns UNKNOWN_TOOL for a non-first-release tool name', async () => {
    const result = await callTool('consultar_leads_crm', {});
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err.code).toBe('UNKNOWN_TOOL');
  });

  it('TC-MCP-VAL-EJERCICIO-REGRESSION: MCP ejercicio 2024 still rejected (already passing, regression)', async () => {
    const result = await callTool('calc_isn', {
      baseGravable: 250000,
      tasa: 3.75,
      ejercicio: 2024,
    });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err).toMatchObject({ code: 'VALIDATION_ERROR', field: 'ejercicio' });
  });

  it('TC-MCP-VAL-NOBASE-REGRESSION: MCP missing baseGravable still rejected (already passing, regression)', async () => {
    const result = await callTool('calc_isn', { tasa: 3.75, ejercicio: 2026 });
    expect(result.isError).toBe(true);
    const err = JSON.parse(result.content[0].text);
    expect(err).toMatchObject({ code: 'VALIDATION_ERROR', field: 'baseGravable' });
  });
});

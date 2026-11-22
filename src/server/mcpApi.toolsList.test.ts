import { describe, expect, it } from 'vitest';
import { handleMcpApiRequest } from './mcpApi';
import { AI_TOOLS_CATALOG } from './ai/tools';
import { MCP_FIRST_RELEASE_TOOLS } from './mcpApi';

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

async function listTools() {
  const res = await handleMcpApiRequest(rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }), env);
  expect(res.status).toBe(200);
  const payload = (await res.json()) as any;
  return payload.result.tools as Array<Record<string, any>>;
}

describe('MCP tools/list', () => {
  it('exposes only the nine first-release tools with inputSchema', async () => {
    const tools = await listTools();
    expect(tools.map((t) => t.name)).toEqual(MCP_FIRST_RELEASE_TOOLS.map((t) => t.name));
    for (const tool of tools) {
      expect(tool.inputSchema).toMatchObject({ type: 'object' });
      expect(typeof tool.description).toBe('string');
    }
  });

  it('tools/list returns exactly the nine first-release tools', async () => {
    const tools = await listTools();
    expect(tools).toHaveLength(9);
    expect(tools.map((t) => t.name)).toEqual(MCP_FIRST_RELEASE_TOOLS.map((t) => t.name));
    const expected = new Set([
      'calc_isn',
      'calc_sbc',
      'calc_nomina',
      'calc_finiquito',
      'calc_resico',
      'calc_modalidad40',
      'calc_recargos',
      'calc_retencion_clinicas',
      'get_fiscal_values',
    ]);
    expect(new Set(tools.map((t) => t.name))).toEqual(expected);
  });

  it('forwards annotations verbatim from the catalog', async () => {
    const tools = await listTools();
    for (const tool of tools) {
      const source = AI_TOOLS_CATALOG.find((t) => t.name === tool.name)!;
      if (!source.annotations) {
        expect(tool.annotations).toBeUndefined();
        continue;
      }
      expect(tool.annotations).toEqual(source.annotations);
    }
  });

  it('marks the nine calculation tools readOnly, idempotent and non-destructive', async () => {
    const names = [
      'calc_isn',
      'calc_sbc',
      'calc_nomina',
      'calc_finiquito',
      'calc_resico',
      'calc_modalidad40',
      'calc_recargos',
      'calc_retencion_clinicas',
      'get_fiscal_values',
    ];
    const tools = await listTools();
    for (const name of names) {
      const tool = tools.find((t) => t.name === name)!;
      expect(tool, name).toBeDefined();
      expect(tool.annotations, name).toEqual({
        readOnly: true,
        idempotent: true,
        destructive: false,
        openWorld: false,
      });
    }
  });

  it('ships strict input schemas over the wire', async () => {
    const tools = await listTools();
    for (const name of ['calc_isn', 'calc_sbc', 'calc_nomina', 'get_fiscal_values']) {
      const tool = tools.find((t) => t.name === name)!;
      expect(tool.inputSchema.additionalProperties, name).toBe(false);
    }
  });
});

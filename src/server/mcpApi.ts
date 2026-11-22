import type { Env } from '../index';
import { authenticateRequest, requireTenantMembership } from './auth';
import { STAYPUFT_OPERATOR_ID } from './staypuft/staypuftConnector';
import { verifyStayPuftKey, hasStayPuftHeader } from './staypuft/staypuftConnector';
import { resolveTenantById } from './staypuft/staypuftConnector';
import { timingSafeEqual } from './canacoConektaService';
import { executeAiTool, AI_TOOLS_CATALOG } from './ai/tools';

// Vista MCP de primera entrega: solo estas nueve herramientas se exponen en tools/list.
// Las seis restantes siguen en AI_TOOLS_CATALOG (Noah las usa) pero no se listan aquí.
const MCP_FIRST_RELEASE_TOOL_NAMES = new Set<string>([
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

export const MCP_FIRST_RELEASE_TOOLS = AI_TOOLS_CATALOG.filter((t) =>
  MCP_FIRST_RELEASE_TOOL_NAMES.has(t.name)
);
import type { AiToolFunction } from './ai/types';
import { generateLlmsTxt } from './llmsTxt';
import { sha256 } from './auth';

function extractToken(request: Request): string | null {
  const auth = request.headers.get('Authorization') || request.headers.get('authorization');
  if (typeof auth === 'string') {
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m && m[1]) return m[1].trim();
  }
  const apiKey =
    request.headers.get('X-API-Key') ||
    request.headers.get('x-api-key') ||
    request.headers.get('X-Api-Key');
  if (apiKey && apiKey.trim()) return apiKey.trim();
  return null;
}

async function resolvePrincipal(request: Request, env: Env): Promise<any | null> {
  const principal = await authenticateRequest(request, env);
  if (principal) return principal;

  const token = extractToken(request);
  if (!token) return null;

  if (/^[0-9a-f]{64}$/i.test(token) && env.ARK_TOOLS_DB) {
    const now = Math.floor(Date.now() / 1000);
    try {
      const row = await env.ARK_TOOLS_DB.prepare(
        `SELECT u.id, u.email, COALESCE(u.full_name, '') AS fullName,
                u.platform_role AS platformRole
         FROM auth_sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
           AND u.email_verified_at IS NOT NULL LIMIT 1`
      )
        .bind(await sha256(token), now)
        .first<any>();
      if (row) return row;
    } catch {
      // fail closed
    }
  }

  const configured = env.LEDGER_MCP_API_KEY || env.MCP_API_KEY;
  if (configured) {
    try {
      if (timingSafeEqual(token, configured)) {
        return {
          id: 'mcp-api-key',
          email: 'mcp@ark',
          fullName: 'MCP API Key',
          platformRole: 'user',
        };
      }
    } catch {
      // fail closed
    }
  }

  return null;
}

async function authorizeTenant(
  request: Request,
  url: URL,
  env: Env,
  principal: any
): Promise<{ tenantId: string } | { error: Response }> {
  const requested =
    url.searchParams.get('tenantId')?.trim() ||
    url.searchParams.get('tenant_id')?.trim() ||
    url.searchParams.get('tenant')?.trim() ||
    request.headers.get('X-Tenant-ID')?.trim() ||
    request.headers.get('x-tenant-id')?.trim() ||
    'ark';

  const isSuperAdmin =
    principal.platformRole === 'super_admin' || principal.id === STAYPUFT_OPERATOR_ID;

  if (isSuperAdmin) {
    const resolution = await resolveTenantById(requested, env);
    if (!resolution.valid) {
      return {
        error: new Response(JSON.stringify({ error: 'Tenant no válido.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
      };
    }
    return { tenantId: resolution.tenantId || requested };
  }

  if (principal.id === 'mcp-api-key') {
    const allowed = env.LEDGER_MCP_TENANT_ID || 'ark';
    if (requested !== allowed) {
      return {
        error: new Response(JSON.stringify({ error: 'No tienes acceso a este despacho.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
      };
    }
    return { tenantId: requested };
  }

  const membership = await requireTenantMembership(env, principal, requested);
  if (!membership) {
    return {
      error: new Response(JSON.stringify({ error: 'No tienes acceso a este despacho.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }),
    };
  }
  return { tenantId: requested };
}

async function authenticateMcp(
  request: Request,
  env: Env,
  url: URL
): Promise<{ tenantId: string } | { error: Response }> {
  if (hasStayPuftHeader(request)) {
    const check = verifyStayPuftKey(request, env);
    if (!check.authorized) {
      return {
        error: new Response(JSON.stringify({ error: 'No autorizado.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
      };
    }
  }

  const principal = await resolvePrincipal(request, env);
  if (!principal) {
    return {
      error: new Response(JSON.stringify({ error: 'Autenticación requerida.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      }),
    };
  }

  const authz = await authorizeTenant(request, url, env, principal);
  if ('error' in authz) return authz;
  return { tenantId: authz.tenantId };
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function handleOne(req: any, env: Env, tenantId: string): Promise<any | null> {
  if (!req || typeof req !== 'object' || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
    return jsonRpcError(req?.id, -32600, 'Invalid Request');
  }

  const id = req.id;
  const isNotification = id === undefined;

  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'ARK LEDGER MCP', version: env.APP_VERSION || '1.0.0' },
          instructions: generateLlmsTxt(),
        },
      };
    case 'notifications/initialized':
    case 'initialized':
      return null;
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_FIRST_RELEASE_TOOLS.map((t: AiToolFunction) => {
            const tool: Record<string, unknown> = {
              name: t.name,
              description: t.description,
              inputSchema: t.parameters,
            };
            // Anotaciones de comportamiento: se reenvían verbatim desde el catálogo,
            // única fuente de verdad de las herramientas.
            if (t.annotations) tool.annotations = { ...t.annotations };
            return tool;
          }),
        },
      };
    case 'tools/call': {
      const name = req.params?.name;
      const args = req.params?.arguments ?? {};
      if (typeof name !== 'string' || !name) {
        return jsonRpcError(id, -32602, 'Missing tool name');
      }
      const result = await executeAiTool(name, args, env, tenantId);
      if (!result.success) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: result.error || 'Error' }],
            isError: true,
          },
        };
      }
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result.data) }],
          isError: false,
        },
      };
    }
    default:
      if (isNotification) return null;
      return jsonRpcError(id, -32601, `Method not found: ${req.method}`);
  }
}

export async function handleMcpApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string> = {},
  _principal: any = null
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
    });
  }

  const auth = await authenticateMcp(request, env, url);
  if ('error' in auth) {
    const errHeaders = new Headers(auth.error.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => errHeaders.set(k, v));
    return new Response(auth.error.body, { status: auth.error.status, headers: errHeaders });
  }
  const tenantId = auth.tenantId;

  if (request.method === 'GET') {
    return Response.json(
      { name: 'ARK LEDGER MCP', version: env.APP_VERSION, tools: AI_TOOLS_CATALOG.length },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method Not Allowed' },
      { status: 405, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json(jsonRpcError(null, -32700, 'Parse error'), {
      status: 400,
      headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
    });
  }

  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((r) => handleOne(r, env, tenantId)));
    const responses = results.filter((r) => r !== null);
    return Response.json(responses, {
      status: 200,
      headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
    });
  }

  const rpcResponse = await handleOne(body, env, tenantId);
  if (rpcResponse === null) {
    return new Response(null, {
      status: 202,
      headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
    });
  }
  return Response.json(rpcResponse, {
    status: 200,
    headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
  });
}

export const handleMcpRequest = handleMcpApiRequest;
export const handleMcp = handleMcpApiRequest;
export const handleMcpApi = handleMcpApiRequest;

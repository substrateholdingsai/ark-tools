/**
 * ARK TOOLS — Worker Entry Point
 *
 * Este worker sirve la SPA de herramientas para contadores.
 * En Fase 1, todo el cálculo ocurre en el cliente (React).
 * En Fase 4, se añadirán endpoints para persistencia (D1) y exportación (R2).
 *
 * @see DESIGN_SYSTEM.md — Sistema de diseño
 * @see wrangler.toml — Configuración del worker
 */

import { handleD1ApiRequest } from './server/d1Api';
import { handleAiApiRequest } from './server/ai/aiApi';

export interface Env {
  // Assets (SPA)
  ASSETS: Fetcher;

  // Cloudflare Workers AI
  AI?: Ai;

  // Variables públicas
  ENVIRONMENT: string;
  APP_NAME: string;
  APP_VERSION: string;
  APP_URL: string;
  COMPANY_NAME: string;
  COMPANY_EMAIL: string;
  SUPPORT_URL: string;

  // Credenciales Clip (API Checkout)
  CLIP_API_KEY?: string;
  CLIP_API_SECRET?: string;
  CLIP_ENVIRONMENT?: string;

  // Cloudflare D1 Database (Multi-Tenant)
  ARK_TOOLS_DB?: D1Database;
  // ARK_TOOLS_KV: KVNamespace;
  // ARK_TOOLS_R2: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // ─────────────────────────────────────────────────────────────────
    // API ROUTES (para futuras integraciones)
    // ─────────────────────────────────────────────────────────────────
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx);
    }

    // ─────────────────────────────────────────────────────────────────
    // HEALTH CHECK
    // ─────────────────────────────────────────────────────────────────
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          app: env.APP_NAME,
          version: env.APP_VERSION,
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // SPA FALLBACK (Assets)
    // ─────────────────────────────────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

/**
 * Handler para rutas /api/*.
 * En Fase 1, retorna 501 Not Implemented.
 * En Fase 4, aquí irán los endpoints de persistencia, IA, etc.
 */
async function handleApiRequest(
  request: Request,
  env: Env,
  _ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);

  // CORS para desarrollo local
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ENVIRONMENT === 'production'
      ? 'https://tools.arksystems.site'
      : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
  };

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────────
  // D1 MULTI-TENANT PERSISTENCIA (Guía SAT, Ledger, Activos)
  // ─────────────────────────────────────────────────────────────────
  const d1Response = await handleD1ApiRequest(request, env, corsHeaders);
  if (d1Response) {
    return d1Response;
  }

  // ─────────────────────────────────────────────────────────────────
  // WORKERS AI (Chat, Tools, Models)
  // ─────────────────────────────────────────────────────────────────
  const aiResponse = await handleAiApiRequest(request, env, corsHeaders);
  if (aiResponse) {
    return aiResponse;
  }

  // Endpoints de API

  if (url.pathname === '/api/version') {
    return Response.json(
      {
        name: env.APP_NAME,
        version: env.APP_VERSION,
        environment: env.ENVIRONMENT,
      },
      { headers: corsHeaders }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // CLIP CHECKOUT: ESTADO Y VERIFICACIÓN
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/clip/status') {
    const isConfigured = Boolean(env.CLIP_API_KEY && env.CLIP_API_SECRET);
    return Response.json(
      {
        status: 'ok',
        configured: isConfigured,
        environment: env.CLIP_ENVIRONMENT || 'sandbox',
        docsUrl: 'https://developer.clip.mx/docs/getting-started',
      },
      { headers: corsHeaders }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // CLIP CHECKOUT: CREAR LINK DE PAGO
  // POST https://api.payclip.com/v2/checkout
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/clip/checkout' && request.method === 'POST') {
    try {
      const body = (await request.json()) as {
        amount?: number;
        currency?: string;
        purchase_description?: string;
        client_reference?: string;
        redirection_url?: {
          success?: string;
          error?: string;
          default?: string;
        };
        expires_at?: string;
        enable_oxxo?: boolean;
      };

      const amount = Number(body.amount);
      if (!amount || amount < 1) {
        return Response.json(
          { error: 'Bad Request', message: 'El monto mínimo a cobrar es $1.00 MXN.' },
          { status: 400, headers: corsHeaders }
        );
      }

      const description = (body.purchase_description || 'Servicios Profesionales').slice(0, 250);
      const currency = (body.currency || 'MXN').toUpperCase();
      const returnUrl = env.APP_URL || 'https://tools.arksystems.site';

      const payload = {
        amount,
        currency,
        purchase_description: description,
        redirection_url: {
          success: body.redirection_url?.success || `${returnUrl}/?status=success`,
          error: body.redirection_url?.error || `${returnUrl}/?status=error`,
          default: body.redirection_url?.default || returnUrl,
        },
        ...(body.expires_at ? { expires_at: body.expires_at } : {}),
        ...(body.enable_oxxo ? { payment_method_types: ['cash'] } : {}),
      };

      // Si las credenciales reales están configuradas en el entorno
      if (env.CLIP_API_KEY && env.CLIP_API_SECRET) {
        const isProd = env.CLIP_ENVIRONMENT === 'production';
        const clipBaseUrl = isProd
          ? 'https://api.payclip.com/v2/checkout'
          : 'https://api-sandbox.payclip.com/v2/checkout';

        const authHeader = `Basic ${btoa(`${env.CLIP_API_KEY}:${env.CLIP_API_SECRET}`)}`;

        const clipResponse = await fetch(clipBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify(payload),
        });

        const clipData = (await clipResponse.json()) as Record<string, unknown>;

        if (!clipResponse.ok) {
          return Response.json(
            {
              error: 'Clip API Error',
              status: clipResponse.status,
              details: clipData,
            },
            { status: clipResponse.status, headers: corsHeaders }
          );
        }

        return Response.json(clipData, { headers: corsHeaders });
      }

      // Modo Simulación / Sandbox cuando las credenciales aún no se agregan
      const demoId = `pay_req_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-4)}`;
      const demoUrl = `https://checkout.clip.mx/checkout/${demoId}`;

      return Response.json(
        {
          payment_request_id: demoId,
          payment_request_url: demoUrl,
          amount,
          currency,
          purchase_description: description,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          is_mock: true,
          notice:
            'Link generado en modo prueba. Agrega CLIP_API_KEY y CLIP_API_SECRET en .dev.vars para enlaces reales.',
        },
        { headers: corsHeaders }
      );
    } catch (err) {
      return Response.json(
        {
          error: 'Internal Server Error',
          message: err instanceof Error ? err.message : 'Error desconocido',
        },
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return Response.json(
    {
      error: 'Not Found',
      message: `Ruta ${url.pathname} no encontrada en la API.`,
      docs: 'https://developer.clip.mx/docs/getting-started',
    },
    { status: 404, headers: corsHeaders }
  );
}

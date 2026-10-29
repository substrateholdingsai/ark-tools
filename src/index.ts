/**
 * ARK LEDGER — Worker Entry Point
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
import { authenticateRequest, handleAuthApiRequest } from './server/auth';
import { handleAdminApiRequest } from './server/adminApi';
import { handleLeadsApiRequest } from './server/leadsApi';
import { handleAfiliacionesApiRequest } from './server/afiliacionesApi';
import { handleCanacoArkangelSyncApi } from './server/canacoArkangelSync';
import { handleInvitationsApiRequest } from './server/invitationsApi';
import { handleAlegraApiRequest } from './server/alegra/alegraApi';
import { checkAlegraAccountsHealth } from './server/alegra/cron';
import { generateLlmsTxt, generateLlmsFullTxt, generateRobotsTxt } from './server/llmsTxt';
import { botApp } from './server/bots/botIngestionApi';

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

  // Email transaccional para autenticación nativa
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;

  // Encriptación Alegra (AES-GCM)
  ALEGRA_ENCRYPTION_KEY?: string;

  // Cloudflare D1 Database (Multi-Tenant)
  ARK_TOOLS_DB?: D1Database;
  // ARK_TOOLS_KV: KVNamespace;
  // ARK_TOOLS_R2: R2Bucket;

  // Integración Arkangel Call Center (Worker-to-Worker Service Binding / REST)
  ARKANGEL?: Fetcher;
  ARKANGEL_URL?: string;
  ARKANGEL_API_KEY?: string;
  ARKANGEL_WEBHOOK_SECRET?: string;

  // Ingesta de bots externos (Grok / Hermes) & Queues
  BOT_INGEST_SECRET?: string;
  BOT_PAYLOADS_QUEUE?: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ─────────────────────────────────────────────────────────────────
    // API ROUTES (para futuras integraciones)
    // ─────────────────────────────────────────────────────────────────
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx);
    }

    // ─────────────────────────────────────────────────────────────────
    // GEO / AI AGENTS SPECIFICATIONS (llms.txt, llms-full.txt, robots.txt)
    // ─────────────────────────────────────────────────────────────────
    if (url.pathname === '/llms.txt' || url.pathname === '/.well-known/llms.txt') {
      return new Response(generateLlmsTxt(), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    if (url.pathname === '/llms-full.txt') {
      return new Response(generateLlmsFullTxt(), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }

    if (url.pathname === '/robots.txt') {
      return new Response(generateRobotsTxt(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
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
    // SPA FALLBACK (Assets) con Cabeceras de Seguridad Perimetral
    // ─────────────────────────────────────────────────────────────────
    const assetResponse = await env.ASSETS.fetch(request);
    const secureHeaders = new Headers(assetResponse.headers);
    secureHeaders.set('X-Content-Type-Options', 'nosniff');
    secureHeaders.set('X-Frame-Options', 'DENY');
    secureHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    secureHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers: secureHeaders,
    });
  },

  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(checkAlegraAccountsHealth(env));
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
    'Access-Control-Allow-Origin':
      env.ENVIRONMENT === 'production' ? 'https://ledger.arksystems.site' : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
  };

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────────
  // DEDICATED BOT & AGENT INGESTION (Hono App: Grok / Hermes)
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname.startsWith('/api/bots')) {
    return botApp.fetch(request, env, _ctx);
  }

  const isPublicAuthEndpoint =
    (url.pathname === '/api/auth/register' && request.method === 'POST') ||
    (url.pathname === '/api/auth/login' && request.method === 'POST') ||
    (url.pathname === '/api/auth/verify-email' && request.method === 'POST') ||
    (url.pathname === '/api/auth/request-password-reset' && request.method === 'POST') ||
    (url.pathname === '/api/auth/reset-password' && request.method === 'POST') ||
    (url.pathname === '/api/afiliaciones/registro' && request.method === 'POST');

  if (request.method !== 'GET' && request.method !== 'HEAD' && !isPublicAuthEndpoint) {
    const origin = request.headers.get('Origin');
    const configuredOrigin = new URL(env.APP_URL).origin;
    const isLocalDevelopment =
      env.ENVIRONMENT !== 'production' &&
      origin !== null &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (origin && origin !== configuredOrigin && !isLocalDevelopment) {
      return Response.json(
        { error: 'Origen no permitido.' },
        { status: 403, headers: corsHeaders }
      );
    }
  }

  const authPrincipal = await authenticateRequest(request, env);
  const authResponse = await handleAuthApiRequest(request, env, corsHeaders, authPrincipal);
  if (authResponse) {
    return authResponse;
  }

  const afiliacionesResponse = await handleAfiliacionesApiRequest(request, env, corsHeaders);
  if (afiliacionesResponse) {
    return afiliacionesResponse;
  }

  const arkangelResponse = await handleCanacoArkangelSyncApi(
    request,
    env,
    corsHeaders,
    authPrincipal
  );
  if (arkangelResponse) {
    return arkangelResponse;
  }

  const leadsResponse = await handleLeadsApiRequest(request, env, corsHeaders, authPrincipal);
  if (leadsResponse) {
    return leadsResponse;
  }

  const adminResponse = await handleAdminApiRequest(request, env, corsHeaders, authPrincipal);
  if (adminResponse) {
    return adminResponse;
  }

  const invitationsResponse = await handleInvitationsApiRequest(
    request,
    env,
    corsHeaders,
    authPrincipal
  );
  if (invitationsResponse) {
    return invitationsResponse;
  }

  const isPublicApi =
    (url.pathname === '/api/version' && request.method === 'GET') ||
    (url.pathname === '/api/clip/status' && request.method === 'GET') ||
    (url.pathname === '/api/expedientes/verify' && request.method === 'GET') ||
    (['/api/ai/status', '/api/ai/models', '/api/ai/tools'].includes(url.pathname) &&
      request.method === 'GET');
  if (!isPublicApi && !authPrincipal) {
    return Response.json(
      { error: 'Autenticación requerida.' },
      { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // D1 MULTI-TENANT PERSISTENCIA (Guía SAT, Ledger, Activos)
  // ─────────────────────────────────────────────────────────────────
  const d1Response = await handleD1ApiRequest(request, env, corsHeaders, authPrincipal);
  if (d1Response) {
    return d1Response;
  }

  // ─────────────────────────────────────────────────────────────────
  // WORKERS AI (Chat, Tools, Models)
  // ─────────────────────────────────────────────────────────────────
  const aiResponse = await handleAiApiRequest(request, env, corsHeaders, authPrincipal);
  if (aiResponse) {
    return aiResponse;
  }

  // ─────────────────────────────────────────────────────────────────
  // ALEGRA CFDI 4.0 (Timbrado, Cuentas, Historial)
  // ─────────────────────────────────────────────────────────────────
  const alegraResponse = await handleAlegraApiRequest(request, env, corsHeaders, authPrincipal);
  if (alegraResponse) {
    return alegraResponse;
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
      const returnUrl = env.APP_URL || 'https://ledger.arksystems.site';

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

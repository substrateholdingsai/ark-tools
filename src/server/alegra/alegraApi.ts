/**
 * ARK LEDGER — Endpoints del Worker para Integración con Facturapi v2 (Timbrado CFDI 4.0)
 *
 * Reemplaza el motor legado de Alegra por Facturapi v2 (`https://www.facturapi.io/v2`)
 * manteniendo compatibilidad 100% con las rutas `/api/alegra/*` y habilitando `/api/facturapi/*`.
 *
 * Soporta:
 * - Conexión de cuentas multi-organización por despacho (`sk_test_...` Sandbox o `sk_live_...` Live)
 * - Consulta de estado y CSD en tiempo real (`/v2/organizations/me`)
 * - Emisión y timbrado de facturas CFDI 4.0 (`POST /v2/invoices`)
 * - Descarga directa de PDF y XML timbrados (`GET /invoices/:id/pdf` y `/xml`)
 * - Cancelación de CFDI ante el SAT (`DELETE /invoices/:id?motive=01..04`)
 */

import type { Env } from '../../index';
import { type AuthPrincipal, requireTenantMembership } from '../auth';
import { FacturapiClient, FacturapiError, type AlegraInvoicePayload } from './alegraClient';
import { decryptToken, encryptToken, getAlegraEncryptionSecret } from './credentials';

function jsonResponse(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

const LIVE_STAMPING_BLOCKED_MESSAGE =
  'Timbrado en vivo deshabilitado — preview_only / Sandbox SAT. El timbrado en producción está deshabilitado hasta que los precios de distribuidor ATEB/Facturapi se firmen por escrito y Pavel lo apruebe en chat.';

function blockLiveStamping(corsHeaders: Record<string, string>): Response {
  return jsonResponse(
    {
      error: LIVE_STAMPING_BLOCKED_MESSAGE,
      preview_only: true,
      sandbox_required: true,
      blocked_reason: 'cfdi_live_stamping_disabled',
    },
    corsHeaders,
    403
  );
}

function isLiveKey(token: string | undefined | null): boolean {
  return typeof token === 'string' && token.trim().startsWith('sk_live_');
}

async function verifyTenantAccess(
  env: Env,
  principal: AuthPrincipal | null,
  tenantId: string,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  if (!principal) {
    return jsonResponse({ error: 'Autenticación requerida.' }, corsHeaders, 401);
  }
  const membership = await requireTenantMembership(env, principal, tenantId);
  if (!membership) {
    return jsonResponse({ error: 'No tienes acceso a este despacho.' }, corsHeaders, 403);
  }
  return null;
}

async function resolveTenantFacturapiClient(
  db: D1Database,
  env: Env,
  tenantId: string,
  encryptionSecret: string,
  accountId?: string | null
): Promise<{
  client: FacturapiClient;
  accountId: string;
  environment: 'sandbox' | 'live';
} | null> {
  let accountRow: any = null;
  if (accountId) {
    accountRow = await db
      .prepare(
        `SELECT * FROM tenant_alegra_accounts
         WHERE tenant_id = ? AND alegra_account_id = ?
         LIMIT 1`
      )
      .bind(tenantId, accountId)
      .first();
  } else {
    accountRow = await db
      .prepare(
        `SELECT * FROM tenant_alegra_accounts
         WHERE tenant_id = ? AND status = 'active'
         ORDER BY is_default DESC, created_at ASC
         LIMIT 1`
      )
      .bind(tenantId)
      .first();
  }

  if (accountRow && accountRow.status === 'active') {
    const rawToken = await decryptToken(accountRow.alegra_token_enc, encryptionSecret);
    return {
      client: new FacturapiClient(accountRow.alegra_email || '', rawToken),
      accountId: String(accountRow.alegra_account_id),
      environment: isLiveKey(rawToken) ? 'live' : 'sandbox',
    };
  }

  if (env.FACTURAPI_API_KEY && env.FACTURAPI_API_KEY.trim().length > 0) {
    const platformKey = env.FACTURAPI_API_KEY.trim();
    if (platformKey.startsWith('sk_live_')) {
      return null;
    }
    return {
      client: new FacturapiClient(platformKey),
      accountId: 'acc_platform_facturapi',
      environment: 'sandbox',
    };
  }

  return null;
}

export async function handleAlegraApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/alegra/') && !url.pathname.startsWith('/api/facturapi/')) {
    return null;
  }

  // Normalizar ruta para soportar indistintamente `/api/alegra/*` y `/api/facturapi/*`
  const subPath = url.pathname.replace(/^\/api\/(alegra|facturapi)/, '');

  const db = env.ARK_TOOLS_DB;
  if (!db) {
    return jsonResponse(
      {
        error: 'Database Not Configured',
        message: 'El binding ARK_TOOLS_DB de D1 no está disponible.',
      },
      corsHeaders,
      503
    );
  }

  const encryptionSecret = getAlegraEncryptionSecret(env);

  // ─────────────────────────────────────────────────────────────────
  // 1. LISTAR CUENTAS DE FACTURAPI / ALEGRA DEL DESPACHO
  // GET /api/(alegra|facturapi)/accounts
  // ─────────────────────────────────────────────────────────────────
  if (subPath === '/accounts' && request.method === 'GET') {
    const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
    if (!tenantId) {
      return jsonResponse({ error: 'Parámetro tenant_id requerido.' }, corsHeaders, 400);
    }
    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    try {
      const result = await db
        .prepare(
          `SELECT tenant_id, alegra_account_id, alegra_email, alegra_company_name,
                  alegra_company_id, alegra_rfc, csd_configured, is_default, status,
                  last_checked_at, last_error, created_at, updated_at
           FROM tenant_alegra_accounts
           WHERE tenant_id = ?
           ORDER BY is_default DESC, created_at ASC`
        )
        .bind(tenantId)
        .all();

      const accounts = (result.results || []).map((row: any) => ({
        ...row,
        provider: 'facturapi',
        csd_configured: Boolean(row.csd_configured),
        is_default: Boolean(row.is_default),
      }));

      return jsonResponse({ accounts }, corsHeaders);
    } catch (err: any) {
      return jsonResponse(
        { error: 'Error al consultar cuentas de timbrado.', details: err?.message },
        corsHeaders,
        500
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. CONECTAR NUEVA CUENTA DE FACTURAPI
  // POST /api/(alegra|facturapi)/accounts
  // ─────────────────────────────────────────────────────────────────
  if (subPath === '/accounts' && request.method === 'POST') {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Cuerpo JSON inválido.' }, corsHeaders, 400);
    }

    const tenantId = body.tenant_id || request.headers.get('x-tenant-id');
    const rawEmail = (body.alegra_email || body.email || body.label || '').trim();
    const token = (body.facturapi_key || body.alegra_token || body.token || '').trim();
    const isDefault = Boolean(body.is_default);

    if (!tenantId) {
      return jsonResponse({ error: 'tenant_id es requerido.' }, corsHeaders, 400);
    }
    if (!token) {
      return jsonResponse(
        { error: 'Secret Key de Facturapi (sk_test_... o sk_live_...) requerida.' },
        corsHeaders,
        400
      );
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    // 1. Validar credenciales y consultar organización en Facturapi
    let company;
    try {
      const client = new FacturapiClient(rawEmail, token);
      company = await client.getCompany();
    } catch (err: any) {
      const status = err instanceof FacturapiError ? err.statusCode : 400;
      return jsonResponse(
        {
          error: err?.message || 'Error validando credenciales con Facturapi.',
          statusCode: status,
        },
        corsHeaders,
        status >= 400 && status < 600 ? status : 400
      );
    }

    const email =
      rawEmail ||
      company.email ||
      (token.startsWith('sk_test_') ? 'sandbox@facturapi.io' : 'live@facturapi.io');

    // 2. Encriptar el token con WebCrypto AES-GCM
    let encryptedToken: string;
    try {
      encryptedToken = await encryptToken(token, encryptionSecret);
    } catch (err: any) {
      return jsonResponse(
        { error: 'Error de seguridad al cifrar token.', details: err?.message },
        corsHeaders,
        500
      );
    }

    // 3. Revisar si ya existen cuentas para este tenant
    const existingCountResult = await db
      .prepare('SELECT COUNT(*) as count FROM tenant_alegra_accounts WHERE tenant_id = ?')
      .bind(tenantId)
      .first<{ count: number }>();

    const existingCount = existingCountResult?.count || 0;
    const shouldBeDefault = isDefault || existingCount === 0;

    const accountId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // 4. Si va a ser default, desmarcar las existentes
    if (shouldBeDefault && existingCount > 0) {
      await db
        .prepare('UPDATE tenant_alegra_accounts SET is_default = 0 WHERE tenant_id = ?')
        .bind(tenantId)
        .run();
    }

    // 5. Insertar nueva cuenta en D1
    try {
      await db
        .prepare(
          `INSERT INTO tenant_alegra_accounts (
            tenant_id, alegra_account_id, alegra_email, alegra_token_enc,
            alegra_company_name, alegra_company_id, alegra_rfc,
            csd_configured, is_default, status, last_checked_at, last_error,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NULL, ?, ?)`
        )
        .bind(
          tenantId,
          accountId,
          email,
          encryptedToken,
          company.name,
          company.id,
          company.identification,
          company.csd_configured ? 1 : 0,
          shouldBeDefault ? 1 : 0,
          now,
          now,
          now
        )
        .run();

      return jsonResponse(
        {
          ok: true,
          account: {
            tenant_id: tenantId,
            alegra_account_id: accountId,
            alegra_email: email,
            alegra_company_name: company.name,
            alegra_company_id: company.id,
            alegra_rfc: company.identification,
            csd_configured: company.csd_configured,
            environment: company.environment,
            provider: 'facturapi',
            is_default: shouldBeDefault,
            status: 'active',
            last_checked_at: now,
            created_at: now,
            updated_at: now,
          },
        },
        corsHeaders,
        201
      );
    } catch (err: any) {
      return jsonResponse(
        { error: 'Error guardando cuenta en base de datos.', details: err?.message },
        corsHeaders,
        500
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. CONSULTAR ESTADO Y REFLEJAR CSD EN TIEMPO REAL
  // GET /api/(alegra|facturapi)/accounts/:id/status
  // ─────────────────────────────────────────────────────────────────
  const statusMatch = subPath.match(/^\/accounts\/([^/]+)\/status$/);
  if (statusMatch && request.method === 'GET') {
    const accountId = decodeURIComponent(statusMatch[1]!);
    const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
    if (!tenantId) {
      return jsonResponse({ error: 'Parámetro tenant_id requerido.' }, corsHeaders, 400);
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    const row = await db
      .prepare(
        `SELECT * FROM tenant_alegra_accounts
         WHERE tenant_id = ? AND alegra_account_id = ?
         LIMIT 1`
      )
      .bind(tenantId, accountId)
      .first<any>();

    if (!row) {
      return jsonResponse({ error: 'Cuenta de Facturapi no encontrada.' }, corsHeaders, 404);
    }

    const now = Math.floor(Date.now() / 1000);

    try {
      const rawToken = await decryptToken(row.alegra_token_enc, encryptionSecret);
      const client = new FacturapiClient(row.alegra_email, rawToken);
      const company = await client.getCompany();

      await db
        .prepare(
          `UPDATE tenant_alegra_accounts
           SET csd_configured = ?,
               alegra_company_name = ?,
               alegra_company_id = ?,
               alegra_rfc = ?,
               status = 'active',
               last_checked_at = ?,
               last_error = NULL,
               updated_at = ?
           WHERE tenant_id = ? AND alegra_account_id = ?`
        )
        .bind(
          company.csd_configured ? 1 : 0,
          company.name || row.alegra_company_name,
          company.id,
          company.identification,
          now,
          now,
          tenantId,
          accountId
        )
        .run();

      return jsonResponse(
        {
          ok: true,
          account: {
            tenant_id: tenantId,
            alegra_account_id: accountId,
            alegra_email: row.alegra_email,
            alegra_company_name: company.name || row.alegra_company_name,
            alegra_company_id: company.id,
            alegra_rfc: company.identification,
            csd_configured: company.csd_configured,
            environment: company.environment,
            provider: 'facturapi',
            is_default: Boolean(row.is_default),
            status: 'active',
            last_checked_at: now,
            last_error: null,
            created_at: row.created_at,
            updated_at: now,
          },
        },
        corsHeaders
      );
    } catch (err: any) {
      const statusCode = err instanceof FacturapiError ? err.statusCode : 500;
      const isRevoked = statusCode === 401 || statusCode === 403;
      const newStatus = isRevoked ? 'revoked' : 'error';
      const msg = err?.message || 'Error verificando cuenta con Facturapi.';

      await db
        .prepare(
          `UPDATE tenant_alegra_accounts
           SET status = ?,
               last_checked_at = ?,
               last_error = ?,
               updated_at = ?
           WHERE tenant_id = ? AND alegra_account_id = ?`
        )
        .bind(newStatus, now, msg, now, tenantId, accountId)
        .run();

      return jsonResponse(
        {
          ok: false,
          account: {
            tenant_id: tenantId,
            alegra_account_id: accountId,
            alegra_email: row.alegra_email,
            alegra_company_name: row.alegra_company_name,
            alegra_company_id: row.alegra_company_id,
            alegra_rfc: row.alegra_rfc,
            csd_configured: Boolean(row.csd_configured),
            is_default: Boolean(row.is_default),
            status: newStatus,
            last_checked_at: now,
            last_error: msg,
          },
          error: msg,
        },
        corsHeaders,
        statusCode >= 400 && statusCode < 600 ? statusCode : 500
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4. ACTUALIZAR CUENTA (MARCAR COMO DEFAULT)
  // PATCH /api/(alegra|facturapi)/accounts/:id
  // ─────────────────────────────────────────────────────────────────
  const patchMatch = subPath.match(/^\/accounts\/([^/]+)$/);
  if (patchMatch && request.method === 'PATCH') {
    const accountId = decodeURIComponent(patchMatch[1]!);
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Cuerpo JSON inválido.' }, corsHeaders, 400);
    }

    const tenantId = body.tenant_id || request.headers.get('x-tenant-id');
    if (!tenantId) {
      return jsonResponse({ error: 'tenant_id es requerido.' }, corsHeaders, 400);
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    if (body.is_default === true) {
      await db
        .prepare('UPDATE tenant_alegra_accounts SET is_default = 0 WHERE tenant_id = ?')
        .bind(tenantId)
        .run();

      await db
        .prepare(
          'UPDATE tenant_alegra_accounts SET is_default = 1, updated_at = ? WHERE tenant_id = ? AND alegra_account_id = ?'
        )
        .bind(Math.floor(Date.now() / 1000), tenantId, accountId)
        .run();
    }

    return jsonResponse({ ok: true }, corsHeaders);
  }

  // ─────────────────────────────────────────────────────────────────
  // 5. DESCONECTAR CUENTA DE FACTURAPI
  // DELETE /api/(alegra|facturapi)/accounts/:id
  // ─────────────────────────────────────────────────────────────────
  const deleteMatch = subPath.match(/^\/accounts\/([^/]+)$/);
  if (deleteMatch && request.method === 'DELETE') {
    const accountId = decodeURIComponent(deleteMatch[1]!);
    const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
    if (!tenantId) {
      return jsonResponse({ error: 'Parámetro tenant_id requerido.' }, corsHeaders, 400);
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    await db
      .prepare('DELETE FROM tenant_alegra_accounts WHERE tenant_id = ? AND alegra_account_id = ?')
      .bind(tenantId, accountId)
      .run();

    // Si borramos la cuenta que era default, asignar default a la siguiente activa si existe
    const nextAccount = await db
      .prepare(
        `SELECT alegra_account_id FROM tenant_alegra_accounts
         WHERE tenant_id = ? ORDER BY created_at ASC LIMIT 1`
      )
      .bind(tenantId)
      .first<{ alegra_account_id: string }>();

    if (nextAccount) {
      await db
        .prepare(
          'UPDATE tenant_alegra_accounts SET is_default = 1 WHERE tenant_id = ? AND alegra_account_id = ?'
        )
        .bind(tenantId, nextAccount.alegra_account_id)
        .run();
    }

    return jsonResponse({ ok: true }, corsHeaders);
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. EMITIR Y TIMBRAR FACTURA CFDI 4.0 EN FACTURAPI
  // POST /api/(alegra|facturapi)/invoices
  // ─────────────────────────────────────────────────────────────────
  if (subPath === '/invoices' && request.method === 'POST') {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Cuerpo JSON inválido.' }, corsHeaders, 400);
    }

    const tenantId = body.tenant_id || request.headers.get('x-tenant-id');
    const accountId = body.alegra_account_id || body.facturapi_account_id;
    const clientId = body.client_id || null;
    const invoicePayload = (body.invoice || body) as AlegraInvoicePayload;

    if (!tenantId) {
      return jsonResponse({ error: 'tenant_id es requerido.' }, corsHeaders, 400);
    }
    const hasReceptor = Boolean(invoicePayload?.client || invoicePayload?.customer);
    if (!invoicePayload || !hasReceptor || !Array.isArray(invoicePayload.items)) {
      return jsonResponse(
        { error: 'Datos de la factura inválidos (requiere receptor y conceptos).' },
        corsHeaders,
        400
      );
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    // Buscar la cuenta de timbrado a utilizar
    let accountRow: any;
    if (accountId) {
      accountRow = await db
        .prepare(
          `SELECT * FROM tenant_alegra_accounts
           WHERE tenant_id = ? AND alegra_account_id = ?
           LIMIT 1`
        )
        .bind(tenantId, accountId)
        .first();
    } else {
      accountRow = await db
        .prepare(
          `SELECT * FROM tenant_alegra_accounts
           WHERE tenant_id = ? AND status = 'active'
           ORDER BY is_default DESC, created_at ASC
           LIMIT 1`
        )
        .bind(tenantId)
        .first();
    }

    let client: FacturapiClient;
    let resolvedAccountId: string;

    if (accountRow) {
      if (accountRow.status !== 'active') {
        return jsonResponse(
          {
            error: `La cuenta de Facturapi (${accountRow.alegra_company_name || accountRow.alegra_email}) no está activa (${accountRow.status}). Reconéctala antes de timbrar.`,
            status: accountRow.status,
            lastError: accountRow.last_error,
          },
          corsHeaders,
          400
        );
      }
      const rawToken = await decryptToken(accountRow.alegra_token_enc, encryptionSecret);
      if (isLiveKey(rawToken)) {
        return blockLiveStamping(corsHeaders);
      }
      client = new FacturapiClient(accountRow.alegra_email, rawToken);
      resolvedAccountId = accountRow.alegra_account_id;
    } else if (env.FACTURAPI_API_KEY && env.FACTURAPI_API_KEY.trim().length > 0) {
      const platformKey = env.FACTURAPI_API_KEY.trim();
      if (platformKey.startsWith('sk_live_')) {
        return blockLiveStamping(corsHeaders);
      }
      client = new FacturapiClient(platformKey);
      resolvedAccountId = 'acc_platform_facturapi';
    } else {
      return jsonResponse(
        {
          error:
            'No hay ninguna cuenta de Facturapi conectada o activa en este despacho. Conecta tu Secret Key (sk_test_... o sk_live_...).',
          suggestConnect: true,
        },
        corsHeaders,
        400
      );
    }

    // Emitir y timbrar factura en Facturapi v2
    let invoiceRes;
    try {
      invoiceRes = await client.createInvoice(invoicePayload);
    } catch (err: any) {
      const statusCode = err instanceof FacturapiError ? err.statusCode : 500;
      return jsonResponse(
        {
          error: err?.message || 'Error al timbrar factura con Facturapi.',
          details: err instanceof FacturapiError ? err.details : undefined,
        },
        corsHeaders,
        statusCode >= 400 && statusCode < 600 ? statusCode : 500
      );
    }

    // Registrar en tabla alegra_invoices de D1
    const invoiceRecordId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const uuid = invoiceRes.stamp?.uuid || null;
    const folio = invoiceRes.numberTemplate?.fullNumber || invoiceRes.id;
    const pdfUrl = invoiceRes.stamp?.pdf || invoiceRes.pdf || null;
    const xmlUrl = invoiceRes.stamp?.xml || invoiceRes.xml || null;
    const customerName =
      invoiceRes.client?.name ||
      invoicePayload.customer?.legal_name ||
      invoicePayload.client?.name ||
      null;
    const customerRfc =
      invoiceRes.client?.identification ||
      invoicePayload.customer?.tax_id ||
      invoicePayload.client?.identification ||
      null;

    try {
      await db
        .prepare(
          `INSERT INTO alegra_invoices (
            id, tenant_id, alegra_account_id, alegra_invoice_id, client_id,
            uuid, folio, customer_name, customer_rfc, total, currency,
            status, pdf_url, xml_url, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'MXN', ?, ?, ?, ?, ?)`
        )
        .bind(
          invoiceRecordId,
          tenantId,
          resolvedAccountId,
          invoiceRes.id,
          clientId,
          uuid,
          folio,
          customerName,
          customerRfc,
          invoiceRes.total,
          invoiceRes.status || 'open',
          pdfUrl,
          xmlUrl,
          principal?.id || null,
          now
        )
        .run();
    } catch (dbErr) {
      console.error('[Facturapi API] Error guardando factura timbrada en D1:', dbErr);
    }

    return jsonResponse(
      {
        ok: true,
        provider: 'facturapi',
        invoice: {
          id: invoiceRecordId,
          alegra_invoice_id: invoiceRes.id,
          uuid,
          folio,
          customer_name: customerName,
          customer_rfc: customerRfc,
          total: invoiceRes.total,
          currency: 'MXN',
          status: invoiceRes.status,
          environment: 'sandbox',
          pdf_url: pdfUrl,
          xml_url: xmlUrl,
          verification_url:
            invoiceRes.verification_url || invoiceRes.stamp?.verificationUrl || null,
          created_at: now,
          raw: invoiceRes,
        },
      },
      corsHeaders,
      201
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 7. LISTAR FACTURAS TIMBRADAS DEL DESPACHO
  // GET /api/(alegra|facturapi)/invoices
  // ─────────────────────────────────────────────────────────────────
  if (subPath === '/invoices' && request.method === 'GET') {
    const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
    if (!tenantId) {
      return jsonResponse({ error: 'Parámetro tenant_id requerido.' }, corsHeaders, 400);
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    const clientId = url.searchParams.get('client_id');
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);

    try {
      let query = `SELECT * FROM alegra_invoices WHERE tenant_id = ?`;
      const params: any[] = [tenantId];

      if (clientId) {
        query += ` AND client_id = ?`;
        params.push(clientId);
      }

      query += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(limit);

      const result = await db
        .prepare(query)
        .bind(...params)
        .all();
      return jsonResponse({ invoices: result.results || [] }, corsHeaders);
    } catch (err: any) {
      return jsonResponse(
        { error: 'Error al consultar historial de facturas.', details: err?.message },
        corsHeaders,
        500
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 8. DESCARGAR ARCHIVO PDF O XML TIMBRADO DESDE FACTURAPI
  // GET /api/(alegra|facturapi)/invoices/:id/(pdf|xml|zip)
  // ─────────────────────────────────────────────────────────────────
  const downloadMatch = subPath.match(/^\/invoices\/([^/]+)\/(pdf|xml|zip)$/);
  if (downloadMatch && request.method === 'GET') {
    const requestedId = decodeURIComponent(downloadMatch[1]!);
    const format = downloadMatch[2] as 'pdf' | 'xml' | 'zip';
    const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
    if (!tenantId) {
      return jsonResponse({ error: 'Parámetro tenant_id requerido.' }, corsHeaders, 400);
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    const invoiceRow = await db
      .prepare(
        `SELECT * FROM alegra_invoices
         WHERE tenant_id = ? AND (alegra_invoice_id = ? OR id = ?)
         LIMIT 1`
      )
      .bind(tenantId, requestedId, requestedId)
      .first<any>();

    const facturapiInvoiceId = invoiceRow ? String(invoiceRow.alegra_invoice_id) : requestedId;
    const resolved = await resolveTenantFacturapiClient(
      db,
      env,
      tenantId,
      encryptionSecret,
      invoiceRow?.alegra_account_id
    );

    if (!resolved) {
      return jsonResponse(
        { error: 'No se encontró una cuenta activa de Facturapi para descargar el comprobante.' },
        corsHeaders,
        404
      );
    }

    try {
      const { buffer, contentType } = await resolved.client.downloadInvoiceFile(
        facturapiInvoiceId,
        format
      );
      const filenameLabel = invoiceRow?.uuid || invoiceRow?.folio || facturapiInvoiceId;
      const sandboxPrefix = resolved.environment === 'sandbox' ? 'SANDBOX-' : '';
      const disposition =
        format === 'pdf'
          ? `inline; filename="${sandboxPrefix}CFDI-${filenameLabel}.pdf"`
          : `attachment; filename="${sandboxPrefix}CFDI-${filenameLabel}.${format}"`;

      return new Response(buffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Disposition': disposition,
          'Cache-Control': 'private, max-age=300',
        },
      });
    } catch (err: any) {
      const statusCode = err instanceof FacturapiError ? err.statusCode : 502;
      return jsonResponse(
        {
          error: err?.message || `Error al descargar ${format.toUpperCase()} de Facturapi.`,
        },
        corsHeaders,
        statusCode
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 9. CANCELAR FACTURA CFDI 4.0 ANTE EL SAT EN FACTURAPI
  // DELETE /api/(alegra|facturapi)/invoices/:id?motive=02
  // ─────────────────────────────────────────────────────────────────
  const cancelMatch = subPath.match(/^\/invoices\/([^/]+)$/);
  if (cancelMatch && request.method === 'DELETE') {
    const requestedId = decodeURIComponent(cancelMatch[1]!);
    const tenantId = url.searchParams.get('tenant_id') || request.headers.get('x-tenant-id');
    const rawMotive = (url.searchParams.get('motive') || '02').trim();
    const motive = (['01', '02', '03', '04'].includes(rawMotive) ? rawMotive : '02') as
      '01' | '02' | '03' | '04';
    const substitution = url.searchParams.get('substitution') || undefined;

    if (!tenantId) {
      return jsonResponse({ error: 'Parámetro tenant_id requerido.' }, corsHeaders, 400);
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    const invoiceRow = await db
      .prepare(
        `SELECT * FROM alegra_invoices
         WHERE tenant_id = ? AND (alegra_invoice_id = ? OR id = ?)
         LIMIT 1`
      )
      .bind(tenantId, requestedId, requestedId)
      .first<any>();

    const facturapiInvoiceId = invoiceRow ? String(invoiceRow.alegra_invoice_id) : requestedId;
    const resolved = await resolveTenantFacturapiClient(
      db,
      env,
      tenantId,
      encryptionSecret,
      invoiceRow?.alegra_account_id
    );

    if (!resolved) {
      return jsonResponse(
        { error: 'No se encontró una cuenta activa de Facturapi para cancelar la factura.' },
        corsHeaders,
        404
      );
    }

    if (resolved.environment === 'live') {
      return blockLiveStamping(corsHeaders);
    }

    try {
      const canceled = await resolved.client.cancelInvoice(
        facturapiInvoiceId,
        motive,
        substitution
      );

      await db
        .prepare(
          `UPDATE alegra_invoices
           SET status = 'void'
           WHERE tenant_id = ? AND (alegra_invoice_id = ? OR id = ?)`
        )
        .bind(tenantId, facturapiInvoiceId, requestedId)
        .run();

      return jsonResponse(
        {
          ok: true,
          motive,
          invoice: {
            alegra_invoice_id: canceled.id,
            uuid: canceled.stamp?.uuid || invoiceRow?.uuid || null,
            status: 'void',
          },
        },
        corsHeaders
      );
    } catch (err: any) {
      const statusCode = err instanceof FacturapiError ? err.statusCode : 500;
      return jsonResponse(
        {
          error: err?.message || 'Error al cancelar CFDI en Facturapi.',
          details: err instanceof FacturapiError ? err.details : undefined,
        },
        corsHeaders,
        statusCode
      );
    }
  }

  return null;
}

export { handleAlegraApiRequest as handleFacturapiApiRequest };

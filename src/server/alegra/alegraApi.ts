/**
 * ARK TOOLS — Endpoints del Worker para Integración con Alegra (Timbrado CFDI 4.0)
 *
 * Soporta:
 * - Conexión de cuentas multi-empresa por despacho
 * - Consulta de estado y CSD en tiempo real
 * - Emisión y timbrado de facturas CFDI 4.0 con PAC Quadrum
 * - Historial y descarga de XML/PDF timbrados
 */

import type { Env } from '../../index';
import { type AuthPrincipal, requireTenantMembership } from '../auth';
import { AlegraClient, AlegraError, type AlegraInvoicePayload } from './alegraClient';
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

export async function handleAlegraApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/alegra/')) {
    return null;
  }

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
  // 1. LISTAR CUENTAS DE ALEGRA DEL DESPACHO
  // GET /api/alegra/accounts
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/alegra/accounts' && request.method === 'GET') {
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
        csd_configured: Boolean(row.csd_configured),
        is_default: Boolean(row.is_default),
      }));

      return jsonResponse({ accounts }, corsHeaders);
    } catch (err: any) {
      return jsonResponse(
        { error: 'Error al consultar cuentas de Alegra.', details: err?.message },
        corsHeaders,
        500
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. CONECTAR NUEVA CUENTA DE ALEGRA
  // POST /api/alegra/accounts
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/alegra/accounts' && request.method === 'POST') {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Cuerpo JSON inválido.' }, corsHeaders, 400);
    }

    const tenantId = body.tenant_id || request.headers.get('x-tenant-id');
    const email = (body.alegra_email || body.email || '').trim();
    const token = (body.alegra_token || body.token || '').trim();
    const isDefault = Boolean(body.is_default);

    if (!tenantId) {
      return jsonResponse({ error: 'tenant_id es requerido.' }, corsHeaders, 400);
    }
    if (!email || !token) {
      return jsonResponse(
        { error: 'Email y token de API de Alegra son requeridos.' },
        corsHeaders,
        400
      );
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    // 1. Validar credenciales y consultar empresa con Alegra
    let company;
    try {
      const client = new AlegraClient(email, token);
      company = await client.getCompany();
    } catch (err: any) {
      const status = err instanceof AlegraError ? err.statusCode : 400;
      return jsonResponse(
        {
          error: err?.message || 'Error validando credenciales con Alegra.',
          statusCode: status,
        },
        corsHeaders,
        status >= 400 && status < 600 ? status : 400
      );
    }

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
  // GET /api/alegra/accounts/:id/status
  // ─────────────────────────────────────────────────────────────────
  const statusMatch = url.pathname.match(/^\/api\/alegra\/accounts\/([^/]+)\/status$/);
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
      return jsonResponse({ error: 'Cuenta de Alegra no encontrada.' }, corsHeaders, 404);
    }

    const now = Math.floor(Date.now() / 1000);

    try {
      const rawToken = await decryptToken(row.alegra_token_enc, encryptionSecret);
      const client = new AlegraClient(row.alegra_email, rawToken);
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
      const statusCode = err instanceof AlegraError ? err.statusCode : 500;
      const isRevoked = statusCode === 401 || statusCode === 403;
      const newStatus = isRevoked ? 'revoked' : 'error';
      const msg = err?.message || 'Error verificando cuenta con Alegra.';

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
  // PATCH /api/alegra/accounts/:id
  // ─────────────────────────────────────────────────────────────────
  const patchMatch = url.pathname.match(/^\/api\/alegra\/accounts\/([^/]+)$/);
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
  // 5. DESCONECTAR CUENTA DE ALEGRA
  // DELETE /api/alegra/accounts/:id
  // ─────────────────────────────────────────────────────────────────
  const deleteMatch = url.pathname.match(/^\/api\/alegra\/accounts\/([^/]+)$/);
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
        .prepare('UPDATE tenant_alegra_accounts SET is_default = 1 WHERE tenant_id = ? AND alegra_account_id = ?')
        .bind(tenantId, nextAccount.alegra_account_id)
        .run();
    }

    return jsonResponse({ ok: true }, corsHeaders);
  }

  // ─────────────────────────────────────────────────────────────────
  // 6. EMITIR Y TIMBRAR FACTURA CFDI 4.0
  // POST /api/alegra/invoices
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/alegra/invoices' && request.method === 'POST') {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Cuerpo JSON inválido.' }, corsHeaders, 400);
    }

    const tenantId = body.tenant_id || request.headers.get('x-tenant-id');
    const accountId = body.alegra_account_id;
    const clientId = body.client_id || null;
    const invoicePayload = body.invoice as AlegraInvoicePayload;

    if (!tenantId) {
      return jsonResponse({ error: 'tenant_id es requerido.' }, corsHeaders, 400);
    }
    if (!invoicePayload || !invoicePayload.client || !Array.isArray(invoicePayload.items)) {
      return jsonResponse(
        { error: 'Datos de la factura inválidos (requiere cliente y partidas).' },
        corsHeaders,
        400
      );
    }

    const accessDenied = await verifyTenantAccess(env, principal, tenantId, corsHeaders);
    if (accessDenied) return accessDenied;

    // Buscar la cuenta Alegra a utilizar
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
      // Tomar la default o primera activa
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

    if (!accountRow) {
      return jsonResponse(
        {
          error: 'No hay ninguna cuenta de Alegra conectada o activa en este despacho.',
          suggestConnect: true,
        },
        corsHeaders,
        400
      );
    }

    if (accountRow.status !== 'active') {
      return jsonResponse(
        {
          error: `La cuenta de Alegra (${accountRow.alegra_company_name || accountRow.alegra_email}) no está activa (${accountRow.status}). Reconéctala antes de timbrar.`,
          status: accountRow.status,
          lastError: accountRow.last_error,
        },
        corsHeaders,
        400
      );
    }

    // Desencriptar token y emitir factura en Alegra
    let invoiceRes;
    try {
      const rawToken = await decryptToken(accountRow.alegra_token_enc, encryptionSecret);
      const client = new AlegraClient(accountRow.alegra_email, rawToken);
      invoiceRes = await client.createInvoice(invoicePayload);
    } catch (err: any) {
      const statusCode = err instanceof AlegraError ? err.statusCode : 500;
      return jsonResponse(
        {
          error: err?.message || 'Error al timbrar factura con Alegra.',
          details: err instanceof AlegraError ? err.details : undefined,
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
    const pdfUrl = invoiceRes.stamp?.pdf || null;
    const xmlUrl = invoiceRes.stamp?.xml || null;

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
          accountRow.alegra_account_id,
          invoiceRes.id,
          clientId,
          uuid,
          folio,
          invoiceRes.client.name,
          invoiceRes.client.identification,
          invoiceRes.total,
          invoiceRes.status || 'open',
          pdfUrl,
          xmlUrl,
          principal?.id || null,
          now
        )
        .run();
    } catch (dbErr) {
      console.error('[Alegra API] Error guardando factura timbrada en D1:', dbErr);
    }

    return jsonResponse(
      {
        ok: true,
        invoice: {
          id: invoiceRecordId,
          alegra_invoice_id: invoiceRes.id,
          uuid,
          folio,
          customer_name: invoiceRes.client.name,
          customer_rfc: invoiceRes.client.identification,
          total: invoiceRes.total,
          currency: 'MXN',
          status: invoiceRes.status,
          pdf_url: pdfUrl,
          xml_url: xmlUrl,
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
  // GET /api/alegra/invoices
  // ─────────────────────────────────────────────────────────────────
  if (url.pathname === '/api/alegra/invoices' && request.method === 'GET') {
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

      const result = await db.prepare(query).bind(...params).all();
      return jsonResponse({ invoices: result.results || [] }, corsHeaders);
    } catch (err: any) {
      return jsonResponse(
        { error: 'Error al consultar historial de facturas.', details: err?.message },
        corsHeaders,
        500
      );
    }
  }

  return null;
}

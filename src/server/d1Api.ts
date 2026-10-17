/**
 * ARK TOOLS — D1 Multi-Tenant API Handlers
 *
 * Endpoints REST para Cloudflare D1 con aislamiento por tenant_id:
 * 1. /api/guia/progress (Progreso de la Guía SAT/IMSS)
 * 2. /api/ledger (Registro inmutable con encadenamiento SHA-256)
 * 3. /api/activos/watchlist (Notas y conductas guardadas de Activos Virtuales)
 */

import type { Env } from '../index';
import { handleExpedienteApiRequest } from './d1Api.expediente';
import { requireTenantMembership, type AuthPrincipal } from './auth';

/**
 * Calcula el hash SHA-256 inmutable para el ledger
 */
async function computeSha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function authorizeTenant(
  env: Env,
  principal: AuthPrincipal | null,
  tenantId: string,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  if (!principal) {
    return Response.json(
      { error: 'Autenticación requerida.' },
      { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }
  const membership = await requireTenantMembership(env, principal, tenantId);
  if (!membership) {
    return Response.json(
      { error: 'No tienes acceso a este despacho.' },
      { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }
  return null;
}

export async function handleD1ApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  const db = env.ARK_TOOLS_DB;

  if (!db) {
    if (
      url.pathname.startsWith('/api/guia/') ||
      url.pathname.startsWith('/api/ledger') ||
      url.pathname.startsWith('/api/activos/') ||
      url.pathname.startsWith('/api/clients') ||
      url.pathname.startsWith('/api/expedientes') ||
      url.pathname === '/api/auth/sync'
    ) {
      return Response.json(
        {
          error: 'Database Not Configured',
          message: 'El binding ARK_TOOLS_DB de D1 no está disponible.',
        },
        { status: 503, headers: corsHeaders }
      );
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 0. EXPEDIENTE ÚNICO Y CLIENTES (SPRINT 9)
  // ═══════════════════════════════════════════════════════════════════
  const expedienteResponse = await handleExpedienteApiRequest(request, env, corsHeaders, principal);
  if (expedienteResponse) {
    return expedienteResponse;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 1. GUÍA SAT / IMSS (CHECKLIST Y BORRADORES)
  // ═══════════════════════════════════════════════════════════════════
  if (url.pathname === '/api/guia/progress') {
    // GET: Obtener todos los pasos del tenant
    if (request.method === 'GET') {
      const tenantId = url.searchParams.get('tenant_id');
      if (!tenantId) {
        return Response.json(
          { error: 'Falta parámetro tenant_id' },
          { status: 400, headers: corsHeaders }
        );
      }
      const denied = await authorizeTenant(env, principal, tenantId, corsHeaders);
      if (denied) return denied;

      const { results } = await db
        .prepare(
          `SELECT step_id, user_id, checklist_state, draft_text, updated_at
           FROM guia_progress
           WHERE tenant_id = ?
           ORDER BY step_id ASC`
        )
        .bind(tenantId)
        .all();

      return Response.json(
        { success: true, tenant_id: tenantId, progress: results },
        { headers: corsHeaders }
      );
    }

    // POST: Guardar o actualizar progreso de un paso
    if (request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          tenant_id?: string;
          step_id?: number;
          checklist_state?: Record<string, boolean> | string;
          draft_text?: string;
        };

        const { tenant_id, step_id, checklist_state, draft_text } = body;

        if (!tenant_id || typeof step_id !== 'number') {
          return Response.json(
            { error: 'Parámetros requeridos: tenant_id, user_id, step_id (número)' },
            { status: 400, headers: corsHeaders }
          );
        }
        const denied = await authorizeTenant(env, principal, tenant_id, corsHeaders);
        if (denied) return denied;

        const stateJson =
          typeof checklist_state === 'object'
            ? JSON.stringify(checklist_state)
            : checklist_state || '{}';

        await db
          .prepare(
            `INSERT INTO guia_progress (tenant_id, step_id, user_id, checklist_state, draft_text, updated_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(tenant_id, step_id) DO UPDATE SET
               user_id = excluded.user_id,
               checklist_state = excluded.checklist_state,
               draft_text = excluded.draft_text,
               updated_at = CURRENT_TIMESTAMP`
          )
          .bind(tenant_id, step_id, principal!.id, stateJson, draft_text || '')
          .run();

        return Response.json(
          {
            success: true,
            message: `Paso ${step_id} guardado para el tenant ${tenant_id}`,
          },
          { headers: corsHeaders }
        );
      } catch (err) {
        return Response.json(
          { error: 'Error procesando solicitud', details: String(err) },
          { status: 500, headers: corsHeaders }
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. ARKANGEL LEDGER (AUDITORÍA INMUTABLE CON HASH SHA-256)
  // ═══════════════════════════════════════════════════════════════════
  if (url.pathname === '/api/ledger') {
    // GET: Obtener el historial inmutable de un caso
    if (request.method === 'GET') {
      const tenantId = url.searchParams.get('tenant_id');
      const casoId = url.searchParams.get('caso_id');

      if (!tenantId) {
        return Response.json(
          { error: 'Falta parámetro tenant_id' },
          { status: 400, headers: corsHeaders }
        );
      }
      const denied = await authorizeTenant(env, principal, tenantId, corsHeaders);
      if (denied) return denied;

      let query = `SELECT id, tenant_id, user_id, caso_id, conducta_id, estado, hash_sha256, prev_hash, timestamp
                   FROM arkangel_ledger
                   WHERE tenant_id = ?`;
      const params: (string | number)[] = [tenantId];

      if (casoId) {
        query += ` AND caso_id = ?`;
        params.push(casoId);
      }

      query += ` ORDER BY id ASC`;

      const { results } = await db
        .prepare(query)
        .bind(...params)
        .all();
      return Response.json(
        { success: true, tenant_id: tenantId, entries: results },
        { headers: corsHeaders }
      );
    }

    // POST: Insertar un dictamen/evento append-only con encadenamiento de hash
    if (request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          tenant_id?: string;
          caso_id?: string;
          conducta_id?: string;
          estado?: 'BLOQUEADO' | 'PERMITIDO';
        };

        const { tenant_id, caso_id, conducta_id, estado } = body;

        if (!tenant_id || !caso_id || !conducta_id || !estado) {
          return Response.json(
            { error: 'Parámetros requeridos: tenant_id, user_id, caso_id, conducta_id, estado' },
            { status: 400, headers: corsHeaders }
          );
        }
        const denied = await authorizeTenant(env, principal, tenant_id, corsHeaders);
        if (denied) return denied;

        // Obtener el hash del último bloque de este caso y tenant para encadenarlo
        const lastEntry = await db
          .prepare(
            `SELECT hash_sha256 FROM arkangel_ledger
             WHERE tenant_id = ? AND caso_id = ?
             ORDER BY id DESC LIMIT 1`
          )
          .bind(tenant_id, caso_id)
          .first<{ hash_sha256: string }>();

        const prevHash =
          lastEntry?.hash_sha256 ||
          '0000000000000000000000000000000000000000000000000000000000000000';

        const timestamp = new Date().toISOString();
        const userId = principal!.id;
        const payloadToHash = `${prevHash}|${tenant_id}|${userId}|${caso_id}|${conducta_id}|${estado}|${timestamp}`;
        const hashSha256 = await computeSha256(payloadToHash);

        const insertResult = await db
          .prepare(
            `INSERT INTO arkangel_ledger (tenant_id, user_id, caso_id, conducta_id, estado, hash_sha256, prev_hash, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(tenant_id, userId, caso_id, conducta_id, estado, hashSha256, prevHash, timestamp)
          .run();

        return Response.json(
          {
            success: true,
            id: insertResult.meta.last_row_id,
            hash_sha256: hashSha256,
            prev_hash: prevHash,
            timestamp,
          },
          { status: 201, headers: corsHeaders }
        );
      } catch (err) {
        return Response.json(
          { error: 'Error registrando entrada en ledger', details: String(err) },
          { status: 500, headers: corsHeaders }
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. ACTIVOS VIRTUALES WATCHLIST
  // ═══════════════════════════════════════════════════════════════════
  if (url.pathname === '/api/activos/watchlist') {
    // GET: Obtener las conductas guardadas
    if (request.method === 'GET') {
      const tenantId = url.searchParams.get('tenant_id');
      if (!tenantId) {
        return Response.json(
          { error: 'Falta parámetro tenant_id' },
          { status: 400, headers: corsHeaders }
        );
      }
      const denied = await authorizeTenant(env, principal, tenantId, corsHeaders);
      if (denied) return denied;

      const { results } = await db
        .prepare(
          `SELECT conducta_id, user_id, notes, created_at
           FROM activos_watchlist
           WHERE tenant_id = ?
           ORDER BY conducta_id ASC`
        )
        .bind(tenantId)
        .all();

      return Response.json(
        { success: true, tenant_id: tenantId, watchlist: results },
        { headers: corsHeaders }
      );
    }

    // POST: Guardar o actualizar nota de una conducta
    if (request.method === 'POST') {
      try {
        const body = (await request.json()) as {
          tenant_id?: string;
          conducta_id?: number;
          notes?: string;
        };

        const { tenant_id, conducta_id, notes } = body;

        if (!tenant_id || typeof conducta_id !== 'number') {
          return Response.json(
            { error: 'Parámetros requeridos: tenant_id, user_id, conducta_id (número)' },
            { status: 400, headers: corsHeaders }
          );
        }
        const denied = await authorizeTenant(env, principal, tenant_id, corsHeaders);
        if (denied) return denied;

        await db
          .prepare(
            `INSERT INTO activos_watchlist (tenant_id, conducta_id, user_id, notes, created_at)
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(tenant_id, conducta_id) DO UPDATE SET
               user_id = excluded.user_id,
               notes = excluded.notes,
               created_at = CURRENT_TIMESTAMP`
          )
          .bind(tenant_id, conducta_id, principal!.id, notes || '')
          .run();

        return Response.json(
          {
            success: true,
            message: `Conducta ${conducta_id} guardada para el tenant ${tenant_id}`,
          },
          { headers: corsHeaders }
        );
      } catch (err) {
        return Response.json(
          { error: 'Error guardando en watchlist', details: String(err) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // DELETE: Quitar una conducta de la watchlist
    if (request.method === 'DELETE') {
      const tenantId = url.searchParams.get('tenant_id');
      const conductaIdStr = url.searchParams.get('conducta_id');
      const conductaId = conductaIdStr ? parseInt(conductaIdStr, 10) : null;

      if (!tenantId || conductaId === null || isNaN(conductaId)) {
        return Response.json(
          { error: 'Parámetros requeridos: tenant_id, conducta_id' },
          { status: 400, headers: corsHeaders }
        );
      }
      const denied = await authorizeTenant(env, principal, tenantId, corsHeaders);
      if (denied) return denied;

      await db
        .prepare(`DELETE FROM activos_watchlist WHERE tenant_id = ? AND conducta_id = ?`)
        .bind(tenantId, conductaId)
        .run();

      return Response.json(
        {
          success: true,
          message: `Conducta ${conductaId} eliminada de la watchlist`,
        },
        { headers: corsHeaders }
      );
    }
  }

  return null;
}

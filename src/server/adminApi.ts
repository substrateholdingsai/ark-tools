/**
 * ARK TOOLS — Super Admin API Handlers
 *
 * Endpoints protegidos para la administración global de la plataforma:
 * 1. GET  /api/admin/overview — Métricas de adopción, conteos y salud de infraestructura
 * 2. GET  /api/admin/users — Directorio completo de usuarios y sus despachos
 * 3. GET  /api/admin/tenants — Directorio de despachos con métricas de clientes y expedientes
 * 4. POST /api/admin/users/role — Asignación de rol de plataforma (super_admin / user)
 */

import type { Env } from '../index';
import type { AuthPrincipal } from './auth';

function json(
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>,
  status = 200,
  extraHeaders?: HeadersInit
): Response {
  const headers = new Headers(corsHeaders);
  new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  return Response.json(body, { status, headers });
}

export async function handleAdminApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith('/api/admin/')) return null;

  // 1. Verificación estricta de Super Admin
  if (!principal) {
    return json({ error: 'Autenticación requerida.' }, corsHeaders, 401, {
      'Cache-Control': 'no-store',
    });
  }

  if (principal.platformRole !== 'super_admin') {
    return json(
      { error: 'Acceso restringido. Requiere rol de super_admin.' },
      corsHeaders,
      403,
      { 'Cache-Control': 'no-store' }
    );
  }

  const db = env.ARK_TOOLS_DB;
  if (!db) {
    return json({ error: 'Base de datos D1 no disponible.' }, corsHeaders, 503);
  }

  try {
    // ─────────────────────────────────────────────────────────────────
    // 1. GET /api/admin/overview
    // ─────────────────────────────────────────────────────────────────
    if (path === '/api/admin/overview' && request.method === 'GET') {
      const [
        totalUsersResult,
        verifiedUsersResult,
        totalTenantsResult,
        totalClientsResult,
        totalExpedientesResult,
        totalLedgerResult,
        recentUsersResult,
        recentTenantsResult,
      ] = await Promise.all([
        db.prepare('SELECT COUNT(*) AS total FROM users').first<{ total: number }>(),
        db
          .prepare('SELECT COUNT(*) AS total FROM users WHERE email_verified_at IS NOT NULL')
          .first<{ total: number }>(),
        db.prepare('SELECT COUNT(*) AS total FROM tenants').first<{ total: number }>(),
        db.prepare('SELECT COUNT(*) AS total FROM clients').first<{ total: number }>(),
        db.prepare('SELECT COUNT(*) AS total FROM expedientes').first<{ total: number }>(),
        db.prepare('SELECT COUNT(*) AS total FROM arkangel_ledger').first<{ total: number }>(),
        db
          .prepare(
            `SELECT id, email, full_name, platform_role, created_at, email_verified_at
             FROM users ORDER BY created_at DESC LIMIT 5`
          )
          .all<{
            id: string;
            email: string;
            full_name: string | null;
            platform_role: string;
            created_at: string;
            email_verified_at: number | null;
          }>(),
        db
          .prepare(
            `SELECT t.id, t.name, COALESCE(t.slug, '') AS slug, t.created_at,
                    COUNT(m.user_id) AS member_count
             FROM tenants t
             LEFT JOIN tenant_memberships m ON t.id = m.tenant_id
             GROUP BY t.id
             ORDER BY t.created_at DESC LIMIT 5`
          )
          .all<{
            id: string;
            name: string;
            slug: string;
            created_at: string;
            member_count: number;
          }>(),
      ]);

      const counts = {
        totalUsers: totalUsersResult?.total || 0,
        verifiedUsers: verifiedUsersResult?.total || 0,
        totalTenants: totalTenantsResult?.total || 0,
        totalClients: totalClientsResult?.total || 0,
        totalExpedientes: totalExpedientesResult?.total || 0,
        totalLedgerEntries: totalLedgerResult?.total || 0,
      };

      const systemHealth = {
        database: 'operational',
        aiWorkers: Boolean(env.AI),
        resendEmail: Boolean(env.RESEND_API_KEY),
        clipPayments: Boolean(env.CLIP_API_KEY && env.CLIP_API_SECRET),
        environment: env.ENVIRONMENT || 'production',
        appVersion: env.APP_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      };

      return json(
        {
          success: true,
          counts,
          recentUsers: recentUsersResult.results || [],
          recentTenants: recentTenantsResult.results || [],
          systemHealth,
        },
        corsHeaders,
        200,
        { 'Cache-Control': 'no-store' }
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. GET /api/admin/users
    // ─────────────────────────────────────────────────────────────────
    if (path === '/api/admin/users' && request.method === 'GET') {
      const [usersResult, membershipsResult] = await Promise.all([
        db
          .prepare(
            `SELECT id, email, full_name, platform_role, created_at, email_verified_at
             FROM users ORDER BY created_at DESC`
          )
          .all<{
            id: string;
            email: string;
            full_name: string | null;
            platform_role: 'user' | 'super_admin';
            created_at: string;
            email_verified_at: number | null;
          }>(),
        db
          .prepare(
            `SELECT m.user_id, m.tenant_id, t.name AS tenant_name, m.role
             FROM tenant_memberships m
             JOIN tenants t ON t.id = m.tenant_id`
          )
          .all<{
            user_id: string;
            tenant_id: string;
            tenant_name: string;
            role: string;
          }>(),
      ]);

      const membershipsByUser = new Map<
        string,
        Array<{ id: string; name: string; role: string }>
      >();
      for (const m of membershipsResult.results || []) {
        const list = membershipsByUser.get(m.user_id) || [];
        list.push({ id: m.tenant_id, name: m.tenant_name, role: m.role });
        membershipsByUser.set(m.user_id, list);
      }

      const users = (usersResult.results || []).map((u) => ({
        ...u,
        tenants: membershipsByUser.get(u.id) || [],
      }));

      return json({ success: true, users }, corsHeaders, 200, {
        'Cache-Control': 'no-store',
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. GET /api/admin/tenants
    // ─────────────────────────────────────────────────────────────────
    if (path === '/api/admin/tenants' && request.method === 'GET') {
      const { results } = await db
        .prepare(
          `SELECT t.id, t.name, COALESCE(t.slug, '') AS slug, t.created_at,
                  COUNT(DISTINCT m.user_id) AS member_count,
                  COUNT(DISTINCT c.id) AS client_count,
                  COUNT(DISTINCT e.id) AS expediente_count
           FROM tenants t
           LEFT JOIN tenant_memberships m ON t.id = m.tenant_id
           LEFT JOIN clients c ON t.id = c.tenant_id
           LEFT JOIN expedientes e ON t.id = e.tenant_id
           GROUP BY t.id
           ORDER BY t.created_at DESC`
        )
        .all<{
          id: string;
          name: string;
          slug: string;
          created_at: string;
          member_count: number;
          client_count: number;
          expediente_count: number;
        }>();

      return json({ success: true, tenants: results || [] }, corsHeaders, 200, {
        'Cache-Control': 'no-store',
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. POST /api/admin/users/role
    // ─────────────────────────────────────────────────────────────────
    if (path === '/api/admin/users/role' && request.method === 'POST') {
      const body = (await request.json()) as { userId?: unknown; role?: unknown } | null;
      const targetUserId = typeof body?.userId === 'string' ? body.userId.trim() : '';
      const newRole = typeof body?.role === 'string' ? body.role.trim() : '';

      if (!targetUserId || !['user', 'super_admin'].includes(newRole)) {
        return json(
          { error: 'Parámetros inválidos. userId y role (user | super_admin) son requeridos.' },
          corsHeaders,
          400
        );
      }

      // Evitar que el super_admin actual se revoque a sí mismo para prevenir orfandad
      if (targetUserId === principal.id && newRole !== 'super_admin') {
        return json(
          { error: 'Por seguridad, no puedes revocar tu propio rol de super_admin.' },
          corsHeaders,
          400
        );
      }

      const updated = await db
        .prepare(
          `UPDATE users SET platform_role = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?
           RETURNING id, email, full_name, platform_role`
        )
        .bind(newRole, targetUserId)
        .first<{
          id: string;
          email: string;
          full_name: string | null;
          platform_role: string;
        }>();

      if (!updated) {
        return json({ error: 'Usuario no encontrado.' }, corsHeaders, 404);
      }

      return json(
        {
          success: true,
          message: `Rol de ${updated.email} actualizado a ${newRole}.`,
          user: updated,
        },
        corsHeaders,
        200
      );
    }

    return json({ error: 'Ruta de administración no encontrada.' }, corsHeaders, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Admin API] Error inesperado:', message, error);
    return json(
      { error: `Error en el servicio de administración: ${message}` },
      corsHeaders,
      500
    );
  }
}

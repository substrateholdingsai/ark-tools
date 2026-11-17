import type { Env } from '../index';
import { requireTenantMembership, type AuthPrincipal } from './auth';

const BASE = '/api/canaco/delegaciones';
const TENANT = 'canaco_merida';

export async function handleCanacoDelegacionesApi(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (path !== BASE && !path.startsWith(`${BASE}/`)) return null;

  const headers = { ...corsHeaders, 'Cache-Control': 'no-store' };
  if (!principal)
    return Response.json({ error: 'Autenticación requerida.' }, { status: 401, headers });
  if (!env.ARK_TOOLS_DB) {
    return Response.json({ error: 'Base de datos D1 no disponible.' }, { status: 503, headers });
  }

  try {
    if (principal.platformRole !== 'super_admin') {
      const membership = await requireTenantMembership(env, principal, TENANT);
      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return Response.json(
          { error: 'Se requiere administración de CANACO.' },
          { status: 403, headers }
        );
      }
    }

    const db = env.ARK_TOOLS_DB;
    if (path === BASE && request.method === 'GET') {
      const delegaciones = await db
        .prepare(
          `SELECT d.id, d.nombre, COUNT(l.id) AS registros,
                  SUM(CASE WHEN l.lifecycle_stage = 'socio_activo' THEN 1 ELSE 0 END) AS socios_activos,
                  SUM(CASE WHEN l.last_contact IS NOT NULL AND TRIM(l.last_contact) <> '' THEN 1 ELSE 0 END) AS con_contacto
           FROM canaco_delegaciones d
           LEFT JOIN canaco_delegacion_leads a ON a.delegacion_id = d.id
           LEFT JOIN leads_ark_tools l ON l.id = a.lead_id AND l.tenant_id = ?
             AND COALESCE(l.is_demo, 0) = 0
           GROUP BY d.id, d.nombre ORDER BY d.nombre`
        )
        .bind(TENANT)
        .all();
      const asignaciones = await db
        .prepare(
          `SELECT a.lead_id, a.delegacion_id FROM canaco_delegacion_leads a
           JOIN leads_ark_tools l ON l.id = a.lead_id
           WHERE l.tenant_id = ? AND COALESCE(l.is_demo, 0) = 0`
        )
        .bind(TENANT)
        .all();
      const sinAsignar = await db
        .prepare(
          `SELECT COUNT(*) AS total FROM leads_ark_tools l
           LEFT JOIN canaco_delegacion_leads a ON a.lead_id = l.id
           WHERE l.tenant_id = ? AND COALESCE(l.is_demo, 0) = 0 AND a.lead_id IS NULL`
        )
        .bind(TENANT)
        .first<{ total: number }>();
      if (!sinAsignar) throw new Error('No se pudo contar los registros sin delegación.');
      return Response.json(
        {
          delegaciones: delegaciones.results,
          asignaciones: asignaciones.results,
          sinAsignar: sinAsignar.total,
        },
        { headers }
      );
    }

    if (path === BASE && request.method === 'POST') {
      const body: unknown = await request.json();
      const nombre =
        typeof body === 'object' &&
        body !== null &&
        'nombre' in body &&
        typeof body.nombre === 'string'
          ? body.nombre.trim()
          : '';
      if (!nombre || nombre.length > 120) {
        return Response.json(
          { error: 'El nombre debe tener entre 1 y 120 caracteres.' },
          { status: 400, headers }
        );
      }
      const id = crypto.randomUUID();
      const result = await db
        .prepare('INSERT OR IGNORE INTO canaco_delegaciones (id, nombre) VALUES (?, ?)')
        .bind(id, nombre)
        .run();
      if (!result.meta.changes) {
        return Response.json(
          { error: 'Ya existe una delegación con ese nombre.' },
          { status: 409, headers }
        );
      }
      return Response.json({ id, nombre }, { status: 201, headers });
    }

    const match = path.match(/^\/api\/canaco\/delegaciones\/asignaciones\/([^/]+)$/);
    if (match?.[1] && request.method === 'PUT') {
      const leadId = decodeURIComponent(match[1]);
      const body: unknown = await request.json();
      if (
        typeof body !== 'object' ||
        body === null ||
        !('delegacionId' in body) ||
        (body.delegacionId !== null && typeof body.delegacionId !== 'string')
      ) {
        return Response.json({ error: 'Delegación inválida.' }, { status: 400, headers });
      }
      const lead = await db
        .prepare(
          'SELECT id FROM leads_ark_tools WHERE id = ? AND tenant_id = ? AND COALESCE(is_demo, 0) = 0'
        )
        .bind(leadId, TENANT)
        .first<{ id: string }>();
      if (!lead)
        return Response.json({ error: 'Registro CANACO no encontrado.' }, { status: 404, headers });
      if (body.delegacionId === null) {
        await db
          .prepare('DELETE FROM canaco_delegacion_leads WHERE lead_id = ?')
          .bind(leadId)
          .run();
      } else {
        const delegation = await db
          .prepare('SELECT id FROM canaco_delegaciones WHERE id = ?')
          .bind(body.delegacionId)
          .first<{ id: string }>();
        if (!delegation)
          return Response.json({ error: 'Delegación no encontrada.' }, { status: 404, headers });
        await db
          .prepare(
            `INSERT INTO canaco_delegacion_leads (lead_id, delegacion_id, assigned_by)
           VALUES (?, ?, ?)
           ON CONFLICT(lead_id) DO UPDATE SET delegacion_id = excluded.delegacion_id,
             assigned_by = excluded.assigned_by, assigned_at = CURRENT_TIMESTAMP`
          )
          .bind(leadId, body.delegacionId, principal.id)
          .run();
      }
      return Response.json({ ok: true }, { headers });
    }
    return Response.json({ error: 'Ruta no encontrada.' }, { status: 404, headers });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'JSON inválido.' }, { status: 400, headers });
    }
    console.error('[CANACO Delegaciones] Error:', error);
    return Response.json(
      { error: 'No se pudo completar la operación de delegaciones.' },
      { status: 500, headers }
    );
  }
}

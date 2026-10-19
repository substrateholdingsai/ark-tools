import type { Env } from '../index';
import { requireTenantMembership, type AuthPrincipal } from './auth';


interface Lead {
  id: string;
  web: string | null;
  whatsapp: string | null;
  email: string | null;
  ciudad: string | null;
  especialidad: string | null;
  status: string | null;
  last_contact: string | null;
  contacto_nombre: string | null;
  notas: string | null;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    web: row.web == null ? null : String(row.web),
    whatsapp: row.whatsapp == null ? null : String(row.whatsapp),
    email: row.email == null ? null : String(row.email),
    ciudad: row.ciudad == null ? null : String(row.ciudad),
    especialidad: row.especialidad == null ? null : String(row.especialidad),
    status: row.status == null ? null : String(row.status),
    last_contact: row.last_contact == null ? null : String(row.last_contact),
    contacto_nombre: row.contacto_nombre == null ? null : String(row.contacto_nombre),
    notas: row.notas == null ? null : String(row.notas),
    tenant_id: String(row.tenant_id ?? 'ark'),
    created_at: row.created_at == null ? undefined : String(row.created_at),
    updated_at: row.updated_at == null ? undefined : String(row.updated_at),
  };
}

export async function handleLeadsApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null = null
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/admin/leads')) return null;

  const db = env.ARK_TOOLS_DB;
  if (!db) {
    return Response.json(
      { error: 'Base de datos D1 no disponible.' },
      { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  if (!principal) {
    return Response.json(
      { error: 'Autenticación requerida.' },
      { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const tenantId =
    url.searchParams.get('tenant') ||
    url.searchParams.get('tenant_id') ||
    url.searchParams.get('tenantId') ||
    request.headers.get('X-Tenant-ID') ||
    request.headers.get('x-tenant-id') ||
    'ark';

  // Tenant access check (super_admin bypasses)
  if (principal.platformRole !== 'super_admin' && tenantId !== 'ark') {
    const membership = await requireTenantMembership(env, principal, tenantId);
    if (!membership) {
      return Response.json(
        { error: 'No tienes acceso a este despacho.' },
        { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  try {
    // STATS
    if (path === '/api/admin/leads/stats' && request.method === 'GET') {
      const totalRow = await db
        .prepare('SELECT COUNT(*) AS total FROM leads_ark_tools WHERE tenant_id = ?')
        .bind(tenantId)
        .first<{ total: number }>();

      const ciudadRows = await db
        .prepare(
          'SELECT ciudad, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ? GROUP BY ciudad ORDER BY ciudad'
        )
        .bind(tenantId)
        .all<{ ciudad: string | null; count: number }>();

      const statusRows = await db
        .prepare(
          'SELECT status, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ? GROUP BY status ORDER BY status'
        )
        .bind(tenantId)
        .all<{ status: string | null; count: number }>();

      const espRows = await db
        .prepare(
          'SELECT especialidad, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ? GROUP BY especialidad ORDER BY especialidad'
        )
        .bind(tenantId)
        .all<{ especialidad: string | null; count: number }>();

      const porCiudad = (ciudadRows.results || []).map((r) => ({
        ciudad: r.ciudad,
        count: r.count,
        total: r.count,
        cantidad: r.count,
      }));
      const porStatus = (statusRows.results || []).map((r) => ({
        status: r.status,
        count: r.count,
        total: r.count,
        cantidad: r.count,
      }));
      const porEspecialidad = (espRows.results || []).map((r) => ({
        especialidad: r.especialidad,
        count: r.count,
        total: r.count,
        cantidad: r.count,
      }));

      const body = {
        success: true,
        ok: true,
        total: totalRow?.total || 0,
        por_ciudad: porCiudad,
        por_status: porStatus,
        por_especialidad: porEspecialidad,
      };
      return Response.json(body, {
        headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
      });
    }

    // LIST
    if (path === '/api/admin/leads' && request.method === 'GET') {
      const ciudad = url.searchParams.get('ciudad');
      const status = url.searchParams.get('status');
      const especialidad = url.searchParams.get('especialidad');
      const q = (url.searchParams.get('q') || '').trim();

      let query = 'SELECT * FROM leads_ark_tools WHERE tenant_id = ?';
      const binds: unknown[] = [tenantId];

      if (ciudad) {
        query += ' AND ciudad = ?';
        binds.push(ciudad);
      }
      if (status) {
        query += ' AND status = ?';
        binds.push(status);
      }
      if (especialidad) {
        query += ' AND especialidad = ?';
        binds.push(especialidad);
      }
      if (q) {
        query += ' AND (web LIKE ? OR email LIKE ? OR contacto_nombre LIKE ? OR notas LIKE ? OR whatsapp LIKE ?)';
        const wildcard = `%${q}%`;
        binds.push(wildcard, wildcard, wildcard, wildcard, wildcard);
      }
      query += ' ORDER BY created_at DESC, id ASC';

      const stmt = db.prepare(query);
      const { results } = await stmt.bind(...binds).all<Record<string, unknown>>();
      const leads = (results || []).map(rowToLead);

      return Response.json(
        {
          success: true,
          ok: true,
          leads,
          results: leads,
          data: leads,
          total: leads.length,
        },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    // DETAIL /api/admin/leads/:id
    const detailMatch = path.match(/^\/api\/admin\/leads\/([^/]+)$/);
    if (detailMatch && request.method === 'GET') {
      const id = detailMatch[1] ? decodeURIComponent(detailMatch[1]) : '';
      if (!id || id === 'stats') {
        return null;
      }
      const row = await db
        .prepare('SELECT * FROM leads_ark_tools WHERE id = ? AND tenant_id = ? LIMIT 1')
        .bind(id, tenantId)
        .first<Record<string, unknown>>();
      if (!row) {
        return Response.json(
          { error: 'Lead no encontrado.' },
          { status: 404, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      const lead = rowToLead(row);
      return Response.json(
        { success: true, ok: true, lead, data: lead },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    // CREATE
    if (path === '/api/admin/leads' && request.method === 'POST') {
      const body = (await request.json()) as Record<string, unknown>;
      const id =
        typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID();
      const web = body.web == null ? null : String(body.web).trim() || null;
      const whatsapp = body.whatsapp == null ? null : String(body.whatsapp).trim() || null;
      const email = body.email == null ? null : String(body.email).trim() || null;
      const ciudad = body.ciudad == null ? null : String(body.ciudad).trim() || null;
      const especialidad =
        body.especialidad == null ? null : String(body.especialidad).trim() || null;
      const status = body.status == null ? 'Nuevo' : String(body.status).trim() || 'Nuevo';
      const last_contact =
        body.last_contact == null ? null : String(body.last_contact).trim() || null;
      const contacto_nombre =
        body.contacto_nombre == null ? null : String(body.contacto_nombre).trim() || null;
      const notas = body.notas == null ? null : String(body.notas).trim() || null;
      const tId =
        body.tenant_id == null ? tenantId : String(body.tenant_id).trim() || tenantId;

      await db
        .prepare(
          `INSERT INTO leads_ark_tools (id, web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas, tenant_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(id, web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas, tId)
        .run();

      const created = await db
        .prepare('SELECT * FROM leads_ark_tools WHERE id = ? AND tenant_id = ? LIMIT 1')
        .bind(id, tId)
        .first<Record<string, unknown>>();
      const lead = created ? rowToLead(created) : rowToLead({
        id,
        web,
        whatsapp,
        email,
        ciudad,
        especialidad,
        status,
        last_contact,
        contacto_nombre,
        notas,
        tenant_id: tId,
      });

      return Response.json(
        { success: true, ok: true, lead, data: lead },
        { status: 201, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    // UPDATE /api/admin/leads/:id
    if (detailMatch && (request.method === 'PUT' || request.method === 'PATCH')) {
      const id = detailMatch[1] ? decodeURIComponent(detailMatch[1]) : '';
      if (!id || id === 'stats') {
        return null;
      }
      const body = (await request.json()) as Record<string, unknown>;

      const existing = await db
        .prepare('SELECT * FROM leads_ark_tools WHERE id = ? AND tenant_id = ? LIMIT 1')
        .bind(id, tenantId)
        .first<Record<string, unknown>>();
      if (!existing) {
        return Response.json(
          { error: 'Lead no encontrado.' },
          { status: 404, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const web = body.web === undefined ? existing.web : (body.web == null ? null : String(body.web).trim() || null);
      const whatsapp =
        body.whatsapp === undefined
          ? existing.whatsapp
          : (body.whatsapp == null ? null : String(body.whatsapp).trim() || null);
      const email =
        body.email === undefined ? existing.email : (body.email == null ? null : String(body.email).trim() || null);
      const ciudad =
        body.ciudad === undefined ? existing.ciudad : (body.ciudad == null ? null : String(body.ciudad).trim() || null);
      const especialidad =
        body.especialidad === undefined
          ? existing.especialidad
          : (body.especialidad == null ? null : String(body.especialidad).trim() || null);
      const status =
        body.status === undefined ? existing.status : (body.status == null ? null : String(body.status).trim() || null);
      const last_contact =
        body.last_contact === undefined
          ? existing.last_contact
          : (body.last_contact == null ? null : String(body.last_contact).trim() || null);
      const contacto_nombre =
        body.contacto_nombre === undefined
          ? existing.contacto_nombre
          : (body.contacto_nombre == null ? null : String(body.contacto_nombre).trim() || null);
      const notas =
        body.notas === undefined ? existing.notas : (body.notas == null ? null : String(body.notas).trim() || null);

      await db
        .prepare(
          `UPDATE leads_ark_tools SET
            web = ?, whatsapp = ?, email = ?, ciudad = ?, especialidad = ?, status = ?,
            last_contact = ?, contacto_nombre = ?, notas = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND tenant_id = ?`
        )
        .bind(web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas, id, tenantId)
        .run();

      const updated = await db
        .prepare('SELECT * FROM leads_ark_tools WHERE id = ? AND tenant_id = ? LIMIT 1')
        .bind(id, tenantId)
        .first<Record<string, unknown>>();
      const lead = updated ? rowToLead(updated) : rowToLead({
        ...existing,
        web,
        whatsapp,
        email,
        ciudad,
        especialidad,
        status,
        last_contact,
        contacto_nombre,
        notas,
      });

      return Response.json(
        { success: true, ok: true, lead, data: lead },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    // DELETE /api/admin/leads/:id
    if (detailMatch && request.method === 'DELETE') {
      const id = detailMatch[1] ? decodeURIComponent(detailMatch[1]) : '';
      if (!id || id === 'stats') {
        return null;
      }
      await db
        .prepare('DELETE FROM leads_ark_tools WHERE id = ? AND tenant_id = ?')
        .bind(id, tenantId)
        .run();
      return Response.json(
        { success: true, ok: true, deleted: true },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    return Response.json(
      { error: 'Ruta de leads no encontrada.' },
      { status: 404, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Leads API] Error:', message, error);
    return Response.json(
      { error: `Error en leads: ${message}` },
      { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }
}

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

export function buildProposalEmailHtml(nombreSocio: string, logoUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Infraestructura Tecnológica para su Firma</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #334155; -webkit-font-smoothing: antialiased;">

    <!-- Wrapper -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 40px 0;">
        <tr>
            <td align="center">
                
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px; background-color: #ffffff;">
                            <img src="${logoUrl}" alt="Ark Systems Logo" width="120" style="display: block; max-width: 120px; height: auto;">
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1e293b;">
                                Hola <strong>${nombreSocio}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                Notamos que las grandes firmas contables buscan integrar Inteligencia Artificial y automatización masiva, pero las opciones del mercado los obligan a usar software genérico de terceros donde pierden el control y privacidad de sus datos.
                            </p>

                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                                En Ark Systems construimos infraestructura dedicada. Hemos desarrollado un motor de cálculo, auditoría fiscal y timbrado —con 15 herramientas especializadas y un Agente de IA entrenado en leyes mexicanas— <strong>diseñado para desplegarse como marca blanca</strong>.
                            </p>

                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                En lugar de vender licencias, instalamos y mantenemos este motor en un entorno privado exclusivo para su despacho, permitiéndoles ofrecer tecnología de punta a sus clientes corporativos como si tuvieran un equipo interno de innovación.
                            </p>

                            <!-- Pricing/Value Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; border-left: 4px solid #0f172a; border-radius: 4px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a;">Plan Corporate Firm (Marca Blanca)</h3>
                                        <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.5;"><strong>Arrendamiento de Infraestructura Fiscal + IA (100% deducible)</strong></p>
                                        
                                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #475569;">
                                            <li style="margin-bottom: 8px;"><strong>Branding Total:</strong> Despliegue en su propio subdominio (ej. <em>tools.sudespacho.com</em>) con su logotipo.</li>
                                            <li style="margin-bottom: 8px;"><strong>Aislamiento Estricto:</strong> Base de datos dedicada. Sus cuentas corporativas no comparten entorno con terceros.</li>
                                            <li style="margin-bottom: 8px;"><strong>Papeles de Trabajo Oficiales:</strong> Cédulas PDF con Sello SHA-256 y QR a nombre de su firma.</li>
                                            <li style="margin-bottom: 8px;"><strong>Noah (AI Privado):</strong> Inteligencia Artificial operando dentro de su entorno con cero filtraciones.</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                ¿Tienen 15 minutos la próxima semana para mostrarles cómo se vería su propia plataforma operando en vivo?
                            </p>

                            <!-- Call to Action -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left">
                                        <a href="https://wa.me/525657062511" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px;">Coordinar una breve llamada</a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer / Signature -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                                <tr>
                                    <td style="font-size: 14px; line-height: 1.6; color: #64748b;">
                                        Saludos,<br><br>
                                        <strong>Pavel Cortés</strong><br>
                                        Ark Systems<br>
                                        <a href="mailto:pavel@arksystems.site" style="color: #0f172a; text-decoration: none;">pavel@arksystems.site</a><br>
                                        +52 56 5706 2511
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
                
                <!-- Anti-Spam Address Footer -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" style="padding: 20px; font-size: 12px; color: #94a3b8;">
                            Este mensaje fue enviado por Ark Systems. Si no deseas recibir más comunicaciones sobre infraestructura tecnológica, responde a este correo solicitándolo.
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`;
}

export function buildProposalEmailText(nombreSocio: string): string {
  return `Hola ${nombreSocio},

Notamos que las grandes firmas contables buscan integrar Inteligencia Artificial y automatización masiva, pero las opciones del mercado los obligan a usar software genérico de terceros donde pierden el control y privacidad de sus datos.

En Ark Systems construimos infraestructura dedicada. Hemos desarrollado un motor de cálculo, auditoría fiscal y timbrado —con 15 herramientas especializadas y un Agente de IA entrenado en leyes mexicanas— diseñado para desplegarse como marca blanca.

En lugar de vender licencias, instalamos y mantenemos este motor en un entorno privado exclusivo para su despacho, permitiéndoles ofrecer tecnología de punta a sus clientes corporativos como si tuvieran un equipo interno de innovación.

Plan Corporate Firm (Marca Blanca) - Arrendamiento de Infraestructura Fiscal + IA (100% deducible):
- Branding Total: Despliegue en su propio subdominio con su logotipo.
- Aislamiento Estricto: Base de datos dedicada. Sus cuentas corporativas no comparten entorno con terceros.
- Papeles de Trabajo Oficiales: Cédulas PDF con Sello SHA-256 y QR a nombre de su firma.
- Noah (AI Privado): Inteligencia Artificial operando dentro de su entorno con cero filtraciones.

¿Tienen 15 minutos la próxima semana para mostrarles cómo se vería su propia plataforma operando en vivo?
Coordinar una llamada vía WhatsApp: https://wa.me/525657062511

Saludos,
Pavel Cortés
Ark Systems
pavel@arksystems.site
+52 56 5706 2511

Este mensaje fue enviado por Ark Systems. Si no deseas recibir más comunicaciones sobre infraestructura tecnológica, responde a este correo solicitándolo.`;
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
        query +=
          ' AND (web LIKE ? OR email LIKE ? OR contacto_nombre LIKE ? OR notas LIKE ? OR whatsapp LIKE ?)';
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
      const tId = body.tenant_id == null ? tenantId : String(body.tenant_id).trim() || tenantId;

      await db
        .prepare(
          `INSERT INTO leads_ark_tools (id, web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas, tenant_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(
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
          tId
        )
        .run();

      const created = await db
        .prepare('SELECT * FROM leads_ark_tools WHERE id = ? AND tenant_id = ? LIMIT 1')
        .bind(id, tId)
        .first<Record<string, unknown>>();
      const lead = created
        ? rowToLead(created)
        : rowToLead({
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

      const web =
        body.web === undefined
          ? existing.web
          : body.web == null
            ? null
            : String(body.web).trim() || null;
      const whatsapp =
        body.whatsapp === undefined
          ? existing.whatsapp
          : body.whatsapp == null
            ? null
            : String(body.whatsapp).trim() || null;
      const email =
        body.email === undefined
          ? existing.email
          : body.email == null
            ? null
            : String(body.email).trim() || null;
      const ciudad =
        body.ciudad === undefined
          ? existing.ciudad
          : body.ciudad == null
            ? null
            : String(body.ciudad).trim() || null;
      const especialidad =
        body.especialidad === undefined
          ? existing.especialidad
          : body.especialidad == null
            ? null
            : String(body.especialidad).trim() || null;
      const status =
        body.status === undefined
          ? existing.status
          : body.status == null
            ? null
            : String(body.status).trim() || null;
      const last_contact =
        body.last_contact === undefined
          ? existing.last_contact
          : body.last_contact == null
            ? null
            : String(body.last_contact).trim() || null;
      const contacto_nombre =
        body.contacto_nombre === undefined
          ? existing.contacto_nombre
          : body.contacto_nombre == null
            ? null
            : String(body.contacto_nombre).trim() || null;
      const notas =
        body.notas === undefined
          ? existing.notas
          : body.notas == null
            ? null
            : String(body.notas).trim() || null;

      await db
        .prepare(
          `UPDATE leads_ark_tools SET
            web = ?, whatsapp = ?, email = ?, ciudad = ?, especialidad = ?, status = ?,
            last_contact = ?, contacto_nombre = ?, notas = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND tenant_id = ?`
        )
        .bind(
          web,
          whatsapp,
          email,
          ciudad,
          especialidad,
          status,
          last_contact,
          contacto_nombre,
          notas,
          id,
          tenantId
        )
        .run();

      const updated = await db
        .prepare('SELECT * FROM leads_ark_tools WHERE id = ? AND tenant_id = ? LIMIT 1')
        .bind(id, tenantId)
        .first<Record<string, unknown>>();
      const lead = updated
        ? rowToLead(updated)
        : rowToLead({
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

    // SEND PROPOSAL EMAIL /api/admin/leads/:id/send-email
    const sendEmailMatch = path.match(/^\/api\/admin\/leads\/([^/]+)\/send-email$/);
    if (sendEmailMatch && request.method === 'POST') {
      const id = sendEmailMatch[1] ? decodeURIComponent(sendEmailMatch[1]) : '';
      if (!id) return null;

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
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const targetEmail =
        typeof body.test_email === 'string' && body.test_email.trim()
          ? body.test_email.trim()
          : lead.email;

      if (!targetEmail || !targetEmail.includes('@')) {
        return Response.json(
          { error: 'El prospecto no cuenta con una dirección de correo válida.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      if (!env.RESEND_API_KEY) {
        return Response.json(
          { error: 'Servicio Resend no configurado (RESEND_API_KEY no presente).' },
          { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const recipientName =
        typeof body.recipient_name === 'string' && body.recipient_name.trim()
          ? body.recipient_name.trim()
          : lead.contacto_nombre?.trim() || 'Director(a)';

      const baseUrl = env.APP_URL || 'https://ledger.arksystems.site';
      const logoUrl = `${baseUrl.replace(/\/$/, '')}/logo-email.png`;

      const html = buildProposalEmailHtml(recipientName, logoUrl);
      const text = buildProposalEmailText(recipientName);

      const fromAddress = env.AUTH_EMAIL_FROM || 'Pavel Cortés <pavel@mail.arksystems.site>';
      const replyTo = 'pavel@arksystems.site';
      const subject = 'Infraestructura Tecnológica para su Firma';

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          reply_to: replyTo,
          to: [targetEmail],
          subject,
          text,
          html,
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        console.error('[Leads API] Resend error:', resendRes.status, errorText);
        return Response.json(
          { error: `Resend rechazó el envío (HTTP ${resendRes.status}): ${errorText}` },
          { status: 502, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const resendData = (await resendRes.json().catch(() => ({}))) as { id?: string };

      // Si fue envío real (no prueba), actualizar estatus en D1
      const isTest = Boolean(body.test_email && body.test_email !== lead.email);
      let updatedLead = lead;

      if (!isTest) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        const newStatus = `Mail_enviado_${dd}${mm}${yy}`;
        const todayIso = now.toISOString().slice(0, 10);

        await db
          .prepare(
            `UPDATE leads_ark_tools SET status = ?, last_contact = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?`
          )
          .bind(newStatus, todayIso, id, tenantId)
          .run();

        updatedLead = {
          ...lead,
          status: newStatus,
          last_contact: todayIso,
        };
      }

      return Response.json(
        {
          success: true,
          ok: true,
          message: isTest
            ? `Correo de prueba enviado con éxito a ${targetEmail}`
            : `Propuesta enviada con éxito a ${targetEmail}`,
          resend_id: resendData.id,
          lead: updatedLead,
          data: updatedLead,
        },
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

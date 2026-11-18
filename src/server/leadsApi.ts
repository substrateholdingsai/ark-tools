import type { Env } from '../index';
import { requireTenantMembership, type AuthPrincipal } from './auth';
import { escapeHtml } from './canacoEmailService';
import { isEmailServiceConfigured, sendTransactionalEmail } from './email/emailService';
import { buildWhatsAppDeepLink, normalizeMexicanPhone } from '../lib/whatsappStudio';

interface Lead {
  id: string;
  canonical_rfc: string | null;
  web: string | null;
  whatsapp: string | null;
  whatsapp_link?: string | null;
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
  lifecycle_stage: string | null;
  consent_aviso_version: string | null;
  consent_accepted_at: string | null;
  consent_medium: string | null;
  arkangel_share_consent: number | null;
  sales_share_consent: number | null;
  origin: string | null;
  is_demo: number | null;
  payment_environment: string | null;
  verified_payment_amount_cents: number | null;
  verified_payment_channel: string | null;
  verified_payment_environment: string | null;
  verified_payment_rfc: string | null;
  verified_payment_folio_siem: string | null;
  verified_payment_razon_social: string | null;
  verified_payment_num_empleados: number | null;
  verified_payment_sector: string | null;
}

export function buildProposalEmailHtml(nombreSocio: string, logoUrl: string): string {
  const safeNombreSocio = escapeHtml(nombreSocio);
  const safeLogoUrl = escapeHtml(logoUrl);
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
                            <img src="${safeLogoUrl}" alt="Ark Systems Logo" width="120" style="display: block; max-width: 120px; height: auto;">
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #1e293b;">
                                Hola <strong>${safeNombreSocio}</strong>,
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
                                            <li style="margin-bottom: 8px;"><strong>Papeles de Trabajo Oficiales:</strong> Cédulas PDF con Folio de Integridad (hash SHA-256 local) y QR a nombre de su firma.</li>
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
- Papeles de Trabajo Oficiales: Cédulas PDF con Folio de Integridad (hash SHA-256 local) y QR a nombre de su firma.
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
  const whatsapp = row.whatsapp == null ? null : String(row.whatsapp);
  return {
    id: String(row.id),
    canonical_rfc: row.canonical_rfc == null ? null : String(row.canonical_rfc),
    web: row.web == null ? null : String(row.web),
    whatsapp,
    whatsapp_link: whatsapp ? buildWhatsAppDeepLink(whatsapp) : null,
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
    lifecycle_stage: row.lifecycle_stage == null ? null : String(row.lifecycle_stage),
    consent_aviso_version:
      row.consent_aviso_version == null ? null : String(row.consent_aviso_version),
    consent_accepted_at: row.consent_accepted_at == null ? null : String(row.consent_accepted_at),
    consent_medium: row.consent_medium == null ? null : String(row.consent_medium),
    arkangel_share_consent:
      row.arkangel_share_consent == null ? null : Number(row.arkangel_share_consent),
    sales_share_consent: row.sales_share_consent == null ? null : Number(row.sales_share_consent),
    origin: row.origin == null ? null : String(row.origin),
    is_demo: row.is_demo == null ? null : Number(row.is_demo),
    payment_environment: row.payment_environment == null ? null : String(row.payment_environment),
    verified_payment_amount_cents:
      row.verified_payment_amount_cents == null ? null : Number(row.verified_payment_amount_cents),
    verified_payment_channel:
      row.verified_payment_channel == null ? null : String(row.verified_payment_channel),
    verified_payment_environment:
      row.verified_payment_environment == null ? null : String(row.verified_payment_environment),
    verified_payment_rfc:
      row.verified_payment_rfc == null ? null : String(row.verified_payment_rfc),
    verified_payment_folio_siem:
      row.verified_payment_folio_siem == null ? null : String(row.verified_payment_folio_siem),
    verified_payment_razon_social:
      row.verified_payment_razon_social == null ? null : String(row.verified_payment_razon_social),
    verified_payment_num_empleados:
      row.verified_payment_num_empleados == null
        ? null
        : Number(row.verified_payment_num_empleados),
    verified_payment_sector:
      row.verified_payment_sector == null ? null : String(row.verified_payment_sector),
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

  // Tenant access check (solo super_admin, admin cameral para canaco_merida o miembro verificado del despacho)
  const isCanacoAdmin =
    principal.email.toLowerCase() === 'horus.i2d@gmail.com' && tenantId === 'canaco_merida';
  if (principal.platformRole !== 'super_admin' && !isCanacoAdmin) {
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
      const demoFilter = tenantId === 'canaco_merida' ? ' AND COALESCE(is_demo, 0) = 0' : '';
      const totalRow = await db
        .prepare(`SELECT COUNT(*) AS total FROM leads_ark_tools WHERE tenant_id = ?${demoFilter}`)
        .bind(tenantId)
        .first<{ total: number }>();

      const ciudadRows = await db
        .prepare(
          `SELECT ciudad, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ?${demoFilter} GROUP BY ciudad ORDER BY ciudad`
        )
        .bind(tenantId)
        .all<{ ciudad: string | null; count: number }>();

      const statusRows = await db
        .prepare(
          `SELECT status, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ?${demoFilter} GROUP BY status ORDER BY status`
        )
        .bind(tenantId)
        .all<{ status: string | null; count: number }>();

      const espRows = await db
        .prepare(
          `SELECT especialidad, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ?${demoFilter} GROUP BY especialidad ORDER BY especialidad`
        )
        .bind(tenantId)
        .all<{ especialidad: string | null; count: number }>();

      const stageRows =
        tenantId === 'canaco_merida'
          ? await db
              .prepare(
                `SELECT lifecycle_stage, COUNT(*) AS count
                 FROM leads_ark_tools
                 WHERE tenant_id = ?${demoFilter}
                 GROUP BY lifecycle_stage ORDER BY lifecycle_stage`
              )
              .bind(tenantId)
              .all<{ lifecycle_stage: string | null; count: number }>()
          : { results: [] };

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
        por_etapa: (stageRows.results || []).map((r) => ({
          etapa: r.lifecycle_stage,
          count: r.count,
        })),
      };
      return Response.json(body, {
        headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
      });
    }

    // LIST (Paginado: default 20, cap 100)
    if (path === '/api/admin/leads' && request.method === 'GET') {
      const ciudad = url.searchParams.get('ciudad');
      const status = url.searchParams.get('status');
      const especialidad = url.searchParams.get('especialidad');
      const conWhatsapp =
        url.searchParams.get('con_whatsapp') === 'true' ||
        url.searchParams.get('con_whatsapp') === '1';
      const q = (url.searchParams.get('q') || '').trim();
      const rawLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
      const rawOffset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
      const limit = Math.min(100, Math.max(1, Number.isNaN(rawLimit) ? 20 : rawLimit));
      const offset = Math.max(0, Number.isNaN(rawOffset) ? 0 : rawOffset);

      const verifiedPaymentJoin =
        tenantId === 'canaco_merida'
          ? ` LEFT JOIN canaco_payment_intents AS verified_payment
              ON verified_payment.id = (
                SELECT MIN(payment.id)
                FROM canaco_payment_intents AS payment
                WHERE payment.lead_id = lead.id
                  AND payment.tenant_id = lead.tenant_id
                  AND payment.rfc = lead.canonical_rfc
                  AND lead.payment_environment = 'production'
                  AND payment.status = 'paid'
                  AND payment.environment = 'production'
                  AND payment.channel IN ('conekta_card', 'conekta_spei')
                  AND payment.transaction_reference IS NOT NULL
                  AND payment.paid_at IS NOT NULL
                HAVING COUNT(*) = 1
              )`
          : '';
      const verifiedPaymentColumns =
        tenantId === 'canaco_merida'
          ? `, verified_payment.amount_cents AS verified_payment_amount_cents,
               verified_payment.channel AS verified_payment_channel,
               verified_payment.environment AS verified_payment_environment,
               verified_payment.rfc AS verified_payment_rfc,
               verified_payment.folio_siem AS verified_payment_folio_siem,
               verified_payment.razon_social AS verified_payment_razon_social,
               verified_payment.num_empleados AS verified_payment_num_empleados,
               verified_payment.sector AS verified_payment_sector`
          : '';
      let query = `SELECT lead.*${verifiedPaymentColumns}
                   FROM leads_ark_tools AS lead${verifiedPaymentJoin}
                   WHERE lead.tenant_id = ?`;
      const binds: unknown[] = [tenantId];
      if (tenantId === 'canaco_merida' && url.searchParams.get('include_demo') !== 'true') {
        query += ' AND COALESCE(lead.is_demo, 0) = 0';
      }

      if (ciudad) {
        query += ' AND lead.ciudad = ?';
        binds.push(ciudad);
      }
      if (status) {
        query += ' AND lead.status = ?';
        binds.push(status);
      }
      if (especialidad) {
        query += ' AND lead.especialidad = ?';
        binds.push(especialidad);
      }
      if (conWhatsapp) {
        query += " AND lead.whatsapp IS NOT NULL AND TRIM(lead.whatsapp) != ''";
      }
      if (q) {
        query +=
          ' AND (lead.web LIKE ? OR lead.email LIKE ? OR lead.contacto_nombre LIKE ? OR lead.notas LIKE ? OR lead.whatsapp LIKE ?)';
        const wildcard = `%${q}%`;
        binds.push(wildcard, wildcard, wildcard, wildcard, wildcard);
      }
      query += ' ORDER BY lead.created_at DESC, lead.id ASC LIMIT ? OFFSET ?';
      binds.push(limit, offset);

      const stmt = db.prepare(query);
      const { results } = await stmt.bind(...binds).all<Record<string, unknown>>();
      const leads = (results || []).slice(0, limit).map(rowToLead);

      return Response.json(
        {
          success: true,
          ok: true,
          limit,
          offset,
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
      const id = crypto.randomUUID();
      const web = body.web == null ? null : String(body.web).trim() || null;
      const rawWa = body.whatsapp == null ? null : String(body.whatsapp).trim() || null;
      const whatsapp = rawWa ? normalizeMexicanPhone(rawWa) || rawWa : null;
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
        principal.platformRole === 'super_admin' && body.tenant_id != null
          ? String(body.tenant_id).trim() || tenantId
          : tenantId;

      if (
        ['socio activo', 'activo', 'socio_activo'].includes(status.toLowerCase()) ||
        /Pago Confirmado (?:Conekta|Call Center):/i.test(notas || '')
      ) {
        return Response.json(
          {
            error:
              'El estado activo y la evidencia de pago solo se escriben desde el flujo de pago verificado.',
          },
          { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      if (tId === 'canaco_merida') {
        return Response.json(
          {
            error:
              'Captura CANACO requiere Aviso de Privacidad y debe usar la Ventanilla de Afiliación.',
          },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      await db
        .prepare(
          `INSERT INTO leads_ark_tools (id, web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas, tenant_id, origin, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
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

      const requestedStatus = body.status == null ? '' : String(body.status).trim().toLowerCase();
      const requestedNotes = body.notas == null ? '' : String(body.notas).trim();
      if (
        ['socio activo', 'activo', 'socio_activo'].includes(requestedStatus) ||
        /Pago Confirmado (?:Conekta|Call Center):/i.test(requestedNotes)
      ) {
        return Response.json(
          {
            error:
              'El estado activo y la evidencia de pago solo se escriben desde el flujo de pago verificado.',
          },
          { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      if (
        existing.lifecycle_stage === 'socio_activo' &&
        body.status !== undefined &&
        String(body.status) !== String(existing.status)
      ) {
        return Response.json(
          {
            error:
              'Los cambios de estado de un socio activo requieren el flujo de reversión auditada.',
          },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      if (
        existing.lifecycle_stage === 'socio_activo' &&
        body.notas !== undefined &&
        String(body.notas ?? '') !== String(existing.notas ?? '')
      ) {
        return Response.json(
          {
            error: 'Las notas de pago de un socio activo requieren el flujo de reversión auditada.',
          },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const web =
        body.web === undefined
          ? existing.web
          : body.web == null
            ? null
            : String(body.web).trim() || null;
      const rawUpdateWa =
        body.whatsapp === undefined
          ? existing.whatsapp
          : body.whatsapp == null
            ? null
            : String(body.whatsapp).trim() || null;
      const whatsapp =
        typeof rawUpdateWa === 'string' && rawUpdateWa
          ? normalizeMexicanPhone(rawUpdateWa) || rawUpdateWa
          : null;
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
      const existing = await db
        .prepare(
          'SELECT status, lifecycle_stage FROM leads_ark_tools WHERE id = ? AND tenant_id = ? LIMIT 1'
        )
        .bind(id, tenantId)
        .first<{ status: string | null; lifecycle_stage: string | null }>();
      if (
        existing &&
        (existing.lifecycle_stage === 'socio_activo' || existing.status === 'Socio Activo')
      ) {
        return Response.json(
          { error: 'No se puede eliminar un socio activo sin completar la reversión auditada.' },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
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
      if (tenantId === 'canaco_merida') {
        return Response.json(
          {
            error:
              'El envío de propuestas desde el CRM CANACO está deshabilitado; requiere un flujo de comunicación consentido.',
          },
          { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
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

      if (!isEmailServiceConfigured(env)) {
        return Response.json(
          { error: 'Servicio de correo no configurado (falta TELNYX_API_KEY o RESEND_API_KEY).' },
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

      const emailResult = await sendTransactionalEmail(env, {
        from: fromAddress,
        replyTo,
        to: targetEmail,
        subject,
        text,
        html,
      });

      if (!emailResult.success) {
        console.error('[Leads API] Email dispatch error:', emailResult.provider, emailResult.error);
        return Response.json(
          { error: `El servicio de correo rechazó el envío: ${emailResult.error}` },
          { status: 502, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const resendData = { id: emailResult.id };

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

    // LOG WHATSAPP STUDIO ACTIVITY /api/admin/leads/:id/log-whatsapp
    const logWaMatch = path.match(/^\/api\/admin\/leads\/([^/]+)\/log-whatsapp$/);
    if (logWaMatch && request.method === 'POST') {
      const id = logWaMatch[1] ? decodeURIComponent(logWaMatch[1]) : '';
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
      if (tenantId === 'canaco_merida' && lead.lifecycle_stage === 'socio_activo') {
        return Response.json(
          {
            error: 'El estado de un socio activo no puede cambiarse desde el registro de WhatsApp.',
          },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const rawPhone =
        typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : lead.whatsapp;
      const normalizedPhone = normalizeMexicanPhone(rawPhone);

      if (!normalizedPhone) {
        return Response.json(
          { error: 'El prospecto no cuenta con un número de WhatsApp válido.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const tenantProfile =
        typeof body.tenant_profile === 'string' && body.tenant_profile === 'canaco_merida'
          ? 'CANACO Mérida'
          : 'Ark Systems';
      const templateName =
        typeof body.template_name === 'string' && body.template_name.trim()
          ? body.template_name.trim()
          : 'Mensaje directo';
      const messageText =
        typeof body.message === 'string' && body.message.trim() ? body.message.trim() : '';

      const todayIso = new Date().toISOString().slice(0, 10);
      const requestedStatus =
        typeof body.status === 'string' ? body.status.trim().toLowerCase() : '';
      if (
        tenantId === 'canaco_merida' &&
        [
          'prospecto',
          'registrado',
          'pago pendiente',
          'pago_pendiente',
          'pendiente_pago',
          'nuevo / pendiente',
          'nuevo',
          'socio activo',
          'socio_activo',
          'activo',
          'cancelado',
        ].includes(requestedStatus)
      ) {
        return Response.json(
          {
            error:
              'Los estados del ciclo CANACO solo cambian mediante sus transiciones verificadas.',
          },
          { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      const newStatus =
        tenantId === 'canaco_merida'
          ? lead.status
          : typeof body.status === 'string' && body.status.trim()
            ? body.status.trim()
            : lead.status === 'Respondio_2_whats'
              ? 'Respondio_2_whats'
              : 'WhatsApp_enviado';

      const auditEntry = `💬 WhatsApp enviado vía wa.me [${tenantProfile} · ${todayIso}]: ${templateName}`;
      const updatedNotas = lead.notas ? `${lead.notas} | ${auditEntry}` : auditEntry;

      await db
        .prepare(
          `UPDATE leads_ark_tools
           SET status = ?, last_contact = ?, notas = ?, whatsapp = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND tenant_id = ?`
        )
        .bind(newStatus, todayIso, updatedNotas, normalizedPhone, id, tenantId)
        .run();

      const updatedLead = rowToLead({
        ...row,
        whatsapp: normalizedPhone,
        status: newStatus,
        last_contact: todayIso,
        notas: updatedNotas,
      });

      const whatsappUrl = buildWhatsAppDeepLink(normalizedPhone, messageText);

      return Response.json(
        {
          success: true,
          ok: true,
          message: `WhatsApp registrado en expediente (${templateName}).`,
          whatsapp_url: whatsappUrl,
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

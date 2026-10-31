/**
 * CANACO SERVYTUR MÉRIDA — API de Afiliaciones y Persistencia CRM en D1
 *
 * Expone endpoints para el registro de comercios agremiados, captura de leads
 * en la ventanilla digital y actualización a "Socio Activo" en D1.
 */

import type { Env } from '../index';
import { sendCanacoConfirmacionPagoEmail } from './canacoEmailService';
import {
  calcularCuotaAfiliacion,
  determinarEstrato,
  generarFolioSiem,
} from '@/components/canaco/calculoCuota';
import type { SectorEconomico, SocioCanacoRegistro } from '@/components/canaco/types';
import {
  authenticateRequest,
  createSession,
  cookieHeader,
  getTenantMemberships,
  slugify,
  type AuthPrincipal,
} from './auth';

interface AfiliacionPayload {
  razonSocial: string;
  nombreComercial?: string;
  rfc: string;
  sector: SectorEconomico;
  numEmpleados: number;
  municipio?: string;
  calle?: string;
  codigoPostal?: string;
  contactoNombre: string;
  email: string;
  telefono: string;
  metodoPago?: 'tarjeta' | 'spei' | 'clip';
  cfdiRequerido?: boolean;
  estatus?: 'pendiente_pago' | 'activo';
  tenantId?: string;
}

export interface MigrarALedgerPayload {
  folioSiem?: string;
  rfc?: string;
  razonSocial?: string;
  nombreComercial?: string;
  email?: string;
  telefono?: string;
  contactoNombre?: string;
  numEmpleados?: number;
  sector?: SectorEconomico;
  municipio?: string;
  codigoPostal?: string;
}

export async function handleAfiliacionesApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  authPrincipal?: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  const db = env.ARK_TOOLS_DB;

  // ─────────────────────────────────────────────────────────────────
  // CONSULTA PÚBLICA DE SOCIO POR RFC (Landing Page / Cédula)
  // GET /api/afiliaciones/consulta?rfc=XYZ
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/afiliaciones/consulta' && request.method === 'GET') {
    const qRfc = url.searchParams.get('rfc')?.trim().toUpperCase();
    if (!qRfc) {
      return Response.json(
        { error: 'El RFC es requerido para consultar la afiliación.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const row = await db
      .prepare(
        `SELECT id, web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas
         FROM leads_ark_tools
         WHERE tenant_id = 'canaco_merida'
           AND (notas LIKE ? OR web LIKE ?)
         LIMIT 1`
      )
      .bind(`%${qRfc}%`, `%${qRfc}%`)
      .first<{
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
      }>();

    if (!row) {
      return Response.json(
        { encontrado: false, mensaje: 'No se encontró registro para este RFC en el Padrón 2026.' },
        { status: 404, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const folioMatch = row.notas?.match(/Folio SIEM:\s*([^\s|]+)/i);
    const folioSiem = folioMatch ? folioMatch[1] : 'SIEM-MID-2026-OFICIAL';
    const selloMatch = row.notas?.match(/Sello:\s*([^\s|]+)/i);
    const selloSha = selloMatch ? selloMatch[1] : `SHA256:CANACO-MID-${row.id.slice(0, 8)}`;
    const cuotaMatch = row.notas?.match(/Cuota:\s*\$?([\d,]+(\.\d+)?)/i);
    const cuota = cuotaMatch && cuotaMatch[1] ? parseFloat(cuotaMatch[1].replace(/,/g, '')) : 2000;

    const socioRegistro: SocioCanacoRegistro = {
      folioSiem: folioSiem || 'SIEM-MID-2026-OFICIAL',
      razonSocial: row.web || 'Comercio Afiliado de Yucatán',
      nombreComercial: row.web || '',
      rfc: qRfc,
      sector: (row.especialidad as any) || 'comercio',
      estrato: 'micro',
      numEmpleados: 5,
      direccion: {
        calle: 'Domicilio Registrado',
        colonia: 'Centro',
        codigoPostal: '97000',
        municipio: row.ciudad || 'Mérida',
        ciudad: `${row.ciudad || 'Mérida'}, Yucatán`,
      },
      contacto: {
        nombre: row.contacto_nombre || 'Representante Legal',
        email: row.email || 'contacto@comercio.mx',
        telefono: row.whatsapp || '9991234567',
      },
      fechaAfiliacion: row.last_contact || new Date().toISOString().split('T')[0] || '',
      fechaVigencia: '2027-10-27',
      estatus: row.status === 'Socio Activo' ? 'activo' : 'pendiente_pago',
      montoPagado: cuota,
      metodoPago: 'tarjeta',
      cfdiRequerido: true,
      selloDigitalSha256: selloSha || `SHA256:CANACO-MID-${row.id.slice(0, 8)}`,
    };

    return Response.json(
      {
        encontrado: true,
        socio: socioRegistro,
        estatus: row.status,
      },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // HANDOFF SIEM ➔ EXPEDIENTE ÚNICO EN LEDGER
  // POST /api/afiliaciones/migrar-a-ledger
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/afiliaciones/migrar-a-ledger' && request.method === 'POST') {
    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    try {
      const body = (await request.json().catch(() => ({}))) as MigrarALedgerPayload;
      const qRfc = body.rfc?.trim().toUpperCase();
      const qFolio = body.folioSiem?.trim();
      const qEmail = body.email?.trim().toLowerCase();

      if (!qRfc && !qFolio && !body.razonSocial?.trim()) {
        return Response.json(
          { error: 'Se requiere RFC, Folio SIEM o Razón Social para realizar la migración.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      // 1. Buscar el registro canónico en el Padrón Cameral (leads_ark_tools)
      const leadRow = await db
        .prepare(
          `SELECT id, web, whatsapp, email, ciudad, especialidad, status, contacto_nombre, notas
           FROM leads_ark_tools
           WHERE tenant_id = 'canaco_merida'
             AND (
               (? IS NOT NULL AND notas LIKE ?) OR
               (? IS NOT NULL AND (notas LIKE ? OR web LIKE ?)) OR
               (? IS NOT NULL AND email = ?)
             )
           LIMIT 1`
        )
        .bind(
          qFolio || null,
          qFolio ? `%${qFolio}%` : '',
          qRfc || null,
          qRfc ? `%${qRfc}%` : '',
          qRfc ? `%${qRfc}%` : '',
          qEmail || null,
          qEmail || ''
        )
        .first<{
          id: string;
          web: string | null;
          whatsapp: string | null;
          email: string | null;
          ciudad: string | null;
          especialidad: string | null;
          status: string | null;
          contacto_nombre: string | null;
          notas: string | null;
        }>();

      // 2. Extraer metadatos oficiales del socio
      const rfcFromNotas = leadRow?.notas?.match(/RFC:\s*([A-Z0-9]{12,13})/i)?.[1];
      const folioFromNotas = leadRow?.notas?.match(/Folio SIEM:\s*([^\s|]+)/i)?.[1];
      const finalRfc = (qRfc || rfcFromNotas || 'XAXX010101000').toUpperCase();
      const finalNombre = (
        body.razonSocial?.trim() ||
        leadRow?.web ||
        'Comercio Afiliado de Yucatán'
      ).toUpperCase();
      const finalEmail = (body.email?.trim() || leadRow?.email || '').toLowerCase();
      const finalTelefono = body.telefono?.trim() || leadRow?.whatsapp || '';
      const finalContacto = body.contactoNombre?.trim() || leadRow?.contacto_nombre || '';
      const finalFolioSiem = qFolio || folioFromNotas || 'SIEM-MID-2026-OFICIAL';
      const finalSector = body.sector || (leadRow?.especialidad as SectorEconomico) || 'comercio';
      const finalNumEmpleados = Math.max(1, Number(body.numEmpleados) || 5);
      const finalMunicipio = body.municipio?.trim() || leadRow?.ciudad || 'Mérida';
      const tipoCliente: 'empresa' | 'persona_fisica' =
        finalRfc.length === 13 ? 'persona_fisica' : 'empresa';

      // 3. Determinar o auto-aprovisionar usuario y despacho contable (Tenant)
      const principal =
        authPrincipal !== undefined ? authPrincipal : await authenticateRequest(request, env);
      let targetUserId = principal?.id;
      let targetTenantId: string | null = null;
      let sessionCookieHeader: string | null = null;
      const nowSec = Math.floor(Date.now() / 1000);

      const runBatchOrIndividual = async (stmts: Array<{ run: () => Promise<unknown> }>) => {
        if (typeof db.batch === 'function') {
          await db.batch(stmts as any);
        } else {
          for (const stmt of stmts) {
            await stmt.run();
          }
        }
      };

      if (principal) {
        targetUserId = principal.id;
        const memberships = await getTenantMemberships(env, principal.id);
        const requestedTenantId = request.headers.get('x-tenant-id');
        const matched = memberships.find((m) => m.id === requestedTenantId) || memberships[0];

        if (matched) {
          targetTenantId = matched.id;
        } else {
          const tenantName =
            `Despacho ${principal.fullName || principal.email.split('@')[0]}`.slice(0, 120);
          targetTenantId = crypto.randomUUID();
          await runBatchOrIndividual([
            db
              .prepare(
                'INSERT INTO tenants (id, name, slug, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
              )
              .bind(targetTenantId, tenantName, slugify(tenantName)),
            db
              .prepare(
                'INSERT INTO tenant_memberships (user_id, tenant_id, role, created_at) VALUES (?, ?, ?, ?)'
              )
              .bind(principal.id, targetTenantId, 'owner', nowSec),
          ]);
        }
      } else {
        // Socio invitado sin sesión activa: Onboarding frictionless
        const userEmail = (finalEmail || `${finalRfc.toLowerCase()}@socio-canaco.mx`)
          .trim()
          .toLowerCase();
        const existingUser = await db
          .prepare('SELECT id, email, full_name, platform_role FROM users WHERE email = ? LIMIT 1')
          .bind(userEmail)
          .first<{
            id: string;
            email: string;
            full_name: string | null;
            platform_role: 'user' | 'super_admin';
          }>();

        if (existingUser) {
          targetUserId = existingUser.id;
          const memberships = await getTenantMemberships(env, existingUser.id);
          const firstMembership = memberships[0];
          if (firstMembership) {
            targetTenantId = firstMembership.id;
          } else {
            const tenantName =
              `Despacho ${existingUser.full_name || existingUser.email.split('@')[0]}`.slice(
                0,
                120
              );
            targetTenantId = crypto.randomUUID();
            await runBatchOrIndividual([
              db
                .prepare(
                  'INSERT INTO tenants (id, name, slug, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
                )
                .bind(targetTenantId, tenantName, slugify(tenantName)),
              db
                .prepare(
                  'INSERT INTO tenant_memberships (user_id, tenant_id, role, created_at) VALUES (?, ?, ?, ?)'
                )
                .bind(existingUser.id, targetTenantId, 'owner', nowSec),
            ]);
          }
        } else {
          targetUserId = crypto.randomUUID();
          const fullName = finalContacto || finalNombre || 'Socio CANACO';
          const tenantName = `Despacho ${fullName}`.slice(0, 120);
          targetTenantId = crypto.randomUUID();

          await runBatchOrIndividual([
            db
              .prepare(
                `INSERT INTO users (id, email, full_name, platform_role, email_verified_at, created_at, updated_at)
                 VALUES (?, ?, ?, 'user', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
              )
              .bind(targetUserId, userEmail, fullName, nowSec),
            db
              .prepare(
                'INSERT INTO tenants (id, name, slug, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
              )
              .bind(targetTenantId, tenantName, slugify(tenantName)),
            db
              .prepare(
                'INSERT INTO tenant_memberships (user_id, tenant_id, role, created_at) VALUES (?, ?, ?, ?)'
              )
              .bind(targetUserId, targetTenantId, 'owner', nowSec),
          ]);
        }

        const session = await createSession(env, targetUserId);
        sessionCookieHeader = cookieHeader(session.token, env);
      }

      if (!targetTenantId) {
        return Response.json(
          { error: 'No se pudo determinar el despacho contable de destino.' },
          { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      // 4. Inserción o actualización en el catálogo de clientes del Expediente Único
      const metadataObj = {
        origen: 'siem_canaco',
        folio_siem: finalFolioSiem,
        sector: finalSector,
        num_empleados: finalNumEmpleados,
        contacto_nombre: finalContacto,
        email: finalEmail,
        telefono: finalTelefono,
        municipio: finalMunicipio,
        importado_en: new Date().toISOString(),
      };
      const metadataJson = JSON.stringify(metadataObj);

      const existingClient = await db
        .prepare(
          'SELECT id, tenant_id, nombre, rfc, tipo, estado FROM clients WHERE tenant_id = ? AND rfc = ? LIMIT 1'
        )
        .bind(targetTenantId, finalRfc)
        .first<{
          id: string;
          tenant_id: string;
          nombre: string;
          rfc: string;
          tipo: string;
          estado: string;
        }>();

      let clientRecord: any = null;

      if (existingClient) {
        await db
          .prepare(
            `UPDATE clients
             SET nombre = ?, tipo = ?, estado = 'activo', metadata = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND tenant_id = ?`
          )
          .bind(finalNombre, tipoCliente, metadataJson, existingClient.id, targetTenantId)
          .run();

        clientRecord = {
          id: existingClient.id,
          tenant_id: targetTenantId,
          user_id: targetUserId,
          parent_id: null,
          tipo: tipoCliente,
          nombre: finalNombre,
          rfc: finalRfc,
          curp: null,
          nss: null,
          salario_diario: 0,
          salario_diario_integrado: 0,
          fecha_ingreso: null,
          factor_integracion: 1.049315,
          estado: 'activo',
          metadata: metadataObj,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        const clientId = crypto.randomUUID();
        await db
          .prepare(
            `INSERT INTO clients (
               id, tenant_id, user_id, tipo, nombre, rfc, estado, metadata,
               created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, 'activo', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
          .bind(
            clientId,
            targetTenantId,
            targetUserId,
            tipoCliente,
            finalNombre,
            finalRfc,
            metadataJson
          )
          .run();

        clientRecord = {
          id: clientId,
          tenant_id: targetTenantId,
          user_id: targetUserId,
          parent_id: null,
          tipo: tipoCliente,
          nombre: finalNombre,
          rfc: finalRfc,
          curp: null,
          nss: null,
          salario_diario: 0,
          salario_diario_integrado: 0,
          fecha_ingreso: null,
          factor_integracion: 1.049315,
          estado: 'activo',
          metadata: metadataObj,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // 5. Trazabilidad en CRM Padrón Cameral
      if (leadRow?.id) {
        const stamp = `Migrado a LEDGER: ${new Date().toISOString().split('T')[0]}`;
        const notasPrev = leadRow.notas || '';
        if (!notasPrev.includes('Migrado a LEDGER')) {
          const updatedNotas = notasPrev ? `${notasPrev} | ${stamp}` : stamp;
          await db
            .prepare(
              'UPDATE leads_ark_tools SET notas = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            )
            .bind(updatedNotas, leadRow.id)
            .run();
        }
      }

      const respHeaders: Record<string, string> = {
        ...corsHeaders,
        'Cache-Control': 'no-store',
      };
      if (sessionCookieHeader) {
        respHeaders['Set-Cookie'] = sessionCookieHeader;
      }

      return Response.json(
        {
          success: true,
          ok: true,
          clientId: clientRecord.id,
          client: clientRecord,
          tenantId: targetTenantId,
          redirectTo: '/?tool=nomina&welcome=siem',
          message: 'Empresa vinculada exitosamente con el Expediente Único de ARK LEDGER.',
        },
        { status: 200, headers: respHeaders }
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al migrar la empresa a ARK LEDGER.';
      return Response.json(
        { error: message },
        { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  if (path !== '/api/afiliaciones/registro' || request.method !== 'POST') {
    return null;
  }

  if (!db) {
    return Response.json(
      { error: 'Base de datos D1 no disponible.' },
      { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const body = (await request.json()) as AfiliacionPayload;

    if (!body.razonSocial?.trim() || !body.rfc?.trim() || !body.email?.trim()) {
      return Response.json(
        { error: 'Razón social, RFC y correo electrónico son requeridos.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const tenantId = body.tenantId || 'canaco_merida';
    const sector: SectorEconomico = body.sector || 'comercio';
    const numEmpleados = Math.max(1, Number(body.numEmpleados) || 1);
    const estrato = determinarEstrato(numEmpleados);
    const cotizacion = calcularCuotaAfiliacion(numEmpleados, sector);
    const rfcUpper = body.rfc.trim().toUpperCase();
    const razonSocialUpper = body.razonSocial.trim().toUpperCase();
    const nombreComercial = (body.nombreComercial || body.razonSocial).trim();
    const municipio = (body.municipio || 'Mérida').trim();
    const estatus = body.estatus === 'activo' ? 'Socio Activo' : 'Nuevo / Pendiente';
    const folioSiem = generarFolioSiem(rfcUpper, estrato);
    const fechaHoy = new Date().toISOString().split('T')[0] || '';
    const fechaVigencia =
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';

    const selloDigitalSha256 = `SHA256:CANACO-MID-${folioSiem.slice(-8)}-${Date.now().toString(36).toUpperCase()}`;

    const notasDetalle = `RFC: ${rfcUpper} | Folio SIEM: ${folioSiem} | Estrato: ${estrato.toUpperCase()} (${numEmpleados} emp.) | Cuota: $${cotizacion.totalAnual.toLocaleString('es-MX')} MXN | Sector: ${sector} | CFDI: ${body.cfdiRequerido ? 'Requerido' : 'No'} | Sello: ${selloDigitalSha256}`;

    // Verificar si el comercio ya existe registrado en este tenant por su RFC o Email
    const existing = await db
      .prepare(
        'SELECT id, status FROM leads_ark_tools WHERE tenant_id = ? AND (email = ? OR notas LIKE ?) LIMIT 1'
      )
      .bind(tenantId, body.email.trim(), `%${rfcUpper}%`)
      .first<{ id: string; status: string }>();

    let leadId = existing?.id;

    if (existing) {
      // Actualizar registro existente
      await db
        .prepare(
          `UPDATE leads_ark_tools
           SET web = ?, whatsapp = ?, email = ?, ciudad = ?, especialidad = ?, status = ?,
               last_contact = DATE('now'), contacto_nombre = ?, notas = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND tenant_id = ?`
        )
        .bind(
          nombreComercial,
          body.telefono.trim(),
          body.email.trim(),
          municipio,
          sector,
          estatus,
          body.contactoNombre.trim(),
          notasDetalle,
          existing.id,
          tenantId
        )
        .run();
    } else {
      // Insertar nuevo comercio en el CRM
      leadId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO leads_ark_tools (
             id, web, whatsapp, email, ciudad, especialidad, status,
             last_contact, contacto_nombre, notas, tenant_id, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'), ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(
          leadId,
          nombreComercial,
          body.telefono.trim(),
          body.email.trim(),
          municipio,
          sector,
          estatus,
          body.contactoNombre.trim(),
          notasDetalle,
          tenantId
        )
        .run();
    }

    const socioRegistro: SocioCanacoRegistro = {
      folioSiem,
      razonSocial: razonSocialUpper,
      nombreComercial,
      rfc: rfcUpper,
      sector,
      estrato,
      numEmpleados,
      direccion: {
        calle: (body.calle || 'Domicilio Fiscal').trim(),
        colonia: 'Centro',
        codigoPostal: body.codigoPostal || '97000',
        municipio,
        ciudad: `${municipio}, Yucatán`,
      },
      contacto: {
        nombre: body.contactoNombre.trim(),
        email: body.email.trim(),
        telefono: body.telefono.trim(),
      },
      fechaAfiliacion: fechaHoy,
      fechaVigencia,
      estatus: body.estatus === 'activo' ? 'activo' : 'pendiente_pago',
      montoPagado: cotizacion.totalAnual,
      metodoPago: body.metodoPago || 'tarjeta',
      cfdiRequerido: !!body.cfdiRequerido,
      selloDigitalSha256,
    };

    // Disparar correo oficial de confirmación vía Resend si el pago quedó activo
    let emailEnviado = false;
    let emailId: string | undefined;

    if (body.estatus === 'activo' && body.email && body.email.includes('@')) {
      const emailRes = await sendCanacoConfirmacionPagoEmail(env, {
        email: body.email.trim(),
        contactoNombre: body.contactoNombre?.trim(),
        razonSocial: razonSocialUpper,
        rfc: rfcUpper,
        folioSiem,
        folioPago: `VENTANILLA-${Date.now().toString(36).toUpperCase()}`,
        monto: cotizacion.totalAnual,
        selloDigitalSha256,
        metodo: body.metodoPago || 'tarjeta',
      }).catch((err: any) => {
        console.warn('[Afiliaciones API] Error no bloqueante al enviar correo Resend:', err);
        return { success: false, error: err.message, id: undefined };
      });

      emailEnviado = emailRes.success;
      emailId = emailRes.id;
    }

    return Response.json(
      {
        success: true,
        ok: true,
        leadId,
        socio: socioRegistro,
        cotizacion,
        emailEnviado,
        emailId,
      },
      { status: 201, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al registrar afiliación en CRM.';
    return Response.json(
      { error: message },
      { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }
}

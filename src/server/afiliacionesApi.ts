/**
 * CANACO SERVYTUR MÉRIDA — API de Afiliaciones y Persistencia CRM en D1
 *
 * Expone endpoints para el registro de comercios agremiados, captura de leads
 * en la ventanilla digital y actualización a "Socio Activo" en D1.
 */

import type { Env } from '../index';
import { COMPLIANCE_LAST_UPDATED } from '@/data/compliance-legal';
import {
  calcularCuotaAfiliacion,
  determinarEstrato,
  extraerNumEmpleados,
  generarFolioIntegridad,
  generarFolioSiem,
  tienePagoConfirmado,
} from '@/components/canaco/calculoCuota';
import type { SectorEconomico, SocioCanacoRegistro } from '@/components/canaco/types';
import { canonicalizarRfc } from './canacoLifecycle';
import {
  authenticateRequest,
  createSession,
  cookieHeader,
  getTenantMemberships,
  rateLimit,
  slugify,
  type AuthPrincipal,
} from './auth';

function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return 'contacto@comercio.mx';
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'contacto@comercio.mx';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '******4567';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '******';
  return `******${digits.slice(-4)}`;
}

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
  tenantId?: string;
  registroPatronalImss?: string;
  registroEstatalAafy?: string;
  afiliacionSimultanea?: boolean;
  tramiteImssSolicitado?: boolean;
  leadId?: string;
  consentimiento?: {
    aceptado?: boolean;
    avisoVersion?: string;
    fecha?: string;
    medio?: 'ventanilla' | 'admin' | 'import';
  };
  consentimientoArkangel?: boolean;
  isDemo?: boolean;
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
  registroPatronalImss?: string;
  registroEstatalAafy?: string;
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

    // Evitar enumeración con prefijos cortos (ej. ?rfc=A)
    if (qRfc.length < 12 || qRfc.length > 13 || !/^[A-Z&Ñ0-9]+$/.test(qRfc)) {
      return Response.json(
        { encontrado: false, mensaje: 'No se encontró registro para este RFC en el Padrón 2026.' },
        { status: 404, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const row = await db
      .prepare(
        `SELECT id, web, whatsapp, email, ciudad, especialidad, status, lifecycle_stage,
                last_contact, contacto_nombre, notas
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
        lifecycle_stage: string | null;
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
    const folioSiem = folioMatch?.[1] || '';
    const razonSocialFromNotas = row.notas?.match(/Razón Social:\s*([^|]+)/i)?.[1]?.trim();
    const folioIntegridadMatch = row.notas?.match(/Folio de Integridad:\s*([^\s|]+)/i);
    const folioIntegridad =
      folioIntegridadMatch?.[1] || (folioSiem ? generarFolioIntegridad(folioSiem) : '');
    const cuotaMatch = row.notas?.match(/Cuota:\s*\$?([\d,]+(\.\d+)?)/i);
    const cuota = cuotaMatch && cuotaMatch[1] ? parseFloat(cuotaMatch[1].replace(/,/g, '')) : 0;
    const pagoMatch = row.notas?.match(/Pago Confirmado [^(]+\(\$([\d,]+(?:\.\d+)?)\s*MXN\)/i);
    const montoConfirmado = pagoMatch?.[1] ? parseFloat(pagoMatch[1].replace(/,/g, '')) : 0;
    const nrpMatch = row.notas?.match(/NRP:\s*([A-Z0-9]{10,11})/i);
    const aafyMatch = row.notas?.match(/AAFY:\s*([^\s|]+)/i);
    const simultaneaFlag = /Afiliaci[oó]n Simult[aá]nea/i.test(row.notas || '');
    const tramiteImssFlag = /Tr[aá]mite IMSS Solicitado/i.test(row.notas || '');

    const numEmpleados = extraerNumEmpleados(row.notas);
    const sector = row.especialidad as SectorEconomico;
    const cuotaEsperada =
      numEmpleados > 0 && ['comercio', 'servicios', 'turismo'].includes(sector)
        ? calcularCuotaAfiliacion(numEmpleados, sector).totalAnual
        : 0;
    const pagoConfirmado =
      row.lifecycle_stage === 'socio_activo' &&
      row.status === 'Socio Activo' &&
      tienePagoConfirmado(row.notas) &&
      cuota > 0 &&
      Math.round(cuota * 100) === Math.round(cuotaEsperada * 100) &&
      Math.round(montoConfirmado * 100) === Math.round(cuotaEsperada * 100);
    const socioRegistro: SocioCanacoRegistro = {
      folioSiem,
      razonSocial: razonSocialFromNotas || row.web || 'Comercio Afiliado de Yucatán',
      nombreComercial: row.web || '',
      rfc: qRfc,
      sector: ['comercio', 'servicios', 'turismo'].includes(sector) ? sector : 'comercio',
      estrato: numEmpleados ? determinarEstrato(numEmpleados) : 'micro',
      numEmpleados,
      direccion: {
        calle: 'Domicilio Registrado',
        colonia: 'Centro',
        codigoPostal: '97000',
        municipio: row.ciudad || 'Mérida',
        ciudad: `${row.ciudad || 'Mérida'}, Yucatán`,
      },
      contacto: {
        nombre: row.contacto_nombre || 'Representante Legal',
        email: authPrincipal ? row.email || 'contacto@comercio.mx' : maskEmail(row.email),
        telefono: authPrincipal ? row.whatsapp || '9991234567' : maskPhone(row.whatsapp),
      },
      fechaAfiliacion: row.last_contact || new Date().toISOString().split('T')[0] || '',
      fechaVigencia: '',
      estatus: pagoConfirmado ? 'activo' : 'pendiente_pago',
      pagoConfirmado,
      montoPagado: pagoConfirmado ? montoConfirmado : 0,
      metodoPago: /Pago Confirmado Call Center:/i.test(row.notas || '') ? 'spei' : 'tarjeta',
      cfdiRequerido: true,
      folioIntegridad,
      registroPatronalImss: nrpMatch ? nrpMatch[1] : undefined,
      registroEstatalAafy: aafyMatch ? aafyMatch[1] : undefined,
      afiliacionSimultanea: simultaneaFlag,
      tramiteImssSolicitado: tramiteImssFlag,
    };

    return Response.json(
      {
        encontrado: true,
        socio: socioRegistro,
        estatus: pagoConfirmado ? 'Socio Activo' : 'Nuevo / Pendiente',
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
          `SELECT id, web, whatsapp, email, ciudad, especialidad, status, lifecycle_stage,
                  contacto_nombre, notas
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
          lifecycle_stage: string | null;
          contacto_nombre: string | null;
          notas: string | null;
        }>();

      if (
        !leadRow ||
        leadRow.lifecycle_stage !== 'socio_activo' ||
        leadRow.status !== 'Socio Activo' ||
        !tienePagoConfirmado(leadRow.notas)
      ) {
        return Response.json(
          {
            error:
              'El registro sigue pendiente de confirmación de pago. La empresa se podrá importar cuando exista un pago confirmado.',
          },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      // 2. Derivar los datos de importación del registro pagado en D1.
      const rfcFromNotas = leadRow?.notas?.match(/RFC:\s*([A-Z0-9]{12,13})/i)?.[1];
      const folioFromNotas = leadRow?.notas?.match(/Folio SIEM:\s*([^\s|]+)/i)?.[1];
      const razonSocialFromNotas = leadRow?.notas?.match(/Razón Social:\s*([^|]+)/i)?.[1]?.trim();
      const numEmpleadosFromNotas = extraerNumEmpleados(leadRow?.notas);
      const nrpFromNotas = leadRow?.notas?.match(/NRP:\s*([A-Z0-9]{10,11})/i)?.[1];
      const aafyFromNotas = leadRow?.notas?.match(/AAFY:\s*([^\s|]+)/i)?.[1];
      const cuotaRegistrada = Number(
        leadRow?.notas?.match(/Cuota:\s*\$?([\d,]+(?:\.\d+)?)/i)?.[1]?.replace(/,/g, '') || 0
      );
      const pagoRegistrado = Number(
        leadRow?.notas
          ?.match(/Pago Confirmado [^(]+\(\$([\d,]+(?:\.\d+)?)\s*MXN\)/i)?.[1]
          ?.replace(/,/g, '') || 0
      );
      const cuotaEsperada =
        numEmpleadosFromNotas > 0 &&
        ['comercio', 'servicios', 'turismo'].includes(leadRow?.especialidad || '')
          ? calcularCuotaAfiliacion(numEmpleadosFromNotas, leadRow?.especialidad as SectorEconomico)
              .totalAnual
          : 0;
      const finalEmailStored = leadRow?.email?.trim().toLowerCase() || '';
      const finalTelefonoStored = leadRow?.whatsapp?.trim() || '';
      const finalContactoStored = leadRow?.contacto_nombre?.trim() || '';
      const finalNombreStored = (razonSocialFromNotas || leadRow?.web || '').trim();
      const mismatch =
        (qRfc && qRfc !== rfcFromNotas?.toUpperCase()) ||
        (qFolio && qFolio !== folioFromNotas) ||
        (body.razonSocial &&
          body.razonSocial.trim().toUpperCase() !== finalNombreStored.toUpperCase()) ||
        (qEmail && qEmail !== finalEmailStored) ||
        (body.telefono && body.telefono.trim() !== finalTelefonoStored) ||
        (body.contactoNombre && body.contactoNombre.trim() !== finalContactoStored) ||
        (body.numEmpleados !== undefined && Number(body.numEmpleados) !== numEmpleadosFromNotas) ||
        (body.sector && body.sector !== leadRow?.especialidad) ||
        (body.registroPatronalImss &&
          body.registroPatronalImss.trim().toUpperCase() !== nrpFromNotas?.toUpperCase()) ||
        (body.registroEstatalAafy &&
          body.registroEstatalAafy.trim().toUpperCase() !== aafyFromNotas?.toUpperCase()) ||
        (body.municipio &&
          body.municipio.trim().toLowerCase() !== leadRow?.ciudad?.trim().toLowerCase());
      if (
        mismatch ||
        !rfcFromNotas ||
        !folioFromNotas ||
        !finalNombreStored ||
        !finalEmailStored ||
        !numEmpleadosFromNotas ||
        cuotaEsperada <= 0 ||
        Math.round(cuotaRegistrada * 100) !== Math.round(cuotaEsperada * 100) ||
        Math.round(pagoRegistrado * 100) !== Math.round(cuotaEsperada * 100)
      ) {
        return Response.json(
          { error: 'Los datos enviados no coinciden con el registro confirmado en el padrón.' },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const finalRfc = (qRfc || rfcFromNotas || 'XAXX010101000').toUpperCase();
      const finalNombre = finalNombreStored.toUpperCase();
      const finalEmail = finalEmailStored;
      const finalTelefono = finalTelefonoStored;
      const finalContacto = finalContactoStored;
      const finalFolioSiem = qFolio || folioFromNotas || 'SIEM-MID-2026-OFICIAL';
      const finalSector = (leadRow?.especialidad as SectorEconomico) || 'comercio';
      const finalNumEmpleados = numEmpleadosFromNotas;
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
          // Seguridad C-01: Nunca emitir una sesión sin contraseña para un usuario que ya existe
          return Response.json(
            {
              error:
                'Ya existe una cuenta registrada con este correo en ARK LEDGER. Inicia sesión primero para vincular esta empresa a tu despacho.',
              requiresLogin: true,
            },
            { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
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
        registro_patronal_imss: nrpFromNotas || null,
        registro_estatal_aafy: aafyFromNotas || null,
        afiliacion_simultanea: /Afiliaci[oó]n Simult[aá]nea/i.test(leadRow?.notas || ''),
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

  if (path === '/api/afiliaciones/arco' && request.method === 'POST') {
    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    try {
      const body = (await request.json()) as {
        rfc?: string;
        requesterEmail?: string;
        rightRequested?: string;
      };
      const rfc = body.rfc ? canonicalizarRfc(body.rfc) : null;
      const requesterEmail = body.requesterEmail?.trim().toLowerCase() || '';
      const rightRequested = body.rightRequested;
      if (
        !rfc ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail) ||
        !['acceso', 'rectificacion', 'cancelacion', 'oposicion'].includes(rightRequested || '')
      ) {
        return Response.json(
          { error: 'RFC, correo de contacto y derecho ARCO válido son requeridos.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const lead = await db
        .prepare(
          `SELECT id FROM leads_ark_tools
           WHERE tenant_id = 'canaco_merida' AND canonical_rfc = ?
             AND LOWER(TRIM(email)) = ? LIMIT 1`
        )
        .bind(rfc, requesterEmail)
        .first<{ id: string }>();
      const requestId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO canaco_arco_requests
           (id, lead_id, requester_email, right_requested, status)
           VALUES (?, ?, ?, ?, 'received')`
        )
        .bind(requestId, lead?.id || null, requesterEmail, rightRequested)
        .run();

      return Response.json(
        {
          ok: true,
          requestId,
          status: 'received',
          message:
            'Solicitud recibida; la identidad y el alcance deben verificarse antes de actuar.',
        },
        { status: 202, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar la solicitud ARCO.';
      return Response.json(
        { error: message },
        { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  if (path === '/api/afiliaciones/arco' && request.method === 'GET') {
    const canManageArco =
      authPrincipal?.platformRole === 'super_admin' ||
      authPrincipal?.email.toLowerCase() === 'horus.i2d@gmail.com';
    if (!canManageArco) {
      return Response.json(
        { error: 'Autorización requerida para consultar solicitudes ARCO.' },
        { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    const requests = await db
      .prepare(
        `SELECT id, lead_id, requester_email, right_requested, status, requested_at,
                verified_by, verified_at, completed_by, completed_at, completion_notes
         FROM canaco_arco_requests WHERE tenant_id = 'canaco_merida'
         ORDER BY requested_at DESC LIMIT 100`
      )
      .all();
    return Response.json(
      { ok: true, requests: requests.results || [] },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const arcoDetailMatch = path.match(/^\/api\/afiliaciones\/arco\/([^/]+)$/);
  if (arcoDetailMatch && request.method === 'PATCH') {
    const canManageArco =
      authPrincipal?.platformRole === 'super_admin' ||
      authPrincipal?.email.toLowerCase() === 'horus.i2d@gmail.com';
    if (!canManageArco) {
      return Response.json(
        { error: 'Autorización requerida para gestionar solicitudes ARCO.' },
        { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    const requestId = decodeURIComponent(arcoDetailMatch[1] || '');
    const body = (await request.json()) as { status?: string; completionNotes?: string };
    if (
      !requestId ||
      !['identity_verified', 'in_progress', 'completed', 'rejected'].includes(body.status || '') ||
      (body.status === 'completed' && !body.completionNotes?.trim())
    ) {
      return Response.json(
        { error: 'Estado ARCO o nota de resolución no válida.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    const now = new Date().toISOString();
    const update = await db
      .prepare(
        `UPDATE canaco_arco_requests
         SET status = ?,
             verified_by = CASE WHEN ? = 'identity_verified' THEN ? ELSE verified_by END,
             verified_at = CASE WHEN ? = 'identity_verified' THEN ? ELSE verified_at END,
             completed_by = CASE WHEN ? IN ('completed', 'rejected') THEN ? ELSE completed_by END,
             completed_at = CASE WHEN ? IN ('completed', 'rejected') THEN ? ELSE completed_at END,
             completion_notes = CASE WHEN ? IN ('completed', 'rejected') THEN ? ELSE completion_notes END
         WHERE id = ? AND tenant_id = 'canaco_merida'
           AND (
             (? = 'identity_verified' AND status = 'received') OR
             (? = 'in_progress' AND status = 'identity_verified') OR
             (? IN ('completed', 'rejected') AND status IN ('identity_verified', 'in_progress'))
           )`
      )
      .bind(
        body.status,
        body.status,
        authPrincipal?.email || '',
        body.status,
        now,
        body.status,
        authPrincipal?.email || '',
        body.status,
        now,
        body.status,
        body.completionNotes?.trim() || null,
        body.status,
        body.status,
        body.status,
        requestId
      )
      .run();
    if (update.meta.changes !== 1) {
      return Response.json(
        { error: 'La solicitud no existe o ya fue cerrada.' },
        { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    return Response.json(
      { ok: true, requestId, status: body.status },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  if (path === '/api/afiliaciones/reversar' && request.method === 'POST') {
    const canReverse =
      authPrincipal?.platformRole === 'super_admin' ||
      authPrincipal?.email.toLowerCase() === 'horus.i2d@gmail.com';
    if (!canReverse) {
      return Response.json(
        { error: 'Autorización requerida para revertir una afiliación.' },
        { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    const body = (await request.json()) as { leadId?: string; reason?: string };
    const leadId = body.leadId?.trim() || '';
    const reason = body.reason?.trim() || '';
    if (!leadId || reason.length < 10 || reason.length > 500) {
      return Response.json(
        { error: 'Se requiere registro y motivo de reversión (10 a 500 caracteres).' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    const transition = db
      .prepare(
        `UPDATE leads_ark_tools
         SET lifecycle_stage = 'cancelado', status = 'Cancelado', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND tenant_id = 'canaco_merida' AND lifecycle_stage = 'socio_activo'`
      )
      .bind(leadId);
    const audit = db
      .prepare(
        `INSERT INTO canaco_lifecycle_audit
         (id, lead_id, actor_id, actor_email, from_stage, to_stage, reason, payment_outcome)
         SELECT ?, ?, ?, ?, 'socio_activo', 'cancelado', ?, 'refund_required'
         WHERE EXISTS (
           SELECT 1 FROM leads_ark_tools
           WHERE id = ? AND tenant_id = 'canaco_merida' AND lifecycle_stage = 'cancelado'
         )`
      )
      .bind(
        crypto.randomUUID(),
        leadId,
        authPrincipal?.id || null,
        authPrincipal?.email || null,
        reason,
        leadId
      );
    const results = await db.batch([transition, audit]);
    if (results[0]?.meta.changes !== 1) {
      return Response.json(
        { error: 'El registro no existe o no está activo.' },
        { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    return Response.json(
      {
        ok: true,
        lifecycleStage: 'cancelado',
        refundRequired: true,
        refundProcessed: false,
        message:
          'La membresía se revirtió en Ledger; el reembolso debe gestionarse por separado con el procesador.',
      },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  const isCaptureRequest = path === '/api/afiliaciones/captura' && request.method === 'POST';
  const isRegistrationRequest = path === '/api/afiliaciones/registro' && request.method === 'POST';
  if (!isCaptureRequest && !isRegistrationRequest) {
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

    if (isRegistrationRequest) {
      if (!body.leadId?.trim()) {
        return Response.json(
          { error: 'El identificador del prospecto es requerido para validar el registro.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      const leadId = body.leadId.trim();
      const lead = await db
        .prepare(
          `SELECT lifecycle_stage, status FROM leads_ark_tools
           WHERE id = ? AND tenant_id = 'canaco_merida' LIMIT 1`
        )
        .bind(leadId)
        .first<{ lifecycle_stage: string; status: string }>();
      if (!lead || !['prospecto', 'registrado', 'pago_pendiente'].includes(lead.lifecycle_stage)) {
        return Response.json(
          { error: 'No se encontró un prospecto válido para registrar.' },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
      if (lead.lifecycle_stage === 'prospecto') {
        const transition = await db
          .prepare(
            `UPDATE leads_ark_tools
             SET lifecycle_stage = 'registrado', status = 'Registrado', updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND tenant_id = 'canaco_merida' AND lifecycle_stage = 'prospecto'`
          )
          .bind(leadId)
          .run();
        if (transition.meta.changes !== 1) {
          return Response.json(
            { error: 'El prospecto cambió antes de validar el registro.' },
            { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
        }
        await db
          .prepare(
            `INSERT INTO canaco_lifecycle_audit
             (id, lead_id, actor_id, actor_email, from_stage, to_stage, reason)
             VALUES (?, ?, ?, ?, 'prospecto', 'registrado', 'Validated Ventanilla registration')`
          )
          .bind(
            crypto.randomUUID(),
            leadId,
            authPrincipal?.id || null,
            authPrincipal?.email || null
          )
          .run();
      }
      return Response.json(
        { success: true, ok: true, leadId, lifecycleStage: lead.lifecycle_stage },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    if (
      !body.razonSocial?.trim() ||
      !body.rfc?.trim() ||
      !body.email?.trim() ||
      !body.contactoNombre?.trim() ||
      !body.telefono?.trim()
    ) {
      return Response.json(
        { error: 'Razón social, RFC, contacto, correo y teléfono son requeridos.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const consentimiento = body.consentimiento;
    const fechaConsentimiento = consentimiento?.fecha ? Date.parse(consentimiento.fecha) : NaN;
    if (
      consentimiento?.aceptado !== true ||
      consentimiento.avisoVersion !== COMPLIANCE_LAST_UPDATED ||
      !Number.isFinite(fechaConsentimiento) ||
      fechaConsentimiento > Date.now() + 60_000 ||
      !['ventanilla', 'admin', 'import'].includes(consentimiento.medio || '')
    ) {
      return Response.json(
        { error: 'Se requiere una aceptación válida y vigente del Aviso de Privacidad.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (consentimiento.medio !== 'ventanilla' && !authPrincipal) {
      return Response.json(
        { error: 'La captura administrativa o de importación requiere una sesión autorizada.' },
        { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const rfcCanonical = canonicalizarRfc(body.rfc);
    if (!rfcCanonical) {
      return Response.json(
        { error: 'El RFC no tiene un formato válido.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (await rateLimit(env, 'afiliacion:registro', ip, 20, 3600)) {
      return Response.json(
        { error: 'Demasiadas solicitudes de registro. Intenta más tarde.' },
        { status: 429, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const sectorInput = body.sector || 'comercio';
    if (!['comercio', 'servicios', 'turismo'].includes(sectorInput)) {
      return Response.json(
        { error: 'El sector seleccionado no es válido.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    const sector: SectorEconomico = sectorInput;
    const numEmpleados = Number(body.numEmpleados);
    if (!Number.isInteger(numEmpleados) || numEmpleados < 1 || numEmpleados > 5000) {
      return Response.json(
        { error: 'El número de empleados debe ser un entero entre 1 y 5,000.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    const estrato = determinarEstrato(numEmpleados);
    const cotizacion = calcularCuotaAfiliacion(numEmpleados, sector);
    const razonSocialUpper = body.razonSocial.trim().toUpperCase();
    const nombreComercial = (body.nombreComercial || body.razonSocial).trim();
    const municipio = (body.municipio || 'Mérida').trim();
    const origin = consentimiento.medio;
    const isDemo = body.isDemo === true && body.email.trim().toLowerCase().endsWith('.invalid');
    const fechaHoy = new Date().toISOString().split('T')[0] || '';
    const fechaVigencia =
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '';

    const folioSiem = generarFolioSiem(rfcCanonical, estrato);
    const folioIntegridad = generarFolioIntegridad(folioSiem);
    const extraSimultanea = [
      body.afiliacionSimultanea ? 'Afiliación Simultánea AAFY-SAT-IMSS' : '',
      body.registroPatronalImss ? `NRP: ${body.registroPatronalImss.trim().toUpperCase()}` : '',
      body.tramiteImssSolicitado ? 'Trámite IMSS Solicitado' : '',
      body.registroEstatalAafy ? `AAFY: ${body.registroEstatalAafy.trim().toUpperCase()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
    const notasDetalle = `Razón Social: ${razonSocialUpper} | RFC: ${rfcCanonical} | Folio SIEM: ${folioSiem} | Estrato: ${estrato.toUpperCase()} (${numEmpleados} emp.) | Empleados: ${numEmpleados} | Cuota: $${cotizacion.totalAnual.toLocaleString('es-MX')} MXN | Sector: ${sector} | CFDI: ${body.cfdiRequerido ? 'Requerido' : 'No'}${extraSimultanea ? ` | ${extraSimultanea}` : ''} | Folio de Integridad: ${folioIntegridad}`;
    const tenantId = 'canaco_merida';

    const matches = await db
      .prepare(
        `SELECT id, status, lifecycle_stage, canonical_rfc
         FROM leads_ark_tools
         WHERE tenant_id = ? AND (canonical_rfc = ? OR (canonical_rfc IS NULL AND notas LIKE ?))
         ORDER BY created_at ASC, id ASC LIMIT 2`
      )
      .bind(tenantId, rfcCanonical, `%RFC: ${rfcCanonical}%`)
      .all<{
        id: string;
        status: string;
        lifecycle_stage: string;
        canonical_rfc: string | null;
      }>();

    if ((matches.results || []).length > 1) {
      return Response.json(
        {
          error:
            'Hay registros heredados duplicados para este RFC; requiere conciliación administrativa.',
        },
        { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const existing = matches.results?.[0];
    if (existing?.lifecycle_stage === 'socio_activo' || existing?.status === 'Socio Activo') {
      return Response.json(
        {
          error:
            'Este RFC ya pertenece a un socio activo. Contacta a CANACO para actualizar sus datos.',
        },
        { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
    if (existing?.lifecycle_stage === 'pago_pendiente') {
      return Response.json(
        {
          error:
            'El registro ya tiene una cotización pendiente; no se pueden cambiar sus datos durante el pago.',
        },
        { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const leadId = existing?.id || crypto.randomUUID();
    const consentTimestamp = new Date().toISOString();
    if (existing) {
      await db
        .prepare(
          `UPDATE leads_ark_tools
           SET canonical_rfc = ?, web = ?, whatsapp = ?, email = ?, ciudad = ?, especialidad = ?,
               lifecycle_stage = CASE WHEN lifecycle_stage = 'prospecto' THEN lifecycle_stage ELSE lifecycle_stage END,
               status = CASE lifecycle_stage WHEN 'prospecto' THEN 'Prospecto' WHEN 'registrado' THEN 'Registrado' WHEN 'pago_pendiente' THEN 'Pago Pendiente' ELSE status END,
               last_contact = DATE('now'), contacto_nombre = ?, notas = ?,
               consent_aviso_version = ?, consent_accepted_at = ?, consent_medium = ?,
               arkangel_share_consent = ?, origin = CASE WHEN origin = 'legacy' THEN ? ELSE origin END,
               is_demo = MAX(is_demo, ?), updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND tenant_id = ?`
        )
        .bind(
          rfcCanonical,
          nombreComercial,
          body.telefono.trim(),
          body.email.trim(),
          municipio,
          sector,
          body.contactoNombre.trim(),
          notasDetalle,
          consentimiento.avisoVersion,
          consentTimestamp,
          origin,
          body.consentimientoArkangel === true ? 1 : 0,
          origin,
          isDemo ? 1 : 0,
          leadId,
          tenantId
        )
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO leads_ark_tools (
             id, web, whatsapp, email, ciudad, especialidad, status, lifecycle_stage,
             last_contact, contacto_nombre, notas, tenant_id, canonical_rfc,
             consent_aviso_version, consent_accepted_at, consent_medium,
             arkangel_share_consent, origin, is_demo, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, 'Prospecto', 'prospecto', DATE('now'), ?, ?, ?,
                     ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(
          leadId,
          nombreComercial,
          body.telefono.trim(),
          body.email.trim(),
          municipio,
          sector,
          body.contactoNombre.trim(),
          notasDetalle,
          tenantId,
          rfcCanonical,
          consentimiento.avisoVersion,
          consentTimestamp,
          origin,
          body.consentimientoArkangel === true ? 1 : 0,
          origin,
          isDemo ? 1 : 0
        )
        .run();
      await db
        .prepare(
          `INSERT INTO canaco_lifecycle_audit
           (id, lead_id, actor_id, actor_email, from_stage, to_stage, reason)
           VALUES (?, ?, ?, ?, NULL, 'prospecto', 'Consented CANACO lead capture')`
        )
        .bind(crypto.randomUUID(), leadId, authPrincipal?.id || null, authPrincipal?.email || null)
        .run();
    }

    const socioRegistro: SocioCanacoRegistro = {
      folioSiem,
      razonSocial: razonSocialUpper,
      nombreComercial,
      rfc: rfcCanonical,
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
      estatus: 'pendiente_pago',
      pagoConfirmado: false,
      montoPagado: 0,
      metodoPago: body.metodoPago || 'tarjeta',
      cfdiRequerido: !!body.cfdiRequerido,
      folioIntegridad,
      registroPatronalImss: body.registroPatronalImss
        ? body.registroPatronalImss.trim().toUpperCase()
        : undefined,
      registroEstatalAafy: body.registroEstatalAafy
        ? body.registroEstatalAafy.trim().toUpperCase()
        : undefined,
      afiliacionSimultanea: !!body.afiliacionSimultanea,
      tramiteImssSolicitado: !!body.tramiteImssSolicitado,
    };

    return Response.json(
      {
        success: true,
        ok: true,
        leadId,
        lifecycleStage: existing?.lifecycle_stage || 'prospecto',
        socio: socioRegistro,
        cotizacion,
        emailEnviado: false,
      },
      { status: existing ? 200 : 201, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al registrar afiliación en CRM.';
    return Response.json(
      { error: message },
      { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }
}

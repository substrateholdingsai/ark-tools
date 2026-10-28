/**
 * CANACO SERVYTUR MÉRIDA — API de Afiliaciones y Persistencia CRM en D1
 *
 * Expone endpoints para el registro de comercios agremiados, captura de leads
 * en la ventanilla digital y actualización a "Socio Activo" en D1.
 */

import type { Env } from '../index';
import {
  calcularCuotaAfiliacion,
  determinarEstrato,
  generarFolioSiem,
} from '@/components/canaco/calculoCuota';
import type { SectorEconomico, SocioCanacoRegistro } from '@/components/canaco/types';

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

export async function handleAfiliacionesApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path !== '/api/afiliaciones/registro' || request.method !== 'POST') {
    return null;
  }

  const db = env.ARK_TOOLS_DB;
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

    const notasDetalle = `Folio SIEM: ${folioSiem} | Estrato: ${estrato.toUpperCase()} (${numEmpleados} emp.) | Cuota: $${cotizacion.totalAnual.toLocaleString('es-MX')} MXN | Sector: ${sector} | CFDI: ${body.cfdiRequerido ? 'Requerido' : 'No'} | Sello: ${selloDigitalSha256}`;

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

    return Response.json(
      {
        success: true,
        ok: true,
        leadId,
        socio: socioRegistro,
        cotizacion,
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

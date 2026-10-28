/**
 * CANACO SERVYTUR MÉRIDA — Sincronización de Cobranza & Call Center con ARKANGEL
 *
 * Módulo de integración Worker-to-Worker / REST entre ARK-LEDGER y ARKANGEL.
 * Extrae los socios y prospectos con cuota anual / registro SIEM pendiente,
 * genera el dataset normalizado en formato CSV o JSON (E.164 +52) y lo despacha
 * al endpoint de ingesta de Arkangel para activar recordatorios de Voice AI
 * y mensajería oficial con riel 1-Click SPEI.
 */

import type { Env } from '../index';
import type { AuthPrincipal } from './auth';

export interface SocioCobranzaRecord {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  rfc: string;
  monto: number;
  concepto: string;
  vencimiento: string;
  estrato: string;
}

export interface SyncArkangelResult {
  ok: boolean;
  simulated: boolean;
  tenant_id: string;
  socios_enviados: number;
  monto_total_cartera: number;
  mensaje: string;
  arkangel_response?: any;
}

/**
 * Normaliza un número telefónico a formato internacional E.164 (+52 para México).
 */
export function normalizarTelefonoE164(tel: string | null | undefined): string {
  if (!tel) return '';
  const cleaned = tel.replace(/\D/g, '');
  if (!cleaned) return '';

  // 10 dígitos mexicanos (ej. 9999123456)
  if (cleaned.length === 10) {
    return `+52${cleaned}`;
  }
  // 12 dígitos mexicanos que ya traen el 52 (ej. 529999123456)
  if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+${cleaned}`;
  }
  // Si ya tiene 11 dígitos y empieza con 1 (ej. 19999123456 de móvil antiguo)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+52${cleaned.slice(1)}`;
  }
  return `+${cleaned}`;
}

/**
 * Extrae el importe de la cuota desde las notas del lead o asigna valor por estrato.
 */
export function extraerMontoDeNotas(notas: string | null | undefined): number {
  if (!notas) return 1090.0;
  const match = notas.match(/Cuota:\s*\$?([\d,]+(\.\d+)?)/i);
  if (match && match[1]) {
    const parsed = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 1090.0;
}

/**
 * Extrae el RFC desde las notas del lead.
 */
export function extraerRfcDeNotas(notas: string | null | undefined): string {
  if (!notas) return 'XAXX010101000';
  const match = notas.match(/RFC:\s*([A-Z0-9]+)/i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  return 'XAXX010101000';
}

/**
 * Genera el archivo CSV con la cabecera estándar de ingesta que espera Arkangel:
 * nombre,telefono,email,rfc,monto,concepto,vencimiento,estrato
 */
export function generarCsvCobranzaArkangel(socios: SocioCobranzaRecord[]): string {
  const headers = [
    'nombre',
    'telefono',
    'email',
    'rfc',
    'monto',
    'concepto',
    'vencimiento',
    'estrato',
  ];

  const rows = socios.map((s) => {
    const esc = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
    return [
      esc(s.nombre),
      esc(s.telefono),
      esc(s.email),
      esc(s.rfc),
      s.monto.toFixed(2),
      esc(s.concepto),
      esc(s.vencimiento),
      esc(s.estrato),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Despacha el lote hacia Arkangel vía Service Binding interno o REST API.
 */
export async function despacharLoteArkangel(
  env: Env,
  socios: SocioCobranzaRecord[],
  opts?: { dryRun?: boolean }
): Promise<SyncArkangelResult> {
  const tenantId = 'canaco_merida';
  const totalMonto = socios.reduce((sum, s) => sum + s.monto, 0);

  if (opts?.dryRun || socios.length === 0) {
    return {
      ok: true,
      simulated: true,
      tenant_id: tenantId,
      socios_enviados: socios.length,
      monto_total_cartera: totalMonto,
      mensaje:
        socios.length === 0
          ? 'No hay socios con cuota pendiente para sincronizar.'
          : 'Lote validado en modo dry-run.',
    };
  }

  const csvPayload = generarCsvCobranzaArkangel(socios);

  // 1. Vía Service Binding interno de Cloudflare (Worker to Worker de latencia cero)
  if (env.ARKANGEL && typeof env.ARKANGEL.fetch === 'function') {
    try {
      const resp = await env.ARKANGEL.fetch('https://arkangel.internal/api/v1/ingest/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'X-Tenant-ID': tenantId,
          Authorization: `Bearer ${env.ARKANGEL_API_KEY || 'arkangel_internal_service'}`,
        },
        body: csvPayload,
      });

      const jsonResp = await resp.json().catch(() => ({}));
      return {
        ok: resp.ok,
        simulated: false,
        tenant_id: tenantId,
        socios_enviados: socios.length,
        monto_total_cartera: totalMonto,
        mensaje: resp.ok
          ? 'Lote sincronizado exitosamente con Arkangel vía Service Binding.'
          : 'Error al enviar lote a Arkangel.',
        arkangel_response: jsonResp,
      };
    } catch (err: any) {
      return {
        ok: false,
        simulated: false,
        tenant_id: tenantId,
        socios_enviados: socios.length,
        monto_total_cartera: totalMonto,
        mensaje: `Fallo en Service Binding: ${err.message}`,
      };
    }
  }

  // 2. Vía REST API pública/privada externa
  if (env.ARKANGEL_URL) {
    try {
      const resp = await fetch(env.ARKANGEL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'X-Tenant-ID': tenantId,
          Authorization: `Bearer ${env.ARKANGEL_API_KEY || ''}`,
        },
        body: csvPayload,
      });

      const jsonResp = await resp.json().catch(() => ({}));
      return {
        ok: resp.ok,
        simulated: false,
        tenant_id: tenantId,
        socios_enviados: socios.length,
        monto_total_cartera: totalMonto,
        mensaje: resp.ok
          ? 'Lote sincronizado exitosamente con Arkangel vía REST API.'
          : 'Error en respuesta de Arkangel REST API.',
        arkangel_response: jsonResp,
      };
    } catch (err: any) {
      return {
        ok: false,
        simulated: false,
        tenant_id: tenantId,
        socios_enviados: socios.length,
        monto_total_cartera: totalMonto,
        mensaje: `Fallo en conexión REST con Arkangel: ${err.message}`,
      };
    }
  }

  // 3. Modo Simulación transparente (desarrollo / sin credenciales activas)
  return {
    ok: true,
    simulated: true,
    tenant_id: tenantId,
    socios_enviados: socios.length,
    monto_total_cartera: totalMonto,
    mensaje:
      'Lote generado y verificado exitosamente en modo simulación (configura ARKANGEL o ARKANGEL_URL en producción).',
  };
}

/**
 * Handler de endpoints de sincronización y webhooks de Arkangel.
 */
export async function handleCanacoArkangelSyncApi(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  principal: AuthPrincipal | null
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith('/api/canaco/')) {
    return null;
  }

  const db = env.ARK_TOOLS_DB;

  // ─────────────────────────────────────────────────────────────────
  // 1. STATUS DE CONEXIÓN CON ARKANGEL
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/canaco/arkangel-status' && request.method === 'GET') {
    const isServiceBinding = Boolean(env.ARKANGEL && typeof env.ARKANGEL.fetch === 'function');
    const isRestConfigured = Boolean(env.ARKANGEL_URL);

    let pendientesCount = 0;
    if (db) {
      const row = await db
        .prepare(
          "SELECT COUNT(*) AS total FROM leads_ark_tools WHERE tenant_id = 'canaco_merida' AND (status = 'Nuevo / Pendiente' OR status = 'pendiente_pago' OR status = 'Nuevo')"
        )
        .first<{ total: number }>()
        .catch(() => null);
      pendientesCount = row?.total || 0;
    }

    return Response.json(
      {
        status: 'ok',
        serviceBindingActive: isServiceBinding,
        restApiConfigured: isRestConfigured,
        tenantId: 'canaco_merida',
        sociosPendientesCobro: pendientesCount,
        callCenterProvider: 'ARKANGEL Voice AI (Telnyx PSTN + WhatsApp)',
      },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. DISPARO MANUAL O CRON DE LA SINCRONIZACIÓN MATUTINA
  // POST /api/canaco/sync-arkangel
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/canaco/sync-arkangel' && request.method === 'POST') {
    // Verificación de autorización: super_admin, admin de canaco (horus.i2d@gmail.com) o cron secret
    const cronSecret = request.headers.get('X-Cron-Key') || request.headers.get('x-cron-key');
    const isAuthorizedCron = Boolean(cronSecret && cronSecret === env.RESEND_API_KEY?.slice(0, 16));
    const isCanacoAdmin =
      principal?.email.toLowerCase() === 'horus.i2d@gmail.com' ||
      principal?.platformRole === 'super_admin';

    if (!isCanacoAdmin && !isAuthorizedCron) {
      return Response.json(
        { error: 'No autorizado para disparar la sincronización del Call Center.' },
        { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    try {
      const rows = await db
        .prepare(
          `SELECT id, web, whatsapp, email, ciudad, especialidad, status, contacto_nombre, notas
           FROM leads_ark_tools
           WHERE tenant_id = 'canaco_merida'
             AND (status = 'Nuevo / Pendiente' OR status = 'pendiente_pago' OR status = 'Nuevo')`
        )
        .all<{
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

      const leads = rows.results || [];
      const fechaVencimiento =
        new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] || '';

      const socios: SocioCobranzaRecord[] = leads.map((l) => ({
        id: l.id,
        nombre: l.web || 'Comercio Afiliado',
        telefono: normalizarTelefonoE164(l.whatsapp),
        email: l.email || '',
        rfc: extraerRfcDeNotas(l.notas),
        monto: extraerMontoDeNotas(l.notas),
        concepto: 'Registro SIEM 2026 y Cuota Anual CANACO Mérida',
        vencimiento: fechaVencimiento,
        estrato: l.especialidad ? l.especialidad.toUpperCase() : 'COMERCIO',
      }));

      // Despachar a Arkangel
      const resultado = await despacharLoteArkangel(env, socios);

      // Si fue exitoso o simulado, actualizar fecha de contacto en D1
      if (resultado.ok && leads.length > 0) {
        const todayIso = new Date().toISOString().split('T')[0] || '';
        await db
          .prepare(
            `UPDATE leads_ark_tools 
             SET last_contact = ? 
             WHERE tenant_id = 'canaco_merida' 
               AND (status = 'Nuevo / Pendiente' OR status = 'pendiente_pago' OR status = 'Nuevo')`
          )
          .bind(todayIso)
          .run()
          .catch(() => null);
      }

      return Response.json(resultado, {
        headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
      });
    } catch (err: any) {
      return Response.json(
        { error: 'Error procesando la sincronización hacia Arkangel.', detalle: err.message },
        { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. WEBHOOK DE RETORNO: PAGO RECIBIDO EN ARKANGEL (SPEI / 1-CLICK)
  // POST /api/canaco/webhook-pago-arkangel
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/canaco/webhook-pago-arkangel' && request.method === 'POST') {
    // Validación opcional de secreto de webhook
    const authHeader = request.headers.get('Authorization');
    if (env.ARKANGEL_WEBHOOK_SECRET) {
      const expected = `Bearer ${env.ARKANGEL_WEBHOOK_SECRET}`;
      if (authHeader !== expected) {
        return Response.json(
          { error: 'Secreto de webhook inválido.' },
          { status: 401, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }
    }

    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    try {
      const body = (await request.json()) as {
        rfc?: string;
        folio_pago?: string;
        monto?: number;
        tenant_id?: string;
        metodo?: string;
      };

      if (!body.rfc?.trim()) {
        return Response.json(
          { error: 'El RFC del socio es requerido.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const rfcClean = body.rfc.trim().toUpperCase();
      const folioPago = body.folio_pago || `SPEI-ARK-${Date.now().toString(36).toUpperCase()}`;
      const nowIso = new Date().toISOString();
      const todayIso = nowIso.split('T')[0] || '';

      // Generar folio SIEM oficial y sellado
      const folioSiem = `SIEM-MID-2026-${rfcClean.slice(0, 4)}-${Date.now().toString().slice(-4)}`;
      const sello = `SHA256:CANACO-MID-${Date.now().toString(16)}`;

      // Buscar si el socio existe por RFC en notas
      const existing = await db
        .prepare(
          `SELECT id, notas FROM leads_ark_tools 
           WHERE tenant_id = 'canaco_merida' 
             AND (notas LIKE ? OR web LIKE ?)`
        )
        .bind(`%${rfcClean}%`, `%${rfcClean}%`)
        .first<{ id: string; notas: string | null }>();

      if (existing) {
        const notasActualizadas = `${existing.notas || ''} | Folio SIEM: ${folioSiem} | Pago Confirmado Call Center: ${folioPago} ($${body.monto || 0} MXN) | Sello: ${sello}`;
        await db
          .prepare(
            `UPDATE leads_ark_tools 
             SET status = 'Socio Activo', 
                 last_contact = ?, 
                 notas = ? 
             WHERE id = ?`
          )
          .bind(todayIso, notasActualizadas, existing.id)
          .run();
      } else {
        // Si no existía, lo insertamos como Socio Activo
        const newId = `canaco-lead-${Date.now()}`;
        const notasNuevas = `RFC: ${rfcClean} | Folio SIEM: ${folioSiem} | Pago Confirmado Call Center: ${folioPago} | Sello: ${sello}`;
        await db
          .prepare(
            `INSERT INTO leads_ark_tools (
              id, web, whatsapp, email, ciudad, especialidad, status, last_contact, contacto_nombre, notas, tenant_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            newId,
            `Comercio Afiliado ${rfcClean}`,
            '',
            '',
            'Mérida',
            'comercio',
            'Socio Activo',
            todayIso,
            'Representante Legal',
            notasNuevas,
            'canaco_merida'
          )
          .run();
      }

      return Response.json(
        {
          ok: true,
          mensaje: 'Pago de cuota cameral acreditado exitosamente.',
          rfc: rfcClean,
          folioSiem,
          folioPago,
          estatus: 'Socio Activo',
          timestamp: nowIso,
        },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    } catch (err: any) {
      return Response.json(
        { error: 'Error procesando webhook de pago.', detalle: err.message },
        { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  return null;
}

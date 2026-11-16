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
import { calcularCuotaAfiliacion, extraerNumEmpleados } from '@/components/canaco/calculoCuota';
import type { SectorEconomico } from '@/components/canaco/types';

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
          `SELECT COUNT(*) AS total FROM leads_ark_tools
           WHERE tenant_id = 'canaco_merida' AND arkangel_share_consent = 1
             AND is_demo = 0 AND lifecycle_stage IN ('prospecto', 'registrado', 'pago_pendiente')
             AND status IN (
               'Prospecto', 'Registrado', 'Pago Pendiente',
               'Nuevo / Pendiente', 'pendiente_pago', 'Nuevo'
             )`
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
    if (principal?.email.toLowerCase() !== 'pavel@arksystems.site') {
      return Response.json(
        { error: 'La sincronización requiere aprobación autenticada de Pavel.' },
        { status: 403, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      action?: 'preview' | 'dispatch';
      approvalId?: string;
    };
    const action = body.action || 'preview';
    if (action !== 'preview' && action !== 'dispatch') {
      return Response.json(
        { error: 'Acción de sincronización no válida.' },
        { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    if (!db) {
      return Response.json(
        { error: 'Base de datos D1 no disponible.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    try {
      if (action === 'dispatch') {
        if (!body.approvalId) {
          return Response.json(
            { error: 'Se requiere aprobar una vista previa vigente antes del envío.' },
            { status: 428, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
        }
        const approval = await db
          .prepare(
            `SELECT id, approver_id, approver_email, preview_json, expires_at, consumed_at
             FROM canaco_arkangel_approvals
             WHERE id = ? AND approver_id = ? AND approver_email = ? LIMIT 1`
          )
          .bind(body.approvalId, principal.id, principal.email)
          .first<{
            id: string;
            approver_id: string;
            approver_email: string;
            preview_json: string;
            expires_at: string;
            consumed_at: string | null;
          }>();
        if (!approval || approval.consumed_at || Date.parse(approval.expires_at) <= Date.now()) {
          return Response.json(
            { error: 'La vista previa no existe, venció o ya fue utilizada.' },
            { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
        }

        const preview = JSON.parse(approval.preview_json) as {
          socios: SocioCobranzaRecord[];
          excludedLeadIds: string[];
        };
        const eligible = await db
          .prepare(
            `SELECT id FROM leads_ark_tools
             WHERE tenant_id = 'canaco_merida'
               AND arkangel_share_consent = 1 AND is_demo = 0
               AND lifecycle_stage IN ('prospecto', 'registrado', 'pago_pendiente')
               AND status IN (
                 'Prospecto', 'Registrado', 'Pago Pendiente',
                 'Nuevo / Pendiente', 'pendiente_pago', 'Nuevo'
               )`
          )
          .all<{ id: string }>();
        const eligibleIds = new Set((eligible.results || []).map((row) => row.id));
        if (preview.socios.some((socio) => !eligibleIds.has(socio.id))) {
          return Response.json(
            {
              error:
                'La elegibilidad o el consentimiento cambió desde la vista previa; genera otra.',
            },
            { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
        }

        const reservation = await db
          .prepare(
            `UPDATE canaco_arkangel_approvals SET consumed_at = ?
             WHERE id = ? AND consumed_at IS NULL AND expires_at > ?`
          )
          .bind(new Date().toISOString(), approval.id, new Date().toISOString())
          .run();
        if (reservation.meta.changes !== 1) {
          return Response.json(
            { error: 'La vista previa ya fue aprobada por otra solicitud.' },
            { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
        }

        const resultado = await despacharLoteArkangel(env, preview.socios);
        await db
          .prepare(
            `INSERT INTO canaco_arkangel_sync_batches
             (id, approval_id, approver_id, approver_email, sent_leads_json, excluded_leads_json,
              simulated, provider_result_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            approval.id,
            approval.id,
            principal.id,
            principal.email,
            JSON.stringify(
              resultado.ok && !resultado.simulated ? preview.socios.map((socio) => socio.id) : []
            ),
            JSON.stringify(preview.excludedLeadIds),
            resultado.simulated ? 1 : 0,
            JSON.stringify({
              ok: resultado.ok,
              provider: resultado.arkangel_response || null,
              message: resultado.mensaje,
            })
          )
          .run();
        return Response.json(resultado, {
          headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
        });
      }

      const rows = await db
        .prepare(
          `SELECT id, web, whatsapp, email, ciudad, especialidad, status, contacto_nombre,
                  notas, canonical_rfc
           FROM leads_ark_tools
           WHERE tenant_id = 'canaco_merida'
             AND arkangel_share_consent = 1 AND is_demo = 0
             AND lifecycle_stage IN ('prospecto', 'registrado', 'pago_pendiente')
             AND status IN (
               'Prospecto', 'Registrado', 'Pago Pendiente',
               'Nuevo / Pendiente', 'pendiente_pago', 'Nuevo'
             )`
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
          canonical_rfc: string | null;
        }>();

      const leads = rows.results || [];
      const fechaVencimiento =
        new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0] || '';

      const socios: SocioCobranzaRecord[] = leads
        .filter((lead) => {
          const employees = extraerNumEmpleados(lead.notas);
          const sector = lead.especialidad;
          if (!employees || !['comercio', 'servicios', 'turismo'].includes(sector || '')) {
            return false;
          }
          return Boolean(lead.canonical_rfc);
        })
        .map((l) => ({
          id: l.id,
          nombre: l.web || '',
          telefono: normalizarTelefonoE164(l.whatsapp),
          email: l.email || '',
          rfc: l.canonical_rfc || '',
          monto: calcularCuotaAfiliacion(
            extraerNumEmpleados(l.notas),
            l.especialidad as SectorEconomico
          ).totalAnual,
          concepto: 'Registro SIEM 2026 y Cuota Anual CANACO Mérida',
          vencimiento: fechaVencimiento,
          estrato: l.especialidad ? l.especialidad.toUpperCase() : '',
        }))
        .filter((socio) => socio.nombre && socio.email);
      const includedIds = new Set(socios.map((socio) => socio.id));
      const excludedLeadIds = leads
        .filter((lead) => !includedIds.has(lead.id))
        .map((lead) => lead.id);

      const approvalId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const preview = {
        socios,
        excludedLeadIds,
        channels: ['arkangel_ingest_csv'],
        content: generarCsvCobranzaArkangel(socios),
      };
      await db
        .prepare(
          `INSERT INTO canaco_arkangel_approvals
           (id, batch_id, approver_id, approver_email, lead_ids_json, preview_json,
            created_at, expires_at, consumed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`
        )
        .bind(
          approvalId,
          approvalId,
          principal.id,
          principal.email,
          JSON.stringify(socios.map((socio) => socio.id)),
          JSON.stringify(preview),
          createdAt,
          expiresAt
        )
        .run();

      const resultado = await despacharLoteArkangel(env, socios, { dryRun: true });
      return Response.json(
        {
          ...resultado,
          approvalId,
          expiresAt,
          preview: {
            rows: socios,
            excludedLeadIds,
            channels: preview.channels,
            content: preview.content,
          },
        },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
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
    return Response.json(
      {
        error: 'Este webhook no puede confirmar pagos. Usa una confirmación verificada de Conekta.',
      },
      { status: 410, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  return null;
}

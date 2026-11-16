/**
 * CANACO SERVYTUR MÉRIDA — Riel de Cobranza Conekta
 *
 * La cuenta y liquidación están a nombre de CANACO SERVYTUR Mérida (merchant of record).
 * La plataforma genera órdenes y redirige al checkout hospedado de Conekta; los fondos
 * se liquidan directamente a la cuenta Conekta de CANACO.
 * - Tarjeta de crédito/débito y Transferencia SPEI (bank_transfer).
 * - Webhook con firma RSA SHA-256 (header DIGEST) para activar socio en D1 y emitir cédula.
 */

import type { Env } from '../index';
import { sendCanacoConfirmacionPagoEmail } from './canacoEmailService';
import { rateLimit } from './auth';
import { calcularCuotaAfiliacion, extraerNumEmpleados } from '@/components/canaco/calculoCuota';
import type { SectorEconomico } from '@/components/canaco/types';
import { activateCanacoSocioByPayment, canonicalizarRfc } from './canacoLifecycle';

export interface CanacoCheckoutParams {
  razonSocial: string;
  rfc: string;
  folioSiem: string;
  email: string;
  numEmpleados: number;
  sector?: SectorEconomico;
  municipio?: string;
  telefono?: string;
  leadId: string;
  paymentIntentId: string;
  metodoPago: 'tarjeta' | 'spei';
  cfdiRequerido?: boolean;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function pemToDer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function verifyConektaSignature(
  rawBody: string,
  digestHeader: string | null,
  publicKeyPem: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!digestHeader || !publicKeyPem) {
    return { valid: false, reason: 'Encabezado DIGEST o llave pública ausente' };
  }

  try {
    const key = await crypto.subtle.importKey(
      'spki',
      pemToDer(publicKeyPem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(atob(digestHeader), (c) => c.charCodeAt(0));
    const dataBytes = new TextEncoder().encode(rawBody);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signatureBytes, dataBytes);

    if (!valid) {
      return { valid: false, reason: 'Firma criptográfica no coincide' };
    }
    return { valid: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al verificar firma Conekta';
    return { valid: false, reason: msg };
  }
}

export async function createCanacoConektaCheckout(
  env: Env,
  params: CanacoCheckoutParams
): Promise<{
  ok: boolean;
  url?: string;
  orderId?: string;
  simulated?: boolean;
  error?: string;
}> {
  const appUrl = (env.APP_URL || 'https://ledger.arksystems.site').replace(/\/+$/, '');
  const privateKey = env.CONEKTA_PRIVATE_KEY;
  const empleados = Number(params.numEmpleados);
  if (
    !params.leadId?.trim() ||
    !params.razonSocial?.trim() ||
    !params.rfc?.trim() ||
    !params.folioSiem?.trim() ||
    !params.paymentIntentId?.trim() ||
    !params.email?.trim() ||
    !Number.isInteger(empleados) ||
    empleados < 1
  ) {
    return { ok: false, error: 'El registro no contiene los datos necesarios para cotizar.' };
  }
  const sector = params.sector || 'comercio';
  const total = calcularCuotaAfiliacion(empleados, sector).totalAnual;
  const totalCentavos = Math.round(total * 100);

  // No cobrar con importes del prototipo hasta que CANACO confirme la tabla de precios.
  if (!privateKey || env.CANACO_PRICING_CONFIRMED !== 'true') {
    const simOrderId = `ord_sim_${Date.now().toString(36)}`;
    const simUrl = `${appUrl}/?brand=canaco&conekta_simulated=1`;
    return {
      ok: true,
      simulated: true,
      orderId: simOrderId,
      url: simUrl,
    };
  }

  try {
    const baseUrl = 'https://api.conekta.io';

    const body = {
      currency: 'MXN',
      customer_info: {
        name: params.razonSocial.trim().toUpperCase() || 'EMPRESA COMERCIAL DE YUCATÁN',
        email: params.email.trim(),
        phone: params.telefono?.trim() || '9991234567',
      },
      line_items: [
        {
          name: `Registro SIEM 2026 y Membresía CANACO (${params.rfc.toUpperCase()})`,
          description: `Folio: ${params.folioSiem} · Razón Social: ${params.razonSocial}`,
          unit_price: totalCentavos,
          quantity: 1,
        },
      ],
      metadata: {
        folioSiem: params.folioSiem,
        rfc: params.rfc.toUpperCase(),
        razonSocial: params.razonSocial,
        numEmpleados: String(empleados),
        sector,
        municipio: params.municipio || 'Mérida',
        totalCentavos: String(totalCentavos),
        leadId: params.leadId || '',
        paymentIntentId: params.paymentIntentId,
        environment: env.CONEKTA_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
        email: params.email.trim(),
        cfdiRequerido: params.cfdiRequerido ? '1' : '0',
      },
      checkout: {
        type: 'HostedPayment',
        name: 'Afiliación CANACO SERVYTUR Mérida',
        success_url: `${appUrl}/?brand=canaco&conekta_success=1`,
        failure_url: `${appUrl}/?brand=canaco&conekta_cancel=1`,
        allowed_payment_methods: [params.metodoPago === 'spei' ? 'bank_transfer' : 'card'],
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${privateKey}`,
        Accept: 'application/vnd.conekta-v2.3.0+json',
        'Content-Type': 'application/json',
        'Accept-Language': 'es',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      id?: string;
      checkout?: { url?: string };
      details?: Array<{ message?: string }>;
      message?: string;
    };

    if (!response.ok || !data.checkout?.url) {
      const errMsg =
        data.details?.[0]?.message ||
        data.message ||
        'Error al generar la orden de pago con Conekta.';
      return { ok: false, error: errMsg };
    }

    return {
      ok: true,
      url: data.checkout.url,
      orderId: data.id,
      simulated: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fallo de conexión con Conekta.';
    return { ok: false, error: msg };
  }
}

export async function handleCanacoConektaApiRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith('/api/canaco/conekta/')) {
    return null;
  }

  const db = env.ARK_TOOLS_DB;

  // ─────────────────────────────────────────────────────────────────
  // 1. STATUS DE INTEGRACIÓN CONEKTA
  // GET /api/canaco/conekta/status
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/canaco/conekta/status' && request.method === 'GET') {
    return Response.json(
      {
        ok: true,
        configured: Boolean(env.CONEKTA_PRIVATE_KEY),
        webhookConfigured: Boolean(env.CONEKTA_WEBHOOK_PUBLIC_KEY),
        environment: env.CONEKTA_ENVIRONMENT || 'sandbox',
        pricingConfirmed: env.CANACO_PRICING_CONFIRMED === 'true',
        speiTransferEnabled:
          Boolean(env.CONEKTA_PRIVATE_KEY) && env.CANACO_PRICING_CONFIRMED === 'true',
      },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. CREACIÓN DE ORDEN CONEKTA (CHECKOUT HOSPEDADO)
  // POST /api/canaco/conekta/create-checkout
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/canaco/conekta/create-checkout' && request.method === 'POST') {
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (await rateLimit(env, 'conekta:checkout', ip, 15, 3600)) {
        return Response.json(
          { error: 'Demasiados intentos de generación de orden de pago. Intenta más tarde.' },
          { status: 429, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const body = (await request.json()) as {
        leadId?: string;
        metodoPago?: 'tarjeta' | 'spei';
      };

      if (!body.leadId?.trim() || (body.metodoPago !== 'tarjeta' && body.metodoPago !== 'spei')) {
        return Response.json(
          { error: 'Se requieren el registro y un método de pago Conekta válido.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      if (!db) {
        return Response.json(
          { error: 'Base de datos D1 no disponible para validar el registro.' },
          { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const lead = await db
        .prepare(
          `SELECT id, web, whatsapp, email, ciudad, especialidad, status, lifecycle_stage,
                  canonical_rfc, contacto_nombre, notas
           FROM leads_ark_tools
           WHERE id = ? AND tenant_id = 'canaco_merida'
           LIMIT 1`
        )
        .bind(body.leadId.trim())
        .first<{
          id: string;
          web: string | null;
          whatsapp: string | null;
          email: string | null;
          ciudad: string | null;
          especialidad: string | null;
          status: string | null;
          lifecycle_stage: string | null;
          canonical_rfc: string | null;
          contacto_nombre: string | null;
          notas: string | null;
        }>();
      const rfc = lead?.canonical_rfc;
      const folioSiem = lead?.notas?.match(/Folio SIEM:\s*([^\s|]+)/i)?.[1];
      const razonSocial = lead?.notas?.match(/Razón Social:\s*([^|]+)/i)?.[1]?.trim();
      const numEmpleados = extraerNumEmpleados(lead?.notas);
      const sector = lead?.especialidad;
      if (
        !lead ||
        !['registrado', 'pago_pendiente'].includes(lead.lifecycle_stage || '') ||
        !rfc ||
        canonicalizarRfc(rfc) !== rfc ||
        !folioSiem ||
        !razonSocial ||
        !numEmpleados ||
        !lead.email ||
        !['comercio', 'servicios', 'turismo'].includes(sector || '')
      ) {
        return Response.json(
          { error: 'No se encontró un registro validado para iniciar el pago.' },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const now = new Date();
      const openIntent = await db
        .prepare(
          `SELECT id, order_id, checkout_url, expires_at
           FROM canaco_payment_intents
           WHERE lead_id = ? AND tenant_id = 'canaco_merida'
             AND status = 'created' AND expires_at > ?
           ORDER BY created_at DESC LIMIT 1`
        )
        .bind(lead.id, now.toISOString())
        .first<{
          id: string;
          order_id: string;
          checkout_url: string | null;
          expires_at: string;
        }>();
      if (openIntent) {
        if (openIntent.checkout_url) {
          return Response.json(
            {
              ok: true,
              url: openIntent.checkout_url,
              orderId: openIntent.order_id,
              expiresAt: openIntent.expires_at,
              reused: true,
              simulated: openIntent.order_id.startsWith('ord_sim_'),
            },
            { headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
          );
        }
        return Response.json(
          {
            error:
              'Ya existe un checkout vigente para este registro. Usa el checkout que ya recibiste; no se creó otra orden.',
            existingOrderId: openIntent.order_id,
            expiresAt: openIntent.expires_at,
          },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const intentId = crypto.randomUUID();
      const checkoutResult = await createCanacoConektaCheckout(env, {
        razonSocial,
        rfc,
        folioSiem,
        email: lead.email,
        telefono: lead.whatsapp || undefined,
        numEmpleados,
        sector: sector as SectorEconomico,
        municipio: lead.ciudad || 'Mérida',
        leadId: lead.id,
        paymentIntentId: intentId,
        metodoPago: body.metodoPago,
      });

      if (!checkoutResult.ok) {
        return Response.json(
          { error: checkoutResult.error || 'Error al generar checkout Conekta.' },
          { status: 502, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      if (!checkoutResult.orderId) {
        return Response.json(
          { error: 'Conekta no devolvió una referencia de orden válida.' },
          { status: 502, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const totalAnual = calcularCuotaAfiliacion(
        numEmpleados,
        sector as SectorEconomico
      ).totalAnual;
      const amountCents = Math.round(totalAnual * 100);
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const environment =
        checkoutResult.simulated || env.CONEKTA_ENVIRONMENT !== 'production'
          ? 'sandbox'
          : 'production';
      const channel = body.metodoPago === 'spei' ? 'conekta_spei' : 'conekta_card';

      await db
        .prepare(
          `UPDATE canaco_payment_intents SET status = 'expired'
           WHERE lead_id = ? AND status = 'created' AND expires_at <= ?`
        )
        .bind(lead.id, now.toISOString())
        .run();

      const intentInsert = db
        .prepare(
          `INSERT INTO canaco_payment_intents
           (id, lead_id, tenant_id, rfc, folio_siem, razon_social, email, num_empleados,
            sector, channel, environment, amount_cents, status, order_id, checkout_url,
            created_at, expires_at)
           SELECT ?, ?, 'canaco_merida', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?, ?
           WHERE EXISTS (
             SELECT 1 FROM leads_ark_tools
             WHERE id = ? AND tenant_id = 'canaco_merida'
               AND canonical_rfc = ? AND lifecycle_stage IN ('registrado', 'pago_pendiente')
           )`
        )
        .bind(
          intentId,
          lead.id,
          rfc,
          folioSiem,
          razonSocial,
          lead.email,
          numEmpleados,
          sector,
          channel,
          environment,
          amountCents,
          checkoutResult.orderId,
          checkoutResult.url,
          now.toISOString(),
          expiresAt,
          lead.id,
          rfc
        );
      const stageUpdate = db
        .prepare(
          `UPDATE leads_ark_tools
           SET lifecycle_stage = 'pago_pendiente', status = 'Pago Pendiente',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND tenant_id = 'canaco_merida'
             AND lifecycle_stage IN ('registrado', 'pago_pendiente')
             AND EXISTS (
               SELECT 1 FROM canaco_payment_intents
               WHERE id = ? AND lead_id = ? AND status = 'created'
             )`
        )
        .bind(lead.id, intentId, lead.id);
      const auditInsert = db
        .prepare(
          `INSERT INTO canaco_lifecycle_audit
           (id, lead_id, from_stage, to_stage, reason, evidence_reference)
           SELECT ?, ?, ?, 'pago_pendiente', 'Conekta payment intent created', ?
           WHERE EXISTS (
             SELECT 1 FROM leads_ark_tools
             WHERE id = ? AND tenant_id = 'canaco_merida' AND lifecycle_stage = 'pago_pendiente'
           )`
        )
        .bind(crypto.randomUUID(), lead.id, lead.lifecycle_stage, intentId, lead.id);
      const batchResults = await db.batch([intentInsert, stageUpdate, auditInsert]);
      if (batchResults[0]?.meta.changes !== 1 || batchResults[1]?.meta.changes !== 1) {
        return Response.json(
          { error: 'El registro cambió antes de crear la intención de pago.' },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      return Response.json(checkoutResult, {
        headers: { ...corsHeaders, 'Cache-Control': 'no-store' },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error interno al procesar checkout.';
      return Response.json(
        { error: msg },
        { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. WEBHOOK CONEKTA: LIQUIDACIÓN DE CUOTAS SIEM
  // POST /api/canaco/conekta/webhook
  // ─────────────────────────────────────────────────────────────────
  if (path === '/api/canaco/conekta/webhook' && request.method === 'POST') {
    const rawBody = await request.text();
    const digestHeader = request.headers.get('digest');

    // Validación obligatoria de firma Conekta (RSA) — Fail-Closed
    if (!env.CONEKTA_WEBHOOK_PUBLIC_KEY) {
      return Response.json(
        { error: 'Llave pública de webhook Conekta no configurada en el servidor.' },
        { status: 503, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }

    const verification = await verifyConektaSignature(
      rawBody,
      digestHeader,
      env.CONEKTA_WEBHOOK_PUBLIC_KEY
    );

    if (!verification.valid) {
      return Response.json(
        { error: 'Firma de webhook Conekta inválida.', motivo: verification.reason },
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
      const event = JSON.parse(rawBody) as {
        id?: string;
        type?: string;
        data?: {
          object?: {
            id?: string;
            amount?: number;
            currency?: string;
            payment_status?: string;
            customer_info?: { email?: string; name?: string; phone?: string };
            metadata?: Record<string, string>;
          };
        };
      };

      // Escuchamos order.paid (checkout hospedado). Otros eventos se acusan recibidos.
      if (event.type !== 'order.paid' && event.type !== 'charge.paid') {
        return Response.json(
          { received: true, ignored: true, eventType: event.type },
          { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const orderObj = event.data?.object || {};
      const metadata = orderObj.metadata || {};
      const leadId = metadata.leadId || '';
      const intentId = metadata.paymentIntentId || '';
      const folioSiem = metadata.folioSiem || '';
      const rfc = canonicalizarRfc(metadata.rfc || '');
      const email = (metadata.email || '').trim().toLowerCase();
      const razonSocial = (metadata.razonSocial || '').trim().toUpperCase();
      const orderId = orderObj.id || '';
      const eventId = event.id || '';
      const montoCentavos = Number(orderObj.amount);
      const totalEsperadoCentavos = Number(metadata.totalCentavos);
      const numEmpleados = Number(metadata.numEmpleados);
      const sector = (metadata.sector as SectorEconomico) || 'comercio';
      const totalCalculadoCentavos = Number.isInteger(numEmpleados)
        ? Math.round(calcularCuotaAfiliacion(numEmpleados, sector).totalAnual * 100)
        : 0;
      if (
        env.CONEKTA_ENVIRONMENT !== 'production' ||
        metadata.environment !== 'production' ||
        !leadId ||
        !intentId ||
        !orderId ||
        !eventId ||
        !folioSiem ||
        !rfc ||
        !Number.isInteger(numEmpleados) ||
        numEmpleados < 1 ||
        !Number.isInteger(montoCentavos) ||
        montoCentavos < 1 ||
        montoCentavos !== totalEsperadoCentavos ||
        montoCentavos !== totalCalculadoCentavos ||
        !orderObj.currency ||
        orderObj.currency.toUpperCase() !== 'MXN'
      ) {
        return Response.json(
          { error: 'El pago no coincide con el folio y el importe calculado del registro.' },
          { status: 422, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const intent = await db
        .prepare(
          `SELECT id, lead_id, rfc, folio_siem, razon_social, email, num_empleados,
                  sector, amount_cents, channel, environment, order_id, status, expires_at
           FROM canaco_payment_intents
           WHERE id = ? AND lead_id = ? AND tenant_id = 'canaco_merida'
           LIMIT 1`
        )
        .bind(intentId, leadId)
        .first<{
          id: string;
          lead_id: string;
          rfc: string;
          folio_siem: string;
          razon_social: string;
          email: string;
          num_empleados: number;
          sector: string;
          amount_cents: number;
          channel: string;
          environment: string;
          order_id: string | null;
          status: string;
          expires_at: string;
        }>();
      if (
        !intent ||
        intent.status === 'expired' ||
        intent.status === 'cancelled' ||
        intent.status === 'superseded' ||
        intent.status === 'failed' ||
        (intent.status !== 'paid' && Date.parse(intent.expires_at) <= Date.now()) ||
        intent.environment !== 'production' ||
        !['conekta_card', 'conekta_spei'].includes(intent.channel) ||
        intent.order_id !== orderId ||
        intent.rfc !== rfc ||
        intent.folio_siem !== folioSiem ||
        intent.razon_social.toUpperCase() !== razonSocial ||
        intent.email.trim().toLowerCase() !== email ||
        intent.num_empleados !== numEmpleados ||
        intent.sector !== sector ||
        intent.amount_cents !== montoCentavos ||
        montoCentavos !== totalEsperadoCentavos ||
        montoCentavos !== totalCalculadoCentavos
      ) {
        return Response.json(
          { error: 'El pago no coincide con la intención y la cotización almacenadas.' },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const existing = await db
        .prepare(
          `SELECT id, canonical_rfc, lifecycle_stage, status, contacto_nombre
           FROM leads_ark_tools
           WHERE id = ? AND tenant_id = 'canaco_merida'
           LIMIT 1`
        )
        .bind(leadId)
        .first<{
          id: string;
          canonical_rfc: string | null;
          lifecycle_stage: string | null;
          status: string | null;
          contacto_nombre: string | null;
        }>();
      if (
        !existing ||
        existing.canonical_rfc !== rfc ||
        !['pago_pendiente', 'socio_activo'].includes(existing.lifecycle_stage || '')
      ) {
        return Response.json(
          { error: 'La intención no coincide con un registro CANACO en etapa de pago.' },
          { status: 409, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const activation = await activateCanacoSocioByPayment(db, {
        provider: 'conekta',
        signatureVerified: true,
        eventType: event.type,
        leadId,
        intentId,
        transactionReference: orderId,
        eventId,
        amountCents: montoCentavos,
        currency: 'MXN',
        environment: 'production',
        paidAt: new Date().toISOString(),
      });

      // Enviar confirmación por correo electrónico vía Resend
      if (!activation.replay && email && email.includes('@')) {
        await sendCanacoConfirmacionPagoEmail(env, {
          email,
          contactoNombre: orderObj.customer_info?.name || razonSocial,
          razonSocial,
          rfc: rfc || 'XAXX010101000',
          folioSiem,
          folioPago: orderId,
          monto: montoCentavos / 100,
          folioIntegridad: `CANACO-FI-${folioSiem}`,
          metodo: intent.channel === 'conekta_spei' ? 'SPEI (Conekta)' : 'Tarjeta (Conekta)',
        }).catch((err) => {
          console.warn('[Conekta Webhook] No se pudo enviar correo Resend:', err);
        });
      }

      return Response.json(
        {
          ok: true,
          received: true,
          folioSiem,
          status: 'Socio Activo',
          replay: activation.replay,
        },
        { status: 200, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar webhook Conekta.';
      return Response.json(
        { error: msg },
        { status: 500, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
      );
    }
  }

  return null;
}

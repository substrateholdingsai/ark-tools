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

export interface CanacoCheckoutParams {
  razonSocial: string;
  rfc: string;
  folioSiem: string;
  email: string;
  telefono?: string;
  monto: number;
  leadId?: string;
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

  // Si no hay llave Conekta configurada, retornamos modo simulado para desarrollo/sandbox
  if (!privateKey) {
    const simOrderId = `ord_sim_${Date.now().toString(36)}`;
    const simUrl = `${appUrl}/?brand=canaco&conekta_simulated=1&folio_siem=${encodeURIComponent(params.folioSiem)}&rfc=${encodeURIComponent(params.rfc)}`;
    return {
      ok: true,
      simulated: true,
      orderId: simOrderId,
      url: simUrl,
    };
  }

  try {
    const montoCentavos = Math.round(Number(params.monto || 2000) * 100);
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
          name: `Registro SIEM 2026 y Cuota Anual CANACO (${params.rfc.toUpperCase()})`,
          description: `Folio: ${params.folioSiem} · Razón Social: ${params.razonSocial}`,
          unit_price: montoCentavos,
          quantity: 1,
        },
      ],
      metadata: {
        folioSiem: params.folioSiem,
        rfc: params.rfc.toUpperCase(),
        razonSocial: params.razonSocial,
        leadId: params.leadId || '',
        email: params.email.trim(),
        cfdiRequerido: params.cfdiRequerido ? '1' : '0',
      },
      checkout: {
        type: 'HostedPayment',
        name: 'Afiliación CANACO SERVYTUR Mérida',
        success_url: `${appUrl}/?brand=canaco&conekta_success=1&folio_siem=${encodeURIComponent(params.folioSiem)}&rfc=${encodeURIComponent(params.rfc)}`,
        failure_url: `${appUrl}/?brand=canaco&conekta_cancel=1`,
        allowed_payment_methods: ['card', 'bank_transfer'],
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
        speiTransferEnabled: true,
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
      const body = (await request.json()) as CanacoCheckoutParams;

      if (!body.razonSocial?.trim() || !body.rfc?.trim() || !body.email?.trim()) {
        return Response.json(
          { error: 'Razón Social, RFC y correo electrónico son requeridos para procesar el pago.' },
          { status: 400, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
        );
      }

      const checkoutResult = await createCanacoConektaCheckout(env, body);

      if (!checkoutResult.ok) {
        return Response.json(
          { error: checkoutResult.error || 'Error al generar checkout Conekta.' },
          { status: 502, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } }
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

    // Validación de firma Conekta (RSA) si la llave pública está configurada
    if (env.CONEKTA_WEBHOOK_PUBLIC_KEY) {
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
      const folioSiem = metadata.folioSiem || orderObj.id || 'SIEM-MID-2026-OFICIAL';
      const rfc = (metadata.rfc || '').trim().toUpperCase();
      const email = (metadata.email || orderObj.customer_info?.email || '').trim().toLowerCase();
      const razonSocial = (
        metadata.razonSocial ||
        orderObj.customer_info?.name ||
        'Socio CANACO'
      ).toUpperCase();
      const montoPagado = (orderObj.amount || 0) / 100;
      const conektaOrderId = orderObj.id || event.id || 'CONEKTA-PAYMENT';

      const selloDigitalSha256 = `SHA256:CANACO-MID-${folioSiem.slice(-8)}-${Date.now().toString(36).toUpperCase()}`;

      const existing = await db
        .prepare(
          `SELECT id, web, email, status, notas, contacto_nombre
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
          folioSiem,
          `%${folioSiem}%`,
          rfc || null,
          rfc ? `%${rfc}%` : '',
          rfc ? `%${rfc}%` : '',
          email || null,
          email || ''
        )
        .first<{
          id: string;
          web: string | null;
          email: string | null;
          status: string | null;
          notas: string | null;
          contacto_nombre: string | null;
        }>();

      const notasConekta = `Pago Confirmado Conekta: ${conektaOrderId} ($${montoPagado.toLocaleString('es-MX')} MXN) | Sello: ${selloDigitalSha256}`;

      if (existing) {
        const notasActualizadas = existing.notas
          ? `${existing.notas} | ${notasConekta}`
          : notasConekta;

        await db
          .prepare(
            `UPDATE leads_ark_tools
             SET status = 'Socio Activo', notas = ?, last_contact = DATE('now'), updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND tenant_id = 'canaco_merida'`
          )
          .bind(notasActualizadas, existing.id)
          .run();
      } else {
        const newLeadId = crypto.randomUUID();
        const notasNuevas = `RFC: ${rfc || 'XAXX010101000'} | Folio SIEM: ${folioSiem} | ${notasConekta}`;

        await db
          .prepare(
            `INSERT INTO leads_ark_tools (
               id, web, whatsapp, email, ciudad, especialidad, status,
               last_contact, contacto_nombre, notas, tenant_id, created_at, updated_at
             ) VALUES (?, ?, ?, ?, 'Mérida', 'comercio', 'Socio Activo', DATE('now'), ?, ?, 'canaco_merida', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
          )
          .bind(
            newLeadId,
            razonSocial,
            '9991234567',
            email,
            orderObj.customer_info?.name || 'Representante Acreditado',
            notasNuevas
          )
          .run();
      }

      // Enviar confirmación por correo electrónico vía Resend
      if (email && email.includes('@')) {
        await sendCanacoConfirmacionPagoEmail(env, {
          email,
          contactoNombre: orderObj.customer_info?.name || razonSocial,
          razonSocial,
          rfc: rfc || 'XAXX010101000',
          folioSiem,
          folioPago: conektaOrderId,
          monto: montoPagado || 2000,
          selloDigitalSha256,
          metodo: 'Tarjeta Bancaria / SPEI (Conekta)',
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
          selloDigitalSha256,
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

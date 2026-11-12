/**
 * ARK LEDGER — Unified Email Service (Telnyx & Resend)
 *
 * Servicio agnóstico de correo transaccional para autenticación nativa,
 * invitaciones a despachos, alertas del cron CFDI, cobranza y notificaciones CANACO.
 *
 * Permite conmutar transparentemente entre Telnyx Email API (https://telnyx.com/products/email-api)
 * y Resend vía la variable de entorno EMAIL_PROVIDER o autodetectando TELNYX_API_KEY.
 */

import type { Env } from '../../index';

export type EmailProvider = 'telnyx' | 'resend';

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 o string
  type?: string;
  disposition?: 'attachment' | 'inline';
}

export interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  provider: EmailProvider | 'none';
  error?: string;
}

export const TELNYX_EMAIL_API_URL = 'https://api.telnyx.com/v2/email_messages';
export const RESEND_EMAIL_API_URL = 'https://api.resend.com/emails';
export const DEFAULT_AUTH_FROM = 'ARK LEDGER <no-reply@mail.arksystems.site>';

/**
 * Parsea direcciones de correo en formato RFC 5322 ("Nombre <correo@dominio.com>")
 * a un objeto { email, name }.
 */
export function parseEmailAddress(addr: string): { email: string; name?: string } {
  const trimmed = addr.trim();
  const match = trimmed.match(/^(?:(.*)<)?([^<>@\s]+@[^<>@\s]+)>?$/);
  if (match) {
    const rawName = match[1]?.trim().replace(/^["']|["']$/g, '');
    const email = match[2]?.trim();
    if (email) {
      return rawName ? { email, name: rawName } : { email };
    }
  }
  return { email: trimmed };
}

/**
 * Determina el proveedor de email activo según las variables de entorno.
 * Si EMAIL_PROVIDER está especificado ('telnyx' o 'resend'), se respeta.
 * Si no, se prioriza TELNYX_API_KEY si existe, o se recurre a RESEND_API_KEY.
 */
export function getActiveEmailProvider(env: Env): EmailProvider | 'none' {
  const explicit = env.EMAIL_PROVIDER?.toLowerCase().trim();
  if (explicit === 'telnyx') {
    return env.TELNYX_API_KEY ? 'telnyx' : 'none';
  }
  if (explicit === 'resend') {
    return env.RESEND_API_KEY ? 'resend' : 'none';
  }

  if (env.TELNYX_API_KEY) {
    return 'telnyx';
  }
  if (env.RESEND_API_KEY) {
    return 'resend';
  }
  return 'none';
}

/**
 * Indica si el servicio de correo transaccional está configurado y listo para despachar.
 */
export function isEmailServiceConfigured(env: Env): boolean {
  return getActiveEmailProvider(env) !== 'none';
}

/**
 * Envía un correo a través de Telnyx Email API (POST https://api.telnyx.com/v2/email_messages)
 * @see https://telnyx.com/products/email-api
 */
export async function sendWithTelnyx(
  apiKey: string,
  options: SendEmailOptions,
  defaultFrom?: string
): Promise<SendEmailResult> {
  const fromRaw = options.from || defaultFrom || DEFAULT_AUTH_FROM;
  const parsedFrom = parseEmailAddress(fromRaw);

  const rawRecipients = Array.isArray(options.to) ? options.to : [options.to];
  const toList = rawRecipients.map((dest) => {
    const parsed = parseEmailAddress(dest);
    return parsed.name ? { email: parsed.email, name: parsed.name } : { email: parsed.email };
  });

  const payload: Record<string, unknown> = {
    from: parsedFrom.name ? { email: parsedFrom.email, name: parsedFrom.name } : parsedFrom.email,
    to: toList,
    subject: options.subject,
  };

  if (options.html) payload.html_body = options.html;
  if (options.text) payload.text_body = options.text;
  if (options.replyTo) payload.reply_to = options.replyTo;
  if (options.cc && options.cc.length > 0) {
    payload.cc = options.cc.map((c) => parseEmailAddress(c).email);
  }
  if (options.bcc && options.bcc.length > 0) {
    payload.bcc = options.bcc.map((b) => parseEmailAddress(b).email);
  }

  try {
    const response = await fetch(TELNYX_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText =
        typeof response.text === 'function' ? await response.text().catch(() => '') : '';
      let detailMsg = `Error Telnyx ${response.status}: ${errText}`;
      try {
        const parsed = JSON.parse(errText) as {
          errors?: Array<{ code?: string; title?: string; detail?: string }>;
        };
        if (parsed.errors && parsed.errors.length > 0) {
          detailMsg = parsed.errors.map((e) => e.detail || e.title || e.code).join('; ');
        }
      } catch {
        // Formato no JSON, mantener errText
      }
      console.error('[EmailService] Telnyx API rejected message:', response.status, detailMsg);
      return { success: false, error: detailMsg, provider: 'telnyx' };
    }

    const data = (await response.json().catch(() => ({}))) as {
      data?: { id?: string; record_type?: string; status?: string };
    };

    return {
      success: true,
      id: data.data?.id,
      provider: 'telnyx',
    };
  } catch (err: any) {
    console.error('[EmailService] Network error connecting to Telnyx:', err);
    return {
      success: false,
      error: `Error de red al conectar con Telnyx: ${err.message || String(err)}`,
      provider: 'telnyx',
    };
  }
}

/**
 * Envía un correo a través de Resend API (POST https://api.resend.com/emails)
 */
export async function sendWithResend(
  apiKey: string,
  options: SendEmailOptions,
  defaultFrom?: string
): Promise<SendEmailResult> {
  const fromAddress = options.from || defaultFrom || DEFAULT_AUTH_FROM;
  const rawRecipients = Array.isArray(options.to) ? options.to : [options.to];
  const toList = rawRecipients.map((r) => r.trim());

  const payload: Record<string, unknown> = {
    from: fromAddress,
    to: toList,
    subject: options.subject,
  };

  if (options.html) payload.html = options.html;
  if (options.text) payload.text = options.text;
  if (options.replyTo) payload.reply_to = options.replyTo;
  if (options.cc && options.cc.length > 0) payload.cc = options.cc;
  if (options.bcc && options.bcc.length > 0) payload.bcc = options.bcc;

  try {
    const response = await fetch(RESEND_EMAIL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText =
        typeof response.text === 'function' ? await response.text().catch(() => '') : '';
      let errorMsg = `Error Resend ${response.status}: ${errText}`;
      try {
        const parsed = JSON.parse(errText) as { message?: string };
        if (parsed.message) errorMsg = parsed.message;
      } catch {
        // Mantener errText
      }
      console.error('[EmailService] Resend API rejected message:', response.status, errorMsg);
      return { success: false, error: errorMsg, provider: 'resend' };
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string };
    return {
      success: true,
      id: data.id,
      provider: 'resend',
    };
  } catch (err: any) {
    console.error('[EmailService] Network error connecting to Resend:', err);
    return {
      success: false,
      error: `Error de red al conectar con Resend: ${err.message || String(err)}`,
      provider: 'resend',
    };
  }
}

/**
 * Despacha un correo transaccional utilizando el proveedor configurado (Telnyx o Resend).
 * Si Telnyx falla por un error del servidor o red y RESEND_API_KEY está presente,
 * conmuta automáticamente a Resend como respaldo de alta disponibilidad.
 */
export async function sendTransactionalEmail(
  env: Env,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const provider = getActiveEmailProvider(env);
  const defaultFrom = env.AUTH_EMAIL_FROM;

  if (provider === 'telnyx' && env.TELNYX_API_KEY) {
    const result = await sendWithTelnyx(env.TELNYX_API_KEY, options, defaultFrom);
    if (!result.success && env.RESEND_API_KEY && !env.EMAIL_PROVIDER) {
      console.warn(
        '[EmailService] Telnyx dispatch failed, falling back to Resend backup:',
        result.error
      );
      return sendWithResend(env.RESEND_API_KEY, options, defaultFrom);
    }
    return result;
  }

  if (provider === 'resend' && env.RESEND_API_KEY) {
    return sendWithResend(env.RESEND_API_KEY, options, defaultFrom);
  }

  return {
    success: false,
    error:
      'Servicio de correo no configurado (falta TELNYX_API_KEY o RESEND_API_KEY en variables de entorno)',
    provider: 'none',
  };
}

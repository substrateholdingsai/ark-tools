/**
 * ARK TOOLS — Health Check Periódico de Cuentas Alegra (Cron)
 *
 * Se ejecuta automáticamente cada 6 horas para verificar que los tokens sigan vigentes
 * y alertar oportunamente al usuario si la conexión con el PAC / Alegra se interrumpe.
 */

import type { Env } from '../../index';
import { AlegraClient, AlegraError } from './alegraClient';
import { decryptToken, getAlegraEncryptionSecret } from './credentials';

interface AccountRow {
  tenant_id: string;
  alegra_account_id: string;
  alegra_email: string;
  alegra_token_enc: string;
  alegra_company_name: string | null;
  status: string;
  csd_configured: number;
}

export async function sendAlegraStatusAlertEmail(
  env: Env,
  to: string,
  companyName: string,
  errorReason: string
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    console.warn('[Alegra Cron] Resend no configurado, omitiendo envío de alerta por correo.');
    return;
  }

  const reconnectUrl = `${env.APP_URL || 'https://tools.arksystems.site'}/#cobros`;
  const subject = `Atención requerida: Conexión de Timbrado Alegra interrumpida (${companyName || 'ARK TOOLS'})`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">ARK TOOLS</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Plataforma Integral para Contadores y Asesores Fiscales</p>
  </div>
  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="color: #991b1b; font-size: 18px; margin-top: 0; margin-bottom: 12px;">
      ⚠️ Interrupción en Conexión con Alegra
    </h2>
    <p style="font-size: 15px; line-height: 22px; color: #7f1d1d; margin-top: 0;">
      Detectamos que la cuenta de facturación vinculada a <strong>${companyName || to}</strong> ya no puede comunicarse con Alegra.
    </p>
    <div style="background-color: #ffffff; border-radius: 6px; padding: 12px; margin: 16px 0; border: 1px solid #fca5a5; font-family: monospace; font-size: 13px; color: #b91c1c;">
      ${errorReason}
    </div>
    <p style="font-size: 14px; color: #334155; line-height: 20px;">
      Esto puede deberse a la revocación de la clave API, un cambio de contraseña o vencimiento de la suscripción en Alegra. Mientras persista este estado, la emisión de facturas CFDI estará pausada.
    </p>
    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${reconnectUrl}" style="background-color: #b91c1c; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Reconectar Cuenta en ARK TOOLS
      </a>
    </div>
  </div>
  <div style="text-align: center; font-size: 12px; color: #94a3b8;">
    <p>ARK TOOLS © ${new Date().getFullYear()} — <a href="https://tools.arksystems.site" style="color: #64748b;">tools.arksystems.site</a></p>
  </div>
</div>
`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.AUTH_EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error('[Alegra Cron] Error enviando correo de alerta vía Resend:', err);
  }
}

/**
 * Health check de todas las cuentas activas
 */
export async function checkAlegraAccountsHealth(env: Env): Promise<{
  checked: number;
  updated: number;
  revoked: number;
  errors: number;
}> {
  const db = env.ARK_TOOLS_DB;
  if (!db) {
    console.warn('[Alegra Cron] D1 no disponible, omitiendo health check.');
    return { checked: 0, updated: 0, revoked: 0, errors: 0 };
  }

  const encryptionSecret = getAlegraEncryptionSecret(env);
  const now = Math.floor(Date.now() / 1000);

  let rows: AccountRow[] = [];
  try {
    const result = await db
      .prepare(
        `SELECT tenant_id, alegra_account_id, alegra_email, alegra_token_enc, alegra_company_name, status, csd_configured
         FROM tenant_alegra_accounts
         WHERE status = 'active'`
      )
      .all<AccountRow>();
    rows = result.results || [];
  } catch (err) {
    console.error('[Alegra Cron] Error consultando cuentas activas en D1:', err);
    return { checked: 0, updated: 0, revoked: 0, errors: 1 };
  }

  let updated = 0;
  let revoked = 0;
  let errors = 0;

  for (const account of rows) {
    try {
      const token = await decryptToken(account.alegra_token_enc, encryptionSecret);
      const client = new AlegraClient(account.alegra_email, token);
      const company = await client.getCompany();

      await db
        .prepare(
          `UPDATE tenant_alegra_accounts
           SET last_checked_at = ?,
               last_error = NULL,
               csd_configured = ?,
               alegra_company_name = ?,
               alegra_company_id = ?,
               alegra_rfc = ?,
               updated_at = ?
           WHERE tenant_id = ? AND alegra_account_id = ?`
        )
        .bind(
          now,
          company.csd_configured ? 1 : 0,
          company.name || account.alegra_company_name,
          company.id,
          company.identification,
          now,
          account.tenant_id,
          account.alegra_account_id
        )
        .run();

      updated++;
    } catch (err: any) {
      const statusCode = err instanceof AlegraError ? err.statusCode : 500;
      const isRevoked = statusCode === 401 || statusCode === 403;
      const newStatus = isRevoked ? 'revoked' : 'error';
      const errorMessage = err?.message || 'Error desconocido al conectar con Alegra.';

      try {
        await db
          .prepare(
            `UPDATE tenant_alegra_accounts
             SET status = ?,
                 last_checked_at = ?,
                 last_error = ?,
                 updated_at = ?
             WHERE tenant_id = ? AND alegra_account_id = ?`
          )
          .bind(newStatus, now, errorMessage, now, account.tenant_id, account.alegra_account_id)
          .run();

        if (isRevoked) {
          revoked++;
          await sendAlegraStatusAlertEmail(
            env,
            account.alegra_email,
            account.alegra_company_name || 'Tu cuenta',
            errorMessage
          );
        } else {
          errors++;
        }
      } catch (dbErr) {
        console.error('[Alegra Cron] Error actualizando estado en D1:', dbErr);
        errors++;
      }
    }
  }

  return { checked: rows.length, updated, revoked, errors };
}

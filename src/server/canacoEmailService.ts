/**
 * CANACO SERVYTUR MÉRIDA — Servicio de Notificaciones Transaccionales (Resend)
 *
 * Emite correos institucionales de confirmación de pago, bienvenida de socio activo,
 * entrega de Cédula Oficial Carta con Sello SHA-256 y credenciales de acceso al portal.
 * Diseñado con los tokens patrimoniales del Design System HENEQUÉN.
 */

import type { Env } from '../index';

export interface CanacoConfirmacionPagoEmailParams {
  email: string;
  contactoNombre?: string;
  razonSocial: string;
  rfc: string;
  folioSiem: string;
  folioPago: string;
  monto: number;
  selloDigitalSha256: string;
  metodo?: string;
}

export function buildCanacoConfirmacionEmailHtml(
  params: CanacoConfirmacionPagoEmailParams,
  appUrl = 'https://ledger.arksystems.site'
): string {
  const cedulaUrl = `${appUrl}/?brand=canaco&rfc=${encodeURIComponent(params.rfc)}`;
  const portalUrl = `${appUrl}/?brand=canaco`;
  const nombreDestinatario = params.contactoNombre || params.razonSocial;
  const montoFormateado = Number(params.monto || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación Oficial de Afiliación — CANACO SERVYTUR Mérida</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2C2C; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #FAF6EE; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EFE7D8; overflow: hidden; box-shadow: 0 4px 12px rgba(26, 58, 92, 0.06);">
          
          <!-- Encabezado Institucional HENEQUÉN (Añil) -->
          <tr>
            <td style="background-color: #1A3A5C; padding: 32px 36px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #EFE7D8; margin-bottom: 6px;">
                CÁMARA NACIONAL DE COMERCIO, SERVICIOS Y TURISMO DE MÉRIDA
              </div>
              <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                Cédula y Registro SIEM 2026 Confirmado
              </h1>
              <div style="margin-top: 8px;">
                <span style="display: inline-block; background-color: #B85C38; color: #FFFFFF; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">
                  120 Años Impulsando a Yucatán
                </span>
              </div>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <p style="font-size: 16px; line-height: 24px; color: #1A3A5C; margin: 0 0 16px 0;">
                Estimado(a) <strong>${nombreDestinatario}</strong>,
              </p>
              
              <p style="font-size: 14px; line-height: 22px; color: #555555; margin: 0 0 24px 0;">
                Nos complace informarte que la cuota de <strong>Membresía Anual y Registro SIEM 2026</strong> para tu empresa ha sido acreditada exitosamente. A partir de este momento, cuentas con el respaldo institucional de la Cámara y estatus formal de <strong>Socio Activo</strong>.
              </p>

              <!-- Resumen del Registro -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FBF9F5; border: 1px solid #EFE7D8; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #777777; width: 40%;">Razón Social:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #1A3A5C;">${params.razonSocial}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #777777;">RFC:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #2C2C2C; font-family: monospace;">${params.rfc}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #777777;">Folio SIEM Oficial:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #B85C38; font-family: monospace;">${params.folioSiem}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #777777;">Importe Acreditado:</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #1A3A5C;">$${montoFormateado} MXN</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #777777;">Referencia de Pago:</td>
                  <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #555555; font-family: monospace;">${params.folioPago}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #E5DCCB;">
                    <div style="font-size: 10px; text-transform: uppercase; color: #888888; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px;">Sello Criptográfico Oficial:</div>
                    <div style="font-size: 11px; font-family: monospace; color: #1A3A5C; word-break: break-all; background-color: #FFFFFF; padding: 6px 10px; border-radius: 6px; border: 1px solid #EFE7D8;">
                      ${params.selloDigitalSha256}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Botones de Acción -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${cedulaUrl}" style="display: inline-block; background-color: #B85C38; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; box-shadow: 0 2px 6px rgba(184, 92, 56, 0.25);">
                      📄 Ver y Descargar Cédula Oficial Carta con QR
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background-color: #1A3A5C; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 22px; border-radius: 8px;">
                      🚀 Entrar al Portal de Servicios del Socio
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Recordatorio de Beneficios -->
              <div style="background-color: #FAF6EE; border-left: 4px solid #1A3A5C; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 700; color: #1A3A5C; margin-bottom: 4px;">
                  Beneficios Inmediatos Disponibles:
                </div>
                <ul style="font-size: 12px; color: #555555; margin: 0; padding-left: 18px; line-height: 20px;">
                  <li>Acceso a la Suite Contable y de Nómina 2026 (RESICO, Finiquitos, Facturas CFDI 4.0).</li>
                  <li>Cédula oficial con validación pública QR ante inspecciones de la Secretaría de Economía.</li>
                  <li>Tarifas preferenciales en cursos de capacitación y renta de salones camerales.</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Pie Institucional -->
          <tr>
            <td style="background-color: #F5EFE4; border-top: 1px solid #EFE7D8; padding: 24px 36px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #1A3A5C; margin-bottom: 4px;">
                CANACO SERVYTUR MÉRIDA
              </div>
              <div style="font-size: 11px; color: #777777; line-height: 16px;">
                Av. Itzaes No. 273, Col. García Ginerés, C.P. 97070, Mérida, Yucatán.<br>
                Tel: (999) 925 3060 · Correo: <a href="mailto:afiliaciones@canacomerida.com.mx" style="color: #1A3A5C; text-decoration: underline;">afiliaciones@canacomerida.com.mx</a>
              </div>
              <div style="margin-top: 14px; font-size: 10px; color: #999999;">
                Desarrollado con tecnología de Ark Systems (Substrate Holdings LLC).
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendCanacoConfirmacionPagoEmail(
  env: Env,
  params: CanacoConfirmacionPagoEmailParams
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!env.RESEND_API_KEY) {
    console.warn('[CANACO Email] RESEND_API_KEY no configurado en entorno.');
    return { success: false, error: 'RESEND_API_KEY no configurado' };
  }

  if (!params.email || !params.email.includes('@')) {
    return { success: false, error: 'Correo de destinatario inválido' };
  }

  const fromAddress = env.AUTH_EMAIL_FROM || 'CANACO Mérida <afiliaciones@canacomerida.com.mx>';
  const htmlContent = buildCanacoConfirmacionEmailHtml(params, env.APP_URL);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.email.trim()],
        subject: `¡Bienvenido a CANACO Mérida! Tu Cédula Oficial SIEM 2026 está activa (${params.rfc})`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[CANACO Email] Resend API error:', res.status, errText);
      return { success: false, error: `Error Resend ${res.status}: ${errText}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('[CANACO Email] Fallo de red al contactar Resend:', err);
    return { success: false, error: err.message };
  }
}

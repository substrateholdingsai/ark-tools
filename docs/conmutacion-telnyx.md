# Guía de Conmutación a Telnyx Email API

Este documento detalla la arquitectura y el procedimiento operativo para conmutar el despacho de correos transaccionales de **ARK LEDGER** a **Telnyx Email API** (`https://telnyx.com/products/email-api`) tan pronto inicie el tráfico real de usuarios.

---

## 1. Arquitectura del Servicio Unificado de Email

Toda la emisión de correos transaccionales (autenticación, confirmación de cuentas, recuperación de contraseñas, invitaciones a despachos, alertas de salud de PAC/Alegra, propuestas comerciales y notificaciones CANACO) se centraliza en el módulo:

```
src/server/email/emailService.ts
```

### Proveedores soportados

| Proveedor  | Endpoint                                        | Cabecera Auth                            | Formato Payload                                                        |
| :--------- | :---------------------------------------------- | :--------------------------------------- | :--------------------------------------------------------------------- |
| **Telnyx** | `POST https://api.telnyx.com/v2/email_messages` | `Authorization: Bearer <TELNYX_API_KEY>` | JSON con `from`, `to`, `subject`, `html_body`, `text_body`, `reply_to` |
| **Resend** | `POST https://api.resend.com/emails`            | `Authorization: Bearer <RESEND_API_KEY>` | JSON con `from`, `to`, `subject`, `html`, `text`, `reply_to`           |

---

## 2. Estrategia de Conmutación y Alta Disponibilidad

El sistema resuelve el proveedor activo mediante la función `getActiveEmailProvider(env)` con la siguiente jerarquía:

1. **Fijación explícita (opcional):**
   - Si `EMAIL_PROVIDER = "telnyx"`, despacha vía Telnyx si `TELNYX_API_KEY` existe.
   - Si `EMAIL_PROVIDER = "resend"`, despacha vía Resend si `RESEND_API_KEY` existe.
2. **Autodetección inteligente:**
   - Si no se define `EMAIL_PROVIDER`:
     - Si `TELNYX_API_KEY` está presente en el entorno, **Telnyx toma la prioridad automáticamente**.
     - Si solo `RESEND_API_KEY` está presente, continúa en Resend.
3. **Respaldo de Alta Disponibilidad (Fallback):**
   - Si Telnyx está activo pero experimenta un fallo temporal (HTTP 5xx o timeout) y `RESEND_API_KEY` también está presente en el Worker, el sistema intenta automáticamente el despacho por Resend para asegurar que ningún correo de usuario se pierda.

---

## 3. Checklist de Activación en Producción (Telnyx)

Cuando comience el tráfico de usuarios reales, sigue estos pasos:

### Paso 1: Configurar el Dominio en el Portal de Telnyx

1. Inicia sesión en [Telnyx Portal](https://portal.telnyx.com/#/app/email/domains).
2. Agrega el dominio de envío (`mail.arksystems.site` o `arksystems.site`).
3. Da de alta los registros DNS en Cloudflare DNS:
   - **SPF:** `v=spf1 include:mail.telnyx.com ~all` (o el indicado por Telnyx).
   - **DKIM:** Registros CNAME / TXT provistos por el portal.
   - **DMARC:** `v=DMARC1; p=none; rua=mailto:dmarc@arksystems.site`.
4. Verifica el dominio en el portal hasta que el estatus sea `Verified`.

### Paso 2: Generar la Clave API de Telnyx

1. En el portal de Telnyx, dirígete a **API Keys**.
2. Genera una nueva API Key para producción con permisos de **Email API**.
3. Copia el token generado (ejemplo: `KEY018...`).

### Paso 3: Asignar el Secreto en Cloudflare Workers

Ejecuta en la terminal del proyecto:

```bash
# Para el entorno de producción
pnpm exec wrangler secret put TELNYX_API_KEY --env production

# Para el entorno de staging (opcional para pruebas previas)
pnpm exec wrangler secret put TELNYX_API_KEY --env staging
```

Pega la clave API de Telnyx cuando el CLI lo solicite.

### Paso 4 (Opcional): Forzar el Proveedor Explícitamente

Si deseas fijar explícitamente el proveedor sin depender de la autodetección, puedes agregar en `wrangler.toml` bajo `[env.production.vars]`:

```toml
EMAIL_PROVIDER = "telnyx"
```

O asignarlo como variable de entorno dinámicamente:

```bash
pnpm exec wrangler secret put EMAIL_PROVIDER --env production
# Ingresar: telnyx
```

### Paso 5: Verificación en Vivo

1. Accede al panel de administración en `/admin` (Super Admin).
2. Verifica en `Salud del Sistema` que `emailProvider` reporte `telnyx` y `emailConfigured` sea `true`.
3. Envía un correo de prueba de invitación o propuesta para validar la entrega y revisar el ID asignado por Telnyx (`data.id`).

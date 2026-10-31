# Plan — Remoción de Stripe + Implementación de Conekta

**Objetivo:** Reemplazar el riel de cobranza CANACO SERVYTUR Mérida (Stripe Connect) por
Conekta (Orders + Checkout hospedado), manteniendo la activación automática de socios SIEM
en D1 y el envío de CFDI por correo vía Resend.

**Alcance actual del riel Stripe:**

- `src/server/canacoStripeService.ts` (`verifyStripeSignature`, `createCanacoStripeCheckout`,
  `handleCanacoStripeApiRequest`)
- `src/index.ts` (Env: `STRIPE_*`, ruteo `/api/canaco/stripe/*`)
- `src/components/canaco/VentanillaAfiliacionModal.tsx` (fetch `/api/canaco/stripe/create-checkout`,
  query params `stripe_*`)
- `src/server/canacoStripeService.test.ts`
- `.dev.vars.example` (comentarios `STRIPE_*`)

---

## 1. Inventario y decisiones de arquitectura

| Concepto Stripe                            | Equivalente Conekta                                         | Nota                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY` (Bearer)               | `CONEKTA_PRIVATE_KEY` (Bearer)                              | Header `Authorization: Bearer key_...` + `Accept: application/vnd.conekta-v2.3.0+json`                           |
| `STRIPE_WEBHOOK_SECRET` (HMAC-SHA256)      | `CONEKTA_WEBHOOK_PUBLIC_KEY` (RSA)                          | Verificación RSA SHA-256 sobre el body crudo; header `DIGEST` en base64. One-time setup vía `POST /webhook_keys` |
| Checkout Session (`/v1/checkout/sessions`) | Order con `checkout` (`POST /orders`)                       | Devuelve `checkout.url` (HostedPayment)                                                                          |
| Destination Charge a Connected Account     | **Sin equivalente directo**                                 | Conekta no tiene "Connected Accounts" como Stripe. Ver §6 (riesgo)                                               |
| `stripe-signature` header                  | `DIGEST` header                                             | —                                                                                                                |
| `checkout.session.completed` event         | `order.paid` (o `charge.paid`) event                        | —                                                                                                                |
| Metadata en sesión                         | `metadata` a nivel order + `client_reference_id` → metadata | —                                                                                                                |
| Modo simulado si no hay llave              | Mantener (sin `CONEKTA_PRIVATE_KEY`)                        | —                                                                                                                |

**Endpoints Conekta (base `https://api.conekta.io`):**

- Auth: `Authorization: Bearer <private_key>`, `Accept: application/vnd.conekta-v2.3.0+json`,
  `Content-Type: application/json`, `Accept-Language: es`.
- Crear order: `POST /orders`.
- Webhook keys (one-time): `POST /webhook_keys`.

---

## 2. Fase A — Remoción de Stripe

1. **Backend**
   - Eliminar `src/server/canacoStripeService.ts` y `src/server/canacoStripeService.test.ts`.
   - En `src/index.ts`:
     - Quitar import `handleCanacoStripeApiRequest`.
     - Quitar bloque de ruteo `/api/canaco/stripe/*`.
     - Quitar campos `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CANACO_ACCOUNT_ID`,
       `STRIPE_PLATFORM_FEE_PERCENT` del interface `Env`.
   - Retirar secretos en Cloudflare: `wrangler secret delete STRIPE_*` (prod/staging).
2. **Frontend**
   - `VentanillaAfiliacionModal.tsx`: reemplazar fetch `/api/canaco/stripe/create-checkout` por
     `/api/canaco/conekta/create-checkout`; renombrar query params `stripe_simulated/success/cancel`
     → `conekta_simulated/success/cancel`; actualizar comentarios.
3. **Config**
   - `.dev.vars.example`: eliminar bloque `STRIPE_*`, agregar bloque `CONEKTA_*` (Fase B).
4. **Docs**
   - `docs/map.md`: marcar Sprint 31 riel Stripe como "retirado/migrado a Conekta" (no borrar
     bitácora, añadir nota de migración).

**Gate de verificación Fase A:** `pnpm typecheck && pnpm lint && pnpm test` (los tests de Stripe
se eliminan junto con el módulo; no deben quedar referencias).

---

## 3. Fase B — Implementación de Conekta

### 3.1 Variables de entorno

Agregar a `Env` (`src/index.ts`) y `.dev.vars.example`:

```
CONEKTA_PRIVATE_KEY?: string;          # key_... (sandbox o prod)
CONEKTA_WEBHOOK_PUBLIC_KEY?: string;    # PEM RSA (de /webhook_keys)
CONEKTA_ENVIRONMENT?: string;           # 'sandbox' | 'production'
```

Secrets en producción vía `wrangler secret put`.

### 3.2 Módulo `src/server/canacoConektaService.ts`

Renombrar conceptualmente (nuevo archivo) con:

- `timingSafeEqual` (reutilizar).
- `verifyConektaSignature(rawBody, digestHeader, publicKeyPem)`:
  - Parsear PEM → SPKI → `crypto.subtle.importKey('spki', ..., {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify'])`.
  - Decodificar `DIGEST` base64 → ArrayBuffer.
  - `crypto.subtle.verify(..., sig, enc.encode(rawBody))`.
  - Sin tolerancia temporal (Conekta no firma timestamp; opcional: validar `created_at` del evento).
- `createCanacoConektaCheckout(env, params)`:
  - Si no hay `CONEKTA_PRIVATE_KEY` → modo simulado (url con `conekta_simulated=1`).
  - `POST https://api.conekta.io/orders` con:
    ```json
    {
      "currency": "MXN",
      "customer_info": { "name", "email", "phone" },
      "line_items": [{ "name": "Registro SIEM 2026 y Cuota Anual CANACO (...)", "unit_price": <centavos>, "quantity": 1 }],
      "metadata": { "folioSiem", "rfc", "razonSocial", "leadId", "email", "cfdiRequerido" },
      "checkout": {
        "type": "HostedPayment",
        "name": "Afiliación CANACO",
        "success_url": "...?brand=canaco&conekta_success=1&folio_siem=...&rfc=...&order_id={ORDER_ID}",
        "failure_url": "...?brand=canaco&conekta_cancel=1",
        "allowed_payment_methods": ["card", "bank_transfer"],
        "expires_at": <now + 1h>
      }
    }
    ```
  - Headers: `Authorization: Bearer <key>`, `Accept: application/vnd.conekta-v2.3.0+json`,
    `Content-Type: application/json`, `Accept-Language: es`.
  - Retornar `{ ok, url: order.checkout.url, orderId: order.id, simulated }`.
- `handleCanacoConektaApiRequest(request, env, corsHeaders)`:
  - Rutas `/api/canaco/conekta/status`, `/create-checkout`, `/webhook`.
  - Webhook: leer body crudo; si `CONEKTA_WEBHOOK_PUBLIC_KEY`, verificar `DIGEST` header;
    parsear evento; aceptar `order.paid` / `charge.paid`; extraer `data.object` (order) metadata,
    `amount` (centavos → /100), customer email; actualizar D1 lead (igual que hoy);
    enviar correo Resend; responder 200 `{ received: true }`.
  - Status: `{ configured, environment, speiTransferEnabled: true }`.

### 3.3 Ruteo (`src/index.ts`)

- Import `handleCanacoConektaApiRequest`.
- Agregar llamada en `handleApiRequest` (antes de `leads`).
- Actualizar interface `Env`.

### 3.4 Frontend (`VentanillaAfiliacionModal.tsx`)

- Endpoint → `/api/canaco/conekta/create-checkout`.
- Query params → `conekta_success/cancel/simulated`.
- Mantener fallback offline.

### 3.5 Tests (`src/server/canacoConektaService.test.ts`)

- Reescribir firma RSA (generar par de llaves en test con `crypto.subtle.generateKey`,
  firmar con private key, verificar con public key) — o mock de `crypto.subtle.verify`.
- Test modo simulado sin llave.
- Test webhook `order.paid` actualiza lead a "Socio Activo".
- Test status.

### 3.6 Config

- `.dev.vars.example`: bloque `CONEKTA_*`.
- `wrangler.toml`: no vars nuevas (secretos). Documentar en README de despliegue.

### 3.7 One-time setup Conekta

- Crear webhook key: `POST https://api.conekta.io/webhook_keys` con private key → guardar
  `public_key` en `CONEKTA_WEBHOOK_PUBLIC_KEY`.
- Registrar webhook en panel Conekta apuntando a
  `https://ledger.arksystems.site/api/canaco/conekta/webhook` para eventos `order.paid`,
  `charge.paid`.

---

## 4. Fase C — Verificación y limpieza

1. `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`.
2. Prueba sandbox: afiliación con tarjeta/SPEI → redirección a `pay.conekta.com` checkout →
   pago con tarjeta de prueba → webhook → lead "Socio Activo" + correo Resend.
3. Verificar `GET /api/canaco/conekta/status`.
4. Actualizar `docs/map.md` (bitácora migración).
5. (Opcional) Renombrar archivos restantes con "stripe" en comentarios.

---

## 5. Riesgos y preguntas abiertas

1. **Connected Accounts / split de fondos:** Stripe Connect enrutaba fondos a la cuenta de
   CANACO y retenía fee de plataforma. Conekta no ofrece equivalente directo de
   "connected account" con destination charges. Opciones:
   - (a) Usar Conekta "child companies" (holding) si CANACO es sub-cuenta.
   - (b) Cobrar a la cuenta principal de la plataforma y liquidar a CANACO manualmente
     (reconciliación bancaria).
   - (c) Configurar CANACO como el merchant principal (su propia cuenta Conekta) y que la
     plataforma solo genere órdenes en su nombre (requiere llaves de CANACO).
     **Decisión requerida antes de implementar.**
2. **Comisión de plataforma:** `STRIPE_PLATFORM_FEE_PERCENT` no tiene equivalente directo;
   definir si se cobra aparte o se absorbe.
3. **Webhook RSA en Workers:** `crypto.subtle` soporta RSASSA-PKCS1-v1_5; verificar que el
   runtime de Workers permita importar SPKI con la llave pública PEM (limpiar headers).
4. **Idempotencia:** Conekta soporta `Idempotency-Key` header; considerar para create order.
5. **Eventos:** confirmar que `order.paid` se dispara para HostedPayment checkout (vs
   `charge.paid`). Probar en sandbox.

---

## 6. Estimación de archivos tocados

| Archivo                                               | Acción                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| `src/server/canacoStripeService.ts`                   | Eliminar / reemplazar por `canacoConektaService.ts` |
| `src/server/canacoStripeService.test.ts`              | Eliminar / reemplazar                               |
| `src/index.ts`                                        | Env + ruteo                                         |
| `src/components/canaco/VentanillaAfiliacionModal.tsx` | Endpoints + query params                            |
| `.dev.vars.example`                                   | Vars                                                |
| `docs/map.md`                                         | Bitácora                                            |
| `wrangler.toml`                                       | Sin cambios (secretos por CLI)                      |

---

## 7. Orden de ejecución recomendado

A (remoción) → B.2/B.3 (backend) → B.4 (frontend) → B.5 (tests) → C (verificación).
No desplegar a producción hasta validar webhook en sandbox.

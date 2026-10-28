# Instructivo — Generador de Enlaces de Pago Clip / SPEI (`spei`)

## ¿Qué es?

Generador de enlaces de cobro con Clip Checkout que permite a contadores cobrar honorarios, declaraciones y asesoría; el cliente paga con tarjeta u OXXO. Calcula comisiones en tiempo real (3.6% + IVA y sobretasas MSI).

## ¿Cómo lo hace?

1. Ingresar monto, concepto, datos del cliente y opciones (OXXO, expiración, MSI).
2. Calcular comisión en tiempo real.
3. Solicitar checkout a `/api/clip/checkout` (fallback demo si falla la red).
4. Mostrar link generado.
5. Compartir por WhatsApp (mensaje prellenado) y guardar en historial (localStorage, máx. 50).

Entrada: `ClipCheckoutPayload`. Salida: `ClipCheckoutResult` (id, URL, monto, estado, is_mock).

Exportaciones (`index.ts`): componente `GeneradorSPEI`, tipos (`ClipCheckoutPayload`, `ClipCheckoutResult`, `ComisionClip`, `LinkCobroGuardado`) y funciones de `clipClient` (`calcularComisionClip`, `crearLinkPagoClip`, `validarSolicitudCobro`, `generarMensajeWhatsApp`, `formatearMXN`).

## ¿Para qué sirve?

Cobrar servicios contables con link de pago seguro, transparentar comisión y neto a recibir, compartir por WhatsApp en un clic y llevar historial de cobros.

Archivos clave: `GeneradorSPEI.tsx`, `index.ts`, `types.ts`, `lib/clipClient.ts`, `components/` (`FormularioCobro`, `DesgloseComisionCard`, `LinkGeneradoCard`, `HistorialCobrosTable`).

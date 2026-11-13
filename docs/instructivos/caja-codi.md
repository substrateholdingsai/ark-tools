# Instructivo — Cobro con CoDi — Ark Caja (`caja-codi`)

## ¿Qué es?

Enlace externo a **Ark Caja** (`https://caja.arksystems.site`), la plataforma de cobros de Ark Systems. Desde ARK LEDGER no se procesan pagos: este cuadrado solo abre Caja en una pestaña nueva para que el comercio o despacho cobre con CoDi a través del motor **Pey**.

## ¿Cómo funciona el círculo de cobro?

1. **Ledger → Caja:** Desde el Dashboard de ARK LEDGER, sección "Cobros & Finanzas", hacer clic en la tarjeta "Cobro con CoDi — Ark Caja". Se abre `https://caja.arksystems.site/` en una pestaña nueva. Si se conoce el ID del merchant (tenant/despacho), se pasa como `?m=<merchant_id>` para que Caja pre-llene el comercio.
2. **Caja cobra con CoDi:** En Caja, generar un QR de CoDi en mostrador. El cliente escanea y paga desde su app bancaria.
   - Límite seguro: **$8,000 MXN por operación CoDi**.
   - Si el monto supera $8,000 MXN, usar **SPEI** a la CLABE del merchant (fallback automático en Caja).
   - Nunca fraccionar un pago grande en varios QRs de CoDi para eludir el límite.
3. **Caja → Ledger:** Una vez que Pey confirma el pago en Caja, volver a ARK LEDGER y usar la herramienta **Timbrado de Facturas CFDI 4.0** (modo preview / Sandbox Facturapi) para emitir el CFDI 4.0 del pago cobrado. Noah NO cobra, NO genera QR, NO llama a Pey.

## Límites y alcances

| Concepto                         | Valor / regla                                                          |
| -------------------------------- | ---------------------------------------------------------------------- |
| Límite seguro CoDi por operación | $8,000 MXN                                                             |
| Tope regulatorio CoDi            | 1,500 UDIS (~$12,500–$13,200 MXN)                                      |
| Fallback SPEI                    | Montos > $8,000 MXN a CLABE del merchant                               |
| Facturación                      | CFDI 4.0 vía Facturapi en ARK LEDGER Timbrado (preview_only / Sandbox) |
| Tarjetas, Bitcoin, efectivo      | No aplican desde este cuadrado — son funciones de Caja, no de Ledger   |

## ¿Qué NO hace este enlace?

- No cobra directamente (Ledger no tiene motor CoDi).
- No genera QR de CoDi (lo hace Caja).
- No llama a Pey.
- No llama a Facturapi.
- No escribe en D1, no sella, no timbra CFDI.

## Archivos clave

- Cuadrado en `src/App.tsx` (sección Cobros & Finanzas).
- Entrada de catálogo en `src/data/catalogo-herramientas.ts` (`id: caja-codi`, `type: external_link`).
- Preview en `src/server/staypuft/staypuftConnector.ts` (`external_link`, `writes: 0`, `stamped: false`, `sealed: false`).

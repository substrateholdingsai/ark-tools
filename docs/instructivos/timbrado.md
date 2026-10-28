# Instructivo — Timbrado de Facturas CFDI 4.0 vía Alegra / Quadrum PAC (`timbrado`)

## ¿Qué es?

Herramienta de cobros que permite emitir y timbrar comprobantes CFDI 4.0 delegando la certificación al PAC Quadrum a través de Alegra, sin salir de ARK LEDGER. Soporta multi-empresa (varias cuentas Alegra por despacho) y CSD.

## ¿Cómo lo hace?

1. Conectar cuenta Alegra (email + token API, cifrado AES-GCM) y confirmar CSD.
2. Seleccionar empresa emisora.
3. Capturar datos del receptor (RFC, CP, régimen, uso CFDI, email; autollenado desde Expediente Único).
4. Agregar conceptos/partidas (clave SAT, unidad, cantidad, precio, IVA).
5. Elegir método/forma de pago y observaciones.
6. Emitir y timbrar. Salida: UUID (folio fiscal), XML sellado y PDF; historial de facturas emitidas.

Estado gestionado por el hook `useAlegra` (cuentas, facturas, loading, submitting, error, banner de atención). No hay `index.ts`/`types.ts` dedicados (tipos en `@/lib/apiClient`).

## ¿Para qué sirve?

Facturar honorarios contables/asesoría/cobranzas con sello digital ante el SAT en tiempo real, gestionar múltiples razones sociales y descargar comprobantes.

Archivos clave: `TimbradoFacturas.tsx`, `useAlegra.ts`, `components/AlegraConnectModal.tsx`. Tests: `TimbradoFacturas.test.tsx`.

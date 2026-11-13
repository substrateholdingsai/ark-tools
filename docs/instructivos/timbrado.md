# Instructivo — Timbrado de Facturas CFDI 4.0 vía Facturapi v2 (`timbrado`)

## ¿Qué es?

Herramienta de cobros que permite emitir y pre-validar comprobantes CFDI 4.0 mediante **Facturapi v2** (`https://www.facturapi.io/v2`) sin salir de ARK LEDGER. En producción opera en modo `preview_only` / Sandbox SAT (CSD de prueba `EKU9003173C9`); el timbrado real en producción permanece deshabilitado hasta formalizar acuerdos de distribución con ATEB (precios de distribuidor firmados por escrito). Soporta multi-empresa (varias organizaciones Facturapi por despacho).

## ¿Cómo lo hace?

1. Conectar cuenta Facturapi v2 (Secret Key `sk_test_...` para Sandbox SAT o `sk_live_...` — **`sk_live_` está deshabilitado (preview_only), no se timbrará en vivo**, cifrada con AES-GCM) y confirmar CSD.
2. Seleccionar empresa emisora.
3. Capturar datos del receptor (RFC, CP, régimen, uso CFDI, email; autollenado desde Expediente Único).
4. Agregar conceptos/partidas (clave SAT, unidad, cantidad, precio, IVA).
5. Elegir método/forma de pago y observaciones.
6. Emitir y timbrar (Sandbox / preview). Salida: UUID (folio fiscal), XML sellado y PDF; historial de facturas emitidas.

Estado gestionado por el hook `useAlegra` (nombre técnico interno por compatibilidad retroactiva con rutas `/api/alegra/*` y tablas D1; tipos en `@/lib/apiClient`).

## ¿Para qué sirve?

Preparar y pre-validar facturas de honorarios contables/asesoría/cobranzas conforme al Anexo 20 CFDI 4.0, gestionar múltiples razones sociales en Sandbox SAT y descargar comprobantes XML/PDF.

Archivos clave: `TimbradoFacturas.tsx`, `useAlegra.ts` (alias interno), `components/AlegraConnectModal.tsx` (modal Facturapi). Tests: `TimbradoFacturas.test.tsx`.

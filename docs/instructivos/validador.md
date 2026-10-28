# Instructivo — Validador y Auditor de XMLs (`validador`)

## ¿Qué es?

Auditor fiscal de CFDI 3.3/4.0 que valida estructura, vigencia de versión, timbrado (UUID, sellos, certificado), datos fiscales (RFC emisor/receptor, CP y régimen receptor en 4.0, UsoCFDI), congruencia PPD/PUE, cuadratura aritmética (Total = Subtotal − Descuento + Traslados − Retenciones, tolerancia $1) y moneda/tipo de cambio. Emite dictamen con score 0–100 y estatus (aprobado/advertencia/rechazado).

## ¿Cómo lo hace?

1. Carga de XMLs.
2. Validación regla por regla (`validarCFDI`) generando `ReglaAuditoria[]` con código, categoría, severidad y fundamento legal.
3. Cómputo de errores/advertencias/éxitos y score.
4. Estatus general.
5. Resumen del lote (`calcularResumenAuditoria`).
6. Exportación de dictamen a CSV (`generarCSVDictamenes`/`descargarCSVDictamenes`).

Entrada: archivos `.xml`. Salida: `DictamenCFDI[]` + `ResumenAuditoriaLote` y CSV de dictamen.

## ¿Para qué sirve?

Garantizar deducibilidad de comprobantes, detectar errores fiscales/aritméticos y generar papeles de trabajo de auditoría (Anexo 20 RMF).

Archivos clave: `index.ts`, `types.ts`, `ValidadorXML.tsx`, `lib/validadorCFDI.ts`, `lib/exportarDictamen.ts`, `components/*` (ResumenAuditoriaCard, ListaDictamenes, ScoreGauge); reutiliza `DropZoneXML` de xml-excel.

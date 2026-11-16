# Instructivo — Validador y Auditor de XMLs (`validador`)

## ¿Qué es?

Revisión interna de XML bien formado para CFDI 3.3/4.0. El motor ejecuta 15 códigos de regla en cinco categorías: estructura, vigencia, timbre, fiscal y aritmética. Revisa formato del RFC, presencia de UUID/sellos/certificado, algunos campos fiscales, PUE/PPD, moneda y consistencia aritmética.

No consulta listas del SAT, no valida el XSD oficial, no verifica firmas criptográficas y no garantiza deducibilidad. Los RFC se revisan por formato; sellos y certificado, solo por presencia.

## ¿Cómo lo hace?

1. La carga de archivos de la interfaz se lee con `FileReader` y se valida localmente; no sube el XML.
2. `validarCFDI` parsea XML bien formado con `saxes` y genera `ReglaAuditoria[]`.
3. Las reglas se evalúan con severidad error/advertencia/éxito. `ARIT-01` coteja el total global y los traslados con una tolerancia interna de $1.00.
4. Se genera un score y estatus internos; no son certificación SAT ni garantía de deducibilidad.
5. Se consolida el lote (`calcularResumenAuditoria`) y se exportan todas las reglas a CSV.

**Preview del conector:** ejecuta la validación en el Worker de Ark. El XML se envía al servidor para validarlo y no se persiste. La validación local en el navegador (carga de archivos) no sube el XML. Preview requiere `xmlContent` no vacío y acepta `fileName` opcional; no completa campos faltantes con el XML demo.

Entrada UI: archivos `.xml` (hasta 200 archivos acumulados; no hay límite de bytes por archivo aplicado por el componente). Entrada Preview: `xmlContent` requerido y `fileName` opcional; no hay límite de bytes específico de la aplicación, así que aplican los límites de la plataforma. Salida: `DictamenCFDI[]`, `ResumenAuditoriaLote` y CSV BOM UTF-8 con todas las reglas, sus códigos, categorías, severidades, descripciones y fundamentos disponibles.

## Score y alcance

El score es `max(0, 100 − 30×errores − 10×advertencias)`; si hay errores y el resultado supera 60, se fija en 50. El estatus depende de los conteos, no de un umbral de score: cualquier error implica rechazado; sin errores, cualquier advertencia implica advertencia; sin errores ni advertencias, aprobado. Es una evaluación interna de Ark Ledger, no una certificación del SAT ni una garantía de deducibilidad.

Tolerancia interna de $1.00 en cuadratura y traslados; no es un criterio oficial del SAT.

La herramienta ayuda a revisar formato y consistencia, pero no sustituye la revisión fiscal profesional ni la validación oficial.

Archivos clave: `index.ts`, `types.ts`, `ValidadorXML.tsx`, `lib/validadorCFDI.ts`, `lib/exportarDictamen.ts`, `components/*` (ResumenAuditoriaCard, ListaDictamenes, ScoreGauge); reutiliza `DropZoneXML` de xml-excel.

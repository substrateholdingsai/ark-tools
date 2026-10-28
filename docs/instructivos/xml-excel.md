# Instructivo — Conversor XML a Excel (CFDI 4.0 / 3.3) (`xml-excel`)

## ¿Qué es?

Conversor masivo de CFDI 3.3/4.0 (hasta 200 archivos) a una sábana contable CSV compatible con Excel/Google Sheets. 100% en navegador, sin subir datos.

## ¿Cómo lo hace?

1. Drag & drop o selección de XMLs.
2. Lectura con FileReader.
3. Parseo por regex de cada CFDI (`parsearCFDI`) extrayendo emisor/receptor, UUID (Timbre), impuestos desglosados (IVA 16/8, IVA retenido, ISR retenido, IEPS), conceptos, totales.
4. Detección de duplicados por UUID.
5. Resumen consolidado (`calcularResumenLote`).
6. Exportación CSV con BOM UTF-8 (`generarCSVFacturas`/`descargarCSVFacturas`).

Entrada: archivos `.xml`. Salida: `FacturaCFDI[]` + `ResumenLoteXML` y archivo CSV.

## ¿Para qué sirve?

Extraer de lotes de facturas electrónicas los datos contables/fiscales a Excel para conciliación, contabilidad y análisis, manteniendo privacidad.

Archivos clave: `index.ts`, `types.ts`, `ConversorXML.tsx`, `lib/parserCFDI.ts`, `lib/exportarExcel.ts`, `components/*` (DropZoneXML, ResumenLoteCard, TablaFacturas).

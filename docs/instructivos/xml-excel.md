# Instructivo — Conversor XML a CSV para Excel (CFDI 4.0 / 3.3) (`xml-excel`)

## ¿Qué es?

Extractor masivo de CFDI 3.3/4.0 a un CSV compatible con Excel/Google Sheets, con una fila por comprobante. La interfaz acepta hasta 200 archivos `.xml`, con un máximo de 10 MB (10,485,760 bytes) por archivo; exceder el tamaño excluye ese archivo sin impedir procesar los demás XML aceptados. La carga desde esta pantalla se procesa en el navegador y no envía el XML. El Preview del conector es una ruta distinta: envía el XML al Worker de Ark para extraer datos y no persiste su contenido.

## ¿Cómo lo hace?

1. Drag & drop o selección de XMLs.
2. Lectura con FileReader.
3. Comprobación de XML bien formado con Saxes y extracción por regex (`parsearCFDI`) de emisor/receptor, UUID (Timbre), impuestos desglosados, conceptos y totales. No valida el CFDI contra SAT/XSD ni determina deducibilidad.
4. Omisión de UUID duplicados en los comprobantes ya cargados y dentro del lote; la interfaz informa los archivos omitidos.
5. Resumen consolidado (`calcularResumenLote`).
6. Exportación CSV con BOM UTF-8 (`generarCSVFacturas`/`descargarCSVFacturas`).

Entrada: archivos `.xml` (máximo 200 por lista y 10 MB por archivo). Salida: `FacturaCFDI[]` + `ResumenLoteXML` y CSV UTF-8 con BOM. El CSV contiene una fila por CFDI, no una fila por concepto; las filas con error se excluyen y se conserva su conteo en el resumen.

## ¿Para qué sirve?

Extraer y tabular datos de lotes de facturas electrónicas en un papel de trabajo CSV para conciliación, contabilidad y análisis. No es una presentación, validación o certificación SAT.

Archivos clave: `index.ts`, `types.ts`, `ConversorXML.tsx`, `lib/parserCFDI.ts`, `lib/exportarExcel.ts`, `components/*` (DropZoneXML, ResumenLoteCard, TablaFacturas).

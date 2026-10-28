# Instructivo — Motor de Conciliación Anexo 24 (`anexo24`)

## ¿Qué es?

Herramienta #16 de automatización "cero-captura". Cruza CFDI emitidos contra catálogo de cuentas Anexo 24, valida vigencia con Metadata del SAT y genera pólizas de ingresos (y notas de crédito). Exporta a CSV (BOM UTF-8) y layout Contpaqi/COI.

## ¿Cómo lo hace?

1. Entrada: facturas CFDI (desde xml-excel), archivo TXT de Metadata SAT, XML de catálogo/balanza Anexo 24 (o catálogo estándar del SAT por defecto).
2. `parsearMetadataSAT` → `parsearXMLAnexo24` (o catálogo estándar).
3. `ejecutarConciliacionAnexo24`: por cada CFDI verifica cancelación contra metadata, clasifica bases por tasa (16/8/0/exento), genera partidas (clientes, ingresos, IVA trasladado cobrado/no cobrado PPD, retenciones, devoluciones), crea póliza cuadrada y acumula resumen global.
4. Salida: `ResultadoConciliacion` (resumen, pólizas, partidas, detalle CFDI, descartes, cuentas utilizadas, timestamp).
5. Exportaciones: `exportarConciliacionCSV`, `exportarLayoutContpaqi`.

## ¿Para qué sirve?

Contabilizar automáticamente ingresos CFDI a código agrupador Anexo 24, descartar facturas canceladas (obligatorio por SAT) y exportar pólizas listas para Contpaqi/COI, reduciendo captura manual.

Archivos clave: `ConciliadorAnexo24.tsx`, `types.ts`, `index.ts`, `lib/parserMetadata.ts`, `lib/parserAnexo24.ts`, `lib/motorConciliacion.ts`, `components/DropZoneMulti.tsx`, `components/TablaConciliacion.tsx`, `components/ResumenCuadreDome.tsx`.

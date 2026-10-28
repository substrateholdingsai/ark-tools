# Instructivo — Cierre de Nómina Masivo (Batch DOF) (`cierre-nomina`)

## ¿Qué es?

Procesador de nómina en lote para una empresa. Ingesta una plantilla CSV/TSV de trabajadores, calcula retenciones SAT (ISR + subsidio al empleo), cuotas IMSS obreras, ISN estatal y sueldo neto por colaborador, y genera la Cédula Concentradora oficial sellada con SHA-256 más un layout bancario de dispersión.

## ¿Cómo lo hace?

1. **Configuración**: período, fechas, empresa y estado ISN (tasa).
2. **Importación**: plantilla CSV/TSV con detección automática de delimitador y mapeo flexible de columnas; opción de cargar 5 filas de muestra.
3. **Previsualización/edición** de la tabla de trabajadores.
4. **Ejecución del cierre** (`procesarCierreNomina`): por cada trabajador calcula antigüedad y días de vacaciones (LFT Art. 76), factor de integración y SBC (reutiliza `calcularSBC`), percepciones, ISR/subsidio (reutiliza `calcularISR`), IMSS obrero (reutiliza `calcularIMSS`), ISN estatal, deducciones y neto; acumula totales; convierte el neto total a letras; sella el lote con hash SHA-256 determinista.
5. **Cédula Concentradora** (modal imprimible) con resumen.
6. **Exportación**: CSV de cédula (23 columnas + totales + sello) y layout SPEI de dispersión bancaria (No/Beneficiario/RFC/Monto/Concepto), ambos con BOM UTF-8; archivo descargable en navegador.
7. **Archivo en Expediente Único** del cliente.

Entrada: `TrabajadorFilaInput[]` + `ParametrosCierreNomina`. Salida: cédula concentradora sellada y layout bancario.

## ¿Para qué sirve?

Automatizar el cierre masivo de nómina y generar la cédula concentradora oficial para dispersión bancaria y archivo en el expediente del cliente, con trazabilidad criptográfica (CFF Art. 28).

Archivos clave: `CierreNomina.tsx`, `types.ts`, `index.ts`, `lib/calcularCierreNomina.ts`, `lib/parserPlantilla.ts`, `lib/exportarCierre.ts`, `components/CedulaConcentradoraModal.tsx`.

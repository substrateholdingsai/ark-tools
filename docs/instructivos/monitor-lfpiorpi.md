# Instructivo — Monitor de Actividades Vulnerables LFPIORPI (`monitor-lfpiorpi`)

## ¿Qué es?

Monitor de Actividades Vulnerables LFPIORPI (herramienta #17): ingiere sábanas de cobranza (CSV/TSV), evalúa acumulación móvil de 6 meses por cliente contra umbrales en UMA, clasifica riesgo (Verde/Identificación/Aviso) y sella dictamen con SHA-256 para expediente.

## ¿Cómo lo hace?

1. Ingreso de archivo CSV/TSV (drag & drop o selector) o plantilla de ejemplo; columnas ID cliente/RFC, fecha, monto, concepto.
2. Parser: detecta delimitador, mapea columnas por alias tolerante, normaliza montos y fechas, valida filas.
3. Evaluación: agrupa por cliente, calcula máximo acumulado en ventana móvil de 6 meses, compara contra umbrales (Identificación/Aviso) convertidos a MXN vía UMA vigente, clasifica nivel de riesgo y porcentajes.
4. Salida: tabla semáforo por cliente, resumen KPI, hash SHA-256; opción de archivar dictamen en Expediente Único con papel de trabajo oficial.

Exportaciones: `MonitorLFPIORPI`, tipos, `evaluadorActividadesVulnerables`, `parserCobranza`.

## ¿Para qué sirve?

Detectar clientes que requieren integrar expediente o reportar al SAT/UIF (SPPLD) por actividades vulnerables (arrendamiento, inmobiliario, mutuo, etc.), con trazabilidad criptográfica.

Archivos clave: `MonitorLFPIORPI.tsx`, `index.ts`, `types.ts`, `lib/parserCobranza.ts`, `lib/evaluadorActividadesVulnerables.ts`, componentes `PanelFiltrosVulnerables.tsx`, `ResumenAuditoriaDome.tsx`, `TablaMonitorLFPIORPI.tsx`.

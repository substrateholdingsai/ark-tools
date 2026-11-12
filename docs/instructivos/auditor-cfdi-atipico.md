# Instructivo — Detector de Comportamientos Atípicos en CFDI (`auditor-cfdi-atipico`)

## ¿Qué es?

Herramienta #20 de auditoría forense y detección preventiva de anomalías en comprobantes fiscales digitales CFDI 4.0 y 3.3 (emitidos y recibidos). Opera 100 % en el navegador (local-first con IndexedDB) aplicando 18 reglas deterministas, pruebas estadísticas y cruce contra Metadata del SAT.

## ¿Cómo lo hace?

1. Ingesta: carga masiva de archivos XML individuales o comprimidos en `.zip` (`zipIngestor.ts`) y archivo de Metadata oficial del SAT (`.txt`), o generación de lote sintético de demostración (`generadorDemo.ts`).
2. Configuración de criterios: permite activar/ajustar umbrales y reglas forenses (`CriteriosConfig.tsx`) por contribuyente y ejercicio fiscal (`GestionContribuyentes.tsx`, `indexedDbStorage.ts`).
3. Motor forense (`motorForense.ts` — `evaluarCriteriosForense`): ejecuta pruebas de Ley de Benford (primer dígito), Z-Score (`|Z| > 2.0`), rango intercuartílico (IQR), pagos en efectivo mayores a $2,000 MXN y fraccionamiento (LISR Art. 27 Fracc. III), cancelaciones fuera de plazo (CFF Art. 29-A), alertas EFOS (CFF Art. 69-B), concentración Herfindahl-Hirschman (HHI) y desfases de timbrado (>72 h).
4. Visualización y dictamen: Malla Mensual de 12 meses (`MallaMensual.tsx`), Matriz de Riesgo 5×5 (`MatrizRiesgo5x5.tsx`), Conciliación contra Metadata SAT (`ConciliacionMetadata.tsx`) y Resumen Ejecutivo (`ResumenEjecutivo.tsx`).
5. Exportación: libro Excel `.xlsx` multi-pestaña con hallazgos, malla y papeles de trabajo (`exportarAuditoriaExcel.ts`).

## ¿Para qué sirve?

Detectar preventivamente comportamientos atípicos, operaciones simuladas, errores de timbrado o riesgos de materialidad antes de una revisión electrónica o profunda del SAT, documentando la evidencia en papeles de trabajo periciales.

Archivos clave: `AuditorCFDIAtipico.tsx`, `types.ts`, `index.ts`, `lib/motorForense.ts`, `lib/generadorDemo.ts`, `lib/exportarAuditoriaExcel.ts`, `lib/indexedDbStorage.ts`, `lib/zipIngestor.ts`, `components/MallaMensual.tsx`, `components/MatrizRiesgo5x5.tsx`, `components/ConciliacionMetadata.tsx`, `components/ResumenEjecutivo.tsx`, `components/CriteriosConfig.tsx`, `components/DetalleComprobantesModal.tsx`, `components/GestionContribuyentes.tsx`. Tests: `lib/motorForense.test.ts`.

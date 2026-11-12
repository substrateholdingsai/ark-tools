# Instructivo — Cierre de Nómina Masivo (Batch DOF) (`cierre-nomina`)

## ¿Qué es?

Procesador integral de nómina en lote para empresas y despachos contables. Ingesta plantillas CSV/TSV de trabajadores, calcula simultáneamente retenciones de ISR y subsidio al empleo (SAT), cuotas obreras de seguridad social (IMSS), ISN estatal (32 entidades) y percepciones netas por colaborador.

Genera tres entregables oficiales:

1. **Cédula Concentradora Oficial** sellada con hash determinista SHA-256 (CFF Art. 28).
2. **Layout Bancario de Dispersión** (formato SPEI / transferencia masiva).
3. **Layout Batch IDSE / DISPMAG (IMSS)** en formato plano de **175 caracteres por renglón** para la transmisión directa de avisos afiliatorios al Seguro Social.

## ¿Cómo lo hace?

1. **Configuración del lote**:
   - Definición de período (quincenal, mensual, semanal), fechas de inicio/fin y ejercicio fiscal.
   - Datos de la empresa (Razón Social, RFC, Registro Patronal IMSS).
   - Selección de entidad federativa y tasa del Impuesto Sobre Nómina (ISN).
2. **Importación de plantilla**:
   - Carga de archivo CSV o TSV con autodetección de delimitador (coma, punto y coma, tabulador) y mapeo flexible de columnas.
   - Botón de carga rápida de datos de muestra (5 filas con trabajadores de prueba).
3. **Previsualización y edición**:
   - Tabla interactiva con validación en tiempo real de RFC, CURP, NSS, salario diario y fechas de ingreso.
4. **Motor de procesamiento (`procesarCierreNomina`)**:
   - **Antigüedad y vacaciones**: Calcula años cumplidos y días de vacaciones conforme al Art. 76 LFT (reforma de Vacaciones Dignas).
   - **Factor de integración y SBC**: Determina el Salario Base de Cotización integrando aguinaldo mínimo de 15 días y prima vacacional del 25%, topando el valor máximo a 25 UMA (`TOPE_SBC_25_UMA_2026`).
   - **Retención ISR y Subsidio**: Aplica tarifa oficial del Art. 96 LISR y cálculo de subsidio al empleo.
   - **Cuotas IMSS obrero**: Desglosa prestaciones en especie y dinero, invalidez y vida, cesantía y vejez.
   - **ISN estatal**: Determina el impuesto sobre erogaciones según la entidad configurada.
   - **Neto a pagar**: Totaliza percepciones menos deducciones, genera el importe neto con conversión a letras y sella el lote completo con SHA-256.
5. **Cédula Concentradora**:
   - Modal imprimible con resumen ejecutivo de nómina, importes acumulados y desglose individual por trabajador.
6. **Exportaciones oficiales**:
   - **Cédula Concentradora CSV**: 23 columnas de cálculo más totales y sello criptográfico con BOM UTF-8.
   - **Layout Bancario SPEI**: Archivo CSV de dispersión bancaria (`No`, `Beneficiario`, `RFC`, `Monto`, `Concepto`).
   - **Layout Batch IDSE / DISPMAG (IMSS)**:
     - Archivo de texto plano `.txt` con registros de **175 caracteres exactos por renglón**, estructurado conforme al RACERF del IMSS.
     - Permite generar avisos masivos de **Reingreso / Alta (`08`)**, **Modificación de Salario Integrado (`07`)** y **Baja (`02`)**.
     - Formatea posicionalmente Registro Patronal (11), NSS (11), Apellido Paterno (27), Materno (27), Nombres (27), Salario Diario Integrado con 6 enteros y 2 decimales sin punto implícito, tipo de trabajador, jornada, fecha `DDMMAAAA` y clínica (UMF).
7. **Persistencia**: Registro en el **Expediente Único** del cliente activo en base de datos.

Entrada: `TrabajadorFilaInput[]` + `ParametrosCierreNomina`.  
Salida: Cédula concentradora sellada con SHA-256, Layout SPEI bancario y Layout Batch IDSE / DISPMAG (.txt de 175 caracteres).

## ¿Para qué sirve?

1. Automatizar el cierre masivo periódico de nómina reduciendo horas de cálculo manual a segundos.
2. Garantizar la trazabilidad criptográfica de la contabilidad electrónica ante el SAT (CFF Art. 28).
3. Cumplir con la obligación patronal de presentar avisos afiliatorios ante el IMSS (LSS Art. 15 fracción I) mediante la carga masiva en IDSE / DISPMAG sin recaptura manual.
4. Proveer a la empresa de los archivos listos para dispersión bancaria y la determinación del ISN estatal.

## Archivos clave

- **Interfaz y vistas**: `CierreNomina.tsx`, `types.ts`, `index.ts`, `components/CedulaConcentradoraModal.tsx`.
- **Motor de cálculo y parsing**: `lib/calcularCierreNomina.ts`, `lib/parserPlantilla.ts`, `lib/cruceNominaChecador.ts`.
- **Exportaciones**:
  - `lib/exportarCierre.ts`: Cédula CSV y Layout SPEI.
  - `lib/layoutImssIdse.ts`: Generador del layout batch IDSE de 175 caracteres para el IMSS.

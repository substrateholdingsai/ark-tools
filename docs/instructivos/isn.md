# Instructivo — Calculadora ISN (Impuesto Sobre Nómina) (`isn`)

## ¿Qué es?

Calculadora fiscal 2026 del Impuesto Sobre Erogaciones por Remuneraciones al Trabajo Personal (ISN) para las 32 entidades federativas de México, con tasas y fundamentos oficiales por estado, papel de trabajo general en CSV/Excel y **módulo especializado de Cédula Oficial AAFY (Yucatán 2.50%)** alineado al esquema de formalización tripartita AAFY — SAT — IMSS.

## ¿Cómo lo hace?

1. **Selección de entidad federativa**: Selector de las 32 entidades con tasa vigente y artículo de ley hacendaria local correspondiente.
2. **Determinación de base gravable**:
   - Edición interactiva de la tabla de percepciones (`ConceptoPercepcion[]`) desglosando importes gravados y exentos.
   - Captura directa opcional de base gravable consolidada.
   - Auto-hidratación de nómina base a partir del cliente activo en el Expediente Único (`salario diario × 30`).
3. **Motor de cálculo (`calcularISN`)**:
   - Suma total de percepciones gravables y exentas.
   - Aplica tasa legal de la entidad federativa (`ISN = base × tasa / 100`, redondeo a 2 decimales).
   - Genera el objeto `ResultadoISN` (`baseGravable`, `totalExento`, `totalPercepciones`, `tasa`, `isn`).
4. **Cédula Oficial AAFY (Yucatán — 2.50% LGHY)**:
   - Al seleccionar Yucatán (`tasa = 2.50%`), se habilita la exportación especializada conforme a los **Artículos 21 al 27 de la Ley General de Hacienda del Estado de Yucatán**.
   - Desglosa sueldos, jornales, comisiones, gratificaciones, bonos y premios gravables contra conceptos no objeto o exentos (indemnizaciones por cese, viáticos devengados con comprobante).
   - Emite archivo CSV oficial estructurado con BOM UTF-8 y metadatos de auditoría (periodo, fecha/hora, RFC emisor y número de trabajadores), listo para cotejo en el portal digital de la AAFY.
5. **Exportación general**:
   - Papel de trabajo universal en CSV con BOM UTF-8 para cualquier entidad federativa.

Entrada: `ConceptoPercepcion[]` + `Estado` (+ RFC y razón social del cliente activo opcionales).  
Salida: `ResultadoISN`, Cédula Oficial AAFY en CSV y Papel de Trabajo general.

## ¿Para qué sirve?

1. Determinar con certeza jurídica el ISN mensual estatal a enterar en cualquiera de las 32 entidades federativas.
2. Cumplir con los requerimientos documentales de la **Agencia de Administración Fiscal de Yucatán (AAFY)** en la ventanilla de afiliación y formalización continua.
3. Servir como papel de trabajo auditable que concilie la nómina timbrada en CFDI (SAT) con las bases de cotización de seguridad social (IMSS).

## Archivos clave

- **Interfaz y componentes**: `CalculadoraISN.tsx`, `index.ts`, `types.ts`, `components/EstadoSelector.tsx`, `components/BaseInput.tsx`, `components/PercepcionesTable.tsx`, `components/ResumenISN.tsx`.
- **Librerías de cálculo y exportación**: `lib/calcularISN.ts`, `lib/exportarCSV.ts`, `lib/exportarCedulaAafy.ts`.
- **Catálogo de entidades**: `data/estados.ts` (32 entidades con tasas y fundamentos legales).

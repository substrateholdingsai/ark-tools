# Instructivo — Calculadora ISN (Impuesto Sobre Nómina) (`isn`)

## ¿Qué es?

Calculadora fiscal 2026 del Impuesto Sobre Erogaciones por Remuneraciones al Trabajo Personal (ISN) para las 32 entidades federativas de México, con tasas versionadas por ejercicio, fundamentos oficiales por estado, papel de trabajo general en CSV/Excel y **módulo especializado de Cédula Oficial AAFY (Yucatán 3.75% bruto / 3.0% neto MIPyME 2026)** alineado al esquema de formalización tripartita AAFY — SAT — IMSS.

## Tabla de Tasas Versionadas — Yucatán (LGHY / Decretos 138/2025 y 147/2025)

| Ejercicio / Régimen                | Tasa Bruta | Estímulo      | Tasa Neta | Fundamento Legal                                                               |
| :--------------------------------- | :--------- | :------------ | :-------- | :----------------------------------------------------------------------------- |
| **2025 General**                   | 3.00%      | 0.00%         | 3.00%     | Art. 24 LGHY (Decreto 138/2025, D.O. 26-dic-2025)                              |
| **2026 General (>50 emp.)**        | 3.75%      | 0.00%         | 3.75%     | Art. 24 LGHY (Decreto 632 / 138/2025)                                          |
| **2026 Micro/Pequeña (1–50 emp.)** | 3.75%      | −0.75%        | 3.00%     | Decreto 147/2025 (D.O. 31-dic-2025, Ene–Dic 2026, no acumulable con Art. 27-A) |
| **2026 Gobierno Estatal**          | 4.75%      | No confirmado | 4.75%     | Art. 24 párr. 2 LGHY (3.75% + 1% adicional; estímulo no confirmado)            |

Ejemplo canónico 2026 Pequeña Empresa ($250,000, 15 empleados): **$9,375.00** bruto − **$1,875.00** estímulo = **$7,500.00** neto (tasa efectiva 3.0%).

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
4. **Cédula Oficial AAFY (Yucatán — LGHY + Decreto 147/2025)**:
   - Al seleccionar Yucatán (`YUC`), se habilita la exportación especializada conforme a los **Artículos 21 al 27 de la Ley General de Hacienda del Estado de Yucatán** y **Decreto 147/2025** (tasa bruta 3.75%, estímulo −0.75%, tasa efectiva 3.0% MIPyME, plazo día 10).
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

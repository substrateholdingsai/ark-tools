# Instructivo — Calculadora ISN (Impuesto Sobre Nómina) (`isn`)

## ¿Qué es?

Calculadora 2026 del ISN para las 32 entidades federativas, con tasas oficiales por estado y exportación a Excel/CSV.

## ¿Cómo lo hace?

1. Seleccionar estado (id, nombre, tasa, artículo).
2. Editar tabla de percepciones (gravado/exento) o ingresar base gravable; auto-hidratación desde cliente activo (salario diario × 30).
3. Motor: suma gravados, aplica tasa estatal (`ISN = base × tasa/100`, redondeo a 2 decimales) y muestra base, exentos, total percepciones, tasa e ISN.
4. Exporta CSV con BOM UTF-8.

Entrada: `ConceptoPercepcion[]` + `Estado`. Salida: `ResultadoISN` (baseGravable, totalExento, totalPercepciones, tasa, isn).

## ¿Para qué sirve?

Determinar el ISN estatal a pagar a partir de percepciones de nómina, comparar tasas entre estados y generar papel de trabajo CSV.

Archivos clave: `CalculadoraISN.tsx`, `index.ts`, `types.ts`, `lib/calcularISN.ts`, `lib/exportarCSV.ts`, `data/estados.ts`, componentes `EstadoSelector`, `BaseInput`, `PercepcionesTable`, `ResumenISN`.

# Instructivo — Calculadora de Finiquitos y Liquidaciones LFT (`finiquitos`)

## ¿Qué es?

Calculadora LFT 2026 de finiquito y liquidación laboral (despido/renuncia), con tabla de vacaciones dignas 2023 y tope 2×SMG (Art. 486).

## ¿Cómo lo hace?

1. Recibe fechas de ingreso/baja, salario diario, SDI, días pendientes de vacaciones/aguinaldo, prima vacacional % y flags de indemnización (auto-hidrata desde cliente activo).
2. Valida entrada.
3. Calcula antigüedad (días, años exactos/completos, días del año), vacaciones proporcionales por tabla LFT, aguinaldo proporcional (15 días), prima vacacional (≥25%), prima de antigüedad (12 días/año con tope 2×SMG), e indemnizaciones (90 días y 20 días/año, solo en liquidación).
4. Devuelve totales de finiquito y liquidación con desglose por concepto y fundamentos legales.

Entrada: `EntradaFiniquito`. Salida: `ResultadoCalculo` = `{ok, valor: ResultadoFiniquito}` con antigüedad, vacaciones, salarios, conceptos e importes, totales y `desglose: DesgloseConcepto[]`.

## ¿Para qué sirve?

Calcular y desglosar el pago final al trabajador en finiquito o liquidación por despido injustificado, con fundamento legal por concepto.

Archivos clave: `CalculadoraFiniquitos.tsx`, `index.ts`, `types.ts`, `lib/calcularFiniquito.ts` (incluye `calcularDiasVacacionesPorLey`, `validarEntradaFiniquito`), componentes `ParametrosFiniquitoCard`, `AntiguedadCard`, `DesgloseFiniquitoTable`, `ResultadoFiniquitoCard`.

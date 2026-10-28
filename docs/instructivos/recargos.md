# Instructivo — Calculadora de Actualización y Recargos Fiscales (CFF) (`recargos`)

## ¿Qué es?

Herramienta #18. Calcula efecto inflacionario (INPC, Art. 17-A CFF) y recargos por mora en concepto de indemnización (Art. 21 CFF + Art. 8 LIF, tasa 1.47% mensual). Genera papel de trabajo y cédula oficial imprimible.

## ¿Cómo lo hace?

1. Entrada: `EntradaRecargos` (importe histórico, fecha vencimiento, fecha pago, tasa mensual opcional).
2. `calcularRecargosYActualizacion` → `obtenerFactorActualizacion` (INPC mes anterior al pago / mes anterior al vencimiento, truncado a 4 decimales, sin deflación) → `calcularMesesMora` (meses o fracción) → impuesto actualizado, recargos, total, desglose mes a mes, conversión a letras.
3. Salida: `ResultadoRecargos` con factor detalle, montos, desglose y total en letras.
4. Exportaciones: `exportarRecargosCSV`, `generarResumenWhatsApp`, `descargarArchivo`.

## ¿Para qué sirve?

Liquidar deuda tributaria omitida con actualización por inflación y recargos oficiales, con desglose auditable mes a mes para el contribuyente.

Archivos clave: `CalculadoraRecargos.tsx`, `types.ts`, `index.ts`, `lib/calcularRecargos.ts`, `lib/exportarRecargos.ts`, `components/*`.

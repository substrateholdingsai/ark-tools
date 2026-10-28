# Instructivo — Calculadora de Nómina Rápida 2026 (`nomina`)

## ¿Qué es?

Calculadora individual de sueldo neto para un colaborador. Aplica la tarifa progresiva de ISR 2026 (Anexo 8 RMF) prorrateada por periodicidad, subsidio al empleo e IMSS obrero (Enfermedad y Maternidad, Invalidez y Vida, Cesantía/Vejez), y desglosa deducciones.

## ¿Cómo lo hace?

1. Seleccionar período (diario/semanal/quincenal/mensual).
2. Capturar sueldo bruto, días trabajados y SBC diario (auto-hidrata desde cliente activo).
3. Cálculo reactivo (`useMemo`): `calcularNomina` ajusta sueldo por días trabajados, calcula ISR vía `calcularISR` (convierte base a mensual, busca rango en `TABLA_ISR_MENSUAL`, aplica cuota fija + tasa excedente, aplica subsidio de `TABLA_SUBSIDIO_MENSUAL`, reconvierte al período), calcula IMSS obrero vía `calcularIMSS` (cuotas sobre SBC × días con excedente de 3 UMA), suma deducciones y neto.
4. Muestra resultado neto y desglose de deducciones.

Entrada: `ParametrosNomina`. Salida: resultado de nómina con ISR, subsidio, IMSS y neto.

## ¿Para qué sirve?

Determinar con exactitud el sueldo neto de un colaborador y visualizar el desglose de retenciones ISR e IMSS obrero para nómina rápida.

Archivos clave: `CalculadoraNomina.tsx`, `types.ts`, `index.ts`, `lib/calcularNomina.ts`, `lib/calcularISR.ts`, `lib/calcularIMSS.ts`, `data/tablasISR.ts`, `data/periodos.ts`, `data/cuotasIMSS.ts`, `data/defaults.ts`, `components/*`.

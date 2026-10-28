# Instructivo — Calculadora SBC (Salario Base de Cotización IMSS) (`sbc`)

## ¿Qué es?

Calculadora del Salario Base de Cotización (SBC) conforme a LSS Art. 27 y 28: integra al salario diario las prestaciones (vacaciones, prima vacacional, aguinaldo) mediante factor de integración y aplica topes de mínimo (salario mínimo frontera) y máximo (25 UMA).

## ¿Cómo lo hace?

1. Capturar salario diario, días de vacaciones, prima vacacional (%) y días de aguinaldo (auto-hidrata salario desde cliente activo).
2. Cálculo reactivo: `calcularFactorIntegracion` calcula días de prima vacacional y aportes/365; `calcularResultadoSBC` obtiene SBC bruto = salario × factor y aplica `calcularSBCFinal` (clamp entre salario mínimo y 25 UMA, marcando tipo de tope `max`/`min`/`null`); calcula porcentaje del tope.
3. Muestra factor, SBC bruto/final, tope aplicado, posición en rango IMSS y desglose.

Entrada: `ParametrosSBC`. Salida: resultado SBC con factor y topes.

## ¿Para qué sirve?

Determinar el SBC que se reporta al IMSS para cuotas patronales/obreras, evitando topes indebidos y subdeclaración.

Archivos clave: `CalculadoraSBC.tsx`, `types.ts`, `index.ts`, `lib/calcularSBC.ts`, `data/uma.ts`, `components/*` (ParametrosCard, RangoVisual, DesgloseTable, ResultadoSBC, ExplicacionSBC).

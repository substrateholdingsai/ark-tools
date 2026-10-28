# Instructivo — Calculadora y Cédula RESICO 2026 (`resico`)

## ¿Qué es?

Calculadora y cédula de determinación RESICO 2026 para personas físicas (Arts. 113-E a 113-J LISR, tasas 1%–2.5%) y morales (Arts. 206–215 LISR, flujo de efectivo, 30%), con ISR + IVA, control de tope anual ($3.5M PF / $35M PM) y cédula imprimible con QR.

## ¿Cómo lo hace?

1. El usuario elige tipo de persona y captura ingresos cobrados del mes/acumulados, retenciones, IVA trasladado y acreditable (y para PM: deducciones, PTU, pérdidas, pagos provisionales previos).
2. Motor PF: aplica tarifa mensual por rango de ingresos, calcula ISR causado, acredita retención 1.25% de PM, determina IVA neto (cargo/favor), total a pagar, consumo del tope 3.5M y alertas.
3. Motor PM: calcula utilidad fiscal base (ingresos − deducciones − PTU − pérdidas), ISR al 30% acumulado, acredita pagos provisionales/retenciones, IVA neto y tope 35M.
4. Genera desglose analítico, número a letras, advertencias y exportación CSV/WhatsApp.

Entrada: `EntradaResicoPF` / `EntradaResicoPM`. Salida: `ResultadoResico` = `ResultadoResicoPF | ResultadoResicoPM` (ISR, IVA, total a pagar en letras, tope, desglose, advertencias).

## ¿Para qué sirve?

Determinar mensualmente el pago provisional de ISR e IVA en RESICO, monitorear el tope anual para evitar salida del régimen y generar cédula/papel de trabajo para el expediente.

Archivos clave: `CalculadoraResico.tsx`, `index.ts`, `types.ts`, `lib/calcularResicoPF.ts`, `lib/calcularResicoPM.ts`, `lib/exportarResico.ts`, `data/tablasResico.ts`, componentes `ParametrosResicoCard`, `ResultadoResicoCard`, `DesgloseResicoTable`, `CedulaResicoModal`.

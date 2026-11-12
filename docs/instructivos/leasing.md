# Instructivo — Simulador Fiscal: Leasing vs Crédito vs Contado (`leasing`)

## ¿Qué es?

Comparador financiero y fiscal tripartito de alto valor para despachos contables y directores de finanzas. Evalúa simultáneamente la adquisición de activos empresariales (automóviles utilitarios de combustión, vehículos híbridos/eléctricos, equipo de cómputo/servidores y maquinaria industrial) a través de tres modalidades:

1. **Compra de Contado:** Desembolso inicial íntegro, deducción fiscal vía depreciación anual (MOI topado) y acreditamiento de IVA proporcional.
2. **Crédito Bancario Tradicional:** Financiamiento con enganche inicial, pagos mensuales amortizados (capital + intereses), deducción de depreciación e intereses reales devengados.
3. **Arrendamiento Puro (Leasing):** Desembolso de apertura mínimo, rentas mensuales deducibles como gasto operativo directo (LISR Art. 28 Fracc. XIII), preservación de capital de trabajo y opciones terminales normadas por el CFF.

## Fundamento Legal y Topes Fiscales Vigentes

- **Automóviles de Combustión Interna (Gasolina/Diésel):**
  - **Compra / Crédito:** Monto Original de la Inversión (MOI) deducible topado a **\$175,000 MXN** (LISR Art. 36 Fracc. II), con tasa máxima de depreciación del **25% anual** (LISR Art. 34 Fracc. VI) en un horizonte de 4 años.
  - **Arrendamiento Puro (Leasing):** Renta deducible topada a **\$200.00 MXN diarios** (LISR Art. 28 Fracc. XIII) ≈ **\$6,083.33 MXN mensuales** (\$73,000 MXN anuales).
- **Automóviles Híbridos o Eléctricos (Estímulo Ecológico):**
  - **Compra / Crédito:** MOI deducible topado a **\$250,000 MXN** con depreciación del **25% anual**.
  - **Arrendamiento Puro (Leasing):** Renta deducible topada a **\$285.00 MXN diarios** ≈ **\$8,668.75 MXN mensuales** (\$104,025 MXN anuales).
- **Equipo de Cómputo y Servidores TI:**
  - **Compra / Crédito:** Depreciación del **30% anual** (LISR Art. 34 Fracc. VII).
  - **Leasing:** **100% deducible** de forma acelerada mes a mes como gasto estricto (LISR Art. 27 Fracc. I).
- **Maquinaria y Equipo Industrial:**
  - **Compra / Crédito:** Depreciación fiscal del **10% anual** (horizonte de 10 años conforme a LISR Art. 35).
  - **Leasing:** **100% deducible** en el plazo convenido del contrato (ej. 24, 36 o 48 meses).
- **Acreditamiento de IVA (LIVA Art. 5 Fracc. I):**
  - El IVA pagado solo es acreditable en la misma proporción en que el gasto o inversión sea deducible para efectos de ISR. El excedente de IVA se computa como costo no acreditable dentro de la erogación total.
- **Opciones Terminales al Cierre del Contrato (CFF Arts. 15 y 15-A):**
  - Ejercicio de opción de compra a valor residual pactado.
  - Renovación de unidad tecnológica/flotilla sin asumir depreciación acelerada ni obsolescencia.
  - Devolución pura del activo al arrendador.

## ¿Cómo funciona?

1. **Selección del Bien o Preset:** El usuario elige la clasificación del activo o carga uno de los 4 escenarios preconfigurados:
   - _Automóvil Utilitario Gasolina (\$450k / 36m)_
   - _Vehículo Híbrido / Eléctrico (\$850k / 36m)_
   - _Servidores y Equipo de Cómputo (\$240k / 24m)_
   - _Maquinaria Industrial (\$1.5M / 48m)_
2. **Definición de Variables:**
   - Valor de factura sin IVA y plazo del contrato (12, 24, 36, 48 o 60 meses).
   - Tasa de ISR del contribuyente (ej. 30% Persona Moral) y selector de PTU (10%).
   - Condiciones de crédito (porcentaje de enganche y tasa anual de interés).
   - Condiciones de leasing (renta mensual pactada o calculada con estimador financiero, comisión de apertura, porcentaje residual y opción terminal CFF).
3. **Generación del Dictamen Pericial Automatizado:**
   - Cuantifica la ventaja fiscal en pesos de Leasing frente a Compra.
   - Identifica qué modalidad ofrece **Mayor Deducción Fiscal**, **Menor Costo Neto Real** y **Mejor Liquidez Día 1**.
4. **Tabla de Flujo Anualizado:** Proyecta por ejercicio fiscal la erogación neta, el escudo fiscal (ISR + PTU) y el costo neto.
5. **Exportación Ejecutiva:** Descarga en 1-click la **Cédula Comparativa Fiscal en CSV (UTF-8 con BOM)** para adjuntar al expediente de consultoría del cliente.

## Modelo de Datos

- **Entrada:** `ParametrosComparativaFiscal` (`tipoActivo`, `valorFacturaSinIva`, `plazoMeses`, `engancheCreditoPorcentaje`, `tasaInteresCreditoAnual`, `comisionAperturaLeasingPorcentaje`, `rentaMensualLeasingSinIva`, `valorResidualPorcentaje`, `opcionTerminal`, `tasaIsrPorcentaje`, `incluirPtu`).
- **Salida:** `ResultadoComparativaFiscal` conteniendo los detalles de cada modalidad (`contado`, `credito`, `leasing` como `DetalleMetodoAdquisicion`), el desglose ejercicio a ejercicio (`flujoAnual: FlujoAnualComparativo[]`), ganadores por categoría y el `dictamenPericial`.

## ¿Para qué sirve?

- Asesorar a personas morales y personas físicas con actividad empresarial en la toma de decisiones estratégicas de compra vs arrendamiento.
- Justificar ante comités de dirección y dueños de empresas el ahorro fiscal y preservación de flujo de caja al renovar flotillas o equipo productivo.
- Generar papeles de trabajo formalmente respaldados en la legislación tributaria mexicana vigente (LISR, LIVA, CFF y NIF D-5).

Archivos clave: `src/tools/leasing/CalculadoraLeasing.tsx`, `index.ts`, `types.ts`, `lib/calcularLeasing.ts`, `lib/exportarProyeccion.ts`, componentes `ParametrosLeasingCard`, `ResultadoLeasingCard`, `TablaProyeccionMensual`.

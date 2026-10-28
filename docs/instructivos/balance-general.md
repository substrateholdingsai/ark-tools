# Instructivo — Balance General Comparativo (`balance-general`)

## ¿Qué es?

Herramienta "Blindaje Patrimonial". Calcula un Balance General comparativo (análisis horizontal/vertical) a partir de una balanza de comprobación en CSV/Excel, validando la ecuación contable A = P + C.

## ¿Cómo lo hace?

1. Carga de archivo Excel/CSV.
2. Parseo de filas (`parseBalanzaFilas`) con columnas flexibles (codigo, nombre, montoActual/montoAnterior, naturaleza, rubro/tipo).
3. Clasificación por rubro (activo corriente/no corriente, pasivo corriente/no corriente, patrimonio, otros).
4. Cálculo de totales (`calcularTotales`) con suma jerárquica.
5. Análisis por cuenta (`analizarBalance`) con variación absoluta/porcentual y análisis vertical (AV) a 2 decimales.
6. Render de tarjeta de totales, tabla analítica y gráficos.
7. Exportación CSV con BOM UTF-8.

Entrada: archivo `.xlsx`/`.csv`. Salida: `ResultadoAnalisis` (cuentas + totales).

## ¿Para qué sirve?

Verificar que el balance cuadre (Activo = Pasivo + Patrimonio), detectar cuentas sin rubro asignado y analizar evolución porcentual/vertical entre dos ejercicios para contadores.

Archivos clave: `index.ts`, `types.ts`, `CalculadoraBalance.tsx`, `lib/parserBalanza.ts`, `lib/calcularBalance.ts`, `components/*` (ParametrosBalanceCard, ResultadoBalanceCard, TablaBalanceAnalitico, GraficosClasificacion).

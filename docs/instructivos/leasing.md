# Instructivo — Simulador de Leasing Tecnológico (`leasing`)

## ¿Qué es?

Simulador financiero del modelo de negocio SaaS para despachos: activación accesible ($500 setup) y renta recurrente ($2,500/mes por cliente), con proyección mes a mes y métricas SaaS (MRR, ARR, LTV, churn, margen).

## ¿Cómo lo hace?

1. Ajustar parámetros (clientes iniciales, nuevos por mes, churn, setup, renta, costo directo, plazo 1–36 meses; presets disponibles).
2. Proyectar cohortes mes a mes (nuevos, churn, ingresos setup/rentas, costos, utilidad, acumulados).
3. Calcular resumen ejecutivo (MRR final, ARR, clientes finales, ingresos acumulados, utilidad, margen, LTV, meses de retención).
4. Exportar proyección a CSV para Excel.

Entrada: `ParametrosLeasing`. Salida: `ProyeccionMes[]` y `ResumenLeasing`.

Exportaciones (`index.ts`): componente `CalculadoraLeasing`, tipos (`ParametrosLeasing`, `ProyeccionMes`, `ResumenLeasing`), constantes/funciones de `calcularLeasing` (`PARAMETROS_DEFAULT`, `PRESETS_MODELO`, `proyectarMeses`, `calcularResumenLeasing`, `formatearMXN`) y de `exportarProyeccion` (`generarCSVProyeccion`, `descargarCSVProyeccion`).

## ¿Para qué sirve?

Planificar crecimiento, flujo de caja y valor de vida del cliente para un despacho con modelo de leasing recurrente; generar plan de negocios exportable.

Archivos clave: `CalculadoraLeasing.tsx`, `index.ts`, `types.ts`, `lib/calcularLeasing.ts`, `lib/exportarProyeccion.ts`, `components/` (`ParametrosLeasingCard`, `ResultadoLeasingCard`, `TablaProyeccionMensual`).

# Instructivo — Simulador de Modalidad 40 (Criterio DOF 2026) (`modalidad40`)

## ¿Qué es?

Herramienta #19. Simula Continuación Voluntaria (Modalidad 40) para asegurados Ley 73 del IMSS: evalúa límites del Acuerdo DOF 21/10/2026 (último SBC + 1 UMA, máx 25 UMAs, mín SMG), proyecta inversión con cuota 14.438% y estima pensión por Cesantía y Vejez (Art. 167/171 LSS), asignaciones, factor Fox y ROI.

## ¿Cómo lo hace?

1. Entrada: `ParametrosModalidad40` (último SBC, SBC deseado, semanas previas, meses aportación 12-60, edad jubilación 60-65, asignación familiar).
2. `evaluarLimitesModalidad40` → `calcularInversionModalidad40` → `calcularPensionLey73` (salario promedio 250 semanas, tabla Art. 167, incrementos por excedente de semanas, factor edad Art. 171, asignación familiar 15%, +11% Decreto Fox) → `analizarRoi` (compara con escenario sin M40) → `generarSelloSha256`.
3. Salida: `ResultadoModalidad40` (límites, inversión, pensión, ROI, sello SHA-256, fecha). Función async `simularModalidad40` orquesta todo.

## ¿Para qué sirve?

Proyectar viabilidad y retorno de invertir en Modalidad 40 para mejorar pensión Ley 73, con cotejo legal automático contra el criterio DOF 2026 y cédula imprimible con QR.

Archivos clave: `Modalidad40.tsx`, `types.ts`, `index.ts`, `lib/calcularModalidad40.ts`, `components/*`.

# Instructivo — Simulador de Modalidad 40 (Criterio DOF 2026) (`modalidad40`)

## ¿Qué es?

Herramienta #19. Proyecta Continuación Voluntaria (Modalidad 40) y pensión Ley 73. Para nuevas incorporaciones aplica la medida temporal del Punto Cuarto del Acuerdo ACDO.AS2.HCT.101026/302.P.DG (aprobado 10/10/2026, DOF 21/10/2026, vigente desde 22/10/2026): permite último SBC o hasta último SBC + 1 UMA, sujeto al mínimo SMG general; conserva condiciones previamente contratadas y excluye trabajadores independientes Art. 13-I. El alcance frente a los Arts. 218 LSS y 65–66 del Reglamento es materia de discusión jurídica. Fuente oficial: [SIDOF](https://sidof.segob.gob.mx/notas/docFuente/5801708).

## ¿Cómo lo hace?

1. Entrada: `ParametrosModalidad40` (último SBC, SBC deseado, semanas previas, meses aportación 12-60, edad jubilación 60-65, asignación familiar).
2. `validarParametrosModalidad40` exige los seis campos y sus rangos. El motor calcula límites, inversión nominal 2026 con 30.4 días por mes, salario promedio estimado, pensión Ley 73, advertencias y ROI.
3. Salida: `ResultadoModalidad40` (límites, inversión, pensión, ROI, advertencias y folio determinista). El folio no es sellado fiscal ni certificación del IMSS; el QR solo referencia el sitio y no verifica previews no archivados. `simularModalidad40` valida antes del cálculo.

## ¿Para qué sirve?

Estimar escenarios de pensión y retorno de inversión. El resultado es una proyección, no una resolución del IMSS; la cuota y la UMA se actualizan anualmente y el modelo no reajusta valores durante el cronograma. La cédula puede imprimirse o guardarse en PDF desde el navegador.

Archivos clave: `Modalidad40.tsx`, `types.ts`, `index.ts`, `lib/calcularModalidad40.ts`, `components/*`.

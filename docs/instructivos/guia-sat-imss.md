# Instructivo — Guía Interactiva SAT / IMSS (`guia-sat-imss`)

## ¿Qué es?

Guía interactiva de 8 pasos para responder requerimientos, exhortos y actos de fiscalización del SAT/IMSS. Incluye checklist operativo, clasificación de actos (8 actos críticos SAT + IMSS), plazos clave no negociables y generador de borrador de respuesta legal.

## ¿Cómo lo hace?

1. Seleccionar autoridad/filtro, búsqueda y acto fiscal.
2. Avanzar por 8 pasos con checklist; calcula avance global y por paso; clasifica actos por riesgo (Bajo→Crítico).
3. Persistencia: carga/guarda progreso en D1 (debounce 800ms) + localStorage de respaldo; sincroniza al montar según tenant.
4. Genera borrador de respuesta TXT (copiar/descargar) basado en acto + paso activo + checklist completado + avance. Exportación local sin envío automático.

Exportaciones: `GuiaSATIMSS`, tipos re-exportados desde `@/data/actos`.

## ¿Para qué sirve?

Estructurar y documentar la respuesta a fiscalización SAT/IMSS, asegurando plazos, evidencia pertinente y acuse; generar borrador legal preliminar.

Archivos clave: `GuiaSATIMSS.tsx`, `index.ts`, `types.ts`, `lib/generarBorrador.ts`, componentes `ActoFiscalCard.tsx`, `PasoGuiaCard.tsx`, `PlazoClaveCard.tsx`; catálogo `@/data/actos`.

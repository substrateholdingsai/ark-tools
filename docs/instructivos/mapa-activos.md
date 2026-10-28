# Instructivo — Mapa de Regulación de Activos Virtuales (`mapa-activos`)

## ¿Qué es?

Mapa/consulta legal de conductas con activos virtuales (cripto): matriz de 18+ conductas mapeadas en varios marcos normativos, con gravedad, sanciones, autoridades, timeline regulatorio 2026–2029, umbrales de reporte LFPIORPI y frontera legal vs ilegal.

## ¿Cómo lo hace?

1. Búsqueda textual + filtros (marco legal, gravedad, solo relevantes para contador, solo no ignorables).
2. Filtra conductas en memoria; expande detalle por tarjeta.
3. Muestra resumen ejecutivo (conductas, críticas, para contador, no ignorables).
4. Vista de grid de conductas, autoridades, timeline, umbrales, frontera legal/ilegal, aviso legal y fuentes.

Exportaciones: default `MapaActivos`, tipos re-exportados desde `@/data/conductas`. Sin lib propia.

## ¿Para qué sirve?

Que el contador asesore clientes con cripto/activos virtuales: conocer conductas, sanciones, autoridades, plazos y límites legales en México.

Archivos clave: `MapaActivos.tsx`, `index.ts`, `types.ts`; datos `@/data/conductas`.

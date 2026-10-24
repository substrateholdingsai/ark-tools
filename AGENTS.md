# ARK LEDGER — Guía de trabajo para agentes y mantenedores

Suite de 18 herramientas fiscales, laborales y de compliance para contadores en México.
SPA React + Cloudflare Workers + D1, conGEO Engine (`/llms.txt`) para descubrimiento por agentes IA.

## Comandos

```bash
pnpm install          # dependencias (pnpm@9.7.0, Node >= 20)
pnpm dev              # wrangler dev
pnpm build            # build de producción (Vite) -> dist/
pnpm test             # suite completa (Vitest)
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint, falla con cualquier warning
pnpm format           # Prettier --write sobre todo el repo
pnpm format:check     # Prettier --check sobre todo el repo
pnpm verify:catalogo  # auditoría DOF de las vigencias fiscales (7/7 oficiales)
```

### Despliegue

```bash
pnpm run deploy:production   # build + wrangler deploy --env production
pnpm run deploy:staging      # build + wrangler deploy --env staging
pnpm run deploy:preview      # build + wrangler deploy (preview local)
```

> **Trampa:** `pnpm deploy` **no** despliega. Ese nombre está reservado por pnpm para
> los despliegues de workspace y falla con `ERR_PNPM_CANNOT_DEPLOY`. Usa siempre
> `pnpm run deploy:production` (o `pnpm run deploy`, que delega en el anterior).

## Reglas de la casa

1. **El catálogo de herramientas tiene una sola fuente de verdad.**
   `src/data/catalogo-herramientas.ts` alimenta el conteo publicado en `/llms.txt`, el
   system prompt de Noah y las guardas de tests. `TOTAL_HERRAMIENTAS` se
   **deriva** del arreglo: nunca se escribe un número a mano. Al agregar o quitar una
   herramienta hay que actualizar también el union type `ToolId` de `src/App.tsx` —
   `src/data/catalogo-herramientas.test.ts` falla si no coinciden.

2. **Nunca hardcodear valores fiscales.** Siempre importar desde
   `@/data/valores-vigentes/catalogo`. El calendario de actualización anual está en
   `docs/calendario-mantenimiento.md`.

3. **El hook de pre-commit ejecuta `lint-staged`** (ESLint + Prettier sobre los archivos
   Preparation). No lo saltes: si el hook falla, arregla el archivo y vuelve a commitear.

4. **Cualquier cambio pasa por la puerta completa** antes de commitear:
   `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`.

5. **Documenta el estado real, no el deseado.** `docs/map.md` es el mapa vivo del
   proyecto: bitácora de sprints, checklist de pendientes y verificación en producción.
   Si un pendiente ya no aplica (porque lo verifique contra producción o contra el
   código), márcalo como resuelto en lugar de dejarlo abierto.

## Mapa rápido del repo

| Ruta                       | Qué hay                                                                          |
| -------------------------- | -------------------------------------------------------------------------------- |
| `src/index.ts`             | Worker: auth, admin, invitaciones, D1, CRM leads, AI, Alegra, cron, fallback SPA |
| `src/App.tsx`              | Router de la SPA; unión de tipos `ToolId`                                        |
| `src/tools/<herramienta>/` | Una carpeta por herramienta (componentes + `lib/` + tests)                       |
| `src/server/`              | APIs del Worker (auth, admin, D1, invitaciones, leads, Alegra, `ai/`)            |
| `src/data/`                | Catálogos fiscales, valores vigentes y el catálogo canónico de herramientas      |
| `src/components/`          | Shell, landing, widgets y la consola de Super Admin                              |
| `migrations/`              | Migraciones D1 aplicadas en orden (`0001` → `0007`)                              |
| `scripts/`                 | Auditoría DOF en TS y tríada pericial en Python                                  |
| `docs/map.md`              | Mapa del proyecto y checklist de estado                                          |

## Despliegue y verificación

```bash
pnpm exec wrangler d1 migrations list ark_tools_db --env production --remote
pnpm exec wrangler d1 execute ark_tools_db --env production --remote --command "SELECT 1;"
```

En producción (`https://ledger.arksystems.site`):

```bash
curl -s https://ledger.arksystems.site/llms.txt | head -5
curl -s https://ledger.arksystems.site/api/ai/tools
```

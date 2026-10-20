# Calendario Anual de Mantenimiento — Catálogo de Valores Fiscales

> **Objetivo:** Garantizar que los 7 valores fiscales del catálogo (`src/data/valores-vigentes/catalogo.ts`) estén siempre actualizados contra fuentes oficiales (DOF, INEGI, SAT, IMSS, CONASAMI).
>
> **Automatización:** El script `pnpm verify:catalogo` corre en CI y falla si hay proyecciones (`esProyeccion: true`) o valores críticos vencidos. El banner `AlertasVigencia` avisa en UI a 60 días de vencimiento.

---

## Cronograma Recomendado

| Mes | Acción | Fuente | Responsable | Detalles |
|---|---|---|---|---|
| **Nov** | Revisar tasas ISN estatales | Leyes de Ingresos de las 32 entidades (periódicos oficiales estatales) | Mantenedor | Cada entidad publica su Ley de Ingresos en nov-dic. Verificar reformas. Actualizar `src/tools/isn/data/estados.ts` y `ISN_META.tasas2026` en catálogo. |
| **Dic (1-15)** | Revisar salarios mínimos | CONASAMI — DOF | Mantenedor | Comisión Nacional de Salarios Mínimos publica resolución en diciembre. Actualizar `SALARIO_MINIMO.general2026` y `frontera2026`. |
| **Dic (16-31)** | Revisar Tarifa ISR | SAT — Anexo 8 RMF | Mantenedor | SAT publica Anexo 8 de la RMF (Resolución Miscelánea Fiscal) en diciembre. Actualizar `TARIFA_ISR.mensual2026` (11 rangos). |
| **Ene (1-10)** | Correr auditoría completa | `pnpm verify:catalogo` | CI automático | Pipeline ejecuta script y falla si quedan proyecciones o críticos vencidos. Alerta temprana antes de febrero. |
| **Feb (1-10)** | Actualizar UMA + tope LSS | INEGI — DOF | Mantenedor | INEGI publica UMA del año en enero (vigente desde febrero). Actualizar `UMA.diaria2026`, `UMA.mensual2026` y recalcular `TOPES_LSS.tope25UMA2026 = UMA * 25`. |
| **Continuo** | Monitoreo automático | `AlertasVigencia` + `useEstadoCatalogo` | Automático | Banner global en App shell avisa a 60 días (`próximo-a-vencer`) y en rojo navy si `crítico-vencido`. No requiere acción manual. |

---

## Checklist de Actualización por Valor

Cuando se actualice un valor en `catalogo.ts`:

1. [ ] Cambiar `valor` al nuevo número oficial
2. [ ] Actualizar `fechaPublicacion` a la fecha del DOF
3. [ ] Actualizar `vigenteDesde` y `vigenteHasta` según corresponda
4. [ ] Cambiar `esProyeccion: false`
5. [ ] Actualizar `notas` con referencia exacta (ej: "DOF 2026-02-01, p. 45")
6. [ ] Ejecutar `pnpm test catalogo` (tests de integridad del catálogo)
7. [ ] Ejecutar `pnpm test` (suite completa)
8. [ ] Ejecutar `pnpm verify:catalogo` (debe salir exit code 0)
9. [ ] Ejecutar `pnpm build` (debe compilar limpio)
10. [ ] Commit: `chore(catalogo): actualizar [VALOR] 202X — [FUENTE]`

---

## Ejemplo de Commit

```bash
git add src/data/valores-vigentes/catalogo.ts
git commit -m "chore(catalogo): actualizar UMA 2027 — INEGI DOF 2027-01-10
- UMA diaria: 113.14 → 119.82
- Tope 25 UMAs recalculado: 2,828.50 → 2,995.50
- esProyeccion: false
- Fuente: https://www.inegi.org.mx/temas/uma/
"
```

---

## Alertas Tempranas (No esperes al calendario)

El sistema detecta automáticamente:

| Situación | Dónde se ve | Acción |
|---|---|---|
| Valor `esProyeccion: true` | `pnpm verify:catalogo` (CI falla) | Actualizar antes de deploy |
| Valor `critico` y `vencido` | `pnpm verify:catalogo` (exit 2) + banner navy en UI | **Bloqueante:** actualizar YA |
| Valor en `proximo-a-vencer` (≤60 días) | Banner gold `PRÓXIMO` en UI | Planear actualización en sprint actual |
| Test `catalogo.test.ts` falla | CI | Revisar fuente/fechas/criticidad |

---

## Archivos Clave a Tocar

| Archivo | Qué actualiza |
|---|---|
| `src/data/valores-vigentes/catalogo.ts` | **Fuente única** — 7 valores fiscales con metadatos |
| `src/tools/isn/data/estados.ts` | 32 tasas ISN (consumen UMA y tope del catálogo) |
| `src/tools/sbc/data/uma.ts` | Constantes SBC (consumen UMA, salario mínimo, tope del catálogo) |
| `src/tools/nomina/data/tablasISR.ts` | Tarifa ISR (consume catálogo) |
| `src/tools/nomina/data/cuotasIMSS.ts` | Cuotas IMSS (consumen UMA del catálogo) |
| `src/tools/nomina/data/defaults.ts` | Presets de sueldo (consumen salario mínimo del catálogo) |

> **Regla de oro:** Nunca hardcodear valores fiscales en herramientas. Siempre importar desde `@/data/valores-vigentes/catalogo`.

---

## Contactos de Fuentes Oficiales

| Valor | Organismo | URL | Frecuencia |
|---|---|---|---|
| UMA | INEGI | https://www.inegi.org.mx/temas/uma/ | Anual (ene) |
| Salario mínimo | CONASAMI | https://www.gob.mx/conasami | Anual (dic) |
| Tope LSS | IMSS | https://www.imss.gob.mx/ | Derivado de UMA (feb) |
| Tarifa ISR | SAT | https://www.sat.gob.mx/consultas/retensiones/conoce-las-tarifas-de-isr | Anual (dic, Anexo 8 RMF) |
| Tasas ISN | 32 Entidades | https://www.gob.mx/indetec + periódicos oficiales | Anual (nov-dic, Leyes de Ingresos) |

---

## Próximas Fechas Clave (2026-2027)

| Fecha | Evento |
|---|---|
| **Nov 2026** | Leyes de Ingresos 2027 publicadas → revisar ISN |
| **Dic 2026** | Salarios mínimos 2027 (CONASAMI) + Tarifa ISR 2027 (SAT) |
| **Ene 2027** | `pnpm verify:catalogo` en CI → validar antes de febrero |
| **Feb 2027** | UMA 2027 (INEGI) + Tope 25 UMAs LSS 2027 |
| **Mar 2027** | Verificación completa post-actualización |

---

*Documento vivo — actualizar este calendario cuando cambien las fechas de publicación oficiales.*
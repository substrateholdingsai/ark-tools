# Instructivo — Auditoría Legal de Cobranza (`auditor-cobranza`)

## ¿Qué es?

Herramienta de compliance de la suite ARK LEDGER que evalúa la **consistencia entre el contrato y el CRM** de un despacho de cobranza y detecta **conductas de riesgo** (acoso, fraude, extorsión, etc.). Produce un **dictamen de auditoría** exportable, con fundamento legal, score de riesgo y recomendaciones, que puede sellarse en el Ledger inmutable (D1) con hash SHA-256.

Estructura funcional:

- **12 comparadores** Contrato vs CRM (Sección VIII — Eje de Gravedad), definidos en `src/data/comparadores-contrato-crm.ts`.
- **43 conductas** agrupadas en 7 secciones (I–VII) definidas en `src/data/conductas-cobranza.ts`: identidad/legal, cobranza y acoso, smishing y fraude, ciclo deuda-extorsión, operativos judiciales, estructura financiera y contradicciones.
- Cada ítem tiene un **riesgo** (`BAJO | MEDIO | ALTO | CRITICO`) con peso numérico (1, 3, 5, 10).

## ¿Cómo lo hace?

1. **Entrada del auditor** (`AuditorCobranza.tsx`): captura cliente/empresa auditada, revisor y notas generales.
2. **Comparadores** (`ComparadorCard`): por cada comparador el usuario asigna un estado entre `COINCIDE | DIFIERE | PARCIAL | NO_VERIFICABLE | SIN_DATO` y puede agregar nota. El estado por defecto es `SIN_DATO`.
3. **Conductas** (`SeccionConductasAccordion`): el auditor marca (checkbox) las conductas observadas; las secciones I y II arrancan abiertas.
4. **Cálculo del dictamen** (`lib/calcularDictamen.ts` → `calcularDictamenCobranza`):
   - Normaliza respuestas (acepta array o record; valida IDs y estados; emite advertencias).
   - Por cada comparador: `puntosMaximos += peso(riesgo)`; si el estado ≠ `COINCIDE`, `puntosRiesgo += peso × factor(estado)` donde factor es `DIFIERE=1, PARCIAL=0.5, NO_VERIFICABLE=0.6, SIN_DATO=0.25`. Los estados `DIFIERE/PARCIAL` se clasifican como **hallazgo**; los demás como **observación**.
   - Por cada conducta detectada: suma peso completo a riesgo y puntos máximos; se clasifica como **hallazgo**.
   - Ordena detalles por puntos descendente y título.
   - Construye **resumen**: conteos por nivel de riesgo, `score = min(100, puntosRiesgo/puntosMaximos × 100)`, y `nivel` (`SIN_EVALUAR` si no hay puntos máximos; `SIN_HALLAZGOS` si score=0; en caso contrario el nivel más alto presente; `CRITICO` si hay críticos).
   - Genera hasta 12 **recomendaciones** contextuales según nivel y detalles.
5. **Exportación** (`lib/exportarDictamenCobranza.ts`): descarga en CSV (con BOM UTF-8) o TXT, o copia al portapapeles (con fallback a `execCommand`).
6. **Sellado en Ledger** (`handleGuardarLedger`): si hay `tenantId`, envía a D1 vía `apiClient.ledger.addEntry` con `caso_id`, `conducta_id` (conductas unidas por coma o `CONTRATO-CRM`) y estado `BLOQUEADO` si nivel crítico o críticos>0, si no `PERMITIDO`; devuelve hash SHA-256 mostrado en UI.
7. **Reinicio** (`handleReset`) limpia toda la evaluación.

## ¿Para qué sirve?

- Auditar la consistencia operativa/legal entre lo pactado en contrato y lo registrado en el CRM de una empresa de cobranza.
- Detectar y documentar conductas de cobranza abusiva/fraudulenta con fundamento legal (LFPC, CP, LFPDPPP, NOM-184, CFF, etc.) para defensa del deudor o cumplimiento del acreedor.
- Generar un dictamen cuantificado (score 0–100, nivel de riesgo, hallazgos/observaciones) que sirve de evidencia en expedientes, quejas ante CONDUSEF o procesos judiciales.
- Exportar en CSV/TXT para integración con papeles de trabajo y sistemas externos.
- Sellar el dictamen en el Ledger inmutable (D1) para garantizar trazabilidad e integridad mediante hash SHA-256 por despacho (multi-tenant).

Archivos clave: `AuditorCobranza.tsx`, `lib/calcularDictamen.ts`, `lib/exportarDictamenCobranza.ts`, `components/*`, `src/data/conductas-cobranza.ts`, `src/data/comparadores-contrato-crm.ts`.

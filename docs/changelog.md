# ARK LEDGER — Bitácora de Sprints (changelog.md)

**Propósito:** Registro histórico y de cambios de **Sprints 1-34**. Este archivo conserva el detalle cronológico que se retiró de `docs/map.md` para mantener ese documento como mapa de estado actual únicamente.

> Nota de orden: algunos sprints apareban duplicados o fuera de orden en la versión previa de `map.md`. Aquí se presentan **deduplicados y ordenados por número de sprint**.

---

## Sprint 3 (Octubre 2026) — Automatización SAT (Fase B) y Cobros Digitales (Fase C)

**Objetivo:** Desarrollar e integrar al 100% el motor de procesamiento de comprobantes fiscales (CFDI 4.0/3.3) y la infraestructura de cobros y financiamiento recurrente para despachos contables.

### 1. Conversor XML → Excel (`src/tools/xml-excel/`) — Completado

- Parser universal cliente-side para CFDI 4.0 y CFDI 3.3 (no envía archivos a servidores externos).
- Extracción de metadatos: UUID, Serie/Folio, Fecha, Emisor, Receptor, Régimen Fiscal, Uso CFDI, Moneda, Tipo de Cambio, Forma/Método de Pago, Subtotal, Descuentos, Impuestos, Total.
- Carga masiva Drag & Drop de hasta 200 archivos XML con botón de prueba en 1 clic.
- Exportación con prefijo Byte Order Mark (`\uFEFF`) para compatibilidad con Microsoft Excel.
- Testing: 8/8 tests unitarios pasando (`src/tools/xml-excel/lib/parserCFDI.test.ts`).

### 2. Validador y Auditor de XMLs (`src/tools/xml-validador/`) — Completado

- Motor de auditoría preventiva alineado al Anexo 20 de la RMF y CFF.
- 8 reglas de validación en tiempo real (esquema XML, versión CFDI, UUID, sellos, RFC contra Art. 69-B, régimen fiscal, código postal, cuadratura matemática).
- Interfaz con `ScoreGauge` visual (0 a 100 pts), dictamen por comprobante, exportación de dictamen a CSV.
- Testing: 7/7 tests unitarios pasando.

### 3. Generador de Links de Pago Clip (`src/tools/spei/`) — Completado

- Integración con Clip Developers (Clip Checkout). Proxy seguro en Cloudflare Worker (`POST /api/clip/checkout`, `GET /api/clip/status`).
- Soporte Sandbox / Producción mediante variables de entorno.
- Motor de comisiones Clip: 3.6% + IVA y sobretasas por Meses Sin Intereses (3, 6, 9, 12 MSI).
- Persistencia local del historial de cobros.
- Testing: 10/10 tests unitarios pasando.

### 4. Calculadora de Leasing Tecnológico (`src/tools/leasing/`) — Completado

- Modelo \$500 setup + \$2,500 renta mensual recurrente para despachos contables.
- Métricas SaaS: MRR, ARR, LTV, tasa de retención, payback.
- Proyección mensual a 12, 24 o 36 meses. Presets para Despacho Boutique, Mediano y Escalamiento Rápido.
- Exportación a CSV con BOM UTF-8.
- Testing: 5/5 tests unitarios pasando.

### 5. Métricas de Calidad del Sprint

- Pruebas unitarias totales: de 59 a 89 tests (al cierre del Sprint 3; Sprint 3.1: 103).
- Cobertura de herramientas: 7 de 8 funcionales al 100%.
- 0 errores en `tsc --noEmit`; `pnpm build` generado limpiamente en `dist/`.

---

## Sprint 3.1 (Octubre 2026) — Catálogo Centralizado de Valores Fiscales y Eliminación de Hardcodes

**Objetivo:** Consolidar todos los valores fiscales volátiles en una única fuente de verdad validada con tests de integridad.

### 1. Catálogo Centralizado (`src/data/valores-vigentes/`)

- `catalogo.ts` — 7 valores fiscales oficiales (UMA diaria/mensual 2026, SMG general/frontera 2026, Tope 25 UMAs LSS, Tarifa ISR Mensual 2026 con 11 rangos internos, Meta ISN 32 entidades).
- `tipos.ts` — Interfaces `ValorFiscal` y `ConfigVigencia`.
- `vigencia.ts` — Motor `evaluarVigencia` / `evaluarLote` con alertas a 60 días.
- `hooks.ts` — `useValorFiscal(id)` y `useEstadoCatalogo()`.
- `AlertasVigencia.tsx` — Banner global.
- `index.ts` — Barrel export.
- Tests de integridad: 7/7 pasando (`catalogo.test.ts`, `vigencia.test.ts`); 14 tests nuevos totales.

### 2. Migración de Hardcodes a Catálogo

- ISN: `src/tools/isn/data/estados.ts` → `UMA_DIARIA`, `TOPE_25_UMA`.
- SBC: `src/tools/sbc/data/uma.ts` → corrige `SALARIO_MINIMO_FRONTERA` (era 278.8, ahora 419.88).
- Nómina: `tablasISR.ts`, `cuotasIMSS.ts`, `defaults.ts` → `TARIFA_ISR.mensual2026`, `UMA.diaria2026`, `SALARIO_MINIMO`.

### 3. Deduplicación de Estados

- `src/data/estados.ts` re-exporta `ESTADOS` y `Estado` desde `src/tools/isn/data/estados.ts` (fuente única).

### 4. Métricas Post-Migración

- Pruebas unitarias totales: 103/103 pasando.
- Typecheck: 0 errores; Build: exitoso.
- 0 referencias hardcodeadas a valores fiscales en ISN, SBC, Nómina.
- `AlertasVigencia` montada en `App.tsx` (global, bajo Header).

---

## Mini-Sprint de Verificación (Octubre 2026) — Completado

**Objetivo:** Confirmar los 7 valores fiscales del catálogo contra fuentes oficiales 2026 y validar el sistema de alertas con tests E2E.

- Verificación contra DOF/INEGI/SAT: 7 valores, todos `esProyeccion: false`.
- `scripts/verificar-catalogo.ts` — falla CI si hay proyecciones (`exit 1`) o críticos vencidos (`exit 2`).
- Tests E2E de `AlertasVigencia`: 8 tests (4 unitarios + 4 integración con `vi.useFakeTimers`).
- Total post-Mini-Sprint: 111/111 pruebas pasando.

---

## Sprint 4 (Octubre 2026) — Guía SAT/IMSS (Fase D) — Completado

**Objetivo:** Implementar la Guía Interactiva SAT/IMSS de 8 pasos.

### 1. Guía SAT/IMSS (`src/tools/guia-sat-imss/`)

- Guía interactiva de 8 pasos para responder requerimientos y actos de fiscalización (SAT e IMSS).
- Checklist interactivo por paso con persistencia local de progreso; barra de progreso visual.
- Catálogo de 8 actos fiscales (4 SAT + 4 IMSS) con filtro por autoridad, nivel de riesgo y acción recomendada.
- 3 plazos clave con fundamentos legales (CFF, LSS, RACERF).
- Datos en `src/data/actos.ts` con tipos tipados.
- Arquitectura: `GuiaSATIMSS.tsx`, `PasoGuiaCard.tsx`, `ActoFiscalCard.tsx`, `PlazoClaveCard.tsx`, `iconos.ts`, `index.ts`.
- Testing: 9 tests unitarios pasando (`src/data/actos.test.ts`).

### 2. Métricas de Calidad del Sprint

- Pruebas unitarias totales: de 111 a 120 tests.
- Cobertura de herramientas: 8 de 8 funcionales al 100%.
- 0 errores en `tsc --noEmit`; `pnpm build` exitoso.

---

## Sprint 4.1 (Octubre 2026) — Auditoría Legal de Cobranza (Fase D) — Completado

**Objetivo:** Motor de auditoría preventiva y detección de riesgos en cobranza extrajudicial, comparando datos contractuales vs registros de CRM.

### 1. Auditoría Legal de Cobranza (`src/tools/auditor-cobranza/`)

- Catálogo de conductas (`src/data/conductas-cobranza.ts`): 43 conductas en 8 secciones (I-VIII), severidades BAJO/MEDIO/ALTO/CRITICO.
- Comparadores Contrato vs CRM (`src/data/comparadores-contrato-crm.ts`): 12 comparadores (CC-8.1 a CC-8.12), 5 estados de evaluación.
- Motor de dictamen (`lib/calcularDictamen.ts`): puntaje /100, nivel de riesgo ponderado, escalamiento a crítico.
- Exportadores (`lib/exportarDictamenCobranza.ts`): TXT y CSV con BOM UTF-8.
- Componentes: `ResumenAuditoriaDome`, `ComparadorCard`, `SeccionConductasAccordion`, `ListaDetallesDictamen`.
- Skeleton loader `ToolSkeleton.tsx` y carga diferida en `App.tsx` (reducción de 45 kB en bundle principal).
- Testing: 26 tests unitarios pasando al 100%.

---

## Sprint 4.2 (Octubre 2026) — Mapa de Regulación de Activos Virtuales (Fase D Final) — Completado

**Objetivo:** Matriz de referencia y consulta legal en activos virtuales y criptoactivos.

### 1. Mapa de Activos Virtuales (`src/tools/mapa-activos/`)

- Catálogo normativo (`src/data/conductas.ts`): 12 conductas tipificadas, 5 autoridades (CNBV, Banxico, UIF, SAT, CONDUSEF), timeline 2026-2029, umbrales antilavado (210 UMA reporte, 4 UMA comisiones), frontera legal vs ilegal (3 permitidas vs 3 ilícitas).
- Interfaz: buscador en tiempo real, filtros por marco legal/gravedad, tarjetas interactivas, `onBack` para navegación.
- Carga diferida en `App.tsx` (chunk `index-DOzmIO7U.js` de 28.09 kB).
- Testing: 15 tests unitarios (`conductas.test.ts`) + 6 tests de integración/UI (`MapaActivos.test.tsx`).

---

## Sprint 5 (Octubre 2026) — Autenticación Soberana y Multi-Tenancy Nativo — Completado

**Objetivo:** Transformar ARK LEDGER en plataforma SaaS Multi-Tenant soberana (sin dependencias de Clerk), con landing pública, gating condicional y D1 distribuida.

### 1. Autenticación Soberana (`src/context/AuthContext.tsx`)

- Reemplazo total de `@clerk/clerk-react` por contexto nativo React (`AuthContext`).
- Persistencia en `localStorage` con sincronización asíncrona hacia D1.
- Hook `useAuth()`: usuario autenticado, despacho activo, selector de despachos, `getToken()`.

### 2. Landing Pública y Gating Condicional (`LandingPage.tsx`)

- `<SignedOut>` renderiza Landing pública; `<SignedIn>` desbloquea Dashboard.
- Showcase de las 10 herramientas; estrategia de crecimiento gratuito ("Pase Fundador").
- Modal nativo con tabs "REGISTRO" y "ENTRAR".

### 3. Base de Datos D1 (`migrations/0001_initial_schema.sql`)

- Base `ark_tools_db` con 5 tablas relacionales y aislamiento por `tenant_id`: `users`, `tenants`, `guia_progress`, `arkangel_ledger` (encadenamiento SHA-256), `activos_watchlist`.

### 4. Endpoints REST (`src/server/d1Api.ts`) y SDK (`src/lib/apiClient.ts`)

- `POST /api/auth/sync`, `GET/POST /api/guia/progress`, `GET/POST/DELETE /api/ledger`, `GET/POST/DELETE /api/activos/watchlist`.

### 5. Persistencia Activa en Herramientas

- Guía SAT/IMSS: hidratación automática de la nube y auto-guardado en D1 con debounce.
- Auditoría de Cobranza: botón "Sellar en Ledger Inmutable (D1)" con SHA-256.

---

## Sprint 6 (Octubre 2026) — Workers AI & Agentic Tool-Calling — Completado

**Objetivo:** Habilitar IA Generativa y Razonamiento en el Edge con Cloudflare Workers AI.

### 1. Infraestructura y Binding

- `wrangler.toml` con `[ai] binding = "AI"`; tipo `AI?: Ai;` dentro de `Env` en `src/index.ts`.

### 2. Arquitectura de Seguridad

- El modelo LLM nunca ejecuta SQL crudo. Catálogo formal de herramientas (`AI_TOOLS_CATALOG`) con JSON Schema.
- `tenant_id` extraído de sesión o cabecera `x-tenant-id`, inyectado en Prepared Statements de D1.

### 3. Catálogo de Herramientas (`src/server/ai/tools.ts`)

1. `consultar_progreso_guia`, 2. `consultar_auditoria_ledger`, 3. `consultar_watchlist_activos`, 4. `obtener_info_despacho`.

### 4. Orquestador (`src/server/ai/agent.ts`)

- Modelo principal `@cf/meta/llama-3.3-70b-instruct`; modelo rápido `@cf/meta/llama-3.1-8b-instruct`.
- Ciclo de Tool-Calling con detección concurrente de `tool_calls` y streaming SSE (`ReadableStream`).

### 5. Endpoints REST (`src/server/ai/aiApi.ts`)

- `GET /api/ai/status`, `GET /api/ai/models`, `GET /api/ai/tools`, `POST /api/ai/chat`.

### 6. Pruebas

- 6 unitarias (`tools.test.ts`), 6 integración (`aiApi.test.ts`), 4 render (`AiAssistantWidget.test.tsx`).

---

## Sprint 7 (Octubre 2026) — Optimización de Copy, Header, Footer y Fundamentación Jurídica — Completado

**Objetivo:** Transformar el copy institucional para proyectar solidez técnica y jurídica.

### 1. Rediseño de Header (`src/components/Header.tsx`)

- Subtítulo de `HERRAMIENTAS MODERNAS` a `SUITE FISCAL & FINANCIERA MX`.
- Badge `TABLAS 2026` anclado a tarifas del DOF.
- Botón WhatsApp `+52 56 5706 2511`; CTA `ACCESO DESPACHOS` / `Crear Cuenta Gratis`.

### 2. Footer Institucional (`src/components/Footer.tsx`)

- Garantía de privacidad y procesamiento local de XMLs.
- Canales oficiales: `pavel@arksystems.site` y WhatsApp `+52 56 5706 2511`.
- Directorio en 3 columnas (Fiscal & Nómina; SAT & Auditoría; Finanzas & Cloud).
- Disclaimer fundamentado en CFF, LISR, LSS, LFT.
- Unificación del componente `<Footer />` en Dashboard y Landing.

### 3. Módulo de Transparencia Jurídica

- 4 fichas de fundamentación legal (ISR & Retenciones; IMSS & Salario Base; ISN Estatal; Prevención Fiscal CFF Art. 69-B).
- Banner en Dashboard con valores DOF 2026 (UMA $117.31, SMG $315.04, Tope SBC $2,932.75).

### 4. Configuración de Entorno (`wrangler.toml`)

- `COMPANY_EMAIL: pavel@arksystems.site`; `SUPPORT_URL: https://wa.me/525657062511`.

### 5. Verificación

- Typecheck 0 errores; 194 pruebas en 24 suites; `verify:catalogo` 6/6; Build en 37s.
- Commit `5a6099a`; deploy Version ID `90c90496-fc07-4237-9565-7172041bcc5e`.

---

## Sprint 8 (Octubre 2026) — UI de Finiquitos y Liquidaciones LFT (Cierre 11/11) — Completado

**Objetivo:** Culminar la herramienta #11 con interfaz de alta fidelidad fundamentada en la LFT.

### 1. Componentes Visuales (`src/tools/finiquitos/components/`)

- `ParametrosFiniquitoCard.tsx`: selector Finiquito/Liquidación, cálculo SDI en vivo con factor `1.049315×`, pre-marcado prima de antigüedad.
- `AntiguedadCard.tsx`: años/meses/días, vacaciones 2023 (Art. 76 LFT), tope salarial Art. 486 (2×SMG = $630.08).
- `DesgloseFiniquitoTable.tsx`: diseño dual desktop/mobile, cita jurídica de cada concepto.
- `ResultadoFiniquitoCard.tsx`: `LiquidGlassDome`, cifra magnificada, botón copiar WhatsApp, descargar CSV BOM UTF-8.

### 2. Ensamblador e Integración

- `CalculadoraFiniquitos.tsx` con navegación `onBack` y carga diferida.
- Integración en `App.tsx` (`ToolId`, `<Suspense />`, `ToolCard` en sección Fiscal, 4 columnas), `LandingPage.tsx` (`TOOLS_PREVIEW`), `Footer.tsx`.

### 3. Pruebas

- 7 unitarias (`calcularFiniquito.test.ts`) + 6 integración/UI (`CalculadoraFiniquitos.test.tsx`).

---

## Sprint 9 — Expediente Único ARK LEDGER — Completado

**Objetivo:** Convertir las calculadoras en sistema operativo de despacho con cliente seleccionado que alimenta todas las herramientas, historial inmutable con sello SHA-256 y versión DOF.

### 1. Migración D1 Multi-Tenant (`migrations/0002_expediente_unico.sql`)

- Tablas `clients` y `expedientes` con `input_hash` (SHA-256 determinista), `catalog_version` DOF, índices por `tenant_id`, `client_id`, `tool_id`, `input_hash`.
- Deduplicación inteligente: cálculo idéntico repetido en 24h retorna expediente existente (`deduplicated: true`).

### 2. Backend D1 REST API y Criptografía (`src/server/d1Api.expediente.ts`)

- `computeDeterministicHash`: SHA-256 canónica recursiva.
- Sello `CURRENT_CATALOG_VERSION = 'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75'`.
- Aislamiento estricto por `tenant_id` con barrera 403.
- Endpoints `/api/clients` y `/api/expedientes`.
- 12 pruebas unitarias (`d1Api.expediente.test.ts`).

### 3. Frontend Context & SDK

- `src/lib/apiClient.ts`: métodos tipados para `clients` y `expedientes`.
- `src/context/ExpedienteContext.tsx`: `ExpedienteProvider`, `useExpediente()`, persistencia `localStorage`, `getPrefillForTool(toolId)` para SBC, Nómina, Finiquitos, ISN.

### 4. Componentes UI de Expediente

- `ExpedienteSelector.tsx`: barra persistente, modal "+ Nuevo Cliente", modal "Historial de Expediente".
- `ExpedienteToolBanner.tsx`: botón "Archivar en Expediente" con sello SHA-256.

### 5. Hidratación Automática en Herramientas

- Finiquitos, SBC, Nómina, ISN: auto-prefill y archivado sellado.

---

## Sprint 10 — Papel de Trabajo Oficial en PDF con Sello QR y Verificación Pública — Completado

**Objetivo:** Transformar expedientes digitales en cédulas contables con sello SHA-256, QR y verificación pública sin login.

### 1. Conversor de Moneda a Letras (`src/lib/numeroALetras.ts`)

- Conversión precisa de importes a texto legal en Pesos Mexicanos (millares, centavos, regla del millón).
- 3 pruebas unitarias (`numeroALetras.test.ts`).

### 2. Cédula y Papel de Trabajo (`src/components/PapelDeTrabajoModal.tsx`)

- Diseño Carta (`letter`) con `@media print`, cabecera con datos del despacho, tablas formales de parámetros, cifra total con desglose en letras (Art. 28 CFF).
- Sello SHA-256 e información de versión de tablas DOF.
- Código QR vectorial (`qrcode`), bloque de firmas (Contador Auditor y Representante/Trabajador).

### 3. Endpoint y Portal de Verificación Pública

- `GET /api/expedientes/verify?hash={hash}` sin autenticación.
- `VerificacionPublicaModal.tsx`: portal activado por `/?verify={hash}` con insignia de autenticidad, fecha de emisión, despacho emisor, versión DOF.

### 4. Integración

- Botón "Papel de Trabajo (PDF)" en `ExpedienteToolBanner` y `ExpedienteSelector`; respuesta a `?verify={hash}` en `App.tsx`.

---

## Sprint 11 — Cierre de Nómina Masivo, Motor Batch y Cédula Concentradora — Completado

**Objetivo:** Procesamiento masivo de plantillas completas de trabajadores (CSV/Excel) con retenciones ISR, IMSS, ISN y Cédula Concentradora Oficial.

### 1. Tipado e Ingesta (`src/tools/cierre-nomina/`)

- `types.ts`: `TrabajadorFilaInput`, `ParametrosCierreNomina`, `ResultadoTrabajadorNomina`, `ResumenCierreNomina`, `CierreNominaCompleto`.
- `parserPlantilla.ts`: detección de delimitadores, mapeo de alias de columnas, conversión monetaria, Art. 76 LFT (Vacaciones Dignas), generador de plantilla oficial. 18 pruebas unitarias.

### 2. Motor Batch (`lib/calcularCierreNomina.ts`)

- Cálculo simultáneo: factor de integración, SBC topado 25 UMAs, retención ISR, subsidio, IMSS obrero, ISN estatal, sueldo neto.
- `numeroALetras` (Art. 28 CFF), `computeBatchHash` (SHA-256), estampa `DOF-2026-...`. 4 pruebas unitarias.

### 3. Exportadores (`lib/exportarCierre.ts`)

- Cédula Concentradora CSV BOM UTF-8, layout de dispersión bancaria, `descargarArchivo`. 3 pruebas unitarias.
- `CedulaConcentradoraModal.tsx`: formato Carta horizontal, 5 tarjetas ejecutivas, sello SHA-256, QR, firmas (_Elaboró_, _Revisó_, _Autorizó_).

### 4. Pantalla Principal (`CierreNomina.tsx`)

- Pantalla interactiva con configuración de período, drag & drop CSV, tabla previa de colaboradores, resumen ejecutivo, archivado en Expediente Único.
- 4 pruebas de integración/UI. Integración en `App.tsx` con `React.lazy` y tarjeta en categoría Fiscal.

---

## Mejora de Navegación y Usabilidad — Octubre 2026 — Completado

**Objetivo:** Acceso funcional por categorías, navegación móvil, retorno contextual.

- `App.tsx`: filtros Todas/Fiscal/SAT/Cobros/Compliance; categoría seleccionada conservada; nombre de herramienta activa en encabezado.
- `Header.tsx`: navegación por categorías en escritorio y móvil horizontal desplazable; estados de selección accesibles (`aria-pressed`/`aria-expanded`).
- `LandingPage.tsx`: navegación pública por categorías sin abrir flujo de autenticación.
- `CategorySection.tsx`: anclas y margen de desplazamiento para secciones filtradas.
- Validación: `tsc --noEmit`, `pnpm build`, Prettier, `git diff --check` correctos; suite 244 pruebas en 31 archivos.

---

## Sprint 11.5 — Autenticación Nativa por Email y Multi-Tenancy D1 — Completado

- Registro abierto con verificación de correo vía Resend (`AUTH_EMAIL_FROM = "ARK LEDGER <no-reply@arksystems.site>"`).
- Establecimiento seguro de contraseña tras confirmación de correo.
- Sesiones blindadas con cookies `HttpOnly`, `Secure`, `SameSite=Lax`; tokens hasheados en D1; contraseñas PBKDF2-SHA256.
- Recuperación de contraseña con tokens de un solo uso y revocación automática de sesiones activas.
- Aislamiento estricto por `tenant_id` en todas las consultas D1.
- Consola de Super Admin (`/admin`) con monitoreo de despachos, usuarios y expedientes.
- Migración `0003_native_auth.sql` aplicada y operativa en producción.

---

## Sprint 12 — Colaboración en Equipo e Invitaciones a Despachos — Completado

**Objetivo:** Agregar colaboradores con roles granulares (`admin`, `member`, `viewer`), gestionar invitaciones con caducidad (7 días), reenviar o cancelar invitaciones, correos transaccionales vía Resend.

### 1. Migración D1 (`migrations/0004_tenant_invitations.sql`)

- Tabla `tenant_invitations`: `id` (UUID), `tenant_id`, `email`, `role`, `token_hash`, `invited_by_user_id`, `expires_at`, `accepted_at`, `created_at`. Índices sobre `(tenant_id, email)` y `token_hash`.

### 2. Backend (`src/server/invitationsApi.ts`)

- `GET /api/tenant/members`, `POST /api/tenant/invitations` (token de 32 bytes, hash SHA-256, email vía Resend), `DELETE /api/tenant/invitations/:id`, `POST /api/tenant/invitations/:id/resend`, `GET /api/invitations/info?token=...`, `POST /api/invitations/accept`.
- 11 pruebas unitarias (`invitationsApi.test.ts`).

### 3. Frontend UI

- `TeamModal.tsx`: modal de gestión de equipo con pestañas "Miembros Activos" e "Invitaciones Pendientes".
- `InviteAcceptModal.tsx`: pantalla de bienvenida y aceptación.

---

## Sprint 13 — Timbrado de Facturas CFDI 4.0 vía Alegra / Quadrum PAC (Cobros) — Completado

**Objetivo:** Emitir y timbrar CFDI 4.0 ante el SAT delegando PAC a Alegra (conector Quadrum PAC), credenciales protegidas con AES-GCM.

> Nota: este sprint describe la integración **legada** con Alegra/Quadrum. En la versión actual (`main` @ `3a58a0f`), el PAC live fue reemplazado por **Facturapi v2**; Alegra queda solo como alias de ruta `/api/alegra/*` y nombres de tabla D1 (`tenant_alegra_accounts`, `alegra_invoices`) por compatibilidad. Ver §4 de `docs/map.md`.

### 1. Migración D1 (`migrations/0005_alegra_integration.sql`)

- Tabla `tenant_alegra_accounts` con PK compuesta `(tenant_id, alegra_account_id)`, `alegra_token_enc` (BLOB AES-GCM), `csd_configured`, `is_default`, `status` (`active`|`revoked`|`error`).

### 2. Módulos Worker (`src/server/alegra/`)

- `credentials.ts`: AES-GCM 256 bits, IV aleatorio de 12 bytes, llave vía `ALEGRA_ENCRYPTION_KEY`.
- `alegraClient.ts`: cliente REST con Basic Auth, auto-detección CSD.
- `alegraApi.ts`: endpoints de cuentas, sincronización CSD, emisión e historial.
- `cron.ts`: health check cada 6h (`0 */6 * * *`) con alertas vía Resend.
- 11 pruebas unitarias (`alegraApi.test.ts`).

### 3. Frontend (`src/tools/timbrado/`)

- `useAlegra.ts`, `AlegraConnectModal.tsx`, `TimbradoFacturas.tsx` con formulario CFDI 4.0, descarga XML/PDF/UUID.
- 3 pruebas UI (`TimbradoFacturas.test.tsx`).

---

## Sprint 14 — Workers AI Fine-Tuning, Paywall Clip, Typewriter — Completado

**Objetivo:** Elevar el asistente (`ARK Contable AI`) a consultor fiscal experto en producción.

### 1. Delimitación de Alcance y Grounding (`src/server/ai/agent.ts`)

- Regla estricta de corte (anti-fuera-de-ámbito): declina preguntas de biología, medicina, deportes, etc.
- Corrección de premisas falsas (SBC no es impuesto; Subsidio para el Empleo vs SBC).
- Catálogo canónico de las 13 herramientas inyectado en el `systemPrompt`.
- `max_tokens: 2048` en todas las ejecuciones de Workers AI.

### 2. Paywall y Monetización con Clip (`src/server/ai/`)

- Migración `0006_ai_usage_paywall.sql`: tabla `ai_usage` (`id`, `tenant_id`, `month_key`, `query_count`, `is_pro`).
- Límite de 10 consultas mensuales gratuitas por despacho; exención para `super_admin`; HTTP `402 Payment Required` al agotar cuota.
- `GET /api/ai/quota`; enlace de suscripción Clip (`https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65`, $399 MXN/mes).

### 3. Frontend (`src/components/AiAssistantWidget.tsx`)

- Animación Typewriter (`simulateTyping`, ~200-600ms); formateo Markdown enriquecido (`renderFormattedContent`).
- Accesibilidad y contraste (burbujas de usuario en `bg-navy` con texto blanco/dorado).
- Tarjeta interactiva de paywall en chat (contador `x/10 gratis`, bloqueo reactivo del textarea).

### 4. Corrección en `TeamModal.tsx`

- `createPortal(..., document.body)` para submodal "Invitar Colaborador"; eliminación de botón duplicado.

---

## Sprint 15 — Calculadora y Cédula RESICO 2026 (PF y PM) — Completado

**Objetivo:** Módulo integral de pagos provisionales mensuales para RESICO (PF y PM).

### 1. Motores Matemáticos (`src/tools/resico/`)

- `types.ts`: interfaces tipadas `EntradaResicoPF`, `EntradaResicoPM`, `ResultadoResicoPF`, `ResultadoResicoPM`.
- `data/tablasResico.ts`: tabla progresiva mensual ISR PF (1.00% a 2.50%, tope $3.5M); retención PM 1.25%; tasa corporativa 30% PM; topes $3.5M PF y $35M PM.
- `calcularResicoPF.ts`: tasa y cálculo ISR mensual, acreditamiento retención 1.25%, liquidación IVA (Art. 5 LIVA), monitoreo tope $3.5M (4 umbrales).
- `calcularResicoPM.ts`: base gravable sobre flujo de efectivo, tasa 30%, acreditamiento pagos provisionales, liquidación IVA, tope $35M.
- `exportarResico.ts`: exportación CSV BOM UTF-8, mensaje ejecutivo para WhatsApp.
- 12 pruebas unitarias (`calcularResico.test.ts`).

### 2. Componentes y Cédula Carta QR

- `ParametrosResicoCard`, `ResultadoResicoCard` (`LiquidGlassDome`, importe en letras Art. 28 CFF, barra tope $3.5M), `DesgloseResicoTable`, `CedulaResicoModal` (Carta, @media print, sello SHA-256, QR).
- 4 pruebas UI (`CalculadoraResico.test.tsx`).

### 3. Integración

- `App.tsx` (`ToolId 'resico'`, lazy, categoría Fiscal); `ExpedienteToolBanner`; `PapelDeTrabajoModal` retrocompatible; `LandingPage` & `Footer`; `server/ai/tools.ts` y `agent.ts` (función `calcular_resico`, herramienta #14 en prompt).

---

## Sprint 16 — Renovación de Landing Page y Dashboard — Completado

**Objetivo:** Enfoque en blindaje y evidencia fiscal.

- Hero público y dashboard con propuesta de valor unificada ("Cálculos auditables. Blindados ante cualquier revisión.").
- Badge de confianza `El Sistema Operativo de la Defensa Fiscal` / `Blindaje & Evidencia Fiscal 2026`.
- Banner de Moat en Dashboard con `Fingerprint` (Papel de Trabajo con Sello SHA-256 verificable públicamente).
- Badges Freemium: `GRATIS` (neutral) y `PRO` (dorado) para herramientas avanzadas.
- Caja Freemium en Landing: "Modelo Transparente: Gratis para calcular, Pro para blindar".
- Catálogo completo de 14 herramientas; estandarización de categorías; grid de 3 columnas en Fiscal.
- Sección de negocio transparente: ¿Cómo ganamos dinero si las calculadoras son gratis? (3 pilares).
- Typecheck limpio; 315 pruebas en 42 suites; bundle Vite sin errores.

---

## Sprint 17 — Optimización de Rendimiento, Resiliencia y Scripts Periciales Python — Completado

- Reducción de bundle inicial >55%: migración de 14 herramientas y consola de administración a `React.lazy()` con `Suspense` y `ToolSkeleton`. Chunk principal de 502.52 kB a 222.36 kB (60.88 kB gzip). Build de 37s a 22s.
- Pipeline de linting con cero advertentes (`.eslintrc.cjs`): ESLint con TypeScript, React Hooks, JSX Runtime, Prettier. `pnpm lint` 100% limpio.
- `ErrorBoundary.tsx` institucional con protección global y por herramienta; 3 pruebas unitarias.
- Limpieza de advertencias en pruebas Vitest (`act(...)`, `waitFor(...)`). Cobertura: 318 pruebas en 43 suites.
- Cabeceras de seguridad perimetral en Worker (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- Favicon vectorial `public/favicon.svg`; metadatos SEO/OpenGraph/Twitter en `index.html`.
- Tríada de scripts Python: `dof_sat_watcher.py`, `cfdi_stress_generator.py`, `d1_audit_verifier.py`. Comandos en `package.json`: `watch:dof`, `generate:stress-cfdi`, `audit:d1`.

---

## Sprint 18 — GEO Engine: Descubrimiento por Agentes IA — Completado

**Objetivo:** Habilitar descubrimiento por motores de búsqueda de IA y agentes autónomos mediante documentos Markdown dinámicos.

### 1. Módulo GEO (`src/server/llmsTxt.ts`)

- `generateLlmsTxt()`: índice conciso (< 2,000 tokens) con parámetros oficiales vigentes y catálogo de herramientas en producción.
- `generateLlmsFullTxt()`: contexto técnico extendido con fórmulas y fundamentos legales.
- `generateRobotsTxt()`: directivas para crawlers de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.).
- Vinculación dinámica a `CATALOGO_2026` y `CURRENT_CATALOG_VERSION`.

### 2. Rutas en el Worker (`src/index.ts`)

- `GET /llms.txt` y `GET /.well-known/llms.txt`; `GET /llms-full.txt`; `GET /robots.txt`. Servidas antes del fallback SPA, `Cache-Control: public, max-age=86400`.

### 3. Pruebas y Calidad

- `llmsTxt.test.ts`: 3 pruebas unitarias. Typecheck limpio y lint sin advertencias.
- Métricas: 318/318 pruebas en 43 suites; 0 errores de tipos; build exitoso.

---

## Sprint 19 — Balance General Comparativo, Análisis Horizontal/Vertical (Herramienta #15) — Completado

**Objetivo:** Balance General Comparativo (Año Actual vs Año Anterior) con AH/AV, validación A=P+C, ingesta CSV/Excel, exportación CSV BOM UTF-8, Expediente Único, Papel de Trabajo PDF con SHA-256 + QR, inyección a Workers AI.

### 1. Core y Tipado (`src/tools/balance-general/`)

- `types.ts`: `CuentaBalance`, `JerarquiaBalance`, `ResultadoAnalisis`, `TotalesBalance`, `Naturaleza`, `TipoBalance`.
- `lib/calcularBalance.ts`: `calcularTotales` (tolerancia $0.02), `finalizarBalance` (AH/AV a 2 decimales, sin división por cero).
- `lib/parserBalanza.ts`: parser CSV/Excel con normalización y advertencias.
- 3 pruebas unitarias (`calcularBalance.test.ts`).

### 2. Componentes Visuales

- `ParametrosBalanceCard`, `TablaBalanceAnalitico`, `GraficosClasificacion`, `ResultadoBalanceCard` (`LiquidGlassDome` CUADRADO / NO CUADRADO).

### 3. Pantalla e Integración

- `CalculadoraBalance.tsx` con carga diferida, `ExpedienteToolBanner`, export CSV BOM UTF-8.
- `App.tsx`: lazy import, `ToolId 'balance-general'`, badge NUEVO en categoría Fiscal.
- `PapelDeTrabajoModal.tsx`: soporte `tool_id='balance-general'`.
- `server/ai/tools.ts`: herramienta `consultar_balance_general`; `agent.ts`: catálogo y directrices actualizados.

---

## Sprint 20 — Consolidación del CRM de Prospectos (Super Admin) — Completado

**Objetivo:** Consolidar, estabilizar y homologar el módulo CRM de prospectos (`leads_ark_tools`) en la consola Super Admin.

### 1. Backend y Persistencia D1 (`src/server/leadsApi.ts` & `migrations/0007_leads_crm.sql`)

- Tabla `leads_ark_tools` (`id`, `web`, `whatsapp`, `email`, `ciudad`, `especialidad`, `status`, `last_contact`, `contacto_nombre`, `notas`, `tenant_id`, `created_at`, `updated_at`) con índices.
- Endpoints `GET/POST /api/admin/leads`, `GET /api/admin/leads/stats`, `GET/PUT/PATCH/DELETE /api/admin/leads/:id`, aislamiento multi-tenant y `super_admin`.
- 11 pruebas unitarias (`leadsApi.test.ts`).
- ETL `scripts/python/import_leads_sheet.py` con normalización E.164.

### 2. Frontend Institucional (`src/components/admin/LeadsApp.tsx`)

- Homologación al ARK Design System (blanco institucional, Navy Trust `#002B7F`, Gold Value `#D4AF37`, tipografía Orbitron).
- 5 KPI Cards, filtros reactivos, tabla operativa con enlaces `wa.me`/`mailto:`, exportación CSV BOM UTF-8.
- Integración en `AdminPanel.tsx` (pestaña `leads`).

### 3. Workers AI y Agentic Tool Calling

- `AI_TOOLS_CATALOG`: registro de `consultar_leads_crm`; `executeAiTool`; `agent.ts` actualizado; `tools.test.ts` con prueba específica.

---

## Sprint 21 — Propuesta Comercial vía Resend y Ciclo Completo de Gestión de Prospectos — Completado

**Objetivo:** Cerrar el flujo comercial del CRM: envío de propuesta comercial personalizada por correo (Resend) con previsualización, y ciclo completo de alta/baja de prospectos.

### 1. Envío de Propuesta Comercial vía Resend

- `POST /api/admin/leads/:id/send-email`: valida sesión, arma correo (texto + HTML), entrega vía Resend. Envíos reales actualizan `status` a `Mail_enviado_DDMMYY` y `last_contact`; envíos de prueba **no** modifican el estatus. Errores de Resend → HTTP `502`.
- `LeadsApp.tsx`: modal interactivo con previsualización, envío de prueba, aviso de que no modifica el estatus, estado de carga y feedback de entrega.

### 2. Alta y Baja de Prospectos

- `POST /api/admin/leads` (alta con estatus `Nuevo`) y `DELETE /api/admin/leads/:id` (baja con confirmación explícita), aislamiento por `tenant_id`.

### 3. Estado de Calidad

- Suite completa: 333 pruebas en 45 suites — 100% éxito. Typecheck 0 errores. Lint 0 errores/advertencias. Auditoría fiscal 6/6. Build en 29.02s.

---

## Sprint 22 — Sincronización del Catálogo de Herramientas y Guardas de Regresión — Completado

**Objetivo:** Eliminar la deriva entre el catálogo real y los tres puntos donde se publica (GEO `/llms.txt`, system prompt de Noah, meta Open Graph).

### 1. Catálogo Canónico (`src/data/catalogo-herramientas.ts`)

- Arreglo `CATALOGO_HERRAMIENTAS` con 15 identificadores (en ese momento); `TOTAL_HERRAMIENTAS` derivado de `.length`. Cada entrada con `id` que coincide con `ToolId` de `App.tsx`.

### 2. GEO Engine (`src/server/llmsTxt.ts`)

- Encabezado derivado de `TOTAL_HERRAMIENTAS`; incorpora RESICO 2026 y Balance General; nueva sección "Patrimonial y Análisis Financiero"; elimina copia local del catálogo.
- Anexo `llms-full.txt`: §4 RESICO, §5 Balance General, §6 Estándar SHA-256.

### 3. ARK Contable AI (`src/server/ai/agent.ts`)

- `buildSystemPrompt(tenantId)` exportable; conteos `${TOTAL_HERRAMIENTAS}`; directivas de invocación generadas desde `DIRECTIVAS_HERRAMIENTAS` + `buildToolDirectives()`; instrucción "Nunca inventes datos del cliente".

### 4. Meta Open Graph (`index.html`)

- `og:description` corregida a "Suite de 15 herramientas" (en ese momento).

### 5. Guardas de Regresión (12 pruebas nuevas)

- `catalogo-herramientas.test.ts` (4): 15 herramientas, ids únicos, sincronía con `ToolId`.
- `agent.test.ts` (7): conteo en prompt, cobertura de 15 herramientas, directiva para cada tool de IA, orden de directivas, interpolación del tenant.
- `llmsTxt.test.ts` (+1): toda herramienta publicada, no reaparecen conteos desactualizados ("13 Herramientas").

### 6. Métricas del Sprint

- 345/345 pruebas en 47 suites (100% éxito); 0 errores TypeScript; 0 errores de linting; build exitoso. Catálogo GEO: 15 herramientas / 5 categorías / ~1,434 tokens.
- Despliegue: commit `cc9fd6f` → `main`; Worker Version ID `60d3529a-e31e-4181-9e89-02b3fc978bf2`.

---

## Sprint 23 — Cobertura de Pruebas UI del CRM y del Balance General — Completado

**Objetivo:** Cerrar brecha de cobertura de `LeadsApp.tsx` y `CalculadoraBalance.tsx`.

### 1. CRM de Prospectos (`LeadsApp.test.tsx`) — 15 tests

- Carga y KPIs, canales directos (`wa.me`/`mailto:`), filtros, actualización inline de estatus (`PATCH`), alta de prospecto, baja con doble confirmación, propuesta comercial vía Resend, envío de prueba (no modifica estatus en D1), export CSV con BOM UTF-8.

### 2. Balance General (`CalculadoraBalance.test.tsx`) — 7 tests

- Renderizado (encabezado, badge "Herramienta #15"), navegación (`onBack`), ingesta real de CSV con `XLSX`, ecuación contable CUADRADO/NO CUADRADO, tabla analítica AH%/AV%, export CSV BOM UTF-8.

### 3. Endurecimiento de la Suite

- Timeout explícito (30s) en test de batch con sellado SHA-256 y QR de `CierreNomina.test.tsx`.
- Intercepción del clic del ancla de descarga (elimina ruido `Not implemented: navigation` de jsdom).

### 4. Métricas del Sprint

- +22 pruebas (367 en 49 suites, 100% éxito); 0 errores TypeScript; 0 errores de linting.

### 5. Normalización de Finales de Línea (`.gitattributes`)

- `.gitattributes` con `* text=auto eol=lf`; formatos binarios como `binary`. Índice almacena LF en todos los archivos. Corrige `format:check` en Windows (`core.autocrlf=true`).

---

## Sprint 24 — Formato Unificado, Hook de Pre-commit y Colisión de `pnpm deploy` (documentado dentro de Sprint 23) — Completado

### 1. Formato Unificado del Repositorio

- 165 archivos desviados de Prettier; se aplicó `prettier --write` sobre todo el repo. `.prettierignore` nuevo (excluye `node_modules/`, `dist/`, `.wrangler/`, `coverage/`, `.husky/_/`, lockfiles, artefactos Python). Scripts `format` y `format:check` ampliados a todo el repositorio.

### 2. Bug Latente de Supresión de ESLint

- `src/data/valores-vigentes/hooks.ts`: `eslint-disable-next-line` re-anclado inmediatamente encima del array de dependencias (inmune a reformateo). 6 `eslint-disable` del repo auditados; 4 restantes correctamente anclados.

### 3. Hook de Pre-commit Activo

- `.husky/pre-commit` creado con `npx lint-staged`. Verificado empíricamente con un commit real.

### 4. Colisión de `pnpm deploy` Resuelta

- `"deploy": "pnpm run deploy:production"` para que `pnpm run deploy` y `pnpm run deploy:production` funcionen. Documentado en `AGENTS.md`.

### 5. CI y Documentación

- `.github/workflows/ci.yml` activo en `main` (typecheck, lint, format:check, verify:catalogo, test, build).
- `.gitattributes` normaliza finales de línea a LF. `AGENTS.md` con guía de trabajo, 5 reglas de la casa y mapa rápido del repo.
- Métricas: 367/367 pruebas en 49 suites; format:check verde; bundle 223.59 kB / 60.74 kB gzip.
- Despliegue: commits `3b881a0` y `78180b9` → `main`; Worker Version ID `69540930-4d34-447b-8301-f07776c6c07e`.
- Pendiente de push: commit `25ad7ee` (`.github/workflows/ci.yml`) requiere token de GitHub con scope `workflow`.

---

## Sprint 25 — Herramienta #18: Actualización y Recargos Fiscales (CFF) + Conciliación Anexo 24 (#16) — Completado

**Objetivo:** Eliminar dependencia de software obsoleto (.exe) y macros de Excel; cierre de catálogo a 18 herramientas.

### 1. Motor Matemático y Jurídico (`src/tools/recargos/lib/calcularRecargos.ts`)

- Truncamiento estricto a 4 decimales (`Math.floor(factor * 10000) / 10000`).
- Regla anti-deflación (factor neutro `1.0000` si INPC reciente/antiguo < 1.0000).
- Mora fiscal sobre base actualizada (Art. 21 CFF y Art. 8 LIF, 1.47% mensual).
- Fracciones de mes como meses completos de mora.

### 2. Catálogo Centralizado de INPC y Vigilancia DOF

- `TABLA_INPC` (2021-2026) en `catalogo.ts` con `obtenerInpc()` y `obtenerUltimoInpc()`. `TASA_RECARGOS_MORA_2026` integrada en `CATALOGO_2026`. `dof_sat_watcher.py` con severidad CRITICO.

### 3. Componentes Visuales

- `ParametrosRecargosCard`, `DesgloseActualizacionTable`, `ResultadoRecargosCard` (`LiquidGlassDome`, importe en letras), `CedulaRecargosModal` (Carta @media print, SHA-256, QR).

### 4. Integración GEO y Noah AI

- `catalogo-herramientas.ts`: herramienta #18 (`recargos`), `TOTAL_HERRAMIENTAS` a 18. `tools.ts` y `agent.ts`: directiva `calcular_recargos_fiscales` (9 tools de IA). `llmsTxt.ts`: fórmulas CFF Art. 17-A y 21.

### 5. Métricas y Despliegue

- 417 pruebas en 58 suites (100% éxito); auditoría DOF 7/7; typecheck y lint 0; formato 100%; build Vite v5.4.21 exitoso (1,786 módulos). Despliegue: commit `2c22916`; Worker Version ID `9346525b-db87-48ad-bc58-59ca5c99f8de`.

---

## Sprint 26 — Herramienta #19: Simulador de Modalidad 40 (Criterio DOF 21/10/2026) — Completado

**Objetivo:** Proteger contadores y pensionados frente al Acuerdo `ACDO.AS2.HCT.101026/302.P.DG` (DOF 21/10/2026) que restringe la Continuación Voluntaria (Modalidad 40).

### 1. Marco Jurídico y Criterio Restrictivo

- Tope restringido: salario diario topado al menor entre 25 UMAs y último salario con patrón + 1 UMA diaria.
- Prohibición de pagos retroactivos masivos. Cuota 2026: 14.438% mensual.

### 2. Motor Actuarial y Valores Oficiales

- `catalogo.ts`: `CUOTA_MODALIDAD_40_2026 = 0.14438`, `CUOTA_MODALIDAD_40_PCT_2026 = 14.438`. Auditoría DOF elevada a 8/8.
- `modalidad40/types.ts`: interfaces `Modalidad40Input`, `Modalidad40Result`, `ComparativaLimites`, `Tabla167Grupo`.
- `lib/calcularModalidad40.ts`: fórmula actuarial completa con simulación con/sin restricción DOF 2026, semanas excedentes, asignaciones familiares, sellado SHA-256.
- 11 pruebas unitarias (`calcularModalidad40.test.ts`).

### 3. Componentes Visuales

- `ParametrosModalidad40Card`, `ComparativaLimitesCard`, `ResultadoPensionCard` (`LiquidGlassDome`, ROI), `CedulaModalidad40Modal` (Carta @media print, SHA-256, QR). `Modalidad40.tsx` y `Modalidad40.test.tsx` (4 pruebas UI).

### 4. Integración

- `catalogo-herramientas.ts`: herramienta #19, `TOTAL_HERRAMIENTAS = 19`. `App.tsx` y `LandingPage.tsx` actualizados. `actos.ts` actualizado con notas sobre el acuerdo. `llmsTxt.ts` documentado. `tools.ts` y `agent.ts`: función `calcular_modalidad_40` (10 tools de IA).

### 5. Métricas

- 432 pruebas en 60 suites (100% éxito); auditoría DOF 8/8; typecheck 0; lint 0; formato 100%.

---

## Sprint 27 — Onboarding Guiado, Caso Demo Sandbox y "Aha! Moment en 60s" — Completado

**Objetivo:** Resolver fricción inicial del contador recién registrado; experimentar Expediente Único + Cálculo Automatizado + Papel de Trabajo con Sello SHA-256 en <60s.

### 1. Entidades Canónicas de Demostración (`src/data/demo-onboarding.ts`)

- `DEMO_EMPRESA`, `DEMO_TRABAJADOR`, `DEMO_EXPEDIENTE_EJEMPLO`. Valores derivados del catálogo oficial (`VALORES_POR_ID`), cero hardcoding.

### 2. Motor Sandbox en Contexto (`src/context/ExpedienteContext.tsx`)

- `isDemoActive`, `loadDemoData()`, `clearDemoData()`. Sellado criptográfico client-side en modo demo (`crypto.subtle.digest('SHA-256')`).

### 3. Experiencia de Usuario y Componentes UI

- `OnboardingQuickstartModal.tsx`, `OnboardingCelebrationModal.tsx`; `LandingPage.tsx` (reenvío de correo con cooldown 60s, `generatePassphrase` con longitud mínima 12); `src/server/auth.ts` (plantilla HTML corporativa para Resend); `ExpedienteSelector.tsx` (badge "Sandbox Demo"); `ExpedienteToolBanner.tsx` (cargar caso demo desde cualquier calculadora); `App.tsx` (botón "Tour Demo (60s)").

### 4. Métricas

- 441 pruebas en 62 suites (100% éxito). +5 pruebas (`OnboardingQuickstartModal.test.tsx`) + 4 pruebas (`OnboardingCelebrationModal.test.tsx`). Typecheck 0; lint 0; formato 100%.

---

## Sprint 28 — Brand Config Engine y Marca Blanca Institucional (CANACO SERVYTUR MÉRIDA) — Completado

**Objetivo:** Motor de marca en `src/config/brand/` con desacoplamiento multi-brand.

### 1. Arquitectura de Desacoplamiento

- `types.ts`: contrato `BrandConfig`, `BrandColors`, `BrandFeatures`, `BrandFooter`.
- `ark.ts`: config canónica ARK LEDGER (modo oscuro, Navy `#002B7F`, Oro `#FFD700`, 19 herramientas).
- `canacoMerida.ts`: config institucional CANACO SERVYTUR MÉRIDA (Azul institucional `#1a467e`, acento `#c49a45`, `ventanillaPagos: true`, catálogo curado de 12 herramientas).
- `index.ts`: selector dinámico por `VITE_BRAND` o hostname (`canacomerida.com.mx`), fallback a ARK LEDGER.

### 2. Vector Gráfico Oficial y Componentes de Identidad

- `CanacoLogo.tsx`: variantes `symbol` y `full`. `BrandLogo.tsx`: conmutador dinámico. Homologación de `Header.tsx` y `Footer.tsx` para consumir de `currentBrand`.
- `docs/canaco-henequen.md`: documento maestro de diseño (120 Años, Regla del 8% henequenero, tokens Cal, Sisal, Muro, Arena, Añil `#1A3A5C`, Terracota `#B85C38`, Verde agave `#4A7C6F`).
- `scripts/forge_henequen_meta.py`: fábrica vectorial Python stdlib (10 assets, 18.39 KB en `public/assets/henequen/`). Tokens `henequen-*` en `tailwind.config.js`.

### 3. Componentes Exclusivos CANACO y Persistencia CRM D1

- `afiliacionesApi.ts`: endpoint `/api/afiliaciones/registro` con persistencia en `leads_ark_tools` (`tenant_id = 'canaco_merida'`), endpoint `/api/afiliaciones/consulta?rfc=`.
- `leadsApi.ts`: autorización y bypass para `horus.i2d@gmail.com` sobre tenant `canaco_merida`.
- `calculoCuota.ts`: motor de cuotas SIEM y Membresía Anual. `VentanillaAfiliacionModal.tsx`: modal 3 pasos. `ConstanciaSocioModal.tsx`: cédula oficial Carta con SHA-256 y QR. `CanacoPortalBanner.tsx`: banner de socio en Dashboard. `CanacoAdminPadron.tsx`: consola de afiliaciones y padrón SIEM. `AdminPanel.tsx`: pestaña nativa `CANACO MÉRIDA`. `CanacoLandingPage.tsx`: landing pública oficial (HENEQUÉN, 6 servicios gremiales, buscador por RFC). `canacoArkangelSync.ts`: pipeline Worker-to-Worker / REST con Arkangel (E.164, webhooks).

### 4. Métricas

- 481 pruebas en 69 suites (100% éxito). +7 nuevas suites de prueba. Auditoría DOF 8/8. Typecheck 0; lint 0; formato 100%.

---

## Sprint 29 — Módulo de Cruce Laboral-Fiscal de Jornada (CFDI Nómina 1.2 vs Reloj Checador) — Completado

**Objetivo:** Auditoría cruzada SAT vs IMSS vs STPS (LFT Art. 132 Fracc. VIII Bis).

### 1. Fundamentación Jurídica

- STPS: registro fidedigno de jornada y reloj checador. SAT: materialidad y deducibilidad de nómina (Art. 27 Fracc. V LISR, Art. 28 CFF). IMSS: horas extraordinarias integran al SBC (Art. 27 Fracc. IX LSS).
- Tipificación de discrepancias: `HORAS_EXTRAS_NO_PAGADAS`, `HORAS_EXTRAS_SIN_REGISTRO`, `SIN_REGISTRO_CHECADOR`, `EMPLEADO_SIN_CFDI`, `EXCESO_JORNADA_LEGAL_TRIPLE`.
- Score de consistencia 0-100%; niveles BAJO/MEDIO/ALTO/CRITICO.

### 2. Motor Reconciliador y Parsers (`src/tools/cierre-nomina/lib/cruceNominaChecador.ts`)

- Ingesta CFDI Nómina 1.2 XML y CSV de Reloj Checador (formato de eventos y consolidado). Generador de dataset demostrativo (`generarLoteMuestraCruce`). Sellado SHA-256 client-side. Exportador CSV UTF-8 BOM.
- 15 pruebas unitarias (`cruceNominaChecador.test.ts`).

### 3. Experiencia de Usuario y Papel de Trabajo

- Pestaña dual en herramienta #12 ("Cierre de Nómina Masivo" y "Cruce Laboral-Fiscal"). Drag & Drop dual. KPIs: empleados analizados, horas extra, discrepancias, score de consistencia, nivel de riesgo.
- `CedulaCruceJornadaModal.tsx`: Carta @media print, sello SHA-256, QR, tabla de auditoría, 3 bloques de firma. Integración con `saveCalculoExpediente`.

### 4. GEO y Agente Noah AI

- `/llms.txt` Sección 7 (Consistencia Laboral-Fiscal). `agent.ts` directiva institucional. `catalogo-herramientas.ts`: descripción de herramienta #12 actualizada.

### 5. Métricas

- 498 pruebas en 70 suites (100% éxito). +15 pruebas (`cruceNominaChecador.test.ts`) + 2 pruebas UI (`CierreNomina.test.tsx`). Auditoría DOF 8/8. Typecheck 0; lint 0; formato 100%. Build en 29s (1,815 módulos).

---

## Sprint 16 (CANACO) — Portal de Servicios al Socio CANACO & Ecosistema B2B Ark Systems — Completado

> Aparecía fuera de orden y duplicado en `map.md`; se registra aquí bajo Sprint 16.

**Objetivo:** Portal de servicios al socio con heráldica oficial de CANACO Mérida y captura de leads B2B.

- Navegación y cabecera institucional con badge `Portal del Socio`. Hero con badge "Fundada en 1906 · 120 Años". Suite de 19 herramientas visible para demostración ante el Consejo Directivo.
- Footer institucional CANACO con sello `Desarrollado con tecnología de Ark Systems (Substrate Holdings LLC)` y badge `White-Label`. Card de captura gremial con `mailto: pavel@arksystems.site`. Footer global multi-marca en `Footer.tsx`.
- Métricas: 24 pruebas en suite cameral y de marca; auditoría DOF 8/8; puertas completa (typecheck, lint, format); build Vite v5.4.21 (1,795 módulos).

---

## Sprint 30 — Detector de Comportamientos Atípicos en CFDI (#20) — Completado

> Aparecía duplicado en `map.md`; se registra una sola vez aquí.

**Objetivo:** Auditoría forense CFDI 4.0/3.3 100% en cliente.

### 1. Arquitectura y Capacidades

- Ingesta `.zip`, `.xml` (CFDI 4.0/3.3) y metadata `.txt` del SAT (delimitador `~`). Procesamiento streaming en memoria con persistencia en IndexedDB (`ark_auditor_cfdi_db`). Gestión multi-RFC.
- Motor estadístico forense: Ley de Benford (primer dígito), Puntaje Z e IQR (`|Z| > 2.0`), fraccionamiento de efectivo (< $2,000 mismo día/contraparte), efectivo superior a $2,000 (Forma 01 no deducible), desfase de timbrado (> 72h, Art. 39 RCFF), horarios atípicos (23:00-05:00, días inhábiles), conciliación Metadata SAT (cancelados activos en contabilidad, cancelaciones extemporáneas Art. 29-A CFF), cruce 69-B (EFOS), concentración HHI.
- Malla mensual Jan-Dec con mapas de calor semánticos. Matriz de riesgo 5×5. Resumen ejecutivo y dictamen pericial (exportación PDF y Excel multi-hoja). Exportación de instantánea JSON y cargador de datos demo.

### 2. Componentes y Código

- `types.ts`, `indexedDbStorage.ts`, `zipIngestor.ts`, `motorForense.ts` (7 tests), `generadorDemo.ts`, `exportarAuditoriaExcel.ts`.
- Componentes: `GestionContribuyentes`, `MallaMensual`, `MatrizRiesgo5x5`, `ConciliacionMetadata`, `CriteriosConfig`, `ResumenEjecutivo`, `DetalleComprobantesModal`. `AuditorCFDIAtipico.tsx`, `index.ts`.

---

## Sprint 31 — Automatización Transaccional Resend y Conciliación Arkangel — Completado

**Objetivo:** Arquitectura de notificación y separación de rieles entre Ark-Ledger (Sistema de Registro, Portal del Socio, Padrón SIEM) y Arkangel (Riel de Cobranza).

### 1. Arquitectura

- Disparo de correo oficial al conciliarse la cuota (vía webhook de Arkangel `/api/canaco/webhook-pago-arkangel` o liquidación en Ventanilla Digital `/api/afiliaciones/registro`).
- Plantilla HENEQUÉN en `canacoEmailService.ts`: correo responsivo con tokens Añil (`#1A3A5C`) y Cantera (`#EFE7D8`), desglose de importe, Folio SIEM, sello SHA-256, botones de descarga de cédula con QR, acceso al Portal del Socio.

### 2. Archivos y Cobertura

- `canacoEmailService.ts`: conexión con Resend, formateo de cuota, render HTML patrimonial (6 pruebas unitarias).
- `canacoArkangelSync.ts`: invocación no bloqueante de `sendCanacoConfirmacionPagoEmail` al recibir conciliación SPEI.
- `afiliacionesApi.ts`: invocación de `sendCanacoConfirmacionPagoEmail` tras pago exitoso en ventanilla digital.

### 3. Métricas

- 509 pruebas en 72 suites (100% éxito). Typecheck 0; lint 0; formato 100%.

---

## Sprint 35 (Octubre/Nov 2026) — Bóveda Offline, Billing y StayPuft — Completado (post-map.md)

- `src/lib/bovedaOffline.ts`: exportación .zip (JSZip) con `datos_expediente.json`, `papel_de_trabajo.html`, `offline-viewer.html` y `manifest.sha256` (FIPS 180-4, `sha256sum -c`). Visor offline 100% autónomo con recálculo SHA-256 en Web Crypto API.
- `src/server/billing/`: paywalls Pro, configuración de billing, quota indicator, header badges, webhook de auditoría.
- `src/server/staypuft/staypuftConnector.ts`: conector v3.1 (`ARK_LEDGER_VERSION = '3.1'`), fail-closed con `X-StayPuft-Key`, paginación estricta (default 20, cap 100), approval gate (bloquea timbrado, sellado, dictámenes, correos reales, WhatsApp/voz), bitácora inmutable `staypuft_audit_log` con redacción de PII (RFC, correo, XML CFDI), telemetría de IA (neuronas/tokens por tenant y período).
- Migraciones `0012_staypuft_audit_log.sql` y `0013_staypuft_ai_telemetry.sql` (CREATE TABLE IF NOT EXISTS, idempotente, auto-create en runtime + try/catch, métricas nunca 500).
- `POST /api/internal/ai/ask` con métricas de IA y neuronas; `GET /api/internal/metrics` y `GET /api/internal/status`.

---

**Fin de la bitácora histórica.** El estado actual consolidado se encuentra en `docs/map.md`.

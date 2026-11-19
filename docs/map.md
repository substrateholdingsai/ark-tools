# ARK LEDGER — Mapa del Proyecto y Estado Actual (map.md)

**Versión:** 3.1 — Suite de 22 Herramientas + Bóveda Offline Criptográfica (Art. 30 CFF) + Motor de Marca Blanca (CANACO SERVYTUR MÉRIDA) + Workers AI / StayPuft + Facturapi v2 (CFDI 4.0) + GEO Engine (/llms.txt)
**Fecha:** Noviembre 2026  
**Rama:** `main` @ `009634b` (`feat(canaco-tripartito): implementar afiliacion simultanea AAFY-SAT-IMSS con cedula AAFY y layout IDSE`)  
**Worker:** `ark-tools-production` en `https://ledger.arksystems.site`  
**Repositorio:** `https://github.com/substrateholdingsai/ark-tools`  
**Mantenedor:** Substrate Holdings LLC

> Este documento describe el **estado actual** del repositorio en `main`. Es la única fuente de verdad para conteos, rutas de API, migraciones y métricas de calidad. El detalle histórico de Sprints 1-34 se movió a `docs/changelog.md` (ver §8) para que este mapa se mantenga estable y no acumule conteos desactualizados.

---

## 1. Resumen Ejecutivo de Avance (estado actual)

| Métrica                        | Estado                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Herramientas integradas**    | **22 de 22** (100% operativas en código; ver §3 y `src/data/catalogo-herramientas.ts`, incluye `caja-codi` y `retencion-clinicas`)                                                                                                                                                                          |
| **Catálogo fiscal (DOF 2026)** | **22 entradas registradas** (16 valores base + 6 tasas ISN Yucatán); adicionalmente, recargos estatales Yucatán se resuelven en `src/tools/recargos/data/constantes.ts` al **2.07%**. Auditoría `pnpm verify:catalogo`: **22/22**, 0 proyecciones                                                           |
| **ISN Yucatán**                | **Versionado 2025/2026** (Art. 21–27 LGHY, Decreto 138/2025 y Decreto 147/2025): 2025 = **3.0%**, 2026 general = **3.75%**, 2026 micro/pequeña (1–50 emp.) = **3.0% neto** (−0.75% estímulo), gobierno estatal = **4.75% bruto** (estímulo no confirmado). Cédula Oficial AAFY exportable en CSV UTF-8 BOM  |
| **Ventanilla Tripartita**      | **CANACO — AAFY — SAT — IMSS**: Registro simultáneo (NRP IMSS 11 chars + REC Estatal AAFY), sincronización en D1 y distintivo `Tripartito AAFY-IMSS` en Padrón de Socios                                                                                                                                    |
| **Migraciones D1**             | **0001 → 0016 aplicadas; 0017 y 0018 pendientes de aprobación** (`ark_tools_db`)                                                                                                                                                                                                                            |
| **Timbrado CFDI 4.0**          | **Facturapi v2** (Sandbox SAT `EKU9003173C9` + Producción). Rutas `/api/facturapi/*` y alias `/api/alegra/*`. **Estado: `preview_only`** — timbrado en vivo deshabilitado hasta que el distribuidor ATEB/Facturapi firme precios por escrito. `ok: true` = pre-validación fiscal funciona, NO timbrado live |
| **Approval Gate (StayPuft)**   | Bloquea POST timbrado y DELETE cancelación en `/api/facturapi/invoices` y `/api/alegra/invoices` sin aprobación explícita de Pavel                                                                                                                                                                          |
| **Workers AI / StayPuft**      | Conector v3.1, telemetría de neuronas/tokens, `/api/internal/ai/ask`, `/api/internal/metrics`                                                                                                                                                                                                               |
| **Typecheck (TypeScript)**     | **0 errores** en modo estricto (`pnpm typecheck` → `tsc --noEmit`) — verificado                                                                                                                                                                                                                             |
| **Linting (ESLint)**           | **0 errores, 0 advertencias** (`pnpm lint --max-warnings 0`) — verificado                                                                                                                                                                                                                                   |
| **Formato (Prettier)**         | **100% uniforme** (`pnpm format:check` pasa) — verificado                                                                                                                                                                                                                                                   |
| **Pruebas (Vitest)**           | **110 suites pasadas / 984 pruebas pasadas (100% de éxito en vitest run)** — verificado en puerta completa                                                                                                                                                                                                  |
| **Compliance Multi-Tenant**    | **Marco LFPDPPP (DRAFT pendiente de revisión legal):** 3 docs en `docs/compliance/`, fuente parametrizada `src/data/compliance-legal.ts`, `LegalComplianceModal.tsx` conectado a `Footer.tsx` y `CanacoLandingPage.tsx`                                                                                     |
| **GEO Engine**                 | `/llms.txt`, `/llms-full.txt`, `/robots.txt` generados dinámicamente desde el catálogo canónico (22 herramientas)                                                                                                                                                                                           |

---

## 2. Mapa de Arquitectura y Estado de Componentes

> Árbol verificado contra el repositorio en `main` @ `009634b`. Los módulos marcados ✅ existen físicamente y están integrados en el Worker o en la SPA.

```
ark-tools/
├── docs/
│   ├── design-system.md              ✅ Especificación visual ARK
│   ├── calendario-mantenimiento.md  ✅ Cronograma anual de valores fiscales DOF
│   ├── canaco-henequen.md           ✅ Identidad museográfica-patrimonial CANACO Mérida
│   ├── plan-remocion-stripe-conekta.md ✅ Plan de remoción de pasarelas legacy
│   ├── map.md                       ✅ Este documento (estado actual)
│   ├── compliance/                  ✅ Marco legal LFPDPPP multi-tenant (DRAFT pendiente de revisión legal)
│   │   ├── aviso-de-privacidad.md   Aviso de Privacidad Integral (Responsable + Encargado; domicilio TODO)
│   │   ├── terminos-de-servicio.md  Términos de Servicio (papeles de trabajo + Facturapi v2 preview_only)
│   │   └── seguridad-y-datos.md     Política de Seguridad y Manejo de Datos Personales
│   └── instructivos/                ✅ 20 instructivos .md (uno por herramienta, incluido auditor-cfdi-atipico.md)
│       ├── README.md                Índice de instructivos
│       ├── anexo24.md
│       ├── auditor-cfdi-atipico.md  #20 — Detector de Atípicos CFDI
│       ├── auditor-cobranza.md
│       ├── balance-general.md       #15
│       ├── cierre-nomina.md         #12
│       ├── finiquitos.md
│       ├── guia-sat-imss.md
│       ├── isn.md
│       ├── leasing.md
│       ├── mapa-activos.md
│       ├── modalidad40.md           #19
│       ├── monitor-lfpiorpi.md      #17
│       ├── nomina.md
│       ├── recargos.md              #18
│       ├── resico.md                #14
│       ├── sbc.md
│       ├── spei.md
│       ├── timbrado.md              Facturapi v2 (preview_only)
│       ├── validador.md
│       └── xml-excel.md
├── scripts/
│   ├── verificar-catalogo.ts        ✅ CLI auditoría DOF (pnpm verify:catalogo)
│   ├── dof_sat_watcher.py           ✅ Vigilancia del feed DOF
│   ├── cfdi_stress_generator.py     ✅ Generador CFDI 4.0 sintéticos
│   ├── d1_audit_verifier.py         ✅ Auditor forense D1
│   ├── forge_henequen_meta.py       ✅ Factoria vectorial CANACO HENEQUÉN
│   ├── seed-canaco-horus.sql        ✅ Semilla padrón CANACO
│   ├── python/
│   │   └── import_leads_sheet.py    ✅ ETL prospectos E.164
│   └── sql/
│       ├── schema_leads.sql         ✅ Tabla leads_ark_tools
│       └── seed_leads.sql           ✅ Carga inicial de prospectos
├── migrations/                      ✅ 18 archivos; 0001–0016 aplicadas, 0017–0018 pendientes
│   ├── 0001_initial_schema.sql
│   ├── 0002_expediente_unico.sql
│   ├── 0003_native_auth.sql
│   ├── 0004_tenant_invitations.sql
│   ├── 0005_alegra_integration.sql
│   ├── 0006_ai_usage_paywall.sql
│   ├── 0007_leads_crm.sql
│   ├── 0008_tenant_subscriptions.sql
│   ├── 0009_canaco_buzon_documental.sql
│   ├── 0010_sentinela_regulatory_events.sql
│   ├── 0011_billing_webhook_events.sql
│   ├── 0012_staypuft_audit_log.sql
│   ├── 0013_staypuft_ai_telemetry.sql   (CREATE TABLE IF NOT EXISTS, idempotente)
│   ├── 0014_canaco_lifecycle.sql
│   ├── 0015_canaco_structured_employees.sql
│   ├── 0016_canaco_delegaciones.sql
│   ├── 0017_canaco_comms_jobs.sql       (pendiente)
│   └── 0018_canaco_sales_consent.sql    (pendiente)
├── instagram-creatives/             ✅ Generador creativos Instagram (Playwright + Jinja2)
├── forge_ark_meta.py                ✅ Generador SVG Social Meta Tags (cero deps)
├── public/                          ✅ Assets estáticos servidos por Workers
│   ├── og-image.svg
│   ├── twitter-image.svg
│   ├── favicon.svg
│   ├── logo-cube.svg
│   ├── logo-lockup.svg
│   ├── logo-email.png
│   ├── manifest.json
│   ├── presentacion-canaco.html
│   └── assets/                      (incluye henequen/ con manifest.json)
├── wrangler.toml                    ✅ SPA assets, D1 binding, Workers AI [ai], cron, vars
├── package.json                     ✅ pnpm@9.7.0, scripts build/deploy/test/lint/typecheck/format
├── AGENTS.md                        ✅ Guía de trabajo para agentes y reglas de la casa
├── .prettierignore                  ✅ Exclusiones Prettier
├── .husky/pre-commit                ✅ Hook activo (lint-staged)
├── .github/workflows/ci.yml         ✅ Pipeline CI: typecheck, lint, format:check, verify:catalogo, test, build
├── tailwind.config.js               ✅ Tokens ARK (Navy, Gold, LCD, Sombras, Radios) + henequen-*
├── tsconfig.json & vite.config.ts   ✅ Configuración estricta y aliases de ruta
├── vitest.config.ts                 ✅ Cobertura V8 y configuración de testing
├── .eslintrc.cjs                    ✅ ESLint + TypeScript + React Hooks + Prettier
├── index.html                       ✅ Meta OG/Twitter, og:description "Suite de 22 herramientas"
├── src/
│   ├── index.ts                     ✅ Worker Entry Point: /health, /api/*, /llms.txt, /llms-full.txt, /robots.txt, SPA fallback, cabeceras de seguridad
│   ├── index.tsx                    ✅ React DOM Root (AuthProvider + ExpedienteProvider)
│   ├── App.tsx                      ✅ Router principal, gating Landing/Dashboard, 22 herramientas lazy, ToolId union (22 ids)
│   ├── test-setup.ts                ✅ Setup global Vitest (jest-dom)
│   ├── config/
│   │   ├── billing.ts               ✅ Configuración de paywall / billing
│   │   └── brand/                   ✅ Motor de marca blanca (Brand Config Engine)
│   │       ├── types.ts             ✅ Contrato BrandConfig, BrandColors, BrandFeatures, BrandFooter
│   │       ├── ark.ts               ✅ Config canónica ARK LEDGER (22 herramientas)
│   │       ├── canacoMerida.ts      ✅ Config institucional CANACO SERVYTUR MÉRIDA (12 herramientas curadas, ventanillaPagos)
│   │       └── index.ts             ✅ Selector dinámico por VITE_BRAND / hostname, fallback ARK
│   ├── context/
│   │   ├── AuthContext.tsx          ✅ Sesión verificada en Worker, selección de tenant
│   │   └── ExpedienteContext.tsx    ✅ Clientes/expedientes, caché aislada por tenant, sandbox demo
│   ├── hooks/
│   │   ├── useAuth.ts               ✅ Hook multi-tenant unificado
│   │   ├── useProPlan.ts            ✅ Plan Pro y cuota de IA
│   │   └── index.ts                 ✅ Barrel export
│   ├── lib/
│   │   ├── cn.ts                    ✅ twMerge + clsx
│   │   ├── useTenant.ts             ✅ Contexto del tenant activo
│   │   ├── numeroALetras.ts         ✅ Importes a letras (Art. 28 CFF)
│   │   ├── apiClient.ts             ✅ Cliente tipado: sesión, D1, Auth, Teams, Alegra/Facturapi, cancelInvoice
│   │   ├── bovedaOffline.ts         ✅ Exportación .zip (JSZip), papel de trabajo, visor offline, manifest.sha256
│   │   ├── lazyWithRetry.ts         ✅ Lazy load con reintento para herramientas
│   │   └── whatsappStudio.ts        ✅ Plantillas WhatsApp por especialidad, deep links wa.me
│   ├── styles/
│   │   └── ark-system.css           ✅ Estilos base, fuentes, variables, @media print
│   ├── components/
│   │   ├── ui/                      ✅ Componentes atómicos (LiquidGlassDome, BadgeGold, GlassButton, etc.)
│   │   ├── billing/                 ✅ ProUpgradeModal (paywall Pro)
│   │   ├── brand/                   ✅ BrandLogo, CanacoLogo, conmutador de marca
│   │   ├── canaco/                  ✅ Ecosistema CANACO SERVYTUR MÉRIDA (16 archivos)
│   │   │   ├── CanacoLandingPage.tsx      ✅ Landing pública institucional (HENEQUÉN) con banner Programa Afiliación Simultánea AAFY-SAT-IMSS
│   │   │   ├── CanacoAdminPadron.tsx      ✅ Consola de Afiliaciones & Padrón SIEM con distintivo Tripartito AAFY-IMSS
│   │   │   ├── CanacoPortalBanner.tsx     ✅ Banner de socio en Dashboard
│   │   │   ├── ConstanciaSocioModal.tsx   ✅ Cédula oficial Carta con SHA-256 + QR
│   │   │   ├── VentanillaAfiliacionModal.tsx ✅ Ventanilla digital tripartita 3 pasos (captura NRP IMSS 11 chars + REC AAFY)
│   │   │   ├── BuzonDocumentalModal.tsx   ✅ Buzón documental físico-digital
│   │   │   ├── AdminExpedienteModal.tsx   ✅ Modal de expediente cameral
│   │   │   ├── calculoCuota.ts            ✅ Motor de cuotas SIEM / Membresía Anual
│   │   │   ├── anexosCanaco.ts / documentosBuzon.ts / types.ts / index.ts
│   │   ├── onboarding/              ✅ OnboardingQuickstartModal, OnboardingCelebrationModal (Aha! Moment 60s)
│   │   ├── Logo.tsx                 ✅ Cubo isométrico 3D ARK
│   │   ├── RegulatoryTicker.tsx     ✅ Cinta Wall Street 28px, pin DOF/SAT, modal 1-click
│   │   ├── Header.tsx               ✅ Header sticky, navegación por categorías, selector multi-tenant
│   │   ├── Footer.tsx               ✅ Footer institucional, privacidad XMLs, canales de soporte
│   │   ├── ExpedienteSelector.tsx   ✅ Barra cliente activo, búsqueda predictiva, modo demo
│   │   ├── ExpedienteToolBanner.tsx   ✅ Banner archivar con sello SHA-256
│   │   ├── PapelDeTrabajoModal.tsx    ✅ Cédula oficial Carta, @media print, SHA-256, QR
│   │   ├── VerificacionPublicaModal.tsx ✅ /api/expedientes/verify y portal público ?verify={hash}
│   │   ├── ToolCard.tsx             ✅ Tarjetas con badge, CTA
│   │   ├── CategorySection.tsx      ✅ Agrupador de categorías (1-4 cols)
│   │   ├── ToolSkeleton.tsx         ✅ Skeleton loader para lazy imports
│   │   ├── AuthGate.tsx             ✅ Acceso email/contraseña
│   │   ├── LandingPage.tsx          ✅ Registro, login, verificación, recuperación
│   │   ├── AiAssistantWidget.tsx    ✅ Widget chat Workers AI (Llama 3.3 70B + D1 Tools)
│   │   ├── ErrorBoundary.tsx        ✅ Frontera de errores institucional
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx       ✅ Consola Super Admin (métricas, directorio, pestañas + CANACO MÉRIDA)
│   │   │   ├── LeadsApp.tsx         ✅ CRM prospectos (KPIs, filtros, propuesta Resend, export CSV)
│   │   │   └── index.ts             ✅ Barrel export
│   │   ├── team/
│   │   │   ├── TeamModal.tsx        ✅ Gestión de equipo, invitaciones, cambio de roles
│   │   │   ├── InviteAcceptModal.tsx ✅ Aceptación de invitación
│   │   │   └── index.ts             ✅ Barrel export
│   │   └── index.ts                 ✅ Barrel export
│   ├── data/
│   │   ├── valores-vigentes/        ✅ Catálogo centralizado valores fiscales DOF 2026 (22 entradas)
│   │   │   ├── catalogo.ts          ✅ 16 valores base + 6 tasas ISN Yucatán; TASA_RECARGOS_MORA_2026, TABLA_INPC
│   │   │   ├── tipos.ts             ✅ Interfaces ValorFiscal, ConfigVigencia
│   │   │   ├── vigencia.ts          ✅ Motor evaluarVigencia / evaluarLote
│   │   │   ├── hooks.ts             ✅ useValorFiscal, useEstadoCatalogo
│   │   │   ├── AlertasVigencia.tsx  ✅ Banner global de valores próximos a vencer
│   │   │   └── index.ts             ✅ Barrel export
│   │   ├── estados.ts               ✅ Re-export ESTADOS desde isn/data/estados.ts (fuente única)
│   │   ├── catalogo-herramientas.ts ✅ Catálogo canónico 22 herramientas; TOTAL_HERRAMIENTAS = .length
│   │   ├── catalogo-herramientas.test.ts ✅ Sincronía con ToolId de App.tsx (22)
│   │   ├── actos.ts                 ✅ Guía SAT/IMSS (8 pasos, 8 actos, 3 plazos)
│   │   ├── conductas.ts             ✅ Activos Virtuales (12 conductas, 5 autoridades, umbrales)
│   │   ├── conductas-cobranza.ts    ✅ Auditoría Cobranza (43 conductas, 8 secciones)
│   │   ├── comparadores-contrato-crm.ts ✅ 12 comparadores Contrato vs CRM
│   │   └── demo-onboarding.ts       ✅ Entidades canónicas de demo (DEMO_EMPRESA, DEMO_TRABAJADOR)
│   └── tools/                       ✅ 21 módulos locales; `caja-codi` se resuelve externamente desde App.tsx
│       ├── isn/                     ✅ Calculadora ISN 32 estados + Cédula Oficial AAFY (Yucatán 3.75% bruto / 3.0% neto MIPyME 2026, Decreto 138/2025 + 147/2025, CSV UTF-8 BOM)
│       ├── sbc/                     ✅ Calculadora SBC IMSS
│       ├── nomina/                  ✅ Nómina Rápida 2026 (ISR + IMSS obrero)
│       ├── finiquitos/              ✅ Finiquitos y Liquidaciones LFT
│       ├── cierre-nomina/           ✅ Cierre de Nómina Masivo + Cruce Laboral-Fiscal (#12) + Layout IDSE/DISPMAG (175 chars IMSS)
│       ├── resico/                  ✅ RESICO 2026 PF/PM (#14)
│       ├── balance-general/         ✅ Balance General Comparativo (#15)
│       ├── anexo24/                 ✅ Conciliación Anexo 24 (#16)
│       ├── monitor-lfpiorpi/        ✅ Monitor Actividades Vulnerables (#17)
│       ├── recargos/                ✅ Actualización y Recargos federal/estatal Yucatán (#18)
│       ├── modalidad40/             ✅ Simulador Modalidad 40 DOF 2026 (#19)
│       ├── auditor-cfdi-atipico/    ✅ Detector de Comportamientos Atípicos CFDI (#20)
│       ├── retencion-clinicas/      ✅ Retención 2% Clínicas/Hospitales Yucatán (#22)
│       ├── xml-excel/               ✅ Conversor XML a CSV para Excel (CFDI 4.0/3.3)
│       ├── xml-validador/           ✅ Validador y Auditor de XMLs
│       ├── spei/                    ✅ Generador Enlaces de Pago Clip / SPEI
│       ├── leasing/                 ✅ Simulador Fiscal: Leasing vs Crédito vs Contado
│       ├── guia-sat-imss/           ✅ Guía Interactiva SAT/IMSS
│       ├── auditor-cobranza/        ✅ Auditoría Legal de Cobranza
│       ├── mapa-activos/            ✅ Mapa de Regulación de Activos Virtuales
│       └── timbrado/                ✅ Timbrado CFDI 4.0 vía Facturapi v2 (preview_only)
│           ├── TimbradoFacturas.tsx ✅ Pantalla principal, emisión, historial, cancelación SAT
│           ├── useAlegra.ts         ✅ Hook multi-empresa, estado CSD, cancelInvoice
│           └── components/
│               └── AlegraConnectModal.tsx ✅ Conexión Secret Key sk_test_/sk_live_, badge Sandbox/Producción
│
│   Nota: `caja-codi` (#13) completa las 22 herramientas mediante enlace externo a
│   `caja.arksystems.site` desde `src/App.tsx`; no ocupa un directorio en `src/tools/`.
│   └── server/                      ✅ APIs del Cloudflare Worker
│       ├── auth.ts                  ✅ Contraseñas PBKDF2, cookies HttpOnly, Resend, verificación/reset
│       ├── adminApi.ts              ✅ Super Admin Console (métricas, directorio tenants, roles)
│       ├── invitationsApi.ts        ✅ Miembros de despacho, invitaciones por correo, roles
│       ├── leadsApi.ts              ✅ CRM prospectos: leads_ark_tools, KPIs, propuesta Resend
│       ├── d1Api.ts                 ✅ Handlers D1 con autorización de membresía
│       ├── d1Api.expediente.ts      ✅ Clients/expedientes, SHA-256 determinista, verify público
│       ├── afiliacionesApi.ts       ✅ Afiliaciones CANACO, padrón SIEM, consulta por RFC
│       ├── ai/                      ✅ Cloudflare Workers AI & Agentic Tool-Calling
│       │   ├── types.ts             ✅ Tipos AiToolFunction, AiToolResult
│       │   ├── tools.ts             ✅ AI_TOOLS_CATALOG (14 herramientas) + executeAiTool
│       │   ├── agent.ts             ✅ Orquestador Llama 3.3 70B, buildSystemPrompt(tenantId), tool-calling
│       │   ├── aiApi.ts             ✅ /api/ai/status, /models, /tools, /chat, /quota
│       │   └── llmsTxt.ts           ✅ GEO Engine: /llms.txt, /llms-full.txt, /robots.txt
│       ├── alegra/                  ✅ Facturapi v2 (CFDI 4.0) — reemplaza Alegra/Quadrum como PAC live
│       │   ├── alegraClient.ts      ✅ FacturapiClient, toFacturapiInvoicePayload, auth Bearer <sk>
│       │   ├── alegraApi.ts         ✅ Endpoints /api/(alegra|facturapi)/{accounts,invoices,pdf,xml} + cancel
│       │   ├── credentials.ts       ✅ Cifrado AES-GCM 256-bit de tokens (WebCrypto)
│       │   └── cron.ts              ✅ Health check cada 6h con alertas Resend
│       ├── billing/                 ✅ Paywalls Pro, webhook de facturación, quota indicator
│       ├── bots/                    ✅ Ingesta de bots externos (Grok/Hermes)
│       ├── canacoArkangelSync.ts    ✅ Pipeline Worker-to-Worker / REST con Arkangel (E.164, webhook pago)
│       ├── canacoBuzonApi.ts        ✅ Buzón Documental CANACO
│       ├── canacoConektaService.ts  ✅ Servicio Conekta (CANACO, merchant of record legacy)
│       ├── canacoEmailService.ts    ✅ Correo transaccional (plantilla HENEQUÉN, Telnyx/Resend)
│       ├── email/                   ✅ Servicio unificado de correo transaccional (Telnyx & Resend)
│       │   └── emailService.ts      ✅ Conmutación dinámica Telnyx Email API / Resend con fallback de alta disponibilidad
│       ├── sentinela/               ✅ Sentinela Legal: webhook HMAC-SHA256, eventos regulatorios D1
│       └── staypuft/                ✅ Conector interno v3.1: fail-closed, paginación, approval gate, telemetría IA
```

---

## 3. Catálogo Canónico de las 22 Herramientas

Fuente única: `src/data/catalogo-herramientas.ts`. `TOTAL_HERRAMIENTAS = CATALOGO_HERRAMIENTAS.length` (22). Cada `id` coincide con el `ToolId` del router en `src/App.tsx` (verificado por `catalogo-herramientas.test.ts`).

### Grupo A — 13 esenciales PyME / CANACO (comercio y MiPyMEs)

| #   | id                | Nombre                                                    | Categoría                         | Estado           |
| --- | ----------------- | --------------------------------------------------------- | --------------------------------- | ---------------- |
| 1   | `isn`             | Calculadora ISN + Cédula Oficial AAFY Yucatán (CSV BOM)   | Fiscal y Laboral                  | active           |
| 2   | `sbc`             | Calculadora SBC (Salario Base de Cotización IMSS)         | Fiscal y Laboral                  | active           |
| 3   | `nomina`          | Calculadora de Nómina Rápida 2026                         | Fiscal y Laboral                  | active           |
| 4   | `finiquitos`      | Calculadora de Finiquitos y Liquidaciones LFT             | Fiscal y Laboral                  | active           |
| 5   | `resico`          | Calculadora y Cédula RESICO 2026                          | Fiscal y Laboral                  | active           |
| 6   | `balance-general` | Balance General Comparativo                               | Patrimonial y Análisis Financiero | active           |
| 7   | `cierre-nomina`   | Cierre de Nómina Masivo + Layout IDSE/DISPMAG (175 chars) | Fiscal y Laboral                  | active           |
| 8   | `xml-excel`       | Conversor XML a CSV para Excel (CFDI 4.0/3.3)             | SAT y CFDI (extracción local)     | active           |
| 9   | `validador`       | Validador y Auditor de XMLs                               | SAT y Auditoría CFDI 4.0          | active           |
| 10  | `spei`            | Generador de Enlaces de Pago Clip / SPEI                  | Cobros y Facturación Fiscal B2B   | active           |
| 11  | `leasing`         | Simulador Fiscal: Leasing vs Crédito vs Contado           | Cobros y Facturación Fiscal B2B   | active           |
| 12  | `timbrado`        | Timbrado de Facturas CFDI 4.0 vía Facturapi PAC           | Cobros y Facturación Fiscal B2B   | **preview_only** |
| 13  | `caja-codi`       | Cobro con CoDi — Ark Caja (enlace externo)                | Cobros y Facturación Fiscal B2B   | active           |

### Grupo B — 9 corporativo, forense, PLD y Yucatán

| #   | id                     | Nombre                                                 | Categoría                     | Estado |
| --- | ---------------------- | ------------------------------------------------------ | ----------------------------- | ------ |
| 14  | `guia-sat-imss`        | Guía Interactiva SAT / IMSS                            | Compliance y Defensa Jurídica | active |
| 15  | `auditor-cobranza`     | Auditoría Legal de Cobranza                            | Compliance y Defensa Jurídica | active |
| 16  | `mapa-activos`         | Mapa de Regulación de Activos Virtuales                | Compliance y Defensa Jurídica | active |
| 17  | `anexo24`              | Motor de Conciliación Anexo 24                         | SAT y Auditoría CFDI 4.0      | active |
| 18  | `monitor-lfpiorpi`     | Monitor de Actividades Vulnerables LFPIORPI            | Compliance y Defensa Jurídica | active |
| 19  | `recargos`             | Calculadora de Actualización y Recargos Fiscales (CFF) | Fiscal y Laboral              | active |
| 20  | `modalidad40`          | Simulador de Modalidad 40 (Criterio DOF 2026)          | Fiscal y Laboral              | active |
| 21  | `auditor-cfdi-atipico` | Detector de Comportamientos Atípicos en CFDI           | SAT y Auditoría CFDI 4.0      | active |
| 22  | `retencion-clinicas`   | Retención 2% Clínicas y Hospitales (Yucatán)           | Fiscal y Laboral              | active |

---

## 4. Timbrado CFDI 4.0 — Facturapi v2 (Estado: preview_only)

### Backend (`src/server/alegra/`)

- **Proveedor:** Facturapi v2 (`https://www.facturapi.io/v2`), reemplaza a Alegra / PAC Quadrum como PAC live.
- **Cliente:** `FacturapiClient` en `alegraClient.ts`; autenticación `Authorization: Bearer <secret_key>`.
- **Detección de entorno:** `sk_test_...` = Sandbox SAT (CSD de prueba `EKU9003173C9`, ESCUELA KEMPER URGATE, `csd_configured = true` automático cuando la organización no tiene CSD); `sk_live_...` valida CSD real del emisor en `GET /v2/organizations/me`.
- **Transformador:** `toFacturapiInvoicePayload` — payload de Ledger → esquema Facturapi (customer, `items[].product`, `use`, `payment_form`, `payment_method`, `type: 'I'`; si `payment_method === 'PPD'` entonces `payment_form = '99'`).
- **Rutas (ambas responden, cero rompimiento con frontend legacy):**
  - `POST /api/(alegra|facturapi)/accounts` — solo Secret Key requerida; email/label opcionales, auto-completado desde `/v2/organizations/me`.
  - `POST /api/(alegra|facturapi)/invoices` — timbra CFDI 4.0 en vivo, guarda `uuid`, `folio`, `pdf_url`, `xml_url` en D1 (`alegra_invoices`), fallback a `env.FACTURAPI_API_KEY` (clave Sandbox global).
  - `GET /api/(alegra|facturapi)/invoices/:id/pdf` y `/xml` — proxy seguro, **no expone el token Bearer al navegador**.
  - `DELETE /api/(alegra|facturapi)/invoices/:id?motive=02` — cancela CFDI ante el SAT, motivos `01`–`04`, actualiza `status` a `void` en D1.
- **Approval Gate:** `checkStayPuftApprovalGate` (en `src/server/staypuft/staypuftConnector.ts`) protege POST timbrado y DELETE cancelación en ambas rutas (`/api/facturapi/invoices` y `/api/alegra/invoices`).
- **Compatibilidad:** Los nombres de tabla D1 `tenant_alegra_accounts` y `alegra_invoices` se mantienen por compatibilidad; el `provider` se reporta como `'facturapi'`.

### Frontend (`src/tools/timbrado/`)

- **`AlegraConnectModal.tsx`:** pide solo Secret Key; badge dinámico "Sandbox SAT" / "CSD Activo"; email opcional (autocompletado).
- **`TimbradoFacturas.tsx`:** header muestra "Sandbox SAT (EKU9003173C9)" o "CSD Activo"; descarga PDF/XML vía `resolveDownloadUrl` con `tenant_id`; botón "Cancelar CFDI" en Historial con selector de motivo 01–04; badge "Cancelada SAT (void)".
- **`apiClient.ts` / `useAlegra.ts`:** agregados `cancelInvoice`, `alegra_email` opcional.

### Catálogo e IA

- `catalogo-herramientas.ts`: título/descripción de `timbrado` actualizado a **Facturapi PAC** (alimenta `/llms.txt` y el prompt de Noah).
- **Se eliminaron/marcaron como reemplazadas** todas las referencias user-facing a "PAC Quadrum / Alegra" y "ATEB en modo preview" en `Footer.tsx`, `LandingPage.tsx`, `App.tsx`, `TimbradoFacturas.tsx` y `docs/instructivos/timbrado.md`. Alegra queda solo como alias de ruta `/api/alegra/*` y nombres de tabla D1 por compatibilidad. Esto se declara explícitamente arriba.

### ⚠️ Aviso crítico para el walkthrough CANACO (lun 2026-11-16 10:00)

- El timbrado está en **`preview_only`**: la pre-validación matemática y fiscal funciona (`ok: true`), pero el **timbrado en vivo ante el SAT está deshabilitado** hasta que los precios de distribuidor ATEB / Facturapi se firmen por escrito.
- **No claimar** que el timbrado live está habilitado. El diagnóstico `ok` valida el motor de pre-validación, no el envío al PAC.

---

## 5. Valores Fiscales Vigentes (DOF 2026)

Catálogo en `src/data/valores-vigentes/catalogo.ts` — **22 entradas oficiales o verificadas**, auditoría `pnpm verify:catalogo`: **22/22**, 0 proyecciones:

1. `UMA_DIARIA_2026` — UMA diaria 2026
2. `UMA_MENSUAL_2026` — UMA mensual 2026
3. `SALARIO_MINIMO_GENERAL_2026` — SMG general 2026
4. `SALARIO_MINIMO_FRONTERA_2026` — SMG frontera 2026
5. `TOPE_SBC_25_UMA_2026` — Tope SBC 25 UMAs 2026
6. `TARIFA_ISR_MENSUAL_2026` — Tarifa ISR mensual 2026 (11 rangos internos)
7. `CUOTA_MODALIDAD_40_2026` — Cuota Modalidad 40 2026 (14.438%)
8. `TASA_RECARGOS_MORA_2026` — Tasa recargos por mora 2026 (1.47% mensual)
9. `CUOTA_IMSS_PATRONAL_ENFERMEDADES_MATERNIDAD_FIJA_2026`
10. `CUOTA_IMSS_PATRONAL_ENFERMEDADES_MATERNIDAD_ADICIONAL_2026`
11. `CUOTA_IMSS_PATRONAL_GASTOS_MEDICOS_PENSIONADOS_2026`
12. `CUOTA_IMSS_PATRONAL_INVALIDEZ_VIDA_2026`
13. `CUOTA_IMSS_PATRONAL_GUARDERIAS_2026`
14. `CUOTA_IMSS_PATRONAL_RETIRO_2026`
15. `CUOTA_IMSS_PATRONAL_CESANTIA_VEJEZ_2026`
16. `CUOTA_IMSS_PATRONAL_INFONAVIT_2026`
17. `ISN_YUC_2025_GENERAL` — ISN Yucatán 2025 general (3.0%)
18. `ISN_YUC_2026_GENERAL` — ISN Yucatán 2026 general (3.75%)
19. `ISN_YUC_2026_MICROPEQUENA_BRUTA` — tasa bruta 2026 (3.75%)
20. `ISN_YUC_2026_MICROPEQUENA_ESTIMULO` — estímulo micro/pequeña (0.75%)
21. `ISN_YUC_2026_MICROPEQUENA_NETA` — tasa neta micro/pequeña (3.0%)
22. `ISN_YUC_2026_GOBIERNO_ESTATAL` — gobierno estatal (4.75%)

**ISN Yucatán (versionado 2025/2026):** las seis entradas anteriores provienen de los Decretos 138/2025 y 147/2025 y se consumen desde `catalogo.ts`; `src/tools/isn/data/estados.ts` ya no duplica tasas. **Recargos Yucatán 2026:** `TASA_RECARGOS_MORA_YUCATAN_2026 = 2.07%`, Art. 56 de la Ley de Ingresos del Estado de Yucatán 2026, Decreto 140/2025. Por su naturaleza operativa local se mantiene en `src/tools/recargos/data/constantes.ts`, fuera del arreglo de 22 valores, y queda validada por `verify:catalogo`. Tool 22 (`src/tools/retencion-clinicas/`) implementa Retención 2% Clínicas y Hospitales (Art. 20-Bis a 20-Quinquies LGHY, formatos AAFY-30 y AAFY-31, exclusivo Yucatán). Nunca hardcodear valores fiscales; importar desde el catálogo central o desde la constante local documentada.

---

## 6. Migraciones D1 (0001 → 0018)

Las migraciones `0001`–`0016` están aplicadas en `ark_tools_db`; `0017` y `0018` están pendientes de aprobación:

| #   | Archivo                                | Tabla / propósito                                                                                                       |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | `0001_initial_schema.sql`              | Esquema inicial (users, tenants, guia_progress, arkangel_ledger, activos_watchlist)                                     |
| 2   | `0002_expediente_unico.sql`            | clients, expedientes, columnas client_id                                                                                |
| 3   | `0003_native_auth.sql`                 | Auth nativo, sesiones, rate limits                                                                                      |
| 4   | `0004_tenant_invitations.sql`          | tenant_invitations, tenant_memberships                                                                                  |
| 5   | `0005_alegra_integration.sql`          | tenant_alegra_accounts, alegra_invoices (mantener por compatibilidad)                                                   |
| 6   | `0006_ai_usage_paywall.sql`            | ai_usage (cuota y paywall Workers AI)                                                                                   |
| 7   | `0007_leads_crm.sql`                   | leads_ark_tools (CRM prospectos)                                                                                        |
| 8   | `0008_tenant_subscriptions.sql`        | tenant_subscriptions (billing/Pro)                                                                                      |
| 9   | `0009_canaco_buzon_documental.sql`     | Buzón Documental CANACO                                                                                                 |
| 10  | `0010_sentinela_regulatory_events.sql` | sentinela_regulatory_events (alertas regulatorias)                                                                      |
| 11  | `0011_billing_webhook_events.sql`      | billing_webhook_events                                                                                                  |
| 12  | `0012_staypuft_audit_log.sql`          | staypuft_audit_log (bitácora inmutable operador StayPuft)                                                               |
| 13  | `0013_staypuft_ai_telemetry.sql`       | staypuft_ai_telemetry (CREATE TABLE IF NOT EXISTS, idempotente; auto-create en runtime + try/catch, métricas nunca 500) |
| 14  | `0014_canaco_lifecycle.sql`            | Ciclo de vida CANACO, pagos, consentimientos y solicitudes ARCO                                                         |
| 15  | `0015_canaco_structured_employees.sql` | Datos estructurados de empleados CANACO                                                                                 |
| 16  | `0016_canaco_delegaciones.sql`         | Delegaciones CANACO y asignaciones a registros del CRM                                                                  |
| 17  | `0017_canaco_comms_jobs.sql`           | Índice CRM de trabajos de comunicaciones CANACO y recibos del worker                                                    |
| 18  | `0018_canaco_sales_consent.sql`        | Consentimiento específico de Sales y vínculos de comunicaciones CANACO                                                  |

> **No aplicar migraciones remotamente sin aprobación de Pavel.** Local only.

### Delegaciones CANACO

La migración `0016_canaco_delegaciones.sql` está aplicada en producción. Las delegaciones son
agrupaciones del CRM, no despachos ni tenants; los registros históricos y nuevos pueden permanecer
sin asignar hasta que un administrador los clasifique manualmente.
La interfaz está oculta salvo que se compile con `VITE_CANACO_DELEGACIONES=true`. Solo
superadministradores y miembros `owner` o `admin` del tenant CANACO pueden consultar y gestionar
delegaciones; el servidor comprueba esos permisos. No define identidades de comunicación ni
balances de créditos.

### Comunicaciones CANACO

El proxy Ledger usa `SALES_WORKER_URL`, `SALES_WORKER_INTERNAL_KEY` y
`CANACO_SALES_TENANT_ID` desde la configuración del Worker; el secreto nunca se expone a la SPA.
`CANACO_SALES_TENANT_ID` debe coincidir exactamente con el tenant Ledger y con
`CAMPAIGN_ALLOWED_TENANTS` de Sales. Las migraciones Ledger 0017 y 0018 siguen pendientes de
aplicación: crean los trabajos y vínculos y agregan el consentimiento específico para Sales.
El consentimiento previo de Arkangel no sustituye al nuevo consentimiento; los contactos
existentes deben otorgarlo explícitamente. Al capturar un prospecto no demo con ese consentimiento,
Ledger ingiere el contacto en Sales y guarda el ID devuelto en el vínculo por tenant, sin deducirlo
por correo o teléfono. Si la ingesta falla, la captura informa que quedó guardada sin sincronizar;
se puede reintentar la captura. El proxy rechaza contactos sin vínculo o consentimiento vigente.
Sales debe configurar `LEDGER_API_URL` y `LEDGER_COMMS_INTERNAL_KEY` (la misma clave interna
configurada como `SALES_WORKER_INTERNAL_KEY` en Ledger); consulta el consentimiento vigente antes
de enviar y difiere si Ledger no responde. El proxy guarda únicamente recibos obtenidos de Sales.
Cada aprobación requiere la revisión exacta y vigente de la vista previa; la audiencia excluida no
se envía aunque cambien los guardrails. El correo no admite variables de contacto.
Sales crea un trabajo pendiente con cada vista previa y el cron procesa únicamente trabajos
aprobados. Voice AI está deshabilitado hasta que exista un proveedor real; SMS no está disponible.
Si un proceso se interrumpe con un destino en `processing`, este no se reintenta automáticamente:
operaciones debe investigar el resultado con el proveedor antes de cualquier intervención manual.
La prueba de contrato entre repositorios usa SQLite en memoria y proveedores simulados; en Sales
se ejecuta en PowerShell desde Sales con
`$env:LEDGER_COMMS_PATH='C:\Users\PAV\Desktop\e-commerce\ark-ledger'; npm test`; sin esa variable
Vitest omite la prueba entre repositorios. La puesta en marcha requiere configurar la allowlist y
los secretos, aplicar las migraciones pendientes y desplegar ambos workers. Nada de ello se ejecutó
durante esta construcción.

---

## 7. Puerta Completa de Calidad (verificación en este commit)

Ejecutada localmente antes de revisar este mapa:

| Comando                                  | Resultado                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm typecheck` (`tsc --noEmit`)        | ✅ PASS — 0 errores TypeScript                                                    |
| `pnpm lint` (`eslint --max-warnings 0`)  | ✅ PASS — 0 errores, 0 advertencias                                               |
| `pnpm format:check` (`prettier --check`) | ✅ PASS — repositorio 100% uniforme                                               |
| `pnpm verify:catalogo`                   | ✅ PASS — 22/22 entradas del catálogo + recargos Yucatán 2.07%, 0 proyecciones    |
| `pnpm test` (`vitest run`)               | ✅ PASS — 110 suites pasadas / 984 pruebas pasadas (100% de éxito en vitest run). |

> `map.md` solo afirma "100% uniforme" de formato porque `pnpm format:check` pasó en este commit.

---

## 8. Bitácora de Sprints (histórico)

El detalle cronológico de **Sprints 1-34** (incluyendo el evolución de conteos de herramientas 13→14→15→18→19→20, conteos de pruebas, correcciones de formato, catálogo sincronizado, etc.) se encuentra en `docs/changelog.md`. Este mapa (`map.md`) se mantiene como **estado actual** únicamente; `docs/changelog.md` conserva el historial completo para referencia y auditoría.

### Fases fiscales 2026 — 18 de noviembre de 2026

- **Fase 1 — Hardcodes eliminados:** StayPuft consume ISN Yucatán desde `estados.ts` con fail-closed; retención clínicas usa constantes citadas; cierre-nómina, RESICO y SPEI eliminan defaults fiscales duplicados.
- **Fase 2 — ISN Yucatán al catálogo:** seis valores 2025/2026 migrados a `catalogo.ts`; `estados.ts` consume `getValor`; vigencia y escáner validados.
- **Fase 3 — Selector Federal/Estatal:** recargos admite `federal` y `estatal_yucatan`; Yucatán usa 2.07% según Art. 56, Decreto 140/2025; CANACO prioriza Yucatán y ARK conserva federal.

---

**Nota de verificación para el walkthrough CANACO (lun 2026-11-16 10:00, actualizada 18-nov-2026):** 22 herramientas (13 esenciales PyME/CANACO + 9 corporativo/forense/Yucatán), timbrado `preview_only` (Facturapi Sandbox SAT `EKU9003173C9`), ISN Yucatán 3.75% bruto / 3.0% neto MIPyME 2026 + Cédula Oficial AAFY, recargos estatales Yucatán 2.07% (Art. 56, Decreto 140/2025), Cierre de Nómina + Layout IDSE/DISPMAG (175 chars, longitud Ledger no confirmada por manual oficial IMSS), Ventanilla Tripartita CANACO (NRP + REC + distintivo AAFY-IMSS), WhatsApp Studio, formato Prettier verificado (100%), typecheck 0, lint 0/0, catálogo 22/22, pruebas 110 suites / 984 tests (100%).

## Nota de alcance — Bóveda Offline (.zip) y verificación "2034 sin servidor"

- La verificación **offline** del paquete Bóveda es válida únicamente para **integridad de archivos** mediante `manifest.sha256` (`sha256sum -c manifest.sha256` en Linux/macOS; procedimiento PowerShell en `offline-viewer.html`). Esto **no** sustituye el registro ni la autenticidad ante sistemas en línea de ARK.
- Las rutas/QR de verificación en línea (`?verify=`) requieren que el servicio correspondiente esté disponible. **No presentar** "verificación en 2034 sin servidor" como prueba de autenticidad de registro; solo es aplicable a la integridad de los archivos del paquete descargado.
- `crypto.subtle` (Web Crypto) requiere contexto seguro; `file://` suele funcionar en navegadores modernos pero depende del navegador/configuración.
- Modalidad 40 y Recargos se exportan como **Folio de Integridad (reference_only)**: no presentan sello SHA-256 inmutable ni reclaman verificación de cálculo por QR.

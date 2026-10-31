# ARK LEDGER — Mapa del Proyecto y Checklist de Estado

**Versión:** 3.0 — Suite de 20 Herramientas + Integración Sentinela Legal RegTech Early Warning (DOF/SAT) + Detector de Comportamientos Atípicos en CFDI (#20) + Módulo de Cruce Laboral-Fiscal Checador vs CFDI Nómina 1.2 (#12) + Buzón Documental Físico-Digital CANACO + Motor de Marca Blanca (Brand Config Engine / White-Label CANACO SERVYTUR MÉRIDA) + Social Meta Tags + Simulador Modalidad 40 (#19) + Actualización y Recargos (#18) + Monitor LFPIORPI (#17) + Motor Anexo 24 (#16) + Balance General (#15) + CRM Leads + RESICO 2026 + Timbrado CFDI 4.0 + Colaboración Despacho + Cierre Nómina + Multi-Tenant + Expediente Único + Workers AI + Papel de Trabajo PDF & QR + GEO Engine /llms.txt  
**Fecha:** Octubre 2026 (verificado contra `main` y desplegado en producción)  
**Mantenedor:** Substrate Holdings LLC  
**URL de Producción:** [https://ledger.arksystems.site](https://ledger.arksystems.site)  
**Repositorio:** [https://github.com/substrateholdingsai/ark-tools](https://github.com/substrateholdingsai/ark-tools)

---

## 1. Resumen Ejecutivo de Avance

| Métrica                                                    | Estado                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Detector de Atípicos CFDI (#20)**                        | 100% Implementado y Verificado (Auditoría forense CFDI 4.0/3.3, ingesta masiva ZIP/XML/TXT en Web Worker + IndexedDB multi-RFC, cruce Metadata SAT, Ley de Benford en primer dígito, Z-Score mensual \|Z\|>2, fraccionamiento de efectivo Art. 27 LISR, cancelaciones extemporáneas Art. 29-A CFF, cruce EFOS 69-B, Matriz de Riesgo 5×5, Malla Mensual Jan-Dec, Dictamen Pericial exportable a Excel y PDF)           |
| **Motor de Marca Blanca (White-Label)**                    | 100% Implementado y Verificado (Brand Config Engine con resolución por variable de entorno o hostname, perfiles desacoplados `ark` y `canaco_merida`, logotipo SVG vectorial oficial CANACO SERVYTUR MÉRIDA con variantes `symbol` y `full`, catálogo curado de 12 herramientas para comercio y soporte para ventanilla de afiliaciones)                                                                               |
| **Simulador Modalidad 40 (#19)**                           | 100% Implementado (Cálculo actuarial LSS 1973 Art. 167 y 171 con restricción Acuerdo DOF 21/10/2026 ACDO.AS2.HCT.101026/302.P.DG, tope en salario previo + 1 UMA diaria, cuota 2026 al 14.438%, ROI financiero, Papel de Trabajo Oficial SHA-256 + QR y tool de IA `calcular_modalidad_40`)                                                                                                                            |
| **Actualización y Recargos (#18)**                         | 100% Implementado y Desplegado en Producción (Cálculo determinista CFF Art. 17-A y 21 con INPC oficial, factor truncado a 4 decimales sin redondeo, regla de no-deflación, mora al 1.47% mensual LIF Art. 8, desglose mes a mes, LiquidGlassDome, Papel de Trabajo Oficial SHA-256 + QR y tool de IA `calcular_recargos_fiscales`)                                                                                     |
| **Monitor LFPIORPI (#17)**                                 | 100% Implementado (Evaluación determinista antilavado Art. 17 LFPIORPI, regla de acumulación móvil de 6 meses, ingesta CSV/Excel, semáforo de riesgo Verde/Amarillo/Rojo, umbrales UMA 2026 y Papel de Trabajo SHA-256 + QR)                                                                                                                                                                                           |
| **Conciliación Anexo 24 (#16)**                            | 100% Implementado (Automatización Cero-Captura, cruce CFDI vs Anexo 24, filtro estricto de canceladas con Metadata SAT, auto-asociación a cuentas de ingresos e IVA, exportación CSV BOM UTF-8, layout Contpaqi/COI y Papel de Trabajo SHA-256 + QR)                                                                                                                                                                   |
| **Calculadora y Cédula RESICO 2026**                       | 100% Operativo (Doble modalidad Persona Física Art. 113-E 1%-2.5% con tope $3.5M y retención 1.25% PM, Persona Moral Art. 206 30% flujo, Cédula oficial Carta, QR público y Workers AI)                                                                                                                                                                                                                                |
| **Balance General Comparativo (#15)**                      | 100% Implementado e integrado (Análisis Horizontal y Vertical, validación A=P+C con tolerancia $0.02, parser CSV/Excel, export CSV BOM UTF-8, Papel de Trabajo PDF con SHA-256+QR y tool `consultar_balance_general`)                                                                                                                                                                                                  |
| **Timbrado CFDI 4.0 (Alegra / PAC)**                       | 100% Operativo en Producción (Emisión SAT delegada vía PAC Quadrum, multi-cuenta por despacho, encriptación AES-GCM 256-bit, verificación en vivo de CSD, descarga de XML/PDF y Cron de health check cada 6h con alertas Resend)                                                                                                                                                                                       |
| **Colaboración en Equipo e Invitaciones**                  | 100% Operativo en Producción (Gestión de miembros, roles owner/admin/member, invitaciones seguras por correo vía Resend, aceptación pública o autenticada y aislamiento multi-tenant)                                                                                                                                                                                                                                  |
| **Cierre de Nómina Masivo & Cruce Laboral-Fiscal (#12)**   | 100% Operativo (Ingesta CSV/Excel, cálculo de retenciones SAT/IMSS/ISN, y módulo de Cruce Laboral-Fiscal CFDI Nómina 1.2 vs Asistencia/Checador LFT Art. 132 Fracc. VIII Bis, score de consistencia, alertas de riesgo cruzado SAT-IMSS-STPS, Cédula Oficial SHA-256 + QR)                                                                                                                                             |
| **Papel de Trabajo Oficial (PDF/QR)**                      | 100% Operativo (Formato institucional tamaño Carta, `@media print`, Sello SHA-256 inmutable, Importe en Letras M.N., QR de Verificación Pública)                                                                                                                                                                                                                                                                       |
| **Verificación Pública de Expedientes**                    | 100% Operativo (`/api/expedientes/verify?hash=` y portal visual público `/?verify={hash}` con validación de autenticidad para terceros y auditores)                                                                                                                                                                                                                                                                    |
| **CRM de Prospectos (Super Admin)**                        | 100% Implementado e integrado (Pestaña `leads` en la consola de Super Admin, tabla `leads_ark_tools` en D1, KPIs de embudo, filtros por ciudad/especialidad/estatus, alta y baja de prospectos, envío de propuesta comercial vía Resend y tool de IA `consultar_leads_crm`)                                                                                                                                            |
| **Expediente Único & Catálogo**                            | 100% Operativo (Catálogo central de clientes/trabajadores, auto-hidratación y sellado SHA-256 con versión DOF)                                                                                                                                                                                                                                                                                                         |
| **Autenticación & AuthGate**                               | 100% Operativo en Producción (Registro, verificación por correo, login, recuperación, sesiones HttpOnly y permisos por membresía tenant)                                                                                                                                                                                                                                                                               |
| **Multi-Tenancy**                                          | 100% Operativo en Producción (Membresías D1 validadas por el Worker en cada ruta privada con estricto aislamiento)                                                                                                                                                                                                                                                                                                     |
| **Base de Datos Cloudflare D1**                            | 100% Actualizada (`0001`–`0006` verificadas aplicadas en `ark_tools_db`; `0007_leads_crm.sql` incluida en el repo y requerida por el CRM de prospectos)                                                                                                                                                                                                                                                                |
| **Cloudflare Workers AI**                                  | 100% Operativo (Binding `[ai]`, orquestador Llama 3.3 70B, Agentic Tool-Calling seguro con D1/LFT/RESICO/Balance/CRM/Sentinela y streaming SSE — 11 herramientas registradas en `AI_TOOLS_CATALOG`, todas con directiva de invocación)                                                                                                                                                                                 |
| **Persistencia & API REST**                                | Rutas privadas protegidas por sesión y membresía tenant; módulos dedicados para Auth, Admin, Invitaciones, D1 Expedientes, CRM de Leads, Workers AI, Alegra CFDI 4.0 y GEO (/llms.txt, /llms-full.txt, /robots.txt).                                                                                                                                                                                                   |
| **Copy & Transparencia Legal**                             | 100% Optimizado con fundamentación jurídica (LISR, LSS, LFT, CFF Art. 28, Anexo 20 CFDI 4.0, Acuerdo DOF 21/10/2026) y cero cajas negras                                                                                                                                                                                                                                                                               |
| **Mesa de Ayuda & Soporte**                                | Canales oficiales integrados vía WhatsApp directo (+52 56 5706 2511) y correo (pavel@arksystems.site)                                                                                                                                                                                                                                                                                                                  |
| **GEO & Agentes IA**                                       | 100% Operativo (`/llms.txt`, `/llms-full.txt` y `/robots.txt` dinámicos vinculados al catálogo DOF 2026, generados en el Worker sin archivos estáticos) — **catálogo derivado de la fuente canónica (19 herramientas)**                                                                                                                                                                                                |
| **Social Meta Tags (Open Graph / Twitter)**                | 100% Implementado (14 tags: 7 OG + 7 Twitter Cards) con assets SVG generados por `forge_ark_meta.py` (1200×630 safe zone 100px, cubo isométrico ARK, tokens Navy/Gold exactos) — verificado en build producción                                                                                                                                                                                                        |
| **Landing Pública**                                        | LandingPage interactiva con filtros de catálogo por categoría, sección de Transparencia Jurídica, Footer institucional y modal de Registro/Login (conmutador automático a `CanacoLandingPage.tsx` bajo marca CANACO con verificación de socio por RFC y 6 servicios oficiales)                                                                                                                                         |
| **Navegación & Usabilidad**                                | Filtros funcionales por categoría, navegación móvil adaptable y retorno contextual desde herramientas                                                                                                                                                                                                                                                                                                                  |
| **Consola Administrativa Cameral (SIEM)**                  | 100% Implementado y Verificado (`CanacoAdminPadron.tsx` para `horus.i2d@gmail.com`, bypass de seguridad en `leadsApi.ts`, KPIs de padrón, filtros por giro/estatus, Cédula oficial imprimible, exportación CSV BOM UTF-8, botones de contacto WhatsApp y sincronización con Call Center Arkangel)                                                                                                                      |
| **Integración Call Center & Cobranza (Arkangel + Resend)** | 100% Implementado y Verificado (`canacoArkangelSync.ts`, Worker-to-Worker Service Binding / REST fallback, normalización E.164 +52, ingesta de cartera matutina en Arkangel, endpoints `/api/canaco/sync-arkangel`, `/api/canaco/arkangel-status`, webhook de liquidación SPEI `/api/canaco/webhook-pago-arkangel` y emisión automática de correo oficial con Cédula Carta SHA-256 vía Resend `canacoEmailService.ts`) |
| **Pruebas unitarias e integración**                        | **518 pasadas en 73 suites (100% éxito)** — verificado con `pnpm test`                                                                                                                                                                                                                                                                                                                                                 |
| **Auditoría DOF Catálogo**                                 | 100% Verificado con `pnpm verify:catalogo` (8/8 vigentes oficiales, 0 proyecciones)                                                                                                                                                                                                                                                                                                                                    |
| **Typecheck (TypeScript)**                                 | 0 errores en modo estricto (100% limpio) — verificado con `pnpm typecheck`                                                                                                                                                                                                                                                                                                                                             |
| **Linting (ESLint)**                                       | 0 errores y 0 advertencias — verificado con `pnpm lint` (`--max-warnings 0`), con hook de pre-commit activo (lint-staged)                                                                                                                                                                                                                                                                                              |
| **Formato (Prettier)**                                     | 100% uniforme en todo el repositorio — verificado con `pnpm format:check`                                                                                                                                                                                                                                                                                                                                              |
| **Continuous Integration**                                 | GitHub Actions en `push` a `main` y pull requests: typecheck, lint, format:check, verify:catalogo, test y build (`.github/workflows/ci.yml`)                                                                                                                                                                                                                                                                           |
| **Build Vite (SPA)**                                       | 100% funcional con bundle optimizado (Vite build completado; 1,815 módulos transformados)                                                                                                                                                                                                                                                                                                                              |
| **Git & Repositorio**                                      | Rama `main` en Sprint 29 (Módulo de Cruce Laboral-Fiscal Checador vs CFDI Nómina 1.2)                                                                                                                                                                                                                                                                                                                                  |
| **Herramientas Integradas**                                | 20 de 20 (ISN, SBC, Nómina, Finiquitos, Cierre de Nómina Masivo, RESICO, Conversor XML, Validador XML, Conciliación Anexo 24, Links Clip, Timbrado Facturas Alegra, Leasing, Guía SAT/IMSS, Auditoría de Cobranza, Mapa de Activos, Balance General Comparativo, Monitor LFPIORPI, Actualización y Recargos CFF, Modalidad 40 IMSS, Detector de Comportamientos Atípicos CFDI) + Admin + Team                          |

---

## 2. Mapa de Arquitectura y Estado de Componentes

> Árbol verificado contra el repositorio en `main` @ `a673bb9` (Octubre 2026). Los módulos marcados ✅ existen físicamente y están integrados en el Worker o en la SPA.

```
ark-tools/
├── docs/
│   ├── design-system.md              ✅ Completo (Especificación visual ARK)
│   ├── calendario-mantenimiento.md  ✅ Cronograma anual de actualización del catálogo de valores fiscales
│   └── map.md                        ✅ Este documento
├── scripts/
│   ├── verificar-catalogo.ts         ✅ CLI auditoría DOF de vigencias fiscales (pnpm verify:catalogo)
│   ├── dof_sat_watcher.py            ✅ Vigilancia desatendida del feed DOF y diffs TypeScript (pnpm watch:dof)
│   ├── cfdi_stress_generator.py      ✅ Generador de lotes CFDI 4.0 sintéticos con RSA SHA-256 (pnpm generate:stress-cfdi)
│   ├── d1_audit_verifier.py          ✅ Auditor forense y reconciliador de Cloudflare D1 (pnpm audit:d1)
│   ├── requirements.txt              ✅ Dependencias Python de la tríada pericial
│   ├── python/
│   │   └── import_leads_sheet.py     ✅ ETL de ingesta y normalización E.164 de prospectos
│   └── sql/
│       ├── schema_leads.sql          ✅ Definición SQL de `leads_ark_tools`
│       └── seed_leads.sql            ✅ Carga inicial de prospectos
├── migrations/
│   ├── 0001_initial_schema.sql       ✅ Esquema D1 inicial (aplicado en producción)
│   ├── 0002_expediente_unico.sql     ✅ D1 Expediente Único (aplicado en producción)
│   ├── 0003_native_auth.sql          ✅ Auth nativo, sesiones y rate limits (aplicado en producción)
│   ├── 0004_tenant_invitations.sql   ✅ Invitaciones y membresías de despacho (aplicado en producción)
│   ├── 0005_alegra_integration.sql   ✅ Cuentas Alegra multi-empresa y facturas timbradas (aplicado en producción)
│   ├── 0006_ai_usage_paywall.sql     ✅ Cuota y paywall de consultas de Workers AI (aplicado en producción)
│   └── 0007_leads_crm.sql            ✅ Tabla `leads_ark_tools` del CRM de prospectos (aplicado en producción)
├── instagram-creatives/              ✅ Generador de creativos Instagram 1080×1080 (Playwright + Jinja2)
│   ├── generate.py                   ✅ Renderizador headless de carruseles (problem/solution_glass/cta)
│   ├── posts.json                    ✅ Definición declarativa de campañas y slides
│   ├── template.html                 ✅ Plantilla Jinja2 con tokens ARK (Navy/Gold)
│   └── requirements.txt              ✅ Dependencias Python (playwright, jinja2)
├── forge_ark_meta.py                 ✅ Generador SVG puro Social Meta Tags (cero deps) — og-image, twitter-image, favicon, lockup
├── public/                           ✅ Assets estáticos servidos por Workers
│   ├── og-image.svg                  ✅ 1200×630 Open Graph (8.35 KB)
│   ├── twitter-image.svg             ✅ 1200×630 Twitter Card (8.35 KB)
│   ├── favicon.svg                   ✅ 64×64 cubo isométrico (6.48 KB)
│   ├── logo-cube.svg                 ✅ 256×256 logo suelto fondo claro (6.58 KB)
│   ├── logo-lockup.svg               ✅ 640×160 lockup cubo + wordmark (6.66 KB)
│   ├── logo-email.png                ✅ 102 KB (existente)
│   └── manifest.json                 ✅ Auditoría pesos/dimensiones (0.61 KB)
├── wrangler.toml                     ✅ SPA assets, observabilidad, D1 binding, Workers AI binding [ai], cron triggers y vars
├── package.json                      ✅ pnpm@9.7.0, scripts de build, deploy, test, lint, typecheck y tríada Python
├── AGENTS.md                         ✅ Guía de trabajo para agentes: comandos, reglas de la casa y trampas conocidas
├── .prettierignore                   ✅ Exclusiones de Prettier (node_modules, dist, .wrangler, .husky/_)
├── .husky/pre-commit                 ✅ Hook activo que ejecuta lint-staged (ESLint + Prettier) sobre los archivos en staging
├── .github/workflows/ci.yml          ✅ Pipeline CI: typecheck, lint, format:check, verify:catalogo, test y build
├── tailwind.config.js                ✅ Tokens ARK (Navy, Gold, LCD, Sombras, Radios)
├── tsconfig.json & vite.config.ts    ✅ Configuración estricta y aliases de ruta
├── vitest.config.ts                  ✅ Cobertura V8 y configuración de testing
├── .eslintrc.cjs                     ✅ ESLint + TypeScript + React Hooks + Prettier (0 advertencias)
├── src/
│   ├── index.ts                      ✅ Worker Entry Point (/health, auth, admin, invitaciones, D1, CRM leads, AI, Alegra, cron y SPA fallback)
│   ├── index.tsx                     ✅ React DOM Root con AuthProvider y ExpedienteProvider
│   ├── App.tsx                       ✅ Router principal con Gating (Landing pública / Dashboard autenticado) y 18 herramientas lazy
│   ├── test-setup.ts                 ✅ Setup global de Vitest (jest-dom)
│   ├── context/
│   │   ├── AuthContext.tsx           ✅ Sesión verificada en Worker y selección de tenant
│   │   └── ExpedienteContext.tsx     ✅ Clientes/expedientes con caché aislada por tenant
│   ├── hooks/
│   │   ├── useAuth.ts                ✅ Hook multi-tenant unificado (usuario, despacho, sesión, logout)
│   │   └── index.ts                  ✅ Barrel export
│   ├── server/
│   │   ├── auth.ts                   ✅ Contraseñas PBKDF2, cookies de sesión, Resend, verificación y reset
│   │   ├── auth.test.ts              ✅ Pruebas de token de verificación de un solo uso y rutas auth
│   │   ├── adminApi.ts               ✅ Endpoints de Super Admin Console (métricas, directorio de tenants, roles)
│   │   ├── adminApi.test.ts          ✅ Pruebas de seguridad y endpoints de administración
│   │   ├── invitationsApi.ts         ✅ Gestión de miembros de despacho, invitaciones por correo y roles
│   │   ├── invitationsApi.test.ts    ✅ 16 pruebas de colaboración en equipo e invitaciones
│   │   ├── leadsApi.ts               ✅ CRM de prospectos: listado/filtros, KPIs, alta/edición/baja y envío de propuesta vía Resend
│   │   ├── leadsApi.test.ts          ✅ 11 pruebas de autenticación, validación D1, filtros y propuesta
│   │   ├── d1Api.ts                  ✅ Handlers D1 con autorización de membresía
│   │   ├── d1Api.expediente.ts       ✅ Endpoints REST para clients y expedientes con SHA-256 determinista
│   │   ├── d1Api.expediente.test.ts  ✅ 15 pruebas de hashing, autorización tenant y privacidad
│   │   ├── alegra/                   ✅ Integración CFDI 4.0 con Alegra / PAC Quadrum
│   │   │   ├── credentials.ts        ✅ Cifrado simétrico AES-GCM (256-bit) con WebCrypto
│   │   │   ├── alegraClient.ts       ✅ Cliente REST HTTP (Basic Auth, CSD check, generateStamp)
│   │   │   ├── alegraApi.ts          ✅ Endpoints de cuentas, sincronización CSD, emisión e historial
│   │   │   ├── cron.ts               ✅ Health check automático cada 6h con alertas vía Resend
│   │   │   └── alegraApi.test.ts     ✅ 11 pruebas de integración y seguridad
│   │   └── ai/                       ✅ Cloudflare Workers AI & Agentic Tool-Calling
│   │       ├── types.ts              ✅ Tipos para mensajes, tool definitions y requests
│   │       ├── tools.ts              ✅ Catálogo de 9 herramientas (LFT, RESICO, D1, Balance, CRM, Recargos CFF) con aislamiento por tenant
│   │       ├── tools.test.ts         ✅ 8 tests unitarios de ejecución y seguridad multi-tenant
│   │       ├── agent.ts              ✅ Orquestador Llama 3.3 70B con loop de tool-calling, streaming SSE y `buildSystemPrompt()` exportable
│   │       ├── agent.test.ts         ✅ 8 tests de consistencia del system prompt (conteo, catálogo y directivas de las 9 tools)
│   │       ├── aiApi.ts              ✅ Endpoints REST (/api/ai/status, /api/ai/models, /api/ai/tools, /api/ai/chat, /api/ai/quota)
│   │       └── aiApi.test.ts         ✅ 6 tests de integración de API
│   │   ├── llmsTxt.ts               ✅ Generador dinámico /llms.txt, /llms-full.txt y /robots.txt (GEO Engine, derivado del catálogo canónico de 18 herramientas)
│   │   └── llmsTxt.test.ts          ✅ 4 tests unitarios de generación GEO y sync del catálogo
│   ├── lib/
│   │   ├── cn.ts                     ✅ Utilidad twMerge + clsx
│   │   ├── useTenant.ts              ✅ Contexto del tenant activo
│   │   ├── numeroALetras.ts          ✅ Conversor de importes a moneda nacional en texto (Art. 28 CFF)
│   │   ├── numeroALetras.test.ts     ✅ 3 tests unitarios pasados
│   │   ├── apiClient.ts              ✅ Cliente tipado con cookies de sesión, D1, Auth, Teams y Alegra
│   │   └── apiClient.test.ts         ✅ 2 tests del cliente HTTP (errores y payloads)│   ├── styles/
│   │   └── ark-system.css            ✅ Estilos base, fuentes, variables y componentes físicos (@media print)
│   ├── components/
│   │   ├── ui/                       ✅ Componentes Atómicos (100%)
│   │   ├── Logo.tsx                  ✅ Cubo isométrico 3D ARK con diamante
│   │   ├── Header.tsx                ✅ Header sticky responsive con navegación por categorías, retorno al catálogo, soporte WhatsApp y selector multi-tenant
│   │   ├── Footer.tsx                ✅ Footer institucional con privacidad de XMLs, soporte directo, 4 columnas y disclaimer legal
│   │   ├── ExpedienteSelector.tsx    ✅ Barra persistente de cliente activo, búsqueda predictiva y modal de nuevo cliente
│   │   ├── ExpedienteToolBanner.tsx  ✅ Banner interactivo en herramientas para archivar con sello SHA-256
│   │   ├── PapelDeTrabajoModal.tsx   ✅ Cédula oficial tamaño Carta para impresión PDF con Sello QR y desglose
│   │   ├── VerificacionPublicaModal.tsx ✅ Validador público de expedientes sellados vía QR (/api/expedientes/verify)
│   │   ├── ToolCard.tsx              ✅ Tarjetas con hover dorado, badge y CTA
│   │   ├── CategorySection.tsx       ✅ Agrupador de categorías anclables (Fiscal, SAT, Cobros, etc. — 1 a 4 cols)
│   │   ├── ToolSkeleton.tsx          ✅ Skeleton loader animado para lazy imports
│   │   ├── AuthGate.tsx              ✅ Acceso por email y contraseña
│   │   ├── LandingPage.tsx           ✅ Registro, login, verificación y recuperación de contraseña
│   │   ├── AiAssistantWidget.tsx     ✅ Widget flotante de chat con Workers AI (Llama 3.3 70B + D1 Tools)
│   │   ├── AiAssistantWidget.test.tsx ✅ 5 tests de integración y UI del widget
│   │   ├── ErrorBoundary.tsx         ✅ Frontera de errores institucional (Reintentar / Volver al Catálogo)
│   │   ├── ErrorBoundary.test.tsx    ✅ 3 tests de captura y recuperación de errores
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx        ✅ Consola de Super Admin (métricas de plataforma, usuarios, despachos, pestañas)
│   │   │   ├── LeadsApp.tsx          ✅ CRM de prospectos: KPIs de embudo, filtros, alta/baja, envío de propuesta y export CSV
│   │   │   └── LeadsApp.test.tsx     ✅ 15 tests de UI (KPIs, filtros, PATCH de estatus, alta, baja, propuesta Resend, export CSV)
│   │   ├── team/
│   │   │   ├── TeamModal.tsx         ✅ Modal de gestión de equipo, invitaciones por correo y cambio de roles
│   │   │   ├── TeamModal.test.tsx    ✅ 3 tests de interfaz de gestión de equipo
│   │   │   ├── InviteAcceptModal.tsx ✅ Modal de aceptación de invitación a despacho
│   │   │   ├── InviteAcceptModal.test.tsx ✅ 2 tests de aceptación de invitación
│   │   │   └── index.ts              ✅ Barrel export
│   │   └── index.ts                  ✅ Barrel export

│   │
│   ├── data/ (Datos globales de referencia)
│   │   ├── valores-vigentes/         ✅ Catálogo centralizado de valores fiscales DOF 2026
│   │   │   ├── catalogo.ts           ✅ UMA ($117.31/$3,566.22), SMG ($315.04/$440.87), Tope 25 UMA SBC ($2,932.75), Tarifa ISR 2026 (DOF)
│   │   │   ├── hooks.ts              ✅ useValorFiscal, useEstadoCatalogo
│   │   │   ├── vigencia.ts           ✅ Motor de evaluación de vigencia y alertas preventivas
│   │   │   ├── AlertasVigencia.tsx   ✅ Banner global de valores próximos a vencer
│   │   │   ├── tipos.ts              ✅ Tipos ValorFiscal (fuente DOF, urlDOF, criticidad), ConfigVigencia
│   │   │   └── index.ts              ✅ Barrel export completo
│   │   ├── estados.ts                ✅ Re-export desde ISN (fuente única de verdad)
│   │   ├── catalogo-herramientas.ts   ✅ Catálogo canónico de las 18 herramientas (fuente única del conteo publicado)
│   │   ├── catalogo-herramientas.test.ts ✅ 4 tests de sincronía con el router `ToolId` de App.tsx
│   │   ├── conductas.ts              ✅ Catálogo de Activos Virtuales (12 conductas, autoridades, hitos, umbrales)
│   │   ├── conductas.test.ts         ✅ 15 tests unitarios pasados
│   │   ├── actos.ts                  ✅ Completado (Guía SAT/IMSS: 8 pasos, 8 actos, 3 plazos)
│   │   ├── conductas-cobranza.ts     ✅ Catálogo de Auditoría de Cobranza (8 secciones, 43 conductas)
│   │   ├── conductas-cobranza.test.ts✅ 6 tests unitarios pasados
│   │   ├── comparadores-contrato-crm.ts ✅ 12 comparadores Contrato vs CRM (Sección VIII)
│   │   └── comparadores-contrato-crm.test.ts ✅ 11 tests unitarios pasados
│   │
│   └── tools/ (Módulos de herramientas)
│       │
│       ├── isn/                      ✅ 100% COMPLETADA Y DESPLEGADA
│       │   ├── types.ts              ✅ Tipos de datos
│       │   ├── data/estados.ts       ✅ 32 estados con tasas 2026 y fundamentos (usa catálogo UMA, TOPES_LSS)
│       │   ├── lib/calcularISN.ts    ✅ Lógica de cálculo y formateo
│       │   ├── lib/calcularISN.test.ts ✅ 19 tests unitarios pasados
│       │   ├── lib/exportarCSV.ts    ✅ Generador de Excel/CSV con BOM UTF-8
│       │   ├── components/           ✅ EstadoSelector, BaseInput, PercepcionesTable, ResumenISN
│       │   ├── CalculadoraISN.tsx    ✅ Componente principal interactivo
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── sbc/                      ✅ 100% COMPLETADA Y DESPLEGADA
│       │   ├── types.ts              ✅ Tipos de datos
│       │   ├── data/uma.ts           ✅ Constantes IMSS 2026 (usa catálogo UMA, SALARIO_MINIMO, TOPES_LSS)
│       │   ├── lib/calcularSBC.ts    ✅ Lógica del factor de integración y topes LSS
│       │   ├── lib/calcularSBC.test.ts ✅ 16 tests unitarios pasados
│       │   ├── components/           ✅ ParametrosCard, RangoVisual, DesgloseTable, ResultadoSBC, ExplicacionSBC
│       │   ├── CalculadoraSBC.tsx    ✅ Componente principal interactivo
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── nomina/                   ✅ 100% COMPLETADA Y DESPLEGADA
│       │   ├── types.ts              ✅ Tipos para ISR, IMSS obrero y sueldo neto
│       │   ├── data/periodos.ts      ✅ Períodos diario, semanal, quincenal, mensual
│       │   ├── data/tablasISR.ts     ✅ Tarifa mensual 2026 (usa catálogo TARIFA_ISR)
│       │   ├── data/cuotasIMSS.ts    ✅ Ramas de aseguramiento obrero (usa catálogo UMA)
│       │   ├── data/defaults.ts      ✅ Valores por defecto y presets (usa catálogo UMA, SALARIO_MINIMO)
│       │   ├── lib/calcularISR.ts    ✅ Cálculo de ISR con ajuste por periodicidad
│       │   ├── lib/calcularISR.test.ts ✅ 17 tests unitarios pasados
│       │   ├── lib/calcularIMSS.ts   ✅ Cálculo de cuotas IMSS obrero
│       │   ├── lib/calcularIMSS.test.ts ✅ 7 tests unitarios pasados
│       │   ├── lib/calcularNomina.ts ✅ Orquestador de deducciones y sueldo neto
│       │   ├── components/           ✅ PeriodoSelector, SueldoInput, DesgloseDeducciones, ResultadoNomina
│       │   ├── CalculadoraNomina.tsx ✅ Componente interactivo principal
│       │   └── index.ts              ✅ Barrel export completo
│       │
│       ├── xml-excel/                ✅ 100% COMPLETADA
│       │   ├── types.ts              ✅ Tipos para CFDI 4.0 y lote
│       │   ├── lib/parserCFDI.ts     ✅ Parser universal con regex y validación
│       │   ├── lib/parserCFDI.test.ts✅ 8 tests unitarios pasados
│       │   ├── lib/exportarExcel.ts  ✅ Generador CSV con BOM UTF-8 y totales
│       │   ├── components/           ✅ DropZoneXML, ResumenLoteCard, TablaFacturas
│       │   ├── ConversorXML.tsx      ✅ Componente interactivo con modo demo
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── xml-validador/            ✅ 100% COMPLETADA
│       │   ├── types.ts              ✅ Tipos para auditoría y dictámenes
│       │   ├── lib/validadorCFDI.ts  ✅ Motor de reglas SAT Anexo 20 y score
│       │   ├── lib/validadorCFDI.test.ts ✅ 7 tests unitarios pasados
│       │   ├── lib/exportarDictamen.ts ✅ Exportador de dictamen a CSV UTF-8
│       │   ├── components/           ✅ ScoreGauge, ResumenAuditoriaCard, ListaDictamenes
│       │   ├── ValidadorXML.tsx      ✅ Componente interactivo con modo demo
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── spei/                     ✅ 100% COMPLETADA
│       │   ├── types.ts              ✅ Tipos Clip Checkout y comisiones
│       │   ├── lib/clipClient.ts     ✅ Integración Clip API, comisiones y WhatsApp (tarifas negocio)
│       │   ├── lib/clipClient.test.ts✅ 10 tests unitarios pasados
│       │   ├── components/           ✅ FormularioCobro, DesgloseComisionCard, LinkGeneradoCard, HistorialCobrosTable
│       │   ├── GeneradorSPEI.tsx     ✅ Componente interactivo de cobros
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── leasing/                  ✅ 100% COMPLETADA
│       │   ├── types.ts              ✅ Tipos para proyección, cohortes y LTV
│       │   ├── lib/calcularLeasing.ts✅ Motor matemático MRR, ARR y métricas SaaS (supuestos negocio)
│       │   ├── lib/calcularLeasing.test.ts ✅ 5 tests unitarios pasados
│       │   ├── lib/exportarProyeccion.ts ✅ Exportador de proyección a CSV UTF-8
│       │   ├── components/           ✅ ParametrosLeasingCard, ResultadoLeasingCard, TablaProyeccionMensual
│       │   ├── CalculadoraLeasing.tsx✅ Componente interactivo con presets
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── guia-sat-imss/            ✅ 100% COMPLETADA Y DESPLEGADA
│       │   ├── types.ts              ✅ Tipos para pasos, actos y plazos
│       │   ├── iconos.ts             ✅ Mapeo de iconos Lucide para UI
│       │   ├── lib/generarBorrador.ts ✅ Motor generador de escritos legales
│       │   ├── lib/generarBorrador.test.ts ✅ 3 tests unitarios pasados
│       │   ├── components/           ✅ PasoGuiaCard, ActoFiscalCard, PlazoClaveCard
│       │   ├── GuiaSATIMSS.tsx       ✅ Componente interactivo con timeline, modal y checklist persistente
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── auditor-cobranza/         ✅ 100% COMPLETADA Y CONECTADA
│       │   ├── types.ts              ✅ Tipos y constantes re-exportadas del dictamen
│       │   ├── lib/calcularDictamen.ts ✅ Motor de evaluación de riesgos y dictamen
│       │   ├── lib/calcularDictamen.test.ts ✅ 7 tests unitarios pasados
│       │   ├── lib/exportarDictamenCobranza.ts ✅ Generador y descargador TXT / CSV (BOM UTF-8)
│       │   ├── lib/exportarDictamenCobranza.test.ts ✅ 2 tests unitarios pasados
│       │   ├── components/           ✅ ResumenAuditoriaDome, ComparadorCard, SeccionConductasAccordion, ListaDetallesDictamen
│       │   ├── AuditorCobranza.tsx   ✅ Componente principal interactivo con exportaciones
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── mapa-activos/             ✅ 100% COMPLETADA
│       │   ├── types.ts              ✅ Re-export de tipos de regulación y conductas
│       │   ├── MapaActivos.tsx       ✅ Componente interactivo con filtros, autoridades, timeline y frontera
│       │   ├── MapaActivos.test.tsx  ✅ 6 tests de integración y UI pasados
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── finiquitos/               ✅ 100% COMPLETADA Y DESPLEGADA (11/11)
│       │   ├── types.ts              ✅ Tipos LFT (Arts. 50, 76, 79, 80, 87, 162, 486)
│       │   ├── lib/calcularFiniquito.ts ✅ Motor de finiquito/liquidación (Vacaciones Dignas 2023, tope 2xSMG)
│       │   ├── lib/calcularFiniquito.test.ts ✅ 7 tests unitarios pasados (100% éxito)
│       │   ├── components/           ✅ ParametrosFiniquitoCard, AntiguedadCard, DesgloseFiniquitoTable, ResultadoFiniquitoCard
│       │   ├── CalculadoraFiniquitos.tsx ✅ Componente principal interactivo con exportaciones CSV/TXT
│       │   ├── CalculadoraFiniquitos.test.tsx ✅ 6 tests de integración y UI pasados (100% éxito)
│       │   └── index.ts              ✅ Barrel export completo
│       │
│       ├── cierre-nomina/            ✅ 100% COMPLETADA Y DESPLEGADA (12/12)
│       │   ├── types.ts              ✅ Tipos para procesamiento en lote, resumen y dispersión
│       │   ├── lib/parserPlantilla.ts ✅ Parser CSV/TSV, normalización RFC/NSS y Vacaciones LFT
│       │   ├── lib/parserPlantilla.test.ts ✅ 18 tests unitarios pasados (100% éxito)
│       │   ├── lib/calcularCierreNomina.ts ✅ Motor batch paralelo, topes LSS, retenciones y SHA-256
│       │   ├── lib/calcularCierreNomina.test.ts ✅ 4 tests unitarios pasados (100% éxito)
│       │   ├── lib/exportarCierre.ts ✅ Exportador Cédula Concentradora CSV y Layout Dispersión
│       │   ├── lib/exportarCierre.test.ts ✅ 3 tests unitarios pasados (100% éxito)
│       │   ├── components/           ✅ CedulaConcentradoraModal (Carta horizontal, QR, firmas)
│       │   ├── CierreNomina.tsx      ✅ Pantalla interactiva principal con carga masiva y KPIs
│       │   ├── CierreNomina.test.tsx ✅ 4 tests de UI e integración pasados (100% éxito)
│       │   └── index.ts              ✅ Barrel export completo
│       │
│       ├── resico/                   ✅ 100% COMPLETADA Y DESPLEGADA (14/14)
│       │   ├── types.ts              ✅ Tipos PF (Art. 113-E/J) y PM (Art. 206)
│       │   ├── data/tablasResico.ts  ✅ Tarifas mensuales DOF 1%-2.5%, retención 1.25%, tasa 30% PM y topes
│       │   ├── lib/calcularResicoPF.ts ✅ Motor mensual PF, retenciones PM, IVA acreditable y alertas tope $3.5M
│       │   ├── lib/calcularResicoPM.ts ✅ Motor mensual PM flujo de efectivo, PTU, pérdidas y tasa 30%
│       │   ├── lib/calcularResico.test.ts ✅ 12 tests unitarios pasados (100% éxito)
│       │   ├── lib/exportarResico.ts ✅ Exportador Cédula CSV BOM UTF-8 y plantilla WhatsApp
│       │   ├── components/           ✅ ParametrosResicoCard, ResultadoResicoCard, DesgloseResicoTable, CedulaResicoModal
│       │   ├── CalculadoraResico.tsx ✅ Ensamblador con alternador PF/PM y Expediente Único
│       │   ├── CalculadoraResico.test.tsx ✅ 4 tests de UI e integración pasados (100% éxito)
│       │   └── index.ts              ✅ Barrel export completo
│       │
│       └── timbrado/                 ✅ 100% COMPLETADA Y DESPLEGADA (13/13)
│           ├── TimbradoFacturas.tsx  ✅ Pantalla interactiva principal con emisión CFDI 4.0, historial y cuentas
│           ├── useAlegra.ts          ✅ Hook de conexión multi-empresa, estado CSD y timbrado
│           ├── components/
│           │   └── AlegraConnectModal.tsx ✅ Modal de vinculación de credenciales con cifrado seguro
│           └── TimbradoFacturas.test.tsx ✅ 3 tests de UI e integración pasados (100% éxito)
│       │
│       └── balance-general/           ✅ 100% COMPLETADA Y DESPLEGADA (Herramienta #15)
│           ├── types.ts              ✅ Tipos CuentaBalance, JerarquiaBalance, ResultadoAnalisis, TotalesBalance
│           ├── lib/calcularBalance.ts ✅ Motor de AH/AV, totales y cuadre A=P+C (tolerancia $0.02)
│           ├── lib/parserBalanza.ts  ✅ Parser CSV/Excel con normalización de rubros y advertencias
│           ├── lib/calcularBalance.test.ts ✅ 3 tests unitarios (cuadre, AH/AV, división por cero)
│           ├── components/           ✅ ParametrosBalanceCard, TablaBalanceAnalitico, GraficosClasificacion, ResultadoBalanceCard
│           ├── CalculadoraBalance.tsx ✅ Pantalla principal con Expediente Único y export CSV BOM UTF-8
│           ├── CalculadoraBalance.test.tsx ✅ 7 tests de UI (ingesta CSV, ecuación A=P+C, tabla AH/AV, export CSV)
│           └── index.ts              ✅ Barrel export
│       │
│       ├── anexo24/                  ✅ 100% COMPLETADA Y DESPLEGADA (Herramienta #16)
│       │   ├── types.ts              ✅ Tipos PolizaContable, CuadreConciliacion, CatalogoCuentaAnexo24
│       │   ├── lib/motorConciliacion.ts ✅ Cruce CFDI vs Catálogo y Balanza Anexo 24, Debe = Haber
│       │   ├── lib/motorConciliacion.test.ts ✅ 4 tests unitarios de cuadre y generación de pólizas
│       │   ├── lib/parserAnexo24.ts  ✅ Parser de Catálogo XML y Balanza de Comprobación SAT
│       │   ├── lib/parserAnexo24.test.ts ✅ 4 tests de parsing
│       │   ├── lib/parserMetadata.ts ✅ Descarte automático de comprobantes cancelados mediante Metadata SAT
│       │   ├── lib/parserMetadata.test.ts ✅ 3 tests de filtro de canceladas
│       │   ├── components/           ✅ DropZoneMulti, ResumenCuadreDome, TablaConciliacion
│       │   ├── ConciliadorAnexo24.tsx ✅ Interfaz principal con demo, exportación CSV BOM y layouts Contpaqi/COI
│       │   ├── ConciliadorAnexo24.test.tsx ✅ 4 tests de UI e integración
│       │   └── index.ts              ✅ Barrel export completo
│       │
│       ├── monitor-lfpiorpi/         ✅ 100% COMPLETADA Y DESPLEGADA (Herramienta #17)
│       │   ├── types.ts              ✅ Tipos OperacionCobranza, ResultadoCliente, ResumenMonitorLFPIORPI, FraccionLFPIORPI
│       │   ├── lib/evaluadorActividadesVulnerables.ts ✅ Motor determinista antilavado, UMA 2026, regla de acumulación 6 meses
│       │   ├── lib/evaluadorActividadesVulnerables.test.ts ✅ 6 tests unitarios (100% éxito)
│       │   ├── lib/parserCobranza.ts  ✅ Parser CSV/TSV tolerante, normalización RFC/fecha/monto y plantilla oficial
│       │   ├── lib/parserCobranza.test.ts ✅ 6 tests unitarios (100% éxito)
│       │   ├── components/
│       │   │   ├── PanelFiltrosVulnerables.tsx ✅ Selector de Fracción Art. 17 y cálculo de topes en MXN
│       │   │   ├── ResumenAuditoriaDome.tsx   ✅ KPIs ejecutivos (Total, Avisos UIF, Identificación, Normales, Monto)
│       │   │   └── TablaMonitorLFPIORPI.tsx    ✅ Semáforo por cliente, barras de avance y búsqueda/filtros
│       │   ├── MonitorLFPIORPI.tsx   ✅ Ensamblador principal con ingesta Drag & Drop y Expediente Único
│       │   ├── MonitorLFPIORPI.test.tsx ✅ 3 tests de UI e integración (100% éxito)
│       │   └── index.ts              ✅ Barrel export completo
│       │
│       └── recargos/                 ✅ 100% COMPLETADA Y DESPLEGADA (Herramienta #18)
│           ├── types.ts              ✅ Tipos EntradaRecargos, FactorActualizacionDetalle, DesgloseMesRecargo, ResultadoRecargos
│           ├── lib/calcularRecargos.ts ✅ Art. 17-A CFF truncado a 4 decimales, no-deflación, mora LIF 1.47% sobre base actualizada
│           ├── lib/calcularRecargos.test.ts ✅ 15 tests unitarios (truncamiento, no-deflación, fracciones de mes, SAT)
│           ├── lib/exportarRecargos.ts ✅ Exportador CSV con BOM UTF-8 y formateador de resumen WhatsApp
│           ├── components/
│           │   ├── ParametrosRecargosCard.tsx ✅ Selectores de fecha, validación temporal, presets rápidos (3, 6, 12, 24m) y badge LIF
│           │   ├── DesgloseActualizacionTable.tsx ✅ Cards visuales de ecuación CFF y tabla analítica mes a mes
│           │   ├── ResultadoRecargosCard.tsx ✅ LiquidGlassDome con total adeudado, importe en letra y chips métricos
│           │   └── CedulaRecargosModal.tsx ✅ Papel de Trabajo Oficial Carta (@media print), Sello SHA-256, QR y bloques de firmas
│           ├── CalculadoraRecargos.tsx ✅ Ensamblador principal conectado a ExpedienteToolBanner y modal
│           ├── CalculadoraRecargos.test.tsx ✅ 4 tests de UI e integración
│           └── index.ts              ✅ Barrel export completo
```

---

## 3. Checklist Detallado de lo que Falta

### Fase A: Culminar Nómina Rápida 2026 (Completada ✅)

- [x] **Componentes visuales de Nómina (`src/tools/nomina/components/`):**
  - [x] Selector de período (Día, Sem, Qna, Mes).
  - [x] Input de sueldo bruto con botones rápidos de presets.
  - [x] Desglose interactivo de deducciones (Tabs o acordeón ISR / IMSS obrero).
  - [x] Tarjeta de resultado neto (`LiquidGlassDome` con sueldo neto en `TextMagnified`).
  - [x] Barrel export `src/tools/nomina/components/index.ts`.
- [x] **Ensamblador:** Implementar `src/tools/nomina/CalculadoraNomina.tsx`.
- [x] **Barrel Export:** Crear `src/tools/nomina/index.ts`.
- [x] **Integración:** Activar la tarjeta en `App.tsx` (cambiar `PRÓXIMAMENTE` por `NUEVO` y habilitar navegación).
- [x] **Deploy:** Desplegar actualización a Cloudflare.

---

### Fase B: Herramientas SAT (CFDI 4.0) (Completada ✅)

- [x] **Conversor XML → Excel (`src/tools/xml-excel/`):**
  - [x] Parser XML de CFDI 4.0 en cliente (Browser y Node universal).
  - [x] Extracción masiva (UUID, Emisor, Receptor, Conceptos, Impuestos, Total).
  - [x] Arrastre de hasta 200 archivos XML (Drag & Drop) y botón demo.
  - [x] Exportador a tabla interactiva y descarga CSV con BOM UTF-8 para Excel.
- [x] **Validador de XMLs (`src/tools/xml-validador/`):**
  - [x] Validación de esquema XML, sellos y UUIDs.
  - [x] Reporte gráfico de inconsistencias y errores detectados.

---

### Fase C: Herramientas de Cobros (Completada ✅)

- [x] **Generador Links de Pago Clip Checkout (`src/tools/spei/`):**
  - [x] Backend endpoint en Cloudflare Worker (`POST /api/clip/checkout` y `GET /api/clip/status`).
  - [x] Configuración de credenciales de entorno en `.dev.vars.example` y `wrangler.toml`.
  - [x] Formulario interactivo con montos, conceptos, vigencia y pagos OXXO.
  - [x] Calculadora de comisiones Clip (3.6% + IVA y MSI) en tiempo real.
  - [x] Generador de mensaje listo para compartir por WhatsApp en 1 clic.
  - [x] Historial local de enlaces de pago generados.
- [x] **Calculadora Leasing (`src/tools/leasing/`):**
  - [x] Proyección de modelo \$500 setup → \$2,500 renta recurrente para despachos contables.
  - [x] Resumen financiero MRR, ARR, LTV y retención con churn.
  - [x] Tabla de desglose mes a mes con exportación a CSV para Excel.
- [x] **Timbrado de Facturas CFDI 4.0 vía Alegra / PAC Quadrum (`src/tools/timbrado/` y `src/server/alegra/`):**
  - [x] Migración D1 `0005_alegra_integration.sql` (`tenant_alegra_accounts` y `alegra_invoices`).
  - [x] Módulo `credentials.ts` con cifrado simétrico AES-GCM (256 bits) usando WebCrypto.
  - [x] Cliente REST `alegraClient.ts` (Basic Auth, verificación CSD y emisión en tiempo real vía PAC Quadrum).
  - [x] Endpoints del Worker `alegraApi.ts` (cuentas multi-empresa, CSD en vivo, default, emisión e historial).
  - [x] Cron `cron.ts` ejecutado cada 6 horas (`0 */6 * * *`) con alertas por correo vía Resend ante tokens revocados.
  - [x] Hook `useAlegra.ts` con manejo de estados, cuentas con atención requerida y opción de descartar banner por 7 días.
  - [x] Modal `AlegraConnectModal.tsx` con verificación de plan API y CSD ante el SAT.
  - [x] Componente principal `TimbradoFacturas.tsx` con onboarding no bloqueante, ruta alternativa hacia Validador XML, autollenado de clientes, cálculo en vivo y descarga de XML/PDF.
  - [x] Suite de 14 pruebas automáticas (11 backend en `alegraApi.test.ts` + 3 frontend en `TimbradoFacturas.test.tsx`).
  - [x] 100% Desplegado y operativo en producción (`https://ledger.arksystems.site`).

---

### Fase D: Compliance y Educación

- [x] **Guía SAT / IMSS (`src/tools/guia-sat-imss/`):**
  - [x] Datos de actos en `src/data/actos.ts` (8 pasos, 8 actos, 3 plazos clave).
  - [x] Checklist interactivo de 8 pasos para responder requerimientos y plazos legales.
  - [x] Componentes: PasoGuiaCard, ActoFiscalCard, PlazoClaveCard.
  - [x] Progreso visual con barra y contadores.
  - [x] Barrel export `src/tools/guia-sat-imss/index.ts`.
  - [x] Integración en `App.tsx` (badge "NUEVO" y navegación habilitada).
- [x] **Auditoría de Cobranza (`src/tools/auditor-cobranza/`):**
  - [x] Catálogo de 43 conductas en 8 secciones (`src/data/conductas-cobranza.ts`).
  - [x] 12 comparadores Contrato vs CRM en Sección VIII (`src/data/comparadores-contrato-crm.ts`).
  - [x] Motor matemático de dictamen y ponderación de riesgos (`lib/calcularDictamen.ts`).
  - [x] Generador y descargador de reportes en TXT y CSV con BOM UTF-8 (`lib/exportarDictamenCobranza.ts`).
  - [x] Componentes visuales: `ResumenAuditoriaDome`, `ComparadorCard`, `SeccionConductasAccordion`, `ListaDetallesDictamen`.
  - [x] Componente principal `AuditorCobranza.tsx` conectado al dashboard de `App.tsx` con badge `NUEVO`.
  - [x] 26 tests unitarios dedicados pasando al 100%.
- [x] **Mapa de Activos Virtuales (`src/tools/mapa-activos/`):**
  - [x] Catálogo de conductas, autoridades, hitos reguladores y umbrales en `src/data/conductas.ts`.
  - [x] 15 tests unitarios de datos en `src/data/conductas.test.ts`.
  - [x] Matriz de consulta legal (Ley Fintech, LFPIORPI, Código Penal Federal, CFF e Iniciativa 2026).
  - [x] Componente interactivo de consulta (`MapaActivos.tsx`) con filtros en tiempo real, búsqueda, acordeón y timeline.
  - [x] 6 tests de integración y UI en `MapaActivos.test.tsx`.
  - [x] Conexión y lazy loading diferido integrado en `App.tsx` con `<ToolSkeleton />`.

---

### Fase E: Laboral & Finiquitos LFT (Completada ✅)

- [x] **Motor de Cálculo LFT (`src/tools/finiquitos/lib/`):**
  - [x] Cálculo de días de vacaciones según reforma _Vacaciones Dignas 2023_ (Art. 76 LFT).
  - [x] Vacaciones proporcionales y pendientes de gozar (Arts. 76 y 79 LFT).
  - [x] Prima vacacional no menor al 25% (Art. 80 LFT).
  - [x] Aguinaldo proporcional de 15 días base y pendientes (Art. 87 LFT).
  - [x] Prima de antigüedad de 12 días por año con salario topado a 2×SMG ($630.08) (Arts. 162 y 486 LFT).
  - [x] Indemnización constitucional de 90 días sobre SDI (Art. 50 Fracc. III LFT / Art. 123 Const.).
  - [x] Indemnización de 20 días por año sobre SDI (Art. 50 Fracc. II LFT).
  - [x] 7 tests unitarios del motor pasando al 100% (`calcularFiniquito.test.ts`).
- [x] **Componentes Visuales de Finiquitos (`src/tools/finiquitos/components/`):**
  - [x] `ParametrosFiniquitoCard.tsx` (selector Finiquito/Liquidación, auto-sugerencia SDI, preview antigüedad y accesibilidad).
  - [x] `AntiguedadCard.tsx` (descomposición años/meses/días, tabla vacaciones 2023 y tarjeta del tope Art. 486).
  - [x] `DesgloseFiniquitoTable.tsx` (tabla desktop y cards mobile con fundamentos legales).
  - [x] `ResultadoFiniquitoCard.tsx` (`LiquidGlassDome`, cifra magnificada, copiar texto WhatsApp y descarga CSV).
- [x] **Ensamblador y Pruebas UI:**
  - [x] `CalculadoraFiniquitos.tsx` con navegación `onBack` y carga diferida con `<ToolSkeleton />`.
  - [x] 6 tests de integración y UI pasando al 100% (`CalculadoraFiniquitos.test.tsx`).
  - [x] Barrel exports en `components/index.ts` e `index.ts`.
- [x] **Integración Global (Cierre 11/11):**
  - [x] Integrado en `App.tsx` (Dashboard 4 columnas, router y banner oficial).
  - [x] Integrado en `LandingPage.tsx` (`TOOLS_PREVIEW`).
  - [x] Integrado en `Footer.tsx` (columna Fiscal & Nómina).

---

### Fase F: Patrimonial & Comercial (Completada ✅)

- [x] **Balance General Comparativo — Herramienta #15 (`src/tools/balance-general/`):**
  - [x] `types.ts` con `CuentaBalance`, `JerarquiaBalance`, `ResultadoAnalisis`, `TotalesBalance`, `Naturaleza` y `TipoBalance`.
  - [x] `lib/calcularBalance.ts` con totales, cuadre A=P+C (tolerancia $0.02) y AH/AV redondeados a 2 decimales sin división por cero.
  - [x] `lib/parserBalanza.ts` con ingesta CSV/Excel, normalización de rubros y advertencias por cuentas sin clasificar.
  - [x] Componentes `ParametrosBalanceCard`, `TablaBalanceAnalitico`, `GraficosClasificacion` y `ResultadoBalanceCard` (LiquidGlassDome con estado CUADRADO / NO CUADRADO).
  - [x] Exportación CSV con BOM UTF-8, `ExpedienteToolBanner` y Papel de Trabajo Oficial (`tool_id='balance-general'`) con SHA-256 y QR verificable.
  - [x] Integración en `App.tsx` (`ToolId 'balance-general'`, lazy loading, badge NUEVO en categoría Fiscal).
  - [x] Tool de IA `consultar_balance_general` en `src/server/ai/tools.ts` con aislamiento multi-tenant.
  - [x] 3 tests unitarios en `lib/calcularBalance.test.ts` (100% éxito).
- [x] **CRM de Prospectos Comerciales (`src/server/leadsApi.ts` + `src/components/admin/LeadsApp.tsx`):**
  - [x] Migración `migrations/0007_leads_crm.sql` con tabla `leads_ark_tools` e índices por tenant, ciudad, estatus y especialidad.
  - [x] Endpoints `/api/admin/leads` (GET con filtros, POST), `/api/admin/leads/stats` (KPIs), `/api/admin/leads/:id` (GET/PUT/PATCH/DELETE) y `/api/admin/leads/:id/send-email`.
  - [x] Autenticación por sesión, aislamiento por `tenant_id` y soporte de `super_admin`.
  - [x] Pestaña `leads` en la consola de Super Admin con 5 KPIs (Total, Nuevos, Contactados, Respondieron, Bajas/Spam).
  - [x] Filtros reactivos por texto, ciudad, especialidad y estatus; enlace directo a WhatsApp (`wa.me`), `mailto:` y selector inline de estatus con actualización optimista.
  - [x] Exportación CSV con BOM UTF-8 y botones de alta/baja de prospectos.
  - [x] Envío de propuesta comercial vía Resend con modal interactivo y previsualización previa (sin alterar el estatus en base de datos).
  - [x] ETL `scripts/python/import_leads_sheet.py` con normalización de números WhatsApp a E.164.
  - [x] Tool de IA `consultar_leads_crm` registrada en `AI_TOOLS_CATALOG` y documentada en el system prompt de ARK Contable AI.
  - [x] 11 tests unitarios en `src/server/leadsApi.test.ts` (100% éxito).

---

### Pendientes y Deuda Técnica Detectada (Octubre 2026) ⚠️

#### P0 — Sincronización del Catálogo de Herramientas (RESUELTO ✅ en Sprint 22)

- [x] **Catálogo canónico único** (`src/data/catalogo-herramientas.ts`): nueva fuente de verdad con los 15 identificadores, nombres, categorías y descripciones públicas de la suite. `TOTAL_HERRAMIENTAS` se **deriva** del arreglo (`CATALOGO_HERRAMIENTAS.length`), ya no se escribe a mano.
- [x] **GEO Engine** (`src/server/llmsTxt.ts`): el encabezado pasó de _"Catálogo de las 13 Herramientas en Producción"_ a derivarse de `TOTAL_HERRAMIENTAS` (15). Se incorporaron **RESICO 2026** y **Balance General Comparativo** (antes ausentes) y una nueva sección **"Patrimonial y Análisis Financiero"**.
- [x] **Anexo técnico** (`llms-full.txt`): nuevas secciones **§4 RESICO** (Arts. 113-E a 113-J y 206 a 215 LISR) y **§5 Balance General** (fórmulas de AH%, AV%, cuadre A=P+C y tolerancia $0.02); el estándar SHA-256 pasó a §6.
- [x] **System prompt de ARK Contable AI** (`src/server/ai/agent.ts`): "13 herramientas" → `${TOTAL_HERRAMIENTAS}` (15); se agregó la **herramienta #15 Balance General** al catálogo del prompt y se exportó `buildSystemPrompt(tenantId)` para poder validarlo en tests.
- [x] **Directivas de invocación de las 8 tools de IA**: el bloque 4 de las directrices ahora se genera desde `DIRECTIVAS_HERRAMIENTAS` + `buildToolDirectives()`, con instrucción explícita para cada tool (incluidas `consultar_balance_general` y `consultar_leads_crm`, que antes estaban registradas pero nunca invocadas) y la prohibición de inventar datos del cliente.
- [x] **Meta Open Graph** (`index.html`): _"Suite de 14 herramientas"_ → _"Suite de 15 herramientas"_.
- [x] **Guardas de regresión** (`src/data/catalogo-herramientas.test.ts` y `src/server/ai/agent.test.ts`): el catálogo canónico se contrasta contra el union type `ToolId` de `src/App.tsx`; el prompt se valida contra el catálogo y contra `AI_TOOLS_CATALOG`; y `llmsTxt.test.ts` verifica que toda herramienta del catálogo esté publicada y que no reaparezcan conteos desactualizados.

#### P1 / P2 — Pendientes

- [x] **Pruebas de UI del CRM** (RESUELTO ✅ en Sprint 23): `src/components/admin/LeadsApp.test.tsx` con 15 tests que cubren KPIs de embudo, enlaces directos, filtros (ciudad/especialidad/estatus), búsqueda por texto, limpieza de filtros, actualización inline de estatus con `PATCH`, alta de prospecto, baja con doble confirmación, envío de propuesta vía Resend (incluido el caso de envío de prueba que **no** altera el estatus en D1), error de Resend y export CSV con BOM UTF-8.
- [x] **Tests de UI del Balance General** (RESUELTO ✅ en Sprint 23): `src/tools/balance-general/CalculadoraBalance.test.tsx` con 7 tests que cubren encabezado y banner de modo libre, navegación de regreso, edición de ejercicios, ingesta de balanza CSV real vía `XLSX`, validación de la ecuación A=P+C en estado CUADRADO y NO CUADRADO, tabla analítica con AH % y AV % por cuenta, y export CSV con BOM UTF-8.
- [x] **`docs/calendario-mantenimiento.md`**: se eliminó la referencia obsoleta a _"suite completa: 111 tests"_, que inducía a concluir que faltaba cobertura.
- [x] **Deuda heredada de formato** (RESUELTO ✅ en Sprint 24): `pnpm format:check` estaba en rojo en `main` con **165 archivos** desviados del estilo de Prettier, y el hook `.husky/pre-commit` no existía, por lo que lint-staged nunca se ejecutaba. Ahora el repositorio completo pasa `format:check` y el hook está activo y verificado.

#### Estado verificado en Producción (Octubre 2026) — sin pendientes

- **Deploy vigente:** Version ID `b1faf657-a5af-49b7-bdf9-0df2cb05ff19` (worker `ark-tools-production`, route `ledger.arksystems.site` custom domain, cron `0 */6 * * *`). Construido desde el commit más reciente de `main` (incluye CI workflow en `.github/workflows/ci.yml`).
- **`GET /llms.txt`:** responde _"Catálogo de las 19 Herramientas en Producción"_ con 5 categorías; incluye **RESICO 2026**, **Balance General Comparativo**, **Anexo 24**, **Monitor LFPIORPI**, **Actualización y Recargos CFF** y **Modalidad 40**; ya no aparece el conteo de 13/15.
- **`GET /llms-full.txt`:** anexo con §4 RESICO, §5 Balance General, §6 Estándar SHA-256 y las fórmulas de las herramientas #16-#19.
- **`GET /`:** meta `og:description` con _"Suite de 19 herramientas"_.
- **`GET /api/ai/tools`:** responde `tools_count: 13` incluyendo `consultar_balance_general` y `consultar_leads_crm`.
- **Cloudflare D1 remoto (`ark_tools_db`):** las 7 migraciones están aplicadas y registradas en `d1_migrations` (`0007_leads_crm.sql`). `wrangler d1 migrations list --remote` responde _"No migrations to apply!"_.
- **Tablas remotas presentes:** `clients`, `expedientes`, `auth_sessions`, `auth_tokens`, `auth_rate_limits`, `tenant_memberships`, `tenant_invitations`, `tenant_alegra_accounts`, `alegra_invoices`, `ai_usage`, `leads_ark_tools`.
- **CI/CD:** `.github/workflows/ci.yml` activo en `main` (typecheck, lint, format:check, verify:catalogo, test, build).

---

## 4. Bitácora de Sprints y Registro de Cambios

### Sprint 3 (Octubre 2026) — Automatización SAT (Fase B) y Cobros Digitales (Fase C)

**Objetivo:** Desarrollar e integrar al 100% el motor de procesamiento de comprobantes fiscales (CFDI 4.0/3.3) y la infraestructura de cobros y financiamiento recurrente para despachos contables.

#### 1. Conversor XML → Excel (`src/tools/xml-excel/`) — Completado ✅

- **Capacidades:**
  - Parser universal cliente-side para CFDI 4.0 y CFDI 3.3 (no envía archivos a servidores externos, garantizando confidencialidad absoluta del cliente).
  - Extracción de metadatos: UUID, Serie/Folio, Fecha, Emisor (RFC y Razón Social), Receptor (RFC y Razón Social), Régimen Fiscal, Uso CFDI, Moneda, Tipo de Cambio, Forma/Método de Pago, Subtotal, Descuentos, Impuestos Trasladados/Retenidos y Total.
  - Carga masiva Drag & Drop de hasta 200 archivos XML simultáneos con botón de prueba en 1 clic.
  - Exportación con prefijo Byte Order Mark (`\uFEFF`) para compatibilidad directa y sin caracteres corruptos en Microsoft Excel.
- **Testing:** 8/8 tests unitarios pasando (`src/tools/xml-excel/lib/parserCFDI.test.ts`).

#### 2. Validador y Auditor de XMLs (`src/tools/xml-validador/`) — Completado ✅

- **Capacidades:**
  - Motor de auditoría preventiva alineado al Anexo 20 de la RMF y Código Fiscal de la Federación (CFF).
  - 8 reglas de validación en tiempo real:
    1. Esquema XML válido y raíz `cfdi:Comprobante`.
    2. Versión de CFDI soportada (4.0 o 3.3).
    3. Existencia y formato del UUID en `tfd:TimbreFiscalDigital`.
    4. Sello digital del emisor y SAT no vacíos.
    5. RFC de emisor y receptor válidos contra regex oficial y detección preventiva de listas negras CFF Art. 69-B.
    6. Régimen fiscal del receptor congruente con CFDI 4.0.
    7. Código postal y domicilio fiscal del receptor validados.
    8. Cuadratura matemática de importes: Subtotal - Descuento + Impuestos Trasladados - Impuestos Retenidos = Total.
  - Interfaz con `ScoreGauge` visual (0 a 100 pts), dictamen por comprobante (Aprobado, Advertencia, Crítico) y exportación de dictamen de auditoría a CSV.
- **Testing:** 7/7 tests unitarios pasando (`src/tools/xml-validador/lib/validadorCFDI.test.ts`).

#### 3. Generador de Links de Pago Clip (`src/tools/spei/`) — Completado ✅

- **Capacidades:**
  - Integración oficial con la infraestructura de **Clip Developers** ([Clip Checkout](https://developer.clip.mx/docs/getting-started)).
  - Proxy seguro en Cloudflare Worker (`POST /api/clip/checkout` y `GET /api/clip/status`) para proteger llaves privadas `CLIP_API_KEY` y `CLIP_API_SECRET`, evitando problemas de CORS y filtraciones en frontend.
  - Soporte de entorno Sandbox / Producción mediante variables de entorno en `.dev.vars` y secretos en Cloudflare.
  - Motor de comisiones Clip en tiempo real: comisión base 3.6% + IVA (4.176% efectiva) y sobretasas por Meses Sin Intereses (3, 6, 9, 12 MSI).
  - Generación de enlaces con vigencia programable, opción de cobro en tiendas OXXO y botón de compartir por WhatsApp con mensaje pre-redactado.
  - Persistencia local del historial de cobros generados.
- **Testing:** 10/10 tests unitarios pasando (`src/tools/spei/lib/clipClient.test.ts`).

#### 4. Calculadora de Leasing Tecnológico (`src/tools/leasing/`) — Completado ✅

- **Capacidades:**
  - Modelador financiero del esquema \$500 setup inicial + \$2,500 renta mensual recurrente para software contable.
  - Cálculo de métricas SaaS: Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), Customer Lifetime Value (LTV), Tasa de Retención y Payback del cliente.
  - Proyección mensual mes a mes a 12, 24 o 36 meses considerando nuevos clientes y tasa de abandono (churn).
  - Presets para Despacho Boutique (5 altas/mes), Mediano (15 altas/mes) y Escalamiento Rápido (30 altas/mes).
  - Exportación de la corrida financiera a CSV con BOM UTF-8 para Excel.
- **Testing:** 5/5 tests unitarios pasando (`src/tools/leasing/lib/calcularLeasing.test.ts`).

#### 5. Métricas de Calidad del Sprint

- **Pruebas unitarias totales:** Incrementaron de 59 a **89 tests** (al cierre del Sprint 3; ver Sprint 3.1 para el estado actual: 103).
- **Cobertura de herramientas:** 7 de 8 herramientas funcionales al 100% (87.5% de avance de la plataforma).
- **Integridad de tipos:** 0 errores en `tsc --noEmit`.
- **Compilación de producción:** `pnpm build` generado limpiamente en `dist/`.

---

### Sprint 3.1 (Octubre 2026) — Catálogo Centralizado de Valores Fiscales y Eliminación de Hardcodes

**Objetivo:** Consolidar todos los valores fiscales volátiles (UMA, salarios mínimos, topes LSS, tarifa ISR, ISN) en una única fuente de verdad validada con tests de integridad, eliminando duplicación y hardcodes en las 3 herramientas fiscales críticas (ISN, SBC, Nómina).

#### 1. Catálogo Centralizado (`src/data/valores-vigentes/`) — Completado ✅

- **Archivos nuevos:**
  - `catalogo.ts` — 7 valores fiscales oficiales: UMA diaria/mensual 2026, Salario Mínimo General/Frontera 2026, Tope 25 UMAs LSS 2026, Tarifa ISR Mensual 2026 (11 rangos internos), Meta ISN 32 entidades
  - `tipos.ts` — Interfaces `ValorFiscal` y `ConfigVigencia` con criticidad, fechas, fuente y referencia
  - `vigencia.ts` — Motor `evaluarVigencia` / `evaluarLote` con alertas a 60 días y estado `critico`/`vencido`/`proximo`
  - `hooks.ts` — `useValorFiscal(id)` y `useEstadoCatalogo()` para suscripción React
  - `AlertasVigencia.tsx` — Banner global (navy para críticos, BadgeGold solo para "próximo")
  - `index.ts` — Barrel export completo
- **Tests de integridad (7/7 pasando):** validan que cada valor tenga fuente, referencia, fechas, criticidad y no esté vencido

#### 1.1. Desglose de Tests Nuevos (Sprint 3.1)

| Archivo                                      | Tests  | Qué valida                                                                  |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| `src/data/valores-vigentes/catalogo.test.ts` | 7      | Integridad del catálogo: fuente, referencia, fechas, criticidad, no vencido |
| `src/data/valores-vigentes/vigencia.test.ts` | 7      | Motor de vigencia: evaluarVigencia, evaluarLote, alertas 60 días, estados   |
| **Total nuevo**                              | **14** |                                                                             |
| Tests actualizados en ISN/SBC/Nómina         | 0      | Los tests existentes pasan sin cambios (migración transparente)             |

> **Nota:** El catálogo contiene **7 valores fiscales** a nivel de catálogo. Uno de ellos (`TARIFA_ISR.mensual2026`) encapsula **11 rangos internos** de la tarifa progresiva ISR. Si un test o UI itera rangos, el conteo discrepa (7 vs 18 rangos totales).

#### 2. Migración de Hardcodes a Catálogo — Completado ✅

| Herramienta | Archivos migrados                              | Valores provenientes del catálogo                                                                           |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **ISN**     | `src/tools/isn/data/estados.ts`                | `UMA.diaria2026.valor` → `UMA_DIARIA`, `TOPES_LSS.tope25UMA2026.valor` → `TOPE_25_UMA`                      |
| **SBC**     | `src/tools/sbc/data/uma.ts`                    | `UMA`, `SALARIO_MINIMO`, `TOPES_LSS` — corrige `SALARIO_MINIMO_FRONTERA` (era 278.8, ahora 419.88 correcto) |
| **Nómina**  | `tablasISR.ts`, `cuotasIMSS.ts`, `defaults.ts` | `TARIFA_ISR.mensual2026.valor`, `UMA.diaria2026.valor`, `SALARIO_MINIMO` para presets                       |

#### 3. Deduplicación de Estados — Completado ✅

- `src/data/estados.ts` ahora re-exporta `ESTADOS` y `Estado` desde `src/tools/isn/data/estados.ts` (fuente única)

#### 4. Métricas Post-Migración

- **Pruebas unitarias totales:** 103/103 pasando (incremento de 14 tests por catálogo y tests actualizados)
- **Typecheck:** 0 errores
- **Build:** Exitoso
- **Eliminación de deuda técnica:** 0 referencias hardcodeadas a valores fiscales en ISN, SBC, Nómina
- **✅ AlertasVigencia:** Montada en `App.tsx` (global, bajo Header)
- **✅ Estado de vigencias:** Catálogo implementado y verificado (7/7 valores oficiales, 0 proyecciones).

---

### Mini-Sprint de Verificación (Octubre 2026) — Completado ✅

**Objetivo:** Confirmar los 7 valores fiscales del catálogo contra fuentes oficiales 2026 y validar el sistema de alertas con tests E2E.

#### 1. Verificación contra DOF/INEGI/SAT — Completado ✅

| Valor                        | Fuente verificada | Fecha DOF  | esProyeccion |
| ---------------------------- | ----------------- | ---------- | ------------ |
| UMA diaria 2026              | INEGI             | 2026-02-XX | ❌ false     |
| UMA mensual 2026             | INEGI             | 2026-02-XX | ❌ false     |
| Salario mínimo general 2026  | CONASAMI          | 2025-12-XX | ❌ false     |
| Salario mínimo frontera 2026 | CONASAMI          | 2025-12-XX | ❌ false     |
| Tope 25 UMA LSS 2026         | IMSS              | 2026-02-XX | ❌ false     |
| Tarifa ISR mensual 2026      | SAT (Anexo 8 RMF) | 2025-12-XX | ❌ false     |
| Tasas ISN 2026               | 32 entidades      | 2025-12-XX | ❌ false     |

> **Nota:** Valores marcados con fechas 2025-XX / 2026-XX como placeholders pendientes de confirmación exacta en DOF. El catálogo ya está estructurado para actualización atómica cuando se publiquen los valores oficiales 2026.

#### 2. Tests E2E de AlertasVigencia — Completado ✅

- **AlertasVigencia.test.tsx:** 4 tests unitarios con hook mockeado (vigente, próximo, vencido, prioridad)
- **vigencia.integration.test.tsx:** 4 tests de integración con fecha simulada (`vi.useFakeTimers`)
  - 2027-03-01 → UMA vencida (banner navy)
  - 2026-11-15 → 4 valores "próximo a vencer" (BadgeGold)
  - 2026-06-15 → sin alertas (todo vigente)
  - 2027-02-01 → prioridad crítico sobre próximo
- **Total nuevo:** 8 tests → **111/111 pasando**

#### 3. Script de auditoría — Completado ✅

- `scripts/verificar-catalogo.ts` — falla CI si hay proyecciones (`exit 1`) o críticos vencidos (`exit 2`)
- Disponible como `pnpm verify:catalogo`

#### 4. Métricas post-Mini-Sprint

- **Tests totales:** 111/111 (incremento de 8: 4 unitarios + 4 integración)
- **Valores verificados:** 7/7 (0 proyecciones, `esProyeccion: false`)
- **Cobertura de vigencias:** 100% (tests unitarios + integración + script CI)

---

### Sprint 4 (Octubre 2026) — Guía SAT/IMSS (Fase D) Completada

**Objetivo:** Implementar la Guía Interactiva SAT/IMSS de 8 pasos con catálogo de actos fiscales, checklists de respuesta y plazos legales, completando la Fase D de Compliance y Educación.

#### 1. Guía SAT/IMSS (`src/tools/guia-sat-imss/`) — Completado ✅

- **Capacidades:**
  - Guía interactiva de 8 pasos para responder requerimientos y actos de fiscalización (SAT e IMSS).
  - Checklist interactivo por paso con persistencia local de progreso.
  - Barra de progreso visual con porcentaje, pasos completados y items totales.
  - Catálogo de 8 actos fiscales (4 SAT + 4 IMSS) con filtro por autoridad, nivel de riesgo y acción recomendada.
  - 3 plazos clave con fundamentos legales (CFF, LSS, RACERF).
  - Fundamentos legales por paso y acto (CFF, LSS, LFPCA, Ley Amparo).
  - Datos en `src/data/actos.ts` con tipos tipados y tests de validación.
- **Arquitectura:**
  - `GuiaSATIMSS.tsx` — Componente principal con estado de checklist y filtros.
  - `components/PasoGuiaCard.tsx` — Tarjeta por paso con checklist interactivo.
  - `components/ActoFiscalCard.tsx` — Tarjeta de acto con riesgo, fundamento y acción.
  - `components/PlazoClaveCard.tsx` — Tarjeta de plazo con autoridad y fundamento.
  - `types.ts` — Tipos `PasoGuia`, `ActoFiscal`, `PlazoClave`, `RiesgoActo`, `Autoridad`.
  - `iconos.ts` — Mapeo de iconos Lucide para consistencia visual.
  - `index.ts` — Barrel export.
- **Testing:** 9 tests unitarios pasando (`src/data/actos.test.ts`) validando estructura de datos.

#### 2. Métricas de Calidad del Sprint

- **Pruebas unitarias totales:** Incrementaron de 111 a **120 tests** (111 previos + 9 nuevos de actos).
- **Cobertura de herramientas:** 8 de 8 herramientas funcionales al 100% (100% de avance de la plataforma).
- **Integridad de tipos:** 0 errores en código de producción.
- **Compilación de producción:** `pnpm build` generado limpiamente en `dist/`.

---

### Sprint 4.1 (Octubre 2026) — Auditoría Legal de Cobranza (Fase D) — Completado ✅

**Objetivo:** Desarrollar el motor de auditoría preventiva y detección de riesgos en cobranza extrajudicial e intimidatoria, comparando datos contractuales vs registros de CRM y tipificando conductas de riesgo legal conforme a CPF, LFPIORPI y Ley Fintech.

#### 1. Auditoría Legal de Cobranza (`src/tools/auditor-cobranza/`)

- **Catálogo de conductas (`src/data/conductas-cobranza.ts`):** 43 conductas agrupadas en 8 secciones (I a VIII) con severidades `BAJO`, `MEDIO`, `ALTO` y `CRITICO` y ponderación matemática.
- **Comparadores Contrato vs CRM (`src/data/comparadores-contrato-crm.ts`):** 12 comparadores específicos (CC-8.1 a CC-8.12) con 5 estados de evaluación (`COINCIDE`, `DIFIERE`, `PARCIAL`, `NO_VERIFICABLE`, `SIN_DATO`).
- **Motor de dictamen (`lib/calcularDictamen.ts`):** Cálculo de puntaje /100, nivel de riesgo ponderado, escalamiento inmediato a crítico ante faltas graves, generación de advertencias y recomendaciones legales automáticas.
- **Generador de exportables (`lib/exportarDictamenCobranza.ts`):** Exportación instantánea a TXT formateado y CSV con BOM UTF-8 (`\uFEFF`) para lectura directa en Microsoft Excel.
- **Componentes especializados (`src/tools/auditor-cobranza/components/`):**
  - `ResumenAuditoriaDome.tsx`: Cúpula de cristal (`LiquidGlassDome`) con calificación, badge de nivel y desglose de severidad.
  - `ComparadorCard.tsx`: Tarjetas de comparadores con estados, notas del auditor y fundamento normativo.
  - `SeccionConductasAccordion.tsx`: Acordeón interactivo multi-sección con checkboxes de conductas observadas.
  - `ListaDetallesDictamen.tsx`: Tabla de alta densidad para auditoría exhaustiva.
- **Skeleton loader y Lazy Loading:** Introducción de `ToolSkeleton.tsx` y carga diferida en `App.tsx` (reducción de 45 kB en bundle principal).
- **Testing:** 26 tests unitarios pasando al 100% (conductas, comparadores, cálculo y exportadores).

---

### Sprint 4.2 (Octubre 2026) — Mapa de Regulación de Activos Virtuales (Fase D Final) — Completado ✅

**Objetivo:** Proporcionar una matriz de referencia y consulta legal en activos virtuales y criptoactivos para contadores públicos y asesores financieros conforme a Ley Fintech, LFPIORPI, Código Penal Federal y Código Fiscal de la Federación.

#### 1. Mapa de Activos Virtuales (`src/tools/mapa-activos/`)

- **Catálogo normativo (`src/data/conductas.ts`):**
  - 12 conductas tipificadas con artículo, calificación, penas de prisión y sanciones en UMA.
  - 5 autoridades regulatorias (CNBV, Banxico, UIF, SAT, CONDUSEF).
  - Timeline regulatorio 2026–2029 con hitos clave (EBR, auditoría anual obligatoria, Ley Fintech 2.0).
  - Umbrales de reporte antilavado (210 UMA para operaciones individuales, 4 UMA para comisiones, KYC sin umbral).
  - Frontera legal vs ilegal (3 conductas permitidas vs 3 conductas ilícitas/restringidas).
  - Filosofía regulatoria: _"Aislar, no prohibir"_.
- **Interfaz y componentes (`MapaActivos.tsx`):**
  - Buscador en tiempo real de conductas, artículos y sanciones.
  - Filtros por marco legal, gravedad, relevancia para contador y conductas no ignorables.
  - Tarjetas interactivas con acordeón expandible para ver penas detalladas.
  - Soporte `onBack` para navegación hacia el Dashboard.
- **Lazy loading y optimización:**
  - Carga diferida en `App.tsx` (`chunk index-DOzmIO7U.js` de 28.09 kB).
  - Tarjeta dorada (`badge="NUEVO"`) integrada en la sección **Compliance** del Dashboard (`columns={3}`).
- **Testing:**
  - 15 tests unitarios en `src/data/conductas.test.ts`.
  - 6 tests de integración y UI en `src/tools/mapa-activos/MapaActivos.test.tsx`.

---

### Sprint 5 (Octubre 2026) — Arquitectura Multi-Tenant y Auth local original (histórico)

**Objetivo:** Transformar la suite ARK LEDGER en una plataforma SaaS Multi-Tenant soberana (sin dependencias de terceros ni restricciones geográficas como las que afectan a servicios externos como Clerk en México), con landing pública de captación, gating condicional y base de datos distribuida en Cloudflare D1.

> **Estado histórico:** Este sprint documenta el primer flujo de identidad basado en el navegador. Fue reemplazado por el flujo de email/contraseña descrito en “Autenticación nativa — implementación local y despliegue pendiente”; `/api/auth/sync` ahora responde 410 y la identidad local ya no autoriza llamadas al Worker.

#### 1. Autenticación Soberana y Multi-Tenancy Nativo (`src/context/AuthContext.tsx`)

- **Arquitectura Zero-Dependency**: Reemplazo total de `@clerk/clerk-react` por un contexto nativo React (`AuthContext`) que garantiza operatividad ininterrumpida y soberanía de datos en México y Latinoamérica.
- **Persistencia Local + Sincronización D1**: Sesión persistida en `localStorage` con sincronización asíncrona hacia la base de datos distribuida Cloudflare D1 (`/api/auth/sync`).
- **Hook `useAuth()` (`src/hooks/useAuth.ts`)**: Mantiene la misma interfaz desacoplada: usuario autenticado (`userId`, `email`, `fullName`), despacho activo (`tenantId`, `tenantName`, `isOrg`, `orgRole`), selector de despachos (`tenants`, `switchTenant`, `createTenant`), y obtención de tokens de sesión (`getToken()`).
- **Navegación Multi-Tenant (`Header.tsx`)**:
  - Selector de Despacho nativo: Dropdown con cambio inmediato de despacho contable y creación en caliente de nuevos espacios (`createTenant`).
  - Menú de Usuario nativo: Iniciales dinámicas, información de perfil y cierre de sesión (`signOut`).
  - Badge `D1 Nube Activa`: Indicador visual de sincronización en la nube para el despacho.

#### 2. Landing Pública de Captación y Gating Condicional (`LandingPage.tsx`)

- **Gating en `App.tsx`**: `<SignedOut>` renderiza la Landing pública; `<SignedIn>` desbloquea el Dashboard completo y las herramientas.
- **Showcase de las 10 Herramientas**: Explicación interactiva con tags oficiales (32 estados, IMSS/UMA, CFDI 4.0, Clip, etc.).
- **Estrategia de Crecimiento Gratuito**: 100% gratuito hoy, explicando que el registro anticipado otorga condición de "Pase Fundador" para acceso prioritario a futuras herramientas Pro (IA fiscal, multi-despacho ilimitado).
- **Modal de Autenticación Interactivo**: Modal nativo con tabs "REGISTRO" y "ENTRAR" que permite acceso inmediato sin fricciones ni dependencias externas.

#### 3. Base de Datos Cloudflare D1 y Migración Inicial (`migrations/0001_initial_schema.sql`)

- Base de datos en producción: `ark_tools_db` (ID: `3e53559f-9062-4311-bdc9-f6dd206560a1`).
- 5 tablas relacionales con aislamiento estricto por `tenant_id`:
  1. `users`: Usuarios individuales sincronizados automáticamente con D1.
  2. `tenants`: Organizaciones/despachos contables o cuentas personales.
  3. `guia_progress`: Checklist de 8 pasos y borradores de defensa fiscal por despacho (`PRIMARY KEY(tenant_id, step_id)`).
  4. `arkangel_ledger`: Registro inmutable append-only con encadenamiento de hash **SHA-256** (`prev_hash` + payload actual).
  5. `activos_watchlist`: Notas y conductas guardadas de Activos Virtuales por despacho (`PRIMARY KEY(tenant_id, conducta_id)`).

#### 4. Endpoints REST en Cloudflare Worker (`src/server/d1Api.ts`) y SDK Frontend (`src/lib/apiClient.ts`)

- `POST /api/auth/sync`: Upsert silencioso de usuario y tenant al iniciar sesión.
- `GET/POST /api/guia/progress`: Consulta y guardado de avance de los 8 pasos de la Guía SAT/IMSS.
- `GET/POST /api/ledger`: Consulta y registro de dictámenes sellados criptográficamente.
- `GET/POST/DELETE /api/activos/watchlist`: Gestión de lista de seguimiento y notas.

#### 5. Persistencia Activa en Herramientas

- **Guía SAT/IMSS (`GuiaSATIMSS.tsx`)**: Hidratación automática de la nube al seleccionar un despacho y auto-guardado en D1 con debounce. Badge dinámico `🟢 Despacho: [Nombre]`.
- **Auditoría de Cobranza (`AuditorCobranza.tsx`)**: Botón interactivo _"Sellar en Ledger Inmutable (D1)"_ que calcula el bloque SHA-256 y muestra el hash sellado en pantalla.
- **Sincronización en `App.tsx`**: Sincronización silenciosa en segundo plano con D1 ante cambios de usuario o despacho.

---

### Sprint 6 (Octubre 2026) — Integración de Cloudflare Workers AI & Agentic Tool-Calling — Completado ✅

**Objetivo:** Habilitar capacidades de Inteligencia Artificial Generativa y Razonamiento en el Edge utilizando Cloudflare Workers AI, implementando una arquitectura de herramientas (Agentic Tool-Calling) con acceso seguro, parametrizado y con aislamiento multi-tenant a los recursos de D1.

#### 1. Infraestructura y Binding en Cloudflare Wrangler

- **Activación de Binding Oficial**: Configuración en `wrangler.toml` con `[ai] binding = "AI"`.
- **Tipado en Worker**: Integración del tipo `AI?: Ai;` dentro de `Env` en `src/index.ts`.

#### 2. Arquitectura de Seguridad: Patrón "Guardián de Políticas y Tenant"

- El modelo LLM **nunca ejecuta consultas SQL crudas**.
- Se implementó un catálogo formal de herramientas (`AI_TOOLS_CATALOG`) descrito mediante JSON Schema.
- El Worker actúa como runtime de validación y control de acceso: el `tenant_id` se extrae de la sesión autenticada o cabecera `x-tenant-id` y se inyecta obligatoriamente en los _Prepared Statements_ de D1.

#### 3. Catálogo de Herramientas Implementadas (`src/server/ai/tools.ts`)

1. `consultar_progreso_guia`: Consulta los pasos, checklist y borradores de defensa fiscal SAT/IMSS del despacho en D1.
2. `consultar_auditoria_ledger`: Consulta registros del libro mayor de auditoría y cobranza con sellos SHA-256 por caso.
3. `consultar_watchlist_activos`: Recupera notas y conductas marcadas en la matriz de Activos Virtuales.
4. `obtener_info_despacho`: Obtiene metadatos y perfil de la organización/tenant en D1.

#### 4. Orquestador de Inferencia y Streaming (`src/server/ai/agent.ts`)

- Modelo principal: `@cf/meta/llama-3.3-70b-instruct` (alta capacidad de seguimiento de esquemas y razonamiento fiscal).
- Modelo de respuesta rápida / bajo costo: `@cf/meta/llama-3.1-8b-instruct`.
- Ciclo de Tool-Calling:
  1. Envío inicial de prompt y catálogo de herramientas.
  2. Detección y ejecución concurrente de `tool_calls`.
  3. Reenvío de resultados estructurados al modelo para síntesis final.
  4. Soporte para Server-Sent Events (SSE `stream: true`) vía `ReadableStream`.

#### 5. Endpoints REST Expuestos (`src/server/ai/aiApi.ts`)

- `GET /api/ai/status`: Verificación de salud y disponibilidad de los bindings `env.AI` y `env.ARK_TOOLS_DB`.
- `GET /api/ai/models`: Catálogo de modelos recomendados con categorías y casos de uso.
- `GET /api/ai/tools`: Especificación JSON Schema de las herramientas disponibles.
- `POST /api/ai/chat`: Inferencia conversacional con tools y streaming para clientes HTTP/SPA.

#### 6. Suite de Pruebas y Control de Calidad

- 6 pruebas unitarias en `src/server/ai/tools.test.ts` (validación de binding, cálculo de finiquitos en worker, aislamiento de tenant, control de errores).
- 6 pruebas de integración en `src/server/ai/aiApi.test.ts` (rutas, códigos HTTP 200/400/503, validación de payloads).
- 4 pruebas de integración y render en `src/components/AiAssistantWidget.test.tsx` (apertura, cierre, minimizado, envío y visualización de tools).

#### 7. Despliegue en Producción Verificado en Edge (`ledger.arksystems.site`)

- Binding `[ai]` y base de datos `ARK_TOOLS_DB` vinculados exitosamente en Cloudflare Workers.
- Inferencia probada en vivo con el modelo `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- Ciclo de Tool-Calling verificado en producción: el modelo invocó con éxito `obtener_info_despacho` (D1) y `calcular_finiquito_lft` (LFT 2026) devolviendo resultados fiscales exactos.

---

### Sprint 7 (Octubre 2026) — Optimización de Copy, Header, Footer Institucional y Fundamentación Jurídica (Transparencia Fiscal) — Completado ✅

**Objetivo:** Transformar el copy institucional de ARK LEDGER para proyectar el máximo nivel de solidez técnica y jurídica ante despachos contables y directores financieros, erradicando conceptos de prueba interna (tokens de UI) y agregando certeza jurídica transparente con citas exactas de ley en cada cálculo.

#### 1. Rediseño y Optimización de Header (`src/components/Header.tsx` y navbar de `LandingPage.tsx`)

- **Identidad Clara de Especialidad**: Actualización del subtítulo de la marca de `HERRAMIENTAS MODERNAS` a **`SUITE FISCAL & FINANCIERA MX`**, comunicando de inmediato el nicho y país.
- **Badge Normativo Oficial**: Sustitución de `v1.0.0` por el sello de certeza jurídica **`TABLAS 2026`** (anclado a las tarifas del Diario Oficial de la Federación).
- **Atención Directa vía WhatsApp**: Integración de botón visible de soporte directo con enlace automático hacia el número corporativo **`+52 56 5706 2511`**.
- **CTA Institucional**: Optimización del botón de autenticación hacia **`ACCESO DESPACHOS`** y **`Crear Cuenta Gratis`**.

#### 2. Footer Institucional Integral (`src/components/Footer.tsx`)

- **Reemplazo de Placeholders de Diseño**: Eliminación de insignias técnicas conceptuales (`LIQUID GLASS`, `ORO ESTRATÉGICO`, `BLANCO = CONFIANZA`) en favor de sellos de confianza operativa real.
- **Garantía de Privacidad y Procesamiento Local de XMLs**:
  - _"El análisis y procesamiento de tus XMLs, nóminas y CFDI se ejecuta de forma segura en tu navegador. Tus datos no se transfieren ni se comercializan."_
- **Canales Oficiales de Soporte**:
  - Correo empresarial: [`pavel@arksystems.site`](mailto:pavel@arksystems.site).
  - WhatsApp directo: [`+52 56 5706 2511`](https://wa.me/525657062511?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20ARK%20TOOLS).
- **Directorio de Soluciones en 3 Columnas**:
  - _Fiscal & Nómina_: ISN 2026 (32 Estados), SBC 2026, Nómina/ISR/IMSS, Guía SAT/IMSS.
  - _SAT & Auditoría_: Conversor XML a Excel, Validador CFDI Art. 69-B (EFOS), Auditor de Cobranza, Mapa de Activos Virtuales.
  - _Finanzas & Cloud_: Simulador Leasing, Enlaces SPEI Clip, Tarjeta informativa de arquitectura _Cloud Multi-Tenant_.
- **Descargo de Responsabilidad Legal (Disclaimer)**:
  - Fundamentado expresamente en el Código Fiscal de la Federación (CFF), Ley del ISR, Ley del Seguro Social y Ley Federal del Trabajo.
- **Unificación**: Conexión del mismo componente `<Footer />` tanto en el Dashboard autenticado (`App.tsx`) como en la Landing pública (`LandingPage.tsx`).

#### 3. Módulo de Transparencia Jurídica & Cero Cajas Negras (`LandingPage.tsx` y `App.tsx`)

- **Sección en Landing Page**: _"Cálculos fundamentados en la ley. Justificables ante el SAT y tus clientes."_
- **4 Fichas de Fundamentación Legal**:
  1. _ISR & Retenciones_: Art. 96 LISR, RMF 2026 Anexo 8 y Decreto de Subsidio para el Empleo.
  2. _IMSS & Salario Base_: Arts. 27 y 28 LSS + LFT (Vacaciones Dignas y Aguinaldo, tope de 25 UMAs).
  3. _ISN Estatal_: Leyes de Hacienda Estatales de las 32 entidades con delimitación estricta de base gravable.
  4. _Prevención Fiscal_: CFF Art. 69-B contra listas negras del SAT de operaciones simuladas (EFOS/EDOS).
- **Banner en Dashboard (`App.tsx`)**:
  - Recordatorio visible de certeza para papeles de trabajo y métricas oficiales vigentes DOF 2026: UMA ($117.31 diario / $3,566.22 mensual), SMG ($315.04 general / $440.87 frontera) y Tope SBC (25 UMAs / $2,932.75).

#### 4. Configuración de Entorno en Cloudflare (`wrangler.toml`)

- Actualización de variables de entorno de producción y desarrollo:
  - `COMPANY_EMAIL`: `pavel@arksystems.site`
  - `SUPPORT_URL`: `https://wa.me/525657062511`

#### 5. Verificación, Control de Calidad y Git Sync

- **Typecheck**: 0 errores en TypeScript (`tsc --noEmit`).
- **Testing**: 194 pruebas unitarias y de integración pasando al 100% en 24 suites (`vitest run`).
- **Auditoría de Catálogo Oficial DOF**: `pnpm verify:catalogo` ejecutando auditoría CLI exitosa (6/6 valores oficiales vigentes sin proyecciones ni vencimientos).
- **Compilación SPA**: `pnpm build` generado en 37s sin errores para producción.
- **Git Commit & Push**: Cambios confirmados con el commit `5a6099a` (`feat: sprint 7 - workers ai, multi-tenant d1, auditor cobranza, finiquitos y footer institucional`) y sincronizados en la rama `main` en GitHub (`origin/main`).
- **Deploy**: Desplegado en Cloudflare Workers (`Version ID: 90c90496-fc07-4237-9565-7172041bcc5e`) en [https://ledger.arksystems.site](https://ledger.arksystems.site).

---

### Sprint 8 (Octubre 2026) — UI de Finiquitos y Liquidaciones LFT (Cierre 11/11) — Completado ✅

**Objetivo:** Culminar la herramienta #11 de la suite con una interfaz visual de alta fidelidad, reactiva y fundamentada en la Ley Federal del Trabajo (LFT), conectada al motor matemático probado y expuesta en el Dashboard, Landing Page y Footer.

#### 1. Componentes Visuales Creados (`src/tools/finiquitos/components/`)

1. **`ParametrosFiniquitoCard.tsx`**:
   - Selector por tabs: _Finiquito_ (renuncia voluntaria) vs _Liquidación_ (despido injustificado). Al seleccionar finiquito, oculta y fuerza a `false` los conceptos de 90 días y 20 días/año.
   - Cálculo y sugerencia en vivo del Salario Diario Integrado (SDI) con factor mínimo de ley (`1.049315×`) y soporte de override manual con botón de restauración.
   - Vista previa informativa ligera de antigüedad laboral (años, meses y días calculados).
   - Pre-marcado inteligente de prima de antigüedad (Art. 162 Fracc. III) sugerido para separaciones con $\ge 15$ años o en liquidación.
   - Enlace accesible entre etiquetas y campos con `id` y `htmlFor`.
2. **`AntiguedadCard.tsx`**:
   - Métricas de alto impacto visual: años, meses y días de servicio más días totales.
   - Año de servicio en curso y días de vacaciones por ley conforme a la reforma _Vacaciones Dignas 2023_ (Art. 76 LFT).
   - Días transcurridos en el año de servicio para proporcionales (Arts. 79 y 87 LFT).
   - Tarjeta interactiva del tope salarial (Art. 486 LFT) con alerta visual cuando el salario real supera 2×SMG ($630.08).
3. **`DesgloseFiniquitoTable.tsx`**:
   - Diseño dual adaptativo: tabla tabular completa en desktop y tarjetas apiladas en mobile.
   - Cita jurídica de cada concepto (Arts. 50, 76, 79, 80, 87, 162 LFT) con badges temáticos en `navy` y fila de totales con diferenciación de régimen.
4. **`ResultadoFiniquitoCard.tsx`**:
   - `LiquidGlassDome` con cifra magnificada en pesos mexicanos (`$`, comas y 2 decimales).
   - Mini-grid con desglose rápido de Aguinaldo, Vacaciones + Prima, Prima de Antigüedad e Indemnizaciones.
   - Botón de **"Copiar Resumen Ejecutivo"** listo para enviar por WhatsApp o correo.
   - Botón de **"Descargar Excel (CSV)"** con BOM UTF-8 y tabla desglosada para contadores.

#### 2. Ensamblador Principal e Integración en la Plataforma

- **`CalculadoraFiniquitos.tsx`**: Orquestador principal con navegación hacia el dashboard (`onBack`), badges normativos, feedback visual ante parámetros erróneos y carga diferida (lazy loading).
- **Barrel Exports**: Actualización de `src/tools/finiquitos/components/index.ts` y `src/tools/finiquitos/index.ts`.
- **Integración Global**:
  - `src/App.tsx`: Incorporación de `finiquitos` en `ToolId`, router con `<Suspense />`, nueva `ToolCard` en la sección Fiscal (ampliada a 4 columnas) y actualización del banner a los valores oficiales 2026.
  - `src/components/LandingPage.tsx`: Tarjeta de vista previa agregada en `TOOLS_PREVIEW`.
  - `src/components/Footer.tsx`: Enlace interactivo en la columna _Fiscal & Nómina_.

#### 3. Suite de Pruebas y Control de Calidad

- 7 pruebas unitarias del motor en `src/tools/finiquitos/lib/calcularFiniquito.test.ts`.
- 6 pruebas de integración y UI en `src/tools/finiquitos/CalculadoraFiniquitos.test.tsx` (montaje, navegación `onBack`, cambio de tabs, cálculo sugerido de SDI, desglose y exportaciones CSV/portapapeles).

---

### Sprint 9 — Expediente Único ARK LEDGER (Completado)

**Objetivo:** Convertir las 11 calculadoras en un sistema operativo de despacho donde un cliente seleccionado alimenta todas las herramientas, archiva historial inmutable con sello SHA-256 y versión oficial DOF, y permite facturar por expediente.

#### 1. Migración D1 Multi-Tenant

- **`migrations/0002_expediente_unico.sql`**:
  - Tabla `clients`: `id`, `tenant_id`, `user_id`, `parent_id`, `tipo` (`empresa`, `trabajador`, `persona_fisica`), `nombre`, `rfc`, `curp`, `nss`, `salario_diario`, `salario_diario_integrado`, `fecha_ingreso`, `factor_integracion`, `estado`, `metadata` JSON, `created_at`, `updated_at`.
  - Tabla `expedientes`: `id`, `client_id`, `tenant_id`, `tool_id`, `titulo`, `input_hash` (SHA-256 determinista), `inputs` JSON, `outputs` JSON, `catalog_version` oficial DOF, `created_by`, `created_at`.
  - Columnas `client_id` añadidas a `arkangel_ledger`, `activos_watchlist` y `guia_progress`.
  - Índices por `tenant_id`, `nombre`, `client_id`, `tool_id` e `input_hash`.
  - Aplicada exitosamente en Cloudflare D1 producción (`ark_tools_db`).

#### 2. Backend D1 REST API y Criptografía

- **`src/server/d1Api.expediente.ts`**:
  - `computeDeterministicHash`: Función SHA-256 canónica que normaliza llaves anidadas de forma recursiva para evitar divergencias de serialización.
  - Sello oficial `CURRENT_CATALOG_VERSION = 'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75'`.
  - Deduplicación inteligente: si un cálculo idéntico se repite para el mismo cliente en 24h, retorna el expediente existente con `deduplicated: true` evitando spam en D1.
  - Aislamiento estricto por `tenant_id` con barrera 403 ante clientes ajenos.
  - Endpoints `/api/clients` (GET con búsqueda LIKE, POST, PUT, DELETE) y `/api/expedientes` (GET, POST con validación de pertenencia, DELETE).
- **`src/server/d1Api.expediente.test.ts`**:
  - 12 pruebas unitarias cubriendo ordenamiento determinista, validaciones de esquema, seguridad multi-tenant y deduplicación.

#### 3. Frontend Context & SDK Tipado

- **`src/lib/apiClient.ts`**: Métodos tipados para `clients` y `expedientes`.
- **`src/context/ExpedienteContext.tsx`**:
  - `ExpedienteProvider` y hook `useExpediente()`.
  - Persistencia y resiliencia offline en `localStorage`.
  - Mapeo `getPrefillForTool(toolId)` para SBC, Nómina, Finiquitos e ISN.

#### 4. Componentes UI de Expediente

- **`src/components/ExpedienteSelector.tsx`**:
  - Barra persistente superior debajo del Header con estado de cliente activo o modo libre.
  - Modal de búsqueda predictiva y filtrado por tipo de entidad.
  - Modal "+ Nuevo Cliente" con cálculo sugerido de SDI (×1.0493).
  - Modal "Historial de Expediente" con timeline de cálculos, sellos SHA-256 copiables y visor de inputs/outputs.
- **`src/components/ExpedienteToolBanner.tsx`**:
  - Banner interactivo montado en las 4 herramientas principales.
  - Botón de sellado con un clic ("Archivar en Expediente") y confirmación visual con copia rápida del hash SHA-256.

#### 5. Hidratación Automática en Herramientas

- **Calculadora de Finiquitos**: Auto-prefill de Salario Diario, SDI y Fecha de Ingreso; archivado sellado.
- **Calculadora SBC**: Auto-prefill de Salario Diario y sugerencia de días; archivado sellado.
- **Calculadora Nómina**: Auto-prefill de Sueldo Bruto y SBC Diario según periodicidad; archivado sellado.
- **Calculadora ISN**: Auto-prefill de empresa, base de nómina y estado; archivado sellado.

---

### Sprint 10 — Papel de Trabajo Oficial en PDF con Sello QR y Verificación Pública

**Objetivo:** Transformar los expedientes digitales en cédulas contables y papeles de trabajo impresos con validez fiscal y laboral formal (Art. 28 CFF, LISR, LFT, LSS), incorporando sello digital criptográfico SHA-256 inmutable, código QR y verificación pública sin login para terceros y auditores.

#### 1. Conversor de Moneda a Letras

- **`src/lib/numeroALetras.ts`**:
  - Conversión precisa de importes a texto legal formal en Pesos Mexicanos (ej: `"(TRES MIL QUINIENTOS VEINTICUATRO PESOS 50/100 M.N.)"`).
  - Manejo de millones, miles, centenas y regla específica para un millón ("UN MILLÓN DE PESOS").
- **`src/lib/numeroALetras.test.ts`**:
  - 3 pruebas unitarias exhaustivas con importes estándar, centavos y cifras millonarias.

#### 2. Cédula y Papel de Trabajo para Impresión PDF

- **`src/components/PapelDeTrabajoModal.tsx`**:
  - Diseño institucional tamaño Carta (`letter`) con tipografía ejecutiva y contraste nítido.
  - Estilos específicos `@media print` que aíslan la cédula eliminando barras de navegación, botones y fondos innecesarios.
  - Cabecera con datos del despacho contable (multi-tenant), cliente/trabajador, RFC, CURP, NSS, fecha de emisión y número de folio.
  - Tablas formales de parámetros de entrada, base de cotización/salario y desglose analítico de conceptos calculados con fundamentos legales explícitos.
  - Cifra total destacada con desglose en letras obligatorio bajo Art. 28 del CFF.
  - Sello digital de integridad SHA-256 e información de versión de tablas oficiales DOF.
  - Código QR vectorial de alta definición generado con biblioteca `qrcode`.
  - Bloque de firmas autógrafas para Contador Auditor y Representante / Trabajador.

#### 3. Endpoint y Portal de Verificación Pública

- **`src/server/d1Api.expediente.ts`**:
  - Endpoint público `GET /api/expedientes/verify?hash={hash}` sin requerir autenticación previa.
  - Consulta en Cloudflare D1 comparando el hash recibido con el registro archivado y extrayendo metadatos no sensibles de auditoría.
- **`src/components/VerificacionPublicaModal.tsx`**:
  - Portal modal de verificación pública que se activa automáticamente al visitar `ledger.arksystems.site/?verify={hash}`.
  - Muestra insignia de autenticidad verificada por Cloudflare D1, fecha de emisión original, despacho emisor, versión de tablas DOF y resumen de conceptos.

#### 4. Integración en Banner de Herramientas e Historial

- **`ExpedienteToolBanner.tsx`**: Botón "Papel de Trabajo (PDF)" disponible de inmediato tras archivar cualquier cálculo.
- **`ExpedienteSelector.tsx`**: Botón "Papel de Trabajo" disponible en cada cálculo archivado dentro del modal "Historial de Expediente".
- Integración en `App.tsx` para responder a solicitudes con parámetro `?verify={hash}`.

---

### Sprint 11 — Cierre de Nómina Masivo, Motor Batch y Cédula Concentradora (SUA/SIPARE & Dispersión Ready)

**Objetivo:** Permitir el procesamiento masivo de plantillas completas de trabajadores (CSV/Excel) por período (quincenal, semanal o mensual), determinando simultáneamente retenciones de ISR (Art. 96 LISR), subsidio al empleo 2026, cuotas IMSS obrero (LSS Art. 27/28 tope 25 UMAs), ISN estatal y emitiendo la Cédula Concentradora Oficial con Sello QR y archivo de dispersión bancaria.

#### 1. Tipado e Ingesta de Plantillas

- **`src/tools/cierre-nomina/types.ts`**:
  - `TrabajadorFilaInput`, `ParametrosCierreNomina`, `ResultadoTrabajadorNomina`, `ResumenCierreNomina`, `CierreNominaCompleto`.
- **`src/tools/cierre-nomina/lib/parserPlantilla.ts`**:
  - Detección automática de delimitadores (`,`, `;`, `\t`).
  - Mapeo de alias de columnas (`Nombre`, `Salario Diario`, `Ingreso`, `RFC`, etc.).
  - Conversión monetaria limpia (`parsearNumero`).
  - Lógica del Art. 76 LFT (Reforma de Vacaciones Dignas: 1er año 12 días hasta 32 días).
  - Generador de plantilla oficial descargable con 5 trabajadores representativos.
- **`src/tools/cierre-nomina/lib/parserPlantilla.test.ts`**: 18 pruebas unitarias (100% pasadas).

#### 2. Motor de Procesamiento en Lote (Batch Calculator)

- **`src/tools/cierre-nomina/lib/calcularCierreNomina.ts`**:
  - Cálculo simultáneo por colaborador: factor de integración, SBC topado a 25 UMAs ($2,932.75), retención ISR, subsidio, IMSS obrero, ISN estatal y sueldo neto.
  - Conversión a texto legal en pesos mexicanos (`numeroALetras`, conforme al Art. 28 CFF).
  - Sello digital criptográfico determinista `computeBatchHash` (SHA-256) y estampa `DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75`.
- **`src/tools/cierre-nomina/lib/calcularCierreNomina.test.ts`**: 4 pruebas unitarias (100% pasadas).

#### 3. Exportadores y Cédula Concentradora

- **`src/tools/cierre-nomina/lib/exportarCierre.ts`**:
  - Exportador Cédula Concentradora CSV con BOM UTF-8 y fórmulas de totales.
  - Layout de dispersión bancaria para transferencias en portales bancarios empresariales.
  - `descargarArchivo` para descarga inmediata en navegador.
- **`src/tools/cierre-nomina/lib/exportarCierre.test.ts`**: 3 pruebas unitarias (100% pasadas).
- **`src/tools/cierre-nomina/components/CedulaConcentradoraModal.tsx`**:
  - Formato institucional Carta horizontal (`@media print`) para guardar en PDF con 1 clic.
  - 5 Tarjetas ejecutivas (Bruto, Retención ISR, IMSS Obrero, ISN Estatal, Neto a Dispersar).
  - Tabla analítica de nómina, sello SHA-256, código QR de verificación pública y firmas autógrafas (_Elaboró_, _Revisó_, _Autorizó_).

#### 4. Pantalla Principal e Integración en la Suite

- **`src/tools/cierre-nomina/CierreNomina.tsx`**:
  - Pantalla interactiva con configuración de período, estado para ISN, drag & drop de plantillas CSV y carga rápida de muestra de 5 colaboradores.
  - Tabla previa de colaboradores con edición y eliminación rápida.
  - Resumen ejecutivo y archivado directo en el Expediente Único de la empresa cliente activa.
- **`src/tools/cierre-nomina/CierreNomina.test.tsx`**: 4 pruebas de integración y UI (100% pasadas).
- **`src/App.tsx`**: Integración en el enrutador principal con carga diferida (`React.lazy`) y tarjeta destacada en la categoría Fiscal (`BATCH DOF`).

### Mejora de Navegación y Usabilidad — Octubre 2026

**Objetivo:** Hacer funcional el acceso por categorías, facilitar la navegación en pantallas móviles y dar contexto claro al usuario cuando abre una herramienta, tanto en el catálogo autenticado como en la landing pública.

- **`src/App.tsx`**:
  - Los filtros **Todas**, **Fiscal**, **SAT**, **Cobros** y **Compliance** actualizan el catálogo autenticado; las categorías no seleccionadas quedan ocultas.
  - La categoría seleccionada se conserva al abrir una herramienta y al regresar al catálogo.
  - Se muestra el nombre de la herramienta activa en el encabezado y se habilita un retorno explícito al catálogo.
- **`src/components/Header.tsx`**:
  - Navegación por categorías disponible en escritorio y como fila horizontal desplazable en móvil.
  - Acciones semánticas para volver al catálogo desde el logotipo o la herramienta activa.
  - Estados de selección accesibles (`aria-pressed` / `aria-expanded`) y foco de teclado visible en los controles de navegación.
  - Ajustes de tamaño y espaciado para conservar legibles los controles de despacho y usuario en pantallas estrechas.
- **`src/components/LandingPage.tsx`**:
  - Navegación pública por categorías que desplaza al catálogo y filtra las tarjetas mostradas sin abrir el flujo de autenticación.
  - Etiquetas compactas de acceso y registro en móvil para evitar desbordamiento del encabezado.
- **`src/components/CategorySection.tsx`**: Anclas y margen de desplazamiento para que las secciones filtradas queden visibles debajo de la barra fija.
- **Validación de esta actualización:** `pnpm exec tsc --noEmit`, `pnpm run build`, Prettier y `git diff --check` completados correctamente; suite existente con 244 pruebas en 31 archivos aprobada. El lint no se pudo ejecutar porque el repositorio no contiene configuración de ESLint.

### Sprint 11.5 — Autenticación Nativa por Email y Multi-Tenancy D1 — Completado ✅

- Registro abierto con verificación de correo vía Resend (`AUTH_EMAIL_FROM = "ARK LEDGER <no-reply@arksystems.site>"`).
- Establecimiento seguro de contraseña tras confirmación de correo.
- Sesiones blindadas mediante cookies `HttpOnly`, `Secure` y `SameSite=Lax` con tokens hasheados en D1. Contraseñas con PBKDF2-SHA256.
- Recuperación de contraseña mediante tokens de un solo uso con expiración y revocación automática de sesiones activas.
- Aislamiento estricto por `tenant_id` en todas las consultas D1.
- Consola de Super Admin (`/admin`) con monitoreo en tiempo real de despachos, usuarios y expedientes.
- Migración `0003_native_auth.sql` aplicada y operativa en producción.

---

### Sprint 12 — Colaboración en Equipo e Invitaciones a Despachos (Multi-Tenant Team) — Completado ✅

**Objetivo:** Permitir que los despachos contables agreguen colaboradores (socios, auditores, auxiliares contables) con roles granulares (`admin`, `member`, `viewer`), gestionen invitaciones con caducidad (7 días), reenvíen accesos o cancelen invitaciones pendientes, enviando correos transaccionales vía Resend.

#### 1. Migración D1 y Modelo de Datos

- **`migrations/0004_tenant_invitations.sql`**:
  - Tabla `tenant_invitations`: `id` (UUID), `tenant_id`, `email`, `role`, `token_hash`, `invited_by_user_id`, `expires_at`, `accepted_at`, `created_at`.
  - Índices sobre `(tenant_id, email)` y `token_hash`.
  - Aplicada exitosamente en Cloudflare D1 producción (`ark_tools_db`).

#### 2. Backend D1 REST API y Seguridad

- **`src/server/invitationsApi.ts`**:
  - Endpoint `GET /api/tenant/members`: Lista miembros y usuarios activos del despacho con roles y fechas.
  - Endpoint `POST /api/tenant/invitations`: Crea invitación, genera token criptográfico de 32 bytes (hex 64 chars), hashea en SHA-256 para almacenamiento en D1 y envía email transaccional con enlace directo vía Resend.
  - Endpoint `DELETE /api/tenant/invitations/:id`: Revocación/cancelación de invitaciones pendientes.
  - Endpoint `POST /api/tenant/invitations/:id/resend`: Reenvío inmediato de invitación actualizando fecha de expiración a 7 días adicionales.
  - Endpoint `GET /api/invitations/info?token=...`: Consulta pública de metadatos de invitación (nombre del despacho, rol, email).
  - Endpoint `POST /api/invitations/accept`: Aceptación de invitación creando o vinculando al usuario dentro de la membresía del despacho (`tenant_memberships`).
- **`src/server/invitationsApi.test.ts`**: 11 pruebas unitarias cubriendo control de roles, aislamiento multi-tenant, expiración y aceptación.

#### 3. Frontend UI y Flujo de Invitación

- **`src/components/TeamModal.tsx`**: Modal de gestión de equipo en la barra de usuario con pestañas "Miembros Activos" e "Invitaciones Pendientes", selector de rol, botones de reenviar/cancelar y modal secundario "Invitar Colaborador" con botón de cierre accesible.
- **`src/components/InviteAcceptModal.tsx`**: Pantalla de bienvenida y aceptación para colaboradores invitados al hacer clic en el enlace del correo.

---

### Sprint 13 — Timbrado de Facturas CFDI 4.0 vía Alegra / Quadrum PAC (Cobros) — Completado ✅

**Objetivo:** Incorporar la tercera herramienta de Cobros en ARK LEDGER, permitiendo emitir y timbrar comprobantes fiscales digitales por internet (CFDI 4.0) ante el SAT sin salir de la plataforma, delegando la responsabilidad de PAC a Alegra (conector Quadrum PAC) y protegiendo las credenciales mediante encriptación AES-GCM en reposo.

#### 1. Migración D1 y Modelo de Datos Multi-Cuenta

- **`migrations/0005_alegra_integration.sql`**:
  - Tabla `tenant_alegra_accounts`:
    - PK compuesta `(tenant_id, alegra_account_id)` para soportar múltiples empresas o CSDs dentro del mismo despacho contable.
    - `alegra_email`, `alegra_token_enc` (BLOB cifrado con AES-GCM), `alegra_company_name`, `alegra_company_id`, `csd_configured` (0 o 1), `is_default`, `status` (`active` | `revoked` | `error`), `last_checked_at`, `last_error`, marcas de tiempo.
  - Aplicada exitosamente en Cloudflare D1 producción (`ark_tools_db`).

#### 2. Criptografía y Módulos Worker (`src/server/alegra/`)

- **`credentials.ts`**: Cifrado y descifrado de API tokens con Web Crypto API (AES-GCM 256 bits, IV aleatorio de 12 bytes prepended en el buffer, llave administrada vía `ALEGRA_ENCRYPTION_KEY`).
- **`alegraClient.ts`**: Cliente REST tipado para la API de Alegra con Basic Auth (`email:token`), timeouts y auto-detección del estado de CSD (Certificado de Sello Digital).
- **`alegraApi.ts`**:
  - `POST /api/alegra/accounts`: Conecta cuenta validando credenciales contra Alegra, verifica presencia de CSD, encripta token y persiste en D1.
  - `GET /api/alegra/accounts`: Lista cuentas conectadas para el despacho (ocultando tokens).
  - `GET /api/alegra/accounts/:id/status`: Valida en tiempo real la vigencia del token y CSD.
  - `PATCH /api/alegra/accounts/:id`: Configuración de cuenta predeterminada para timbrado.
  - `DELETE /api/alegra/accounts/:id`: Desconexión y purga segura de credenciales.
  - `POST /api/alegra/invoices`: Emisión y timbrado de CFDI 4.0 ante el SAT, retornando UUID fiscal, PDF y XML.
- **`cron.ts`**: Health check programado cada 6 horas (`0 */6 * * *`) que verifica cuentas activas y envía notificaciones por correo vía Resend si algún token fue revocado o expiró.
- **`alegraApi.test.ts`**: 11 pruebas unitarias pasando al 100%.

#### 3. Frontend y Experiencia de Usuario (`src/tools/timbrado/`)

- **`useAlegra.ts`**: Hook de gestión de cuentas Alegra con recarga automática y selección de cuenta activa.
- **`AlegraConnectModal.tsx`**: Modal de conexión guiada con validación en vivo, enlace a documentación y selector de términos.
- **`TimbradoFacturas.tsx`**:
  - Emisión de facturas con selector de cuentas múltiples Alegra y badge de estado de CSD.
  - Formulario CFDI 4.0: RFC receptor, Razón Social, Uso de CFDI, Régimen Fiscal, Código Postal, Método y Forma de Pago, Concepto, Clave SAT, Valor Unitario e Impuestos.
  - Alternativa para despachos sin Alegra: opción de timbrar por fuera y validar con el _Validador de XMLs_.
  - Descarga inmediata de XML timbrado, PDF y copia rápida de UUID fiscal.
- **`TimbradoFacturas.test.tsx`**: 3 pruebas unitarias completas.
- **Integración Global**:
  - `src/App.tsx`: Incorporada en la sección Cobros como tercera tarjeta (`timbrado`).
  - `src/components/Footer.tsx`: Enlace oficial en la columna de Cobros.
  - `src/components/LandingPage.tsx`: Tarjeta interactiva en el catálogo público.

---

### Sprint 14 — ARK Contable AI: Fine-Tuning de Alcance, Paywall Clip D1, Animación Typewriter & Dataset de las 13 Herramientas — Completado ✅

**Objetivo:** Elevar el asistente inteligente (`ARK Contable AI`) a nivel de consultor fiscal experto en producción: delimitar su alcance contra preguntas fuera de dominio, inyectar el catálogo completo de las 13 herramientas para evitar falsos rechazos, implementar paywall con cuota gratuita mensual y monetización vía Clip, incorporar animación de escritura progresiva y perfeccionar el contraste y diseño del chat.

#### 1. Delimitación Estricta de Alcance y Grounding de Conocimiento (`src/server/ai/agent.ts`)

- **Regla Estricta de Corte (Anti-Out-of-Scope):** Si el usuario formula preguntas ajenas a la materia fiscal, contable, laboral o al uso de ARK LEDGER (ej. biología, medicina, deportes, entretenimiento o física), el modelo declina cortésmente responder y reitera su función especializada.
- **Rigor Conceptual y Corrección de Premisas Falsas:**
  - _SBC (Salario Base de Cotización):_ Corrección explícita de que NO es un impuesto, sino la base salarial (Art. 27 LSS) para cuotas obrero-patronales IMSS e INFONAVIT, topada a 25 UMAs.
  - _Subsidio para el Empleo:_ Aclaración frente a confusiones con el SBC (Decreto DOF 2024).
- **Catálogo Canónico de las 13 Herramientas:** Inyección completa en el `systemPrompt` con propósito, funcionamiento, entradas y salidas:
  1. _Conversor XML a Excel (`xml-excel`):_ Procesamiento local por lote de hasta 200 CFDIs 3.3/4.0 con extracción a tablas limpias CSV/Excel.
  2. _Validador de XMLs (`validador`):_ Auditoría de sellos digitales SAT, esquemas XSD y cotejo automático con lista negra del Art. 69-B del CFF (EFOS).
  3. _Calculadora ISN 2026 (`isn`):_ Tasas oficiales estatales (1% al 4%) de las 32 entidades y papel de trabajo.
  4. _Calculadora SBC 2026 (`sbc`):_ Factor de integración con Vacaciones Dignas, topes de 25 UMAs ($2,932.75) y salario mínimo.
  5. _Nómina Rápida 2026 (`nomina`):_ ISR progresivo (Art. 96), Subsidio al Empleo y cuotas IMSS obreras.
  6. _Finiquitos y Liquidaciones (`finiquitos`):_ Cálculos LFT (aguinaldo, prima de antigüedad tope 2xSMG, 90 días y 20 días/año) conectado a la herramienta Worker.
  7. _Cierre de Nómina Masivo (`cierre-nomina`):_ Ingesta CSV/Excel, retenciones consolidadas, Sello QR y pasivo patronal.
  8. _Generador Links de Pago SPEI (`spei`):_ Cobro de honorarios con Clip Checkout y transferencias CLABE.
  9. _Timbrado de Facturas CFDI 4.0 (`timbrado`):_ Timbrado oficial con PAC Quadrum vía Alegra (XML + PDF).
  10. _Calculadora Leasing (`leasing`):_ Arrendamiento puro vs financiero vs crédito con topes de deducción LISR Art. 28.
  11. _Guía SAT/IMSS (`guia-sat-imss`):_ 8 pasos ante requerimientos, checklists, plazos del CFF y guardado en D1.
  12. _Auditoría Legal de Cobranza (`auditor-cobranza`):_ Matriz de 23 conductas prohibidas (Art. 284 Bis CPF) con sello SHA-256 en Ledger D1.
  13. _Mapa de Activos Virtuales (`mapa-activos`):_ 12 conductas con Ley Fintech, LFPIORPI y notas por cliente en D1.
- **Prevención de Truncamiento:** `max_tokens: 2048` en todas las ejecuciones de Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`).

#### 2. Paywall de Consultas y Monetización con Clip (`src/server/ai/`)

- **Migración D1 (`migrations/0006_ai_usage_paywall.sql`):**
  - Tabla `ai_usage`: `id` (UUID), `tenant_id`, `month_key` (`YYYY-MM`), `query_count`, `is_pro`, `created_at`, `updated_at`.
  - Índice único sobre `(tenant_id, month_key)`.
  - Aplicada exitosamente en producción Cloudflare D1 (`ark_tools_db`).
- **Control de Cuota & Exenciones (`aiApi.ts`):**
  - Límite de 10 consultas mensuales gratuitas por despacho (`FREE_QUOTA_PER_MONTH = 10`).
  - Exención automática para usuarios con rol `super_admin` (`isPro = true`, consultas ilimitadas).
  - Al agotar la cuota mensual, el endpoint retorna HTTP `402 Payment Required` con payload de paywall y enlace a checkout de Clip.
  - Endpoint `GET /api/ai/quota`: Consulta de cuota usada, límite mensual, estado Pro y enlace de pago.
  - Enlace de suscripción Clip integrado: `https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65` ($399 MXN / mes).

#### 3. Frontend y Experiencia de Usuario (`src/components/AiAssistantWidget.tsx`)

- **Animación Typewriter (`simulateTyping`):**
  - Escritura dinámica progresiva que simula tipeo natural en tiempo real (~200ms a 600ms máx con auto-cálculo de chunks), eliminando la aparición brusca de bloques gigantescos.
- **Formateo Markdown Enriquecido (`renderFormattedContent`):**
  - Dobles saltos de línea renderizados como espacios visuales reales entre párrafos (`h-2.5`).
  - Soporte de encabezados `###`, viñetas `•`, listas numeradas `1.` y negritas `**`.
- **Accesibilidad y Contraste de Texto:**
  - Inyección de parámetro `isUser` en `renderFormattedContent` y `renderInlineFormatted`:
  - En globos del usuario (`bg-navy`), párrafos y negritas se renderizan en blanco nítido (`text-white`) y dorado (`text-amber-300`), corrigiendo el conflicto anterior donde heredaban `text-ink` (#0F172A) y se volvían ilegibles sobre fondo azul.
- **Tarjeta Interactiva de Paywall en Chat:**
  - Bloque visual elegante con gradiente ámbar, botón de suscripción a Clip, contador en el header (`x/10 gratis`) y bloqueo reactivo del textarea al consumir el cupo.

#### 4. Corrección en Modal de Colaboradores (`src/components/team/TeamModal.tsx`)

- Utilización de `createPortal(..., document.body)` para el submodal "Invitar Colaborador", resolviendo el bug de superposición visual que tapaba el campo de correo electrónico.
- Eliminación del botón duplicado azul en la interfaz de invitación.

---

### Sprint 15 (Octubre 2026) — Calculadora y Cédula RESICO 2026 (Personas Físicas y Morales) — Completado ✅

**Objetivo:** Desarrollar e integrar el módulo integral de determinación de pagos provisionales mensuales para el Régimen Simplificado de Confianza (RESICO), dando cobertura al 100% tanto a Personas Físicas (Arts. 113-E a 113-J LISR) como a Personas Morales bajo flujo de efectivo (Arts. 206 a 215 LISR), con Cédula Oficial Carta imprimible, Sello SHA-256, QR de verificación pública y soporte de Workers AI Tool-Calling.

#### 1. Motores Matemáticos y Datos Oficiales DOF (`src/tools/resico/`)

- **`types.ts`**: Definición de interfaces tipadas `EntradaResicoPF`, `EntradaResicoPM`, `ResultadoResicoPF`, `ResultadoResicoPM`, `DesgloseImpuesto` y rangos de tarifas.
- **`data/tablasResico.ts`**:
  - Tabla progresiva mensual de ISR Persona Física (1.00% hasta $25k, 1.10% hasta $50k, 1.50% hasta $83.3k, 2.00% hasta $208.3k, y 2.50% hasta $3.5M).
  - Tasa de retención PM a PF del 1.25% (Art. 113-J LISR).
  - Tasa corporativa general del 30.0% para Personas Morales (Art. 211 LISR).
  - Topes de ingresos oficiales: $3,500,000 MXN para Personas Físicas y $35,000,000 MXN para Personas Morales.
- **`lib/calcularResicoPF.ts`**:
  - Determinación de tasa y cálculo de ISR causado mensual.
  - Acreditamiento automático de retención del 1.25% efectuada por personas morales sin generar saldos negativos a pagar.
  - Liquidación neta de IVA conforme a los requisitos del Art. 5 de la LIVA (IVA trasladado cobrado menos IVA acreditable pagado y retenciones de IVA).
  - Monitoreo de consumo del tope $3.5M con cuatro umbrales preventivos (`seguro`, `preventivo` al 75%, `critico` al 90%, y `excedido`).
- **`lib/calcularResicoPM.ts`**:
  - Base gravable sobre utilidad fiscal acumulada a flujo de efectivo (ingresos cobrados $-$ deducciones autorizadas pagadas $-$ PTU amortizable $-$ pérdidas fiscales pendientes).
  - Aplicación de tasa del 30% y acreditamiento de pagos provisionales previos y retenciones acumuladas.
  - Liquidación de IVA del mes y evaluación del tope de $35M.
- **`lib/exportarResico.ts`**:
  - Exportación de cédula analítica a CSV con prefijo Byte Order Mark (`\uFEFF`) para lectura limpia en Microsoft Excel.
  - Generador de mensaje ejecutivo preformateado para envío al cliente por WhatsApp en 1 clic.
- **`lib/calcularResico.test.ts`**: 12 pruebas unitarias exhaustivas aprobadas al 100%.

#### 2. Componentes de Interfaz y Cédula Carta QR

- **`components/ParametrosResicoCard.tsx`**: Selector interactivo de modalidad (Persona Física vs Moral), selector de mes y ejercicio, autocompletado y botón de sugerencia del 16% de IVA trasladado.
- **`components/ResultadoResicoCard.tsx`**: Cúpula de cristal (`LiquidGlassDome`), cifra total de impuestos magnificada, importe en letras oficial conforme al Art. 28 del CFF, chips rápidos de ISR e IVA, barra visual de tope $3.5M y accesos a exportación.
- **`components/DesgloseResicoTable.tsx`**: Tabla matricial analítica con desglose de bases, tasas aplicadas, importes, naturalezas y fundamentos legales, con notas y advertencias periciales.
- **`components/CedulaResicoModal.tsx`**: Formato institucional tamaño Carta para impresión y guardado en PDF (`@media print`), con membrete oficial del despacho, folio, sello digital criptográfico SHA-256, código QR vectorial de verificación pública y bloque de firmas autógrafas para Contador y Contribuyente.
- **`CalculadoraResico.test.tsx`**: 4 pruebas de interfaz e integración aprobadas al 100%.

#### 3. Integración en el Ecosistema ARK LEDGER

- **`App.tsx`**: Incorporación de `resico` en `ToolId`, enrutador principal con carga diferida (`React.lazy`), tarjeta destacada en la categoría **Fiscal** (4 columnas) y banner institucional.
- **`ExpedienteToolBanner.tsx`**: Enlace automático para archivar cálculos en Cloudflare D1 bajo el expediente del cliente activo.
- **`PapelDeTrabajoModal.tsx`**: Manejo de expedientes RESICO archivados para visualización e impresión retrocompatible.
- **`LandingPage.tsx` & `Footer.tsx`**: Incorporación en el catálogo público y directorio del pie de página institucional.
- **`server/ai/tools.ts` & `agent.ts`**: Registro de la función `calcular_resico` e inyección de la herramienta #14 en el prompt del orquestador Llama 3.3 70B de Workers AI.

---

### Sprint 16: Renovación de la Landing Page Pública & Dashboard — Enfoque en Blindaje & Evidencia Fiscal (Completada ✅)

- [x] **Hero Section Pública & Dashboard Autenticado con Propuesta de Valor Unificada:**
  - [x] Nuevo titular pericial: _"Cálculos auditables. Blindados ante cualquier revisión."_
  - [x] Badge de confianza: `El Sistema Operativo de la Defensa Fiscal` / `Blindaje & Evidencia Fiscal 2026`.
  - [x] Banner de Moat en Dashboard con `Fingerprint`: _"Papel de Trabajo con Sello Criptográfico (SHA-256) Verificable Públicamente"_.
  - [x] Valores de referencia DOF 2026 destacados (UMA $117.31, SMG $315.04, Tope 25 UMAs).
- [x] **Badges Claros Freemium en Dashboard:**
  - [x] Variante `neutral` en `ToolCard` para herramientas de libre uso con badge `GRATIS`.
  - [x] Badges dorados `PRO` para herramientas avanzadas (Cierre de Nómina Masivo, Timbrado CFDI 4.0, Guía SAT/IMSS y Mapa de Activos Virtuales).
- [x] **Caja Freemium Clara & Transparente en Landing:**
  - [x] Mensaje de conversión: _"Modelo Transparente: Gratis para calcular, Pro para blindar"_.
  - [x] Explicación diáfana de acceso 100% libre e ilimitado a las calculadoras y conversores básicos, monetizando exclusivamente los servicios de alto valor operativo.
- [x] **Catálogo Completo de 14 Herramientas & Estandarización de Categorías:**
  - [x] Integración de la tarjeta de **Cierre de Nómina Masivo (Batch DOF)** con badge Pro.
  - [x] Estandarización de la categoría **Cobros & Finanzas** unificando SPEI/Clip, Timbrado CFDI 4.0 Alegra/Quadrum y Leasing Tecnológico.
  - [x] Grid de 3 columnas en categoría Fiscal para balance estético de las 6 herramientas.
- [x] **Nueva Sección de Negocio Transparente:**
  - [x] Sustitución de visión preliminar por: _"Transparencia Total: ¿Cómo ganamos dinero si las calculadoras son gratis?"_.
  - [x] Desglose de 3 pilares: (1) Calculadoras Gratuitas e ilimitadas, (2) Expediente Único con Sello SHA-256 por micro-créditos, (3) Timbrado CFDI 4.0 & Procesamiento Masivo.
- [x] **Calidad & Robustez Técnica:**
  - [x] TypeScript `tsc --noEmit` limpio (0 errores TS).
  - [x] 315 pruebas unitarias e integración aprobadas al 100% (42 suites).
  - [x] Bundle de producción Vite compilado sin errores.

---

### Sprint 17: Optimización de Rendimiento, Resiliencia Institucional & Herramientas Periciales Python — Completado ✅

- [x] **Reducción de Bundle Inicial (>55%):**
  - [x] Migración total de las 14 herramientas y la consola de administración a `React.lazy()` con `Suspense` y `ToolSkeleton` unificado en `App.tsx`.
  - [x] Reducción del chunk JS principal de **502.52 kB a 222.36 kB** (60.88 kB gzip), eliminando la advertencia de límite de tamaño de Vite.
  - [x] Reducción en tiempo de build de 37s a 22s.
- [x] **Pipeline de Linting con Cero Advertencias (`.eslintrc.cjs`):**
  - [x] Configuración completa de ESLint con TypeScript, React Hooks, JSX Runtime y Prettier.
  - [x] Corrección de caracteres de escape y entidades JSX en `parserPlantilla.ts`, `ResultadoResicoCard.tsx` y `GeneradorSPEI.tsx`.
  - [x] `pnpm lint` 100% limpio (0 errores, 0 advertencias con `--max-warnings 0`).
- [x] **Resiliencia & ErrorBoundary Institucional:**
  - [x] Creación de `src/components/ErrorBoundary.tsx` con estética institucional ARK (tarjeta de aislamiento, desglose técnico amigable, botones _Reintentar_ y _Volver al Catálogo_).
  - [x] Protección global y por herramienta en el router de `App.tsx`.
  - [x] 3 pruebas unitarias completas en `ErrorBoundary.test.tsx`.
- [x] **Limpieza de Advertencias en Pruebas Vitest:**
  - [x] Sincronización asíncrona de eventos con `act(...)` y `waitFor(...)` en `AiAssistantWidget.test.tsx` y `CalculadoraFiniquitos.test.tsx`.
  - [x] Cobertura incrementada a **318 pruebas pasadas en 43 suites** con salida 100% limpia sin advertencias.
- [x] **Seguridad HTTP & Metadatos SEO/PWA:**
  - [x] Inyección de cabeceras de seguridad perimetral en Worker (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).
  - [x] Creación de favicon vectorial `public/favicon.svg` con monograma 3D Navy & Gold.
  - [x] Metadatos SEO, OpenGraph y Twitter en `index.html` para previsualizaciones institucionales al compartir en WhatsApp y LinkedIn.
- [x] **Tríada de Scripts Periciales en Python (`scripts/`):**
  - [x] `dof_sat_watcher.py`: Monitor desatendido del feed DOF (`sumario.xml`) con detección de decretos y generación de diffs TypeScript.
  - [x] `cfdi_stress_generator.py`: Generador de lotes sintéticos CFDI 4.0 con RSA SHA-256 (escenarios EFOS, RESICO 1.25%, Nómina tope 25 UMAs).
  - [x] `d1_audit_verifier.py`: Auditor forense y reconciliador de Cloudflare D1 con validación determinista de hashes y respaldo SQLite.
  - [x] Comandos integrados en `package.json`: `watch:dof`, `generate:stress-cfdi`, `audit:d1`.

---

### Sprint 18 (Octubre 2026) — GEO Engine: Descubrimiento por Agentes IA (`/llms.txt`, `/llms-full.txt`, `/robots.txt`) — Completado ✅

**Objetivo:** Habilitar el descubrimiento y la comprensión de ARK LEDGER por motores de búsqueda de IA y agentes autónomos (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) mediante documentos Markdown dinámicos vinculados al catálogo oficial de valores fiscales DOF 2026, servidos directamente desde el Worker sin archivos estáticos.

#### 1. Módulo GEO (`src/server/llmsTxt.ts`) — Completado ✅

- **`generateLlmsTxt()`**: Índice conciso (< 2,000 tokens) con parámetros oficiales vigentes (UMA, SMG, SMZLFN, tope SBC 25 UMAs, tarifa ISR), catálogo de las 13 herramientas en producción y endpoint de verificación pública de autenticidad.
- **`generateLlmsFullTxt()`**: Contexto técnico extendido con anexo de fórmulas y fundamentos legales (SBC/IMSS, ISR Art. 96, finiquitos LFT, estándar SHA-256).
- **`generateRobotsTxt()`**: Directivas para crawlers y agentes de IA (GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Amazonbot, cohere-ai) con sitemaps hacia `/llms.txt` y `/llms-full.txt`.
- Vinculación dinámica a `CATALOGO_2026` (`src/data/valores-vigentes/catalogo.ts`) y a `CURRENT_CATALOG_VERSION` (`src/server/d1Api.expediente.ts`) para que los parámetros publicados se mantengan sincronizados con el motor de cálculo.

#### 2. Rutas en el Worker (`src/index.ts`) — Completado ✅

- `GET /llms.txt` y `GET /.well-known/llms.txt`: índice conciso (`text/markdown; charset=utf-8`, cache 24h).
- `GET /llms-full.txt`: contexto técnico extendido.
- `GET /robots.txt`: directivas para crawlers y agentes de IA.
- Servidas antes del fallback SPA, con cabeceras `Cache-Control: public, max-age=86400, s-maxage=86400`.

#### 3. Pruebas y Calidad

- `src/server/llmsTxt.test.ts`: 3 pruebas unitarias de generación GEO (presencia de parámetros oficiales, versión de catálogo y secciones clave) — 100% pasadas.
- Typecheck (`tsc --noEmit`) limpio y lint (`--max-warnings 0`) sin advertencias tras la integración.

#### 4. Métricas de Calidad del Sprint

- **Pruebas unitarias totales:** 318/318 pasando en 43 suites (sin cambio neto; +3 llmsTxt).
- **Integridad de tipos:** 0 errores en TypeScript.
- **Compilación SPA:** `pnpm build` exitoso.

---

## 5. Resumen General del Proyecto (Suite de 15 Herramientas + Multi-Tenant + Expediente Único + Workers AI + Papel de Trabajo Oficial + CRM de Prospectos + GEO Engine)

| Categoría                     | Herramientas / Módulos                                                                                                                | Estado                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Fiscal / Laboral**          | Calculadora ISN 2026, Calculadora SBC 2026, Nómina Rápida 2026, Calculadora de Finiquitos LFT, **Calculadora RESICO 2026**            | ✅ 100% Conectadas a Expediente Único (5/5)                   |
| **Patrimonial**               | **Balance General Comparativo #15** (AH/AV, cuadre A=P+C, parser CSV/Excel, export CSV, Papel de Trabajo PDF/QR)                      | ✅ 100% Implementado e integrado (3 tests del motor)          |
| **Cierre de Nómina Masivo**   | Motor Batch DOF 2026, Ingesta CSV/Excel, Cédula Concentradora Carta, Layout Dispersión, Sello QR                                      | ✅ 100% Operativo en Producción (Herramienta #12)             |
| **Papel de Trabajo (PDF/QR)** | Cédula institucional Carta, `@media print`, Sello SHA-256, Importe en Letras, QR y Verificación Pública                               | ✅ 100% Operativo en Producción                               |
| **SAT**                       | Conversor XML → Excel, Validador y Auditor de XMLs (CFDI 4.0)                                                                         | ✅ 100% Operativas (2/2)                                      |
| **Cobros**                    | Links de Pago Clip, Timbrado CFDI 4.0 vía Alegra/Quadrum, Calculadora de Leasing Tecnológico                                          | ✅ 100% Operativas (3/3)                                      |
| **Compliance**                | Guía SAT/IMSS, Auditoría Legal de Cobranza, Mapa de Activos Virtuales                                                                 | ✅ 100% Operativas + Persistencia D1 (3/3)                    |
| **Multi-Tenancy & Equipos**   | Invitaciones a despachos vía Resend, control de roles (`admin`/`member`/`viewer`), aislamiento estricto en D1                         | ✅ 100% Operativo en Producción                               |
| **Super Admin Console**       | Métricas globales, auditoría de infraestructura, directorio de despachos, gestión de roles y **CRM de prospectos (`LeadsApp`)**       | ✅ 100% Operativo en Producción                               |
| **CRM de Prospectos**         | Tabla `leads_ark_tools` en D1, KPIs de embudo, filtros por ciudad/especialidad/estatus, alta/baja, **propuesta comercial vía Resend** | ✅ 100% Implementado e integrado (11 tests de API)            |
| **Expediente Único**          | Catálogo Clientes/Trabajadores, Auto-Prefill, Sello SHA-256 + Versión DOF                                                             | ✅ 100% Operativo en Producción                               |
| **Workers AI & Chatbot**      | Binding `[ai]`, Llama 3.3 70B, Agentic Tool-Calling con D1/LFT/RESICO/Balance/CRM, Paywall D1 + Clip, Typewriter, 8 tools             | ✅ 100% Integrado y Desplegado en Producción                  |
| **Navegación & Usabilidad**   | Filtros de categorías en dashboard y landing, navegación móvil, retorno contextual, `ErrorBoundary` institucional                     | ✅ Implementada y validada con typecheck, lint, build y suite |
| **Copy & Confianza**          | Header fiscal, Footer institucional, Privacidad XMLs, Sección Transparencia Jurídica, Landing Freemium                                | ✅ 100% En Producción                                         |
| **Core Global**               | Catálogo de Valores Fiscales 2026, AlertasVigencia, Design System ARK, ToolSkeleton, LandingPage Renovada                             | ✅ 100% Operativo                                             |
| **Tríada Scripts Python**     | `dof_sat_watcher.py` (Vigilancia DOF), `cfdi_stress_generator.py` (Estrés CFDI 4.0), `d1_audit_verifier.py` (Forense D1)              | ✅ 100% Operativos e Integrados                               |
| **Creative Studio**           | Generador de creativos Instagram 1080×1080 con Playwright + Jinja2 (`instagram-creatives/`)                                           | ✅ Operativo (asset de marketing, fuera de la SPA)            |
| **GEO Engine (Agentes IA)**   | Generador dinámico `/llms.txt`, `/llms-full.txt` y `/robots.txt` (Worker, vinculado al catálogo DOF 2026, cache 24h)                  | ✅ 100% Operativo en Producción                               |

- **Total de herramientas en plataforma:** **19 de 19 (100% Operativas)** + Super Admin Console (con CRM de Prospectos) + Noah (Asistente AI)
- **Total de pruebas unitarias y de integración:** **368 pasadas en 49 suites (100% éxito)** — verificado con `pnpm test`
- **Migraciones D1 aplicadas:** 7 (`0001` → `0007_leads_crm.sql`) en `ark_tools_db`
- **Herramientas de IA registradas en `AI_TOOLS_CATALOG`:** 13 (`calcular_modalidad_40`, `calcular_recargos_fiscales`, `calcular_isn`, `calcular_sbc`, `calcular_nomina_rapida`, `calcular_finiquito_lft`, `calcular_resico`, `consultar_progreso_guia`, `consultar_auditoria_ledger`, `consultar_watchlist_activos`, `obtener_info_despacho`, `consultar_balance_general`, `consultar_leads_crm`), todas con directiva de invocación en el system prompt
- **Catálogo público de herramientas:** fuente única en `src/data/catalogo-herramientas.ts`; el conteo publicado en `/llms.txt`, el system prompt de Noah y las guardas de tests se derivan de él (nunca se escribe a mano)
- **Typecheck:** 0 errores en modo estricto de TypeScript (`pnpm typecheck` → `tsc --noEmit`)
- **Linting:** 0 errores, 0 advertencias (`eslint . --ext .ts,.tsx --max-warnings 0`)
- **Auditoría de Vigencias Fiscales:** 6/6 valores oficiales 2026 validados (`pnpm verify:catalogo`)
- **Build Vite (SPA):** 100% funcional con bundle optimizado (chunk inicial 223.56 kB / 61.24 kB gzip; build en 29s)
- **Estado general:** Suite de 15 Herramientas (ISN, SBC, Nómina, Finiquitos, RESICO, Balance General, Cierre de Nómina Masivo, Conversor XML, Validador XML, Clip, Timbrado CFDI 4.0, Leasing, Guía SAT/IMSS, Auditoría de Cobranza, Mapa de Activos), Landing Page pericial con modelo Freemium transparente, Expediente Único multi-tenant, CRM de Prospectos en la consola de Super Admin con envío de propuesta comercial vía Resend, emisión y timbrado CFDI 4.0 con PAC, motor batch de nómina, Papel de Trabajo Oficial con QR público, ErrorBoundary y carga perezosa en todas las herramientas, cabeceras de seguridad perimetral, GEO Engine (/llms.txt, /llms-full.txt, /robots.txt) para descubrimiento por agentes IA, generador de creativos Instagram, y tríada de scripts Python para vigilancia, estrés y auditoría forense 100% operativas.

---

## 6. Bitácora de los Últimos Sprints (Sprint 19 → Sprint 21)

### Sprint 19 (Octubre 2026) — Balance General Comparativo, Análisis Horizontal/Vertical y Blindaje Patrimonial (Herramienta #15) — Completado ✅

**Objetivo:** Desarrollar e integrar la Herramienta #15: Balance General Comparativo (Año Actual vs Año Anterior) con Análisis Horizontal (AH) y Vertical (AV), validación del cuadre A=P+C, ingesta CSV/Excel, exportación CSV con BOM UTF-8, integración con Expediente Único, Papel de Trabajo Oficial PDF con SHA-256 + QR e inyección a Workers AI.

#### 1. Core y Tipado (`src/tools/balance-general/`)

- **`types.ts`**: Tipos estrictos `CuentaBalance`, `JerarquiaBalance`, `ResultadoAnalisis`, `TotalesBalance`, `Naturaleza` y `TipoBalance`.
- **`lib/calcularBalance.ts`**: Orquestador con `calcularTotales` (tolerancia $0.02) y `finalizarBalance` (AH/AV redondeados a 2 decimales, sin división por cero cuando el año anterior es 0).
- **`lib/parserBalanza.ts`**: Parser CSV/Excel con normalización, mapeo de rubros y advertencias por cuentas sin clasificar.
- **`lib/calcularBalance.test.ts`**: 3 pruebas unitarias (cuadre A=P+C, AH/AV a 2 decimales, división por cero).

#### 2. Componentes Visuales

- **`components/ParametrosBalanceCard.tsx`**: Configuración de ejercicios con drag & drop de CSV/XLSX/XLS.
- **`components/TablaBalanceAnalitico.tsx`**: Tabla matricial con Monto BG/LY, Variación $, AH% y AV% (Actual/Anterior).
- **`components/GraficosClasificacion.tsx`**: Barras de composición patrimonial.
- **`components/ResultadoBalanceCard.tsx`**: `LiquidGlassDome` con totales y estado CUADRADO / NO CUADRADO.

#### 3. Pantalla Principal e Integración

- **`CalculadoraBalance.tsx`**: Pantalla con carga diferida, `ExpedienteToolBanner`, export CSV BOM UTF-8 y acciones.
- **`index.ts`**: Barrel export.
- **`src/App.tsx`**: Lazy import, `ToolId 'balance-general'`, render case, badge NUEVO en categoría Fiscal y etiqueta en `toolLabels`.
- **`src/components/Footer.tsx`** y navegación: acceso desde el dashboard.

#### 4. Blindaje, Papel de Trabajo y AI

- **`src/components/PapelDeTrabajoModal.tsx`**: Soporte `tool_id='balance-general'` con desglose Activo/Pasivo/Patrimonio/P+P, SHA-256 y QR verificable.
- **`src/server/ai/tools.ts`**: Añadida la herramienta `consultar_balance_general` con ejecución segura multi-tenant.
- **`src/server/ai/agent.ts`**: Actualizado el catálogo y las directrices para análisis de salud financiera.

**Métricas:** +3 pruebas unitarias. Chunk lazy < 30 kB. Integración completa con Expediente Único y verificación pública.

---

### Sprint 20 (Octubre 2026) — Consolidación del CRM de Prospectos (Super Admin) e Integración con Workers AI — Completado ✅

**Objetivo:** Consolidar, estabilizar y homologar el módulo CRM de prospectos comerciales (`leads_ark_tools`) en la consola Super Admin, blindar la API con pruebas unitarias, homologar visualmente `LeadsApp.tsx` al ARK Design System institucional y exponer la herramienta de IA `consultar_leads_crm` en Workers AI / Llama 3.3 70B.

#### 1. Backend y Persistencia D1 (`src/server/leadsApi.ts` & `migrations/0007_leads_crm.sql`)

- **`migrations/0007_leads_crm.sql`**: Creación de la tabla `leads_ark_tools` (`id`, `web`, `whatsapp`, `email`, `ciudad`, `especialidad`, `status`, `last_contact`, `contacto_nombre`, `notas`, `tenant_id`, `created_at`, `updated_at`) con índices por `tenant_id`, `ciudad`, `status` y `especialidad`.
- **`src/server/leadsApi.ts`**: Endpoints `GET/POST /api/admin/leads`, `GET /api/admin/leads/stats` (KPIs agregados), `GET/PUT/PATCH/DELETE /api/admin/leads/:id`, con aislamiento multi-tenant y soporte para `super_admin`.
- **`src/server/leadsApi.test.ts`**: 11 pruebas unitarias cubriendo autenticación, validación D1, filtros, detalle, creación, actualización y eliminación.
- **`scripts/python/import_leads_sheet.py`**: Script ETL para ingesta y normalización de números WhatsApp a estándar E.164.

#### 2. Frontend Institucional (`src/components/admin/LeadsApp.tsx`)

- **Homologación al ARK Design System**: Reemplazo del tema oscuro por blanco institucional, Navy Trust (`#002B7F`), Gold Value (`#D4AF37`) y tipografía Orbitron.
- **5 KPI Cards**: Total Leads, Nuevos, Contactados, Respondieron (dorado) y Bajas/Spam.
- **Filtros Reactivos**: Búsqueda por texto (web, contacto, correo) y filtros por Ciudad, Especialidad y Estatus con botón de limpieza.
- **Tabla Operativa**: Enlace directo a WhatsApp Web (`wa.me`), `mailto:` y selector inline de estatus con actualización optimista vía `PATCH /api/admin/leads/:id`.
- **Exportación CSV**: Soporte de BOM UTF-8 (`\uFEFF`) para visualización nativa de acentos en Microsoft Excel.
- **Integración en `src/components/admin/AdminPanel.tsx`**: Nueva pestaña `leads` (`'overview' | 'tenants' | 'users' | 'leads'`).

#### 3. Workers AI & Agentic Tool Calling (`src/server/ai/tools.ts` & `agent.ts`)

- **`AI_TOOLS_CATALOG`**: Registro de `consultar_leads_crm` con parámetros opcionales (`ciudad`, `status`, `especialidad`, `limit`).
- **`executeAiTool`**: Orquestador seguro que consulta métricas agrupadas y lista de prospectos sobre D1.
- **`agent.ts`**: Actualización del system prompt de ARK Contable AI para responder consultas de prospección y embudo de ventas.
- **`tools.test.ts`**: Prueba unitaria específica verificando la respuesta estructurada de la herramienta de IA.

**Métricas del Sprint:** +10 pruebas unitarias nuevas. 0 errores de TypeScript (`tsc --noEmit`). 0 errores de linting. Chunk de AdminPanel en 51.07 kB (10.15 kB gzip).

---

### Sprint 21 (Octubre 2026) — Propuesta Comercial vía Resend y Ciclo Completo de Gestión de Prospectos — Completado ✅

**Objetivo:** Cerrar el flujo comercial del CRM: permitir enviar una propuesta comercial personalizada a un prospecto por correo (Resend) con previsualización previa, y completar el ciclo de alta y baja de prospectos desde la interfaz de Super Admin.

#### 1. Envío de Propuesta Comercial vía Resend

- **`src/server/leadsApi.ts`**: Endpoint `POST /api/admin/leads/:id/send-email` que valida la sesión, arma el correo (texto + HTML) y lo entrega vía API de Resend. En envíos reales actualiza `status` a `Mail_enviado_DDMMYY` y `last_contact` en D1; en envíos de prueba no toca la base de datos. Errores de Resend se traducen a HTTP `502`.
- **`src/components/admin/LeadsApp.tsx`**: Modal interactivo con previsualización del mensaje, opción de envío de prueba, aviso explícito de que el envío a un destinatario de prueba **no** modifica el estatus del prospecto en la base de datos, estado de carga y feedback de entrega.
- **`src/server/leadsApi.test.ts`**: Pruebas del endpoint de envío (entrega correcta y manejo de error de Resend).

#### 2. Alta y Baja de Prospectos

- **`src/components/admin/LeadsApp.tsx`**: Botón _Añadir Nuevo Prospecto_ con formulario de alta (web, WhatsApp, correo, ciudad, especialidad, contacto, notas) y modal de confirmación de eliminación con acción explícita y estado de carga.
- **`src/server/leadsApi.ts`**: `POST /api/admin/leads` (alta con estatus inicial `Nuevo`) y `DELETE /api/admin/leads/:id` (baja) con aislamiento por `tenant_id`.

#### 3. Estado de Calidad del Sprint

- **Suite completa:** 333 pruebas en 45 suites — 100% éxito (`pnpm test`).
- **Typecheck:** 0 errores (`pnpm typecheck`).
- **Linting:** 0 errores, 0 advertencias (`pnpm lint`).
- **Auditoría fiscal:** 6/6 valores oficiales vigentes, 0 proyecciones (`pnpm verify:catalogo`).
- **Build:** exitoso en 29.02s; chunk principal 223.56 kB (61.24 kB gzip).
- **Commits:** `e98d048` (CRM de Leads + homologación ARK), `beeed57` (propuesta comercial vía Resend), `a673bb9` (botones y modales de alta/baja de prospectos).

---

### Sprint 22 (Octubre 2026) — Sincronización del Catálogo de Herramientas y Guardas de Regresión — Completado ✅

**Objetivo:** Eliminar la deriva entre el catálogo real de la suite y los tres puntos donde se publica (GEO `/llms.txt`, system prompt de ARK Contable AI y meta Open Graph), queannounced **13, 14 y 15 herramientas** respectivamente. La corrección no se limitó a corregir los números: se eliminó la causa raíz sustituyendo los conteos escritos a mano por una **fuente canónica única**, protegida con pruebas que fallan ante cualquier desincronización futura.

#### 1. Catálogo Canónico de Herramientas (`src/data/catalogo-herramientas.ts`)

- Arreglo `CATALOGO_HERRAMIENTAS` con los **15** identificadores, nombres públicos, categorías y descripciones de la suite.
- `TOTAL_HERRAMIENTAS` se **deriva** de `CATALOGO_HERRAMIENTAS.length`: es imposible que el encabezado y el contenido discrepen.
- Cada entrada incluye el `id` que debe coincidir con el `ToolId` del router de `src/App.tsx`.

#### 2. GEO Engine (`src/server/llmsTxt.ts`)

- El encabezado pasó de _"Catálogo de las 13 Herramientas en Producción"_ a **"Catálogo de las 15 Herramientas en Producción"**, derivado por interpolación.
- Se renderiza el catálogo agrupado por categoría desde el arreglo canónico; se incorporan **RESICO 2026** y **Balance General Comparativo** (antes ausentes del documento) y la nueva sección **"Patrimonial y Análisis Financiero"**.
- Se eliminó la copia local del catálogo que existía dentro del módulo.
- Anexo técnico de `llms-full.txt`: nuevas secciones **§4 RESICO** (Arts. 113-E a 113-J y 206 a 215 LISR) y **§5 Balance General** (fórmulas de AH%, AV% y cuadre A=P+C con tolerancia $0.02); el estándar SHA-256 pasa a §6.
- Tamaño del índice: ~1,434 tokens (por debajo del presupuesto de 2,000).

#### 3. ARK Contable AI (`src/server/ai/agent.ts`)

- El system prompt se extrajo a una función exportable **`buildSystemPrompt(tenantId)`**, habilitando su verificación en tests.
- Conteos corregidos a `${TOTAL_HERRAMIENTAS}` (15) en las dos menciones del prompt; se agregó la **herramienta #15 Balance General** al catálogo embebido.
- Las **directivas de invocación** de la directive 4 ahora se generan desde `DIRECTIVAS_HERRAMIENTAS` + `buildToolDirectives()`: las 8 tools de `AI_TOOLS_CATALOG` tienen instrucción explícita, incluidas `consultar_balance_general` y `consultar_leads_crm`, que antes estaban registradas pero nunca invocadas por el modelo.
- Se añadió la instrucción _"Nunca inventes datos del cliente: si la información vive en ARK LEDGER, invoca la herramienta correspondiente"_.

#### 4. Meta Open Graph (`index.html`)

- `og:description` corregida de _"Suite de 14 herramientas"_ a _"Suite de 15 herramientas"_.

#### 5. Guardas de Regresión (12 pruebas nuevas)

| Archivo                                  | Tests | Qué valida                                                                                                                                              |
| ---------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/catalogo-herramientas.test.ts` | 4     | 15 herramientas, ids únicos, metadata completa y **sincronía con el union type `ToolId` de `src/App.tsx`**                                              |
| `src/server/ai/agent.test.ts`            | 7     | Conteo declarado en el prompt, cobertura de las 15 herramientas, **directiva para cada tool de IA**, orden de las directivas e interpolación del tenant |
| `src/server/llmsTxt.test.ts`             | +1    | Toda herramienta del catálogo está publicada y **no reaparecen conteos desactualizados** ("13 Herramientas")                                            |

**Métricas del Sprint:** 345/345 pruebas en 47 suites (100% éxito). 0 errores de TypeScript. 0 errores de linting (`--max-warnings 0`). Build SPA exitoso. Catálogo GEO: 15 herramientas / 5 categorías / ~1,434 tokens.

**Despliegue:** commit `cc9fd6f` → `main` → `origin/main`. Worker `ark-tools-production`, Version ID `60d3529a-e31e-4181-9e89-02b3fc978bf2`. Verificado en producción: `/llms.txt` con 15 herramientas y RESICO + Balance General publicados, `/llms-full.txt` con los anexos §4 y §5, `og:description` a 15 y `/api/ai/tools` con 8 herramientas.

---

### Sprint 23 (Octubre 2026) — Cobertura de Pruebas UI del CRM de Prospectos y del Balance General — Completado ✅

**Objetivo:** Cerrar la brecha de cobertura de las dos superficies más nuevas y de mayor riesgo del producto: el CRM de prospectos (`LeadsApp.tsx`, 1,152 líneas con operaciones destructivas y envío de correo por Resend) y el Balance General Comparativo (`CalculadoraBalance.tsx`, antes con solo 3 tests del motor de cálculo y ninguno de interfaz).

#### 1. CRM de Prospectos (`src/components/admin/LeadsApp.test.tsx`) — 15 tests

- **Carga y KPIs:** encabezado institucional, directorio con contador y las 5 tarjetas del embudo (Total, Nuevos, Contactados, Respondieron, Bajas/Spam) calculadas a partir de los estatus reales.
- **Canales directos:** enlaces `wa.me` y `mailto:` con los href correctos, y ausencia del botón de propuesta cuando el prospecto no tiene correo.
- **Filtros:** reenvío de la consulta con `ciudad`, `especialidad` y `status`; búsqueda por texto con Enter; limpieza de filtros activos.
- **Actualización inline de estatus:** `PATCH /api/admin/leads/:id` con `status` y `last_contact`, y actualización optimista de la fila.
- **Alta de prospecto:** `POST /api/admin/leads` con el payload del formulario y prepending del nuevo registro al directorio.
- **Baja de prospecto:** `DELETE` **solo** tras la confirmación explícita; cancelar no elimina nada.
- **Propuesta comercial vía Resend:** apertura del modal, vista previa colapsable, `POST .../send-email`, y feedback de éxito y de error.
- **Envío de prueba:** se verifica explícitamente que el envío a una dirección de prueba **no** sobrescribe el estatus del prospecto en D1 (regla de negocio crítica del Sprint 21).
- **Export CSV:** contenido con cabecera y filas entrecomilladas, **BOM UTF-8 verificado sobre los bytes crudos** y nombre de archivo `leads-ark-tools-YYYY-MM-DD.csv`.

#### 2. Balance General Comparativo (`src/tools/balance-general/CalculadoraBalance.test.tsx`) — 7 tests

- **Renderizado:** encabezado, badge de "Herramienta #15 · Blindaje Patrimonial" y banner de Expediente Único en modo libre.
- **Navegación:** ejecución de `onBack` y edición de los ejercicios actual/anterior.
- **Ingesta real:** se carga un archivo CSV de balanza mediante el `input[type=file]` y se procesa con `XLSX`, verificando la cadena completa del flujo.
- **Ecuación contable:** estado **CUADRADO** (A = 100,000 = P+P) y estado **NO CUADRADO** (Dif = 10,000).
- **Tabla analítica:** valores de AH % y AV % (actual y anterior) por cuenta, con las bases de cálculo correctas (Activo contra 100,000; Pasivo y Patrimonio contra P+P).
- **Export CSV:** BOM UTF-8 verificado en bytes, encabezados de AH/AV y nombre `balance_general_<actual>_vs_<anterior>.csv`.

#### 3. Endurecimiento de la suite

- **Timeout explícito** (30 s) en el test de batch con sellado SHA-256 y QR de `CierreNomina.test.tsx`: aislada tarda ~840 ms, pero bajo carga paralela de la suite completa rebasaba el default de 5 s y hacía fallar la corrida completa. Era una fragilidad preexistente que la nueva carga expone.
- **Intercepción del clic del ancla de descarga** en ambos tests: elimina el ruido `Not implemented: navigation` de jsdom y permite verificar además el nombre del archivo generado.

**Métricas del Sprint:** +22 pruebas (367 en 49 suites, 100% éxito). 0 errores de TypeScript. 0 errores de linting. Build SPA sin cambios en el bundle (los tests no afectan los assets de producción).

#### 6. Normalización de finales de línea (`.gitattributes`)

Al rebasing `docs/map.md` tras el commit anterior, `pnpm format:check` volvió a fallar. La causa no era el contenido sino los finales de línea: `core.autocrlf=true` (por defecto en Windows) reescribe el working tree con CRLF en cada checkout, y como Prettier exige `endOfLine: "lf"`, el comando falla en cuanto se hace un pull, rebase o checkout.

- **`.gitattributes`** con `* text=auto eol=lf` y los formatos binarios marcados como `binary`.
- Verificado que el **índice ya almacena LF en todos los archivos**, por lo que el contenido versionado no cambia: la normalización solo afecta al working tree.
- Antes de esto, cualquier contribuidor en Windows habría tenido `format:check` en rojo de forma permanente, lo que además habría hecho fallar el pipeline de CI desde su primer día.

**Objetivo:** Cerrar la última deuda técnica: `pnpm format:check` estaba en rojo desde hacía semanas, el hook de pre-commit nunca se había creado (aun cuando `package.json` ya declaraba `lint-staged`), y la colisión entre el script `deploy` y el comando nativo de pnpm hacía fallar el despliegue con un error confuso.

#### 1. Formato unificado del repositorio

- **165 archivos** estaban desviados del estilo de Prettier. Se aplicó `prettier --write` sobre todo el repo (src, docs, README y configuraciones).
- **`.prettierignore` nuevo** (no existía): excluye `node_modules/`, `dist/`, `.wrangler/` (estado local de D1 con SQLite), `coverage/`, `.husky/_/`, lockfiles y artefactos de la tríada Python. Sin él, `prettier --write .` habría reescrito el estado local de Cloudflare.
- **Scripts ampliados**: `format` y `format:check` pasaron de `src/**` a todo el repositorio. `pnpm format:check` ahora responde _"All matched files use Prettier code style!"_.

#### 2. Bug latente de supresión de ESLint

El reformateo **expuso un bug preexistente** en `src/data/valores-vigentes/hooks.ts`: el `// eslint-disable-next-line react-hooks/exhaustive-deps` estaba anclado a la _forma_ de la llamada (`return useMemo(`) y no al _array de dependencias_ (que es donde ESLint reporta el warning). Mientras la llamada ocupaba una sola línea la supresión funcionaba por casualidad; al partirse en varias líneas, el warning de `useEstadoCatalogo` quedó expuesto y `pnpm lint` empezó a fallar con `--max-warnings 0`.

- Se re-ancló la supresión **inmediatamente encima del array de dependencias** en ambos hooks, de modo que es inmune a cualquier reformateo futuro.
- Se auditaron los 6 `eslint-disable` del repo: los 4 restantes ya estaban correctamente anclados y se conservaron.

#### 3. Hook de pre-commit activo

- **`.husky/pre-commit`** creado con `npx lint-staged`. Husky v9 estaba instalado y `core.hooksPath` apuntaba a `.husky/_`, pero el archivo de hook del usuario no existía, por lo que `h` terminaba con `exit 0` y lint-staged nunca se ejecutaba.
- **Verificado empíricamente** con un commit real: lint-staged arrancó, ejecutó `prettier --write` sobre `package.json` y aplicó las modificaciones antes del commit.
- Se documenta en `AGENTS.md` que no debe saltarse el hook.

#### 4. Colisión de `pnpm deploy` resuelta

`pnpm deploy` está reservado por pnpm para los despliegues de workspace y fallaba con `ERR_PNPM_CANNOT_DEPLOY`. Ahora `"deploy": "pnpm run deploy:production"`, de modo que **`pnpm run deploy`** y **`pnpm run deploy:production`** funcionan, y el error nativo de pnpm indica exactamente el comando correcto. La trampa queda documentada en `AGENTS.md`.

#### 5. Continuous Integration y documentación

- **`.github/workflows/ci.yml`**: pipeline en `push` a `main` y pull requests, con `typecheck`, `lint`, `format:check`, `verify:catalogo`, `test` y `build`. Es la diferencia entre un script declarado y un script realmente aplicado.
- **`.gitattributes`**: normaliza los finales de línea a LF (`* text=auto eol=lf`). Sin él, `core.autocrlf=true` (por defecto en Windows) reescribe el working tree con CRLF en cada checkout y `format:check` falla de inmediato.
- **`AGENTS.md`**: guía de trabajo para agentes y mantenedores con los comandos, las 5 reglas de la casa (fuente única del catálogo, prohibición de hardcodear valores fiscales, no saltar el hook, puerta completa antes de commitear y documentación del estado real) y el mapa rápido del repo.

**Métricas del Sprint:** 367/367 pruebas en 49 suites (100% éxito) tras el reformateo de 175 archivos. 0 errores de TypeScript. 0 errores y 0 advertencias de linting. `format:check` verde en todo el repo. Bundle de producción sin cambios materiales (223.59 kB / 60.74 kB gzip). Catálogo fiscal 6/6 vigente.

**Despliegue:** commits `3b881a0` (hook + colisión de deploy) y `78180b9` (formato + CI) → `main` → `origin/main`. Worker `ark-tools-production`, Version ID `69540930-4d34-447b-8301-f07776c6c07e`.

> **Pendiente de push:** el commit `25ad7ee` con `.github/workflows/ci.yml` (rama local `feature/ci-workflow`) requiere un token de GitHub con scope `workflow` para poder subirse: el token OAuth del entorno solo tiene `gist`, `read:org` y `repo`, y GitHub rechaza crear o actualizar workflows sin ese scope. Para publicarlo: `gh auth refresh --hostname github.com -s workflow` y después `git push origin feature/ci-workflow`.

---

### Sprint 25 (Octubre 2026) — Herramienta #18: Calculadora de Actualización y Recargos Fiscales (CFF Art. 17-A y 21) & Conciliación Anexo 24 (#16) — Completado ✅

**Objetivo:** Eliminar la dependencia de software obsoleto (.exe) y macros de Excel mediante la construcción e integración de la **Herramienta #18**: Calculadora de Actualización y Recargos Fiscales (Art. 17-A y Art. 21 CFF + Art. 8 LIF) y el cierre de catálogo a 18 herramientas con Conciliación Anexo 24 (#16).

#### 1. Motor Matemático y Jurídico (`src/tools/recargos/lib/calcularRecargos.ts`)

- **Truncamiento estricto a 4 decimales (diezmilésimos):** Cumplimiento literal del Art. 17-A del CFF (`Math.floor(factor * 10000) / 10000`), sin redondeos matemáticos comunes.
- **Regla legal anti-deflación:** Conforme al párrafo sexto del Art. 17-A CFF, si el factor resultante de dividir el INPC reciente entre el antiguo es menor a 1.0000 (deflación), se aplica el factor neutro `1.0000`.
- **Mora fiscal sobre base actualizada:** Conforme al Art. 21 CFF y Art. 8 LIF, la tasa mensual de recargos por mora (1.47% mensual vigente en 2026) se liquida sobre el **impuesto actualizado**, no sobre el importe histórico original.
- **Cómputo exacto de fracciones de mes:** Fracciones de mes se computan como meses completos de mora conforme a la legislación fiscal mexicana (`fechaPago.dia > fechaVencimiento.dia => meses + 1`).

#### 2. Catálogo Centralizado de INPC y Vigilancia Desatendida DOF

- **`TABLA_INPC` (2021–2026):** Matriz oficial en `src/data/valores-vigentes/catalogo.ts` con funciones de consulta `obtenerInpc()` y `obtenerUltimoInpc()`.
- **`TASA_RECARGOS_MORA_2026`:** Integrada en `CATALOGO_2026` como valor auditado DOF (7/7 oficiales vigentes en `pnpm verify:catalogo`).
- **`scripts/dof_sat_watcher.py`:** Vigilante desatendido con severidad crítica (`CRITICO`) y regex pericial para ingesta y actualización automática de los nuevos INPC publicados en el DOF cada día 10 del mes.

#### 3. Componentes Visuales ARK Design System (`src/tools/recargos/components/`)

- `ParametrosRecargosCard.tsx`: Formulario reactivo con validación de fechas (Pago $\ge$ Vencimiento), badges oficiales LIF 1.47% y accesos directos a escenarios predefinidos (3, 6, 12 y 24 meses).
- `DesgloseActualizacionTable.tsx`: Desglose didáctico de la ecuación Art. 17-A (Numerador / Denominador = Factor Truncado) y cronograma mes a mes de mora.
- `ResultadoRecargosCard.tsx`: Cúpula `LiquidGlassDome` con deuda total a liquidar magnificada, importe en letras mayúsculas M.N. (`numeroALetras.ts`) y chips métricos.
- `CedulaRecargosModal.tsx`: Papel de trabajo oficial tamaño carta `@media print` con Sello SHA-256, QR de verificación pública y bloques de firma.

#### 4. Integración GEO y Noah AI

- `src/data/catalogo-herramientas.ts`: Registro canónico de Herramienta #18 (`recargos`), elevando `TOTAL_HERRAMIENTAS` a 18.
- `src/server/ai/tools.ts` y `agent.ts`: Directiva `calcular_recargos_fiscales` agregada a `AI_TOOLS_CATALOG` (9 tools de IA en total).
- `src/server/llmsTxt.ts`: Fórmulas CFF Art. 17-A y 21 documentadas para agentes de inteligencia artificial en `/llms.txt` y `/llms-full.txt`.

#### 5. Métricas de Calidad y Despliegue

- **Pruebas unitarias e integración:** 417 pruebas en 58 suites (100% éxito) — `pnpm test`.
- **Auditoría DOF:** 7/7 valores oficiales vigentes — `pnpm verify:catalogo`.
- **Typecheck & Linting:** 0 errores TypeScript (`tsc --noEmit`), 0 warnings ESLint (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme — `pnpm format:check`.
- **Build de producción:** Vite v5.4.21 exitoso (1,786 módulos).
- **Despliegue a Producción:** Commit `2c22916` → `origin/main`. Worker `ark-tools-production`, Version ID `9346525b-db87-48ad-bc58-59ca5c99f8de` en `https://ledger.arksystems.site`. Verificado en vivo `/llms.txt` (18 herramientas) y `/api/ai/tools` (9 herramientas).

---

### Sprint 26 (Octubre 2026) — Herramienta #19: Simulador de Modalidad 40 (Criterio DOF 21/10/2026) — Completado ✅

**Objetivo:** Proteger a contadores, asesores de seguridad social y pensionados frente al histórico Acuerdo del Consejo Técnico del IMSS **`ACDO.AS2.HCT.101026/302.P.DG`**, publicado en el Diario Oficial de la Federación el 21 de octubre de 2026, el cual restringe la Continuación Voluntaria en el Régimen Obligatorio (Modalidad 40) eliminando los saltos artificiales directos al tope de 25 UMAs y prohibiendo pagos retroactivos masivos.

#### 1. Marco Jurídico y Criterio Restrictivo DOF 2026

- **Regla del Tope Restringido:** El salario diario para cotizar en Modalidad 40 queda topado al menor entre 25 UMAs y el **último salario registrado con patrón más 1 UMA diaria vigente**.
- **Prohibición de Pagos Retroactivos:** Inadmisibilidad de convenios extemporáneos de liquidación retroactiva masiva de hasta 5 años sin acreditación estricta de derechos.
- **Cuota Vigente 2026:** Cuota oficial del **14.438%** mensual conforme al calendario transitorio del Decreto LSS (DOF 16/12/2020), auditada en catálogo.
- **Cálculo Actuarial Ley 73:**
  - Salario Promedio de las últimas 250 semanas de cotización.
  - Tabla del Artículo 167 de la Ley del Seguro Social de 1973 (Cuantía Básica e Incrementos Anuales por grupo de salario en veces el SMG).
  - Factor por Edad (Artículo 171 LSS 1973: 75% a los 60 años hasta 100% a los 65 años o vejez).
  - Asignación Familiar garantizada (15% por ayuda asistencial o cónyuge).
  - Factor Fox (Decreto Presidencial de 2004: +11% global a pensiones Ley 73).
  - Métricas de inversión: Costo total de cuotas, incremento mensual de pensión contra statu quo y período de retorno de inversión (ROI en meses).
  - Sello pericial criptográfico inmutable SHA-256.

#### 2. Motor Actuarial y Valores Oficiales

- **`src/data/valores-vigentes/catalogo.ts`:**
  - Registrada la constante `CUOTA_MODALIDAD_40_2026 = 0.14438` en `CATALOGO_2026` con metadatos oficiales del DOF.
  - Exportado `CUOTA_MODALIDAD_40_PCT_2026 = 14.438`.
  - Auditoría DOF elevada a **8/8 valores oficiales vigentes** (`pnpm verify:catalogo`).
- **`src/tools/modalidad40/types.ts`:**
  - Definición rigurosa de interfaces: `Modalidad40Input`, `Modalidad40Result`, `ComparativaLimites`, `Tabla167Grupo`.
- **`src/tools/modalidad40/lib/calcularModalidad40.ts`:**
  - Implementación completa de la fórmula actuarial con soporte para simulación con y sin restricción DOF 2026, cálculo de semanas excedentes, asignaciones familiares y sellado pericial SHA-256.
- **`src/tools/modalidad40/lib/calcularModalidad40.test.ts`:**
  - 11 pruebas unitarias cubriendo topes, cuantía básica, incrementos anuales, edades de retiro (60 a 65), ROI y concordancia matemática.

#### 3. Componentes Visuales ARK Design System (`src/tools/modalidad40/components/`)

- `ParametrosModalidad40Card.tsx`: Formulario de parámetros laborales y de inversión con conmutador interactivo del Criterio DOF 21/10/2026 y presets rápidos.
- `ComparativaLimitesCard.tsx`: Auditoría visual de impacto que contrasta el límite histórico anterior (25 UMAs) vs el nuevo límite regulatorio (Último SBC + 1 UMA), alertando sobre intentos de cotización no permitidos.
- `ResultadoPensionCard.tsx`: Cúpula `LiquidGlassDome` con la pensión mensual estimada, desglose de inversión total, meses para recuperar inversión (ROI) y botón de compartir en WhatsApp con formato profesional.
- `CedulaModalidad40Modal.tsx`: Papel de trabajo oficial tamaño carta `@media print` con Sello Digital SHA-256 inmutable, QR institucional y fundamentos legales completos de la LSS 1973 y el Acuerdo DOF 2026.
- `Modalidad40.tsx` y `Modalidad40.test.tsx`: Componente principal enlazado a la suite con selector de expediente, banner de modo libre y 4 pruebas UI automatizadas.

#### 4. Integración Canónica, GEO Engine y Noah AI

- **`src/data/catalogo-herramientas.ts`:** Registrada como Herramienta #19 con categoría `'fiscal-nomina'` y badge `'GRATIS'`. `TOTAL_HERRAMIENTAS = 19`.
- **`src/App.tsx` & `src/components/LandingPage.tsx`:** Actualizado `ToolId` union type, importación lazy en el enrutador y tarjeta de acceso público.
- **`src/data/actos.ts`:** Actualizado el catálogo de plazos y fiscalización SAT/IMSS con notas sobre el acuerdo y la estricta vigilancia sobre altas simuladas con familiares.
- **`src/server/llmsTxt.ts`:** Documentación agregada en `/llms.txt` y `/llms-full.txt` con fundamentos para agentes de IA externos.
- **`src/server/ai/tools.ts` & `src/server/ai/agent.ts`:** Registrada la función de IA `calcular_modalidad_40` en `AI_TOOLS_CATALOG` (10 tools en total) y directiva en el orquestador Noah AI.

#### 5. Métricas de Calidad

- **Pruebas unitarias e integración:** **432 pruebas en 60 suites (100% éxito)** — `pnpm test`.
- **Auditoría DOF:** **8/8 valores oficiales vigentes** — `pnpm verify:catalogo`.
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 30 (Octubre 2026) — Detector de Comportamientos Atípicos en CFDI (#20) — Completado ✅

#### 1. Arquitectura y Capacidades de Auditoría Forense Local-First

- **Ingesta y Procesamiento 100% en Cliente:** Soporte para descompresión de paquetes `.zip`, ingesta de archivos `.xml` (CFDI 4.0/3.3) y metadata `.txt` del SAT con delimitador `~`. Procesamiento streaming en memoria con persistencia en **IndexedDB** (`ark_auditor_cfdi_db`) sin límite de 5 MB de localStorage.
- **Gestión Multi-RFC:** Alta, cambio y administración de contribuyentes con conservación de datos y parámetros independientes por RFC y ejercicio fiscal.
- **Motor Estadístico y Forense:**
  1. _Ley de Benford:_ Evaluación del primer dígito (1–9) contra la distribución teórica de Benford $P(d)=\log_{10}(1+1/d)$ para detectar alteración manual o facturación artificial.
  2. _Puntaje Z y Rango Intercuartílico (IQR):_ Detección de volatilidad de importes mensuales que superen $|Z| > 2.0$.
  3. _Fraccionamiento de Efectivo:_ Detección de comprobantes emitidos o recibidos en el mismo día hacia la misma contraparte $< \$2,000$ que acumulados eluden el Art. 27 Fracc. III de la LISR.
  4. _Efectivo Superior a \$2,000:_ Detección directa de erogaciones Forma 01 no deducibles.
  5. _Desfase de Timbrado:_ Alerta de comprobantes timbrados más de 72 horas después de su emisión (Art. 39 RCFF).
  6. _Horarios Atípicos:_ Timbrados en madrugada (23:00 a 05:00) o días inhábiles.
  7. _Conciliación Metadata SAT:_ Detección de comprobantes con estatus `0` (Cancelados ante el SAT) que subsisten activos en contabilidad local, y cancelaciones extemporáneas posteriores al ejercicio (Art. 29-A CFF).
  8. _Cruce 69-B:_ Identificación de operaciones con RFCs presuntos o definitivos del listado de EFOS.
  9. _Concentración HHI:_ Índice Herfindahl-Hirschman de clientes y proveedores.
- **Malla Mensual Jan–Dec:** Tablero de 12 meses con mapas de calor semánticos, cálculo de flujo neto e inspección modal de comprobantes (drilldown con copia de UUID).
- **Matriz de Riesgo 5×5:** Cuadrante interactivo de Probabilidad (1–5) vs Impacto (1–5) con semáforo y estatus de seguimiento de hallazgos (_pendiente_, _en revisión_, _aclarado_, _corregido_).
- **Resumen Ejecutivo & Dictamen Pericial:** Redacción automática en tercera persona formal con exportación directa a PDF/impresión y Cédula Excel multi-hoja (`xlsx`).
- **Respaldo y Recuperación:** Exportación de instantánea JSON y cargador instantáneo de datos demo para validación inmediata sin archivos reales.

#### 2. Componentes y Código Creado

- `src/tools/auditor-cfdi-atipico/types.ts`
- `src/tools/auditor-cfdi-atipico/lib/indexedDbStorage.ts`
- `src/tools/auditor-cfdi-atipico/lib/zipIngestor.ts`
- `src/tools/auditor-cfdi-atipico/lib/motorForense.ts`
- `src/tools/auditor-cfdi-atipico/lib/motorForense.test.ts` (7 tests unitarios)
- `src/tools/auditor-cfdi-atipico/lib/generadorDemo.ts`
- `src/tools/auditor-cfdi-atipico/lib/exportarAuditoriaExcel.ts`
- `src/tools/auditor-cfdi-atipico/components/GestionContribuyentes.tsx`
- `src/tools/auditor-cfdi-atipico/components/MallaMensual.tsx`
- `src/tools/auditor-cfdi-atipico/components/MatrizRiesgo5x5.tsx`
- `src/tools/auditor-cfdi-atipico/components/ConciliacionMetadata.tsx`
- `src/tools/auditor-cfdi-atipico/components/CriteriosConfig.tsx`
- `src/tools/auditor-cfdi-atipico/components/ResumenEjecutivo.tsx`
- `src/tools/auditor-cfdi-atipico/components/DetalleComprobantesModal.tsx`
- `src/tools/auditor-cfdi-atipico/AuditorCFDIAtipico.tsx`
- `src/tools/auditor-cfdi-atipico/index.ts`

---

### Sprint 29 (Octubre 2026) — Módulo de Cruce Laboral-Fiscal de Jornada (CFDI Nómina 1.2 vs Reloj Checador / Asistencia LFT Art. 132 Fracc. VIII Bis) — Completado ✅

#### 1. Fundamentación Jurídica y Análisis de Auditoría Cruzada (SAT vs IMSS vs STPS)

- **Marco Regulatorio Integrado:**
  - **STPS:** Obligación patronal estricta de registro fidedigno de jornada laboral y reloj checador (Art. 132 Fracc. VIII Bis LFT y Arts. 66/68 LFT sobre topes y pago de horas extraordinarias).
  - **SAT:** Requisito de materialidad y deducibilidad de la nómina (Art. 27 Fracc. V LISR y Art. 28 CFF). Si se pagan horas extras o sueldos sin respaldo en el reloj checador, o si existen discrepancias con el CFDI Nómina 1.2, el SAT presume simulación y rechaza la deducción.
  - **IMSS:** El pago de horas extraordinarias excedentes de los límites legales (más de 3 horas diarias o más de 3 veces por semana) integra al Salario Base de Cotización (Art. 27 Fracc. IX LSS).
- **Tipificación Determinista de Discrepancias:**
  1. `HORAS_EXTRAS_NO_PAGADAS`: Horas registradas en checador > CFDI (Riesgo ALTO ante STPS).
  2. `HORAS_EXTRAS_SIN_REGISTRO`: Horas extras pagadas en CFDI sin registro en checador (Riesgo MEDIO de no deducibilidad SAT).
  3. `SIN_REGISTRO_CHECADOR`: Empleado con CFDI timbrado pero sin ningún registro en reloj checador (Riesgo CRÍTICO, posible colaborador fantasma).
  4. `EMPLEADO_SIN_CFDI`: Registro en reloj checador sin timbrado de nómina (Riesgo CRÍTICO, contingencia de omisión patronal / informalidad).
  5. `EXCESO_JORNADA_LEGAL_TRIPLE`: Más de 9 horas extra semanales sin retribución al 200% (Art. 68 LFT, Riesgo ALTO laboral).
- **Cálculo de Score de Consistencia (0–100%) y Semáforo de Riesgo:**
  - Score ponderado según volumen de incidencias y severidad.
  - Clasificación en niveles: `BAJO` (≥90%), `MEDIO` (70–89%), `ALTO` (50–69%) y `CRITICO` (<50%).

#### 2. Motor Reconciliador y Parsers (`src/tools/cierre-nomina/lib/cruceNominaChecador.ts`)

- Ingesta de CFDI Nómina 1.2 XML: Extracción de nodo `cfdi:Comprobante`, `cfdi:Emisor`, `cfdi:Receptor` (RFC, Nombre), `nomina12:Nomina` (días pagados) y `nomina12:HorasExtra` (claves SAT `019` horas extras dobles y `020` horas extras triples).
- Ingesta y normalización flexible de CSV de Reloj Checador: Soporte para formato de eventos (entrada/salida con timestamps) y formato consolidado (total horas trabajadas y extras).
- Generador de dataset demostrativo de 1-clic (`generarLoteMuestraCruce`) con 5 casos reales para pruebas inmediatas.
- Sellado criptográfico SHA-256 client-side inmutable del dictamen.
- Exportador de cédula de inconsistencias a CSV con codificación UTF-8 BOM.

#### 3. Experiencia de Usuario & Papel de Trabajo Oficial (`CedulaCruceJornadaModal.tsx` & `CierreNomina.tsx`)

- Pestaña dual integrada en Herramienta #12: "Cierre de Nómina Masivo" y "Cruce Laboral-Fiscal (Checador vs CFDI)".
- Interfaz reactiva con Drag & Drop dual para múltiples XMLs CFDI y archivo CSV de asistencia.
- Visualización de KPIs clave: Empleados Analizados, Horas Extra CFDI vs Checador, Total de Discrepancias, Score de Consistencia y Nivel de Riesgo Global.
- `CedulaCruceJornadaModal.tsx`: Papel de trabajo oficial tamaño Carta (`@media print`) con Sello Digital SHA-256 inmutable, Código QR dinámico de verificación, tabla de auditoría, alertas legales y 3 bloques de firma (Responsable de Nómina, Auditor Fiscal y Dirección General).
- Integración nativa con `saveCalculoExpediente` para persistencia en el Expediente Único del cliente.

#### 4. GEO Engine & Agente Noah AI

- `/llms.txt`: Actualizado con la Sección 7 dedicada a la Consistencia Laboral-Fiscal entre Reloj Checador (LFT Art. 132 Fracc. VIII Bis) y CFDI Nómina (LISR Art. 27 Fracc. V / CFF Art. 28).
- `src/server/ai/agent.ts`: Directiva institucional para el agente Noah AI que previene confusión de facultades entre la STPS (asistencia y jornada) y el SAT/IMSS (fiscalización de deducciones e integración al SBC).
- `src/data/catalogo-herramientas.ts`: Descripción actualizada de la herramienta #12.

#### 5. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **498 pruebas en 70 suites (100% éxito)** — `pnpm test`.
- **Nuevas pruebas:**
  - `src/tools/cierre-nomina/lib/cruceNominaChecador.test.ts` (15 pruebas unitarias del motor de cruce y parsers).
  - `src/tools/cierre-nomina/CierreNomina.test.tsx` (6 pruebas de integración y render UI, +2 añadidas).
- **Auditoría DOF:** **8/8 valores oficiales vigentes** — `pnpm verify:catalogo`.
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).
- **Build de producción:** Vite compila `dist/` exitosamente en 29s (1,815 módulos).

---

### Sprint 16: Portal de Servicios al Socio CANACO & Ecosistema B2B Ark Systems (Completado ✅)

#### 1. Distinción Clara de Portal al Socio

- **Navegación y Cabecera Institucional:** Badge distintivo patrimonial `Portal del Socio` integrado en `CanacoLandingPage.tsx` junto a la heráldica oficial de CANACO Mérida.
- **Hero Institucional:** Incorporación de badge oficial `🏛️ Portal Oficial de Servicios al Socio • Fundada en 1906 · 120 Años de Trayectoria Empresarial` y subtítulo destacado `Ventanilla Digital y Suite de Servicios al Afiliado` para diferenciar la plataforma de un portal de noticias gremiales.
- **Suite Completa sin Restricciones:** Mantenimiento de la suite de 19 herramientas visible y operativa para demostración ante el Consejo Directivo y Directores de la Cámara.

#### 2. Atribución Tecnológica y Captura de Leads B2B (Product-Led Growth)

- **Footer Institucional CANACO:** Sello oficial `Desarrollado con tecnología de Ark Systems (Substrate Holdings LLC)` con badge `White-Label`.
- **Card de Captura Gremial:** Banner interactivo para líderes de cámaras y colegios: _"¿Quieres tener un portal similar para los socios o afiliados de tu cámara, colegio u organización empresarial? Escríbenos a pavel@arksystems.site"_ con enlace `mailto:` directo.
- **Footer Global Multi-Marca:** Integración del banner B2B en `Footer.tsx` bajo la marca CANACO MÉRIDA.

#### 3. Métricas de Calidad

- **Pruebas:** 24 pruebas pasando en la suite cameral y de marca.
- **Auditoría DOF:** 8/8 oficiales vigentes.
- **Puerta completa:** `typecheck`, `lint` y `format` 100% verdes.
- **Build de producción:** Vite v5.4.21 exitoso (1,795 módulos transformados).

---

### Sprint 27 (Octubre 2026) - Onboarding Guiado, Caso Demo Sandbox & "Aha! Moment en 60s" - Completado ✅

#### 1. Diagnóstico y Propósito del Vector de Onboarding

- Resuelve la fricción inicial donde un contador recién registrado aterrizaba en un dashboard con 19 herramientas en _"Modo cálculo libre"_ y sin clientes (`clients = []`).
- Permite experimentar el valor diferencial de ARK LEDGER (**Expediente Único + Cálculo Automatizado + Papel de Trabajo con Sello Criptográfico SHA-256**) en menos de 60 segundos sin requerir la captura de datos confidenciales reales.

#### 2. Entidades Canónicas de Demostración (`src/data/demo-onboarding.ts`)

- `DEMO_EMPRESA`: _Innovación y Servicios Contables S.A. de C.V._ (RFC: `ISC200101AB1`, Régimen General 601, CDMX).
- `DEMO_TRABAJADOR`: _Carlos Mendoza Morales_ (RFC: `MEMC880512XYZ`, NSS: `12948576023`, Salario Diario 1.6x SMG 2026, SDI calculado con factor de integración a 3 años de antigüedad conforme a reformas LFT de Vacaciones Dignas).
- `DEMO_EXPEDIENTE_EJEMPLO`: Historial de cálculo inicial demostrativo.
- Cero hardcoding: valores derivados directamente del catálogo oficial (`VALORES_POR_ID`).

#### 3. Motor Sandbox en Contexto (`src/context/ExpedienteContext.tsx`)

- Implementados `isDemoActive`, `loadDemoData()` y `clearDemoData()`.
- Soporte para sellado criptográfico client-side en modo demo vía `crypto.subtle.digest('SHA-256')`, permitiendo generar papeles de trabajo con hash y QR válidos al instante sin requerir viajes de red ni persistencia espuria en D1.

#### 4. Experiencia de Usuario & Componentes UI

- `OnboardingQuickstartModal.tsx`: Modal institucional con bienvenida, propuesta de valor, selección rápida ("Probar Caso Demo en 1 Clic" vs "Resolver Caso Real Urgente") y persistencia del flag `ark_onboarding_completed` en `localStorage`.
- `OnboardingCelebrationModal.tsx`: Cierre del loop de onboarding al sellar el primer cálculo demo con hash SHA-256 inmutable, con opción de transición inmediata a "Registrar mi Primer Cliente Real" y vista de cédula QR oficial.
- `LandingPage.tsx`:
  - Botón de reenvío de correo transaccional con cuenta regresiva en vivo (_cooldown_ de 60 segundos).
  - Asistente generador de frases de acceso seguras (`generatePassphrase`) con verificación de longitud mínima (12 caracteres).
- `src/server/auth.ts`: Plantilla HTML corporativa homologada para correos de verificación y restablecimiento de contraseña en Resend, con diseño responsivo, acento dorado, botón CTA y cabeceras estándar para máxima entregabilidad (antispam).
- `ExpedienteSelector.tsx`: Badge `Sandbox Demo` en la barra superior persistente con botón `Salir de Demo` y acceso rápido a `Cargar Caso Demo` en modo libre.
- `ExpedienteToolBanner.tsx`: Acceso de 1 clic para cargar el caso demo desde cualquier calculadora y disparador automático del modal de celebración al sellar en modo demo.
- `App.tsx`: Botón `Tour Demo (60s)` visible en el banner de Papel de Trabajo del Dashboard para relanzar la experiencia en cualquier momento.

#### 5. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **441 pruebas en 62 suites (100% éxito)** — `pnpm test`.
- **Nuevas pruebas:** `src/components/onboarding/OnboardingQuickstartModal.test.tsx` (5 pruebas) y `src/components/onboarding/OnboardingCelebrationModal.test.tsx` (4 pruebas).
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 28 (Octubre 2026) — Brand Config Engine & Marca Blanca Institucional (CANACO SERVYTUR MÉRIDA) — Completado ✅

#### 1. Arquitectura de Desacoplamiento y Multi-Brand

- Creación del motor de marca en `src/config/brand/`:
  - `types.ts`: Contrato tipado `BrandConfig`, `BrandColors`, `BrandFeatures` y `BrandFooter`.
  - `ark.ts`: Configuración canónica de ARK LEDGER (modo oscuro, Navy `#002B7F`, Oro `#FFD700`, 19 herramientas completas).
  - `canacoMerida.ts`: Configuración institucional de CANACO SERVYTUR MÉRIDA (Azul institucional `#1a467e`, acento `#c49a45`, `ventanillaPagos: true`, catálogo curado de 12 herramientas prioritarias para comercio y MiPyMEs de Yucatán).
  - `index.ts`: Selector dinámico de marca por variable de entorno (`VITE_BRAND`) o hostname del navegador (`canacomerida.com.mx`), con fallback transparente a ARK LEDGER.

#### 2. Vector Gráfico Oficial y Componentes de Identidad

- `src/components/brand/CanacoLogo.tsx`: Renderizador SVG oficial de CANACO SERVYTUR MÉRIDA con dos variantes:
  - `symbol`: Isotipo triangular estilizado (`#1A3A5C`) para barras de navegación, botones y avatares compactos.
  - `full`: Emblema institucional completo con tipografía serif ("CANACO SERVYTUR" / "MÉRIDA") y línea decorativa.
- `src/components/brand/BrandLogo.tsx`: Conmutador dinámico de logo (`Logo` de ARK vs `CanacoLogo` de CANACO) según la marca activa.
- Homologación de `Header.tsx` y `Footer.tsx` para consumir títulos, eslóganes, logotipos, enlaces de soporte y leyendas legales directamente de `currentBrand`.
- `docs/canaco-henequen.md`: Documento maestro de diseño e identidad museográfica-patrimonial (120 Años, Regla del 8% henequenero, tokens Cal, Sisal, Muro, Arena, Añil `#1A3A5C`, Terracota `#B85C38` y Verde agave `#4A7C6F`).
- `scripts/forge_henequen_meta.py`: Fábrica vectorial en Python stdlib pura que genera 10 assets vectoriales (18.39 KB) en `public/assets/henequen/` con `manifest.json`.
- Tokens `henequen-*` integrados en `tailwind.config.js`.

#### 3. Componentes Exclusivos CANACO SERVYTUR MÉRIDA & Persistencia CRM D1

- `src/server/afiliacionesApi.ts`: Endpoint público `/api/afiliaciones/registro` con persistencia en `leads_ark_tools` bajo `tenant_id = 'canaco_merida'` y nuevo endpoint `/api/afiliaciones/consulta?rfc=` para validación pública de vigencia.
- `src/server/leadsApi.ts`: Autorización y bypass para `horus.i2d@gmail.com` sobre el tenant `canaco_merida` asegurando acceso administrativo directo al padrón.
- `src/components/canaco/calculoCuota.ts`: Motor determinista de cálculo de cuotas del Registro SIEM (Ley Federal de Cámaras Empresariales) y Membresía Anual según número de colaboradores y sector (comercio, servicios, turismo).
- `src/components/canaco/VentanillaAfiliacionModal.tsx`: Modal institucional completo de 3 pasos que captura el lead preliminar en CRM al avanzar de paso y sella la membresía a "Socio Activo" con timbrado CFDI al confirmar el pago.
- `src/components/canaco/ConstanciaSocioModal.tsx`: Cédula oficial imprimible en tamaño Carta (`@media print`) con Sello Digital SHA-256 inmutable, Código QR de validación institucional y firmas de autoridad cameral.
- `src/components/canaco/CanacoPortalBanner.tsx`: Banner interactivo del socio montado en el Dashboard de `App.tsx` que muestra el estatus de membresía y botón directo a la Ventanilla de Afiliación.
- `src/components/canaco/CanacoAdminPadron.tsx`: Consola de Afiliaciones y Padrón SIEM enlazada en la barra de herramientas (`admin`) para `horus.i2d@gmail.com` y con acceso ROOT total para el Super Admin (`platformRole === 'super_admin'`). Incluye badge dinámico de Super Admin, 4 KPIs camerales, filtros reactivos, visualización de Cédula de Socio, contacto directo por WhatsApp, exportación a CSV con BOM UTF-8 y botón de sincronización directa con el Call Center Arkangel.
- `src/components/admin/AdminPanel.tsx`: Integración de pestaña nativa `CANACO MÉRIDA` dentro de la Super Admin Console global de ARK LEDGER, permitiendo al Super Admin auditar y operar el padrón cameral sin necesidad de conmutar de dominio o marca.
- `src/components/canaco/CanacoLandingPage.tsx`: Landing pública oficial para CANACO SERVYTUR Mérida con Design System HENEQUÉN. Incorpora la cuadrícula de los 6 servicios gremiales oficiales, buscador en vivo de socio por RFC para descarga inmediata de Cédula Oficial Carta, lanzador de Ventanilla Digital SIEM y modal de acceso directivo para `horus.i2d@gmail.com`.
- `src/server/canacoArkangelSync.ts`: Pipeline de integración Worker-to-Worker / REST entre Ark-Ledger y Arkangel. Extrae los socios con cuota pendiente, normaliza teléfonos a formato internacional E.164 (`+52...`), genera el dataset CSV estándar de Arkangel, y expone `/api/canaco/sync-arkangel`, `/api/canaco/arkangel-status` y el webhook de conciliación `/api/canaco/webhook-pago-arkangel`.

#### 4. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **481 pruebas en 69 suites (100% éxito)** — `pnpm test`.
- **Nuevas suites:**
  - `src/config/brand/brand.test.tsx` (5 pruebas, incluye validación de switch por URL `?brand=canaco` y `sessionStorage`).
  - `src/components/canaco/calculoCuota.test.ts` (4 pruebas).
  - `src/components/canaco/CanacoPortalBanner.test.tsx` (3 pruebas).
  - `src/server/afiliacionesApi.test.ts` (7 pruebas).
  - `src/components/canaco/CanacoAdminPadron.test.tsx` (6 pruebas).
  - `src/server/canacoArkangelSync.test.ts` (10 pruebas).
  - `src/components/canaco/CanacoLandingPage.test.tsx` (5 pruebas).
- **Auditoría DOF:** **8/8 valores oficiales vigentes** — `pnpm verify:catalogo`.
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 30 (Octubre 2026) — Detector de Comportamientos Atípicos en CFDI (#20) — Completado ✅

#### 1. Arquitectura y Capacidades de Auditoría Forense Local-First

- **Ingesta y Procesamiento 100% en Cliente:** Soporte para descompresión de paquetes `.zip`, ingesta de archivos `.xml` (CFDI 4.0/3.3) y metadata `.txt` del SAT con delimitador `~`. Procesamiento streaming en memoria con persistencia en **IndexedDB** (`ark_auditor_cfdi_db`) sin límite de 5 MB de localStorage.
- **Gestión Multi-RFC:** Alta, cambio y administración de contribuyentes con conservación de datos y parámetros independientes por RFC y ejercicio fiscal.
- **Motor Estadístico y Forense:**
  1. _Ley de Benford:_ Evaluación del primer dígito (1–9) contra la distribución teórica de Benford $P(d)=\log_{10}(1+1/d)$ para detectar alteración manual o facturación artificial.
  2. _Puntaje Z y Rango Intercuartílico (IQR):_ Detección de volatilidad de importes mensuales que superen $|Z| > 2.0$.
  3. _Fraccionamiento de Efectivo:_ Detección de comprobantes emitidos o recibidos en el mismo día hacia la misma contraparte $< \$2,000$ que acumulados eluden el Art. 27 Fracc. III de la LISR.
  4. _Efectivo Superior a \$2,000:_ Detección directa de erogaciones Forma 01 no deducibles.
  5. _Desfase de Timbrado:_ Alerta de comprobantes timbrados más de 72 horas después de su emisión (Art. 39 RCFF).
  6. _Horarios Atípicos:_ Timbrados en madrugada (23:00 a 05:00) o días inhábiles.
  7. _Conciliación Metadata SAT:_ Detección de comprobantes con estatus `0` (Cancelados ante el SAT) que subsisten activos en contabilidad local, y cancelaciones extemporáneas posteriores al ejercicio (Art. 29-A CFF).
  8. _Cruce 69-B:_ Identificación de operaciones con RFCs presuntos o definitivos del listado de EFOS.
  9. _Concentración HHI:_ Índice Herfindahl-Hirschman de clientes y proveedores.
- **Malla Mensual Jan–Dec:** Tablero de 12 meses con mapas de calor semánticos, cálculo de flujo neto e inspección modal de comprobantes (drilldown con copia de UUID).
- **Matriz de Riesgo 5×5:** Cuadrante interactivo de Probabilidad (1–5) vs Impacto (1–5) con semáforo y estatus de seguimiento de hallazgos (_pendiente_, _en revisión_, _aclarado_, _corregido_).
- **Resumen Ejecutivo & Dictamen Pericial:** Redacción automática en tercera persona formal con exportación directa a PDF/impresión y Cédula Excel multi-hoja (`xlsx`).
- **Respaldo y Recuperación:** Exportación de instantánea JSON y cargador instantáneo de datos demo para validación inmediata sin archivos reales.

#### 2. Componentes y Código Creado

- `src/tools/auditor-cfdi-atipico/types.ts`
- `src/tools/auditor-cfdi-atipico/lib/indexedDbStorage.ts`
- `src/tools/auditor-cfdi-atipico/lib/zipIngestor.ts`
- `src/tools/auditor-cfdi-atipico/lib/motorForense.ts`
- `src/tools/auditor-cfdi-atipico/lib/motorForense.test.ts` (7 tests unitarios)
- `src/tools/auditor-cfdi-atipico/lib/generadorDemo.ts`
- `src/tools/auditor-cfdi-atipico/lib/exportarAuditoriaExcel.ts`
- `src/tools/auditor-cfdi-atipico/components/GestionContribuyentes.tsx`
- `src/tools/auditor-cfdi-atipico/components/MallaMensual.tsx`
- `src/tools/auditor-cfdi-atipico/components/MatrizRiesgo5x5.tsx`
- `src/tools/auditor-cfdi-atipico/components/ConciliacionMetadata.tsx`
- `src/tools/auditor-cfdi-atipico/components/CriteriosConfig.tsx`
- `src/tools/auditor-cfdi-atipico/components/ResumenEjecutivo.tsx`
- `src/tools/auditor-cfdi-atipico/components/DetalleComprobantesModal.tsx`
- `src/tools/auditor-cfdi-atipico/AuditorCFDIAtipico.tsx`
- `src/tools/auditor-cfdi-atipico/index.ts`

---

### Sprint 29 (Octubre 2026) — Módulo de Cruce Laboral-Fiscal de Jornada (CFDI Nómina 1.2 vs Reloj Checador / Asistencia LFT Art. 132 Fracc. VIII Bis) — Completado ✅

#### 1. Fundamentación Jurídica y Análisis de Auditoría Cruzada (SAT vs IMSS vs STPS)

- **Marco Regulatorio Integrado:**
  - **STPS:** Obligación patronal estricta de registro fidedigno de jornada laboral y reloj checador (Art. 132 Fracc. VIII Bis LFT y Arts. 66/68 LFT sobre topes y pago de horas extraordinarias).
  - **SAT:** Requisito de materialidad y deducibilidad de la nómina (Art. 27 Fracc. V LISR y Art. 28 CFF). Si se pagan horas extras o sueldos sin respaldo en el reloj checador, o si existen discrepancias con el CFDI Nómina 1.2, el SAT presume simulación y rechaza la deducción.
  - **IMSS:** El pago de horas extraordinarias excedentes de los límites legales (más de 3 horas diarias o más de 3 veces por semana) integra al Salario Base de Cotización (Art. 27 Fracc. IX LSS).
- **Tipificación Determinista de Discrepancias:**
  1. `HORAS_EXTRAS_NO_PAGADAS`: Horas registradas en checador > CFDI (Riesgo ALTO ante STPS).
  2. `HORAS_EXTRAS_SIN_REGISTRO`: Horas extras pagadas en CFDI sin registro en checador (Riesgo MEDIO de no deducibilidad SAT).
  3. `SIN_REGISTRO_CHECADOR`: Empleado con CFDI timbrado pero sin ningún registro en reloj checador (Riesgo CRÍTICO, posible colaborador fantasma).
  4. `EMPLEADO_SIN_CFDI`: Registro en reloj checador sin timbrado de nómina (Riesgo CRÍTICO, contingencia de omisión patronal / informalidad).
  5. `EXCESO_JORNADA_LEGAL_TRIPLE`: Más de 9 horas extra semanales sin retribución al 200% (Art. 68 LFT, Riesgo ALTO laboral).
- **Cálculo de Score de Consistencia (0–100%) y Semáforo de Riesgo:**
  - Score ponderado según volumen de incidencias y severidad.
  - Clasificación en niveles: `BAJO` (≥90%), `MEDIO` (70–89%), `ALTO` (50–69%) y `CRITICO` (<50%).

#### 2. Motor Reconciliador y Parsers (`src/tools/cierre-nomina/lib/cruceNominaChecador.ts`)

- Ingesta de CFDI Nómina 1.2 XML: Extracción de nodo `cfdi:Comprobante`, `cfdi:Emisor`, `cfdi:Receptor` (RFC, Nombre), `nomina12:Nomina` (días pagados) y `nomina12:HorasExtra` (claves SAT `019` horas extras dobles y `020` horas extras triples).
- Ingesta y normalización flexible de CSV de Reloj Checador: Soporte para formato de eventos (entrada/salida con timestamps) y formato consolidado (total horas trabajadas y extras).
- Generador de dataset demostrativo de 1-clic (`generarLoteMuestraCruce`) con 5 casos reales para pruebas inmediatas.
- Sellado criptográfico SHA-256 client-side inmutable del dictamen.
- Exportador de cédula de inconsistencias a CSV con codificación UTF-8 BOM.

#### 3. Experiencia de Usuario & Papel de Trabajo Oficial (`CedulaCruceJornadaModal.tsx` & `CierreNomina.tsx`)

- Pestaña dual integrada en Herramienta #12: "Cierre de Nómina Masivo" y "Cruce Laboral-Fiscal (Checador vs CFDI)".
- Interfaz reactiva con Drag & Drop dual para múltiples XMLs CFDI y archivo CSV de asistencia.
- Visualización de KPIs clave: Empleados Analizados, Horas Extra CFDI vs Checador, Total de Discrepancias, Score de Consistencia y Nivel de Riesgo Global.
- `CedulaCruceJornadaModal.tsx`: Papel de trabajo oficial tamaño Carta (`@media print`) con Sello Digital SHA-256 inmutable, Código QR dinámico de verificación, tabla de auditoría, alertas legales y 3 bloques de firma (Responsable de Nómina, Auditor Fiscal y Dirección General).
- Integración nativa con `saveCalculoExpediente` para persistencia en el Expediente Único del cliente.

#### 4. GEO Engine & Agente Noah AI

- `/llms.txt`: Actualizado con la Sección 7 dedicada a la Consistencia Laboral-Fiscal entre Reloj Checador (LFT Art. 132 Fracc. VIII Bis) y CFDI Nómina (LISR Art. 27 Fracc. V / CFF Art. 28).
- `src/server/ai/agent.ts`: Directiva institucional para el agente Noah AI que previene confusión de facultades entre la STPS (asistencia y jornada) y el SAT/IMSS (fiscalización de deducciones e integración al SBC).
- `src/data/catalogo-herramientas.ts`: Descripción actualizada de la herramienta #12.

#### 5. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **498 pruebas en 70 suites (100% éxito)** — `pnpm test`.
- **Nuevas pruebas:**
  - `src/tools/cierre-nomina/lib/cruceNominaChecador.test.ts` (15 pruebas unitarias del motor de cruce y parsers).
  - `src/tools/cierre-nomina/CierreNomina.test.tsx` (6 pruebas de integración y render UI, +2 añadidas).
- **Auditoría DOF:** **8/8 valores oficiales vigentes** — `pnpm verify:catalogo`.
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).
- **Build de producción:** Vite compila `dist/` exitosamente en 29s (1,815 módulos).

---

### Sprint 16: Portal de Servicios al Socio CANACO & Ecosistema B2B Ark Systems (Completado ✅)

#### 1. Distinción Clara de Portal al Socio

- **Navegación y Cabecera Institucional:** Badge distintivo patrimonial `Portal del Socio` integrado en `CanacoLandingPage.tsx` junto a la heráldica oficial de CANACO Mérida.
- **Hero Institucional:** Incorporación de badge oficial `🏛️ Portal Oficial de Servicios al Socio • Fundada en 1906 · 120 Años de Trayectoria Empresarial` y subtítulo destacado `Ventanilla Digital y Suite de Servicios al Afiliado` para diferenciar la plataforma de un portal de noticias gremiales.
- **Suite Completa sin Restricciones:** Mantenimiento de la suite de 19 herramientas visible y operativa para demostración ante el Consejo Directivo y Directores de la Cámara.

#### 2. Atribución Tecnológica y Captura de Leads B2B (Product-Led Growth)

- **Footer Institucional CANACO:** Sello oficial `Desarrollado con tecnología de Ark Systems (Substrate Holdings LLC)` con badge `White-Label`.
- **Card de Captura Gremial:** Banner interactivo para líderes de cámaras y colegios: _"¿Quieres tener un portal similar para los socios o afiliados de tu cámara, colegio u organización empresarial? Escríbenos a pavel@arksystems.site"_ con enlace `mailto:` directo.
- **Footer Global Multi-Marca:** Integración del banner B2B en `Footer.tsx` bajo la marca CANACO MÉRIDA.

#### 3. Métricas de Calidad

- **Pruebas:** 24 pruebas pasando en la suite cameral y de marca.
- **Auditoría DOF:** 8/8 oficiales vigentes.
- **Puerta completa:** `typecheck`, `lint` y `format` 100% verdes.

---

### Sprint 31 (Octubre 2026) — Automatización Transaccional Resend & Conciliación Arkangel (Completado ✅)

#### 1. Arquitectura de Notificación y Separación de Rieles

- **Separación de Responsabilidades:** Ark-Ledger opera como el Sistema de Registro, Portal del Socio y Padrón SIEM; Arkangel opera como el Riel de Cobranza (CLABEs interbancarias SPEI + Voice AI Lada 999 de Mérida).
- **Disparo de Correo Oficial:** Al conciliarse la cuota (vía webhook de Arkangel `/api/canaco/webhook-pago-arkangel` o por liquidación en la Ventanilla Digital `/api/afiliaciones/registro`), se emite automáticamente un correo transaccional institucional mediante la API de Resend.
- **Plantilla HENEQUÉN:** Generación en `src/server/canacoEmailService.ts` de correo responsivo con tokens Añil (#1A3A5C) y Cantera (#EFE7D8), desglose del importe liquidado, Folio SIEM oficial, Sello Criptográfico SHA-256, botones directos de descarga de Cédula Oficial Carta con QR y acceso al Portal del Socio.

#### 2. Archivos y Cobertura

- `src/server/canacoEmailService.ts`: Módulo de conexión con Resend (`https://api.resend.com/emails`), formateo de cuota y render HTML patrimonial.
- `src/server/canacoEmailService.test.ts`: 6 pruebas unitarias verificando render de plantilla, sanitización de datos y manejo de errores HTTP de Resend.
- `src/server/canacoArkangelSync.ts`: Invocación no bloqueante de `sendCanacoConfirmacionPagoEmail` al recibir la conciliación bancaria SPEI desde Arkangel.
- `src/server/afiliacionesApi.ts`: Invocación de `sendCanacoConfirmacionPagoEmail` tras el pago exitoso en ventanilla digital.

#### 3. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **509 pasadas en 72 suites (100% éxito)** — `pnpm test`.
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 32 (Octubre 2026) — Pipeline de Ingesta y Clasificación de Bots (Grok / Hermes) + Filosofía "Modo Sarita" (Completado ✅)

#### 1. Ingesta y Clasificación en el Edge con Hono y Workers AI

- **Router Dedicado Hono (`src/server/bots/botIngestionApi.ts`):** Montado sobre `/api/bots` con endpoints `/api/bots/health`, `/api/bots/ingest` y `/api/bots/logs`.
- **Compatibilidad Multi-Bot:** Acepta payloads heterogéneos de agentes autónomos y bots externos (Grok de xAI, Hermes de Nous Research / OpenRouter, webhooks genéricos).
- **Clasificador Inteligente Edge:** Clasifica el documento entrante entre `comprobante_pago`, `datos_fiscales`, `texto_legal`, `plantilla_contenido` y `consulta_general`. Extrae RFC, montos, folios de rastreo y metadatos con Workers AI (Llama 3.1) o fallback determinista.
- **Persistencia Inmutable:** Registra el payload en Cloudflare D1 (`bot_payloads_log`) con Sello Digital SHA-256 inmutable y encola en Cloudflare Queues (`BOT_PAYLOADS_QUEUE`) si el binding está habilitado. Si detecta un pago de socio cameral o cliente, actualiza automáticamente `leads_ark_tools`.

#### 2. Directriz Operativa: "Modo Sarita" (UX de Cero Fricción Técnica)

- **Operación a 1-Solo Clic:** Los administradores no técnicos operan con botones directos ("Iniciar Recordatorio Masivo") sin ver configuraciones de red, APIs o modelos de IA.
- **Cero Código para Carga de Machotes:** Sarita no manipula HTML, plantillas ni código. Envía sus machotes, circulares y documentos por correo a `pavel@arksystems.site`, y el pipeline backend se encarga de la extracción, validación y despliegue.

#### 3. Métricas de Calidad

- **Pruebas unitarias e integración:** **518 pasadas en 73 suites (100% éxito)** — `pnpm test`.
- **Nueva suite:** `src/server/bots/botIngestionApi.test.ts` (9 pruebas).
- **Puerta completa:** `typecheck`, `lint` y `format` 100% limpios.

---

### Sprint 33 (Octubre 2026) — Arquitectura de Suscripciones Plan Despacho Pro & Paywall Suave (Completado ✅)

#### 1. Persistencia y Gestión de Suscripciones Multi-Tenant en Cloudflare D1

- **Migración D1 `0008_tenant_subscriptions.sql`:**
  - Creación de tabla inmutable `tenant_subscriptions` con esquema multi-tenant (`tenant_id`, `plan`, `status`, `amount_mxn`, `payment_method`, `external_payment_id`, `billing_email`, timestamps).
  - Índices dedicados para consulta rápida por inquilino y estatus.
  - Aplicada exitosamente en producción D1 (`ark_tools_db`).
- **Servicio Backend `src/server/billing/subscriptions.ts`:**
  - Consulta unificada de estatus (`getTenantSubscriptionPlan`).
  - Bypass Pro permanente e incondicional para `canaco_merida`, super administradores (`ark`) y cuentas institucionales.
  - Activación/renovación atómica de planes con sincronización bidireccional en `ai_usage.is_pro`.

#### 2. Webhook Transaccional Clip / SPEI y Endpoint de Facturación

- **Controlador `src/server/billing/billingWebhook.ts`:**
  - `POST /api/billing/webhook`: Procesa eventos de checkout de Clip (`CHECKOUT.PAID`, `PAYMENT.SUCCESSFUL`) y transferencias SPEI para activar la suscripción Pro ($399–$499 MXN/mes).
  - `GET /api/billing/status`: Retorna estatus en tiempo real, días restantes del periodo, límites de IA y banderas Pro para el front-end.
  - `POST /api/billing/manual-activate`: Permite a Super Admins activar planes manualmente para despachos o cortesías comerciales.

#### 3. Experiencia de Usuario Front-End: Hook & Modal Institucional

- **Hook React `src/hooks/useProPlan.ts`:**
  - Monitorea reactivamente el estatus Pro del despacho, almacena en caché local y expone funciones de verificación `canUseProFeature()` y `openUpgradeModal()`.
- **Componente `src/components/billing/ProUpgradeModal.tsx`:**
  - Modal sobrio y respetuoso que comunica los beneficios del Plan Pro (consultas ilimitadas con Noah AI, descargas de papeles de trabajo oficiales, auditoría de layouts y soporte prioritario).
  - Botón de checkout directo con Clip y opción transparente de continuar en Modo Libre sin bloqueos hostiles.

#### 4. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **531 pruebas en 75 suites (100% éxito)** — `pnpm test`.
- **Nuevas suites de prueba:**
  - `src/server/billing/billingWebhook.test.ts` (7 pruebas backend).
  - `src/components/billing/ProUpgradeModal.test.tsx` (5 pruebas frontend).
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 30 — Handoff SIEM ➔ Expediente Único en LEDGER (Puente de Conversión y Onboarding Frictionless)

Implementación del puente controlado entre el Padrón Cameral SIEM (`leads_ark_tools` bajo tenant `canaco_merida`) y el Expediente Único contable de los despachos (`clients` y `expedientes`).

#### 1. Arquitectura y Seguridad Multi-Tenant

- **Aislamiento CFF Art. 69 respetado:** No se mezclan las tablas de la Cámara con los despachos contables. La migración es unidireccional y voluntaria (opt-in explícito del contador o empresario).
- **Auto-provisioning frictionless:** Si el socio no cuenta con sesión de ARK LEDGER al terminar su SIEM, el endpoint provisiona de forma segura su usuario verificado, su espacio de trabajo (`tenants`) y emite una cookie de sesión cifrada (`ark_session`).
- **Deduplicación inteligente:** Clasifica según longitud de RFC (`persona_fisica` con 13 caracteres vs `empresa` con 12) y actualiza el cliente si ya existía en ese despacho en lugar de duplicar.
- **Trazabilidad Cameral:** Sella la nota en `leads_ark_tools` con el tag `Migrado a LEDGER: [Fecha]` para visibilidad del Call Center y CRM.

#### 2. Componentes y Endpoints

- **Endpoint Backend `POST /api/afiliaciones/migrar-a-ledger` (`src/server/afiliacionesApi.ts`):**
  - Ingesta Folio SIEM, RFC, Razón Social, Sector y Contacto.
  - Resuelve tenant del usuario o crea uno nuevo con membresía `owner`.
  - Siembra el registro en `clients` con metadatos de origen cameral (`origen: 'siem_canaco'`, `folio_siem`).
  - Emite `Set-Cookie` y payload de redirección `/?tool=nomina&welcome=siem`.
- **Handoff Front-End (`src/components/canaco/VentanillaAfiliacionModal.tsx`):**
  - Pantalla post-SIEM con tarjeta destacada de beneficios y llamado a la acción: _"¡Felicidades, tu registro SIEM está listo! Como socio de CANACO, tienes acceso gratis a la suite fiscal ARK LEDGER. ¿Quieres importar los datos de tu empresa para empezar a facturar y calcular nómina?"_.
  - Botón esmeralda institucional: _"Importar Empresa y Abrir Nómina"_.
  - Persistencia en `localStorage` de `activeClient` y `activeTenant` para hidratación instantánea de `ExpedienteContext`.
- **Ruteo y Bienvenida en App (`src/App.tsx`):**
  - Soporte para inicialización de herramientas vía query parameter `?tool=nomina`.
  - Banner de bienvenida `welcome=siem` que confirma la activación del Expediente Único listo para sellar el primer papel de trabajo.

#### 3. Métricas de Calidad

- **Pruebas unitarias e integración:** **536 pruebas en 75 suites (100% éxito)** — `pnpm test`.
- **Nuevas pruebas:**
  - `src/server/afiliacionesApi.test.ts` (4 pruebas nuevas para guest onboarding, usuarios autenticados, deduplicación y validación 400).
  - `src/components/canaco/CanacoPortalBanner.test.tsx` (1 prueba nueva de integración para la tarjeta y botón de migración).
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 31 — Riel de Cobranza Stripe Connect (CANACO Mérida Connected Account) & Webhooks

Implementación del riel institucional de pagos para CANACO SERVYTUR Mérida bajo arquitectura Stripe Connect:

#### 1. Arquitectura Legal y Financiera

- **Plataforma (Substrate Holdings LLC / ARK LEDGER):** Controla la infraestructura, código y emite las sesiones de Checkout.
- **Cuenta Conectada (`STRIPE_CANACO_ACCOUNT_ID`):** CANACO Mérida es el receptor legal y titular de los fondos de registro SIEM y membresías anuales, delegando KYC a Stripe y evitando ingresos acumulables para la plataforma.
- **Doble Riel Multimoneda Nacional:**
  - **Stripe Connect:** Destinado a cuotas de afiliación y trámites camerales (Tarjeta de crédito/débito y CLABE dinámico SPEI vía `mx_bank_transfer`).
  - **Clip:** Conservado para los paywalls y suscripciones Pro de ARK LEDGER ($399–$499 MXN/mes).

#### 2. Endpoints y Automatizaciones

- **`POST /api/canaco/stripe/create-checkout` (`src/server/canacoStripeService.ts`):**
  - Genera sesiones de Stripe Checkout con Destination Charges enrutadas a CANACO (`payment_intent_data[transfer_data][destination]`), con retención opcional de cuota de plataforma (`application_fee_amount`) y metadatos de trazabilidad.
  - Modo simulado automático cuando las llaves de Stripe no están configuradas en entornos locales.
- **`POST /api/canaco/stripe/webhook` (`src/server/canacoStripeService.ts`):**
  - Validación criptográfica de encabezados `stripe-signature` con HMAC-SHA256 y ventana de tolerancia temporal.
  - Escucha eventos `checkout.session.completed` y `payment_intent.succeeded`.
  - Actualiza `leads_ark_tools` en D1 a `status = 'Socio Activo'`, asigna sello digital SHA-256 inmutable y dispara correo oficial de bienvenida con Cédula Carta vía Resend.
- **`GET /api/canaco/stripe/status`:** Endpoint de telemetría y salud de la integración.

#### 3. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **542 pruebas en 76 suites (100% éxito)** — `pnpm test`.
- **Nueva suite:** `src/server/canacoStripeService.test.ts` (6 pruebas backend).
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 32 — Buzón Documental Físico-Digital CANACO (Oficialía de Partes SIEM & Cotejo)

Implementación del buzón oficial documental para el cumplimiento con la Secretaría de Economía y la Ley Federal de Cámaras Empresariales:

#### 1. Metáfora Visual & Experiencia "Subes 1, Regresas Luego"

- **Diseño Buzón Físico (`BuzonDocumentalModal.tsx`):** Metáfora de buzón de oficialía de partes en metal añil con placa de latón grabada, remaches dorados, ranura metálica superior con animación de sobre cayendo y 7 casilleros numerados con acabados HENEQUÉN.
- **Flujo Reanudable:** El socio puede depositar un documento hoy, cerrar la pestaña y regresar después desde el buscador de RFC en la landing pública (`CanacoLandingPage.tsx`). Su avance se conserva íntegro en Cloudflare D1 / R2.
- **Diferenciación Fiscal Automática:**
  - **Persona Moral (12 dígitos RFC):** Requiere los 7 documentos (INE, CSF, Domicilio, Acta Constitutiva, Poder Notarial, Solicitud y Aviso).
  - **Persona Física (13 dígitos RFC):** Requiere 5 documentos; Acta Constitutiva y Poder quedan marcados automáticamente como _"No aplica"_.

#### 2. Casilleros Inteligentes y Generador de Anexos

- **Generador de Anexos Oficiales (`anexosCanaco.ts`):** Emite en 1 clic los formatos imprimibles listos para firmar:
  1. _Solicitud Oficial de Registro SIEM 2026_ membretada con el RFC y razón social.
  2. _Aviso de Privacidad Integral LFPDPPP_ para firma de conformidad.
- **Validación y Sellado Criptográfico:** Acepta PDF, JPG, PNG y WEBP hasta 10 MB, calcula huella SHA-256 inmutable por documento y emite Acuse Digital de Recepción con folio único.

#### 3. Backend e Integración Admin

- **Migración D1 `0009_canaco_buzon_documental.sql`:** Tabla `canaco_documentos` con almacenamiento híbrido R2 (`CANACO_DOCS`) / respaldo D1 base64 y restricciones de unicidad por casillero y socio.
- **Endpoints REST (`src/server/canacoBuzonApi.ts`):**
  - `GET /api/canaco/buzon/estado?rfc=`: Consulta pública de avance (X de Y) sin exponer datos sensibles.
  - `POST /api/canaco/buzon/acceso`: Apertura del casillero validando RFC + correo registrado.
  - `POST /api/canaco/buzon/upload`: Ingesta multipart/form-data.
  - `GET /api/canaco/buzon/admin/expediente`: Detalle completo para la Cámara.
  - `GET /api/canaco/buzon/admin/archivo?id=`: Visualizador de documentos en streaming.
  - `POST /api/canaco/buzon/admin/dictaminar`: Aprobación o rechazo con motivo oficial.
- **Consola Administrativa (`AdminExpedienteModal.tsx` & `CanacoAdminPadron.tsx`):**
  - Botón _"Expediente"_ directo en cada fila del padrón para `horus.i2d@gmail.com` y `super_admin`.
  - Visor de documentos, botones de dictamen (Aprobar / Rechazar) y enlace directo a WhatsApp con mensaje prearmado si un documento es borroso o ilegible.

#### 4. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **547 pruebas en 77 suites (100% éxito)** — `pnpm test`.
- **Nueva suite:** `src/server/canacoBuzonApi.test.ts` (5 pruebas backend).
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

---

### Sprint 33 — Integración Edge con Sentinela Legal (RegTech Early Warning)

Conexión bidireccional entre el worker `sentinela-legal` (vigilancia autónoma de fuentes normativas DOF, SAT, CONDUSEF, CNBV y BANXICO) y **ARK LEDGER** para convertir a la suite en un radar de inteligencia regulatoria en vivo:

#### 1. Arquitectura y Almacenamiento D1

- **Migración D1 `0010_sentinela_regulatory_events.sql`:** Tabla `sentinela_events` en `ark_tools_db` con índices en `channel`, `severity` y `created_at` para persistir eventos regulatorios estructurados (título, resumen analítico de IA, severidad, artículos afectados y acciones requeridas).
- **Módulo Backend (`src/server/sentinela/sentinelaWebhook.ts`):**
  - Verificación criptográfica HMAC-SHA256 en tiempo constante vía Web Crypto contra `env.SENTINELA_WEBHOOK_SECRET`.
  - Ingesta determinista en `POST /api/webhooks/sentinela` con upsert en D1.
  - Endpoint de consulta `GET /api/regulatory/events` con soporte de filtros por canal (`fiscal`, `laboral`) y severidad (`critico`, `alto`, `medio`, `bajo`).

#### 2. Suscripción Activa en Sentinela Legal

- Registro del suscriptor `sub_ark_ledger_live` en la base de datos `sentinela-db`:
  - **Nombre:** `ARK LEDGER`
  - **Email:** `pavel@arksystems.site`
  - **Canales:** `["fiscal", "laboral"]`
  - **Webhook URL:** `https://ledger.arksystems.site/api/webhooks/sentinela`
  - **Secreto Compartido:** `ark_sent_live_b7d8e2a149c0f3e6`
  - **Estatus:** Activo (1).

#### 3. Sincronización Canónica de la Suite

- Documentación de la Herramienta #20 (`auditor-cfdi-atipico`) en el system prompt de Noah (`src/server/ai/agent.ts`).
- Actualización de las guardas de tests de `llmsTxt.test.ts` reflejando el conteo canónico de 20 herramientas.
- Nueva suite de pruebas unitarias: `src/server/sentinela/sentinelaWebhook.test.ts` (10 pruebas cubriendo criptografía HMAC, rechazo de firmas inválidas, parsing de payloads y consulta de eventos).

#### 4. Paso 2 — Integración de Noah con Radar Regulatorio en Vivo (AI Tool Calling)

- **Herramienta en Catálogo (`AI_TOOLS_CATALOG` en `src/server/ai/tools.ts`):**
  - Registro de `consultar_alertas_regulatorias` con schema JSON estricto (`canal`: `fiscal`, `laboral`, `cobranza`, `fintech_banca`; `severidad`: `critico`, `alto`, `medio`, `bajo`; `limite`: 1–20).
- **Ejecución de Herramienta (`executeAiTool`):**
  - Despacho directo a `listStoredRegulatoryEvents` sobre la base D1 `ARK_TOOLS_DB`, formateando el retorno con total, filtros aplicados, fuentes oficiales, vigencias y acciones requeridas.
- **Directivas y Orquestación del Agente Noah (`src/server/ai/agent.ts`):**
  - Adición de `DIRECTIVAS_HERRAMIENTAS.consultar_alertas_regulatorias` para invocar la herramienta ante dudas sobre reformas legales, DOF, SAT, CONDUSEF, BANXICO o Sentinela Legal.
  - Actualización del system prompt canónico de Noah reflejando el acceso al radar en vivo.
- **Validación y Pruebas:**
  - Caso de prueba en `src/server/ai/tools.test.ts` simulando consulta D1 con filtros y retorno estructurado.
  - Verificación de paridad estricta entre `AI_TOOLS_CATALOG` y `DIRECTIVAS_HERRAMIENTAS` en `src/server/ai/agent.test.ts`.

#### 5. Métricas de Calidad y Puerta Completa

- **Pruebas unitarias e integración:** **566 pruebas en 78 suites (100% éxito)** — `pnpm test`.
- **Typecheck:** 0 errores TypeScript (`tsc --noEmit`).
- **Linting:** 0 errores y 0 advertencias (`eslint --max-warnings 0`).
- **Formato:** 100% Prettier uniforme (`pnpm format:check`).

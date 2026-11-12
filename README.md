# ARK LEDGER — El Sistema Operativo de la Defensa y Cumplimiento Fiscal

[![Producción](https://img.shields.io/badge/Producci%C3%B3n-ledger.arksystems.site-0A192F?style=for-the-badge&logo=cloudflare&logoColor=D4AF37)](https://ledger.arksystems.site)
[![Herramientas](https://img.shields.io/badge/Herramientas_Fiscales-20_de_20_Vigentes-emerald?style=for-the-badge)](src/data/catalogo-herramientas.ts)
[![Valores DOF](https://img.shields.io/badge/Auditor%C3%ADa_DOF_2026-8%2F8_Oficiales-gold?style=for-the-badge)](src/data/valores-vigentes/catalogo.ts)
[![GEO Engine](https://img.shields.io/badge/GEO_Engine-%2Fllms.txt-blue?style=for-the-badge)](https://ledger.arksystems.site/llms.txt)

Suite integral de **20 herramientas fiscales, laborales, forenses y de compliance** diseñada para contadores públicos, firmas legales y directores de finanzas en México. Construida sobre arquitectura de borde global con **Cloudflare Workers, D1 Database, Workers AI (Llama 3.3 70B), WebCrypto y Bóveda Offline Criptográfica (Art. 30 CFF)**.

---

## 🏛️ Pilares de Innovación Tecnológica

### 1. Bóveda Offline Criptográfica (Art. 30 CFF)

Garantiza la continuidad operativa del despacho sin depender de conexión a internet:

- Almacenamiento local persistente en IndexedDB cifrado con **AES-GCM de 256 bits**.
- Sellado digital inmutable mediante **hashes SHA-256 deterministas** por cada cálculo y expediente contable.
- Generación instantánea de Cédulas Oficiales Tamaño Carta en PDF con Código QR de validación pública.

### 2. Consultor Inteligente Noah AI (Workers AI)

Asistente agentic especializado en derecho tributario mexicano:

- Motor **Llama 3.3 70B Instruct** ejecutado en la red perimetral de Cloudflare Workers AI.
- **Tool-Calling fiscal:** Capaz de invocar las 20 herramientas de la suite para resolver casos complejos en tiempo real.
- **Conector StayPuft con Approval Gate:** Arquitectura _fail-closed_ que audita y bloquea escrituras y acciones no supervisadas.

### 3. GEO Engine para Agentes de IA (/llms.txt)

Optimización semántica de última generación para descubrimiento por modelos autónomos (ChatGPT, Claude, Perplexity):

- Endpoints dinámicos en [`/llms.txt`](https://ledger.arksystems.site/llms.txt), [`/.well-known/llms.txt`](https://ledger.arksystems.site/.well-known/llms.txt) y `/llms-full.txt`.
- Generación en tiempo de ejecución sincronizada con la única fuente canónica de verdad de la suite.

### 4. Capa de Correo Transaccional de Alta Disponibilidad

Despacho unificado y agnóstico de notificaciones, invitaciones a despachos y alertas del cron de timbrado:

- Soporte nativo para **[Telnyx Email API](https://telnyx.com/products/email-api)** (`POST https://api.telnyx.com/v2/email_messages`) y **Resend**.
- Conmutación dinámica inteligente vía `EMAIL_PROVIDER` o autodetección por API keys, con fallback automático ante fallos de servidor.

### 5. Motor de Marca Blanca Institucional

Implementación en producción para la **Cámara Nacional de Comercio, Servicios y Turismo de Mérida (CANACO SERVYTUR Mérida)**:

- Gestión integral del Padrón SIEM 2026 y expedientes comerciales con tokens patrimoniales del Design System HENEQUÉN.
- Buzón documental con respaldo en Cloudflare R2 / D1 y liquidación de cuotas gremiales vía Conekta y transferencias SPEI.

---

## 🧰 Catálogo Canónico de las 20 Herramientas

Cada herramienta cuenta con cédula de trabajo, validación normativa, exportación de datos (CSV con BOM UTF-8) y su respectivo instructivo en [`docs/instructivos/`](docs/instructivos/README.md):

### I. Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)

|  #  | ID              | Herramienta                                   | Fundamento y Alcance                                                                                                                                                                   |
| :-: | :-------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1  | `isn`           | **Calculadora de Impuesto Sobre Nómina**      | Tasas oficiales de los 32 estados de la República (Yucatán 2.5% LGHY Art. 21-27, CDMX, NL, Edomex) con sobretasas y exenciones.                                                        |
|  2  | `sbc`           | **Calculadora de Salario Base de Cotización** | Integración del SBC conforme al Art. 27 y 28 de la LSS, factores de integración LFT, días de vacaciones dignas y tope de 25 UMAs.                                                      |
|  3  | `nomina`        | **Calculadora de Nómina Rápida 2026**         | Retención de ISR mensual (Art. 96 LISR / Anexo 8 RMF), cuotas obrero-patronales IMSS 2026 y subsidio al empleo.                                                                        |
|  4  | `finiquitos`    | **Finiquitos y Liquidaciones LFT**            | Cuantificación de aguinaldo (Art. 87), vacaciones (Art. 76), prima vacacional (Art. 80), prima de antigüedad (Art. 162) e indemnización (Arts. 48 y 50).                               |
|  5  | `resico`        | **Calculadora y Cédula RESICO 2026**          | Régimen Simplificado de Confianza: Personas Físicas (tasas marginales 1% al 2.5%, retención 1.25%) y Personas Morales (flujo de efectivo 30%), con control del tope de \$3.5M / \$35M. |
|  6  | `cierre-nomina` | **Cierre de Nómina Masivo (Batch DOF)**       | Auditoría masiva de nómina multi-empresa cruzando CFDI timbrados vs registros de asistencia y horas extras (LFT Art. 132).                                                             |
|  7  | `recargos`      | **Actualización y Recargos Fiscales (CFF)**   | Cálculo de actualización inflacionaria vía serie histórica INPC oficial (Art. 17-A CFF) y recargos por mora (1.47% mensual LIF Art. 8 / CFF Art. 21).                                  |
|  8  | `modalidad40`   | **Simulador de Modalidad 40 (IMSS)**          | Proyección actuarial Ley 73 con cuota vigente (14.438%), auditoría del tope de inscripción DOF (salario previo + 1 UMA), ROI y pensión neta.                                           |

### II. Patrimonial y Análisis Financiero

|  #  | ID                | Herramienta                     | Fundamento y Alcance                                                                                                                         |
| :-: | :---------------- | :------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
|  9  | `balance-general` | **Balance General Comparativo** | Análisis Horizontal (AH %) y Vertical (AV %) con validación matemática estricta de la ecuación contable $A = P + C$ (tolerancia \$0.02 MXN). |

### III. SAT y Auditoría Forense de CFDI 4.0

|  #  | ID                     | Herramienta                           | Fundamento y Alcance                                                                                                                                                                                                |
| :-: | :--------------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 10  | `xml-excel`            | **Conversor Masivo XML a Excel**      | Procesamiento por lotes de comprobantes CFDI 4.0 / 3.3 con desglose de impuestos retenidos/trasladados y exportación instantánea.                                                                                   |
| 11  | `validador`            | **Validador y Auditor de XMLs**       | Inspección estructural de esquemas XSD, vigencia del Certificado de Sello Digital (CSD) y congruencia de nodos tributarios.                                                                                         |
| 12  | `anexo24`              | **Motor de Conciliación Anexo 24**    | Cruce de XMLs emitidos vs metadata SAT y generación automatizada de balanza Anexo 24 y pólizas contables para Contpaqi/COI.                                                                                         |
| 13  | `auditor-cfdi-atipico` | **Detector Forense de CFDI Atípicos** | Detección pericial de anomalías con Ley de Benford, Z-Score, alertas de pagos en efectivo > \$2,000 (Art. 27 LISR), cancelaciones extemporáneas (Art. 29-A CFF) y cruce con la lista negra de EFOS (Art. 69-B CFF). |

### IV. Cobros y Facturación Fiscal B2B

|  #  | ID         | Herramienta                                         | Fundamento y Alcance                                                                                                                                                                                                    |
| :-: | :--------- | :-------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14  | `spei`     | **Generador de Enlaces de Cobro SPEI**              | Liquidación de honorarios contables mediante transferencias interbancarias y checkout Clip con desglose de comisiones y MSI.                                                                                            |
| 15  | `leasing`  | **Simulador Fiscal: Leasing vs Crédito vs Contado** | Comparador tripartito con topes de deducción vehicular (\$175k / \$250k MOI LISR Art. 36 Fracc. II vs \$200 / \$285 diarios en rentas LISR Art. 28 Fracc. XIII), cómputo, maquinaria y opciones terminales CFF Art. 15. |
| 16  | `timbrado` | **Cobros y Timbrado CFDI 4.0 (Facturapi v2)**       | Conexión multi-empresa para emisión, timbrado oficial y cancelación con motivos SAT de facturas CFDI 4.0.                                                                                                               |

### V. Compliance y Defensa Jurídica

|  #  | ID                 | Herramienta                                  | Fundamento y Alcance                                                                                                                         |
| :-: | :----------------- | :------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| 17  | `guia-sat-imss`    | **Guía Interactiva de Actos de Molestia**    | Protocolo de 8 pasos para atención de visitas domiciliarias, revisiones de gabinete, cartas invitación y embargos, con plazos del CFF y LSS. |
| 18  | `auditor-cobranza` | **Auditoría Legal de Cobranza**              | Evaluación de 43 conductas tipificadas bajo el Art. 284 Bis del Código Penal Federal, CONDUSEF y PROFECO, con certificación inmutable en D1. |
| 19  | `mapa-activos`     | **Mapa de Activos Virtuales y Cripto**       | Matriz regulatoria fiscal y de prevención de lavado de dinero (LFPIORPI / Ley Fintech) para tenencia y custodia de criptoactivos.            |
| 20  | `monitor-lfpiorpi` | **Monitor de Actividades Vulnerables (PLD)** | Detección de umbrales en UMA 2026 para Identificación (1,605 UMA) y Aviso ante la UIF-SAT (3,210 UMA) con regla de acumulación de 6 meses.   |

---

## 🛠️ Stack Tecnológico

- **Runtime de Borde:** Cloudflare Workers (`compatibility_date = "2024-10-11"`, `nodejs_compat`).
- **Base de Datos Distribuida:** Cloudflare D1 (`ark_tools_db`, SQLite multi-tenant, 13 migraciones).
- **Inteligencia Artificial:** Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct`).
- **Almacenamiento de Objetos:** Cloudflare R2 (`CANACO_DOCS`).
- **Frontend:** React 18, TypeScript (modo estricto), Vite 5, Tailwind CSS y Lucide Icons.
- **Criptografía:** WebCrypto nativo del navegador y runtime (AES-GCM, PBKDF2, SHA-256).
- **Proveedores de Correo:** Telnyx Email API y Resend API.
- **Testing & Calidad:** Vitest v2, ESLint 8 (`--max-warnings 0`), Prettier.

---

## 🚀 Inicio Rápido y Desarrollo

### Requisitos

- **Node.js** >= 20.0.0
- **pnpm** >= 9.7.0

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/substrateholdingsai/ark-tools.git
cd ark-tools

# Instalar dependencias exactas
pnpm install

# Iniciar servidor local con emulación de Cloudflare Worker
pnpm dev
```

---

## 🚢 Comandos de Despliegue

> ⚠️ **IMPORTANTE:** Nunca ejecutes `pnpm deploy`. Ese comando está reservado por el gestor de workspaces de pnpm y fallará con `ERR_PNPM_CANNOT_DEPLOY`. Usa siempre los scripts delegados:

```bash
# Despliegue a Producción (Build Vite + Wrangler Deploy)
pnpm run deploy:production

# Despliegue a Staging
pnpm run deploy:staging

# Preview Local del Worker
pnpm run deploy:preview
```

---

## 🛡️ Puerta Completa de Calidad (Quality Gate)

Cualquier cambio en el repositorio debe aprobar la puerta completa antes de commitear:

```bash
pnpm typecheck        # tsc --noEmit (0 errores de tipos en TypeScript estricto)
pnpm lint             # ESLint (falla con cualquier warning)
pnpm format:check     # Prettier --check en todo el repositorio
pnpm test             # Suite completa de pruebas en Vitest
pnpm verify:catalogo  # Auditoría pericial DOF de los valores fiscales vigentes (8/8 oficiales)
```

---

## 🔐 Configuración de Variables y Secretos

Los secretos seguros de producción se gestionan mediante Wrangler:

```bash
# Correo Transaccional (Telnyx o Resend)
pnpm exec wrangler secret put TELNYX_API_KEY --env production
pnpm exec wrangler secret put RESEND_API_KEY --env production

# Facturación y Pagos
pnpm exec wrangler secret put CLIP_API_KEY --env production
pnpm exec wrangler secret put CLIP_API_SECRET --env production

# PAC Facturapi CFDI 4.0
pnpm exec wrangler secret put FACTURAPI_API_KEY --env production
pnpm exec wrangler secret put FACTURAPI_ENCRYPTION_KEY --env production

# Operador Seguro StayPuft & Webhooks
pnpm exec wrangler secret put LEDGER_STAYPUFT_API_KEY --env production
pnpm exec wrangler secret put SENTINELA_WEBHOOK_SECRET --env production
```

---

## 📄 Licencia y Derechos

© 2026 **Substrate Holdings LLC**. Todos los derechos reservados.  
Propiedad intelectual de ARK LEDGER y Ark Systems. Plataforma de Cumplimiento y Defensa Fiscal.

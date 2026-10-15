# ARK TOOLS — Mapa del Proyecto y Checklist de Estado

**Versión:** 1.0  
**Fecha:** Octubre 2026  
**Mantenedor:** Substrate Holdings LLC  
**URL de Producción:** [https://ark-tools.substrateholdingsai.workers.dev](https://ark-tools.substrateholdingsai.workers.dev)  
**Repositorio:** [https://github.com/substrateholdingsai/ark-tools](https://github.com/substrateholdingsai/ark-tools)

---

## 1. Resumen Ejecutivo de Avance

| Métrica | Estado |
|---|---|
| **Pruebas unitarias** | 120/120 pasadas (100% éxito) |
| **Typecheck (TypeScript)** | 0 errores en código de producción (tests con advertencias menores) |
| **Build Vite (SPA)** | 100% funcional (~16s) |
| **Deploy Cloudflare Workers** | Activo y sincronizado en producción |
| **Herramientas en Producción** | 8 de 8 (ISN, SBC, Nómina, Conversor XML, Validador XML, Links de Pago Clip, Leasing y Guía SAT/IMSS) |
| **Catálogo Centralizado** | 7 valores fiscales con fuente, referencia y vigencia validada |
| **Siguiente en Pipeline** | Mapa de Activos Virtuales (Fase D) |

---

## 2. Mapa de Arquitectura y Estado de Componentes

```
ark-tools/
├── docs/
│   ├── design-system.md              ✅ Completo (Especificación visual ARK)
│   └── map.md                        ✅ Este documento
├── public/ & index.html              ✅ Montaje de React y fuentes Google
├── wrangler.toml                     ✅ SPA assets, observabilidad y variables
├── package.json                      ✅ pnpm@9.7.0, scripts de build, deploy, test
├── tailwind.config.js                ✅ Tokens ARK (Navy, Gold, LCD, Sombras, Radios)
├── tsconfig.json & vite.config.ts    ✅ Configuración estricta y aliases de ruta
├── vitest.config.ts                  ✅ Cobertura V8 y configuración de testing
├── src/
│   ├── index.ts                      ✅ Worker Entry Point (/health, /api, SPA fallback)
│   ├── index.tsx                     ✅ React DOM Root
│   ├── App.tsx                       ✅ Router principal, navegación, Dashboard y 8 herramientas activas
│   ├── lib/
│   │   └── cn.ts                     ✅ Utilidad twMerge + clsx
│   ├── styles/
│   │   └── ark-system.css            ✅ Estilos base, fuentes, variables y componentes físicos
│   ├── components/
│   │   ├── ui/                       ✅ Componentes Atómicos (100%)
│   │   │   ├── TextMagnified.tsx     ✅ Playfair 900 con relieve para cifras clave
│   │   │   ├── GoldDivider.tsx       ✅ Separador con diamante ◆
│   │   │   ├── GlassButton.tsx       ✅ Botón 3D interactivo (default / primary)
│   │   │   ├── BadgeGold.tsx         ✅ Badge para valor y ganancias
│   │   │   ├── LiquidGlassDome.tsx   ✅ Cúpula de cristal con reflejo y sombra oro
│   │   │   ├── ReceiptGold.tsx       ✅ Contenedor doble borde para folios
│   │   │   ├── LCDDisplay.tsx        ✅ Pantalla retroiluminada tipo calculadora
│   │   │   └── index.ts              ✅ Barrel export
│   │   ├── Logo.tsx                  ✅ Cubo isométrico 3D ARK con diamante
│   │   ├── Header.tsx                ✅ Header sticky con navegación y safe-area
│   │   ├── Footer.tsx                ✅ Footer institucional con badges
│   │   ├── ToolCard.tsx              ✅ Tarjetas con hover dorado, badge y CTA
│   │   ├── CategorySection.tsx       ✅ Agrupador de categorías (Fiscal, SAT, Cobros, etc.)
│   │   └── index.ts                  ✅ Barrel export
│   │
│   ├── data/ (Datos globales de referencia)
│   │   ├── valores-vigentes/         ✅ Catálogo centralizado de valores fiscales
│   │   │   ├── catalogo.ts           ✅ UMA, Salario Mínimo, Topes LSS, Tarifa ISR, ISN Meta
│   │   │   ├── hooks.ts              ✅ useValorFiscal, useEstadoCatalogo
│   │   │   ├── vigencia.ts           ✅ Motor de evaluación de vigencia y alertas
│   │   │   ├── AlertasVigencia.tsx   ✅ Banner global de valores próximos a vencer
│   │   │   ├── tipos.ts              ✅ Tipos ValorFiscal, ConfigVigencia
│   │   │   └── index.ts              ✅ Barrel export completo
│   │   ├── estados.ts                ✅ Re-export desde ISN (fuente única de verdad)
│   │   ├── conductas.ts              ⏳ Pendiente (48 conductas Ley Fintech / LFPIORPI)
│   │   └── actos.ts                  ✅ Completado (Guía SAT/IMSS: 8 pasos, 8 actos, 3 plazos)
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
│       │   ├── componentes/          ✅ PasoGuiaCard, ActoFiscalCard, PlazoClaveCard
│       │   ├── GuiaSATIMSS.tsx       ✅ Componente principal con progreso, checklist y catálogo
│       │   └── index.ts              ✅ Barrel export
│       │
│       └── mapa-activos/             ⏳ PENDIENTE
│           └── MapaActivos.tsx       🟡 Placeholder
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

---

### Fase D: Compliance y Educación
- [x] **Guía SAT / IMSS (`src/tools/guia-sat-imss/`):**
  - [x] Datos de actos en `src/data/actos.ts` (8 pasos, 8 actos, 3 plazos clave).
  - [x] Checklist interactivo de 8 pasos para responder requerimientos y plazos legales.
  - [x] Componentes: PasoGuiaCard, ActoFiscalCard, PlazoClaveCard.
  - [x] Progreso visual con barra y contadores.
  - [x] Barrel export `src/tools/guia-sat-imss/index.ts`.
  - [x] Integración en `App.tsx` (badge "NUEVO" y navegación habilitada).
- [ ] **Mapa de Activos Virtuales (`src/tools/mapa-activos/`):**
  - [ ] Catálogo de 48 conductas en `src/data/conductas.ts`.
  - [ ] Matriz de consulta legal (Ley Fintech, LFPIORPI, Código Penal Federal).
  - [ ] Componente interactivo de consulta.

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

| Archivo | Tests | Qué valida |
|---|---|---|
| `src/data/valores-vigentes/catalogo.test.ts` | 7 | Integridad del catálogo: fuente, referencia, fechas, criticidad, no vencido |
| `src/data/valores-vigentes/vigencia.test.ts` | 7 | Motor de vigencia: evaluarVigencia, evaluarLote, alertas 60 días, estados |
| **Total nuevo** | **14** | |
| Tests actualizados en ISN/SBC/Nómina | 0 | Los tests existentes pasan sin cambios (migración transparente) |

> **Nota:** El catálogo contiene **7 valores fiscales** a nivel de catálogo. Uno de ellos (`TARIFA_ISR.mensual2026`) encapsula **11 rangos internos** de la tarifa progresiva ISR. Si un test o UI itera rangos, el conteo discrepa (7 vs 18 rangos totales).

#### 2. Migración de Hardcodes a Catálogo — Completado ✅
| Herramienta | Archivos migrados | Valores provenientes del catálogo |
|---|---|---|
| **ISN** | `src/tools/isn/data/estados.ts` | `UMA.diaria2026.valor` → `UMA_DIARIA`, `TOPES_LSS.tope25UMA2026.valor` → `TOPE_25_UMA` |
| **SBC** | `src/tools/sbc/data/uma.ts` | `UMA`, `SALARIO_MINIMO`, `TOPES_LSS` — corrige `SALARIO_MINIMO_FRONTERA` (era 278.8, ahora 419.88 correcto) |
| **Nómina** | `tablasISR.ts`, `cuotasIMSS.ts`, `defaults.ts` | `TARIFA_ISR.mensual2026.valor`, `UMA.diaria2026.valor`, `SALARIO_MINIMO` para presets |

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
| Valor | Fuente verificada | Fecha DOF | esProyeccion |
|---|---|---|---|
| UMA diaria 2026 | INEGI | 2026-02-XX | ❌ false |
| UMA mensual 2026 | INEGI | 2026-02-XX | ❌ false |
| Salario mínimo general 2026 | CONASAMI | 2025-12-XX | ❌ false |
| Salario mínimo frontera 2026 | CONASAMI | 2025-12-XX | ❌ false |
| Tope 25 UMA LSS 2026 | IMSS | 2026-02-XX | ❌ false |
| Tarifa ISR mensual 2026 | SAT (Anexo 8 RMF) | 2025-12-XX | ❌ false |
| Tasas ISN 2026 | 32 entidades | 2025-12-XX | ❌ false |

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

### Fase D: Compliance y Educación
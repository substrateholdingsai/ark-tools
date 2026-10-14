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
| **Pruebas unitarias** | 89/89 pasadas (100% éxito) |
| **Typecheck (TypeScript)** | 0 errores (modo estricto) |
| **Build Vite (SPA)** | 100% funcional (~12s) |
| **Deploy Cloudflare Workers** | Activo y sincronizado en producción |
| **Herramientas en Producción** | 7 de 8 (ISN, SBC, Nómina, Conversor XML, Validador XML, Links de Pago Clip y Leasing) |
| **Siguiente en Pipeline** | Guía SAT / IMSS (Fase D) |

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
│   ├── App.tsx                       ✅ Router principal, navegación, Dashboard y placeholders
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
│   │   ├── estados.ts                🟡 Placeholder (se re-exportará desde ISN)
│   │   ├── conductas.ts              ⏳ Pendiente (48 conductas Ley Fintech / LFPIORPI)
│   │   └── actos.ts                  ⏳ Pendiente (Actos de fiscalización SAT / IMSS)
│   │
│   └── tools/ (Módulos de herramientas)
│       │
│       ├── isn/                      ✅ 100% COMPLETADA Y DESPLEGADA
│       │   ├── types.ts              ✅ Tipos de datos
│       │   ├── data/estados.ts       ✅ 32 estados con tasas 2026 y fundamentos
│       │   ├── lib/calcularISN.ts    ✅ Lógica de cálculo y formateo
│       │   ├── lib/calcularISN.test.ts ✅ 19 tests unitarios pasados
│       │   ├── lib/exportarCSV.ts    ✅ Generador de Excel/CSV con BOM UTF-8
│       │   ├── components/           ✅ EstadoSelector, BaseInput, PercepcionesTable, ResumenISN
│       │   ├── CalculadoraISN.tsx    ✅ Componente principal interactivo
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── sbc/                      ✅ 100% COMPLETADA Y DESPLEGADA
│       │   ├── types.ts              ✅ Tipos de datos
│       │   ├── data/uma.ts           ✅ UMA 2026 ($113.14), tope 25 UMAs, salario mínimo frontera
│       │   ├── lib/calcularSBC.ts    ✅ Lógica del factor de integración y topes LSS
│       │   ├── lib/calcularSBC.test.ts ✅ 16 tests unitarios pasados
│       │   ├── components/           ✅ ParametrosCard, RangoVisual, DesgloseTable, ResultadoSBC, ExplicacionSBC
│       │   ├── CalculadoraSBC.tsx    ✅ Componente principal interactivo
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── nomina/                   ✅ 100% COMPLETADA Y DESPLEGADA
│       │   ├── types.ts              ✅ Tipos para ISR, IMSS obrero y sueldo neto
│       │   ├── data/periodos.ts      ✅ Períodos diario, semanal, quincenal, mensual
│       │   ├── data/tablasISR.ts     ✅ Tarifa mensual 2026 y tabla de subsidio al empleo
│       │   ├── data/cuotasIMSS.ts    ✅ Ramas de aseguramiento obrero
│       │   ├── data/defaults.ts      ✅ Valores por defecto y presets de sueldo
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
│       │   ├── lib/clipClient.ts     ✅ Integración Clip API, comisiones y WhatsApp
│       │   ├── lib/clipClient.test.ts✅ 10 tests unitarios pasados
│       │   ├── components/           ✅ FormularioCobro, DesgloseComisionCard, LinkGeneradoCard, HistorialCobrosTable
│       │   ├── GeneradorSPEI.tsx     ✅ Componente interactivo de cobros
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── leasing/                  ✅ 100% COMPLETADA
│       │   ├── types.ts              ✅ Tipos para proyección, cohortes y LTV
│       │   ├── lib/calcularLeasing.ts✅ Motor matemático MRR, ARR y métricas SaaS
│       │   ├── lib/calcularLeasing.test.ts ✅ 5 tests unitarios pasados
│       │   ├── lib/exportarProyeccion.ts ✅ Exportador de proyección a CSV UTF-8
│       │   ├── components/           ✅ ParametrosLeasingCard, ResultadoLeasingCard, TablaProyeccionMensual
│       │   ├── CalculadoraLeasing.tsx✅ Componente interactivo con presets
│       │   └── index.ts              ✅ Barrel export
│       │
│       ├── guia-sat-imss/            ⏳ PENDIENTE
│       │   └── GuiaSATIMSS.tsx       🟡 Placeholder
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
- [ ] **Guía SAT / IMSS (`src/tools/guia-sat-imss/`):**
  - [ ] Datos de actos en `src/data/actos.ts`.
  - [ ] Checklist interactivo de 8 pasos para responder requerimientos y plazos legales.
- [ ] **Mapa de Activos Virtuales (`src/tools/mapa-activos/`):**
  - [ ] Catálogo de 48 conductas en `src/data/conductas.ts`.
  - [ ] Matriz de consulta legal (Ley Fintech, LFPIORPI, Código Penal Federal).

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
- **Pruebas unitarias totales:** Incrementaron de 59 a **89 tests**, todos pasando (100% de éxito).
- **Cobertura de herramientas:** 7 de 8 herramientas funcionales al 100% (87.5% de avance de la plataforma).
- **Integridad de tipos:** 0 errores en `tsc --noEmit`.
- **Compilación de producción:** `pnpm build` generado limpiamente en `dist/`.

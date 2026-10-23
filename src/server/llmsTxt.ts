/**
 * ARK TOOLS — Generador de /llms.txt y /llms-full.txt (GEO Engine)
 *
 * Genera documentos en Markdown puro para motores de búsqueda de IA,
 * crawlers (Perplexity, GPTBot, ClaudeBot) y agentes autónomos.
 * Vinculado dinámicamente al Catálogo Oficial de Valores Fiscales DOF 2026.
 */

import { CATALOGO_2026 } from '../data/valores-vigentes/catalogo';
import { CATALOGO_HERRAMIENTAS, TOTAL_HERRAMIENTAS } from '../data/catalogo-herramientas';
import { CURRENT_CATALOG_VERSION } from './d1Api.expediente';

function obtenerValor(id: string, fallback: number): number {
  const item = CATALOGO_2026.find((v) => v.id === id);
  return typeof item?.valor === 'number' ? item.valor : fallback;
}

function fmt(val: number): string {
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const UMA_DIARIA = obtenerValor('UMA_DIARIA_2026', 117.31);
const UMA_MENSUAL = obtenerValor('UMA_MENSUAL_2026', 3566.22);
const SMG = obtenerValor('SALARIO_MINIMO_GENERAL_2026', 315.04);
const SMZLFN = obtenerValor('SALARIO_MINIMO_FRONTERA_2026', 440.87);
const TOPE_SBC_25_UMA = obtenerValor('TOPE_SBC_25_UMA_2026', 2932.75);

/**
 * Renderiza el catálogo agrupado por categoría conservando el orden de aparición.
 */
function renderCatalogoHerramientas(): string {
  const categorias: string[] = [];
  for (const herramienta of CATALOGO_HERRAMIENTAS) {
    if (!categorias.includes(herramienta.categoria)) {
      categorias.push(herramienta.categoria);
    }
  }

  return categorias
    .map((categoria, indice) => {
      const items = CATALOGO_HERRAMIENTAS.filter((h) => h.categoria === categoria)
        .map((h) => `- **${h.nombre}:** ${h.descripcion}`)
        .join('\n');
      return `### ${indice + 1}. ${categoria}\n${items}`;
    })
    .join('\n\n');
}

/**
 * Genera /llms.txt (Índice conciso, < 2,000 tokens)
 */
export function generateLlmsTxt(): string {
  return `# ARK TOOLS — Suite Fiscal, Laboral y de Compliance MX (DOF 2026)

> Plataforma B2B determinista y auditable para despachos contables, auditores y áreas de nómina en México. Ejecuta cierres de nómina masivos, cálculos laborales (LFT/LSS/LISR), timbrado y validación CFDI 4.0, y emite Papeles de Trabajo Oficiales tamaño Carta con Sello Criptográfico SHA-256 y verificación pública vía QR (Art. 28 CFF). Procesamiento Zero-Trust en navegador sin solicitar CIEC ni e.firma.

- **URL de Producción:** https://tools.arksystems.site
- **Mantenedor:** Ark Systems / Substrate Holdings LLC
- **Jurisdicción:** México (Legislación Federal y 32 Entidades Federativas)
- **Vigencia Normativa:** Catálogo Oficial DOF 2026 (\`${CURRENT_CATALOG_VERSION}\`)
- **Contacto / Soporte:** WhatsApp +52 56 5706 2511 | pavel@arksystems.site
- **Especificación Técnica Extendida:** https://tools.arksystems.site/llms-full.txt

## Parámetros Oficiales Vigentes en el Motor (DOF 2026)
- **UMA Diaria 2026:** $${fmt(UMA_DIARIA)} MXN (Mensual: $${fmt(UMA_MENSUAL)} MXN) — Fuente: INEGI / DOF 09/01/2026
- **Salario Mínimo General (SMG) 2026:** $${fmt(SMG)} MXN — Fuente: CONASAMI / DOF 09/12/2025
- **Salario Mínimo Zona Libre de la Frontera Norte (SMZLFN) 2026:** $${fmt(SMZLFN)} MXN — Fuente: CONASAMI / DOF 09/12/2025
- **Tope Salario Base de Cotización (SBC 25 UMAs):** $${fmt(TOPE_SBC_25_UMA)} MXN diarios — Fuente: Art. 28 LSS / IMSS
- **Tarifa ISR:** Anexo 8 RMF 2026 (Art. 96 LISR) progresiva de 11 rangos + Subsidio para el Empleo vigente

## Catálogo de las ${TOTAL_HERRAMIENTAS} Herramientas en Producción

${renderCatalogoHerramientas()}

## Verificación Pública de Autenticidad (API Abierta)
Cualquier agente de IA, auditor o tercero puede verificar la autenticidad e integridad de un cálculo o Papel de Trabajo emitido por ARK TOOLS sin autenticación:
- **Endpoint JSON:** \`GET https://tools.arksystems.site/api/expedientes/verify?hash={sha256_hash}\`
- **Portal Visual:** \`https://tools.arksystems.site/?verify={sha256_hash}\`
`;
}

/**
 * Genera /llms-full.txt (Contexto técnico extendido: fórmulas y fundamentos legales)
 */
export function generateLlmsFullTxt(): string {
  const base = generateLlmsTxt();

  return `${base}
---

# ANEXO TÉCNICO Y FUNDAMENTOS MATEMÁTICOS / LEGALES

## 1. Salario Base de Cotización (SBC IMSS) y Factor de Integración

### Fundamento Legal
- Artículos 27, 28, 29 y 30 de la Ley del Seguro Social (LSS).
- Artículo 76 de la Ley Federal del Trabajo (Reforma de Vacaciones Dignas).
- Artículo 80 de la LFT (Prima Vacacional mínima del 25%).
- Artículo 87 de la LFT (Aguinaldo mínimo de 15 días).

### Fórmula del Factor de Integración
\`\`\`
Factor = 1 + (Días_Aguinaldo / 365) + (Días_Vacaciones * Prima_Vacacional_Pct / 365)
\`\`\`

### Tabla de Vacaciones Dignas (Art. 76 LFT) y Factores Mínimos de Ley
- Año 1: 12 días de vacaciones -> Factor = 1 + 15/365 + (12 * 0.25)/365 = 1.0493
- Año 2: 14 días de vacaciones -> Factor = 1 + 15/365 + (14 * 0.25)/365 = 1.0507
- Año 3: 16 días de vacaciones -> Factor = 1 + 15/365 + (16 * 0.25)/365 = 1.0521
- Año 4: 18 días de vacaciones -> Factor = 1 + 15/365 + (18 * 0.25)/365 = 1.0534
- Año 5: 20 días de vacaciones -> Factor = 1 + 15/365 + (20 * 0.25)/365 = 1.0548
- Años 6 a 10: 22 días de vacaciones -> Factor = 1.0562
- Años 11 a 15: 24 días de vacaciones -> Factor = 1.0575
- Años 16 a 20: 26 días de vacaciones -> Factor = 1.0589
- Años 21 a 25: 28 días de vacaciones -> Factor = 1.0603
- Años 26 a 30: 30 días de vacaciones -> Factor = 1.0616
- Años 31 a 35: 32 días de vacaciones -> Factor = 1.0630

### Topes de Cotización IMSS (Art. 28 LSS)
- Límite inferior: Salario Mínimo General de la zona del trabajador ($${fmt(SMG)} MXN o $${fmt(SMZLFN)} MXN).
- Límite superior: 25 veces el valor de la UMA diaria vigente ($25 * $${fmt(UMA_DIARIA)} = $${fmt(TOPE_SBC_25_UMA)} MXN diarios).

---

## 2. Mecánica de Retención de ISR por Sueldos y Salarios (Art. 96 LISR)

### Procedimiento
1. **Base Gravable:** Sueldo Bruto del período menos conceptos exentos conforme al Art. 93 LISR.
2. **Ubicación en Tarifa (Anexo 8 RMF 2026):** Localizar el rango donde \`Límite Inferior <= Base Gravable <= Límite Superior\`.
3. **Excedente del Límite Inferior:** \`Excedente = Base Gravable - Límite Inferior\`.
4. **Impuesto Marginal:** \`Impuesto Marginal = Excedente * Tasa %\`.
5. **ISR Antes de Subsidio:** \`ISR Determinado = Cuota Fija + Impuesto Marginal\`.
6. **Subsidio para el Empleo:** Aplicación del subsidio acreditable vigente.
7. **Retención Neta:** \`ISR a Retener = max(0, ISR Determinado - Subsidio para el Empleo)\`.

---

## 3. Finiquitos y Liquidaciones conforme a la LFT

### Conceptos de Finiquito (Renuncia Voluntaria o Término de Contrato)
1. **Aguinaldo Proporcional (Art. 87 LFT):** \`(Días trabajados en el año natural / 365) * 15 * Salario Diario\`.
2. **Vacaciones Proporcionales (Art. 76 y 79 LFT):** \`(Días trabajados en el año de servicios / 365) * Días Vacaciones según Art. 76 * Salario Diario\`.
3. **Prima Vacacional (Art. 80 LFT):** \`Vacaciones Proporcionales * 25%\` (o % contractual superior).
4. **Prima de Antigüedad (Art. 162 LFT):**
   - Aplica en renuncia voluntaria si la antigüedad es >= 15 años.
   - Aplica en todo despido (justificado o injustificado) sin importar antigüedad.
   - Cuantía: 12 días por cada año completo de servicio (más proporción de meses y días).
   - Base salarial: Salario Diario del trabajador, pero **topado al doble del Salario Mínimo General vigente** ($2 * $${fmt(SMG)} = $${fmt(SMG * 2)} MXN) conforme al Art. 486 LFT.

### Indemnizaciones por Despido Injustificado (Art. 48 y 50 LFT)
1. **Indemnización Constitucional de 3 Meses:** \`90 días * Salario Diario Integrado (SDI)\`.
2. **20 Días por Año Trabajado (Art. 50 Fracc. II LFT):** Aplica en negativa de reinstalación y contratos por tiempo indeterminado (\`20 días * Años trabajados * SDI\`).

---

## 4. RESICO — Pagos Provisionales Mensuales (Arts. 113-E a 113-J y 206 a 215 LISR)

### Persona Física (Régimen Simplificado de Confianza)
1. **Base:** Ingresos cobrados del mes (sin deducción de gastos para ISR).
2. **Tasa progresiva:** 1.00% hasta $25,000; 1.10% hasta $50,000; 1.50% hasta $83,300; 2.00% hasta $208,300; 2.50% hasta $3,500,000 MXN.
3. **Acreditamiento de retención PM:** ISR retenido por personas morales al 1.25% (Art. 113-J LISR), sin generar saldo negativo a pagar.
4. **IVA (Art. 5 LIVA):** IVA trasladado cobrado menos IVA acreditable pagado y retenciones de IVA.
5. **Tope de ingresos:** $3,500,000 MXN anuales, con umbrales preventivos (seguro, preventivo 75%, crítico 90%, excedido).

### Persona Moral (Flujo de Efectivo)
1. **Base gravable:** Ingresos cobrados − deducciones autorizadas pagadas − PTU amortizable − pérdidas fiscales pendientes.
2. **Tasa corporativa:** 30.0% (Art. 211 LISR) sobre la base acumulada.
3. **Acreditamientos:** Pagos provisionales previos y retenciones acumuladas.
4. **Tope de ingresos:** $35,000,000 MXN anuales.

---

## 5. Balance General Comparativo — Análisis Horizontal y Vertical

### Procedimiento
1. **Cuadre patrimonial:** \`Total Activo = Total Pasivo + Total Patrimonio\`, validado con tolerancia de $0.02 MXN. Resultado: CUADRADO / NO CUADRADO.
2. **Análisis Horizontal (AH %):** \`AH% = ((Monto Actual - Monto Anterior) / |Monto Anterior|) * 100\`. Si el monto anterior es 0, la variación se reporta como no definida para evitar división por cero.
3. **Análisis Vertical (AV %):** \`AV% = (Monto de la Cuenta / Total de su Grupo Patrimonial) * 100\`.
4. **Variación absoluta:** \`Variación $ = Monto Actual - Monto Anterior\`.
5. **Naturaleza y jerarquía:** Activo (circulante / no circulante), Pasivo (circulante / no circulante) y Patrimonio, con clasificación por rubro y advertencias explícitas para cuentas no clasificadas.

---

## 6. Actualización y Recargos Fiscales (Arts. 17-A y 21 CFF & LIF Art. 8)

### Procedimiento Determinista Legal
1. **Factor de Actualización (Art. 17-A CFF):**
   \`\`\`
   Factor = INPC(Mes anterior al más reciente del pago) / INPC(Mes anterior al más antiguo del vencimiento)
   \`\`\`
   - Truncado estrictamente al diezmilésimo (4 decimales) sin redondeo.
   - Regla de no-deflación: Si el factor resultante es menor a 1, se aplica 1.0000 (Art. 17-A párrafo 6 CFF).
   - Impuesto Actualizado = \`Impuesto Histórico * Factor\`.
   - Efecto Inflacionario = \`Impuesto Actualizado - Impuesto Histórico\`.
2. **Recargos por Mora (Art. 21 CFF):**
   - Causación por cada mes o fracción de mes que transcurra desde la fecha de vencimiento hasta la fecha de pago.
   - Tasa oficial: 1.47% mensual según la Ley de Ingresos de la Federación (0.98% prórroga + 50% incremento por mora).
   - Tasa acumulada = \`Meses Mora * 1.47%\`.
   - Monto de Recargos = \`Impuesto Actualizado * (Tasa Acumulada / 100)\`.
3. **Total Deuda a Liquidar:** \`Impuesto Actualizado + Recargos por Mora\`.

---

## 8. Continuación Voluntaria / Modalidad 40 (Acuerdo DOF 21/10/2026)

### Fundamento Legal
- Artículos 167, 171 y 218 de la Ley del Seguro Social (LSS 1973).
- Acuerdo ACDO.AS2.HCT.101026/302.P.DG del Consejo Técnico del IMSS (DOF 21/10/2026).
- Artículos 168 y Segundo Transitorio LSS (Reforma Pensiones).

### Reglas Deterministas de Cálculo
1. **Tope de Registro Restringido:** \`min(Último SBC registrado + 1 UMA diaria, 25 UMAs)\`.
2. **Cuota Mensual 2026:** Tasa del 14.438% aplicada sobre el SBC pactado y base mensual de 30.4 días.
3. **Pensión Ley 73:** Cuantía Básica + Incrementos Anuales (semanas > 500) ajustado por edad (Art. 171 LSS), asignación familiar (15%) y actualización Decreto Fox (11%).

---

## 9. Estándar de Integridad SHA-256 y Verificación Pública

Cada cálculo procesado en ARK TOOLS genera un hash SHA-256 canónico determinista:
\`\`\`
Hash = SHA-256(CanonicalJson({ inputs, outputs, catalogVersion: '${CURRENT_CATALOG_VERSION}' }))
\`\`\`

La API pública \`/api/expedientes/verify?hash={hash}\` responde:
\`\`\`json
{
  "verified": true,
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "tool_id": "cierre-nomina",
  "catalog_version": "${CURRENT_CATALOG_VERSION}",
  "created_at": "2026-10-16T20:00:00.000Z",
  "despacho": "Despacho Fiscal S.C."
}
\`\`\`
`;
}

/**
 * Genera robots.txt optimizado para motores y crawlers de IA
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

# Directivas para Crawlers y Agentes de Inteligencia Artificial (GEO)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: cohere-ai
Allow: /

# Rutas públicas y especificaciones para LLMs
Sitemap: https://tools.arksystems.site/llms.txt
Sitemap: https://tools.arksystems.site/llms-full.txt
`;
}

/**
 * CATÁLOGO CANÓNICO DE HERRAMIENTAS DE ARK LEDGER
 *
 * ÚNICA fuente de verdad del catálogo de la suite. Tanto el motor GEO
 * (`/llms.txt`) como el system prompt del asistente de IA (Noah) derivan de aquí el
 * conteo, los identificadores y las descripciones publicadas.
 *
 * REGLAS DE MANTENIMIENTO:
 * 1. Cada herramienta registrada aquí debe existir en el router de `src/App.tsx`
 *    con el mismo `id` (verificado por `catalogo-herramientas.test.ts`).
 * 2. Al agregar o retirar una herramienta, actualiza este archivo en el mismo
 *    commit. El conteo y los títulos publicados se derivan automáticamente.
 * 3. Las descripciones son texto público para agentes IA: sin datos de clientes
 *    ni referencias a credenciales o variables de entorno.
 */

import { CATALOGO_2026 } from './valores-vigentes/catalogo';

export interface HerramientaSuite {
  /** Identificador de la herramienta; debe coincidir con el `ToolId` de `src/App.tsx`. */
  id: string;
  /** Nombre público de la herramienta. */
  nombre: string;
  /** Categoría bajo la que se agrupa en el catálogo publicado. */
  categoria: string;
  /** Descripción pública para agentes IA y motores de descubrimiento. */
  descripcion: string;
}

function obtenerValor(id: string, fallback: number): number {
  const item = CATALOGO_2026.find((v) => v.id === id);
  return typeof item?.valor === 'number' ? item.valor : fallback;
}

const SMG = obtenerValor('SALARIO_MINIMO_GENERAL_2026', 315.04);

export const CATALOGO_HERRAMIENTAS: HerramientaSuite[] = [
  {
    id: 'cierre-nomina',
    nombre: 'Cierre de Nómina Masivo (Batch DOF)',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion:
      'Ingesta de plantillas CSV/Excel y módulo de Cruce Laboral-Fiscal (CFDI Nómina vs. Reloj Checador Art. 132 LFT). Determina simultáneamente por colaborador ISR Art. 96, Subsidio al Empleo, factor de integración, cuotas IMSS obrero e ISN estatal de las 32 entidades. Audita discrepancias de jornada y horas extras, emitiendo Cédula Concentradora y Cédula de Cruce con Sello SHA-256 + QR descargable en PDF y Layout de Dispersión Bancaria.',
  },
  {
    id: 'nomina',
    nombre: 'Calculadora de Nómina Rápida 2026',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion:
      'Cálculo de sueldo bruto a neto (periodicidad diaria, semanal, quincenal, mensual) con desglose de retención de ISR y cuotas obreras IMSS.',
  },
  {
    id: 'sbc',
    nombre: 'Calculadora SBC (Salario Base de Cotización IMSS)',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion:
      'Factor de integración exacto conforme a Arts. 27 y 28 LSS considerando prestaciones de ley y la reforma de Vacaciones Dignas (Art. 76 LFT).',
  },
  {
    id: 'isn',
    nombre: 'Calculadora ISN (Impuesto Sobre Nómina)',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion:
      'Tasas nominales, sobretasas de fomento, deducciones y fundamentos legales para las 32 entidades federativas de México.',
  },
  {
    id: 'finiquitos',
    nombre: 'Calculadora de Finiquitos y Liquidaciones LFT',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion: `Determinación de partes proporcionales (aguinaldo, vacaciones, prima vacacional), prima de antigüedad topada a 2 veces el SMG ($${(SMG * 2).toFixed(2)} MXN) conforme al Art. 162 LFT, e indemnización constitucional (Arts. 48, 50 y 123 CPEUM).`,
  },
  {
    id: 'resico',
    nombre: 'Calculadora y Cédula RESICO 2026',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion:
      'Determinador de pagos provisionales mensuales del Régimen Simplificado de Confianza: Persona Física (Arts. 113-E a 113-J LISR, tasas 1.0% a 2.5%, tope $3,500,000 MXN y retención 1.25% de personas morales) y Persona Moral (Arts. 206 a 215 LISR, flujo de efectivo al 30%). Liquida IVA neto con acreditamiento (Art. 5 LIVA) y emite Cédula Oficial Carta con Sello SHA-256 + QR verificable.',
  },
  {
    id: 'balance-general',
    nombre: 'Balance General Comparativo',
    categoria: 'Patrimonial y Análisis Financiero',
    descripcion:
      'Análisis comparativo de Balance General (Ejercicio Actual vs. Anterior) con Análisis Horizontal y Vertical, cuadre patrimonial A=P+C, ingesta CSV/Excel, exportación CSV con BOM UTF-8 y Papel de Trabajo Oficial con Sello SHA-256 + QR de verificación pública.',
  },
  {
    id: 'xml-excel',
    nombre: 'Conversor XML a Excel (CFDI 4.0 / 3.3)',
    categoria: 'SAT y Auditoría CFDI 4.0 (100% Local en Navegador)',
    descripcion:
      'Extracción masiva cliente-side de hasta 200 XMLs a CSV con BOM UTF-8 (compatibilidad Excel). No envía archivos a servidores para garantizar confidencialidad bancaria y contable.',
  },
  {
    id: 'validador',
    nombre: 'Validador y Auditor de XMLs',
    categoria: 'SAT y Auditoría CFDI 4.0 (100% Local en Navegador)',
    descripcion:
      'Motor de 8 reglas técnicas (Anexo 20 RMF), consistencia de régimen fiscal, cuadratura matemática y detección preventiva contra listas negras del SAT CFF Art. 69-B (EFOS/EDOS).',
  },
  {
    id: 'timbrado',
    nombre: 'Timbrado de Facturas CFDI 4.0 vía Alegra / Quadrum PAC',
    categoria: 'Cobros y Facturación Fiscal B2B',
    descripcion:
      'Emisión y timbrado legal de CFDI 4.0 ante el SAT sin salir de ARK LEDGER. Encriptación AES-GCM en reposo de API keys por despacho, soporte multi-cuenta y descarga de XML y PDF timbrados.',
  },
  {
    id: 'spei',
    nombre: 'Generador de Enlaces de Pago Clip / SPEI',
    categoria: 'Cobros y Facturación Fiscal B2B',
    descripcion:
      'Cálculo automático de comisiones (3.6% + IVA y sobretasas por Meses Sin Intereses) y generación de links de pago con compartición pre-redactada por WhatsApp.',
  },
  {
    id: 'leasing',
    nombre: 'Simulador de Leasing Tecnológico',
    categoria: 'Cobros y Facturación Fiscal B2B',
    descripcion:
      'Proyección financiera de suscripciones B2B ($500 setup + $2,500/mes) con cálculo de MRR, ARR, LTV, tasa de retención y análisis de cohortes.',
  },
  {
    id: 'guia-sat-imss',
    nombre: 'Guía Interactiva SAT / IMSS',
    categoria: 'Compliance y Defensa Jurídica',
    descripcion:
      '8 pasos de atención y defensa contra actos de molestia, catálogo de 8 actos de fiscalización, plazos legales y generador de escritos de respuesta.',
  },
  {
    id: 'auditor-cobranza',
    nombre: 'Auditoría Legal de Cobranza',
    categoria: 'Compliance y Defensa Jurídica',
    descripcion:
      'Evaluación preventiva de 43 conductas tipificadas conforme a CONDUSEF, Código Penal Federal y Ley Fintech, con 12 comparadores de consistencia Contrato vs CRM.',
  },
  {
    id: 'mapa-activos',
    nombre: 'Mapa de Regulación de Activos Virtuales',
    categoria: 'Compliance y Defensa Jurídica',
    descripcion:
      'Matriz normativa conforme a LFPIORPI y Ley Fintech para contadores y asesores, con umbrales antilavado en UMAs (210 UMA para reporte, 4 UMA para comisiones).',
  },
  {
    id: 'anexo24',
    nombre: 'Motor de Conciliación Anexo 24',
    categoria: 'SAT y Auditoría CFDI 4.0 (100% Local en Navegador)',
    descripcion:
      'Generador automático de pólizas contables mediante cruce de CFDI vs Catálogo y Balanza del Anexo 24. Descarte obligatorio de facturas canceladas con Metadata del SAT, validación de cuadre Debe = Haber, exportación CSV con BOM UTF-8, layout Contpaqi/COI y Papel de Trabajo con Sello SHA-256 + QR.',
  },
  {
    id: 'monitor-lfpiorpi',
    nombre: 'Monitor de Actividades Vulnerables LFPIORPI',
    categoria: 'Compliance y Defensa Jurídica',
    descripcion:
      'Motor determinista antilavado. Ingesta local de sábanas de cobranza y evaluación continua contra umbrales oficiales en UMA 2026 con regla de acumulación de 6 meses (Art. 17 LFPIORPI). Semáforo de riesgo por cliente (Identificación y Aviso SAT/UIF) y Papel de Trabajo con Sello SHA-256.',
  },
  {
    id: 'recargos',
    nombre: 'Calculadora de Actualización y Recargos Fiscales (CFF)',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion:
      'Determinación de actualización por inflación (Art. 17-A CFF) y recargos por mora (Art. 21 CFF y LIF al 1.47% mensual). Motor cloud-native conectado a la serie de INPC del DOF, factor truncado a 4 decimales, desglose analítico mes a mes y emisión de Papel de Trabajo Oficial con Sello SHA-256 + QR.',
  },
  {
    id: 'modalidad40',
    nombre: 'Simulador de Modalidad 40 (Criterio DOF 2026)',
    categoria: 'Fiscal y Laboral (Expediente Único + Cédula Oficial PDF/QR)',
    descripcion:
      'Proyección actuarial de pensión bajo el Régimen 1973 de la LSS conforme a los Arts. 167 y 218. Aplica la restricción del Acuerdo ACDO.AS2.HCT.101026/302.P.DG (DOF 21/10/2026) que topa el nuevo registro al salario previo más 1 UMA diaria. Calcula cuota mensual (14.438% en 2026), retorno de inversión (ROI) y emite Papel de Trabajo Oficial con Sello SHA-256 + QR.',
  },
  {
    id: 'auditor-cfdi-atipico',
    nombre: 'Detector de Comportamientos Atípicos en CFDI',
    categoria: 'SAT y Auditoría CFDI 4.0 (100% Local en Navegador)',
    descripcion:
      'Auditor forense y preventivo de CFDI 4.0 y 3.3. Ingesta masiva ZIP/XML y cruce automático con Metadata del SAT. Algoritmos estadísticos de Ley de Benford, Z-Score mensual, detección de fraccionamiento de pagos en efectivo (Art. 27 LISR), cancelaciones extemporáneas (Art. 29-A CFF) y cruce con lista negra EFOS (Art. 69-B CFF). Malla mensual de calor, Matriz de Riesgo 5×5 y emisión de Dictamen Ejecutivo con exportación Excel multi-hoja.',
  },
];

/** Total de herramientas de la suite. Se deriva del catálogo: nunca se escribe a mano. */
export const TOTAL_HERRAMIENTAS = CATALOGO_HERRAMIENTAS.length;

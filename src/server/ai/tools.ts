/**
 * ARK LEDGER — AI Tools Catalog
 *
 * Herramientas parametrizadas que el modelo de IA puede invocar.
 * El worker actúa como guardián de seguridad inyectando siempre el `tenant_id`
 * verificado para evitar vulnerabilidades de elevación de privilegios o filtrado de datos.
 */

import type { Env } from '../../index';
import type { AiToolFunction } from './types';
import { makeMcpToolError, type McpToolError } from './mcpErrors';
import { validateFiscalCatalog } from './mcpCatalogGuard';
import { calcularFiniquito } from '../../tools/finiquitos';
import { calcularResicoPF, calcularResicoPM, type MesFiscal } from '../../tools/resico';
import {
  calcularRecargosYActualizacion,
  validarEntradaRecargos,
} from '../../tools/recargos/lib/calcularRecargos';
import {
  simularModalidad40,
  validarParametrosModalidad40,
} from '../../tools/modalidad40/lib/calcularModalidad40';
import { calcularResultadoISN } from '../../tools/isn/lib/calcularISN';
import { ESTADOS } from '../../tools/isn/data/estados';
import { calcularRetencionClinicas } from '../../tools/retencion-clinicas/lib/calcularRetencionClinicas';
import { calcularResultadoSBC } from '../../tools/sbc/lib/calcularSBC';
import { calcularNomina } from '../../tools/nomina/lib/calcularNomina';
import { PERIODOS } from '../../tools/nomina/data/periodos';
import { FACTOR_INTEGRACION_SBC_DEFAULT } from '../../tools/nomina/data/defaults';
import type { ConceptoPercepcion } from '../../tools/isn/types';
import type { ParametrosSBC } from '../../tools/sbc/types';
import type { ParametrosNomina } from '../../tools/nomina/types';
import { TASA_IVA_GENERAL } from '../../data/valores-vigentes/catalogo';
import { listStoredRegulatoryEvents } from '../sentinela/sentinelaWebhook';
import { buildWhatsAppDeepLink } from '../../lib/whatsappStudio';
import { parseStrictBoolean } from '../../lib/parseBoolean';
import {
  getFiscalValuesEnvelope,
  wrapCalcFiniquito,
  wrapCalcIsn,
  wrapCalcModalidad40,
  wrapCalcNomina,
  wrapCalcRecargos,
  wrapCalcResico,
  wrapCalcRetencionClinicas,
  wrapCalcSbc,
} from './mcpCalculationEnvelope';

const TOOL_ALIASES: Record<string, string> = {
  calcular_modalidad_40: 'calc_modalidad40',
  calcular_isn: 'calc_isn',
  calcular_retencion_clinicas: 'calc_retencion_clinicas',
  calcular_sbc: 'calc_sbc',
  calcular_nomina_rapida: 'calc_nomina',
  calcular_recargos_fiscales: 'calc_recargos',
  calcular_finiquito_lft: 'calc_finiquito',
  calcular_resico: 'calc_resico',
};

export const AI_TOOLS_CATALOG: AiToolFunction[] = [
  {
    name: 'calc_modalidad40',
    description:
      'Calcula una proyección bajo la Ley 73 y la cuota de Modalidad 40 (continuación voluntaria del IMSS), con ROI y pensión mensual estimada. Úsalo para estimar cuotas de Modalidad 40 a partir del último SBC. No lo uses para calcular una pensión ya otorgada por el IMSS ni como garantía de derecho a pensión. Las cantidades están en MXN (pesos mexicanos); semanasPrevias y mesesAportacion son enteros; edadJubilacion está entre 60 y 65. Se aplica la Ley del Seguro Social de 1973 (Arts. 164, 167 y 171) y el Acuerdo ACDO.AS2.HCT.101026/302.P.DG (medida temporal vigente desde 21/10/2026, cuyo alcance jurídico está en discusión). El resultado es una referencia de cálculo, NO es un dictamen del IMSS; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        ultimoSbc: {
          type: 'number',
          description:
            'Último Salario Base de Cotización registrado al causar baja patronal en MXN.',
        },
        sbcDeseado: {
          type: 'number',
          description: 'Salario diario deseado para cotizar en Modalidad 40 en MXN.',
        },
        semanasPrevias: {
          type: 'number',
          description: 'Semanas cotizadas acumuladas ante el IMSS.',
        },
        mesesAportacion: {
          type: 'number',
          description: 'Meses a cotizar en Continuación Voluntaria (12 a 60 meses).',
          minimum: 12,
          maximum: 60,
        },
        edadJubilacion: {
          type: 'number',
          description: 'Edad proyectada de retiro (60 a 65 años).',
          minimum: 60,
          maximum: 65,
        },
        asignacionFamiliar: {
          type: 'boolean',
          description: 'Si cuenta con cónyuge o solicita ayuda asistencial por soledad.',
        },
      },
      required: [
        'ultimoSbc',
        'sbcDeseado',
        'semanasPrevias',
        'mesesAportacion',
        'edadJubilacion',
        'asignacionFamiliar',
      ],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'calc_isn',
    description:
      'Calcula el Impuesto Sobre Nómina (ISN) estatal sobre la base gravable usando la tasa del estado y las reglas del ejercicio fiscal. Úsalo para estimar el ISN a retener o pagar de una nómina. No lo uses para ISR federal ni para cuotas patronales del IMSS. Las cantidades están en MXN (pesos mexicanos); el ejercicio es 2025 o 2026; el estado se identifica por código (ej. "YUC"); numEmpleados está entre 1 y 50 (si se omite, se aplica la tasa general sin el estímulo micro/pequeña). Se aplica la Ley de Hacienda del estado correspondiente (para Yucatán, Arts. 21 al 27 de la LGHY, incluido su Art. 24). El resultado es una referencia de cálculo, NO es un dictamen fiscal; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        baseGravable: {
          type: 'number',
          description: 'Suma de percepciones gravadas (base del ISN) en MXN.',
          minimum: 0,
        },
        tasa: {
          type: 'number',
          description:
            'Tasa de respaldo para estados sin entrada en el catálogo estatal; la tasa oficial declarada para el estado seleccionado prevalece cuando existe.',
          minimum: 0,
          maximum: 100,
        },
        estadoId: {
          type: 'string',
          description: 'ID del estado (ej. "YUC", "CDMX", "JAL").',
        },
        ejercicio: {
          type: 'number',
          description: 'Ejercicio fiscal (2025 o 2026, default 2026).',
          enum: [2025, 2026],
        },
        numEmpleados: {
          type: 'number',
          description: 'Número de trabajadores (1-50 elegible a Decreto 147/2025 en YUC 2026).',
          minimum: 1,
          maximum: 50,
        },
        esMicroPequena2026: {
          type: 'boolean',
          description: 'Si aplica estímulo Decreto 147/2025 para micro/pequeña empresa 2026.',
        },
        esGobiernoEstatal: {
          type: 'boolean',
          description: 'Si corresponde a trabajadores de gobierno estatal (Art. 24 LGHY).',
        },
        aplica27A: {
          type: 'boolean',
          description: 'Si aplica exención 1er año Art. 27-A (no acumulable con Decreto 147/2025).',
        },
      },
      required: ['baseGravable', 'tasa'],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'calc_retencion_clinicas',
    description:
      'Calcula la retención del 2 % sobre honorarios médicos para clínicas y hospitales en Yucatán, el neto a pagar, el impuesto profesional informativo y las fechas límite AAFY-30 / AAFY-31. Úsalo exclusivamente para honorarios médicos en Yucatán. No lo uses para otros estados ni para honorarios que no sean médicos. Las cantidades están en MXN (pesos mexicanos); fechaPago usa el formato YYYY-MM-DD; estadoId debe ser "YUC". Se aplica la Ley General de Hacienda del Estado de Yucatán (Arts. 20-Bis a 20-Quinquies) y el Acuerdo AAFY 12/2026 (III.1.5). El resultado es una referencia de cálculo, NO es un dictamen; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        estadoId: {
          type: 'string',
          description: 'Entidad federativa (exclusivo "YUC").',
          enum: ['YUC'],
        },
        montoHonorarios: {
          type: 'number',
          description: 'Monto bruto de honorarios médicos pagados en MXN.',
          minimum: 0,
        },
        fechaPago: {
          type: 'string',
          description: 'Fecha de pago en formato YYYY-MM-DD.',
        },
      },
      required: ['montoHonorarios', 'fechaPago'],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'calc_sbc',
    description:
      'Calcula el Salario Base de Cotización (SBC) del IMSS: factor de integración por prestaciones, SBC bruto y SBC final aplicando los topes vigentes. Úsalo para determinar la base de cotización al IMSS a partir del salario diario. No lo uses para calcular ISR ni el sueldo neto de un trabajador. Las cantidades están en MXN (pesos mexicanos); salarioDiario es MXN por día; zona es "general" o "frontera" (usar frontera solo para ZLFN). Se aplica la Ley del Seguro Social, Art. 27 (aguinaldo, vacaciones dignas, prima vacacional y topes de 1 SMG a 25 UMAs). El resultado es una referencia de cálculo, NO es un dictamen del IMSS; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        salarioDiario: {
          type: 'number',
          description: 'Salario diario ordinario en MXN.',
          minimum: 0,
        },
        diasVacaciones: {
          type: 'number',
          description: 'Días de vacaciones por antigüedad.',
          minimum: 0,
        },
        primaVacacional: {
          type: 'number',
          description: 'Porcentaje de prima vacacional (default 25).',
          minimum: 0,
          maximum: 100,
        },
        diasAguinaldo: {
          type: 'number',
          description: 'Días de aguinaldo (default 15).',
          minimum: 0,
        },
        zona: {
          type: 'string',
          enum: ['general', 'frontera'],
          description:
            'Zona salarial para límite inferior LSS Art. 28. Default: general (resto del país). Use frontera solo para ZLFN.',
        },
      },
      required: ['salarioDiario'],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'calc_nomina',
    description:
      'Calcula nómina rápida: percepciones brutas, retención ISR con subsidio al empleo, cuotas obreras IMSS y sueldo neto a pagar por período. Úsalo para nómina rápida obrera únicamente, sin cédula ni folio. No lo uses para finiquitos, liquidaciones ni cálculos patronales completos. Las cantidades están en MXN (pesos mexicanos); período es diario, semanal, quincenal o mensual; sueldoBruto es MXN por período. Se aplica la Ley del Impuesto sobre la Renta (Arts. 96 y 152), las Reglas Misceláneas 2026 (Regla 3.12.2; Anexo 8) y la Ley del Seguro Social (Arts. 25, 147, 168 y 211). El resultado es una referencia de cálculo, NO es un dictamen; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        periodo: {
          type: 'string',
          enum: ['diario', 'semanal', 'quincenal', 'mensual'],
          description: 'Período de pago.',
        },
        sueldoBruto: {
          type: 'number',
          description: 'Sueldo bruto del período en MXN.',
          minimum: 0,
        },
        diasTrabajados: {
          type: 'number',
          description: 'Días trabajados (para prorrateo).',
          minimum: 0,
        },
        diasPeriodo: {
          type: 'number',
          description: 'Días del período completo (ej. 30 para mensual).',
          minimum: 1,
        },
        sbcDiario: {
          type: 'number',
          description:
            'SBC diario para IMSS obrero. Si se omite, usa el factor de integración mínimo documentado de la herramienta.',
          minimum: 0,
        },
      },
      required: ['periodo', 'sueldoBruto'],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'calc_recargos',
    description:
      'Calcula la actualización inflacionaria con el INPC (Art. 17-A CFF) y los recargos por mora (Art. 21 CFF; Ley de Ingresos de la Federación: 2024–2025 Art. 8o. fr. I, 2026 Art. 11 fr. I) sobre contribuciones federales omitidas. Úsalo para calcular actualización y recargos de impuestos federales en mora. No lo uses para impuestos estatales salvo Yucatán (tipoRecargo "estatal_yucatan"), ni como cédula oficial de recargos. Las cantidades están en MXN (pesos mexicanos); las fechas usan el formato YYYY-MM-DD; tipoRecargo es "federal" o "estatal_yucatan". El resultado es una referencia de cálculo, NO es un dictamen ni una cédula oficial; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        importeHistorico: {
          type: 'number',
          description: 'Monto del impuesto omitido en MXN.',
          minimum: 0,
        },
        fechaVencimiento: {
          type: 'string',
          description: 'Fecha en que debió pagarse la contribución (ISO YYYY-MM-DD).',
        },
        fechaPago: {
          type: 'string',
          description: 'Fecha de pago real o proyectada (ISO YYYY-MM-DD).',
        },
        tipoRecargo: {
          type: 'string',
          enum: ['federal', 'estatal_yucatan'],
          description:
            'Ámbito del recargo. Default federal; estatal_yucatan permanece fail-closed si no hay tasa oficial.',
        },
      },
      required: ['importeHistorico', 'fechaVencimiento', 'fechaPago'],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'calc_finiquito',
    description:
      'Calcula el finiquito o la liquidación de un trabajador según la Ley Federal del Trabajo: aguinaldo, vacaciones, prima vacacional, prima de antigüedad e indemnizaciones aplicables. Úsalo para cuantificar un finiquito o liquidación al terminar una relación laboral. No lo uses para nómina periódica en curso. Las cantidades están en MXN (pesos mexicanos); las fechas usan el formato YYYY-MM-DD. Se aplica la Ley Federal del Trabajo (Arts. 50, 76, 79, 80, 87, 162 y 486). El resultado es una referencia de cálculo, NO es un dictamen laboral; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        tipoBaja: {
          type: 'string',
          enum: ['finiquito', 'liquidacion'],
          description:
            'Naturaleza de la terminación laboral: "finiquito" (renuncia voluntaria) o "liquidacion" (despido injustificado).',
        },
        fechaIngreso: {
          type: 'string',
          description: 'Fecha de ingreso en formato ISO YYYY-MM-DD.',
        },
        fechaBaja: { type: 'string', description: 'Fecha de baja en formato ISO YYYY-MM-DD.' },
        salarioDiario: {
          type: 'number',
          description: 'Salario diario ordinario en MXN.',
          minimum: 0,
        },
        sdi: {
          type: 'number',
          description: 'Salario Diario Integrado para indemnizaciones en MXN.',
          minimum: 0,
        },
        vacacionesPendientes: {
          type: 'number',
          description: 'Días de vacaciones pendientes de años anteriores (opcional, default: 0).',
          minimum: 0,
        },
        aguinaldoPendiente: {
          type: 'number',
          description: 'Días de aguinaldo adeudados (opcional, default: 0).',
          minimum: 0,
        },
        primaVacacionalPct: {
          type: 'number',
          description: 'Porcentaje de prima vacacional (default: 25).',
          minimum: 0,
          maximum: 100,
        },
        incluirPrimaAntiguedad: {
          type: 'boolean',
          description: 'Activar prima de antigüedad (Art. 162 LFT).',
        },
        incluirIndem90Dias: {
          type: 'boolean',
          description: 'Activar indemnización constitucional 90 días (solo liquidación).',
        },
        incluir20DiasAnio: {
          type: 'boolean',
          description: 'Activar 20 días por año de servicio (Art. 50 Fracc. II LFT).',
        },
      },
      required: ['tipoBaja', 'fechaIngreso', 'fechaBaja', 'salarioDiario', 'sdi'],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'calc_resico',
    description:
      'Calcula la liquidación mensual de ISR e IVA para contribuyentes en RESICO, tanto Personas Físicas como Personas Morales. Úsalo para estimar los impuestos mensuales de un contribuyente en RESICO. No lo uses para regímenes generales de ISR ni para contribuyentes fuera de RESICO. Las cantidades están en MXN (pesos mexicanos); mes es un número del 1 al 12; el ejercicio es 2026. Se aplica la Ley del Impuesto sobre la Renta (Arts. 113-E y 113-J para Persona Física; Arts. 206 al 215 para Persona Moral) y la Ley del Impuesto al Valor Agregado (Arts. 1, 1-A y 5). El resultado es una referencia de cálculo, NO es un dictamen fiscal; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {
        tipoPersona: {
          type: 'string',
          enum: ['fisica', 'moral'],
          description:
            'Tipo de contribuyente: "fisica" (Art. 113-E LISR) o "moral" (Art. 206 LISR).',
        },
        ingresosCobrados: {
          type: 'number',
          description:
            'Monto de ingresos efectivamente cobrados amparados por CFDI en el mes (para PF) o acumulados en el ejercicio (para PM).',
          minimum: 0,
        },
        deduccionesCobros: {
          type: 'number',
          description:
            'Deducciones autorizadas pagadas acumuladas (solo aplica para Persona Moral).',
          minimum: 0,
        },
        retencionISR: {
          type: 'number',
          description: 'Monto de retención de ISR aplicable al contribuyente.',
          minimum: 0,
        },
        ivaCobrado: {
          type: 'number',
          description: 'IVA trasladado efectivamente cobrado en el mes.',
          minimum: 0,
        },
        ivaAcreditable: {
          type: 'number',
          description: 'IVA acreditable efectivamente pagado en gastos e inversiones.',
          minimum: 0,
        },
        mes: {
          type: 'number',
          description: 'Número de mes a declarar (1 a 12).',
          minimum: 1,
          maximum: 12,
        },
      },
      required: ['tipoPersona', 'ingresosCobrados'],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'get_fiscal_values',
    description:
      'Devuelve el catálogo fiscal vigente completo (22 valores) con valor, vigencia, fuente oficial y referencia legal (UMA, salario mínimo, ISN, recargos, IVA, cuotas IMSS, etc.). Úsalo para consultar valores fiscales oficiales y sus fuentes publicadas en el DOF. No lo uses para cálculos de nómina ni para obtener un dictamen. Los valores numéricos incluyen su unidad (MXN para montos, porcentaje para tasas); las vigencias tienen fecha de inicio y fin. Cada valor cita su fuente oficial en el DOF. El resultado es una referencia de consulta, NO es un dictamen fiscal; la decisión final corresponde al profesional.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
    annotations: { readOnly: true, idempotent: true, destructive: false, openWorld: false },
  },
  {
    name: 'consultar_progreso_guia',
    description:
      'Consulta el estado de avance, checklist y borradores de la Guía de Defensa Fiscal SAT/IMSS para el despacho/tenant actual.',
    parameters: {
      type: 'object',
      properties: {
        step_id: {
          type: 'number',
          description:
            'Número de paso específico (del 1 al 8). Si no se proporciona, devuelve todos los pasos registrados.',
        },
      },
      required: [],
    },
  },
  {
    name: 'consultar_auditoria_ledger',
    description:
      'Consulta los registros inmutables del Ledger de auditoría y cobranza para el tenant actual, con verificación criptográfica SHA-256.',
    parameters: {
      type: 'object',
      properties: {
        caso_id: {
          type: 'string',
          description: 'Identificador del caso contable o fiscal (opcional).',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de registros a devolver (por defecto 10).',
        },
      },
      required: [],
    },
  },
  {
    name: 'consultar_watchlist_activos',
    description:
      'Obtiene las conductas y notas guardadas en la matriz de análisis de Activos Virtuales y Criptoactivos para el tenant.',
    parameters: {
      type: 'object',
      properties: {
        conducta_id: {
          type: 'number',
          description:
            'ID de la conducta específica (1 al 12). Si se omite, retorna todas las notas guardadas.',
        },
      },
      required: [],
    },
  },
  {
    name: 'obtener_info_despacho',
    description: 'Obtiene información general y metadatos del despacho contable o tenant actual.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'consultar_balance_general',
    description:
      'Consulta/analiza estructura patrimonial del Balance General archivado para el tenant actual.',
    parameters: {
      type: 'object',
      properties: {
        cliente_id: {
          type: 'string',
          description: 'ID de cliente opcional para filtrar por expediente.',
        },
        limit: {
          type: 'number',
          description: 'Número máximo de registros a devolver (por defecto 10).',
        },
      },
      required: [],
    },
  },
  {
    name: 'consultar_leads_crm',
    description:
      'Consulta métricas agregadas y prospectos contables del CRM (leads_ark_tools) por ciudad, estatus o especialidad.',
    parameters: {
      type: 'object',
      properties: {
        ciudad: {
          type: 'string',
          description: 'Filtro opcional por ciudad (ej. "Merida", "Metropolitana", "Durango").',
        },
        status: {
          type: 'string',
          description:
            'Filtro opcional por estatus (ej. "Nuevo", "WhatsApp_enviado", "Respondio_2_whats", "Anti_spam").',
        },
        especialidad: {
          type: 'string',
          description:
            'Filtro opcional por especialidad (ej. "Crypto", "General", "Cobranza", "Abogados").',
        },
        con_whatsapp: {
          type: 'boolean',
          description:
            'Si es true, filtra únicamente prospectos que cuentan con número de WhatsApp válido.',
        },
        limit: {
          type: 'number',
          description: 'Límite máximo de prospectos en el desglose (por defecto 10, máximo 50).',
        },
      },
      required: [],
    },
  },
  {
    name: 'consultar_alertas_regulatorias',
    description:
      'Consulta las últimas alertas regulatorias oficiales, reformas legales y publicaciones del DOF, SAT, CONDUSEF, CNBV y BANXICO vigiladas por Sentinela Legal. Permite filtrar por canal ("fiscal", "laboral", "cobranza", "fintech_banca") o severidad ("critico", "alto", "medio", "bajo").',
    parameters: {
      type: 'object',
      properties: {
        canal: {
          type: 'string',
          enum: ['fiscal', 'laboral', 'cobranza', 'fintech_banca'],
          description:
            'Canal normativo a filtrar: "fiscal" (SAT/RMF/CFF), "laboral" (LFT/IMSS), "cobranza" (CONDUSEF/REDECO) o "fintech_banca" (CNBV/BANXICO). Si se omite, consulta todos los canales.',
        },
        severidad: {
          type: 'string',
          enum: ['critico', 'alto', 'medio', 'bajo'],
          description: 'Nivel de severidad o urgencia de la alerta regulatoria.',
        },
        limite: {
          type: 'number',
          description: 'Número máximo de alertas a devolver (por defecto 5, máximo 20).',
        },
      },
      required: [],
    },
  },
  {
    name: 'consultar_repse',
    description:
      'Consulta el estatus REPSE (Registro de Prestadoras de Servicios Especializados) de un proveedor de servicios especializados: folio de registro, vigencia, estatus y nivel de riesgo. Señala si el proveedor está vigente o vencido y si un pago a ese contratista pone en riesgo la deducibilidad fiscal del cliente (LFT Arts. 13 y 15; Acuerdo DOF 24/05/2021 mod. 21/02/2024).',
    parameters: {
      type: 'object',
      properties: {
        rfc: {
          type: 'string',
          description: 'RFC del proveedor de servicios especializados a consultar en el REPSE.',
        },
        nombre: {
          type: 'string',
          description:
            'Razón social o nombre del proveedor (opcional, complementa la búsqueda por RFC).',
        },
      },
      required: ['rfc'],
    },
  },
];

/**
 * Ejecutor seguro de herramientas.
 * Siempre fuerza el `tenant_id` en las consultas de D1.
 */
export async function executeAiTool(
  toolName: string,
  rawArgs: Record<string, unknown> | string,
  env: Env,
  tenantId: string
): Promise<{ success: boolean; data?: unknown; error?: string; mcpError?: McpToolError }> {
  const args: Record<string, unknown> =
    typeof rawArgs === 'string'
      ? (JSON.parse(rawArgs || '{}') as Record<string, unknown>)
      : rawArgs || {};
  const canonicalToolName = TOOL_ALIASES[toolName] ?? toolName;

  try {
    // 1. Herramientas de cálculo puro (no requieren base de datos)
    if (canonicalToolName === 'calc_modalidad40') {
      const validacion = validarParametrosModalidad40(args);
      if (!validacion.ok) {
        return { success: false, error: validacion.error };
      }

      const resultado = await simularModalidad40(validacion.valor);
      return { success: true, data: wrapCalcModalidad40(args, resultado) };
    }

    if (canonicalToolName === 'calc_recargos') {
      const validacion = validarEntradaRecargos(args);
      if (!validacion.ok) {
        return {
          success: false,
          error:
            'Campos requeridos faltantes o inválidos para Recargos: ' +
            validacion.errores.join(' ') +
            '. Campos requeridos: importeHistorico, fechaVencimiento, fechaPago.',
        };
      }
      const resultado = calcularRecargosYActualizacion({
        importeHistorico: Number(args.importeHistorico),
        fechaVencimiento: String(args.fechaVencimiento),
        fechaPago: String(args.fechaPago),
        tipoRecargo: args.tipoRecargo === 'estatal_yucatan' ? 'estatal_yucatan' : 'federal',
      });
      return { success: true, data: wrapCalcRecargos(args, resultado) };
    }

    if (canonicalToolName === 'calc_isn') {
      const baseGravable = Number(args.baseGravable || 0);
      const conceptos: ConceptoPercepcion[] = [
        { id: 1, concepto: 'Base gravable', gravado: baseGravable, exento: 0 },
      ];
      const rawEstadoId = args.estadoId;
      if (typeof rawEstadoId !== 'string' || rawEstadoId.trim() === '') {
        const message = `estadoId inválido: ${JSON.stringify(rawEstadoId)}. Debe ser uno de los 32 estados de la República Mexicana.`;
        return {
          success: false,
          error: message,
          mcpError: makeMcpToolError('VALIDATION_ERROR', message, 'estadoId'),
        };
      }
      const estadoId = rawEstadoId;
      if (!ESTADOS.some((item) => item.id === estadoId)) {
        const message = `estadoId inválido: "${estadoId}". No es uno de los 32 estados de la República Mexicana.`;
        return {
          success: false,
          error: message,
          mcpError: makeMcpToolError('VALIDATION_ERROR', message, 'estadoId'),
        };
      }
      const estado = ESTADOS.find((item) => item.id === estadoId)!;
      const rawNumEmpleados =
        args.numEmpleados !== undefined ? Number(args.numEmpleados) : undefined;
      const resultado = calcularResultadoISN(conceptos, estado, {
        ejercicio: Number(args.ejercicio) === 2025 ? 2025 : 2026,
        numEmpleados:
          rawNumEmpleados !== undefined && Number.isFinite(rawNumEmpleados)
            ? Math.max(0, Math.floor(rawNumEmpleados))
            : undefined,
        esMicroPequena2026: parseStrictBoolean(args.esMicroPequena2026) ?? false,
        esGobiernoEstatal: parseStrictBoolean(args.esGobiernoEstatal) ?? false,
        aplica27A: parseStrictBoolean(args.aplica27A) ?? false,
      });
      return { success: true, data: wrapCalcIsn(args, estadoId, resultado) };
    }

    if (canonicalToolName === 'calc_retencion_clinicas') {
      const resultado = calcularRetencionClinicas({
        estadoId: String(args.estadoId || 'YUC'),
        montoHonorarios: Number(args.montoHonorarios || 0),
        fechaPago: String(args.fechaPago || '2026-03-15'),
        retenedor: { nombre: 'Retenedor', rfc: 'XAXX010101000' },
        prestador: { nombre: 'Prestador', rfc: 'XAXX010101000', tipoPersona: 'fisica' },
      });
      return { success: true, data: wrapCalcRetencionClinicas(args, resultado) };
    }

    if (canonicalToolName === 'calc_sbc') {
      const zonaRaw = args.zona ?? args.zonaSalarial ?? 'general';
      const zona = zonaRaw === 'frontera' || zonaRaw === 'zlfn' ? 'frontera' : 'general';
      const parametros: ParametrosSBC = {
        salarioDiario: Number(args.salarioDiario || 0),
        diasVacaciones: Number(args.diasVacaciones ?? 12),
        primaVacacional: Number(args.primaVacacional ?? 25),
        diasAguinaldo: Number(args.diasAguinaldo ?? 15),
        zona,
      } as ParametrosSBC;
      const resultado = calcularResultadoSBC(parametros);
      return { success: true, data: wrapCalcSbc(args, resultado) };
    }

    if (canonicalToolName === 'calc_nomina') {
      const NOMINA_CANONICAL_FIELDS = new Set([
        'periodo',
        'sueldoBruto',
        'sbcDiario',
        'diasTrabajados',
        'diasPeriodo',
      ]);
      const NOMINA_KNOWN_UNKNOWN = new Set(['salarioMensual', 'periodicidad']);
      const argKeys = Object.keys(args);
      const unknownFields = argKeys.filter((k) => !NOMINA_CANONICAL_FIELDS.has(k));
      if (unknownFields.length > 0) {
        const knownBad = unknownFields.filter((k) => NOMINA_KNOWN_UNKNOWN.has(k));
        const hint =
          knownBad.length > 0
            ? " Use nombres canónicos: 'sueldoBruto' (no 'salarioMensual') y 'periodo' (no 'periodicidad')."
            : '';
        return {
          success: false,
          error:
            `Campos no permitidos para Nómina: ${unknownFields.join(', ')}.` +
            hint +
            " Campos canónicos: 'periodo', 'sueldoBruto', 'sbcDiario', 'diasTrabajados', 'diasPeriodo'.",
        };
      }

      if (args.periodo == null || args.sueldoBruto == null) {
        const missing: string[] = [];
        if (args.periodo == null) missing.push('periodo');
        if (args.sueldoBruto == null) missing.push('sueldoBruto');
        return {
          success: false,
          error: `Campos requeridos faltantes para Nómina: ${missing.join(', ')}.`,
        };
      }

      const periodo = args.periodo as 'diario' | 'semanal' | 'quincenal' | 'mensual';
      if (!['diario', 'semanal', 'quincenal', 'mensual'].includes(periodo)) {
        return {
          success: false,
          error:
            "Campo 'periodo' inválido. Valores permitidos: diario, semanal, quincenal, mensual.",
        };
      }

      const sueldoBruto = Number(args.sueldoBruto);
      if (!Number.isFinite(sueldoBruto)) {
        return { success: false, error: "Campo 'sueldoBruto' debe ser numérico." };
      }

      const diasPeriodo =
        args.diasPeriodo == null ? (PERIODOS[periodo]?.dias ?? 30) : Number(args.diasPeriodo);
      if (!Number.isFinite(diasPeriodo) || diasPeriodo <= 0) {
        return { success: false, error: "Campo 'diasPeriodo' debe ser numérico y mayor a 0." };
      }

      const diasTrabajados =
        args.diasTrabajados == null ? diasPeriodo : Number(args.diasTrabajados);
      if (!Number.isFinite(diasTrabajados)) {
        return { success: false, error: "Campo 'diasTrabajados' debe ser numérico." };
      }

      const sbcProporcionado = args.sbcDiario != null;
      const sbcDiario = sbcProporcionado
        ? Number(args.sbcDiario)
        : Math.round((sueldoBruto / diasPeriodo) * FACTOR_INTEGRACION_SBC_DEFAULT * 100) / 100;
      if (!Number.isFinite(sbcDiario)) {
        return { success: false, error: "Campo 'sbcDiario' debe ser numérico." };
      }

      const parametros: ParametrosNomina = {
        periodo,
        sueldoBruto,
        diasTrabajados,
        diasPeriodo,
        sbcDiario,
      };
      const resultado = calcularNomina(parametros);
      return {
        success: true,
        data: wrapCalcNomina(
          args,
          resultado,
          sbcDiario,
          sbcProporcionado ? 'proporcionado' : 'default'
        ),
      };
    }

    if (canonicalToolName === 'calc_finiquito') {
      const resultado = calcularFiniquito({
        tipoBaja: (args.tipoBaja as 'finiquito' | 'liquidacion') || 'finiquito',
        fechaIngreso: String(args.fechaIngreso || ''),
        fechaBaja: String(args.fechaBaja || ''),
        salarioDiario: Number(args.salarioDiario || 0),
        sdi: Number(args.sdi || args.salarioDiario || 0),
        vacacionesPendientes: Number(args.vacacionesPendientes || 0),
        aguinaldoPendiente: Number(args.aguinaldoPendiente || 0),
        primaVacacionalPct: Number(args.primaVacacionalPct ?? 25),
        incluirPrimaAntiguedad: parseStrictBoolean(args.incluirPrimaAntiguedad) ?? false,
        incluirIndem90Dias:
          parseStrictBoolean(args.incluirIndem90Dias) ?? args.tipoBaja === 'liquidacion',
        incluir20DiasAnio: parseStrictBoolean(args.incluir20DiasAnio) ?? false,
      });

      if (!resultado.ok) {
        return {
          success: false,
          error: resultado.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(', '),
        };
      }
      return { success: true, data: wrapCalcFiniquito(args, resultado.valor) };
    }

    if (canonicalToolName === 'calc_resico') {
      // (a) reject unknown 'ingresos' field
      if (Object.prototype.hasOwnProperty.call(args, 'ingresos')) {
        return {
          success: false,
          error: "Campo 'ingresos' no es vÃ¡lido para RESICO. Use 'ingresosCobrados'.",
        };
      }
      const tipo = (args.tipoPersona as 'fisica' | 'moral') || 'fisica';
      if (!tipo) {
        return { success: false, error: "tipoPersona requerido ('fisica' | 'moral')." };
      }
      const mesRaw = Number(args.mes);
      if (!args.mes || Number.isNaN(mesRaw) || mesRaw < 1 || mesRaw > 12) {
        return { success: false, error: 'mes requerido (1 a 12).' };
      }
      const mes = mesRaw as MesFiscal;

      let tasaIVA: number | 'exento' = (args.tasaIVA as number | 'exento') ?? TASA_IVA_GENERAL;
      if (typeof tasaIVA === 'string') {
        const n = Number(tasaIVA);
        tasaIVA = Number.isNaN(n) ? tasaIVA : n;
      }

      if (tipo === 'moral') {
        if (args.ingresosCobrados == null) {
          return { success: false, error: 'ingresosCobrados requerido (acumulado PM).' };
        }
        const resultado = calcularResicoPM({
          ingresosCobradosAcumulados: Number(args.ingresosCobrados || 0),
          deduccionesAutorizadasAcumuladas: Number(args.deduccionesCobros || 0),
          ptuPagada: 0,
          perdidasFiscalesPendientes: 0,
          pagosProvisionalesPrevios: 0,
          retencionesISRAcumuladas: Number(args.retencionISR || 0),
          ivaCobrado: Number(args.ivaCobrado || 0),
          ivaAcreditablePagado: Number(args.ivaAcreditable || 0),
          retencionIVAMes: Number(args.retencionIVAMes ?? 0),
          tasaIVA,
          mes,
          ejercicio: 2026,
        });
        return { success: true, data: wrapCalcResico(args, resultado) };
      } else {
        if (args.ingresosCobrados == null) {
          return { success: false, error: 'ingresosCobrados requerido (mes PF).' };
        }
        if (args.ingresosAcumuladosPrevios == null) {
          return {
            success: false,
            error:
              'ingresosAcumuladosPrevios requerido para Persona Física para controlar el tope anual.',
          };
        }
        const resultado = calcularResicoPF({
          ingresosCobradosMes: Number(args.ingresosCobrados || 0),
          ingresosAcumuladosPrevios: Number(args.ingresosAcumuladosPrevios || 0),
          retencionISREfectuadaPM: Number(args.retencionISR || 0),
          ivaCobrado: Number(args.ivaCobrado || 0),
          ivaAcreditablePagado: Number(args.ivaAcreditable || 0),
          retencionIVAEfectuadaPM: 0,
          tasaIVA,
          mes,
          ejercicio: 2026,
        });
        return { success: true, data: wrapCalcResico(args, resultado) };
      }
    }

    if (canonicalToolName === 'get_fiscal_values') {
      const catalogError = validateFiscalCatalog();
      if (catalogError) {
        return { success: false, error: catalogError.message, mcpError: catalogError };
      }
      return { success: true, data: getFiscalValuesEnvelope(args) };
    }

    // 2. Herramientas que requieren D1
    const db = env.ARK_TOOLS_DB;
    if (!db) {
      return {
        success: false,
        error: 'La base de datos D1 no está configurada en este entorno.',
      };
    }

    switch (canonicalToolName) {
      case 'consultar_progreso_guia': {
        const stepId = args.step_id ? Number(args.step_id) : null;
        if (stepId) {
          const result = await db
            .prepare(
              'SELECT step_id, checklist_state, draft_text, updated_at FROM guia_progress WHERE tenant_id = ? AND step_id = ?'
            )
            .bind(tenantId, stepId)
            .first();
          return {
            success: true,
            data: result ?? { message: `No hay progreso registrado para el paso ${stepId}.` },
          };
        } else {
          const results = await db
            .prepare(
              'SELECT step_id, checklist_state, draft_text, updated_at FROM guia_progress WHERE tenant_id = ? ORDER BY step_id ASC'
            )
            .bind(tenantId)
            .all();
          return { success: true, data: results.results };
        }
      }

      case 'consultar_auditoria_ledger': {
        const limit = Math.min(Number(args.limit) || 10, 50);
        const casoId = args.caso_id ? String(args.caso_id) : null;

        if (casoId) {
          const results = await db
            .prepare(
              'SELECT id, user_id, caso_id, conducta_id, estado, hash_sha256, timestamp FROM arkangel_ledger WHERE tenant_id = ? AND caso_id = ? ORDER BY id DESC LIMIT ?'
            )
            .bind(tenantId, casoId, limit)
            .all();
          return { success: true, data: results.results };
        } else {
          const results = await db
            .prepare(
              'SELECT id, user_id, caso_id, conducta_id, estado, hash_sha256, timestamp FROM arkangel_ledger WHERE tenant_id = ? ORDER BY id DESC LIMIT ?'
            )
            .bind(tenantId, limit)
            .all();
          return { success: true, data: results.results };
        }
      }

      case 'consultar_watchlist_activos': {
        const conductaId = args.conducta_id ? Number(args.conducta_id) : null;
        if (conductaId) {
          const result = await db
            .prepare(
              'SELECT conducta_id, notes, created_at FROM activos_watchlist WHERE tenant_id = ? AND conducta_id = ?'
            )
            .bind(tenantId, conductaId)
            .first();
          return {
            success: true,
            data: result ?? { message: `No hay notas para la conducta ${conductaId}.` },
          };
        } else {
          const results = await db
            .prepare(
              'SELECT conducta_id, notes, created_at FROM activos_watchlist WHERE tenant_id = ? ORDER BY conducta_id ASC'
            )
            .bind(tenantId)
            .all();
          return { success: true, data: results.results };
        }
      }

      case 'consultar_balance_general': {
        return {
          success: true,
          data: {
            ok: true,
            tenant_id: tenantId,
            message: 'Consulta de Balance General disponible para este tenant.',
          },
        };
      }

      case 'consultar_leads_crm': {
        const ciudad = typeof args.ciudad === 'string' ? args.ciudad.trim() : null;
        const status = typeof args.status === 'string' ? args.status.trim() : null;
        const especialidad =
          typeof args.especialidad === 'string' ? args.especialidad.trim() : null;
        const conWhatsapp = args.con_whatsapp === true || args.con_whatsapp === 'true';
        const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);

        const statsRow = await db
          .prepare('SELECT COUNT(*) AS total FROM leads_ark_tools WHERE tenant_id = ?')
          .bind(tenantId)
          .first<{ total: number }>();

        const statusGroup = await db
          .prepare(
            'SELECT status, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ? GROUP BY status'
          )
          .bind(tenantId)
          .all<{ status: string | null; count: number }>();

        const ciudadGroup = await db
          .prepare(
            'SELECT ciudad, COUNT(*) AS count FROM leads_ark_tools WHERE tenant_id = ? GROUP BY ciudad'
          )
          .bind(tenantId)
          .all<{ ciudad: string | null; count: number }>();

        let listQuery =
          'SELECT id, web, whatsapp, email, contacto_nombre, ciudad, especialidad, status, last_contact FROM leads_ark_tools WHERE tenant_id = ?';
        const binds: unknown[] = [tenantId];
        if (ciudad) {
          listQuery += ' AND ciudad = ?';
          binds.push(ciudad);
        }
        if (status) {
          listQuery += ' AND status = ?';
          binds.push(status);
        }
        if (especialidad) {
          listQuery += ' AND especialidad = ?';
          binds.push(especialidad);
        }
        if (conWhatsapp) {
          listQuery += " AND whatsapp IS NOT NULL AND TRIM(whatsapp) != ''";
        }
        listQuery += ' ORDER BY created_at DESC LIMIT ?';
        binds.push(limit);

        const listResult = await db
          .prepare(listQuery)
          .bind(...binds)
          .all<Record<string, unknown>>();

        const prospectos = (listResult.results || []).map((row) => {
          const wa = row.whatsapp == null ? null : String(row.whatsapp).trim();
          return {
            ...row,
            whatsapp_link: wa ? buildWhatsAppDeepLink(wa) : null,
          };
        });

        return {
          success: true,
          data: {
            total_leads: statsRow?.total || 0,
            por_status: statusGroup.results || [],
            por_ciudad: ciudadGroup.results || [],
            filtros_aplicados: { ciudad, status, especialidad, con_whatsapp: conWhatsapp, limit },
            prospectos,
          },
        };
      }

      case 'obtener_info_despacho': {
        const result = await db
          .prepare('SELECT id, name, slug, created_at FROM tenants WHERE id = ?')
          .bind(tenantId)
          .first();
        return { success: true, data: result ?? { id: tenantId, name: 'Despacho sin registrar' } };
      }

      case 'consultar_alertas_regulatorias': {
        const canal = typeof args.canal === 'string' ? args.canal.trim() : undefined;
        const severidad = typeof args.severidad === 'string' ? args.severidad.trim() : undefined;
        const limit = Math.min(Math.max(Number(args.limite) || 5, 1), 20);

        const events = await listStoredRegulatoryEvents(db, {
          channel: canal,
          severity: severidad,
          limit,
        });

        return {
          success: true,
          data: {
            total: events.length,
            filtro_canal: canal || 'todos',
            filtro_severidad: severidad || 'todas',
            alertas: events.map((ev) => ({
              id: ev.id,
              fuente: ev.source,
              fuente_url: ev.source_url,
              canal: ev.channel,
              severidad: ev.severity,
              titulo: ev.title,
              fecha_vigencia: ev.effective_date,
              resumen: ev.summary,
              leyes_afectadas: ev.laws_affected,
              accion_requerida: ev.action_required,
              fecha_publicacion: ev.created_at,
            })),
          },
        };
      }

      default:
        return {
          success: false,
          error: `Herramienta desconocida: "${toolName}".`,
          mcpError: makeMcpToolError(
            'UNKNOWN_TOOL',
            `Herramienta desconocida: "${toolName}".`,
            null
          ),
        };
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: `Error al ejecutar la herramienta "${toolName}".`,
      mcpError: makeMcpToolError(
        'INTERNAL_ERROR',
        `Error al ejecutar la herramienta "${toolName}".`,
        null
      ),
    };
  }
}

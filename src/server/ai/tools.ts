/**
 * ARK LEDGER — AI Tools Catalog
 *
 * Herramientas parametrizadas que el modelo de IA puede invocar.
 * El worker actúa como guardián de seguridad inyectando siempre el `tenant_id`
 * verificado para evitar vulnerabilidades de elevación de privilegios o filtrado de datos.
 */

import type { Env } from '../../index';
import type { AiToolFunction } from './types';
import { calcularFiniquito } from '../../tools/finiquitos';
import { calcularResicoPF, calcularResicoPM, type MesFiscal } from '../../tools/resico';
import { calcularRecargosYActualizacion } from '../../tools/recargos/lib/calcularRecargos';
import { simularModalidad40 } from '../../tools/modalidad40/lib/calcularModalidad40';
import { calcularResultadoISN } from '../../tools/isn/lib/calcularISN';
import { calcularResultadoSBC } from '../../tools/sbc/lib/calcularSBC';
import { calcularNomina } from '../../tools/nomina/lib/calcularNomina';
import type { ConceptoPercepcion, Estado } from '../../tools/isn/types';
import type { ParametrosSBC } from '../../tools/sbc/types';
import type { ParametrosNomina } from '../../tools/nomina/types';
import { listStoredRegulatoryEvents } from '../sentinela/sentinelaWebhook';

export const AI_TOOLS_CATALOG: AiToolFunction[] = [
  {
    name: 'calcular_modalidad_40',
    description:
      'Calcula la proyección actuarial de pensión Ley 73 y cuota mensual de Modalidad 40 conforme al Acuerdo ACDO.AS2.HCT.101026/302.P.DG (DOF 21/10/2026). Restringe el nuevo salario al último SBC + 1 UMA diaria (máx. 25 UMAs).',
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
        },
        edadJubilacion: {
          type: 'number',
          description: 'Edad proyectada de retiro (60 a 65 años).',
        },
        asignacionFamiliar: {
          type: 'boolean',
          description: 'Si cuenta con cónyuge o solicita ayuda asistencial por soledad (+15%).',
        },
      },
      required: ['ultimoSbc', 'semanasPrevias'],
    },
  },
  {
    name: 'calcular_isn',
    description:
      'Calcula el Impuesto Sobre Nómina (ISN) estatal: suma de percepciones gravadas por la tasa del estado. Devuelve base gravable, total exento, total percepciones, tasa y monto de ISN.',
    parameters: {
      type: 'object',
      properties: {
        baseGravable: {
          type: 'number',
          description: 'Suma de percepciones gravadas (base del ISN) en MXN.',
        },
        tasa: {
          type: 'number',
          description: 'Tasa del ISN del estado en porcentaje (ej. 3 para 3%).',
        },
      },
      required: ['baseGravable', 'tasa'],
    },
  },
  {
    name: 'calcular_sbc',
    description:
      'Calcula el Salario Base de Cotización (SBC) IMSS: factor de integración por prestaciones (vacaciones, prima vacacional, aguinaldo), SBC bruto y SBC final aplicando topes (mínimo salario mínimo, máximo 25 UMAs).',
    parameters: {
      type: 'object',
      properties: {
        salarioDiario: { type: 'number', description: 'Salario diario ordinario en MXN.' },
        diasVacaciones: { type: 'number', description: 'Días de vacaciones por antigüedad.' },
        primaVacacional: {
          type: 'number',
          description: 'Porcentaje de prima vacacional (default 25).',
        },
        diasAguinaldo: { type: 'number', description: 'Días de aguinaldo (default 15).' },
      },
      required: ['salarioDiario'],
    },
  },
  {
    name: 'calcular_nomina_rapida',
    description:
      'Calcula nómina rápida: ISR con subsidio al empleo, IMSS obrero por ramo y neto a pagar para un período (diario/semanal/quincenal/mensual).',
    parameters: {
      type: 'object',
      properties: {
        periodo: {
          type: 'string',
          enum: ['diario', 'semanal', 'quincenal', 'mensual'],
          description: 'Período de pago.',
        },
        sueldoBruto: { type: 'number', description: 'Sueldo bruto del período en MXN.' },
        diasTrabajados: { type: 'number', description: 'Días trabajados (para prorrateo).' },
        diasPeriodo: {
          type: 'number',
          description: 'Días del período completo (ej. 30 para mensual).',
        },
        sbcDiario: { type: 'number', description: 'SBC diario para IMSS obrero.' },
      },
      required: ['periodo', 'sueldoBruto'],
    },
  },
  {
    name: 'calcular_recargos_fiscales',
    description:
      'Calcula la actualización inflacionaria (INPC Art. 17-A CFF) y recargos por mora (Art. 21 CFF y LIF al 1.47% mensual) de contribuciones federales omitidas.',
    parameters: {
      type: 'object',
      properties: {
        importeHistorico: {
          type: 'number',
          description: 'Monto del impuesto omitido en MXN.',
        },
        fechaVencimiento: {
          type: 'string',
          description: 'Fecha en que debió pagarse la contribución (ISO YYYY-MM-DD).',
        },
        fechaPago: {
          type: 'string',
          description: 'Fecha de pago real o proyectada (ISO YYYY-MM-DD).',
        },
      },
      required: ['importeHistorico', 'fechaVencimiento', 'fechaPago'],
    },
  },
  {
    name: 'calcular_finiquito_lft',
    description:
      'Calcula con precisión legal el finiquito o liquidación constitucional de un trabajador según la Ley Federal del Trabajo (LFT). Incluye aguinaldo proporcional (Art. 87), vacaciones dignas 2023 (Art. 76), prima vacacional (Art. 80), prima de antigüedad con tope 2xSMG (Arts. 162 y 486), e indemnizaciones de 90 días y 20 días por año (Art. 50).',
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
        salarioDiario: { type: 'number', description: 'Salario diario ordinario en MXN.' },
        sdi: {
          type: 'number',
          description: 'Salario Diario Integrado para indemnizaciones en MXN.',
        },
        vacacionesPendientes: {
          type: 'number',
          description: 'Días de vacaciones pendientes de años anteriores (opcional, default: 0).',
        },
        aguinaldoPendiente: {
          type: 'number',
          description: 'Días de aguinaldo adeudados (opcional, default: 0).',
        },
        primaVacacionalPct: {
          type: 'number',
          description: 'Porcentaje de prima vacacional (default: 25).',
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
    },
  },
  {
    name: 'calcular_resico',
    description:
      'Calcula la liquidación mensual de ISR e IVA para contribuyentes en el Régimen Simplificado de Confianza (RESICO). Soporta Persona Física (Art. 113-E con tasas 1.0% a 2.5%, retención 1.25% de personas morales y tope 3.5M) y Persona Moral (Art. 206 base flujo de efectivo al 30%).',
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
        },
        deduccionesCobros: {
          type: 'number',
          description:
            'Deducciones autorizadas pagadas acumuladas (solo aplica para Persona Moral).',
        },
        retencionISR: {
          type: 'number',
          description:
            'Monto de retención de ISR (1.25% por PM para PF, o retenciones bancarias acumuladas para PM).',
        },
        ivaCobrado: {
          type: 'number',
          description: 'IVA trasladado efectivamente cobrado en el mes.',
        },
        ivaAcreditable: {
          type: 'number',
          description: 'IVA acreditable efectivamente pagado en gastos e inversiones.',
        },
        mes: {
          type: 'number',
          description: 'Número de mes a declarar (1 a 12).',
        },
      },
      required: ['tipoPersona', 'ingresosCobrados'],
    },
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
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const args: Record<string, unknown> =
    typeof rawArgs === 'string'
      ? (JSON.parse(rawArgs || '{}') as Record<string, unknown>)
      : rawArgs || {};

  try {
    // 1. Herramientas de cálculo puro (no requieren base de datos)
    if (toolName === 'calcular_modalidad_40') {
      const ultimoSbc = Number(args.ultimoSbc) || 315.04;
      const sbcDeseado = Number(args.sbcDeseado) || 2932.75;
      const semanasPrevias = Number(args.semanasPrevias) || 500;
      const mesesAportacion = Number(args.mesesAportacion) || 36;
      const edadJubilacion = Number(args.edadJubilacion) || 65;
      const asignacionFamiliar = args.asignacionFamiliar !== false;

      const resultado = await simularModalidad40({
        ultimoSbc,
        sbcDeseado,
        semanasPrevias,
        mesesAportacion,
        edadJubilacion,
        asignacionFamiliar,
      });
      return { success: true, data: resultado };
    }

    if (toolName === 'calcular_recargos_fiscales') {
      const resultado = calcularRecargosYActualizacion({
        importeHistorico: Number(args.importeHistorico || 0),
        fechaVencimiento: String(args.fechaVencimiento || ''),
        fechaPago: String(args.fechaPago || ''),
      });
      return { success: true, data: resultado };
    }

    if (toolName === 'calcular_isn') {
      const baseGravable = Number(args.baseGravable || 0);
      const tasa = Number(args.tasa || 0);
      const conceptos: ConceptoPercepcion[] = [
        { id: 1, concepto: 'Base gravable', gravado: baseGravable, exento: 0 },
      ];
      const estado: Estado = {
        id: 'ai',
        nombre: 'AI',
        corto: 'AI',
        tasa,
        vigencia: '2026',
        articulo: 'N/A',
      };
      const resultado = calcularResultadoISN(conceptos, estado);
      return { success: true, data: resultado };
    }

    if (toolName === 'calcular_sbc') {
      const parametros: ParametrosSBC = {
        salarioDiario: Number(args.salarioDiario || 0),
        diasVacaciones: Number(args.diasVacaciones ?? 12),
        primaVacacional: Number(args.primaVacacional ?? 25),
        diasAguinaldo: Number(args.diasAguinaldo ?? 15),
      } as ParametrosSBC;
      const resultado = calcularResultadoSBC(parametros);
      return { success: true, data: resultado };
    }

    if (toolName === 'calcular_nomina_rapida') {
      const periodo = (args.periodo as 'diario' | 'semanal' | 'quincenal' | 'mensual') || 'mensual';
      const sueldoBruto = Number(args.sueldoBruto || 0);
      const diasTrabajados = Number(args.diasTrabajados ?? 30);
      const diasPeriodo = Number(args.diasPeriodo ?? 30);
      const sbcDiario = Number(args.sbcDiario ?? sueldoBruto / 30);
      const parametros: ParametrosNomina = {
        periodo,
        sueldoBruto,
        diasTrabajados,
        diasPeriodo,
        sbcDiario,
      };
      const resultado = calcularNomina(parametros);
      return { success: true, data: resultado };
    }

    if (toolName === 'calcular_finiquito_lft') {
      const resultado = calcularFiniquito({
        tipoBaja: (args.tipoBaja as 'finiquito' | 'liquidacion') || 'finiquito',
        fechaIngreso: String(args.fechaIngreso || ''),
        fechaBaja: String(args.fechaBaja || ''),
        salarioDiario: Number(args.salarioDiario || 0),
        sdi: Number(args.sdi || args.salarioDiario || 0),
        vacacionesPendientes: Number(args.vacacionesPendientes || 0),
        aguinaldoPendiente: Number(args.aguinaldoPendiente || 0),
        primaVacacionalPct: Number(args.primaVacacionalPct ?? 25),
        incluirPrimaAntiguedad: Boolean(args.incluirPrimaAntiguedad ?? false),
        incluirIndem90Dias: Boolean(args.incluirIndem90Dias ?? args.tipoBaja === 'liquidacion'),
        incluir20DiasAnio: Boolean(args.incluir20DiasAnio ?? false),
      });

      if (!resultado.ok) {
        return {
          success: false,
          error: resultado.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(', '),
        };
      }
      return { success: true, data: resultado.valor };
    }

    if (toolName === 'calcular_resico') {
      const tipo = (args.tipoPersona as 'fisica' | 'moral') || 'fisica';
      const mes = (Number(args.mes) || 1) as MesFiscal;
      if (tipo === 'moral') {
        const resultado = calcularResicoPM({
          ingresosCobradosAcumulados: Number(args.ingresosCobrados || 0),
          deduccionesAutorizadasAcumuladas: Number(args.deduccionesCobros || 0),
          ptuPagada: 0,
          perdidasFiscalesPendientes: 0,
          pagosProvisionalesPrevios: 0,
          retencionesISRAcumuladas: Number(args.retencionISR || 0),
          ivaCobrado: Number(args.ivaCobrado || 0),
          ivaAcreditablePagado: Number(args.ivaAcreditable || 0),
          retencionIVAMes: 0,
          mes,
          ejercicio: 2026,
        });
        return { success: true, data: resultado };
      } else {
        const resultado = calcularResicoPF({
          ingresosCobradosMes: Number(args.ingresosCobrados || 0),
          ingresosAcumuladosPrevios: 0,
          retencionISREfectuadaPM: Number(args.retencionISR || 0),
          ivaCobrado: Number(args.ivaCobrado || 0),
          ivaAcreditablePagado: Number(args.ivaAcreditable || 0),
          retencionIVAEfectuadaPM: 0,
          mes,
          ejercicio: 2026,
        });
        return { success: true, data: resultado };
      }
    }

    // 2. Herramientas que requieren D1
    const db = env.ARK_TOOLS_DB;
    if (!db) {
      return {
        success: false,
        error: 'La base de datos D1 no está configurada en este entorno.',
      };
    }

    switch (toolName) {
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
        listQuery += ' ORDER BY created_at DESC LIMIT ?';
        binds.push(limit);

        const listResult = await db
          .prepare(listQuery)
          .bind(...binds)
          .all();

        return {
          success: true,
          data: {
            total_leads: statsRow?.total || 0,
            por_status: statusGroup.results || [],
            por_ciudad: ciudadGroup.results || [],
            filtros_aplicados: { ciudad, status, especialidad, limit },
            prospectos: listResult.results || [],
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
        };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Error al ejecutar la herramienta "${toolName}": ${errorMsg}`,
    };
  }
}

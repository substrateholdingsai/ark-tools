/**
 * ARK TOOLS — AI Tools Catalog
 *
 * Herramientas parametrizadas que el modelo de IA puede invocar.
 * El worker actúa como guardián de seguridad inyectando siempre el `tenant_id`
 * verificado para evitar vulnerabilidades de elevación de privilegios o filtrado de datos.
 */

import type { Env } from '../../index';
import type { AiToolFunction } from './types';
import { calcularFiniquito } from '../../tools/finiquitos';
import { calcularResicoPF, calcularResicoPM, type MesFiscal } from '../../tools/resico';

export const AI_TOOLS_CATALOG: AiToolFunction[] = [
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
          description: 'Naturaleza de la terminación laboral: "finiquito" (renuncia voluntaria) o "liquidacion" (despido injustificado).',
        },
        fechaIngreso: { type: 'string', description: 'Fecha de ingreso en formato ISO YYYY-MM-DD.' },
        fechaBaja: { type: 'string', description: 'Fecha de baja en formato ISO YYYY-MM-DD.' },
        salarioDiario: { type: 'number', description: 'Salario diario ordinario en MXN.' },
        sdi: { type: 'number', description: 'Salario Diario Integrado para indemnizaciones en MXN.' },
        vacacionesPendientes: { type: 'number', description: 'Días de vacaciones pendientes de años anteriores (opcional, default: 0).' },
        aguinaldoPendiente: { type: 'number', description: 'Días de aguinaldo adeudados (opcional, default: 0).' },
        primaVacacionalPct: { type: 'number', description: 'Porcentaje de prima vacacional (default: 25).' },
        incluirPrimaAntiguedad: { type: 'boolean', description: 'Activar prima de antigüedad (Art. 162 LFT).' },
        incluirIndem90Dias: { type: 'boolean', description: 'Activar indemnización constitucional 90 días (solo liquidación).' },
        incluir20DiasAnio: { type: 'boolean', description: 'Activar 20 días por año de servicio (Art. 50 Fracc. II LFT).' },
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
          description: 'Tipo de contribuyente: "fisica" (Art. 113-E LISR) o "moral" (Art. 206 LISR).',
        },
        ingresosCobrados: {
          type: 'number',
          description: 'Monto de ingresos efectivamente cobrados amparados por CFDI en el mes (para PF) o acumulados en el ejercicio (para PM).',
        },
        deduccionesCobros: {
          type: 'number',
          description: 'Deducciones autorizadas pagadas acumuladas (solo aplica para Persona Moral).',
        },
        retencionISR: {
          type: 'number',
          description: 'Monto de retención de ISR (1.25% por PM para PF, o retenciones bancarias acumuladas para PM).',
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
          description: 'Número de paso específico (del 1 al 8). Si no se proporciona, devuelve todos los pasos registrados.',
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
          description: 'ID de la conducta específica (1 al 12). Si se omite, retorna todas las notas guardadas.',
        },
      },
      required: [],
    },
  },
  {
    name: 'obtener_info_despacho',
    description:
      'Obtiene información general y metadatos del despacho contable o tenant actual.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },\r\n  {\r\n    name: 'consultar_balance_general',\r\n    description: 'Consulta/analiza estructura patrimonial del Balance General archivado para el tenant actual.',\r\n    parameters: {\r\n      type: 'object',\r\n      properties: {\r\n        cliente_id: { type: 'string', description: 'ID de cliente opcional para filtrar por expediente.' },\r\n        limit: { type: 'number', description: 'N�mero m�ximo de registros a devolver (por defecto 10).' },\r\n      },\r\n      required: [],\r\n    },\r\n  },\r\n];

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
        incluirIndem90Dias: Boolean(args.incluirIndem90Dias ?? (args.tipoBaja === 'liquidacion')),
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
          return { success: true, data: result ?? { message: `No hay progreso registrado para el paso ${stepId}.` } };
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
          return { success: true, data: result ?? { message: `No hay notas para la conducta ${conductaId}.` } };
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

      case 'obtener_info_despacho': {
        const result = await db
          .prepare('SELECT id, name, slug, created_at FROM tenants WHERE id = ?')
          .bind(tenantId)
          .first();
        return { success: true, data: result ?? { id: tenantId, name: 'Despacho sin registrar' } };
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

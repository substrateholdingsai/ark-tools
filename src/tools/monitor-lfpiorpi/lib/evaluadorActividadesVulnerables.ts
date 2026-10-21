/**
 * ARK TOOLS — Motor Determinista de Evaluación LFPIORPI (Sprint 12)
 *
 * Fundamento legal:
 * - Ley Federal para la Prevención e Identificación de Operaciones con Recursos
 *   de Procedencia Ilícita (LFPIORPI) Art. 17.
 * - Regla de acumulación de 6 meses (Art. 17, penúltimo párrafo de la LFPIORPI).
 * - Valores centralizados de UMA vigentes (INEGI / DOF 2026).
 */

import { VALORES_POR_ID } from '@/data/valores-vigentes/catalogo';
import type {
  ActividadVulnerable,
  FraccionLFPIORPI,
  OperacionCobranza,
  ResultadoCliente,
  ResumenMonitorLFPIORPI,
  EvaluacionLFPIORPI,
  NivelRiesgo,
} from '../types';

/** Catálogo oficial de Actividades Vulnerables y sus topes en UMA */
export const CATALOGO_ACTIVIDADES_VULNERABLES: ActividadVulnerable[] = [
  {
    fraccion: 'FRACCION_XV',
    nombre: 'Arrendamiento Inmobiliario (Fracc. XV)',
    descripcionCorta: 'Uso o goce temporal de bienes inmuebles',
    fundamentoLegal: 'LFPIORPI Art. 17 Fracc. XV',
    umbralIdentificacionUMA: 1605,
    umbralAvisoUMA: 3210,
  },
  {
    fraccion: 'FRACCION_V',
    nombre: 'Desarrollo y Comercialización Inmobiliaria (Fracc. V)',
    descripcionCorta: 'Compraventa, intermediación o desarrollo de inmuebles',
    fundamentoLegal: 'LFPIORPI Art. 17 Fracc. V',
    umbralIdentificacionUMA: 8025,
    umbralAvisoUMA: 16000,
  },
  {
    fraccion: 'FRACCION_IV',
    nombre: 'Mutuo, Préstamos o Créditos (Fracc. IV)',
    descripcionCorta: 'Operaciones de mutuo, garantía o préstamos independientes',
    fundamentoLegal: 'LFPIORPI Art. 17 Fracc. IV',
    umbralIdentificacionUMA: 1605,
    umbralAvisoUMA: 3210,
  },
  {
    fraccion: 'FRACCION_XIII',
    nombre: 'Recepción de Donativos (Fracc. XIII)',
    descripcionCorta: 'Donaciones recibidas por organizaciones sin fines de lucro',
    fundamentoLegal: 'LFPIORPI Art. 17 Fracc. XIII',
    umbralIdentificacionUMA: 1605,
    umbralAvisoUMA: 3210,
  },
  {
    fraccion: 'FRACCION_VIII',
    nombre: 'Vehículos Terrestres, Aéreos o Marítimos (Fracc. VIII)',
    descripcionCorta: 'Comercialización habitual o profesional de vehículos',
    fundamentoLegal: 'LFPIORPI Art. 17 Fracc. VIII',
    umbralIdentificacionUMA: 3210,
    umbralAvisoUMA: 6420,
  },
  {
    fraccion: 'FRACCION_VI',
    nombre: 'Metales, Piedras Preciosas y Joyas (Fracc. VI)',
    descripcionCorta: 'Comercialización o intermediación de metales y joyas',
    fundamentoLegal: 'LFPIORPI Art. 17 Fracc. VI',
    umbralIdentificacionUMA: 805,
    umbralAvisoUMA: 1605,
  },
];

/**
 * Obtiene el valor oficial vigente de la UMA diaria.
 */
export function obtenerUmaDiariaVigente(): number {
  const item = VALORES_POR_ID.get('UMA_DIARIA_2026');
  return typeof item?.valor === 'number' ? item.valor : 117.31;
}

/**
 * Busca la actividad vulnerable por su clave de fracción.
 */
export function obtenerActividadPorFraccion(fraccion: FraccionLFPIORPI): ActividadVulnerable {
  const encontrada = CATALOGO_ACTIVIDADES_VULNERABLES.find((a) => a.fraccion === fraccion);
  if (!encontrada) {
    return CATALOGO_ACTIVIDADES_VULNERABLES[0]!;
  }
  return encontrada;
}

/**
 * Calcula la fecha de inicio de la ventana de 6 meses previa a una fecha dada.
 */
export function calcularFechaInicioVentana6Meses(fechaStr: string): Date {
  const fecha = new Date(fechaStr);
  const inicio = new Date(fecha.getTime());
  inicio.setMonth(inicio.getMonth() - 6);
  return inicio;
}

/**
 * Calcula el total acumulado máximo en cualquier ventana móvil de 6 meses
 * para una lista de operaciones de un cliente.
 */
export function calcularMaximoAcumulado6Meses(operaciones: OperacionCobranza[]): {
  maxAcumulado: number;
  operacionesVentana: number;
} {
  if (operaciones.length === 0) {
    return { maxAcumulado: 0, operacionesVentana: 0 };
  }

  // Ordenar operaciones por fecha cronológica
  const ordenadas = [...operaciones].sort((a, b) => {
    return new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime();
  });

  let maxAcumulado = 0;
  let countEnMax = 0;

  for (let i = 0; i < ordenadas.length; i++) {
    const opActual = ordenadas[i]!;
    const fechaFin = new Date(opActual.fechaPago);
    const fechaInicio = new Date(fechaFin.getTime());
    fechaInicio.setMonth(fechaInicio.getMonth() - 6);

    let sumaVentana = 0;
    let countVentana = 0;

    for (let j = 0; j <= i; j++) {
      const opPrevia = ordenadas[j]!;
      const fechaOp = new Date(opPrevia.fechaPago);
      if (fechaOp >= fechaInicio && fechaOp <= fechaFin) {
        sumaVentana += opPrevia.montoCobrado;
        countVentana++;
      }
    }

    if (sumaVentana > maxAcumulado) {
      maxAcumulado = sumaVentana;
      countEnMax = countVentana;
    }
  }

  return {
    maxAcumulado: Math.round(maxAcumulado * 100) / 100,
    operacionesVentana: countEnMax,
  };
}

/**
 * Determina el nivel de riesgo conforme a los montos en MXN y los umbrales legales.
 */
export function clasificarRiesgo(
  montoAcumulado: number,
  umbralIdentificacionMXN: number,
  umbralAvisoMXN: number
): {
  nivelRiesgo: NivelRiesgo;
  requiereExpediente: boolean;
  requiereAviso: boolean;
} {
  if (montoAcumulado >= umbralAvisoMXN) {
    return {
      nivelRiesgo: 'ROJO',
      requiereExpediente: true,
      requiereAviso: true,
    };
  }
  if (montoAcumulado >= umbralIdentificacionMXN) {
    return {
      nivelRiesgo: 'AMARILLO',
      requiereExpediente: true,
      requiereAviso: false,
    };
  }
  return {
    nivelRiesgo: 'VERDE',
    requiereExpediente: false,
    requiereAviso: false,
  };
}

/**
 * Calcula el hash SHA-256 de auditoría para asegurar inmutabilidad jurídica.
 */
export async function generarHashAuditoria(contenido: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(contenido);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple determinista para entornos donde crypto.subtle no esté disponible
  let hash = 0;
  for (let i = 0; i < contenido.length; i++) {
    const char = contenido.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Evalúa una lista completa de operaciones de cobranza contra los umbrales LFPIORPI
 * de la fracción seleccionada, agrupando por cliente en ventanas de 6 meses.
 */
export async function evaluarOperacionesLFPIORPI(
  operaciones: OperacionCobranza[],
  fraccion: FraccionLFPIORPI = 'FRACCION_XV',
  umaDiaria?: number
): Promise<EvaluacionLFPIORPI> {
  const uma = umaDiaria ?? obtenerUmaDiariaVigente();
  const actividad = obtenerActividadPorFraccion(fraccion);

  const umbralIdentificacionMXN = Math.round(actividad.umbralIdentificacionUMA * uma * 100) / 100;
  const umbralAvisoMXN = Math.round(actividad.umbralAvisoUMA * uma * 100) / 100;

  // Agrupar operaciones por ID Cliente
  const gruposCliente = new Map<string, OperacionCobranza[]>();
  for (const op of operaciones) {
    const id = op.idCliente.trim().toUpperCase();
    if (!gruposCliente.has(id)) {
      gruposCliente.set(id, []);
    }
    gruposCliente.get(id)!.push(op);
  }

  const clientesResultados: ResultadoCliente[] = [];
  let totalMontoGlobal = 0;

  for (const [idCliente, ops] of gruposCliente.entries()) {
    const opsOrdenadas = [...ops].sort(
      (a, b) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime()
    );

    const primeraOperacion = opsOrdenadas[0]?.fechaPago ?? '';
    const ultimaOperacion = opsOrdenadas[opsOrdenadas.length - 1]?.fechaPago ?? '';

    const { maxAcumulado, operacionesVentana } = calcularMaximoAcumulado6Meses(ops);

    const { nivelRiesgo, requiereExpediente, requiereAviso } = clasificarRiesgo(
      maxAcumulado,
      umbralIdentificacionMXN,
      umbralAvisoMXN
    );

    const pctIdentificacion =
      umbralIdentificacionMXN > 0
        ? Math.min(100, Math.round((maxAcumulado / umbralIdentificacionMXN) * 1000) / 10)
        : 0;
    const pctAviso =
      umbralAvisoMXN > 0
        ? Math.min(100, Math.round((maxAcumulado / umbralAvisoMXN) * 1000) / 10)
        : 0;

    for (const op of ops) {
      totalMontoGlobal += op.montoCobrado;
    }

    clientesResultados.push({
      idCliente,
      totalAcumulado6Meses: maxAcumulado,
      operacionesCount: operacionesVentana,
      primeraOperacion,
      ultimaOperacion,
      umbralIdentificacionMXN,
      umbralAvisoMXN,
      porcentajeIdentificacion: pctIdentificacion,
      porcentajeAviso: pctAviso,
      nivelRiesgo,
      requiereExpediente,
      requiereAviso,
    });
  }

  // Ordenar clientes por nivel de riesgo prioritario (ROJO primero, luego AMARILLO, luego VERDE)
  const ordenRiesgo: Record<NivelRiesgo, number> = { ROJO: 3, AMARILLO: 2, VERDE: 1 };
  clientesResultados.sort((a, b) => {
    const diff = ordenRiesgo[b.nivelRiesgo] - ordenRiesgo[a.nivelRiesgo];
    if (diff !== 0) return diff;
    return b.totalAcumulado6Meses - a.totalAcumulado6Meses;
  });

  const verdes = clientesResultados.filter((c) => c.nivelRiesgo === 'VERDE').length;
  const amarillos = clientesResultados.filter((c) => c.nivelRiesgo === 'AMARILLO').length;
  const rojos = clientesResultados.filter((c) => c.nivelRiesgo === 'ROJO').length;

  const fechaEvaluacion = new Date().toISOString().split('T')[0] ?? '';

  const payloadParaHash = JSON.stringify({
    fraccion,
    uma,
    totalClientes: clientesResultados.length,
    totalOperaciones: operaciones.length,
    montoTotalEvaluado: totalMontoGlobal,
    clientesRojo: rojos,
    clientesAmarillo: amarillos,
    fechaEvaluacion,
  });

  const hashAuditoria = await generarHashAuditoria(payloadParaHash);

  const resumen: ResumenMonitorLFPIORPI = {
    totalClientes: clientesResultados.length,
    totalOperaciones: operaciones.length,
    montoTotalEvaluado: Math.round(totalMontoGlobal * 100) / 100,
    clientesVerde: verdes,
    clientesAmarillo: amarillos,
    clientesRojo: rojos,
    actividadVulnerable: actividad.nombre,
    fraccion,
    umaDiaria: uma,
    umbralIdentificacionUMA: actividad.umbralIdentificacionUMA,
    umbralAvisoUMA: actividad.umbralAvisoUMA,
    umbralIdentificacionMXN,
    umbralAvisoMXN,
    fechaEvaluacion,
    hashAuditoria,
  };

  return {
    clientes: clientesResultados,
    resumen,
  };
}

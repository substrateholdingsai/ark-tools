/**
 * ARK LEDGER — Calculadora de Leasing y MRR
 * Lógica matemática de proyección financiera, retención y LTV
 */

import type { ParametrosLeasing, ProyeccionMes, ResumenLeasing } from '../types';

export const PARAMETROS_DEFAULT: ParametrosLeasing = {
  clientesIniciales: 5,
  clientesNuevosPorMes: 3,
  tasaChurnPorcentaje: 3,
  setupFee: 500,
  rentaMensual: 2500,
  costoDirectoPorCliente: 200,
  plazoMeses: 12,
};

export const PRESETS_MODELO = [
  {
    nombre: 'Despacho Inicial',
    descripcion: 'Punto de partida: 2 clientes, 2 nuevos/mes',
    parametros: {
      clientesIniciales: 2,
      clientesNuevosPorMes: 2,
      tasaChurnPorcentaje: 2,
      setupFee: 500,
      rentaMensual: 2500,
      costoDirectoPorCliente: 200,
      plazoMeses: 12,
    },
  },
  {
    nombre: 'Modelo Recomendado ($500 → $2,500)',
    descripcion: '5 iniciales, 3 nuevos/mes, setup accesible',
    parametros: {
      clientesIniciales: 5,
      clientesNuevosPorMes: 3,
      tasaChurnPorcentaje: 3,
      setupFee: 500,
      rentaMensual: 2500,
      costoDirectoPorCliente: 200,
      plazoMeses: 12,
    },
  },
  {
    nombre: 'Firma en Expansión',
    descripcion: '10 iniciales, 6 nuevos/mes, baja rotación',
    parametros: {
      clientesIniciales: 10,
      clientesNuevosPorMes: 6,
      tasaChurnPorcentaje: 2,
      setupFee: 750,
      rentaMensual: 2800,
      costoDirectoPorCliente: 250,
      plazoMeses: 12,
    },
  },
];

/**
 * Calcula la proyección mes a mes para el horizonte definido
 */
export function proyectarMeses(parametros: ParametrosLeasing): ProyeccionMes[] {
  const meses: ProyeccionMes[] = [];
  let clientesActuales = Math.max(0, parametros.clientesIniciales);
  let ingresoAcumulado = 0;
  let utilidadAcumulada = 0;

  const plazo = Math.max(1, Math.min(36, parametros.plazoMeses));

  for (let m = 1; m <= plazo; m++) {
    const clientesInicio = clientesActuales;
    const clientesNuevos = Math.max(0, parametros.clientesNuevosPorMes);
    const baseAntesDeChurn = clientesInicio + clientesNuevos;

    // Churn mensual
    const churnDecimal = Math.max(0, Math.min(100, parametros.tasaChurnPorcentaje)) / 100;
    const clientesPerdidos = Math.round(baseAntesDeChurn * churnDecimal);
    const clientesFin = Math.max(0, baseAntesDeChurn - clientesPerdidos);

    const ingresosSetup = clientesNuevos * Math.max(0, parametros.setupFee);
    const ingresosRentas = clientesFin * Math.max(0, parametros.rentaMensual);
    const ingresoTotalMes = ingresosSetup + ingresosRentas;
    const costosDirectos = clientesFin * Math.max(0, parametros.costoDirectoPorCliente);
    const utilidadMes = ingresoTotalMes - costosDirectos;

    ingresoAcumulado += ingresoTotalMes;
    utilidadAcumulada += utilidadMes;

    meses.push({
      mes: m,
      clientesInicio,
      clientesNuevos,
      clientesPerdidos,
      clientesFin,
      ingresosSetup,
      ingresosRentas,
      ingresoTotalMes,
      costosDirectos,
      utilidadMes,
      ingresoAcumulado,
      utilidadAcumulada,
    });

    clientesActuales = clientesFin;
  }

  return meses;
}

/**
 * Calcula el resumen ejecutivo financiero y métricas SaaS (MRR, ARR, LTV)
 */
export function calcularResumenLeasing(
  parametros: ParametrosLeasing,
  proyeccion: ProyeccionMes[]
): ResumenLeasing {
  if (proyeccion.length === 0) {
    return {
      mrrFinal: 0,
      arrProyectado: 0,
      clientesFinales: 0,
      totalSetupAcumulado: 0,
      totalRentasAcumulado: 0,
      ingresoBrutoTotal: 0,
      utilidadTotalAcumulada: 0,
      margenPromedioPorcentaje: 0,
      ltvEstimado: 0,
      mesesRetencionPromedio: 0,
    };
  }

  const ultimoMes = proyeccion[proyeccion.length - 1];
  const clientesFinales = ultimoMes ? ultimoMes.clientesFin : 0;
  const mrrFinal = clientesFinales * parametros.rentaMensual;
  const arrProyectado = mrrFinal * 12;

  let totalSetup = 0;
  let totalRentas = 0;
  let ingresoTotal = 0;
  let utilidadTotal = 0;

  for (const m of proyeccion) {
    totalSetup += m.ingresosSetup;
    totalRentas += m.ingresosRentas;
    ingresoTotal += m.ingresoTotalMes;
    utilidadTotal += m.utilidadMes;
  }

  const margenPromedio = ingresoTotal > 0 ? (utilidadTotal / ingresoTotal) * 100 : 0;

  // Cálculo de LTV (Lifetime Value)
  const churnDecimal = parametros.tasaChurnPorcentaje / 100;
  const mesesRetencion = churnDecimal > 0 ? Math.min(60, Math.round(1 / churnDecimal)) : 36;
  const margenUnitarioMensual = Math.max(
    0,
    parametros.rentaMensual - parametros.costoDirectoPorCliente
  );
  const ltvEstimado = Math.round(parametros.setupFee + margenUnitarioMensual * mesesRetencion);

  return {
    mrrFinal,
    arrProyectado,
    clientesFinales,
    totalSetupAcumulado: totalSetup,
    totalRentasAcumulado: totalRentas,
    ingresoBrutoTotal: ingresoTotal,
    utilidadTotalAcumulada: utilidadTotal,
    margenPromedioPorcentaje: Math.round(margenPromedio * 10) / 10,
    ltvEstimado,
    mesesRetencionPromedio: mesesRetencion,
  };
}

/**
 * Formateador de moneda en pesos mexicanos
 */
export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

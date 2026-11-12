/**
 * ARK LEDGER — Simulador Fiscal de Arrendamiento Puro (Leasing) vs Crédito vs Contado
 * Exportador de Cédula Comparativa Fiscal a CSV para Excel (UTF-8 con BOM)
 */

import type { ResultadoComparativaFiscal, ProyeccionMes, ResumenLeasing } from '../types';
import { obtenerReglasFiscalesActivo } from './calcularLeasing';

function escaparCSV(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  const str = String(valor).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generarCSVComparativaFiscal(resultado: ResultadoComparativaFiscal): string {
  const { parametros, contado, credito, leasing, flujoAnual } = resultado;
  const reglas = obtenerReglasFiscalesActivo(parametros.tipoActivo);
  const lineas: string[] = [];

  lineas.push('CÉDULA COMPARATIVA FISCAL: LEASING VS CRÉDITO VS CONTADO — ARK LEDGER');
  lineas.push(
    'Fundamento: LISR Arts. 27, 28 Fracc. XIII, 34, 36 Fracc. II | CFF Arts. 15 y 15-A | LIVA Art. 5'
  );
  lineas.push(`Tipo de Activo,${escaparCSV(reglas.etiquetaActivo)}`);
  lineas.push(`Valor de Factura sin IVA ($ MXN),${parametros.valorFacturaSinIva}`);
  lineas.push(`Plazo Evaluado (Meses),${parametros.plazoMeses}`);
  lineas.push(`Tasa ISRAplicada (%),${parametros.tasaIsrPorcentaje}%`);
  lineas.push(`Incluye PTU (10%),${parametros.incluirPtu ? 'Sí' : 'No'}`);
  lineas.push(
    `Tope MOI Aplicable ($ MXN),${resultado.topeMoiAplicable !== null ? resultado.topeMoiAplicable : 'Sin Tope (100% Deducible)'}`
  );
  lineas.push(
    `Tope Renta Diaria Leasing ($ MXN),${resultado.topeRentaDiariaAplicable !== null ? resultado.topeRentaDiariaAplicable : 'Sin Tope (100% Deducible)'}`
  );
  lineas.push('');

  lineas.push('1. MATRIZ COMPARATIVA DE LOS 3 MÉTODOS DE ADQUISICIÓN');
  const encabezadosMatriz = [
    'Concepto Financiero y Fiscal',
    'Compra de Contado',
    'Crédito Bancario',
    'Arrendamiento Puro (Leasing)',
  ];
  lineas.push(encabezadosMatriz.map(escaparCSV).join(','));

  const filasMatriz: Array<[string, string | number, string | number, string | number]> = [
    [
      'Desembolso Inicial sin IVA ($)',
      contado.desembolsoInicialSinIva,
      credito.desembolsoInicialSinIva,
      leasing.desembolsoInicialSinIva,
    ],
    [
      'Pago Mensual Promedio sin IVA ($)',
      contado.pagoMensualPromedioSinIva,
      credito.pagoMensualPromedioSinIva,
      leasing.pagoMensualPromedioSinIva,
    ],
    [
      'Valor Residual / Opción Terminal ($)',
      contado.pagoTerminalSinIva,
      credito.pagoTerminalSinIva,
      leasing.pagoTerminalSinIva,
    ],
    [
      'Total Erogado Neto sin IVA Acreditable ($)',
      contado.totalErogadoSinIva,
      credito.totalErogadoSinIva,
      leasing.totalErogadoSinIva,
    ],
    [
      'Total IVA Acreditable en el Plazo ($)',
      contado.totalIvaAcreditable,
      credito.totalIvaAcreditable,
      leasing.totalIvaAcreditable,
    ],
    [
      'Proporción Deducible LISR (%)',
      `${contado.proporcionDeduciblePorcentaje}%`,
      `${credito.proporcionDeduciblePorcentaje}%`,
      `${leasing.proporcionDeduciblePorcentaje}%`,
    ],
    [
      'Deducción Fiscal Acumulada en el Plazo ($)',
      contado.deduccionFiscalTotalPlazo,
      credito.deduccionFiscalTotalPlazo,
      leasing.deduccionFiscalTotalPlazo,
    ],
    ['Ahorro en ISR ($)', contado.ahorroIsrPlazo, credito.ahorroIsrPlazo, leasing.ahorroIsrPlazo],
    ['Ahorro en PTU ($)', contado.ahorroPtuPlazo, credito.ahorroPtuPlazo, leasing.ahorroPtuPlazo],
    [
      'Escudo Fiscal Total (ISR + PTU) ($)',
      contado.ahorroFiscalTotal,
      credito.ahorroFiscalTotal,
      leasing.ahorroFiscalTotal,
    ],
    [
      'COSTO NETO REAL DESPUÉS DE IMPUESTOS ($)',
      contado.costoNetoDespuesImpuestos,
      credito.costoNetoDespuesImpuestos,
      leasing.costoNetoDespuesImpuestos,
    ],
    ['Fundamento Legal', contado.fundamentoLegal, credito.fundamentoLegal, leasing.fundamentoLegal],
  ];

  for (const f of filasMatriz) {
    lineas.push(f.map(escaparCSV).join(','));
  }

  lineas.push('');
  lineas.push('2. FLUJO ANUALIZADO Y ESCUDO FISCAL POR EJERCICIO');
  const encabezadosAnual = [
    'Año',
    'Meses',
    'Contado Desembolso ($)',
    'Contado Deducción ($)',
    'Contado Ahorro Fiscal ($)',
    'Contado Costo Neto ($)',
    'Crédito Desembolso ($)',
    'Crédito Deducción ($)',
    'Crédito Ahorro Fiscal ($)',
    'Crédito Costo Neto ($)',
    'Leasing Desembolso ($)',
    'Leasing Deducción ($)',
    'Leasing Ahorro Fiscal ($)',
    'Leasing Costo Neto ($)',
  ];
  lineas.push(encabezadosAnual.map(escaparCSV).join(','));

  for (const fa of flujoAnual) {
    lineas.push(
      [
        `Año ${fa.anio}`,
        fa.mesesEnAnio,
        fa.contadoDesembolso,
        fa.contadoDeduccion,
        fa.contadoAhorroFiscal,
        fa.contadoFlujoNeto,
        fa.creditoDesembolso,
        fa.creditoDeduccion,
        fa.creditoAhorroFiscal,
        fa.creditoFlujoNeto,
        fa.leasingDesembolso,
        fa.leasingDeduccion,
        fa.leasingAhorroFiscal,
        fa.leasingFlujoNeto,
      ]
        .map(escaparCSV)
        .join(',')
    );
  }

  lineas.push('');
  lineas.push(`Dictamen Pericial,${escaparCSV(resultado.dictamenPericial)}`);

  return '\uFEFF' + lineas.join('\r\n');
}

export function descargarCSVComparativaFiscal(
  resultado: ResultadoComparativaFiscal,
  nombreArchivo?: string
): void {
  const contenido = generarCSVComparativaFiscal(resultado);
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const fechaIso = new Date().toISOString().slice(0, 10);
  const nombreFinal = nombreArchivo || `ARK_Cedula_Comparativa_Leasing_Fiscal_${fechaIso}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreFinal);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Exportadores legacy (compatibilidad) ───────────────────────────────
export function generarCSVProyeccion(proyeccion: ProyeccionMes[], resumen: ResumenLeasing): string {
  const lineas: string[] = [];
  lineas.push('PROYECCIÓN DE LEASING RECURRENTE — ARK LEDGER');
  lineas.push(`MRR Final,${resumen.mrrFinal}`);
  lineas.push(`ARR Proyectado,${resumen.arrProyectado}`);
  lineas.push(`Clientes Finales,${resumen.clientesFinales}`);
  lineas.push('');

  const encabezados = [
    'Mes',
    'Clientes Inicio',
    'Clientes Nuevos',
    'Clientes Perdidos',
    'Clientes Cierre',
    'Ingresos Setup ($)',
    'Ingresos Rentas ($)',
    'Ingreso Total Mes ($)',
    'Costos Directos ($)',
    'Utilidad Mes ($)',
    'Ingreso Acumulado ($)',
    'Utilidad Acumulada ($)',
  ];
  lineas.push(encabezados.map(escaparCSV).join(','));

  for (const m of proyeccion) {
    lineas.push(
      [
        `Mes ${m.mes}`,
        m.clientesInicio,
        m.clientesNuevos,
        m.clientesPerdidos,
        m.clientesFin,
        m.ingresosSetup,
        m.ingresosRentas,
        m.ingresoTotalMes,
        m.costosDirectos,
        m.utilidadMes,
        m.ingresoAcumulado,
        m.utilidadAcumulada,
      ]
        .map(escaparCSV)
        .join(',')
    );
  }

  return '\uFEFF' + lineas.join('\r\n');
}

export function descargarCSVProyeccion(
  proyeccion: ProyeccionMes[],
  resumen: ResumenLeasing,
  nombreArchivo?: string
): void {
  const contenido = generarCSVProyeccion(proyeccion, resumen);
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const fechaIso = new Date().toISOString().slice(0, 10);
  const nombreFinal = nombreArchivo || `ARK_Proyeccion_Leasing_${fechaIso}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreFinal);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

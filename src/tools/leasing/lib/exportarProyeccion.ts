/**
 * ARK TOOLS — Calculadora de Leasing
 * Exportador de Proyección Financiera a CSV para Excel
 */

import type { ProyeccionMes, ResumenLeasing } from '../types';

function escaparCSV(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return '';
  const str = String(valor).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generarCSVProyeccion(
  proyeccion: ProyeccionMes[],
  resumen: ResumenLeasing
): string {
  const lineas: string[] = [];

  lineas.push('PROYECCIÓN DE LEASING RECURRENTE ($500 SETUP → $2,500 RENTA) — ARK TOOLS');
  lineas.push(`MRR Final,${resumen.mrrFinal}`);
  lineas.push(`ARR Proyectado,${resumen.arrProyectado}`);
  lineas.push(`Clientes Finales,${resumen.clientesFinales}`);
  lineas.push(`Ingreso Bruto Total,${resumen.ingresoBrutoTotal}`);
  lineas.push(`Utilidad Total Acumulada,${resumen.utilidadTotalAcumulada}`);
  lineas.push(`Margen Promedio,${resumen.margenPromedioPorcentaje}%`);
  lineas.push(`LTV Estimado por Cliente,${resumen.ltvEstimado}`);
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
    const fila = [
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
    ];
    lineas.push(fila.map(escaparCSV).join(','));
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

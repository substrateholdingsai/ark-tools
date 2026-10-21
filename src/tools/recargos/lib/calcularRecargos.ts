/**
 * ARK TOOLS — Motor Matemático de Actualización y Recargos Fiscales
 *
 * Implementa la legislación tributaria federal mexicana:
 * 1. Artículo 17-A del Código Fiscal de la Federación:
 *    - Actualización por inflación usando el INPC del mes anterior al más reciente
 *      entre el INPC del mes anterior al más antiguo del periodo.
 *    - Factor truncado al diezmilésimo (4 decimales) sin redondeo.
 *    - Regla de no-deflación: Si el factor resultante es menor a 1, se aplica 1.0000.
 * 2. Artículo 21 del Código Fiscal de la Federación y Artículo 8 LIF:
 *    - Recargos por mora en concepto de indemnización al fisco federal.
 *    - Cómputo por cada mes o fracción de mes que transcurra.
 *    - Tasa oficial de 1.47% mensual según la Ley de Ingresos de la Federación.
 */

import {
  TASA_RECARGOS_MORA_MENSUAL,
  obtenerInpc,
  obtenerUltimoInpc,
} from '@/data/valores-vigentes/catalogo';
import { numeroALetras } from '@/lib/numeroALetras';
import type {
  EntradaRecargos,
  FactorActualizacionDetalle,
  DesgloseMesRecargo,
  ResultadoRecargos,
} from '../types';

export const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface FechaPartes {
  anio: number;
  mes: number; // 1 - 12
  dia: number; // 1 - 31
}

/**
 * Parsea una fecha ISO YYYY-MM-DD en sus partes numéricas.
 */
export function parseFechaISO(fechaStr: string): FechaPartes {
  const [anioStr, mesStr, diaStr] = fechaStr.split('-');
  const anio = Number(anioStr) || 2026;
  const mes = Number(mesStr) || 1;
  const dia = Number(diaStr) || 1;
  return { anio, mes, dia };
}

/**
 * Retorna el mes y año inmediatamente anteriores (M - 1).
 */
export function obtenerMesAnterior(anio: number, mes: number): { anio: number; mes: number } {
  if (mes === 1) {
    return { anio: anio - 1, mes: 12 };
  }
  return { anio, mes: mes - 1 };
}

/**
 * Trunca un número decimal a un número específico de decimales sin redondear.
 * Conforme al Art. 17-A CFF: "hasta el diezmilésimo" (4 decimales).
 */
export function truncarDiezmilesimo(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 1.0;
  // Multiplicamos por 10,000, truncamos con Math.floor considerando precisión flotante
  return Math.floor(num * 10000 + 0.0000001) / 10000;
}

/**
 * Determina el factor de actualización conforme al Art. 17-A del CFF.
 *
 * @param fechaVencimiento Fecha límite en que debió cubrirse la contribución (YYYY-MM-DD)
 * @param fechaPago Fecha efectiva en que se efectúa el pago (YYYY-MM-DD)
 */
export function obtenerFactorActualizacion(
  fechaVencimiento: string,
  fechaPago: string
): FactorActualizacionDetalle {
  const fVenc = parseFechaISO(fechaVencimiento);
  const fPago = parseFechaISO(fechaPago);

  // Si la fecha de pago es anterior o igual a la de vencimiento, o en el mismo mes/año:
  const vencTotalMeses = fVenc.anio * 12 + fVenc.mes;
  const pagoTotalMeses = fPago.anio * 12 + fPago.mes;

  // Mes anterior al más antiguo (mes en que debió pagarse)
  const antiguo = obtenerMesAnterior(fVenc.anio, fVenc.mes);
  const claveAntiguo = `${antiguo.anio}-${String(antiguo.mes).padStart(2, '0')}`;
  const nombreAntiguo = `${NOMBRES_MESES[antiguo.mes - 1]} ${antiguo.anio}`;

  // Mes anterior al más reciente (mes en que se efectúa el pago)
  const reciente = obtenerMesAnterior(fPago.anio, fPago.mes);
  const claveReciente = `${reciente.anio}-${String(reciente.mes).padStart(2, '0')}`;
  const nombreReciente = `${NOMBRES_MESES[reciente.mes - 1]} ${reciente.anio}`;

  // Si se paga en el mismo mes en que venció (o antes)
  if (pagoTotalMeses <= vencTotalMeses) {
    const inpcRef = obtenerInpc(antiguo.anio, antiguo.mes) ?? 140.0;
    return {
      inpcReciente: inpcRef,
      periodoInpcReciente: nombreAntiguo,
      claveInpcReciente: claveAntiguo,
      inpcAntiguo: inpcRef,
      periodoInpcAntiguo: nombreAntiguo,
      claveInpcAntiguo: claveAntiguo,
      cociente: 1.0,
      factorTruncado: 1.0,
      esDeflacion: false,
      factorFinal: 1.0,
    };
  }

  // Obtener INPC del denominador (mes anterior al del adeudo)
  let inpcAntiguo = obtenerInpc(antiguo.anio, antiguo.mes);
  if (!inpcAntiguo) {
    // Si la fecha es muy antigua (anterior al catálogo), tomamos el primer INPC disponible
    inpcAntiguo = 110.129; // Ene 2021
  }

  // Obtener INPC del numerador (mes anterior al del pago)
  let inpcReciente = obtenerInpc(reciente.anio, reciente.mes);
  let notaPublicacion: string | undefined;

  if (!inpcReciente) {
    // Penúltimo párrafo Art. 17-A CFF:
    // Si aún no se publica el INPC del mes anterior al más reciente,
    // se aplica el último índice mensual publicado por el INEGI.
    const ultimo = obtenerUltimoInpc();
    inpcReciente = ultimo.inpc;
    notaPublicacion = `Conforme al Art. 17-A CFF penúltimo párrafo, al no haberse publicado aún el INPC de ${nombreReciente}, se aplica el último índice oficial disponible (${NOMBRES_MESES[ultimo.mes - 1]} ${ultimo.anio}: ${ultimo.inpc}).`;
  }

  const cociente = inpcReciente / inpcAntiguo;
  const factorTruncado = truncarDiezmilesimo(cociente);

  // Sexto párrafo Art. 17-A CFF: si el factor resultante es menor a 1, será 1.
  const esDeflacion = factorTruncado < 1.0;
  const factorFinal = esDeflacion ? 1.0 : factorTruncado;

  return {
    inpcReciente,
    periodoInpcReciente: nombreReciente,
    claveInpcReciente: claveReciente,
    inpcAntiguo,
    periodoInpcAntiguo: nombreAntiguo,
    claveInpcAntiguo: claveAntiguo,
    cociente,
    factorTruncado,
    esDeflacion,
    factorFinal,
    notaPublicacion,
  };
}

/**
 * Calcula los meses o fracción de mes de mora transcurridos conforme al Art. 21 CFF:
 * "Los recargos se causarán por cada mes o fracción que transcurra a partir del día
 * en que debió hacerse el pago y hasta que el mismo se efectúe."
 */
export function calcularMesesMora(fechaVencimiento: string, fechaPago: string): number {
  const fVenc = parseFechaISO(fechaVencimiento);
  const fPago = parseFechaISO(fechaPago);

  // Comparación cronológica estricta
  const dateVenc = new Date(Date.UTC(fVenc.anio, fVenc.mes - 1, fVenc.dia));
  const datePago = new Date(Date.UTC(fPago.anio, fPago.mes - 1, fPago.dia));

  if (datePago <= dateVenc) {
    return 0;
  }

  // Diferencia base en meses
  let meses = (fPago.anio - fVenc.anio) * 12 + (fPago.mes - fVenc.mes);

  // Si el día de pago es mayor que el día de vencimiento,
  // ya inició una fracción del siguiente mes calendario (cuenta como 1 mes completo de mora).
  if (fPago.dia > fVenc.dia) {
    meses += 1;
  }

  // Si estaban en el mismo mes y el día de pago es mayor
  if (meses <= 0 && datePago > dateVenc) {
    meses = 1;
  }

  return meses;
}

/**
 * Genera la tabla analítica mes a mes de los recargos acumulados.
 */
export function generarDesgloseMesesRecargo(
  fVenc: FechaPartes,
  mesesMora: number,
  baseCalculo: number,
  tasaMensual: number
): DesgloseMesRecargo[] {
  const desglose: DesgloseMesRecargo[] = [];
  if (mesesMora <= 0) return desglose;

  let mesActual = fVenc.mes;
  let anioActual = fVenc.anio;

  for (let i = 1; i <= mesesMora; i++) {
    // Avanzar mes a mes en el periodo de mora
    mesActual += 1;
    if (mesActual > 12) {
      mesActual = 1;
      anioActual += 1;
    }

    const periodo = `${NOMBRES_MESES[mesActual - 1]} ${anioActual}`;
    const tasaAcumulada = Number((i * tasaMensual).toFixed(2));
    const recargoMes = Math.round(baseCalculo * (tasaMensual / 100) * 100) / 100;
    const recargoAcumulado = Math.round(baseCalculo * (tasaAcumulada / 100) * 100) / 100;

    desglose.push({
      numero: i,
      periodo,
      tasaMensual,
      tasaAcumulada,
      baseCalculo,
      recargoMes,
      recargoAcumulado,
    });
  }

  return desglose;
}

/**
 * Realiza el cálculo integral de Actualización por Inflación (Art. 17-A CFF)
 * y Recargos por Mora (Art. 21 CFF + LIF Art. 8).
 */
export function calcularRecargosYActualizacion(entrada: EntradaRecargos): ResultadoRecargos {
  const importeHistorico = Math.max(0, Number(entrada.importeHistorico) || 0);
  const tasaRecargosMensual = Number(entrada.tasaRecargosMensual ?? TASA_RECARGOS_MORA_MENSUAL);

  const factorDetalle = obtenerFactorActualizacion(entrada.fechaVencimiento, entrada.fechaPago);
  const factorActualizacion = factorDetalle.factorFinal;

  // Impuesto Actualizado (Art. 17-A CFF)
  const impuestoActualizado = Math.round(importeHistorico * factorActualizacion * 100) / 100;
  const montoActualizacion = Math.round((impuestoActualizado - importeHistorico) * 100) / 100;

  // Meses de mora (Art. 21 CFF)
  const mesesMora = calcularMesesMora(entrada.fechaVencimiento, entrada.fechaPago);
  const tasaRecargosTotal = Number((mesesMora * tasaRecargosMensual).toFixed(2));

  // Monto de recargos: Se calcula sobre el monto actualizado de las contribuciones (Art. 21 CFF)
  const montoRecargos = Math.round(impuestoActualizado * (tasaRecargosTotal / 100) * 100) / 100;

  // Total a pagar
  const totalPagar = Math.round((impuestoActualizado + montoRecargos) * 100) / 100;
  const totalEnLetras = numeroALetras(totalPagar);

  // Desglose analítico
  const fVenc = parseFechaISO(entrada.fechaVencimiento);
  const desgloseMeses = generarDesgloseMesesRecargo(
    fVenc,
    mesesMora,
    impuestoActualizado,
    tasaRecargosMensual
  );

  return {
    importeHistorico,
    fechaVencimiento: entrada.fechaVencimiento,
    fechaPago: entrada.fechaPago,
    factorDetalle,
    factorActualizacion,
    impuestoActualizado,
    montoActualizacion,
    mesesMora,
    tasaRecargosMensual,
    tasaRecargosTotal,
    montoRecargos,
    totalPagar,
    totalEnLetras,
    desgloseMeses,
  };
}

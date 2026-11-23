/**
 * ARK LEDGER — Motor Matemático de Actualización y Recargos Fiscales
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
 *    - Tasa oficial de 2.07% mensual seg�n la Ley de Ingresos de la Federaci�n (LIF 2026).
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
  TipoRecargo,
} from '../types';
import { TASA_RECARGOS_MORA_YUCATAN_2026 } from '../data/constantes';

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
  let notaPublicacionAntiguo: string | undefined;
  if (!inpcAntiguo) {
    // Si la fecha es muy antigua (anterior al catálogo), tomamos el primer INPC disponible
    inpcAntiguo = 110.129; // Ene 2021
    notaPublicacionAntiguo = `INPC del mes anterior al vencimiento (${nombreAntiguo}) no disponible en el catálogo DOF; se usó valor de respaldo Ene 2021 (110.129) sin nota oficial de publicación.`;
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
    notaPublicacionAntiguo,
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
export function obtenerTasaRecargosMensual(tipoRecargo: TipoRecargo): number {
  if (tipoRecargo === 'federal') return TASA_RECARGOS_MORA_MENSUAL;
  return TASA_RECARGOS_MORA_YUCATAN_2026;
}

export function calcularRecargosYActualizacion(
  entrada: EntradaRecargos,
  tipoRecargo: TipoRecargo = entrada.tipoRecargo ?? 'federal'
): ResultadoRecargos {
  const importeHistorico = Math.max(0, Number(entrada.importeHistorico) || 0);
  const tasaBase = obtenerTasaRecargosMensual(tipoRecargo);
  const tasaRecargosMensual = Number(
    tipoRecargo === 'federal' ? (entrada.tasaRecargosMensual ?? tasaBase) : tasaBase
  );

  const factorDetalle = obtenerFactorActualizacion(entrada.fechaVencimiento, entrada.fechaPago);
  const factorActualizacion = factorDetalle.factorFinal;

  // Impuesto Actualizado (Art. 17-A CFF)
  const impuestoActualizado = Math.round(importeHistorico * factorActualizacion * 100) / 100;
  const montoActualizacion = Math.round((impuestoActualizado - importeHistorico) * 100) / 100;

  // Meses de mora (Art. 21 CFF) con tope legal de 60 meses (124.2%)
  const mesesMoraBruto = calcularMesesMora(entrada.fechaVencimiento, entrada.fechaPago);
  const TOPE_MESES_RECARGOS = 60;
  const mesesCobrados = Math.min(mesesMoraBruto, TOPE_MESES_RECARGOS);
  const recargosCapped = mesesMoraBruto > TOPE_MESES_RECARGOS;
  const tasaRecargosTotal = Number((mesesCobrados * tasaRecargosMensual).toFixed(2));

  // Monto de recargos: Se calcula sobre el monto actualizado de las contribuciones (Art. 21 CFF), plano, no compuesto
  const montoRecargos = Math.round(impuestoActualizado * (tasaRecargosTotal / 100) * 100) / 100;

  // Total a pagar
  const totalPagar = Math.round((impuestoActualizado + montoRecargos) * 100) / 100;
  const totalEnLetras = numeroALetras(totalPagar);

  // Advertencias (tope de recargos, fallbacks de INPC)
  const advertencias: string[] = [];
  if (recargosCapped) {
    advertencias.push(
      `Tope de recargos Art. 21 CFF aplicado: la mora de ${mesesMoraBruto} mes(es) excede los 60 meses; los recargos se limitan a 60 meses (tasa acumulada ${tasaRecargosTotal}%).`
    );
  }
  if (factorDetalle.notaPublicacionAntiguo) {
    advertencias.push(factorDetalle.notaPublicacionAntiguo);
  }

  // Desglose analítico (sobre los meses efectivamente cobrados, respetando el tope)
  const fVenc = parseFechaISO(entrada.fechaVencimiento);
  const desgloseMeses = generarDesgloseMesesRecargo(
    fVenc,
    mesesCobrados,
    impuestoActualizado,
    tasaRecargosMensual
  );

  // Folio de Integridad (token determinista derivado del payload; no constituye sellado fiscal ante SAT)
  const folioDeIntegridad = generarFolioDeIntegridad({
    importeHistorico,
    fechaVencimiento: entrada.fechaVencimiento,
    fechaPago: entrada.fechaPago,
    factorActualizacion,
    mesesMora: mesesMoraBruto,
    tasaRecargosTotal,
    montoRecargos,
    totalPagar,
  });

  return {
    tipoRecargo,
    importeHistorico,
    fechaVencimiento: entrada.fechaVencimiento,
    fechaPago: entrada.fechaPago,
    factorDetalle,
    factorActualizacion,
    impuestoActualizado,
    montoActualizacion,
    mesesMora: mesesMoraBruto,
    mesesCobrados,
    recargosCapped,
    tasaRecargosMensual,
    tasaRecargosTotal,
    montoRecargos,
    totalPagar,
    totalEnLetras,
    folioDeIntegridad,
    advertencias,
    desgloseMeses,
  };
}

/**
 * Campos canónicos de entrada de Recargos. Cualquier otro campo se rechaza con 400
 * (sin valores por defecto silenciosos, idéntico al contrato de Nómina).
 */
export const CAMPOS_CANONICOS_RECARGOS = new Set([
  'importeHistorico',
  'fechaVencimiento',
  'fechaPago',
  'tasaRecargosMensual',
  'tipoRecargo',
]);

/**
 * Valida estrictamente los campos de entrada de Recargos (usado en Preview y IA).
 * No aplica valores por defecto silenciosos.
 */
export function validarEntradaRecargos(entrada: Record<string, unknown>): {
  ok: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  const camposNoPermitidos = Object.keys(entrada).filter((k) => !CAMPOS_CANONICOS_RECARGOS.has(k));
  if (camposNoPermitidos.length > 0) {
    errores.push(`Campos no permitidos para Recargos: ${camposNoPermitidos.join(', ')}.`);
  }

  const importe = Number(entrada.importeHistorico);
  if (!Number.isFinite(importe) || importe <= 0) {
    errores.push("'importeHistorico' debe ser un número mayor a 0.");
  }

  const fVenc = entrada.fechaVencimiento
    ? parseFechaISOEstricta(String(entrada.fechaVencimiento))
    : null;
  const fPago = entrada.fechaPago ? parseFechaISOEstricta(String(entrada.fechaPago)) : null;

  if (!fVenc) {
    errores.push("'fechaVencimiento' es requerida y debe tener formato ISO YYYY-MM-DD válido.");
  }
  if (!fPago) {
    errores.push("'fechaPago' es requerida y debe tener formato ISO YYYY-MM-DD válido.");
  }
  if (fVenc && fPago) {
    const dv = Date.UTC(fVenc.anio, fVenc.mes - 1, fVenc.dia);
    const dp = Date.UTC(fPago.anio, fPago.mes - 1, fPago.dia);
    if (dp < dv) {
      errores.push("'fechaPago' no puede ser anterior a 'fechaVencimiento'.");
    }
  }

  if (entrada.tipoRecargo !== undefined) {
    if (entrada.tipoRecargo !== 'federal' && entrada.tipoRecargo !== 'estatal_yucatan') {
      errores.push("'tipoRecargo' debe ser 'federal' o 'estatal_yucatan'.");
    }
  }

  return { ok: errores.length === 0, errores };
}

const FECHA_ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parsea estrictamente una fecha ISO YYYY-MM-DD (sin valores por defecto que oculten errores).
 */
export function parseFechaISOEstricta(
  fechaStr: string
): { anio: number; mes: number; dia: number } | null {
  const m = FECHA_ISO_RE.exec(fechaStr);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  if (d.getUTCFullYear() !== anio || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
    return null;
  }
  return { anio, mes, dia };
}

/**
 * Hash determinista FNV-1a 32 bits sobre una cadena.
 */
function hashFnv1a32(str: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Genera el Folio de Integridad (token determinista) derivado del payload del cálculo.
 * Cambiar cualquier entrada cambia el folio. No es un sello fiscal ante el SAT.
 */
export function generarFolioDeIntegridad(campos: {
  importeHistorico: number;
  fechaVencimiento: string;
  fechaPago: string;
  factorActualizacion: number;
  mesesMora: number;
  tasaRecargosTotal: number;
  montoRecargos: number;
  totalPagar: number;
}): string {
  const input = [
    String(campos.importeHistorico),
    campos.fechaVencimiento,
    campos.fechaPago,
    String(campos.factorActualizacion),
    String(campos.mesesMora),
    String(campos.tasaRecargosTotal),
    String(campos.montoRecargos),
    String(campos.totalPagar),
  ].join('|');
  return `REC-${hashFnv1a32(input).toString(16).padStart(8, '0')}`;
}

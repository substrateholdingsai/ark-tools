import { numeroALetras } from '@/lib/numeroALetras';
import {
  TASA_ISR_RESICO_PM,
  TOPE_ANUAL_RESICO_PM,
  FUNDAMENTOS_LEGALES,
} from '../data/tablasResico';
import type { EntradaResicoPM, ResultadoResicoPM, DesgloseImpuesto } from '../types';

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Motor de cálculo mensual para Personas Morales en RESICO (Flujo de Efectivo).
 * Conforme a los Artículos 206 al 215 de la LISR y Artículos 1 y 5 de la LIVA.
 */
export function calcularResicoPM(entrada: EntradaResicoPM): ResultadoResicoPM {
  const ingresosAcum = Math.max(0, entrada.ingresosCobradosAcumulados || 0);
  const deduccionesAcum = Math.max(0, entrada.deduccionesAutorizadasAcumuladas || 0);
  const ptu = Math.max(0, entrada.ptuPagada || 0);
  const perdidas = Math.max(0, entrada.perdidasFiscalesPendientes || 0);

  // 1. Base Gravable (Utilidad Fiscal Acumulada a Flujo de Efectivo)
  const utilidadBruta = round2(ingresosAcum - deduccionesAcum);
  const utilidadFiscalBase = Math.max(0, round2(utilidadBruta - ptu - perdidas));

  // 2. ISR Causado Acumulado al 30% (Art. 211 LISR)
  const isrCausadoAcumulado = round2(utilidadFiscalBase * TASA_ISR_RESICO_PM);

  // 3. Acreditamiento de pagos provisionales y retenciones acumuladas
  const pagosPrevios = Math.max(0, entrada.pagosProvisionalesPrevios || 0);
  const retencionesAcum = Math.max(0, entrada.retencionesISRAcumuladas || 0);

  const isrNetoPagar = Math.max(0, round2(isrCausadoAcumulado - pagosPrevios - retencionesAcum));

  // 4. IVA del mes
  const ivaCobrado = Math.max(0, entrada.ivaCobrado || 0);
  const ivaAcreditable = Math.max(0, entrada.ivaAcreditablePagado || 0);
  const retencionIVA = Math.max(0, entrada.retencionIVAMes || 0);

  const ivaNetoPagar = round2(ivaCobrado - ivaAcreditable - retencionIVA);

  // 5. Total a pagar
  const totalImpuestosPagar = round2(isrNetoPagar + Math.max(0, ivaNetoPagar));
  const totalEnLetras = numeroALetras(totalImpuestosPagar);

  // 6. Validación de tope de $35,000,000 (Art. 206 LISR)
  const rebasoTope = ingresosAcum > TOPE_ANUAL_RESICO_PM;

  // 7. Advertencias normativas
  const advertencias: string[] = [];
  if (rebasoTope) {
    advertencias.push(
      `⚠️ EXCESO DE TOPE PM ($35M): Los ingresos acumulados ($${ingresosAcum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}) rebasan el límite del Art. 206 LISR. La sociedad deberá tributar bajo el Régimen General de Ley (Título II LISR) a partir del siguiente ejercicio.`
    );
  }

  if (utilidadFiscalBase === 0 && ingresosAcum > 0) {
    advertencias.push(
      'ℹ️ BASE CERO: Las deducciones autorizadas, PTU o pérdidas amortizadas absorbieron la totalidad de los ingresos acumulados. No se causa ISR en este período.'
    );
  }

  if (ivaNetoPagar < 0) {
    advertencias.push(
      `ℹ️ SALDO A FAVOR DE IVA: Se determinó un saldo a favor de $${Math.abs(ivaNetoPagar).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN acreditable contra períodos subsecuentes (Art. 6 LIVA).`
    );
  }

  // 8. Desglose analítico
  const desglose: DesgloseImpuesto[] = [
    {
      concepto: 'Ingresos Acumulados Efectivamente Cobrados',
      base: ingresosAcum,
      tasaPct: 0,
      importe: ingresosAcum,
      fundamento: 'Art. 207 LISR',
      naturaleza: 'informativo',
    },
    {
      concepto: '(-) Deducciones Autorizadas Efectivamente Pagadas',
      base: deduccionesAcum,
      tasaPct: 0,
      importe: deduccionesAcum,
      fundamento: 'Art. 208 LISR',
      naturaleza: 'deduccion',
    },
    {
      concepto: '(-) PTU Pagada en el Ejercicio',
      base: ptu,
      tasaPct: 0,
      importe: ptu,
      fundamento: 'Art. 211 segundo párrafo LISR',
      naturaleza: 'deduccion',
    },
    {
      concepto: '(-) Pérdidas Fiscales de Ejercicios Anteriores Amortizadas',
      base: perdidas,
      tasaPct: 0,
      importe: perdidas,
      fundamento: 'Art. 211 LISR en relación con Art. 57 LISR',
      naturaleza: 'deduccion',
    },
    {
      concepto: '(=) Utilidad Fiscal Base para Pago Provisional',
      base: utilidadFiscalBase,
      tasaPct: 0,
      importe: utilidadFiscalBase,
      fundamento: 'Art. 211 LISR',
      naturaleza: 'informativo',
    },
    {
      concepto: 'ISR Causado Acumulado (Tasa 30%)',
      base: utilidadFiscalBase,
      tasaPct: 30.0,
      importe: isrCausadoAcumulado,
      fundamento: 'Art. 211 y Art. 9 LISR',
      naturaleza: 'a_cargo',
    },
    {
      concepto: '(-) Pagos Provisionales de ISR Efectuados con Anterioridad',
      base: pagosPrevios,
      tasaPct: 0,
      importe: pagosPrevios,
      fundamento: 'Art. 211 penúltimo párrafo LISR',
      naturaleza: 'a_favor',
    },
    {
      concepto: '(-) Retenciones de ISR Acumuladas',
      base: retencionesAcum,
      tasaPct: 0,
      importe: retencionesAcum,
      fundamento: 'Art. 211 LISR',
      naturaleza: 'a_favor',
    },
    {
      concepto: '(=) ISR a Pagar en el Pago Provisional',
      base: utilidadFiscalBase,
      tasaPct: 30.0,
      importe: isrNetoPagar,
      fundamento: 'Art. 211 LISR',
      naturaleza: 'a_cargo',
    },
    {
      concepto: 'IVA Trasladado Efectivamente Cobrado del Mes',
      base: round2(ivaCobrado / 0.16),
      tasaPct: 16.0,
      importe: ivaCobrado,
      fundamento: 'Art. 1 LIVA',
      naturaleza: 'a_cargo',
    },
    {
      concepto: '(-) IVA Acreditable Efectivamente Pagado del Mes',
      base: round2(ivaAcreditable / 0.16),
      tasaPct: 16.0,
      importe: ivaAcreditable,
      fundamento: 'Art. 5 LIVA',
      naturaleza: 'deduccion',
    },
  ];

  if (retencionIVA > 0) {
    desglose.push({
      concepto: '(-) Retenciones de IVA del Mes',
      base: retencionIVA,
      tasaPct: 0,
      importe: retencionIVA,
      fundamento: 'Art. 1-A LIVA',
      naturaleza: 'a_favor',
    });
  }

  desglose.push({
    concepto:
      ivaNetoPagar >= 0
        ? '(=) Impuesto al Valor Agregado (IVA) a Pagar'
        : '(=) Impuesto al Valor Agregado (IVA) Saldo a Favor',
    base: Math.abs(ivaNetoPagar),
    tasaPct: 0,
    importe: ivaNetoPagar,
    fundamento: 'Arts. 1 y 5 LIVA',
    naturaleza: ivaNetoPagar >= 0 ? 'a_cargo' : 'a_favor',
  });

  return {
    tipoPersona: 'moral',
    mes: entrada.mes,
    ejercicio: entrada.ejercicio || 2026,
    ingresosCobradosAcumulados: ingresosAcum,
    deduccionesAutorizadasAcumuladas: deduccionesAcum,
    ptuPagada: ptu,
    perdidasFiscalesPendientes: perdidas,
    utilidadFiscalBase,
    tasaISRPct: 30.0,
    isrCausadoAcumulado,
    pagosProvisionalesPrevios: pagosPrevios,
    retencionesISRAcumuladas: retencionesAcum,
    isrNetoPagar,
    ivaCobrado,
    ivaAcreditable,
    retencionIVAAcreditada: retencionIVA,
    ivaNetoPagar,
    totalImpuestosPagar,
    totalEnLetras,
    topeAnualPM: TOPE_ANUAL_RESICO_PM,
    rebasoTope,
    desglose,
    fundamentoLegal: FUNDAMENTOS_LEGALES.resicoPM,
    advertencias,
  };
}

import { numeroALetras } from '@/lib/numeroALetras';
import {
  TARIFA_RESICO_PF_MENSUAL,
  TOPE_ANUAL_RESICO_PF,
  TASA_RETENCION_PM_RESICO,
  FUNDAMENTOS_LEGALES,
} from '../data/tablasResico';
import type { EntradaResicoPF, ResultadoResicoPF, DesgloseImpuesto } from '../types';

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Motor de cálculo de impuestos mensuales para Personas Físicas en RESICO.
 * Conforme al Artículo 113-E y 113-J de la LISR y Artículos 1 y 5 de la LIVA.
 */
export function calcularResicoPF(entrada: EntradaResicoPF): ResultadoResicoPF {
  const ingresosMes = Math.max(0, entrada.ingresosCobradosMes || 0);
  const ingresosPrevios = Math.max(0, entrada.ingresosAcumuladosPrevios || 0);
  const ingresosAcumuladosTotal = round2(ingresosPrevios + ingresosMes);

  // 1. Determinar el rango de tasa de ISR mensual
  let tasaISRPct = 0;
  let tasaDecimal = 0;

  if (ingresosMes > 0) {
    const rangoEncontrado = TARIFA_RESICO_PF_MENSUAL.find(
      (r) => ingresosMes >= r.limiteInferior && ingresosMes <= r.limiteSuperior
    );

    if (rangoEncontrado) {
      tasaISRPct = rangoEncontrado.tasaPct;
      tasaDecimal = rangoEncontrado.tasa;
    } else if (ingresosMes > 3500000.0) {
      // Exceso de tarifa máxima
      tasaISRPct = 2.5;
      tasaDecimal = 0.025;
    }
  }

  // 2. Cálculo del ISR causado
  const isrCausado = round2(ingresosMes * tasaDecimal);

  // 3. Retención de ISR 1.25% por Personas Morales
  let retencionISR = Math.max(0, entrada.retencionISREfectuadaPM || 0);
  if (entrada.autoCalcularRetencionPM && entrada.ingresosFacturadosPM) {
    retencionISR = round2(Math.max(0, entrada.ingresosFacturadosPM) * TASA_RETENCION_PM_RESICO);
  }

  // En pago mensual, el ISR neto no puede ser menor a cero
  const isrNetoPagar = Math.max(0, round2(isrCausado - retencionISR));

  // 4. Determinación de IVA
  const ivaCobrado = Math.max(0, entrada.ivaCobrado || 0);
  const ivaAcreditable = Math.max(0, entrada.ivaAcreditablePagado || 0);
  const retencionIVA = Math.max(0, entrada.retencionIVAEfectuadaPM || 0);

  // IVA a cargo (>0) o saldo a favor (<0)
  const ivaNetoPagar = round2(ivaCobrado - ivaAcreditable - retencionIVA);

  // 5. Total a pagar (ISR + IVA positivo)
  const totalImpuestosPagar = round2(isrNetoPagar + Math.max(0, ivaNetoPagar));
  const totalEnLetras = numeroALetras(totalImpuestosPagar);

  // 6. Evaluación de tope $3,500,000
  const porcentajeConsumoTope = round2((ingresosAcumuladosTotal / TOPE_ANUAL_RESICO_PF) * 100);
  const rebasoTope = ingresosAcumuladosTotal > TOPE_ANUAL_RESICO_PF;

  let alertaTope: 'seguro' | 'preventivo' | 'critico' | 'excedido' = 'seguro';
  if (rebasoTope) {
    alertaTope = 'excedido';
  } else if (porcentajeConsumoTope >= 90) {
    alertaTope = 'critico';
  } else if (porcentajeConsumoTope >= 75) {
    alertaTope = 'preventivo';
  }

  // 7. Advertencias y avisos normativos
  const advertencias: string[] = [];
  if (rebasoTope) {
    advertencias.push(
      `⚠️ ALERTA EXCESO DE TOPE: Los ingresos acumulados ($${ingresosAcumuladosTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}) han superado el límite de $3,500,000.00 MXN. Conforme al Art. 113-E de la LISR, el contribuyente deberá migrar a Actividad Empresarial y Profesional a partir del mes siguiente.`
    );
  } else if (alertaTope === 'critico') {
    advertencias.push(
      `⚡ AVISO PREVENTIVO: Se ha ejercido el ${porcentajeConsumoTope}% del límite anual ($3.5M). Monitoree los cobros proyectados para evitar salida involuntaria del régimen.`
    );
  }

  if (ivaNetoPagar < 0) {
    advertencias.push(
      `ℹ️ SALDO A FAVOR DE IVA: Se determinó un saldo a favor de $${Math.abs(ivaNetoPagar).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN, el cual podrá acreditarse en declaraciones posteriores o solicitarse en devolución (Art. 6 LIVA).`
    );
  }

  if (retencionISR > isrCausado) {
    const remanenteRetencion = round2(retencionISR - isrCausado);
    advertencias.push(
      `ℹ️ REMANENTE DE RETENCIÓN ISR: La retención efectuada por Personas Morales ($${retencionISR.toFixed(2)}) excedió el impuesto causado del mes ($${isrCausado.toFixed(2)}) por $${remanenteRetencion.toFixed(2)} MXN. Este saldo a favor se regulariza en la Declaración Anual de RESICO.`
    );
  }

  // 8. Desglose detallado para Cédula y Papel de Trabajo
  const desglose: DesgloseImpuesto[] = [
    {
      concepto: 'Ingresos Efectivamente Cobrados del Mes',
      base: ingresosMes,
      tasaPct: 0,
      importe: ingresosMes,
      fundamento: 'Art. 113-E primer párrafo LISR',
      naturaleza: 'informativo',
    },
    {
      concepto: `ISR Causado del Mes (Tasa ${tasaISRPct}%)`,
      base: ingresosMes,
      tasaPct: tasaISRPct,
      importe: isrCausado,
      fundamento: 'Art. 113-E tabla mensual LISR',
      naturaleza: 'a_cargo',
    },
    {
      concepto: '(-) Retención de ISR por Personas Morales (1.25%)',
      base: entrada.ingresosFacturadosPM || (retencionISR > 0 ? round2(retencionISR / TASA_RETENCION_PM_RESICO) : 0),
      tasaPct: 1.25,
      importe: retencionISR,
      fundamento: 'Art. 113-J LISR',
      naturaleza: 'a_favor',
    },
    {
      concepto: '(=) Impuesto Sobre la Renta (ISR) Neto a Pagar',
      base: ingresosMes,
      tasaPct: tasaISRPct,
      importe: isrNetoPagar,
      fundamento: 'Art. 113-E y 113-J LISR',
      naturaleza: 'a_cargo',
    },
    {
      concepto: 'IVA Trasladado Efectivamente Cobrado',
      base: round2(ivaCobrado / 0.16),
      tasaPct: 16.0,
      importe: ivaCobrado,
      fundamento: 'Art. 1 LIVA',
      naturaleza: 'a_cargo',
    },
    {
      concepto: '(-) IVA Acreditable Efectivamente Pagado',
      base: round2(ivaAcreditable / 0.16),
      tasaPct: 16.0,
      importe: ivaAcreditable,
      fundamento: 'Art. 5 LIVA',
      naturaleza: 'deduccion',
    },
  ];

  if (retencionIVA > 0) {
    desglose.push({
      concepto: '(-) Retenciones de IVA Efectuadas por PM',
      base: round2(retencionIVA / 0.106667),
      tasaPct: 10.67,
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
    tipoPersona: 'fisica',
    mes: entrada.mes,
    ejercicio: entrada.ejercicio || 2026,
    ingresosCobradosMes: ingresosMes,
    ingresosAcumuladosTotal,
    tasaISRPct,
    isrCausado,
    retencionISRAcreditada: retencionISR,
    isrNetoPagar,
    ivaCobrado,
    ivaAcreditable,
    retencionIVAAcreditada: retencionIVA,
    ivaNetoPagar,
    totalImpuestosPagar,
    totalEnLetras,
    topeAnualLISR: TOPE_ANUAL_RESICO_PF,
    porcentajeConsumoTope,
    rebasoTope,
    alertaTope,
    desglose,
    fundamentoLegal: FUNDAMENTOS_LEGALES.resicoPF,
    advertencias,
  };
}

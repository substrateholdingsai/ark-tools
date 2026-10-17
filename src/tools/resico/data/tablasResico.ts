import type { RangoTarifaResicoPF, MesFiscal } from '../types';

/**
 * Tabla mensual de ISR para Personas Físicas en RESICO.
 * Fundamento: Artículo 113-E de la Ley del Impuesto sobre la Renta (LISR).
 * Publicado en el Diario Oficial de la Federación.
 */
export const TARIFA_RESICO_PF_MENSUAL: RangoTarifaResicoPF[] = [
  {
    limiteInferior: 0.01,
    limiteSuperior: 25000.0,
    tasa: 0.01,
    tasaPct: 1.0,
  },
  {
    limiteInferior: 25000.01,
    limiteSuperior: 50000.0,
    tasa: 0.011,
    tasaPct: 1.1,
  },
  {
    limiteInferior: 50000.01,
    limiteSuperior: 83333.33,
    tasa: 0.015,
    tasaPct: 1.5,
  },
  {
    limiteInferior: 83333.34,
    limiteSuperior: 208333.33,
    tasa: 0.02,
    tasaPct: 2.0,
  },
  {
    limiteInferior: 208333.34,
    limiteSuperior: 3500000.0,
    tasa: 0.025,
    tasaPct: 2.5,
  },
];

/**
 * Tope máximo anual de ingresos para tributar en RESICO Personas Físicas.
 * Art. 113-E primer y penúltimo párrafo LISR.
 */
export const TOPE_ANUAL_RESICO_PF = 3500000.0;

/**
 * Tasa de retención que deben efectuar las Personas Morales a Personas Físicas RESICO (1.25%).
 * Art. 113-J LISR.
 */
export const TASA_RETENCION_PM_RESICO = 0.0125;

/**
 * Tasa corporativa general de ISR aplicable al resultado fiscal de Personas Morales RESICO (30%).
 * Art. 211 LISR en relación con Art. 9 LISR.
 */
export const TASA_ISR_RESICO_PM = 0.3;

/**
 * Tope anual de ingresos totales para Personas Morales en RESICO (35 Millones MXN).
 * Art. 206 LISR.
 */
export const TOPE_ANUAL_RESICO_PM = 35000000.0;

/**
 * Nombres de los meses fiscales.
 */
export const NOMBRES_MESES: Record<MesFiscal, string> = {
  1: 'Enero',
  2: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Mayo',
  6: 'Junio',
  7: 'Julio',
  8: 'Agosto',
  9: 'Septiembre',
  10: 'Octubre',
  11: 'Noviembre',
  12: 'Diciembre',
};

/**
 * Fundamentos jurídicos canónicos
 */
export const FUNDAMENTOS_LEGALES = {
  resicoPF:
    'LISR Art. 113-E (Tasas Progresivas Mensuales), Art. 113-J (Retención 1.25% por PM), LIVA Arts. 1, 1-A y 5 (Acreditamiento de IVA).',
  resicoPM:
    'LISR Título VII Capítulo XII Arts. 206 al 215 (Régimen Simplificado de Confianza Personas Morales - Base Flujo de Efectivo, Tasa 30%).',
  topeExcedidoPF:
    'Art. 113-E LISR: Los contribuyentes que excedan de $3,500,000 en el ejercicio dejarán de tributar en RESICO a partir del mes siguiente.',
  ivaAcreditamiento:
    'Art. 113-I LISR y Criterio SAT: RESICO no deduce gastos para ISR, pero sí conserva pleno derecho al acreditamiento de IVA efectivamente pagado bajo el Art. 5 de la LIVA.',
};

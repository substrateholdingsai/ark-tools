export interface ParametrosModalidad40 {
  /** Último Salario Base de Cotización registrado ante el IMSS al causar baja ($ MXN diarios) */
  ultimoSbc: number;
  /** Salario diario que el asegurado desearía cotizar en Modalidad 40 ($ MXN diarios) */
  sbcDeseado: number;
  /** Semanas cotizadas acumuladas reconocidas por el IMSS al momento de causar baja */
  semanasPrevias: number;
  /** Meses proyectados a cotizar en Continuación Voluntaria (12 a 60 meses) */
  mesesAportacion: number;
  /** Edad proyectada de retiro/jubilación (60 a 65 años) */
  edadJubilacion: number;
  /** ¿Cuenta con cónyuge, concubina o solicita ayuda asistencial por soledad (15%)? */
  asignacionFamiliar: boolean;
}

export interface LimitesModalidad40 {
  /** Salario mínimo general vigente 2026 */
  salarioMinimo: number;
  /** UMA diaria vigente 2026 */
  umaDiaria: number;
  /** Tope máximo legal histórico de 25 UMAs */
  topeHistorico25Umas: number;
  /** Tope máximo permitido conforme al Acuerdo DOF 21/10/2026 = min(ultimoSbc + 1 UMA, 25 UMA) */
  limitePermitidoDof2026: number;
  /** SBC efectivo que se utilizará para el cálculo */
  sbcEfectivo: number;
  /** Indica si el salario deseado por el usuario excede el límite del nuevo acuerdo */
  excedeLimiteDof: boolean;
  /** Diferencia en pesos diarios entre el tope de 25 UMAs y el nuevo límite restringido */
  diferenciaConTopeHistorico: number;
  /** Advertencia reglamentaria oficial para el usuario */
  mensajeCriterio: string;
}

export interface InversionModalidad40 {
  /** Tasa porcentual de cuota vigente para 2026 (14.438%) */
  tasaCuotaPct: number;
  /** Aportación mensual promedio estimada al IMSS ($ MXN) */
  cuotaMensual: number;
  /** Aportación anual estimada al IMSS ($ MXN) */
  cuotaAnual: number;
  /** Inversión total acumulada por los meses proyectados ($ MXN) */
  inversionTotal: number;
  /** Desglose mensual proyectado */
  cronograma: Array<{
    mes: number;
    cuotaMes: number;
    inversionAcumulada: number;
  }>;
}

export interface ProyeccionPensionLey73 {
  /** Semanas totales acumuladas al concluir la Modalidad 40 */
  semanasTotales: number;
  /** Semanas cotizadas aportadas durante la Modalidad 40 */
  semanasM40: number;
  /** Salario promedio diario de las últimas 250 semanas ($ MXN) */
  salarioPromedioDiario: number;
  /** Factor salarial respecto al salario mínimo general */
  factorSalarioSmg: number;
  /** Porcentaje de cuantía básica (Art. 167 LSS) */
  pctCuantiaBasica: number;
  /** Porcentaje de incremento anual (Art. 167 LSS) */
  pctIncrementoAnual: number;
  /** Años de cotización que exceden de las 500 semanas básicas */
  aniosExcedentes: number;
  /** Cuantía básica anual ($ MXN) */
  cuantiaBasicaAnual: number;
  /** Importe por incrementos anuales ($ MXN) */
  incrementosAnuales: number;
  /** Pensión antes de edad y asignaciones ($ MXN) */
  pensionBaseAnual: number;
  /** Porcentaje aplicable según edad de retiro (Art. 171 LSS: 75% a 100%) */
  factorEdadPct: number;
  /** Pensión ajustada por edad ($ MXN) */
  pensionConEdad: number;
  /** Asignación familiar del 15% ($ MXN) */
  importeAsignacionFamiliar: number;
  /** Incremento del 11% por Decreto Presidencial (Factor Fox 2004) ($ MXN) */
  importeDecretoFox: number;
  /** Pensión anual total estimada ($ MXN) */
  pensionAnualTotal: number;
  /** Pensión mensual neta estimada a percibir ($ MXN) */
  pensionMensualEstimada: number;
  /** Aguinaldo anual de pensión (equivalente a 1 mes) ($ MXN) */
  aguinaldoAnual: number;
}

export interface AnalisisRoi {
  /** Pensión mensual estimada que obtendría SIN invertir en Modalidad 40 (con su último SBC) */
  pensionSinM40: number;
  /** Ganancia mensual neta añadida por la inversión en Modalidad 40 */
  incrementoMensualPension: number;
  /** Inversión total realizada en cuotas al IMSS */
  inversionTotal: number;
  /** Meses de pensión requeridos para recuperar el 100% de la inversión */
  mesesRecuperacionRoi: number;
  /** Años y meses formateados de ROI (ej. "1 año y 2 meses") */
  tiempoRecuperacionFormateado: string;
}

export interface ResultadoModalidad40 {
  parametros: ParametrosModalidad40;
  limites: LimitesModalidad40;
  inversion: InversionModalidad40;
  pension: ProyeccionPensionLey73;
  roi: AnalisisRoi;
  /** Sello criptográfico SHA-256 generado para el papel de trabajo */
  selloSha256: string;
  /** Fecha y hora UTC del cálculo */
  fechaCalculoIso: string;
}

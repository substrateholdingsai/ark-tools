/**
 * ARK LEDGER — Calculadora ISN 2026
 * Lógica de cálculo del Impuesto Sobre Nómina
 *
 * El ISN se calcula sobre la base gravable (suma de percepciones gravadas)
 * multiplicada por la tasa del estado correspondiente.
 *
 * Base legal: Códigos Fiscales Estatales 2026
 */

import type {
  ConceptoPercepcion,
  EjercicioISN,
  Estado,
  OpcionesISN,
  RegimenISN,
  ResultadoISN,
} from '../types';

/**
 * Calcula la suma de percepciones gravadas.
 * Solo considera conceptos con `gravado > 0`.
 */
export function calcularBaseGravable(conceptos: ConceptoPercepcion[]): number {
  return conceptos.reduce((total, c) => total + (c.gravado || 0), 0);
}

/**
 * Calcula la suma de percepciones exentas.
 * Solo considera conceptos con `exento > 0`.
 */
export function calcularTotalExento(conceptos: ConceptoPercepcion[]): number {
  return conceptos.reduce((total, c) => total + (c.exento || 0), 0);
}

/**
 * Calcula el ISN a pagar.
 *
 * Fórmula: ISN = Base Gravable × (Tasa / 100)
 *
 * Redondeo: 2 decimales (centavos).
 */
export function calcularISN(baseGravable: number, tasa: number): number {
  if (baseGravable <= 0 || tasa <= 0) return 0;
  const isn = baseGravable * (tasa / 100);
  return Math.round(isn * 100) / 100;
}

/**
 * Resuelve la tasa bruta, estímulo y régimen aplicable según ejercicio y opciones.
 */
export function resolverConfigTasaISN(
  estado: Estado,
  opciones?: OpcionesISN
): {
  ejercicio: EjercicioISN;
  regimen: RegimenISN;
  tasaBruta: number;
  estimuloTasa: number;
  estimuloConfirmado: boolean;
  decretoAplicado?: string;
  articuloAplicado: string;
} {
  const ejercicio: EjercicioISN = opciones?.ejercicio ?? 2026;
  const configEjercicio = estado.tasasPorEjercicio?.[ejercicio];
  const esGobierno = Boolean(opciones?.esGobiernoEstatal);
  const numEmpleados = opciones?.numEmpleados;
  const aplica27A = Boolean(opciones?.aplica27A);
  const esMicroPequenaElegible =
    ejercicio === 2026 &&
    !esGobierno &&
    Boolean(opciones?.esMicroPequena2026) &&
    numEmpleados !== undefined &&
    numEmpleados >= 1 &&
    numEmpleados <= 50 &&
    !aplica27A;

  if (configEjercicio) {
    if (esGobierno && configEjercicio.gobiernoEstatal) {
      const gov = configEjercicio.gobiernoEstatal;
      return {
        ejercicio,
        regimen: 'gobierno_estatal',
        tasaBruta: gov.tasaBruta,
        estimuloTasa: 0,
        estimuloConfirmado: gov.estimuloConfirmado ?? false,
        decretoAplicado: gov.decreto,
        articuloAplicado: gov.articulo,
      };
    }

    if (esMicroPequenaElegible && configEjercicio.microPequena) {
      const mp = configEjercicio.microPequena;
      return {
        ejercicio,
        regimen: 'micro_pequena',
        tasaBruta: mp.tasaBruta,
        estimuloTasa: mp.estimuloTasa,
        estimuloConfirmado: mp.estimuloConfirmado ?? true,
        decretoAplicado: mp.decreto,
        articuloAplicado: mp.articulo,
      };
    }

    const gen = configEjercicio.general;
    return {
      ejercicio,
      regimen: 'general',
      tasaBruta: gen.tasaBruta,
      estimuloTasa: 0,
      estimuloConfirmado: gen.estimuloConfirmado ?? true,
      decretoAplicado:
        aplica27A && opciones?.esMicroPequena2026
          ? 'Art. 27-A LGHY no acumulable con Decreto 147/2025 (estímulo = $0)'
          : gen.decreto,
      articuloAplicado: gen.articulo,
    };
  }

  // Fallback solo para estados SIN versionado por ejercicio (tasas planas).
  // Para estados versionados (ej. Yucatán) con ejercicio no publicado, fail-closed:
  // no calcular silenciosamente con la tasa plana.
  if (estado.tasasPorEjercicio && !configEjercicio) {
    throw new Error(
      `Tasa ISN no publicada para ${estado.id} ejercicio ${ejercicio}. Ejercicios soportados: ${Object.keys(estado.tasasPorEjercicio).join(', ')}.`
    );
  }

  return {
    ejercicio,
    regimen: esGobierno ? 'gobierno_estatal' : 'general',
    tasaBruta: estado.tasa,
    estimuloTasa: 0,
    estimuloConfirmado: !esGobierno,
    articuloAplicado: estado.articulo,
  };
}

/**
 * Calcula el resultado completo del ISN.
 * Función principal que agrupa todos los cálculos y estímulos versionados.
 */
export function calcularResultadoISN(
  conceptos: ConceptoPercepcion[],
  estado: Estado,
  opciones?: OpcionesISN
): ResultadoISN {
  const baseGravable = calcularBaseGravable(conceptos);
  const totalExento = calcularTotalExento(conceptos);
  const totalPercepciones = baseGravable + totalExento;
  const cfg = resolverConfigTasaISN(estado, opciones);

  const isnBruto = calcularISN(baseGravable, cfg.tasaBruta);
  const estimulo = calcularISN(baseGravable, cfg.estimuloTasa);
  const isnNeto = Math.round(Math.max(0, isnBruto - estimulo) * 100) / 100;
  const tasaEfectiva =
    baseGravable > 0 ? Math.round((isnNeto / baseGravable) * 100 * 10000) / 10000 : cfg.tasaBruta;

  return {
    baseGravable,
    totalExento,
    totalPercepciones,
    tasa: cfg.tasaBruta,
    tasaBruta: cfg.tasaBruta,
    tasaEfectiva,
    isnBruto,
    estimulo,
    isn: isnNeto,
    isnNeto,
    ejercicio: cfg.ejercicio,
    regimen: cfg.regimen,
    estimuloConfirmado: cfg.estimuloConfirmado,
    decretoAplicado: cfg.decretoAplicado,
    articuloAplicado: cfg.articuloAplicado,
  };
}

/**
 * Formatea un número como moneda MXN.
 * Ej: 45280.5 → "$45,280.50"
 */
export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Formatea un número como porcentaje.
 * Ej: 3 → "3.0%", 3.75 → "3.75%"
 */
export function formatearPorcentaje(valor: number): string {
  const tieneCentesimas = Math.round(valor * 100) % 10 !== 0;
  return `${valor.toFixed(tieneCentesimas ? 2 : 1)}%`;
}

/**
 * Formatea un número con separadores de miles, sin símbolo de moneda.
 * Ej: 45280.5 → "45,280.50"
 */
export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

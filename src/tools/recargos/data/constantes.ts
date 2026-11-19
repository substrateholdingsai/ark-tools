import { TASA_RECARGOS_MORA_MENSUAL } from '@/data/valores-vigentes/catalogo';

export const TASA_RECARGOS_MORA_PCT = TASA_RECARGOS_MORA_MENSUAL;

/** 2.07% mensual — Art. 56, Ley de Ingresos del Estado de Yucatán 2026 (Decreto 140/2025). */
export const TASA_RECARGOS_MORA_YUCATAN_2026 = 2.07;

export const RECARGOS_YUCATAN_2026 = {
  tasaMensualPct: TASA_RECARGOS_MORA_YUCATAN_2026,
  estado: 'VERIFICADO',
  fuente: {
    organismo: 'CONGRESO_ESTATAL',
    publicacion: 'Diario Oficial del Gobierno del Estado de Yucatán — Decreto 140/2025',
    url: 'https://yucatan.gob.mx/docs/regulaciones/4iyyrbqn.pdf',
    referencia:
      'Artículo 56, Ley de Ingresos del Estado de Yucatán para el Ejercicio Fiscal 2026 (Decreto 140/2025, publicado el 31-dic-2025). Tasa mensual: 2.07%.',
  },
} as const;

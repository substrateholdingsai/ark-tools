/**
 * ARK TOOLS — Calculadora ISN 2026
 * Datos oficiales de los 32 estados (tasas 2026)
 *
 * Fuente: Códigos Fiscales Estatales 2026
 * Última actualización: Octubre 2026
 */

import type { Estado } from '../types';
import { UMA, TOPES_LSS } from '@/data/valores-vigentes/catalogo';

/**
 * Valores fiscales centralizados — reemplaza hardcodes
 * El test de integridad del catálogo ya valida que UMA.diaria2026
 * y TOPES_LSS.tope25UMA2026 tengan fuente, referencia y no estén vencidos.
 */
export const UMA_DIARIA = UMA.diaria2026.valor;
export const TOPE_25_UMA = TOPES_LSS.tope25UMA2026.valor;

export const ESTADOS: Estado[] = [
  { id: 'AGS', nombre: 'Aguascalientes', corto: 'Ags', tasa: 2.0, vigencia: '2026', articulo: 'Art. 12 LHE' },
  { id: 'BC', nombre: 'Baja California', corto: 'BC', tasa: 1.8, vigencia: '2026', articulo: 'Art. 9 LHE + sobretasa' },
  { id: 'BCS', nombre: 'Baja California Sur', corto: 'BCS', tasa: 2.5, vigencia: '2026', articulo: 'Art. 14 LHE' },
  { id: 'CAMP', nombre: 'Campeche', corto: 'Camp', tasa: 3.0, vigencia: '2026', articulo: 'Art. 21 LHE' },
  { id: 'CHIS', nombre: 'Chiapas', corto: 'Chis', tasa: 2.0, vigencia: '2026', articulo: 'Art. 23 CFC' },
  { id: 'CHIH', nombre: 'Chihuahua', corto: 'Chih', tasa: 3.0, vigencia: '2026', articulo: 'Art. 6º LHE' },
  { id: 'CDMX', nombre: 'Ciudad de México', corto: 'CDMX', tasa: 3.0, vigencia: '2026', articulo: 'Art. 156 CF' },
  { id: 'COAH', nombre: 'Coahuila', corto: 'Coah', tasa: 2.0, vigencia: '2026', articulo: 'Art. 38 LHE' },
  { id: 'COL', nombre: 'Colima', corto: 'Col', tasa: 2.0, vigencia: '2026', articulo: 'Art. 41 LHE' },
  { id: 'DGO', nombre: 'Durango', corto: 'Dgo', tasa: 2.0, vigencia: '2026', articulo: 'Art. 15 LHE' },
  { id: 'MEX', nombre: 'Estado de México', corto: 'Edomex', tasa: 3.0, vigencia: '2026', articulo: 'Art. 56 CF' },
  { id: 'GTO', nombre: 'Guanajuato', corto: 'Gto', tasa: 2.3, vigencia: '2026', articulo: 'Art. 12 LHE' },
  { id: 'GRO', nombre: 'Guerrero', corto: 'Gro', tasa: 2.0, vigencia: '2026', articulo: 'Art. 28 LHE' },
  { id: 'HGO', nombre: 'Hidalgo', corto: 'Hgo', tasa: 2.5, vigencia: '2026', articulo: 'Art. 20 LHE' },
  { id: 'JAL', nombre: 'Jalisco', corto: 'Jal', tasa: 2.0, vigencia: '2026', articulo: 'Art. 37 LHE' },
  { id: 'MICH', nombre: 'Michoacán', corto: 'Mich', tasa: 2.0, vigencia: '2026', articulo: 'Art. 17 LHE' },
  { id: 'MOR', nombre: 'Morelos', corto: 'Mor', tasa: 2.0, vigencia: '2026', articulo: 'Art. 58 LGP' },
  { id: 'NAY', nombre: 'Nayarit', corto: 'Nay', tasa: 2.5, vigencia: '2026', articulo: 'Art. 22 LHE' },
  { id: 'NL', nombre: 'Nuevo León', corto: 'NL', tasa: 3.0, vigencia: '2026', articulo: 'Art. 57 LHE' },
  { id: 'OAX', nombre: 'Oaxaca', corto: 'Oax', tasa: 3.0, vigencia: '2026', articulo: 'Art. 50 LHE' },
  { id: 'PUE', nombre: 'Puebla', corto: 'Pue', tasa: 3.0, vigencia: '2026', articulo: 'Art. 23 LHE' },
  { id: 'QRO', nombre: 'Querétaro', corto: 'Qro', tasa: 2.0, vigencia: '2026', articulo: 'Art. 44 LHE' },
  { id: 'QROO', nombre: 'Quintana Roo', corto: 'Qroo', tasa: 3.0, vigencia: '2026', articulo: 'Art. 14 LHE' },
  { id: 'SLP', nombre: 'San Luis Potosí', corto: 'SLP', tasa: 2.5, vigencia: '2026', articulo: 'Art. 26 LHE' },
  { id: 'SIN', nombre: 'Sinaloa', corto: 'Sin', tasa: 2.4, vigencia: '2026', articulo: 'Art. 15 LHE' },
  { id: 'SON', nombre: 'Sonora', corto: 'Son', tasa: 2.0, vigencia: '2026', articulo: 'Art. 189 LHE' },
  { id: 'TAB', nombre: 'Tabasco', corto: 'Tab', tasa: 3.0, vigencia: '2026', articulo: 'Art. 22 LHE' },
  { id: 'TAM', nombre: 'Tamaulipas', corto: 'Tam', tasa: 2.0, vigencia: '2026', articulo: 'Art. 42 LHE' },
  { id: 'TLAX', nombre: 'Tlaxcala', corto: 'Tlax', tasa: 3.0, vigencia: '2026', articulo: 'Art. 30 CF' },
  { id: 'VER', nombre: 'Veracruz', corto: 'Ver', tasa: 3.0, vigencia: '2026', articulo: 'Art. 95 CF' },
  { id: 'YUC', nombre: 'Yucatán', corto: 'Yuc', tasa: 2.5, vigencia: '2026', articulo: 'Art. 22 LHE' },
  { id: 'ZAC', nombre: 'Zacatecas', corto: 'Zac', tasa: 2.5, vigencia: '2026', articulo: 'Art. 16 LHE' },
];

/**
 * Estado por defecto al abrir la calculadora
 */
export const ESTADO_DEFAULT_ID = 'CDMX';

/**
 * Conceptos por defecto (ejemplo inicial)
 */
export const CONCEPTOS_DEFAULT = [
  { id: 1, concepto: 'Sueldo base', gravado: 45000, exento: 0 },
  { id: 2, concepto: 'Premio de puntualidad', gravado: 3500, exento: 500 },
  { id: 3, concepto: 'Vales de despensa', gravado: 0, exento: 2800 },
  { id: 4, concepto: 'Horas extra dobles', gravado: 2100, exento: 1050 },
];

/**
 * Helper: encontrar estado por ID
 */
export function getEstadoById(id: string): Estado {
  return ESTADOS.find((e) => e.id === id) ?? ESTADOS[0]!;
}

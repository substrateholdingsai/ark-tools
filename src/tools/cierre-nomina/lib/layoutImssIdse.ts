/**
 * ARK LEDGER — Layout de Movimientos Afiliatorios IMSS / IDSE (Sprint 11 & AAFY Tripartito)
 *
 * Genera el archivo plano (.txt) de avisos afiliatorios para su transmisión directa
 * en IDSE (IMSS Desde Su Empresa) mediante el módulo DISPMAG / Lotes.
 *
 * Fundamento Legal y Técnico:
 * - Ley del Seguro Social (LSS) Arts. 15 Fracc. I, 27 y 28 (Integración y tope SBC).
 * - Reglamento de la LSS en Materia de Afiliación, Clasificación de Empresas,
 *   Recaudación y Fiscalización (RACERF).
 * - Catálogo de Movimientos Afiliatorios:
 *   - 08: Reingreso / Alta Patronal
 *   - 07: Modificación de Salario Base de Cotización (SBC)
 *   - 02: Baja de Trabajador
 */

import type { ResultadoTrabajadorNomina } from '../types';

export type ClaveMovimientoIdse = '07' | '08' | '02';

export interface ParametrosLayoutIdse {
  registroPatronal: string; // 11 posiciones (ej. Y1234567101)
  movimiento: ClaveMovimientoIdse;
  fechaMovimiento?: string; // YYYY-MM-DD o DDMMAAAA
  trabajadores: ResultadoTrabajadorNomina[];
}

/**
 * Normaliza y rellena una cadena a longitud fija con espacios a la derecha.
 */
function padDerecha(str: string | undefined | null, longitud: number): string {
  const s = (str || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .slice(0, longitud);
  return s.padEnd(longitud, ' ');
}

/**
 * Formatea número con ceros a la izquierda.
 */
function padIzquierda(num: number | string, longitud: number): string {
  const s = String(num).replace(/\D/g, '').slice(0, longitud);
  return s.padStart(longitud, '0');
}

/**
 * Desglosa un nombre completo en Apellido Paterno, Materno y Nombres.
 */
export function desglosarNombreCompleto(nombreCompleto: string): {
  paterno: string;
  materno: string;
  nombres: string;
} {
  const partes = (nombreCompleto || '').toUpperCase().trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return { paterno: 'X', materno: 'X', nombres: 'EMPLEADO' };
  }
  if (partes.length === 1) {
    return { paterno: partes[0]!, materno: '', nombres: '' };
  }
  if (partes.length === 2) {
    return { paterno: partes[0]!, materno: partes[1]!, nombres: partes[1]! };
  }
  if (partes.length === 3) {
    return { paterno: partes[0]!, materno: partes[1]!, nombres: partes[2]! };
  }
  // 4 o más partes: los dos primeros son apellidos, el resto nombres
  return {
    paterno: partes[0]!,
    materno: partes[1]!,
    nombres: partes.slice(2).join(' '),
  };
}

/**
 * Convierte fecha YYYY-MM-DD o Date a formato DDMMAAAA para IDSE.
 */
export function formatearFechaIdse(fechaStr?: string): string {
  if (!fechaStr) {
    const hoy = new Date();
    const d = String(hoy.getDate()).padStart(2, '0');
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const y = hoy.getFullYear();
    return `${d}${m}${y}`;
  }

  // Si ya viene como DDMMAAAA de 8 dígitos
  if (/^\d{8}$/.test(fechaStr)) {
    return fechaStr;
  }

  // Si viene como YYYY-MM-DD
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match && match[1] && match[2] && match[3]) {
    return `${match[3]}${match[2]}${match[1]}`;
  }

  const d = new Date(fechaStr);
  if (!isNaN(d.getTime())) {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    return `${dia}${mes}${y}`;
  }

  return '01012026';
}

/**
 * Genera una línea fija DISPMAG / IDSE para un trabajador.
 * Longitud total: 175 caracteres estándar IMSS.
 */
export function generarLineaIdse(
  t: ResultadoTrabajadorNomina,
  registroPatronal: string,
  movimiento: ClaveMovimientoIdse,
  fechaMovimiento?: string
): string {
  const regPat = padDerecha(registroPatronal.replace(/[^A-Z0-9]/gi, ''), 11);
  const nssLimpio = padIzquierda(t.nss || '00000000000', 11);

  const { paterno, materno, nombres } = desglosarNombreCompleto(t.nombre);
  const paternoPad = padDerecha(paterno, 27);
  const maternoPad = padDerecha(materno, 27);
  const nombresPad = padDerecha(nombres, 27);

  // SBC: 6 enteros + 2 decimales (8 posiciones) con ceros a la izquierda
  const sbcCentavos = Math.round((t.sbcDiario || t.salarioDiario || 0) * 100);
  const sbcPad = padIzquierda(sbcCentavos, 8);

  const tipoTrabajador = '1'; // 1 = Permanente
  const tipoSalario = '0'; // 0 = Fijo (o mixto)
  const tipoJornada = '0'; // 0 = Normal
  const fechaDdmmaaaa = formatearFechaIdse(fechaMovimiento || t.fechaIngreso);
  const claveMov = padDerecha(movimiento, 2);
  const umf = '000'; // Unidad de Medicina Familiar
  const subdelegacionGuia = '99999';
  const curpLimpia = padDerecha(t.curp || t.rfc || '', 18);
  const identificadorFin = '02';

  // Ensamble exacto de columnas IDSE
  return `${regPat}${nssLimpio}${paternoPad}${maternoPad}${nombresPad}${sbcPad}${tipoTrabajador}${tipoSalario}${tipoJornada}${fechaDdmmaaaa}${claveMov}${umf}${subdelegacionGuia}${curpLimpia}${identificadorFin}`;
}

/**
 * Genera el archivo plano completo (.txt) con todos los trabajadores.
 */
export function generarLayoutIdse(params: ParametrosLayoutIdse): string {
  const { registroPatronal, movimiento, fechaMovimiento, trabajadores } = params;
  const lineas = trabajadores
    .filter((t) => t.nss && t.nss.trim().length > 0)
    .map((t) => generarLineaIdse(t, registroPatronal, movimiento, fechaMovimiento));

  return lineas.join('\r\n');
}

/**
 * Descarga en el cliente el archivo IDSE con extensión .txt
 */
export function descargarLayoutIdse(params: ParametrosLayoutIdse): void {
  const contenido = generarLayoutIdse(params);
  const blob = new Blob([contenido], { type: 'text/plain;charset=iso-8859-1;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const tipo = params.movimiento === '08' ? 'ALTAS' : 'MODIF_SBC';
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `IDSE_${tipo}_${params.registroPatronal || 'PATRONAL'}_${fecha}.txt`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

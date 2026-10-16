/**
 * ARK TOOLS — Conversor de Importe Monetario a Letras (Español México)
 *
 * Convierte montos numéricos en pesos mexicanos al formato contable oficial:
 * Ejemplo: 15420.50 -> "QUINCE MIL CUATROCIENTOS VEINTE PESOS 50/100 M.N."
 * Conforme a las normas contables mexicanas y la Ley General de Títulos y Operaciones de Crédito.
 */

const UNIDADES: string[] = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
];

const DECENAS: string[] = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];

const CENTENAS: string[] = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function convertirGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const c = Math.floor(n / 100);
  const r = n % 100;
  let res = '';

  if (c > 0) {
    res += CENTENAS[c] + ' ';
  }

  if (r < 20) {
    res += UNIDADES[r];
  } else {
    const d = Math.floor(r / 10);
    const u = r % 10;
    if (d === 2 && u > 0) {
      res += 'VEINTI' + UNIDADES[u];
    } else {
      res += DECENAS[d];
      if (u > 0) {
        res += ' Y ' + UNIDADES[u];
      }
    }
  }

  return res.trim();
}

/**
 * Convierte un número en pesos mexicanos a su representación en letras
 * con centavos en fracción de 100 y terminación M.N.
 */
export function numeroALetras(monto: number): string {
  if (isNaN(monto) || monto === 0) {
    return 'CERO PESOS 00/100 M.N.';
  }

  const esNegativo = monto < 0;
  const absoluto = Math.abs(monto);
  const enteros = Math.floor(absoluto);
  const centavos = Math.round((absoluto - enteros) * 100);
  const centavosStr = centavos.toString().padStart(2, '0') + '/100 M.N.';

  if (enteros === 0) {
    return `CERO PESOS ${centavosStr}`;
  }

  let letras = '';

  // Millones
  const millones = Math.floor(enteros / 1_000_000);
  const restoMillones = enteros % 1_000_000;

  if (millones === 1) {
    letras += 'UN MILLÓN ';
  } else if (millones > 1) {
    letras += convertirGrupo(millones) + ' MILLONES ';
  }

  // Miles
  const miles = Math.floor(restoMillones / 1_000);
  const restoMiles = restoMillones % 1_000;

  if (miles === 1) {
    letras += 'MIL ';
  } else if (miles > 1) {
    letras += convertirGrupo(miles) + ' MIL ';
  }

  // Unidades y centenas
  if (restoMiles > 0) {
    letras += convertirGrupo(restoMiles);
  }

  letras = letras.trim();

  const moneda = enteros === 1 ? 'PESO' : 'PESOS';
  const resultado = `${esNegativo ? 'MENOS ' : ''}${letras} ${moneda} ${centavosStr}`;

  return resultado.replace(/\s+/g, ' ').trim();
}

/**
 * ARK TOOLS — Parser y Validador de Sábanas de Cobranza LFPIORPI (Sprint 12)
 *
 * Funciones para:
 * 1. Detección automática de delimitadores CSV/TSV (, ; \t).
 * 2. Mapeo flexible e insensible a mayúsculas/acentos de columnas (ID Cliente/RFC, Fecha, Monto, Concepto).
 * 3. Sanitización de montos y normalización de fechas a ISO YYYY-MM-DD.
 * 4. Generación de plantilla oficial de ejemplo descargable.
 */

import type { OperacionCobranza, ValidacionImportacionCobranza } from '../types';

/**
 * Normaliza nombres de encabezados para búsqueda tolerante de alias.
 */
function normalizarEncabezado(col: string): string {
  return col
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-z0-9]/g, ''); // Deja sólo alfanumérico
}

/**
 * Mapeo de alias de columnas permitidos para la sábana de cobranza.
 */
const ALIAS_COLUMNAS: Record<keyof OperacionCobranza, string[]> = {
  idCliente: [
    'idcliente',
    'idclienterfc',
    'rfcidcliente',
    'clienterfc',
    'rfc',
    'cliente',
    'id',
    'rfccliente',
    'rfcarrendatario',
    'arrendatario',
    'comprador',
    'contraparte',
    'clave',
    'clavecliente',
  ],
  fechaPago: [
    'fechapago',
    'fecha',
    'fechadecobro',
    'fechacobro',
    'fechatransaccion',
    'fechafactura',
    'fechadeposito',
    'date',
  ],
  montoCobrado: [
    'montocobrado',
    'monto',
    'importe',
    'total',
    'cobrado',
    'pagado',
    'subtotal',
    'pesos',
    'amount',
    'precio',
  ],
  concepto: [
    'concepto',
    'descripcion',
    'detalle',
    'motivo',
    'referencia',
    'observaciones',
    'inmueble',
    'bien',
  ],
};

/**
 * Detecta el delimitador más probable en un texto CSV/TSV.
 */
export function detectarDelimitador(contenido: string): string {
  const primeraLinea = contenido.split(/\r?\n/)[0] || '';
  const comas = (primeraLinea.match(/,/g) || []).length;
  const puntoYComas = (primeraLinea.match(/;/g) || []).length;
  const tabs = (primeraLinea.match(/\t/g) || []).length;

  if (tabs > comas && tabs > puntoYComas) return '\t';
  if (puntoYComas > comas) return ';';
  return ',';
}

/**
 * Parsea una línea de CSV respetando comillas dobles.
 */
function parsearLineaCSV(linea: string, delimitador: string): string[] {
  const resultado: string[] = [];
  let campoActual = '';
  let enComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    const siguiente = linea[i + 1];

    if (char === '"') {
      if (enComillas && siguiente === '"') {
        campoActual += '"';
        i++;
      } else {
        enComillas = !enComillas;
      }
    } else if (char === delimitador && !enComillas) {
      resultado.push(campoActual.trim());
      campoActual = '';
    } else {
      campoActual += char;
    }
  }
  resultado.push(campoActual.trim());
  return resultado;
}

/**
 * Convierte un string de monto a número seguro.
 */
export function parsearNumero(valor: unknown): number {
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
  if (!valor || typeof valor !== 'string') return 0;
  const limpio = valor.replace(/[$ ,]/g, '').trim();
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : num;
}

/**
 * Normaliza cadenas de fecha a YYYY-MM-DD.
 * Tolera formatos: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD.
 */
export function normalizarFecha(fechaStr: string): string {
  if (!fechaStr) return '';
  const limpia = fechaStr.trim();

  // Si ya viene en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpia)) {
    return limpia;
  }

  // DD/MM/YYYY o DD-MM-YYYY
  const partesDmy = limpia.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (partesDmy) {
    const dia = partesDmy[1]!.padStart(2, '0');
    const mes = partesDmy[2]!.padStart(2, '0');
    const anio = partesDmy[3]!;
    return `${anio}-${mes}-${dia}`;
  }

  // YYYY/MM/DD
  const partesYmd = limpia.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (partesYmd) {
    const anio = partesYmd[1]!;
    const mes = partesYmd[2]!.padStart(2, '0');
    const dia = partesYmd[3]!.padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  // Fallback con Date.parse
  const d = new Date(limpia);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]!;
  }

  return limpia;
}

/**
 * Parsea el contenido en texto (CSV/TSV) y valida las operaciones de cobranza.
 */
export function parsearPlantillaCobranza(contenidoTexto: string): ValidacionImportacionCobranza {
  const advertencias: string[] = [];
  const errores: string[] = [];

  if (!contenidoTexto || !contenidoTexto.trim()) {
    return {
      esValido: false,
      totalLeidos: 0,
      operacionesValidas: [],
      advertencias: [],
      errores: ['El archivo importado se encuentra vacío.'],
    };
  }

  const delimitador = detectarDelimitador(contenidoTexto);
  const lineas = contenidoTexto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length < 2) {
    return {
      esValido: false,
      totalLeidos: 0,
      operacionesValidas: [],
      advertencias: [],
      errores: ['El archivo debe contener al menos la fila de encabezados y un registro de cobro.'],
    };
  }

  // 1. Mapeo de encabezados
  const primeraLinea = lineas[0] ?? '';
  const encabezadosOriginales = parsearLineaCSV(primeraLinea, delimitador);
  const mapaColumnas: Record<string, keyof OperacionCobranza> = {};

  encabezadosOriginales.forEach((enc, index) => {
    const normal = normalizarEncabezado(enc);
    for (const [campo, aliasList] of Object.entries(ALIAS_COLUMNAS) as [
      keyof OperacionCobranza,
      string[],
    ][]) {
      if (aliasList.includes(normal)) {
        mapaColumnas[index] = campo;
        break;
      }
    }
  });

  const camposEncontrados = Object.values(mapaColumnas);
  if (!camposEncontrados.includes('idCliente')) {
    errores.push('No se encontró la columna requerida de "ID Cliente" o "RFC".');
  }
  if (!camposEncontrados.includes('fechaPago')) {
    errores.push('No se encontró la columna requerida de "Fecha de Pago".');
  }
  if (!camposEncontrados.includes('montoCobrado')) {
    errores.push('No se encontró la columna requerida de "Monto Cobrado" o "Importe".');
  }

  if (errores.length > 0) {
    return {
      esValido: false,
      totalLeidos: 0,
      operacionesValidas: [],
      advertencias,
      errores,
    };
  }

  const operacionesValidas: OperacionCobranza[] = [];

  // 2. Procesar filas de datos
  for (let i = 1; i < lineas.length; i++) {
    const lineaActual = lineas[i] ?? '';
    const fila = parsearLineaCSV(lineaActual, delimitador);
    const numFila = i + 1;

    // Fila vacía
    if (fila.every((val) => !val || val === '""')) continue;

    const dataOp: Partial<OperacionCobranza> = {};

    fila.forEach((val, colIdx) => {
      const campo = mapaColumnas[colIdx];
      if (!campo) return;
      const safeVal = val ?? '';

      if (campo === 'montoCobrado') {
        dataOp.montoCobrado = parsearNumero(safeVal);
      } else if (campo === 'fechaPago') {
        dataOp.fechaPago = normalizarFecha(safeVal);
      } else if (campo === 'idCliente') {
        dataOp.idCliente = safeVal.toUpperCase().trim();
      } else {
        dataOp[campo] = safeVal.trim();
      }
    });

    if (!dataOp.idCliente || dataOp.idCliente.trim().length === 0) {
      advertencias.push(`Fila ${numFila}: Se omitió un registro por no tener ID o RFC de cliente.`);
      continue;
    }

    if (!dataOp.fechaPago || isNaN(new Date(dataOp.fechaPago).getTime())) {
      advertencias.push(
        `Fila ${numFila} (${dataOp.idCliente}): Fecha de pago inválida o no identificada.`
      );
      continue;
    }

    const monto = dataOp.montoCobrado ?? 0;
    if (monto <= 0) {
      advertencias.push(
        `Fila ${numFila} (${dataOp.idCliente}): Monto cobrado igual o menor a cero ($${monto}).`
      );
    }

    operacionesValidas.push({
      idCliente: dataOp.idCliente,
      fechaPago: dataOp.fechaPago,
      montoCobrado: monto,
      concepto: dataOp.concepto || 'Cobranza General',
    });
  }

  return {
    esValido: operacionesValidas.length > 0,
    totalLeidos: lineas.length - 1,
    operacionesValidas,
    advertencias,
    errores:
      operacionesValidas.length === 0
        ? ['No se encontraron filas con datos válidos en el archivo.']
        : [],
  };
}

/**
 * Genera el CSV de plantilla de ejemplo oficial con operaciones representativas prellenadas.
 */
export function generarPlantillaEjemploCobranzaCSV(): string {
  const encabezados = ['ID_Cliente_RFC', 'Fecha_Pago', 'Monto_Cobrado', 'Concepto'];

  const filasEjemplo = [
    // Caso 1: Arrendatario corporativo que rebasa el umbral de Aviso (ROJO)
    ['INM-CORP-9801', '2026-01-10', '130000.00', 'Renta Mensual Corporativo Piso 4'],
    ['INM-CORP-9801', '2026-02-10', '130000.00', 'Renta Mensual Corporativo Piso 4'],
    ['INM-CORP-9801', '2026-03-10', '130000.00', 'Renta Mensual Corporativo Piso 4'], // Suma: $390,000 > $376,565 (ROJO)

    // Caso 2: Arrendatario comercial que supera Identificación (AMARILLO)
    ['GARM850412HR9', '2026-02-05', '75000.00', 'Renta Local Comercial Plaza Central'],
    ['GARM850412HR9', '2026-03-05', '75000.00', 'Renta Local Comercial Plaza Central'],
    ['GARM850412HR9', '2026-04-05', '75000.00', 'Renta Local Comercial Plaza Central'], // Suma: $225,000 > $188,282 (AMARILLO)

    // Caso 3: Arrendatario residencial por debajo de umbrales (VERDE)
    ['PERE900115LK2', '2026-03-01', '25000.00', 'Renta Departamento Torre 2'],
    ['PERE900115LK2', '2026-04-01', '25000.00', 'Renta Departamento Torre 2'], // Suma: $50,000 < $188,282 (VERDE)

    // Caso 4: Cliente con pago único alto
    [
      'LOGI771020TL4',
      '2026-04-15',
      '420000.00',
      'Depósito en garantía y primera renta nave industrial',
    ], // Suma: $420,000 (ROJO)
  ];

  return [encabezados.join(','), ...filasEjemplo.map((f) => f.join(','))].join('\r\n');
}

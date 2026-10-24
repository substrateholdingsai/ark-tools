/**
 * ARK LEDGER — Parser y Validador de Plantillas de Nómina Masiva (Sprint 11)
 *
 * Funciones para:
 * 1. Detección automática de delimitadores (coma, punto y coma, tabulador).
 * 2. Mapeo flexible de nombres de columnas (tolerancia a variaciones comunes en nóminas).
 * 3. Normalización y validación sintáctica de RFC, CURP, NSS y montos.
 * 4. Cálculo de antigüedad y días de vacaciones conforme al Art. 76 LFT (Vacaciones Dignas).
 * 5. Generación de plantilla de ejemplo oficial descargable.
 */

import type { TrabajadorFilaInput, ValidacionImportacion } from '../types';

/**
 * Calcula los días de vacaciones por ley conforme al Artículo 76 de la LFT (Reforma Vacaciones Dignas).
 */
export function calcularDiasVacacionesPorLey(aniosAntiguedad: number): number {
  const anios = Math.max(1, Math.floor(aniosAntiguedad));
  if (anios === 1) return 12;
  if (anios === 2) return 14;
  if (anios === 3) return 16;
  if (anios === 4) return 18;
  if (anios === 5) return 20;
  if (anios >= 6 && anios <= 10) return 22;
  if (anios >= 11 && anios <= 15) return 24;
  if (anios >= 16 && anios <= 20) return 26;
  if (anios >= 21 && anios <= 25) return 28;
  if (anios >= 26 && anios <= 30) return 30;
  return 32;
}

/**
 * Calcula los años cumplidos de antigüedad entre dos fechas (YYYY-MM-DD).
 */
export function calcularAntiguedadAnios(fechaIngresoStr: string, fechaCorteStr: string): number {
  if (!fechaIngresoStr) return 1;

  const ingreso = new Date(fechaIngresoStr);
  const corte = fechaCorteStr ? new Date(fechaCorteStr) : new Date();

  if (isNaN(ingreso.getTime()) || isNaN(corte.getTime())) return 1;

  let anios = corte.getFullYear() - ingreso.getFullYear();
  const m = corte.getMonth() - ingreso.getMonth();
  if (m < 0 || (m === 0 && corte.getDate() < ingreso.getDate())) {
    anios--;
  }

  return Math.max(0, anios);
}

/**
 * Normaliza nombres de encabezados para mapeo flexible.
 */
function normalizarEncabezado(col: string): string {
  return col
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^a-z0-9]/g, ''); // Deja solo alfanumérico
}

/**
 * Mapeo de alias de columnas permitidos.
 */
const ALIAS_COLUMNAS: Record<keyof TrabajadorFilaInput, string[]> = {
  id: ['id', 'clave', 'numempleado', 'noemp', 'codigo', 'num'],
  nombre: ['nombre', 'trabajador', 'empleado', 'colaborador', 'personal', 'nombrecompleto'],
  rfc: ['rfc', 'registrofc'],
  curp: ['curp'],
  nss: ['nss', 'segurosocial', 'imss', 'numseguro'],
  salarioDiario: ['salariodiario', 'sueldodiario', 'sd', 'salario', 'sueldo', 'cuotadiaria'],
  fechaIngreso: ['fechaingreso', 'fechaalta', 'alta', 'ingreso', 'fechainicio'],
  diasTrabajados: ['diastrabajados', 'dias', 'diaslab', 'diaslaborados', 'diaspagados'],
  horasExtras: ['horasextras', 'he', 'tiempoextra', 'montohe'],
  bonos: ['bonos', 'bono', 'premios', 'premio', 'incentivos'],
  otrasPercepciones: ['otraspercepciones', 'otrosingresos', 'adicionales', 'percepciones'],
  otrasDeducciones: [
    'otrasdeducciones',
    'descuentos',
    'prestamos',
    'fonacot',
    'infonavit',
    'deducciones',
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
 * Parsea una línea respetando comillas.
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
        i++; // Salta la segunda comilla
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
  // Limpia signos de pesos, comas de miles y espacios
  const limpio = valor.replace(/[$ ,]/g, '').trim();
  const num = parseFloat(limpio);
  return isNaN(num) ? 0 : num;
}

/**
 * Limpia y normaliza un RFC.
 */
export function normalizarRFC(rfc: string): string {
  if (!rfc) return '';
  return rfc
    .toUpperCase()
    .replace(/[^A-Z0-9&Ñ]/g, '')
    .trim();
}

/**
 * Limpia un NSS dejándolo solo en números (hasta 11 dígitos).
 */
export function normalizarNSS(nss: string): string {
  if (!nss) return '';
  return nss.replace(/\D/g, '').trim();
}

/**
 * Parsea el contenido en texto (CSV/TSV) y genera la lista de trabajadores validados.
 */
export function parsearPlantillaNomina(contenidoTexto: string): ValidacionImportacion {
  const advertencias: string[] = [];
  const errores: string[] = [];

  if (!contenidoTexto || !contenidoTexto.trim()) {
    return {
      esValido: false,
      totalLeidos: 0,
      trabajadoresValidos: [],
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
      trabajadoresValidos: [],
      advertencias: [],
      errores: ['El archivo debe contener al menos la fila de encabezados y un trabajador.'],
    };
  }

  // 1. Mapeo de encabezados
  const primeraLinea = lineas[0] ?? '';
  const encabezadosOriginales = parsearLineaCSV(primeraLinea, delimitador);
  const mapaColumnas: Record<string, keyof TrabajadorFilaInput> = {};

  encabezadosOriginales.forEach((enc, index) => {
    const normal = normalizarEncabezado(enc);
    for (const [campo, aliasList] of Object.entries(ALIAS_COLUMNAS) as [
      keyof TrabajadorFilaInput,
      string[],
    ][]) {
      if (aliasList.includes(normal)) {
        mapaColumnas[index] = campo;
        break;
      }
    }
  });

  // Validar campos mínimos obligatorios: nombre y salarioDiario
  const camposEncontrados = Object.values(mapaColumnas);
  if (!camposEncontrados.includes('nombre')) {
    errores.push('No se encontró la columna requerida de "Nombre" o "Trabajador".');
  }
  if (!camposEncontrados.includes('salarioDiario')) {
    errores.push('No se encontró la columna requerida de "Salario Diario" o "Sueldo Diario".');
  }

  if (errores.length > 0) {
    return {
      esValido: false,
      totalLeidos: 0,
      trabajadoresValidos: [],
      advertencias,
      errores,
    };
  }

  const trabajadoresValidos: TrabajadorFilaInput[] = [];

  // 2. Procesar filas de datos
  for (let i = 1; i < lineas.length; i++) {
    const lineaActual = lineas[i] ?? '';
    const fila = parsearLineaCSV(lineaActual, delimitador);
    const numFila = i + 1;

    // Fila vacía
    if (fila.every((val) => !val || val === '""')) continue;

    const dataTrabajador: Partial<TrabajadorFilaInput> = {};

    fila.forEach((val, colIdx) => {
      const campo = mapaColumnas[colIdx];
      if (!campo) return;
      const safeVal = val ?? '';

      if (
        campo === 'salarioDiario' ||
        campo === 'diasTrabajados' ||
        campo === 'horasExtras' ||
        campo === 'bonos' ||
        campo === 'otrasPercepciones' ||
        campo === 'otrasDeducciones'
      ) {
        dataTrabajador[campo] = parsearNumero(safeVal);
      } else if (campo === 'rfc') {
        dataTrabajador.rfc = normalizarRFC(safeVal);
      } else if (campo === 'nss') {
        dataTrabajador.nss = normalizarNSS(safeVal);
      } else if (campo === 'curp') {
        dataTrabajador.curp = safeVal.toUpperCase().trim();
      } else {
        dataTrabajador[campo] = safeVal.trim();
      }
    });

    // Validar nombre
    if (!dataTrabajador.nombre || dataTrabajador.nombre.trim().length === 0) {
      advertencias.push(`Fila ${numFila}: Se omitió un registro por no tener nombre.`);
      continue;
    }

    // Validar salario diario
    const sd = dataTrabajador.salarioDiario || 0;
    if (sd <= 0) {
      advertencias.push(
        `Fila ${numFila} (${dataTrabajador.nombre}): Salario diario igual o menor a 0. Se asignó $0.`
      );
    }

    trabajadoresValidos.push({
      id: dataTrabajador.id || `trab_${Date.now()}_${i}`,
      nombre: dataTrabajador.nombre,
      rfc: dataTrabajador.rfc || '',
      curp: dataTrabajador.curp || '',
      nss: dataTrabajador.nss || '',
      salarioDiario: sd,
      fechaIngreso: dataTrabajador.fechaIngreso || '',
      diasTrabajados:
        dataTrabajador.diasTrabajados !== undefined ? dataTrabajador.diasTrabajados : 15,
      horasExtras: dataTrabajador.horasExtras || 0,
      bonos: dataTrabajador.bonos || 0,
      otrasPercepciones: dataTrabajador.otrasPercepciones || 0,
      otrasDeducciones: dataTrabajador.otrasDeducciones || 0,
    });
  }

  return {
    esValido: trabajadoresValidos.length > 0,
    totalLeidos: lineas.length - 1,
    trabajadoresValidos,
    advertencias,
    errores:
      trabajadoresValidos.length === 0
        ? ['No se encontraron filas válidas de trabajadores en el archivo.']
        : [],
  };
}

/**
 * Genera el CSV de plantilla de ejemplo oficial con 5 trabajadores prellenados.
 */
export function generarPlantillaEjemploCSV(): string {
  const encabezados = [
    'Clave',
    'Nombre',
    'RFC',
    'CURP',
    'NSS',
    'Salario_Diario',
    'Fecha_Ingreso',
    'Dias_Trabajados',
    'Horas_Extras',
    'Bonos',
    'Otras_Percepciones',
    'Otras_Deducciones',
  ];

  const filasEjemplo = [
    [
      'EMP-001',
      'HERNANDEZ GARCIA ROBERTO',
      'HEGR850412HR9',
      'HEGR850412HDFRRN01',
      '24058512341',
      '550.00',
      '2021-03-15',
      '15',
      '0',
      '500.00',
      '0',
      '0',
    ],
    [
      'EMP-002',
      'LOPEZ MARTINEZ MARIANA',
      'LOMM920820TL4',
      'LOMM920820MDFPRN03',
      '15109298765',
      '950.00',
      '2018-07-01',
      '15',
      '1200.00',
      '0',
      '0',
      '250.00',
    ],
    [
      'EMP-003',
      'SANCHEZ PEREZ CARLOS EDUARDO',
      'SAPC900115LK2',
      'SAPC900115HDFNNN08',
      '38129045612',
      '315.04',
      '2024-01-10',
      '15',
      '0',
      '0',
      '0',
      '0',
    ],
    [
      'EMP-004',
      'RAMIREZ ORTIZ VALENTINA',
      'RAOV961105MN1',
      'RAOV961105MDFRXA05',
      '84189678123',
      '1450.00',
      '2020-11-20',
      '15',
      '0',
      '1500.00',
      '300.00',
      '0',
    ],
    [
      'EMP-005',
      'GONZALEZ VAZQUEZ ALEJANDRO',
      'GOVA880630PX7',
      'GOVA880630HDFZNG02',
      '67088834521',
      '420.00',
      '2023-05-02',
      '14',
      '0',
      '0',
      '0',
      '100.00',
    ],
  ];

  return [encabezados.join(','), ...filasEjemplo.map((f) => f.join(','))].join('\r\n');
}

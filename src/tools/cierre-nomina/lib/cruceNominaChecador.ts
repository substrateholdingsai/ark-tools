/**
 * ARK LEDGER — Motor de Cruce Laboral-Fiscal (CFDI Nómina vs. Reloj Checador / Asistencia)
 *
 * Fundamentación jurídica:
 * 1. Reforma Laboral Art. 132 Fracc. VIII Bis LFT (Obligatoriedad de registro de jornada electrónico y fehaciente).
 * 2. Artículos 66, 67 y 68 LFT (Regulación de jornada extraordinaria: máx. 3 hrs/día, 3 veces por semana;
 *    primeras 9 horas dobles al 200%, excedente triples al 300%).
 * 3. Artículo 27 Fracción V LISR (Requisitos de las deducciones autorizadas: materialidad de nómina).
 * 4. Artículo 28 CFF y Anexo 20 SAT (Controles de asistencia como soporte probatorio de la contabilidad).
 * 5. Artículo 304-A LSS (Integración y consistencia salarial ante el IMSS).
 */

import type {
  EmpleadoCfdiNomina,
  EmpleadoChecadorConsolidado,
  DiscrepanciaColaborador,
  DictamenCruceJornada,
  NivelRiesgoCruce,
} from '../types';

/**
 * Decodifica entidades HTML/XML comunes en cadenas de texto.
 */
function decodificarEntidades(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Extrae atributos de una etiqueta XML con tolerancia a mayúsculas/minúsculas y namespaces.
 */
function extraerAtributosTag(tagContent: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(tagContent)) !== null) {
    const rawKey = match[1];
    if (!rawKey) continue;
    const key = rawKey.toLowerCase();
    const val = decodificarEntidades(match[2] ?? match[3] ?? '');
    attrs[key] = val;
    if (key.includes(':')) {
      const sinNamespace = key.split(':')[1];
      if (sinNamespace) {
        attrs[sinNamespace] = val;
      }
    }
  }

  return attrs;
}

/**
 * Parsea un XML de CFDI Nómina 1.2 (CFDI 4.0 o 3.3) y extrae los datos de jornada y percepciones.
 */
export function parsearXmlCfdiNomina(xmlString: string): EmpleadoCfdiNomina {
  if (!xmlString || typeof xmlString !== 'string') {
    throw new Error('El contenido XML del CFDI de Nómina es inválido o está vacío.');
  }

  // 1. Extraer Receptor
  const receptorMatch = xmlString.match(/<[^:]*:?Receptor\b([^>]*)\/?>/i);
  const receptorAttrs =
    receptorMatch && receptorMatch[1] ? extraerAtributosTag(receptorMatch[1]) : {};
  const rfc = (receptorAttrs.rfc || '').trim().toUpperCase();
  const nombre = (receptorAttrs.nombre || 'Colaborador Sin Nombre').trim();

  // 2. Extraer Complemento Nómina
  const nominaMatch = xmlString.match(/<[^:]*:?Nomina\b([^>]*)\/?>/i);
  const nominaAttrs = nominaMatch && nominaMatch[1] ? extraerAtributosTag(nominaMatch[1]) : {};

  const numDiasPagados = parseFloat(nominaAttrs.numdiaspagados || '15') || 15;
  const fechaInicioPago = nominaAttrs.fechainicialpago;
  const fechaFinPago = nominaAttrs.fechafinalpago;
  const totalPercepciones = parseFloat(nominaAttrs.totalpercepciones || '0') || 0;

  // 3. Extraer Receptor de Nómina (Curp, NSS)
  const receptorNominaMatch = xmlString.match(/<[^:]*:?Receptor\b[^>]*\bCurp="([^"]+)"/i);
  let curp = receptorNominaMatch ? receptorNominaMatch[1] : undefined;
  if (!curp && receptorAttrs.curp) curp = receptorAttrs.curp;

  const nssMatch = xmlString.match(/<[^:]*:?Receptor\b[^>]*\bNumSeguridadSocial="([^"]+)"/i);
  const numSeguridadSocial = nssMatch ? nssMatch[1] : undefined;

  // 4. Extraer Horas Extra de los elementos <nomina12:HorasExtra>
  let horasExtrasPagadas = 0;
  let horasDoblesPagadas = 0;
  let horasTriplesPagadas = 0;
  let importeHorasExtrasPagado = 0;

  const horasExtraRegex = /<[^:]*:?HorasExtra\b([^>]*)\/?>/gi;
  let extraMatch: RegExpExecArray | null;

  while ((extraMatch = horasExtraRegex.exec(xmlString)) !== null) {
    if (!extraMatch[1]) continue;
    const attrs = extraerAtributosTag(extraMatch[1]);
    const horas = parseFloat(attrs.horasextra || '0') || 0;
    const importe = parseFloat(attrs.importepagado || '0') || 0;
    const tipo = (attrs.tipohoras || '').toLowerCase();

    horasExtrasPagadas += horas;
    importeHorasExtrasPagado += importe;

    if (tipo.includes('triple')) {
      horasTriplesPagadas += horas;
    } else {
      horasDoblesPagadas += horas;
    }
  }

  // Si no había tags explícitos de HorasExtra, revisar si existe Percepcion con TipoPercepcion="019"
  if (horasExtrasPagadas === 0) {
    const percepcion019Match = xmlString.match(
      /<[^:]*:?Percepcion\b[^>]*TipoPercepcion="019"([^>]*)\/?>/i
    );
    if (percepcion019Match && percepcion019Match[1]) {
      const pAttrs = extraerAtributosTag(percepcion019Match[1]);
      const impGrav = parseFloat(pAttrs.importegravado || '0') || 0;
      const impEx = parseFloat(pAttrs.importeexento || '0') || 0;
      importeHorasExtrasPagado = impGrav + impEx;
    }
  }

  // 5. Extraer UUID del Timbre Fiscal Digital si existe
  const tfdMatch = xmlString.match(/<[^:]*:?TimbreFiscalDigital\b([^>]*)\/?>/i);
  const tfdAttrs = tfdMatch && tfdMatch[1] ? extraerAtributosTag(tfdMatch[1]) : {};
  const uuid = tfdAttrs.uuid;

  // Horas ordinarias esperadas en la jornada de acuerdo con los días pagados (8 hrs diarias estándar Art. 61 LFT)
  const horasOrdinariasPagadas = Math.round(numDiasPagados * 8);

  return {
    uuid,
    rfc,
    nombre,
    curp,
    numSeguridadSocial,
    fechaInicioPago,
    fechaFinPago,
    numDiasPagados,
    horasOrdinariasPagadas,
    horasExtrasPagadas: Math.round(horasExtrasPagadas * 10) / 10,
    horasDoblesPagadas: Math.round(horasDoblesPagadas * 10) / 10,
    horasTriplesPagadas: Math.round(horasTriplesPagadas * 10) / 10,
    importeHorasExtrasPagado: Math.round(importeHorasExtrasPagado * 100) / 100,
    totalPercepciones: Math.round(totalPercepciones * 100) / 100,
  };
}

/**
 * Parsea un lote de XMLs de nómina. Si un empleado tiene múltiples recibos, se consolidan sus horas.
 */
export function parsearLoteXmlsNomina(xmlStrings: string[]): EmpleadoCfdiNomina[] {
  const mapa = new Map<string, EmpleadoCfdiNomina>();

  for (const xml of xmlStrings) {
    try {
      const parsed = parsearXmlCfdiNomina(xml);
      if (!parsed.rfc) continue;

      const existente = mapa.get(parsed.rfc);
      if (existente) {
        existente.numDiasPagados += parsed.numDiasPagados;
        existente.horasOrdinariasPagadas += parsed.horasOrdinariasPagadas;
        existente.horasExtrasPagadas =
          Math.round((existente.horasExtrasPagadas + parsed.horasExtrasPagadas) * 10) / 10;
        existente.horasDoblesPagadas += parsed.horasDoblesPagadas;
        existente.horasTriplesPagadas += parsed.horasTriplesPagadas;
        existente.importeHorasExtrasPagado =
          Math.round((existente.importeHorasExtrasPagado + parsed.importeHorasExtrasPagado) * 100) /
          100;
        existente.totalPercepciones =
          Math.round((existente.totalPercepciones + parsed.totalPercepciones) * 100) / 100;
      } else {
        mapa.set(parsed.rfc, parsed);
      }
    } catch {
      // Ignorar archivos que no son CFDI válidos
      continue;
    }
  }

  return Array.from(mapa.values());
}

/**
 * Parsea un CSV del reloj checador / control de asistencia y lo consolida por colaborador (RFC).
 */
export function parsearCsvChecador(csvContent: string): EmpleadoChecadorConsolidado[] {
  if (!csvContent || typeof csvContent !== 'string') {
    return [];
  }

  // Quitar BOM UTF-8 si existe
  const cleanCsv = csvContent.replace(/^\uFEFF/, '').trim();
  const lineas = cleanCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lineas.length === 0) return [];

  const primeraLinea = lineas[0];
  if (!primeraLinea) return [];

  // Detectar delimitador: coma, punto y coma o tab
  let delimitador = ',';
  if (primeraLinea.includes(';') && !primeraLinea.includes(',')) delimitador = ';';
  else if (primeraLinea.includes('\t')) delimitador = '\t';

  const cabeceras = primeraLinea.split(delimitador).map((c) =>
    c
      .trim()
      .toLowerCase()
      .replace(/^["']|["']$/g, '')
  );

  // Buscar índices de columnas
  const idxRfc = cabeceras.findIndex((c) => c === 'rfc' || c === 'rfc_empleado' || c === 'tax_id');
  const idxNombre = cabeceras.findIndex(
    (c) => c === 'nombre' || c === 'empleado' || c === 'trabajador' || c === 'colaborador'
  );
  const idxFecha = cabeceras.findIndex((c) => c === 'fecha' || c === 'date' || c === 'dia');
  const idxHorasTrabajadas = cabeceras.findIndex(
    (c) =>
      c === 'horas_trabajadas' ||
      c === 'horas' ||
      c === 'total_horas' ||
      c === 'horas_reales' ||
      c === 'duracion'
  );
  const idxHorasExtras = cabeceras.findIndex(
    (c) => c === 'horas_extras' || c === 'tiempo_extra' || c === 'extras' || c === 'hrs_extras'
  );
  const idxEntrada = cabeceras.findIndex(
    (c) => c === 'entrada' || c === 'check_in' || c === 'ingreso'
  );
  const idxSalida = cabeceras.findIndex(
    (c) => c === 'salida' || c === 'check_out' || c === 'egreso'
  );

  const mapa = new Map<string, EmpleadoChecadorConsolidado>();

  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea) continue;

    const columnas = linea.split(delimitador).map((val) => val.trim().replace(/^["']|["']$/g, ''));

    // Obtener RFC
    let rfc = (idxRfc !== -1 ? columnas[idxRfc] : columnas[0]) || '';
    rfc = rfc.trim().toUpperCase();

    if (!rfc) continue;

    // Obtener Nombre
    const nombre = (idxNombre !== -1 ? columnas[idxNombre] : columnas[1]) || rfc;

    // Obtener Fecha
    const fecha = idxFecha !== -1 ? columnas[idxFecha] || '' : '';

    // Obtener Horas
    let horasTrabajadas = 0;
    let horasExtras = 0;

    if (idxHorasTrabajadas !== -1 && columnas[idxHorasTrabajadas]) {
      horasTrabajadas = parseFloat(columnas[idxHorasTrabajadas] || '0') || 0;
    } else if (
      idxEntrada !== -1 &&
      idxSalida !== -1 &&
      columnas[idxEntrada] &&
      columnas[idxSalida]
    ) {
      // Calcular a partir de hora entrada y salida (e.g. "09:00" y "18:00")
      const entradaStr = columnas[idxEntrada] || '';
      const salidaStr = columnas[idxSalida] || '';
      const [hE, mE] = entradaStr.split(':').map((n) => parseInt(n, 10) || 0);
      const [hS, mS] = salidaStr.split(':').map((n) => parseInt(n, 10) || 0);
      if (hE !== undefined && hS !== undefined && mE !== undefined && mS !== undefined) {
        const diffHoras = hS + mS / 60 - (hE + mE / 60);
        // Jornada continua suele incluir 0.5 a 1 hr de comida si excede 8 horas
        horasTrabajadas = Math.max(0, diffHoras);
      }
    }

    if (idxHorasExtras !== -1 && columnas[idxHorasExtras]) {
      horasExtras = parseFloat(columnas[idxHorasExtras] || '0') || 0;
    } else {
      // Si el registro es diario y superó 8 horas diarias de jornada diurna
      if (horasTrabajadas > 8) {
        horasExtras = Math.round((horasTrabajadas - 8) * 10) / 10;
      }
    }

    const horasOrdinarias = Math.max(0, horasTrabajadas - horasExtras);

    const reg = mapa.get(rfc);
    if (reg) {
      reg.totalHorasTrabajadas = Math.round((reg.totalHorasTrabajadas + horasTrabajadas) * 10) / 10;
      reg.totalHorasOrdinarias = Math.round((reg.totalHorasOrdinarias + horasOrdinarias) * 10) / 10;
      reg.totalHorasExtras = Math.round((reg.totalHorasExtras + horasExtras) * 10) / 10;
      reg.diasConRegistro += 1;
      if (fecha && !reg.fechas.includes(fecha)) {
        reg.fechas.push(fecha);
      }
    } else {
      mapa.set(rfc, {
        rfc,
        nombre: nombre || rfc,
        totalHorasTrabajadas: Math.round(horasTrabajadas * 10) / 10,
        totalHorasOrdinarias: Math.round(horasOrdinarias * 10) / 10,
        totalHorasExtras: Math.round(horasExtras * 10) / 10,
        diasConRegistro: 1,
        fechas: fecha ? [fecha] : [],
      });
    }
  }

  return Array.from(mapa.values());
}

/**
 * Evalúa las discrepancias individuales para un colaborador comparando checador vs CFDI.
 */
function evaluarDiscrepancia(
  checador?: EmpleadoChecadorConsolidado,
  cfdi?: EmpleadoCfdiNomina
): DiscrepanciaColaborador {
  // Caso 1: Empleado con CFDI pero sin ningún registro en el checador
  if (!checador && cfdi) {
    return {
      rfc: cfdi.rfc,
      nombre: cfdi.nombre,
      curp: cfdi.curp,
      horasChecadorTotal: 0,
      horasChecadorExtras: 0,
      horasCfdiOrdinarias: cfdi.horasOrdinariasPagadas,
      horasCfdiExtras: cfdi.horasExtrasPagadas,
      diferenciaHorasExtras: -cfdi.horasExtrasPagadas,
      tipoDiscrepancia: 'SIN_REGISTRO_CHECADOR',
      nivelRiesgo: 'CRITICO',
      detalles: `CFDI emitido por ${cfdi.numDiasPagados} días ($${cfdi.totalPercepciones.toFixed(
        2
      )} MXN), pero no existe ningún registro en el reloj checador en el período.`,
      fundamentoLegal: 'Art. 132 Fracc. VIII Bis LFT y Art. 27 Fracc. V LISR',
      impactoFiscalLaboral:
        'Riesgo crítico de deducción rechazada por el SAT (presunción de simulación de nómina o trabajador fantasma) y sanción administrativa STPS.',
    };
  }

  // Caso 2: Empleado en el checador pero sin CFDI emitido
  if (checador && !cfdi) {
    return {
      rfc: checador.rfc,
      nombre: checador.nombre,
      horasChecadorTotal: checador.totalHorasTrabajadas,
      horasChecadorExtras: checador.totalHorasExtras,
      horasCfdiOrdinarias: 0,
      horasCfdiExtras: 0,
      diferenciaHorasExtras: checador.totalHorasExtras,
      tipoDiscrepancia: 'EMPLEADO_SIN_CFDI',
      nivelRiesgo: 'CRITICO',
      detalles: `El colaborador registró ${checador.diasConRegistro} asistencias (${checador.totalHorasTrabajadas} hrs) en el checador, pero no cuenta con CFDI de nómina emitido.`,
      fundamentoLegal: 'Art. 99 Fracc. III LISR, Art. 15 LSS y Art. 132 LFT',
      impactoFiscalLaboral:
        'Omisión patronal grave: riesgo de capitales constitutivos IMSS, multas STPS por trabajo no remunerado y contingencia por falta de CFDI.',
    };
  }

  // Caso 3: Ambos presentes: evaluar horas extras
  const ch = checador!;
  const cf = cfdi!;

  const diffExtras = Math.round((ch.totalHorasExtras - cf.horasExtrasPagadas) * 10) / 10;

  // Si trabajó más de 9 horas extras a la semana y no están tipificadas como triples
  if (ch.totalHorasExtras > 9 && cf.horasTriplesPagadas === 0) {
    return {
      rfc: cf.rfc,
      nombre: cf.nombre,
      curp: cf.curp,
      horasChecadorTotal: ch.totalHorasTrabajadas,
      horasChecadorExtras: ch.totalHorasExtras,
      horasCfdiOrdinarias: cf.horasOrdinariasPagadas,
      horasCfdiExtras: cf.horasExtrasPagadas,
      diferenciaHorasExtras: diffExtras,
      tipoDiscrepancia: 'EXCESO_JORNADA_LEGAL_TRIPLE',
      nivelRiesgo: 'ALTO',
      detalles: `El colaborador laboró ${ch.totalHorasExtras} horas extras en el checador (excediendo las 9 semanales de ley), pero el CFDI no refleja el pago de horas triples al 300%.`,
      fundamentoLegal: 'Arts. 66 y 68 Ley Federal del Trabajo',
      impactoFiscalLaboral:
        'Infracción laboral STPS y riesgo de reclamo laboral por pago deficitario de horas triples conforme al Art. 68 LFT.',
    };
  }

  // Si trabajó horas extras en checador y no se pagaron o se pagaron de menos
  if (diffExtras > 0.5) {
    return {
      rfc: cf.rfc,
      nombre: cf.nombre,
      curp: cf.curp,
      horasChecadorTotal: ch.totalHorasTrabajadas,
      horasChecadorExtras: ch.totalHorasExtras,
      horasCfdiOrdinarias: cf.horasOrdinariasPagadas,
      horasCfdiExtras: cf.horasExtrasPagadas,
      diferenciaHorasExtras: diffExtras,
      tipoDiscrepancia: 'HORAS_EXTRAS_NO_PAGADAS',
      nivelRiesgo: 'ALTO',
      detalles: `El checador registró ${ch.totalHorasExtras} hrs extras mientras que el CFDI solo amparó ${cf.horasExtrasPagadas} hrs (diferencia omitida de ${diffExtras} hrs).`,
      fundamentoLegal: 'Art. 67 y 68 LFT y Art. 132 Fracc. VIII Bis LFT',
      impactoFiscalLaboral:
        'Contingencia laboral directa ante la STPS / Centro de Conciliación por tiempo extraordinario insoluto e integración deficitaria del SBC ante el IMSS.',
    };
  }

  // Si se pagaron horas extras en el CFDI que no tienen respaldo en el checador
  if (diffExtras < -0.5) {
    return {
      rfc: cf.rfc,
      nombre: cf.nombre,
      curp: cf.curp,
      horasChecadorTotal: ch.totalHorasTrabajadas,
      horasChecadorExtras: ch.totalHorasExtras,
      horasCfdiOrdinarias: cf.horasOrdinariasPagadas,
      horasCfdiExtras: cf.horasExtrasPagadas,
      diferenciaHorasExtras: diffExtras,
      tipoDiscrepancia: 'HORAS_EXTRAS_SIN_REGISTRO',
      nivelRiesgo: 'MEDIO',
      detalles: `El CFDI pagó ${cf.horasExtrasPagadas} hrs extras ($${cf.importeHorasExtrasPagado.toFixed(
        2
      )}), pero el checador solo registró ${ch.totalHorasExtras} hrs de tiempo extra real (${Math.abs(
        diffExtras
      )} hrs sin respaldo).`,
      fundamentoLegal: 'Art. 27 Fracc. V LISR y Art. 28 CFF',
      impactoFiscalLaboral:
        'El SAT puede presumir falta de materialidad y rechazar la exención de ISR (Art. 93 Fracc. I LISR) o la deducibilidad de la partida extraordinaria.',
    };
  }

  // Sin discrepancias sustanciales
  return {
    rfc: cf.rfc,
    nombre: cf.nombre,
    curp: cf.curp,
    horasChecadorTotal: ch.totalHorasTrabajadas,
    horasChecadorExtras: ch.totalHorasExtras,
    horasCfdiOrdinarias: cf.horasOrdinariasPagadas,
    horasCfdiExtras: cf.horasExtrasPagadas,
    diferenciaHorasExtras: 0,
    tipoDiscrepancia: 'SIN_DISCREPANCIA',
    nivelRiesgo: 'BAJO',
    detalles: `Horas registradas en reloj checador (${ch.totalHorasTrabajadas} hrs) y horas extraordinarias (${ch.totalHorasExtras} hrs) concuerdan con el CFDI de nómina emitido.`,
    fundamentoLegal: 'Art. 132 Fracc. VIII Bis LFT y Art. 27 LISR',
    impactoFiscalLaboral:
      'Expediente consistente. Soporte pleno de materialidad para deducibilidad ISR y acreditamiento patronal.',
  };
}

/**
 * Calcula el Hash SHA-256 criptográfico para el dictamen del cruce.
 */
async function generarHashSha256(data: object): Promise<string> {
  const canonicalJson = JSON.stringify(data, Object.keys(data).sort());
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalJson));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Ejecuta el cruce integral entre el lote de CFDIs de Nómina y el archivo del checador.
 */
export async function ejecutarCruceNominaChecador(
  empleadosCfdi: EmpleadoCfdiNomina[],
  registrosChecador: EmpleadoChecadorConsolidado[],
  options: {
    empresaNombre?: string;
    empresaRfc?: string;
  } = {}
): Promise<DictamenCruceJornada> {
  const mapaCfdi = new Map<string, EmpleadoCfdiNomina>();
  for (const c of empleadosCfdi) {
    if (c.rfc) mapaCfdi.set(c.rfc.toUpperCase(), c);
  }

  const mapaChecador = new Map<string, EmpleadoChecadorConsolidado>();
  for (const ch of registrosChecador) {
    if (ch.rfc) mapaChecador.set(ch.rfc.toUpperCase(), ch);
  }

  // Conjunto de todos los RFCs involucrados
  const todosLosRfcs = Array.from(
    new Set([...Array.from(mapaCfdi.keys()), ...Array.from(mapaChecador.keys())])
  );

  const discrepancias: DiscrepanciaColaborador[] = [];
  let totalHorasExtrasChecador = 0;
  let totalHorasExtrasPagadasCfdi = 0;
  let colaboradoresConDiscrepancia = 0;

  for (const rfc of todosLosRfcs) {
    const cfdi = mapaCfdi.get(rfc);
    const checador = mapaChecador.get(rfc);

    const disc = evaluarDiscrepancia(checador, cfdi);
    discrepancias.push(disc);

    if (checador) totalHorasExtrasChecador += checador.totalHorasExtras;
    if (cfdi) totalHorasExtrasPagadasCfdi += cfdi.horasExtrasPagadas;

    if (disc.tipoDiscrepancia !== 'SIN_DISCREPANCIA') {
      colaboradoresConDiscrepancia += 1;
    }
  }

  // Ordenar discrepancias por severidad de riesgo (CRITICO -> ALTO -> MEDIO -> BAJO)
  const pesoRiesgo: Record<NivelRiesgoCruce, number> = {
    CRITICO: 4,
    ALTO: 3,
    MEDIO: 2,
    BAJO: 1,
  };
  discrepancias.sort((a, b) => pesoRiesgo[b.nivelRiesgo] - pesoRiesgo[a.nivelRiesgo]);

  // Cálculo de score ponderado (0 a 100)
  let penalizacion = 0;
  for (const d of discrepancias) {
    if (d.nivelRiesgo === 'CRITICO') penalizacion += 30;
    else if (d.nivelRiesgo === 'ALTO') penalizacion += 15;
    else if (d.nivelRiesgo === 'MEDIO') penalizacion += 5;
  }

  const scoreConsistencia = Math.max(0, 100 - penalizacion);

  let nivelRiesgoGlobal: NivelRiesgoCruce = 'BAJO';
  if (scoreConsistencia < 50 || discrepancias.some((d) => d.nivelRiesgo === 'CRITICO')) {
    nivelRiesgoGlobal = 'CRITICO';
  } else if (scoreConsistencia < 75 || discrepancias.some((d) => d.nivelRiesgo === 'ALTO')) {
    nivelRiesgoGlobal = 'ALTO';
  } else if (scoreConsistencia < 90 || discrepancias.some((d) => d.nivelRiesgo === 'MEDIO')) {
    nivelRiesgoGlobal = 'MEDIO';
  }

  // Generar alertas principales
  const alertasPrincipales: string[] = [];
  const sinChecadorCount = discrepancias.filter(
    (d) => d.tipoDiscrepancia === 'SIN_REGISTRO_CHECADOR'
  ).length;
  const noPagadasCount = discrepancias.filter(
    (d) => d.tipoDiscrepancia === 'HORAS_EXTRAS_NO_PAGADAS'
  ).length;
  const sinRegistroExtrasCount = discrepancias.filter(
    (d) => d.tipoDiscrepancia === 'HORAS_EXTRAS_SIN_REGISTRO'
  ).length;
  const excesoTriplesCount = discrepancias.filter(
    (d) => d.tipoDiscrepancia === 'EXCESO_JORNADA_LEGAL_TRIPLE'
  ).length;

  if (sinChecadorCount > 0) {
    alertasPrincipales.push(
      `⚠️ ${sinChecadorCount} colaborador(es) tienen CFDI de nómina emitido pero carecen de registro de asistencia en el reloj checador (Riesgo de deducción rechazada Art. 27 LISR).`
    );
  }
  if (noPagadasCount > 0) {
    alertasPrincipales.push(
      `🚨 ${noPagadasCount} colaborador(es) laboraron tiempo extraordinario en el checador que no fue cubierto en el CFDI de nómina (Riesgo de multas STPS Art. 132 LFT).`
    );
  }
  if (sinRegistroExtrasCount > 0) {
    alertasPrincipales.push(
      `⚠️ ${sinRegistroExtrasCount} colaborador(es) recibieron pago de horas extras en el CFDI sin registro previo en el checador (Riesgo de cuestionamiento de materialidad por el SAT).`
    );
  }
  if (excesoTriplesCount > 0) {
    alertasPrincipales.push(
      `ℹ️ ${excesoTriplesCount} colaborador(es) excedieron el límite semanal de 9 horas extras sin reflejar el pago de horas triples al 300% (Art. 68 LFT).`
    );
  }

  if (alertasPrincipales.length === 0) {
    alertasPrincipales.push(
      '✅ Consistencia Laboral-Fiscal óptima: todos los registros de asistencia cuadran con los CFDIs de nómina evaluados.'
    );
  }

  // Fechas del período (si hay)
  const fechasTodos = empleadosCfdi.map((c) => c.fechaInicioPago).filter(Boolean);
  const fechaInicio = fechasTodos[0];
  const fechaFin = empleadosCfdi.map((c) => c.fechaFinPago).filter(Boolean)[0];

  const resumenHash = {
    empresa: options.empresaNombre || 'Empresa',
    totalAuditados: todosLosRfcs.length,
    conDiscrepancia: colaboradoresConDiscrepancia,
    score: scoreConsistencia,
    nivelRiesgo: nivelRiesgoGlobal,
    rfcsAuditados: todosLosRfcs.sort(),
  };

  const selloSha256 = await generarHashSha256(resumenHash);

  return {
    id: `cruce_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fechaEmision: new Date().toISOString(),
    empresaNombre: options.empresaNombre || 'Empresa Evaluada S.A. de C.V.',
    empresaRfc: options.empresaRfc,
    periodoAnalizado: {
      fechaInicio,
      fechaFin,
    },
    totalColaboradoresCfdi: empleadosCfdi.length,
    totalColaboradoresChecador: registrosChecador.length,
    totalColaboradoresAuditados: todosLosRfcs.length,
    colaboradoresConDiscrepancia,
    totalHorasExtrasChecador: Math.round(totalHorasExtrasChecador * 10) / 10,
    totalHorasExtrasPagadasCfdi: Math.round(totalHorasExtrasPagadasCfdi * 10) / 10,
    diferenciaNetaHorasExtras:
      Math.round((totalHorasExtrasChecador - totalHorasExtrasPagadasCfdi) * 10) / 10,
    scoreConsistencia,
    nivelRiesgoGlobal,
    alertasPrincipales,
    discrepancias,
    selloSha256,
  };
}

/**
 * Genera el archivo CSV con BOM UTF-8 del reporte de discrepancias para exportación y descarga.
 */
export function generarCsvDiscrepancias(dictamen: DictamenCruceJornada): string {
  const encabezados = [
    'No',
    'RFC',
    'Nombre Colaborador',
    'CURP',
    'Tipo Discrepancia',
    'Nivel de Riesgo',
    'Horas Totales Checador',
    'Horas Extras Checador',
    'Horas Ordinarias CFDI',
    'Horas Extras CFDI',
    'Diferencia Horas Extras (Checador - CFDI)',
    'Detalle de la Inconsistencia',
    'Fundamento Legal',
    'Impacto Fiscal / Laboral',
  ];

  const filas: string[] = [encabezados.join(',')];

  dictamen.discrepancias.forEach((d, idx) => {
    const fila = [
      idx + 1,
      `"${d.rfc}"`,
      `"${d.nombre.replace(/"/g, '""')}"`,
      `"${d.curp || ''}"`,
      `"${d.tipoDiscrepancia}"`,
      `"${d.nivelRiesgo}"`,
      d.horasChecadorTotal.toFixed(1),
      d.horasChecadorExtras.toFixed(1),
      d.horasCfdiOrdinarias.toFixed(1),
      d.horasCfdiExtras.toFixed(1),
      d.diferenciaHorasExtras.toFixed(1),
      `"${d.detalles.replace(/"/g, '""')}"`,
      `"${d.fundamentoLegal.replace(/"/g, '""')}"`,
      `"${d.impactoFiscalLaboral.replace(/"/g, '""')}"`,
    ];
    filas.push(fila.join(','));
  });

  // BOM UTF-8 para garantizar compatibilidad nativa con Excel en Windows y Mac
  return '\uFEFF' + filas.join('\r\n');
}

/**
 * Genera una plantilla de ejemplo en CSV para el reloj checador.
 */
export function generarPlantillaChecadorCSV(): string {
  const lineas = [
    'rfc,nombre,fecha,horas_trabajadas,horas_extras',
    'HEGR850101AB1,HERNANDEZ GARCIA ROBERTO,2026-10-15,84.0,4.0',
    'LOMA900202CD2,LOPEZ MARTINEZ MARIANA,2026-10-15,86.0,6.0',
    'RACA920303EF3,RAMIREZ CASTILLO CARLOS,2026-10-15,80.0,0.0',
    'SATO950404GH4,SANCHEZ TORRES SOFIA,2026-10-15,80.0,0.0',
    'MORA880505IJ5,MORALES RIVERA DANIEL,2026-10-15,92.0,12.0',
  ];
  return '\uFEFF' + lineas.join('\r\n');
}

/**
 * Genera un lote de demostración de 5 colaboradores con XMLs sintéticos de CFDI Nómina
 * y un CSV de reloj checador que ilustra los diferentes escenarios de auditoría.
 */
export function generarLoteMuestraCruce(): { xmls: string[]; csvChecador: string } {
  const xmls: string[] = [
    // 1. Roberto Hernández: Consistente (4 hrs extras en CFDI y 4 hrs en checador)
    `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nomina12="http://www.sat.gob.mx/nomina12" Version="4.0" Total="14500.00" Fecha="2026-10-15T12:00:00">
  <cfdi:Receptor Rfc="HEGR850101AB1" Nombre="HERNANDEZ GARCIA ROBERTO"/>
  <cfdi:Complemento>
    <nomina12:Nomina Version="1.2" TipoNomina="O" FechaPago="2026-10-15" FechaInicialPago="2026-10-01" FechaFinalPago="2026-10-15" NumDiasPagados="15" TotalPercepciones="14500.00">
      <nomina12:Receptor Curp="HEGR850101HDFR01" NumSeguridadSocial="12345678901"/>
      <nomina12:Percepciones TotalGravado="14000.00" TotalExento="500.00">
        <nomina12:Percepcion TipoPercepcion="001" Clave="001" Concepto="Sueldo Ordinario" ImporteGravado="13500.00" ImporteExento="0.00"/>
        <nomina12:Percepcion TipoPercepcion="019" Clave="019" Concepto="Horas Extra" ImporteGravado="500.00" ImporteExento="500.00">
          <nomina12:HorasExtra Dias="2" TipoHoras="Dobles" HorasExtra="4" ImportePagado="1000.00"/>
        </nomina12:Percepcion>
      </nomina12:Percepciones>
    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`,

    // 2. Mariana López: Checador registró 6 hrs extras, pero CFDI tiene 0 hrs extras pagadas
    `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nomina12="http://www.sat.gob.mx/nomina12" Version="4.0" Total="18000.00" Fecha="2026-10-15T12:00:00">
  <cfdi:Receptor Rfc="LOMA900202CD2" Nombre="LOPEZ MARTINEZ MARIANA"/>
  <cfdi:Complemento>
    <nomina12:Nomina Version="1.2" TipoNomina="O" FechaPago="2026-10-15" FechaInicialPago="2026-10-01" FechaFinalPago="2026-10-15" NumDiasPagados="15" TotalPercepciones="18000.00">
      <nomina12:Receptor Curp="LOMA900202MDFR02" NumSeguridadSocial="23456789012"/>
      <nomina12:Percepciones TotalGravado="18000.00" TotalExento="0.00">
        <nomina12:Percepcion TipoPercepcion="001" Clave="001" Concepto="Sueldo Ordinario" ImporteGravado="18000.00" ImporteExento="0.00"/>
      </nomina12:Percepciones>
    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`,

    // 3. Carlos Ramírez: CFDI pagó 8 hrs extras, pero el checador registró 0 hrs extras
    `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nomina12="http://www.sat.gob.mx/nomina12" Version="4.0" Total="12000.00" Fecha="2026-10-15T12:00:00">
  <cfdi:Receptor Rfc="RACA920303EF3" Nombre="RAMIREZ CASTILLO CARLOS"/>
  <cfdi:Complemento>
    <nomina12:Nomina Version="1.2" TipoNomina="O" FechaPago="2026-10-15" FechaInicialPago="2026-10-01" FechaFinalPago="2026-10-15" NumDiasPagados="15" TotalPercepciones="12000.00">
      <nomina12:Receptor Curp="RACA920303HDFR03" NumSeguridadSocial="34567890123"/>
      <nomina12:Percepciones TotalGravado="10500.00" TotalExento="1500.00">
        <nomina12:Percepcion TipoPercepcion="001" Clave="001" Concepto="Sueldo Ordinario" ImporteGravado="10000.00" ImporteExento="0.00"/>
        <nomina12:Percepcion TipoPercepcion="019" Clave="019" Concepto="Horas Extra" ImporteGravado="500.00" ImporteExento="1500.00">
          <nomina12:HorasExtra Dias="3" TipoHoras="Dobles" HorasExtra="8" ImportePagado="2000.00"/>
        </nomina12:Percepcion>
      </nomina12:Percepciones>
    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`,

    // 4. Sofía Sánchez: CFDI emitido pero NO tiene registros en el checador (se omite del CSV)
    `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nomina12="http://www.sat.gob.mx/nomina12" Version="4.0" Total="9500.00" Fecha="2026-10-15T12:00:00">
  <cfdi:Receptor Rfc="SATO950404GH4" Nombre="SANCHEZ TORRES SOFIA"/>
  <cfdi:Complemento>
    <nomina12:Nomina Version="1.2" TipoNomina="O" FechaPago="2026-10-15" FechaInicialPago="2026-10-01" FechaFinalPago="2026-10-15" NumDiasPagados="15" TotalPercepciones="9500.00">
      <nomina12:Receptor Curp="SATO950404MDFR04" NumSeguridadSocial="45678901234"/>
      <nomina12:Percepciones TotalGravado="9500.00" TotalExento="0.00">
        <nomina12:Percepcion TipoPercepcion="001" Clave="001" Concepto="Sueldo Ordinario" ImporteGravado="9500.00" ImporteExento="0.00"/>
      </nomina12:Percepciones>
    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`,

    // 5. Daniel Morales: Laboró 12 hrs extras en checador, CFDI reportó 12 hrs pero solo como dobles (sin triples al 300%)
    `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nomina12="http://www.sat.gob.mx/nomina12" Version="4.0" Total="22000.00" Fecha="2026-10-15T12:00:00">
  <cfdi:Receptor Rfc="MORA880505IJ5" Nombre="MORALES RIVERA DANIEL"/>
  <cfdi:Complemento>
    <nomina12:Nomina Version="1.2" TipoNomina="O" FechaPago="2026-10-15" FechaInicialPago="2026-10-01" FechaFinalPago="2026-10-15" NumDiasPagados="15" TotalPercepciones="22000.00">
      <nomina12:Receptor Curp="MORA880505HDFR05" NumSeguridadSocial="56789012345"/>
      <nomina12:Percepciones TotalGravado="19500.00" TotalExento="2500.00">
        <nomina12:Percepcion TipoPercepcion="001" Clave="001" Concepto="Sueldo Ordinario" ImporteGravado="18000.00" ImporteExento="0.00"/>
        <nomina12:Percepcion TipoPercepcion="019" Clave="019" Concepto="Horas Extra" ImporteGravado="1500.00" ImporteExento="2500.00">
          <nomina12:HorasExtra Dias="4" TipoHoras="Dobles" HorasExtra="12" ImportePagado="4000.00"/>
        </nomina12:Percepcion>
      </nomina12:Percepciones>
    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`,
  ];

  // CSV de reloj checador:
  // - Roberto (4 hrs extras) -> coincide
  // - Mariana (6 hrs extras) -> CFDI tiene 0
  // - Carlos (0 hrs extras) -> CFDI tiene 8
  // - Sofía -> NO está en el checador (riesgo crítico trabajador fantasma)
  // - Daniel (12 hrs extras) -> Exceso de 9 hrs semanales sin triples
  const csvChecador =
    `\uFEFF` +
    [
      'rfc,nombre,fecha,horas_trabajadas,horas_extras',
      'HEGR850101AB1,HERNANDEZ GARCIA ROBERTO,2026-10-15,84.0,4.0',
      'LOMA900202CD2,LOPEZ MARTINEZ MARIANA,2026-10-15,86.0,6.0',
      'RACA920303EF3,RAMIREZ CASTILLO CARLOS,2026-10-15,80.0,0.0',
      'MORA880505IJ5,MORALES RIVERA DANIEL,2026-10-15,92.0,12.0',
    ].join('\r\n');

  return { xmls, csvChecador };
}

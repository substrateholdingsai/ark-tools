/**
 * ARK TOOLS — Herramienta #16: Motor de Conciliación Anexo 24
 * Parser de Archivo TXT de Metadata del SAT
 *
 * Lee el archivo plano descargado del portal SAT (Descarga Masiva de Metadata)
 * y genera el conjunto de UUIDs cancelados para prevenir contabilización de
 * facturas inválidas o canceladas.
 */

import type { MetadataItem, MetadataParseResult } from '../types';

/**
 * Normaliza nombres de encabezados eliminando acentos, caracteres especiales y mayúsculas.
 */
function normalizarEncabezado(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Detecta el delimitador de campos analizando la primera línea.
 */
function detectarDelimitador(primeraLinea: string): string {
  const delimitadores = ['~', '|', '\t', ','];
  let mejorDelimitador = '~';
  let maxConteo = -1;

  for (const delim of delimitadores) {
    const conteo = primeraLinea.split(delim).length - 1;
    if (conteo > maxConteo) {
      maxConteo = conteo;
      mejorDelimitador = delim;
    }
  }

  return maxConteo > 0 ? mejorDelimitador : '~';
}

/**
 * Parsea el contenido de texto del archivo Metadata TXT del SAT
 */
export function parsearMetadataSAT(contenido: string): MetadataParseResult {
  const mapaPorUUID = new Map<string, MetadataItem>();
  const uuidsCancelados = new Set<string>();
  const uuidsVigentes = new Set<string>();
  const errores: string[] = [];

  if (!contenido || !contenido.trim()) {
    return {
      totalRegistros: 0,
      vigentes: 0,
      cancelados: 0,
      mapaPorUUID,
      uuidsCancelados,
      uuidsVigentes,
      errores: ['El archivo de Metadata está vacío.'],
    };
  }

  // Eliminar BOM de UTF-8 si existe
  const textoLimpio = contenido.replace(/^\uFEFF/, '').trim();
  const lineas = textoLimpio.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lineas.length === 0) {
    return {
      totalRegistros: 0,
      vigentes: 0,
      cancelados: 0,
      mapaPorUUID,
      uuidsCancelados,
      uuidsVigentes,
      errores: ['No se encontraron líneas válidas en el archivo.'],
    };
  }

  const primeraLinea = lineas[0] || '';
  const delimitador = detectarDelimitador(primeraLinea);

  const encabezadosCrudos = primeraLinea.split(delimitador).map((c) => c.trim());
  const encabezadosNormalizados = encabezadosCrudos.map(normalizarEncabezado);

  // Mapear posiciones de columnas conocidas
  let idxUuid = encabezadosNormalizados.findIndex(
    (h) => h === 'uuid' || h === 'foliofiscal' || h === 'folio'
  );
  let idxRfcEmisor = encabezadosNormalizados.findIndex(
    (h) => h === 'rfcemisor' || h === 'emisor' || h === 'rfcdelemisor'
  );
  let idxNombreEmisor = encabezadosNormalizados.findIndex(
    (h) => h === 'nombreemisor' || h === 'razonsocialemisor'
  );
  let idxRfcReceptor = encabezadosNormalizados.findIndex(
    (h) => h === 'rfcreceptor' || h === 'receptor' || h === 'rfcdelreceptor'
  );
  let idxNombreReceptor = encabezadosNormalizados.findIndex(
    (h) => h === 'nombrereceptor' || h === 'razonsocialreceptor'
  );
  let idxRfcPac = encabezadosNormalizados.findIndex((h) => h === 'rfcpac' || h === 'pac');
  let idxFechaEmision = encabezadosNormalizados.findIndex(
    (h) => h === 'fechaemision' || h === 'fecha'
  );
  let idxFechaCertificacion = encabezadosNormalizados.findIndex(
    (h) => h === 'fechacertificacionsat' || h === 'fechatimbrado'
  );
  let idxMonto = encabezadosNormalizados.findIndex(
    (h) => h === 'monto' || h === 'total' || h === 'importe'
  );
  let idxEfecto = encabezadosNormalizados.findIndex(
    (h) => h === 'efectocomprobante' || h === 'tipo' || h === 'tipocomprobante'
  );
  let idxEstatus = encabezadosNormalizados.findIndex(
    (h) =>
      h === 'estatus' ||
      h === 'estadocomprobante' ||
      h === 'estatuscancelacion' ||
      h === 'estadodelcomprobante'
  );
  let idxFechaCancelacion = encabezadosNormalizados.findIndex(
    (h) => h === 'fechacancelacion' || h === 'fechadecancelacion'
  );

  // Si no se reconocieron encabezados explícitos, usar orden estándar de descarga SAT
  let inicioFila = 1;
  if (idxUuid === -1) {
    // Si la primera línea ya parece ser un UUID (ej: 8-4-4-4-12 hex)
    const posibleUUID = encabezadosCrudos[0] || '';
    if (
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        posibleUUID
      )
    ) {
      inicioFila = 0;
      idxUuid = 0;
      idxRfcEmisor = 1;
      idxNombreEmisor = 2;
      idxRfcReceptor = 3;
      idxNombreReceptor = 4;
      idxRfcPac = 5;
      idxFechaEmision = 6;
      idxFechaCertificacion = 7;
      idxMonto = 8;
      idxEfecto = 9;
      idxEstatus = 10;
      idxFechaCancelacion = 11;
    } else {
      idxUuid = 0;
      idxRfcEmisor = 1;
      idxNombreEmisor = 2;
      idxRfcReceptor = 3;
      idxNombreReceptor = 4;
      idxRfcPac = 5;
      idxFechaEmision = 6;
      idxFechaCertificacion = 7;
      idxMonto = 8;
      idxEfecto = 9;
      idxEstatus = 10;
      idxFechaCancelacion = 11;
    }
  }

  for (let i = inicioFila; i < lineas.length; i++) {
    const linea = lineas[i];
    if (!linea) continue;
    const cols = linea.split(delimitador);
    if (cols.length < 2) continue;

    const rawUuid = (cols[idxUuid] || '').trim().toUpperCase();
    if (!rawUuid || rawUuid === 'UUID' || rawUuid === 'FOLIO FISCAL') continue;

    // Limpiar comillas si vienen en el texto
    const uuidLimpio = rawUuid.replace(/^["']|["']$/g, '');

    const rfcEmisor = (cols[idxRfcEmisor] || '').trim().replace(/^["']|["']$/g, '');
    const nombreEmisor =
      idxNombreEmisor >= 0 ? (cols[idxNombreEmisor] || '').trim().replace(/^["']|["']$/g, '') : '';
    const rfcReceptor =
      idxRfcReceptor >= 0 ? (cols[idxRfcReceptor] || '').trim().replace(/^["']|["']$/g, '') : '';
    const nombreReceptor =
      idxNombreReceptor >= 0
        ? (cols[idxNombreReceptor] || '').trim().replace(/^["']|["']$/g, '')
        : '';
    const rfcPac = idxRfcPac >= 0 ? (cols[idxRfcPac] || '').trim().replace(/^["']|["']$/g, '') : '';
    const fechaEmision =
      idxFechaEmision >= 0 ? (cols[idxFechaEmision] || '').trim().replace(/^["']|["']$/g, '') : '';
    const fechaCertificacionSat =
      idxFechaCertificacion >= 0
        ? (cols[idxFechaCertificacion] || '').trim().replace(/^["']|["']$/g, '')
        : '';
    const rawMonto = idxMonto >= 0 ? (cols[idxMonto] || '').trim().replace(/["',]/g, '') : '0';
    const monto = parseFloat(rawMonto) || 0;
    const efectoComprobante =
      idxEfecto >= 0 ? (cols[idxEfecto] || '').trim().replace(/^["']|["']$/g, '') : '';

    const rawEstatus =
      idxEstatus >= 0
        ? (cols[idxEstatus] || '')
            .trim()
            .toLowerCase()
            .replace(/^["']|["']$/g, '')
        : '';
    const rawFechaCancelacion =
      idxFechaCancelacion >= 0
        ? (cols[idxFechaCancelacion] || '').trim().replace(/^["']|["']$/g, '')
        : '';

    // Determinación del estatus oficial:
    // SAT: 0 = Cancelado, 1 = Vigente. O cadena 'Cancelado' / 'Vigente'.
    // O si tiene fecha de cancelación con contenido válido.
    let estatus: 'Vigente' | 'Cancelado' = 'Vigente';
    if (
      rawEstatus === '0' ||
      rawEstatus.includes('cancel') ||
      (rawFechaCancelacion.length > 5 && rawFechaCancelacion !== 'null')
    ) {
      estatus = 'Cancelado';
      uuidsCancelados.add(uuidLimpio);
    } else {
      estatus = 'Vigente';
      uuidsVigentes.add(uuidLimpio);
    }

    const item: MetadataItem = {
      uuid: uuidLimpio,
      rfcEmisor,
      nombreEmisor: nombreEmisor || undefined,
      rfcReceptor,
      nombreReceptor: nombreReceptor || undefined,
      rfcPac: rfcPac || undefined,
      fechaEmision: fechaEmision || undefined,
      fechaCertificacionSat: fechaCertificacionSat || undefined,
      monto,
      efectoComprobante: efectoComprobante || undefined,
      estatus,
      fechaCancelacion: rawFechaCancelacion || undefined,
    };

    mapaPorUUID.set(uuidLimpio, item);
  }

  return {
    totalRegistros: mapaPorUUID.size,
    vigentes: uuidsVigentes.size,
    cancelados: uuidsCancelados.size,
    mapaPorUUID,
    uuidsCancelados,
    uuidsVigentes,
    errores,
  };
}

/**
 * ARK LEDGER — Validador de XMLs CFDI 4.0 & 3.3
 * Motor local de revisión de formato y consistencia de CFDI
 */

import type { DictamenCFDI, ReglaAuditoria, EstatusDictamen, ResumenAuditoriaLote } from '../types';
import { AVISO_ALCANCE_DICTAMEN, AVISO_TOLERANCIA_ARITMETICA } from '../types';
import { SaxesParser } from 'saxes';

/**
 * Regex para validar RFC de Personas Físicas (13 chars), Morales (12 chars) o Genéricos
 */
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/;
const RFC_PREVIEW_REGEX = /[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}/gi;
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CP_REGEX = /^\d{5}$/;

interface DocumentoXML {
  raiz: string | null;
  tags: Map<string, Record<string, string>>;
  impuestosGlobales: Record<string, string> | null;
  traslados: Array<Record<string, string>>;
}

function obtenerNombreLocal(nombre: string): string {
  return (nombre.split(':').pop() ?? nombre).toLowerCase();
}

function parsearDocumentoXML(xml: string): DocumentoXML {
  const documento: DocumentoXML = {
    raiz: null,
    tags: new Map(),
    impuestosGlobales: null,
    traslados: [],
  };
  const pilaTags: string[] = [];
  const parser = new SaxesParser({ xmlns: false });
  let errorParseo: Error | null = null;

  parser.on('error', (error) => {
    errorParseo ??= error;
  });
  parser.on('opentag', (tag) => {
    if (errorParseo) return;

    const nombre = obtenerNombreLocal(tag.name);
    if (pilaTags.length === 0 && documento.raiz === null) {
      documento.raiz = nombre;
    }

    if (documento.raiz === 'comprobante') {
      const atributos: Record<string, string> = {};
      for (const [nombreAtributo, valor] of Object.entries(tag.attributes)) {
        const clave = nombreAtributo.toLowerCase();
        atributos[clave] = valor;
        const nombreSinNamespace = clave.split(':').pop();
        if (nombreSinNamespace) atributos[nombreSinNamespace] = valor;
      }

      if (!documento.tags.has(nombre)) documento.tags.set(nombre, atributos);
      if (
        nombre === 'impuestos' &&
        documento.impuestosGlobales === null &&
        pilaTags.length === 1 &&
        pilaTags[0] === 'comprobante'
      ) {
        documento.impuestosGlobales = atributos;
      }
      if (nombre === 'traslado') documento.traslados.push(atributos);
    }

    pilaTags.push(nombre);
  });
  parser.on('closetag', () => {
    if (!errorParseo) pilaTags.pop();
  });

  try {
    parser.write(xml).close();
  } catch (error) {
    errorParseo ??= error instanceof Error ? error : new Error(String(error));
  }

  if (errorParseo) throw errorParseo;
  return documento;
}

function crearDictamenEstructuraError(
  id: string,
  fileName: string,
  titulo: string,
  descripcion: string,
  fundamentoLegal?: string
): DictamenCFDI {
  return {
    id,
    fileName,
    version: 'N/A',
    uuid: 'SIN UUID',
    rfcEmisor: 'DESCONOCIDO',
    nombreEmisor: 'Desconocido',
    rfcReceptor: 'DESCONOCIDO',
    nombreReceptor: 'Desconocido',
    tipoComprobante: 'N/A',
    fecha: '',
    subtotal: 0,
    total: 0,
    moneda: 'MXN',
    score: 0,
    estatusGeneral: 'rechazado',
    reglas: [
      {
        codigo: 'ESTR-01',
        categoria: 'estructura',
        titulo,
        descripcion,
        severidad: 'error',
        ...(fundamentoLegal ? { fundamentoLegal } : {}),
      },
    ],
    erroresCount: 1,
    advertenciasCount: 0,
    exitosCount: 0,
    avisoAlcance: AVISO_ALCANCE_DICTAMEN,
  };
}

export function enmascararTextoRfcPreview(valor: string): string {
  return valor.replace(RFC_PREVIEW_REGEX, '[RFC_PREVIEW]');
}

export function enmascararRFCsPreview(valor: unknown): unknown {
  if (typeof valor === 'string') {
    return enmascararTextoRfcPreview(valor);
  }
  if (Array.isArray(valor)) {
    return valor.map(enmascararRFCsPreview);
  }
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, contenido]) => [clave, enmascararRFCsPreview(contenido)])
    );
  }
  return valor;
}

/**
 * Revisa estructura XML bien formada y consistencias seleccionadas de CFDI.
 */
export function validarCFDI(xmlText: string, fileName: string = 'factura.xml'): DictamenCFDI {
  const id = `dictamen-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
  const reglas: ReglaAuditoria[] = [];

  // ─────────────────────────────────────────────────────────────
  // 1. ESTRUCTURA BÁSICA Y COMPROBANTE
  // ─────────────────────────────────────────────────────────────
  let documento: DocumentoXML;
  try {
    documento = parsearDocumentoXML(xmlText);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    return crearDictamenEstructuraError(
      id,
      fileName,
      'XML mal formado',
      `XML mal formado: ${detalle}`
    );
  }

  const comprobanteAttrs =
    documento.raiz === 'comprobante' ? documento.tags.get('comprobante') : undefined;
  if (!comprobanteAttrs) {
    return crearDictamenEstructuraError(
      id,
      fileName,
      'XML no es un CFDI válido',
      'El archivo no contiene el nodo raíz obligatorio <Comprobante>.',
      'Art. 29 Código Fiscal de la Federación (CFF)'
    );
  }

  reglas.push({
    codigo: 'ESTR-01',
    categoria: 'estructura',
    titulo: 'Estructura raíz Comprobante válida',
    descripcion: 'Se encontró el nodo raíz <cfdi:Comprobante> correctamente definido.',
    severidad: 'exito',
  });

  const version = comprobanteAttrs['version'] || 'N/A';
  const fecha = comprobanteAttrs['fecha'] || '';
  const tipoComprobante = (comprobanteAttrs['tipodecomprobante'] || 'I').toUpperCase();
  const subtotal = parseFloat(comprobanteAttrs['subtotal'] || '0') || 0;
  const descuento = parseFloat(comprobanteAttrs['descuento'] || '0') || 0;
  const total = parseFloat(comprobanteAttrs['total'] || '0') || 0;
  const moneda = (comprobanteAttrs['moneda'] || 'MXN').toUpperCase();
  const tipoCambio = parseFloat(comprobanteAttrs['tipocambio'] || '1') || 1;
  const formaPago = comprobanteAttrs['formapago'] || '';
  const metodoPago = (comprobanteAttrs['metodopago'] || '').toUpperCase();
  const exportacion = comprobanteAttrs['exportacion'] || '';

  // ─────────────────────────────────────────────────────────────
  // 2. VIGENCIA DE VERSIÓN (4.0 vs 3.3)
  // ─────────────────────────────────────────────────────────────
  if (version === '4.0') {
    reglas.push({
      codigo: 'VIG-01',
      categoria: 'vigencia',
      titulo: 'Versión CFDI 4.0 declarada',
      descripcion: 'El atributo Version contiene 4.0; no se consultó su vigencia fiscal.',
      severidad: 'exito',
    });
  } else if (version === '3.3') {
    reglas.push({
      codigo: 'VIG-01',
      categoria: 'vigencia',
      titulo: 'Versión CFDI 3.3 declarada',
      descripcion:
        'El atributo Version contiene 3.3; esta revisión interna no determina vigencia fiscal ni deducibilidad.',
      severidad: 'advertencia',
    });
  } else {
    reglas.push({
      codigo: 'VIG-01',
      categoria: 'vigencia',
      titulo: `Versión no reconocida (${version})`,
      descripcion: 'La versión declarada en el comprobante no es ni 4.0 ni 3.3.',
      severidad: 'error',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. TIMBRE Y PRESENCIA DE ATRIBUTOS
  // ─────────────────────────────────────────────────────────────
  const timbreAttrs = documento.tags.get('timbrefiscaldigital') ?? null;
  const uuid = (timbreAttrs?.['uuid'] || '').trim().toUpperCase();

  if (!uuid) {
    reglas.push({
      codigo: 'TIMB-01',
      categoria: 'timbre',
      titulo: 'Falta Timbre Fiscal Digital (Sin UUID)',
      descripcion: 'No se encontró un atributo UUID en el TimbreFiscalDigital.',
      severidad: 'error',
      fundamentoLegal: 'Art. 29 fracción VI CFF',
    });
  } else if (!UUID_REGEX.test(uuid)) {
    reglas.push({
      codigo: 'TIMB-02',
      categoria: 'timbre',
      titulo: 'Formato de UUID inválido',
      descripcion: `El UUID "${uuid}" no coincide con el formato hexadecimal 8-4-4-4-12.`,
      severidad: 'error',
    });
  } else {
    reglas.push({
      codigo: 'TIMB-01',
      categoria: 'timbre',
      titulo: 'Formato de UUID reconocido',
      descripcion: `El UUID ${uuid} coincide con el formato hexadecimal 8-4-4-4-12; no se consultó el SAT.`,
      severidad: 'exito',
      detalleValor: uuid,
    });
  }

  // Comprobar sellos digitales
  const selloCfd = comprobanteAttrs['sello'] || timbreAttrs?.['sellocfd'] || '';
  const selloSat = timbreAttrs?.['sellosat'] || '';
  const noCertificado = comprobanteAttrs['nocertificado'] || '';

  if (!selloCfd || !selloSat) {
    reglas.push({
      codigo: 'TIMB-03',
      categoria: 'timbre',
      titulo: 'Sellos digitales incompletos',
      descripcion: 'No se encontraron ambos atributos SelloCFD y SelloSAT.',
      severidad: 'advertencia',
    });
  } else {
    reglas.push({
      codigo: 'TIMB-03',
      categoria: 'timbre',
      titulo: 'Sellos digitales presentes',
      descripcion:
        'Se encontraron los atributos SelloCFD y SelloSAT; no se verificó su firma criptográfica.',
      severidad: 'exito',
    });
  }

  if (!noCertificado) {
    reglas.push({
      codigo: 'TIMB-04',
      categoria: 'timbre',
      titulo: 'Número de Certificado ausente',
      descripcion: 'No se localizó el atributo NoCertificado del comprobante.',
      severidad: 'advertencia',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. EMISOR Y RECEPTOR (FISCAL)
  // ─────────────────────────────────────────────────────────────
  const emisorAttrs = documento.tags.get('emisor') || {};
  const rfcEmisor = (emisorAttrs['rfc'] || '').trim().toUpperCase();
  const nombreEmisor = emisorAttrs['nombre'] || 'Emisor sin nombre';
  const regimenFiscalEmisor = emisorAttrs['regimenfiscal'] || '';

  if (!rfcEmisor) {
    reglas.push({
      codigo: 'FISC-01',
      categoria: 'fiscal',
      titulo: 'RFC de Emisor ausente',
      descripcion: 'El comprobante no incluye el RFC del contribuyente emisor.',
      severidad: 'error',
    });
  } else if (
    !RFC_REGEX.test(rfcEmisor) &&
    rfcEmisor !== 'XAXX010101000' &&
    rfcEmisor !== 'XEXX010101000'
  ) {
    reglas.push({
      codigo: 'FISC-01',
      categoria: 'fiscal',
      titulo: 'RFC de Emisor con formato dudoso',
      descripcion: `El RFC "${rfcEmisor}" no coincide con el patrón de formato configurado.`,
      severidad: 'advertencia',
    });
  } else {
    reglas.push({
      codigo: 'FISC-01',
      categoria: 'fiscal',
      titulo: 'RFC de Emisor con formato reconocido',
      descripcion: `RFC Emisor ${rfcEmisor} coincide con el patrón de formato configurado. Régimen declarado: ${regimenFiscalEmisor || 'N/A'}. No se consultó el padrón del SAT.`,
      severidad: 'exito',
    });
  }

  const receptorAttrs = documento.tags.get('receptor') || {};
  const rfcReceptor = (receptorAttrs['rfc'] || '').trim().toUpperCase();
  const nombreReceptor = receptorAttrs['nombre'] || 'Receptor sin nombre';
  const domicilioFiscalReceptor =
    receptorAttrs['domiciliofiscalreceptor'] || receptorAttrs['lugarexpedicion'] || '';
  const regimenFiscalReceptor =
    receptorAttrs['regimenfiscalreceptor'] || receptorAttrs['regimenfiscal'] || '';
  const usoCFDI = receptorAttrs['usocfdi'] || '';

  if (!rfcReceptor) {
    reglas.push({
      codigo: 'FISC-02',
      categoria: 'fiscal',
      titulo: 'RFC de Receptor ausente',
      descripcion: 'El comprobante no incluye el RFC del receptor.',
      severidad: 'error',
    });
  } else if (
    !RFC_REGEX.test(rfcReceptor) &&
    rfcReceptor !== 'XAXX010101000' &&
    rfcReceptor !== 'XEXX010101000'
  ) {
    reglas.push({
      codigo: 'FISC-02',
      categoria: 'fiscal',
      titulo: 'RFC de Receptor con formato dudoso',
      descripcion: `El RFC "${rfcReceptor}" no coincide con el patrón de formato configurado.`,
      severidad: 'advertencia',
    });
  } else {
    reglas.push({
      codigo: 'FISC-02',
      categoria: 'fiscal',
      titulo: 'RFC de Receptor con formato reconocido',
      descripcion: `RFC Receptor ${rfcReceptor} coincide con el patrón de formato configurado. No se consultó el padrón del SAT.`,
      severidad: 'exito',
    });
  }

  // Campos de receptor revisados para CFDI 4.0
  if (version === '4.0') {
    if (!domicilioFiscalReceptor || !CP_REGEX.test(domicilioFiscalReceptor)) {
      reglas.push({
        codigo: 'FISC-03',
        categoria: 'fiscal',
        titulo: 'DomicilioFiscalReceptor (CP) ausente o no válido',
        descripcion:
          'El atributo no contiene cinco dígitos. No se consulta el padrón postal ni se determina deducibilidad.',
        severidad: 'error',
        fundamentoLegal: 'Art. 29-A fracción IV CFF',
      });
    } else {
      reglas.push({
        codigo: 'FISC-03',
        categoria: 'fiscal',
        titulo: 'Domicilio Fiscal Receptor declarado',
        descripcion: `Código Postal declarado: ${domicilioFiscalReceptor}; solo se comprobó que contiene cinco dígitos.`,
        severidad: 'exito',
      });
    }

    if (!regimenFiscalReceptor) {
      reglas.push({
        codigo: 'FISC-04',
        categoria: 'fiscal',
        titulo: 'RegimenFiscalReceptor ausente',
        descripcion: 'No se encontró el atributo RegimenFiscalReceptor.',
        severidad: 'error',
        fundamentoLegal: 'Art. 29-A fracción IV CFF',
      });
    } else {
      reglas.push({
        codigo: 'FISC-04',
        categoria: 'fiscal',
        titulo: 'Régimen Fiscal Receptor declarado',
        descripcion: `Clave de régimen fiscal: ${regimenFiscalReceptor}`,
        severidad: 'exito',
      });
    }

    if (!exportacion) {
      reglas.push({
        codigo: 'FISC-05',
        categoria: 'fiscal',
        titulo: 'Atributo Exportacion ausente en CFDI 4.0',
        descripcion:
          'No se encontró el atributo "Exportacion"; no se evalúan aquí los valores permitidos.',
        severidad: 'advertencia',
      });
    }
  }

  if (!usoCFDI) {
    reglas.push({
      codigo: 'FISC-06',
      categoria: 'fiscal',
      titulo: 'UsoCFDI no especificado',
      descripcion: 'El comprobante no indica la clave de Uso del CFDI.',
      severidad: 'advertencia',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 5. FORMA DE PAGO Y MÉTODO DE PAGO (Regla SAT 2.7.1.32)
  // ─────────────────────────────────────────────────────────────
  if (metodoPago === 'PPD' && formaPago && formaPago !== '99') {
    reglas.push({
      codigo: 'FISC-07',
      categoria: 'fiscal',
      titulo: 'Inconsistencia en PPD y Forma de Pago',
      descripcion: `Se especificó Método de Pago PPD (Parcialidades o Diferido) pero la Forma de Pago es "${formaPago}" en lugar de 99 (Por definir).`,
      severidad: 'advertencia',
      fundamentoLegal: 'Regla 2.7.1.32 Resolución Miscelánea Fiscal',
    });
  } else if (metodoPago === 'PUE' && formaPago === '99') {
    reglas.push({
      codigo: 'FISC-07',
      categoria: 'fiscal',
      titulo: 'Inconsistencia en PUE y Forma de Pago 99',
      descripcion:
        'Si el método de pago es PUE (Pago en una sola exhibición), no puede utilizarse la forma de pago 99 (Por definir). Debe especificarse el medio real.',
      severidad: 'advertencia',
      fundamentoLegal: 'Guía de llenado CFDI SAT',
    });
  } else if (metodoPago || formaPago) {
    reglas.push({
      codigo: 'FISC-07',
      categoria: 'fiscal',
      titulo: 'Método y Forma de Pago congruentes',
      descripcion: `Método: ${metodoPago || 'N/A'}, Forma de Pago: ${formaPago || 'N/A'}`,
      severidad: 'exito',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 6. COHERENCIA ARITMÉTICA Y MATEMÁTICA
  // ─────────────────────────────────────────────────────────────
  const impuestosAttrs = documento.impuestosGlobales ?? {};

  const totalTraslados = parseFloat(impuestosAttrs['totalimpuestostrasladados'] || '0') || 0;
  const totalRetenciones = parseFloat(impuestosAttrs['totalimpuestosretenidos'] || '0') || 0;

  // Total esperado = Subtotal - Descuento + Traslados - Retenciones
  const totalEsperado =
    Math.round((subtotal - descuento + totalTraslados - totalRetenciones) * 100) / 100;
  const diferenciaAritmetica = Math.abs(Math.round((total - totalEsperado) * 100) / 100);

  const inconsistenciasTraslado = documento.traslados.flatMap((traslado, indice) => {
    if ((traslado['tipofactor'] || '').toUpperCase() !== 'TASA') return [];

    const base = Number(traslado['base']);
    const tasa = Number(traslado['tasaocuota']);
    const importe = Number(traslado['importe']);
    if (
      !Number.isFinite(base) ||
      !Number.isFinite(tasa) ||
      !Number.isFinite(importe) ||
      traslado['base'] === undefined ||
      traslado['tasaocuota'] === undefined ||
      traslado['importe'] === undefined
    ) {
      return [`Traslado ${indice + 1}: Base, TasaOCuota e Importe deben ser valores numéricos.`];
    }

    const importeEsperado = Math.round(base * tasa * 100) / 100;
    const diferencia = Math.abs(Math.round((importe - importeEsperado) * 100) / 100);
    return diferencia > 1.0
      ? [
          `Traslado ${indice + 1}: Base $${base.toFixed(2)} × TasaOCuota ${tasa} = $${importeEsperado.toFixed(2)}, pero el Importe declarado es $${importe.toFixed(2)} (diferencia $${diferencia.toFixed(2)}).`,
        ]
      : [];
  });

  if (diferenciaAritmetica > 1.0 || inconsistenciasTraslado.length > 0) {
    const detalleTotal =
      diferenciaAritmetica > 1.0
        ? `El Total declarado ($${total.toFixed(2)}) difiere en $${diferenciaAritmetica.toFixed(2)} del cálculo esperado: Subtotal ($${subtotal.toFixed(2)}) - Descuento ($${descuento.toFixed(2)}) + Traslados ($${totalTraslados.toFixed(2)}) - Retenciones ($${totalRetenciones.toFixed(2)}) = $${totalEsperado.toFixed(2)}.`
        : '';
    const detalleTraslados = inconsistenciasTraslado.join(' ');
    reglas.push({
      codigo: 'ARIT-01',
      categoria: 'aritmetica',
      titulo:
        diferenciaAritmetica > 1.0
          ? 'Discrepancia en cuadratura aritmética'
          : 'Discrepancia en cálculo de traslado',
      descripcion: `${detalleTotal} ${detalleTraslados} ${AVISO_TOLERANCIA_ARITMETICA}`.trim(),
      severidad: 'error',
      fundamentoLegal:
        'Chequeo interno de consistencia; no es una validación integral del Anexo 20.',
    });
  } else {
    reglas.push({
      codigo: 'ARIT-01',
      categoria: 'aritmetica',
      titulo: 'Cuadratura aritmética de totales correcta',
      descripcion: `Subtotal ($${subtotal.toFixed(2)}) e Impuestos cuadran matemáticamente con el Total ($${total.toFixed(2)}). ${AVISO_TOLERANCIA_ARITMETICA}`,
      severidad: 'exito',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 7. MONEDA Y TIPO DE CAMBIO
  // ─────────────────────────────────────────────────────────────
  if (moneda === 'MXN' && tipoCambio !== 1) {
    reglas.push({
      codigo: 'MON-01',
      categoria: 'fiscal',
      titulo: 'Tipo de cambio incorrecto para MXN',
      descripcion: `Para MXN se encontró un tipo de cambio distinto de 1 (${tipoCambio}); no se consulta una fuente oficial.`,
      severidad: 'advertencia',
    });
  } else if (moneda !== 'MXN' && (tipoCambio === 1 || !tipoCambio)) {
    reglas.push({
      codigo: 'MON-01',
      categoria: 'fiscal',
      titulo: `Tipo de cambio no especificado para divisa extranjera (${moneda})`,
      descripcion:
        'No se declaró un tipo de cambio distinto de 1 para esta moneda; no se consulta el FIX del DOF.',
      severidad: 'advertencia',
      fundamentoLegal: 'Art. 20 CFF',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SCORE Y ESTATUS GENERAL
  // ─────────────────────────────────────────────────────────────
  const erroresCount = reglas.filter((r) => r.severidad === 'error').length;
  const advertenciasCount = reglas.filter((r) => r.severidad === 'advertencia').length;
  const exitosCount = reglas.filter((r) => r.severidad === 'exito').length;

  // Cálculo de puntaje de 0 a 100
  let score = 100 - erroresCount * 30 - advertenciasCount * 10;
  if (score < 0) score = 0;
  if (erroresCount > 0 && score > 60) score = 50; // Limita puntajes altos cuando hay errores

  let estatusGeneral: EstatusDictamen = 'aprobado';
  if (erroresCount > 0) {
    estatusGeneral = 'rechazado';
  } else if (advertenciasCount > 0) {
    estatusGeneral = 'advertencia';
  }

  return {
    id,
    fileName,
    version,
    uuid: uuid || 'SIN UUID',
    rfcEmisor: rfcEmisor || 'DESCONOCIDO',
    nombreEmisor,
    rfcReceptor: rfcReceptor || 'DESCONOCIDO',
    nombreReceptor,
    tipoComprobante,
    fecha,
    subtotal,
    total,
    moneda,
    score,
    estatusGeneral,
    reglas,
    erroresCount,
    advertenciasCount,
    exitosCount,
    avisoAlcance: AVISO_ALCANCE_DICTAMEN,
  };
}

/**
 * Procesa y audita un lote de archivos XML de forma asíncrona
 */
export async function validarArchivosXML(files: File[]): Promise<DictamenCFDI[]> {
  const promesas = files.map((file) => {
    return new Promise<DictamenCFDI>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = (e.target?.result as string) || '';
          const dictamen = validarCFDI(content, file.name);
          resolve(dictamen);
        } catch (err) {
          resolve({
            id: `err-${Math.random().toString(36).substring(2, 9)}`,
            fileName: file.name,
            version: 'N/A',
            uuid: 'ERROR LECTURA',
            rfcEmisor: 'DESCONOCIDO',
            nombreEmisor: 'Desconocido',
            rfcReceptor: 'DESCONOCIDO',
            nombreReceptor: 'Desconocido',
            tipoComprobante: 'N/A',
            fecha: '',
            subtotal: 0,
            total: 0,
            moneda: 'MXN',
            score: 0,
            estatusGeneral: 'rechazado',
            reglas: [
              {
                codigo: 'ESTR-ERR',
                categoria: 'estructura',
                titulo: 'Error fatal de lectura',
                descripcion: err instanceof Error ? err.message : 'No se pudo leer el archivo XML',
                severidad: 'error',
              },
            ],
            erroresCount: 1,
            advertenciasCount: 0,
            exitosCount: 0,
            avisoAlcance: AVISO_ALCANCE_DICTAMEN,
          });
        }
      };
      reader.onerror = () => {
        resolve({
          id: `err-${Math.random().toString(36).substring(2, 9)}`,
          fileName: file.name,
          version: 'N/A',
          uuid: 'ERROR ARCHIVO',
          rfcEmisor: 'DESCONOCIDO',
          nombreEmisor: 'Desconocido',
          rfcReceptor: 'DESCONOCIDO',
          nombreReceptor: 'Desconocido',
          tipoComprobante: 'N/A',
          fecha: '',
          subtotal: 0,
          total: 0,
          moneda: 'MXN',
          score: 0,
          estatusGeneral: 'rechazado',
          reglas: [
            {
              codigo: 'ESTR-IO',
              categoria: 'estructura',
              titulo: 'Error de entrada/salida',
              descripcion: 'Fallo al acceder al archivo en el navegador.',
              severidad: 'error',
            },
          ],
          erroresCount: 1,
          advertenciasCount: 0,
          exitosCount: 0,
          avisoAlcance: AVISO_ALCANCE_DICTAMEN,
        });
      };
      reader.readAsText(file, 'utf-8');
    });
  });

  return Promise.all(promesas);
}

/**
 * Consolida las estadísticas de auditoría de un lote
 */
export function calcularResumenAuditoria(dictamenes: DictamenCFDI[]): ResumenAuditoriaLote {
  const total = dictamenes.length;
  if (total === 0) {
    return {
      totalAnalizados: 0,
      aprobados: 0,
      conAdvertencias: 0,
      rechazados: 0,
      promedioScore: 0,
      totalErrores: 0,
      totalAdvertencias: 0,
    };
  }

  let aprobados = 0;
  let conAdvertencias = 0;
  let rechazados = 0;
  let sumaScores = 0;
  let totalErrores = 0;
  let totalAdvertencias = 0;

  for (const d of dictamenes) {
    sumaScores += d.score;
    totalErrores += d.erroresCount;
    totalAdvertencias += d.advertenciasCount;

    if (d.estatusGeneral === 'aprobado') {
      aprobados += 1;
    } else if (d.estatusGeneral === 'advertencia') {
      conAdvertencias += 1;
    } else {
      rechazados += 1;
    }
  }

  return {
    totalAnalizados: total,
    aprobados,
    conAdvertencias,
    rechazados,
    promedioScore: Math.round(sumaScores / total),
    totalErrores,
    totalAdvertencias,
  };
}

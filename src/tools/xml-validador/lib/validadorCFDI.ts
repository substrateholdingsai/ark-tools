/**
 * ARK TOOLS — Validador de XMLs CFDI 4.0 & 3.3
 * Motor de Auditoría y Verificación de Reglas SAT (Anexo 20)
 */

import type {
  DictamenCFDI,
  ReglaAuditoria,
  EstatusDictamen,
  ResumenAuditoriaLote,
} from '../types';

/**
 * Regex para validar RFC de Personas Físicas (13 chars), Morales (12 chars) o Genéricos
 */
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/;
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const CP_REGEX = /^\d{5}$/;

/**
 * Decodifica entidades HTML/XML comunes
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
 * Extrae atributos de una etiqueta XML
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
 * Busca una etiqueta XML y extrae sus atributos
 */
function buscarTag(xml: string, tagName: string): Record<string, string> | null {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}\\b([^>]*)/?>`, 'i');
  const match = xml.match(regex);
  if (!match || !match[1]) return null;
  return extraerAtributosTag(match[1]);
}

/**
 * Audita y valida un archivo XML de CFDI contra las especificaciones del SAT
 */
export function validarCFDI(xmlText: string, fileName: string = 'factura.xml'): DictamenCFDI {
  const id = `dictamen-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
  const reglas: ReglaAuditoria[] = [];

  // ─────────────────────────────────────────────────────────────
  // 1. ESTRUCTURA BÁSICA Y COMPROBANTE
  // ─────────────────────────────────────────────────────────────
  const comprobanteAttrs = buscarTag(xmlText, 'Comprobante');
  if (!comprobanteAttrs) {
    reglas.push({
      codigo: 'ESTR-01',
      categoria: 'estructura',
      titulo: 'XML no es un CFDI válido',
      descripcion: 'El archivo no contiene el nodo raíz obligatorio <Comprobante>.',
      severidad: 'error',
      fundamentoLegal: 'Art. 29 Código Fiscal de la Federación (CFF)',
    });

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
      reglas,
      erroresCount: 1,
      advertenciasCount: 0,
      exitosCount: 0,
    };
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
      titulo: 'Versión CFDI 4.0 vigente',
      descripcion: 'El comprobante utiliza la versión CFDI 4.0 oficial.',
      severidad: 'exito',
      fundamentoLegal: 'Anexo 20 RMF 2026',
    });
  } else if (version === '3.3') {
    reglas.push({
      codigo: 'VIG-01',
      categoria: 'vigencia',
      titulo: 'CFDI 3.3 obsoleto / No vigente',
      descripcion:
        'La versión 3.3 fue abrogada por el SAT el 1 de abril de 2023. Para ejercicios fiscales recientes debe emitirse en CFDI 4.0 para asegurar deducibilidad.',
      severidad: 'advertencia',
      fundamentoLegal: 'Artículo Transitorio Décimo Séptimo RMF',
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
  // 3. TIMBRADO Y CERTIFICACIÓN SAT
  // ─────────────────────────────────────────────────────────────
  const timbreAttrs = buscarTag(xmlText, 'TimbreFiscalDigital');
  const uuid = (timbreAttrs?.['uuid'] || '').trim().toUpperCase();

  if (!uuid) {
    reglas.push({
      codigo: 'TIMB-01',
      categoria: 'timbre',
      titulo: 'Falta Timbre Fiscal Digital (Sin UUID)',
      descripcion:
        'El archivo carece de Folio Fiscal Digital (UUID) emitido por el SAT o un PAC autorizado. Comprobante no certificado.',
      severidad: 'error',
      fundamentoLegal: 'Art. 29 fracción VI CFF',
    });
  } else if (!UUID_REGEX.test(uuid)) {
    reglas.push({
      codigo: 'TIMB-02',
      categoria: 'timbre',
      titulo: 'Formato de UUID inválido',
      descripcion: `El UUID "${uuid}" no cumple con el estándar hexadecimal RFC 4122 (8-4-4-4-12).`,
      severidad: 'error',
    });
  } else {
    reglas.push({
      codigo: 'TIMB-01',
      categoria: 'timbre',
      titulo: 'Timbrado Digital verificado',
      descripcion: `Folio fiscal UUID válido: ${uuid}`,
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
      descripcion:
        'El comprobante no cuenta con el sello del emisor (SelloCFD) o el sello de certificación del SAT (SelloSAT).',
      severidad: 'advertencia',
    });
  } else {
    reglas.push({
      codigo: 'TIMB-03',
      categoria: 'timbre',
      titulo: 'Sellos digitales presentes',
      descripcion: 'Sellos criptográficos SelloCFD y SelloSAT declarados correctamente.',
      severidad: 'exito',
    });
  }

  if (!noCertificado) {
    reglas.push({
      codigo: 'TIMB-04',
      categoria: 'timbre',
      titulo: 'Número de Certificado ausente',
      descripcion: 'No se localizó el atributo NoCertificado del CSD del emisor.',
      severidad: 'advertencia',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. EMISOR Y RECEPTOR (FISCAL)
  // ─────────────────────────────────────────────────────────────
  const emisorAttrs = buscarTag(xmlText, 'Emisor') || {};
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
  } else if (!RFC_REGEX.test(rfcEmisor) && rfcEmisor !== 'XAXX010101000' && rfcEmisor !== 'XEXX010101000') {
    reglas.push({
      codigo: 'FISC-01',
      categoria: 'fiscal',
      titulo: 'RFC de Emisor con formato dudoso',
      descripcion: `El RFC "${rfcEmisor}" no cumple la estructura homoclave SAT de 12 o 13 caracteres.`,
      severidad: 'advertencia',
    });
  } else {
    reglas.push({
      codigo: 'FISC-01',
      categoria: 'fiscal',
      titulo: 'RFC de Emisor válido',
      descripcion: `RFC Emisor ${rfcEmisor} con estructura correcta. Régimen fiscal: ${regimenFiscalEmisor || 'N/A'}.`,
      severidad: 'exito',
    });
  }

  const receptorAttrs = buscarTag(xmlText, 'Receptor') || {};
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
  } else if (!RFC_REGEX.test(rfcReceptor) && rfcReceptor !== 'XAXX010101000' && rfcReceptor !== 'XEXX010101000') {
    reglas.push({
      codigo: 'FISC-02',
      categoria: 'fiscal',
      titulo: 'RFC de Receptor con formato dudoso',
      descripcion: `El RFC "${rfcReceptor}" no cumple la estructura homoclave estándar del SAT.`,
      severidad: 'advertencia',
    });
  } else {
    reglas.push({
      codigo: 'FISC-02',
      categoria: 'fiscal',
      titulo: 'RFC de Receptor válido',
      descripcion: `RFC Receptor ${rfcReceptor} con estructura correcta.`,
      severidad: 'exito',
    });
  }

  // Requisitos específicos de CFDI 4.0 en Receptor
  if (version === '4.0') {
    if (!domicilioFiscalReceptor || !CP_REGEX.test(domicilioFiscalReceptor)) {
      reglas.push({
        codigo: 'FISC-03',
        categoria: 'fiscal',
        titulo: 'DomicilioFiscalReceptor (CP) ausente o no válido',
        descripcion:
          'En CFDI 4.0, el DomicilioFiscalReceptor debe ser el Código Postal de 5 dígitos del receptor para que la factura sea deducible.',
        severidad: 'error',
        fundamentoLegal: 'Art. 29-A fracción IV CFF',
      });
    } else {
      reglas.push({
        codigo: 'FISC-03',
        categoria: 'fiscal',
        titulo: 'Domicilio Fiscal Receptor verificado',
        descripcion: `Código Postal declarado: ${domicilioFiscalReceptor}`,
        severidad: 'exito',
      });
    }

    if (!regimenFiscalReceptor) {
      reglas.push({
        codigo: 'FISC-04',
        categoria: 'fiscal',
        titulo: 'RegimenFiscalReceptor ausente',
        descripcion:
          'En CFDI 4.0 es obligatorio declarar la clave de régimen fiscal del receptor registrado en el SAT.',
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
        descripcion: 'El atributo "Exportacion" es requerido por la matriz de llenado SAT (ej. "01" No aplica).',
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
  const partesConceptos = xmlText.split(/<\/(?:[a-zA-Z0-9_]+:)?Conceptos>/i);
  const seccionGlobal = (partesConceptos.length > 1 ? partesConceptos[1] : xmlText) ?? '';
  const impuestosAttrs = buscarTag(seccionGlobal, 'Impuestos') || {};

  const totalTraslados = parseFloat(impuestosAttrs['totalimpuestostrasladados'] || '0') || 0;
  const totalRetenciones = parseFloat(impuestosAttrs['totalimpuestosretenidos'] || '0') || 0;

  // Total esperado = Subtotal - Descuento + Traslados - Retenciones
  const totalEsperado = Math.round((subtotal - descuento + totalTraslados - totalRetenciones) * 100) / 100;
  const diferenciaAritmetica = Math.abs(Math.round((total - totalEsperado) * 100) / 100);

  // La tolerancia estándar por redondeo de ítems del SAT es de hasta $1.00 MXN
  if (diferenciaAritmetica > 1.0) {
    reglas.push({
      codigo: 'ARIT-01',
      categoria: 'aritmetica',
      titulo: 'Discrepancia en cuadratura de Total',
      descripcion: `El Total declarado ($${total.toFixed(2)}) difiere en $${diferenciaAritmetica.toFixed(2)} del cálculo esperado: Subtotal ($${subtotal.toFixed(2)}) - Descuento ($${descuento.toFixed(2)}) + Traslados ($${totalTraslados.toFixed(2)}) - Retenciones ($${totalRetenciones.toFixed(2)}) = $${totalEsperado.toFixed(2)}.`,
      severidad: 'error',
      fundamentoLegal: 'Validación de Total y Sumas Anexo 20',
    });
  } else {
    reglas.push({
      codigo: 'ARIT-01',
      categoria: 'aritmetica',
      titulo: 'Cuadratura aritmética de totales correcta',
      descripcion: `Subtotal ($${subtotal.toFixed(2)}) e Impuestos cuadran matemáticamente con el Total ($${total.toFixed(2)}).`,
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
      descripcion: `Para la moneda MXN el tipo de cambio debe ser 1 (se encontró ${tipoCambio}).`,
      severidad: 'advertencia',
    });
  } else if (moneda !== 'MXN' && (tipoCambio === 1 || !tipoCambio)) {
    reglas.push({
      codigo: 'MON-01',
      categoria: 'fiscal',
      titulo: `Tipo de cambio no especificado para divisa extranjera (${moneda})`,
      descripcion: 'Al facturar en moneda extranjera, debe especificarse el tipo de cambio oficial FIX del DOF.',
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
  if (erroresCount > 0 && score > 60) score = 50; // Techo si hay errores fiscales

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
                descripcion:
                  err instanceof Error ? err.message : 'No se pudo leer el archivo XML',
                severidad: 'error',
              },
            ],
            erroresCount: 1,
            advertenciasCount: 0,
            exitosCount: 0,
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

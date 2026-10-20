/**
 * ARK TOOLS — Conversor XML a Excel (CFDI 4.0 & 3.3)
 * Parser Universal de CFDI para Navegador y Entornos de Prueba
 */

import type { FacturaCFDI, TipoComprobante, ResumenLoteXML } from '../types';

/**
 * Mapeo de TipoDeComprobante del SAT a descripción amigable
 */
export const TIPO_COMPROBANTE_MAP: Record<string, { tipo: TipoComprobante; desc: string }> = {
  I: { tipo: 'I', desc: 'Ingreso (Factura)' },
  E: { tipo: 'E', desc: 'Egreso (Nota de Crédito)' },
  T: { tipo: 'T', desc: 'Traslado' },
  N: { tipo: 'N', desc: 'Nómina' },
  P: { tipo: 'P', desc: 'Pago (REP)' },
};

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
 * Extrae atributos de una etiqueta XML mediante Regex (funciona en Browser y Node)
 */
function extraerAtributosTag(tagContent: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Regex para capturar clave="valor" o clave='valor'
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(tagContent)) !== null) {
    const rawKey = match[1];
    if (!rawKey) continue;
    const key = rawKey.toLowerCase();
    const val = decodificarEntidades(match[2] ?? match[3] ?? '');
    attrs[key] = val;
    // También guardamos sin prefijo de namespace (ej. cfdi:version -> version)
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
 * Busca una etiqueta XML y extrae sus atributos principales
 */
function buscarTag(xml: string, tagName: string): Record<string, string> | null {
  // Coincide con <tagName o <cfdi:tagName o <tfd:tagName etc.
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}\\b([^>]*)/?>`, 'i');
  const match = xml.match(regex);
  if (!match || !match[1]) return null;
  return extraerAtributosTag(match[1]);
}

/**
 * Busca todas las apariciones de una etiqueta XML y extrae sus atributos
 */
function buscarTags(xml: string, tagName: string): Record<string, string>[] {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}\\b([^>]*)/?>`, 'gi');
  const resultados: Record<string, string>[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) {
      resultados.push(extraerAtributosTag(match[1]));
    }
  }

  return resultados;
}

/**
 * Parsea un único XML de CFDI y extrae la información contable estructurada
 */
export function parsearCFDI(xmlText: string, fileName: string = 'factura.xml'): FacturaCFDI {
  const id = `cfdi-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;

  // 1. Validar que tenga comprobante
  const comprobanteAttrs = buscarTag(xmlText, 'Comprobante');
  if (!comprobanteAttrs) {
    return {
      id,
      fileName,
      version: 'N/A',
      uuid: 'SIN UUID',
      fecha: '',
      tipoComprobante: 'Desconocido',
      tipoComprobanteDesc: 'XML Inválido (Sin Comprobante)',
      serie: '',
      folio: '',
      moneda: 'MXN',
      tipoCambio: 1,
      formaPago: '',
      metodoPago: '',
      lugarExpedicion: '',
      rfcEmisor: '',
      nombreEmisor: '',
      regimenFiscalEmisor: '',
      rfcReceptor: '',
      nombreReceptor: '',
      regimenFiscalReceptor: '',
      usoCFDI: '',
      subtotal: 0,
      descuento: 0,
      totalImpuestosTrasladados: 0,
      totalImpuestosRetenidos: 0,
      total: 0,
      iva16: 0,
      iva8: 0,
      ivaRetenido: 0,
      isrRetenido: 0,
      ieps: 0,
      conceptosCount: 0,
      descripcionResumen: 'El archivo no contiene un nodo CFDI válido',
      estado: 'error',
      mensajeError: 'No se encontró el nodo principal <Comprobante>',
    };
  }

  // 2. Extraer datos del Comprobante
  const version = comprobanteAttrs['version'] || '4.0';
  const serie = comprobanteAttrs['serie'] || '';
  const folio = comprobanteAttrs['folio'] || '';
  const fecha = comprobanteAttrs['fecha'] || '';
  const formaPago = comprobanteAttrs['formapago'] || '';
  const metodoPago = comprobanteAttrs['metodopago'] || '';
  const lugarExpedicion = comprobanteAttrs['lugarexpedicion'] || '';
  const moneda = comprobanteAttrs['moneda'] || 'MXN';
  const tipoCambio = parseFloat(comprobanteAttrs['tipocambio'] || '1') || 1;

  const rawTipo = (comprobanteAttrs['tipodecomprobante'] || 'I').toUpperCase();
  const infoTipo = TIPO_COMPROBANTE_MAP[rawTipo] || {
    tipo: 'Desconocido' as TipoComprobante,
    desc: `Tipo ${rawTipo}`,
  };

  const subtotal = parseFloat(comprobanteAttrs['subtotal'] || '0') || 0;
  const descuento = parseFloat(comprobanteAttrs['descuento'] || '0') || 0;
  const total = parseFloat(comprobanteAttrs['total'] || '0') || 0;

  // 3. Extraer Timbre Fiscal Digital (UUID)
  const timbreAttrs = buscarTag(xmlText, 'TimbreFiscalDigital');
  const uuid = (timbreAttrs?.['uuid'] || '').toUpperCase().trim();

  // 4. Extraer Emisor
  const emisorAttrs = buscarTag(xmlText, 'Emisor') || {};
  const rfcEmisor = (emisorAttrs['rfc'] || '').toUpperCase().trim();
  const nombreEmisor = emisorAttrs['nombre'] || '';
  const regimenFiscalEmisor = emisorAttrs['regimenfiscal'] || '';

  // 5. Extraer Receptor
  const receptorAttrs = buscarTag(xmlText, 'Receptor') || {};
  const rfcReceptor = (receptorAttrs['rfc'] || '').toUpperCase().trim();
  const nombreReceptor = receptorAttrs['nombre'] || '';
  const regimenFiscalReceptor =
    receptorAttrs['regimenfiscalreceptor'] || receptorAttrs['regimenfiscal'] || '';
  const usoCFDI = receptorAttrs['usocfdi'] || '';

  // 6. Extraer Impuestos Globales del Comprobante (ubicados fuera de <Conceptos>)
  const partesConceptos = xmlText.split(/<\/(?:[a-zA-Z0-9_]+:)?Conceptos>/i);
  const seccionGlobal = (partesConceptos.length > 1 ? partesConceptos[1] : xmlText) ?? '';

  const matchImpuestosGlobales = seccionGlobal.match(
    /<(?:[a-zA-Z0-9_]+:)?Impuestos\b([^>]*)>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?Impuestos>/i
  );

  const impuestosXml = matchImpuestosGlobales ? matchImpuestosGlobales[0] : '';
  const impuestosAttrs =
    matchImpuestosGlobales && matchImpuestosGlobales[1]
      ? extraerAtributosTag(matchImpuestosGlobales[1])
      : {};

  let totalTraslados = parseFloat(impuestosAttrs['totalimpuestostrasladados'] || '0') || 0;
  let totalRetenciones = parseFloat(impuestosAttrs['totalimpuestosretenidos'] || '0') || 0;

  // 7. Desglose detallado de Traslados y Retenciones (usando la sección global si existe, o el documento)
  let iva16 = 0;
  let iva8 = 0;
  let ieps = 0;
  let ivaRetenido = 0;
  let isrRetenido = 0;

  const fuenteImpuestos = impuestosXml || (partesConceptos.length === 1 ? xmlText : '');
  const traslados = buscarTags(fuenteImpuestos, 'Traslado');
  for (const t of traslados) {
    const impuesto = t['impuesto']; // 002 = IVA, 003 = IEPS
    const tasaOCuota = parseFloat(t['tasaocuota'] || '0');
    const importe = parseFloat(t['importe'] || '0') || 0;

    if (impuesto === '002') {
      if (Math.abs(tasaOCuota - 0.16) < 0.001) {
        iva16 += importe;
      } else if (Math.abs(tasaOCuota - 0.08) < 0.001) {
        iva8 += importe;
      }
    } else if (impuesto === '003') {
      ieps += importe;
    }
  }

  const retenciones = buscarTags(fuenteImpuestos, 'Retencion');
  for (const r of retenciones) {
    const impuesto = r['impuesto']; // 001 = ISR, 002 = IVA
    const importe = parseFloat(r['importe'] || '0') || 0;

    if (impuesto === '002') {
      ivaRetenido += importe;
    } else if (impuesto === '001') {
      isrRetenido += importe;
    }
  }

  // Redondear desgloses
  iva16 = Math.round(iva16 * 100) / 100;
  iva8 = Math.round(iva8 * 100) / 100;
  ieps = Math.round(ieps * 100) / 100;
  ivaRetenido = Math.round(ivaRetenido * 100) / 100;
  isrRetenido = Math.round(isrRetenido * 100) / 100;

  // Si los atributos globales no venían especificados, sumar los desgloses
  if (totalTraslados === 0 && (iva16 > 0 || iva8 > 0 || ieps > 0)) {
    totalTraslados = Math.round((iva16 + iva8 + ieps) * 100) / 100;
  }
  if (totalRetenciones === 0 && (ivaRetenido > 0 || isrRetenido > 0)) {
    totalRetenciones = Math.round((ivaRetenido + isrRetenido) * 100) / 100;
  }

  // 8. Conceptos
  const conceptosTags = buscarTags(xmlText, 'Concepto');
  const conceptosCount = conceptosTags.length;
  let descripcionResumen = '';
  if (conceptosCount > 0) {
    const descripciones = conceptosTags
      .slice(0, 3)
      .map((c) => c['descripcion'] || '')
      .filter(Boolean);
    descripcionResumen = descripciones.join('; ');
    if (conceptosCount > 3) {
      descripcionResumen += ` (+${conceptosCount - 3} más)`;
    }
  }

  // Estado del comprobante
  let estado: 'valido' | 'advertencia' | 'error' = 'valido';
  let mensajeError: string | undefined;

  if (!uuid) {
    estado = 'advertencia';
    mensajeError = 'Comprobante sin Timbre Fiscal Digital (Sin UUID)';
  }

  return {
    id,
    fileName,
    version,
    uuid: uuid || 'SIN UUID',
    fecha,
    tipoComprobante: infoTipo.tipo,
    tipoComprobanteDesc: infoTipo.desc,
    serie,
    folio,
    moneda,
    tipoCambio,
    formaPago,
    metodoPago,
    lugarExpedicion,
    rfcEmisor,
    nombreEmisor,
    regimenFiscalEmisor,
    rfcReceptor,
    nombreReceptor,
    regimenFiscalReceptor,
    usoCFDI,
    subtotal,
    descuento,
    totalImpuestosTrasladados: totalTraslados,
    totalImpuestosRetenidos: totalRetenciones,
    total,
    iva16,
    iva8,
    ivaRetenido,
    isrRetenido,
    ieps,
    conceptosCount,
    descripcionResumen,
    estado,
    mensajeError,
  };
}

/**
 * Procesa una lista de archivos File de navegador de forma asíncrona
 */
export async function procesarArchivosXML(files: File[]): Promise<FacturaCFDI[]> {
  const promesas = files.map((file) => {
    return new Promise<FacturaCFDI>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = (e.target?.result as string) || '';
          const factura = parsearCFDI(content, file.name);
          resolve(factura);
        } catch (err) {
          resolve({
            id: `err-${Math.random().toString(36).substring(2, 9)}`,
            fileName: file.name,
            version: 'N/A',
            uuid: 'ERROR LECTURA',
            fecha: '',
            tipoComprobante: 'Desconocido',
            tipoComprobanteDesc: 'Error de Lectura',
            serie: '',
            folio: '',
            moneda: 'MXN',
            tipoCambio: 1,
            formaPago: '',
            metodoPago: '',
            lugarExpedicion: '',
            rfcEmisor: '',
            nombreEmisor: '',
            regimenFiscalEmisor: '',
            rfcReceptor: '',
            nombreReceptor: '',
            regimenFiscalReceptor: '',
            usoCFDI: '',
            subtotal: 0,
            descuento: 0,
            totalImpuestosTrasladados: 0,
            totalImpuestosRetenidos: 0,
            total: 0,
            iva16: 0,
            iva8: 0,
            ivaRetenido: 0,
            isrRetenido: 0,
            ieps: 0,
            conceptosCount: 0,
            descripcionResumen: err instanceof Error ? err.message : 'Error desconocido',
            estado: 'error',
            mensajeError: 'No se pudo leer el archivo XML',
          });
        }
      };
      reader.onerror = () => {
        resolve({
          id: `err-${Math.random().toString(36).substring(2, 9)}`,
          fileName: file.name,
          version: 'N/A',
          uuid: 'ERROR ARCHIVO',
          fecha: '',
          tipoComprobante: 'Desconocido',
          tipoComprobanteDesc: 'Error de Archivo',
          serie: '',
          folio: '',
          moneda: 'MXN',
          tipoCambio: 1,
          formaPago: '',
          metodoPago: '',
          lugarExpedicion: '',
          rfcEmisor: '',
          nombreEmisor: '',
          regimenFiscalEmisor: '',
          rfcReceptor: '',
          nombreReceptor: '',
          regimenFiscalReceptor: '',
          usoCFDI: '',
          subtotal: 0,
          descuento: 0,
          totalImpuestosTrasladados: 0,
          totalImpuestosRetenidos: 0,
          total: 0,
          iva16: 0,
          iva8: 0,
          ivaRetenido: 0,
          isrRetenido: 0,
          ieps: 0,
          conceptosCount: 0,
          descripcionResumen: 'Error al abrir el archivo en el navegador',
          estado: 'error',
          mensajeError: 'Fallo de lectura de archivo',
        });
      };
      reader.readAsText(file, 'utf-8');
    });
  });

  return Promise.all(promesas);
}

/**
 * Calcula métricas y totales consolidados para un lote de facturas
 */
export function calcularResumenLote(facturas: FacturaCFDI[]): ResumenLoteXML {
  const resumen: ResumenLoteXML = {
    totalArchivos: facturas.length,
    totalValidos: 0,
    totalConError: 0,
    sumaSubtotal: 0,
    sumaDescuento: 0,
    sumaImpuestosTrasladados: 0,
    sumaImpuestosRetenidos: 0,
    sumaTotal: 0,
    sumaIVA16: 0,
    sumaIVARetenido: 0,
    sumaISRRetenido: 0,
    conteoIngresos: 0,
    conteoEgresos: 0,
    conteoNomina: 0,
    conteoOtros: 0,
  };

  for (const f of facturas) {
    if (f.estado === 'error') {
      resumen.totalConError += 1;
      continue;
    }

    resumen.totalValidos += 1;
    resumen.sumaSubtotal += f.subtotal;
    resumen.sumaDescuento += f.descuento;
    resumen.sumaImpuestosTrasladados += f.totalImpuestosTrasladados;
    resumen.sumaImpuestosRetenidos += f.totalImpuestosRetenidos;
    resumen.sumaTotal += f.total;
    resumen.sumaIVA16 += f.iva16;
    resumen.sumaIVARetenido += f.ivaRetenido;
    resumen.sumaISRRetenido += f.isrRetenido;

    switch (f.tipoComprobante) {
      case 'I':
        resumen.conteoIngresos += 1;
        break;
      case 'E':
        resumen.conteoEgresos += 1;
        break;
      case 'N':
        resumen.conteoNomina += 1;
        break;
      default:
        resumen.conteoOtros += 1;
        break;
    }
  }

  // Redondear a 2 decimales para evitar artefactos de punto flotante
  resumen.sumaSubtotal = Math.round(resumen.sumaSubtotal * 100) / 100;
  resumen.sumaDescuento = Math.round(resumen.sumaDescuento * 100) / 100;
  resumen.sumaImpuestosTrasladados = Math.round(resumen.sumaImpuestosTrasladados * 100) / 100;
  resumen.sumaImpuestosRetenidos = Math.round(resumen.sumaImpuestosRetenidos * 100) / 100;
  resumen.sumaTotal = Math.round(resumen.sumaTotal * 100) / 100;
  resumen.sumaIVA16 = Math.round(resumen.sumaIVA16 * 100) / 100;
  resumen.sumaIVARetenido = Math.round(resumen.sumaIVARetenido * 100) / 100;
  resumen.sumaISRRetenido = Math.round(resumen.sumaISRRetenido * 100) / 100;

  return resumen;
}

/**
 * Formateador de moneda en MXN estándar
 */
export function formatearMXN(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Ingestor de archivos XML, ZIP y Metadata TXT de SAT.
 * Utiliza JSZip para descompresión local y DOMParser por lotes.
 */

import JSZip from 'jszip';
import type {
  CFDIExtraido,
  SATMetadataItem,
  ClasificacionCFDI,
  TipoComprobante,
  ConceptoCFDI,
} from '../types';

export interface IngestResult {
  cfdis: CFDIExtraido[];
  metadata: SATMetadataItem[];
  duplicadosCount: number;
  errores: string[];
}

export type ProgresoCallback = (info: { procesados: number; total: number; etapa: string }) => void;

function getAttr(el: Element | null | undefined, ...names: string[]): string {
  if (!el) return '';
  for (const name of names) {
    if (el.hasAttribute(name)) return el.getAttribute(name) || '';
    const lower = name.toLowerCase();
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (attr && attr.name.toLowerCase() === lower) {
        return attr.value;
      }
    }
  }
  return '';
}

export function parsearXMLIndividual(
  xmlStr: string,
  rfcContribuyente: string
): CFDIExtraido | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'application/xml');

    if (doc.querySelector('parsererror')) {
      return null;
    }

    const comprobante = doc.documentElement;
    if (!comprobante || !comprobante.nodeName.includes('Comprobante')) {
      return null;
    }

    // Timbre Fiscal Digital
    const tfd =
      doc.getElementsByTagNameNS(
        'http://www.sat.gob.mx/TimbreFiscalDigital',
        'TimbreFiscalDigital'
      )[0] || doc.querySelector('[*|UUID], TimbreFiscalDigital, tfd\\:TimbreFiscalDigital');

    let uuid = getAttr(tfd, 'UUID', 'uuid');
    if (!uuid) {
      // Fallback regex
      const uuidMatch = xmlStr.match(/UUID="([a-fA-F0-9-]{36})"/i);
      uuid = uuidMatch && uuidMatch[1] ? uuidMatch[1] : '';
    }

    if (!uuid) return null;

    const fechaEmision = getAttr(comprobante, 'Fecha', 'fecha');
    const fechaTimbrado = getAttr(tfd, 'FechaTimbrado', 'fechaTimbrado') || fechaEmision;
    const serie = getAttr(comprobante, 'Serie', 'serie');
    const folio = getAttr(comprobante, 'Folio', 'folio');
    const total = parseFloat(getAttr(comprobante, 'Total', 'total')) || 0;
    const subtotal = parseFloat(getAttr(comprobante, 'SubTotal', 'subTotal', 'subtotal')) || 0;
    const descuento = parseFloat(getAttr(comprobante, 'Descuento', 'descuento')) || 0;
    const moneda = getAttr(comprobante, 'Moneda', 'moneda') || 'MXN';
    const tipoCambio = parseFloat(getAttr(comprobante, 'TipoCambio', 'tipoCambio')) || 1;
    const metodoPago = getAttr(comprobante, 'MetodoPago', 'metodoPago');
    const formaPago = getAttr(comprobante, 'FormaPago', 'formaPago');
    const tipoCompRaw = getAttr(comprobante, 'TipoDeComprobante', 'tipoDeComprobante') || 'I';
    const tipoComprobante = (
      ['I', 'E', 'N', 'P', 'T'].includes(tipoCompRaw.toUpperCase())
        ? tipoCompRaw.toUpperCase()
        : 'I'
    ) as TipoComprobante;

    // Emisor
    const emisor =
      doc.getElementsByTagName('cfdi:Emisor')[0] || doc.getElementsByTagName('Emisor')[0];
    const rfcEmisor = getAttr(emisor, 'Rfc', 'rfc').toUpperCase();
    const nombreEmisor = getAttr(emisor, 'Nombre', 'nombre');
    const regimenEmisor = getAttr(emisor, 'RegimenFiscal', 'regimenFiscal');

    // Receptor
    const receptor =
      doc.getElementsByTagName('cfdi:Receptor')[0] || doc.getElementsByTagName('Receptor')[0];
    const rfcReceptor = getAttr(receptor, 'Rfc', 'rfc').toUpperCase();
    const nombreReceptor = getAttr(receptor, 'Nombre', 'nombre');
    const regimenReceptor = getAttr(receptor, 'RegimenFiscalReceptor', 'regimenFiscal');
    const usoCFDI = getAttr(receptor, 'UsoCFDI', 'usoCFDI');

    // Clasificación
    const cleanRFC = rfcContribuyente.trim().toUpperCase();
    const clasificacion: ClasificacionCFDI = rfcEmisor === cleanRFC ? 'EMITIDO' : 'RECIBIDO';

    // Conceptos
    const conceptos: ConceptoCFDI[] = [];
    const conceptosNodes =
      doc.getElementsByTagName('cfdi:Concepto').length > 0
        ? doc.getElementsByTagName('cfdi:Concepto')
        : doc.getElementsByTagName('Concepto');

    for (let i = 0; i < conceptosNodes.length; i++) {
      const c = conceptosNodes[i];
      if (!c) continue;
      conceptos.push({
        claveProdServ: getAttr(c, 'ClaveProdServ', 'claveProdServ'),
        claveUnidad: getAttr(c, 'ClaveUnidad', 'claveUnidad'),
        descripcion: getAttr(c, 'Descripcion', 'descripcion'),
        cantidad: parseFloat(getAttr(c, 'Cantidad', 'cantidad')) || 1,
        valorUnitario: parseFloat(getAttr(c, 'ValorUnitario', 'valorUnitario')) || 0,
        importe: parseFloat(getAttr(c, 'Importe', 'importe')) || 0,
      });
    }

    // Impuestos
    const impuestos =
      doc.getElementsByTagName('cfdi:Impuestos')[0] || doc.getElementsByTagName('Impuestos')[0];
    const traslados =
      parseFloat(getAttr(impuestos, 'TotalImpuestosTrasladados', 'totalImpuestosTrasladados')) || 0;
    const retenciones =
      parseFloat(getAttr(impuestos, 'TotalImpuestosRetenidos', 'totalImpuestosRetenidos')) || 0;

    // Complementos
    const tieneNomina = xmlStr.includes('nomina12:Nomina') || xmlStr.includes('Nomina');
    const tienePago =
      xmlStr.includes('pago10:Pagos') ||
      xmlStr.includes('pago20:Pagos') ||
      xmlStr.includes('Pagos');
    const tieneCartaPorte =
      xmlStr.includes('cartaporte20:CartaPorte') ||
      xmlStr.includes('cartaporte30:CartaPorte') ||
      xmlStr.includes('CartaPorte');

    // CFDI Relacionados
    const cfdiRelacionados: { uuid: string; tipoRelacion: string }[] = [];
    const relGroupNodes =
      doc.getElementsByTagName('cfdi:CfdiRelacionados').length > 0
        ? doc.getElementsByTagName('cfdi:CfdiRelacionados')
        : doc.getElementsByTagName('CfdiRelacionados');

    for (let i = 0; i < relGroupNodes.length; i++) {
      const rg = relGroupNodes[i];
      if (!rg) continue;
      const tipoRelacion = getAttr(rg, 'TipoRelacion', 'tipoRelacion');
      const relNodes =
        rg.getElementsByTagName('cfdi:CfdiRelacionado').length > 0
          ? rg.getElementsByTagName('cfdi:CfdiRelacionado')
          : rg.getElementsByTagName('CfdiRelacionado');
      for (let j = 0; j < relNodes.length; j++) {
        const rEl = relNodes[j];
        if (!rEl) continue;
        const u = getAttr(rEl, 'UUID', 'uuid');
        if (u) cfdiRelacionados.push({ uuid: u, tipoRelacion });
      }
    }

    return {
      uuid: uuid.toUpperCase(),
      serie,
      folio,
      fechaEmision,
      fechaTimbrado,
      rfcEmisor,
      nombreEmisor: nombreEmisor || rfcEmisor,
      rfcReceptor,
      nombreReceptor: nombreReceptor || rfcReceptor,
      regimenEmisor,
      regimenReceptor,
      usoCFDI,
      metodoPago,
      formaPago,
      moneda,
      tipoCambio,
      subtotal,
      descuento,
      total,
      impuestosTrasladados: traslados,
      impuestosRetenidos: retenciones,
      tipoComprobante,
      clasificacion,
      conceptos,
      cfdiRelacionados,
      tieneNomina,
      tienePago,
      tieneCartaPorte,
    };
  } catch {
    return null;
  }
}

export function parsearMetadataTXT(contenidoTxt: string): SATMetadataItem[] {
  const lineas = contenidoTxt.split(/\r?\n/);
  const items: SATMetadataItem[] = [];

  for (const rawLinea of lineas) {
    const linea = rawLinea.trim();
    if (!linea) continue;

    const partes = linea.split('~');
    if (partes.length < 9) continue;

    const uuid = partes[0];
    const rfcEmisor = partes[1];
    const nombreEmisor = partes[2];
    const rfcReceptor = partes[3];
    const nombreReceptor = partes[4];
    const rfcPac = partes[5];
    const fechaEmision = partes[6];
    const fechaCertificacionSat = partes[7];
    const monto = partes[8];
    const efectoComprobante = partes[9];
    const estatus = partes[10];
    const fechaCancelacion = partes[11];

    if (!uuid || uuid.toLowerCase() === 'uuid' || !uuid.includes('-')) continue;

    items.push({
      uuid: uuid.trim().toUpperCase(),
      rfcEmisor: (rfcEmisor || '').trim().toUpperCase(),
      nombreEmisor: (nombreEmisor || '').trim(),
      rfcReceptor: (rfcReceptor || '').trim().toUpperCase(),
      nombreReceptor: (nombreReceptor || '').trim(),
      rfcPac: (rfcPac || '').trim(),
      fechaEmision: (fechaEmision || '').trim(),
      fechaCertificacionSat: (fechaCertificacionSat || '').trim(),
      monto: parseFloat(monto || '0') || 0,
      efectoComprobante: (efectoComprobante || 'I').trim(),
      estatus: estatus && estatus.trim() === '0' ? '0' : '1',
      fechaCancelacion: fechaCancelacion ? fechaCancelacion.trim() : undefined,
    });
  }

  return items;
}

export async function procesarArchivos(
  archivos: File[],
  rfcContribuyente: string,
  onProgreso?: ProgresoCallback
): Promise<IngestResult> {
  const cfdisMap = new Map<string, CFDIExtraido>();
  const metadataMap = new Map<string, SATMetadataItem>();
  const errores: string[] = [];
  let duplicadosCount = 0;

  // 1. Descomprimir zips y listar xmls/txt
  const listaProcesar: { nombre: string; contenido: string; tipo: 'xml' | 'txt' }[] = [];

  for (let idx = 0; idx < archivos.length; idx++) {
    const file = archivos[idx];
    if (!file) continue;

    if (onProgreso) {
      onProgreso({ procesados: idx + 1, total: archivos.length, etapa: `Leyendo ${file.name}` });
    }

    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        const entries = Object.keys(zip.files);
        for (const entryName of entries) {
          const entry = zip.files[entryName];
          if (!entry || entry.dir) continue;
          const lower = entryName.toLowerCase();
          if (lower.endsWith('.xml')) {
            const xmlStr = await entry.async('string');
            listaProcesar.push({ nombre: entryName, contenido: xmlStr, tipo: 'xml' });
          } else if (lower.endsWith('.txt')) {
            const txtStr = await entry.async('string');
            listaProcesar.push({ nombre: entryName, contenido: txtStr, tipo: 'txt' });
          }
        }
      } catch (err: unknown) {
        errores.push(`Error al descomprimir ${file.name}: ${(err as Error).message}`);
      }
    } else if (file.name.toLowerCase().endsWith('.xml')) {
      const xmlStr = await file.text();
      listaProcesar.push({ nombre: file.name, contenido: xmlStr, tipo: 'xml' });
    } else if (file.name.toLowerCase().endsWith('.txt')) {
      const txtStr = await file.text();
      listaProcesar.push({ nombre: file.name, contenido: txtStr, tipo: 'txt' });
    }
  }

  // 2. Parsear elementos
  const total = listaProcesar.length;
  for (let i = 0; i < total; i++) {
    const item = listaProcesar[i];
    if (!item) continue;

    if (onProgreso && (i % 50 === 0 || i === total - 1)) {
      onProgreso({
        procesados: i + 1,
        total,
        etapa: `Procesando comprobantes (${i + 1}/${total})`,
      });
    }

    if (item.tipo === 'xml') {
      const parsed = parsearXMLIndividual(item.contenido, rfcContribuyente);
      if (parsed) {
        if (cfdisMap.has(parsed.uuid)) {
          duplicadosCount++;
        } else {
          cfdisMap.set(parsed.uuid, parsed);
        }
      } else {
        errores.push(`No se pudo parsear el XML: ${item.nombre}`);
      }
    } else if (item.tipo === 'txt') {
      const itemsMeta = parsearMetadataTXT(item.contenido);
      for (const m of itemsMeta) {
        metadataMap.set(m.uuid, m);
      }
    }
  }

  // 3. Cruzar CFDIs con Metadata
  const cfdis = Array.from(cfdisMap.values()).map((cfdi) => {
    const meta = metadataMap.get(cfdi.uuid);
    if (meta) {
      return {
        ...cfdi,
        enMetadata: true,
        canceladoEnSAT: meta.estatus === '0',
        fechaCancelacionSAT: meta.fechaCancelacion,
        montoMetadata: meta.monto,
      };
    }
    return cfdi;
  });

  return {
    cfdis,
    metadata: Array.from(metadataMap.values()),
    duplicadosCount,
    errores,
  };
}

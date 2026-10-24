/**
 * ARK LEDGER — Herramienta #16: Motor de Conciliación Anexo 24
 * Parser de XMLs de Contabilidad Electrónica (Catálogo de Cuentas y Balanza de Comprobación)
 *
 * Conforme al Anexo 24 de la Resolución Miscelánea Fiscal (RMF):
 * - Catálogo de Cuentas (XSD CatalogoCuentas_1_3)
 * - Balanza de Comprobación (XSD BalanzaComprobacion_1_3)
 */

import type { CuentaAnexo24, CatalogoBalanzaAnexo24, TipoCuentaAnexo24 } from '../types';

/**
 * Decodifica entidades XML
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
 * Extrae atributos de una etiqueta XML mediante Regex (Browser / Node seguro)
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
      const sinNs = key.split(':')[1];
      if (sinNs) attrs[sinNs] = val;
    }
  }

  return attrs;
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
 * Busca un único tag en el XML
 */
function buscarTag(xml: string, tagName: string): Record<string, string> | null {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tagName}\\b([^>]*)/?>`, 'i');
  const match = xml.match(regex);
  if (!match || !match[1]) return null;
  return extraerAtributosTag(match[1]);
}

/**
 * Infiere el tipo de cuenta según el código agrupador del SAT
 */
export function inferirTipoCuenta(codAgrup: string): TipoCuentaAnexo24 {
  const primerDigito = codAgrup.charAt(0);
  switch (primerDigito) {
    case '1':
      return 'activo';
    case '2':
      return 'pasivo';
    case '3':
      return 'capital';
    case '4':
      return 'ingreso';
    case '5':
    case '6':
      return 'costo_gasto';
    case '7':
    case '8':
      return 'orden';
    default:
      return 'otro';
  }
}

/**
 * Catálogo SAT oficial estándar por defecto (utilizado si el despacho no sube un XML propio)
 */
export const CATALOGO_SAT_ESTANDAR: CuentaAnexo24[] = [
  // Activo
  {
    codigoAgrupador: '105',
    numCta: '105-00-000',
    descripcion: 'Clientes',
    nivel: 1,
    naturaleza: 'D',
    tipo: 'activo',
  },
  {
    codigoAgrupador: '105.01',
    numCta: '105-01-000',
    descripcion: 'Clientes nacionales',
    subCtaDe: '105-00-000',
    nivel: 2,
    naturaleza: 'D',
    tipo: 'activo',
  },
  {
    codigoAgrupador: '105.02',
    numCta: '105-02-000',
    descripcion: 'Clientes extranjeros',
    subCtaDe: '105-00-000',
    nivel: 2,
    naturaleza: 'D',
    tipo: 'activo',
  },
  {
    codigoAgrupador: '113.01',
    numCta: '113-01-000',
    descripcion: 'Impuestos retenidos a favor (ISR)',
    nivel: 2,
    naturaleza: 'D',
    tipo: 'activo',
  },
  {
    codigoAgrupador: '113.02',
    numCta: '113-02-000',
    descripcion: 'Impuestos retenidos a favor (IVA)',
    nivel: 2,
    naturaleza: 'D',
    tipo: 'activo',
  },
  // Pasivo
  {
    codigoAgrupador: '208',
    numCta: '208-00-000',
    descripcion: 'Impuestos trasladados cobrados',
    nivel: 1,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  {
    codigoAgrupador: '208.01',
    numCta: '208-01-000',
    descripcion: 'IVA trasladado cobrado tasa general 16%',
    subCtaDe: '208-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  {
    codigoAgrupador: '208.02',
    numCta: '208-02-000',
    descripcion: 'IVA trasladado cobrado tasa frontera 8%',
    subCtaDe: '208-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  {
    codigoAgrupador: '209',
    numCta: '209-00-000',
    descripcion: 'Impuestos trasladados no cobrados (PPD)',
    nivel: 1,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  {
    codigoAgrupador: '209.01',
    numCta: '209-01-000',
    descripcion: 'IVA trasladado no cobrado tasa general 16%',
    subCtaDe: '209-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  {
    codigoAgrupador: '209.02',
    numCta: '209-02-000',
    descripcion: 'IVA trasladado no cobrado tasa frontera 8%',
    subCtaDe: '209-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  {
    codigoAgrupador: '216.01',
    numCta: '216-01-000',
    descripcion: 'Impuestos retenidos de ISR',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  {
    codigoAgrupador: '216.02',
    numCta: '216-02-000',
    descripcion: 'Impuestos retenidos de IVA',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'pasivo',
  },
  // Ingresos
  {
    codigoAgrupador: '401',
    numCta: '401-00-000',
    descripcion: 'Ingresos por ventas y/o servicios',
    nivel: 1,
    naturaleza: 'A',
    tipo: 'ingreso',
  },
  {
    codigoAgrupador: '401.01',
    numCta: '401-01-000',
    descripcion: 'Ventas y/o servicios gravados a la tasa general (16%)',
    subCtaDe: '401-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'ingreso',
  },
  {
    codigoAgrupador: '401.02',
    numCta: '401-02-000',
    descripcion: 'Ventas y/o servicios gravados a la tasa frontera (8%)',
    subCtaDe: '401-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'ingreso',
  },
  {
    codigoAgrupador: '401.03',
    numCta: '401-03-000',
    descripcion: 'Ventas y/o servicios gravados a la tasa 0%',
    subCtaDe: '401-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'ingreso',
  },
  {
    codigoAgrupador: '401.04',
    numCta: '401-04-000',
    descripcion: 'Ventas y/o servicios gravados a tasa exenta',
    subCtaDe: '401-00-000',
    nivel: 2,
    naturaleza: 'A',
    tipo: 'ingreso',
  },
  {
    codigoAgrupador: '402.01',
    numCta: '402-01-000',
    descripcion: 'Devoluciones, descuentos o bonificaciones sobre ventas (16%)',
    nivel: 2,
    naturaleza: 'D',
    tipo: 'ingreso',
  },
];

/**
 * Genera una instancia con el catálogo estándar pre-cargado
 */
export function obtenerCatalogoEstandarSAT(rfc: string = 'XAXX010101000'): CatalogoBalanzaAnexo24 {
  const cuentasPorCodAgrup = new Map<string, CuentaAnexo24>();
  const cuentasPorNumCta = new Map<string, CuentaAnexo24>();

  for (const c of CATALOGO_SAT_ESTANDAR) {
    cuentasPorCodAgrup.set(c.codigoAgrupador, c);
    cuentasPorNumCta.set(c.numCta, c);
  }

  return {
    rfc,
    mes: '03',
    anio: 2026,
    tipoEnvio: 'N',
    cuentas: [...CATALOGO_SAT_ESTANDAR],
    cuentasPorCodAgrup,
    cuentasPorNumCta,
  };
}

/**
 * Parsea un XML de Anexo 24 (Catálogo de Cuentas o Balanza de Comprobación)
 */
export function parsearXMLAnexo24(
  xmlContent: string,
  catalogoExistente?: CatalogoBalanzaAnexo24 | null
): CatalogoBalanzaAnexo24 {
  if (!xmlContent || !xmlContent.trim()) {
    return catalogoExistente || obtenerCatalogoEstandarSAT();
  }

  // 1. Identificar si es Catálogo o Balanza
  const tagCatalogo = buscarTag(xmlContent, 'Catalogo');
  const tagBalanza = buscarTag(xmlContent, 'Balanza');

  const cuentasPorCodAgrup = catalogoExistente
    ? new Map(catalogoExistente.cuentasPorCodAgrup)
    : new Map<string, CuentaAnexo24>();
  const cuentasPorNumCta = catalogoExistente
    ? new Map(catalogoExistente.cuentasPorNumCta)
    : new Map<string, CuentaAnexo24>();

  const rfc =
    tagCatalogo?.['rfc'] ||
    tagBalanza?.['rfc'] ||
    catalogoExistente?.rfc ||
    'RFC-CONTABILIDAD-ELECTRONICA';
  const mes = tagCatalogo?.['mes'] || tagBalanza?.['mes'] || catalogoExistente?.mes || '01';
  const anio = parseInt(
    tagCatalogo?.['anio'] || String(tagBalanza?.['anio'] || catalogoExistente?.anio || 2026),
    10
  );
  const tipoEnvio = tagBalanza?.['tipoenvio'] || catalogoExistente?.tipoEnvio || 'N';

  const tagsCtas = buscarTags(xmlContent, 'Ctas');

  for (const t of tagsCtas) {
    const numCta = (t['numcta'] || '').trim();
    if (!numCta) continue;

    // Campos de Catálogo
    const codAgrup = (t['codagrup'] || '').trim();
    const desc = (t['desc'] || '').trim();
    const subCtaDe = t['subctade'] ? t['subctade'].trim() : undefined;
    const nivel = parseInt(t['nivel'] || '1', 10) || 1;
    const rawNat = (t['naturaleza'] || 'D').toUpperCase();
    const naturaleza: 'D' | 'A' = rawNat === 'A' ? 'A' : 'D';

    // Campos de Balanza
    const saldoIni = parseFloat(t['saldoini'] || '0') || 0;
    const debe = parseFloat(t['debe'] || '0') || 0;
    const haber = parseFloat(t['haber'] || '0') || 0;
    const saldoFin = parseFloat(t['saldofin'] || '0') || 0;

    // Si ya existe la cuenta por NumCta, actualizar con nuevos datos
    const existente = cuentasPorNumCta.get(numCta);

    const cuentaFinal: CuentaAnexo24 = {
      codigoAgrupador: codAgrup || existente?.codigoAgrupador || 'SIN-CODIGO',
      numCta,
      descripcion: desc || existente?.descripcion || `Cuenta ${numCta}`,
      subCtaDe: subCtaDe || existente?.subCtaDe,
      nivel: codAgrup ? nivel : existente?.nivel || 1,
      naturaleza: codAgrup ? naturaleza : existente?.naturaleza || 'D',
      saldoInicial: tagBalanza ? saldoIni : (existente?.saldoInicial ?? 0),
      debe: tagBalanza ? debe : (existente?.debe ?? 0),
      haber: tagBalanza ? haber : (existente?.haber ?? 0),
      saldoFinal: tagBalanza ? saldoFin : (existente?.saldoFinal ?? 0),
      tipo: inferirTipoCuenta(codAgrup || existente?.codigoAgrupador || ''),
    };

    cuentasPorNumCta.set(numCta, cuentaFinal);
    if (cuentaFinal.codigoAgrupador && cuentaFinal.codigoAgrupador !== 'SIN-CODIGO') {
      cuentasPorCodAgrup.set(cuentaFinal.codigoAgrupador, cuentaFinal);
    }
  }

  // Asegurar que las cuentas estándar básicas de conciliación existan si no vinieron en el XML
  for (const def of CATALOGO_SAT_ESTANDAR) {
    if (!cuentasPorCodAgrup.has(def.codigoAgrupador)) {
      cuentasPorCodAgrup.set(def.codigoAgrupador, def);
    }
    if (!cuentasPorNumCta.has(def.numCta)) {
      cuentasPorNumCta.set(def.numCta, def);
    }
  }

  const cuentas = Array.from(cuentasPorNumCta.values());

  return {
    rfc,
    mes,
    anio,
    tipoEnvio,
    cuentas,
    cuentasPorCodAgrup,
    cuentasPorNumCta,
  };
}

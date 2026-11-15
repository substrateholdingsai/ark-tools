import { describe, it, expect } from 'vitest';
import { validarCFDI, calcularResumenAuditoria } from './validadorCFDI';
import { generarCSVDictamenes } from './exportarDictamen';
import { AVISO_ALCANCE_DICTAMEN } from '../types';

// CFDI 4.0 Válido y Perfecto
const XML_CFDI_VALIDO = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  Version="4.0" Serie="A" Folio="100" Fecha="2026-04-01T10:00:00"
  FormaPago="03" MetodoPago="PUE" LugarExpedicion="06600" Exportacion="01"
  Moneda="MXN" TipoCambio="1" SubTotal="10000.00" Descuento="0.00" Total="11600.00"
  TipoDeComprobante="I" NoCertificado="00001000000500000000" Sello="ABCDEF123456">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="ESCUELA KEMPER URGATE" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="URE180429CE4" Nombre="UNIVERSIDAD ROBOTICA DE EXCELENCIA"
    DomicilioFiscalReceptor="06600" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="80141600" Cantidad="1" ClaveUnidad="E48" Descripcion="Cursos de capacitación" ValorUnitario="10000.00" Importe="10000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="1600.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="10000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="1600.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
      UUID="9B7C3E14-45D2-482F-8CE9-039A5D6B10E1"
      SelloCFD="CFD_SELLO_PRUEBA" SelloSAT="SAT_SELLO_PRUEBA"
      FechaTimbrado="2026-04-01T10:01:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

// CFDI con Discrepancia Aritmética (Total no cuadra: declara $15,000 en vez de $11,600)
const XML_DISCREPANCIA_ARITMETICA = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  Version="4.0" SubTotal="10000.00" Total="15000.00" TipoDeComprobante="I" Moneda="MXN" Exportacion="01">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="PRUEBA"/>
  <cfdi:Receptor Rfc="URE180429CE4" Nombre="CLIENTE" DomicilioFiscalReceptor="06600" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Impuestos TotalImpuestosTrasladados="1600.00"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE" SelloCFD="S1" SelloSAT="S2"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

// CFDI sin Timbre Fiscal Digital (Sin UUID)
const XML_SIN_TIMBRE = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante Version="4.0" SubTotal="100.00" Total="116.00" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="EKU9003173C9"/>
  <cfdi:Receptor Rfc="URE180429CE4"/>
</cfdi:Comprobante>`;

// CFDI 4.0 al que le falta Domicilio Fiscal Receptor (CP) y Régimen
const XML_CFDI_FALTA_DATOS_40 = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  Version="4.0" SubTotal="1000.00" Total="1160.00" TipoDeComprobante="I" Moneda="MXN" FormaPago="01" MetodoPago="PUE">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="EMISOR" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="XAXX010101000" Nombre="PUBLICO GENERAL" UsoCFDI="S01"/>
  <cfdi:Impuestos TotalImpuestosTrasladados="160.00"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="11111111-2222-3333-4444-555555555555" SelloCFD="S1" SelloSAT="S2"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

// CFDI con Inconsistencia PPD / Forma de Pago (PPD con Forma 03 en vez de 99)
const XML_PPD_INCONSISTENTE = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  Version="4.0" SubTotal="5000.00" Total="5800.00" TipoDeComprobante="I" Moneda="MXN"
  MetodoPago="PPD" FormaPago="03" Exportacion="01">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="EMISOR" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="URE180429CE4" Nombre="CLIENTE" DomicilioFiscalReceptor="06600" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Impuestos TotalImpuestosTrasladados="800.00"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="22222222-3333-4444-5555-666666666666" SelloCFD="S1" SelloSAT="S2"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

const XML_GOLDEN_PREVIEW = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Version="4.0" Serie="A" Folio="101" Fecha="2026-10-15T12:00:00" SubTotal="10000.00" Total="11600.00" Moneda="MXN" TipoDeComprobante="I" MetodoPago="PUE" FormaPago="03" LugarExpedicion="97000" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital">
  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="EMPRESA DEMO SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="XAXX010101000" Nombre="PUBLICO EN GENERAL" UsoCFDI="S01" DomicilioFiscalReceptor="97000" RegimenFiscalReceptor="616"/>
  <cfdi:Conceptos><cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="E48" Descripcion="Servicios contables" ValorUnitario="10000.00" Importe="10000.00" ObjetoImp="02"/></cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="1600.00"><cfdi:Traslados><cfdi:Traslado Base="10000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="1600.00"/></cfdi:Traslados></cfdi:Impuestos>
  <cfdi:Complemento><tfd:TimbreFiscalDigital Version="1.1" UUID="11111111-2222-3333-4444-555555555555" FechaTimbrado="2026-10-15T12:01:00"/></cfdi:Complemento>
</cfdi:Comprobante>`;

describe('Motor de Auditoría CFDI (validadorCFDI)', () => {
  it('debe aprobar con calificación perfecta un CFDI 4.0 sin errores', () => {
    const dictamen = validarCFDI(XML_CFDI_VALIDO, 'factura-valida.xml');

    expect(dictamen.estatusGeneral).toBe('aprobado');
    expect(dictamen.score).toBe(100);
    expect(dictamen.erroresCount).toBe(0);
    expect(dictamen.uuid).toBe('9B7C3E14-45D2-482F-8CE9-039A5D6B10E1');
    expect(dictamen.rfcEmisor).toBe('EKU9003173C9');
    expect(dictamen.rfcReceptor).toBe('URE180429CE4');
  });

  it('debe rechazar un CFDI con discrepancia aritmética grave', () => {
    const dictamen = validarCFDI(XML_DISCREPANCIA_ARITMETICA, 'error-suma.xml');

    expect(dictamen.estatusGeneral).toBe('rechazado');
    expect(dictamen.erroresCount).toBeGreaterThanOrEqual(1);
    const reglaAritmetica = dictamen.reglas.find((r) => r.codigo === 'ARIT-01');
    expect(reglaAritmetica?.severidad).toBe('error');
    expect(reglaAritmetica?.descripcion).toContain('difiere');
  });

  it('debe rechazar comprobantes sin Timbre Fiscal Digital (sin UUID)', () => {
    const dictamen = validarCFDI(XML_SIN_TIMBRE, 'sin-tfd.xml');

    expect(dictamen.estatusGeneral).toBe('rechazado');
    const reglaTimbre = dictamen.reglas.find((r) => r.codigo === 'TIMB-01');
    expect(reglaTimbre?.severidad).toBe('error');
  });

  it('debe detectar omisión de Domicilio Fiscal y Régimen Receptor en CFDI 4.0', () => {
    const dictamen = validarCFDI(XML_CFDI_FALTA_DATOS_40, 'datos-incompletos.xml');

    expect(dictamen.estatusGeneral).toBe('rechazado');
    const reglaCP = dictamen.reglas.find((r) => r.codigo === 'FISC-03');
    const reglaRegimen = dictamen.reglas.find((r) => r.codigo === 'FISC-04');
    expect(reglaCP?.severidad).toBe('error');
    expect(reglaRegimen?.severidad).toBe('error');
  });

  it('debe alertar sobre inconsistencia PPD con forma de pago distinta de 99', () => {
    const dictamen = validarCFDI(XML_PPD_INCONSISTENTE, 'ppd-forma.xml');

    const reglaPago = dictamen.reglas.find((r) => r.codigo === 'FISC-07');
    expect(reglaPago?.severidad).toBe('advertencia');
    expect(reglaPago?.descripcion).toContain('PPD');
  });

  it('debe rechazar inmediatamente archivos que no sean XML de CFDI', () => {
    const dictamen = validarCFDI('<html>Not XML</html>', 'invalido.txt');

    expect(dictamen.estatusGeneral).toBe('rechazado');
    expect(dictamen.score).toBe(0);
    expect(dictamen.uuid).toBe('SIN UUID');
  });

  it('debe calcular estadísticas correctas de un lote auditado', () => {
    const d1 = validarCFDI(XML_CFDI_VALIDO, 'd1.xml');
    const d2 = validarCFDI(XML_PPD_INCONSISTENTE, 'd2.xml');
    const d3 = validarCFDI(XML_DISCREPANCIA_ARITMETICA, 'd3.xml');

    const resumen = calcularResumenAuditoria([d1, d2, d3]);

    expect(resumen.totalAnalizados).toBe(3);
    expect(resumen.aprobados).toBe(1);
    expect(resumen.conAdvertencias).toBe(1);
    expect(resumen.rechazados).toBe(1);
    expect(resumen.promedioScore).toBeGreaterThan(0);
  });

  it('conserva el resultado del vector dorado de Preview y su aviso de alcance', () => {
    const dictamen = validarCFDI(XML_GOLDEN_PREVIEW, 'cfdi-validacion-preview.xml');

    expect(dictamen.score).toBe(70);
    expect(dictamen.estatusGeneral).toBe('advertencia');
    expect(dictamen.erroresCount).toBe(0);
    expect(dictamen.advertenciasCount).toBe(3);
    expect(dictamen.exitosCount).toBe(9);
    expect(dictamen.reglas).toHaveLength(12);
    expect(dictamen.avisoAlcance).toBe(AVISO_ALCANCE_DICTAMEN);
  });

  it('detecta una mutación del Total que rompe la cuadratura', () => {
    const xml = XML_GOLDEN_PREVIEW.replace('Total="11600.00"', 'Total="11000.00"');
    const dictamen = validarCFDI(xml);
    const regla = dictamen.reglas.find((r) => r.codigo === 'ARIT-01');

    expect(regla?.severidad).toBe('error');
    expect(regla?.descripcion).toContain('difiere');
  });

  it('mantiene los avisos de PPD/Forma de Pago y versión CFDI 3.3', () => {
    const xmlPpd = XML_GOLDEN_PREVIEW.replace('MetodoPago="PUE"', 'MetodoPago="PPD"');
    const xmlV33 = XML_GOLDEN_PREVIEW.replace('Version="4.0"', 'Version="3.3"');
    const dictamenPpd = validarCFDI(xmlPpd);
    const dictamenV33 = validarCFDI(xmlV33);

    expect(dictamenPpd.reglas.find((r) => r.codigo === 'FISC-07')?.severidad).toBe('advertencia');
    expect(dictamenV33.reglas.find((r) => r.codigo === 'VIG-01')?.severidad).toBe('advertencia');
  });

  it('advierte RFC de Emisor con formato inválido', () => {
    const xml = XML_GOLDEN_PREVIEW.replace('Rfc="AAA010101AAA"', 'Rfc="AAA010101AA"');
    const dictamen = validarCFDI(xml);
    const regla = dictamen.reglas.find((r) => r.codigo === 'FISC-01');

    expect(regla?.severidad).toBe('advertencia');
  });

  it('limpia las advertencias del vector al añadir Exportacion y atributos de sello/certificado', () => {
    const xml = XML_GOLDEN_PREVIEW.replace(
      'Folio="101"',
      'Folio="101" Exportacion="01" NoCertificado="00001000000500000000"'
    ).replace(
      'FechaTimbrado="2026-10-15T12:01:00"',
      'FechaTimbrado="2026-10-15T12:01:00" SelloCFD="S1" SelloSAT="S2"'
    );
    const dictamen = validarCFDI(xml);

    expect(dictamen.score).toBe(100);
    expect(dictamen.estatusGeneral).toBe('aprobado');
    expect(dictamen.erroresCount).toBe(0);
    expect(dictamen.advertenciasCount).toBe(0);

    const xmlError = xml.replace('Total="11600.00"', 'Total="11000.00"');
    const xmlErrorYAdvertencia = xmlError.replace(' Exportacion="01"', '');
    expect(validarCFDI(xmlError).score).toBe(50);
    expect(validarCFDI(xmlErrorYAdvertencia).score).toBe(60);
  });

  it.each([
    ['11601.00', 'exito'],
    ['11601.01', 'error'],
  ])('mantiene la tolerancia de ARIT-01 para Total %s', (total, severidad) => {
    const xml = XML_GOLDEN_PREVIEW.replace('Total="11600.00"', `Total="${total}"`);
    const dictamen = validarCFDI(xml);
    const regla = dictamen.reglas.find((r) => r.codigo === 'ARIT-01');

    expect(regla?.severidad).toBe(severidad);
    expect(regla?.descripcion).toContain('no es un criterio oficial del SAT');
  });

  it('detecta inconsistencia entre Base, TasaOCuota e Importe por traslado', () => {
    const xmlInconsistente = XML_GOLDEN_PREVIEW.replace(
      'TasaOCuota="0.160000"',
      'TasaOCuota="0.080000"'
    );
    const xmlConsistente = xmlInconsistente.replace('Importe="1600.00"', 'Importe="800.00"');

    const dictamenInconsistente = validarCFDI(xmlInconsistente);
    const dictamenConsistente = validarCFDI(xmlConsistente);

    expect(dictamenInconsistente.reglas.find((r) => r.codigo === 'ARIT-01')?.severidad).toBe(
      'error'
    );
    expect(dictamenInconsistente.reglas.find((r) => r.codigo === 'ARIT-01')?.descripcion).toContain(
      'TasaOCuota 0.08'
    );
    expect(dictamenConsistente.reglas.find((r) => r.codigo === 'ARIT-01')?.severidad).toBe('exito');
  });

  it.each([
    ['raíz sin cierre', XML_GOLDEN_PREVIEW.replace('</cfdi:Comprobante>', '')],
    [
      'documento truncado',
      XML_GOLDEN_PREVIEW.slice(0, XML_GOLDEN_PREVIEW.indexOf('</cfdi:Impuestos>')),
    ],
  ])('rechaza XML mal formado (%s)', (_caso, xml) => {
    const dictamen = validarCFDI(xml);
    const reglaEstructura = dictamen.reglas.find((r) => r.codigo === 'ESTR-01');

    expect(dictamen.estatusGeneral).toBe('rechazado');
    expect(dictamen.score).toBe(0);
    expect(reglaEstructura?.severidad).toBe('error');
    expect(reglaEstructura?.descripcion).toContain('XML mal formado');
  });

  it('rechaza una entrada vacía sin lanzar una excepción', () => {
    const dictamen = validarCFDI('');

    expect(dictamen.estatusGeneral).toBe('rechazado');
    expect(dictamen.score).toBe(0);
    expect(dictamen.reglas[0]?.codigo).toBe('ESTR-01');
    expect(dictamen.reglas[0]?.severidad).toBe('error');
  });

  it('exporta todas las reglas y los avisos en el CSV BOM UTF-8', () => {
    const dictamen = validarCFDI(XML_GOLDEN_PREVIEW, 'cfdi-validacion-preview.xml');
    const csv = generarCSVDictamenes([dictamen]);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(AVISO_ALCANCE_DICTAMEN);
    expect(csv).not.toMatch(/SHA-256|QR|PDF/i);
    for (const regla of dictamen.reglas) {
      expect(csv).toContain(`${regla.codigo} (${regla.categoria})`);
      expect(csv).toContain(`[${regla.severidad.toUpperCase()}]`);
    }
    expect(csv).toContain('TIMB-03 (timbre)');
    expect(csv).toContain('FISC-07 (fiscal)');
    expect(csv).toContain('ARIT-01 (aritmetica)');
  });
});

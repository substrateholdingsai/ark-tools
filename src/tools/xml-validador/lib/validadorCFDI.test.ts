import { describe, it, expect } from 'vitest';
import { validarCFDI, calcularResumenAuditoria } from './validadorCFDI';

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
});

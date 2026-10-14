import { describe, it, expect } from 'vitest';
import { parsearCFDI, calcularResumenLote, formatearMXN } from './parserCFDI';
import { generarCSVFacturas } from './exportarExcel';

// XML Mock: Factura CFDI 4.0 de Ingreso
const XML_CFDI_INGRESO_40 = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  Version="4.0" Serie="F" Folio="1042" Fecha="2026-03-15T10:30:00"
  FormaPago="03" MetodoPago="PUE" LugarExpedicion="06600"
  Moneda="MXN" TipoCambio="1" SubTotal="10000.00" Descuento="500.00" Total="11020.00"
  TipoDeComprobante="I">
  <cfdi:Emisor Rfc="EKU9003173C9" Nombre="ESCUELA KEMPER URGATE" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="XAXX010101000" Nombre="PUBLICO EN GENERAL &amp; ASOCIADOS" RegimenFiscalReceptor="616" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="80141600" Cantidad="1" ClaveUnidad="E48" Descripcion="Servicios de consultoría contable" ValorUnitario="10000.00" Importe="10000.00" Descuento="500.00">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="9500.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="1520.00"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="1520.00">
    <cfdi:Traslados>
      <cfdi:Traslado Base="9500.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="1520.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
      UUID="4D4A47E8-5EE5-4D5C-B28F-09D8369C95BA"
      FechaTimbrado="2026-03-15T10:32:00"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

// XML Mock: Factura con Retenciones (ISR e IVA) y múltiples conceptos
const XML_CFDI_RETENCIONES = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  Version="4.0" Serie="HON" Folio="25" Fecha="2026-03-16T12:00:00"
  FormaPago="01" MetodoPago="PUE" LugarExpedicion="64000"
  Moneda="MXN" SubTotal="20000.00" Descuento="0.00" Total="21066.66"
  TipoDeComprobante="I">
  <cfdi:Emisor Rfc="HEGR800101XYZ" Nombre="ROBERTO HERNANDEZ" RegimenFiscal="612"/>
  <cfdi:Receptor Rfc="EMPR101010ABC" Nombre="EMPRESA GRANDE SA DE CV" RegimenFiscalReceptor="601" UsoCFDI="G03"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111500" Cantidad="1" ClaveUnidad="E48" Descripcion="Auditoría fiscal de estados financieros" ValorUnitario="20000.00" Importe="20000.00"/>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="3200.00" TotalImpuestosRetenidos="2133.34">
    <cfdi:Retenciones>
      <cfdi:Retencion Impuesto="002" Importe="2133.34"/>
      <cfdi:Retencion Impuesto="001" Importe="2000.00"/>
    </cfdi:Retenciones>
    <cfdi:Traslados>
      <cfdi:Traslado Base="20000.00" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="3200.00"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

// XML Mock: CFDI Nómina
const XML_CFDI_NOMINA = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  Version="4.0" Serie="NOM" Folio="500" Fecha="2026-03-31T08:00:00"
  SubTotal="15000.00" Total="13200.00" TipoDeComprobante="N" Moneda="MXN">
  <cfdi:Emisor Rfc="PATR900101111" Nombre="PATRON SA DE CV" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="TRAB920202222" Nombre="JUAN PEREZ" RegimenFiscalReceptor="605" UsoCFDI="CN01"/>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="11111111-2222-3333-4444-555555555555"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

// XML Mock: CFDI Inválido (sin comprobante)
const XML_INVALIDO = `<html><body>Not a CFDI</body></html>`;

// XML Mock: Sin UUID / Timbre
const XML_SIN_TIMBRE = `<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante Version="4.0" SubTotal="100.00" Total="116.00" TipoDeComprobante="I">
  <cfdi:Emisor Rfc="AAA010101AAA" Nombre="PRUEBA"/>
  <cfdi:Receptor Rfc="BBB010101BBB" Nombre="CLIENTE"/>
</cfdi:Comprobante>`;

describe('Parser CFDI 4.0 / 3.3', () => {
  it('debe parsear correctamente una factura CFDI 4.0 de ingreso', () => {
    const factura = parsearCFDI(XML_CFDI_INGRESO_40, 'factura-001.xml');

    expect(factura.estado).toBe('valido');
    expect(factura.fileName).toBe('factura-001.xml');
    expect(factura.version).toBe('4.0');
    expect(factura.uuid).toBe('4D4A47E8-5EE5-4D5C-B28F-09D8369C95BA');
    expect(factura.serie).toBe('F');
    expect(factura.folio).toBe('1042');
    expect(factura.fecha).toBe('2026-03-15T10:30:00');
    expect(factura.tipoComprobante).toBe('I');
    expect(factura.subtotal).toBe(10000);
    expect(factura.descuento).toBe(500);
    expect(factura.total).toBe(11020);
    expect(factura.rfcEmisor).toBe('EKU9003173C9');
    expect(factura.nombreEmisor).toBe('ESCUELA KEMPER URGATE');
    expect(factura.rfcReceptor).toBe('XAXX010101000');
    expect(factura.nombreReceptor).toBe('PUBLICO EN GENERAL & ASOCIADOS');
    expect(factura.iva16).toBe(1520);
    expect(factura.conceptosCount).toBe(1);
    expect(factura.descripcionResumen).toContain('consultoría contable');
  });

  it('debe parsear retenciones de IVA e ISR y traslados correctamente', () => {
    const factura = parsearCFDI(XML_CFDI_RETENCIONES, 'honorarios.xml');

    expect(factura.estado).toBe('valido');
    expect(factura.uuid).toBe('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE');
    expect(factura.subtotal).toBe(20000);
    expect(factura.iva16).toBe(3200);
    expect(factura.ivaRetenido).toBe(2133.34);
    expect(factura.isrRetenido).toBe(2000);
    expect(factura.totalImpuestosRetenidos).toBe(2133.34);
    expect(factura.rfcEmisor).toBe('HEGR800101XYZ');
    expect(factura.rfcReceptor).toBe('EMPR101010ABC');
  });

  it('debe identificar comprobantes de Nómina (tipo N)', () => {
    const factura = parsearCFDI(XML_CFDI_NOMINA, 'recibo-nomina.xml');

    expect(factura.estado).toBe('valido');
    expect(factura.tipoComprobante).toBe('N');
    expect(factura.tipoComprobanteDesc).toBe('Nómina');
    expect(factura.subtotal).toBe(15000);
    expect(factura.total).toBe(13200);
  });

  it('debe marcar error cuando el XML no contiene nodo Comprobante', () => {
    const factura = parsearCFDI(XML_INVALIDO, 'invalido.xml');

    expect(factura.estado).toBe('error');
    expect(factura.mensajeError).toBeDefined();
    expect(factura.uuid).toBe('SIN UUID');
  });

  it('debe marcar advertencia si el comprobante no tiene timbre fiscal (sin UUID)', () => {
    const factura = parsearCFDI(XML_SIN_TIMBRE, 'sin-timbre.xml');

    expect(factura.estado).toBe('advertencia');
    expect(factura.uuid).toBe('SIN UUID');
    expect(factura.total).toBe(116);
  });
});

describe('Cálculo de Resumen de Lote', () => {
  it('debe consolidar totales y conteos de múltiples facturas', () => {
    const f1 = parsearCFDI(XML_CFDI_INGRESO_40, 'f1.xml');
    const f2 = parsearCFDI(XML_CFDI_RETENCIONES, 'f2.xml');
    const f3 = parsearCFDI(XML_CFDI_NOMINA, 'f3.xml');
    const f4 = parsearCFDI(XML_INVALIDO, 'f4.xml');

    const resumen = calcularResumenLote([f1, f2, f3, f4]);

    expect(resumen.totalArchivos).toBe(4);
    expect(resumen.totalValidos).toBe(3);
    expect(resumen.totalConError).toBe(1);
    expect(resumen.conteoIngresos).toBe(2);
    expect(resumen.conteoNomina).toBe(1);
    expect(resumen.sumaSubtotal).toBe(10000 + 20000 + 15000);
    expect(resumen.sumaDescuento).toBe(500);
    expect(resumen.sumaTotal).toBe(11020 + 21066.66 + 13200);
  });
});

describe('Exportación CSV para Excel', () => {
  it('debe incluir BOM UTF-8 y encabezados correctos', () => {
    const f1 = parsearCFDI(XML_CFDI_INGRESO_40, 'f1.xml');
    const csv = generarCSVFacturas([f1]);

    // Verificar BOM UTF-8
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    // Verificar encabezados
    expect(csv).toContain('UUID / Folio Fiscal');
    expect(csv).toContain('RFC Emisor');
    expect(csv).toContain('RFC Receptor');
    // Verificar datos
    expect(csv).toContain('4D4A47E8-5EE5-4D5C-B28F-09D8369C95BA');
    expect(csv).toContain('EKU9003173C9');
    // Verificar fila de totales
    expect(csv).toContain('TOTALES CONSOLIDADOS');
  });

  it('formatea moneda correctamente', () => {
    expect(formatearMXN(1234.5)).toContain('1,234.50');
  });
});

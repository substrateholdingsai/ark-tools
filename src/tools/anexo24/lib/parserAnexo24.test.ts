import { describe, it, expect } from 'vitest';
import { parsearXMLAnexo24, obtenerCatalogoEstandarSAT, inferirTipoCuenta } from './parserAnexo24';

describe('parserAnexo24', () => {
  it('genera catálogo estándar SAT con códigos clave de ingresos y traslados', () => {
    const catalogo = obtenerCatalogoEstandarSAT();
    expect(catalogo.cuentas.length).toBeGreaterThan(10);
    expect(catalogo.cuentasPorCodAgrup.has('401.01')).toBe(true);
    expect(catalogo.cuentasPorCodAgrup.has('208.01')).toBe(true);
    expect(catalogo.cuentasPorCodAgrup.has('105.01')).toBe(true);
  });

  it('clasifica los tipos de cuenta según el código agrupador', () => {
    expect(inferirTipoCuenta('105.01')).toBe('activo');
    expect(inferirTipoCuenta('208.01')).toBe('pasivo');
    expect(inferirTipoCuenta('301.01')).toBe('capital');
    expect(inferirTipoCuenta('401.01')).toBe('ingreso');
    expect(inferirTipoCuenta('501.01')).toBe('costo_gasto');
    expect(inferirTipoCuenta('601.01')).toBe('costo_gasto');
  });

  it('parsea un XML de Catálogo de Cuentas Anexo 24 del SAT', () => {
    const xmlCatalogo = `<?xml version="1.0" encoding="UTF-8"?>
<catalogocuentas:Catalogo xmlns:catalogocuentas="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas"
  Version="1.3" RFC="ABC120315XYZ" Mes="03" Anio="2026">
  <catalogocuentas:Ctas CodAgrup="105.01" NumCta="1105-01-001" Desc="Clientes Locales Monterrey" SubCtaDe="1105" Nivel="2" Naturaleza="D"/>
  <catalogocuentas:Ctas CodAgrup="401.01" NumCta="4101-01-001" Desc="Ventas Servicios Cloud 16%" SubCtaDe="4101" Nivel="2" Naturaleza="A"/>
  <catalogocuentas:Ctas CodAgrup="208.01" NumCta="2108-01-001" Desc="IVA Trasladado Efectivamente Cobrado" SubCtaDe="2108" Nivel="2" Naturaleza="A"/>
</catalogocuentas:Catalogo>`;

    const res = parsearXMLAnexo24(xmlCatalogo);
    expect(res.rfc).toBe('ABC120315XYZ');
    expect(res.anio).toBe(2026);
    expect(res.mes).toBe('03');

    const cuentaClientes = res.cuentasPorNumCta.get('1105-01-001');
    expect(cuentaClientes).toBeDefined();
    expect(cuentaClientes?.codigoAgrupador).toBe('105.01');
    expect(cuentaClientes?.descripcion).toBe('Clientes Locales Monterrey');
    expect(cuentaClientes?.tipo).toBe('activo');

    const cuentaIngresos = res.cuentasPorNumCta.get('4101-01-001');
    expect(cuentaIngresos?.codigoAgrupador).toBe('401.01');
    expect(cuentaIngresos?.descripcion).toBe('Ventas Servicios Cloud 16%');
    expect(cuentaIngresos?.tipo).toBe('ingreso');
  });

  it('parsea un XML de Balanza de Comprobación y combina saldos', () => {
    const xmlCatalogo = `<?xml version="1.0" encoding="UTF-8"?>
<catalogocuentas:Catalogo RFC="ABC120315XYZ" Mes="03" Anio="2026">
  <catalogocuentas:Ctas CodAgrup="401.01" NumCta="4101-01-001" Desc="Ventas 16%" Nivel="2" Naturaleza="A"/>
</catalogocuentas:Catalogo>`;

    const catalogo = parsearXMLAnexo24(xmlCatalogo);

    const xmlBalanza = `<?xml version="1.0" encoding="UTF-8"?>
<BCE:Balanza xmlns:BCE="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion"
  Version="1.3" RFC="ABC120315XYZ" Mes="03" Anio="2026" TipoEnvio="N">
  <BCE:Ctas NumCta="4101-01-001" SaldoIni="0.00" Debe="0.00" Haber="100000.00" SaldoFin="100000.00"/>
</BCE:Balanza>`;

    const combinado = parsearXMLAnexo24(xmlBalanza, catalogo);
    const cta = combinado.cuentasPorNumCta.get('4101-01-001');
    expect(cta?.descripcion).toBe('Ventas 16%');
    expect(cta?.haber).toBe(100000);
    expect(cta?.saldoFinal).toBe(100000);
  });
});

import { describe, it, expect } from 'vitest';
import { parsearMetadataSAT } from './parserMetadata';

describe('parserMetadataSAT', () => {
  it('parsea correctamente un archivo TXT delimitado por tildes (~)', () => {
    const txt = `Uuid~RfcEmisor~NombreEmisor~RfcReceptor~NombreReceptor~RfcPac~FechaEmision~FechaCertificacionSat~Monto~EfectoComprobante~Estatus~FechaCancelacion
9B7C3E14-45D2-482F-8CE9-039A5D6B10E1~DES850101XYZ~DESARROLLO SA~CORP901231ABC~CORP DEL NORTE~PAC01~2026-03-10~2026-03-10~49880.00~I~1~
5E2B910A-33C1-4D90-BA12-70FD18CE5821~MEMA8204159Z8~ALEJANDRO MEDINA~CORP901231ABC~CORP DEL NORTE~PAC01~2026-03-12~2026-03-12~29493.34~I~Vigente~
C3A1098F-E24D-4A8E-9543-0BC837482DA9~DES850101XYZ~DESARROLLO SA~CORP901231ABC~CORP DEL NORTE~PAC01~2026-03-14~2026-03-14~5800.00~E~0~2026-03-15T10:00:00
`;

    const resultado = parsearMetadataSAT(txt);
    expect(resultado.totalRegistros).toBe(3);
    expect(resultado.vigentes).toBe(2);
    expect(resultado.cancelados).toBe(1);

    expect(resultado.uuidsVigentes.has('9B7C3E14-45D2-482F-8CE9-039A5D6B10E1')).toBe(true);
    expect(resultado.uuidsVigentes.has('5E2B910A-33C1-4D90-BA12-70FD18CE5821')).toBe(true);
    expect(resultado.uuidsCancelados.has('C3A1098F-E24D-4A8E-9543-0BC837482DA9')).toBe(true);

    const cancelada = resultado.mapaPorUUID.get('C3A1098F-E24D-4A8E-9543-0BC837482DA9');
    expect(cancelada?.estatus).toBe('Cancelado');
    expect(cancelada?.monto).toBe(5800);
    expect(cancelada?.fechaCancelacion).toBe('2026-03-15T10:00:00');
  });

  it('detecta delimitador pipe (|) y BOM UTF-8', () => {
    const txtConBOM = `\uFEFFFolio Fiscal|RFC Emisor|Nombre Emisor|RFC Receptor|Monto|Estatus Cancelación
AAAAAAAA-1111-2222-3333-444444444444|AAA010101AAA|EMPRESA A|BBB020202BBB|15000.50|Cancelado
BBBBBBBB-1111-2222-3333-444444444444|AAA010101AAA|EMPRESA A|BBB020202BBB|25000.00|Vigente
`;

    const resultado = parsearMetadataSAT(txtConBOM);
    expect(resultado.totalRegistros).toBe(2);
    expect(resultado.cancelados).toBe(1);
    expect(resultado.vigentes).toBe(1);
    expect(resultado.uuidsCancelados.has('AAAAAAAA-1111-2222-3333-444444444444')).toBe(true);
  });

  it('maneja archivo vacío o sin registros', () => {
    const vacio = parsearMetadataSAT('');
    expect(vacio.totalRegistros).toBe(0);
    expect(vacio.errores.length).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';
import { calcularRetencionClinicas, MENSAJE_SOLO_YUCATAN } from './calcularRetencionClinicas';
import {
  generarContenidoAafy30,
  generarContenidoAafy31,
  generarContenidoCotejoAafy,
  camposIdentidadFaltantes,
} from './exportarAafyRetencion';
import type { RetencionClinicasInput } from '../types';

const baseInput: RetencionClinicasInput = {
  estadoId: 'YUC',
  montoHonorarios: 10000,
  fechaPago: '2026-03-15',
  folioConstancia: 'AAFY30-202603-001',
  retenedor: {
    nombre: 'Clínica Médica Mérida S.A. de C.V.',
    rfc: 'CMM200101AB1',
    rec: 'REC-MID-1001',
    ciee: 'CIEE-YUC-8899',
  },
  prestador: {
    nombre: 'Dr. Alejandro Pech Tun',
    rfc: 'PETA850412XYZ',
    domicilioFiscal: 'Calle 60 #320, Mérida, Yuc.',
    tipoPersona: 'fisica',
  },
};

describe('calcularRetencionClinicas (Tool 21 — Art. 20-Bis LGHY)', () => {
  it('calcula vector dorado $10,000 honorarios -> retención $200, neto $9,800, profesional 3% $300', () => {
    const res = calcularRetencionClinicas(baseInput);

    expect(res.base).toBe(10000);
    expect(res.tasaRetencion).toBe(2.0);
    expect(res.retencion2Pct).toBe(200);
    expect(res.netoPagar).toBe(9800);
    expect(res.impuestoEjercicioProfesional3Pct).toBe(300);
    expect(res.fechaLimiteEntero).toBe('2026-04-10');
    expect(res.fechaLimitePagoImpuesto).toBe('2026-04-17');
    expect(res.fechaLimiteConstancia).toBe('2026-03-20');
  });

  it('aplica prórroga Acuerdo AAFY 12/2026 (III.1.5) para enero 2026 -> límite 20 de febrero 2026', () => {
    const res = calcularRetencionClinicas({
      ...baseInput,
      fechaPago: '2026-01-25',
    });
    expect(res.fechaLimiteEntero).toBe('2026-02-20');
    expect(res.trimestreInformativo.periodo).toBe('Q1+Q2 2026');
    expect(res.trimestreInformativo.mesLimite).toBe('julio 2026');
    expect(res.trimestreInformativo.label).toContain('Transitory Fifth');
  });

  it('Art. 20-Quinquies: trimestre informativo por mes de pago (mes límite, sin día inventado)', () => {
    const cases: Array<[string, string, string]> = [
      ['2026-01-15', 'Q1+Q2 2026', 'julio 2026'],
      ['2026-04-15', 'Q1+Q2 2026', 'julio 2026'],
      ['2026-06-15', 'Q1+Q2 2026', 'julio 2026'],
      ['2026-07-15', 'Q3 2026', 'octubre 2026'],
      ['2026-10-15', 'Q4 2026', 'enero 2027'],
    ];
    for (const [fecha, periodo, mesLimite] of cases) {
      const res = calcularRetencionClinicas({ ...baseInput, fechaPago: fecha });
      expect(res.trimestreInformativo.periodo).toBe(periodo);
      expect(res.trimestreInformativo.mesLimite).toBe(mesLimite);
    }
  });

  it('bloquea cálculo para entidades distintas a Yucatán (Solo Yucatán, Art. 20-Bis LGHY)', () => {
    expect(() =>
      calcularRetencionClinicas({
        ...baseInput,
        estadoId: 'CDMX',
      })
    ).toThrow(MENSAJE_SOLO_YUCATAN);
  });

  it('base $0 permitida: devuelve ceros, sin retención ni constancia', () => {
    const res = calcularRetencionClinicas({ ...baseInput, montoHonorarios: 0 });
    expect(res.base).toBe(0);
    expect(res.retencion2Pct).toBe(0);
    expect(res.netoPagar).toBe(0);
    expect(res.impuestoEjercicioProfesional3Pct).toBe(0);
  });

  it('base negativa lanza error y no calcula', () => {
    expect(() => calcularRetencionClinicas({ ...baseInput, montoHonorarios: -500 })).toThrow(
      'Base de honorarios no puede ser negativa.'
    );
  });

  it('base faltante (undefined) lanza error, no default a $0', () => {
    expect(() =>
      calcularRetencionClinicas({ ...baseInput, montoHonorarios: undefined as unknown as number })
    ).toThrow('Base de honorarios requerida');
  });

  it('base impar $123,456.78: redondeo comercial a 2 decimales', () => {
    const res = calcularRetencionClinicas({ ...baseInput, montoHonorarios: 123456.78 });
    expect(res.base).toBe(123456.78);
    expect(res.retencion2Pct).toBe(2469.14);
    expect(res.netoPagar).toBe(120987.64);
    expect(res.impuestoEjercicioProfesional3Pct).toBe(3703.7);
  });

  it('genera formatos AAFY-30, AAFY-31 y CSV de cotejo con domicilio/REC, CIEE y folio de integridad', () => {
    const res = calcularRetencionClinicas(baseInput);
    const aafy30 = generarContenidoAafy30(baseInput, res);
    const aafy31 = generarContenidoAafy31(baseInput, res);
    const cotejo = generarContenidoCotejoAafy(baseInput, res);

    expect(aafy30).toContain('FORMATO AAFY-30');
    expect(aafy30).toContain('CIEE-YUC-8899');
    expect(aafy30).toContain('Calle 60 #320');
    expect(aafy30).toContain('10000.00');
    expect(aafy30).toContain('200.00');
    expect(aafy30).toContain('Folio de Integridad Digital ARK LEDGER,AAFY-ISN-AAFY-30-');

    expect(aafy31).toContain('FORMATO AAFY-31');
    expect(aafy31).toContain('ANEXO 31.1');
    expect(aafy31).toContain('2026-04-10');
    expect(aafy31).toContain('Folio de Integridad Digital ARK LEDGER,AAFY-ISN-AAFY-31-');

    expect(cotejo).toContain('CMM200101AB1');
    expect(cotejo).toContain('200.00');
    expect(cotejo).toContain('AAFY-ISN-AAFY-COTEJO-');
  });
});

describe('Export guard — campos de identidad faltantes (no exportar N/D en silencio)', () => {
  const completo: RetencionClinicasInput = {
    ...baseInput,
    retenedor: {
      ...baseInput.retenedor,
      rec: 'REC-MID-1001',
      ciee: 'CIEE-YUC-8899',
      rfc: 'CMM200101AB1',
    },
    prestador: { ...baseInput.prestador, rfc: 'PETA850412XYZ' },
  };

  it('camposIdentidadFaltantes: CIEE faltante', () => {
    const faltantes = camposIdentidadFaltantes({
      ...completo,
      retenedor: { ...completo.retenedor, ciee: '' },
    });
    expect(faltantes).toEqual(['CIEE del retenedor']);
  });

  it('camposIdentidadFaltantes: REC faltante', () => {
    const faltantes = camposIdentidadFaltantes({
      ...completo,
      retenedor: { ...completo.retenedor, rec: undefined },
    });
    expect(faltantes).toEqual(['REC AAFY del retenedor']);
  });

  it('camposIdentidadFaltantes: RFC del prestador faltante', () => {
    const faltantes = camposIdentidadFaltantes({
      ...completo,
      prestador: { ...completo.prestador, rfc: '' },
    });
    expect(faltantes).toEqual(['RFC del prestador']);
  });

  it('camposIdentidadFaltantes: RFC del retenedor faltante', () => {
    const faltantes = camposIdentidadFaltantes({
      ...completo,
      retenedor: { ...completo.retenedor, rfc: '' },
    });
    expect(faltantes).toEqual(['RFC del retenedor']);
  });

  it('camposIdentidadFaltantes: todo completo devuelve vacío', () => {
    expect(camposIdentidadFaltantes(completo)).toEqual([]);
  });
});

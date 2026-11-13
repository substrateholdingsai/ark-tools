import { describe, it, expect } from 'vitest';
import { calcularRetencionClinicas, MENSAJE_SOLO_YUCATAN } from './calcularRetencionClinicas';
import {
  generarContenidoAafy30,
  generarContenidoAafy31,
  generarContenidoCotejoAafy,
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

  it('aplica prórroga Acuerdo AAFY XX/2026 para enero 2026 -> límite 20 de febrero 2026', () => {
    const res = calcularRetencionClinicas({
      ...baseInput,
      fechaPago: '2026-01-25',
    });
    expect(res.fechaLimiteEntero).toBe('2026-02-20');
    expect(res.trimestreInformativo).toContain('julio 2026');
  });

  it('bloquea cálculo para entidades distintas a Yucatán (Solo Yucatán, Art. 20-Bis LGHY)', () => {
    expect(() =>
      calcularRetencionClinicas({
        ...baseInput,
        estadoId: 'CDMX',
      })
    ).toThrow(MENSAJE_SOLO_YUCATAN);
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

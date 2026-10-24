/**
 * ARK LEDGER — Pruebas de Exportación de Cierre de Nómina (Sprint 11)
 */

import { describe, it, expect } from 'vitest';
import {
  escaparCSV,
  exportarConcentradoCSV,
  exportarDispersionBancariaCSV,
} from './exportarCierre';
import type { CierreNominaCompleto } from '../types';

describe('exportarCierre — Sprint 11', () => {
  const dummyCierre: CierreNominaCompleto = {
    parametros: {
      periodo: 'quincenal',
      diasPeriodo: 15,
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-15',
      fechaCorte: '2026-10-15',
      empresaNombre: 'Tecnología y Soluciones S.A. de C.V.',
      empresaRfc: 'TSO180512KL9',
      estadoIsnId: 'cdmx',
      estadoIsnNombre: 'Ciudad de México',
      tasaIsn: 3.0,
      diasAguinaldo: 15,
      primaVacacionalPct: 25,
    },
    trabajadores: [
      {
        id: '1',
        numeroLista: 1,
        nombre: 'GARCIA LOPEZ, ALBERTO',
        rfc: 'GALA850101AA1',
        curp: 'GALA850101HDFRRN01',
        nss: '12345678901',
        fechaIngreso: '2021-01-01',
        antiguedadAnios: 5,
        diasVacacionesLey: 20,
        factorIntegracion: 1.0548,
        salarioDiario: 600,
        sbcDiario: 632.88,
        diasTrabajados: 15,
        sueldoOrdinario: 9000,
        percepcionesAdicionales: 1000,
        totalPercepciones: 10000,
        baseGravableISR: 10000,
        isrAntesSubsidio: 800,
        subsidioEmpleo: 0,
        isrRetenido: 800,
        imssObrero: 150,
        otrasDeducciones: 0,
        totalDeducciones: 950,
        sueldoNeto: 9050,
        isnEstatal: 300,
      },
    ],
    resumen: {
      totalTrabajadores: 1,
      totalPercepcionesBrutas: 10000,
      totalISRRetenido: 800,
      totalSubsidioEntregado: 0,
      totalIMSSObrero: 150,
      totalOtrasDeducciones: 0,
      totalDeducciones: 950,
      totalNetoDispersar: 9050,
      totalISNEstatal: 300,
      importeNetoEnLetras: '(NUEVE MIL CINCUENTA PESOS 00/100 M.N.)',
      fechaEmision: '2026-10-16T08:00:00.000Z',
      catalogVersion: 'DOF-2026-UMA117.31-SMG315.04-TOPESBC2932.75',
      hashLote: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
  };

  describe('escaparCSV', () => {
    it('envuelve en comillas y duplica comillas internas si hay comas o comillas', () => {
      expect(escaparCSV('Pérez, Juan')).toBe('"Pérez, Juan"');
      expect(escaparCSV('Dijo "Hola"')).toBe('"Dijo ""Hola"""');
      expect(escaparCSV('Simple')).toBe('Simple');
      expect(escaparCSV(null)).toBe('');
    });
  });

  describe('exportarConcentradoCSV', () => {
    it('contiene el BOM UTF-8 y las secciones institucionales', () => {
      const csv = exportarConcentradoCSV(dummyCierre);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('ARK LEDGER — CÉDULA CONCENTRADORA DE NÓMINA OFICIAL');
      expect(csv).toContain('Tecnología y Soluciones S.A. de C.V.');
      expect(csv).toContain('TSO180512KL9');
      expect(csv).toContain('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      expect(csv).toContain('GARCIA LOPEZ, ALBERTO');
      expect(csv).toContain('10000.00');
      expect(csv).toContain('9050.00');
      expect(csv).toContain('(NUEVE MIL CINCUENTA PESOS 00/100 M.N.)');
    });
  });

  describe('exportarDispersionBancariaCSV', () => {
    it('contiene las columnas de dispersión bancaria para transferencias', () => {
      const csv = exportarDispersionBancariaCSV(dummyCierre);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('No,Beneficiario,RFC,Monto_Neto,Concepto');
      expect(csv).toContain('"GARCIA LOPEZ, ALBERTO"');
      expect(csv).toContain('9050.00');
      expect(csv).toContain('Nomina quincenal');
    });
  });
});

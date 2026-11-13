import { describe, it, expect } from 'vitest';
import {
  calcularDigitoVerificadorIdse,
  desglosarNombreCompleto,
  formatearFechaIdse,
  generarLineaIdse,
  generarLayoutIdse,
} from './layoutImssIdse';
import type { ResultadoTrabajadorNomina } from '../types';

describe('layoutImssIdse', () => {
  describe('desglosarNombreCompleto', () => {
    it('desglosa nombres estándar mexicanos', () => {
      const res = desglosarNombreCompleto('Pérez Gómez Juan Carlos');
      expect(res.paterno).toBe('PÉREZ');
      expect(res.materno).toBe('GÓMEZ');
      expect(res.nombres).toBe('JUAN CARLOS');
    });

    it('maneja un solo nombre y apellido', () => {
      const res = desglosarNombreCompleto('López Raúl');
      expect(res.paterno).toBe('LÓPEZ');
      expect(res.materno).toBe('RAÚL');
    });
  });

  describe('formatearFechaIdse', () => {
    it('convierte fecha YYYY-MM-DD a DDMMAAAA', () => {
      expect(formatearFechaIdse('2026-10-15')).toBe('15102026');
    });

    it('respeta fecha que ya viene en formato DDMMAAAA', () => {
      expect(formatearFechaIdse('01012026')).toBe('01012026');
    });
  });

  describe('generarLineaIdse y generarLayoutIdse', () => {
    const trabajadorDemo: ResultadoTrabajadorNomina = {
      id: 't-1',
      numeroLista: 1,
      nombre: 'Hernández Pech Carlos Alberto',
      rfc: 'HEPC850101AB1',
      curp: 'HEPC850101HMNRRL01',
      nss: '12345678901',
      fechaIngreso: '2026-01-15',
      antiguedadAnios: 1,
      diasVacacionesLey: 12,
      factorIntegracion: 1.049315,
      salarioDiario: 500,
      sbcDiario: 524.66,
      diasTrabajados: 15,
      sueldoOrdinario: 7500,
      percepcionesAdicionales: 0,
      totalPercepciones: 7500,
      baseGravableISR: 7500,
      isrAntesSubsidio: 600,
      subsidioEmpleo: 0,
      isrRetenido: 600,
      imssObrero: 200,
      imssPatronal: 0,
      infONAVIT: 0,
      otrasDeducciones: 0,
      totalDeducciones: 800,
      sueldoNeto: 6700,
      isnEstatal: 187.5,
    };

    it('genera una línea de 175 caracteres para IDSE (longitud Ledger, no confirmada por manual oficial IMSS)', () => {
      const linea = generarLineaIdse(trabajadorDemo, 'Y1234567101', '07', '2026-10-15');
      expect(linea).toHaveLength(175);
      expect(linea).toContain('Y1234567101');
      expect(linea).toContain('12345678901');
      expect(linea).toContain('HERNANDEZ');
      expect(linea).toContain('PECH');
      expect(linea).toContain('CARLOS ALBERTO');
      // SBC: 524.66 -> 52466 centavos -> pad con 8 ceros = 00052466
      expect(linea).toContain('00052466');
      expect(linea).toContain('15102026'); // fecha
      expect(linea).toContain('07'); // Clave movimiento (Modificación de Salario)
      expect(linea).toContain('HEPC850101HMNRRL01'); // CURP
      // Posiciones 153-155: dígito verificador (3 dígitos numéricos)
      expect(linea.slice(152, 155)).toMatch(/^\d{3}$/);
      // Posiciones 156-175: relleno con espacios
      expect(linea.slice(155)).toBe(' '.repeat(20));
    });

    it('el dígito verificador es determinista y cambia si el cuerpo cambia', () => {
      const lineaA = generarLineaIdse(trabajadorDemo, 'Y1234567101', '07', '2026-10-15');
      const lineaB = generarLineaIdse(trabajadorDemo, 'Y1234567101', '07', '2026-10-15');
      const lineaC = generarLineaIdse(trabajadorDemo, 'Y1234567102', '07', '2026-10-15');
      expect(lineaA).toBe(lineaB); // mismo trabajador => mismo DV
      expect(lineaA.slice(152, 155)).not.toBe(lineaC.slice(152, 155)); // distinto regPat => distinto DV
    });

    it('calcularDigitoVerificadorIdse devuelve siempre 3 dígitos', () => {
      expect(calcularDigitoVerificadorIdse('')).toBe('000');
      expect(calcularDigitoVerificadorIdse('A')).toMatch(/^\d{3}$/);
      expect(calcularDigitoVerificadorIdse('a').length).toBe(3);
    });

    it('genera un layout multilínea filtrando trabajadores sin NSS', () => {
      const trabajadores = [
        trabajadorDemo,
        { ...trabajadorDemo, id: 't-2', nss: '' }, // Sin NSS, debe omitirse
      ];

      const txt = generarLayoutIdse({
        registroPatronal: 'Y1234567101',
        movimiento: '08',
        trabajadores,
      });

      const lineas = txt.split('\r\n');
      expect(lineas).toHaveLength(1);
      expect(lineas[0]).toContain('08'); // Clave Alta
    });
  });
});

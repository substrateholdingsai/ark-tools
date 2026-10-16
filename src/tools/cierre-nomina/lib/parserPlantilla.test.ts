/**
 * ARK TOOLS — Pruebas Unitarias del Parser de Plantillas de Nómina Masiva (Sprint 11)
 */

import { describe, it, expect } from 'vitest';
import {
  detectarDelimitador,
  calcularDiasVacacionesPorLey,
  calcularAntiguedadAnios,
  parsearPlantillaNomina,
  generarPlantillaEjemploCSV,
  parsearNumero,
  normalizarRFC,
  normalizarNSS,
} from './parserPlantilla';

describe('parserPlantilla — Sprint 11', () => {
  describe('detectarDelimitador', () => {
    it('detecta comas en formato CSV estándar', () => {
      const csv = 'Nombre,RFC,Salario_Diario\nJuan,XAXX010101000,500';
      expect(detectarDelimitador(csv)).toBe(',');
    });

    it('detecta punto y coma en formato CSV europeo o Excel español', () => {
      const csv = 'Nombre;RFC;Salario_Diario\nMaria;XAXX010101000;800';
      expect(detectarDelimitador(csv)).toBe(';');
    });

    it('detecta tabuladores en formato TSV', () => {
      const tsv = 'Nombre\tRFC\tSalario_Diario\nPedro\tXAXX010101000\t600';
      expect(detectarDelimitador(tsv)).toBe('\t');
    });
  });

  describe('calcularDiasVacacionesPorLey (Reforma Vacaciones Dignas LFT Art. 76)', () => {
    it('calcula 12 días para 1 año de antigüedad', () => {
      expect(calcularDiasVacacionesPorLey(1)).toBe(12);
    });

    it('calcula 14 días para 2 años', () => {
      expect(calcularDiasVacacionesPorLey(2)).toBe(14);
    });

    it('calcula 20 días para 5 años', () => {
      expect(calcularDiasVacacionesPorLey(5)).toBe(20);
    });

    it('calcula 22 días para 6 a 10 años', () => {
      expect(calcularDiasVacacionesPorLey(6)).toBe(22);
      expect(calcularDiasVacacionesPorLey(10)).toBe(22);
    });

    it('calcula 24 días para 11 a 15 años', () => {
      expect(calcularDiasVacacionesPorLey(12)).toBe(24);
      expect(calcularDiasVacacionesPorLey(15)).toBe(24);
    });

    it('calcula 32 días para 31+ años', () => {
      expect(calcularDiasVacacionesPorLey(31)).toBe(32);
    });
  });

  describe('calcularAntiguedadAnios', () => {
    it('calcula correctamente años cumplidos entre ingreso y corte', () => {
      expect(calcularAntiguedadAnios('2021-03-15', '2026-03-15')).toBe(5);
      expect(calcularAntiguedadAnios('2021-03-16', '2026-03-15')).toBe(4); // Aún no cumple el 5to año
    });

    it('retorna 0 si lleva menos de un año', () => {
      expect(calcularAntiguedadAnios('2026-01-01', '2026-03-01')).toBe(0);
    });
  });

  describe('utilidades de limpieza y parsing', () => {
    it('parsea números con signos de pesos y comas', () => {
      expect(parsearNumero('$12,500.50')).toBe(12500.5);
      expect(parsearNumero(' 315.04 ')).toBe(315.04);
      expect(parsearNumero('invalid')).toBe(0);
      expect(parsearNumero(null)).toBe(0);
    });

    it('normaliza RFC a mayúsculas y sin caracteres no válidos', () => {
      expect(normalizarRFC(' hegr-850412-hr9 ')).toBe('HEGR850412HR9');
    });

    it('normaliza NSS solo a números', () => {
      expect(normalizarNSS('24-05-85-1234-1')).toBe('24058512341');
    });
  });

  describe('parsearPlantillaNomina', () => {
    it('parsea exitosamente la plantilla de ejemplo oficial generada', () => {
      const csvEjemplo = generarPlantillaEjemploCSV();
      const resultado = parsearPlantillaNomina(csvEjemplo);

      expect(resultado.esValido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
      expect(resultado.trabajadoresValidos).toHaveLength(5);

      const t1 = resultado.trabajadoresValidos[0]!;
      expect(t1.nombre).toBe('HERNANDEZ GARCIA ROBERTO');
      expect(t1.salarioDiario).toBe(550);
      expect(t1.rfc).toBe('HEGR850412HR9');
      expect(t1.nss).toBe('24058512341');
      expect(t1.bonos).toBe(500);
      expect(t1.diasTrabajados).toBe(15);
    });

    it('soporta alias y variaciones en nombres de columnas', () => {
      const csvPersonalizado = `Trabajador,Sueldo Diario,Ingreso,Descuentos
"Gómez, Ana",750.25,2022-05-10,120.00
"Ruiz, Pedro",480.00,2023-01-15,0`;

      const resultado = parsearPlantillaNomina(csvPersonalizado);
      expect(resultado.esValido).toBe(true);
      expect(resultado.trabajadoresValidos).toHaveLength(2);
      const row1 = resultado.trabajadoresValidos[0]!;
      expect(row1.nombre).toBe('Gómez, Ana');
      expect(row1.salarioDiario).toBe(750.25);
      expect(row1.fechaIngreso).toBe('2022-05-10');
      expect(row1.otrasDeducciones).toBe(120);
    });

    it('falla con error claro si no encuentra la columna de Salario Diario', () => {
      const csvInvalido = 'Nombre,RFC,CURP\nJuan Perez,XAXX010101000,CURP123';
      const resultado = parsearPlantillaNomina(csvInvalido);

      expect(resultado.esValido).toBe(false);
      expect(resultado.errores).toContain(
        'No se encontró la columna requerida de "Salario Diario" o "Sueldo Diario".'
      );
    });

    it('falla si el archivo está vacío', () => {
      const resultado = parsearPlantillaNomina('');
      expect(resultado.esValido).toBe(false);
      expect(resultado.errores).toContain('El archivo importado se encuentra vacío.');
    });
  });
});

/**
 * ARK LEDGER — Pruebas del Motor de Cierre de Nómina Masiva (Sprint 11)
 */

import { describe, it, expect } from 'vitest';
import { procesarCierreNomina, computeBatchHash } from './calcularCierreNomina';
import type { TrabajadorFilaInput, ParametrosCierreNomina } from '../types';

describe('calcularCierreNomina — Sprint 11', () => {
  const parametrosQuincenales: ParametrosCierreNomina = {
    periodo: 'quincenal',
    diasPeriodo: 15,
    fechaInicio: '2026-10-01',
    fechaFin: '2026-10-15',
    fechaCorte: '2026-10-15',
    empresaNombre: 'Operadora Industrial del Norte S.A. de C.V.',
    empresaRfc: 'OIN180425AB1',
    estadoIsnId: 'cdmx',
    estadoIsnNombre: 'Ciudad de México',
    tasaIsn: 3.0,
    diasAguinaldo: 15,
    primaVacacionalPct: 25,
  };

  const trabajadoresPrueba: TrabajadorFilaInput[] = [
    {
      id: 't-1',
      nombre: 'HERNANDEZ GARCIA ROBERTO',
      rfc: 'HEGR850412HR9',
      salarioDiario: 500,
      fechaIngreso: '2022-03-01', // 4 años = 18 días vacaciones
      diasTrabajados: 15,
      bonos: 500,
      otrasDeducciones: 0,
    },
    {
      id: 't-2',
      nombre: 'LOPEZ MARTINEZ MARIANA',
      rfc: 'LOMM920820TL4',
      salarioDiario: 1000,
      fechaIngreso: '2025-01-10', // 1 año = 12 días vacaciones
      diasTrabajados: 15,
      horasExtras: 1500,
      otrasDeducciones: 300,
    },
    {
      id: 't-3',
      nombre: 'DIRECTOR GENERAL DE FINANZAS',
      rfc: 'DGF800101XYZ',
      salarioDiario: 5000, // Supera el tope de 25 UMAs ($2,932.75)
      fechaIngreso: '2016-05-20', // 10 años = 22 días vacaciones
      diasTrabajados: 15,
    },
  ];

  it('procesa el lote completo y genera el resumen consolidado', async () => {
    const resultado = await procesarCierreNomina(trabajadoresPrueba, parametrosQuincenales);

    expect(resultado.trabajadores).toHaveLength(3);
    expect(resultado.resumen.totalTrabajadores).toBe(3);

    // Verificación de sumas lógicas
    expect(resultado.resumen.totalPercepcionesBrutas).toBeGreaterThan(0);
    expect(resultado.resumen.totalISRRetenido).toBeGreaterThan(0);
    expect(resultado.resumen.totalIMSSObrero).toBeGreaterThan(0);
    expect(resultado.resumen.totalDeducciones).toBe(
      Math.round(
        (resultado.resumen.totalISRRetenido +
          resultado.resumen.totalIMSSObrero +
          resultado.resumen.totalOtrasDeducciones) *
          100
      ) / 100
    );

    expect(resultado.resumen.totalNetoDispersar).toBe(
      Math.round(
        (resultado.resumen.totalPercepcionesBrutas - resultado.resumen.totalDeducciones) * 100
      ) / 100
    );

    // Texto en letras M.N.
    expect(resultado.resumen.importeNetoEnLetras).toContain('PESOS');
    expect(resultado.resumen.importeNetoEnLetras).toContain('M.N.');

    // Sello digital criptográfico SHA-256
    expect(resultado.resumen.hashLote).toMatch(/^[a-f0-9]{64}$/);
    expect(resultado.resumen.catalogVersion).toContain('DOF-2026');
  });

  it('aplica correctamente el tope de 25 UMAs en el SBC para salarios altos', async () => {
    const resultado = await procesarCierreNomina(trabajadoresPrueba, parametrosQuincenales);
    const director = resultado.trabajadores.find((t) => t.rfc === 'DGF800101XYZ')!;

    expect(director).toBeDefined();
    expect(director.salarioDiario).toBe(5000);
    // El tope 25 UMA 2026 es 2,932.75
    expect(director.sbcDiario).toBe(2932.75);
    expect(director.factorIntegracion).toBeGreaterThan(1.05);
  });

  it('calcula la retención de ISN estatal acorde a la tasa del estado', async () => {
    const resultado = await procesarCierreNomina(trabajadoresPrueba, parametrosQuincenales);

    const esperadoISN =
      Math.round(
        resultado.resumen.totalPercepcionesBrutas * (parametrosQuincenales.tasaIsn / 100) * 100
      ) / 100;

    expect(resultado.resumen.totalISNEstatal).toBeCloseTo(esperadoISN, 1);
  });

  it('garantiza la consistencia determinista del hash SHA-256 del lote', async () => {
    const data = { a: 1, b: 'test', c: [1, 2, 3] };
    const dataReordered = { c: [1, 2, 3], b: 'test', a: 1 };

    const hash1 = await computeBatchHash(data);
    const hash2 = await computeBatchHash(dataReordered);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });
});

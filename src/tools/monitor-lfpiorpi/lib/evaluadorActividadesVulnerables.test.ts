import { describe, it, expect } from 'vitest';
import {
  obtenerUmaDiariaVigente,
  obtenerActividadPorFraccion,
  calcularMaximoAcumulado6Meses,
  clasificarRiesgo,
  evaluarOperacionesLFPIORPI,
} from './evaluadorActividadesVulnerables';
import type { OperacionCobranza } from '../types';

describe('Motor Determinista LFPIORPI (evaluadorActividadesVulnerables)', () => {
  it('obtiene el valor oficial de UMA 2026 desde el catálogo centralizado', () => {
    const uma = obtenerUmaDiariaVigente();
    expect(uma).toBe(117.31);
  });

  it('obtiene correctamente la actividad de Arrendamiento Inmobiliario Fracc. XV', () => {
    const act = obtenerActividadPorFraccion('FRACCION_XV');
    expect(act.fraccion).toBe('FRACCION_XV');
    expect(act.umbralIdentificacionUMA).toBe(1605);
    expect(act.umbralAvisoUMA).toBe(3210);
  });

  it('calcula los umbrales en pesos con base en UMA 2026 ($117.31)', () => {
    const uma = 117.31;
    const act = obtenerActividadPorFraccion('FRACCION_XV');
    const umbralIdentificacion = act.umbralIdentificacionUMA * uma; // 1,605 * 117.31 = 188,282.55
    const umbralAviso = act.umbralAvisoUMA * uma; // 3,210 * 117.31 = 376,565.10

    expect(umbralIdentificacion).toBeCloseTo(188282.55, 2);
    expect(umbralAviso).toBeCloseTo(376565.1, 2);
  });

  it('aplica correctamente la regla de acumulación móvil de 6 meses', () => {
    // 3 pagos dentro de 6 meses
    const opsDentro6Meses: OperacionCobranza[] = [
      {
        idCliente: 'CLI-01',
        fechaPago: '2026-01-15',
        montoCobrado: 70000,
        concepto: 'Renta Enero',
      },
      {
        idCliente: 'CLI-01',
        fechaPago: '2026-03-15',
        montoCobrado: 70000,
        concepto: 'Renta Marzo',
      },
      {
        idCliente: 'CLI-01',
        fechaPago: '2026-05-15',
        montoCobrado: 70000,
        concepto: 'Renta Mayo',
      },
    ];

    const res1 = calcularMaximoAcumulado6Meses(opsDentro6Meses);
    expect(res1.maxAcumulado).toBe(210000);
    expect(res1.operacionesVentana).toBe(3);

    // Pago anterior fuera de los 6 meses (ej. 1 año antes)
    const opsConPagoViejo: OperacionCobranza[] = [
      {
        idCliente: 'CLI-01',
        fechaPago: '2025-01-10',
        montoCobrado: 150000,
        concepto: 'Renta Enero 2025',
      },
      ...opsDentro6Meses,
    ];

    const res2 = calcularMaximoAcumulado6Meses(opsConPagoViejo);
    // La ventana móvil que termina en mayo 2026 abarca nov 2025 - mayo 2026 (suma 210,000)
    // El pago de enero 2025 sólo sumaría 150,000 en su propia ventana
    expect(res2.maxAcumulado).toBe(210000);
  });

  it('clasifica los niveles de riesgo según los umbrales legales (VERDE, AMARILLO, ROJO)', () => {
    const umbralId = 188282.55;
    const umbralAv = 376565.1;

    // Menor a identificación: VERDE
    const verde = clasificarRiesgo(100000, umbralId, umbralAv);
    expect(verde.nivelRiesgo).toBe('VERDE');
    expect(verde.requiereExpediente).toBe(false);
    expect(verde.requiereAviso).toBe(false);

    // Entre identificación y aviso: AMARILLO
    const amarillo = clasificarRiesgo(200000, umbralId, umbralAv);
    expect(amarillo.nivelRiesgo).toBe('AMARILLO');
    expect(amarillo.requiereExpediente).toBe(true);
    expect(amarillo.requiereAviso).toBe(false);

    // Mayor o igual a aviso: ROJO
    const rojo = clasificarRiesgo(400000, umbralId, umbralAv);
    expect(rojo.nivelRiesgo).toBe('ROJO');
    expect(rojo.requiereExpediente).toBe(true);
    expect(rojo.requiereAviso).toBe(true);
  });

  it('evalúa un lote completo con múltiples clientes y genera resumen con hash SHA-256', async () => {
    const operaciones: OperacionCobranza[] = [
      // Cliente A: 3 pagos de 70,000 = 210,000 -> AMARILLO (supera 188,282.55)
      { idCliente: 'CLI-A', fechaPago: '2026-01-10', montoCobrado: 70000, concepto: 'Renta' },
      { idCliente: 'CLI-A', fechaPago: '2026-02-10', montoCobrado: 70000, concepto: 'Renta' },
      { idCliente: 'CLI-A', fechaPago: '2026-03-10', montoCobrado: 70000, concepto: 'Renta' },

      // Cliente B: 1 pago de 400,000 -> ROJO (supera 376,565.10)
      { idCliente: 'CLI-B', fechaPago: '2026-02-01', montoCobrado: 400000, concepto: 'Anticipo' },

      // Cliente C: 1 pago de 50,000 -> VERDE
      { idCliente: 'CLI-C', fechaPago: '2026-04-01', montoCobrado: 50000, concepto: 'Renta local' },
    ];

    const resultado = await evaluarOperacionesLFPIORPI(operaciones, 'FRACCION_XV');

    expect(resultado.clientes).toHaveLength(3);
    expect(resultado.resumen.totalClientes).toBe(3);
    expect(resultado.resumen.totalOperaciones).toBe(5);
    expect(resultado.resumen.clientesRojo).toBe(1);
    expect(resultado.resumen.clientesAmarillo).toBe(1);
    expect(resultado.resumen.clientesVerde).toBe(1);
    expect(resultado.resumen.hashAuditoria).toHaveLength(64);

    // El primer cliente en la lista ordenada debe ser el de mayor riesgo (ROJO)
    expect(resultado.clientes[0]!.idCliente).toBe('CLI-B');
    expect(resultado.clientes[0]!.nivelRiesgo).toBe('ROJO');
    expect(resultado.clientes[1]!.idCliente).toBe('CLI-A');
    expect(resultado.clientes[1]!.nivelRiesgo).toBe('AMARILLO');
    expect(resultado.clientes[2]!.idCliente).toBe('CLI-C');
    expect(resultado.clientes[2]!.nivelRiesgo).toBe('VERDE');
  });
});

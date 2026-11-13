import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpedienteProvider } from '@/context/ExpedienteContext';
import { CierreNomina } from './CierreNomina';
import type { CierreNominaCompleto } from './types';

const { procesarMock } = vi.hoisted(() => ({ procesarMock: vi.fn() }));

vi.mock('./lib/calcularCierreNomina', () => ({
  procesarCierreNomina: procesarMock,
}));

const resultadoFalso: CierreNominaCompleto = {
  parametros: {
    periodo: 'quincenal',
    diasPeriodo: 15,
    fechaInicio: '2026-10-16',
    fechaFin: '2026-10-31',
    fechaCorte: '2026-10-31',
    empresaNombre: 'Demo',
    estadoIsnId: 'YUC',
    estadoIsnNombre: 'Yucatán',
    tasaIsn: 3.75,
    opcionesIsn: {
      ejercicio: 2026,
      numEmpleados: 5,
      esMicroPequena2026: true,
      esGobiernoEstatal: false,
      aplica27A: false,
    },
  },
  trabajadores: [
    {
      id: 'w-1',
      numeroLista: 1,
      nombre: 'Trabajador Uno',
      rfc: 'XAXX010101000',
      curp: 'XAXX010101HDFRRN01',
      nss: '12345678901',
      fechaIngreso: '2024-01-01',
      antiguedadAnios: 2,
      diasVacacionesLey: 14,
      factorIntegracion: 1.0507,
      salarioDiario: 1111.11,
      sbcDiario: 1167.43,
      diasTrabajados: 15,
      sueldoOrdinario: 16666.65,
      percepcionesAdicionales: 0,
      totalPercepciones: 16666.65,
      baseGravableISR: 16666.65,
      isrAntesSubsidio: 1000,
      subsidioEmpleo: 0,
      isrRetenido: 1000,
      imssObrero: 200,
      otrasDeducciones: 0,
      totalDeducciones: 1200,
      sueldoNeto: 15466.65,
      isnEstatal: 500,
    },
  ],
  resumen: {
    totalTrabajadores: 1,
    totalPercepcionesBrutas: 16666.65,
    totalISRRetenido: 1000,
    totalSubsidioEntregado: 0,
    totalIMSSObrero: 200,
    totalOtrasDeducciones: 0,
    totalDeducciones: 1200,
    totalNetoDispersar: 15466.65,
    totalISNEstatal: 500,
    isnBaseGravable: 16666.65,
    isnTasaBruta: 3.75,
    isnBruto: 625,
    isnEstimulo: 125,
    isnTasaEfectiva: 3,
    isnRegimen: 'micro_pequena',
    importeNetoEnLetras: 'QUINCE MIL CUATROCIENTOS SESENTA Y SEIS PESOS 65/100 M.N.',
    fechaEmision: '2026-10-31T12:00:00.000Z',
    catalogVersion: 'DOF-2026-TEST',
    hashLote: 'a'.repeat(64),
  },
  advertencias: [],
};

describe('CierreNomina — opcionesIsn en parámetros', () => {
  it('envía ejercicio, número de empleados y banderas al motor', async () => {
    procesarMock.mockResolvedValue(resultadoFalso);

    render(
      <ExpedienteProvider>
        <CierreNomina onBack={() => {}} />
      </ExpedienteProvider>
    );

    fireEvent.click(screen.getByText('Cargar 5 de Muestra'));
    await waitFor(() => {
      expect(screen.getByText('Colaboradores Listos (5)')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Procesar Cierre y Generar Cédula'));

    await waitFor(() => {
      expect(procesarMock).toHaveBeenCalledTimes(1);
    });

    const params = procesarMock.mock.calls[0]?.[1] as {
      opcionesIsn?: Record<string, unknown>;
    };
    expect(params.opcionesIsn).toEqual({
      ejercicio: 2026,
      numEmpleados: 5,
      esMicroPequena2026: true,
      esGobiernoEstatal: false,
      aplica27A: false,
    });
  });
});

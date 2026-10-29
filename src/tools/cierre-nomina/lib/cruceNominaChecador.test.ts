/**
 * ARK LEDGER — Pruebas Unitarias del Motor de Cruce Laboral-Fiscal (Jornada vs. Nómina)
 */

import { describe, it, expect } from 'vitest';
import {
  parsearXmlCfdiNomina,
  parsearLoteXmlsNomina,
  parsearCsvChecador,
  ejecutarCruceNominaChecador,
  generarCsvDiscrepancias,
  generarLoteMuestraCruce,
  generarPlantillaChecadorCSV,
} from './cruceNominaChecador';
import type { EmpleadoCfdiNomina, EmpleadoChecadorConsolidado } from '../types';

describe('Motor de Cruce Laboral-Fiscal (cruceNominaChecador)', () => {
  const muestra = generarLoteMuestraCruce();

  describe('parsearXmlCfdiNomina', () => {
    it('extrae correctamente el RFC, nombre, días pagados y horas extras del XML', () => {
      const xml = muestra.xmls[0]!;
      const parsed = parsearXmlCfdiNomina(xml);

      expect(parsed.rfc).toBe('HEGR850101AB1');
      expect(parsed.nombre).toBe('HERNANDEZ GARCIA ROBERTO');
      expect(parsed.numDiasPagados).toBe(15);
      expect(parsed.horasOrdinariasPagadas).toBe(120); // 15 * 8
      expect(parsed.horasExtrasPagadas).toBe(4);
      expect(parsed.horasDoblesPagadas).toBe(4);
      expect(parsed.horasTriplesPagadas).toBe(0);
      expect(parsed.importeHorasExtrasPagado).toBe(1000);
      expect(parsed.curp).toBe('HEGR850101HDFR01');
      expect(parsed.numSeguridadSocial).toBe('12345678901');
    });

    it('maneja CFDI sin horas extras y calcula las ordinarias', () => {
      const xml = muestra.xmls[1]!; // Mariana López sin horas extras
      const parsed = parsearXmlCfdiNomina(xml);

      expect(parsed.rfc).toBe('LOMA900202CD2');
      expect(parsed.horasExtrasPagadas).toBe(0);
      expect(parsed.horasOrdinariasPagadas).toBe(120);
    });

    it('arroja error ante XML vacío o inválido', () => {
      expect(() => parsearXmlCfdiNomina('')).toThrow();
    });
  });

  describe('parsearLoteXmlsNomina', () => {
    it('consolida horas si el mismo colaborador tiene más de un recibo en el lote', () => {
      const xml1 = muestra.xmls[0]!;
      const xml2 = muestra.xmls[0]!; // Mismo colaborador duplicado (segundo período)
      const lote = parsearLoteXmlsNomina([xml1, xml2]);

      expect(lote).toHaveLength(1);
      const colab = lote[0]!;
      expect(colab.rfc).toBe('HEGR850101AB1');
      expect(colab.horasExtrasPagadas).toBe(8); // 4 + 4
      expect(colab.numDiasPagados).toBe(30);
    });
  });

  describe('parsearCsvChecador', () => {
    it('parsea un CSV con cabeceras de horas trabajadas y horas extras', () => {
      const csv = `rfc,nombre,fecha,horas_trabajadas,horas_extras\nTEST010101AB1,JUAN PEREZ,2026-10-15,84,4`;
      const resultado = parsearCsvChecador(csv);

      expect(resultado).toHaveLength(1);
      expect(resultado[0]?.rfc).toBe('TEST010101AB1');
      expect(resultado[0]?.nombre).toBe('JUAN PEREZ');
      expect(resultado[0]?.totalHorasTrabajadas).toBe(84);
      expect(resultado[0]?.totalHorasExtras).toBe(4);
      expect(resultado[0]?.totalHorasOrdinarias).toBe(80);
    });

    it('calcula horas a partir de hora de entrada y hora de salida', () => {
      const csv = `rfc,nombre,fecha,entrada,salida\nTEST010101AB1,JUAN PEREZ,2026-10-01,09:00,19:00`;
      const resultado = parsearCsvChecador(csv);

      expect(resultado).toHaveLength(1);
      expect(resultado[0]?.totalHorasTrabajadas).toBe(10);
      expect(resultado[0]?.totalHorasExtras).toBe(2); // 10 - 8
    });

    it('retorna arreglo vacío si el CSV está vacío o solo contiene cabeceras', () => {
      expect(parsearCsvChecador('')).toEqual([]);
      expect(parsearCsvChecador('rfc,nombre,fecha')).toEqual([]);
    });
  });

  describe('ejecutarCruceNominaChecador', () => {
    it('detecta colaborador consistente con riesgo BAJO (sin discrepancias)', async () => {
      const cfdi: EmpleadoCfdiNomina[] = [
        {
          rfc: 'HEGR850101AB1',
          nombre: 'HERNANDEZ GARCIA ROBERTO',
          numDiasPagados: 15,
          horasOrdinariasPagadas: 120,
          horasExtrasPagadas: 4,
          horasDoblesPagadas: 4,
          horasTriplesPagadas: 0,
          importeHorasExtrasPagado: 1000,
          totalPercepciones: 14500,
        },
      ];

      const checador: EmpleadoChecadorConsolidado[] = [
        {
          rfc: 'HEGR850101AB1',
          nombre: 'HERNANDEZ GARCIA ROBERTO',
          totalHorasTrabajadas: 84,
          totalHorasOrdinarias: 80,
          totalHorasExtras: 4,
          diasConRegistro: 10,
          fechas: ['2026-10-01'],
        },
      ];

      const dictamen = await ejecutarCruceNominaChecador(cfdi, checador, {
        empresaNombre: 'Demo S.A.',
      });

      expect(dictamen.totalColaboradoresAuditados).toBe(1);
      expect(dictamen.colaboradoresConDiscrepancia).toBe(0);
      expect(dictamen.scoreConsistencia).toBe(100);
      expect(dictamen.nivelRiesgoGlobal).toBe('BAJO');
      expect(dictamen.discrepancias[0]?.tipoDiscrepancia).toBe('SIN_DISCREPANCIA');
      expect(dictamen.selloSha256).toBeDefined();
      expect(dictamen.selloSha256.length).toBe(64);
    });

    it('detecta horas extras trabajadas en checador no pagadas en CFDI (Riesgo ALTO)', async () => {
      const cfdi: EmpleadoCfdiNomina[] = [
        {
          rfc: 'LOMA900202CD2',
          nombre: 'LOPEZ MARTINEZ MARIANA',
          numDiasPagados: 15,
          horasOrdinariasPagadas: 120,
          horasExtrasPagadas: 0, // 0 horas en CFDI
          horasDoblesPagadas: 0,
          horasTriplesPagadas: 0,
          importeHorasExtrasPagado: 0,
          totalPercepciones: 18000,
        },
      ];

      const checador: EmpleadoChecadorConsolidado[] = [
        {
          rfc: 'LOMA900202CD2',
          nombre: 'LOPEZ MARTINEZ MARIANA',
          totalHorasTrabajadas: 86,
          totalHorasOrdinarias: 80,
          totalHorasExtras: 6, // 6 horas en checador
          diasConRegistro: 10,
          fechas: ['2026-10-01'],
        },
      ];

      const dictamen = await ejecutarCruceNominaChecador(cfdi, checador);

      expect(dictamen.colaboradoresConDiscrepancia).toBe(1);
      expect(dictamen.discrepancias[0]?.tipoDiscrepancia).toBe('HORAS_EXTRAS_NO_PAGADAS');
      expect(dictamen.discrepancias[0]?.diferenciaHorasExtras).toBe(6);
      expect(dictamen.discrepancias[0]?.nivelRiesgo).toBe('ALTO');
      expect(dictamen.alertasPrincipales.some((a) => a.includes('tiempo extraordinario'))).toBe(
        true
      );
    });

    it('detecta horas extras pagadas en CFDI sin registro de asistencia en checador (Riesgo MEDIO)', async () => {
      const cfdi: EmpleadoCfdiNomina[] = [
        {
          rfc: 'RACA920303EF3',
          nombre: 'RAMIREZ CASTILLO CARLOS',
          numDiasPagados: 15,
          horasOrdinariasPagadas: 120,
          horasExtrasPagadas: 8, // 8 horas extras en CFDI
          horasDoblesPagadas: 8,
          horasTriplesPagadas: 0,
          importeHorasExtrasPagado: 2000,
          totalPercepciones: 12000,
        },
      ];

      const checador: EmpleadoChecadorConsolidado[] = [
        {
          rfc: 'RACA920303EF3',
          nombre: 'RAMIREZ CASTILLO CARLOS',
          totalHorasTrabajadas: 80,
          totalHorasOrdinarias: 80,
          totalHorasExtras: 0, // 0 extras en checador
          diasConRegistro: 10,
          fechas: ['2026-10-01'],
        },
      ];

      const dictamen = await ejecutarCruceNominaChecador(cfdi, checador);

      expect(dictamen.discrepancias[0]?.tipoDiscrepancia).toBe('HORAS_EXTRAS_SIN_REGISTRO');
      expect(dictamen.discrepancias[0]?.nivelRiesgo).toBe('MEDIO');
      expect(dictamen.discrepancias[0]?.fundamentoLegal).toContain('Art. 27 Fracc. V LISR');
    });

    it('detecta colaborador con CFDI emitido pero sin registros en el reloj checador (Riesgo CRÍTICO)', async () => {
      const cfdi: EmpleadoCfdiNomina[] = [
        {
          rfc: 'SATO950404GH4',
          nombre: 'SANCHEZ TORRES SOFIA',
          numDiasPagados: 15,
          horasOrdinariasPagadas: 120,
          horasExtrasPagadas: 0,
          horasDoblesPagadas: 0,
          horasTriplesPagadas: 0,
          importeHorasExtrasPagado: 0,
          totalPercepciones: 9500,
        },
      ];

      const dictamen = await ejecutarCruceNominaChecador(cfdi, []); // Checador sin registros

      expect(dictamen.discrepancias[0]?.tipoDiscrepancia).toBe('SIN_REGISTRO_CHECADOR');
      expect(dictamen.discrepancias[0]?.nivelRiesgo).toBe('CRITICO');
      expect(dictamen.nivelRiesgoGlobal).toBe('CRITICO');
      expect(dictamen.discrepancias[0]?.detalles).toContain(
        'no existe ningún registro en el reloj checador'
      );
    });

    it('detecta exceso de 9 horas semanales sin pago de horas triples (Art. 68 LFT)', async () => {
      const cfdi: EmpleadoCfdiNomina[] = [
        {
          rfc: 'MORA880505IJ5',
          nombre: 'MORALES RIVERA DANIEL',
          numDiasPagados: 15,
          horasOrdinariasPagadas: 120,
          horasExtrasPagadas: 12,
          horasDoblesPagadas: 12,
          horasTriplesPagadas: 0, // 0 triples
          importeHorasExtrasPagado: 4000,
          totalPercepciones: 22000,
        },
      ];

      const checador: EmpleadoChecadorConsolidado[] = [
        {
          rfc: 'MORA880505IJ5',
          nombre: 'MORALES RIVERA DANIEL',
          totalHorasTrabajadas: 92,
          totalHorasOrdinarias: 80,
          totalHorasExtras: 12,
          diasConRegistro: 10,
          fechas: ['2026-10-01'],
        },
      ];

      const dictamen = await ejecutarCruceNominaChecador(cfdi, checador);

      expect(dictamen.discrepancias[0]?.tipoDiscrepancia).toBe('EXCESO_JORNADA_LEGAL_TRIPLE');
      expect(dictamen.discrepancias[0]?.nivelRiesgo).toBe('ALTO');
      expect(dictamen.discrepancias[0]?.fundamentoLegal).toContain('66 y 68');
    });

    it('procesa el lote de muestra completo de 5 colaboradores generando los hallazgos esperados', async () => {
      const cfdis = parsearLoteXmlsNomina(muestra.xmls);
      const checador = parsearCsvChecador(muestra.csvChecador);

      const dictamen = await ejecutarCruceNominaChecador(cfdis, checador, {
        empresaNombre: 'Corporativo Ark S.A. de C.V.',
        empresaRfc: 'CAR200101AB1',
      });

      expect(dictamen.totalColaboradoresAuditados).toBe(5);
      expect(dictamen.colaboradoresConDiscrepancia).toBeGreaterThanOrEqual(4);
      expect(dictamen.nivelRiesgoGlobal).toBe('CRITICO'); // debido a Sofía sin checador
      expect(dictamen.scoreConsistencia).toBeLessThan(50);
      expect(dictamen.selloSha256).toBeDefined();
    });
  });

  describe('generarCsvDiscrepancias y plantillas', () => {
    it('genera un CSV con BOM UTF-8 y encabezados correctos', async () => {
      const cfdis = parsearLoteXmlsNomina(muestra.xmls);
      const checador = parsearCsvChecador(muestra.csvChecador);
      const dictamen = await ejecutarCruceNominaChecador(cfdis, checador);

      const csv = generarCsvDiscrepancias(dictamen);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('RFC,Nombre Colaborador');
      expect(csv).toContain('HEGR850101AB1');
    });

    it('genera la plantilla de checador descargable con BOM UTF-8', () => {
      const plantilla = generarPlantillaChecadorCSV();
      expect(plantilla.startsWith('\uFEFF')).toBe(true);
      expect(plantilla).toContain('rfc,nombre,fecha,horas_trabajadas,horas_extras');
    });
  });
});

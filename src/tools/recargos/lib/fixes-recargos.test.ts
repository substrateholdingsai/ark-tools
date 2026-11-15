import { describe, it, expect } from 'vitest';
import {
  calcularRecargosYActualizacion,
  validarEntradaRecargos,
  generarFolioDeIntegridad,
} from './calcularRecargos';

describe('Recargos — Fixes 1, 3, 5 y validación (light audit)', () => {
  describe('Fix 1 — Folio de Integridad (no vacío SHA-256)', () => {
    it('genera folio determinista derivado del payload, nunca el hash de cadena vacía', () => {
      const r = calcularRecargosYActualizacion({
        importeHistorico: 45000,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2026-02-17',
      });
      expect(r.folioDeIntegridad).toMatch(/^REC-[0-9a-f]{8}$/);
      expect(r.folioDeIntegridad).not.toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
      expect(r.folioDeIntegridad).not.toContain('e3b0c442');
    });

    it('el folio cambia si cambia cualquier entrada', () => {
      const base = calcularRecargosYActualizacion({
        importeHistorico: 45000,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2026-02-17',
      });
      const otroImporte = calcularRecargosYActualizacion({
        importeHistorico: 45001,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2026-02-17',
      });
      const otraFecha = calcularRecargosYActualizacion({
        importeHistorico: 45000,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2026-02-18',
      });
      expect(base.folioDeIntegridad).not.toBe(otroImporte.folioDeIntegridad);
      expect(base.folioDeIntegridad).not.toBe(otraFecha.folioDeIntegridad);
    });

    it('generarFolioDeIntegridad es determinista y sensible a la entrada', () => {
      const a = generarFolioDeIntegridad({
        importeHistorico: 1000,
        fechaVencimiento: '2025-01-01',
        fechaPago: '2025-02-01',
        factorActualizacion: 1.0,
        mesesMora: 1,
        tasaRecargosTotal: 1.47,
        montoRecargos: 10,
        totalPagar: 1010,
      });
      const b = generarFolioDeIntegridad({
        importeHistorico: 1000,
        fechaVencimiento: '2025-01-01',
        fechaPago: '2025-02-01',
        factorActualizacion: 1.0,
        mesesMora: 1,
        tasaRecargosTotal: 1.47,
        montoRecargos: 10,
        totalPagar: 1010,
      });
      const c = generarFolioDeIntegridad({
        importeHistorico: 2000,
        fechaVencimiento: '2025-01-01',
        fechaPago: '2025-02-01',
        factorActualizacion: 1.0,
        mesesMora: 1,
        tasaRecargosTotal: 1.47,
        montoRecargos: 10,
        totalPagar: 1010,
      });
      expect(a).toBe(b);
      expect(a).not.toBe(c);
      expect(a).toMatch(/^REC-[0-9a-f]{8}$/);
    });
  });

  describe('Vector dorado sin cambios (8 meses, sin tope)', () => {
    it('mantiene resultados exactos y sin tope ni advertencias', () => {
      const r = calcularRecargosYActualizacion({
        importeHistorico: 45000,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2026-02-17',
      });
      expect(r.mesesMora).toBe(8);
      expect(r.mesesCobrados).toBe(8);
      expect(r.recargosCapped).toBe(false);
      expect(r.tasaRecargosTotal).toBe(11.76);
      expect(r.montoRecargos).toBe(5425.36);
      expect(r.totalPagar).toBe(51559.36);
      expect(r.impuestoActualizado).toBe(46134);
      expect(r.desgloseMeses).toHaveLength(8);
      expect(r.advertencias).toEqual([]);
      expect(r.factorActualizacion).toBe(1.0252);
    });
  });

  describe('Fix 3 — Tope de 60 meses / 88.2% (Art. 21 CFF)', () => {
    it('60 meses → tasa 88.2%, sin tope activado, desglose de 60', () => {
      const r = calcularRecargosYActualizacion({
        importeHistorico: 100000,
        fechaVencimiento: '2021-06-17',
        fechaPago: '2026-06-17',
      });
      expect(r.mesesMora).toBe(60);
      expect(r.mesesCobrados).toBe(60);
      expect(r.recargosCapped).toBe(false);
      expect(r.tasaRecargosTotal).toBe(88.2);
      expect(r.desgloseMeses).toHaveLength(60);
      expect(r.advertencias.some((a) => a.includes('Tope de recargos'))).toBe(false);
      const ultimo = r.desgloseMeses[r.desgloseMeses.length - 1]!;
      expect(ultimo.tasaAcumulada).toBe(88.2);
      expect(ultimo.recargoAcumulado).toBeCloseTo(r.impuestoActualizado * 0.882, 2);
    });

    it('61 meses → se queda en 88.2%, advertencia presente, desglose topeado a 60', () => {
      const r = calcularRecargosYActualizacion({
        importeHistorico: 100000,
        fechaVencimiento: '2021-06-17',
        fechaPago: '2026-07-17',
      });
      expect(r.mesesMora).toBe(61);
      expect(r.mesesCobrados).toBe(60);
      expect(r.recargosCapped).toBe(true);
      expect(r.tasaRecargosTotal).toBe(88.2);
      expect(r.desgloseMeses).toHaveLength(60);
      expect(r.advertencias.some((a) => a.includes('Tope de recargos Art. 21 CFF'))).toBe(true);
      expect(r.advertencias.some((a) => a.includes('60 meses'))).toBe(true);
      // El tope limita la tasa al 88.2% sobre la base actualizada de este caso
      expect(r.tasaRecargosTotal).toBe(88.2);
      expect(r.montoRecargos).toBeCloseTo(Math.round(r.impuestoActualizado * 0.882 * 100) / 100, 2);
      expect(r.desgloseMeses[r.desgloseMeses.length - 1]!.tasaAcumulada).toBe(88.2);
    });
  });

  describe('Fix 5 — Fallback explícito de INPC antiguo (denominador)', () => {
    it('mes anterior al vencimiento fuera del catálogo → nota y advertencia, sin silencio', () => {
      // Vencimiento Ene 2021 → mes anterior Dic 2020, ausente del catálogo (inicia Ene 2021)
      const r = calcularRecargosYActualizacion({
        importeHistorico: 10000,
        fechaVencimiento: '2021-01-17',
        fechaPago: '2021-02-17',
      });
      expect(r.factorDetalle.inpcAntiguo).toBe(110.129);
      const notaAntiguo = r.factorDetalle.notaPublicacionAntiguo;
      expect(notaAntiguo).toBeDefined();
      expect(notaAntiguo!).toContain('2020');
      expect(r.advertencias.some((a) => a.includes('no disponible en el catálogo DOF'))).toBe(true);
      expect(r.factorActualizacion).toBe(1.0);
    });
  });

  describe('Validación de entrada (Preview / IA)', () => {
    it('entrada válida no produce errores', () => {
      const v = validarEntradaRecargos({
        importeHistorico: 45000,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2026-02-17',
      });
      expect(v.ok).toBe(true);
      expect(v.errores).toEqual([]);
    });

    it('importe faltante → error', () => {
      expect(
        validarEntradaRecargos({ fechaVencimiento: '2025-06-17', fechaPago: '2026-02-17' })
      ).toEqual({
        ok: false,
        errores: ["'importeHistorico' debe ser un número mayor a 0."],
      });
    });

    it('importe 0 y negativo → error', () => {
      expect(
        validarEntradaRecargos({
          importeHistorico: 0,
          fechaVencimiento: '2025-06-17',
          fechaPago: '2026-02-17',
        }).ok
      ).toBe(false);
      expect(
        validarEntradaRecargos({
          importeHistorico: -500,
          fechaVencimiento: '2025-06-17',
          fechaPago: '2026-02-17',
        }).ok
      ).toBe(false);
    });

    it('fechaVencimiento o fechaPago faltante → error', () => {
      expect(validarEntradaRecargos({ importeHistorico: 1000, fechaPago: '2026-02-17' }).ok).toBe(
        false
      );
      expect(
        validarEntradaRecargos({ importeHistorico: 1000, fechaVencimiento: '2025-06-17' }).ok
      ).toBe(false);
    });

    it('fechaPago antes de fechaVencimiento → error', () => {
      const v = validarEntradaRecargos({
        importeHistorico: 1000,
        fechaVencimiento: '2025-06-17',
        fechaPago: '2025-06-10',
      });
      expect(v.ok).toBe(false);
      expect(v.errores.some((e) => e.includes('fechaPago'))).toBe(true);
    });

    it('fecha con formato inválido → error', () => {
      const v = validarEntradaRecargos({
        importeHistorico: 1000,
        fechaVencimiento: 'not-a-date',
        fechaPago: '2026-02-17',
      });
      expect(v.ok).toBe(false);
      expect(v.errores.some((e) => e.includes('fechaVencimiento')));
    });
  });
});

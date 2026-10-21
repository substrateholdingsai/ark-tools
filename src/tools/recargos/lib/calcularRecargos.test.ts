import { describe, it, expect } from 'vitest';
import {
  truncarDiezmilesimo,
  obtenerFactorActualizacion,
  calcularMesesMora,
  calcularRecargosYActualizacion,
  obtenerMesAnterior,
} from './calcularRecargos';

describe('Motor Matemático de Actualización y Recargos (Art. 17-A y 21 CFF)', () => {
  describe('truncarDiezmilesimo', () => {
    it('trunca estrictamente a 4 decimales sin redondear hacia arriba', () => {
      expect(truncarDiezmilesimo(1.03459)).toBe(1.0345);
      expect(truncarDiezmilesimo(1.03451)).toBe(1.0345);
      expect(truncarDiezmilesimo(1.099999)).toBe(1.0999);
      expect(truncarDiezmilesimo(1.0)).toBe(1.0);
    });
  });

  describe('obtenerMesAnterior', () => {
    it('obtiene el mes anterior en el mismo año', () => {
      expect(obtenerMesAnterior(2025, 5)).toEqual({ anio: 2025, mes: 4 });
    });

    it('retrocede al mes 12 del año anterior cuando es enero', () => {
      expect(obtenerMesAnterior(2025, 1)).toEqual({ anio: 2024, mes: 12 });
    });
  });

  describe('obtenerFactorActualizacion (Art. 17-A CFF)', () => {
    it('aplica factor 1.0000 si el pago se efectúa en el mismo mes de vencimiento', () => {
      const res = obtenerFactorActualizacion('2024-05-17', '2024-05-20');
      expect(res.factorFinal).toBe(1.0);
      expect(res.factorTruncado).toBe(1.0);
    });

    it('aplica factor 1.0000 si el pago es anticipado o en fecha previa', () => {
      const res = obtenerFactorActualizacion('2024-05-17', '2024-04-10');
      expect(res.factorFinal).toBe(1.0);
    });

    it('divide INPC mes anterior al pago entre INPC mes anterior al vencimiento y trunca a 4 decimales', () => {
      // Vencimiento: Mayo 2024 -> Mes anterior al adeudo: Abril 2024 (INPC: 134.400)
      // Pago: Agosto 2024 -> Mes anterior al pago: Julio 2024 (INPC: 136.079)
      // Cociente: 136.079 / 134.400 = 1.01249255952...
      // Truncado a 4 decimales = 1.0124
      const res = obtenerFactorActualizacion('2024-05-17', '2024-08-10');
      expect(res.inpcAntiguo).toBe(134.4);
      expect(res.periodoInpcAntiguo).toBe('Abril 2024');
      expect(res.inpcReciente).toBe(136.079);
      expect(res.periodoInpcReciente).toBe('Julio 2024');
      expect(res.factorTruncado).toBe(1.0124);
      expect(res.factorFinal).toBe(1.0124);
      expect(res.esDeflacion).toBe(false);
    });

    it('protege contra deflación aplicando factor 1.0000 cuando el cociente sea menor a 1 (Art. 17-A párr. 6)', () => {
      // Si por alguna razón histórica hubiese deflación (por ejemplo mayo 2024 INPC 134.148 vs abril 2024 INPC 134.400)
      // Vencimiento: Mayo 2024 (denom = Abril 2024 = 134.400)
      // Pago: Junio 2024 (num = Mayo 2024 = 134.148)
      // 134.148 / 134.400 = 0.998125
      const res = obtenerFactorActualizacion('2024-05-17', '2024-06-10');
      expect(res.cociente).toBeLessThan(1.0);
      expect(res.factorTruncado).toBeLessThan(1.0);
      expect(res.esDeflacion).toBe(true);
      expect(res.factorFinal).toBe(1.0);
    });

    it('aplica el último INPC oficial publicado si el mes más reciente aún no está publicado (Art. 17-A penúltimo párr.)', () => {
      // Simulando fecha de pago a finales de 2026 o posterior
      const res = obtenerFactorActualizacion('2024-01-17', '2026-12-15');
      expect(res.factorFinal).toBeGreaterThan(1.0);
      if (res.notaPublicacion) {
        expect(res.notaPublicacion).toContain('Art. 17-A CFF penúltimo párrafo');
      }
    });
  });

  describe('calcularMesesMora (Art. 21 CFF & LIF)', () => {
    it('retorna 0 meses si el pago se efectúa en o antes de la fecha límite', () => {
      expect(calcularMesesMora('2024-05-17', '2024-05-17')).toBe(0);
      expect(calcularMesesMora('2024-05-17', '2024-05-10')).toBe(0);
    });

    it('computa 1 mes de recargos si se paga 1 día después del vencimiento (fracción de mes)', () => {
      // Vence 17 mayo, paga 18 mayo -> 1 fracción de mes = 1 mes
      expect(calcularMesesMora('2024-05-17', '2024-05-18')).toBe(1);
    });

    it('computa exactamente 1 mes si se paga el mismo día del mes siguiente', () => {
      // Vence 17 mayo, paga 17 junio -> exactamente 1 mes
      expect(calcularMesesMora('2024-05-17', '2024-06-17')).toBe(1);
    });

    it('computa 2 meses si se paga el día 18 del mes siguiente (1 mes + fracción)', () => {
      // Vence 17 mayo, paga 18 junio -> 2 meses
      expect(calcularMesesMora('2024-05-17', '2024-06-18')).toBe(2);
    });

    it('computa correctamente mora a través de años', () => {
      // Vence 17 mayo 2024, paga 20 mayo 2025 -> 12 meses + 1 fracción = 13 meses
      expect(calcularMesesMora('2024-05-17', '2025-05-20')).toBe(13);
    });
  });

  describe('calcularRecargosYActualizacion', () => {
    it('calcula la liquidación fiscal con certeza jurídica conforme al CFF', () => {
      const entrada = {
        importeHistorico: 50000,
        fechaVencimiento: '2024-05-17',
        fechaPago: '2024-08-20',
        tasaRecargosMensual: 1.47,
      };

      const resultado = calcularRecargosYActualizacion(entrada);

      expect(resultado.importeHistorico).toBe(50000);
      // Denominador: Abril 2024 (134.400), Numerador: Julio 2024 (136.079)
      // Factor truncado = 1.0124
      expect(resultado.factorActualizacion).toBe(1.0124);
      // Impuesto actualizado: 50000 * 1.0124 = 50620
      expect(resultado.impuestoActualizado).toBe(50620);
      expect(resultado.montoActualizacion).toBe(620);

      // Meses de mora: Mayo 17 a Agosto 20 -> 3 meses + fracción = 4 meses
      expect(resultado.mesesMora).toBe(4);
      // Tasa recargos: 4 * 1.47 = 5.88%
      expect(resultado.tasaRecargosTotal).toBe(5.88);

      // Recargos sobre base actualizada: 50620 * 0.0588 = 2976.456 -> 2976.46
      expect(resultado.montoRecargos).toBe(2976.46);

      // Total a pagar: 50620 + 2976.46 = 53596.46
      expect(resultado.totalPagar).toBe(53596.46);

      // Importe en letra
      expect(resultado.totalEnLetras).toContain('CINCUENTA Y TRES MIL QUINIENTOS NOVENTA Y SEIS');
      expect(resultado.totalEnLetras).toContain('46/100 M.N.');

      // Desglose analítico
      expect(resultado.desgloseMeses).toHaveLength(4);
      expect(resultado.desgloseMeses[0]!.periodo).toBe('Junio 2024');
      expect(resultado.desgloseMeses[0]!.tasaMensual).toBe(1.47);
      expect(resultado.desgloseMeses[3]!.tasaAcumulada).toBe(5.88);
    });

    it('maneja pago oportuno sin mora ni inflación adicional', () => {
      const entrada = {
        importeHistorico: 20000,
        fechaVencimiento: '2025-03-17',
        fechaPago: '2025-03-15',
      };

      const resultado = calcularRecargosYActualizacion(entrada);

      expect(resultado.factorActualizacion).toBe(1.0);
      expect(resultado.impuestoActualizado).toBe(20000);
      expect(resultado.montoActualizacion).toBe(0);
      expect(resultado.mesesMora).toBe(0);
      expect(resultado.tasaRecargosTotal).toBe(0);
      expect(resultado.montoRecargos).toBe(0);
      expect(resultado.totalPagar).toBe(20000);
      expect(resultado.desgloseMeses).toHaveLength(0);
    });
  });
});

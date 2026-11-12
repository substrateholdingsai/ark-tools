import { describe, it, expect } from 'vitest';
import {
  PARAMETROS_FISCAL_DEFAULT,
  PRESETS_ACTIVOS_FISCALES,
  obtenerReglasFiscalesActivo,
  compararLeasingFiscal,
  estimarRentaLeasingSugerida,
  PARAMETROS_DEFAULT,
  proyectarMeses,
  calcularResumenLeasing,
  formatearMXN,
} from './calcularLeasing';

describe('Simulador Fiscal: Arrendamiento Puro (Leasing) vs Crédito vs Contado', () => {
  describe('obtenerReglasFiscalesActivo (Topes LISR Art. 28, 34 y 36)', () => {
    it('aplica tope MOI de $175,000 y renta de $200/día para automóvil de combustión', () => {
      const reglas = obtenerReglasFiscalesActivo('auto_combustion');
      expect(reglas.topeMoi).toBe(175_000);
      expect(reglas.topeRentaDiaria).toBe(200);
      expect(reglas.topeRentaMensual).toBeCloseTo(6083.33, 2);
      expect(reglas.tasaDepreciacionAnual).toBe(0.25);
    });

    it('aplica tope MOI de $250,000 y renta de $285/día para automóvil híbrido o eléctrico', () => {
      const reglas = obtenerReglasFiscalesActivo('auto_hibrido');
      expect(reglas.topeMoi).toBe(250_000);
      expect(reglas.topeRentaDiaria).toBe(285);
      expect(reglas.topeRentaMensual).toBeCloseTo(8668.75, 2);
      expect(reglas.tasaDepreciacionAnual).toBe(0.25);
    });

    it('no aplica tope MOI ni de renta para equipo de cómputo (30% depreciación anual)', () => {
      const reglas = obtenerReglasFiscalesActivo('equipo_computo');
      expect(reglas.topeMoi).toBeNull();
      expect(reglas.topeRentaDiaria).toBeNull();
      expect(reglas.tasaDepreciacionAnual).toBe(0.3);
    });

    it('no aplica tope MOI ni de renta para maquinaria industrial (10% depreciación anual)', () => {
      const reglas = obtenerReglasFiscalesActivo('maquinaria');
      expect(reglas.topeMoi).toBeNull();
      expect(reglas.topeRentaDiaria).toBeNull();
      expect(reglas.tasaDepreciacionAnual).toBe(0.1);
    });
  });

  describe('compararLeasingFiscal — Automóvil de Combustión ($450,000 a 36 meses)', () => {
    it('demuestra mayor deducción fiscal en Leasing frente al tope de $175,000 en Compra', () => {
      const res = compararLeasingFiscal(PARAMETROS_FISCAL_DEFAULT);

      // En 36 meses (3 años), un auto de $450k comprado de contado solo deduce el 75% de $175,000 = $131,250
      expect(res.contado.deduccionFiscalTotalPlazo).toBe(131_250);
      expect(res.contado.proporcionDeduciblePorcentaje).toBeCloseTo(38.89, 2);

      // En Leasing, deduce $6,083.33 * 36 = $218,999.88 + comisión proporcional + residual
      expect(res.leasing.deduccionFiscalTotalPlazo).toBeGreaterThan(219_000);
      expect(res.ventajaFiscalLeasingVsContado).toBeGreaterThan(35_000);

      // Liquidez inicial: Leasing requiere mucho menor desembolso inicial que Contado o Crédito
      expect(res.mejorOpcionLiquidezInicial).toBe('leasing');
      expect(res.leasing.desembolsoInicialSinIva).toBe(9_000); // 2% de $450,000
      expect(res.contado.desembolsoInicialSinIva).toBe(450_000);
    });

    it('calcula correctamente la proporción de IVA acreditable conforme al Art. 5 Fracc. I LIVA', () => {
      const res = compararLeasingFiscal(PARAMETROS_FISCAL_DEFAULT);
      // IVA total de $450,000 al 16% = $72,000, pero solo 175/450 (38.8889%) es acreditable = $28,000
      expect(res.contado.totalIvaAcreditable).toBeCloseTo(28_000, 0);
      // El resto ($44,000) se vuelve costo no acreditable sumado al total erogado
      expect(res.contado.totalErogadoSinIva).toBeCloseTo(494_000, 0);
    });
  });

  describe('compararLeasingFiscal — Automóvil Híbrido / Eléctrico ($850,000 a 36 meses)', () => {
    it('aplica el tope ecológico de $250,000 MOI y $285 diarios en renta', () => {
      const presetHibrido = PRESETS_ACTIVOS_FISCALES.find((p) => p.id === 'auto_hibrido_ev')!;
      const res = compararLeasingFiscal(presetHibrido.parametros);

      // 3 años al 25% de $250,000 = $187,500
      expect(res.contado.deduccionFiscalTotalPlazo).toBe(187_500);
      // En Leasing: $8,668.75 * 36 = $312,075 + apertura + residual
      expect(res.leasing.deduccionFiscalTotalPlazo).toBeGreaterThan(312_000);
      expect(res.mejorOpcionDeduccion).toBe('leasing');
    });
  });

  describe('compararLeasingFiscal — Equipo de Cómputo y Maquinaria (Sin Tope)', () => {
    it('deduce el 100% de la renta en equipo de cómputo y maquinaria', () => {
      const presetComputo = PRESETS_ACTIVOS_FISCALES.find((p) => p.id === 'equipo_computo')!;
      const resComputo = compararLeasingFiscal(presetComputo.parametros);

      expect(resComputo.leasing.proporcionDeduciblePorcentaje).toBe(100);
      // En 24 meses al 30% anual, compra solo deprecia 60% ($144,000), mientras leasing deduce el 100% de las rentas ($254,400 + comisión)
      expect(resComputo.contado.deduccionFiscalTotalPlazo).toBe(144_000);
      expect(resComputo.leasing.deduccionFiscalTotalPlazo).toBeGreaterThan(250_000);

      const presetMaquinaria = PRESETS_ACTIVOS_FISCALES.find(
        (p) => p.id === 'maquinaria_industrial'
      )!;
      const resMaquinaria = compararLeasingFiscal(presetMaquinaria.parametros);
      // En 48 meses (4 años) al 10% anual, compra solo deprecia el 40% ($600,000)
      expect(resMaquinaria.contado.deduccionFiscalTotalPlazo).toBe(600_000);
      expect(resMaquinaria.leasing.deduccionFiscalTotalPlazo).toBeGreaterThan(1_600_000);
    });
  });

  describe('Opciones terminales CFF Art. 15 y configuración de PTU', () => {
    it('omite el pago residual cuando la opción terminal es renovación o devolución', () => {
      const resDevolucion = compararLeasingFiscal({
        ...PARAMETROS_FISCAL_DEFAULT,
        opcionTerminal: 'devolucion',
      });
      expect(resDevolucion.leasing.pagoTerminalSinIva).toBe(0);

      const resCompra = compararLeasingFiscal({
        ...PARAMETROS_FISCAL_DEFAULT,
        opcionTerminal: 'compra_residual',
        valorResidualPorcentaje: 15,
      });
      expect(resCompra.leasing.pagoTerminalSinIva).toBe(67_500);
    });

    it('desactiva el ahorro de PTU cuando incluirPtu es false', () => {
      const sinPtu = compararLeasingFiscal({
        ...PARAMETROS_FISCAL_DEFAULT,
        incluirPtu: false,
      });
      expect(sinPtu.contado.ahorroPtuPlazo).toBe(0);
      expect(sinPtu.credito.ahorroPtuPlazo).toBe(0);
      expect(sinPtu.leasing.ahorroPtuPlazo).toBe(0);
    });

    it('genera el desglose de flujo anual por cada año del plazo', () => {
      const res = compararLeasingFiscal({
        ...PARAMETROS_FISCAL_DEFAULT,
        plazoMeses: 36,
      });
      expect(res.flujoAnual).toHaveLength(3);
      expect(res.flujoAnual[0]?.anio).toBe(1);
      expect(res.flujoAnual[2]?.anio).toBe(3);
    });
  });

  describe('estimarRentaLeasingSugerida & Compatibilidad Legacy', () => {
    it('estima una renta mensual financiera coherente', () => {
      const renta = estimarRentaLeasingSugerida(450_000, 36, 15, 14);
      expect(renta).toBeGreaterThan(11_000);
      expect(renta).toBeLessThan(16_000);
    });

    it('mantiene operativas las funciones legacy para conectores StayPuft', () => {
      const proyeccion = proyectarMeses(PARAMETROS_DEFAULT);
      const resumen = calcularResumenLeasing(PARAMETROS_DEFAULT, proyeccion);
      expect(proyeccion).toHaveLength(12);
      expect(resumen.mrrFinal).toBeGreaterThan(0);
      expect(formatearMXN(175000)).toContain('175,000');
    });
  });
});

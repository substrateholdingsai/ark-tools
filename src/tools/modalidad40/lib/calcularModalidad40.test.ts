import { describe, it, expect } from 'vitest';
import {
  evaluarLimitesModalidad40,
  calcularInversionModalidad40,
  calcularPensionLey73,
  analizarRoi,
  simularModalidad40,
  buscarPorcentajesArt167,
  obtenerFactorEdad,
  calcularAniosExcedentes,
  VALORES_OFICIALES_M40,
} from './calcularModalidad40';

describe('Motor Matemático de Modalidad 40 (Ley 73 + DOF 21/10/2026)', () => {
  it('aplica la restricción de Último SBC + 1 UMA según el Acuerdo DOF 21/10/2026', () => {
    const ultimoSbc = 600.0;
    const uma = VALORES_OFICIALES_M40.UMA_DIARIA; // 117.31
    const limiteEsperado = Math.round((ultimoSbc + uma) * 100) / 100; // 717.31

    // Si el usuario solicita el tope de 25 UMAs ($2,932.75)
    const evaluacion = evaluarLimitesModalidad40(ultimoSbc, VALORES_OFICIALES_M40.TOPE_25_UMA);

    expect(evaluacion.limitePermitidoDof2026).toBe(limiteEsperado);
    expect(evaluacion.sbcEfectivo).toBe(limiteEsperado);
    expect(evaluacion.excedeLimiteDof).toBe(true);
    expect(evaluacion.diferenciaConTopeHistorico).toBe(
      Math.round((VALORES_OFICIALES_M40.TOPE_25_UMA - limiteEsperado) * 100) / 100
    );
    expect(evaluacion.mensajeCriterio).toContain('Acuerdo ACDO.AS2.HCT.101026/302.P.DG');
  });

  it('permite cotizar sin advertencia si el salario deseado no excede el nuevo límite', () => {
    const ultimoSbc = 800.0;
    const sbcDeseado = 850.0; // Menor que 800 + 117.31 = 917.31

    const evaluacion = evaluarLimitesModalidad40(ultimoSbc, sbcDeseado);

    expect(evaluacion.excedeLimiteDof).toBe(false);
    expect(evaluacion.sbcEfectivo).toBe(850.0);
    expect(evaluacion.mensajeCriterio).toContain('dentro del límite permitido');
  });

  it('respeta el tope general de 25 UMAs si último SBC + 1 UMA supera las 25 UMAs', () => {
    const ultimoSbc = 2900.0; // Cerca del tope
    const evaluacion = evaluarLimitesModalidad40(ultimoSbc, 3000.0);

    expect(evaluacion.limitePermitidoDof2026).toBe(VALORES_OFICIALES_M40.TOPE_25_UMA);
    expect(evaluacion.sbcEfectivo).toBe(VALORES_OFICIALES_M40.TOPE_25_UMA);
  });

  it('garantiza que el SBC efectivo nunca sea menor al Salario Mínimo General', () => {
    const evaluacion = evaluarLimitesModalidad40(200.0, 250.0);

    expect(evaluacion.sbcEfectivo).toBe(VALORES_OFICIALES_M40.SMG_DIARIO);
  });

  it('calcula la cuota mensual de Modalidad 40 con la tasa oficial de 2026 (14.438%)', () => {
    const sbc = 1000.0;
    const meses = 24;
    const inversion = calcularInversionModalidad40(sbc, meses);

    // 1000 * 30.4 * 0.14438 = 4389.15
    const cuotaEsperada = Math.round(1000 * 30.4 * 0.14438 * 100) / 100;

    expect(inversion.tasaCuotaPct).toBe(14.438);
    expect(inversion.cuotaMensual).toBe(cuotaEsperada);
    expect(inversion.inversionTotal).toBe(Math.round(cuotaEsperada * meses * 100) / 100);
    expect(inversion.cronograma).toHaveLength(24);
    expect(inversion.cronograma[0]?.mes).toBe(1);
    expect(inversion.cronograma[23]?.mes).toBe(24);
  });

  it('mapea correctamente los rangos de la tabla del Artículo 167 LSS', () => {
    // 1.0 veces SMG
    const r1 = buscarPorcentajesArt167(1.0);
    expect(r1.pctCuantiaBasica).toBe(80.0);
    expect(r1.pctIncrementoAnual).toBe(0.563);

    // Más de 6.01 veces SMG
    const rMax = buscarPorcentajesArt167(7.5);
    expect(rMax.pctCuantiaBasica).toBe(13.0);
    expect(rMax.pctIncrementoAnual).toBe(2.45);
  });

  it('aplica las reglas de semanas excedentes y semestre de gracia', () => {
    expect(calcularAniosExcedentes(500)).toBe(0);
    expect(calcularAniosExcedentes(510)).toBe(0); // <13 semanas restantes
    expect(calcularAniosExcedentes(515)).toBe(0.5); // 15 semanas -> +0.5 años
    expect(calcularAniosExcedentes(530)).toBe(1.0); // 30 semanas -> +1.0 año
    expect(calcularAniosExcedentes(604)).toBe(2.0); // 104 semanas = exactamente 2 años
  });

  it('aplica el factor por edad según el Art. 171 LSS', () => {
    expect(obtenerFactorEdad(60)).toBe(0.75);
    expect(obtenerFactorEdad(61)).toBe(0.8);
    expect(obtenerFactorEdad(62)).toBe(0.85);
    expect(obtenerFactorEdad(63)).toBe(0.9);
    expect(obtenerFactorEdad(64)).toBe(0.95);
    expect(obtenerFactorEdad(65)).toBe(1.0);
    expect(obtenerFactorEdad(68)).toBe(1.0);
  });

  it('calcula la pensión Ley 73 con Asignación Familiar (+15%) y Factor Fox (+11%)', () => {
    const ultimoSbc = 500;
    const sbcM40 = 617.31;
    const semanasPrevias = 1200;
    const mesesM40 = 24;
    const edad = 65; // 100%
    const asignacion = true; // +15%

    const res = calcularPensionLey73(ultimoSbc, sbcM40, semanasPrevias, mesesM40, edad, asignacion);

    expect(res.semanasTotales).toBeGreaterThan(1200);
    expect(res.factorEdadPct).toBe(100);
    expect(res.importeAsignacionFamiliar).toBeGreaterThan(0);
    expect(res.importeDecretoFox).toBeGreaterThan(0);
    expect(res.pensionMensualEstimada).toBeGreaterThan(5000);
    expect(res.aguinaldoAnual).toBe(res.pensionMensualEstimada);
  });

  it('calcula el retorno de inversión (ROI) determinista', () => {
    const pensionConM40 = 25000;
    const ultimoSbc = 400;
    const semanasPrevias = 1000;
    const edad = 65;
    const asignacion = true;
    const inversionTotal = 120000;

    const roi = analizarRoi(
      pensionConM40,
      ultimoSbc,
      semanasPrevias,
      edad,
      asignacion,
      inversionTotal
    );

    expect(roi.incrementoMensualPension).toBeGreaterThan(0);
    expect(roi.mesesRecuperacionRoi).toBeGreaterThan(0);
    expect(roi.tiempoRecuperacionFormateado).toMatch(/mes|año/);
  });

  it('ejecuta la simulación integral y genera un sello criptográfico SHA-256 válido', async () => {
    const resultado = await simularModalidad40({
      ultimoSbc: 500,
      sbcDeseado: 2500, // Forzará el límite
      semanasPrevias: 1100,
      mesesAportacion: 36,
      edadJubilacion: 62,
      asignacionFamiliar: true,
    });

    expect(resultado.limites.excedeLimiteDof).toBe(true);
    expect(resultado.selloSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(resultado.pension.pensionMensualEstimada).toBeGreaterThan(0);
    expect(resultado.roi.mesesRecuperacionRoi).toBeGreaterThan(0);
  });
});

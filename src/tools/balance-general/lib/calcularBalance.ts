import type {
  AnalisisCuenta,
  CuentaBalance,
  JerarquiaBalance,
  ResultadoAnalisis,
  TotalesBalance,
} from '../types';

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const sumNivel = (items: CuentaBalance[]): number =>
  items.reduce((acc, c) => {
    const hijos = c.children && c.children.length > 0 ? sumNivel(c.children) : 0;
    const base = c.montoActual || 0;
    if (hijos > 0 && Math.abs(hijos - base) > 0.01) {
      return acc + hijos;
    }
    return acc + base;
  }, 0);

export function calcularTotales(jerarquia: JerarquiaBalance): TotalesBalance {
  const ta = round2(sumNivel(jerarquia.activoCorriente) + sumNivel(jerarquia.activoNoCorriente));
  const tp = round2(sumNivel(jerarquia.pasivoCorriente) + sumNivel(jerarquia.pasivoNoCorriente));
  const tpat = round2(sumNivel(jerarquia.patrimonio));
  const tpp = round2(tp + tpat);
  const dif = round2(ta - tpp);
  return {
    totalActivo: ta,
    totalPasivo: tp,
    totalPatrimonio: tpat,
    totalPasivoPatrimonio: tpp,
    diferencia: dif,
    cuadrado: Math.abs(dif) < 0.02,
  };
}

export function analizarBalance(
  jerarquia: JerarquiaBalance,
  totales: TotalesBalance
): ResultadoAnalisis {
  const cuentas: AnalisisCuenta[] = [];

  const procesar = (arr: CuentaBalance[], baseTotal: number) => {
    for (const c of arr) {
      const ma = Number(c.montoActual) || 0;
      const man =
        c.montoAnterior === null || c.montoAnterior === undefined
          ? null
          : Number(c.montoAnterior) || 0;
      let vaAbs: number | null = null;
      let vaPct: number | null = null;
      if (man !== null && Math.abs(man) > 1e-9) {
        vaAbs = round2(ma - man);
        vaPct = round2((vaAbs / Math.abs(man)) * 100);
      } else if (man === 0 && ma !== 0) {
        vaAbs = round2(ma);
        vaPct = null;
      } else {
        vaAbs = man === null ? null : round2(ma - man);
        vaPct = null;
      }
      const avA = baseTotal > 1e-9 ? round2((ma / baseTotal) * 100) : null;
      const avAn = baseTotal > 1e-9 && man !== null ? round2((man / baseTotal) * 100) : null;

      cuentas.push({
        id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        montoActual: round2(ma),
        montoAnterior: man,
        variacionAbsoluta: vaAbs,
        variacionPorcentual: vaPct,
        analisisVerticalActual: avA,
        analisisVerticalAnterior: avAn,
        tipo: c.tipo,
      });
      if (c.children && c.children.length > 0) {
        procesar(c.children, baseTotal);
      }
    }
  };

  procesar(jerarquia.activoCorriente, totales.totalActivo);
  procesar(jerarquia.activoNoCorriente, totales.totalActivo);
  procesar(jerarquia.pasivoCorriente, totales.totalPasivoPatrimonio);
  procesar(jerarquia.pasivoNoCorriente, totales.totalPasivoPatrimonio);
  procesar(jerarquia.patrimonio, totales.totalPasivoPatrimonio);

  return { cuentas, totales };
}

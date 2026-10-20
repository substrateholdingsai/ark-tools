import type { BalanzaFilaCSV, CuentaBalance, JerarquiaBalance, ParserResult } from '../types';

const toNum = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0;
  const s = String(v)
    .replace(/[^0-9.,-]/g, '')
    .replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const genId = (codigo: string, idx: number) =>
  `${codigo || 'cta'}-${idx}-${Date.now().toString(36)}`;

export function parseBalanzaFilas(filas: BalanzaFilaCSV[]): ParserResult {
  const cuentas: CuentaBalance[] = [];
  const errores: string[] = [];
  const advertencias: string[] = [];

  filas.forEach((f, idx) => {
    const codigo = String(f.codigo ?? f.cuenta ?? `SIN-COD-${idx + 1}`).trim();
    const nombre = String(f.nombre ?? f.cuenta ?? codigo).trim();
    const ma = toNum(f.montoActual ?? f.saldoActual ?? f.ejercicioActual ?? f.debe ?? 0);
    const man = toNum(f.montoAnterior ?? f.saldoAnterior ?? f.ejercicioAnterior ?? f.haber ?? 0);
    const nat = String(f.naturaleza ?? '').toLowerCase();
    const naturaleza = nat.includes('acre') ? 'acreedora' : 'deudora';

    let tipo: CuentaBalance['tipo'] = 'otro';
    const rubro = String(f.rubro ?? f.tipo ?? '').toLowerCase();
    if (rubro.includes('activo') && rubro.includes('corr')) tipo = 'activo_corriente';
    else if (rubro.includes('activo') && rubro.includes('no')) tipo = 'activo_no_corriente';
    else if (rubro.includes('pasivo') && rubro.includes('corr')) tipo = 'pasivo_corriente';
    else if (rubro.includes('pasivo') && rubro.includes('no')) tipo = 'pasivo_no_corriente';
    else if (rubro.includes('patrim') || rubro.includes('capital')) tipo = 'patrimonio';

    cuentas.push({
      id: genId(codigo, idx),
      codigo,
      nombre,
      naturaleza,
      montoActual: ma,
      montoAnterior: man || null,
      nivel: 1,
      padreId: null,
      tipo,
      expandido: true,
    });
  });

  const jerarquia: JerarquiaBalance = {
    activoCorriente: cuentas.filter((c) => c.tipo === 'activo_corriente'),
    activoNoCorriente: cuentas.filter((c) => c.tipo === 'activo_no_corriente'),
    pasivoCorriente: cuentas.filter((c) => c.tipo === 'pasivo_corriente'),
    pasivoNoCorriente: cuentas.filter((c) => c.tipo === 'pasivo_no_corriente'),
    patrimonio: cuentas.filter((c) => c.tipo === 'patrimonio'),
    otros: cuentas.filter((c) => c.tipo === 'otro'),
  };

  if (jerarquia.otros && jerarquia.otros.length) {
    advertencias.push(`${jerarquia.otros.length} cuentas sin rubro asignado (quedan en "Otros").`);
  }

  return { jerarquia, cuentasPlanas: cuentas, errores, advertencias };
}

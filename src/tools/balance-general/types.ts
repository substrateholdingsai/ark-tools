export type Naturaleza = 'deudora' | 'acreedora';
export type TipoBalance =
  | 'activo_corriente'
  | 'activo_no_corriente'
  | 'pasivo_corriente'
  | 'pasivo_no_corriente'
  | 'patrimonio'
  | 'resultado'
  | 'otro';

export interface CuentaBalanceBase {
  id: string;
  codigo: string;
  nombre: string;
  naturaleza: Naturaleza;
  montoActual: number;
  montoAnterior?: number | null;
  nivel: number;
  padreId?: string | null;
  tipo: TipoBalance;
  expandido?: boolean;
}

export interface CuentaBalance extends CuentaBalanceBase {
  children?: CuentaBalance[];
}

export interface JerarquiaBalance {
  activoCorriente: CuentaBalance[];
  activoNoCorriente: CuentaBalance[];
  pasivoCorriente: CuentaBalance[];
  pasivoNoCorriente: CuentaBalance[];
  patrimonio: CuentaBalance[];
  otros?: CuentaBalance[];
}

export interface TotalesBalance {
  totalActivo: number;
  totalPasivo: number;
  totalPatrimonio: number;
  totalPasivoPatrimonio: number;
  diferencia: number;
  cuadrado: boolean;
}

export interface AnalisisCuenta {
  id: string;
  codigo: string;
  nombre: string;
  montoActual: number;
  montoAnterior: number | null;
  variacionAbsoluta: number | null;
  variacionPorcentual: number | null;
  analisisVerticalActual: number | null;
  analisisVerticalAnterior: number | null;
  tipo: TipoBalance;
}

export interface ResultadoAnalisis {
  cuentas: AnalisisCuenta[];
  totales: TotalesBalance;
}

export interface BalanzaFilaCSV {
  codigo?: string | number;
  cuenta?: string;
  nombre?: string;
  saldoDeudor?: string | number;
  saldoAcreedor?: string | number;
  debe?: string | number;
  haber?: string | number;
  saldoActual?: string | number;
  saldoAnterior?: string | number;
  montoActual?: string | number;
  montoAnterior?: string | number;
  ejercicioActual?: string | number;
  ejercicioAnterior?: string | number;
  naturaleza?: string;
  tipo?: string;
  rubro?: string;
}

export interface ParserResult {
  jerarquia: JerarquiaBalance;
  cuentasPlanas: CuentaBalance[];
  errores: string[];
  advertencias: string[];
}

import { formatearFactor, formatearMXN } from '../lib/calcularSBC';
import { CONSTANTES_IMSS } from '../data/uma';
import type { ParametrosSBC, ResultadoSBC } from '../types';

interface DesgloseTableProps {
  parametros: ParametrosSBC;
  resultado: ResultadoSBC;
}

export function DesgloseTable({ parametros, resultado }: DesgloseTableProps) {
  const { desglose, factor } = resultado;
  return (
    <div
      className="rounded-[20px] border border-line bg-surface p-5 md:p-6"
      data-testid="desglose-sbc"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Desglose del factor
        </h3>
        <span className="font-mono text-[10px] text-muted">LSS Art. 27</span>
      </div>

      <div className="space-y-2.5">
        <Renglon label="Base" valor={1.0} detalle="Salario diario" color="navy" />
        <Renglon
          label="Vacaciones"
          valor={desglose.aporteVacaciones}
          detalle={`${parametros.diasVacaciones}d × ${parametros.primaVacacional}% ÷ 365`}
          color="gold"
        />
        <Renglon
          label="Aguinaldo"
          valor={desglose.aporteAguinaldo}
          detalle={`${parametros.diasAguinaldo}d ÷ 365`}
          color="navy"
        />

        <div className="my-3 h-px bg-line" />

        <div className="flex items-center justify-between gap-3 rounded-[12px] bg-navy p-3.5 text-white">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
              Factor de integración
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-white/50">
              1 + {formatearFactor(desglose.aporteVacaciones)} +{' '}
              {formatearFactor(desglose.aporteAguinaldo)}
            </div>
          </div>
          <div className="font-orbitron text-[20px] font-black tabular-nums tracking-tight">
            {formatearFactor(factor)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] border border-line bg-surface-2 p-3">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <div className="text-muted">Días prima</div>
            <div className="mt-0.5 font-orbitron font-bold tabular-nums text-navy">
              {desglose.diasPrimaVacacional.toFixed(2)} días
            </div>
          </div>
          <div>
            <div className="text-muted">Integración anual</div>
            <div className="mt-0.5 font-orbitron font-bold tabular-nums text-navy">
              {desglose.diasIntegracion.toFixed(2)} días
            </div>
          </div>
          <div>
            <div className="text-muted">SBC bruto</div>
            <div className="mt-0.5 font-orbitron font-bold tabular-nums text-navy">
              {formatearMXN(resultado.sbcBruto)}
            </div>
          </div>
          <div>
            <div className="text-muted">Tope 25 UMA (DOF)</div>
            <div
              className="mt-0.5 font-orbitron font-bold tabular-nums text-navy"
              data-testid="uma-tope-display"
            >
              {formatearMXN(CONSTANTES_IMSS.umaDiaria)} × 25 ={' '}
              {formatearMXN(CONSTANTES_IMSS.topePesos)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RenglonProps {
  label: string;
  valor: number;
  detalle: string;
  color: 'navy' | 'gold';
}

function Renglon({ label, valor, detalle, color }: RenglonProps) {
  const colorClasses = { navy: 'text-navy', gold: 'text-gold-dark' };
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div
          className={`font-orbitron text-[12px] font-bold uppercase tracking-[0.14em] ${colorClasses[color]}`}
        >
          {label}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-muted">{detalle}</div>
      </div>
      <div
        className={`shrink-0 font-orbitron text-[16px] font-bold tabular-nums ${colorClasses[color]}`}
      >
        +{formatearFactor(valor)}
      </div>
    </div>
  );
}

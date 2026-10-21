import { Scale, TrendingUp, Info, CheckCircle2 } from 'lucide-react';
import type { ResultadoRecargos } from '../types';

interface Props {
  resultado: ResultadoRecargos;
}

export function DesgloseActualizacionTable({ resultado }: Props) {
  const { factorDetalle, desgloseMeses } = resultado;

  return (
    <div className="space-y-6">
      {/* ─── 1. DETERMINACIÓN DEL FACTOR DE ACTUALIZACIÓN (ART. 17-A CFF) ─── */}
      <div className="rounded-[24px] border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              FUNDAMENTO TÉCNICO · ART. 17-A CFF
            </span>
            <h3 className="mt-0.5 font-playfair text-lg font-black text-navy">
              Cálculo del Factor de Actualización Inflacionaria
            </h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={13} />
            <span>Factor Truncado a 4 Decimales</span>
          </div>
        </div>

        {/* Ecuación visual de INPC */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Numerador */}
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-center">
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
              INPC Numerador (Mes Anterior al Pago)
            </span>
            <div className="my-1.5 font-playfair text-2xl font-black text-navy">
              {factorDetalle.inpcReciente.toFixed(3)}
            </div>
            <span className="shadow-xs inline-block rounded bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
              {factorDetalle.periodoInpcReciente}
            </span>
          </div>

          {/* Denominador */}
          <div className="rounded-xl border border-line bg-surface-2 p-4 text-center">
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
              INPC Denominador (Mes Anterior Adeudo)
            </span>
            <div className="my-1.5 font-playfair text-2xl font-black text-navy">
              {factorDetalle.inpcAntiguo.toFixed(3)}
            </div>
            <span className="shadow-xs inline-block rounded bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
              {factorDetalle.periodoInpcAntiguo}
            </span>
          </div>

          {/* Factor Resultante */}
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-center">
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-gold-dark">
              Factor Aplicado (Truncado Art. 17-A)
            </span>
            <div className="my-1.5 font-playfair text-2xl font-black text-navy">
              {resultado.factorActualizacion.toFixed(4)}
            </div>
            <span className="shadow-xs inline-block rounded bg-navy px-2 py-0.5 font-mono text-[11px] font-bold text-white">
              {factorDetalle.esDeflacion
                ? 'Deflación protegida (=1.0)'
                : `Cociente: ${factorDetalle.cociente.toFixed(6)}`}
            </span>
          </div>
        </div>

        {/* Nota legal sobre INPC provisional / no publicado */}
        {factorDetalle.notaPublicacion && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs leading-relaxed text-blue-900">
            <Info size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <span>{factorDetalle.notaPublicacion}</span>
          </div>
        )}

        {/* Resumen monetario de actualización */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-xs">
          <div className="flex items-center gap-2">
            <Scale size={15} className="text-navy" />
            <span className="text-muted">Efecto Inflacionario Determinado:</span>
            <strong className="font-mono text-sm text-navy">
              +${resultado.montoActualizacion.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
              MXN
            </strong>
          </div>
          <div className="text-muted">
            Impuesto Actualizado:{' '}
            <strong className="font-mono text-sm text-navy">
              ${resultado.impuestoActualizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
              MXN
            </strong>
          </div>
        </div>
      </div>

      {/* ─── 2. TABLA MES A MES DE RECARGOS POR MORA (ART. 21 CFF) ─── */}
      <div className="rounded-[24px] border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              TABLA AUDITABLE MES A MES
            </span>
            <h3 className="mt-0.5 font-playfair text-lg font-black text-navy">
              Devengación de Recargos por Mora (Art. 21 CFF & LIF Art. 8)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted">
            <TrendingUp size={14} className="text-gold-dark" />
            <span>
              {resultado.mesesMora} meses transcurridos ({resultado.tasaRecargosTotal}% acumulado)
            </span>
          </div>
        </div>

        {desgloseMeses.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No se generaron meses de mora. El pago se encuentra en tiempo o dentro de la fecha
            límite legal.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left font-inter text-xs">
              <thead>
                <tr className="border-b border-line font-orbitron text-[10px] uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-2 font-bold">Mes #</th>
                  <th className="px-3 pb-3 font-bold">Periodo Cómputo</th>
                  <th className="px-3 pb-3 text-right font-bold">Tasa Mes</th>
                  <th className="px-3 pb-3 text-right font-bold">Tasa Acum.</th>
                  <th className="px-3 pb-3 text-right font-bold">Base Actualizada</th>
                  <th className="px-3 pb-3 text-right font-bold">Recargo Mes</th>
                  <th className="pb-3 pl-3 text-right font-bold">Recargo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {desgloseMeses.map((fila) => (
                  <tr key={fila.numero} className="transition hover:bg-surface-2/60">
                    <td className="py-2.5 pr-2 font-mono font-bold text-muted">{fila.numero}</td>
                    <td className="px-3 py-2.5 font-medium text-navy">{fila.periodo}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted">
                      {fila.tasaMensual}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-navy">
                      {fila.tasaAcumulada}%
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted">
                      ${fila.baseCalculo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted">
                      +${fila.recargoMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono font-bold text-navy">
                      ${fila.recargoAcumulado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy bg-surface-2 font-bold text-navy">
                  <td colSpan={2} className="px-3 py-3 uppercase tracking-wider">
                    Total Recargos por Mora ({resultado.mesesMora} meses)
                  </td>
                  <td className="px-3 py-3 text-right font-mono">1.47%</td>
                  <td className="px-3 py-3 text-right font-mono text-gold-dark">
                    {resultado.tasaRecargosTotal}%
                  </td>
                  <td className="px-3 py-3 text-right font-mono">
                    $
                    {resultado.impuestoActualizado.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-muted">—</td>
                  <td className="py-3 pl-3 text-right font-mono text-sm text-navy">
                    ${resultado.montoRecargos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

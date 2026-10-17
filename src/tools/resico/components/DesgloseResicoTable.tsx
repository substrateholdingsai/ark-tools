import { Info } from 'lucide-react';
import type { ResultadoResico } from '../types';

interface Props {
  resultado: ResultadoResico;
}

export function DesgloseResicoTable({ resultado }: Props) {
  return (
    <div className="rounded-[24px] border border-line bg-surface p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark block">
            ANÁLISIS CONCEPTUAL
          </span>
          <h3 className="font-playfair text-lg font-black text-navy mt-0.5">
            Cédula Analítica de Liquidación
          </h3>
        </div>
        <span className="text-xs text-muted font-mono">
          {resultado.desglose.length} renglones evaluados
        </span>
      </div>

      {/* Tabla detallada */}
      <div className="overflow-x-auto rounded-[16px] border border-line">
        <table className="w-full text-left text-xs font-inter">
          <thead className="bg-canvas border-b border-line text-muted uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-3.5">Concepto</th>
              <th className="py-3 px-3.5 text-right">Base Gravable</th>
              <th className="py-3 px-3.5 text-center">Tasa</th>
              <th className="py-3 px-3.5 text-right">Importe</th>
              <th className="py-3 px-3.5 text-left">Fundamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {resultado.desglose.map((item, idx) => {
              const esDeduccion = item.naturaleza === 'deduccion' || item.naturaleza === 'a_favor';
              const esTotal = item.concepto.startsWith('(=)');

              return (
                <tr
                  key={idx}
                  className={`transition-colors hover:bg-canvas/50 ${
                    esTotal ? 'bg-gold/5 font-bold text-navy' : ''
                  }`}
                >
                  <td className="py-2.5 px-3.5 font-medium text-navy">
                    {item.concepto}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-muted">
                    {item.base > 0 ? `$${item.base.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono text-muted">
                    {item.tasaPct > 0 ? `${item.tasaPct.toFixed(2)}%` : '-'}
                  </td>
                  <td
                    className={`py-2.5 px-3.5 text-right font-mono font-bold ${
                      esTotal
                        ? 'text-navy text-sm'
                        : esDeduccion
                        ? 'text-emerald-700'
                        : 'text-navy'
                    }`}
                  >
                    {item.importe !== 0 ? (
                      <>
                        {item.importe < 0 ? '-' : ''}$
                        {Math.abs(item.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </>
                    ) : (
                      '$0.00'
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-[11px] text-muted italic">
                    {item.fundamento}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Advertencias y Notas del Auditor */}
      {resultado.advertencias.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-line">
          <span className="text-xs font-bold uppercase tracking-wider text-muted font-inter block">
            Notas de Auditoría y Dictamen Legal
          </span>
          {resultado.advertencias.map((adv, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-[14px] border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-900 leading-relaxed font-inter"
            >
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{adv}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

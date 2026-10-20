import { Info } from 'lucide-react';
import type { ResultadoResico } from '../types';

interface Props {
  resultado: ResultadoResico;
}

export function DesgloseResicoTable({ resultado }: Props) {
  return (
    <div className="space-y-5 rounded-[24px] border border-line bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
            ANÁLISIS CONCEPTUAL
          </span>
          <h3 className="mt-0.5 font-playfair text-lg font-black text-navy">
            Cédula Analítica de Liquidación
          </h3>
        </div>
        <span className="font-mono text-xs text-muted">
          {resultado.desglose.length} renglones evaluados
        </span>
      </div>

      {/* Tabla detallada */}
      <div className="overflow-x-auto rounded-[16px] border border-line">
        <table className="w-full text-left font-inter text-xs">
          <thead className="bg-canvas border-b border-line text-[10px] font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3.5 py-3">Concepto</th>
              <th className="px-3.5 py-3 text-right">Base Gravable</th>
              <th className="px-3.5 py-3 text-center">Tasa</th>
              <th className="px-3.5 py-3 text-right">Importe</th>
              <th className="px-3.5 py-3 text-left">Fundamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {resultado.desglose.map((item, idx) => {
              const esDeduccion = item.naturaleza === 'deduccion' || item.naturaleza === 'a_favor';
              const esTotal = item.concepto.startsWith('(=)');

              return (
                <tr
                  key={idx}
                  className={`hover:bg-canvas/50 transition-colors ${
                    esTotal ? 'bg-gold/5 font-bold text-navy' : ''
                  }`}
                >
                  <td className="px-3.5 py-2.5 font-medium text-navy">{item.concepto}</td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-muted">
                    {item.base > 0
                      ? `$${item.base.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-mono text-muted">
                    {item.tasaPct > 0 ? `${item.tasaPct.toFixed(2)}%` : '-'}
                  </td>
                  <td
                    className={`px-3.5 py-2.5 text-right font-mono font-bold ${
                      esTotal ? 'text-sm text-navy' : esDeduccion ? 'text-emerald-700' : 'text-navy'
                    }`}
                  >
                    {item.importe !== 0 ? (
                      <>
                        {item.importe < 0 ? '-' : ''}$
                        {Math.abs(item.importe).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      '$0.00'
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-[11px] italic text-muted">{item.fundamento}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Advertencias y Notas del Auditor */}
      {resultado.advertencias.length > 0 && (
        <div className="space-y-2 border-t border-line pt-2">
          <span className="block font-inter text-xs font-bold uppercase tracking-wider text-muted">
            Notas de Auditoría y Dictamen Legal
          </span>
          {resultado.advertencias.map((adv, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-[14px] border border-amber-200 bg-amber-50/50 p-3 font-inter text-xs leading-relaxed text-amber-900"
            >
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <span>{adv}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

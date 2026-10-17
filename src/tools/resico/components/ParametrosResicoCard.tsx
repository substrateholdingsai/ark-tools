import { User, Building2, Calendar, Calculator, Percent } from 'lucide-react';
import type { EntradaResicoPF, EntradaResicoPM, TipoPersonaResico, MesFiscal } from '../types';
import { NOMBRES_MESES } from '../data/tablasResico';

interface Props {
  tipoPersona: TipoPersonaResico;
  onTipoPersonaChange: (tipo: TipoPersonaResico) => void;
  entradaPF: EntradaResicoPF;
  onEntradaPFChange: (entrada: EntradaResicoPF) => void;
  entradaPM: EntradaResicoPM;
  onEntradaPMChange: (entrada: EntradaResicoPM) => void;
}

export function ParametrosResicoCard({
  tipoPersona,
  onTipoPersonaChange,
  entradaPF,
  onEntradaPFChange,
  entradaPM,
  onEntradaPMChange,
}: Props) {
  const meses: MesFiscal[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="rounded-[24px] border border-line bg-surface p-6 shadow-sm space-y-6">
      {/* 1. Selector de Régimen: Persona Física vs Persona Moral */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2 font-inter">
          Modalidad de Contribuyente
        </label>
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-canvas rounded-[16px] border border-line">
          <button
            type="button"
            onClick={() => onTipoPersonaChange('fisica')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[12px] text-xs font-bold transition-all ${
              tipoPersona === 'fisica'
                ? 'bg-navy text-white shadow-sm'
                : 'text-muted hover:text-navy hover:bg-surface'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Persona Física (113-E)</span>
          </button>
          <button
            type="button"
            onClick={() => onTipoPersonaChange('moral')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[12px] text-xs font-bold transition-all ${
              tipoPersona === 'moral'
                ? 'bg-navy text-white shadow-sm'
                : 'text-muted hover:text-navy hover:bg-surface'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Persona Moral (206)</span>
          </button>
        </div>
      </div>

      {/* 2. Selector de Período y Ejercicio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 font-inter">
            Mes a Declarar
          </label>
          <div className="relative">
            <select
              value={tipoPersona === 'fisica' ? entradaPF.mes : entradaPM.mes}
              onChange={(e) => {
                const mes = Number(e.target.value) as MesFiscal;
                if (tipoPersona === 'fisica') {
                  onEntradaPFChange({ ...entradaPF, mes });
                } else {
                  onEntradaPMChange({ ...entradaPM, mes });
                }
              }}
              className="w-full rounded-[14px] border border-line bg-surface px-3 py-2.5 text-sm font-medium text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            >
              {meses.map((m) => (
                <option key={m} value={m}>
                  {NOMBRES_MESES[m]}
                </option>
              ))}
            </select>
            <Calendar className="w-4 h-4 text-muted absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 font-inter">
            Ejercicio Fiscal
          </label>
          <input
            type="number"
            disabled
            value={tipoPersona === 'fisica' ? entradaPF.ejercicio : entradaPM.ejercicio}
            className="w-full rounded-[14px] border border-line bg-canvas px-3 py-2.5 text-sm font-medium text-muted cursor-not-allowed"
          />
        </div>
      </div>

      {/* 3. Formulario para Persona Física */}
      {tipoPersona === 'fisica' ? (
        <div className="space-y-4 pt-2 border-t border-line">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-navy font-inter">
                Ingresos Cobrados del Mes (sin IVA) *
              </label>
              <span className="text-[11px] text-muted font-mono">CFDI cobrados</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entradaPF.ingresosCobradosMes || ''}
                onChange={(e) =>
                  onEntradaPFChange({
                    ...entradaPF,
                    ingresosCobradosMes: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="w-full rounded-[14px] border border-line bg-surface pl-8 pr-3 py-2.5 text-sm font-bold text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <p className="text-[11px] text-muted mt-1">
              Base gravable directa para la tarifa mensual del 1% al 2.5% (Art. 113-E LISR).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-navy font-inter">
                Ingresos Acumulados Previos (Ene a Mes-1)
              </label>
              <span className="text-[11px] text-muted font-mono">Tope $3.5M</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entradaPF.ingresosAcumuladosPrevios || ''}
                onChange={(e) =>
                  onEntradaPFChange({
                    ...entradaPF,
                    ingresosAcumuladosPrevios: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="w-full rounded-[14px] border border-line bg-surface pl-8 pr-3 py-2.5 text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          {/* Retención 1.25% Persona Moral */}
          <div className="rounded-[16px] border border-line/80 bg-canvas/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-gold-dark" />
                <span className="text-xs font-bold text-navy font-inter">
                  Retención ISR Personas Morales (1.25%)
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onEntradaPFChange({
                    ...entradaPF,
                    autoCalcularRetencionPM: !entradaPF.autoCalcularRetencionPM,
                  })
                }
                className="text-[11px] text-gold-dark hover:underline font-semibold"
              >
                {entradaPF.autoCalcularRetencionPM ? 'Ingresar manual' : 'Auto-calcular 1.25%'}
              </button>
            </div>

            {entradaPF.autoCalcularRetencionPM ? (
              <div>
                <label className="text-[11px] text-muted block mb-1">
                  Monto facturado a Personas Morales en el mes:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entradaPF.ingresosFacturadosPM || ''}
                    onChange={(e) => {
                      const facturado = parseFloat(e.target.value) || 0;
                      onEntradaPFChange({
                        ...entradaPF,
                        ingresosFacturadosPM: facturado,
                        retencionISREfectuadaPM: Math.round(facturado * 0.0125 * 100) / 100,
                      });
                    }}
                    placeholder="0.00"
                    className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-muted mt-1">
                  Retención calculada (1.25%): ${((entradaPF.ingresosFacturadosPM || 0) * 0.0125).toFixed(2)} MXN
                </p>
              </div>
            ) : (
              <div>
                <label className="text-[11px] text-muted block mb-1">
                  Importe de retención según constancia/CFDI:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entradaPF.retencionISREfectuadaPM || ''}
                    onChange={(e) =>
                      onEntradaPFChange({
                        ...entradaPF,
                        retencionISREfectuadaPM: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* IVA */}
          <div className="pt-2 border-t border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy font-inter">
                Liquidación de IVA del Mes
              </span>
              <button
                type="button"
                onClick={() => {
                  const cobradoSugerido = Math.round(entradaPF.ingresosCobradosMes * 0.16 * 100) / 100;
                  onEntradaPFChange({ ...entradaPF, ivaCobrado: cobradoSugerido });
                }}
                className="text-[10px] font-semibold text-gold-dark hover:underline flex items-center gap-1"
                title="Sugerir 16% sobre ingresos cobrados"
              >
                <Calculator className="w-3 h-3" /> Sugerir 16%
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted block mb-1">
                  IVA Trasladado Cobrado (16%)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entradaPF.ivaCobrado || ''}
                    onChange={(e) =>
                      onEntradaPFChange({
                        ...entradaPF,
                        ivaCobrado: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted block mb-1">
                  IVA Acreditable Pagado (Gastos)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entradaPF.ivaAcreditablePagado || ''}
                    onChange={(e) =>
                      onEntradaPFChange({
                        ...entradaPF,
                        ivaAcreditablePagado: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted block mb-1">
                Retención de IVA efectuada por PM (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entradaPF.retencionIVAEfectuadaPM || ''}
                  onChange={(e) =>
                    onEntradaPFChange({
                      ...entradaPF,
                      retencionIVAEfectuadaPM: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 4. Formulario para Persona Moral (Flujo de Efectivo) */
        <div className="space-y-4 pt-2 border-t border-line">
          <div>
            <label className="text-xs font-semibold text-navy block mb-1.5 font-inter">
              Ingresos Acumulados Cobrados en el Ejercicio *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entradaPM.ingresosCobradosAcumulados || ''}
                onChange={(e) =>
                  onEntradaPMChange({
                    ...entradaPM,
                    ingresosCobradosAcumulados: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="w-full rounded-[14px] border border-line bg-surface pl-8 pr-3 py-2.5 text-sm font-bold text-navy focus:border-gold focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-muted mt-1">
              Ingresos efectivamente percibidos acumulados desde enero hasta el mes de pago (Art. 207 LISR).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-navy block mb-1.5 font-inter">
              Deducciones Autorizadas Acumuladas Pagadas *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entradaPM.deduccionesAutorizadasAcumuladas || ''}
                onChange={(e) =>
                  onEntradaPMChange({
                    ...entradaPM,
                    deduccionesAutorizadasAcumuladas: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                className="w-full rounded-[14px] border border-line bg-surface pl-8 pr-3 py-2.5 text-sm font-bold text-navy focus:border-gold focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-muted mt-1">
              Gastos e inversiones deducibles pagados en efectivo, cheque o transferencia (Art. 208 LISR).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted block mb-1">
                PTU Pagada en el Ejercicio
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entradaPM.ptuPagada || ''}
                  onChange={(e) =>
                    onEntradaPMChange({
                      ...entradaPM,
                      ptuPagada: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted block mb-1">
                Pérdidas Fiscales Anteriores
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entradaPM.perdidasFiscalesPendientes || ''}
                  onChange={(e) =>
                    onEntradaPMChange({
                      ...entradaPM,
                      perdidasFiscalesPendientes: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted block mb-1">
                Pagos Provisionales Previos de ISR
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entradaPM.pagosProvisionalesPrevios || ''}
                  onChange={(e) =>
                    onEntradaPMChange({
                      ...entradaPM,
                      pagosProvisionalesPrevios: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-muted block mb-1">
                Retenciones de ISR Acumuladas
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entradaPM.retencionesISRAcumuladas || ''}
                  onChange={(e) =>
                    onEntradaPMChange({
                      ...entradaPM,
                      retencionesISRAcumuladas: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* IVA PM */}
          <div className="pt-2 border-t border-line space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-navy font-inter block">
              Liquidación de IVA del Mes
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted block mb-1">IVA Cobrado del Mes</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entradaPM.ivaCobrado || ''}
                    onChange={(e) =>
                      onEntradaPMChange({
                        ...entradaPM,
                        ivaCobrado: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted block mb-1">IVA Acreditable del Mes</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-muted">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entradaPM.ivaAcreditablePagado || ''}
                    onChange={(e) =>
                      onEntradaPMChange({
                        ...entradaPM,
                        ivaAcreditablePagado: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full rounded-[12px] border border-line bg-surface pl-7 pr-3 py-1.5 text-xs font-medium text-navy focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

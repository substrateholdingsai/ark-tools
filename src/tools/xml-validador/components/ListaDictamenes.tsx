/**
 * ARK TOOLS — Validador de XMLs CFDI
 * Componente: Lista Interactiva de Dictámenes de Auditoría
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  FileCheck,
  Scale,
} from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import type { DictamenCFDI, EstatusDictamen } from '../types';

interface ListaDictamenesProps {
  dictamenes: DictamenCFDI[];
  onEliminarDictamen: (id: string) => void;
  onCopiarTexto?: (texto: string) => void;
}

export const ListaDictamenes: React.FC<ListaDictamenesProps> = ({
  dictamenes,
  onEliminarDictamen,
  onCopiarTexto,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<'TODOS' | EstatusDictamen>('TODOS');
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopiarUUID = (uuid: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(uuid);
    setCopiadoId(id);
    if (onCopiarTexto) onCopiarTexto('UUID copiado al portapapeles');
    setTimeout(() => setCopiadoId(null), 2000);
  };

  const dictamenesFiltrados = useMemo(() => {
    return dictamenes.filter((d) => {
      if (filtroEstatus !== 'TODOS' && d.estatusGeneral !== filtroEstatus) {
        return false;
      }
      if (!busqueda.trim()) return true;
      const term = busqueda.toLowerCase().trim();
      return (
        d.uuid.toLowerCase().includes(term) ||
        d.rfcEmisor.toLowerCase().includes(term) ||
        d.nombreEmisor.toLowerCase().includes(term) ||
        d.rfcReceptor.toLowerCase().includes(term) ||
        d.nombreReceptor.toLowerCase().includes(term) ||
        d.fileName.toLowerCase().includes(term)
      );
    });
  }, [dictamenes, filtroEstatus, busqueda]);

  const getEstatusBadge = (estatus: EstatusDictamen) => {
    switch (estatus) {
      case 'aprobado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            100% Válido
          </span>
        );
      case 'advertencia':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Observaciones
          </span>
        );
      case 'rechazado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-500/30">
            <XCircle className="h-3 w-3 text-red-400" />
            No Deducible / Error
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por RFC, Razón Social, UUID o archivo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-white/10 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {(
            [
              { id: 'TODOS', label: 'Todos' },
              { id: 'aprobado', label: 'Aprobados' },
              { id: 'advertencia', label: 'Observaciones' },
              { id: 'rechazado', label: 'Con Errores' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroEstatus(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filtroEstatus === f.id
                  ? 'bg-gold text-navy font-bold shadow-sm'
                  : 'bg-surface hover:bg-surface-raised text-muted hover:text-ink border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span>
          Mostrando <strong className="text-ink">{dictamenesFiltrados.length}</strong> de{' '}
          <strong className="text-ink">{dictamenes.length}</strong> comprobantes auditados
        </span>
      </div>

      {/* Lista de Comprobantes con Auditoría */}
      <div className="space-y-3">
        {dictamenesFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface-raised/40 p-12 text-center text-muted">
            <FileCheck className="mx-auto h-8 w-8 text-muted/40 mb-2" />
            <p className="font-medium">No se encontraron comprobantes con el criterio seleccionado</p>
          </div>
        ) : (
          dictamenesFiltrados.map((d) => {
            const isExpanded = !!expandidos[d.id];

            return (
              <div
                key={d.id}
                className="rounded-2xl border border-white/10 bg-surface-raised/50 overflow-hidden transition-all hover:border-gold/30"
              >
                {/* Cabecera del Item */}
                <div
                  onClick={() => toggleExpand(d.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    <ScoreGauge score={d.score} size="md" showLabel={false} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-ink">{d.fileName}</span>
                        {getEstatusBadge(d.estatusGeneral)}
                        <span className="text-[10px] text-gold font-mono font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                          CFDI {d.version}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted">
                        <span className="flex items-center gap-1 font-mono">
                          UUID:{' '}
                          <span className="text-ink font-semibold">
                            {d.uuid.length > 18 ? `${d.uuid.slice(0, 14)}...` : d.uuid}
                          </span>
                          <button
                            onClick={(e) => handleCopiarUUID(d.uuid, d.id, e)}
                            className="text-muted hover:text-gold p-0.5 rounded transition-colors"
                            title="Copiar UUID"
                          >
                            {copiadoId === d.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </span>
                        <span>•</span>
                        <span>
                          Emisor: <strong className="text-ink font-mono">{d.rfcEmisor}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Receptor: <strong className="text-ink font-mono">{d.rfcReceptor}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones y Chevron */}
                  <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-muted block">
                        Total Facturado
                      </span>
                      <span className="font-mono text-sm font-bold text-gold">
                        ${d.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarDictamen(d.id);
                      }}
                      className="p-1.5 rounded-lg text-muted/60 hover:text-red-400 transition-colors"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="p-1 text-muted">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Detalle Desplegable de Reglas */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-surface/80 p-5 space-y-4 animate-fadeIn">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-gold" />
                      Auditoría Normativa del SAT (Anexo 20)
                    </h4>

                    <div className="space-y-2">
                      {d.reglas.map((regla, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                            regla.severidad === 'exito'
                              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                              : regla.severidad === 'advertencia'
                              ? 'bg-amber-950/25 border-amber-500/30 text-amber-200'
                              : 'bg-red-950/30 border-red-500/40 text-red-200'
                          }`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {regla.severidad === 'exito' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : regla.severidad === 'advertencia' ? (
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold opacity-75">
                                [{regla.codigo}]
                              </span>
                              <span className="font-semibold text-ink">{regla.titulo}</span>
                            </div>
                            <p className="text-[11px] opacity-90 leading-relaxed">
                              {regla.descripcion}
                            </p>
                            {regla.fundamentoLegal && (
                              <span className="inline-block text-[10px] font-medium text-gold/80 italic mt-1">
                                Fundamento legal: {regla.fundamentoLegal}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

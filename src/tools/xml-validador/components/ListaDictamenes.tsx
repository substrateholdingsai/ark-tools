/**
 * ARK LEDGER — Validador de XMLs CFDI
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
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            100% Válido
          </span>
        );
      case 'advertencia':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/60 px-2.5 py-1 text-[10px] font-bold text-amber-300">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Observaciones
          </span>
        );
      case 'rechazado':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-950/60 px-2.5 py-1 text-[10px] font-bold text-red-300">
            <XCircle className="h-3 w-3 text-red-400" />
            No Deducible / Error
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por RFC, Razón Social, UUID o archivo..."
            className="bg-surface-raised w-full rounded-xl border border-white/10 py-2.5 pl-10 pr-4 text-xs text-ink transition-colors placeholder:text-muted/60 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
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
              className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
                filtroEstatus === f.id
                  ? 'bg-gold font-bold text-navy shadow-sm'
                  : 'hover:bg-surface-raised border border-white/5 bg-surface text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-xs text-muted">
        <span>
          Mostrando <strong className="text-ink">{dictamenesFiltrados.length}</strong> de{' '}
          <strong className="text-ink">{dictamenes.length}</strong> comprobantes auditados
        </span>
      </div>

      {/* Lista de Comprobantes con Auditoría */}
      <div className="space-y-3">
        {dictamenesFiltrados.length === 0 ? (
          <div className="bg-surface-raised/40 rounded-2xl border border-white/10 p-12 text-center text-muted">
            <FileCheck className="mx-auto mb-2 h-8 w-8 text-muted/40" />
            <p className="font-medium">
              No se encontraron comprobantes con el criterio seleccionado
            </p>
          </div>
        ) : (
          dictamenesFiltrados.map((d) => {
            const isExpanded = !!expandidos[d.id];

            return (
              <div
                key={d.id}
                className="bg-surface-raised/50 overflow-hidden rounded-2xl border border-white/10 transition-all hover:border-gold/30"
              >
                {/* Cabecera del Item */}
                <div
                  onClick={() => toggleExpand(d.id)}
                  className="flex cursor-pointer select-none flex-col justify-between gap-4 p-4 md:flex-row md:items-center md:p-5"
                >
                  <div className="flex items-center gap-4">
                    <ScoreGauge score={d.score} size="md" showLabel={false} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{d.fileName}</span>
                        {getEstatusBadge(d.estatusGeneral)}
                        <span className="rounded border border-gold/20 bg-gold/10 px-2 py-0.5 font-mono text-[10px] font-bold text-gold">
                          CFDI {d.version}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1 font-mono">
                          UUID:{' '}
                          <span className="font-semibold text-ink">
                            {d.uuid.length > 18 ? `${d.uuid.slice(0, 14)}...` : d.uuid}
                          </span>
                          <button
                            onClick={(e) => handleCopiarUUID(d.uuid, d.id, e)}
                            className="rounded p-0.5 text-muted transition-colors hover:text-gold"
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
                          Emisor: <strong className="font-mono text-ink">{d.rfcEmisor}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Receptor: <strong className="font-mono text-ink">{d.rfcReceptor}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones y Chevron */}
                  <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 md:justify-end md:border-t-0 md:pt-0">
                    <div className="text-right">
                      <span className="block text-[10px] uppercase tracking-wider text-muted">
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
                      className="rounded-lg p-1.5 text-muted/60 transition-colors hover:text-red-400"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="p-1 text-muted">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalle Desplegable de Reglas */}
                {isExpanded && (
                  <div className="animate-fadeIn space-y-4 border-t border-white/10 bg-surface/80 p-5">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                      <Scale className="h-3.5 w-3.5 text-gold" />
                      Auditoría Normativa del SAT (Anexo 20)
                    </h4>

                    <div className="space-y-2">
                      {d.reglas.map((regla, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 rounded-xl border p-3 text-xs ${
                            regla.severidad === 'exito'
                              ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200'
                              : regla.severidad === 'advertencia'
                                ? 'border-amber-500/30 bg-amber-950/25 text-amber-200'
                                : 'border-red-500/40 bg-red-950/30 text-red-200'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
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
                            <p className="text-[11px] leading-relaxed opacity-90">
                              {regla.descripcion}
                            </p>
                            {regla.fundamentoLegal && (
                              <span className="mt-1 inline-block text-[10px] font-medium italic text-gold/80">
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

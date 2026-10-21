/**
 * ARK TOOLS — Herramienta #16: Motor de Conciliación Anexo 24
 * TablaConciliacion: Muestra el cuadre interactivo
 * Concepto CFDI ➡️ Código Agrupador Anexo 24 ➡️ Importe
 */

import { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Ban,
  FileText,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type { ResultadoConciliacion } from '../types';

interface TablaConciliacionProps {
  resultado: ResultadoConciliacion;
}

type TabVista = 'polizas' | 'partidas' | 'cfdis' | 'descartadas';

const fmtMoneda = (val: number) =>
  `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function TablaConciliacion({ resultado }: TablaConciliacionProps) {
  const [tabActiva, setTabActiva] = useState<TabVista>('polizas');
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  const polizasFiltradas = useMemo(() => {
    return resultado.polizas.filter((p) => {
      const matchTexto =
        !busqueda ||
        p.cfdiUuid.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.cfdiFolio.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.rfcReceptor.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.nombreReceptor.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.concepto.toLowerCase().includes(busqueda.toLowerCase());

      const matchTipo =
        filtroTipo === 'TODOS' ||
        (filtroTipo === 'CUADRADAS' && p.cuadrada) ||
        (filtroTipo === 'CON_RETENCION' &&
          p.partidas.some((x) => x.tipoPartida.startsWith('retencion')));

      return matchTexto && matchTipo;
    });
  }, [resultado.polizas, busqueda, filtroTipo]);

  const partidasFiltradas = useMemo(() => {
    return resultado.partidasConciliadas.filter((partida) => {
      return (
        !busqueda ||
        (partida.cfdiUuid && partida.cfdiUuid.toLowerCase().includes(busqueda.toLowerCase())) ||
        (partida.cfdiFolio && partida.cfdiFolio.toLowerCase().includes(busqueda.toLowerCase())) ||
        partida.codigoAgrupador.toLowerCase().includes(busqueda.toLowerCase()) ||
        partida.nombreCuenta.toLowerCase().includes(busqueda.toLowerCase()) ||
        partida.concepto.toLowerCase().includes(busqueda.toLowerCase())
      );
    });
  }, [resultado.partidasConciliadas, busqueda]);

  const descartadasFiltradas = useMemo(() => {
    return resultado.descartesMetadata.filter((d) => {
      return (
        !busqueda ||
        d.uuid.toLowerCase().includes(busqueda.toLowerCase()) ||
        (d.folio && d.folio.toLowerCase().includes(busqueda.toLowerCase())) ||
        d.razon.toLowerCase().includes(busqueda.toLowerCase())
      );
    });
  }, [resultado.descartesMetadata, busqueda]);

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-sm">
      {/* Barra de Navegación entre Vistas y Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        {/* Pestañas */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setTabActiva('polizas')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-orbitron text-xs font-bold transition-all ${
              tabActiva === 'polizas' ? 'shadow-xs bg-navy text-white' : 'text-muted hover:text-ink'
            }`}
          >
            <Layers size={13} />
            <span>Pólizas Sugeridas ({resultado.polizas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('partidas')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-orbitron text-xs font-bold transition-all ${
              tabActiva === 'partidas'
                ? 'shadow-xs bg-navy text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            <FileText size={13} />
            <span>Matriz Anexo 24 ({resultado.partidasConciliadas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('descartadas')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-orbitron text-xs font-bold transition-all ${
              tabActiva === 'descartadas'
                ? 'shadow-xs bg-red-600 text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Ban size={13} />
            <span>Canceladas SAT ({resultado.descartesMetadata.length})</span>
          </button>
        </div>

        {/* Filtros rápidos y Buscador */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-[11px]">
            <Filter size={12} className="text-muted" />
            <button
              type="button"
              onClick={() => setFiltroTipo('TODOS')}
              className={`rounded-md px-2 py-1 font-semibold ${
                filtroTipo === 'TODOS' ? 'bg-navy/10 text-navy' : 'text-muted hover:text-ink'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('CUADRADAS')}
              className={`rounded-md px-2 py-1 font-semibold ${
                filtroTipo === 'CUADRADAS' ? 'bg-navy/10 text-navy' : 'text-muted hover:text-ink'
              }`}
            >
              Cuadradas
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('CON_RETENCION')}
              className={`rounded-md px-2 py-1 font-semibold ${
                filtroTipo === 'CON_RETENCION'
                  ? 'bg-navy/10 text-navy'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Con Retención
            </button>
          </div>

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar UUID, folio, cuenta..."
              className="w-full rounded-xl border border-line bg-white py-1.5 pl-9 pr-3 font-inter text-xs text-ink placeholder:text-muted focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            />
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          TAB 1: VISTA PÓLIZAS SUGERIDAS (Ingresos / Diario)
         ═════════════════════════════════════════════════════════════════ */}
      {tabActiva === 'polizas' && (
        <div className="space-y-4">
          {polizasFiltradas.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted">
              No se encontraron pólizas con los filtros seleccionados.
            </div>
          ) : (
            polizasFiltradas.map((poliza) => (
              <div
                key={poliza.id}
                className="shadow-2xs overflow-hidden rounded-xl border border-line bg-white transition-all hover:border-navy/40"
              >
                {/* Cabecera de la Póliza */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-surface-2/60 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-orbitron text-xs font-black uppercase tracking-wider text-navy">
                      Póliza #{poliza.folio} ({poliza.tipo})
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted">
                      {poliza.fecha}
                    </span>
                    <span className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-ink">
                      {poliza.cfdiFolio}
                    </span>
                    <span className="truncate text-xs font-semibold text-ink">
                      {poliza.nombreReceptor || poliza.rfcReceptor}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        poliza.cuadrada
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {poliza.cuadrada ? (
                        <>
                          <CheckCircle2 size={11} /> CUADRADA
                        </>
                      ) : (
                        <>
                          <AlertCircle size={11} /> DIFERENCIA {fmtMoneda(poliza.diferencia)}
                        </>
                      )}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      UUID: {poliza.cfdiUuid.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                {/* Tabla de Movimientos / Partidas */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-inter text-xs">
                    <thead>
                      <tr className="border-b border-line bg-surface text-[10px] font-bold uppercase tracking-wider text-muted">
                        <th className="px-5 py-2.5">Código SAT</th>
                        <th className="px-5 py-2.5">No. Cuenta</th>
                        <th className="px-5 py-2.5">Descripción de la Cuenta</th>
                        <th className="px-5 py-2.5">Concepto Partida</th>
                        <th className="px-5 py-2.5 text-right">Cargo (Debe)</th>
                        <th className="px-5 py-2.5 text-right">Abono (Haber)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {poliza.partidas.map((partida) => (
                        <tr key={partida.id} className="hover:bg-surface-2/40">
                          <td className="whitespace-nowrap px-5 py-2 font-mono font-bold text-navy">
                            {partida.codigoAgrupador}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2 font-mono text-muted">
                            {partida.numCta}
                          </td>
                          <td className="px-5 py-2 font-semibold text-ink">
                            {partida.nombreCuenta}
                          </td>
                          <td className="max-w-[280px] truncate px-5 py-2 text-muted">
                            {partida.concepto}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2 text-right font-mono font-semibold text-ink">
                            {partida.debe > 0 ? fmtMoneda(partida.debe) : '-'}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2 text-right font-mono font-semibold text-ink">
                            {partida.haber > 0 ? fmtMoneda(partida.haber) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-line bg-surface-2/80 font-mono text-xs font-bold">
                        <td colSpan={4} className="px-5 py-2 text-right uppercase text-muted">
                          Sumas Iguales:
                        </td>
                        <td className="px-5 py-2 text-right text-navy">
                          {fmtMoneda(poliza.totalDebe)}
                        </td>
                        <td className="px-5 py-2 text-right text-ink">
                          {fmtMoneda(poliza.totalHaber)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          TAB 2: MATRIZ DETALLADA DE PARTIDAS (Concepto CFDI ➡️ Anexo 24)
         ═════════════════════════════════════════════════════════════════ */}
      {tabActiva === 'partidas' && (
        <div className="shadow-2xs overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-left font-inter text-xs">
            <thead>
              <tr className="border-b border-line bg-surface text-[10px] font-bold uppercase tracking-wider text-muted">
                <th className="px-4 py-3">CFDI / Folio</th>
                <th className="px-4 py-3">Concepto CFDI</th>
                <th className="px-4 py-3 text-center">
                  <ArrowRight size={13} className="inline text-gold-dark" />
                </th>
                <th className="px-4 py-3">Cód. Agrupador SAT</th>
                <th className="px-4 py-3">No. Cuenta</th>
                <th className="px-4 py-3">Cuenta Contable</th>
                <th className="px-4 py-3 text-right">Debe</th>
                <th className="px-4 py-3 text-right">Haber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {partidasFiltradas.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/40">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs font-bold text-ink">
                    {p.cfdiFolio}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-2 text-ink">{p.concepto}</td>
                  <td className="px-4 py-2 text-center text-muted">➡️</td>
                  <td className="whitespace-nowrap px-4 py-2 font-mono font-bold text-navy">
                    {p.codigoAgrupador}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-muted">{p.numCta}</td>
                  <td className="px-4 py-2 font-semibold text-ink">{p.nombreCuenta}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right font-mono font-semibold text-navy">
                    {p.debe > 0 ? fmtMoneda(p.debe) : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right font-mono font-semibold text-ink">
                    {p.haber > 0 ? fmtMoneda(p.haber) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          TAB 3: FACTURAS DESCARTADAS / CANCELADAS POR METADATA SAT
         ═════════════════════════════════════════════════════════════════ */}
      {tabActiva === 'descartadas' && (
        <div className="space-y-3">
          {descartadasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-8 text-center text-sm text-emerald-800">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-600" />
              <p className="font-semibold">¡Auditoría Limpia!</p>
              <p className="text-xs text-muted">
                Ninguna factura del lote coincide con estatus CANCELADO en el archivo de Metadata
                del SAT.
              </p>
            </div>
          ) : (
            <div className="shadow-2xs overflow-x-auto rounded-xl border border-red-200 bg-white">
              <table className="w-full text-left font-inter text-xs">
                <thead>
                  <tr className="border-b border-red-100 bg-red-50/50 text-[10px] font-bold uppercase tracking-wider text-red-900">
                    <th className="px-4 py-3">Folio Fiscal (UUID)</th>
                    <th className="px-4 py-3">Folio</th>
                    <th className="px-4 py-3">RFC Receptor</th>
                    <th className="px-4 py-3 text-right">Importe Facturado</th>
                    <th className="px-4 py-3">Estatus Metadata</th>
                    <th className="px-4 py-3">Dictamen de Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {descartadasFiltradas.map((d) => (
                    <tr key={d.uuid} className="bg-red-50/20 hover:bg-red-50/40">
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-[11px] font-bold text-red-700">
                        {d.uuid}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-muted">
                        {d.folio || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-ink">
                        {d.rfcReceptor || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-mono font-bold text-red-700">
                        {d.monto !== undefined ? fmtMoneda(d.monto) : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase text-red-800">
                          <Ban size={10} /> CANCELADO SAT
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs font-semibold text-red-800">{d.razon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

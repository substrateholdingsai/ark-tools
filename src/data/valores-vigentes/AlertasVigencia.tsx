import { useEstadoCatalogo } from './hooks';
import { evaluarVigencia } from './vigencia';
import type { ConfigVigencia } from './tipos';

/**
 * Alertas sobre valores fiscales próximos a vencer o vencidos.
 *
 * Reglas de oro respetadas:
 * - Máximo 1 acento dorado por vista → usamos `badge-gold` solo si crítico.
 * - Colores de error usan navy + texto, no oro (el oro confunde valor).
 */
export function AlertasVigencia({
  config,
  onVerTodos,
}: {
  config?: Partial<ConfigVigencia>;
  onVerTodos?: () => void;
} = {}) {
  const { criticos, vencidos, proximosAVencer } = useEstadoCatalogo(config);

  // Nada que reportar
  if (criticos.length === 0 && vencidos.length === 0 && proximosAVencer.length === 0) {
    return null;
  }

  const todas = [...criticos, ...vencidos, ...proximosAVencer];

  // Deduplicar por ID (un valor puede estar en criticos y vencidos)
  const unicas = Array.from(new Map(todas.map((v) => [v.id, v])).values());
  const visibles = onVerTodos
    ? [...unicas]
        .sort((a, b) =>
          (a.vigencia.fin ?? '9999-12-31').localeCompare(b.vigencia.fin ?? '9999-12-31')
        )
        .slice(0, 3)
    : unicas;

  return (
    <div className="my-3 min-w-0 space-y-2">
      {visibles.map((v) => {
        const vigencia = evaluarVigencia(v, config);
        const esCritico = criticos.some((c) => c.id === v.id);
        return (
          <div
            key={v.id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              esCritico ? 'border-navy-dark bg-navy/10' : 'border-line bg-surface-2'
            }`}
          >
            <span className="min-w-0 flex-1 break-words font-inter text-sm text-ink">
              {v.nombre} — {vigencia.mensaje}
            </span>
            <a
              href={v.fuente.urlDOF}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 whitespace-nowrap text-xs text-gold underline hover:no-underline"
            >
              Ver DOF
            </a>
          </div>
        );
      })}
      {onVerTodos && (
        <button
          type="button"
          onClick={onVerTodos}
          className="text-sm font-semibold text-navy underline hover:no-underline"
        >
          Ver todos los avisos
        </button>
      )}
    </div>
  );
}

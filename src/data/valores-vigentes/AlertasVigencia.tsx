import { useEstadoCatalogo } from './hooks';
import { evaluarVigencia } from './vigencia';
import type { ConfigVigencia } from './tipos';

/**
 * Banner global que alerta sobre valores fiscales próximos a vencer
 * o vencidos. Se monta una sola vez en el App shell.
 *
 * Reglas de oro respetadas:
 * - Máximo 1 acento dorado por vista → usamos `badge-gold` solo si crítico.
 * - Colores de error usan navy + texto, no oro (el oro confunde valor).
 */
export function AlertasVigencia({ config }: { config?: Partial<ConfigVigencia> } = {}) {
  const { criticos, vencidos, proximosAVencer } = useEstadoCatalogo(config);

  // Nada que reportar
  if (criticos.length === 0 && vencidos.length === 0 && proximosAVencer.length === 0) {
    return null;
  }

  const todas = [...criticos, ...vencidos, ...proximosAVencer];

  // Deduplicar por ID (un valor puede estar en criticos y vencidos)
  const unicas = new Map(todas.map(v => [v.id, v])).values();

  return (
    <div className="mx-auto my-3 max-w-[1280px] space-y-2 px-6 md:px-10">
      {Array.from(unicas).map(v => {
        const vigencia = evaluarVigencia(v, config);
        const esCritico = criticos.some(c => c.id === v.id);
        return (
          <div key={v.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
            esCritico ? 'bg-navy/10 border-navy-dark' : 'bg-surface-2 border-line'
          }`}>
            <span className="font-inter text-sm text-ink flex-1">
              {v.nombre} — {vigencia.mensaje}
            </span>
            <a
              href={v.fuente.urlDOF}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline text-xs hover:no-underline"
            >
              Ver DOF
            </a>
          </div>
        );
      })}
    </div>
  );
}
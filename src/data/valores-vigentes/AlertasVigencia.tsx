import { useEstadoCatalogo } from './hooks';
import { BadgeGold } from '@/components/ui/BadgeGold';
import { GlassButton } from '@/components/ui/GlassButton';
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

  // Vencidos críticos → alerta máxima
  if (criticos.length > 0) {
    return (
      <div className="bg-navy text-white px-6 py-4 rounded-[16px] shadow-dome border border-navy-dark">
        <div className="flex items-start gap-4 max-w-[1280px] mx-auto">
          <span className="text-2xl" aria-hidden>⚠️</span>
          <div className="flex-1">
            <p className="font-inter font-bold text-sm tracking-wider uppercase">
              Valores fiscales vencidos
            </p>
            <p className="font-inter text-sm mt-1 opacity-90">
              {criticos.length} valor{criticos.length === 1 ? '' : 'es'} crítico
              {criticos.length === 1 ? '' : 's'} requieren actualización inmediata:
              {' '}
              {criticos.map(v => v.etiqueta).join(', ')}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Próximos a vencer → aviso preventivo
  if (proximosAVencer.length > 0) {
    return (
      <div className="bg-surface-2 border border-line px-6 py-3 rounded-[16px]">
        <div className="flex items-center gap-3 max-w-[1280px] mx-auto">
          <BadgeGold>PRÓXIMO</BadgeGold>
          <p className="font-inter text-sm text-ink">
            {proximosAVencer.length} valor{proximosAVencer.length === 1 ? '' : 'es'} fiscal
            {proximosAVencer.length === 1 ? '' : 'es'} vence
            {proximosAVencer.length === 1 ? '' : 'n'} en los próximos 60 días.
          </p>
          <GlassButton variant="default" className="ml-auto text-xs">
            Ver detalle
          </GlassButton>
        </div>
      </div>
    );
  }

  return null;
}
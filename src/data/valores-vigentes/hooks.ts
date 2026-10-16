import { useMemo } from 'react';
import { CATALOGO_2026, VALORES_POR_ID } from './catalogo';
import { evaluarVigencia, evaluarLote } from './vigencia';
import type { ValorFiscal, ConfigVigencia } from './tipos';

/**
 * Suscribe un componente a un valor fiscal específico.
 * Devuelve el valor + su estado de vigencia actual.
 */
export function useValorFiscal(
  id: string,
  config?: Partial<ConfigVigencia>
): { valor: ValorFiscal | undefined; vigencia: ReturnType<typeof evaluarVigencia> } | undefined {
  return useMemo(() => {
    const v = VALORES_POR_ID.get(id);
    if (!v) return undefined;
    return { valor: v, vigencia: evaluarVigencia(v, config) };
  }, [id, config?.fechaReferencia, config?.diasAlerta, config?.infinitosSiSinFecha]);
}

/**
 * Devuelve el estado agregado del catálogo completo.
 * Útil para un banner global en el dashboard.
 */
export function useEstadoCatalogo(config?: Partial<ConfigVigencia>) {
  return useMemo(() => evaluarLote(CATALOGO_2026, config), [
    config?.fechaReferencia,
    config?.diasAlerta,
    config?.infinitosSiSinFecha,
  ]);
}
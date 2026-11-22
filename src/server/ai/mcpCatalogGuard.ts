import { CATALOGO_2026 } from '../../data/valores-vigentes/catalogo';
import { evaluarVigencia } from '../../data/valores-vigentes/vigencia';
import { makeMcpToolError, type McpToolError } from './mcpErrors';

export function validateFiscalCatalog(): McpToolError | null {
  if (!Array.isArray(CATALOGO_2026) || CATALOGO_2026.length === 0) {
    return makeMcpToolError(
      'CATALOG_MISSING',
      'Falta el cat�logo de valores fiscales vigentes; no se puede calcular.',
      null
    );
  }
  for (const item of CATALOGO_2026) {
    const vigencia = evaluarVigencia(item);
    const inicioYear = Number(String(item.vigencia.inicio).slice(0, 4));
    const currentYear = new Date().getFullYear();
    if (
      vigencia.estado === 'vencido' &&
      (item.criticidad === 'ALTA' || inicioYear === currentYear)
    ) {
      return makeMcpToolError(
        'CATALOG_EXPIRED',
        `El valor fiscal "${item.id}" está vencido; no se puede calcular.`,
        null
      );
    }
  }
  return null;
}

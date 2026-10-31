import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATALOGO_HERRAMIENTAS, TOTAL_HERRAMIENTAS } from './catalogo-herramientas';

/**
 * Extrae los identificadores del union type `ToolId` declarado en `src/App.tsx`.
 *
 * Se lee el código fuente como texto (en lugar de importar el módulo) para
 * evitar arrastrar la SPA completa y sus componentes React a un test de datos.
 */
function leerToolIdsDelRouter(): string[] {
  const fuente = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  const bloque = fuente.match(/export type ToolId\s*=\s*([\s\S]*?);/);
  if (!bloque || !bloque[1]) {
    throw new Error('No se encontró el union type ToolId en src/App.tsx');
  }
  const ids = bloque[1].match(/'([^']+)'/g);
  return ids ? ids.map((id) => id.replace(/'/g, '')) : [];
}

describe('Catálogo Canónico de Herramientas', () => {
  it('expone 20 herramientas con identificadores únicos', () => {
    expect(TOTAL_HERRAMIENTAS).toBe(20);
    expect(CATALOGO_HERRAMIENTAS).toHaveLength(20);

    const ids = CATALOGO_HERRAMIENTAS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mantiene cada herramienta con nombre, categoría y descripción pública', () => {
    for (const herramienta of CATALOGO_HERRAMIENTAS) {
      expect(herramienta.id).toMatch(/^[a-z0-9-]+$/);
      expect(herramienta.nombre.length).toBeGreaterThan(3);
      expect(herramienta.categoria.length).toBeGreaterThan(3);
      expect(herramienta.descripcion.length).toBeGreaterThan(40);
    }
  });

  it('está sincronizado con el router de la SPA (ToolId de src/App.tsx)', () => {
    const toolIds = leerToolIdsDelRouter();
    const idsCatalogo = CATALOGO_HERRAMIENTAS.map((h) => h.id).sort();

    // Herramientas de la suite, excluyendo las rutas de navegación (dashboard) y de consola (admin)
    const esperadas = toolIds.filter((id) => id !== 'dashboard' && id !== 'admin').sort();

    expect(esperadas).toEqual(idsCatalogo);
    expect(esperadas).toHaveLength(TOTAL_HERRAMIENTAS);
  });

  it('incluye las herramientas insignia de los últimos sprints', () => {
    const ids = CATALOGO_HERRAMIENTAS.map((h) => h.id);
    expect(ids).toContain('resico');
    expect(ids).toContain('balance-general');
    expect(ids).toContain('anexo24');
    expect(ids).toContain('monitor-lfpiorpi');
    expect(ids).toContain('recargos');
    expect(ids).toContain('modalidad40');
  });
});

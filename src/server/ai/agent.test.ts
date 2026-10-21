import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildToolDirectives, DIRECTIVAS_HERRAMIENTAS } from './agent';
import { AI_TOOLS_CATALOG } from './tools';
import { CATALOGO_HERRAMIENTAS, TOTAL_HERRAMIENTAS } from '../../data/catalogo-herramientas';

describe('Noah — System Prompt', () => {
  const prompt = buildSystemPrompt('tenant-demo');

  it('declara la identidad del asistente como Noah', () => {
    expect(prompt).toContain('Eres Noah, el asistente inteligente');
  });

  it('declara el número real de herramientas de la suite', () => {
    expect(prompt).toContain(`sus ${TOTAL_HERRAMIENTAS} herramientas especializadas`);
    expect(prompt).toContain(`CATÁLOGO OFICIAL DE LAS ${TOTAL_HERRAMIENTAS} HERRAMIENTAS`);
    expect(prompt).not.toContain('13 herramientas');
    expect(prompt).not.toContain('LAS 13 HERRAMIENTAS');
  });

  it('documenta en su catálogo todas las herramientas de la suite', () => {
    for (const herramienta of CATALOGO_HERRAMIENTAS) {
      expect(prompt).toContain(`('${herramienta.id}')`);
    }
  });

  it('documenta las herramientas insignia de los últimos sprints', () => {
    expect(prompt).toContain("('resico')");
    expect(prompt).toContain("('balance-general')");
    expect(prompt).toContain("('anexo24')");
    expect(prompt).toContain('A=P+C');
  });

  it('incluye una directiva de invocación para cada herramienta de IA registrada', () => {
    for (const tool of AI_TOOLS_CATALOG) {
      expect(DIRECTIVAS_HERRAMIENTAS[tool.name]).toBeDefined();
      expect(prompt).toContain(`"${tool.name}"`);
    }
  });

  it('ordena las directivas siguiendo el catálogo de herramientas de IA', () => {
    const directives = buildToolDirectives();
    const positions = AI_TOOLS_CATALOG.map((tool) => directives.indexOf(`"${tool.name}"`));

    expect(positions.every((pos) => pos >= 0)).toBe(true);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]!).toBeGreaterThan(positions[i - 1]!);
    }
  });

  it('no inventa datos del cliente e instruye el uso de herramientas', () => {
    expect(prompt).toContain('Nunca inventes datos del cliente');
  });

  it('interpola el tenant activo en el prompt', () => {
    expect(prompt).toContain('(Tenant: tenant-demo)');
  });
});

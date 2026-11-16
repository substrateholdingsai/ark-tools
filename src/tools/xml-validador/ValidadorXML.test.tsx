import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CATALOGO_HERRAMIENTAS } from '@/data/catalogo-herramientas';
import { ValidadorXML } from './ValidadorXML';
import { AVISO_SCORE_INTERNO, AVISO_TOLERANCIA_ARITMETICA, CODIGOS_REGLA_VALIDADOR } from './types';

describe('Validador XML public scope', () => {
  it('states its actual scope and derives the published rule count', () => {
    const tool = CATALOGO_HERRAMIENTAS.find((item) => item.id === 'validador');
    if (!tool) throw new Error('No se encontró el Validador en el catálogo');

    expect(CODIGOS_REGLA_VALIDADOR).toHaveLength(15);
    expect(tool.descripcion).toContain(`${CODIGOS_REGLA_VALIDADOR.length} códigos`);
    expect(tool.descripcion).toContain('no consulta listas del SAT');
    expect(tool.descripcion).toContain('no valida el XSD oficial');
    expect(tool.descripcion).toContain('ni verifica firmas criptográficas');
    expect(tool.descripcion).not.toMatch(/EFOS|EDOS|69-B|CSD/i);
    expect(tool.descripcion).not.toContain('8 reglas');
    expect(`${tool.categoria} ${tool.descripcion}`).not.toMatch(/SHA-256|QR|PDF|Papel de Trabajo/i);
  });

  it('shows local-vs-Preview and non-certification disclaimers in the tool UI', () => {
    const { container } = render(<ValidadorXML />);
    const copy = container.textContent ?? '';

    expect(copy).toContain('La carga desde esta pantalla se procesa localmente y no sube el XML');
    expect(copy).toContain('El Preview del conector envía el XML al Worker de Ark');
    expect(copy).toContain('no persiste el contenido');
    expect(copy).toContain('No es una certificación ni garantiza deducibilidad');
    expect(copy).toContain(AVISO_SCORE_INTERNO);
    expect(copy).toContain(AVISO_TOLERANCIA_ARITMETICA);
    expect(copy).not.toMatch(
      /100% local en navegador|detección preventiva.*listas negras del SAT/i
    );
    expect(copy).not.toMatch(/SHA-256|Papel de Trabajo Oficial|QR de verificación|PDF/i);
  });
});

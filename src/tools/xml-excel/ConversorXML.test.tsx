import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConversorXML } from './ConversorXML';

describe('Conversor XML a CSV para Excel', () => {
  it('states its file limits, export format, and local-versus-Preview handling', () => {
    const { container } = render(<ConversorXML />);
    const copy = container.textContent ?? '';

    expect(copy).toContain('Conversor XML → CSV para Excel');
    expect(copy).toContain('10 MB');
    expect(copy).toContain('CSV UTF-8 con BOM para Excel');
    expect(copy).toContain('La carga desde esta pantalla se procesa localmente y no sube el XML');
    expect(copy).toContain('Preview del conector envía el XML al Worker de Ark');
    expect(copy).toContain('no persiste el contenido');
    expect(copy).toContain('no una validación del SAT');
    expect(copy).not.toContain('Privacidad Absoluta');
    expect(copy).not.toContain('100% privado');
  });
});

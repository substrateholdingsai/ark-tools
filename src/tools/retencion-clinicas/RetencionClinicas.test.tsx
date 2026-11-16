import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetencionClinicas } from './RetencionClinicas';

beforeAll(() => {
  const url = globalThis.URL as unknown as {
    createObjectURL?: () => string;
    revokeObjectURL?: () => void;
  };
  url.createObjectURL = () => 'blob:mock-url';
  url.revokeObjectURL = () => {};
});

describe('RetencionClinicas — export guard (campos de identidad faltantes)', () => {
  it('al exportar AAFY-30 con CIEE faltante aparece advertencia y se bloquea hasta confirmar', () => {
    render(<RetencionClinicas />);
    // Por defecto retenedorCiee = '' → CIEE faltante
    fireEvent.click(screen.getByRole('button', { name: /DESCARGAR AAFY-30 \(CONSTANCIA\)/i }));
    expect(screen.getByText(/Datos de identidad incompletos/i)).toBeInTheDocument();
    expect(screen.getByText(/CIEE del retenedor/i)).toBeInTheDocument();

    // Cancelar cierra la advertencia y no exporta
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(screen.queryByText(/Datos de identidad incompletos/i)).not.toBeInTheDocument();

    // Confirmar exporta con los campos en blanco (se cierra la advertencia)
    fireEvent.click(screen.getByRole('button', { name: /DESCARGAR AAFY-30 \(CONSTANCIA\)/i }));
    expect(screen.getByText(/Datos de identidad incompletos/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar exportación/i }));
    expect(screen.queryByText(/Datos de identidad incompletos/i)).not.toBeInTheDocument();
  });
});

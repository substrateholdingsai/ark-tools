import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertasVigencia } from './AlertasVigencia';

// Mock del hook para controlar el estado del catálogo
vi.mock('./hooks', () => ({
  useEstadoCatalogo: vi.fn(),
}));

import { useEstadoCatalogo } from './hooks';

describe('AlertasVigencia', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no renderiza nada si todo está vigente', () => {
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [{ id: 'x' } as any],
      proximosAVencer: [],
      vencidos: [],
      criticos: [],
    });
    const { container } = render(<AlertasVigencia />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra banner navy cuando hay críticos vencidos', () => {
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [],
      proximosAVencer: [],
      vencidos: [{ id: 'uma.diaria.2026', etiqueta: 'UMA diaria 2026' } as any],
      criticos: [{ id: 'uma.diaria.2026', etiqueta: 'UMA diaria 2026' } as any],
    });
    render(<AlertasVigencia />);
    expect(screen.getByText(/valores fiscales vencidos/i)).toBeInTheDocument();
    expect(screen.getByText(/UMA diaria 2026/)).toBeInTheDocument();
  });

  it('muestra BadgeGold cuando solo hay próximos a vencer', () => {
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [],
      proximosAVencer: [{ id: 'x', etiqueta: 'UMA' } as any],
      vencidos: [],
      criticos: [],
    });
    render(<AlertasVigencia />);
    expect(screen.getByText(/PRÓXIMO/)).toBeInTheDocument();
  });

  it('prioriza banner crítico sobre próximo-vencer', () => {
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [],
      proximosAVencer: [{ id: 'a', etiqueta: 'A' } as any],
      vencidos: [{ id: 'b', etiqueta: 'B' } as any],
      criticos: [{ id: 'b', etiqueta: 'B' } as any],
    });
    render(<AlertasVigencia />);
    expect(screen.getByText(/valores fiscales vencidos/i)).toBeInTheDocument();
    expect(screen.queryByText(/PRÓXIMO/)).not.toBeInTheDocument();
  });
});
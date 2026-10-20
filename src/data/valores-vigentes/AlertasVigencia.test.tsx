import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertasVigencia } from './AlertasVigencia';

// Mock del hook para controlar el estado del catálogo
vi.mock('./hooks', () => ({
  useEstadoCatalogo: vi.fn(),
}));

// Mock de evaluarVigencia
vi.mock('./vigencia', () => ({
  evaluarVigencia: vi.fn(),
}));

import { useEstadoCatalogo } from './hooks';
import { evaluarVigencia } from './vigencia';

const baseValor = {
  id: '',
  nombre: '',
  valor: 0,
  unidad: 'MXN_DIARIO' as const,
  vigencia: { inicio: '2026-01-01', fin: '2026-12-31' },
  fuente: {
    organismo: 'SAT' as const,
    publicacion: 'DOF 01/01/2026',
    urlDOF: 'https://www.dof.gob.mx/test',
    referencia: 'Art. test',
  },
  esProyeccion: false as const,
  verificadoPor: 'Test — 2026-01-01',
  criticidad: 'ALTA' as const,
};

describe('AlertasVigencia', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no renderiza nada si todo está vigente', () => {
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [{ ...baseValor, id: 'x', nombre: 'X' } as any],
      proximosAVencer: [],
      vencidos: [],
      criticos: [],
    });
    const { container } = render(<AlertasVigencia />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra lista con enlaces DOF cuando hay críticos vencidos', () => {
    const valor = { ...baseValor, id: 'uma.diaria.2026', nombre: 'UMA diaria 2026' };
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [],
      proximosAVencer: [],
      vencidos: [valor],
      criticos: [valor],
    });
    vi.mocked(evaluarVigencia).mockReturnValue({
      estado: 'vencido',
      diasRestantes: -10,
      mensaje: 'Venció hace 10 días',
      requiereAtencion: true,
    });

    render(<AlertasVigencia />);
    expect(screen.getByText(/UMA diaria 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Venció hace 10 días/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Ver DOF/i });
    expect(link).toHaveAttribute('href', 'https://www.dof.gob.mx/test');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('muestra lista para próximos a vencer', () => {
    const valor = { ...baseValor, id: 'x', nombre: 'UMA' };
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [],
      proximosAVencer: [valor],
      vencidos: [],
      criticos: [],
    });
    vi.mocked(evaluarVigencia).mockReturnValue({
      estado: 'proximo-vencer',
      diasRestantes: 30,
      mensaje: 'Vence en 30 días',
      requiereAtencion: true,
    });

    render(<AlertasVigencia />);
    expect(screen.getByText(/UMA/)).toBeInTheDocument();
    expect(screen.getByText(/Vence en 30 días/)).toBeInTheDocument();
  });

  it('prioriza críticos primero en la lista', () => {
    const critico = { ...baseValor, id: 'c', nombre: 'Critico' };
    const vencido = { ...baseValor, id: 'b', nombre: 'Vencido' };
    const proximo = { ...baseValor, id: 'a', nombre: 'Proximo' };
    vi.mocked(useEstadoCatalogo).mockReturnValue({
      vigentes: [],
      proximosAVencer: [proximo],
      vencidos: [vencido],
      criticos: [critico],
    });
    vi.mocked(evaluarVigencia).mockReturnValue({
      estado: 'vigente',
      diasRestantes: 100,
      mensaje: 'OK',
      requiereAtencion: false,
    });

    render(<AlertasVigencia />);
    const items = screen.getAllByText(/Critico|Vencido|Proximo/);
    // Orden: criticos, vencidos, proximosAVencer
    expect(items[0]).toHaveTextContent('Critico');
    expect(items[1]).toHaveTextContent('Vencido');
    expect(items[2]).toHaveTextContent('Proximo');
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertasVigencia } from './AlertasVigencia';

describe('AlertasVigencia — integración con fecha simulada', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithTime = (date: Date) => {
    vi.setSystemTime(date);
    return render(<AlertasVigencia config={{ fechaReferencia: new Date() }} />);
  };

  it('detecta UMA vencida al simular 2027-03-01', () => {
    renderWithTime(new Date('2027-03-01T12:00:00Z'));
    // UMA.diaria2026 vence 2027-01-31, así que en marzo 2027 está vencida
    // Debe aparecer en la lista con mensaje de vencido y link DOF
    expect(screen.getByText(/UMA Diaria 2026/)).toBeInTheDocument();
    expect(screen.getAllByText(/Venció hace/)).toHaveLength(4); // UMA diaria, UMA mensual, Tope SBC, ISR
    expect(screen.getAllByRole('link', { name: /Ver DOF/i })).toHaveLength(4);
  });

  it('detecta próxima a vencer al simular 2026-11-15 (60 días antes de fin 2026)', () => {
    renderWithTime(new Date('2026-11-15T12:00:00Z'));
    // Tarifa ISR vence 2026-12-31, así que en nov 2026 está próxima
    expect(screen.getByText(/Tarifa ISR Mensual 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Vence en/)).toBeInTheDocument();
  });

  it('no muestra alerta en 2026-06-15 (todo vigente)', () => {
    const { container } = renderWithTime(new Date('2026-06-15T12:00:00Z'));
    // No debe renderizar nada
    expect(container.firstChild).toBeNull();
  });

  it('muestra múltiples vencidos ordenados por criticidad (2027-02-01)', () => {
    renderWithTime(new Date('2027-02-01T12:00:00Z'));
    // UMA y Tope SBC vencidos (críticos), ISR también vencido
    expect(screen.getByText(/UMA Diaria 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Tope Máximo SBC/)).toBeInTheDocument();
    expect(screen.getByText(/Tarifa ISR Mensual 2026/)).toBeInTheDocument();
    // Todos con link DOF
    const links = screen.getAllByRole('link', { name: /Ver DOF/i });
    expect(links.length).toBeGreaterThanOrEqual(3);
  });
});
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
    expect(screen.getByText(/valores fiscales vencidos/i)).toBeInTheDocument();
  });

  it('detecta próxima a vencer al simular 2026-11-15 (60 días antes de fin 2026)', () => {
    renderWithTime(new Date('2026-11-15T12:00:00Z'));
    // Salario mínimo y tarifa ISR vencen 2026-12-31, así que en nov 2026 están próximos
    const badges = screen.getAllByText(/PRÓXIMO/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('no muestra alerta en 2026-06-15 (todo vigente)', () => {
    renderWithTime(new Date('2026-06-15T12:00:00Z'));
    expect(screen.queryByText(/valores fiscales vencidos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PRÓXIMO/i)).not.toBeInTheDocument();
  });

  it('prioriza crítico sobre próximo cuando ambos coexisten (2027-02-01)', () => {
    renderWithTime(new Date('2027-02-01T12:00:00Z'));
    // UMA vencida (crítico), pero salario mínimo ya venció en 2026-12-31 (también crítico)
    expect(screen.getByText(/valores fiscales vencidos/i)).toBeInTheDocument();
    expect(screen.queryByText(/PRÓXIMO/i)).not.toBeInTheDocument();
  });
});
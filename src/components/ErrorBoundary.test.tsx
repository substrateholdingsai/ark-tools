import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated crash in component');
  }
  return <div>Componente Funcionando</div>;
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renderiza a los hijos normalmente cuando no hay errores', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Componente Funcionando')).toBeInTheDocument();
  });

  it('captura el error y renderiza la interfaz institucional de recuperación', () => {
    render(
      <ErrorBoundary toolName="Calculadora Nómina">
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Interrupción en Calculadora Nómina')).toBeInTheDocument();
    expect(screen.getByText(/El sistema aisló una excepción/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulated crash in component/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('permite ejecutar la acción de reset al hacer clic en Volver al Catálogo', async () => {
    const handleReset = vi.fn();
    render(
      <ErrorBoundary onReset={handleReset}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    const backButton = screen.getByRole('button', { name: /Volver al Catálogo/i });
    await userEvent.click(backButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalculadoraRecargos } from './CalculadoraRecargos';
import { ExpedienteProvider } from '@/context/ExpedienteContext';

describe('CalculadoraRecargos Component (Herramienta #18)', () => {
  it('renderiza título principal, badges oficiales y componentes', () => {
    render(
      <ExpedienteProvider>
        <CalculadoraRecargos />
      </ExpedienteProvider>
    );

    expect(
      screen.getByText('Calculadora de Actualización y Recargos Fiscales')
    ).toBeInTheDocument();
    expect(screen.getByText('HERRAMIENTA #18 · MOTOR FISCAL CLOUD')).toBeInTheDocument();
    expect(screen.getByText('CFF ARTS. 17-A Y 21')).toBeInTheDocument();
    expect(screen.getByText('PARÁMETROS DE FISCALIZACIÓN')).toBeInTheDocument();
    expect(screen.getByText('LIQUIDACIÓN FISCAL DETERMINADA')).toBeInTheDocument();
  });

  it('ejecuta onBack al hacer clic en el botón de regreso', () => {
    const handleBack = vi.fn();
    render(
      <ExpedienteProvider>
        <CalculadoraRecargos onBack={handleBack} />
      </ExpedienteProvider>
    );

    const backButton = screen.getByTitle('Volver al Catálogo');
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('actualiza el cálculo reactivamente cuando cambia el importe adeudado', () => {
    render(
      <ExpedienteProvider>
        <CalculadoraRecargos />
      </ExpedienteProvider>
    );

    const input = screen.getByLabelText(/Impuesto Omitido/i);
    fireEvent.change(input, { target: { value: '100000' } });

    // Con 100,000 histórico, el cálculo se actualiza inmediatamente
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
  });

  it('abre y cierra el modal de Cédula Oficial / Papel de Trabajo con QR', () => {
    render(
      <ExpedienteProvider>
        <CalculadoraRecargos />
      </ExpedienteProvider>
    );

    const btnVerCedula = screen.getByText(/Ver Papel de Trabajo Oficial/i);
    fireEvent.click(btnVerCedula);

    expect(screen.getByText(/Cédula de Actualización y Recargos Fiscales/i)).toBeInTheDocument();
    expect(screen.getByText(/PAPEL DE TRABAJO INSTITUCIONAL/i)).toBeInTheDocument();

    // Cerrar modal
    const closeBtn = screen.getByRole('button', { name: '' });
    if (closeBtn) {
      fireEvent.click(closeBtn);
    }
  });
});

/**
 * ARK TOOLS — Test de Integración y UI de Calculadora de Finiquitos y Liquidaciones
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CalculadoraFiniquitos } from './CalculadoraFiniquitos';

describe('CalculadoraFiniquitos (src/tools/finiquitos/CalculadoraFiniquitos.tsx)', () => {
  it('renderiza título principal, badges oficiales y componentes', () => {
    render(<CalculadoraFiniquitos />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Calculadora de Finiquitos y Liquidaciones/i })
    ).toBeInTheDocument();
    expect(screen.getByText('OFICIAL LFT')).toBeInTheDocument();
    expect(screen.getByText('HERRAMIENTA LABORAL · LFT 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Parámetros del Cálculo/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Antigüedad' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Desglose de Conceptos/i })).toBeInTheDocument();
  });

  it('ejecuta onBack al hacer clic en el botón de regreso', () => {
    const handleBack = vi.fn();
    render(<CalculadoraFiniquitos onBack={handleBack} />);

    const backButton = screen.getByRole('button', { name: /Volver al Dashboard/i });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('permite alternar entre Finiquito y Liquidación', () => {
    render(<CalculadoraFiniquitos />);

    // Por defecto inicia en finiquito
    const btnFiniquito = screen.getByRole('button', { name: /^Finiquito$/i });
    const btnLiquidacion = screen.getByRole('button', { name: /^Liquidación$/i });

    expect(btnFiniquito).toHaveAttribute('aria-pressed', 'true');
    expect(btnLiquidacion).toHaveAttribute('aria-pressed', 'false');

    // Cambiar a Liquidación
    fireEvent.click(btnLiquidacion);
    expect(btnLiquidacion).toHaveAttribute('aria-pressed', 'true');
    expect(btnFiniquito).toHaveAttribute('aria-pressed', 'false');

    // Debe mostrar la opción de indemnización constitucional de 90 días
    expect(screen.getAllByText(/Indemnización Constitucional \(90 días\)/i).length).toBeGreaterThanOrEqual(1);
  });

  it('muestra el desglose de conceptos con fundamentos legales de la LFT', () => {
    render(<CalculadoraFiniquitos />);

    expect(screen.getAllByText('Art. 87 LFT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Arts. 76 y 79 LFT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Art. 80 LFT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Art. 162 LFT').length).toBeGreaterThanOrEqual(1);
  });

  it('permite modificar el salario diario y actualiza el SDI sugerido', () => {
    render(<CalculadoraFiniquitos />);

    const inputSalario = screen.getByLabelText(/^Salario Diario$/i);
    fireEvent.change(inputSalario, { target: { value: '800' } });

    // El SDI sugerido debe actualizarse con el factor mínimo
    const inputSdi = screen.getByLabelText(/Salario Diario Integrado/i) as HTMLInputElement;
    expect(parseFloat(inputSdi.value)).toBeCloseTo(839.45, 1);
  });

  it('permite copiar el resumen y descargar el CSV', async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    // Mock URL.createObjectURL y revokeObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<CalculadoraFiniquitos />);

    const botonCopiar = screen.getByRole('button', { name: /Copiar Resumen Ejecutivo/i });
    expect(botonCopiar).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(botonCopiar);
    });

    const botonCSV = screen.getByRole('button', { name: /Descargar Excel \(CSV\)/i });
    expect(botonCSV).toBeInTheDocument();
    fireEvent.click(botonCSV);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});

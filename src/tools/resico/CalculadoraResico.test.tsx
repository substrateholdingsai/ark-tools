/**
 * ARK TOOLS — Test de Integración y UI de Calculadora y Cédula RESICO 2026
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalculadoraResico } from './CalculadoraResico';

describe('CalculadoraResico (src/tools/resico/CalculadoraResico.tsx)', () => {
  it('renderiza título principal, badges oficiales y componentes', () => {
    render(<CalculadoraResico />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Calculadora y Cédula RESICO/i })
    ).toBeInTheDocument();
    expect(screen.getByText('OFICIAL DOF')).toBeInTheDocument();
    expect(screen.getByText('HERRAMIENTA FISCAL · LISR 2026')).toBeInTheDocument();
    expect(screen.getByText(/Modalidad de Contribuyente/i)).toBeInTheDocument();
    expect(screen.getByText(/Control de Tope Anual RESICO/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Liquidación Mensual/i })).toBeInTheDocument();
  });

  it('ejecuta onBack al hacer clic en el botón de regreso', () => {
    const handleBack = vi.fn();
    render(<CalculadoraResico onBack={handleBack} />);

    const backButton = screen.getByRole('button', { name: /Volver al Catálogo/i });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('permite alternar entre Persona Física y Persona Moral', () => {
    render(<CalculadoraResico />);

    const btnMoral = screen.getByRole('button', { name: /Persona Moral \(206\)/i });
    fireEvent.click(btnMoral);

    // Debe mostrar los campos de Persona Moral
    expect(screen.getByText(/Ingresos Acumulados Cobrados en el Ejercicio/i)).toBeInTheDocument();
    expect(screen.getByText(/Deducciones Autorizadas Acumuladas Pagadas/i)).toBeInTheDocument();
    expect(screen.getByText(/TASA ISR 30%/i)).toBeInTheDocument();

    // Regresar a Persona Física
    const btnFisica = screen.getByRole('button', { name: /Persona Física \(113-E\)/i });
    fireEvent.click(btnFisica);
    expect(screen.getByText(/Ingresos Cobrados del Mes \(sin IVA\)/i)).toBeInTheDocument();
  });

  it('abre y cierra el modal de Cédula Oficial Institucional', () => {
    render(<CalculadoraResico />);

    const btnVerCedula = screen.getByRole('button', { name: /Cédula Oficial/i });
    fireEvent.click(btnVerCedula);

    // Modal abierto
    expect(screen.getByText(/PAPEL DE TRABAJO INSTITUCIONAL/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Cédula de Determinación de Pagos Provisionales RESICO/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/VALIDADO DOF 2026/i)).toBeInTheDocument();

    // Botón cerrar modal
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find((btn) => btn.querySelector('svg.lucide-x'));
    expect(closeBtn).toBeDefined();
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(screen.queryByText(/PAPEL DE TRABAJO INSTITUCIONAL/i)).not.toBeInTheDocument();
    }
  });
});

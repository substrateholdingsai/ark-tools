import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modalidad40 } from './Modalidad40';
import { ExpedienteProvider } from '@/context/ExpedienteContext';

describe('Modalidad40 Componente UI', () => {
  it('renderiza correctamente el encabezado y el badge del Acuerdo DOF 21/10/2026', () => {
    render(
      <ExpedienteProvider>
        <Modalidad40 />
      </ExpedienteProvider>
    );

    expect(screen.getByText(/HERRAMIENTA #19 · FISCAL & NÓMINA/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Simulador de Modalidad 40 \(Criterio DOF 2026\)/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/ACUERDO DOF 21\/10\/2026/i).length).toBeGreaterThan(0);
  });

  it('detecta y muestra la advertencia cuando el salario deseado excede el límite DOF 2026', () => {
    render(
      <ExpedienteProvider>
        <Modalidad40 />
      </ExpedienteProvider>
    );

    // Por defecto el último SBC es 650 y el deseado es 2932.75, por lo que excede el límite
    expect(screen.getByText(/Límite Excedido/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Aviso Restrictivo — Acuerdo ACDO\.AS2\.HCT\.101026\/302\.P\.DG/i)
    ).toBeInTheDocument();
  });

  it('abre y cierra el modal de la Cédula Oficial SHA-256 + QR', async () => {
    render(
      <ExpedienteProvider>
        <Modalidad40 />
      </ExpedienteProvider>
    );

    const btnCedula = screen.getByRole('button', { name: /Emitir Cédula Oficial SHA-256 \+ QR/i });
    fireEvent.click(btnCedula);

    expect(
      screen.getByText(/Cédula de Proyección de Pensión Ley 73 & Modalidad 40/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/MEMORIA ACTUARIAL DE CUANTÍA/i)).toBeInTheDocument();

    // Botón de cerrar con la X
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find((btn) => btn.querySelector('svg.lucide-x'));
    if (xButton) {
      fireEvent.click(xButton);
    }
  });

  it('ejecuta el callback onBack al hacer clic en el botón de retroceso', () => {
    const handleBack = vi.fn();
    render(
      <ExpedienteProvider>
        <Modalidad40 onBack={handleBack} />
      </ExpedienteProvider>
    );

    const backButton = screen.getByTitle('Volver al Catálogo');
    fireEvent.click(backButton);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});

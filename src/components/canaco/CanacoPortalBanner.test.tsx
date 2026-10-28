import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanacoPortalBanner } from './CanacoPortalBanner';

describe('CANACO SERVYTUR Mérida — Componentes de Ventanilla & Banner HENEQUÉN', () => {
  it('renderiza el banner institucional del socio con textos HENEQUÉN', () => {
    render(<CanacoPortalBanner />);
    expect(screen.getByText(/Portal del Afiliado · HENEQUÉN/i)).toBeInTheDocument();
    expect(screen.getByText(/120 Años de Autoridad Comercial \(1906–2026\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Impulsa tu Negocio con el Respaldo de CANACO SERVYTUR Mérida/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Afiliarse \/ Refrendo SIEM/i })).toBeInTheDocument();
  });

  it('abre la Ventanilla Digital de Afiliación al pulsar el botón principal', () => {
    render(<CanacoPortalBanner />);
    const btnAfiliarse = screen.getByRole('button', { name: /Afiliarse \/ Refrendo SIEM/i });
    fireEvent.click(btnAfiliarse);

    expect(screen.getByText('Ventanilla Digital de Afiliación')).toBeInTheDocument();
    expect(screen.getByText(/REGISTRO SIEM 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Datos del Negocio')).toBeInTheDocument();
  });

  it('avanza al paso de cotización y muestra el cálculo de cuotas desglosado', () => {
    render(<CanacoPortalBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Afiliarse \/ Refrendo SIEM/i }));

    // Llenar campos requeridos mínimos
    const inputRazon = screen.getByPlaceholderText(/Ej. Comercializadora del Mayab S.A. de C.V./i);
    fireEvent.change(inputRazon, { target: { value: 'Abarrotes del Mayab S.A.' } });

    const btnContinuar = screen.getByRole('button', { name: /Calcular Cuota y Ver Beneficios/i });
    fireEvent.click(btnContinuar);

    // Debe mostrar la cotización del paso 2
    expect(screen.getByText(/Estrato Determinado/i)).toBeInTheDocument();
    expect(screen.getByText(/Empresa micro/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2,000 MXN/i)).toBeInTheDocument();
    expect(screen.getByText(/Registro SIEM 2026 \(Ley Federal\)/i)).toBeInTheDocument();
  });
});

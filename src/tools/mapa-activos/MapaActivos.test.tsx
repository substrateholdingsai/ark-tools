/**
 * ARK TOOLS — Test de Mapa de Activos Virtuales
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapaActivos from './MapaActivos';

describe('MapaActivos (src/tools/mapa-activos/MapaActivos.tsx)', () => {
  it('renderiza título, badges y métricas del resumen ejecutivo', () => {
    render(<MapaActivos />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Mapa de Activos/i);
    expect(screen.getByText('MAPA ARK')).toBeInTheDocument();
    expect(screen.getByText('12 conductas')).toBeInTheDocument();
    expect(screen.getAllByText(/Aislar, no prohibir/i).length).toBeGreaterThanOrEqual(1);
  });

  it('ejecuta onBack al hacer clic en el botón de regreso', () => {
    const handleBack = vi.fn();
    render(<MapaActivos onBack={handleBack} />);

    const backButton = screen.getByRole('button', { name: /Volver al dashboard/i });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('permite filtrar conductas por término de búsqueda', () => {
    render(<MapaActivos />);

    const input = screen.getByPlaceholderText(/Buscar conducta, artículo, sanción.../i);
    fireEvent.change(input, { target: { value: 'hackeo' } });

    expect(
      screen.getByText(/Obtener, extraer o transferir activos virtuales sin autorización/i)
    ).toBeInTheDocument();
    expect(screen.getByText('1 de 12 conductas')).toBeInTheDocument();
  });

  it('permite filtrar por relevancia para contador', () => {
    render(<MapaActivos />);

    const botonContador = screen.getByRole('button', { name: /^📋 Contador$/ });
    fireEvent.click(botonContador);

    expect(screen.getByText(/\d+ de 12 conductas/)).toBeInTheDocument();
  });

  it('expande y contrae el detalle completo de una conducta', () => {
    render(<MapaActivos />);

    const tituloConducta = screen.getByText(
      'Operar plataforma de activos virtuales sin autorización de la CNBV'
    );
    const primerCard = tituloConducta.closest('button')!;
    expect(primerCard).toBeInTheDocument();

    // Detalle no visible inicialmente
    expect(screen.queryByText('DETALLE COMPLETO')).not.toBeInTheDocument();

    // Clic para expandir
    fireEvent.click(primerCard);
    expect(screen.getByText('DETALLE COMPLETO')).toBeInTheDocument();
    expect(
      screen.getByText(/Inhabilitación para solicitar autorización futura/i)
    ).toBeInTheDocument();

    // Clic para contraer
    fireEvent.click(primerCard);
    expect(screen.queryByText('DETALLE COMPLETO')).not.toBeInTheDocument();
  });

  it('renderiza las secciones de autoridades, timeline, umbrales y frontera', () => {
    render(<MapaActivos />);

    expect(screen.getByText(/Autoridades regulatorias/i)).toBeInTheDocument();
    expect(screen.getByText('CNBV')).toBeInTheDocument();
    expect(screen.getByText('Banxico')).toBeInTheDocument();

    expect(screen.getByText(/Timeline regulatorio 2026–2029/i)).toBeInTheDocument();
    expect(screen.getByText(/Umbrales de reporte LFPIORPI/i)).toBeInTheDocument();
    expect(screen.getByText('210 UMA')).toBeInTheDocument();

    expect(screen.getByText(/Frontera legal vs ilegal/i)).toBeInTheDocument();
    expect(screen.getByText(/Conductas legales/i)).toBeInTheDocument();
    expect(screen.getByText(/Conductas ilegales \/ restringidas/i)).toBeInTheDocument();
  });
});

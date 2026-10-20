/**
 * ARK TOOLS — Pruebas de Integración y UI de CierreNomina (Sprint 11)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CierreNomina } from './CierreNomina';
import { ExpedienteProvider } from '@/context/ExpedienteContext';

describe('CierreNomina Component — Sprint 11', () => {
  it('renderiza título principal, badges oficiales y botones de acción', () => {
    const handleBack = vi.fn();
    render(
      <ExpedienteProvider>
        <CierreNomina onBack={handleBack} />
      </ExpedienteProvider>
    );

    expect(screen.getByText('Cierre de Nómina Masivo')).toBeDefined();
    expect(screen.getByText('BATCH DOF 2026')).toBeDefined();
    expect(screen.getByText('Cargar 5 de Muestra')).toBeDefined();
    expect(screen.getByText('Descargar Plantilla CSV')).toBeDefined();
  });

  it('ejecuta onBack al hacer clic en el botón de regreso', () => {
    const handleBack = vi.fn();
    render(
      <ExpedienteProvider>
        <CierreNomina onBack={handleBack} />
      </ExpedienteProvider>
    );

    const backBtn = screen.getByTitle('Volver al catálogo de herramientas');
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('carga la plantilla de muestra de 5 trabajadores y los visualiza en la tabla', async () => {
    render(
      <ExpedienteProvider>
        <CierreNomina onBack={() => {}} />
      </ExpedienteProvider>
    );

    const btnMuestra = screen.getByText('Cargar 5 de Muestra');
    fireEvent.click(btnMuestra);

    await waitFor(() => {
      expect(screen.getByText('Colaboradores Listos (5)')).toBeDefined();
      expect(screen.getByText('HERNANDEZ GARCIA ROBERTO')).toBeDefined();
      expect(screen.getByText('LOPEZ MARTINEZ MARIANA')).toBeDefined();
    });
  });

  it('procesa el lote y muestra el resumen de KPIs y cédula concentradora', async () => {
    render(
      <ExpedienteProvider>
        <CierreNomina onBack={() => {}} />
      </ExpedienteProvider>
    );

    // 1. Cargar 5 de muestra
    const btnMuestra = screen.getByText('Cargar 5 de Muestra');
    fireEvent.click(btnMuestra);

    await waitFor(() => {
      expect(screen.getByText('Colaboradores Listos (5)')).toBeDefined();
    });

    // 2. Procesar
    const btnProcesar = screen.getByText('Procesar Cierre y Generar Cédula');
    fireEvent.click(btnProcesar);

    await waitFor(() => {
      expect(screen.getByText('Cierre Procesado & Sellado con Éxito')).toBeDefined();
      expect(screen.getByText('Ver Cédula Oficial (PDF & Sello)')).toBeDefined();
    });
  }, 30_000); // paralela de la suite completa puede rebasar el timeout por defecto de 5 s. // El batch con sellado SHA-256 y QR es intrínsecamente lento en jsdom; bajo carga
});

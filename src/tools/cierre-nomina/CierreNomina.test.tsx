/**
 * ARK LEDGER — Pruebas de Integración y UI de CierreNomina (Sprint 11)
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
  }, 30_000);

  it('permite alternar a la pestaña de Cruce Laboral-Fiscal y renderiza las zonas de carga', () => {
    render(
      <ExpedienteProvider>
        <CierreNomina onBack={() => {}} />
      </ExpedienteProvider>
    );

    const cruceTabBtn = screen.getByText('Cruce Laboral-Fiscal (CFDI vs Checador)');
    fireEvent.click(cruceTabBtn);

    expect(
      screen.getByText(/Marco Normativo: Registro de Jornada vs. Deducibilidad/i)
    ).toBeDefined();
    expect(screen.getByText(/1. CFDIs de Nómina \(XML\)/i)).toBeDefined();
    expect(screen.getByText(/2. Reloj Checador \(CSV\)/i)).toBeDefined();
    expect(screen.getByText('Plantilla Checador CSV')).toBeDefined();
    expect(screen.getByText('Cargar Demo (CFDI + Checador)')).toBeDefined();
  });

  it('ejecuta el cruce con el lote de demostración y visualiza score, semáforo y cédula oficial', async () => {
    render(
      <ExpedienteProvider>
        <CierreNomina onBack={() => {}} />
      </ExpedienteProvider>
    );

    // 1. Cambiar a la pestaña de Cruce
    const cruceTabBtn = screen.getByText('Cruce Laboral-Fiscal (CFDI vs Checador)');
    fireEvent.click(cruceTabBtn);

    // 2. Cargar caso demo de 1-clic
    const btnDemo = screen.getByText('Cargar Demo (CFDI + Checador)');
    fireEvent.click(btnDemo);

    // 3. Verificar que se calcula y renderiza el dictamen de inmediato
    await waitFor(() => {
      expect(screen.getByText(/Auditoría de Jornada/i)).toBeDefined();
      expect(screen.getByText(/Score de Consistencia/i)).toBeDefined();
      expect(screen.getByText(/Diagnóstico y Conclusiones de Auditoría Cruzada/i)).toBeDefined();
      expect(screen.getByText('HERNANDEZ GARCIA ROBERTO')).toBeDefined();
      expect(screen.getByText('LOPEZ MARTINEZ MARIANA')).toBeDefined();
      expect(screen.getByText('SANCHEZ TORRES SOFIA')).toBeDefined();
    });

    // 4. Abrir la Cédula Oficial de Cruce
    const btnCedula = screen.getByText('Ver Cédula Oficial (PDF & Sello)');
    fireEvent.click(btnCedula);

    await waitFor(() => {
      expect(screen.getByText('ARK LEDGER • AUDITORÍA INTEGRAL DE JORNADA Y NÓMINA')).toBeDefined();
      expect(screen.getByText('Descargar Auditoría CSV')).toBeDefined();
    });
  }, 30_000);
});

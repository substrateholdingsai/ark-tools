import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonitorLFPIORPI } from './MonitorLFPIORPI';

// Mock del contexto de Expediente
vi.mock('@/context/ExpedienteContext', () => ({
  useExpediente: () => ({
    activeClient: {
      id: 'cli-test-1',
      tenant_id: 'ten-test',
      nombre: 'Inmobiliaria Modelo S.A.',
      tipo: 'empresa',
      rfc: 'IMO120304AB1',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    saveCalculoExpediente: vi.fn().mockResolvedValue({
      expediente: {
        id: 'exp-1',
        tenant_id: 'ten-test',
        client_id: 'cli-test-1',
        tool_id: 'monitor-lfpiorpi',
        titulo: 'Auditoría Antilavado LFPIORPI',
        input_hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        catalog_version: 'DOF 2026',
        inputs: {},
        outputs: {},
        created_at: '2026-04-01',
      },
    }),
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useOptionalAuth: () => ({
    tenantName: 'Despacho Demo',
  }),
}));

describe('MonitorLFPIORPI Component', () => {
  it('renderiza correctamente el encabezado y el selector de fracción', () => {
    render(<MonitorLFPIORPI />);

    expect(screen.getByText('Monitor de Actividades Vulnerables LFPIORPI')).toBeInTheDocument();
    expect(screen.getByText('HERRAMIENTA #17 · COMPLIANCE')).toBeInTheDocument();
    expect(screen.getByText(/Tipo de Actividad Vulnerable/i)).toBeInTheDocument();
  });

  it('permite cargar datos de ejemplo con 1-click y renderiza el semáforo', async () => {
    render(<MonitorLFPIORPI />);

    const botonMuestra = screen.getByRole('button', { name: /Cargar Muestra 1-Click/i });
    fireEvent.click(botonMuestra);

    await waitFor(() => {
      // Debe mostrar el resumen y la tabla con los clientes evaluados
      expect(screen.getByText('Resultados del Monitoreo')).toBeInTheDocument();
      expect(screen.getByText('INM-CORP-9801')).toBeInTheDocument();
      expect(screen.getAllByText('AVISO UIF').length).toBeGreaterThan(0);
      expect(screen.getByText('IDENTIFICACIÓN')).toBeInTheDocument();
    });
  });

  it('cambia la fracción de actividad vulnerable y actualiza los umbrales', async () => {
    render(<MonitorLFPIORPI />);

    const selectFraccion = screen.getByRole('combobox');
    fireEvent.change(selectFraccion, { target: { value: 'FRACCION_V' } });

    // Fracción V tiene umbrales de 8,025 UMA y 16,000 UMA
    expect(screen.getByText(/8,025 UMA/)).toBeInTheDocument();
    expect(screen.getByText(/16,000 UMA/)).toBeInTheDocument();
  });
});

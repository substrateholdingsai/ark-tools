import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { RegulatoryTicker } from './RegulatoryTicker';
import { CATALOGO_2026, VALORES_POR_ID } from '@/data/valores-vigentes/catalogo';
import { TOTAL_HERRAMIENTAS } from '@/data/catalogo-herramientas';

describe('RegulatoryTicker Component (Wall Street Tape)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
  });

  it('renderiza la cinta, el pin de Radar RegTech y el total canónico de herramientas', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, events: [] }),
    });

    await act(async () => {
      render(<RegulatoryTicker />);
    });

    expect(screen.getByText('RADAR REGTECH')).toBeInTheDocument();
    expect(screen.getByText('DOF · SAT EN VIVO')).toBeInTheDocument();
    expect(screen.getByText(String(TOTAL_HERRAMIENTAS))).toBeInTheDocument();
    expect(screen.getByText('HERRAMIENTAS EN SUITE')).toBeInTheDocument();
    expect(screen.getAllByText(`${CATALOGO_2026.length} VALORES`).length).toBeGreaterThan(0);
    expect(screen.queryByText('8/8 DOF')).not.toBeInTheDocument();
    const tasaRecargos = VALORES_POR_ID.get('TASA_RECARGOS_MORA_2026')?.valor;
    expect(screen.getAllByText(new RegExp(`${tasaRecargos}%`)).length).toBeGreaterThan(0);
  });

  it('muestra las garantías normativas canónicas de la suite en la cinta', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, events: [] }),
    });

    await act(async () => {
      render(<RegulatoryTicker />);
    });

    expect(screen.getAllByText(/HERRAMIENTA #18:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/HERRAMIENTA #19:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/HERRAMIENTA #20:/i).length).toBeGreaterThan(0);
  });

  it('consume /api/regulatory/events y renderiza eventos en vivo de Sentinela Legal', async () => {
    const mockLiveEvent = {
      id: 'reg_live_999',
      channel: 'fiscal',
      source: 'Diario Oficial de la Federación',
      source_url: 'https://dof.gob.mx/ejemplo',
      severity: 'critico',
      title: 'Actualización Urgente CFF Art. 29-A',
      summary: 'Reforma oficial en reglas de validación de CFDI atípicos',
      effective_date: '2026-11-01',
      laws_affected: ['CFF Art. 29-A'],
      action_required: 'Verificar CFDI en módulo atípicos',
      created_at: '2026-10-31 15:00:00',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, events: [mockLiveEvent] }),
    });

    await act(async () => {
      render(<RegulatoryTicker />);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/Actualización Urgente CFF Art. 29-A/i).length).toBeGreaterThan(0);
    });
  });

  it('abre el modal con el detalle y fundamento legal al hacer clic en un item', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, events: [] }),
    });

    const onSelectToolMock = vi.fn();
    await act(async () => {
      render(<RegulatoryTicker onSelectTool={onSelectToolMock} />);
    });

    // Clic en la garantía de la Herramienta #18
    const itemButton = screen.getAllByText(/HERRAMIENTA #18:/i)[0]!.closest('button');
    expect(itemButton).toBeInTheDocument();
    fireEvent.click(itemButton!);

    // Verifica que el modal se abra
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Actualización y Recargos Fiscales/i)).toBeInTheDocument();
    expect(screen.getByText(/Código Fiscal de la Federación/i)).toBeInTheDocument();

    // Botón de navegar a herramienta
    const openToolBtn = screen.getByText('Abrir Herramienta');
    expect(openToolBtn).toBeInTheDocument();
    fireEvent.click(openToolBtn);

    expect(onSelectToolMock).toHaveBeenCalledWith('recargos');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('permite cerrar el modal con el botón de cerrar', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, events: [] }),
    });

    await act(async () => {
      render(<RegulatoryTicker />);
    });

    const itemButton = screen.getAllByText(/HERRAMIENTA #19:/i)[0]!.closest('button');
    expect(itemButton).toBeInTheDocument();
    fireEvent.click(itemButton!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const closeBtn = screen.getByText('Cerrar');
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('soporta fallos de red sin romper la interfaz', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<RegulatoryTicker />);
    });

    // Sigue mostrando la cinta con las garantías estáticas de la suite
    expect(screen.getByText('RADAR REGTECH')).toBeInTheDocument();
    expect(screen.getAllByText(/HERRAMIENTA #20:/i).length).toBeGreaterThan(0);
  });
});

/**
 * ARK TOOLS — Test de Integración y UI del Motor de Conciliación Anexo 24
 * Herramienta #16
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConciliadorAnexo24 } from './ConciliadorAnexo24';

describe('ConciliadorAnexo24 (src/tools/anexo24/ConciliadorAnexo24.tsx)', () => {
  let anclasDescargadas: HTMLAnchorElement[];

  beforeEach(() => {
    (URL as unknown as Record<string, unknown>).createObjectURL = vi.fn(() => 'blob:mock-url');
    (URL as unknown as Record<string, unknown>).revokeObjectURL = vi.fn();

    anclasDescargadas = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      anclasDescargadas.push(this);
    });
  });

  afterEach(() => {
    delete (URL as unknown as Record<string, unknown>).createObjectURL;
    delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
    vi.restoreAllMocks();
  });

  it('renderiza título principal, badges oficiales y componentes iniciales', () => {
    const onBack = vi.fn();
    render(<ConciliadorAnexo24 onBack={onBack} />);

    expect(screen.getByText(/Herramienta #16 · Automatización Cero-Captura/i)).toBeDefined();
    expect(screen.getByText(/Motor de Conciliación Anexo 24/i)).toBeDefined();
    expect(screen.getByText(/1. Facturas CFDI \(XML\)/i)).toBeDefined();
    expect(screen.getByText(/2. Metadata del SAT \(TXT\)/i)).toBeDefined();
    expect(screen.getByText(/3. Contabilidad Anexo 24/i)).toBeDefined();

    const btnBack = screen.getByText(/Volver al dashboard/i);
    fireEvent.click(btnBack);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('permite cargar el lote de demostración y genera las pólizas cuadradas', async () => {
    render(<ConciliadorAnexo24 />);

    const btnDemo = screen.getByText(/Cargar Lote de Demostración/i);
    fireEvent.click(btnDemo);

    await waitFor(() => {
      expect(screen.getByText(/CUADRADO \(Debe = Haber\)/i)).toBeDefined();
    });

    expect(screen.getByText(/Conciliación Cuadrada al Centavo/i)).toBeDefined();

    // Debe mostrar que 1 factura fue descartada por Metadata del SAT
    expect(screen.getByText(/Descartados de pólizas/i)).toBeDefined();

    // Pestaña de Canceladas SAT
    const tabCanceladas = screen.getByText(/Canceladas SAT/i);
    expect(tabCanceladas).toBeDefined();
    fireEvent.click(tabCanceladas);

    await waitFor(() => {
      expect(
        screen.getByText(
          /CFDI descartado: Estatus CANCELADO verificado contra Metadata oficial del SAT/i
        )
      ).toBeDefined();
    });
  });

  it('permite exportar la conciliación a CSV con BOM y layout Contpaqi', async () => {
    render(<ConciliadorAnexo24 />);

    const btnDemo = screen.getByText(/Cargar Lote de Demostración/i);
    fireEvent.click(btnDemo);

    await waitFor(() => {
      expect(screen.getByText(/CSV \(BOM UTF-8\)/i)).toBeDefined();
    });

    const btnCsv = screen.getByText(/CSV \(BOM UTF-8\)/i);
    fireEvent.click(btnCsv);

    const btnContpaqi = screen.getByText(/Layout Pólizas \(Contpaqi\)/i);
    fireEvent.click(btnContpaqi);

    expect(anclasDescargadas.length).toBe(2);
    expect(anclasDescargadas[0]?.download).toMatch(/conciliacion_anexo24_.*\.csv/);
    expect(anclasDescargadas[1]?.download).toMatch(/polizas_contpaqi_.*\.txt/);
  });

  it('permite limpiar todos los datos cargados', async () => {
    render(<ConciliadorAnexo24 />);

    const btnDemo = screen.getByText(/Cargar Lote de Demostración/i);
    fireEvent.click(btnDemo);

    await waitFor(() => {
      expect(screen.getByText(/Limpiar Todo/i)).toBeDefined();
    });

    const btnLimpiar = screen.getByText(/Limpiar Todo/i);
    fireEvent.click(btnLimpiar);

    await waitFor(() => {
      expect(screen.queryByText(/CUADRADO \(Debe = Haber\)/i)).toBeNull();
    });
  });
});

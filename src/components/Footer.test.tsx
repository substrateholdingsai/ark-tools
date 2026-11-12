import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from './Footer';
import { ARK_BRAND_CONFIG } from '@/config/brand/ark';
import { CANACO_MERIDA_BRAND_CONFIG } from '@/config/brand/canacoMerida';

describe('Footer & LegalComplianceModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('abre el modal en cada pestaña de compliance con datos de ARK_BRAND_CONFIG', () => {
    render(<Footer brand={ARK_BRAND_CONFIG} />);

    fireEvent.click(screen.getByRole('button', { name: 'Aviso de Privacidad' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Aviso de Privacidad Integral' })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Substrate Holdings LLC/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/pavel@arksystems\.site/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal legal' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Términos de Servicio' }));
    expect(
      screen.getByRole('heading', { name: 'Términos y Condiciones de Servicio' })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Facturapi v2/).length).toBeGreaterThan(0);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Seguridad de Datos' }));
    expect(
      screen.getByRole('heading', { name: 'Política de Seguridad y Manejo de Datos Personales' })
    ).toBeInTheDocument();
  });

  it('adapta el modal dinámicamente cuando se renderiza con CANACO_MERIDA_BRAND_CONFIG', () => {
    render(<Footer brand={CANACO_MERIDA_BRAND_CONFIG} />);

    fireEvent.click(screen.getByRole('button', { name: 'Aviso de Privacidad' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getAllByText(/Cámara Nacional de Comercio, Servicios y Turismo de Mérida/).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/afiliaciones@canacomerida\.com\.mx/).length).toBeGreaterThan(0);
  });

  it('abre la vista imprimible en nueva pestaña sin invocar window.print() en la pestaña principal', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => ({}) as Window);
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    const createUrlMock = vi.fn(() => 'blob:mock-legal-doc');
    const revokeUrlMock = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createUrlMock, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrlMock, configurable: true });

    try {
      render(<Footer brand={ARK_BRAND_CONFIG} />);
      fireEvent.click(screen.getByRole('button', { name: 'Aviso de Privacidad' }));
      fireEvent.click(screen.getByRole('button', { name: /Vista Imprimible/i }));

      expect(createUrlMock).toHaveBeenCalledTimes(1);
      expect(openSpy).toHaveBeenCalledWith('blob:mock-legal-doc', '_blank', 'noopener,noreferrer');
      expect(printSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(URL, 'createObjectURL', {
        value: originalCreateObjectUrl,
        configurable: true,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: originalRevokeObjectUrl,
        configurable: true,
      });
    }
  });

  it('muestra Facturapi v2 (Sandbox SAT) en el enlace de timbrado sin mencionar Alegra ni Quadrum', () => {
    const { container } = render(<Footer brand={ARK_BRAND_CONFIG} />);
    expect(
      screen.getByRole('button', { name: /Timbrado Facturas CFDI 4\.0 \(Facturapi v2/i })
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Alegra|Quadrum/i);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProUpgradeModal } from './ProUpgradeModal';

describe('ProUpgradeModal Component', () => {
  it('renderiza título, propuesta de valor y precio de $399 MXN cuando isOpen es true', () => {
    render(<ProUpgradeModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText(/Eleva tu Práctica Contable/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan Despacho Pro/i)).toBeInTheDocument();
    expect(screen.getByText('$399')).toBeInTheDocument();
    expect(screen.getByText(/SUSCRIBIRSE PRO \(\$399 MXN\)/i)).toBeInTheDocument();
  });

  it('no renderiza nada en el DOM cuando isOpen es false', () => {
    const { container } = render(<ProUpgradeModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('muestra el motivo específico de bloqueo Pro recibido por props', () => {
    const reasonText = 'Para descargar la Cédula Oficial Carta en PDF con Sello SHA-256';
    render(<ProUpgradeModal isOpen={true} onClose={() => {}} reason={reasonText} />);

    expect(screen.getByText(reasonText)).toBeInTheDocument();
  });

  it('ejecuta onClose al hacer clic en Continuar en Modo Libre', () => {
    const handleClose = vi.fn();
    render(<ProUpgradeModal isOpen={true} onClose={handleClose} />);

    const botonModoLibre = screen.getByRole('button', { name: /Continuar en Modo Libre/i });
    fireEvent.click(botonModoLibre);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('el enlace de pago contiene la URL del checkout de Clip', () => {
    render(<ProUpgradeModal isOpen={true} onClose={() => {}} />);

    const link = screen.getByRole('link', { name: /SUSCRIBIRSE PRO/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('clip.mx'));
    expect(link).toHaveAttribute('target', '_blank');
  });
});

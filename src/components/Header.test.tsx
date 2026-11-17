import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('@/context/AuthContext', () => ({
  SignedIn: ({ children }: { children: ReactNode }) => children,
  SignedOut: () => null,
  useAuth: () => ({
    user: { email: 'admin@example.test', fullName: 'Admin' },
    tenantName: 'Despacho',
    tenants: [],
    organization: null,
    platformRole: 'super_admin',
  }),
}));

vi.mock('./team/TeamModal', () => ({ TeamModal: () => null }));

describe('Header', () => {
  it('abre el menú de navegación y conserva las acciones de administración y usuario', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <Header
        onNavigate={onNavigate}
        navItems={[
          { id: 'dashboard', label: 'TODAS' },
          { id: 'dof', label: 'DOF' },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Abrir menú de usuario' })).toBeInTheDocument();
    expect(screen.getByTitle('Consola de Super Administrador')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Abrir menú de navegación' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Cerrar menú de navegación' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    const menu = screen.getByRole('navigation', { name: 'Menú de categorías de herramientas' });
    await user.click(within(menu).getByRole('button', { name: 'DOF' }));
    expect(onNavigate).toHaveBeenCalledWith('dof');
    expect(screen.getByRole('button', { name: 'Abrir menú de navegación' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});

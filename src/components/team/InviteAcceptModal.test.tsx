import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteAcceptModal } from './InviteAcceptModal';

// Mock de useAuth
const mockRefreshSession = vi.fn();
const mockSwitchTenant = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isSignedIn: true,
    user: { id: 'user-1', email: 'invitado@aguila.com', fullName: 'Carlos Invitado' },
    refreshSession: mockRefreshSession,
    switchTenant: mockSwitchTenant,
    signOut: mockSignOut,
  }),
}));

// Mock de apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    teams: {
      getInvitationInfo: vi.fn(),
      acceptInvitation: vi.fn(),
    },
  },
}));

import { apiClient } from '@/lib/apiClient';

describe('InviteAcceptModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la información del despacho y permite aceptar al usuario autenticado', async () => {
    vi.mocked(apiClient.teams.getInvitationInfo).mockResolvedValueOnce({
      valid: true,
      invitation: {
        id: 'inv-123',
        email: 'invitado@aguila.com',
        tenantName: 'Despacho Horizonte',
        role: 'member',
        inviterName: 'Lic. Morales',
        expiresAt: 1792900000,
      },
      userExists: true,
    });

    vi.mocked(apiClient.teams.acceptInvitation).mockResolvedValueOnce({
      success: true,
      message: 'Te has unido exitosamente.',
      session: {
        user: { id: 'user-1', email: 'invitado@aguila.com', fullName: 'Carlos Invitado' },
        tenants: [{ id: 't-horizonte', name: 'Despacho Horizonte', slug: 'despacho-horizonte', role: 'member' }],
        platformRole: 'user',
      },
    });

    const mockSuccess = vi.fn();

    render(
      <InviteAcceptModal
        token={'a'.repeat(64)}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={mockSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Despacho Horizonte')).toBeInTheDocument();
      expect(screen.getByText(/Lic. Morales/)).toBeInTheDocument();
      expect(screen.getByText('ACEPTAR INVITACIÓN Y ENTRAR')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByText('ACEPTAR INVITACIÓN Y ENTRAR');
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(apiClient.teams.acceptInvitation).toHaveBeenCalledWith({
        token: 'a'.repeat(64),
        password: undefined,
        fullName: undefined,
      });
      expect(mockRefreshSession).toHaveBeenCalled();
      expect(mockSwitchTenant).toHaveBeenCalledWith('t-horizonte');
      expect(mockSuccess).toHaveBeenCalled();
    });
  });

  it('muestra mensaje de error si la invitación es inválida o expiró', async () => {
    vi.mocked(apiClient.teams.getInvitationInfo).mockResolvedValueOnce({
      valid: false,
      error: 'Esta invitación ha sido revocada por el despacho.',
    });

    render(
      <InviteAcceptModal
        token={'b'.repeat(64)}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Invitación no disponible')).toBeInTheDocument();
      expect(screen.getByText('Esta invitación ha sido revocada por el despacho.')).toBeInTheDocument();
    });
  });
});

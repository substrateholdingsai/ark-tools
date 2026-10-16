/**
 * useTenant Hook
 *
 * Provee la identidad del tenant activo (Despacho u Organización contable).
 * Basado en el contexto nativo de ARK TOOLS.
 */

import { useAuth } from '@/context/AuthContext';

export interface TenantInfo {
  isLoaded: boolean;
  tenantId: string;
  tenantName: string;
  tenantSlug: string | null;
  isOrg: boolean;
  role: string | null;
  userEmail: string | null;
}

export function useTenant(): TenantInfo {
  const { isLoaded, tenantId, tenantName, organization, isOrg, orgRole, email } = useAuth();

  return {
    isLoaded,
    tenantId: tenantId || 'guest-local',
    tenantName,
    tenantSlug: organization?.slug || null,
    isOrg,
    role: orgRole,
    userEmail: email,
  };
}

export default useTenant;

/**
 * useAuth Hook
 *
 * Hook unificado de autenticación y multi-tenant para ARK LEDGER.
 * Re-exporta el contexto nativo independiente sin dependencias externas.
 */

export { useAuth, SignedIn, SignedOut } from '@/context/AuthContext';
export type { AuthContextType, UserProfile, TenantOrg } from '@/context/AuthContext';
export { default } from '@/context/AuthContext';

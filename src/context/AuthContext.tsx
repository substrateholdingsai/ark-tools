import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, type AuthSession } from '@/lib/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

export interface TenantOrg {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member';
}

interface AuthState {
  isLoaded: boolean;
  user: UserProfile | null;
  activeTenant: TenantOrg | null;
  tenants: TenantOrg[];
  platformRole: 'user' | 'super_admin';
}

interface RegisterInput {
  email: string;
  fullName?: string;
  tenantName?: string;
}

export interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: UserProfile | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  organization: TenantOrg | null;
  tenantId: string | null;
  tenantName: string;
  isOrg: boolean;
  orgRole: TenantOrg['role'] | null;
  platformRole: 'user' | 'super_admin';
  tenants: TenantOrg[];
  register: (data: RegisterInput) => Promise<string>;
  signIn: (email: string, password: string) => Promise<void>;
  verifyEmail: (token: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => void;
  createTenant: (name: string) => Promise<TenantOrg>;
}

const ACTIVE_TENANT_KEY = 'ark.auth.active-tenant.v1';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function signedOutState(): AuthState {
  return {
    isLoaded: true,
    user: null,
    activeTenant: null,
    tenants: [],
    platformRole: 'user',
  };
}

function stateFromSession(session: AuthSession): AuthState {
  let preferredTenantId: string | null = null;
  try {
    preferredTenantId = window.localStorage.getItem(ACTIVE_TENANT_KEY);
  } catch {
    preferredTenantId = null;
  }
  const activeTenant =
    session.tenants.find((tenant) => tenant.id === preferredTenantId) || session.tenants[0] || null;
  return {
    isLoaded: true,
    user: session.user,
    activeTenant,
    tenants: session.tenants,
    platformRole: session.platformRole,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoaded: false,
    user: null,
    activeTenant: null,
    tenants: [],
    platformRole: 'user',
  });

  const acceptSession = useCallback((session: AuthSession) => {
    const next = stateFromSession(session);
    setState(next);
    try {
      window.localStorage.removeItem('ark.auth.session.v1');
      if (next.activeTenant) {
        window.localStorage.setItem(ACTIVE_TENANT_KEY, next.activeTenant.id);
      }
    } catch {
      console.warn('[Auth] No se pudo guardar el despacho activo en este navegador.');
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const session = await apiClient.auth.session();
    if (session) {
      acceptSession(session);
    } else {
      setState(signedOutState());
      try {
        window.localStorage.removeItem(ACTIVE_TENANT_KEY);
        window.localStorage.removeItem('ark.auth.session.v1');
      } catch {
        console.warn('[Auth] No se pudo limpiar el estado de sesión local.');
      }
    }
  }, [acceptSession]);

  useEffect(() => {
    let cancelled = false;
    apiClient.auth
      .session()
      .then((session) => {
        if (cancelled) return;
        if (session) acceptSession(session);
        else setState(signedOutState());
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('[Auth] No se pudo validar la sesión con el servidor.', error);
        setState(signedOutState());
      });
    return () => {
      cancelled = true;
    };
  }, [acceptSession]);

  const register = useCallback(async (data: RegisterInput) => {
    const result = await apiClient.auth.register(data);
    return result.message;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await apiClient.auth.login({ email, password });
      acceptSession(session);
    },
    [acceptSession]
  );

  const verifyEmail = useCallback(
    async (token: string, password: string) => {
      const session = await apiClient.auth.verifyEmail(token, password);
      acceptSession(session);
    },
    [acceptSession]
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await apiClient.auth.requestPasswordReset(email);
    return result.message;
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    const result = await apiClient.auth.resetPassword(token, password);
    return result.message;
  }, []);

  const signOut = useCallback(async () => {
    await apiClient.auth.logout();
    setState(signedOutState());
    try {
      window.localStorage.removeItem(ACTIVE_TENANT_KEY);
    } catch {
      console.warn('[Auth] No se pudo limpiar el despacho activo.');
    }
  }, []);

  const switchTenant = useCallback((tenantId: string) => {
    setState((previous) => {
      const tenant = previous.tenants.find((candidate) => candidate.id === tenantId);
      if (!tenant) return previous;
      try {
        window.localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
      } catch {
        console.warn('[Auth] No se pudo recordar el despacho seleccionado.');
      }
      return { ...previous, activeTenant: tenant };
    });
  }, []);

  const createTenant = useCallback(async (name: string) => {
    const { tenant } = await apiClient.auth.createTenant(name);
    setState((previous) => ({
      ...previous,
      activeTenant: tenant,
      tenants: [...previous.tenants, tenant],
    }));
    try {
      window.localStorage.setItem(ACTIVE_TENANT_KEY, tenant.id);
    } catch {
      console.warn('[Auth] No se pudo recordar el nuevo despacho.');
    }
    return tenant;
  }, []);

  const contextValue = useMemo<AuthContextType>(() => {
    const tenantId = state.activeTenant?.id ?? null;
    const tenantName = state.activeTenant?.name ?? 'Espacio Personal';
    return {
      isLoaded: state.isLoaded,
      isSignedIn: Boolean(state.user),
      user: state.user,
      userId: state.user?.id ?? null,
      email: state.user?.email ?? null,
      fullName: state.user?.fullName ?? null,
      organization: state.activeTenant,
      tenantId,
      tenantName,
      isOrg: Boolean(state.activeTenant),
      orgRole: state.activeTenant?.role ?? null,
      platformRole: state.platformRole,
      tenants: state.tenants,
      register,
      signIn,
      verifyEmail,
      requestPasswordReset,
      resetPassword,
      refreshSession,
      signOut,
      switchTenant,
      createTenant,
    };
  }, [
    state,
    register,
    signIn,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    refreshSession,
    signOut,
    switchTenant,
    createTenant,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export function useOptionalAuth(): AuthContextType | null {
  return useContext(AuthContext) ?? null;
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  return isLoaded && !isSignedIn ? <>{children}</> : null;
}

export default AuthContext;

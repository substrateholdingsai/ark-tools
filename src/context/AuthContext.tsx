/**
 * ARK TOOLS — Native Auth & Multi-Tenant Context
 *
 * Sistema nativo y ligero de autenticación y multi-tenancy sin dependencias externas
 * ni restricciones geográficas. Persiste la sesión en almacenamiento local y sincroniza
 * con la base de datos Cloudflare D1 (users y tenants).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
}

export interface TenantOrg {
  id: string;
  name: string;
  slug: string;
  role: 'admin' | 'member';
}

interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: UserProfile | null;
  activeTenant: TenantOrg | null;
  tenants: TenantOrg[];
}

export interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: UserProfile | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;

  // Multi-tenant
  organization: TenantOrg | null;
  tenantId: string | null;
  tenantName: string;
  isOrg: boolean;
  orgRole: string | null;
  tenants: TenantOrg[];

  // Acciones
  login: (data: { email: string; fullName?: string; tenantName?: string }) => Promise<void>;
  signOut: () => void;
  getToken: () => Promise<string | null>;
  switchTenant: (tenantId: string) => void;
  createTenant: (name: string) => Promise<TenantOrg>;
}

const STORAGE_KEY = 'ark.auth.session.v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === 'undefined') {
      return {
        isLoaded: false,
        isSignedIn: false,
        user: null,
        activeTenant: null,
        tenants: [],
      };
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user?.id) {
          return {
            isLoaded: true,
            isSignedIn: true,
            user: parsed.user,
            activeTenant: parsed.activeTenant || null,
            tenants: parsed.tenants || [],
          };
        }
      }
    } catch {
      // Ignorar error de parsing
    }

    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
      activeTenant: null,
      tenants: [],
    };
  });

  // Guardar en localStorage ante cualquier cambio
  useEffect(() => {
    if (!state.isLoaded) return;
    try {
      if (state.isSignedIn && state.user) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user: state.user,
            activeTenant: state.activeTenant,
            tenants: state.tenants,
          })
        );
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // noop
    }
  }, [state]);

  const login = useCallback(
    async (data: { email: string; fullName?: string; tenantName?: string }) => {
      const email = data.email.trim().toLowerCase();
      const fullName = data.fullName?.trim() || email.split('@')[0] || 'Contador';
      const defaultTenantTitle = data.tenantName?.trim() || `Despacho ${fullName}`;

      // Derivar o generar ID estable por email
      const existingRaw = window.localStorage.getItem(STORAGE_KEY);
      let existingUser: UserProfile | null = null;
      let existingTenants: TenantOrg[] = [];

      try {
        if (existingRaw) {
          const parsed = JSON.parse(existingRaw);
          if (parsed?.user?.email === email) {
            existingUser = parsed.user;
            existingTenants = parsed.tenants || [];
          }
        }
      } catch {
        // noop
      }

      const user: UserProfile = existingUser || {
        id: generateId('user'),
        email,
        fullName,
      };

      const initialTenant: TenantOrg = existingTenants[0] || {
        id: generateId('org'),
        name: defaultTenantTitle,
        slug: slugify(defaultTenantTitle),
        role: 'admin',
      };

      const allTenants = existingTenants.length > 0 ? existingTenants : [initialTenant];

      setState({
        isLoaded: true,
        isSignedIn: true,
        user,
        activeTenant: initialTenant,
        tenants: allTenants,
      });

      // Sincronización silenciosa con D1
      apiClient.auth
        .sync({
          user_id: user.id,
          email: user.email,
          full_name: user.fullName,
          tenant_id: initialTenant.id,
          tenant_name: initialTenant.name,
          tenant_slug: initialTenant.slug,
        })
        .catch((err) => {
          console.debug('[AuthSync] Sincronización local offline/error:', err);
        });
    },
    []
  );

  const signOut = useCallback(() => {
    setState({
      isLoaded: true,
      isSignedIn: false,
      user: null,
      activeTenant: null,
      tenants: [],
    });
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!state.user) return null;
    return `ark_session_${state.user.id}_${state.activeTenant?.id || 'personal'}`;
  }, [state.user, state.activeTenant]);

  const switchTenant = useCallback((tenantId: string) => {
    setState((prev) => {
      const match = prev.tenants.find((t) => t.id === tenantId);
      if (!match) return prev;
      return {
        ...prev,
        activeTenant: match,
      };
    });
  }, []);

  const createTenant = useCallback(
    async (name: string): Promise<TenantOrg> => {
      const trimmed = name.trim();
      const newTenant: TenantOrg = {
        id: generateId('org'),
        name: trimmed,
        slug: slugify(trimmed),
        role: 'admin',
      };

      setState((prev) => {
        const nextTenants = [...prev.tenants, newTenant];
        return {
          ...prev,
          activeTenant: newTenant,
          tenants: nextTenants,
        };
      });

      if (state.user) {
        apiClient.auth
          .sync({
            user_id: state.user.id,
            email: state.user.email,
            full_name: state.user.fullName,
            tenant_id: newTenant.id,
            tenant_name: newTenant.name,
            tenant_slug: newTenant.slug,
          })
          .catch(() => {});
      }

      return newTenant;
    },
    [state.user]
  );

  const contextValue = useMemo<AuthContextType>(() => {
    const tenantId = state.activeTenant?.id ?? state.user?.id ?? null;
    const tenantName = state.activeTenant?.name ?? state.user?.fullName ?? 'Espacio Personal';

    return {
      isLoaded: state.isLoaded,
      isSignedIn: state.isSignedIn,
      user: state.user,
      userId: state.user?.id ?? null,
      email: state.user?.email ?? null,
      fullName: state.user?.fullName ?? null,
      organization: state.activeTenant,
      tenantId,
      tenantName,
      isOrg: Boolean(state.activeTenant),
      orgRole: state.activeTenant?.role ?? null,
      tenants: state.tenants,
      login,
      signOut,
      getToken,
      switchTenant,
      createTenant,
    };
  }, [state, login, signOut, getToken, switchTenant, createTenant]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  return !isSignedIn ? <>{children}</> : null;
}

export default AuthContext;

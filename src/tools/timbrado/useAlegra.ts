/**
 * ARK TOOLS — Hook para Integración y Timbrado CFDI 4.0 con Alegra
 *
 * Administra el estado de conexión de cuentas multi-empresa, comprobación
 * de certificados CSD, historial de facturación y emisión de CFDIs.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import apiClient, {
  type AlegraAccount,
  type AlegraInvoiceInputPayload,
  type AlegraInvoiceRecord,
} from '@/lib/apiClient';

const BANNER_DISMISS_KEY_PREFIX = 'ark_alegra_banner_dismiss_';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useAlegra() {
  const { tenantId, isSignedIn } = useAuth();

  const [accounts, setAccounts] = useState<AlegraAccount[]>([]);
  const [invoices, setInvoices] = useState<AlegraInvoiceRecord[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissedUntil, setBannerDismissedUntil] = useState<number>(0);

  // Cargar estado de banner descartado desde localStorage
  useEffect(() => {
    if (!tenantId) return;
    try {
      const stored = localStorage.getItem(`${BANNER_DISMISS_KEY_PREFIX}${tenantId}`);
      if (stored) {
        setBannerDismissedUntil(Number(stored) || 0);
      }
    } catch {
      // Ignorar errores en navegadores restrictivos
    }
  }, [tenantId]);

  const isBannerDismissed = useMemo(() => {
    return Date.now() < bannerDismissedUntil;
  }, [bannerDismissedUntil]);

  const dismissBannerFor7Days = useCallback(() => {
    if (!tenantId) return;
    const expiresAt = Date.now() + SEVEN_DAYS_MS;
    try {
      localStorage.setItem(`${BANNER_DISMISS_KEY_PREFIX}${tenantId}`, String(expiresAt));
    } catch {
      // Ignorar
    }
    setBannerDismissedUntil(expiresAt);
  }, [tenantId]);

  // Cargar cuentas del despacho
  const refreshAccounts = useCallback(async () => {
    if (!tenantId || !isSignedIn) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await apiClient.alegra.getAccounts(tenantId);
      const safeList = Array.isArray(list) ? list : [];
      setAccounts(safeList);

      // Si no hay cuenta seleccionada o la actual ya no existe, seleccionar default
      setSelectedAccountId((prev) => {
        if (prev && safeList.some((a) => a.alegra_account_id === prev)) {
          return prev;
        }
        const defaultAcc = safeList.find((a) => a.is_default) || safeList[0];
        return defaultAcc ? defaultAcc.alegra_account_id : null;
      });
    } catch (err: any) {
      setError(err?.message || 'Error al cargar cuentas de Alegra.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSignedIn]);

  // Cargar historial de facturas emitidas
  const refreshInvoices = useCallback(async () => {
    if (!tenantId || !isSignedIn) {
      setInvoices([]);
      return;
    }
    try {
      const list = await apiClient.alegra.getInvoices(tenantId, { limit: 50 });
      setInvoices(Array.isArray(list) ? list : []);
    } catch (err: any) {
      console.error('[useAlegra] Error al cargar facturas:', err);
    }
  }, [tenantId, isSignedIn]);

  useEffect(() => {
    if (tenantId && isSignedIn) {
      void refreshAccounts();
      void refreshInvoices();
    } else {
      setAccounts([]);
      setInvoices([]);
      setLoading(false);
    }
  }, [tenantId, isSignedIn, refreshAccounts, refreshInvoices]);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.alegra_account_id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Cuentas con problemas (revocadas, error o sin CSD)
  const accountsNeedingAttention = useMemo(() => {
    return accounts.filter((a) => a.status !== 'active' || !a.csd_configured);
  }, [accounts]);

  // Conectar nueva cuenta
  const connectAccount = useCallback(
    async (params: { alegra_email: string; alegra_token: string; is_default?: boolean }) => {
      if (!tenantId) throw new Error('No hay un despacho activo.');
      setSubmitting(true);
      setError(null);
      try {
        const res = await apiClient.alegra.connectAccount({
          tenant_id: tenantId,
          ...params,
        });
        await refreshAccounts();
        setSelectedAccountId(res.account.alegra_account_id);
        return res.account;
      } catch (err: any) {
        setError(err?.message || 'Error al conectar cuenta.');
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tenantId, refreshAccounts]
  );

  // Marcar como predeterminada
  const setDefaultAccount = useCallback(
    async (accountId: string) => {
      if (!tenantId) return;
      try {
        await apiClient.alegra.setDefaultAccount(tenantId, accountId);
        await refreshAccounts();
      } catch (err: any) {
        setError(err?.message || 'Error al actualizar cuenta predeterminada.');
        throw err;
      }
    },
    [tenantId, refreshAccounts]
  );

  // Desconectar cuenta
  const disconnectAccount = useCallback(
    async (accountId: string) => {
      if (!tenantId) return;
      try {
        await apiClient.alegra.disconnectAccount(tenantId, accountId);
        await refreshAccounts();
      } catch (err: any) {
        setError(err?.message || 'Error al desconectar cuenta.');
        throw err;
      }
    },
    [tenantId, refreshAccounts]
  );

  // Sincronizar estado y CSD en tiempo real
  const refreshAccountStatus = useCallback(
    async (accountId: string) => {
      if (!tenantId) throw new Error('No hay un despacho activo.');
      try {
        const res = await apiClient.alegra.getAccountStatus(tenantId, accountId);
        await refreshAccounts();
        return res.account;
      } catch (err: any) {
        setError(err?.message || 'Error al verificar cuenta con Alegra.');
        throw err;
      }
    },
    [tenantId, refreshAccounts]
  );

  // Emitir y timbrar factura
  const createInvoice = useCallback(
    async (payload: AlegraInvoiceInputPayload, accountId?: string, clientId?: string) => {
      if (!tenantId) throw new Error('No hay un despacho activo.');
      setSubmitting(true);
      setError(null);
      try {
        const targetAccountId = accountId || selectedAccountId || undefined;
        const res = await apiClient.alegra.createInvoice({
          tenant_id: tenantId,
          alegra_account_id: targetAccountId,
          client_id: clientId,
          invoice: payload,
        });
        await refreshInvoices();
        return res.invoice;
      } catch (err: any) {
        setError(err?.message || 'Error al emitir y timbrar factura.');
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tenantId, selectedAccountId, refreshInvoices]
  );

  return {
    accounts: accounts || [],
    invoices: invoices || [],
    selectedAccount,
    selectedAccountId,
    setSelectedAccountId,
    accountsNeedingAttention,
    isBannerDismissed,
    dismissBannerFor7Days,
    loading,
    submitting,
    error,
    refreshAccounts,
    refreshInvoices,
    connectAccount,
    setDefaultAccount,
    disconnectAccount,
    refreshAccountStatus,
    createInvoice,
    hasConnectedAccount: (accounts || []).length > 0,
  };
}

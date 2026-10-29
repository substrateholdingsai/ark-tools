/**
 * ARK LEDGER — Hook React: useProPlan
 *
 * Expone de forma reactiva el estado de suscripción del despacho / usuario:
 * - isPro: boolean (true si tiene Plan Pro o Enterprise o Super Admin)
 * - plan: 'free' | 'pro' | 'enterprise'
 * - openUpgradeModal(reason): abre el modal con motivo específico
 * - checkCanExport(): valida si puede exportar cédulas oficiales o abre el modal
 */

import { useState, useEffect, useCallback } from 'react';
import { useOptionalAuth } from '@/context/AuthContext';

export interface UseProPlanReturn {
  isPro: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  loading: boolean;
  paymentUrl: string;
  upgradeModalOpen: boolean;
  upgradeReason: string;
  openUpgradeModal: (reason?: string) => void;
  closeUpgradeModal: () => void;
  requireProFeature: (reason: string, callback?: () => void) => boolean;
}

export function useProPlan(): UseProPlanReturn {
  const auth = useOptionalAuth();
  const isSuperAdmin = auth?.platformRole === 'super_admin';
  const tenantId = auth?.tenantId || 'ark';

  // Si es Super Admin o tenant 'canaco_merida', es Pro permanente
  const isInstitutionalPro = isSuperAdmin || tenantId === 'canaco_merida' || tenantId === 'ark';

  const [isPro, setIsPro] = useState<boolean>(isInstitutionalPro);
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>(
    isSuperAdmin ? 'enterprise' : isInstitutionalPro ? 'pro' : 'free'
  );
  const [loading, setLoading] = useState<boolean>(!isInstitutionalPro);
  const [paymentUrl, setPaymentUrl] = useState<string>(
    'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65'
  );
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('Acceso a funciones avanzadas Pro');

  const checkStatus = useCallback(async () => {
    if (isInstitutionalPro) {
      setIsPro(true);
      setPlan(isSuperAdmin ? 'enterprise' : 'pro');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/billing/status?tenant_id=${encodeURIComponent(tenantId)}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        setIsPro(Boolean(data.is_pro));
        setPlan(data.plan || 'free');
        if (data.payment_url) {
          setPaymentUrl(data.payment_url);
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  }, [tenantId, isInstitutionalPro, isSuperAdmin]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const openUpgradeModal = useCallback((reason = 'Desbloquea funciones avanzadas de despacho') => {
    setUpgradeReason(reason);
    setUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModalOpen(false);
  }, []);

  /**
   * Guarda de ejecución: si el usuario es Pro, ejecuta el callback de inmediato y retorna true.
   * Si es Free, abre el modal de upgrade con el motivo y retorna false.
   */
  const requireProFeature = useCallback(
    (reason: string, callback?: () => void): boolean => {
      if (isPro) {
        if (callback) callback();
        return true;
      }
      openUpgradeModal(reason);
      return false;
    },
    [isPro, openUpgradeModal]
  );

  return {
    isPro,
    plan,
    loading,
    paymentUrl,
    upgradeModalOpen,
    upgradeReason,
    openUpgradeModal,
    closeUpgradeModal,
    requireProFeature,
  };
}

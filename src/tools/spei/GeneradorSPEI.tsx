/**
 * ARK LEDGER — Generador de Links de Pago (Clip Checkout)
 * Componente Principal
 *
 * Permite a contadores y despachos generar enlaces de cobro con Clip Checkout,
 * calcular comisiones en tiempo real (3.6% + IVA y MSI), y compartir
 * el enlace de pago con sus clientes en 1 clic por WhatsApp.
 *
 * @see https://developer.clip.mx/docs/getting-started
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Zap, Lock, Globe } from 'lucide-react';
import {
  DesgloseComisionCard,
  FormularioCobro,
  LinkGeneradoCard,
  HistorialCobrosTable,
} from './components';
import { calcularComisionClip, crearLinkPagoClip } from './lib/clipClient';
import type {
  ClipCheckoutPayload,
  ClipCheckoutResult,
  ComisionClip,
  LinkCobroGuardado,
} from './types';

const STORAGE_KEY = 'ark_clip_historial_cobros_v1';

interface GeneradorSPEIProps {
  onBack?: () => void;
}

export function GeneradorSPEI({ onBack }: GeneradorSPEIProps) {
  const [comision, setComision] = useState<ComisionClip>(() => calcularComisionClip(1500, 0));
  const [isLoading, setIsLoading] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<ClipCheckoutResult | null>(null);
  const [clienteActual, setClienteActual] = useState<string | undefined>();
  const [telefonoActual, setTelefonoActual] = useState<string | undefined>();
  const [historial, setHistorial] = useState<LinkCobroGuardado[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const handleMontoChange = useCallback((monto: number, msi: number) => {
    setComision(calcularComisionClip(monto, msi));
  }, []);

  const handleGenerarLink = useCallback(
    async (payload: ClipCheckoutPayload) => {
      setIsLoading(true);
      try {
        const resultado = await crearLinkPagoClip(payload);
        setUltimoResultado(resultado);
        setClienteActual(payload.customer_name);
        setTelefonoActual(undefined);

        // Guardar en historial
        const nuevoItem: LinkCobroGuardado = {
          id: resultado.payment_request_id,
          fecha: new Date().toISOString(),
          cliente: payload.customer_name || 'Sin especificar',
          concepto: payload.purchase_description,
          monto: resultado.amount,
          url: resultado.payment_request_url,
          paymentRequestId: resultado.payment_request_id,
          isMock: !!resultado.is_mock,
        };

        setHistorial((prev) => {
          const actualizados = [nuevoItem, ...prev].slice(0, 50);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
          } catch {
            // Ignorar errores de cuota o restricción de localStorage
          }
          return actualizados;
        });

        showToast('Link de pago Clip generado con éxito');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Error al generar el link');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const handleEliminarHistorial = useCallback(
    (id: string) => {
      setHistorial((prev) => {
        const filtrados = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));
        } catch {
          // Ignorar errores de cuota o restricción de localStorage
        }
        return filtrados;
      });
      showToast('Registro eliminado del historial');
    },
    [showToast]
  );

  return (
    <div className="mx-auto max-w-[1280px] space-y-10 px-6 py-12 md:px-10">
      {/* Botón Volver */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition-colors hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          VOLVER AL DASHBOARD
        </button>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="orbitron font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
              CLIP DEVELOPERS API
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-muted">Checkout Redireccionado v2</span>
          </div>
          <h1 className="mt-2 font-playfair text-3xl font-black tracking-tight text-ink md:text-5xl">
            Generador de Links de Pago
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Cobra honorarios contables, declaraciones y servicios de asesoría con Clip. Tus clientes
            pueden pagar con tarjeta de crédito, débito o en efectivo en OXXO®.
          </p>
        </div>
      </div>

      {/* Si se acaba de generar un link, mostrarlo de primero */}
      {ultimoResultado && (
        <section className="animate-fadeIn">
          <LinkGeneradoCard
            resultado={ultimoResultado}
            cliente={clienteActual}
            telefono={telefonoActual}
            onCopiarTexto={showToast}
          />
        </section>
      )}

      {/* Grid de Formulario y Desglose */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Formulario */}
        <section className="bg-surface-raised/40 rounded-2xl border border-white/10 p-6 shadow-xl md:p-8 lg:col-span-7">
          <h2 className="mb-6 font-playfair text-xl font-bold text-ink">Configuración del Cobro</h2>
          <FormularioCobro
            onGenerarLink={handleGenerarLink}
            onMontoChange={handleMontoChange}
            isLoading={isLoading}
          />
        </section>

        {/* Desglose de Comisión en tiempo real */}
        <section className="space-y-6 lg:col-span-5">
          <DesgloseComisionCard comision={comision} />
        </section>
      </div>

      {/* Historial de Enlaces */}
      {historial.length > 0 && (
        <section className="pt-6">
          <HistorialCobrosTable
            links={historial}
            onEliminar={handleEliminarHistorial}
            onCopiarTexto={showToast}
          />
        </section>
      )}

      {/* Badges de Garantía */}
      <div className="flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-400" />
          <span>Cumplimiento PCI DSS Nivel 1 & 3D Secure</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gold" />
          <span>Infraestructura Backend Cloudflare Workers</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-gold" />
          <span>Depósito garantizado en tu cuenta bancaria</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="animate-fadeIn fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-gold/50 bg-navy px-4 py-3 text-xs font-medium text-ink shadow-2xl shadow-gold/20">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default GeneradorSPEI;

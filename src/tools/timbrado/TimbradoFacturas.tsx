/**
 * ARK LEDGER — Timbrado de Facturas CFDI 4.0 vía Alegra (PAC Quadrum)
 *
 * Herramienta dentro de la sección Cobros que permite a los despachos
 * emitir y timbrar comprobantes fiscales digitales por internet (CFDI 4.0)
 * delegando la certificación a Alegra / PAC Quadrum sin salir de ARK LEDGER.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  History,
  Key,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient, { type AlegraInvoiceInputPayload, type ClientRecord } from '@/lib/apiClient';
import { AlegraConnectModal } from './components/AlegraConnectModal';
import { useAlegra } from './useAlegra';

interface TimbradoFacturasProps {
  onBack?: () => void;
  onNavigateToValidador?: () => void;
}

type TabType = 'nueva' | 'historial' | 'cuentas';

interface FacturaItemState {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description: string;
  productKey: string;
  unit: string;
  taxPercentage: number;
}

const REGIMENES_FISCALES = [
  { clave: '601', nombre: 'General de Ley Personas Morales' },
  { clave: '603', nombre: 'Personas Morales con Fines no Lucrativos' },
  { clave: '605', nombre: 'Sueldos y Salarios e Ingresos Asimilados' },
  { clave: '606', nombre: 'Arrendamiento' },
  { clave: '612', nombre: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '616', nombre: 'Sin obligaciones fiscales' },
  { clave: '621', nombre: 'Incorporación Fiscal' },
  { clave: '625', nombre: 'Régimen de las Actividades Empresariales con Plataformas Tecnológicas' },
  { clave: '626', nombre: 'Régimen Simplificado de Confianza (RESICO)' },
];

const USOS_CFDI = [
  { clave: 'G03', nombre: 'Gastos en general' },
  { clave: 'G01', nombre: 'Adquisición de mercancías' },
  { clave: 'G02', nombre: 'Devoluciones, descuentos o bonificaciones' },
  { clave: 'I01', nombre: 'Construcciones' },
  { clave: 'I04', nombre: 'Equipo de cómputo y accesorios' },
  { clave: 'CP01', nombre: 'Pagos' },
  { clave: 'S01', nombre: 'Sin efectos fiscales' },
];

const FORMAS_PAGO = [
  { clave: '03', nombre: '03 - Transferencia electrónica de fondos' },
  { clave: '01', nombre: '01 - Efectivo' },
  { clave: '02', nombre: '02 - Cheque nominativo' },
  { clave: '04', nombre: '04 - Tarjeta de crédito' },
  { clave: '28', nombre: '28 - Tarjeta de débito' },
  { clave: '99', nombre: '99 - Por definir' },
];

export const TimbradoFacturas: React.FC<TimbradoFacturasProps> = ({
  onBack,
  onNavigateToValidador,
}) => {
  const { tenantId } = useAuth();
  const {
    accounts,
    invoices,
    selectedAccount,
    selectedAccountId,
    setSelectedAccountId,
    accountsNeedingAttention,
    isBannerDismissed,
    dismissBannerFor7Days,
    loading,
    submitting,
    error,
    refreshInvoices,
    connectAccount,
    setDefaultAccount,
    disconnectAccount,
    refreshAccountStatus,
    createInvoice,
    hasConnectedAccount,
  } = useAlegra();

  // Tabs
  const [activeTab, setActiveTab] = useState<TabType>('nueva');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [clientsList, setClientsList] = useState<ClientRecord[]>([]);

  // Datos del Receptor
  const [receptorNombre, setReceptorNombre] = useState('');
  const [receptorRfc, setReceptorRfc] = useState('');
  const [receptorRegimen, setReceptorRegimen] = useState('601');
  const [receptorUsoCfdi, setReceptorUsoCfdi] = useState('G03');
  const [receptorCp, setReceptorCp] = useState('');
  const [receptorEmail, setReceptorEmail] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Partidas / Conceptos
  const [items, setItems] = useState<FacturaItemState[]>([
    {
      id: 'item-1',
      name: 'Honorarios Contables y Asesoría Fiscal',
      price: 3500,
      quantity: 1,
      description: 'Servicios de asesoría fiscal y contable correspondiente al periodo.',
      productKey: '84111500', // Servicios contables
      unit: 'E48', // Unidad de servicio
      taxPercentage: 16,
    },
  ]);

  // Condiciones de Pago
  const [metodoPago, setMetodoPago] = useState<'PUE' | 'PPD'>('PUE');
  const [formaPago, setFormaPago] = useState('03'); // Transferencia
  const [observaciones, setObservaciones] = useState('');

  // Factura recién emitida (éxito)
  const [facturaEmitida, setFacturaEmitida] = useState<any | null>(null);
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Cargar clientes de Expediente Único para autollenado
  useEffect(() => {
    if (!tenantId) return;
    apiClient.clients
      .list({ tenant_id: tenantId, estado: 'activo' })
      .then((res) => setClientsList(res))
      .catch(() => {});
  }, [tenantId]);

  // Autollenar al seleccionar cliente registrado
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = clientsList.find((c) => c.id === clientId);
    if (client) {
      setReceptorNombre(client.nombre || '');
      setReceptorRfc(client.rfc ? client.rfc.toUpperCase() : '');
      const metadata = (client.metadata || {}) as Record<string, any>;
      if (metadata.codigo_postal) setReceptorCp(String(metadata.codigo_postal));
      if (metadata.regimen_fiscal) setReceptorRegimen(String(metadata.regimen_fiscal));
      if (metadata.email) setReceptorEmail(String(metadata.email));
    }
  };

  // Cálculos de Totales
  const { subtotal, totalIva, total } = useMemo(() => {
    let sub = 0;
    let iva = 0;
    for (const item of items) {
      const lineSub = Number(item.price || 0) * Number(item.quantity || 0);
      const lineIva = lineSub * (Number(item.taxPercentage || 0) / 100);
      sub += lineSub;
      iva += lineIva;
    }
    return {
      subtotal: sub,
      totalIva: iva,
      total: sub + iva,
    };
  }, [items]);

  // Manejadores de partidas
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: 'Concepto adicional',
        price: 1000,
        quantity: 1,
        description: '',
        productKey: '84111500',
        unit: 'E48',
        taxPercentage: 16,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof FacturaItemState, value: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  // Enviar y timbrar factura
  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setStatusMessage('Debes conectar o seleccionar una cuenta de Alegra primero.');
      return;
    }
    if (!receptorNombre.trim() || !receptorRfc.trim() || !receptorCp.trim()) {
      setStatusMessage(
        'Por favor completa todos los datos fiscales obligatorios del receptor (Nombre, RFC, CP).'
      );
      return;
    }

    const payload: AlegraInvoiceInputPayload = {
      date: new Date().toISOString().slice(0, 10),
      client: {
        name: receptorNombre.trim(),
        identification: receptorRfc.trim().toUpperCase(),
        email: receptorEmail.trim() || undefined,
        cfdiUse: receptorUsoCfdi,
        regime: receptorRegimen,
        address: {
          zipCode: receptorCp.trim(),
        },
      },
      items: items.map((it) => ({
        name: it.name.trim(),
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        description: it.description.trim() || undefined,
        productKey: it.productKey.trim() || '84111500',
        unit: it.unit.trim() || 'E48',
        tax: [
          {
            percentage: Number(it.taxPercentage) || 0,
            name: 'IVA',
          },
        ],
      })),
      paymentMethod: metodoPago,
      paymentForm: formaPago,
      observations: observaciones.trim() || undefined,
    };

    try {
      const res = await createInvoice(
        payload,
        selectedAccount.alegra_account_id,
        selectedClientId || undefined
      );
      setFacturaEmitida(res);
      setStatusMessage(null);
    } catch (err: any) {
      // El hook ya actualiza `error`
    }
  };

  const handleCopyUuid = (uuid: string) => {
    void navigator.clipboard.writeText(uuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  const handleResetForm = () => {
    setFacturaEmitida(null);
    setReceptorNombre('');
    setReceptorRfc('');
    setReceptorCp('');
    setReceptorEmail('');
    setSelectedClientId('');
    setItems([
      {
        id: `item-${Date.now()}`,
        name: 'Honorarios Contables y Asesoría Fiscal',
        price: 3500,
        quantity: 1,
        description: 'Servicios de asesoría fiscal y contable correspondiente al periodo.',
        productKey: '84111500',
        unit: 'E48',
        taxPercentage: 16,
      },
    ]);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-[1280px] space-y-8 px-6 py-10 md:px-10">
      {/* Botón Volver */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-amber-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Cobros
        </button>
      )}

      {/* Header Principal */}
      <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-6 md:flex-row md:items-end dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
              COBROS & TIMBRADO SAT
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              CFDI 4.0 con PAC Quadrum
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              AES-GCM 256-bit
            </span>
          </div>

          <h1 className="mt-2 font-serif text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-slate-100">
            Timbrado de Facturas CFDI 4.0
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Emite tus facturas fiscales con certificado de sello digital en tiempo real sin salir de
            ARK LEDGER. La emisión y el sellado se delegan de forma segura a Alegra y su PAC
            autorizado Quadrum.
          </p>
        </div>

        {/* Acciones de Cuenta */}
        <div className="flex shrink-0 items-center gap-3">
          {hasConnectedAccount && selectedAccount && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
              <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left">
                <div className="max-w-[160px] truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  {selectedAccount.alegra_company_name || selectedAccount.alegra_email}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{selectedAccount.alegra_rfc || 'Sin RFC'}</span>
                  {selectedAccount.csd_configured ? (
                    <span className="font-semibold text-emerald-600">• CSD Activo</span>
                  ) : (
                    <span className="font-semibold text-amber-600">• Sin CSD</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Key className="h-3.5 w-3.5" />
            {hasConnectedAccount ? 'Conectar otra cuenta' : 'Conectar Alegra'}
          </button>
        </div>
      </div>

      {/* Banner Proactivo de Cuentas que Requieren Atención */}
      {!isBannerDismissed && accountsNeedingAttention.length > 0 && (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center dark:border-amber-900/50 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Atención requerida en tu cuenta de Alegra
              </h4>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                {accountsNeedingAttention[0]?.alegra_company_name ||
                  accountsNeedingAttention[0]?.alegra_email}{' '}
                no tiene Certificado de Sello Digital (CSD) verificado o requiere reconectar su
                clave API.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <a
              href="https://app.alegra.com/configuration/certificates"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Cargar CSD en Alegra
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              onClick={dismissBannerFor7Days}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              Ocultar por 7 días
            </button>
          </div>
        </div>
      )}

      {/* ESTADO ONBOARDING (Si no hay cuentas conectadas) */}
      {!loading && !hasConnectedAccount && (
        <div className="grid grid-cols-1 items-start gap-8 py-4 lg:grid-cols-12">
          <div className="rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl md:p-10 lg:col-span-8">
            <div className="mb-6 inline-flex rounded-2xl bg-emerald-500/20 p-3 text-emerald-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="mb-3 font-serif text-2xl font-black tracking-tight md:text-3xl">
              Emite Facturas CFDI 4.0 directamente desde tu despacho
            </h2>
            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-300">
              Conecta tu cuenta de Alegra para emitir facturas timbradas ante el SAT en segundos.
              Tus honorarios contables, asesorías y cobranzas se facturan sin fricción ni doble
              captura.
            </p>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  PAC Quadrum Oficial
                </div>
                <p className="text-xs text-slate-300">
                  Timbrado garantizado bajo las especificaciones de la reforma fiscal y Anexo 20 del
                  SAT.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Tus Sellos Seguros
                </div>
                <p className="text-xs text-slate-300">
                  Tu CSD (.cer / .key) permanece seguro en Alegra. ARK LEDGER nunca toca tus
                  contraseñas privadas.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Multi-Empresa por Despacho
                </div>
                <p className="text-xs text-slate-300">
                  Gestiona múltiples razones sociales o clientes con cuentas independientes de
                  Alegra.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Descarga Instantánea
                </div>
                <p className="text-xs text-slate-300">
                  Obtén el Folio Fiscal UUID, XML sellado y representación impresa PDF en un solo
                  clic.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400"
            >
              <Key className="h-4 w-4" />
              Conectar Cuenta de Alegra Ahora
            </button>
          </div>

          {/* RUTA ALTERNATIVA (No bloqueante) */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="inline-flex rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <FileCode className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ¿Prefieres utilizar otro PAC?
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              La integración con Alegra es 100% opcional. Si tu despacho ya cuenta con otro
              proveedor de timbrado (ej. Facturama, Finkok o el portal del SAT), puedes timbrar por
              fuera sin problema.
            </p>
            <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Una vez timbrado tu comprobante, puedes auditar su estructura y sellos fiscales en
                nuestro validador:
              </p>
              {onNavigateToValidador ? (
                <button
                  onClick={onNavigateToValidador}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <FileCode className="h-4 w-4 text-amber-500" />
                  Ir al Validador XML CFDI
                </button>
              ) : (
                <a
                  href="#validador-cfdi"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <FileCode className="h-4 w-4 text-amber-500" />
                  Ir al Validador XML CFDI
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTERFAZ PRINCIPAL (Cuando hay cuentas conectadas) */}
      {hasConnectedAccount && (
        <div className="space-y-6">
          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('nueva')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'nueva'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Nueva Factura
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'historial'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <History className="h-4 w-4" />
              Historial Emitido ({(invoices || []).length})
            </button>
            <button
              onClick={() => setActiveTab('cuentas')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === 'cuentas'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Settings className="h-4 w-4" />
              Cuentas Conectadas ({(accounts || []).length})
            </button>
          </div>

          {/* MENSAJES DE ERROR O ESTADO */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{statusMessage}</p>
            </div>
          )}

          {/* RESULTADO DE FACTURA RECIÉN EMITIDA */}
          {facturaEmitida && (
            <div className="animate-fade-in space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500 p-2.5 text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      ¡Factura Timbrada con Éxito ante el SAT!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Folio:{' '}
                      <strong>{facturaEmitida.folio || facturaEmitida.alegra_invoice_id}</strong> •
                      Total: $
                      {Number(facturaEmitida.total || 0).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      MXN
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetForm}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  Emitir otra factura
                </button>
              </div>

              {facturaEmitida.uuid && (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-white p-3 dark:border-emerald-900/50 dark:bg-slate-900">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Folio Fiscal (UUID SAT)
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      {facturaEmitida.uuid}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyUuid(facturaEmitida.uuid)}
                    className="flex items-center gap-1.5 rounded-lg p-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                  >
                    {copiedUuid ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedUuid ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {facturaEmitida.xml_url && (
                  <a
                    href={facturaEmitida.xml_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    Descargar XML Fiscal
                  </a>
                )}
                {facturaEmitida.pdf_url && (
                  <a
                    href={facturaEmitida.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4 text-rose-600" />
                    Descargar Representación PDF
                  </a>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 1: NUEVA FACTURA */}
          {activeTab === 'nueva' && !facturaEmitida && (
            <form onSubmit={handleEmitirFactura} className="space-y-8">
              {/* Selector de Empresa Emisora */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Empresa Emisora (Cuenta Alegra)
                  </label>
                  {accounts.length > 1 && (
                    <span className="text-xs text-slate-500">
                      {accounts.length} cuentas disponibles
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {accounts.map((acc) => (
                    <div
                      key={acc.alegra_account_id}
                      onClick={() => setSelectedAccountId(acc.alegra_account_id)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        selectedAccountId === acc.alegra_account_id
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {acc.alegra_company_name || acc.alegra_email}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>RFC: {acc.alegra_rfc || 'Configurar'}</span>
                        {acc.csd_configured ? (
                          <span className="font-semibold text-emerald-600">CSD Listo</span>
                        ) : (
                          <span className="font-semibold text-amber-600">Sin CSD</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedAccount && !selectedAccount.csd_configured && (
                  <p className="pt-1 text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Esta cuenta no tiene Certificado CSD configurado en Alegra. Puedes preparar
                    la factura, pero requerirás subir tu CSD en Alegra antes de que el SAT la
                    timbre.
                  </p>
                )}
              </div>

              {/* SECCIÓN 1: DATOS DEL RECEPTOR */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center dark:border-slate-800">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    1. Datos Fiscales del Receptor (Cliente)
                  </h3>

                  {clientsList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">Cargar de Expediente Único...</option>
                        {clientsList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} {c.rfc ? `(${c.rfc})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Razón Social o Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={receptorNombre}
                      onChange={(e) => setReceptorNombre(e.target.value)}
                      placeholder="Ej. CLIENTE EJEMPLO SA DE CV"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs uppercase text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      RFC del Receptor *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={13}
                      value={receptorRfc}
                      onChange={(e) => setReceptorRfc(e.target.value.toUpperCase())}
                      placeholder="XAXX010101000"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs uppercase text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Código Postal Fiscal * (CFDI 4.0)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={receptorCp}
                      onChange={(e) => setReceptorCp(e.target.value)}
                      placeholder="06600"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Régimen Fiscal Receptor *
                    </label>
                    <select
                      value={receptorRegimen}
                      onChange={(e) => setReceptorRegimen(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {REGIMENES_FISCALES.map((r) => (
                        <option key={r.clave} value={r.clave}>
                          {r.clave} - {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Uso de CFDI *
                    </label>
                    <select
                      value={receptorUsoCfdi}
                      onChange={(e) => setReceptorUsoCfdi(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {USOS_CFDI.map((u) => (
                        <option key={u.clave} value={u.clave}>
                          {u.clave} - {u.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={receptorEmail}
                      onChange={(e) => setReceptorEmail(e.target.value)}
                      placeholder="facturas@cliente.com"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CONCEPTOS / PARTIDAS */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    2. Conceptos y Servicios a Facturar
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar Partida
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Partida #{idx + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 transition-colors hover:text-red-500"
                            title="Eliminar partida"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-4">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Concepto / Descripción *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            placeholder="Ej. Asesoría Contable"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Clave SAT (Prod/Serv)
                          </label>
                          <input
                            type="text"
                            value={item.productKey}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'productKey', e.target.value)
                            }
                            placeholder="84111500"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Clave Unidad SAT
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            placeholder="E48"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'quantity', Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            Precio Unitario ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.price}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'price', Number(e.target.value))
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right font-mono text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex flex-col justify-end text-right md:col-span-1">
                          <span className="text-[10px] text-slate-400">Importe</span>
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 3: CONDICIONES DE PAGO Y TOTALES */}
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    3. Método y Forma de Pago
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Método de Pago
                      </label>
                      <select
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value as 'PUE' | 'PPD')}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        <option value="PUE">PUE - Pago en una sola exhibición</option>
                        <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Forma de Pago SAT
                      </label>
                      <select
                        value={formaPago}
                        onChange={(e) => setFormaPago(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      >
                        {FORMAS_PAGO.map((f) => (
                          <option key={f.clave} value={f.clave}>
                            {f.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Observaciones / Condiciones Comerciales (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Ej. Pago correspondiente a la mensualidad de Octubre 2026."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Resumen Económico */}
                <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-xl lg:col-span-5">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
                    Resumen Económico CFDI 4.0
                  </h4>

                  <div className="space-y-2 border-t border-slate-800 pt-2">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Subtotal</span>
                      <span className="font-mono">
                        $
                        {subtotal.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>IVA Trasladado (16%)</span>
                      <span className="font-mono">
                        $
                        {totalIva.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-bold text-white">
                      <span>Total MXN</span>
                      <span className="font-mono text-emerald-400">
                        $
                        {total.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Timbrando con PAC Quadrum...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Emitir y Timbrar CFDI 4.0
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-slate-400">
                    Al confirmar, Alegra generará el XML y lo timbrará ante el SAT mediante el PAC
                    Quadrum.
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* PESTAÑA 2: HISTORIAL DE FACTURAS */}
          {activeTab === 'historial' && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Historial de Facturas Emitidas ({(invoices || []).length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprobantes timbrados y registrados en este despacho.
                  </p>
                </div>
                <button
                  onClick={() => refreshInvoices()}
                  className="flex items-center gap-1.5 rounded-lg p-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Actualizar
                </button>
              </div>

              {(invoices || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
                  <p className="text-sm font-medium">
                    Aún no hay facturas emitidas en este despacho.
                  </p>
                  <button
                    onClick={() => setActiveTab('nueva')}
                    className="mt-3 text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Emitir la primera factura →
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <th className="px-3 py-2.5">Fecha</th>
                        <th className="px-3 py-2.5">Folio</th>
                        <th className="px-3 py-2.5">Folio Fiscal (UUID)</th>
                        <th className="px-3 py-2.5">Cliente / Receptor</th>
                        <th className="px-3 py-2.5 text-right">Total</th>
                        <th className="px-3 py-2.5 text-center">Estado</th>
                        <th className="px-3 py-2.5 text-right">Comprobantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans dark:divide-slate-800/60">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-slate-400">
                            {new Date(inv.created_at * 1000).toLocaleDateString('es-MX')}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900 dark:text-slate-100">
                            {inv.folio || 'N/A'}
                          </td>
                          <td className="px-3 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {inv.uuid ? (
                              <button
                                onClick={() => handleCopyUuid(inv.uuid!)}
                                className="flex items-center gap-1 hover:text-emerald-600"
                                title="Copiar UUID"
                              >
                                {inv.uuid.slice(0, 8)}...{inv.uuid.slice(-4)}
                                <Copy className="h-3 w-3 text-slate-400" />
                              </button>
                            ) : (
                              'Sin timbrar'
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {inv.customer_name}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {inv.customer_rfc}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            $
                            {Number(inv.total || 0).toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              Timbrada
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.xml_url && (
                                <a
                                  href={inv.xml_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                  title="Descargar XML"
                                >
                                  <FileCode className="h-4 w-4 text-emerald-600" />
                                </a>
                              )}
                              {inv.pdf_url && (
                                <a
                                  href={inv.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                  title="Descargar PDF"
                                >
                                  <FileText className="h-4 w-4 text-rose-600" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA 3: GESTIÓN DE CUENTAS */}
          {activeTab === 'cuentas' && (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Cuentas Alegra Vinculadas ({accounts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conecta múltiples empresas o razones sociales administradas por este despacho.
                  </p>
                </div>
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Conectar otra cuenta
                </button>
              </div>

              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div
                    key={acc.alegra_account_id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 rounded-xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {acc.alegra_company_name || acc.alegra_email}
                          </h4>
                          {acc.is_default && (
                            <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Predeterminada
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              acc.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                                : 'bg-red-50 text-red-600 dark:bg-red-950/50'
                            }`}
                          >
                            {acc.status === 'active' ? 'Conectada' : acc.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Email: {acc.alegra_email} • RFC: {acc.alegra_rfc || 'No detectado'}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[11px]">
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              acc.csd_configured ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {acc.csd_configured ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                            {acc.csd_configured
                              ? 'CSD Vigente en Alegra'
                              : 'Sin Certificado CSD configurado'}
                          </span>
                          {acc.last_checked_at && (
                            <span className="text-slate-400">
                              Verificado:{' '}
                              {new Date(acc.last_checked_at * 1000).toLocaleDateString('es-MX')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => refreshAccountStatus(acc.alegra_account_id)}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Verificar CSD y credenciales con Alegra"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Verificar
                      </button>

                      {!acc.is_default && (
                        <button
                          onClick={() => setDefaultAccount(acc.alegra_account_id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Hacer default
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Estás seguro de desconectar la cuenta ${acc.alegra_company_name || acc.alegra_email}?`
                            )
                          ) {
                            void disconnectAccount(acc.alegra_account_id);
                          }
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Conexión */}
      <AlegraConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={connectAccount}
        onSuccess={() => {
          setActiveTab('nueva');
        }}
      />
    </div>
  );
};

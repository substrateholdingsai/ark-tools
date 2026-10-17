/**
 * ARK TOOLS — Timbrado de Facturas CFDI 4.0 vía Alegra (PAC Quadrum)
 *
 * Herramienta dentro de la sección Cobros que permite a los despachos
 * emitir y timbrar comprobantes fiscales digitales por internet (CFDI 4.0)
 * delegando la certificación a Alegra / PAC Quadrum sin salir de ARK TOOLS.
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
import apiClient, {
  type AlegraInvoiceInputPayload,
  type ClientRecord,
} from '@/lib/apiClient';
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
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // Enviar y timbrar factura
  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setStatusMessage('Debes conectar o seleccionar una cuenta de Alegra primero.');
      return;
    }
    if (!receptorNombre.trim() || !receptorRfc.trim() || !receptorCp.trim()) {
      setStatusMessage('Por favor completa todos los datos fiscales obligatorios del receptor (Nombre, RFC, CP).');
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
    <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-10 space-y-8 animate-fade-in">
      {/* Botón Volver */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Cobros
        </button>
      )}

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase font-mono">
              COBROS & TIMBRADO SAT
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              CFDI 4.0 con PAC Quadrum
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              <ShieldCheck className="w-3 h-3" />
              AES-GCM 256-bit
            </span>
          </div>

          <h1 className="mt-2 font-serif font-black text-3xl md:text-4xl text-slate-900 dark:text-slate-100 tracking-tight">
            Timbrado de Facturas CFDI 4.0
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            Emite tus facturas fiscales con certificado de sello digital en tiempo real sin salir
            de ARK TOOLS. La emisión y el sellado se delegan de forma segura a Alegra y su PAC
            autorizado Quadrum.
          </p>
        </div>

        {/* Acciones de Cuenta */}
        <div className="flex items-center gap-3 shrink-0">
          {hasConnectedAccount && selectedAccount && (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[160px] truncate">
                  {selectedAccount.alegra_company_name || selectedAccount.alegra_email}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>{selectedAccount.alegra_rfc || 'Sin RFC'}</span>
                  {selectedAccount.csd_configured ? (
                    <span className="text-emerald-600 font-semibold">• CSD Activo</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">• Sin CSD</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5" />
            {hasConnectedAccount ? 'Conectar otra cuenta' : 'Conectar Alegra'}
          </button>
        </div>
      </div>

      {/* Banner Proactivo de Cuentas que Requieren Atención */}
      {!isBannerDismissed && accountsNeedingAttention.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Atención requerida en tu cuenta de Alegra
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                {accountsNeedingAttention[0]?.alegra_company_name || accountsNeedingAttention[0]?.alegra_email}{' '}
                no tiene Certificado de Sello Digital (CSD) verificado o requiere reconectar su clave API.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <a
              href="https://app.alegra.com/configuration/certificates"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              Cargar CSD en Alegra
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={dismissBannerFor7Days}
              className="px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
            >
              Ocultar por 7 días
            </button>
          </div>
        </div>
      )}

      {/* ESTADO ONBOARDING (Si no hay cuentas conectadas) */}
      {!loading && !hasConnectedAccount && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-4">
          <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-700">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight mb-3">
              Emite Facturas CFDI 4.0 directamente desde tu despacho
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mb-8">
              Conecta tu cuenta de Alegra para emitir facturas timbradas ante el SAT en segundos.
              Tus honorarios contables, asesorías y cobranzas se facturan sin fricción ni doble captura.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="font-bold text-sm text-emerald-400 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  PAC Quadrum Oficial
                </div>
                <p className="text-xs text-slate-300">
                  Timbrado garantizado bajo las especificaciones de la reforma fiscal y Anexo 20 del SAT.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="font-bold text-sm text-emerald-400 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Tus Sellos Seguros
                </div>
                <p className="text-xs text-slate-300">
                  Tu CSD (.cer / .key) permanece seguro en Alegra. ARK TOOLS nunca toca tus contraseñas privadas.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="font-bold text-sm text-emerald-400 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Multi-Empresa por Despacho
                </div>
                <p className="text-xs text-slate-300">
                  Gestiona múltiples razones sociales o clientes con cuentas independientes de Alegra.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="font-bold text-sm text-emerald-400 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Descarga Instantánea
                </div>
                <p className="text-xs text-slate-300">
                  Obtén el Folio Fiscal UUID, XML sellado y representación impresa PDF en un solo clic.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Conectar Cuenta de Alegra Ahora
            </button>
          </div>

          {/* RUTA ALTERNATIVA (No bloqueante) */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="inline-flex p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ¿Prefieres utilizar otro PAC?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              La integración con Alegra es 100% opcional. Si tu despacho ya cuenta con otro proveedor
              de timbrado (ej. Facturama, Finkok o el portal del SAT), puedes timbrar por fuera sin problema.
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Una vez timbrado tu comprobante, puedes auditar su estructura y sellos fiscales en nuestro validador:
              </p>
              {onNavigateToValidador ? (
                <button
                  onClick={onNavigateToValidador}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileCode className="w-4 h-4 text-amber-500" />
                  Ir al Validador XML CFDI
                </button>
              ) : (
                <a
                  href="#validador-cfdi"
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FileCode className="w-4 h-4 text-amber-500" />
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
              className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'nueva'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Nueva Factura
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'historial'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              Historial Emitido ({(invoices || []).length})
            </button>
            <button
              onClick={() => setActiveTab('cuentas')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'cuentas'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              Cuentas Conectadas ({(accounts || []).length})
            </button>
          </div>

          {/* MENSAJES DE ERROR O ESTADO */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{statusMessage}</p>
            </div>
          )}

          {/* RESULTADO DE FACTURA RECIÉN EMITIDA */}
          {facturaEmitida && (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      ¡Factura Timbrada con Éxito ante el SAT!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Folio: <strong>{facturaEmitida.folio || facturaEmitida.alegra_invoice_id}</strong> • Total: $
                      {Number(facturaEmitida.total || 0).toLocaleString('es-MX', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      MXN
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Emitir otra factura
                </button>
              </div>

              {facturaEmitida.uuid && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Folio Fiscal (UUID SAT)
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      {facturaEmitida.uuid}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyUuid(facturaEmitida.uuid)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {copiedUuid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
                    className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    Descargar XML Fiscal
                  </a>
                )}
                {facturaEmitida.pdf_url && (
                  <a
                    href={facturaEmitida.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-rose-600" />
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
              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Empresa Emisora (Cuenta Alegra)
                  </label>
                  {accounts.length > 1 && (
                    <span className="text-xs text-slate-500">
                      {accounts.length} cuentas disponibles
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {accounts.map((acc) => (
                    <div
                      key={acc.alegra_account_id}
                      onClick={() => setSelectedAccountId(acc.alegra_account_id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedAccountId === acc.alegra_account_id
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {acc.alegra_company_name || acc.alegra_email}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                        <span>RFC: {acc.alegra_rfc || 'Configurar'}</span>
                        {acc.csd_configured ? (
                          <span className="text-emerald-600 font-semibold">CSD Listo</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Sin CSD</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedAccount && !selectedAccount.csd_configured && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 pt-1">
                    ⚠️ Esta cuenta no tiene Certificado CSD configurado en Alegra. Puedes preparar la
                    factura, pero requerirás subir tu CSD en Alegra antes de que el SAT la timbre.
                  </p>
                )}
              </div>

              {/* SECCIÓN 1: DATOS DEL RECEPTOR */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    1. Datos Fiscales del Receptor (Cliente)
                  </h3>

                  {clientsList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientSelect(e.target.value)}
                        className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Razón Social o Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={receptorNombre}
                      onChange={(e) => setReceptorNombre(e.target.value)}
                      placeholder="Ej. CLIENTE EJEMPLO SA DE CV"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      RFC del Receptor *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={13}
                      value={receptorRfc}
                      onChange={(e) => setReceptorRfc(e.target.value.toUpperCase())}
                      placeholder="XAXX010101000"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Código Postal Fiscal * (CFDI 4.0)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={receptorCp}
                      onChange={(e) => setReceptorCp(e.target.value)}
                      placeholder="06600"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Régimen Fiscal Receptor *
                    </label>
                    <select
                      value={receptorRegimen}
                      onChange={(e) => setReceptorRegimen(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      {REGIMENES_FISCALES.map((r) => (
                        <option key={r.clave} value={r.clave}>
                          {r.clave} - {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Uso de CFDI *
                    </label>
                    <select
                      value={receptorUsoCfdi}
                      onChange={(e) => setReceptorUsoCfdi(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      {USOS_CFDI.map((u) => (
                        <option key={u.clave} value={u.clave}>
                          {u.clave} - {u.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={receptorEmail}
                      onChange={(e) => setReceptorEmail(e.target.value)}
                      placeholder="facturas@cliente.com"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CONCEPTOS / PARTIDAS */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    2. Conceptos y Servicios a Facturar
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Partida
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Partida #{idx + 1}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="Eliminar partida"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Concepto / Descripción *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            placeholder="Ej. Asesoría Contable"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Clave SAT (Prod/Serv)
                          </label>
                          <input
                            type="text"
                            value={item.productKey}
                            onChange={(e) => handleUpdateItem(item.id, 'productKey', e.target.value)}
                            placeholder="84111500"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none font-mono"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Clave Unidad SAT
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                            placeholder="E48"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none font-mono"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
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
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none text-right"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
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
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none text-right font-mono"
                          />
                        </div>

                        <div className="md:col-span-1 text-right flex flex-col justify-end">
                          <span className="text-[10px] text-slate-400">Importe</span>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                            ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 3: CONDICIONES DE PAGO Y TOTALES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    3. Método y Forma de Pago
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Método de Pago
                      </label>
                      <select
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value as 'PUE' | 'PPD')}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                      >
                        <option value="PUE">PUE - Pago en una sola exhibición</option>
                        <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Forma de Pago SAT
                      </label>
                      <select
                        value={formaPago}
                        onChange={(e) => setFormaPago(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Observaciones / Condiciones Comerciales (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Ej. Pago correspondiente a la mensualidad de Octubre 2026."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                {/* Resumen Económico */}
                <div className="lg:col-span-5 p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Resumen Económico CFDI 4.0
                  </h4>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
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
                    <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
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
                    className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Timbrando con PAC Quadrum...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Emitir y Timbrar CFDI 4.0
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    Al confirmar, Alegra generará el XML y lo timbrará ante el SAT mediante el PAC Quadrum.
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* PESTAÑA 2: HISTORIAL DE FACTURAS */}
          {activeTab === 'historial' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Historial de Facturas Emitidas ({(invoices || []).length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprobantes timbrados y registrados en este despacho.
                  </p>
                </div>
                <button
                  onClick={() => refreshInvoices()}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualizar
                </button>
              </div>

              {(invoices || []).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aún no hay facturas emitidas en este despacho.</p>
                  <button
                    onClick={() => setActiveTab('nueva')}
                    className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Emitir la primera factura →
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Folio</th>
                        <th className="py-2.5 px-3">Folio Fiscal (UUID)</th>
                        <th className="py-2.5 px-3">Cliente / Receptor</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3 text-right">Comprobantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {new Date(inv.created_at * 1000).toLocaleDateString('es-MX')}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {inv.folio || 'N/A'}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {inv.uuid ? (
                              <button
                                onClick={() => handleCopyUuid(inv.uuid!)}
                                className="hover:text-emerald-600 flex items-center gap-1"
                                title="Copiar UUID"
                              >
                                {inv.uuid.slice(0, 8)}...{inv.uuid.slice(-4)}
                                <Copy className="w-3 h-3 text-slate-400" />
                              </button>
                            ) : (
                              'Sin timbrar'
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {inv.customer_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {inv.customer_rfc}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            ${Number(inv.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                              Timbrada
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {inv.xml_url && (
                                <a
                                  href={inv.xml_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Descargar XML"
                                >
                                  <FileCode className="w-4 h-4 text-emerald-600" />
                                </a>
                              )}
                              {inv.pdf_url && (
                                <a
                                  href={inv.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Descargar PDF"
                                >
                                  <FileText className="w-4 h-4 text-rose-600" />
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Cuentas Alegra Vinculadas ({accounts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Conecta múltiples empresas o razones sociales administradas por este despacho.
                  </p>
                </div>
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Conectar otra cuenta
                </button>
              </div>

              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div
                    key={acc.alegra_account_id}
                    className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {acc.alegra_company_name || acc.alegra_email}
                          </h4>
                          {acc.is_default && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                              Predeterminada
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              acc.status === 'active'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                                : 'bg-red-50 text-red-600 dark:bg-red-950/50'
                            }`}
                          >
                            {acc.status === 'active' ? 'Conectada' : acc.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Email: {acc.alegra_email} • RFC: {acc.alegra_rfc || 'No detectado'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px]">
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              acc.csd_configured ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {acc.csd_configured ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5" />
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
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                        title="Verificar CSD y credenciales con Alegra"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Verificar
                      </button>

                      {!acc.is_default && (
                        <button
                          onClick={() => setDefaultAccount(acc.alegra_account_id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
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

/**
 * ARK LEDGER — App Principal
 *
 * Router principal entre Dashboard y herramientas.
 * Fase D: Compliance — Auditoría de Cobranza + Guía SAT/IMSS.
 */

import { useState, useEffect, Suspense } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  ShieldCheck,
  Wallet,
  Building2,
  Sparkles,
  Scale,
  Globe,
  ShieldAlert,
  Users,
  FileCode,
  // removed
  // removed
  BarChart3,
  Layers,
  TrendingUp,
  Compass,
  ArrowLeft,
  Stethoscope,
  QrCode,
} from 'lucide-react';

import { SignedIn, SignedOut, useAuth } from '@/context/AuthContext';
import { useExpediente } from '@/context/ExpedienteContext';

import {
  Header,
  Footer,
  ToolCard,
  CategorySection,
  ToolSkeleton,
  LandingPage,
  AiAssistantWidget,
  ExpedienteSelector,
  VerificacionPublicaModal,
  InviteAcceptModal,
  ErrorBoundary,
  OnboardingQuickstartModal,
  RegulatoryTicker,
  Sidebar,
  Topbar,
} from './components';
import type { NavItem } from './components';

import { AlertasVigencia } from '@/data/valores-vigentes';
import { currentBrand } from '@/config/brand';
import { CanacoPortalBanner, CanacoAdminPadron, CanacoLandingPage } from '@/components/canaco';
import { lazyWithRetry } from '@/lib/lazyWithRetry';

// Lazy-loaded tools para optimización máxima de bundle (<150 KB chunk inicial) con resiliencia ante despliegues
const CalculadoraISN = lazyWithRetry(() =>
  import('./tools/isn').then((m) => ({ default: m.CalculadoraISN }))
);
const CalculadoraSBC = lazyWithRetry(() =>
  import('./tools/sbc').then((m) => ({ default: m.CalculadoraSBC }))
);
const CalculadoraNomina = lazyWithRetry(() =>
  import('./tools/nomina').then((m) => ({ default: m.CalculadoraNomina }))
);
const ConversorXML = lazyWithRetry(() =>
  import('./tools/xml-excel').then((m) => ({ default: m.ConversorXML }))
);
const ValidadorXML = lazyWithRetry(() =>
  import('./tools/xml-validador').then((m) => ({ default: m.ValidadorXML }))
);
const GeneradorSPEI = lazyWithRetry(() =>
  import('./tools/spei').then((m) => ({ default: m.GeneradorSPEI }))
);
const CalculadoraLeasing = lazyWithRetry(() =>
  import('./tools/leasing').then((m) => ({ default: m.CalculadoraLeasing }))
);
const GuiaSATIMSS = lazyWithRetry(() =>
  import('./tools/guia-sat-imss').then((m) => ({ default: m.GuiaSATIMSS }))
);
const TimbradoFacturas = lazyWithRetry(() =>
  import('./tools/timbrado/TimbradoFacturas').then((m) => ({ default: m.TimbradoFacturas }))
);
const AuditorCobranza = lazyWithRetry(() => import('@/tools/auditor-cobranza'));
const MapaActivos = lazyWithRetry(() => import('@/tools/mapa-activos'));
const CalculadoraFiniquitos = lazyWithRetry(() => import('@/tools/finiquitos'));
const CierreNomina = lazyWithRetry(() =>
  import('@/tools/cierre-nomina').then((m) => ({ default: m.CierreNomina }))
);
const CalculadoraResico = lazyWithRetry(() => import('@/tools/resico'));
const AdminPanel = lazyWithRetry(() =>
  import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel }))
);
const CalculadoraBalance = lazyWithRetry(() =>
  import('./tools/balance-general').then((m) => ({ default: m.CalculadoraBalance }))
);
const ConciliadorAnexo24 = lazyWithRetry(() =>
  import('./tools/anexo24').then((m) => ({ default: m.ConciliadorAnexo24 }))
);
const MonitorLFPIORPI = lazyWithRetry(() =>
  import('./tools/monitor-lfpiorpi').then((m) => ({ default: m.MonitorLFPIORPI }))
);
const CalculadoraRecargos = lazyWithRetry(() =>
  import('./tools/recargos').then((m) => ({ default: m.CalculadoraRecargos }))
);
const Modalidad40 = lazyWithRetry(() =>
  import('./tools/modalidad40').then((m) => ({ default: m.Modalidad40 }))
);
const AuditorCFDIAtipico = lazyWithRetry(() =>
  import('./tools/auditor-cfdi-atipico').then((m) => ({ default: m.AuditorCFDIAtipico }))
);
const RetencionClinicas = lazyWithRetry(() =>
  import('./tools/retencion-clinicas').then((m) => ({ default: m.RetencionClinicas }))
);

// ═════════════════════════════════════════════════════════════════
// TIPOS
// ═════════════════════════════════════════════════════════════════
export type ToolId =
  | 'dashboard'
  | 'isn'
  | 'sbc'
  | 'nomina'
  | 'finiquitos'
  | 'cierre-nomina'
  | 'resico'
  | 'xml-excel'
  | 'validador'
  | 'anexo24'
  | 'spei'
  | 'timbrado'
  | 'leasing'
  | 'caja-codi'
  | 'guia-sat-imss'
  | 'auditor-cobranza'
  | 'mapa-activos'
  | 'balance-general'
  | 'monitor-lfpiorpi'
  | 'recargos'
  | 'modalidad40'
  | 'auditor-cfdi-atipico'
  | 'retencion-clinicas'
  | 'admin';

export type ToolRoute = ToolId;
export type NavFilter = 'dashboard' | 'fiscal' | 'sat' | 'cobros' | 'compliance' | 'dof';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'TODAS' },
  { id: 'fiscal', label: 'FISCAL' },
  { id: 'sat', label: 'SAT' },
  { id: 'cobros', label: 'COBROS' },
  { id: 'compliance', label: 'COMPLIANCE' },
  { id: 'dof', label: 'DOF' },
];

// ═════════════════════════════════════════════════════════════════
// APP
// ═════════════════════════════════════════════════════════════════
export function App() {
  const { isLoaded, platformRole, user, tenants, tenantId: activeTenantId } = useAuth();
  const canManageDelegaciones =
    import.meta.env.VITE_CANACO_DELEGACIONES === 'true' &&
    currentBrand.id === 'canaco_merida' &&
    tenants.some((tenant) => tenant.id === 'canaco_merida' && tenant.role !== 'member');
  const { loadDemoData } = useExpediente();
  const [activeTool, setActiveTool] = useState<ToolId>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const params = new URLSearchParams(window.location.search);
    const toolParam = params.get('tool') as ToolId | null;
    const validTools: ToolId[] = [
      'isn',
      'sbc',
      'nomina',
      'finiquitos',
      'cierre-nomina',
      'resico',
      'xml-excel',
      'validador',
      'anexo24',
      'spei',
      'timbrado',
      'leasing',
      'caja-codi',
      'guia-sat-imss',
      'auditor-cobranza',
      'mapa-activos',
      'balance-general',
      'monitor-lfpiorpi',
      'recargos',
      'modalidad40',
      'auditor-cfdi-atipico',
      'retencion-clinicas',
      'admin',
    ];
    if (toolParam && validTools.includes(toolParam)) {
      return toolParam;
    }
    return 'dashboard';
  });
  const [activeNavFilter, setActiveNavFilter] = useState<NavFilter>('dashboard');
  const [showSiemWelcome, setShowSiemWelcome] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('welcome') === 'siem';
  });
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('ark_onboarding_completed') !== 'true';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verifyHash, setVerifyHash] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('verify') || params.get('hash') || null;
  });
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('auth') === 'invite' ? params.get('token') : null;
  });
  const navigateTo = (tool: ToolId) => {
    setActiveTool(tool);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Si horus.i2d@gmail.com inicia sesión desde "Acceso Directivo & Padrón" en CANACO, abrir directamente el Padrón SIEM
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    const isCanacoAdmin = user.email?.toLowerCase() === 'horus.i2d@gmail.com';
    const requestedAdminWelcome = window.sessionStorage?.getItem('canaco_admin_welcome') === 'true';
    if (isCanacoAdmin && requestedAdminWelcome) {
      window.sessionStorage.removeItem('canaco_admin_welcome');
      setActiveTool('admin');
    }
  }, [user]);

  const goToDashboard = () => navigateTo('dashboard');
  const handleNavigate = (id: string) => {
    if (id === 'back') {
      goToDashboard();
      return;
    }

    if (id === 'admin') {
      if (
        platformRole === 'super_admin' ||
        user?.email?.toLowerCase() === 'horus.i2d@gmail.com' ||
        canManageDelegaciones
      ) {
        navigateTo('admin');
      }
      return;
    }

    if (
      id === 'dashboard' ||
      id === 'fiscal' ||
      id === 'sat' ||
      id === 'cobros' ||
      id === 'compliance' ||
      id === 'dof'
    ) {
      setActiveNavFilter(id);
      navigateTo('dashboard');
    }
  };

  const toolLabels: Partial<Record<ToolId, string>> = {
    isn: 'Calculadora ISN',
    sbc: 'Calculadora SBC',
    nomina: 'Nómina Rápida',
    finiquitos: 'Finiquitos y Liquidaciones',
    'cierre-nomina': 'Cierre de Nómina Masivo',
    resico: 'Calculadora RESICO',
    'xml-excel': 'Conversor XML a CSV para Excel',
    validador: 'Validador de XMLs',
    spei: 'Generador de Links de Pago',
    timbrado: 'Timbrado de Facturas CFDI 4.0',
    leasing: 'Calculadora Leasing',
    'caja-codi': 'Cobro con CoDi — Ark Caja',
    'guia-sat-imss': 'Guía SAT/IMSS',
    'auditor-cobranza': 'Auditoría Legal de Cobranza',
    'mapa-activos': 'Mapa de Activos Virtuales',
    'balance-general': 'Balance General Comparativo',
    anexo24: 'Motor de Conciliación Anexo 24',
    'monitor-lfpiorpi': 'Monitor LFPIORPI',
    recargos: 'Actualización y Recargos CFF',
    modalidad40: 'Simulador Modalidad 40 (DOF 2026)',
    'auditor-cfdi-atipico': 'Detector de Atípicos CFDI',
    'retencion-clinicas': 'Retención 2% Clínicas (Yucatán)',
    admin: 'Super Admin Console',
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'admin':
        if (
          currentBrand.id === 'canaco_merida' ||
          user?.email?.toLowerCase() === 'horus.i2d@gmail.com'
        ) {
          return (
            <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">
              <CanacoAdminPadron onNavigateToSuite={goToDashboard} />
            </div>
          );
        }
        return platformRole === 'super_admin' ? (
          <AdminPanel onBack={goToDashboard} />
        ) : (
          <Dashboard
            onSelectTool={navigateTo}
            navFilter={activeNavFilter}
            onOpenOnboarding={() => setShowOnboarding(true)}
          />
        );

      case 'isn':
        return <CalculadoraISN onBack={goToDashboard} />;

      case 'sbc':
        return <CalculadoraSBC onBack={goToDashboard} />;

      case 'nomina':
        return <CalculadoraNomina onBack={goToDashboard} />;

      case 'finiquitos':
        return <CalculadoraFiniquitos onBack={goToDashboard} />;

      case 'cierre-nomina':
        return <CierreNomina onBack={goToDashboard} />;

      case 'resico':
        return <CalculadoraResico onBack={goToDashboard} />;

      case 'xml-excel':
        return <ConversorXML onBack={goToDashboard} />;

      case 'validador':
        return <ValidadorXML onBack={goToDashboard} />;

      case 'anexo24':
        return <ConciliadorAnexo24 onBack={goToDashboard} />;

      case 'spei':
        return <GeneradorSPEI onBack={goToDashboard} />;

      case 'timbrado':
        return (
          <TimbradoFacturas
            onBack={goToDashboard}
            onNavigateToValidador={() => navigateTo('validador')}
          />
        );

      case 'leasing':
        return <CalculadoraLeasing onBack={goToDashboard} />;

      case 'caja-codi': {
        const merchantId = activeTenantId ?? undefined;
        const cajaUrl = merchantId
          ? `https://caja.arksystems.site/?m=${encodeURIComponent(merchantId)}`
          : 'https://caja.arksystems.site/';
        window.open(cajaUrl, '_blank', 'noopener,noreferrer');
        goToDashboard();
        return null;
      }

      case 'guia-sat-imss':
        return <GuiaSATIMSS onBack={goToDashboard} />;

      case 'auditor-cobranza':
        return <AuditorCobranza onBack={goToDashboard} />;

      case 'mapa-activos':
        return <MapaActivos onBack={goToDashboard} />;

      case 'balance-general':
        return <CalculadoraBalance onBack={goToDashboard} />;

      case 'monitor-lfpiorpi':
        return <MonitorLFPIORPI onBack={goToDashboard} />;

      case 'recargos':
        return <CalculadoraRecargos onBack={goToDashboard} />;

      case 'modalidad40':
        return <Modalidad40 onBack={goToDashboard} />;

      case 'auditor-cfdi-atipico':
        return <AuditorCFDIAtipico />;

      case 'retencion-clinicas':
        return <RetencionClinicas onBack={goToDashboard} />;

      case 'dashboard':
      default:
        return <Dashboard onSelectTool={navigateTo} navFilter={activeNavFilter} />;
    }
  };

  if (!isLoaded) {
    return (
      <main
        role="status"
        className="flex min-h-screen items-center justify-center bg-surface font-inter text-sm text-muted"
      >
        Validando tu sesión segura...
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <RegulatoryTicker />
        {currentBrand.id === 'canaco_merida' ? <CanacoLandingPage /> : <LandingPage />}
      </SignedOut>

      <SignedIn>
        {currentBrand.id === 'canaco_merida' ? (
          <div className="min-h-screen bg-surface font-inter text-ink antialiased">
            <RegulatoryTicker onSelectTool={navigateTo} />
            <Header
              activeTool={activeTool === 'admin' ? 'admin' : activeNavFilter}
              currentToolLabel={activeTool === 'dashboard' ? undefined : toolLabels[activeTool]}
              onNavigate={handleNavigate}
              navItems={navItems}
            />

            {/* Selector y Catálogo de Expediente Único (Sprint 9) — oculto en consola admin */}
            {activeTool !== 'admin' && (
              <div className="w-full">
                <ExpedienteSelector />
                {!(activeTool === 'dashboard' && activeNavFilter === 'dof') && (
                  <div className="mx-auto max-w-[1280px] px-6 md:px-10">
                    <AlertasVigencia onVerTodos={() => handleNavigate('dof')} />
                  </div>
                )}
              </div>
            )}

            {/* Barra de Orientación Contextual (Breadcrumb) dentro de cualquier Herramienta */}
            {activeTool !== 'dashboard' && activeTool !== 'admin' && (
              <div className="mx-auto max-w-[1280px] px-6 pt-3 md:px-10">
                <div
                  aria-label="Ubicación actual en la suite"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white/90 px-4 py-2 text-xs shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Compass size={13} className="text-gold-dark" />
                    <button
                      type="button"
                      onClick={goToDashboard}
                      className="font-semibold text-muted transition hover:text-navy hover:underline"
                    >
                      {currentBrand.brandName}
                    </button>
                    <span className="text-line">›</span>
                    <button
                      type="button"
                      onClick={goToDashboard}
                      className="font-medium text-muted transition hover:text-navy hover:underline"
                    >
                      Catálogo de Herramientas
                    </button>
                    <span className="text-line">›</span>
                    <span className="rounded-md bg-navy/10 px-2 py-0.5 font-orbitron text-[10px] font-bold text-navy">
                      {toolLabels[activeTool] || activeTool}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={goToDashboard}
                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-navy transition hover:bg-cream/50"
                  >
                    <ArrowLeft size={12} />
                    <span>Volver al Catálogo Principal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pantalla/Tarjeta de Bienvenida Guiada Post-SIEM */}
            {showSiemWelcome && (
              <div className="mx-auto max-w-[1280px] px-6 pt-3 md:px-10">
                <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-4 text-xs text-emerald-950 shadow-sm sm:p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-2.5">
                      <Sparkles size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                      <div>
                        <div className="font-orbitron text-xs font-bold uppercase tracking-wider text-emerald-900">
                          ¡Bienvenido a tu Suite Fiscal Acreditada desde SIEM CANACO!
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                          <strong>¡Bienvenido a ARK LEDGER!</strong> Tu empresa ha sido importada
                          exitosamente desde el Registro SIEM. El Expediente Único está activo y
                          listo para tu primer cálculo y sellado criptográfico.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={goToDashboard}
                            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-900 transition hover:bg-emerald-100"
                          >
                            Ver Portal del Afiliado y 22 Herramientas
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateTo('isn')}
                            className="rounded-lg border border-emerald-200 bg-emerald-100/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-200/70"
                          >
                            Abrir ISN Yucatán (3.75% / 3.0% MIPyME)
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateTo('resico')}
                            className="rounded-lg border border-emerald-200 bg-emerald-100/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-200/70"
                          >
                            Abrir Calculadora RESICO
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSiemWelcome(false)}
                      className="shrink-0 self-end rounded-lg border border-emerald-200 bg-white px-3 py-1.5 font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:self-start"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            )}

            <main>
              {activeTool === 'dashboard' && activeNavFilter === 'dof' ? (
                <section className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">
                  <h1 className="font-playfair text-3xl font-bold text-ink">Avisos DOF</h1>
                  <AlertasVigencia />
                </section>
              ) : activeTool === 'dashboard' ? (
                <Dashboard
                  onSelectTool={navigateTo}
                  navFilter={activeNavFilter}
                  onOpenOnboarding={() => setShowOnboarding(true)}
                />
              ) : (
                <ErrorBoundary
                  key={activeTool}
                  toolName={toolLabels[activeTool]}
                  onReset={goToDashboard}
                >
                  <Suspense fallback={<ToolSkeleton />}>{renderTool()}</Suspense>
                </ErrorBoundary>
              )}
            </main>

            <Footer onSelectTool={navigateTo} />

            {/* Widget Flotante del Asistente Workers AI */}
            <AiAssistantWidget />

            {/* Modal de Onboarding y Quickstart (Aha! Moment en 60s) */}
            <OnboardingQuickstartModal
              isOpen={showOnboarding}
              onClose={() => setShowOnboarding(false)}
              onStartDemo={() => {
                loadDemoData();
                navigateTo('nomina');
              }}
              onSelectTool={(toolId) => {
                navigateTo(toolId);
              }}
            />
          </div>
        ) : (
          <div className="flex min-h-screen bg-paper font-sans text-ink antialiased">
            <Sidebar
              navItems={navItems}
              activeId={activeTool === 'admin' ? 'admin' : activeNavFilter}
              onNavigate={handleNavigate}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar
                onOpenSidebar={() => setSidebarOpen(true)}
                currentToolLabel={activeTool === 'dashboard' ? undefined : toolLabels[activeTool]}
              />
              <main className="flex-1 overflow-y-auto">
                {/* Selector y Catálogo de Expediente Único (Sprint 9) — oculto en consola admin */}
                {activeTool !== 'admin' && (
                  <div className="w-full">
                    <ExpedienteSelector />
                    {!(activeTool === 'dashboard' && activeNavFilter === 'dof') && (
                      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
                        <AlertasVigencia onVerTodos={() => handleNavigate('dof')} />
                      </div>
                    )}
                  </div>
                )}

                {/* Barra de Orientación Contextual (Breadcrumb) dentro de cualquier Herramienta */}
                {activeTool !== 'dashboard' && activeTool !== 'admin' && (
                  <div className="mx-auto max-w-[1280px] px-6 pt-3 md:px-10">
                    <div
                      aria-label="Ubicación actual en la suite"
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white/90 px-4 py-2 text-xs shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Compass size={13} className="text-gold-dark" />
                        <button
                          type="button"
                          onClick={goToDashboard}
                          className="font-semibold text-muted transition hover:text-navy hover:underline"
                        >
                          {currentBrand.brandName}
                        </button>
                        <span className="text-line">›</span>
                        <button
                          type="button"
                          onClick={goToDashboard}
                          className="font-medium text-muted transition hover:text-navy hover:underline"
                        >
                          Catálogo de Herramientas
                        </button>
                        <span className="text-line">›</span>
                        <span className="rounded-md bg-navy/10 px-2 py-0.5 font-orbitron text-[10px] font-bold text-navy">
                          {toolLabels[activeTool] || activeTool}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={goToDashboard}
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-navy transition hover:bg-cream/50"
                      >
                        <ArrowLeft size={12} />
                        <span>Volver al Catálogo Principal</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Pantalla/Tarjeta de Bienvenida Guiada Post-SIEM */}
                {showSiemWelcome && (
                  <div className="mx-auto max-w-[1280px] px-6 pt-3 md:px-10">
                    <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 p-4 text-xs text-emerald-950 shadow-sm sm:p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="flex items-start gap-2.5">
                          <Sparkles size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                          <div>
                            <div className="font-orbitron text-xs font-bold uppercase tracking-wider text-emerald-900">
                              ¡Bienvenido a tu Suite Fiscal Acreditada desde SIEM CANACO!
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                              <strong>¡Bienvenido a ARK LEDGER!</strong> Tu empresa ha sido
                              importada exitosamente desde el Registro SIEM. El Expediente Único
                              está activo y listo para tu primer cálculo y sellado criptográfico.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={goToDashboard}
                                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-900 transition hover:bg-emerald-100"
                              >
                                Ver Portal del Afiliado y 22 Herramientas
                              </button>
                              <button
                                type="button"
                                onClick={() => navigateTo('isn')}
                                className="rounded-lg border border-emerald-200 bg-emerald-100/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-200/70"
                              >
                                Abrir ISN Yucatán (3.75% / 3.0% MIPyME)
                              </button>
                              <button
                                type="button"
                                onClick={() => navigateTo('resico')}
                                className="rounded-lg border border-emerald-200 bg-emerald-100/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-200/70"
                              >
                                Abrir Calculadora RESICO
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSiemWelcome(false)}
                          className="shrink-0 self-end rounded-lg border border-emerald-200 bg-white px-3 py-1.5 font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:self-start"
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <main>
                  {activeTool === 'dashboard' && activeNavFilter === 'dof' ? (
                    <section className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">
                      <h1 className="font-playfair text-3xl font-bold text-ink">Avisos DOF</h1>
                      <AlertasVigencia />
                    </section>
                  ) : activeTool === 'dashboard' ? (
                    <Dashboard
                      onSelectTool={navigateTo}
                      navFilter={activeNavFilter}
                      onOpenOnboarding={() => setShowOnboarding(true)}
                    />
                  ) : (
                    <ErrorBoundary
                      key={activeTool}
                      toolName={toolLabels[activeTool]}
                      onReset={goToDashboard}
                    >
                      <Suspense fallback={<ToolSkeleton />}>{renderTool()}</Suspense>
                    </ErrorBoundary>
                  )}
                </main>

                <Footer onSelectTool={navigateTo} />

                {/* Widget Flotante del Asistente Workers AI */}
                <AiAssistantWidget />

                {/* Modal de Onboarding y Quickstart (Aha! Moment en 60s) */}
                <OnboardingQuickstartModal
                  isOpen={showOnboarding}
                  onClose={() => setShowOnboarding(false)}
                  onStartDemo={() => {
                    loadDemoData();
                    navigateTo('nomina');
                  }}
                  onSelectTool={(toolId) => {
                    navigateTo(toolId);
                  }}
                />
              </main>
            </div>
          </div>
        )}
      </SignedIn>

      {/* Modal Público de Verificación Criptográfica de Papel de Trabajo (QR) */}
      {verifyHash && (
        <VerificacionPublicaModal
          hash={verifyHash}
          isOpen={Boolean(verifyHash)}
          onClose={() => {
            setVerifyHash(null);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('verify');
              url.searchParams.delete('hash');
              window.history.replaceState({}, '', url.toString());
            }
          }}
        />
      )}

      {/* Modal de Aceptación de Invitación a Despacho */}
      {inviteToken && (
        <InviteAcceptModal
          token={inviteToken}
          isOpen={Boolean(inviteToken)}
          onClose={() => {
            setInviteToken(null);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('auth');
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url.toString());
            }
          }}
          onSuccess={() => {
            setInviteToken(null);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('auth');
              url.searchParams.delete('token');
              window.history.replaceState({}, '', url.toString());
            }
          }}
        />
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════
interface DashboardProps {
  onSelectTool: (tool: ToolId) => void;
  navFilter: NavFilter;
  onOpenOnboarding?: () => void;
}

function Dashboard({ onSelectTool, navFilter }: DashboardProps) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">
      {/* Banner de Ventanilla Institucional CANACO HENEQUÉN */}
      {currentBrand.features.ventanillaPagos && (
        <section className="mb-6">
          <CanacoPortalBanner />
        </section>
      )}

      {/* NetSuite-style grid: left reminders column + main area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left column: Reminders + shortcuts */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-navy">
              Recordatorios
            </div>
            <ul className="space-y-2 text-[13px] text-ink">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                <span>DOF 2026 vigente — UMA $117.31</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                <span>TOPE SBC: 25 UMAs ($2,932.75)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                <span>SMG 2026: $315.04</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onSelectTool('recargos' as ToolId)}
              className="mt-3 w-full text-left text-[11px] font-bold uppercase tracking-wider text-navy hover:underline"
            >
              Ver todos →
            </button>
          </div>

          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-navy">
              Accesos rápidos
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Nómina', tool: 'nomina' },
                { label: 'ISR', tool: 'isn' },
                { label: 'SBC', tool: 'sbc' },
                { label: 'Resico', tool: 'resico' },
              ].map((q) => (
                <button
                  key={q.tool}
                  type="button"
                  onClick={() => onSelectTool(q.tool as ToolId)}
                  className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[11px] font-bold text-ink hover:bg-navy hover:text-white"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main area */}
        <main className="space-y-6">
          {/* Hero total (single gold accent) */}
          <section className="rounded-2xl border border-line bg-surface p-6">
            <div className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Suite Fiscal Acreditada
            </div>
            <div className="mt-2 font-playfair text-[48px] font-black leading-none tracking-[-0.04em] text-gold">
              22 herramientas
            </div>
            <div className="mt-1 font-inter text-[13px] text-muted">
              Cálculos deterministas con fundamento en LISR, LSS, LFT.
            </div>
          </section>

          {/* KPI strip */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'UMA 2026', value: '$117.31', trend: '+3.2%' },
              { label: 'SMG 2026', value: '$315.04', trend: '+12%' },
              { label: 'TOPE SBC', value: '$2,932.75', trend: '25 UMAs' },
              { label: 'Herramientas', value: '22', trend: '100%' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-line bg-surface p-4">
                <div className="font-inter text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  {k.label}
                </div>
                <div className="mt-1 font-orbitron text-[18px] font-bold tabular-nums text-ink">
                  {k.value}
                </div>
                <div className="mt-1 font-inter text-[11px] text-navy">{k.trend}</div>
              </div>
            ))}
          </section>

          {/* Period comparison table */}
          <section className="rounded-xl border border-line bg-surface">
            <div className="border-b border-line px-4 py-3 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-navy">
              Comparativo de período
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-muted">
                  <th className="px-4 py-2 text-left font-inter font-bold">Concepto</th>
                  <th className="px-4 py-2 text-right font-inter font-bold">Actual</th>
                  <th className="px-4 py-2 text-right font-inter font-bold">Anterior</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <td className="px-4 py-2 text-ink">UMA</td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">$117.31</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">$113.14</td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-4 py-2 text-ink">SMG</td>
                  <td className="px-4 py-2 text-right tabular-nums text-ink">$315.04</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted">$278.80</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Tool sections */}
          <div className="space-y-6">
            {(navFilter === 'dashboard' || navFilter === 'fiscal') && (
              <CategorySection
                id="fiscal"
                title="Fiscal & Nómina"
                description="Cálculos deterministas con fundamento en LISR, LSS, LFT y Leyes de Hacienda Estatales."
                columns={3}
              >
                <ToolCard
                  icon={Calculator}
                  title="Calculadora ISN 2026"
                  description="Impuesto Sobre Nómina en los 32 estados. Tasas oficiales y base gravable."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('isn')}
                />
                <ToolCard
                  icon={Stethoscope}
                  title="Retención 2% Clínicas (YUC)"
                  description="Art. 20-Bis LGHY Yucatán. Retención 2% al pago y formatos AAFY-30 / AAFY-31."
                  badge="YUCATÁN"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('retencion-clinicas')}
                />
                <ToolCard
                  icon={Building2}
                  title="Calculadora SBC 2026"
                  description="Salario Base de Cotización con factor de integración y tope de 25 UMAs."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('sbc')}
                />
                <ToolCard
                  icon={Wallet}
                  title="Nómina Rápida 2026"
                  description="ISR + IMSS obrero. Tarifas progresivas, subsidio al empleo y neto a pagar."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('nomina')}
                />
                <ToolCard
                  icon={Scale}
                  title="Finiquitos y Liquidaciones"
                  description="Cálculo LFT con Vacaciones Dignas 2023, aguinaldo y prima de antigüedad."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('finiquitos')}
                />
                <ToolCard
                  icon={Calculator}
                  title="Calculadora RESICO 2026"
                  description="ISR e IVA para Personas Físicas (1%-2.5%) y Morales (flujo)."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('resico')}
                />
                <ToolCard
                  icon={Users}
                  title="Cierre de Nómina Masivo"
                  description="Procesamiento batch por período. Cédula Concentradora con Sello QR y Layout Bancario."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('cierre-nomina')}
                />
                <ToolCard
                  icon={BarChart3}
                  title="Balance General Comparativo"
                  description="Análisis horizontal y vertical, cuadre A=P+C y papel de trabajo con Folio de Integridad y QR de consulta."
                  badge="NUEVO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('balance-general')}
                />
                <ToolCard
                  icon={TrendingUp}
                  title="Actualización y Recargos Fiscales"
                  description="Cálculo CFF Art. 17-A y 21 con INPC oficial, factor truncado a 4 decimales y tasa LIF 1.47%."
                  badge="NUEVO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('recargos')}
                />
                <ToolCard
                  icon={ShieldAlert}
                  title="Simulador de Modalidad 40"
                  description="Proyección Ley 73 con restricción DOF 21/10/2026 (Último SBC + 1 UMA), cuota 14.438% y ROI."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('modalidad40')}
                />
              </CategorySection>
            )}
            {(navFilter === 'dashboard' || navFilter === 'sat') && (
              <CategorySection
                id="sat"
                title="SAT & CFDI"
                description="Procesamiento local de comprobantes fiscales, auditoría y conciliación contable Anexo 24."
                columns={3}
              >
                <ToolCard
                  icon={FileSpreadsheet}
                  title="Conversor XML → CSV para Excel"
                  description="Extrae datos y exporta una fila por CFDI. Hasta 200 archivos de 10 MB."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('xml-excel')}
                />
                <ToolCard
                  icon={ShieldCheck}
                  title="Validador de XMLs"
                  description="Verifica UUID, sello y estructura. Cotejo preventivo contra Art. 69-B (EFOS)."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('validador')}
                />
                <ToolCard
                  icon={Layers}
                  title="Conciliación Anexo 24"
                  description="Generador automático de pólizas contables, cruce CFDI vs Anexo 24 y filtro Metadata SAT."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('anexo24')}
                />
                <ToolCard
                  icon={ShieldAlert}
                  title="Detector de Atípicos CFDI"
                  description="Auditoría forense CFDI 4.0, cruce Metadata SAT, Ley de Benford, Z-Score y matriz 5×5."
                  badge="NUEVO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('auditor-cfdi-atipico')}
                />
              </CategorySection>
            )}
            {(navFilter === 'dashboard' || navFilter === 'cobros') && (
              <CategorySection
                id="cobros"
                title="Cobros & Finanzas"
                description="Emisión de facturas SAT, pasarelas de pago y modelado financiero."
                columns={3}
              >
                <ToolCard
                  icon={Globe}
                  title="Generador Links de Pago"
                  description="Cobra con Clip Checkout. Link compartible, sin comisiones ocultas."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('spei')}
                />
                <ToolCard
                  icon={QrCode}
                  title="Cobro con CoDi — Ark Caja"
                  description="Enlace externo a Caja. QR en mostrador, $8,000 MXN por operación, SPEI arriba de eso. Motor Pey."
                  badge="ARK CAJA"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('caja-codi')}
                />
                <ToolCard
                  icon={FileCode}
                  title="Timbrado de Facturas"
                  description="Pre-validación CFDI 4.0 Anexo 20 y conector Facturapi v2 (Sandbox SAT · modo preview)."
                  badge="PREVIEW"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('timbrado')}
                />
                <ToolCard
                  icon={Building2}
                  title="Calculadora Leasing"
                  description="Proyección de ingresos recurrentes y análisis de deducción de ISR."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('leasing')}
                />
              </CategorySection>
            )}
            {(navFilter === 'dashboard' || navFilter === 'compliance') && (
              <CategorySection
                id="compliance"
                title="Compliance & Auditoría"
                description="Matrices legales, requerimientos y defensa ante autoridades fiscales."
                columns={3}
              >
                <ToolCard
                  icon={Scale}
                  title="Guía SAT/IMSS"
                  description="8 pasos para responder requerimientos. Checklists, plazos y expediente único."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('guia-sat-imss')}
                />
                <ToolCard
                  icon={ShieldAlert}
                  title="Auditoría Legal de Cobranza"
                  description="Compara contrato vs CRM, detecta conductas ilícitas y emite dictamen exportable."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('auditor-cobranza')}
                />
                <ToolCard
                  icon={Sparkles}
                  title="Mapa de Activos Virtuales"
                  description="12 conductas mapeadas con Ley Fintech, LFPIORPI y CFF."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('mapa-activos')}
                />
                <ToolCard
                  icon={ShieldCheck}
                  title="Monitor LFPIORPI"
                  description="Auditoría antilavado con regla de acumulación de 6 meses y umbrales UMA 2026."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('monitor-lfpiorpi')}
                />
              </CategorySection>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PLACEHOLDER
// ═════════════════════════════════════════════════════════════════
export interface PlaceholderToolProps {
  name: string;
  onBack: () => void;
}

export function PlaceholderTool({ name, onBack }: PlaceholderToolProps) {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-20 text-center md:px-10">
      <div className="font-orbitron text-[10px] font-bold uppercase tracking-[0.24em] text-gold-dark">
        Herramienta en construcción
      </div>
      <h2 className="mt-4 font-playfair text-[36px] font-black leading-[1] text-ink">{name}</h2>
      <p className="mt-4 font-inter text-[14px] leading-[1.6] text-muted">
        Esta herramienta estará disponible en el próximo sprint. Vuelve al dashboard para explorar
        las que ya están listas.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="glass-btn glass-btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 font-orbitron text-[11px] font-bold uppercase tracking-[0.14em]"
      >
        Volver al dashboard
      </button>
    </div>
  );
}

export default App;

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
  Compass,
  ArrowLeft,
  Stethoscope,
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
import { TOTAL_HERRAMIENTAS } from '@/data/catalogo-herramientas';
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
    <div className="mx-auto max-w-[1280px] px-6 py-6 md:px-10">
      {/* Banner de Ventanilla Institucional CANACO HENEQUÉN */}
      {currentBrand.features.ventanillaPagos && (
        <section className="mb-6">
          <CanacoPortalBanner />
        </section>
      )}

      {/* Page header */}
      <div className="border-b border-line bg-surface px-0 pb-0 pt-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[25px] font-semibold leading-[1.15] tracking-[-0.012em] text-ink">
              Panel del despacho
            </h1>
            <p className="mt-1.5 max-w-[62ch] text-[12.5px] text-muted">
              Estado operativo del ejercicio 2026. Los importes provienen de cédulas emitidas y no
              constituyen declaraciones presentadas.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#CBE0D3] bg-ok-wash px-2 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] text-ok">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                Catálogo DOF verificado
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-line-2 bg-surface-2 px-2 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] text-slate">
                Ejercicio <b className="ml-1 font-semibold text-ink">2026</b>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-line-2 bg-surface-2 px-2 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] text-slate">
                Corte <b className="ml-1 font-semibold text-ink">2026-11-22</b>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-[32px] items-center gap-1.5 rounded-[5px] border border-line-2 bg-surface px-3 text-[12.5px] font-semibold text-ink-2 transition hover:bg-surface-2"
            >
              Exportar corte
            </button>
            <button
              type="button"
              onClick={() => onSelectTool('isn')}
              className="inline-flex h-[32px] items-center gap-1.5 rounded-[5px] bg-ink-2 px-3 text-[12.5px] font-semibold text-[#F5F3EE] transition hover:bg-ink"
            >
              Nueva cédula
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-0.5">
          <button className="border-b-2 border-brass-2 px-3 py-2 text-[12.5px] font-semibold text-ink">
            Resumen
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('isn')}
            className="border-b-2 border-transparent px-3 py-2 text-[12.5px] font-medium text-muted transition hover:text-ink"
          >
            Cédulas
          </button>
          <button
            type="button"
            onClick={() => onSelectTool('isn')}
            className="border-b-2 border-transparent px-3 py-2 text-[12.5px] font-medium text-muted transition hover:text-ink"
          >
            Catálogo
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Left column: Reminders + shortcuts */}
        <aside className="space-y-4">
          <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sh1">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
              Recordatorios
            </div>
            <ul className="space-y-2 text-[13px] text-ink">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brass-2" />
                <span>DOF 2026 vigente — UMA $117.31</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brass-2" />
                <span>TOPE SBC: 25 UMAs ($2,932.75)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brass-2" />
                <span>SMG 2026: $315.04</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => onSelectTool('recargos')}
              className="mt-3 w-full text-left text-[11px] font-bold uppercase tracking-wider text-brass transition hover:underline"
            >
              Ver todos →
            </button>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sh1">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
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
                  className="rounded-[5px] border border-line bg-surface-2 px-2 py-1.5 text-[11px] font-bold text-ink transition hover:bg-ink-2 hover:text-[#F5F3EE]"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main area */}
        <main className="space-y-6">
          {/* KPI strip */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'UMA 2026', value: '$117.31', detail: 'Diaria', stripe: 'brass' },
              { label: 'SMG 2026', value: '$315.04', detail: 'Diario', stripe: 'ok' },
              { label: 'TOPE SBC', value: '$2,932.75', detail: '25 UMAs', stripe: 'warn' },
              {
                label: 'Herramientas',
                value: String(TOTAL_HERRAMIENTAS),
                detail: 'En catálogo',
                stripe: 'info',
              },
            ].map((k) => (
              <div
                key={k.label}
                className="relative overflow-hidden rounded-[8px] border border-line bg-surface p-4 shadow-sh1"
              >
                <span
                  className={`absolute bottom-0 left-0 top-0 w-[2px] ${
                    k.stripe === 'brass'
                      ? 'bg-brass-2'
                      : k.stripe === 'ok'
                        ? 'bg-ok'
                        : k.stripe === 'warn'
                          ? 'bg-warn'
                          : 'bg-info'
                  }`}
                />
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                  {k.label}
                </div>
                <div className="mt-1 font-mono text-[18px] font-semibold tabular-nums text-ink">
                  {k.value}
                </div>
                <div className="mt-1 text-[11px] text-muted">{k.detail}</div>
              </div>
            ))}
          </section>

          {/* Period comparison table */}
          <section className="rounded-[8px] border border-line bg-surface shadow-sh1">
            <div className="border-b border-line px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Comparativo de período
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-muted">
                  <th className="px-4 py-2 text-left font-semibold">Concepto</th>
                  <th className="px-4 py-2 text-right font-semibold">Actual</th>
                  <th className="px-4 py-2 text-right font-semibold">Anterior</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line">
                  <td className="px-4 py-2 text-ink">UMA</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-ink">$117.31</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                    $113.14
                  </td>
                </tr>
                <tr className="border-t border-line">
                  <td className="px-4 py-2 text-ink">SMG</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-ink">$315.04</td>
                  <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                    $278.80
                  </td>
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
                  description="Procesamiento en lote por período. Retenciones SAT, cuotas IMSS, ISN estatal."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('cierre-nomina')}
                />
                <ToolCard
                  icon={Calculator}
                  title="Simulador Modalidad 40"
                  description="Proyección de pensión Ley 73 con el Acuerdo DOF 21/10/2026."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('modalidad40')}
                />
                <ToolCard
                  icon={Calculator}
                  title="Actualización y Recargos CFF"
                  description="Art. 17-A CFF. Factor INPC y tasa de mora vigente."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('recargos')}
                />
              </CategorySection>
            )}

            {(navFilter === 'dashboard' || navFilter === 'sat') && (
              <CategorySection
                id="sat"
                title="SAT & CFDI"
                description="Conversión, validación y conciliación de comprobantes fiscales."
                columns={3}
              >
                <ToolCard
                  icon={FileSpreadsheet}
                  title="Conversor XML a CSV/Excel"
                  description="Extrae CFDI 3.3 y 4.0 a CSV. Hasta 200 archivos."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('xml-excel')}
                />
                <ToolCard
                  icon={ShieldCheck}
                  title="Validador de XMLs"
                  description="Verificación de sellos digitales y cotejo preventivo 69-B."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('validador')}
                />
                <ToolCard
                  icon={FileSpreadsheet}
                  title="Conciliación Anexo 24"
                  description="Cruce CFDI vs Catálogo y Balanza Anexo 24."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('anexo24')}
                />
              </CategorySection>
            )}

            {(navFilter === 'dashboard' || navFilter === 'cobros') && (
              <CategorySection
                id="cobros"
                title="Cobros & Finanzas"
                description="Generación de links de pago y timbrado CFDI 4.0."
                columns={3}
              >
                <ToolCard
                  icon={Globe}
                  title="Generador Links de Pago SPEI"
                  description="Links de cobro instantáneos vía SPEI / Clip Checkout."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('spei')}
                />
                <ToolCard
                  icon={FileCode}
                  title="Timbrado de Facturas CFDI 4.0"
                  description="Pre-validación y timbrado con Facturapi v2 (preview)."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('timbrado')}
                />
                <ToolCard
                  icon={Building2}
                  title="Calculadora Leasing"
                  description="Simulador financiero y fiscal de arrendamiento."
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
                description="Defensa fiscal, auditoría legal y prevención de lavado."
                columns={3}
              >
                <ToolCard
                  icon={Scale}
                  title="Guía Requerimientos SAT / IMSS"
                  description="Metodología en 8 pasos para responder auditorías."
                  badge="PRO"
                  badgeVariant="gold"
                  onSelect={() => onSelectTool('guia-sat-imss')}
                />
                <ToolCard
                  icon={ShieldAlert}
                  title="Auditoría Legal de Cobranza"
                  description="Compara contratos vs bitácoras CRM, detecta conductas ilícitas."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('auditor-cobranza')}
                />
                <ToolCard
                  icon={Sparkles}
                  title="Mapa de Activos Virtuales"
                  description="Matriz legal sobre 12 conductas con criptoactivos."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('mapa-activos')}
                />
                <ToolCard
                  icon={FileSpreadsheet}
                  title="Balance General Comparativo"
                  description="Análisis Horizontal y Vertical, validación A=P+C."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('balance-general')}
                />
                <ToolCard
                  icon={ShieldAlert}
                  title="Monitor LFPIORPI"
                  description="Evaluación determinista Art. 17 LFPIORPI, semáforo por cliente."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('monitor-lfpiorpi')}
                />
                <ToolCard
                  icon={ShieldAlert}
                  title="Auditor CFDI Atípico"
                  description="Detector de atípicos y matriz de riesgo 5x5."
                  badge="GRATIS"
                  badgeVariant="neutral"
                  onSelect={() => onSelectTool('auditor-cfdi-atipico')}
                />
              </CategorySection>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

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

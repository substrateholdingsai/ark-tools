/**
 * ARK TOOLS — App Principal
 *
 * Router principal entre Dashboard y herramientas.
 * Fase D: Compliance — Auditoría de Cobranza + Guía SAT/IMSS.
 */

import { useState, lazy, Suspense } from 'react';
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
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';

import { SignedIn, SignedOut, useAuth } from '@/context/AuthContext';

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
  AdminPanel,
  InviteAcceptModal,
} from './components';
import type { NavItem } from './components';

import { CalculadoraISN } from './tools/isn';
import { CalculadoraSBC } from './tools/sbc';
import { CalculadoraNomina } from './tools/nomina';
import { ConversorXML } from './tools/xml-excel';
import { ValidadorXML } from './tools/xml-validador';
import { GeneradorSPEI } from './tools/spei';
import { CalculadoraLeasing } from './tools/leasing';
import { GuiaSATIMSS } from './tools/guia-sat-imss';
import { TimbradoFacturas } from './tools/timbrado/TimbradoFacturas';
import { AlertasVigencia } from '@/data/valores-vigentes';

// Lazy-loaded: reduce bundle inicial (~45 KB c/u)
const AuditorCobranza = lazy(() => import('@/tools/auditor-cobranza'));
const MapaActivos = lazy(() => import('@/tools/mapa-activos'));
const CalculadoraFiniquitos = lazy(() => import('@/tools/finiquitos'));
const CierreNomina = lazy(() =>
  import('@/tools/cierre-nomina').then((m) => ({ default: m.CierreNomina }))
);
const CalculadoraResico = lazy(() => import('@/tools/resico'));

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
  | 'spei'
  | 'timbrado'
  | 'leasing'
  | 'guia-sat-imss'
  | 'auditor-cobranza'
  | 'mapa-activos'
  | 'admin';

export type ToolRoute = ToolId;
export type NavFilter = 'dashboard' | 'fiscal' | 'sat' | 'cobros' | 'compliance';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'TODAS' },
  { id: 'fiscal', label: 'FISCAL' },
  { id: 'sat', label: 'SAT' },
  { id: 'cobros', label: 'COBROS' },
  { id: 'compliance', label: 'COMPLIANCE' },
];

// ═════════════════════════════════════════════════════════════════
// APP
// ═════════════════════════════════════════════════════════════════
export function App() {
  const { isLoaded, platformRole } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolId>('dashboard');
  const [activeNavFilter, setActiveNavFilter] = useState<NavFilter>('dashboard');
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

  const goToDashboard = () => navigateTo('dashboard');
  const handleNavigate = (id: string) => {
    if (id === 'back') {
      goToDashboard();
      return;
    }

    if (id === 'admin') {
      if (platformRole === 'super_admin') {
        navigateTo('admin');
      }
      return;
    }

    if (
      id === 'dashboard' ||
      id === 'fiscal' ||
      id === 'sat' ||
      id === 'cobros' ||
      id === 'compliance'
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
    'xml-excel': 'Conversor XML a Excel',
    validador: 'Validador de XMLs',
    spei: 'Generador de Links de Pago',
    timbrado: 'Timbrado de Facturas CFDI 4.0',
    leasing: 'Calculadora Leasing',
    'guia-sat-imss': 'Guía SAT/IMSS',
    'auditor-cobranza': 'Auditoría Legal de Cobranza',
    'mapa-activos': 'Mapa de Activos Virtuales',
    admin: 'Super Admin Console',
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'admin':
        return platformRole === 'super_admin' ? (
          <AdminPanel onBack={goToDashboard} />
        ) : (
          <Dashboard onSelectTool={navigateTo} navFilter={activeNavFilter} />
        );

      case 'isn':
        return <CalculadoraISN onBack={goToDashboard} />;

      case 'sbc':
        return <CalculadoraSBC onBack={goToDashboard} />;

      case 'nomina':
        return <CalculadoraNomina onBack={goToDashboard} />;

      case 'finiquitos':
        return (
          <Suspense fallback={<ToolSkeleton />}>
            <CalculadoraFiniquitos onBack={goToDashboard} />
          </Suspense>
        );

      case 'cierre-nomina':
        return (
          <Suspense fallback={<ToolSkeleton />}>
            <CierreNomina onBack={goToDashboard} />
          </Suspense>
        );

      case 'resico':
        return (
          <Suspense fallback={<ToolSkeleton />}>
            <CalculadoraResico onBack={goToDashboard} />
          </Suspense>
        );

      case 'xml-excel':
        return <ConversorXML onBack={goToDashboard} />;

      case 'validador':
        return <ValidadorXML onBack={goToDashboard} />;

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

      case 'guia-sat-imss':
        return <GuiaSATIMSS onBack={goToDashboard} />;

      case 'auditor-cobranza':
        return (
          <Suspense fallback={<ToolSkeleton />}>
            <AuditorCobranza onBack={goToDashboard} />
          </Suspense>
        );

      case 'mapa-activos':
        return (
          <Suspense fallback={<ToolSkeleton />}>
            <MapaActivos onBack={goToDashboard} />
          </Suspense>
        );

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
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-surface font-inter text-ink antialiased">
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
              <div className="mx-auto max-w-[1280px] px-6 md:px-10">
                <AlertasVigencia />
              </div>
            </div>
          )}

          <main>
            {activeTool === 'dashboard' ? (
              <Dashboard onSelectTool={navigateTo} navFilter={activeNavFilter} />
            ) : (
              renderTool()
            )}
          </main>

          <Footer onSelectTool={navigateTo} />

          {/* Widget Flotante del Asistente Workers AI */}
          <AiAssistantWidget />
        </div>
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
}

function Dashboard({ onSelectTool, navFilter }: DashboardProps) {
  return (
    <div className="mx-auto max-w-[1280px] space-y-16 px-6 py-16 md:px-10">
      {/* Hero */}
      <section>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-navy">
          <ShieldCheck size={14} className="text-navy" />
          <span>El Sistema Operativo de la Defensa Fiscal</span>
        </div>
        <h1 className="max-w-[32ch] font-playfair text-[48px] font-black leading-[0.92] tracking-[-0.03em] text-ink md:text-[68px]">
          Tus cálculos, <span className="text-navy">blindados</span> con evidencia verificable.
        </h1>
        <p className="mt-6 max-w-[64ch] font-inter text-[16px] leading-[1.5] text-muted md:text-[18px]">
          Calcula nómina, emite CFDI y audita riesgos. Cada resultado se sella con SHA-256 y 
          versión DOF, generando un QR que cualquier auditor puede verificar sin depender de ti.
        </p>
      </section>

      {/* Banner de Moat: Expediente Único y Sello QR */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-surface to-cream/20 p-6 shadow-sm md:p-8">
        {/* Adorno de fondo */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
        
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 text-gold-dark shadow-sm">
              <Fingerprint size={26} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-orbitron text-[14px] font-bold uppercase tracking-wider text-navy">
                  Papel de Trabajo con Sello Criptográfico
                </span>
                <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                  <CheckCircle2 size={12} /> Verificable Públicamente
                </span>
              </div>
              <p className="max-w-[760px] font-inter text-[13.5px] leading-relaxed text-muted">
                Al archivar cualquier cálculo en el <strong>Expediente Único</strong>, el sistema genera una cédula oficial con <strong>Sello SHA-256 inmutable</strong> y un <strong>QR de verificación</strong>. 
                Cuando el SAT o un cliente te pida evidencia, no entregues un Excel: entrega un documento que se autentica solo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores de Referencia DOF 2026 */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 px-5 py-4">
        <div className="flex items-center gap-2 font-orbitron text-[11px] font-bold text-muted">
          <Scale size={16} className="text-navy" />
          TABLAS OFICIALES VIGENTES 2026
        </div>
        <div className="flex flex-wrap items-center gap-2 font-orbitron text-[11px] font-bold">
          <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink">UMA: $117.31</span>
          <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink">SMG: $315.04</span>
          <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-ink">TOPE SBC: 25 UMAs ($2,932.75)</span>
        </div>
      </section>

      {/* Fiscal */}
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
        </CategorySection>
      )}

      {/* SAT */}
      {(navFilter === 'dashboard' || navFilter === 'sat') && (
        <CategorySection
          id="sat"
          title="SAT & CFDI"
          description="Procesamiento local de comprobantes fiscales y auditoría preventiva de listas negras."
          columns={2}
        >
          <ToolCard
            icon={FileSpreadsheet}
            title="Conversor XML → Excel"
            description="Arrastra tus CFDI y exporta CSV para contabilidad. Hasta 200 archivos."
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
        </CategorySection>
      )}

      {/* Cobros */}
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
            icon={FileCode}
            title="Timbrado de Facturas"
            description="Emite CFDI 4.0 ante el SAT vía PAC Quadrum. Descarga XML y PDF."
            badge="PRO"
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

      {/* Compliance */}
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
        </CategorySection>
      )}
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

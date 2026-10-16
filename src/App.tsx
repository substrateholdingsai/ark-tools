/**
 * ARK TOOLS — App Principal
 *
 * Router principal entre Dashboard y herramientas.
 * Fase D: Compliance — Auditoría de Cobranza + Guía SAT/IMSS.
 */

import { useState, useEffect, lazy, Suspense } from 'react';
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
} from 'lucide-react';

import { SignedIn, SignedOut, useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';

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
import { AlertasVigencia } from '@/data/valores-vigentes';

// Lazy-loaded: reduce bundle inicial (~45 KB c/u)
const AuditorCobranza = lazy(
  () => import('@/tools/auditor-cobranza'),
);
const MapaActivos = lazy(
  () => import('@/tools/mapa-activos'),
);
const CalculadoraFiniquitos = lazy(
  () => import('@/tools/finiquitos'),
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
  | 'xml-excel'
  | 'validador'
  | 'spei'
  | 'leasing'
  | 'guia-sat-imss'
  | 'auditor-cobranza'
  | 'mapa-activos';

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
  const [activeTool, setActiveTool] = useState<ToolId>('dashboard');
  const [verifyHash, setVerifyHash] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('verify') || params.get('hash') || null;
  });
  const { isSignedIn, userId, email, fullName, tenantId, tenantName, organization, getToken } =
    useAuth();

  // Sincronización silenciosa de usuario y despacho con D1 en segundo plano
  useEffect(() => {
    if (!isSignedIn || !userId || !email) return;

    getToken()
      .then((token) => {
        apiClient.auth
          .sync(
            {
              user_id: userId,
              email,
              full_name: fullName,
              tenant_id: tenantId,
              tenant_name: tenantName,
              tenant_slug: organization?.slug,
            },
            token
          )
          .catch((err) => {
            console.debug('[AuthSync] Silencioso:', err);
          });
      })
      .catch(() => {});
  }, [isSignedIn, userId, email, fullName, tenantId, tenantName, organization?.slug, getToken]);

  const navigateTo = (tool: ToolId) => {
    setActiveTool(tool);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const goToDashboard = () => navigateTo('dashboard');

  const renderTool = () => {
    switch (activeTool) {
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

      case 'xml-excel':
        return <ConversorXML onBack={goToDashboard} />;

      case 'validador':
        return <ValidadorXML onBack={goToDashboard} />;

      case 'spei':
        return <GeneradorSPEI onBack={goToDashboard} />;

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
        return <Dashboard onSelectTool={navigateTo} />;
    }
  };

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-surface text-ink font-inter antialiased">
          <Header
            activeTool={activeTool === 'dashboard' ? 'dashboard' : activeTool}
            onNavigate={(id) => {
              if (id === 'dashboard') goToDashboard();
            }}
            navItems={navItems}
          />

          {/* Selector y Catálogo de Expediente Único (Sprint 9) */}
          <ExpedienteSelector />

          <AlertasVigencia />

          <main>{renderTool()}</main>

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
    </>
  );
}


// ═════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════
interface DashboardProps {
  onSelectTool: (tool: ToolId) => void;
}

function Dashboard({ onSelectTool }: DashboardProps) {
  return (
    <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-16 space-y-16">
      {/* Hero */}
      <section>
        <h1 className="font-playfair font-black text-[48px] md:text-[68px] leading-[0.92] tracking-[-0.03em] text-ink max-w-[24ch]">
          Herramientas que{' '}
          <span className="text-navy">trabajan</span> mientras tú cobras.
        </h1>
        <p className="mt-6 text-[16px] md:text-[18px] leading-[1.5] text-muted max-w-[52ch] font-inter">
          Suite de utilidades para contadores, nómina y RH. Cálculo en tiempo
          real, exportación instantánea y diseño pensado para que el dinero se
          entienda sin leer.
        </p>
      </section>

      {/* Banner de Transparencia Jurídica & Papeles de Trabajo */}
      <section className="p-6 md:p-7 rounded-2xl bg-white border border-line shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-navy/5 border border-navy/15 flex items-center justify-center text-navy shrink-0 mt-0.5">
              <Scale size={22} className="text-navy" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-orbitron font-bold text-[13px] text-navy uppercase tracking-wider">
                  Cálculos con Fundamento Jurídico Transparente
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                  Normativa DOF 2026
                </span>
              </div>
              <p className="text-[13px] text-muted font-inter max-w-[760px] leading-relaxed">
                Cada calculadora de la suite desglosa su fórmula matemática y cita el artículo legal exacto (LISR, LSS, LFT, CFF y Códigos Estatales). Diseñado para que puedas justificar cada cifra ante auditorías y en tus papeles de trabajo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted font-orbitron shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-ink">
              UMA: $117.31
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-ink">
              SMG: $315.04
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-ink">
              TOPE SBC: 25 UMAs ($2,932.75)
            </span>
          </div>
        </div>
      </section>

      {/* Fiscal */}
      <CategorySection
        title="Fiscal"
        description="Cálculos estatales y federales. ISN, ISR, IMSS, topes, factores y finiquitos LFT."
        columns={4}
      >
        <ToolCard
          icon={Calculator}
          title="Calculadora ISN 2026"
          description="Impuesto Sobre Nómina en los 32 estados. Tasas oficiales, base gravable y exportación a Excel."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('isn')}
        />
        <ToolCard
          icon={Building2}
          title="Calculadora SBC 2026"
          description="Salario Base de Cotización con factor de integración, tope de 25 UMAs y mínimo frontera."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('sbc')}
        />
        <ToolCard
          icon={Wallet}
          title="Nómina Rápida 2026"
          description="ISR + IMSS obrero en segundos. Tarifas progresivas 2026, subsidio al empleo y neto a pagar."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('nomina')}
        />
        <ToolCard
          icon={Scale}
          title="Finiquitos y Liquidaciones"
          description="Cálculo conforme a la LFT con Vacaciones Dignas 2023, aguinaldo, prima de antigüedad y despido."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('finiquitos')}
        />
      </CategorySection>

      {/* SAT */}
      <CategorySection
        title="SAT"
        description="Herramientas para CFDI 4.0, validación y conversión de XMLs."
        columns={2}
      >
        <ToolCard
          icon={FileSpreadsheet}
          title="Conversor XML → Excel"
          description="Arrastra tus CFDI y exporta CSV para contabilidad. Hasta 200 archivos."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('xml-excel')}
        />
        <ToolCard
          icon={ShieldCheck}
          title="Validador de XMLs"
          description="Verifica UUID, sello y estructura de tus CFDI. Reporte masivo de errores."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('validador')}
        />
      </CategorySection>

      {/* Cobros */}
      <CategorySection
        title="Cobros"
        description="Genera links de pago y calcula tu modelo de negocio."
        columns={2}
      >
        <ToolCard
          icon={Globe}
          title="Generador Links de Pago"
          description="Cobra a tus clientes con Clip Checkout. Link compartible, sin comisiones ocultas."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('spei')}
        />
        <ToolCard
          icon={Building2}
          title="Calculadora Leasing"
          description="Modelo $500 setup → $2,500 renta. Proyección de ingresos para despachos."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('leasing')}
        />
      </CategorySection>

      {/* Compliance */}
      <CategorySection
        title="Compliance"
        description="Referencia educativa y auditoría regulatoria."
        columns={3}
      >
        <ToolCard
          icon={Scale}
          title="Guía SAT/IMSS"
          description="8 pasos para responder a un requerimiento. Checklists, plazos y fundamentos."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('guia-sat-imss')}
        />
        <ToolCard
          icon={ShieldAlert}
          title="Auditoría Legal de Cobranza"
          description="Compara contrato vs CRM, detecta diferencias críticas y genera un dictamen exportable con fundamento legal."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('auditor-cobranza')}
        />
        <ToolCard
          icon={Sparkles}
          title="Mapa de Activos Virtuales"
          description="12 conductas mapeadas con Ley Fintech, LFPIORPI, CPF y CFF. Matriz de consulta legal para contadores."
          badge="NUEVO"
          badgeVariant="gold"
          onSelect={() => onSelectTool('mapa-activos')}
        />
      </CategorySection>
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
    <div className="mx-auto max-w-[760px] px-6 md:px-10 py-20 text-center">
      <div className="text-[10px] font-bold tracking-[0.24em] text-gold-dark uppercase font-orbitron">
        Herramienta en construcción
      </div>
      <h2 className="mt-4 font-playfair font-black text-[36px] leading-[1] text-ink">
        {name}
      </h2>
      <p className="mt-4 text-[14px] leading-[1.6] text-muted font-inter">
        Esta herramienta estará disponible en el próximo sprint. Vuelve al
        dashboard para explorar las que ya están listas.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="
          mt-8 inline-flex items-center gap-2
          px-6 py-3 rounded-full
          glass-btn glass-btn-primary
          font-bold text-[11px] tracking-[0.14em] uppercase
          font-orbitron
        "
      >
        Volver al dashboard
      </button>
    </div>
  );
}

export default App;

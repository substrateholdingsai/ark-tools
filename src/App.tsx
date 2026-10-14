/**
 * ARK TOOLS — App Principal
 *
 * Maneja la navegación entre el dashboard y las herramientas.
 * Sprint 2: ISN + SBC funcionando.
 */

import { useState } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  ShieldCheck,
  Wallet,
  Building2,
  Sparkles,
  Scale,
  Globe,
} from 'lucide-react';
import {
  Header,
  Footer,
  ToolCard,
  CategorySection,
} from './components';
import type { NavItem } from './components';
import { CalculadoraISN } from './tools/isn';
import { CalculadoraSBC } from './tools/sbc';
import { CalculadoraNomina } from './tools/nomina';
import { ConversorXML } from './tools/xml-excel';
import { ValidadorXML } from './tools/xml-validador';
import { GeneradorSPEI } from './tools/spei';
import { CalculadoraLeasing } from './tools/leasing';

type ToolId =
  | 'dashboard'
  | 'isn'
  | 'sbc'
  | 'nomina'
  | 'xml-excel'
  | 'validador'
  | 'spei'
  | 'leasing'
  | 'guia-sat-imss'
  | 'mapa-activos';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'TODAS' },
  { id: 'fiscal', label: 'FISCAL' },
  { id: 'sat', label: 'SAT' },
  { id: 'cobros', label: 'COBROS' },
  { id: 'compliance', label: 'COMPLIANCE' },
];

export function App() {
  const [activeTool, setActiveTool] = useState<ToolId>('dashboard');

  // ─────────────────────────────────────────────────────────────
  // NAVEGACIÓN
  // ─────────────────────────────────────────────────────────────
  const navigateTo = (tool: ToolId) => {
    setActiveTool(tool);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToDashboard = () => navigateTo('dashboard');

  // ─────────────────────────────────────────────────────────────
  // RENDER DE HERRAMIENTAS
  // ─────────────────────────────────────────────────────────────
  const renderTool = () => {
    switch (activeTool) {
      case 'isn':
        return <CalculadoraISN onBack={goToDashboard} />;

      case 'sbc':
        return <CalculadoraSBC onBack={goToDashboard} />;

      case 'nomina':
        return <CalculadoraNomina onBack={goToDashboard} />;

      case 'xml-excel':
        return <ConversorXML onBack={goToDashboard} />;

      case 'validador':
        return <ValidadorXML onBack={goToDashboard} />;

      case 'spei':
        return <GeneradorSPEI onBack={goToDashboard} />;

      case 'leasing':
        return <CalculadoraLeasing onBack={goToDashboard} />;

      case 'guia-sat-imss':
      case 'mapa-activos':
        return <PlaceholderTool name={activeTool} onBack={goToDashboard} />;

      case 'dashboard':
      default:
        return <Dashboard onSelectTool={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface text-ink font-inter antialiased">
      <Header
        activeTool={activeTool === 'dashboard' ? 'todas' : activeTool}
        onNavigate={(id) => {
          if (id === 'todas') goToDashboard();
        }}
        navItems={navItems}
      />

      <main>{renderTool()}</main>

      <Footer />
    </div>
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
        <p className="mt-6 text-[16px] md:text-[18px] leading-[1.5] text-muted max-w-[52ch] inter font-inter">
          Suite de utilidades para contadores, nómina y RH. Cálculo en tiempo
          real, exportación instantánea y diseño pensado para que el dinero se
          entienda sin leer.
        </p>
      </section>

      {/* Categoría: Fiscal */}
      <CategorySection
        title="Fiscal"
        description="Cálculos estatales y federales. ISN, ISR, IMSS, topes y factores."
        columns={3}
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
      </CategorySection>

      {/* Categoría: SAT */}
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

      {/* Categoría: Cobros */}
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

      {/* Categoría: Compliance */}
      <CategorySection
        title="Compliance"
        description="Referencia educativa para entender el marco regulatorio."
        columns={2}
      >
        <ToolCard
          icon={Scale}
          title="Guía SAT/IMSS"
          description="8 pasos para responder a un requerimiento. Checklists, plazos y fundamentos."
          badge="PRÓXIMAMENTE"
          badgeVariant="muted"
          disabled
        />
        <ToolCard
          icon={Sparkles}
          title="Mapa de Activos Virtuales"
          description="48 conductas mapeadas con Ley Fintech, LFPIORPI y CPF. Solo consulta."
          badge="PRÓXIMAMENTE"
          badgeVariant="muted"
          disabled
        />
      </CategorySection>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PLACEHOLDER
// ═════════════════════════════════════════════════════════════════
interface PlaceholderToolProps {
  name: string;
  onBack: () => void;
}

function PlaceholderTool({ name, onBack }: PlaceholderToolProps) {
  return (
    <div className="mx-auto max-w-[760px] px-6 md:px-10 py-20 text-center">
      <div className="text-[10px] font-bold tracking-[0.24em] text-gold-dark uppercase font-orbitron">
        Herramienta en construcción
      </div>
      <h2 className="mt-4 font-playfair font-black text-[36px] leading-[1] text-ink">
        {name}
      </h2>
      <p className="mt-4 text-[14px] leading-[1.6] text-muted inter font-inter">
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

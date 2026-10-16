/**
 * ARK TOOLS — Landing Pública
 *
 * Página de aterrizaje para usuarios no autenticados.
 * Explica las 10 herramientas gratuitas y el beneficio de registrarse
 * para asegurar acceso prioritario a futuras herramientas exclusivas.
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
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Zap,
  Lock,
  Layers,
  Users,
  X,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';
import { Footer } from './Footer';

interface ToolPreview {
  icon: typeof Calculator;
  category: string;
  title: string;
  description: string;
  tag: string;
}

const TOOLS_PREVIEW: ToolPreview[] = [
  // Fiscal
  {
    icon: Calculator,
    category: 'Fiscal',
    title: 'Calculadora ISN 2026',
    description:
      'Impuesto Sobre Nómina estatal con las tasas oficiales de las 32 entidades federativas, base gravable y desglose exportable a Excel.',
    tag: '32 Estados',
  },
  {
    icon: Building2,
    category: 'Fiscal',
    title: 'Calculadora SBC 2026',
    description:
      'Salario Base de Cotización con factor de integración automático por años de antigüedad, tope de 25 UMAs y salario mínimo general/frontera.',
    tag: 'IMSS / UMA',
  },
  {
    icon: Wallet,
    category: 'Fiscal',
    title: 'Nómina Rápida 2026',
    description:
      'Cálculo exacto de ISR con subsidio al empleo actualizado, cuotas obrero-patronales del IMSS y neto a pagar en segundos.',
    tag: 'ISR + IMSS',
  },
  // SAT
  {
    icon: FileSpreadsheet,
    category: 'SAT & CFDI',
    title: 'Conversor XML → Excel',
    description:
      'Arrastra lotes de CFDIs 3.3 y 4.0 (ingresos, nómina, gastos) y expórtalos en tablas organizadas de Excel/CSV listas para tu contabilidad.',
    tag: 'Hasta 200 archivos',
  },
  {
    icon: ShieldCheck,
    category: 'SAT & CFDI',
    title: 'Validador de XMLs',
    description:
      'Verificación profunda de sellos digitales, estructura XML y cotejo preventivo contra listados oficiales del Art. 69-B del CFF (EFOS/EDOS).',
    tag: 'Art. 69-B CFF',
  },
  // Cobros & Finanzas
  {
    icon: Globe,
    category: 'Cobros',
    title: 'Generador Links de Pago SPEI',
    description:
      'Genera links de cobro instantáneos a través de SPEI / Clip Checkout para honorarios contables sin fricción ni comisiones ocultas.',
    tag: 'SPEI / Clip',
  },
  {
    icon: Building2,
    category: 'Finanzas',
    title: 'Calculadora Leasing',
    description:
      'Simulador financiero y fiscal de arrendamiento puro vs financiero, análisis de deducción máxima de ISR y tabla de amortización.',
    tag: 'Deducción Fiscal',
  },
  // Compliance
  {
    icon: Scale,
    category: 'Compliance',
    title: 'Guía Requerimientos SAT / IMSS',
    description:
      'Metodología en 8 pasos procesales para responder auditorías, cartas invitación y multas con fundamentos legales y plazos estrictos.',
    tag: 'Defensa Fiscal',
  },
  {
    icon: ShieldAlert,
    category: 'Compliance',
    title: 'Auditoría Legal de Cobranza',
    description:
      'Compara contratos de crédito contra bitácoras CRM, detecta conductas ilícitas de cobranza extrajudicial y emite un dictamen formal exportable.',
    tag: 'CONDUSEF / PROFECO',
  },
  {
    icon: Sparkles,
    category: 'Compliance',
    title: 'Mapa de Activos Virtuales',
    description:
      'Matriz legal de consulta para contadores sobre 12 conductas con criptoactivos: Ley Fintech, LFPIORPI (prevención de lavado) y Código Fiscal.',
    tag: 'Fintech & Prevención',
  },
];

export function LandingPage() {
  const { login } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openAuth = (mode: 'register' | 'login') => {
    setAuthMode(mode);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await login({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        tenantName: tenantName.trim() || undefined,
      });
      // Al completarse login(), AuthContext actualiza isSignedIn y App.tsx conmuta al Dashboard automáticamente
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al autenticar. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-ink font-inter antialiased flex flex-col selection:bg-gold/20 selection:text-navy">
      {/* ─────────────────────────────────────────────────────────────
          NAVBAR PÚBLICA
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-line">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 h-[68px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size={40} />
            <div className="leading-none">
              <div className="orbitron font-orbitron font-black text-[14px] tracking-[0.18em] text-navy">
                ARK TOOLS
              </div>
              <div className="text-[8.5px] tracking-[0.22em] text-muted font-bold mt-[2px] uppercase">
                SUITE FISCAL & FINANCIERA MX
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="https://wa.me/525657062511?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20ARK%20TOOLS"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100/70 transition"
              title="Atención directa por WhatsApp (+52 56 5706 2511)"
            >
              <MessageSquare size={13} className="text-emerald-600" />
              <span>Soporte Directo</span>
            </a>

            <button
              onClick={() => openAuth('login')}
              className="px-4 py-2 rounded-full border border-line bg-surface-2 text-[12px] font-semibold text-navy hover:bg-cream/40 transition"
            >
              Acceso Despachos
            </button>

            <button
              onClick={() => openAuth('register')}
              className="px-4 py-2 rounded-full bg-navy text-white text-[12px] font-bold tracking-wide hover:bg-navy-dark transition shadow-sm flex items-center gap-2"
            >
              <span>Crear Cuenta Gratis</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 md:pt-24 pb-16 px-6 md:px-10 border-b border-line">
        {/* Glow de fondo decorativo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gold/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative mx-auto max-w-[1100px] text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream/70 border border-gold/40 text-[11px] font-bold tracking-[0.14em] text-gold-dark uppercase font-orbitron">
            <Zap size={14} className="text-gold-dark" />
            <span>Suite Gratuita 2026 · Acceso Sin Costo</span>
          </div>

          {/* Headline */}
          <h1 className="font-playfair font-black text-[42px] sm:text-[56px] md:text-[68px] leading-[0.96] tracking-[-0.03em] text-ink">
            Herramientas que{' '}
            <span className="text-navy">trabajan</span> mientras tú cobras.
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-[720px] text-[16px] md:text-[19px] leading-[1.55] text-muted font-inter">
            La plataforma moderna para contadores, fiscalistas y equipos de nómina en México.
            Automatiza cálculos estatales, valida CFDIs y audita cumplimiento en una interfaz veloz y precisa.
          </p>

          {/* Caja explicativa de Registro Gratuito + Acceso Futuro */}
          <div className="mx-auto max-w-[760px] p-6 rounded-2xl bg-surface-2 border border-gold/30 shadow-sm text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[13px] font-bold text-navy uppercase font-orbitron">
                  <Lock size={15} className="text-gold-dark" />
                  <span>100% Gratuito Hoy · Beneficios Exclusivos Mañana</span>
                </div>
                <p className="text-[13px] text-muted leading-relaxed">
                  Crea tu cuenta gratuita en 30 segundos para acceder de inmediato a las <strong>10 herramientas completas</strong>. 
                  Tu registro asegura pase prioritario a futuras herramientas Pro (asistente IA fiscal, almacenamiento multi-tenant en la nube y sincronización masiva).
                </p>
              </div>

              <button
                onClick={() => openAuth('register')}
                className="whitespace-nowrap px-6 py-3 rounded-xl bg-navy hover:bg-navy-dark text-white font-orbitron font-bold text-[12px] tracking-wider transition shadow-dome flex items-center gap-2 self-stretch sm:self-auto justify-center"
              >
                <span>CREAR CUENTA</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[12px] font-medium text-muted">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Tasas y tablas vigentes 2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Aislamiento multi-tenant por despacho</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SHOWCASE: LAS 10 HERRAMIENTAS
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-surface">
        <div className="mx-auto max-w-[1280px] space-y-12">
          <div className="text-center space-y-3">
            <div className="text-[11px] font-bold tracking-[0.2em] text-gold-dark uppercase font-orbitron">
              Catálogo de Herramientas
            </div>
            <h2 className="font-playfair font-black text-[34px] md:text-[46px] leading-[1.05] text-ink">
              10 utilidades indispensables para tu práctica contable
            </h2>
            <p className="text-muted text-[15px] max-w-[580px] mx-auto">
              Cada herramienta fue diseñada para resolver un problema fiscal específico con cero fricción y resultados inmediatos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS_PREVIEW.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-line bg-surface-2/60 hover:bg-surface-2 transition hover:border-gold/50 hover:shadow-glass flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white border border-line flex items-center justify-center text-navy shadow-sm group-hover:scale-105 group-hover:text-gold-dark transition">
                        <Icon size={22} />
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-cream text-gold-dark border border-gold/30">
                        {tool.tag}
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-semibold tracking-wider text-muted uppercase font-orbitron">
                        {tool.category}
                      </div>
                      <h3 className="text-[18px] font-bold text-ink group-hover:text-navy transition mt-0.5">
                        {tool.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-[1.6] text-muted">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-[11px] font-semibold text-navy">
                    <span>Incluido en registro gratis</span>
                    <CheckCircle2 size={14} className="text-emerald-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BLOQUE DE TRANSPARENCIA: FUNDAMENTO LEGAL Y CERTEZA TÉCNICA
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-white border-y border-line">
        <div className="mx-auto max-w-[1280px] space-y-12">
          <div className="max-w-[760px] mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 border border-navy/15 text-[11px] font-bold tracking-[0.16em] text-navy uppercase font-orbitron">
              <Scale size={14} className="text-gold-dark" />
              <span>Transparencia Jurídica & Cero Cajas Negras</span>
            </div>
            <h2 className="font-playfair font-black text-[34px] md:text-[46px] leading-[1.05] text-ink">
              Cálculos fundamentados en la ley. <br className="hidden sm:inline" />
              Justificables ante el SAT y tus clientes.
            </h2>
            <p className="text-muted text-[15px] leading-relaxed">
              En materia tributaria, un número sin origen no sirve para declarar. Cada resultado emitido por ARK TOOLS desglosa su fórmula matemática y cita el artículo de ley aplicable, listo para respaldar tus papeles de trabajo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tarjeta 1: ISR & Nómina */}
            <div className="p-6 rounded-2xl bg-surface-2 border border-line hover:border-gold/50 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy font-orbitron bg-white px-2.5 py-1 rounded-md border border-line">
                  ISR & Retenciones
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">2026 Vigente</span>
              </div>
              <h3 className="font-bold text-[15px] text-ink">Art. 96 LISR y RMF Anexo 8</h3>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Tarifas progresivas mensuales y quincenales, límite inferior, cuota fija y porcentaje sobre excedente, integrando el Decreto de Subsidio para el Empleo.
              </p>
            </div>

            {/* Tarjeta 2: IMSS & Salario Base */}
            <div className="p-6 rounded-2xl bg-surface-2 border border-line hover:border-gold/50 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy font-orbitron bg-white px-2.5 py-1 rounded-md border border-line">
                  IMSS & SBC
                </span>
                <span className="text-[11px] text-navy font-semibold">Tope 25 UMAs</span>
              </div>
              <h3 className="font-bold text-[15px] text-ink">Arts. 27 y 28 LSS + LFT</h3>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Factor de integración mínimo de 1.0493 conforme a Vacaciones Dignas (Art. 76 LFT), aguinaldo (Art. 87 LFT) y tope de 25 UMAs ($2,828.50/día).
              </p>
            </div>

            {/* Tarjeta 3: ISN Estatal */}
            <div className="p-6 rounded-2xl bg-surface-2 border border-line hover:border-gold/50 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy font-orbitron bg-white px-2.5 py-1 rounded-md border border-line">
                  ISN Estatal
                </span>
                <span className="text-[11px] text-gold-dark font-semibold">32 Entidades</span>
              </div>
              <h3 className="font-bold text-[15px] text-ink">Leyes de Hacienda Estatales</h3>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Tasas de nómina locales (CDMX 3%, Edomex 3%, NL 3%, etc.) con base gravable estricta, separando percepciones exentas y no integrables por estado.
              </p>
            </div>

            {/* Tarjeta 4: Auditoría SAT & CFF */}
            <div className="p-6 rounded-2xl bg-surface-2 border border-line hover:border-gold/50 transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy font-orbitron bg-white px-2.5 py-1 rounded-md border border-line">
                  Prevención Fiscal
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">CFF Art. 69-B</span>
              </div>
              <h3 className="font-bold text-[15px] text-ink">Listas Negras & EFOS/EDOS</h3>
              <p className="text-[12.5px] text-muted leading-relaxed">
                Cotejo preventivo contra listados oficiales del SAT para proteger la materialidad y deducibilidad de facturas frente a presuntas operaciones simuladas.
              </p>
            </div>
          </div>

          {/* Banner de confianza técnica */}
          <div className="p-6 rounded-2xl bg-navy text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-dome">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-[11px] font-bold tracking-widest text-gold uppercase font-orbitron">
                Certeza en Papeles de Trabajo
              </div>
              <div className="text-[16px] font-semibold text-white">
                ¿Necesitas justificar un cálculo ante un cliente o una auditoría?
              </div>
              <p className="text-[13px] text-white/80 max-w-[640px]">
                Todas las herramientas permiten copiar y exportar el desglose analítico paso a paso con los artículos y porcentajes oficiales citados expresamente.
              </p>
            </div>

            <button
              onClick={() => openAuth('register')}
              className="whitespace-nowrap px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-navy-dark font-orbitron font-bold text-[12px] tracking-wider transition shadow-sm flex items-center gap-2 shrink-0"
            >
              <span>PROBAR HERRAMIENTAS GRATIS</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          POR QUÉ REGISTRARSE (EL BENEFICIO FUTURO)
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-surface-2 border-b border-line">
        <div className="mx-auto max-w-[1100px] space-y-12">
          <div className="text-center space-y-3">
            <div className="text-[11px] font-bold tracking-[0.2em] text-gold-dark uppercase font-orbitron">
              Visión a Futuro
            </div>
            <h2 className="font-playfair font-black text-[34px] md:text-[44px] leading-[1.1] text-ink">
              ¿Por qué pedimos tu registro si hoy es 100% gratuito?
            </h2>
            <p className="text-muted text-[15px] max-w-[620px] mx-auto">
              Estamos construyendo el sistema operativo definitivo para contadores independientes y firmas contables en México.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-line space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-navy font-bold">
                <Layers size={20} className="text-navy" />
              </div>
              <h3 className="font-bold text-[16px] text-ink">1. Acceso Vitalicio Fundador</h3>
              <p className="text-[13px] text-muted leading-relaxed">
                Los usuarios registrados en esta etapa temprana conservarán acceso libre a todas las herramientas actuales, incluso cuando introduzcamos planes comerciales.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-line space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-navy font-bold">
                <Users size={20} className="text-navy" />
              </div>
              <h3 className="font-bold text-[16px] text-ink">2. Multi-Tenant por Despacho</h3>
              <p className="text-[13px] text-muted leading-relaxed">
                Podrás separar los cálculos y clientes de tu despacho contable con espacios de trabajo aislados (Multi-Tenant) y roles de colaboradores.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-line space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-navy font-bold">
                <Sparkles size={20} className="text-navy" />
              </div>
              <h3 className="font-bold text-[16px] text-ink">3. Herramientas Exclusivas IA</h3>
              <p className="text-[13px] text-muted leading-relaxed">
                Próximamente lanzaremos auditorías asistidas por IA, respuestas automatizadas a requerimientos del SAT y almacenamiento en la nube sin costo adicional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CTA FINAL
      ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-navy text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative mx-auto max-w-[760px] space-y-6">
          <div className="text-[11px] font-bold tracking-[0.2em] text-gold uppercase font-orbitron">
            Empieza en 30 segundos
          </div>
          <h2 className="font-playfair font-black text-[38px] md:text-[52px] leading-[1] text-white">
            Eleva el nivel de tu práctica contable hoy mismo.
          </h2>
          <p className="text-[15px] text-white/80 max-w-[520px] mx-auto leading-relaxed">
            Únete a la comunidad de contadores y asesores fiscales que ya optimizan su tiempo con ARK TOOLS.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openAuth('register')}
              className="px-8 py-4 rounded-xl bg-gold hover:bg-gold-light text-ink font-orbitron font-bold text-[13px] tracking-wider transition shadow-dome flex items-center gap-2"
            >
              <span>REGISTRARSE GRATIS AHORA</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => openAuth('login')}
              className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-orbitron font-semibold text-[12px] tracking-wider transition border border-white/20"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER INSTITUCIONAL
      ───────────────────────────────────────────────────────────── */}
      <Footer onSelectTool={() => openAuth('register')} />

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE AUTENTICACIÓN NATIVO (REGISTRO / LOGIN)
      ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-line shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-muted hover:text-ink hover:bg-surface-2 rounded-full transition"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <Logo size={38} />
              <div>
                <h3 className="font-orbitron font-bold text-[14px] tracking-wider text-navy">
                  ARK TOOLS
                </h3>
                <p className="text-[10px] text-muted tracking-widest font-semibold uppercase">
                  {authMode === 'register' ? 'Crear Cuenta Gratuita' : 'Iniciar Sesión'}
                </p>
              </div>
            </div>

            {/* Toggle Modes */}
            <div className="flex rounded-xl bg-surface-2 p-1 border border-line/60">
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition font-orbitron tracking-wider ${
                  authMode === 'register'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                REGISTRO
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition font-orbitron tracking-wider ${
                  authMode === 'login'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                ENTRAR
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 text-[12px] bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1 font-orbitron">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="ejemplo@despacho.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface-2 text-[13px] text-ink outline-none focus:border-navy focus:bg-white transition"
                />
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1 font-orbitron">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      placeholder="C.P. Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface-2 text-[13px] text-ink outline-none focus:border-navy focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1 font-orbitron">
                      Nombre de Despacho o Firma
                    </label>
                    <input
                      type="text"
                      placeholder="Pérez & Asociados Asesores S.C."
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface-2 text-[13px] text-ink outline-none focus:border-navy focus:bg-white transition"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-navy hover:bg-navy-dark text-white font-orbitron font-bold text-[12px] tracking-wider transition shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'ACCEDIENDO...' : authMode === 'register' ? 'COMENZAR AHORA' : 'ENTRAR AL SISTEMA'}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <p className="text-[11px] text-muted text-center leading-normal">
              Sin tarjeta de crédito requerida. Acceso total a todas las herramientas de la suite.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;

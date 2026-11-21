/**
 * ARK LEDGER — Landing Pública
 *
 * Página de aterrizaje para usuarios no autenticados.
 * Presenta vistas previas de la suite y facilita el acceso al catálogo completo.
 */

import { useEffect, useState } from 'react';
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
  Lock,
  Users,
  X,
  FileCode,
  MessageSquare,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from './Logo';
import { Footer } from './Footer';
import { SimmpleReferralButton } from './SimmpleReferralButton';
import { TOTAL_HERRAMIENTAS } from '@/data/catalogo-herramientas';

interface ToolPreview {
  icon: typeof Calculator;
  category: string;
  title: string;
  description: string;
  tag: string;
  isPremium?: boolean;
}

type PreviewCategory = 'all' | 'fiscal' | 'sat' | 'cobros' | 'compliance';

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
  {
    icon: Scale,
    category: 'Fiscal',
    title: 'Finiquitos y Liquidaciones',
    description:
      'Cálculo conforme a la LFT con Vacaciones Dignas 2023, aguinaldo proporcional, prima de antigüedad y despido injustificado (Art. 50).',
    tag: 'LFT 2026',
  },
  {
    icon: Calculator,
    category: 'Fiscal',
    title: 'Calculadora RESICO 2026',
    description:
      'Determinación mensual de ISR e IVA para Personas Físicas (tasas 1.0% a 2.5%, retención 1.25%) y Morales (flujo de efectivo) con Cédula Oficial y QR.',
    tag: 'Art. 113-E / 206',
  },
  {
    icon: Users,
    category: 'Fiscal',
    title: 'Cierre de Nómina Masivo',
    description:
      'Procesamiento en lote por período. Retenciones SAT, cuotas IMSS, ISN estatal, Cédula con Sello QR y archivo de dispersión bancaria.',
    tag: 'BATCH DOF',
    isPremium: true,
  },
  {
    icon: ShieldAlert,
    category: 'Fiscal',
    title: 'Simulador Modalidad 40',
    description:
      'Proyección de pensión Ley 73 con la restricción del Acuerdo DOF 21/10/2026 (Último SBC + 1 UMA), cálculo de cuota vigente, ROI y Cédula QR.',
    tag: 'DOF 21/10/2026',
  },
  // SAT
  {
    icon: FileSpreadsheet,
    category: 'SAT & CFDI',
    title: 'Conversor XML → CSV para Excel',
    description:
      'Extrae CFDI 3.3 y 4.0 a CSV con una fila por comprobante: hasta 200 archivos de 10 MB cada uno.',
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
    icon: FileCode,
    category: 'Cobros',
    title: 'Timbrado de Facturas CFDI 4.0',
    description:
      'Pre-validación y timbrado CFDI 4.0 con Facturapi v2 en modo preview / Sandbox SAT (CSD de prueba EKU9003173C9) sin salir de ARK LEDGER.',
    tag: 'Facturapi v2 (Sandbox)',
    isPremium: true,
  },
  {
    icon: Building2,
    category: 'Cobros',
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
    isPremium: true,
  },
  {
    icon: ShieldAlert,
    category: 'Compliance',
    title: 'Auditoría Legal de Cobranza',
    description:
      'Compara contratos de crédito contra bitácoras CRM, detecta conductas ilícitas de cobranza extrajudicial y emite un dictamen formal exportable.',
    tag: 'CONDUSEF',
  },
  {
    icon: Sparkles,
    category: 'Compliance',
    title: 'Mapa de Activos Virtuales',
    description:
      'Matriz legal de consulta para contadores sobre 12 conductas con criptoactivos: Ley Fintech, LFPIORPI (prevención de lavado) y Código Fiscal.',
    tag: 'Fintech',
  },
  // Compliance (nuevas #16, #17)
  {
    icon: FileSpreadsheet,
    category: 'Compliance',
    title: 'Conciliación Anexo 24',
    description:
      'Cruce automatizado CFDI vs Catálogo y Balanza Anexo 24, filtro de canceladas con Metadata SAT, exportación CSV BOM UTF-8 y layouts Contpaqi/COI.',
    tag: 'CFF Art. 28',
  },
  {
    icon: ShieldAlert,
    category: 'Compliance',
    title: 'Monitor LFPIORPI',
    description:
      'Evaluación determinista antilavado Art. 17 LFPIORPI, regla de acumulación móvil 6 meses, umbrales UMA 2026 y semáforo Verde/Amarillo/Rojo por cliente.',
    tag: 'Art. 17 LFPIORPI',
  },
  // Fiscal (nuevas #15, #18)
  {
    icon: Calculator,
    category: 'Fiscal',
    title: 'Balance General Comparativo',
    description:
      'Análisis Horizontal y Vertical, validación A=P+C con tolerancia $0.02, parser CSV/Excel, export CSV BOM UTF-8 y Papel de Trabajo PDF con Folio de Integridad y QR de consulta.',
    tag: 'Herramienta #15',
  },
  {
    icon: Wallet,
    category: 'Fiscal',
    title: 'Actualización y Recargos CFF',
    description:
      'Cálculo determinista Art. 17-A CFF (factor INPC truncado a 4 decimales, no-deflación) y tasa mensual de mora vigente en LIF. Desglose mes a mes y Cédula QR.',
    tag: 'Art. 17-A CFF',
  },
];

export function LandingPage() {
  const { register, signIn, verifyEmail, requestPasswordReset, resetPassword } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'forgot' | 'reset' | 'verify'>(
    'register'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [previewCategory, setPreviewCategory] = useState<PreviewCategory>('all');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const generatePassphrase = () => {
    const palabras = [
      'auditoria',
      'nomina',
      'fiscal',
      'defensa',
      'blindaje',
      'expediente',
      'declaracion',
      'segura',
      'balance',
      'sat',
      'anexo24',
    ];
    const p1 = palabras[Math.floor(Math.random() * palabras.length)];
    const p2 = palabras[Math.floor(Math.random() * palabras.length)];
    const p3 = palabras[Math.floor(Math.random() * palabras.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setPassword(`${p1}-${p2}-${p3}-${num}`);
  };

  const handleResendEmail = async () => {
    if (!email.trim() || resendCooldown > 0 || loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (authMode === 'register') {
        const message = await register({
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          tenantName: tenantName.trim() || undefined,
        });
        setSuccessMsg(message);
        setResendCooldown(60);
      } else if (authMode === 'forgot') {
        const message = await requestPasswordReset(email.trim());
        setSuccessMsg(message);
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo reenviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const action = url.searchParams.get('auth');
    const token = url.searchParams.get('token');
    if (!action || !token || action === 'invite') return;

    url.searchParams.delete('auth');
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());
    setAuthToken(token);

    if (action === 'reset') {
      setAuthMode('reset');
      setModalOpen(true);
      return;
    }
    if (action === 'verify') {
      setAuthMode('verify');
      setModalOpen(true);
    }
  }, []);

  const openAuth = (mode: 'register' | 'login') => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (['register', 'login', 'forgot'].includes(authMode) && !email.trim()) {
      setErrorMsg('Por favor ingresa tu correo electrónico.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (authMode === 'verify') {
        await verifyEmail(authToken, password);
        setPassword('');
        setAuthToken('');
        setModalOpen(false);
        setSuccessMsg('Correo verificado. Tu cuenta está lista y tu sesión está iniciada.');
      } else if (authMode === 'register') {
        const message = await register({
          email: email.trim(),
          fullName: fullName.trim() || undefined,
          tenantName: tenantName.trim() || undefined,
        });
        setSuccessMsg(message);
        setResendCooldown(60);
        setPassword('');
      } else if (authMode === 'login') {
        await signIn(email.trim(), password);
        setModalOpen(false);
      } else if (authMode === 'forgot') {
        setSuccessMsg(await requestPasswordReset(email.trim()));
        setResendCooldown(60);
      } else {
        setSuccessMsg(await resetPassword(authToken, password));
        setPassword('');
        setAuthToken('');
        setAuthMode('login');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo completar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const selectPreviewCategory = (category: PreviewCategory) => {
    setPreviewCategory(category);
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const visibleTools = TOOLS_PREVIEW.filter((tool) => {
    if (previewCategory === 'all') return true;
    if (previewCategory === 'fiscal') return tool.category === 'Fiscal';
    if (previewCategory === 'sat') return tool.category === 'SAT & CFDI';
    if (previewCategory === 'cobros')
      return tool.category === 'Cobros' || tool.category === 'Finanzas';
    return tool.category === 'Compliance';
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface font-inter text-ink antialiased selection:bg-gold/20 selection:text-navy">
      {/* ─────────────────────────────────────────────────────────────
          NAVBAR PÚBLICA
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:gap-4 md:min-h-[68px] md:px-10">
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Logo size={34} />
            <div className="leading-none">
              <div className="orbitron font-orbitron text-[12px] font-black tracking-[0.14em] text-navy sm:text-[14px] sm:tracking-[0.18em]">
                ARK LEDGER
              </div>
              <div className="mt-[2px] hidden text-[8.5px] font-bold uppercase tracking-[0.22em] text-muted sm:block">
                SUITE FISCAL & FINANCIERA MX
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <a
              href="https://wa.me/525657062511?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20ARK%20TOOLS"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100/70 md:inline-flex"
              title="Atención directa por WhatsApp (+52 56 5706 2511)"
            >
              <MessageSquare size={13} className="text-emerald-600" />
              <span>Soporte Directo</span>
            </a>

            <SimmpleReferralButton className="inline-flex" />

            <button
              onClick={() => openAuth('login')}
              className="whitespace-nowrap rounded-full border border-line bg-surface-2 px-3 py-2 text-[11px] font-semibold text-navy transition hover:bg-cream/40 sm:px-4 sm:text-[12px]"
            >
              <span className="hidden sm:inline">Acceso Despachos</span>
              <span className="sm:hidden">Entrar</span>
            </button>

            <button
              onClick={() => openAuth('register')}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-navy px-3 py-2 text-[11px] font-bold tracking-wide text-white shadow-sm transition hover:bg-navy-dark sm:gap-2 sm:px-4 sm:text-[12px]"
            >
              <span className="hidden sm:inline">Crear Cuenta Gratis</span>
              <span className="sm:hidden">Crear</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <nav
          aria-label="Navegación del catálogo"
          className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-line/70 px-4 py-2.5 md:px-10"
        >
          {(
            [
              ['all', 'Todas'],
              ['fiscal', 'Fiscal'],
              ['sat', 'SAT & CFDI'],
              ['cobros', 'Cobros'],
              ['compliance', 'Compliance'],
            ] as const
          ).map(([category, label]) => (
            <button
              key={category}
              type="button"
              onClick={() => selectPreviewCategory(category)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                previewCategory === category
                  ? 'border-navy bg-navy/5 text-navy'
                  : 'border-line bg-white text-muted hover:text-navy'
              }`}
              aria-pressed={previewCategory === category}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line px-6 pb-16 pt-16 md:px-10 md:pt-24">
        {/* Glow de fondo decorativo */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[350px] w-[800px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />

        <div className="relative mx-auto max-w-[1100px] space-y-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream/70 px-3.5 py-1.5 font-orbitron text-[11px] font-bold uppercase tracking-[0.14em] text-gold-dark">
            <ShieldCheck size={14} className="text-gold-dark" />
            <span>Suite fiscal y laboral para despachos en México</span>
          </div>

          {/* Headline */}
          <h1 className="font-playfair text-[42px] font-black leading-[0.96] tracking-[-0.03em] text-ink sm:text-[56px] md:text-[68px]">
            {TOTAL_HERRAMIENTAS} herramientas. <br />
            <span className="text-navy">Cada cálculo cita la ley.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-[760px] font-inter text-[16px] leading-[1.55] text-muted md:text-[19px]">
            Suite fiscal y laboral para despachos y empresas en México. 32 estados, cálculos al 2026
            y el artículo exacto citado en cada resultado: LISR, LSS, CFF, LFT y las leyes de
            hacienda estatales. Listo para tus papeles de trabajo.
          </p>

          {/* Caja Freemium: Calculadoras Gratis + Trazabilidad Pro */}
          <div className="mx-auto max-w-[800px] rounded-2xl border border-gold/40 bg-surface-2 p-6 text-left shadow-sm">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-orbitron text-[13px] font-bold uppercase text-navy">
                  <Fingerprint size={16} className="text-gold-dark" />
                  <span>Empieza gratis. Sube a Pro cuando lo necesites.</span>
                </div>
                <p className="text-[13px] leading-relaxed text-muted">
                  Las calculadoras y el conversor XML son de acceso libre y sin límite de cálculos
                  diarios. Crea tu cuenta y empieza a calcular en segundos, sin tarjeta.
                </p>
              </div>

              <button
                onClick={() => openAuth('register')}
                className="flex items-center justify-center gap-2 self-stretch whitespace-nowrap rounded-xl bg-navy px-6 py-3.5 font-orbitron text-[12px] font-bold tracking-wider text-white shadow-dome transition hover:bg-navy-dark sm:self-auto"
              >
                <span>COMENZAR GRATIS</span>
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
              <span>Cita el artículo de ley en cada cálculo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Cobertura en los 32 estados</span>
            </div>
          </div>

          {/* Aviso legal (letra chica) */}
          <p className="mx-auto max-w-[820px] text-[10.5px] leading-[1.6] text-muted/70">
            Aviso: ARK LEDGER entrega resultados de referencia y el fundamento legal aplicable; la
            decisión final corresponde al profesional. El Folio de Integridad es una referencia
            interna determinista: no es un sello SHA-256, una constancia NOM-151 ni una
            certificación oficial. El portal no emite dictámenes. El timbrado CFDI 4.0 opera en modo
            preview (Sandbox SAT).
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SHOWCASE: LAS HERRAMIENTAS
      ───────────────────────────────────────────────────────────── */}
      <section id="catalogo" className="scroll-mt-32 bg-surface px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1280px] space-y-12">
          <div className="space-y-3 text-center">
            <div className="font-orbitron text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              Catálogo de Herramientas
            </div>
            <h2 className="font-playfair text-[34px] font-black leading-[1.05] text-ink md:text-[46px]">
              {visibleTools.length} vistas previas de herramientas
            </h2>
            <p className="mx-auto max-w-[580px] text-[15px] text-muted">
              El catálogo canónico de Ledger contiene {TOTAL_HERRAMIENTAS} herramientas; esta
              sección muestra un subconjunto que puede filtrarse por categoría.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-surface-2/60 p-6 transition hover:border-gold/50 hover:bg-surface-2 hover:shadow-glass"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-navy shadow-sm transition group-hover:scale-105 group-hover:text-gold-dark">
                        <Icon size={22} />
                      </div>
                      <span className="rounded-md border border-gold/30 bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                        {tool.tag}
                      </span>
                    </div>

                    <div>
                      <div className="font-orbitron text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {tool.category}
                      </div>
                      <h3 className="mt-0.5 text-[18px] font-bold text-ink transition group-hover:text-navy">
                        {tool.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-[1.6] text-muted">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer de Tarjeta: Gratuito vs Pro */}
                  {tool.isPremium ? (
                    <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4 text-[11px] font-semibold text-gold-dark">
                      <span className="flex items-center gap-1.5">
                        <Fingerprint size={13} className="text-gold-dark" />
                        Requiere Crédito Pro
                      </span>
                      <Lock size={13} className="text-muted" />
                    </div>
                  ) : (
                    <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4 text-[11px] font-semibold text-navy">
                      <span>Cálculo libre e ilimitado</span>
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          BLOQUE DE TRANSPARENCIA: FUNDAMENTO LEGAL Y CERTEZA TÉCNICA
      ───────────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-white px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1280px] space-y-12">
          <div className="mx-auto max-w-[760px] space-y-3 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-navy/5 px-3 py-1 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-navy">
              <Scale size={14} className="text-gold-dark" />
              <span>Transparencia Jurídica & Cero Cajas Negras</span>
            </div>
            <h2 className="font-playfair text-[34px] font-black leading-[1.05] text-ink md:text-[46px]">
              Cálculos fundamentados en la ley. <br className="hidden sm:inline" />
              Justificables ante el SAT y tus clientes.
            </h2>
            <p className="text-[15px] leading-relaxed text-muted">
              En materia tributaria, un número sin origen no sirve para declarar. Cada resultado
              emitido por ARK LEDGER desglosa su fórmula matemática y cita el artículo de ley
              aplicable, listo para respaldar tus papeles de trabajo.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Tarjeta 1: ISR & Nómina */}
            <div className="space-y-3 rounded-2xl border border-line bg-surface-2 p-6 transition hover:border-gold/50">
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-line bg-white px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                  ISR & Retenciones
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">2026 Vigente</span>
              </div>
              <h3 className="text-[15px] font-bold text-ink">Art. 96 LISR y RMF Anexo 8</h3>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Tarifas progresivas mensuales y quincenales, límite inferior, cuota fija y
                porcentaje sobre excedente, integrando el Decreto de Subsidio para el Empleo.
              </p>
            </div>

            {/* Tarjeta 2: IMSS & Salario Base */}
            <div className="space-y-3 rounded-2xl border border-line bg-surface-2 p-6 transition hover:border-gold/50">
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-line bg-white px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                  IMSS & SBC
                </span>
                <span className="text-[11px] font-semibold text-navy">Tope 25 UMAs</span>
              </div>
              <h3 className="text-[15px] font-bold text-ink">Arts. 27 y 28 LSS + LFT</h3>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Factor de integración mínimo de 1.0493 conforme a Vacaciones Dignas (Art. 76 LFT),
                aguinaldo (Art. 87 LFT) y tope de 25 UMAs ($2,932.75/día).
              </p>
            </div>

            {/* Tarjeta 3: ISN Estatal */}
            <div className="space-y-3 rounded-2xl border border-line bg-surface-2 p-6 transition hover:border-gold/50">
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-line bg-white px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                  ISN Estatal
                </span>
                <span className="text-[11px] font-semibold text-gold-dark">32 Entidades</span>
              </div>
              <h3 className="text-[15px] font-bold text-ink">Leyes de Hacienda Estatales</h3>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Tasas de nómina locales (CDMX 3%, Edomex 3%, NL 3%, etc.) con base gravable
                estricta, separando percepciones exentas y no integrables por estado.
              </p>
            </div>

            {/* Tarjeta 4: Auditoría SAT & CFF */}
            <div className="space-y-3 rounded-2xl border border-line bg-surface-2 p-6 transition hover:border-gold/50">
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-line bg-white px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
                  Prevención Fiscal
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">CFF Art. 69-B</span>
              </div>
              <h3 className="text-[15px] font-bold text-ink">Listas Negras & EFOS/EDOS</h3>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Cotejo preventivo contra listados oficiales del SAT para proteger la materialidad y
                deducibilidad de facturas frente a presuntas operaciones simuladas.
              </p>
            </div>
          </div>

          {/* Banner de confianza técnica */}
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-navy p-6 text-white shadow-dome md:flex-row">
            <div className="space-y-1 text-center md:text-left">
              <div className="font-orbitron text-[11px] font-bold uppercase tracking-widest text-gold">
                Certeza en Papeles de Trabajo
              </div>
              <div className="text-[16px] font-semibold text-white">
                ¿Necesitas justificar un cálculo ante un cliente o una auditoría?
              </div>
              <p className="max-w-[640px] text-[13px] text-white/80">
                Todas las herramientas permiten copiar y exportar el desglose analítico paso a paso
                con los artículos y porcentajes oficiales citados expresamente.
              </p>
            </div>

            <button
              onClick={() => openAuth('register')}
              className="flex max-w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 text-center font-orbitron text-[12px] font-bold tracking-wider text-navy-dark shadow-sm transition hover:bg-gold-light sm:shrink-0 sm:whitespace-nowrap sm:px-6"
            >
              <span>PROBAR HERRAMIENTAS GRATIS</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODELO DE NEGOCIO TRANSPARENTE (FREEMIUM)
      ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-surface-2 px-6 py-20 md:px-10">
        <div className="mx-auto max-w-[1100px] space-y-12">
          <div className="space-y-3 text-center">
            <div className="font-orbitron text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark">
              Modelo Freemium
            </div>
            <h2 className="font-playfair text-[34px] font-black leading-[1.1] text-ink md:text-[44px]">
              El valor es gratis. <br />
              <span className="text-navy">Lo que escala es Pro.</span>
            </h2>
            <p className="mx-auto max-w-[620px] text-[15px] text-muted">
              Las calculadoras y el conversor XML nunca tendrán costo ni límite de uso diario. Los
              planes Pro cubren funciones de alto valor operativo: emisión de CFDI 4.0 y
              automatización masiva para despachos con alto volumen.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-[16px] font-bold text-ink">1. Calculadoras Gratuitas</h3>
              <p className="text-[13px] leading-relaxed text-muted">
                Todas las fórmulas DOF, ISR, IMSS, conversor XML y RESICO son de libre uso. Sin
                trucos, sin límites de cálculos diarios.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-gold/40 bg-white p-6 shadow-sm ring-1 ring-gold/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream font-bold text-navy">
                <Fingerprint size={20} className="text-gold-dark" />
              </div>
              <h3 className="text-[16px] font-bold text-ink">2. Expediente Único</h3>
              <p className="text-[13px] leading-relaxed text-muted">
                Algunas funciones de archivo y generación de documentos pueden requerir un plan de
                pago. El Folio de Integridad es una referencia interna; no es un sello SHA-256, una
                constancia NOM-151 ni una certificación oficial.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-line bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream font-bold text-navy">
                <FileCode size={20} className="text-navy" />
              </div>
              <h3 className="text-[16px] font-bold text-ink">
                3. Timbrado & Automatización Masiva
              </h3>
              <p className="text-[13px] leading-relaxed text-muted">
                Pre-validación y timbrado CFDI 4.0 en modo preview (Sandbox SAT) y procesamiento
                masivo de nóminas para despachos que manejan alto volumen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CTA FINAL
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy px-6 py-20 text-center text-white md:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15),transparent_70%)]" />

        <div className="relative mx-auto max-w-[760px] space-y-6">
          <div className="font-orbitron text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
            Empieza gratis hoy
          </div>
          <h2 className="font-playfair text-[38px] font-black leading-[1] text-white md:text-[52px]">
            Deja de verificar a mano. <br className="hidden sm:inline" />
            Calcula con fundamento.
          </h2>
          <p className="mx-auto max-w-[520px] text-[15px] leading-relaxed text-white/80">
            Crea tu cuenta y accede a las {TOTAL_HERRAMIENTAS} herramientas de ARK LEDGER. Sin
            tarjeta de crédito, sin límite de cálculos.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <button
              onClick={() => openAuth('register')}
              className="flex items-center gap-2 rounded-xl bg-gold px-8 py-4 font-orbitron text-[13px] font-bold tracking-wider text-ink shadow-dome transition hover:bg-gold-light"
            >
              <span>REGISTRARSE GRATIS AHORA</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => openAuth('login')}
              className="rounded-xl border border-white/20 bg-white/10 px-6 py-4 font-orbitron text-[12px] font-semibold tracking-wider text-white transition hover:bg-white/15"
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
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm duration-150">
          <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-6 overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl sm:p-8">
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <Logo size={38} />
              <div>
                <h3 className="font-orbitron text-[14px] font-bold tracking-wider text-navy">
                  ARK LEDGER
                </h3>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                  {authMode === 'register'
                    ? 'Crear Cuenta Gratuita'
                    : authMode === 'login'
                      ? 'Iniciar Sesión'
                      : authMode === 'forgot'
                        ? 'Recuperar Contraseña'
                        : authMode === 'reset'
                          ? 'Crear Nueva Contraseña'
                          : 'Verificar Correo'}
                </p>
              </div>
            </div>

            {/* Toggle Modes */}
            {(authMode === 'register' || authMode === 'login') && (
              <div className="flex rounded-xl border border-line/60 bg-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className={`flex-1 rounded-lg py-1.5 font-orbitron text-[11px] font-bold tracking-wider transition ${
                    authMode === 'register'
                      ? 'bg-white text-navy shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  REGISTRO
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className={`flex-1 rounded-lg py-1.5 font-orbitron text-[11px] font-bold tracking-wider transition ${
                    authMode === 'login'
                      ? 'bg-white text-navy shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  ENTRAR
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[12px] text-emerald-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="leading-relaxed">{successMsg}</p>
                </div>
                {['register', 'forgot'].includes(authMode) && email.trim() && (
                  <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2 text-[11px]">
                    <span className="text-emerald-700">¿No lo encuentras en tu bandeja?</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || loading}
                      onClick={handleResendEmail}
                      className="cursor-pointer font-semibold text-emerald-950 underline hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar correo'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {authMode === 'verify' && (
              <p className="text-[12px] leading-relaxed text-muted">
                Confirma tu correo y crea una contraseña para completar tu cuenta. Este paso
                requiere tu acción explícita.
              </p>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {['register', 'login', 'forgot'].includes(authMode) && (
                <div>
                  <label className="mb-1 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="ejemplo@despacho.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[13px] text-ink outline-none transition focus:border-navy focus:bg-white"
                  />
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="mb-1 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      placeholder="C.P. Juan Pérez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[13px] text-ink outline-none transition focus:border-navy focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                      Nombre de Despacho o Firma
                    </label>
                    <input
                      type="text"
                      placeholder="Pérez & Asociados Asesores S.C."
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-[13px] text-ink outline-none transition focus:border-navy focus:bg-white"
                    />
                  </div>
                </>
              )}

              {['login', 'reset', 'verify'].includes(authMode) && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block font-orbitron text-[11px] font-bold uppercase tracking-wider text-ink">
                      {authMode === 'login'
                        ? 'Contraseña *'
                        : authMode === 'reset'
                          ? 'Nueva Contraseña *'
                          : 'Crea una Contraseña *'}
                    </label>
                    {authMode !== 'login' && (
                      <button
                        type="button"
                        onClick={generatePassphrase}
                        className="cursor-pointer text-[10px] font-semibold text-navy hover:underline"
                      >
                        Sugerir frase segura
                      </button>
                    )}
                  </div>
                  <input
                    type={authMode === 'login' ? 'password' : 'text'}
                    required
                    minLength={authMode === 'login' ? undefined : 12}
                    maxLength={128}
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={
                      authMode === 'login' ? '••••••••' : 'ej: auditoria-fiscal-segura-2026'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 font-mono text-[13px] text-ink outline-none transition focus:border-navy focus:bg-white"
                  />
                  {authMode !== 'login' && (
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span
                        className={
                          password.length >= 12 ? 'font-medium text-emerald-700' : 'text-muted'
                        }
                      >
                        {password.length >= 12
                          ? '✓ Longitud segura'
                          : `Mínimo 12 caracteres (${password.length}/12)`}
                      </span>
                      <span className="text-muted">Recomendamos una frase de 3 palabras.</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy font-orbitron text-[12px] font-bold tracking-wider text-white shadow-sm transition hover:bg-navy-dark"
              >
                <span>
                  {loading
                    ? 'PROCESANDO...'
                    : authMode === 'register'
                      ? 'CREAR CUENTA'
                      : authMode === 'login'
                        ? 'ENTRAR AL SISTEMA'
                        : authMode === 'forgot'
                          ? 'ENVIAR INSTRUCCIONES'
                          : authMode === 'reset'
                            ? 'ACTUALIZAR CONTRASEÑA'
                            : authMode === 'verify'
                              ? 'VERIFICAR Y CREAR CUENTA'
                              : 'CONFIRMAR CORREO'}
                </span>
                <ArrowRight size={14} />
              </button>
            </form>

            {authMode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('forgot');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full text-center text-[11px] font-semibold text-navy hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
            {(authMode === 'forgot' || authMode === 'reset' || authMode === 'verify') && (
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="w-full text-center text-[11px] font-semibold text-navy hover:underline"
              >
                Volver a iniciar sesión
              </button>
            )}
            {authMode === 'register' && (
              <p className="text-center text-[11px] leading-normal text-muted">
                Te enviaremos un enlace para confirmar tu correo y crear tu contraseña. Sin tarjeta
                de crédito requerida.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;

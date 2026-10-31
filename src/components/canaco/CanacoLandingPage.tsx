/**
 * CANACO SERVYTUR MÉRIDA — Landing Page Institucional Pública
 *
 * Portal público oficial de la Cámara Nacional de Comercio, Servicios y Turismo de Mérida.
 * Rutea el tráfico hacia:
 *  1) Ventanilla Digital de Afiliación & Checkout SIEM (Nuevos registros y renovaciones).
 *  2) Consulta pública de Socio Activo (Búsqueda por RFC para descarga de Cédula Oficial QR).
 *  3) Acceso Directivo y Padrón SIEM (horus.i2d@gmail.com).
 *
 * Basada en los lineamientos del Design System HENEQUÉN y el contenido oficial de canacomerida.com.mx
 */

import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  Lock,
  MapPin,
  Megaphone,
  Phone,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Inbox,
  X,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CanacoLogo } from '@/components/brand/CanacoLogo';
import { VentanillaAfiliacionModal } from './VentanillaAfiliacionModal';
import { ConstanciaSocioModal } from './ConstanciaSocioModal';
import { BuzonDocumentalModal } from './BuzonDocumentalModal';
import { SimmpleReferralButton } from '../SimmpleReferralButton';
import type { SocioCanacoRegistro } from './types';

interface CanacoLandingPageProps {
  onOpenAuth?: (tab: 'login' | 'register') => void;
}

export function CanacoLandingPage({ onOpenAuth }: CanacoLandingPageProps) {
  const { signIn } = useAuth();

  // Modales
  const [modalAfiliacionOpen, setModalAfiliacionOpen] = useState(false);
  const [socioConsultado, setSocioConsultado] = useState<SocioCanacoRegistro | null>(null);
  const [buzonOpen, setBuzonOpen] = useState(false);
  const [buzonRfc, setBuzonRfc] = useState('');
  const [buzonEmail, setBuzonEmail] = useState('');

  // Modal Login Admin
  const [modalAdminOpen, setModalAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('horus.i2d@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');
    try {
      if (onOpenAuth) {
        onOpenAuth('login');
      } else {
        await signIn(adminEmail, adminPassword);
      }
      setModalAdminOpen(false);
    } catch (err: any) {
      setAdminError(err.message || 'Credenciales incorrectas para el acceso directivo.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Buscador de socio por RFC
  const [rfcBusqueda, setRfcBusqueda] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [resultadoConsulta, setResultadoConsulta] = useState<{
    encontrado: boolean;
    estatus?: string;
    mensaje?: string;
    socio?: SocioCanacoRegistro;
  } | null>(null);

  // Consultar RFC en el padrón
  const handleConsultarRfc = async (e: React.FormEvent) => {
    e.preventDefault();
    const rfcLimpio = rfcBusqueda.trim().toUpperCase();
    if (!rfcLimpio) return;

    setConsultando(true);
    setResultadoConsulta(null);

    try {
      const res = await fetch(`/api/afiliaciones/consulta?rfc=${encodeURIComponent(rfcLimpio)}`);
      const data = (await res.json()) as any;
      if (res.ok && data.encontrado && data.socio) {
        setResultadoConsulta({
          encontrado: true,
          estatus: data.estatus || data.socio.estatus,
          socio: data.socio,
        });
      } else {
        setResultadoConsulta({
          encontrado: false,
          mensaje:
            data.mensaje ||
            `El RFC ${rfcLimpio} no cuenta con registro activo en el Padrón SIEM 2026.`,
        });
      }
    } catch {
      // Fallback demo local si corre sin backend D1
      if (rfcLimpio.includes('MAYAB') || rfcLimpio.includes('FPE')) {
        const socioDemo: SocioCanacoRegistro = {
          folioSiem: 'SIEM-MID-2026-AMA2-MIC-4819',
          razonSocial: 'Abarrotes y Comercializadora Mayab S.A. de C.V.',
          nombreComercial: 'Abarrotes del Mayab',
          rfc: rfcLimpio,
          sector: 'comercio',
          estrato: 'micro',
          numEmpleados: 4,
          direccion: {
            calle: 'Calle 60 #450 x 51 y 53',
            colonia: 'Centro',
            codigoPostal: '97000',
            municipio: 'Mérida',
            ciudad: 'Mérida, Yucatán',
          },
          contacto: {
            nombre: 'Lic. Fernando Pech',
            email: 'contacto@mayab.mx',
            telefono: '+52 999 912 3456',
          },
          fechaAfiliacion: '2026-10-25',
          fechaVigencia: '2027-10-25',
          estatus: 'activo',
          montoPagado: 2000,
          metodoPago: 'tarjeta',
          cfdiRequerido: true,
          selloDigitalSha256: 'SHA256:CANACO-MID-4819-2026-OFICIAL',
        };
        setResultadoConsulta({
          encontrado: true,
          estatus: 'Socio Activo',
          socio: socioDemo,
        });
      } else {
        setResultadoConsulta({
          encontrado: false,
          mensaje: `No se localizó afiliación vigente para el RFC ${rfcLimpio} en el ejercicio 2026.`,
        });
      }
    } finally {
      setConsultando(false);
    }
  };

  const serviciosGrid = [
    {
      titulo: 'Afíliate',
      descripcion:
        'Ahorra en cursos, salones y trámites legales desde el primer mes. Súmate a los socios que ya lo hacen.',
      icono: UserCheck,
      colorIcono: 'text-henequen-terra',
      badge: 'Beneficio Inmediato',
      action: () => setModalAfiliacionOpen(true),
      btnTexto: 'Iniciar Afiliación',
    },
    {
      titulo: 'Salones y Stands',
      descripcion:
        'Cinco salones equipados: Juntas, Capacitación, Lobby, Consejo y Convenciones. Cuotas preferenciales para afiliados.',
      icono: Building2,
      colorIcono: 'text-henequen-anil',
      badge: 'Instalaciones',
    },
    {
      titulo: 'Jurídico & Compliance',
      descripcion:
        'Contratos, trámites mercantiles, asesoría laboral y defensa gremial para agremiados de la Cámara.',
      icono: Scale,
      colorIcono: 'text-henequen-terra',
      badge: 'Blindaje Legal',
    },
    {
      titulo: 'Capacitación Empresarial',
      descripcion:
        'Cursos abiertos y programas de formación especializada para elevar la competitividad de tu equipo.',
      icono: GraduationCap,
      colorIcono: 'text-henequen-anil',
      badge: 'Desarrollo',
    },
    {
      titulo: 'Representatividad',
      descripcion:
        'Tu empresa tiene voz y peso ante autoridades de gobierno y organismos cúpula. CANACO la representa.',
      icono: Megaphone,
      colorIcono: 'text-henequen-terra',
      badge: 'Voz Gremial',
    },
    {
      titulo: 'Networking y Vinculación',
      descripcion:
        'Conecta con más de 1,200 afiliados, proveedores y aliados estratégicos en el ecosistema comercial de Yucatán.',
      icono: Users,
      colorIcono: 'text-henequen-anil',
      badge: 'Comunidad',
    },
  ];

  return (
    <div className="min-h-screen bg-henequen-cal font-inter text-henequen-grafito selection:bg-henequen-sisal selection:text-henequen-anil">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. NAVEGACIÓN SUPERIOR INSTITUCIONAL                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-henequen-arena bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <CanacoLogo variant="symbol" className="h-10 w-10 text-henequen-anil" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="font-serif text-sm font-bold tracking-tight text-henequen-anil">
                  CANACO SERVYTUR MÉRIDA
                </div>
                <span className="rounded-full border border-henequen-terra/40 bg-henequen-terra/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-henequen-terra-dark">
                  Portal del Socio
                </span>
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-henequen-piedra">
                120 Años Tejiendo el Comercio de Yucatán
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#consulta-socio"
              className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold text-henequen-piedra transition hover:text-henequen-anil md:inline-block"
            >
              Consultar Socio SIEM
            </a>

            <button
              type="button"
              onClick={() => setModalAfiliacionOpen(true)}
              className="shadow-xs inline-flex items-center gap-1.5 rounded-lg bg-henequen-terra px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-henequen-terra-dark"
            >
              <UserPlus size={13} />
              <span>Afiliar mi Empresa</span>
            </button>

            <button
              type="button"
              onClick={() => setModalAdminOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-henequen-arena bg-white px-3 py-1.5 text-xs font-semibold text-henequen-anil transition hover:bg-henequen-sisal/50"
              title="Acceso para el Administrador de la Cámara (horus.i2d@gmail.com)"
            >
              <Lock size={12} className="text-henequen-piedra" />
              <span>Directorio & Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. HERO PRINCIPAL — 120 AÑOS                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-henequen-arena bg-gradient-to-b from-white via-henequen-cal to-henequen-sisal/30 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
        {/* Adorno sutil de fondo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-henequen-sisal/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-henequen-terra/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="shadow-xs inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-henequen-anil/25 bg-white px-4 py-1.5 text-[11px] font-semibold tracking-wider text-henequen-anil">
            <span className="flex items-center gap-1.5 font-bold uppercase text-henequen-anil">
              <Sparkles size={13} className="text-henequen-terra" />
              Portal Oficial de Servicios al Socio
            </span>
            <span className="text-henequen-arena">•</span>
            <span className="text-[11px] font-medium text-henequen-piedra">
              Fundada en 1906 · 120 Años de Trayectoria Empresarial
            </span>
          </div>

          <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-henequen-anil sm:text-5xl sm:leading-tight">
            Cámara Nacional de Comercio, Servicios y Turismo de Mérida
            <span className="mt-2 block font-sans text-xl font-semibold text-henequen-terra sm:text-2xl">
              Ventanilla Digital y Suite de Servicios al Afiliado
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-henequen-piedra sm:text-lg sm:leading-relaxed">
            Plataforma institucional de servicios para los{' '}
            <strong className="font-semibold text-henequen-grafito">
              +1,200 afiliados formales
            </strong>{' '}
            que representamos ante autoridades e instituciones. Gestiona tu Registro SIEM 2026,
            descarga tu Cédula Oficial y accede a la suite contable, fiscal y de defensa para tu
            empresa.
          </p>

          {/* Botones de acción del Hero */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={() => setModalAfiliacionOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-henequen-terra px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-henequen-terra-dark sm:w-auto"
            >
              <UserPlus size={16} />
              <span>Afiliarme / Renovar Registro SIEM 2026</span>
            </button>

            <a
              href="#consulta-socio"
              className="shadow-xs inline-flex w-full items-center justify-center gap-2 rounded-xl border border-henequen-arena bg-white px-6 py-3.5 text-sm font-semibold text-henequen-anil transition hover:bg-henequen-sisal/40 sm:w-auto"
            >
              <Search size={16} className="text-henequen-piedra" />
              <span>Consultar Estatus de Socio / Cédula</span>
            </a>
          </div>

          {/* Estadísticas camerales */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-henequen-arena/60 pt-8 sm:grid-cols-4">
            <div>
              <div className="font-mono text-2xl font-bold text-henequen-anil sm:text-3xl">
                120 Años
              </div>
              <div className="text-[11px] font-medium text-henequen-piedra">
                Historia y Respaldo
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-henequen-terra sm:text-3xl">
                +1,200
              </div>
              <div className="text-[11px] font-medium text-henequen-piedra">Socios Agremiados</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-henequen-anil sm:text-3xl">
                100% Legal
              </div>
              <div className="text-[11px] font-medium text-henequen-piedra">
                Padrón Oficial SIEM
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-emerald-700 sm:text-3xl">
                SHA-256
              </div>
              <div className="text-[11px] font-medium text-henequen-piedra">
                Cédula Digital Criptográfica
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. BUSCADOR INTERACTIVO DE SOCIO / CÉDULA OFICIAL                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="consulta-socio"
        className="border-b border-henequen-arena bg-white py-14 sm:py-16"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border border-henequen-arena bg-henequen-muro p-6 shadow-pieza sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-henequen-terra">
                  <ShieldCheck size={14} />
                  <span>Ventanilla de Verificación Rápida</span>
                </div>
                <h2 className="mt-1 font-serif text-2xl font-bold text-henequen-anil">
                  Consulta de Socio Activo y Cédula SIEM
                </h2>
                <p className="mt-1 text-xs text-henequen-piedra">
                  Ingresa el RFC de tu empresa para verificar tu vigencia cameral o reimprimir tu
                  Cédula Oficial Carta con Sello SHA-256.
                </p>
              </div>
            </div>

            {/* Formulario de búsqueda */}
            <form onSubmit={handleConsultarRfc} className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-henequen-piedra"
                />
                <input
                  type="text"
                  placeholder="Ej. AMA200101XYZ o RFC de tu establecimiento..."
                  value={rfcBusqueda}
                  onChange={(e) => setRfcBusqueda(e.target.value)}
                  className="w-full rounded-xl border border-henequen-arena bg-white py-3 pl-10 pr-4 font-mono text-xs font-semibold uppercase text-henequen-grafito placeholder:font-sans placeholder:normal-case placeholder:text-henequen-piedra/60 focus:border-henequen-anil focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={consultando}
                className="shadow-xs inline-flex items-center justify-center gap-2 rounded-xl bg-henequen-anil px-6 py-3 text-xs font-semibold text-white transition hover:bg-henequen-anil-deep disabled:opacity-50"
              >
                {consultando ? 'Buscando...' : 'Consultar Padrón'}
              </button>
            </form>

            {/* Resultado de búsqueda */}
            {resultadoConsulta && (
              <div className="mt-6 border-t border-henequen-arena/70 pt-6">
                {resultadoConsulta.encontrado && resultadoConsulta.socio ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-900">
                              {resultadoConsulta.socio.razonSocial}
                            </span>
                            <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              {resultadoConsulta.estatus || 'Socio Activo'}
                            </span>
                          </div>
                          <div className="mt-1 font-mono text-xs text-emerald-800">
                            RFC: {resultadoConsulta.socio.rfc} · Folio SIEM:{' '}
                            {resultadoConsulta.socio.folioSiem}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBuzonRfc(resultadoConsulta.socio?.rfc || '');
                            setBuzonEmail(resultadoConsulta.socio?.contacto?.email || '');
                            setBuzonOpen(true);
                          }}
                          className="shadow-xs inline-flex items-center justify-center gap-1.5 rounded-lg border border-henequen-anil/40 bg-white px-3.5 py-2 text-xs font-semibold text-henequen-anil transition hover:bg-henequen-sisal/30"
                        >
                          <Inbox size={13} />
                          <span>Buzón de Expediente</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSocioConsultado(resultadoConsulta.socio || null)}
                          className="shadow-xs inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                        >
                          <Download size={13} />
                          <span>Ver Cédula Oficial Carta</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <Clock size={20} className="mt-0.5 shrink-0 text-amber-700" />
                        <div>
                          <div className="text-sm font-semibold text-amber-900">
                            Trámite Pendiente o No Registrado
                          </div>
                          <div className="mt-0.5 text-xs text-amber-800">
                            {resultadoConsulta.mensaje}
                          </div>
                        </div>
                      </div>

                      <SimmpleReferralButton className="hidden md:inline-flex" />

                      <button
                        type="button"
                        onClick={() => setModalAfiliacionOpen(true)}
                        className="shadow-xs inline-flex items-center justify-center gap-1.5 rounded-lg bg-henequen-terra px-4 py-2 text-xs font-semibold text-white transition hover:bg-henequen-terra-dark"
                      >
                        <UserPlus size={13} />
                        <span>Completar Afiliación</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. CUADRÍCULA DE SERVICIOS GREMIALES (Contenido Oficial)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-henequen-terra">
              Beneficios para Afiliados
            </span>
            <h2 className="mt-1 font-serif text-3xl font-bold text-henequen-anil sm:text-4xl">
              Servicios Diseñados para Impulsar tu Negocio
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-henequen-piedra">
              Desde asesoría jurídica especializada hasta salones de eventos y representación ante
              organismos públicos.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serviciosGrid.map((servicio) => {
              const Icono = servicio.icono;
              return (
                <div
                  key={servicio.titulo}
                  className="flex flex-col justify-between rounded-2xl border border-henequen-arena bg-white p-6 shadow-tarjeta transition hover:-translate-y-1 hover:shadow-pieza"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-henequen-sisal/40">
                        <Icono size={22} className={servicio.colorIcono} />
                      </div>
                      <span className="rounded-full bg-henequen-sisal/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-henequen-anil">
                        {servicio.badge}
                      </span>
                    </div>

                    <h3 className="mt-4 font-serif text-lg font-bold text-henequen-anil">
                      {servicio.titulo}
                    </h3>

                    <p className="mt-2 text-xs leading-relaxed text-henequen-piedra">
                      {servicio.descripcion}
                    </p>
                  </div>

                  {servicio.action && (
                    <div className="mt-5 border-t border-henequen-arena/50 pt-4">
                      <button
                        type="button"
                        onClick={servicio.action}
                        className="shadow-xs inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-henequen-terra px-3 py-2 text-xs font-semibold text-white transition hover:bg-henequen-terra-dark"
                      >
                        <span>{servicio.btnTexto}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. ALIADOS ESTRATÉGICOS & RESPALDO                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-henequen-arena bg-henequen-anil py-14 text-white sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="text-xs font-bold uppercase tracking-wider text-henequen-sisal">
            Aliados Estratégicos
          </span>
          <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
            Tu empresa merece crecer con respaldo
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-henequen-arena">
            Únete a más de 1,200 empresas afiliadas en Yucatán y accede al Padrón SIEM 2026,
            convenios comerciales, capacitación continua y defensa gremial.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setModalAfiliacionOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-henequen-terra px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-henequen-terra-dark"
            >
              <UserPlus size={15} />
              <span>Únete a más de 1,200 empresas afiliadas</span>
            </button>

            <a
              href="tel:+529999253060"
              className="inline-flex items-center gap-2 rounded-xl border border-henequen-arena/40 px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <Phone size={14} className="text-henequen-sisal" />
              <span>Atención Telefónica (+52 999 925 3060)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. PIE DE PÁGINA INSTITUCIONAL                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-henequen-arena bg-white py-10 text-xs text-henequen-piedra">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <CanacoLogo variant="symbol" className="h-8 w-8 text-henequen-anil" />
              <div>
                <div className="font-serif text-xs font-bold text-henequen-anil">
                  CANACO SERVYTUR MÉRIDA
                </div>
                <div className="text-[10px]">
                  Portal de Servicios al Socio y Comercio de Yucatán
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-henequen-terra" />
                <span>Av. Itzaes No. 273, Col. García Ginerés, Mérida, Yuc.</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone size={12} className="text-henequen-anil" />
                <span>(999) 925 3060</span>
              </span>
              <button
                type="button"
                onClick={() => setModalAdminOpen(true)}
                className="font-semibold text-henequen-anil hover:underline"
              >
                Acceso Directivo
              </button>
            </div>
          </div>

          {/* Banner B2B / Product-Led Growth: Ark Systems */}
          <div className="shadow-xs mt-8 rounded-2xl border border-henequen-arena bg-henequen-cal/90 p-5 sm:p-6">
            <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <span className="font-mono text-xs font-bold text-henequen-anil">
                    Desarrollado con tecnología de Ark Systems
                  </span>
                  <span className="rounded-full border border-henequen-anil/20 bg-henequen-anil/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-henequen-anil">
                    White-Label
                  </span>
                </div>
                <p className="max-w-2xl text-xs text-henequen-piedra">
                  ¿Quieres tener un portal similar para los socios o afiliados de tu cámara, colegio
                  u organización empresarial?
                </p>
              </div>
              <a
                href="mailto:pavel@arksystems.site?subject=Solicitud%20de%20Portal%20para%20Socios%20u%20Organizaci%C3%B3n"
                className="shadow-xs inline-flex shrink-0 items-center gap-2 rounded-xl bg-henequen-anil px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-henequen-anil-deep"
              >
                <Mail size={13} />
                <span>Escríbenos a pavel@arksystems.site</span>
              </a>
            </div>
          </div>

          <div className="mt-6 border-t border-henequen-arena/60 pt-4 text-center text-[10px] text-henequen-piedra/80">
            © {new Date().getFullYear()} CANACO SERVYTUR Mérida. Todos los derechos reservados.
            Desarrollado con tecnología de Ark Systems (Substrate Holdings LLC).
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALES CONECTADOS                                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <VentanillaAfiliacionModal
        isOpen={modalAfiliacionOpen}
        onClose={() => setModalAfiliacionOpen(false)}
        onAfiliacionCompletada={(socio: SocioCanacoRegistro) => {
          setSocioConsultado(socio);
          setModalAfiliacionOpen(false);
        }}
      />

      {socioConsultado && (
        <ConstanciaSocioModal
          isOpen={Boolean(socioConsultado)}
          onClose={() => setSocioConsultado(null)}
          socio={socioConsultado}
        />
      )}

      {/* Buzón Documental Oficial (Oficialía de Partes Digital) */}
      <BuzonDocumentalModal
        isOpen={buzonOpen}
        onClose={() => setBuzonOpen(false)}
        rfcInicial={buzonRfc}
        emailInicial={buzonEmail}
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL DE ACCESO DIRECTIVO (horus.i2d@gmail.com)                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {modalAdminOpen && (
        <div className="backdrop-blur-xs animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 duration-200">
          <div className="w-full max-w-md rounded-2xl border border-henequen-arena bg-white p-6 shadow-pieza sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CanacoLogo variant="symbol" className="h-7 w-7 text-henequen-anil" />
                <span className="font-serif text-sm font-bold text-henequen-anil">
                  Acceso Directivo & Padrón
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalAdminOpen(false)}
                className="rounded-lg p-1 text-henequen-piedra transition hover:bg-henequen-sisal/40 hover:text-henequen-grafito"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-henequen-piedra">
              Ingreso reservado para la Dirección General, Tesorería y Personal Autorizado de la
              Cámara.
            </p>

            {adminError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                <AlertCircle size={14} className="shrink-0 text-red-700" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-henequen-piedra">
                  Correo Electrónico Institucional
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="ej. horus.i2d@gmail.com"
                  className="mt-1 w-full rounded-xl border border-henequen-arena bg-henequen-cal px-3.5 py-2.5 text-xs text-henequen-grafito focus:border-henequen-anil focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-henequen-piedra">
                  Contraseña de Acceso
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 w-full rounded-xl border border-henequen-arena bg-henequen-cal px-3.5 py-2.5 text-xs text-henequen-grafito focus:border-henequen-anil focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="shadow-xs inline-flex w-full items-center justify-center gap-2 rounded-xl bg-henequen-anil py-3 text-xs font-semibold text-white transition hover:bg-henequen-anil-deep disabled:opacity-50"
              >
                <Lock size={13} />
                <span>{adminLoading ? 'Autenticando...' : 'Ingresar al Padrón SIEM'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

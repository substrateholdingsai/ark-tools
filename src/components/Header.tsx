/**
 * Header
 *
 * Header sticky con logo, navegación y controles multi-tenant nativos.
 * Incluye navegación por categorías adaptable a móvil y escritorio.
 */

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  LogOut,
  Plus,
  Check,
  MessageSquare,
  Crown,
  Users,
} from 'lucide-react';
import { SignedIn, SignedOut, useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { TeamModal } from './team/TeamModal';

export interface NavItem {
  id: string;
  label: string;
}

interface HeaderProps {
  /** Herramienta activa (para resaltar en nav) */
  activeTool?: string | null;
  currentToolLabel?: string;
  /** Callback al hacer click en un item de nav */
  onNavigate?: (id: string) => void;
  /** Items de navegación */
  navItems?: NavItem[];
  className?: string;
  onOpenAuthModal?: () => void;
}

const defaultNavItems: NavItem[] = [
  { id: 'todas', label: 'HERRAMIENTAS' },
  { id: 'fiscal', label: 'FISCAL' },
  { id: 'sat', label: 'SAT' },
  { id: 'cobros', label: 'COBROS' },
  { id: 'docs', label: 'DOCS' },
];

export function Header({
  activeTool,
  currentToolLabel,
  onNavigate,
  navItems = defaultNavItems,
  className,
  onOpenAuthModal,
}: HeaderProps) {
  const {
    user,
    tenantName,
    tenants,
    organization,
    switchTenant,
    createTenant,
    signOut,
    platformRole,
  } = useAuth();

  const [orgOpen, setOrgOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [actionError, setActionError] = useState('');
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  const orgRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setOrgOpen(false);
        setIsCreatingTenant(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    setActionError('');
    try {
      await createTenant(newTenantName.trim());
      setNewTenantName('');
      setIsCreatingTenant(false);
      setOrgOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo crear el despacho.');
    }
  };

  const handleSignOut = async () => {
    setActionError('');
    try {
      await signOut();
      setUserMenuOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cerrar la sesión.');
    }
  };

  const userInitials = (user?.fullName || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-line bg-white/80 backdrop-blur-xl',
        className
      )}
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <div className="mx-auto flex h-[64px] max-w-[1280px] items-center justify-between gap-2 px-4 md:h-[68px] md:gap-4 md:px-10">
        {/* Logo + Nombre */}
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 text-left md:gap-4"
          onClick={() => onNavigate?.('dashboard')}
          aria-label="ARK TOOLS: volver al catálogo"
        >
          <Logo size={32} />
          <div className="leading-none">
            <div className="orbitron font-orbitron text-[12px] font-black tracking-[0.14em] text-navy sm:text-[14px] sm:tracking-[0.18em]">
              ARK TOOLS
            </div>
            <div className="mt-[2px] hidden text-[8.5px] font-bold uppercase tracking-[0.22em] text-muted sm:block">
              SUITE FISCAL & FINANCIERA MX
            </div>
          </div>
        </button>

        {/* Nav (desktop) */}
        <nav
          aria-label="Categorías de herramientas"
          className="hidden items-center gap-4 text-[11px] font-semibold tracking-[0.14em] text-muted lg:flex xl:gap-7"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                'rounded-sm transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                activeTool === item.id && 'text-navy'
              )}
              aria-pressed={activeTool === item.id}
            >
              {item.label}
            </button>
          ))}
          <div className="h-4 w-px bg-line" />
          {currentToolLabel ? (
            <>
              <button
                type="button"
                onClick={() => onNavigate?.('back')}
                className="inline-flex items-center gap-1 rounded-sm text-navy hover:text-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ArrowLeft size={13} />
                Catálogo
              </button>
              <span className="max-w-[160px] truncate text-navy" title={currentToolLabel}>
                {currentToolLabel}
              </span>
            </>
          ) : (
            <span className="rounded-full border border-navy/15 bg-navy/5 px-3 py-1 text-[10px] font-bold tracking-wider text-navy">
              TABLAS 2026
            </span>
          )}
        </nav>

        {/* Auth & Multi-tenant (Desktop & Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <a
            href="https://wa.me/525657062511?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20ARK%20TOOLS"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100/70 sm:inline-flex"
            title="Soporte y atención directa por WhatsApp (+52 56 5706 2511)"
          >
            <MessageSquare size={13} className="text-emerald-600" />
            <span>Soporte</span>
          </a>

          <SignedOut>
            <button
              onClick={() => onOpenAuthModal?.()}
              className="rounded-full bg-navy px-4 py-1.5 font-orbitron text-[11px] font-semibold tracking-wider text-white shadow-sm transition hover:bg-navy-dark"
            >
              ACCESO DESPACHOS
            </button>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* D1 Cloud Status */}
              <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span>D1 Nube Activa</span>
              </div>

              {/* Selector Multi-Tenant (Despacho / Empresa) */}
              <div className="relative" ref={orgRef}>
                <button
                  type="button"
                  onClick={() => setOrgOpen(!orgOpen)}
                  className="flex max-w-[110px] items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[11px] font-semibold text-navy transition hover:bg-cream/40 sm:max-w-[200px] sm:gap-2 sm:px-3 sm:text-[12px]"
                  title="Cambiar de despacho o crear nuevo"
                  aria-expanded={orgOpen}
                >
                  <Building2 size={14} className="shrink-0 text-gold-dark" />
                  <span className="truncate">{tenantName || 'Mi Despacho'}</span>
                  <ChevronDown
                    size={13}
                    className={cn('text-muted transition-transform', orgOpen && 'rotate-180')}
                  />
                </button>

                {orgOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-dome">
                    {actionError && (
                      <p
                        role="alert"
                        className="mb-2 rounded-lg bg-rose-50 p-2 text-[11px] text-rose-700"
                      >
                        {actionError}
                      </p>
                    )}
                    <div className="mb-1 border-b border-line/60 px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
                      Espacio de Trabajo / Despacho
                    </div>

                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {(tenants || []).map((t: any) => {
                        const isCurrent = (organization?.id || '') === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              switchTenant(t.id);
                              setOrgOpen(false);
                            }}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] transition',
                              isCurrent
                                ? 'bg-navy/5 font-bold text-navy'
                                : 'text-ink hover:bg-surface-2'
                            )}
                          >
                            <span className="truncate">{t.name}</span>
                            {isCurrent && <Check size={14} className="shrink-0 text-gold-dark" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 space-y-1 border-t border-line/60 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOrgOpen(false);
                          setTeamModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold text-navy transition hover:bg-cream/40"
                      >
                        <Users size={14} className="text-gold-dark" />
                        <span>Equipo y Colaboradores</span>
                      </button>

                      {!isCreatingTenant ? (
                        <button
                          type="button"
                          onClick={() => setIsCreatingTenant(true)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold text-navy transition hover:bg-cream/40"
                        >
                          <Plus size={14} className="text-gold-dark" />
                          <span>Crear Nuevo Despacho</span>
                        </button>
                      ) : (
                        <form onSubmit={handleCreateTenant} className="space-y-2 p-1">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Nombre del despacho..."
                            value={newTenantName}
                            onChange={(e) => setNewTenantName(e.target.value)}
                            className="w-full rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] outline-none focus:border-navy"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="submit"
                              className="flex-1 rounded-md bg-navy px-2 py-1 text-[10px] font-bold text-white transition hover:bg-navy-dark"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCreatingTenant(false)}
                              className="rounded-md border border-line px-2 py-1 text-[10px] text-muted transition hover:bg-surface-2"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Acceso Rápido Super Admin */}
              {platformRole === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('admin')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold tracking-wide shadow-sm transition',
                    activeTool === 'admin'
                      ? 'border-gold bg-gold/20 text-navy'
                      : 'border-gold/40 bg-gradient-to-r from-amber-50 to-white text-navy hover:border-gold hover:bg-amber-100/50'
                  )}
                  title="Consola de Super Administrador"
                >
                  <Crown size={13} className="text-gold" />
                  <span className="hidden font-orbitron text-[10px] font-black tracking-wider sm:inline">
                    ADMIN
                  </span>
                </button>
              )}

              {/* Menú de Usuario */}
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-navy font-orbitron text-[11px] font-bold text-gold shadow-sm transition hover:ring-2 hover:ring-gold/30"
                  title={user?.email || 'Perfil'}
                  aria-label="Abrir menú de usuario"
                  aria-expanded={userMenuOpen}
                >
                  {userInitials}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-line bg-white p-2 shadow-dome">
                    <div className="border-b border-line/60 px-3 py-2">
                      <div className="flex items-center justify-between gap-1">
                        <div className="truncate text-[12px] font-bold text-ink">
                          {user?.fullName || 'Contador'}
                        </div>
                        {platformRole === 'super_admin' && (
                          <span className="py-0.2 rounded bg-gold/20 px-1 text-[9px] font-black text-navy">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[10px] text-muted">{user?.email}</div>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      {platformRole === 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate?.('admin');
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-bold text-navy transition hover:bg-amber-50"
                        >
                          <Crown size={13} className="text-gold" />
                          <span>Consola Super Admin</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setTeamModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-navy transition hover:bg-surface-2"
                      >
                        <Users size={13} className="text-gold-dark" />
                        <span>Equipo del Despacho</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <LogOut size={13} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                    {actionError && (
                      <p role="alert" className="px-3 pt-2 text-[11px] text-rose-700">
                        {actionError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </SignedIn>
        </div>
      </div>
      <nav
        aria-label="Categorías de herramientas"
        className="flex items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-line/70 px-4 py-2.5 lg:hidden"
      >
        {currentToolLabel && (
          <button
            type="button"
            onClick={() => onNavigate?.('back')}
            className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1.5 text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <ArrowLeft size={13} />
            Catálogo
          </button>
        )}
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate?.(item.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
              activeTool === item.id
                ? 'border-navy bg-navy/5 text-navy'
                : 'border-line bg-white text-muted'
            )}
            aria-pressed={activeTool === item.id}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Modal de Equipo y Colaboradores */}
      <TeamModal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} />
    </header>
  );
}

export default Header;

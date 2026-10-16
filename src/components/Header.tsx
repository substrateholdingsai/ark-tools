/**
 * Header
 *
 * Header sticky con logo, navegación y controles multi-tenant nativos.
 * Se adapta a mobile (sin nav) y desktop (con nav completa).
 */

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, LogOut, Plus, Check, MessageSquare } from 'lucide-react';
import { SignedIn, SignedOut, useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';

export interface NavItem {
  id: string;
  label: string;
}

interface HeaderProps {
  /** Herramienta activa (para resaltar en nav) */
  activeTool?: string | null;
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
  onNavigate,
  navItems = defaultNavItems,
  className,
  onOpenAuthModal,
}: HeaderProps) {
  const { user, tenantName, tenants, activeTenant, switchTenant, createTenant, signOut } =
    useAuth() as any;

  const [orgOpen, setOrgOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');

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
    await createTenant(newTenantName.trim());
    setNewTenantName('');
    setIsCreatingTenant(false);
    setOrgOpen(false);
  };

  const userInitials = (user?.fullName || user?.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-line',
        className
      )}
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 h-[68px] flex items-center justify-between gap-4">
        {/* Logo + Nombre */}
        <div
          className="flex items-center gap-4 shrink-0 cursor-pointer"
          onClick={() => onNavigate?.('dashboard')}
        >
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

        {/* Nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-8 text-[11px] tracking-[0.14em] font-semibold text-muted">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                'transition hover:text-navy',
                activeTool === item.id && 'text-navy'
              )}
            >
              {item.label}
            </button>
          ))}
          <div className="h-4 w-px bg-line" />
          <span className="px-3 py-1 rounded-full bg-navy/5 border border-navy/15 text-navy text-[10px] font-bold tracking-wider">
            TABLAS 2026
          </span>
        </nav>

        {/* Auth & Multi-tenant (Desktop & Mobile) */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://wa.me/525657062511?text=Hola,%20solicito%20atenci%C3%B3n%20sobre%20ARK%20TOOLS"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100/70 transition"
            title="Soporte y atención directa por WhatsApp (+52 56 5706 2511)"
          >
            <MessageSquare size={13} className="text-emerald-600" />
            <span>Soporte</span>
          </a>

          <SignedOut>
            <button
              onClick={() => onOpenAuthModal?.()}
              className="px-4 py-1.5 rounded-full bg-navy text-white text-[11px] font-semibold tracking-wider hover:bg-navy-dark transition shadow-sm font-orbitron"
            >
              ACCESO DESPACHOS
            </button>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-3">
              {/* D1 Cloud Status */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>D1 Nube Activa</span>
              </div>

              {/* Selector Multi-Tenant (Despacho / Empresa) */}
              <div className="relative" ref={orgRef}>
                <button
                  type="button"
                  onClick={() => setOrgOpen(!orgOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-line bg-surface-2 text-[12px] font-semibold text-navy hover:bg-cream/40 transition max-w-[200px]"
                  title="Cambiar de despacho o crear nuevo"
                >
                  <Building2 size={14} className="text-gold-dark shrink-0" />
                  <span className="truncate">{tenantName || 'Mi Despacho'}</span>
                  <ChevronDown
                    size={13}
                    className={cn('text-muted transition-transform', orgOpen && 'rotate-180')}
                  />
                </button>

                {orgOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-white shadow-dome p-2 z-50">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-muted uppercase tracking-wider font-orbitron border-b border-line/60 mb-1">
                      Espacio de Trabajo / Despacho
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {(tenants || []).map((t: any) => {
                        const isCurrent = (activeTenant?.id || '') === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              switchTenant(t.id);
                              setOrgOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[12px] transition',
                              isCurrent
                                ? 'bg-navy/5 text-navy font-bold'
                                : 'text-ink hover:bg-surface-2'
                            )}
                          >
                            <span className="truncate">{t.name}</span>
                            {isCurrent && <Check size={14} className="text-gold-dark shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 pt-2 border-t border-line/60">
                      {!isCreatingTenant ? (
                        <button
                          type="button"
                          onClick={() => setIsCreatingTenant(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-navy hover:bg-cream/40 rounded-lg transition"
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
                            className="w-full px-2.5 py-1.5 text-[11px] border border-line rounded-md bg-surface-2 outline-none focus:border-navy"
                          />
                          <div className="flex gap-1.5">
                            <button
                              type="submit"
                              className="flex-1 py-1 px-2 bg-navy text-white text-[10px] font-bold rounded-md hover:bg-navy-dark transition"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCreatingTenant(false)}
                              className="py-1 px-2 border border-line text-[10px] text-muted rounded-md hover:bg-surface-2 transition"
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

              {/* Menú de Usuario */}
              <div className="relative" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-8 h-8 rounded-full border border-line bg-navy text-gold font-orbitron font-bold text-[11px] flex items-center justify-center hover:ring-2 hover:ring-gold/30 transition shadow-sm"
                  title={user?.email || 'Perfil'}
                >
                  {userInitials}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-white shadow-dome p-2 z-50">
                    <div className="px-3 py-2 border-b border-line/60">
                      <div className="font-bold text-[12px] text-ink truncate">
                        {user?.fullName || 'Contador'}
                      </div>
                      <div className="text-[10px] text-muted truncate">
                        {user?.email}
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut size={13} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );
}

export default Header;

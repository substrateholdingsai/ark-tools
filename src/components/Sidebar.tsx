import { useState } from 'react';
import { ChevronDown, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { currentBrand } from '@/config/brand';
import { TeamModal } from './team/TeamModal';

export interface SidebarNavItem {
  id: string;
  label: string;
}

interface SidebarProps {
  navItems: SidebarNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ navItems, activeId, onNavigate, open, onClose }: SidebarProps) {
  const { user, tenantName, tenants, organization, switchTenant, platformRole } = useAuth();
  const [orgOpen, setOrgOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const canManageDelegaciones =
    import.meta.env.VITE_CANACO_DELEGACIONES === 'true' &&
    currentBrand.id === 'canaco_merida' &&
    tenants.some((t: any) => t.id === 'canaco_merida' && t.role !== 'member');

  const userInitials = (user?.fullName || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`z-45 border-line-ink fixed inset-y-0 left-0 flex w-[252px] flex-col overflow-hidden border-r bg-gradient-to-b from-ink-2 via-ink to-ink transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'linear-gradient(178deg,#1B2330 0%,#161D28 42%,#12171F 100%)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(420px 260px at 110% -8%,rgba(176,141,63,.13),transparent 62%), radial-gradient(360px 300px at -20% 108%,rgba(43,84,120,.20),transparent 64%)',
          }}
        />
        <div className="relative flex h-full flex-col">
          {/* Brand */}
          <div className="border-line-ink flex items-center gap-2.5 border-b px-4 py-3.5">
            <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[5px] border border-brass-2/40 bg-brass-2/10">
              <svg
                className="h-4 w-4 text-brass-2"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 2.5h6.5L15 6v11.5H5z" />
                <path d="M11.5 2.5V6H15" />
                <path d="M7.5 10h5M7.5 13h3.5" />
              </svg>
            </span>
            <div>
              <div className="text-[13.5px] font-semibold tracking-[0.005em] text-[#F2F0EB]">
                {currentBrand.brandName}
              </div>
              <div className="mt-0.5 font-mono text-[9px] font-medium tracking-[0.16em] text-[#7E8794]">
                SUITE FISCAL MX
              </div>
            </div>
          </div>

          {/* Workspace switcher */}
          <button
            type="button"
            onClick={() => setOrgOpen((v) => !v)}
            className="border-line-ink bg-white/3 hover:bg-white/6 mx-3 mt-3 flex items-center gap-2.5 rounded-[5px] border px-2.5 py-2 text-left transition"
          >
            <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[3px] bg-[#2E3947] font-mono text-[11px] font-semibold text-[#D9C48C]">
              {(tenantName || 'AR').slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-[#E7E4DE]">
                {tenantName || 'Mi Despacho'}
              </span>
              <span className="block truncate font-mono text-[10px] tracking-[0.04em] text-[#7E8794]">
                {organization?.id || 'ARK'}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#6B7481]" />
          </button>
          {orgOpen && (
            <div className="border-line-ink mx-3 mt-1 max-h-48 space-y-1 overflow-y-auto rounded-[5px] border bg-ink-2 p-1.5">
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
                    className={`flex w-full items-center justify-between rounded-[5px] px-2.5 py-1.5 text-left text-[12px] transition ${
                      isCurrent
                        ? 'bg-brass-2/13 font-semibold text-[#F0E4C6]'
                        : 'text-[#AEB6C0] hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    {isCurrent && <span className="font-mono text-[10px] text-brass-2">●</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-2.5" aria-label="Módulos">
            <div className="mb-1.5 px-2 pt-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#6B7481]">
              Navegación
            </div>
            {navItems.map((item) => {
              const on = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`relative flex w-full items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-left text-[12.5px] font-medium transition ${
                    on
                      ? 'bg-brass-2/13 text-[#F0E4C6]'
                      : 'text-[#AEB6C0] hover:bg-white/5 hover:text-[#E7E4DE]'
                  }`}
                >
                  {on && (
                    <span className="absolute -left-2.5 bottom-1.5 top-1.5 w-[2px] rounded-r-[2px] bg-brass-2" />
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              );
            })}

            {(platformRole === 'super_admin' || canManageDelegaciones) && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('admin');
                  onClose();
                }}
                className={`relative mt-2 flex w-full items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-left text-[12.5px] font-medium transition ${
                  activeId === 'admin'
                    ? 'bg-brass-2/13 text-[#F0E4C6]'
                    : 'text-[#AEB6C0] hover:bg-white/5 hover:text-[#E7E4DE]'
                }`}
              >
                {activeId === 'admin' && (
                  <span className="absolute -left-2.5 bottom-1.5 top-1.5 w-[2px] rounded-r-[2px] bg-brass-2" />
                )}
                <Crown className="h-3.5 w-3.5 text-brass-2" />
                <span className="flex-1 truncate">ADMIN</span>
              </button>
            )}
          </nav>

          {/* Side foot */}
          <div className="border-line-ink flex items-center gap-2.5 border-t px-3 py-3">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-line bg-ink-2 font-mono text-[11px] font-bold text-brass-2">
              {userInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-[#C8CDD5]">
                {user?.fullName || 'Contador'}
              </span>
              <span className="block truncate text-[10px] text-[#7E8794]">Contador titular</span>
            </span>
            <span className="border-brass-2/32 rounded-[3px] border bg-brass-2/10 px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-[0.1em] text-[#C7B27E]">
              PRO
            </span>
          </div>
        </div>

        {teamModalOpen && (
          <TeamModal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} />
        )}
      </aside>
    </>
  );
}

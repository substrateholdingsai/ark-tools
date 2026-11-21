import { Bell, HelpCircle, Menu, Search } from 'lucide-react';
import { currentBrand } from '@/config/brand';

interface TopbarProps {
  onOpenSidebar: () => void;
  currentToolLabel?: string;
}

export function Topbar({ onOpenSidebar, currentToolLabel }: TopbarProps) {
  return (
    <header className="px-4.5 md:px-4.5 flex h-[52px] flex-none items-center gap-3.5 border-b border-line bg-surface">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-transparent text-slate transition hover:border-line hover:bg-paper-2 hover:text-ink md:hidden"
        aria-label="Abrir navegación"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11.5px] tracking-[0.02em] text-muted">
        <span className="hidden sm:inline">{currentBrand.brandName}</span>
        <span className="hidden text-faint sm:inline">/</span>
        <span className="hidden sm:inline">Despacho</span>
        <span className="hidden text-faint sm:inline">/</span>
        <b className="truncate font-semibold text-ink">{currentToolLabel || 'Panel'}</b>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        className="hidden min-w-[236px] items-center gap-2 rounded-[5px] border border-line-2 bg-surface-2 px-2.5 py-1.5 text-left text-[12px] text-muted transition hover:border-[#B9B3A6] hover:bg-surface sm:flex"
      >
        <Search className="h-3.5 w-3.5 text-faint" />
        <span className="flex-1">Buscar herramienta o folio…</span>
        <kbd className="rounded-[3px] border border-b-2 border-line-2 bg-surface px-1 py-0.5 font-mono text-[10px] font-medium text-slate">
          ⌘K
        </kbd>
      </button>

      <span className="hidden items-center gap-1.5 rounded-[3px] border border-[#CBE0D3] bg-ok-wash px-2 py-1 font-mono text-[10px] font-medium tracking-[0.09em] text-ok sm:inline-flex">
        <span className="h-1.25 w-1.25 rounded-full bg-ok" />
        PRODUCCIÓN
      </span>

      <button
        type="button"
        className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-transparent text-slate transition hover:border-line hover:bg-paper-2 hover:text-ink"
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-transparent text-slate transition hover:border-line hover:bg-paper-2 hover:text-ink"
        aria-label="Ayuda"
      >
        <HelpCircle className="h-[18px] w-[18px]" />
      </button>
    </header>
  );
}

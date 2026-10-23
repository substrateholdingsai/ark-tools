/**
 * ARK TOOLS — Selector de Expediente y Catálogo Unificado (Sprint 9)
 *
 * Barra persistente de cliente/trabajador activo:
 * - Selección rápida con búsqueda predictiva.
 * - Registro inmediato de nuevos clientes/trabajadores (+ modal).
 * - Historial auditable con estampas SHA-256 y versión oficial DOF.
 * - Aislamiento multi-tenant garantizado.
 */

import { useState, useMemo } from 'react';
import {
  FolderKanban,
  Building2,
  User,
  Briefcase,
  Plus,
  Search,
  X,
  History,
  Check,
  ChevronDown,
  ShieldCheck,
  Calendar,
  Copy,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useExpediente, type CreateClientInput } from '@/context/ExpedienteContext';
import { useOptionalAuth } from '@/context/AuthContext';
import type { ClientRecord, ExpedienteRecord, TipoCliente } from '@/lib/apiClient';
import { GlassButton } from './ui/GlassButton';
import { PapelDeTrabajoModal } from './PapelDeTrabajoModal';

export function ExpedienteSelector() {
  const {
    activeClient,
    clients,
    expedientes,
    isLoadingClients,
    isLoadingExpedientes,
    setActiveClient,
    createClient,
    loadDemoData,
    clearDemoData,
  } = useExpediente();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');

  // Filtrado de clientes para el modal de búsqueda
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        !searchTerm.trim() ||
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.rfc && c.rfc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.curp && c.curp.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.nss && c.nss.includes(searchTerm));

      const matchTipo = filterTipo === 'todos' || c.tipo === filterTipo;

      return matchSearch && matchTipo;
    });
  }, [clients, searchTerm, filterTipo]);

  return (
    <>
      {/* ═══ BARRA SUPERIOR PERSISTENTE ═══ */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-2.5 font-inter text-xs md:px-10">
          {/* Lado izquierdo: Cliente activo o prompt */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1.5 font-orbitron text-[11px] font-bold uppercase tracking-wider text-navy">
              <FolderKanban size={15} className="text-gold" />
              <span className="hidden sm:inline">Expediente:</span>
            </div>

            {activeClient ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex max-w-[260px] items-center gap-1.5 truncate rounded-full border border-navy/15 bg-navy/5 px-2.5 py-1 text-[12px] font-semibold text-ink sm:max-w-[340px]">
                  {activeClient.tipo === 'empresa' ? (
                    <Building2 size={13} className="shrink-0 text-navy" />
                  ) : activeClient.tipo === 'persona_fisica' ? (
                    <Briefcase size={13} className="shrink-0 text-navy" />
                  ) : (
                    <User size={13} className="shrink-0 text-navy" />
                  )}
                  <span className="truncate">{activeClient.nombre}</span>
                </span>

                {activeClient.rfc && (
                  <span className="hidden rounded border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted md:inline-flex">
                    {activeClient.rfc}
                  </span>
                )}

                {activeClient.salario_diario > 0 && (
                  <span className="hidden rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-800 lg:inline-flex">
                    SD: $
                    {activeClient.salario_diario.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )}

                {activeClient.salario_diario_integrado > 0 && (
                  <span className="hidden rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-medium text-blue-800 xl:inline-flex">
                    SDI: $
                    {activeClient.salario_diario_integrado.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )}

                {Boolean(activeClient.metadata?.is_demo) && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase tracking-wider text-amber-800">
                    <Sparkles size={9} className="text-amber-600" />
                    <span>Demo</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="ml-1 cursor-pointer text-[11px] font-semibold text-navy hover:underline"
                >
                  Cambiar
                </button>

                {Boolean(activeClient.metadata?.is_demo) && (
                  <button
                    type="button"
                    onClick={clearDemoData}
                    title="Salir de la demostración y limpiar datos de prueba"
                    className="cursor-pointer rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted hover:border-red-300 hover:text-red-600"
                  >
                    Salir de Demo
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveClient(null)}
                  title="Quitar cliente activo y regresar a modo libre"
                  className="cursor-pointer rounded-full p-1 text-muted transition-colors hover:bg-black/5 hover:text-ink"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <span className="hidden sm:inline">Modo cálculo libre.</span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1 text-[11px] font-medium text-ink transition-colors hover:border-gold/40"
                >
                  <Search size={12} className="text-gold" />
                  <span>Seleccionar Cliente / Trabajador</span>
                  <ChevronDown size={12} className="text-muted" />
                </button>
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-navy transition-colors hover:bg-gold/20"
                >
                  <Sparkles size={11} className="text-gold" />
                  <span>Cargar Caso Demo</span>
                </button>
              </div>
            )}
          </div>

          {/* Lado derecho: Acciones rápidas (Historial + Nuevo Cliente) */}
          <div className="flex shrink-0 items-center gap-2">
            {activeClient && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink transition-colors hover:border-navy/30"
              >
                <History size={13} className="text-navy" />
                <span>Historial</span>
                <span className="py-0.2 rounded-full bg-navy/10 px-1.5 text-[10px] font-bold text-navy">
                  {expedientes.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="shadow-2xs inline-flex cursor-pointer items-center gap-1 rounded-lg bg-navy px-3 py-1 text-[11px] font-semibold text-white transition-all hover:bg-navy/90"
            >
              <Plus size={13} />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MODAL 1: BÚSQUEDA Y SELECCIÓN DE CLIENTE ═══ */}
      {isSearchOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-lg flex-col space-y-4 rounded-2xl border border-line bg-white p-6 shadow-2xl duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-playfair text-xl font-black text-ink">
                  Catálogo de Clientes y Expedientes
                </h3>
                <p className="mt-0.5 font-inter text-xs text-muted">
                  Selecciona una entidad para activar auto-llenado y sellado de auditoría.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-muted hover:bg-black/5 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input de búsqueda */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, RFC, NSS o CURP..."
                className="focus:outline-hidden w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-9 pr-4 font-inter text-sm text-ink focus:border-navy"
              />
            </div>

            {/* Filtros por tipo */}
            <div className="flex items-center gap-1.5 text-xs">
              {(['todos', 'trabajador', 'empresa', 'persona_fisica'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFilterTipo(tipo)}
                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    filterTipo === tipo
                      ? 'border-navy bg-navy text-white'
                      : 'border-line bg-surface text-muted hover:text-ink'
                  }`}
                >
                  {tipo === 'todos'
                    ? 'Todos'
                    : tipo === 'trabajador'
                      ? 'Trabajadores'
                      : tipo === 'empresa'
                        ? 'Empresas'
                        : 'P. Físicas'}
                </button>
              ))}
            </div>

            {/* Lista de resultados */}
            <div className="max-h-[340px] min-h-[220px] flex-1 space-y-1.5 divide-y divide-line/40 overflow-y-auto pr-1">
              {isLoadingClients ? (
                <div className="py-12 text-center text-xs text-muted">Cargando catálogo...</div>
              ) : filteredClients.length === 0 ? (
                <div className="space-y-3 py-10 text-center">
                  <p className="text-xs text-muted">No se encontraron clientes coincidentes.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsCreateOpen(true);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
                  >
                    <Plus size={14} />
                    <span>Registrar &ldquo;{searchTerm || 'nuevo'}&rdquo; ahora</span>
                  </button>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = activeClient?.id === client.id;
                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setActiveClient(client);
                        setIsSearchOpen(false);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3 transition-all ${
                        isSelected
                          ? 'border border-navy/20 bg-navy/5'
                          : 'border border-transparent hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-navy">
                          {client.tipo === 'empresa' ? (
                            <Building2 size={16} />
                          ) : client.tipo === 'persona_fisica' ? (
                            <Briefcase size={16} />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                            <span>{client.nombre}</span>
                            <span className="py-0.2 rounded bg-surface-2 px-1.5 text-[10px] font-normal uppercase text-muted">
                              {client.tipo}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted">
                            {client.rfc && <span>RFC: {client.rfc}</span>}
                            {client.salario_diario > 0 && (
                              <span>• SD: ${client.salario_diario.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveClient(null);
                  setIsSearchOpen(false);
                }}
                className="cursor-pointer text-xs text-muted hover:text-ink"
              >
                Limpiar selección (Modo libre)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsCreateOpen(true);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
              >
                <Plus size={14} />
                <span>Crear Nuevo Cliente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: CREACIÓN DE CLIENTE / TRABAJADOR ═══ */}
      {isCreateOpen && (
        <CreateClientModal
          isOpen={isCreateOpen}
          initialName={searchTerm}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (data) => {
            await createClient(data);
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* ═══ MODAL 3: HISTORIAL DEL EXPEDIENTE ═══ */}
      {isHistoryOpen && activeClient && (
        <ExpedienteHistoryModal
          isOpen={isHistoryOpen}
          client={activeClient}
          expedientes={expedientes}
          isLoading={isLoadingExpedientes}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: MODAL CREAR CLIENTE
// ─────────────────────────────────────────────────────────────────
interface CreateClientModalProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onCreate: (data: CreateClientInput) => Promise<void>;
}

function CreateClientModal({ initialName, onClose, onCreate }: CreateClientModalProps) {
  const [tipo, setTipo] = useState<TipoCliente>('trabajador');
  const [nombre, setNombre] = useState(initialName || '');
  const [rfc, setRfc] = useState('');
  const [curp, setCurp] = useState('');
  const [nss, setNss] = useState('');
  const [salarioDiario, setSalarioDiario] = useState<number | ''>('');
  const [sdi, setSdi] = useState<number | ''>('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [autoSdi, setAutoSdi] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto cálculo de SDI sugerido cuando se escribe el salario diario
  const handleSalarioDiarioChange = (val: number | '') => {
    setSalarioDiario(val);
    if (autoSdi && typeof val === 'number' && val > 0) {
      setSdi(Math.round(val * 1.049315 * 100) / 100);
    } else if (val === '') {
      if (autoSdi) setSdi('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre o razón social es obligatorio');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onCreate({
        tipo,
        nombre: nombre.trim(),
        rfc: rfc.trim() ? rfc.trim().toUpperCase() : null,
        curp: curp.trim() ? curp.trim().toUpperCase() : null,
        nss: nss.trim() || null,
        salario_diario: typeof salarioDiario === 'number' ? salarioDiario : 0,
        salario_diario_integrado: typeof sdi === 'number' ? sdi : 0,
        fecha_ingreso: fechaIngreso || null,
        factor_integracion:
          typeof salarioDiario === 'number' && typeof sdi === 'number' && salarioDiario > 0
            ? Math.round((sdi / salarioDiario) * 1000000) / 1000000
            : 1.049315,
      });
    } catch (err) {
      setError(String(err));
      setIsSaving(false);
    }
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-in fade-in zoom-in-95 max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-2xl duration-150">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-playfair text-xl font-black text-ink">Registrar Nuevo Cliente</h3>
            <p className="mt-0.5 font-inter text-xs text-muted">
              Crea un expediente para reutilizar sus datos en todas las calculadoras.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-muted hover:bg-black/5 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 font-inter text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-inter text-xs">
          {/* Selector de Tipo */}
          <div>
            <label className="mb-1.5 block font-medium text-muted">Tipo de Entidad</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'trabajador', label: 'Trabajador', icon: User },
                { id: 'empresa', label: 'Empresa', icon: Building2 },
                { id: 'persona_fisica', label: 'P. Física', icon: Briefcase },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = tipo === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipo(item.id as TipoCliente)}
                    className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? 'border-navy bg-navy/5 font-semibold text-navy'
                        : 'border-line bg-surface text-muted hover:text-ink'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nombre / Razón Social */}
          <div>
            <label className="mb-1 block font-semibold text-ink">
              Nombre o Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={
                tipo === 'empresa' ? 'Ej. Soluciones Fiscales SA de CV' : 'Ej. Lic. Roberto Gómez'
              }
              className="focus:outline-hidden w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-navy"
            />
          </div>

          {/* RFC y CURP */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-muted">RFC</label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="XAXX010101000"
                maxLength={13}
                className="focus:outline-hidden w-full rounded-xl border border-line bg-surface px-3 py-2 font-mono uppercase text-ink focus:border-navy"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-muted">
                {tipo === 'empresa' ? 'Registro Patronal' : 'CURP'}
              </label>
              <input
                type="text"
                value={curp}
                onChange={(e) => setCurp(e.target.value.toUpperCase())}
                placeholder={tipo === 'empresa' ? 'Ej. Y123456710' : 'Ej. GOMR900101HDF...'}
                maxLength={18}
                className="focus:outline-hidden w-full rounded-xl border border-line bg-surface px-3 py-2 font-mono uppercase text-ink focus:border-navy"
              />
            </div>
          </div>

          {/* NSS y Fecha de Ingreso (para trabajadores) */}
          {tipo === 'trabajador' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-muted">NSS (11 dígitos)</label>
                <input
                  type="text"
                  value={nss}
                  onChange={(e) => setNss(e.target.value)}
                  placeholder="12345678901"
                  maxLength={11}
                  className="focus:outline-hidden w-full rounded-xl border border-line bg-surface px-3 py-2 font-mono text-ink focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-muted">Fecha de Ingreso</label>
                <input
                  type="date"
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-navy"
                />
              </div>
            </div>
          )}

          {/* Salario Diario y SDI */}
          <div className="space-y-2 rounded-xl border border-line bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Bases Salariales (Opcional)</span>
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={autoSdi}
                  onChange={(e) => setAutoSdi(e.target.checked)}
                  className="rounded border-line"
                />
                <span>Auto SDI sugerido (×1.0493)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-muted">Salario Diario (MXN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salarioDiario}
                    onChange={(e) =>
                      handleSalarioDiarioChange(e.target.value ? parseFloat(e.target.value) : '')
                    }
                    placeholder="0.00"
                    className="focus:outline-hidden w-full rounded-lg border border-line bg-surface py-1.5 pl-7 pr-3 font-mono text-ink focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-muted">SDI Integrado (MXN)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sdi}
                    onChange={(e) => {
                      setAutoSdi(false);
                      setSdi(e.target.value ? parseFloat(e.target.value) : '');
                    }}
                    placeholder="0.00"
                    className="focus:outline-hidden w-full rounded-lg border border-line bg-surface py-1.5 pl-7 pr-3 font-mono text-ink focus:border-navy"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="cursor-pointer rounded-xl border border-line px-4 py-2 text-muted hover:text-ink"
            >
              Cancelar
            </button>
            <GlassButton type="submit" variant="primary" size="sm" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Crear y Activar Expediente'}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTE: MODAL HISTORIAL DE EXPEDIENTE
// ─────────────────────────────────────────────────────────────────
interface ExpedienteHistoryModalProps {
  isOpen: boolean;
  client: ClientRecord;
  expedientes: ExpedienteRecord[];
  isLoading: boolean;
  onClose: () => void;
}

function ExpedienteHistoryModal({
  client,
  expedientes,
  isLoading,
  onClose,
}: ExpedienteHistoryModalProps) {
  const auth = useOptionalAuth();
  const tenantName = auth?.tenantName || 'Despacho Contable Especializado';
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedExpediente, setSelectedExpediente] = useState<ExpedienteRecord | null>(null);

  const copyHash = (hash: string) => {
    void navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-2xl flex-col space-y-4 rounded-2xl border border-line bg-white p-6 shadow-2xl duration-150">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy/15 bg-navy/5 text-navy">
              <FolderKanban size={20} className="text-gold" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-black text-ink">
                Expediente: {client.nombre}
              </h3>
              <p className="font-inter text-xs text-muted">
                Historial sellado con SHA-256 y versión oficial DOF ({expedientes.length} cálculos)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-muted hover:bg-black/5 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de expedientes */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted">
              Cargando historial auditable...
            </div>
          ) : expedientes.length === 0 ? (
            <div className="space-y-2 py-12 text-center">
              <ShieldCheck size={28} className="mx-auto text-muted/40" />
              <p className="text-sm font-semibold text-ink">Aún no hay cálculos guardados</p>
              <p className="mx-auto max-w-sm text-xs text-muted">
                Cualquier cálculo que realices en Finiquitos, SBC, Nómina o ISN con este cliente
                activo se archivará automáticamente aquí con sello inmutable.
              </p>
            </div>
          ) : (
            expedientes.map((exp) => {
              const isExpanded = expandedId === exp.id;
              const dateStr = new Date(exp.created_at).toLocaleString('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={exp.id}
                  className="space-y-3 rounded-xl border border-line bg-surface p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">
                          {exp.titulo || exp.tool_id.toUpperCase()}
                        </span>
                        <span className="rounded-full bg-navy/5 px-2 py-0.5 font-orbitron text-[10px] font-bold uppercase text-navy">
                          {exp.tool_id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 font-inter text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] font-semibold text-navy">
                          {exp.catalog_version}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExpediente(exp)}
                        className="shadow-2xs inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-navy px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-navy/90"
                      >
                        <FileText size={12} className="text-gold" />
                        <span>Papel de Trabajo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                        className="cursor-pointer text-xs font-semibold text-navy hover:underline"
                      >
                        {isExpanded ? 'Ocultar Detalle' : 'Ver Detalle'}
                      </button>
                    </div>
                  </div>

                  {/* Hash SHA-256 */}
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-line/60 bg-surface-2 p-2 font-mono text-[11px]">
                    <div className="truncate text-muted">
                      <span className="font-semibold text-ink">SHA-256: </span>
                      {exp.input_hash}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyHash(exp.input_hash)}
                      title="Copiar hash SHA-256"
                      className="shrink-0 cursor-pointer rounded p-1 text-muted hover:bg-black/5 hover:text-ink"
                    >
                      {copiedHash === exp.input_hash ? (
                        <Check size={12} className="text-emerald-600" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>

                  {/* Detalle expandible de Inputs / Outputs */}
                  {isExpanded && (
                    <div className="animate-in fade-in space-y-3 border-t border-line pt-2 text-xs duration-150">
                      <div>
                        <span className="mb-1 block font-semibold text-ink">
                          Valores de Entrada:
                        </span>
                        <pre className="max-h-36 overflow-x-auto rounded-lg border border-line bg-white p-2.5 font-mono text-[11px] text-muted">
                          {JSON.stringify(exp.inputs, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <span className="mb-1 block font-semibold text-ink">
                          Resultados Emitidos:
                        </span>
                        <pre className="max-h-36 overflow-x-auto rounded-lg border border-line bg-white p-2.5 font-mono text-[11px] text-emerald-900">
                          {JSON.stringify(exp.outputs, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-line pt-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-line bg-surface-2 px-4 py-2 text-xs font-semibold text-ink hover:bg-black/5"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>

      {selectedExpediente && (
        <PapelDeTrabajoModal
          isOpen={Boolean(selectedExpediente)}
          onClose={() => setSelectedExpediente(null)}
          despachoName={tenantName || 'Despacho Contable Especializado'}
          client={client}
          expediente={selectedExpediente}
        />
      )}
    </div>
  );
}

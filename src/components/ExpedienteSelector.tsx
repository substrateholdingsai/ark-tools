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

      const matchTipo =
        filterTipo === 'todos' || c.tipo === filterTipo;

      return matchSearch && matchTipo;
    });
  }, [clients, searchTerm, filterTipo]);

  return (
    <>
      {/* ═══ BARRA SUPERIOR PERSISTENTE ═══ */}
      <div className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-inter">
          {/* Lado izquierdo: Cliente activo o prompt */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5 text-navy font-orbitron font-bold uppercase tracking-wider text-[11px] shrink-0">
              <FolderKanban size={15} className="text-gold" />
              <span className="hidden sm:inline">Expediente:</span>
            </div>

            {activeClient ? (
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy/5 border border-navy/15 text-ink font-semibold text-[12px] truncate max-w-[260px] sm:max-w-[340px]">
                  {activeClient.tipo === 'empresa' ? (
                    <Building2 size={13} className="text-navy shrink-0" />
                  ) : activeClient.tipo === 'persona_fisica' ? (
                    <Briefcase size={13} className="text-navy shrink-0" />
                  ) : (
                    <User size={13} className="text-navy shrink-0" />
                  )}
                  <span className="truncate">{activeClient.nombre}</span>
                </span>

                {activeClient.rfc && (
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded bg-surface-2 border border-line text-[10px] font-mono text-muted">
                    {activeClient.rfc}
                  </span>
                )}

                {activeClient.salario_diario > 0 && (
                  <span className="hidden lg:inline-flex px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800 font-medium">
                    SD: ${activeClient.salario_diario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                )}

                {activeClient.salario_diario_integrado > 0 && (
                  <span className="hidden xl:inline-flex px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-mono text-blue-800 font-medium">
                    SDI: ${activeClient.salario_diario_integrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-[11px] text-navy font-semibold hover:underline cursor-pointer ml-1"
                >
                  Cambiar
                </button>

                <button
                  type="button"
                  onClick={() => setActiveClient(null)}
                  title="Quitar cliente activo y regresar a modo libre"
                  className="p-1 rounded-full hover:bg-black/5 text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted text-[12px]">
                <span className="hidden sm:inline">Modo cálculo libre.</span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-2 border border-line hover:border-gold/40 text-ink font-medium text-[11px] transition-colors cursor-pointer shadow-2xs"
                >
                  <Search size={12} className="text-gold" />
                  <span>Seleccionar Cliente / Trabajador</span>
                  <ChevronDown size={12} className="text-muted" />
                </button>
              </div>
            )}
          </div>

          {/* Lado derecho: Acciones rápidas (Historial + Nuevo Cliente) */}
          <div className="flex items-center gap-2 shrink-0">
            {activeClient && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-line hover:border-navy/30 text-ink text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
              >
                <History size={13} className="text-navy" />
                <span>Historial</span>
                <span className="px-1.5 py-0.2 rounded-full bg-navy/10 text-navy font-bold text-[10px]">
                  {expedientes.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-navy text-white hover:bg-navy/90 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Plus size={13} />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MODAL 1: BÚSQUEDA Y SELECCIÓN DE CLIENTE ═══ */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-line p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-playfair text-xl font-black text-ink">
                  Catálogo de Clientes y Expedientes
                </h3>
                <p className="text-xs text-muted font-inter mt-0.5">
                  Selecciona una entidad para activar auto-llenado y sellado de auditoría.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5 text-muted hover:text-ink cursor-pointer"
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-sm font-inter focus:outline-hidden focus:border-navy"
              />
            </div>

            {/* Filtros por tipo */}
            <div className="flex items-center gap-1.5 text-xs">
              {(['todos', 'trabajador', 'empresa', 'persona_fisica'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFilterTipo(tipo)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                    filterTipo === tipo
                      ? 'bg-navy text-white border-navy'
                      : 'bg-surface border-line text-muted hover:text-ink'
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
            <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[340px] space-y-1.5 pr-1 divide-y divide-line/40">
              {isLoadingClients ? (
                <div className="py-12 text-center text-xs text-muted">Cargando catálogo...</div>
              ) : filteredClients.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-xs text-muted">No se encontraron clientes coincidentes.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsCreateOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-navy font-semibold hover:underline cursor-pointer"
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
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-navy/5 border border-navy/20'
                          : 'hover:bg-surface-2 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-navy shrink-0 mt-0.5">
                          {client.tipo === 'empresa' ? (
                            <Building2 size={16} />
                          ) : client.tipo === 'persona_fisica' ? (
                            <Briefcase size={16} />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink text-sm truncate flex items-center gap-2">
                            <span>{client.nombre}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 text-muted font-normal uppercase">
                              {client.tipo}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted font-mono mt-0.5">
                            {client.rfc && <span>RFC: {client.rfc}</span>}
                            {client.salario_diario > 0 && (
                              <span>• SD: ${client.salario_diario.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-line flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setActiveClient(null);
                  setIsSearchOpen(false);
                }}
                className="text-xs text-muted hover:text-ink cursor-pointer"
              >
                Limpiar selección (Modo libre)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsCreateOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy/90 cursor-pointer"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-line p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-playfair text-xl font-black text-ink">Registrar Nuevo Cliente</h3>
            <p className="text-xs text-muted font-inter mt-0.5">
              Crea un expediente para reutilizar sus datos en todas las calculadoras.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 text-muted hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-inter">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-inter text-xs">
          {/* Selector de Tipo */}
          <div>
            <label className="block text-muted font-medium mb-1.5">Tipo de Entidad</label>
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
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-navy/5 border-navy text-navy font-semibold'
                        : 'bg-surface border-line text-muted hover:text-ink'
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
            <label className="block text-ink font-semibold mb-1">
              Nombre o Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === 'empresa' ? 'Ej. Soluciones Fiscales SA de CV' : 'Ej. Lic. Roberto Gómez'}
              className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-hidden focus:border-navy"
            />
          </div>

          {/* RFC y CURP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-muted font-medium mb-1">RFC</label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="XAXX010101000"
                maxLength={13}
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink font-mono uppercase focus:outline-hidden focus:border-navy"
              />
            </div>

            <div>
              <label className="block text-muted font-medium mb-1">
                {tipo === 'empresa' ? 'Registro Patronal' : 'CURP'}
              </label>
              <input
                type="text"
                value={curp}
                onChange={(e) => setCurp(e.target.value.toUpperCase())}
                placeholder={tipo === 'empresa' ? 'Ej. Y123456710' : 'Ej. GOMR900101HDF...'}
                maxLength={18}
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink font-mono uppercase focus:outline-hidden focus:border-navy"
              />
            </div>
          </div>

          {/* NSS y Fecha de Ingreso (para trabajadores) */}
          {tipo === 'trabajador' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-muted font-medium mb-1">NSS (11 dígitos)</label>
                <input
                  type="text"
                  value={nss}
                  onChange={(e) => setNss(e.target.value)}
                  placeholder="12345678901"
                  maxLength={11}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink font-mono focus:outline-hidden focus:border-navy"
                />
              </div>

              <div>
                <label className="block text-muted font-medium mb-1">Fecha de Ingreso</label>
                <input
                  type="date"
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-ink focus:outline-hidden focus:border-navy"
                />
              </div>
            </div>
          )}

          {/* Salario Diario y SDI */}
          <div className="p-3 rounded-xl bg-surface-2 border border-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Bases Salariales (Opcional)</span>
              <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSdi}
                  onChange={(e) => setAutoSdi(e.target.checked)}
                  className="rounded border-line"
                />
                <span>Auto SDI sugerido (×1.0493)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-muted text-[11px] mb-1">Salario Diario (MXN)</label>
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
                    className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-mono focus:outline-hidden focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted text-[11px] mb-1">SDI Integrado (MXN)</label>
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
                    className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-mono focus:outline-hidden focus:border-navy"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-line text-muted hover:text-ink cursor-pointer"
            >
              Cancelar
            </button>
            <GlassButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
            >
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-line p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy/5 border border-navy/15 flex items-center justify-center text-navy shrink-0">
              <FolderKanban size={20} className="text-gold" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-black text-ink">
                Expediente: {client.nombre}
              </h3>
              <p className="text-xs text-muted font-inter">
                Historial sellado con SHA-256 y versión oficial DOF ({expedientes.length} cálculos)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 text-muted hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de expedientes */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted">Cargando historial auditable...</div>
          ) : expedientes.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShieldCheck size={28} className="mx-auto text-muted/40" />
              <p className="text-sm font-semibold text-ink">Aún no hay cálculos guardados</p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Cualquier cálculo que realices en Finiquitos, SBC, Nómina o ISN con este cliente activo se archivará automáticamente aquí con sello inmutable.
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
                  className="rounded-xl border border-line bg-surface p-4 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm">
                          {exp.titulo || exp.tool_id.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-navy/5 text-navy font-orbitron font-bold text-[10px] uppercase">
                          {exp.tool_id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted font-inter">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[10px] text-navy font-semibold">
                          {exp.catalog_version}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExpediente(exp)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy text-white text-[11px] font-semibold hover:bg-navy/90 cursor-pointer shadow-2xs"
                      >
                        <FileText size={12} className="text-gold" />
                        <span>Papel de Trabajo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                        className="text-xs text-navy font-semibold hover:underline cursor-pointer"
                      >
                        {isExpanded ? 'Ocultar Detalle' : 'Ver Detalle'}
                      </button>
                    </div>
                  </div>

                  {/* Hash SHA-256 */}
                  <div className="p-2 rounded-lg bg-surface-2 border border-line/60 flex items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="truncate text-muted">
                      <span className="text-ink font-semibold">SHA-256: </span>
                      {exp.input_hash}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyHash(exp.input_hash)}
                      title="Copiar hash SHA-256"
                      className="p-1 hover:bg-black/5 rounded text-muted hover:text-ink shrink-0 cursor-pointer"
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
                    <div className="pt-2 border-t border-line space-y-3 text-xs animate-in fade-in duration-150">
                      <div>
                        <span className="font-semibold text-ink block mb-1">Valores de Entrada:</span>
                        <pre className="p-2.5 rounded-lg bg-white border border-line text-[11px] font-mono text-muted overflow-x-auto max-h-36">
                          {JSON.stringify(exp.inputs, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <span className="font-semibold text-ink block mb-1">Resultados Emitidos:</span>
                        <pre className="p-2.5 rounded-lg bg-white border border-line text-[11px] font-mono text-emerald-900 overflow-x-auto max-h-36">
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
        <div className="pt-3 border-t border-line flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-2 border border-line text-xs font-semibold text-ink hover:bg-black/5 cursor-pointer"
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

/**
 * ARK LEDGER — Tool 23: REPSE Tracker
 * Registro Público de Contratistas de Servicios Especializados u Obras Especializadas
 * LFT Arts. 13, 15; Acuerdo DOF 24/05/2021 (mod. 21/02/2024); Art. 1004-C LFT
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useExpediente } from '@/context/ExpedienteContext';
import { ExpedienteToolBanner } from '@/components/ExpedienteToolBanner';
import { GlassButton } from '@/components/ui';
import {
  SEED_PROVEEDORES,
  ProveedorRepse,
  ProveedorFormData,
  EstatusRepse,
  NivelRiesgo,
  ESTATUS_REPSE_OPTIONS,
} from './types';
import {
  calcularNivelRiesgo,
  derivarEstatus,
  formDataToProveedor,
  generarAlertas,
  exportarCsv,
  exportarExcel,
  descargarArchivo,
  CITA_LEGAL_REPSE,
} from './lib/calcularRepse';
import { validarRfc, validarFecha } from './lib/calcularRepse';

interface RepseTrackerProps {
  onBack?: () => void;
}

const ESTATUS_COLORS: Record<
  EstatusRepse,
  { bg: string; text: string; border: string; icon: string }
> = {
  activo: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    icon: 'text-emerald-600',
  },
  en_renovacion: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200',
    icon: 'text-amber-600',
  },
  suspendido: {
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-200',
    icon: 'text-rose-600',
  },
  vencido: {
    bg: 'bg-red-50',
    text: 'text-red-900',
    border: 'border-red-200',
    icon: 'text-red-600',
  },
};

const RIESGO_COLORS: Record<NivelRiesgo, { bg: string; text: string; border: string }> = {
  bajo: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200' },
  medio: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  alto: { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  critico: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200' },
};

const ESTATUS_LABELS: Record<EstatusRepse, string> = {
  activo: 'Activo',
  en_renovacion: 'En Renovación',
  suspendido: 'Suspendido',
  vencido: 'Vencido',
};

const RIESGO_LABELS: Record<NivelRiesgo, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  critico: 'Crítico',
};

export function RepseTracker({ onBack }: RepseTrackerProps) {
  const { activeClient } = useExpediente();

  const [proveedores, setProveedores] = useState<ProveedorRepse[]>(() => [...SEED_PROVEEDORES]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProveedorFormData>({
    rfc: '',
    razonSocial: '',
    actividadRepse: '',
    folioRepse: '',
    vigenciaRepse: '',
    estatusRepse: 'activo',
    ultimaVerificacion: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProveedorFormData, string>>>({});

  // Cargar datos del expediente si hay cliente activo
  useEffect(() => {
    if (activeClient) {
      setFormData((prev) => ({
        ...prev,
        rfc: activeClient.rfc || '',
        razonSocial: activeClient.nombre || '',
      }));
    }
  }, [activeClient]);

  const alertas = useMemo(() => generarAlertas(proveedores), [proveedores]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ProveedorFormData, string>> = {};

    if (!formData.rfc.trim()) {
      newErrors.rfc = 'RFC requerido';
    } else if (!validarRfc(formData.rfc)) {
      newErrors.rfc = 'Formato RFC inválido (ej. ABC123456XYZ o PEPJ850412ABC)';
    }

    if (!formData.razonSocial.trim()) {
      newErrors.razonSocial = 'Razón social requerida';
    }

    if (!formData.actividadRepse.trim()) {
      newErrors.actividadRepse = 'Actividad REPSE requerida';
    }

    if (!formData.folioRepse.trim()) {
      newErrors.folioRepse = 'Folio REPSE requerido';
    }

    if (!formData.vigenciaRepse) {
      newErrors.vigenciaRepse = 'Fecha de vigencia requerida';
    } else if (!validarFecha(formData.vigenciaRepse)) {
      newErrors.vigenciaRepse = 'Fecha inválida (formato YYYY-MM-DD)';
    }

    if (!formData.ultimaVerificacion) {
      newErrors.ultimaVerificacion = 'Fecha de última verificación requerida';
    } else if (!validarFecha(formData.ultimaVerificacion)) {
      newErrors.ultimaVerificacion = 'Fecha inválida (formato YYYY-MM-DD)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const proveedor = formDataToProveedor(formData);

    if (editingIndex !== null) {
      const updated = [...proveedores];
      const existing = updated[editingIndex];
      if (existing) {
        updated[editingIndex] = { ...proveedor, esEjemplo: existing.esEjemplo };
        setProveedores(updated);
      }
    } else {
      setProveedores([...proveedores, proveedor]);
    }

    setShowForm(false);
    setEditingIndex(null);
    setFormData({
      rfc: '',
      razonSocial: '',
      actividadRepse: '',
      folioRepse: '',
      vigenciaRepse: '',
      estatusRepse: 'activo',
      ultimaVerificacion: new Date().toISOString().slice(0, 10),
    });
    setErrors({});
  }, [formData, editingIndex, proveedores, validateForm]);

  const handleEdit = useCallback(
    (index: number) => {
      const p = proveedores[index];
      if (!p) return;
      setFormData({
        rfc: p.rfc,
        razonSocial: p.razonSocial,
        actividadRepse: p.actividadRepse,
        folioRepse: p.folioRepse,
        vigenciaRepse: p.vigenciaRepse,
        estatusRepse: p.estatusRepse,
        ultimaVerificacion: p.ultimaVerificacion,
      });
      setEditingIndex(index);
      setShowForm(true);
      setErrors({});
    },
    [proveedores]
  );

  const handleDelete = useCallback(
    (index: number) => {
      const p = proveedores[index];
      if (!p) return;
      if (p.esEjemplo) {
        alert('No se pueden eliminar los proveedores de ejemplo (datos de demostración).');
        return;
      }
      if (window.confirm('¿Eliminar este proveedor?')) {
        setProveedores(proveedores.filter((_, i) => i !== index));
      }
    },
    [proveedores]
  );

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditingIndex(null);
    setFormData({
      rfc: '',
      razonSocial: '',
      actividadRepse: '',
      folioRepse: '',
      vigenciaRepse: '',
      estatusRepse: 'activo',
      ultimaVerificacion: new Date().toISOString().slice(0, 10),
    });
    setErrors({});
  }, []);

  const handleExportCsv = useCallback(() => {
    const csv = exportarCsv(proveedores);
    descargarArchivo(csv, `REPSE_Proveedores_${new Date().toISOString().slice(0, 10)}.csv`);
  }, [proveedores]);

  const handleExportExcel = useCallback(async () => {
    await exportarExcel(proveedores);
  }, [proveedores]);

  const StatusPill = ({ estatus }: { estatus: EstatusRepse }) => {
    const colors = ESTATUS_COLORS[estatus];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${colors.bg} ${colors.text} ${colors.border} border`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${colors.icon}`} />
        {ESTATUS_LABELS[estatus]}
      </span>
    );
  };

  const RiesgoPill = ({ riesgo }: { riesgo: NivelRiesgo }) => {
    const colors = RIESGO_COLORS[riesgo];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${colors.bg} ${colors.text} ${colors.border} border`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {RIESGO_LABELS[riesgo]}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-10">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      <header className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-navy/20 bg-navy/5 px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
          <ShieldAlert size={12} />
          REPSE · LFT Arts. 13, 15 · Acuerdo DOF 24/05/2021
        </div>
        <h1 className="font-playfair text-[34px] font-black leading-[0.98] tracking-[-0.03em] text-ink md:text-[42px]">
          Rastreador REPSE
        </h1>
        <p className="mt-3 max-w-[68ch] font-inter text-[14px] leading-[1.6] text-muted">
          Control de proveedores de servicios especializados con registro REPSE vigente. Identifica
          riesgos de deducibilidad fiscal por registros vencidos, suspendidos o en renovación.
        </p>
      </header>

      <div className="mb-6">
        <ExpedienteToolBanner
          toolId="repse"
          titulo="Rastreador REPSE — Proveedores Especializados"
          inputs={proveedores as unknown as Record<string, unknown>}
          outputs={alertas as unknown as Record<string, unknown>}
        />
      </div>

      {/* Badge de datos de ejemplo */}
      {proveedores.some((p) => p.esEjemplo) && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          <Info size={16} className="shrink-0 text-amber-600" />
          <span>
            <strong>Datos de ejemplo:</strong> Los 6 proveedores iniciales son datos de demostración
            (marcados con badge <em>Ejemplo</em>). No representan registros REPSE reales
            verificados. Agrega tus propios proveedores con el botón <em>Agregar Proveedor</em>.
          </span>
        </div>
      )}

      {/* Alertas de vigencia - Strip superior */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Total Proveedores
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-ink">
            {alertas.total}
          </div>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Activos
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-emerald-700">
            {alertas.activos}
          </div>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            En Renovación
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-amber-700">
            {alertas.enRenovacion}
          </div>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Suspendidos
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-rose-700">
            {alertas.suspendidos}
          </div>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Vencidos
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-red-700">
            {alertas.vencidos}
          </div>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Expiran ≤ 30 días
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-red-700">
            {alertas.expiran30Dias}
          </div>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Expiran ≤ 60 días
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-orange-700">
            {alertas.expiran60Dias}
          </div>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Expiran ≤ 90 días
          </div>
          <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-amber-700">
            {alertas.expiran90Dias}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        {/* Tabla de proveedores */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-navy">
              Proveedores Registrados
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditingIndex(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-navy bg-navy px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-navy/90"
            >
              <Plus size={14} />
              Agregar Proveedor
            </button>
          </div>

          <div className="overflow-hidden rounded-[8px] border border-line bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface-2 font-orbitron text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 text-left font-bold">RFC</th>
                    <th className="px-4 py-3 text-left font-bold">Razón Social</th>
                    <th className="px-4 py-3 text-left font-bold">Actividad REPSE</th>
                    <th className="px-4 py-3 text-left font-bold">Folio REPSE</th>
                    <th className="px-4 py-3 text-left font-bold">Vigencia</th>
                    <th className="px-4 py-3 text-left font-bold">Estatus</th>
                    <th className="px-4 py-3 text-left font-bold">Riesgo</th>
                    <th className="px-4 py-3 text-left font-bold">Últ. Verificación</th>
                    <th className="px-4 py-3 text-left font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {proveedores.map((p, index) => (
                    <tr
                      key={index}
                      className={`transition hover:bg-surface-2/60 ${p.esEjemplo ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-ink">{p.rfc}</td>
                      <td className="px-4 py-3 text-ink">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.razonSocial}</span>
                          {p.esEjemplo && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-900">
                              Ejemplo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted">
                        {p.actividadRepse}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-navy">{p.folioRepse}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-ink">
                        {p.vigenciaRepse}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill estatus={p.estatusRepse} />
                      </td>
                      <td className="px-4 py-3">
                        <RiesgoPill riesgo={p.nivelRiesgo} />
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted">
                        {p.ultimaVerificacion}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {!p.esEjemplo && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(index)}
                                className="rounded border border-line p-1.5 text-muted transition hover:border-navy hover:text-navy"
                                title="Editar"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(index)}
                                className="rounded border border-line p-1.5 text-muted transition hover:border-red-400 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {proveedores.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted">
                        No hay proveedores registrados. Agrega el primero con el botón superior.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel lateral: Formulario + Cita Legal + Exportación */}
        <div className="space-y-4 lg:sticky lg:top-[88px]">
          {/* Formulario Agregar/Editar */}
          {(showForm || editingIndex !== null) && (
            <div className="rounded-[8px] border border-line bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-navy">
                  {editingIndex !== null ? 'Editar Proveedor' : 'Agregar Proveedor'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="rounded border border-line p-1 text-muted transition hover:border-navy hover:text-navy"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                    RFC *
                  </label>
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) =>
                      setFormData({ ...formData, rfc: e.target.value.toUpperCase() })
                    }
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-ink focus:border-navy focus:outline-none"
                    placeholder="ABC123456XYZ"
                  />
                  {errors.rfc && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.rfc}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    value={formData.razonSocial}
                    onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.razonSocial && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      {errors.razonSocial}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                    Actividad REPSE Registrada *
                  </label>
                  <input
                    type="text"
                    value={formData.actividadRepse}
                    onChange={(e) => setFormData({ ...formData, actividadRepse: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                    placeholder="Ej. Servicios de seguridad y vigilancia"
                  />
                  {errors.actividadRepse && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      {errors.actividadRepse}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                    Folio REPSE *
                  </label>
                  <input
                    type="text"
                    value={formData.folioRepse}
                    onChange={(e) =>
                      setFormData({ ...formData, folioRepse: e.target.value.toUpperCase() })
                    }
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-ink focus:border-navy focus:outline-none"
                    placeholder="REPSE-2024-001234"
                  />
                  {errors.folioRepse && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      {errors.folioRepse}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                    Vigencia REPSE * (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={formData.vigenciaRepse}
                    onChange={(e) => setFormData({ ...formData, vigenciaRepse: e.target.value })}
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.vigenciaRepse && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      {errors.vigenciaRepse}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                    Estatus REPSE *
                  </label>
                  <select
                    value={formData.estatusRepse}
                    onChange={(e) =>
                      setFormData({ ...formData, estatusRepse: e.target.value as EstatusRepse })
                    }
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink focus:border-navy focus:outline-none"
                  >
                    {ESTATUS_REPSE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-muted">
                    Última Verificación * (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={formData.ultimaVerificacion}
                    onChange={(e) =>
                      setFormData({ ...formData, ultimaVerificacion: e.target.value })
                    }
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-semibold text-ink focus:border-navy focus:outline-none"
                  />
                  {errors.ultimaVerificacion && (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      {errors.ultimaVerificacion}
                    </p>
                  )}
                </div>

                {/* Vista previa del riesgo calculado */}
                <div className="border-t border-line pt-2">
                  <div className="mb-1 font-orbitron text-[10px] font-bold uppercase tracking-wider text-muted">
                    Nivel de Riesgo Calculado (Automático)
                  </div>
                  <div className="flex items-center gap-2">
                    <RiesgoPill
                      riesgo={calcularNivelRiesgo(
                        derivarEstatus(formData.estatusRepse, formData.vigenciaRepse),
                        formData.vigenciaRepse
                      )}
                    />
                    <span className="text-[11px] text-muted">
                      Reglas: Suspendido/Vencido=Crítico · En Renovación=Alto · ≤30 días=Alto · ≤90
                      días=Medio · Resto=Bajo
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <GlassButton variant="primary" size="md" fullWidth onClick={handleSubmit}>
                    {editingIndex !== null ? 'Guardar Cambios' : 'Agregar Proveedor'}
                  </GlassButton>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm font-bold text-muted transition hover:border-navy hover:bg-white"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cita Legal */}
          <div className="whitespace-pre-wrap rounded-[8px] border border-line bg-surface-2 p-4 font-mono text-[11px] leading-[1.6] text-muted">
            <div className="mb-2 flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-navy">
              <ShieldAlert size={13} />
              Fundamento Legal
            </div>
            {CITA_LEGAL_REPSE}
          </div>

          {/* Exportación */}
          <div className="rounded-[8px] border border-line bg-surface p-5 shadow-sm">
            <h3 className="mb-4 font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-navy">
              Exportar Listado
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy transition hover:border-navy hover:bg-surface-2"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span>Descargar CSV (Excel compatible)</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy transition hover:border-navy hover:bg-surface-2"
              >
                <Download size={16} className="text-navy" />
                <span>Descargar Excel (.xlsx)</span>
              </button>
            </div>
            <p className="mt-3 text-[10px] text-muted">
              Exporta la lista completa con RFC, razón social, actividad, folio, vigencia, estatus,
              riesgo, última verificación y marca de ejemplo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RepseTracker;

/**
 * CANACO SERVYTUR MÉRIDA — Modal de Cotejo Documental (Admin Expedientes)
 *
 * Permite a la administración de CANACO (horus.i2d@gmail.com / super_admin):
 * 1. Visualizar los 7 casilleros de expediente del socio.
 * 2. Abrir/descargar cada PDF o fotografía depositada.
 * 3. Dictaminar: Aprobar o Rechazar con motivo oficial.
 * 4. Botón de WhatsApp directo con mensaje prearmado si un documento es ilegible.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, MessageSquare, Check, Ban, RefreshCw } from 'lucide-react';
import { DOCUMENTOS_BUZON_CANACO, type TipoDocumentoCanaco } from './documentosBuzon';

export interface AdminSlotDetalle {
  id: string | null;
  tipo: TipoDocumentoCanaco;
  estatus: 'pendiente' | 'recibido' | 'aprobado' | 'rechazado';
  nombreArchivo?: string;
  tamanoBytes?: number;
  sha256?: string;
  motivoRechazo?: string | null;
  depositadoEn?: string | null;
}

interface ExpedienteAdminData {
  rfc: string;
  tipoPersona: 'fisica' | 'moral';
  requeridos: number;
  depositados: number;
  aprobados: number;
  rechazados: number;
  completo: boolean;
  slots: AdminSlotDetalle[];
}

interface AdminExpedienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfc: string;
  razonSocial: string;
  whatsapp?: string | null;
  contactoNombre?: string | null;
  onDictamenActualizado?: () => void;
}

export function AdminExpedienteModal({
  isOpen,
  onClose,
  rfc,
  razonSocial,
  whatsapp,
  contactoNombre,
  onDictamenActualizado,
}: AdminExpedienteModalProps) {
  const [data, setData] = useState<ExpedienteAdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dictaminandoId, setDictaminandoId] = useState<string | null>(null);
  const [rechazoPromptId, setRechazoPromptId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const cargarExpediente = useCallback(async () => {
    if (!rfc) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/canaco/buzon/admin/expediente?rfc=${encodeURIComponent(rfc)}`);
      if (!res.ok) {
        throw new Error('No se pudo cargar el expediente.');
      }
      const json = (await res.json()) as ExpedienteAdminData;
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error cargando expediente');
    } finally {
      setLoading(false);
    }
  }, [rfc]);

  useEffect(() => {
    if (isOpen) {
      void cargarExpediente();
    } else {
      setData(null);
      setRechazoPromptId(null);
      setMotivoRechazo('');
    }
  }, [isOpen, cargarExpediente]);

  if (!isOpen) return null;

  const dictaminar = async (id: string, estatus: 'aprobado' | 'rechazado', motivo?: string) => {
    setDictaminandoId(id);
    try {
      const res = await fetch('/api/canaco/buzon/admin/dictaminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estatus, motivo }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errJson.error || 'Error al guardar dictamen');
      }
      setRechazoPromptId(null);
      setMotivoRechazo('');
      await cargarExpediente();
      onDictamenActualizado?.();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDictaminandoId(null);
    }
  };

  const armarWaIlegible = (docTitulo: string) => {
    const waNumber = (whatsapp || '').replace(/\D/g, '');
    if (!waNumber) return '#';
    const msg = encodeURIComponent(
      `Estimado/a ${contactoNombre || 'Socio'}: Le saludamos de la Oficialía de Partes de CANACO Mérida. Al cotejar su expediente SIEM para "${razonSocial}", notamos que su "${docTitulo}" requiere actualización o no es totalmente legible. ¿Podría ingresar a su Buzón Digital para depositarlo nuevamente? Con gusto le asistimos.`
    );
    return `https://wa.me/52${waNumber}?text=${msg}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-6 w-full max-w-3xl rounded-2xl border border-henequen-arena bg-white p-6 font-inter text-henequen-grafito shadow-2xl sm:p-8">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-henequen-arena/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-henequen-anil/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-henequen-anil">
                Oficialía de Partes · Cotejo
              </span>
              <span className="font-mono text-xs font-semibold text-henequen-piedra">
                RFC: {rfc}
              </span>
            </div>
            <h3 className="mt-1 font-fraunces text-xl font-bold text-henequen-anil">
              Expediente Digital de {razonSocial}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-henequen-piedra transition hover:bg-henequen-cal hover:text-henequen-anil"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen KPIs del Expediente */}
        {data && (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-henequen-arena/60 bg-henequen-cal/50 p-4 sm:grid-cols-4">
            <div>
              <span className="block text-[10px] uppercase text-henequen-piedra">Requeridos</span>
              <span className="font-mono text-base font-bold text-henequen-anil">
                {data.requeridos} slots
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-henequen-piedra">Depositados</span>
              <span className="font-mono text-base font-bold text-henequen-grafito">
                {data.depositados} / {data.requeridos}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-henequen-piedra">Aprobados</span>
              <span className="font-mono text-base font-bold text-emerald-700">
                {data.aprobados}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-henequen-piedra">Pendientes</span>
              <span className="font-mono text-base font-bold text-amber-700">
                {data.requeridos - data.aprobados}
              </span>
            </div>
          </div>
        )}

        {/* Lista de Documentos */}
        <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-henequen-piedra">
              <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-henequen-anil" />
              Cargando casilleros del socio...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : data ? (
            DOCUMENTOS_BUZON_CANACO.map((def) => {
              const aplica = def.aplicaA.includes(data.tipoPersona);
              const slot = data.slots.find((s) => s.tipo === def.tipo);
              const estatus = slot?.estatus || 'pendiente';
              const tieneArchivo = Boolean(slot?.id);

              return (
                <div
                  key={def.tipo}
                  className={`rounded-xl border p-3.5 transition ${
                    !aplica
                      ? 'border-henequen-arena/50 bg-henequen-cal/30 opacity-60'
                      : estatus === 'aprobado'
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : estatus === 'rechazado'
                          ? 'border-red-200 bg-red-50/40'
                          : estatus === 'recibido'
                            ? 'border-henequen-terra/40 bg-amber-50/30'
                            : 'border-dashed border-henequen-arena bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-henequen-terra">
                          Nº{def.numero}
                        </span>
                        <h4 className="text-xs font-bold text-henequen-anil">{def.titulo}</h4>
                        {aplica ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase ${
                              estatus === 'aprobado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : estatus === 'rechazado'
                                  ? 'bg-red-100 text-red-800'
                                  : estatus === 'recibido'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-henequen-cal text-henequen-piedra'
                            }`}
                          >
                            {estatus === 'aprobado'
                              ? 'Aprobado'
                              : estatus === 'rechazado'
                                ? 'Rechazado'
                                : estatus === 'recibido'
                                  ? 'Recibido'
                                  : 'Pendiente'}
                          </span>
                        ) : (
                          <span className="rounded bg-henequen-cal px-1.5 py-0.5 text-[9px] text-henequen-piedra">
                            No aplica
                          </span>
                        )}
                      </div>

                      {slot?.nombreArchivo && (
                        <div className="mt-1 flex items-center gap-2 font-mono text-[10.5px] text-henequen-piedra">
                          <span className="max-w-xs truncate">{slot.nombreArchivo}</span>
                          {slot.sha256 && (
                            <span className="text-[9px]">SHA: {slot.sha256.slice(0, 10)}…</span>
                          )}
                        </div>
                      )}

                      {slot?.motivoRechazo && (
                        <div className="mt-1 text-[11px] text-red-700">
                          <strong>Motivo:</strong> {slot.motivoRechazo}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    {aplica && tieneArchivo && slot?.id && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                        {/* Ver Documento */}
                        <a
                          href={`/api/canaco/buzon/admin/archivo?id=${slot.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shadow-2xs inline-flex items-center gap-1 rounded-md border border-henequen-arena bg-white px-2.5 py-1 text-[11px] font-semibold text-henequen-anil hover:bg-henequen-cal"
                        >
                          <ExternalLink size={11} />
                          <span>Ver</span>
                        </a>

                        {/* WhatsApp Reenvío si está borroso */}
                        {whatsapp && (
                          <a
                            href={armarWaIlegible(def.titulo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shadow-2xs inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                            title="Solicitar reenvío por WhatsApp con mensaje prearmado"
                          >
                            <MessageSquare size={11} />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {/* Botón Aprobar */}
                        {estatus !== 'aprobado' && (
                          <button
                            type="button"
                            disabled={dictaminandoId === slot.id}
                            onClick={() => dictaminar(slot.id!, 'aprobado')}
                            className="shadow-2xs inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                          >
                            <Check size={11} />
                            <span>Aprobar</span>
                          </button>
                        )}

                        {/* Botón Rechazar */}
                        {estatus !== 'rechazado' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRechazoPromptId(slot.id);
                              setMotivoRechazo('Documento borroso o ilegible.');
                            }}
                            className="shadow-2xs inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-800 hover:bg-red-100"
                          >
                            <Ban size={11} />
                            <span>Rechazar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Prompt para motivo de rechazo */}
                  {rechazoPromptId === slot?.id && (
                    <div className="mt-2.5 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs">
                      <label className="block font-semibold text-red-900">
                        Indica el motivo del rechazo al socio:
                      </label>
                      <input
                        type="text"
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        className="mt-1 w-full rounded border border-red-300 bg-white p-1.5 text-xs focus:outline-none"
                        placeholder="Ej. Constancia mayor a 3 meses / INE borrosa"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRechazoPromptId(null)}
                          className="rounded border border-henequen-arena bg-white px-2 py-1 text-[11px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={!motivoRechazo.trim() || dictaminandoId === slot.id}
                          onClick={() => dictaminar(slot.id!, 'rechazado', motivoRechazo)}
                          className="rounded bg-red-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-800 disabled:opacity-50"
                        >
                          Confirmar Rechazo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-henequen-arena/80 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-henequen-anil px-5 py-2 text-xs font-semibold text-white hover:bg-henequen-anil-deep"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}

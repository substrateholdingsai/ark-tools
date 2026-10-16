/**
 * ARK TOOLS — Guía Interactiva SAT / IMSS (Fase D: Compliance)
 *
 * Guía de 8 pasos para responder requerimientos, exhortos y actos de fiscalización.
 * Incluye motor de checklists, clasificación de actos, plazos clave y generador de borradores.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Search,
  X,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  ACTOS_IMSS,
  ACTOS_SAT,
  GUIA_PASOS,
  PLAZOS_CLAVE,
  NOTAS_PLAZOS,
  type ActoFiscal,
  type PasoGuia,
} from '@/data/actos';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks';
import { apiClient } from '@/lib/apiClient';
import { generarBorrador } from './lib/generarBorrador';


const STORAGE_KEY = 'ark.guia-sat-imss.checklist.v1';

export type FiltroAutoridad = 'todos' | 'SAT' | 'IMSS';

interface GuiaSATIMSSProps {
  onBack?: () => void;
}

function claveCheck(pasoId: number, index: number): string {
  return `${pasoId}:${index}`;
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
    throw new Error('Clipboard API no disponible');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  }
}

function descargarArchivo(nombre: string, contenido: string, tipo: string): void {
  const blob = new Blob([contenido], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

function RiesgoBadge({ riesgo }: { riesgo: ActoFiscal['riesgo'] }) {
  const styles: Record<ActoFiscal['riesgo'], string> = {
    Bajo: 'border-line bg-surface-2 text-muted',
    Medio: 'border-navy/20 bg-surface-2 text-navy',
    Alto: 'border-navy/40 bg-navy/5 text-navy',
    Crítico: 'border-navy bg-navy text-white',
  };

  return (
    <span
      className={cn(
        'rounded-full border px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.14em]',
        styles[riesgo]
      )}
    >
      {riesgo}
    </span>
  );
}

function ActoCard({
  acto,
  onUsarEnBorrador,
}: {
  acto: ActoFiscal;
  onUsarEnBorrador: (codigo: string) => void;
}) {
  return (
    <article className="rounded-card border border-line bg-surface p-4 shadow-receipt transition-colors hover:border-navy/25">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-[12px] border border-line bg-surface-2 font-orbitron text-[10px] font-bold text-navy">
          {acto.codigo.slice(0, 2)}
        </div>

        <RiesgoBadge riesgo={acto.riesgo} />
      </div>

      <h3 className="mt-3 font-inter text-[13px] font-bold leading-tight text-ink">
        {acto.titulo}
      </h3>

      <p className="mt-1 font-inter text-[11px] leading-[1.45] text-muted">
        {acto.descripcion}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-line bg-surface px-2 py-1 font-orbitron text-[9px] tracking-widest text-muted">
          {acto.codigo}
        </span>

        <span className="rounded-full border border-line bg-cream px-2 py-1 font-inter text-[10px] text-muted">
          {acto.fundamento}
        </span>
      </div>

      <p className="mt-3 font-inter text-[11px] text-ink">
        <span className="font-bold">Acción:</span> {acto.accion}
      </p>

      <button
        type="button"
        onClick={() => onUsarEnBorrador(acto.codigo)}
        className="glass-btn mt-4 h-9 w-full rounded-[12px] px-3 font-inter text-[12px] font-semibold text-navy hover:text-navy-dark transition"
      >
        Usar en borrador
      </button>
    </article>
  );
}

export function GuiaSATIMSS({ onBack }: GuiaSATIMSSProps) {
  const { tenantId, userId, tenantName, getToken } = useAuth();
  const [sincronizandoD1, setSincronizandoD1] = useState(false);

  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroAutoridad>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [pasoActivoId, setPasoActivoId] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [actoSeleccionado, setActoSeleccionado] = useState(
    ACTOS_SAT[0]?.codigo ?? ACTOS_IMSS[0]?.codigo ?? ''
  );

  // 1. Cargar progreso de D1 al montar o cuando cambie de tenant
  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;
    setSincronizandoD1(true);

    getToken()
      .then((token) => apiClient.guia.getProgress(tenantId, token))
      .then((progress) => {
        if (!isMounted || !progress || progress.length === 0) return;

        const loadedChecks: Record<string, boolean> = {};
        progress.forEach((p) => {
          try {
            const parsed =
              typeof p.checklist_state === 'string'
                ? JSON.parse(p.checklist_state)
                : p.checklist_state;
            Object.assign(loadedChecks, parsed);
          } catch {
            // Ignorar
          }
        });

        if (Object.keys(loadedChecks).length > 0) {
          setChecks((prev) => ({ ...prev, ...loadedChecks }));
        }
      })
      .catch((err) => {
        console.debug('[GuiaD1] Error cargando progreso:', err);
      })
      .finally(() => {
        if (isMounted) setSincronizandoD1(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tenantId, getToken]);

  // 2. Guardar en localStorage de respaldo
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    } catch {
      // noop
    }
  }, [checks]);

  // 3. Auto-save en D1 con debounce para el tenant activo
  useEffect(() => {
    if (!tenantId || !userId) return;

    const timer = setTimeout(() => {
      getToken()
        .then((token) =>
          apiClient.guia.saveStep(
            {
              tenant_id: tenantId,
              user_id: userId,
              step_id: pasoActivoId,
              checklist_state: checks,
            },
            token
          )
        )
        .catch((err) => {
          console.debug('[GuiaD1] Error auto-guardando:', err);
        });
    }, 800);

    return () => clearTimeout(timer);
  }, [checks, pasoActivoId, tenantId, userId, getToken]);


  useEffect(() => {
    if (!modalAbierto) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalAbierto(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalAbierto]);

  const actosTodos = useMemo<ActoFiscal[]>(
    () => [...ACTOS_SAT, ...ACTOS_IMSS],
    []
  );

  const q = busqueda.trim().toLowerCase();

  const pasosVisibles = useMemo<PasoGuia[]>(() => {
    if (!q) return GUIA_PASOS;

    return GUIA_PASOS.filter((paso) => {
      const texto = [
        paso.titulo,
        paso.corto,
        paso.descripcion,
        paso.fundamento,
        ...paso.canales,
        ...paso.checklist,
      ]
        .join(' ')
        .toLowerCase();

      return texto.includes(q);
    });
  }, [q]);

  const actosVisibles = useMemo<ActoFiscal[]>(() => {
    return actosTodos.filter((acto) => {
      const coincideAutoridad =
        filtro === 'todos' || acto.autoridad === filtro;

      if (!q) return coincideAutoridad;

      const texto = [
        acto.titulo,
        acto.descripcion,
        acto.codigo,
        acto.fundamento,
        acto.accion,
      ]
        .join(' ')
        .toLowerCase();

      return coincideAutoridad && texto.includes(q);
    });
  }, [actosTodos, filtro, q]);

  const actosSat = actosVisibles.filter((acto) => acto.autoridad === 'SAT');
  const actosImss = actosVisibles.filter((acto) => acto.autoridad === 'IMSS');

  const pasoActivo: PasoGuia =
    GUIA_PASOS.find((paso) => paso.id === pasoActivoId) ?? (GUIA_PASOS[0] as PasoGuia);

  const totalChecks = useMemo(
    () => GUIA_PASOS.reduce((acc, paso) => acc + paso.checklist.length, 0),
    []
  );

  const completados = useMemo(() => {
    return GUIA_PASOS.reduce((acc, paso) => {
      return (
        acc +
        paso.checklist.filter((_, index) => checks[claveCheck(paso.id, index)])
          .length
      );
    }, 0);
  }, [checks]);

  const avance = Math.round((completados / totalChecks) * 100);

  const avancePorPaso = useMemo(() => {
    return GUIA_PASOS.map((paso) => {
      const done = paso.checklist.filter(
        (_, index) => checks[claveCheck(paso.id, index)]
      ).length;

      return {
        id: paso.id,
        porcentaje: Math.round((done / paso.checklist.length) * 100),
      };
    });
  }, [checks]);

  const actoActivo: ActoFiscal =
    actosTodos.find((acto) => acto.codigo === actoSeleccionado) ?? (actosTodos[0] as ActoFiscal);

  const borrador = useMemo(() => {
    if (!actoActivo || !pasoActivo) return '';

    const checklistActivo = pasoActivo.checklist.filter(
      (_, index) => checks[claveCheck(pasoActivo.id, index)]
    );

    return generarBorrador({
      acto: actoActivo,
      paso: pasoActivo,
      checklistActivo,
      avance,
    });
  }, [actoActivo, pasoActivo, checks, avance]);

  const toggleCheck = (pasoId: number, index: number) => {
    const key = claveCheck(pasoId, index);

    setChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const marcarTodo = () => {
    const nextState: Record<string, boolean> = {};

    GUIA_PASOS.forEach((paso) => {
      paso.checklist.forEach((_, index) => {
        nextState[claveCheck(paso.id, index)] = true;
      });
    });

    setChecks(nextState);
  };

  const reiniciar = () => {
    setChecks({});
  };

  const copiarBorrador = async () => {
    const ok = await copiarTexto(borrador);
    setCopiado(ok);

    window.setTimeout(() => {
      setCopiado(false);
    }, 2200);
  };

  const descargarBorrador = () => {
    const nombre = `borrador_${actoActivo?.codigo ?? 'acto'}.txt`;
    descargarArchivo(nombre, borrador, 'text/plain');
  };

  const usarActoEnBorrador = (codigo: string) => {
    setActoSeleccionado(codigo);
    setModalAbierto(true);
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      {/* BOTÓN VOLVER */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.16em] text-muted transition hover:text-navy mb-6"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          Volver al dashboard
        </button>
      )}

      {/* HERO */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-line bg-surface px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Fase D • Compliance
            </span>

            <span className="rounded-full bg-navy px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              SAT • IMSS
            </span>

            <span className="rounded-full border border-line bg-surface-2 px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              8 pasos
            </span>

            {tenantName && (
              <span className="rounded-full border border-gold/40 bg-cream/60 px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark flex items-center gap-1.5">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    sincronizandoD1 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                  )}
                />
                <span>{sincronizandoD1 ? 'Sincronizando...' : `Despacho: ${tenantName}`}</span>
              </span>
            )}
          </div>


          <h1 className="mt-4 font-playfair text-4xl font-black leading-[0.98] tracking-[-0.03em] text-ink sm:text-5xl">
            Guía interactiva
            <span className="mt-1 block text-navy">
              SAT / IMSS
            </span>
          </h1>

          <p className="mt-4 max-w-[640px] font-inter text-[15px] leading-7 text-muted">
            Qué hacer ante un exhorto o requerimiento del SAT o del IMSS:
            clasifica el acto, valida plazos, integra evidencia, define
            estrategia y genera un borrador de respuesta legal.
          </p>

          <div className="mt-6 max-w-[640px] relative">
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Busca paso, fundamento, tipo de acto..."
              className="h-[52px] w-full rounded-input border border-line bg-surface pl-11 pr-4 font-inter text-[14px] text-ink outline-none transition-colors focus:border-navy"
            />
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(['todos', 'SAT', 'IMSS'] as FiltroAutoridad[]).map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => {
                  setFiltro(valor);
                  setEstadoFiltro(
                    `Filtro ${valor.toUpperCase()} • ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
                  );
                }}
                className={cn(
                  'rounded-full border px-3 py-1.5 font-inter text-[11px] font-bold uppercase tracking-[0.14em] transition-colors',
                  filtro === valor
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-cream text-muted hover:text-navy'
                )}
              >
                {valor}
              </button>
            ))}

            {estadoFiltro ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 font-inter text-[11px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-navy" />
                {estadoFiltro}
              </span>
            ) : null}
          </div>
        </div>

        <div className="liquid-glass-dome rounded-dome p-6 shadow-dome">
          <div className="flex items-center justify-between gap-4">
            <p className="font-orbitron text-[11px] uppercase tracking-[0.2em] text-muted">
              Resumen ejecutivo
            </p>

            <span className="rounded-full border border-line bg-surface px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark font-orbitron">
              ARK CHECK
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <div>
              <p className="font-playfair text-4xl font-black leading-none text-ink">
                {completados}
              </p>
              <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
                Tareas
              </p>
            </div>

            <div className="border-l border-line pl-4">
              <p className="font-playfair text-4xl font-black leading-none text-navy">
                {pasosVisibles.length}
              </p>
              <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
                Pasos
              </p>
            </div>

            <div className="border-l border-line pl-4">
              <p className="font-playfair text-4xl font-black leading-none text-ink">
                {avance}%
              </p>
              <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
                Avance
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-card bg-navy p-4 text-white">
            <p className="font-inter text-[13px] font-semibold flex items-center gap-1.5">
              <Sparkles size={14} className="text-gold" />
              Regla de oro ARK
            </p>
            <p className="mt-1 font-inter text-[12px] leading-[1.45] text-white/80">
              Nunca contestes sin clasificar. Contesta exacto, prueba
              pertinente y conserva acuse.
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={reiniciar}
              className="glass-btn h-11 rounded-[12px] font-inter text-[13px] font-semibold text-muted hover:text-ink flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} />
              Reiniciar sesión
            </button>

            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="glass-btn glass-btn-primary h-11 rounded-[12px] font-inter text-[13px] font-semibold flex items-center justify-center gap-2"
            >
              <FileText size={14} />
              Generar borrador
            </button>
          </div>

          <p className="mt-3 text-center font-inter text-[10px] text-muted">
            Estado local • Exporta el borrador para conservar evidencia
          </p>
        </div>
      </section>

      {/* TIMELINE DE 8 PASOS */}
      <section className="mt-10">
        <div className="grid gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {pasosVisibles.map((paso) => {
            const done = paso.checklist.filter(
              (_, index) => checks[claveCheck(paso.id, index)]
            ).length;

            const isActive = paso.id === pasoActivoId;

            return (
              <button
                key={paso.id}
                type="button"
                onClick={() => setPasoActivoId(paso.id)}
                className={cn(
                  'rounded-card border p-4 text-left transition-all',
                  isActive
                    ? 'border-navy bg-navy text-white shadow-dome'
                    : 'border-line bg-surface hover:border-navy/30 hover:bg-surface-2'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-full font-orbitron text-[12px] font-bold',
                      isActive
                        ? 'bg-white text-navy'
                        : 'border border-line bg-cream text-navy'
                    )}
                  >
                    {paso.id}
                  </span>

                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 font-inter text-[10px] font-semibold',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-surface-2 text-muted'
                    )}
                  >
                    {done}/{paso.checklist.length}
                  </span>
                </div>

                <p
                  className={cn(
                    'mt-3 font-inter text-[12px] font-semibold leading-[1.25]',
                    isActive ? 'text-white' : 'text-ink'
                  )}
                >
                  {paso.titulo}
                </p>

                <p
                  className={cn(
                    'mt-1 font-inter text-[11px] leading-[1.3]',
                    isActive ? 'text-white/70' : 'text-muted'
                  )}
                >
                  {paso.corto}
                </p>
              </button>
            );
          })}
        </div>

        {pasosVisibles.length === 0 ? (
          <div className="mt-4 rounded-card border border-line bg-surface-2 p-4 font-inter text-[13px] text-muted">
            Sin resultados para la búsqueda actual en los 8 pasos.
          </div>
        ) : null}
      </section>

      {/* DETALLE DEL PASO + SIDEBAR */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="liquid-glass-dome rounded-dome p-6 shadow-dome">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-orbitron text-[11px] tracking-[0.25em] text-muted">
                  PASO {pasoActivo.id} / 08
                </span>

                <span className="h-1 w-1 rounded-full bg-line" />

                <span className="rounded-full border border-line bg-cream px-2 py-0.5 font-inter text-[11px] text-muted">
                  {pasoActivo.fundamento}
                </span>
              </div>

              <h2 className="mt-2 font-playfair text-3xl font-black leading-[0.98] tracking-tight text-ink">
                {pasoActivo.titulo}
              </h2>

              <p className="mt-3 max-w-[560px] font-inter text-[14px] leading-[1.55] text-muted">
                {pasoActivo.descripcion}
              </p>
            </div>

            <div className="hidden text-right sm:block">
              <p className="font-playfair text-5xl font-black leading-none text-navy">
                {String(pasoActivo.id).padStart(2, '0')}
              </p>
              <p className="mt-1 font-inter text-[10px] uppercase tracking-[0.16em] text-muted">
                ARK STEP
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {pasoActivo.canales.map((canal) => (
              <div
                key={canal}
                className="flex items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-2.5 font-inter text-[12px] text-ink"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-navy" />
                {canal}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="font-inter text-[12px] font-bold uppercase tracking-[0.16em] text-ink">
                Checklist operativo
              </h3>

              <span className="font-inter text-[11px] text-muted">
                {
                  pasoActivo.checklist.filter(
                    (_, index) => checks[claveCheck(pasoActivo.id, index)]
                  ).length
                }
                /{pasoActivo.checklist.length} completadas
              </span>
            </div>

            <div className="space-y-2.5">
              {pasoActivo.checklist.map((item, index) => {
                const key = claveCheck(pasoActivo.id, index);
                const checked = Boolean(checks[key]);

                return (
                  <label
                    key={key}
                    className={cn(
                      'group flex cursor-pointer items-start gap-3 rounded-card border px-4 py-3.5 transition-colors',
                      checked
                        ? 'border-navy bg-navy text-white'
                        : 'border-line bg-surface hover:bg-surface-2'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleCheck(pasoActivo.id, index)}
                    />

                    <span
                      className={cn(
                        'mt-0.5 grid h-5 w-5 place-items-center rounded-full border transition-all',
                        checked
                          ? 'border-white bg-white text-navy'
                          : 'border-line bg-surface text-transparent'
                      )}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>

                    <span
                      className={cn(
                        'font-inter text-[13px] leading-[1.45]',
                        checked ? 'text-white' : 'text-ink'
                      )}
                    >
                      {item}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-card border border-line bg-cream p-4">
              <p className="font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                Tip ARK
              </p>
              <p className="mt-2 font-inter text-[12px] leading-[1.5] text-muted">
                {pasoActivo.tip}
              </p>
            </div>

            <div className="rounded-card border border-line bg-surface p-4">
              <p className="font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                Acción rápida
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(true)}
                  className="glass-btn h-9 rounded-full px-3 font-inter text-[12px] font-semibold text-navy hover:text-navy-dark"
                >
                  Usar en borrador
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPasoActivoId(Math.min(8, pasoActivo.id + 1))
                  }
                  className="glass-btn h-9 rounded-full px-3 font-inter text-[12px] font-semibold text-navy hover:text-navy-dark"
                >
                  Siguiente paso
                </button>
              </div>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-dome bg-navy p-6 text-white shadow-dome">
            <p className="font-orbitron text-[10px] uppercase tracking-[0.2em] text-white/60">
              Plazos clave • no negociables
            </p>

            <div className="mt-4 space-y-3">
              {PLAZOS_CLAVE.map((plazo) => (
                <div
                  key={plazo.id}
                  className={cn(
                    'flex items-center justify-between rounded-[16px] px-4 py-3',
                    plazo.destacado
                      ? 'bg-white text-navy'
                      : 'bg-white/10 text-white'
                  )}
                >
                  <div>
                    <p className="font-inter text-[13px] font-bold">
                      {plazo.autoridad} • {plazo.concepto}
                    </p>
                    <p
                      className={cn(
                        'font-inter text-[11px]',
                        plazo.destacado ? 'text-navy/70' : 'text-white/70'
                      )}
                    >
                      {plazo.fundamento}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-playfair text-xl font-black leading-none">
                      {plazo.prefijo ?? ''}
                      {plazo.cantidad}
                    </p>
                    <p className="font-inter text-[10px] uppercase tracking-[0.16em]">
                      {plazo.unidad}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1">
              {NOTAS_PLAZOS.map((nota) => (
                <p
                  key={nota}
                  className="font-inter text-[11px] leading-[1.45] text-white/60"
                >
                  * {nota}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-dome border border-line bg-surface p-6">
            <p className="font-inter text-[12px] font-bold uppercase tracking-[0.16em] text-ink">
              Progreso por fase
            </p>

            <div className="mt-4 space-y-3">
              {avancePorPaso.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="w-6 font-orbitron text-[11px] text-muted">
                    {String(item.id).padStart(2, '0')}
                  </span>

                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-navy transition-all"
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>

                  <span className="w-8 text-right font-inter text-[11px] text-muted">
                    {item.porcentaje}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={reiniciar}
                className="glass-btn h-10 rounded-[12px] font-inter text-[12px] font-semibold text-muted hover:text-ink"
              >
                Reiniciar
              </button>

              <button
                type="button"
                onClick={marcarTodo}
                className="glass-btn h-10 rounded-[12px] bg-navy font-inter text-[12px] font-semibold text-white"
              >
                Marcar todo
              </button>
            </div>

            <p className="mt-3 text-center font-inter text-[10px] text-muted">
              El avance se guarda localmente en este navegador.
            </p>
          </div>
        </aside>
      </section>

      {/* ACTOS FISCALES MÁS COMUNES */}
      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-playfair text-3xl font-black tracking-tight text-ink">
              Tipos de actos más comunes
            </h2>
            <p className="mt-2 max-w-[640px] font-inter text-[13px] leading-6 text-muted">
              Clasifica antes de contestar. Cada acto tiene riesgo, fundamento
              y respuesta distinta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 font-inter text-[11px] text-muted">
              <span className="h-2 w-2 rounded-full bg-muted" />
              Bajo
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 font-inter text-[11px] text-navy">
              <span className="h-2 w-2 rounded-full bg-navy/40" />
              Medio / Alto
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 font-inter text-[11px] text-navy">
              <span className="h-2 w-2 rounded-full bg-navy" />
              Crítico
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {filtro !== 'IMSS' && actosSat.length > 0 ? (
            <div className="rounded-dome border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-navy font-inter text-[12px] font-bold text-white">
                    SAT
                  </div>

                  <div>
                    <p className="font-playfair text-lg font-bold leading-none text-ink">
                      SAT
                    </p>
                    <p className="mt-1 font-inter text-[11px] uppercase tracking-[0.16em] text-muted">
                      CFF • 4 actos críticos
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Vigilancia profunda
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {actosSat.map((acto) => (
                  <ActoCard
                    key={acto.codigo}
                    acto={acto}
                    onUsarEnBorrador={usarActoEnBorrador}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {filtro !== 'SAT' && actosImss.length > 0 ? (
            <div className="rounded-dome border border-line bg-surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-ink font-inter text-[12px] font-bold text-white">
                    IMSS
                  </div>

                  <div>
                    <p className="font-playfair text-lg font-bold leading-none text-ink">
                      IMSS
                    </p>
                    <p className="mt-1 font-inter text-[11px] uppercase tracking-[0.16em] text-muted">
                      LSS • 4 actos críticos
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-line bg-cream px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Seguridad social
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {actosImss.map((acto) => (
                  <ActoCard
                    key={acto.codigo}
                    acto={acto}
                    onUsarEnBorrador={usarActoEnBorrador}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {actosVisibles.length === 0 ? (
          <div className="mt-4 rounded-card border border-line bg-surface-2 p-4 font-inter text-[13px] text-muted">
            Sin resultados para la búsqueda o filtro actual en actos SAT / IMSS.
          </div>
        ) : null}
      </section>

      {/* REGLA DE ORO + GENERADOR */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-dome bg-navy p-7 text-white shadow-dome">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 font-inter text-[11px] uppercase tracking-[0.16em]">
            Regla de oro ARK Systems
          </span>

          <h3 className="mt-4 max-w-[560px] font-playfair text-3xl font-black leading-[0.98]">
            Contesta exacto, prueba pertinente, conserva acuse.
          </h3>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-card border border-white/15 bg-white/10 p-4">
              <p className="font-inter text-[12px] font-bold">1. Exacto</p>
              <p className="mt-1 font-inter text-[11px] leading-[1.45] text-white/70">
                Solo lo pedido. Nada de anexos voluntarios que amplíen la
                revisión.
              </p>
            </div>

            <div className="rounded-card border border-white/15 bg-white/10 p-4">
              <p className="font-inter text-[12px] font-bold">2. Pertinente</p>
              <p className="mt-1 font-inter text-[11px] leading-[1.45] text-white/70">
                Prueba que desvirtúa directamente. Papeles de trabajo, no
                capturas sueltas.
              </p>
            </div>

            <div className="rounded-card bg-white p-4 text-navy">
              <p className="font-inter text-[12px] font-bold">3. Acuse</p>
              <p className="mt-1 font-inter text-[11px] leading-[1.45]">
                Sin acuse, no exististe. Guarda folio, sello y fecha en
                expediente único.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-dome border border-line bg-surface p-6 shadow-receipt">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[12px] border border-line bg-cream font-orbitron text-[11px] font-bold text-navy">
              TXT
            </div>

            <div>
              <p className="font-playfair text-lg font-bold text-ink">
                Genera tu borrador
              </p>
              <p className="font-inter text-[12px] text-muted">
                Sin backend • Copiar, exportar y compartir
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label
              htmlFor="acto-seleccionado"
              className="font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-ink block"
            >
              Tipo de acto seleccionado
            </label>

            <select
              id="acto-seleccionado"
              value={actoSeleccionado}
              onChange={(event) => setActoSeleccionado(event.target.value)}
              className="h-11 w-full rounded-input border border-line bg-surface px-3 font-inter text-[13px] text-ink outline-none transition-colors focus:border-navy"
            >
              {actosTodos.map((acto) => (
                <option key={acto.codigo} value={acto.codigo}>
                  {acto.autoridad} — {acto.titulo}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="glass-btn glass-btn-primary h-12 w-full rounded-input font-inter text-[13px] font-semibold flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              Generar borrador
            </button>

            <div className="rounded-input border border-line bg-cream p-3 font-inter text-[11px] leading-[1.45] text-muted">
              Al generar, se usa tu avance actual ({avance}%) y el paso{' '}
              {pasoActivo.id}. El borrador se abre como vista previa local para
              copiar o descargar TXT. Sin envío automático.
            </div>
          </div>
        </div>
      </section>

      {/* MODAL BORRADOR */}
      {modalAbierto ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Borrador de respuesta"
        >
          <div className="flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-t-[28px] border border-line bg-surface shadow-receipt sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-4 border-b border-line p-6">
              <div>
                <p className="font-playfair text-lg font-bold text-ink">
                  Borrador de respuesta • Vista previa local
                </p>

                <p className="mt-1 font-inter text-[12px] text-muted">
                  Basado en Paso {pasoActivo.id}: {pasoActivo.titulo} •{' '}
                  {actoActivo?.titulo ?? 'Acto seleccionado'} • Progreso {avance}%
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                aria-label="Cerrar borrador"
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-cream font-inter text-[12px] font-bold text-ink hover:bg-surface-2 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-auto p-6">
              <div className="rounded-card border border-line bg-cream p-4">
                <pre className="whitespace-pre-wrap font-mono text-[12px] leading-[1.6] text-ink select-all">
                  {borrador}
                </pre>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={copiarBorrador}
                  className="glass-btn h-11 rounded-input font-inter text-[13px] font-semibold flex items-center justify-center gap-2"
                >
                  {copiado ? (
                    <>
                      <Check size={16} className="text-emerald-600" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copiar borrador</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={descargarBorrador}
                  className="glass-btn glass-btn-primary h-11 rounded-input font-inter text-[13px] font-semibold flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>Descargar TXT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="glass-btn h-11 rounded-input font-inter text-[13px] font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default GuiaSATIMSS;
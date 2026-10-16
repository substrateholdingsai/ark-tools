// src/tools/auditor-cobranza/AuditorCobranza.tsx

import { useState, useMemo, useCallback } from 'react';
import { Download, FileText, Copy, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '@/hooks';
import { apiClient } from '@/lib/apiClient';
import { COMPARADORES_CONTRATO_CRM } from '@/data/comparadores-contrato-crm';
import { calcularDictamenCobranza } from './lib/calcularDictamen';
import { descargarCSV, descargarTXT, copiarTXT } from './lib/exportarDictamenCobranza';
import type { EstadoDictamen } from './types';
import {
  ResumenAuditoriaDome,
  ComparadorCard,
  SeccionConductasAccordion,
  ListaDetallesDictamen,
} from './components';
import { GlassButton } from '@/components/ui';


interface AuditorCobranzaProps {
  onBack?: () => void;
}

export default function AuditorCobranza({ onBack }: AuditorCobranzaProps) {
  // Estado de comparadores
  const [respuestasComparadores, setRespuestasComparadores] = useState<Record<string, EstadoDictamen>>({});
  const [notasComparadores, setNotasComparadores] = useState<Record<string, string>>({});

  // Estado de conductas
  const [conductasDetectadas, setConductasDetectadas] = useState<string[]>([]);

  // Datos del auditor
  const [cliente, setCliente] = useState('');
  const [revisor, setRevisor] = useState('');
  const [notasAuditor, setNotasAuditor] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Contexto Multi-Tenant y Ledger
  const { tenantId, userId, tenantName, getToken } = useAuth();
  const [guardandoLedger, setGuardandoLedger] = useState(false);
  const [hashGenerado, setHashGenerado] = useState<string | null>(null);


  // Normalizar respuestas junto con notas para el dictamen
  const respuestasConNotas = useMemo(() => {
    const mapa: Record<string, { estado: EstadoDictamen; nota?: string }> = {};
    for (const [id, estado] of Object.entries(respuestasComparadores)) {
      mapa[id] = {
        estado,
        nota: notasComparadores[id],
      };
    }
    return mapa;
  }, [respuestasComparadores, notasComparadores]);

  // Calcular dictamen
  const dictamen = useMemo(() => {
    return calcularDictamenCobranza({
      cliente,
      revisor,
      fecha: new Date().toISOString(),
      respuestasComparadores: respuestasConNotas,
      conductasDetectadas,
      notas: notasAuditor,
      incluirComparadores: true,
      incluirConductas: conductasDetectadas.length > 0,
    });
  }, [cliente, revisor, respuestasConNotas, conductasDetectadas, notasAuditor]);

  // Handlers
  const handleEstadoComparador = useCallback((id: string, estado: EstadoDictamen) => {
    setRespuestasComparadores((prev) => ({ ...prev, [id]: estado }));
  }, []);

  const handleNotaComparador = useCallback((id: string, nota: string) => {
    setNotasComparadores((prev) => ({ ...prev, [id]: nota }));
  }, []);

  const handleToggleConducta = useCallback((id: string) => {
    setConductasDetectadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }, []);

  const handleReset = useCallback(() => {
    setRespuestasComparadores({});
    setNotasComparadores({});
    setConductasDetectadas([]);
    setCliente('');
    setRevisor('');
    setNotasAuditor('');
    setHashGenerado(null);
  }, []);

  const handleCopiar = useCallback(async () => {
    await copiarTXT(dictamen);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }, [dictamen]);

  const handleGuardarLedger = useCallback(async () => {
    if (!tenantId || !userId) return;
    setGuardandoLedger(true);
    try {
      const token = await getToken();
      const esBloqueado = dictamen.resumen.nivel === 'CRITICO' || dictamen.resumen.criticos > 0;
      const res = await apiClient.ledger.addEntry(
        {
          tenant_id: tenantId,
          user_id: userId,
          caso_id: cliente.trim() || 'Auditoria-General',
          conducta_id: conductasDetectadas.length > 0 ? conductasDetectadas.join(',') : 'CONTRATO-CRM',
          estado: esBloqueado ? 'BLOQUEADO' : 'PERMITIDO',
        },
        token
      );
      setHashGenerado(res.hash_sha256);
    } catch (err) {
      console.debug('[Ledger] Error al sellar en D1:', err);
    } finally {
      setGuardandoLedger(false);
    }
  }, [tenantId, userId, cliente, conductasDetectadas, dictamen.resumen.nivel, dictamen.resumen.criticos, getToken]);



  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      {/* Botón de regreso en el header */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--line)] bg-white font-inter text-[12px] font-semibold text-[var(--ink)] hover:bg-[var(--cream)] transition"
        >
          ← Volver al dashboard
        </button>
      )}

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="rounded-full bg-[var(--navy)] px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-white">
            Fase D • Compliance
          </span>
          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            Auditoría de Cobranza
          </span>
          <span className="rounded-full border border-[var(--line)] bg-[var(--cream)] px-3 py-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            12 Comparadores + 43 Conductas
          </span>
        </div>

        <h1 className="font-playfair text-[32px] sm:text-[42px] font-black leading-[0.95] tracking-[-0.03em] text-[var(--ink)]">
          Auditoría Legal de Cobranza
        </h1>

        <p className="mt-3 max-w-[640px] font-inter text-[14px] leading-[1.6] text-[var(--muted)]">
          Evalúe la consistencia entre contrato y CRM, detecte conductas de riesgo
          y genere un dictamen exportable con fundamento legal.
        </p>
      </header>

      {/* Grid principal */}
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        {/* Columna izquierda: Resumen + Datos + Acciones */}
        <div className="space-y-6">
          {/* Datos del auditor */}
          <div className="rounded-[20px] border border-[var(--line)] bg-white p-5">
            <h3 className="font-inter font-bold text-[12px] tracking-[0.15em] text-[var(--ink)] mb-4">
              DATOS DEL AUDITOR
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Cliente / Empresa auditada"
                className="w-full h-10 rounded-[12px] border border-[var(--line)] bg-[var(--cream)] px-3 font-inter text-[13px] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--navy)]/20 focus:border-[var(--navy)] transition"
              />
              <input
                type="text"
                value={revisor}
                onChange={(e) => setRevisor(e.target.value)}
                placeholder="Nombre del revisor"
                className="w-full h-10 rounded-[12px] border border-[var(--line)] bg-[var(--cream)] px-3 font-inter text-[13px] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--navy)]/20 focus:border-[var(--navy)] transition"
              />
              <textarea
                value={notasAuditor}
                onChange={(e) => setNotasAuditor(e.target.value)}
                placeholder="Notas generales del auditor..."
                rows={3}
                className="w-full rounded-[12px] border border-[var(--line)] bg-[var(--cream)] px-3 py-2 font-inter text-[12px] text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--navy)]/20 focus:border-[var(--navy)] transition resize-none"
              />
            </div>
          </div>

          {/* Resumen */}
          <ResumenAuditoriaDome
            resumen={dictamen.resumen}
            cliente={cliente}
            revisor={revisor}
          />

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            <GlassButton
              onClick={() => descargarCSV(dictamen)}
              className="flex-1"
            >
              <Download size={14} />
              CSV
            </GlassButton>
            <GlassButton
              onClick={() => descargarTXT(dictamen)}
              className="flex-1"
            >
              <FileText size={14} />
              TXT
            </GlassButton>
            <GlassButton
              onClick={handleCopiar}
              className="flex-1"
            >
              <Copy size={14} />
              {copiado ? 'Copiado' : 'Copiar'}
            </GlassButton>
          </div>

          <GlassButton
            variant="primary"
            onClick={handleGuardarLedger}
            disabled={guardandoLedger}
            className="w-full bg-navy text-white hover:bg-navy-dark"
          >
            <ShieldCheck size={14} className="text-gold" />
            {guardandoLedger ? 'Sellando en D1...' : 'Sellar en Ledger Inmutable (D1)'}
          </GlassButton>

          {hashGenerado && (
            <div className="rounded-[14px] bg-emerald-50 border border-emerald-300 p-3.5 text-[11px] font-mono text-emerald-900 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold font-inter text-[12px] mb-1.5 text-emerald-950">
                <Check size={14} className="text-emerald-600" />
                <span>Dictamen Sellado en Ledger ({tenantName})</span>
              </div>
              <div className="break-all text-[10px] text-emerald-800 bg-white/80 p-2 rounded border border-emerald-200">
                SHA-256: {hashGenerado}
              </div>
            </div>
          )}

          <GlassButton
            onClick={handleReset}
            className="w-full"
          >
            <RotateCcw size={14} />
            Reiniciar Evaluación
          </GlassButton>

        </div>

        {/* Columna derecha: Comparadores + Conductas */}
        <div className="space-y-6">
          {/* Comparadores */}
          <div className="rounded-[24px] border border-[var(--line)] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-playfair font-bold text-[20px] leading-none text-[var(--ink)]">
                  Contrato vs CRM
                </h2>
                <p className="font-inter text-[11px] text-[var(--muted)] mt-1">
                  12 comparadores • Sección VIII — Eje de Gravedad
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-inter text-[10px] font-bold">
                CRÍTICO
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {COMPARADORES_CONTRATO_CRM.map((comp) => (
                <ComparadorCard
                  key={comp.id}
                  id={comp.id}
                  codigo={comp.codigo}
                  campo={comp.campo}
                  pregunta={comp.pregunta}
                  riesgo={comp.riesgo}
                  fundamento={comp.fundamento}
                  impactoContable={comp.impactoContable}
                  recomendacion={comp.recomendacion}
                  estado={respuestasComparadores[comp.id] ?? 'SIN_DATO'}
                  nota={notasComparadores[comp.id] ?? ''}
                  onEstadoChange={(estado) => handleEstadoComparador(comp.id, estado)}
                  onNotaChange={(nota) => handleNotaComparador(comp.id, nota)}
                />
              ))}
            </div>
          </div>

          {/* Conductas */}
          <SeccionConductasAccordion
            conductasDetectadas={conductasDetectadas}
            onToggleConducta={handleToggleConducta}
          />

          {/* Tabla de detalles */}
          <ListaDetallesDictamen detalles={dictamen.detalles} />
        </div>
      </div>
    </main>
  );
}

export { AuditorCobranza };

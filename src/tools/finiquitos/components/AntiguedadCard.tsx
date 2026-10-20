/**
 * ARK TOOLS — Antigüedad y Parámetros Derivados
 * Sprint 8 — Componente #2
 *
 * Renderiza el resultado de antigüedad calculado por el motor.
 * NO calcula nada — solo presenta ResultadoFiniquito.
 *
 * Fundamento: LFT Arts. 76 (Vacaciones Dignas 2023), 486 (tope prima antigüedad).
 */

import { cn } from '../../../lib/cn';
import type { ResultadoFiniquito } from '../types';
import { TOPE_PRIMA_ANTIGUEDAD, SMG_VIGENTE } from '../lib/calcularFiniquito';

interface Props {
  resultado: ResultadoFiniquito;
}

export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function AntiguedadCard({ resultado }: Props) {
  const {
    diasAntiguedad,
    aniosExactos,
    aniosCompletos,
    diasTrabajadosAnio,
    tablaVacaciones,
    salarioMensual,
    salarioTope,
  } = resultado;

  // Descomposición legible: años completos + meses + días restantes
  const descomposicion = descomponerAntiguedad(diasAntiguedad);

  // Año de servicio en curso (para tabla vacaciones)
  const anioServicioEnCurso = aniosCompletos + 1;

  // ¿El salario está topado por Art. 486?
  const estaTopado = salarioTope < calcularSalarioDiarioDesdeMensual(salarioMensual);

  return (
    <div className="rounded-[20px] border border-line bg-surface p-6 shadow-[0_20px_40px_rgba(0,43,127,0.06)] sm:p-8">
      {/* === Encabezado === */}
      <div className="mb-6">
        <h2 className="font-playfair text-2xl font-black tracking-[-0.02em] text-ink sm:text-3xl">
          Antigüedad
        </h2>
        <p className="mt-1 font-inter text-sm text-muted">
          Base para vacaciones (Art. 76), aguinaldo (Art. 87) y prima de antigüedad (Art. 162).
        </p>
      </div>

      {/* === Bloque principal: descomposición de antigüedad === */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <BloqueMetrica
          valor={descomposicion.anios}
          etiqueta="Años"
          destacado={descomposicion.anios > 0}
        />
        <BloqueMetrica valor={descomposicion.meses} etiqueta="Meses" />
        <BloqueMetrica valor={descomposicion.dias} etiqueta="Días" />
      </div>

      {/* === Total de días (barra inferior) === */}
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2 rounded-[12px] bg-surface-2 px-4 py-3">
        <span className="font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Días totales de servicio
        </span>
        <span className="font-orbitron text-base font-bold tabular-nums text-ink">
          {diasAntiguedad.toLocaleString('es-MX')} días{' '}
          <span className="font-inter text-[12px] font-normal text-muted">
            ({aniosExactos.toFixed(2)} años exactos)
          </span>
        </span>
      </div>

      {/* === Grid de parámetros derivados === */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TarjetaDerivada
          titulo="Año de Servicio en Curso"
          valor={String(anioServicioEnCurso)}
          sufijo={anioServicioEnCurso === 1 ? 'año' : 'años'}
          descripcion={
            aniosCompletos === 0
              ? 'Primer año de servicio.'
              : `${aniosCompletos} ${aniosCompletos === 1 ? 'aniversario cumplido' : 'aniversarios cumplidos'}.`
          }
          fundamento="Art. 76 LFT"
        />

        <TarjetaDerivada
          titulo="Días de Vacaciones por Ley"
          valor={String(tablaVacaciones)}
          sufijo="días/año"
          descripcion="Tabla vigente Vacaciones Dignas 2023."
          fundamento="Art. 76 LFT"
        />

        <TarjetaDerivada
          titulo="Días en Año de Servicio"
          valor={String(diasTrabajadosAnio)}
          sufijo="días"
          descripcion="Base para vacaciones y aguinaldo proporcional."
          fundamento="Arts. 79 y 87 LFT"
        />

        <TarjetaTopeArt486 salarioTope={salarioTope} estaTopado={estaTopado} />
      </div>

      {/* === Nota informativa del tope === */}
      <div className="mt-6 rounded-[12px] border border-line bg-surface-2 p-4">
        <p className="font-inter text-[12px] leading-relaxed text-muted">
          <span className="font-bold text-ink">Nota sobre el tope (Art. 486 LFT):</span> La prima de
          antigüedad se calcula sobre el salario diario topado a{' '}
          <span className="font-orbitron font-bold tabular-nums text-ink">
            ${TOPE_PRIMA_ANTIGUEDAD.toFixed(2)}
          </span>{' '}
          (2× salario mínimo general de{' '}
          <span className="font-orbitron font-bold tabular-nums text-ink">
            ${SMG_VIGENTE.toFixed(2)}
          </span>
          ). Si el salario real es superior, el excedente no se considera para este concepto.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTES LOCALES
   ═══════════════════════════════════════════════════════════════ */

interface BloqueMetricaProps {
  valor: number;
  etiqueta: string;
  destacado?: boolean;
}

function BloqueMetrica({ valor, etiqueta, destacado }: BloqueMetricaProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] border p-4 text-center transition-all',
        destacado ? 'border-navy/20 bg-navy/[0.03]' : 'border-line bg-surface-2'
      )}
    >
      <div className="font-orbitron text-2xl font-bold tabular-nums text-ink sm:text-3xl">
        {valor}
      </div>
      <div className="mt-1 font-inter text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
        {etiqueta}
      </div>
    </div>
  );
}

interface TarjetaDerivadaProps {
  titulo: string;
  valor: string;
  sufijo?: string;
  descripcion: string;
  fundamento: string;
}

function TarjetaDerivada({ titulo, valor, sufijo, descripcion, fundamento }: TarjetaDerivadaProps) {
  return (
    <div className="rounded-[14px] border border-line bg-surface-2 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          {titulo}
        </h3>
        <span className="shrink-0 font-inter text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          {fundamento}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-orbitron text-xl font-bold tabular-nums text-ink">{valor}</span>
        {sufijo && (
          <span className="font-inter text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            {sufijo}
          </span>
        )}
      </div>
      <p className="mt-2 font-inter text-[12px] leading-snug text-muted">{descripcion}</p>
    </div>
  );
}

interface TarjetaTopeArt486Props {
  salarioTope: number;
  estaTopado: boolean;
}

function TarjetaTopeArt486({ salarioTope, estaTopado }: TarjetaTopeArt486Props) {
  return (
    <div
      className={cn(
        'rounded-[14px] border p-4 transition-all',
        estaTopado ? 'border-amber-200 bg-amber-50/40' : 'border-line bg-surface-2'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-inter text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
          Salario Tope (Art. 486)
        </h3>
        <span className="shrink-0 font-inter text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          Art. 486 LFT
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-orbitron text-xl font-bold tabular-nums text-ink">
          ${salarioTope.toFixed(2)}
        </span>
        <span className="font-inter text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          /día
        </span>
      </div>
      <p className="mt-2 font-inter text-[12px] leading-snug text-muted">
        {estaTopado
          ? 'El salario real excede el tope legal. Prima de antigüedad calculada sobre el tope.'
          : 'El salario real está por debajo del tope. Se usa el salario real.'}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS LOCALES
   ═══════════════════════════════════════════════════════════════ */

interface DescomposicionAntiguedad {
  anios: number;
  meses: number;
  dias: number;
}

/**
 * Descompone un total de días en años, meses y días legibles.
 * Usa aproximación estándar: 1 año = 365 días, 1 mes = 30 días.
 * NO reemplaza el cálculo legal — solo presenta el total ya calculado por el motor.
 */
function descomponerAntiguedad(diasTotales: number): DescomposicionAntiguedad {
  if (diasTotales <= 0) {
    return { anios: 0, meses: 0, dias: 0 };
  }
  const anios = Math.floor(diasTotales / 365);
  const restoTrasAnios = diasTotales - anios * 365;
  const meses = Math.floor(restoTrasAnios / 30);
  const dias = restoTrasAnios - meses * 30;
  return { anios, meses, dias };
}

/**
 * Convierte el salario mensual de vuelta a diario para comparar contra el tope.
 * Nota: el motor usa salarioDiario × 30.4 para salarioMensual.
 */
function calcularSalarioDiarioDesdeMensual(salarioMensual: number): number {
  return salarioMensual / 30.4;
}

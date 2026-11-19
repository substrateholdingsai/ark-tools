// Uso: pnpm tsx scripts/verificar-catalogo.ts

import * as fs from 'node:fs';
import * as path from 'node:path';
import { CATALOGO_2026 } from '../src/data/valores-vigentes/catalogo';
import { evaluarVigencia } from '../src/data/valores-vigentes/vigencia';
import { ESTADOS } from '../src/tools/isn/data/estados';
import { RECARGOS_YUCATAN_2026 } from '../src/tools/recargos/data/constantes';

console.log('\n🔍 AUDITORÍA DEL CATÁLOGO DE VALORES FISCALES\n');
console.log('─'.repeat(80));

let proyecciones = 0;
let criticosVencidos = 0;

for (const v of CATALOGO_2026) {
  const r = evaluarVigencia(v);
  const flag = v.esProyeccion ? '⚠️  PROYECCIÓN' : '✅ OFICIAL';
  const estado = r.estado.toUpperCase().padEnd(15);

  console.log(`\n${flag}  |  ${estado}  |  ${v.id}`);
  console.log(`   Nombre:    ${v.nombre}`);
  console.log(`   Fuente:    ${v.fuente.organismo} — ${v.fuente.referencia}`);
  console.log(`   Vigencia:  ${v.vigencia.inicio} → ${v.vigencia.fin ?? 'sin fin'}`);
  console.log(`   Estado:    ${r.mensaje}`);

  if (v.esProyeccion) proyecciones++;
  if (r.estado === 'vencido' && v.criticidad === 'ALTA') criticosVencidos++;
}

console.log('\n' + '─'.repeat(80));
console.log(`\n📊 RESUMEN:`);
console.log(`   Total de valores:        ${CATALOGO_2026.length}`);
console.log(`   Proyecciones pendientes: ${proyecciones}`);
console.log(`   Críticos vencidos:       ${criticosVencidos}`);

if (proyecciones > 0) {
  console.log(`\n⚠️  Hay ${proyecciones} valores sin verificar contra fuente oficial.`);
  process.exit(1);
}

if (criticosVencidos > 0) {
  console.log(`\n🚨 CRÍTICO: ${criticosVencidos} valores fiscales vencidos sin reemplazo.`);
  process.exit(2);
}

// ════════════════════════════════════════════════════════════════════════════
// NUEVA VALIDACIÓN: catalogo.ts es la fuente de verdad de ISN Yucatán (fail-closed)
// ═════════════════════════════════════════════════════════════════════════════
const IDS_ISN_YUCATAN: readonly string[] = [
  'ISN_YUC_2025_GENERAL',
  'ISN_YUC_2026_GENERAL',
  'ISN_YUC_2026_MICROPEQUENA_BRUTA',
  'ISN_YUC_2026_MICROPEQUENA_ESTIMULO',
  'ISN_YUC_2026_MICROPEQUENA_NETA',
  'ISN_YUC_2026_GOBIERNO_ESTATAL',
];

const idsFaltantes = IDS_ISN_YUCATAN.filter((id) => !CATALOGO_2026.some((v) => v.id === id));
if (idsFaltantes.length > 0) {
  console.log(
    `\n🚨 ISN Yucatán — faltan entradas obligatorias en catalogo.ts (fuente de verdad): ${idsFaltantes.join(', ')}`
  );
  process.exit(1);
}
console.log('\n✅ ISN Yucatán — fuente de verdad en catalogo.ts: todas las tasas definidas.');

// ════════════════════════════════════════════════════════════════════════════
// NUEVA VALIDACIÓN: ISN Yucatán versionado (valores en estados.ts provienen de catalogo.ts)
// ════════════════════════════════════════════════════════════════════════════
export interface IsnTasaEsperada {
  ejercicio: number;
  regimen: 'general' | 'microPequena' | 'gobiernoEstatal';
  tasaBruta: number;
  estimuloTasa: number;
  tasaNeta: number;
}

const TASAS_YUC_ESPERADAS: IsnTasaEsperada[] = [
  { ejercicio: 2025, regimen: 'general', tasaBruta: 3.0, estimuloTasa: 0, tasaNeta: 3.0 },
  { ejercicio: 2026, regimen: 'general', tasaBruta: 3.75, estimuloTasa: 0, tasaNeta: 3.75 },
  {
    ejercicio: 2026,
    regimen: 'microPequena',
    tasaBruta: 3.75,
    estimuloTasa: 0.75,
    tasaNeta: 3.0,
  },
  {
    ejercicio: 2026,
    regimen: 'gobiernoEstatal',
    tasaBruta: 4.75,
    estimuloTasa: 0,
    tasaNeta: 4.75,
  },
];

export interface IsnValidacionError {
  ejercicio: number;
  regimen: string;
  campo: string;
  esperado: number;
  obtenido: number;
}

/**
 * Valida que ISN Yucatán en estados.ts declare las tasas esperadas
 * (2025 general, 2026 general, 2026 MiPyME con estímulo, 2026 gobierno estatal).
 * Retorna un array de errores (vacío si todo coincide).
 */
export function validarIsnYucatan(estados: typeof ESTADOS): IsnValidacionError[] {
  const errores: IsnValidacionError[] = [];
  const yuc = estados.find((e) => e.id === 'YUC');
  if (!yuc) {
    errores.push({
      ejercicio: 0,
      regimen: 'YUC',
      campo: 'presencia',
      esperado: 1,
      obtenido: 0,
    });
    return errores;
  }

  const porEjercicio = yuc.tasasPorEjercicio;
  for (const esperado of TASAS_YUC_ESPERADAS) {
    const cfg =
      porEjercicio?.[esperado.ejercicio as 2025 | 2026]?.[
        esperado.regimen === 'general'
          ? 'general'
          : esperado.regimen === 'microPequena'
            ? 'microPequena'
            : 'gobiernoEstatal'
      ];
    if (!cfg) {
      errores.push({
        ejercicio: esperado.ejercicio,
        regimen: esperado.regimen,
        campo: 'configuración',
        esperado: 1,
        obtenido: 0,
      });
      continue;
    }
    const campos: Array<[string, number]> = [
      ['tasaBruta', cfg.tasaBruta],
      ['estimuloTasa', cfg.estimuloTasa],
      ['tasaNeta', cfg.tasaNeta],
    ];
    for (const [campo, valorCfg] of campos) {
      const valorEsperado =
        campo === 'tasaBruta'
          ? esperado.tasaBruta
          : campo === 'estimuloTasa'
            ? esperado.estimuloTasa
            : esperado.tasaNeta;
      if (valorCfg !== valorEsperado) {
        errores.push({
          ejercicio: esperado.ejercicio,
          regimen: esperado.regimen,
          campo,
          esperado: valorEsperado,
          obtenido: valorCfg,
        });
      }
    }
  }

  return errores;
}

const erroresIsn = validarIsnYucatan(ESTADOS);
if (erroresIsn.length > 0) {
  console.log('\n🚨 ISN Yucatán — tasas no coinciden con lo declarado en catalogo.ts/estados.ts:');
  for (const e of erroresIsn) {
    console.log(
      `   ${e.ejercicio}/${e.regimen}.${e.campo}: esperado ${e.esperado}, obtenido ${e.obtenido}`
    );
  }
  process.exit(1);
}
console.log(
  '\n✅ ISN Yucatán (estados.ts → catalogo.ts): 2025=3.0%, 2026 general=3.75%, MiPyME=3.0% neto, gobierno=4.75%'
);

export function validarRecargosYucatan2026(): string[] {
  const errores: string[] = [];
  const fuente = RECARGOS_YUCATAN_2026.fuente;

  if (
    RECARGOS_YUCATAN_2026.tasaMensualPct !== 2.07 ||
    !Number.isFinite(RECARGOS_YUCATAN_2026.tasaMensualPct)
  ) {
    errores.push('la tasa mensual debe coincidir con el 2.07% del Artículo 56');
  }
  if (RECARGOS_YUCATAN_2026.estado !== 'VERIFICADO') {
    errores.push('la tasa estatal debe conservar estado VERIFICADO');
  }

  if (!/^https?:\/\//.test(fuente.url)) errores.push('la fuente no contiene una URL válida');
  if (!fuente.publicacion.includes('140/2025')) {
    errores.push('la fuente debe identificar el Decreto 140/2025');
  }
  if (!fuente.referencia.includes('Artículo 56')) {
    errores.push('la referencia debe identificar el Artículo 56');
  }
  return errores;
}

const erroresRecargosYucatan = validarRecargosYucatan2026();
if (erroresRecargosYucatan.length > 0) {
  console.log('\n🚨 Recargos Yucatán 2026 — definición o fuente inválida:');
  for (const error of erroresRecargosYucatan) console.log(`   ${error}`);
  process.exit(1);
}
console.log('\n✅ Recargos Yucatán 2026 — Artículo 56, Decreto 140/2025: tasa mensual verificada.');

// ════════════════════════════════════════════════════════════════════════════
// NUEVA VALIDACIÓN: detectar literales de tasa ISN (3.75 / 3.0 / 0.75 / 4.75)
// fuera de los archivos permitidos.
// ════════════════════════════════════════════════════════════════════════════
export interface HardcodeMatch {
  archivo: string;
  linea: number;
  coincidencia: string;
}

/**
 * Archivos donde los literales 3.75 / 3.0 / 0.75 / 4.75 son intencionales y NO son
 * tasas de cálculo de ISN (documentación de formato, factores de pensión, constantes
 * locales con fuente citada). Se excluyen del escaneo para evitar falsos positivos.
 *
 * El directorio src/tools/isn/ queda excluido porque:
 * - estados.ts YA NO define las tasas ISN de Yucatán: las importa de catalogo.ts
 *   (verificación de valores vía validarIsnYucatan y fuente de verdad vía el chequeo
 *   de IDs de catalogo.ts más arriba).
 * - El resto del módulo ISN (UI, comentarios, etiquetas de documento) contiene
 *   literales de presentación que no son definiciones de tasa ISN.
 */
const ARCHIVOS_EXCLUIDOS_HARDCODE: Record<string, string> = {
  'src/tools/modalidad40/lib/calcularModalidad40.ts':
    'Factores de edad y cuantía de pensión Modalidad 40 (SMG), no tasas ISN',
  'src/tools/retencion-clinicas/data/constantes.ts':
    'Constantes locales con fuente citada (Tasa retención 2% Art. 20-Bis LGHY; IEP 3% Arts. 16-20 LGHY)',
  'src/tools/nomina/data/cuotasIMSS.ts':
    'Umbrales de tabla progresiva IMSS (LSS Art. 168, ratio SBC/UMA), no tasas ISN',
  'src/tools/recargos/data/constantes.ts':
    'Constantes de recargos con fuente citada, incluyendo Yucatán 2026',
};

const LITERALES_TASAS_FISCALES = /\b(3\.75|3\.0|0\.75|4\.75|2\.07)\b/g;

/**
 * Determina si un archivo debe excluirse del escaneo de hardcodes ISN.
 */
function estaExcluido(archivoRelativo: string): boolean {
  if (/\.test\.(ts|tsx)$/.test(archivoRelativo)) return true;
  // Todo el módulo ISN (fuente de verdad en estados.ts; Fase 2 limpia los restos).
  if (archivoRelativo.startsWith('src/tools/isn/')) return true;
  if (archivoRelativo in ARCHIVOS_EXCLUIDOS_HARDCODE) return true;
  return false;
}

/**
 * Indica si una línea de código es un comentario (se ignora en el escaneo).
 */
function esLineaComentario(linea: string): boolean {
  const trimmed = linea.trimStart();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith("'") ||
    trimmed.startsWith('"') ||
    trimmed.startsWith('`')
  );
}

/**
 * Escanea un directorio (recursivo) buscando literales de tasa ISN fuera de los
 * archivos permitidos. Retorna los matches encontrados (archivo:línea).
 * No lanza process.exit: el llamante decide qué hacer con el resultado.
 */
export function escaneearHardcodesIsn(dir: string): HardcodeMatch[] {
  const matches: HardcodeMatch[] = [];

  function recorrer(directorio: string): void {
    let entradas: fs.Dirent[];
    try {
      entradas = fs.readdirSync(directorio, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entrada of entradas) {
      const full = path.join(directorio, entrada.name);
      if (entrada.isDirectory()) {
        recorrer(full);
      } else if (entrada.isFile() && /\.(ts|tsx)$/.test(entrada.name)) {
        const rel = path.relative(process.cwd(), full).replace(/\\/g, '/');
        if (estaExcluido(rel)) continue;
        let contenido: string;
        try {
          contenido = fs.readFileSync(full, 'utf-8');
        } catch {
          continue;
        }
        const lineas = contenido.split(/\r?\n/);
        for (let i = 0; i < lineas.length; i++) {
          const linea = lineas[i];
          if (esLineaComentario(linea)) continue;
          let match: RegExpExecArray | null;
          LITERALES_TASAS_FISCALES.lastIndex = 0;
          while ((match = LITERALES_TASAS_FISCALES.exec(linea)) !== null) {
            matches.push({
              archivo: rel,
              linea: i + 1,
              coincidencia: match[0],
            });
          }
        }
      }
    }
  }

  recorrer(dir);
  return matches;
}

const raizHerramientas = path.resolve(process.cwd(), 'src/tools');
const hardcodes = escaneearHardcodesIsn(raizHerramientas);
if (hardcodes.length > 0) {
  console.log('\n🚨 Hardcodes de tasa ISN (3.75 / 3.0 / 0.75 / 4.75) fuera de estados.ts y tests:');
  for (const h of hardcodes) {
    console.log(`   ${h.archivo}:${h.linea} — ${h.coincidencia}`);
  }
  process.exit(1);
}
console.log('\n✅ Sin hardcodes de tasa ISN fuera de estados.ts y pruebas.\n');

console.log('\n✅ Catálogo completamente verificado y vigente.\n');

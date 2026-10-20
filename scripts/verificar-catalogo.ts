// Uso: pnpm tsx scripts/verificar-catalogo.ts

import { CATALOGO_2026 } from '../src/data/valores-vigentes/catalogo';
import { evaluarVigencia } from '../src/data/valores-vigentes/vigencia';

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

console.log('\n✅ Catálogo completamente verificado y vigente.\n');

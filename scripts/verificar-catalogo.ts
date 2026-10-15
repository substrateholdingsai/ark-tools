// Uso: pnpm tsx scripts/verificar-catalogo.ts

import { CATALOGO_VALORES } from '../src/data/valores-vigentes/catalogo';
import { evaluarVigencia } from '../src/data/valores-vigentes/vigencia';

console.log('\n🔍 AUDITORÍA DEL CATÁLOGO DE VALORES FISCALES\n');
console.log('─'.repeat(80));

let proyecciones = 0;
let criticosVencidos = 0;

for (const v of CATALOGO_VALORES) {
  const r = evaluarVigencia(v);
  const flag = v.esProyeccion ? '⚠️  PROYECCIÓN' : '✅ OFICIAL';
  const estado = r.estado.toUpperCase().padEnd(15);

  console.log(`\n${flag}  |  ${estado}  |  ${v.id}`);
  console.log(`   Etiqueta:  ${v.etiqueta}`);
  console.log(`   Fuente:    ${v.fuente} — ${v.referencia}`);
  console.log(`   Vigencia:  ${v.vigenteDesde} → ${v.vigenteHasta ?? 'sin fin'}`);
  console.log(`   Estado:    ${r.mensaje}`);
  if (v.notas) console.log(`   Notas:     ${v.notas}`);

  if (v.esProyeccion) proyecciones++;
  if (r.estado === 'vencido' && v.criticidad === 'critico') criticosVencidos++;
}

console.log('\n' + '─'.repeat(80));
console.log(`\n📊 RESUMEN:`);
console.log(`   Total de valores:        ${CATALOGO_VALORES.length}`);
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
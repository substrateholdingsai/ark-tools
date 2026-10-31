/**
 * Motor Forense de Detección de Comportamientos Atípicos y Riesgos SAT.
 * Aplica criterios estadísticos (Benford, Z-Score, IQR, HHI) y fiscales (Art. 27 LISR, 29, 29-A, 69-B CFF).
 */

import type {
  CFDIExtraido,
  SATMetadataItem,
  HallazgoRiesgo,
  CriterioAtipicoConfig,
  CeldaMallaMes,
  ResumenConciliacionMetadata,
  NivelRiesgo,
} from '../types';

export const CRITERIOS_DEFAULT: CriterioAtipicoConfig[] = [
  {
    id: 'BENFORD_1',
    nombre: 'Prueba de Benford (Dígito Inicial)',
    descripcion: 'Desviación estadística en la frecuencia del primer dígito de los importes.',
    fundamento: 'Detección forense de alteración de importes o facturación artificial.',
    activo: true,
    umbral: 15, // Desviación porcentual máx permitida
  },
  {
    id: 'ZSCORE_MONTO',
    nombre: 'Puntaje Z en Montos Mensuales',
    descripcion: 'Meses con importes que superan 2 desviaciones estándar de la media anual.',
    fundamento: 'Criterio estándar del SAT de volatilidad atípica de ingresos/egresos.',
    activo: true,
    umbral: 2.0, // |Z| > 2
  },
  {
    id: 'FRACCIONAMIENTO_EFECTIVO',
    nombre: 'Fraccionamiento de Pagos en Efectivo',
    descripcion: 'Múltiples comprobantes en efectivo al mismo RFC en un mismo día < $2,000.',
    fundamento: 'Art. 27 Fracc. III LISR (Elusión del requisito de transferencia/cheque).',
    activo: true,
    umbral: 2000,
  },
  {
    id: 'EFECTIVO_EXCESO',
    nombre: 'Efectivo Superior a Límite Deducible ($2,000)',
    descripcion: 'Comprobantes pagados en efectivo (Forma 01) con importe mayor a $2,000 MXN.',
    fundamento: 'Art. 27 Fracc. III LISR (No deducibilidad directa de la erogación).',
    activo: true,
    umbral: 2000,
  },
  {
    id: 'DESFASE_TIMBRADO',
    nombre: 'Desfase Excesivo Emisión vs Timbrado (>72 hrs)',
    descripcion: 'Comprobantes timbrados más de 72 horas después de su fecha de emisión.',
    fundamento: 'Art. 39 Reglamento del CFF (Plazo improrrogable para entrega al PAC).',
    activo: true,
    umbral: 72, // Horas
  },
  {
    id: 'HORARIO_INHABIL',
    nombre: 'Emisión en Horario Atípico o Fin de Semana',
    descripcion: 'CFDIs timbrados en horario nocturno (23:00 - 05:00) o en días no laborables.',
    fundamento: 'Patrón usualmente correlacionado con automatizaciones no supervisadas.',
    activo: true,
    umbral: 5, // % mínimo del total de facturas para alertar
  },
  {
    id: 'PPD_SIN_REP',
    nombre: 'CFDI PPD sin Complemento de Pago (REP)',
    descripcion: 'Facturas emitidas con método PPD sin complemento de recepción de pago asociado.',
    fundamento: 'Regla 2.7.1.32 RMF (Riesgo de discrepancia en flujo de efectivo e IVA).',
    activo: true,
    umbral: 30, // Días de antigüedad
  },
  {
    id: 'CANCELADOS_METADATA',
    nombre: 'Discrepancia XML Vigente vs Cancelado en SAT',
    descripcion: 'Comprobante registrado localmente como vigente pero cancelado en Metadata SAT.',
    fundamento: 'Art. 29-A CFF (Deducción o acreditamiento indebido de comprobante sin efectos).',
    activo: true,
    umbral: 1, // Cualquier comprobante
  },
  {
    id: 'CANCELACION_EXTEMPORANEA',
    nombre: 'Cancelación Fuera de Plazo Legal (Art. 29-A CFF)',
    descripcion: 'Cancelaciones realizadas con posterioridad al ejercicio fiscal de emisión.',
    fundamento: 'Art. 29-A cuarto párrafo CFF y Regla 2.7.1.47 RMF.',
    activo: true,
    umbral: 0,
  },
  {
    id: 'EGRESOS_DESPROPORCIONADOS',
    nombre: 'Notas de Crédito (E) Desproporcionadas',
    descripcion:
      'Notas de crédito que superan el 30% del volumen emitido hacia la misma contraparte.',
    fundamento: 'Art. 25 Fracc. I LISR y criterios no vinculativos del SAT.',
    activo: true,
    umbral: 30, // Porcentaje
  },
  {
    id: 'CONCENTRACION_HHI',
    nombre: 'Alta Concentración de Clientes / Proveedores (HHI)',
    descripcion: 'Índice Herfindahl-Hirschman superior a 2,500 puntos (dependencia crítica).',
    fundamento: 'Evaluación de riesgo corporativo y materialidad de operaciones.',
    activo: true,
    umbral: 2500,
  },
  {
    id: 'LISTA_69B',
    nombre: 'Cruce con Listado Art. 69-B CFF (EFOS)',
    descripcion:
      'Operaciones con RFCs señalados en la presunción o definitividad de operaciones inexistentes.',
    fundamento: 'Art. 69-B del CFF (Pérdida de efectos fiscales de los comprobantes).',
    activo: true,
    umbral: 1,
  },
];

// RFCs de prueba 69-B oficiales o conocidos del listado del SAT
const EFOS_CONOCIDOS = new Set([
  'BMA0903117J0',
  'GCS1109015E7',
  'CON1208077P1',
  'SER1404106F3',
  'ASE1503209B2',
  'DIG130514AA1',
  'PRO1211158N5',
]);

export function calcularMallaMensual(
  cfdis: CFDIExtraido[],
  ejercicio: number
): { malla: CeldaMallaMes[]; promedioMensual: number; desviacionEstandar: number } {
  const nombresMeses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const meses: CeldaMallaMes[] = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    nombreMes: nombresMeses[i] || '',
    emitidos: { importe: 0, count: 0, canceladosCount: 0, canceladosImporte: 0 },
    recibidos: { importe: 0, count: 0, canceladosCount: 0, canceladosImporte: 0 },
    totalNeto: 0,
    zScoreImporte: 0,
    esAtipico: false,
  }));

  for (const cfdi of cfdis) {
    if (!cfdi.fechaEmision) continue;
    const d = new Date(cfdi.fechaEmision);
    if (isNaN(d.getTime())) continue;

    const cfdiYear = d.getFullYear();
    if (ejercicio && cfdiYear !== ejercicio) continue;

    const m = d.getMonth(); // 0..11
    const celda = meses[m];
    if (!celda) continue;
    const cancelado = cfdi.canceladoEnSAT;

    if (cfdi.clasificacion === 'EMITIDO') {
      if (cancelado) {
        celda.emitidos.canceladosCount++;
        celda.emitidos.canceladosImporte += cfdi.total;
      } else {
        celda.emitidos.count++;
        celda.emitidos.importe += cfdi.total;
      }
    } else {
      if (cancelado) {
        celda.recibidos.canceladosCount++;
        celda.recibidos.canceladosImporte += cfdi.total;
      } else {
        celda.recibidos.count++;
        celda.recibidos.importe += cfdi.total;
      }
    }

    if (!cancelado) {
      celda.totalNeto = celda.emitidos.importe - celda.recibidos.importe;
    }
  }

  // Estadísticas de importes emitidos
  const importes = meses.map((m) => m.emitidos.importe);
  const suma = importes.reduce((acc, v) => acc + v, 0);
  const promedio = suma / 12;

  const varianza = importes.reduce((acc, v) => acc + Math.pow(v - promedio, 2), 0) / 12;
  const desviacion = Math.sqrt(varianza);

  for (const celda of meses) {
    if (desviacion > 0) {
      celda.zScoreImporte = (celda.emitidos.importe - promedio) / desviacion;
      celda.esAtipico = Math.abs(celda.zScoreImporte) > 2.0;
    }
  }

  return { malla: meses, promedioMensual: promedio, desviacionEstandar: desviacion };
}

export function conciliarConMetadata(
  cfdis: CFDIExtraido[],
  metadata: SATMetadataItem[]
): ResumenConciliacionMetadata {
  const metaMap = new Map<string, SATMetadataItem>();
  for (const m of metadata) {
    metaMap.set(m.uuid.toUpperCase(), m);
  }

  const xmlMap = new Map<string, CFDIExtraido>();
  for (const c of cfdis) {
    xmlMap.set(c.uuid.toUpperCase(), c);
  }

  let canceladosEnSAT = 0;
  let vigentesAmbos = 0;
  let diferenciasMonto = 0;
  let cancelacionesExtemporaneas29A = 0;
  let canceladosConPagoRelacionado = 0;

  for (const [uuid, cfdi] of xmlMap.entries()) {
    const meta = metaMap.get(uuid);
    if (meta) {
      if (meta.estatus === '0') {
        canceladosEnSAT++;
        if (cfdi.tienePago || cfdi.cfdiRelacionados.length > 0) {
          canceladosConPagoRelacionado++;
        }
        if (meta.fechaCancelacion && cfdi.fechaEmision) {
          const yEmision = new Date(cfdi.fechaEmision).getFullYear();
          const yCancel = new Date(meta.fechaCancelacion).getFullYear();
          if (yCancel > yEmision) {
            cancelacionesExtemporaneas29A++;
          }
        }
      } else {
        vigentesAmbos++;
      }

      if (Math.abs(meta.monto - cfdi.total) > 0.05) {
        diferenciasMonto++;
      }
    }
  }

  let faltantesEnXML = 0;
  for (const [uuid] of metaMap.entries()) {
    if (!xmlMap.has(uuid)) {
      faltantesEnXML++;
    }
  }

  let huerfanosEnMetadata = 0;
  for (const [uuid] of xmlMap.entries()) {
    if (!metaMap.has(uuid)) {
      huerfanosEnMetadata++;
    }
  }

  return {
    totalXML: cfdis.length,
    totalMetadata: metadata.length,
    vigentesAmbos,
    canceladosEnSAT,
    faltantesEnXML,
    huerfanosEnMetadata,
    diferenciasMonto,
    cancelacionesExtemporaneas29A,
    canceladosConPagoRelacionado,
  };
}

export function evaluarCriteriosForense(
  cfdis: CFDIExtraido[],
  _metadata: SATMetadataItem[],
  criterios: CriterioAtipicoConfig[],
  ejercicio: number
): HallazgoRiesgo[] {
  const hallazgos: HallazgoRiesgo[] = [];
  const activo = (id: string) => criterios.find((c) => c.id === id)?.activo ?? true;

  // 1. Benford
  if (activo('BENFORD_1') && cfdis.length >= 20) {
    const digitosCount: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
    };
    let totalDigitos = 0;

    for (const c of cfdis) {
      if (c.total <= 0) continue;
      const primerChar = c.total.toString().replace(/[^1-9]/, '')[0];
      if (!primerChar) continue;
      const d = parseInt(primerChar, 10);
      if (d >= 1 && d <= 9) {
        digitosCount[d] = (digitosCount[d] || 0) + 1;
        totalDigitos++;
      }
    }

    if (totalDigitos >= 20) {
      const benfordEsperado: Record<number, number> = {
        1: 0.301,
        2: 0.176,
        3: 0.125,
        4: 0.097,
        5: 0.079,
        6: 0.067,
        7: 0.058,
        8: 0.051,
        9: 0.046,
      };

      let maxDesviacion = 0;
      let digitoDesviado = 1;

      for (let d = 1; d <= 9; d++) {
        const frecReal = (digitosCount[d] || 0) / totalDigitos;
        const frecEsp = benfordEsperado[d] || 0;
        const desv = Math.abs(frecReal - frecEsp) * 100;
        if (desv > maxDesviacion) {
          maxDesviacion = desv;
          digitoDesviado = d;
        }
      }

      if (maxDesviacion > 15) {
        hallazgos.push({
          id: 'H_BENFORD',
          criterioId: 'BENFORD_1',
          criterioNombre: 'Anomalía en Ley de Benford',
          descripcion: `Desviación del ${maxDesviacion.toFixed(1)}% en el primer dígito (${digitoDesviado}). La distribución natural de importes está alterada.`,
          periodo: `Ejercicio ${ejercicio}`,
          comprobantesUUIDs: cfdis.slice(0, 10).map((c) => c.uuid),
          importeInvolucrado: cfdis.reduce((acc, c) => acc + c.total, 0),
          probabilidad: 4,
          impacto: 3,
          nivelRiesgo: 'Alto',
          posibleConsecuenciaFiscal:
            'Presunción de facturación simulada o montos manipulados artificialmente bajo escrutinio del SAT.',
          recomendacion:
            'Verificar la autenticidad comercial y contractual de los comprobantes con importes recurrentes.',
          estatusSeguimiento: 'pendiente',
        });
      }
    }
  }

  // 2. Efectivo mayor a $2,000 MXN
  if (activo('EFECTIVO_EXCESO')) {
    const cfdisEfectivoExceso = cfdis.filter(
      (c) => c.formaPago === '01' && c.total > 2000 && !c.canceladoEnSAT
    );
    if (cfdisEfectivoExceso.length > 0) {
      const suma = cfdisEfectivoExceso.reduce((acc, c) => acc + c.total, 0);
      hallazgos.push({
        id: 'H_EFECTIVO_2000',
        criterioId: 'EFECTIVO_EXCESO',
        criterioNombre: 'Efectivo Superior a $2,000 MXN (Art. 27 LISR)',
        descripcion: `Se detectaron ${cfdisEfectivoExceso.length} comprobantes pagados en efectivo con montos mayores a $2,000.`,
        periodo: `Ejercicio ${ejercicio}`,
        comprobantesUUIDs: cfdisEfectivoExceso.map((c) => c.uuid),
        importeInvolucrado: suma,
        probabilidad: 5,
        impacto: 4,
        nivelRiesgo: 'Crítico',
        posibleConsecuenciaFiscal:
          'No deducibilidad directa del gasto e improcedencia del acreditamiento de IVA por Art. 27 Fracc. III LISR.',
        recomendacion:
          'Solicitar sustitución con forma de pago bancarizada (transferencia/cheque) o reclasificar como no deducible.',
        estatusSeguimiento: 'pendiente',
      });
    }
  }

  // 3. Fraccionamiento en efectivo (mismo día, mismo RFC, montos cercanos a $2,000)
  if (activo('FRACCIONAMIENTO_EFECTIVO')) {
    const grupos = new Map<string, CFDIExtraido[]>();
    for (const c of cfdis) {
      if (c.formaPago === '01' && c.total > 0 && c.total <= 2000 && !c.canceladoEnSAT) {
        const dia = c.fechaEmision.split('T')[0];
        const contraparte = c.clasificacion === 'EMITIDO' ? c.rfcReceptor : c.rfcEmisor;
        const key = `${dia}_${contraparte}`;
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key)!.push(c);
      }
    }

    const sospechosos: CFDIExtraido[] = [];
    for (const items of grupos.values()) {
      if (items.length >= 2) {
        const sumDia = items.reduce((a, b) => a + b.total, 0);
        if (sumDia > 2000) {
          sospechosos.push(...items);
        }
      }
    }

    if (sospechosos.length > 0) {
      const sumaTotal = sospechosos.reduce((a, b) => a + b.total, 0);
      hallazgos.push({
        id: 'H_FRACCIONAMIENTO',
        criterioId: 'FRACCIONAMIENTO_EFECTIVO',
        criterioNombre: 'Sospecha de Fraccionamiento de Efectivo',
        descripcion: `Se identificaron ${sospechosos.length} comprobantes divididos en el mismo día hacia la misma contraparte que en suma superan $2,000.`,
        periodo: `Ejercicio ${ejercicio}`,
        comprobantesUUIDs: sospechosos.map((c) => c.uuid),
        importeInvolucrado: sumaTotal,
        probabilidad: 4,
        impacto: 3,
        nivelRiesgo: 'Alto',
        posibleConsecuenciaFiscal:
          'Riesgo de reclasificación como elusión intencional del tope de deducción en efectivo por auditoría del SAT.',
        recomendacion:
          'Integrar contratos marco y justificar operativamente la multiplicidad de comprobantes menores.',
        estatusSeguimiento: 'pendiente',
      });
    }
  }

  // 4. Desfase Emisión vs Timbrado (>72 horas)
  if (activo('DESFASE_TIMBRADO')) {
    const desfasados = cfdis.filter((c) => {
      if (!c.fechaTimbrado || !c.fechaEmision) return false;
      const tEmi = new Date(c.fechaEmision).getTime();
      const tTim = new Date(c.fechaTimbrado).getTime();
      const diffHoras = (tTim - tEmi) / (1000 * 60 * 60);
      return diffHoras > 72;
    });

    if (desfasados.length > 0) {
      hallazgos.push({
        id: 'H_DESFASE_72H',
        criterioId: 'DESFASE_TIMBRADO',
        criterioNombre: 'Timbrado Posterior al Plazo de 72 Horas (Art. 39 RCFF)',
        descripcion: `${desfasados.length} facturas fueron timbradas con más de 72 horas de desfase respecto a su emisión.`,
        periodo: `Ejercicio ${ejercicio}`,
        comprobantesUUIDs: desfasados.map((c) => c.uuid),
        importeInvolucrado: desfasados.reduce((a, b) => a + b.total, 0),
        probabilidad: 4,
        impacto: 3,
        nivelRiesgo: 'Moderado',
        posibleConsecuenciaFiscal:
          'Infracción al Art. 83 Fracc. VII del CFF con multas por comprobante emitido fuera de plazo.',
        recomendacion:
          'Revisar la configuración horaria y sincronización de servidores del sistema de facturación.',
        estatusSeguimiento: 'pendiente',
      });
    }
  }

  // 5. Cancelados en Metadata SAT pero vivos en contabilidad
  if (activo('CANCELADOS_METADATA')) {
    const vivosCancelados = cfdis.filter((c) => c.canceladoEnSAT);
    if (vivosCancelados.length > 0) {
      hallazgos.push({
        id: 'H_CANCELADOS_SAT',
        criterioId: 'CANCELADOS_METADATA',
        criterioNombre: 'CFDI Cancelado en SAT con Registro Local Activo',
        descripcion: `${vivosCancelados.length} comprobantes aparecen con estatus CANCELADO ante el SAT pero estaban cargados como vigentes.`,
        periodo: `Ejercicio ${ejercicio}`,
        comprobantesUUIDs: vivosCancelados.map((c) => c.uuid),
        importeInvolucrado: vivosCancelados.reduce((a, b) => a + b.total, 0),
        probabilidad: 5,
        impacto: 5,
        nivelRiesgo: 'Crítico',
        posibleConsecuenciaFiscal:
          'Determinación de créditos fiscales, multas por deducción falsa y diferencias de IVA acreditable.',
        recomendacion:
          'Eliminar inmediatamente de la balanza contable y conciliar los papeles de trabajo con la Metadata SAT.',
        estatusSeguimiento: 'pendiente',
      });
    }
  }

  // 6. Cancelación Extemporánea (Art. 29-A CFF)
  if (activo('CANCELACION_EXTEMPORANEA')) {
    const extemp = cfdis.filter((c) => {
      if (!c.canceladoEnSAT || !c.fechaCancelacionSAT || !c.fechaEmision) return false;
      const yE = new Date(c.fechaEmision).getFullYear();
      const yC = new Date(c.fechaCancelacionSAT).getFullYear();
      return yC > yE;
    });

    if (extemp.length > 0) {
      hallazgos.push({
        id: 'H_EXTEMPORANEO_29A',
        criterioId: 'CANCELACION_EXTEMPORANEA',
        criterioNombre: 'Cancelación Extemporánea (Art. 29-A CFF)',
        descripcion: `${extemp.length} facturas fueron canceladas en ejercicios posteriores al de su emisión fiscal.`,
        periodo: `Ejercicio ${ejercicio}`,
        comprobantesUUIDs: extemp.map((c) => c.uuid),
        importeInvolucrado: extemp.reduce((a, b) => a + b.total, 0),
        probabilidad: 4,
        impacto: 4,
        nivelRiesgo: 'Alto',
        posibleConsecuenciaFiscal:
          'Rechazo de la cancelación por la autoridad y sanciones del 5% al 10% del monto de cada factura.',
        recomendacion:
          'Presentar declaraciones complementarias y fundamentar la justificación de la cancelación tardía.',
        estatusSeguimiento: 'pendiente',
      });
    }
  }

  // 7. Lista 69-B CFF
  if (activo('LISTA_69B')) {
    const involucrados69B = cfdis.filter(
      (c) => EFOS_CONOCIDOS.has(c.rfcEmisor) || EFOS_CONOCIDOS.has(c.rfcReceptor)
    );

    if (involucrados69B.length > 0) {
      hallazgos.push({
        id: 'H_LISTA_69B',
        criterioId: 'LISTA_69B',
        criterioNombre: 'Operaciones con Empresas Listadas en Art. 69-B (EFOS)',
        descripcion: `Se detectaron ${involucrados69B.length} comprobantes con contrapartes registradas en los listados del Art. 69-B CFF.`,
        periodo: `Ejercicio ${ejercicio}`,
        comprobantesUUIDs: involucrados69B.map((c) => c.uuid),
        importeInvolucrado: involucrados69B.reduce((a, b) => a + b.total, 0),
        probabilidad: 5,
        impacto: 5,
        nivelRiesgo: 'Crítico',
        posibleConsecuenciaFiscal:
          'Nulidad de efectos fiscales, requerimiento de autocorrección y riesgo penal bajo Art. 113 Bis CFF.',
        recomendacion:
          'Integrar de inmediato el expediente de materialidad (entregables, bitácoras) y valorar autocorrección dentro de los 30 días.',
        estatusSeguimiento: 'pendiente',
      });
    }
  }

  // 8. Concentración HHI de Proveedores / Clientes
  if (activo('CONCENTRACION_HHI') && cfdis.length >= 10) {
    const totalesPorContraparte = new Map<string, number>();
    let totalEmitido = 0;

    for (const c of cfdis) {
      if (c.clasificacion === 'EMITIDO' && !c.canceladoEnSAT) {
        totalesPorContraparte.set(
          c.rfcReceptor,
          (totalesPorContraparte.get(c.rfcReceptor) || 0) + c.total
        );
        totalEmitido += c.total;
      }
    }

    if (totalEmitido > 0) {
      let hhi = 0;
      let topRFC = '';
      let topPorcentaje = 0;

      for (const [rfc, monto] of totalesPorContraparte.entries()) {
        const share = (monto / totalEmitido) * 100;
        hhi += Math.pow(share, 2);
        if (share > topPorcentaje) {
          topPorcentaje = share;
          topRFC = rfc;
        }
      }

      if (hhi > 2500) {
        hallazgos.push({
          id: 'H_HHI_CONCENTRACION',
          criterioId: 'CONCENTRACION_HHI',
          criterioNombre: 'Alta Concentración de Ingresos (HHI > 2,500)',
          descripcion: `Índice HHI de ${Math.round(hhi)} puntos. El cliente ${topRFC} concentra el ${topPorcentaje.toFixed(1)}% de las ventas.`,
          periodo: `Ejercicio ${ejercicio}`,
          comprobantesUUIDs: [],
          importeInvolucrado: (totalEmitido * topPorcentaje) / 100,
          probabilidad: 3,
          impacto: 3,
          nivelRiesgo: 'Moderado',
          posibleConsecuenciaFiscal:
            'Vulnerabilidad operativa y foco de revisión por posible simulación de subordinación laboral o partes relacionadas.',
          recomendacion:
            'Evaluar diversificación y documentar precio de mercado / estudios de partes relacionadas.',
          estatusSeguimiento: 'pendiente',
        });
      }
    }
  }

  return hallazgos;
}

export function clasificarRiesgoMatriz(probabilidad: number, impacto: number): NivelRiesgo {
  const score = probabilidad * impacto;
  if (score >= 16) return 'Crítico';
  if (score >= 10) return 'Alto';
  if (score >= 5) return 'Moderado';
  return 'Bajo';
}

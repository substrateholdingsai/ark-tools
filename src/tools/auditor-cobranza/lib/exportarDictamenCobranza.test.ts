import { describe, it, expect } from 'vitest';
import { calcularDictamenCobranza } from './calcularDictamen';
import { generarTXT, generarCSV } from './exportarDictamenCobranza';

describe('exportarDictamenCobranza — Exportador TXT y CSV para Auditoría de Cobranza', () => {
  const dictamenEjemplo = calcularDictamenCobranza({
    cliente: 'Fintech Demo, S.A. de C.V.',
    revisor: 'C.P. Juan Pérez',
    fecha: '2026-10-14T12:00:00.000Z',
    notas: 'Auditoría especial de cartera vencida y call center.',
    respuestasComparadores: {
      '8.1': {
        estado: 'DIFIERE',
        nota: 'El contrato dice $8,500 y el CRM exige $12,000.',
      },
      '8.2': 'COINCIDE',
    },
    conductasDetectadas: ['6.1'],
  });

  it('genera reporte TXT completo con encabezados, notas y detalles', () => {
    const txt = generarTXT(dictamenEjemplo);

    expect(txt).toContain('DICTAMEN DE AUDITORÍA DE COBRANZA — ARK TOOLS');
    expect(txt).toContain('Cliente: Fintech Demo, S.A. de C.V.');
    expect(txt).toContain('Revisor: C.P. Juan Pérez');
    expect(txt).toContain('RESUMEN EJECUTIVO');
    expect(txt).toContain('Nivel de riesgo:       CRITICO');
    expect(txt).toContain('ALCANCE');
    expect(txt).toContain('NOTAS DEL AUDITOR');
    expect(txt).toContain('Auditoría especial de cartera vencida y call center.');
    expect(txt).toContain('DETALLES DEL DICTAMEN');
    expect(txt).toContain('El contrato dice $8,500 y el CRM exige $12,000.');
    expect(txt).toContain('RECOMENDACIONES');
    expect(txt).toContain('Generado por ARK TOOLS');
  });

  it('genera archivo CSV con BOM UTF-8 y estructura tabular', () => {
    const csv = generarCSV(dictamenEjemplo);

    // Debe comenzar con BOM UTF-8 para apertura directa en Excel
    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Encabezados
    expect(csv).toContain(
      'TIPO,CATEGORIA,ID,CODIGO,TITULO,ESTADO,RIESGO,PUNTOS,FUNDAMENTO,IMPACTO_CONTABLE,RECOMENDACION,NOTA'
    );

    // Filas de detalle
    expect(csv).toContain('8.1');
    expect(csv).toContain('"El contrato dice $8,500 y el CRM exige $12,000."');
    expect(csv).toContain('6.1');

    // Resumen
    expect(csv).toContain('RESUMEN');
    expect(csv).toContain('Nivel,CRITICO');
  });
});

import { describe, it, expect } from 'vitest';
import { generarBorrador } from './generarBorrador';
import { ACTOS_SAT, ACTOS_IMSS, GUIA_PASOS } from '@/data/actos';

describe('generarBorrador — Motor de Redacción Legal SAT / IMSS', () => {
  it('genera un borrador estructurado para un acto del SAT', () => {
    const acto = ACTOS_SAT[0]!; // Carta Invitación
    const paso = GUIA_PASOS[0]!; // Notificación
    const checklist = ['Captura fecha y hora de notificación', 'Verifica destinatario'];

    const resultado = generarBorrador({
      acto,
      paso,
      checklistActivo: checklist,
      avance: 25,
      fechaPersonalizada: '14 de octubre de 2026',
    });

    expect(resultado).toContain(`ASUNTO: Respuesta a ${acto.titulo} — Paso 1 Notificación`);
    expect(resultado).toContain('H. Autoridad Fiscal / IMSS');
    expect(resultado).toContain(`Fundamento de referencia: ${paso.fundamento}`);
    expect(resultado).toContain(`SAT — ${acto.titulo}`);
    expect(resultado).toContain(`Código interno: ${acto.codigo}`);
    expect(resultado).toContain(`Acción sugerida:\n${acto.accion}`.replace('Acción sugerida:\n', '4. ACCIÓN SUGERIDA\n'));
    expect(resultado).toContain('   - Captura fecha y hora de notificación');
    expect(resultado).toContain('   - Verifica destinatario');
    expect(resultado).toContain('Fecha de preparación: 14 de octubre de 2026');
    expect(resultado).toContain('Avance de guía ARK: 25%');
  });

  it('incluye mensaje por defecto cuando el checklist operativo está vacío', () => {
    const acto = ACTOS_IMSS[0]!; // Exhorto IMSS
    const paso = GUIA_PASOS[1]!; // Validez

    const resultado = generarBorrador({
      acto,
      paso,
      checklistActivo: [],
      avance: 0,
    });

    expect(resultado).toContain('Pendiente de completar checklist operativo.');
    expect(resultado).toContain(`IMSS — ${acto.titulo}`);
    expect(resultado).toContain('Avance de guía ARK: 0%');
  });

  it('respeta las 6 secciones clave de respuesta', () => {
    const borrador = generarBorrador({
      acto: ACTOS_SAT[1]!,
      paso: GUIA_PASOS[2]!,
      checklistActivo: ['Item 1'],
      avance: 50,
    });

    expect(borrador).toContain('1. VALIDEZ');
    expect(borrador).toContain('2. CLASIFICACIÓN');
    expect(borrador).toContain('3. ANÁLISIS');
    expect(borrador).toContain('4. ACCIÓN SUGERIDA');
    expect(borrador).toContain('5. CHECKLIST OPERATIVO');
    expect(borrador).toContain('6. PRUEBAS');
  });
});

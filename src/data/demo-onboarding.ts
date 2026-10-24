/**
 * ARK LEDGER — Datos de Demostración para Onboarding y Quickstart (Aha! Moment)
 *
 * Entidades canónicas precargadas para que el usuario experimente el valor
 * del Expediente Único y los Papeles de Trabajo SHA-256 en menos de 60 segundos
 * sin tener que ingresar datos fiscales reales.
 *
 * Cumple con las reglas del repositorio: valores fiscales derivados del catálogo oficial.
 */

import type { ClientRecord, ExpedienteRecord } from '@/lib/apiClient';
import { VALORES_POR_ID } from '@/data/valores-vigentes/catalogo';

const smgVal = VALORES_POR_ID.get('SALARIO_MINIMO_GENERAL_2026')?.valor;
const salarioMinimoGeneral = typeof smgVal === 'number' ? smgVal : 315.04;

/** Salario diario base de demostración (1.6 veces el SMG vigente DOF) */
const SALARIO_DIARIO_DEMO = Math.round(salarioMinimoGeneral * 1.6 * 100) / 100;
/** Factor de integración para 3 años de antigüedad (15 días aguinaldo + 16 días vacaciones * 25% prima) */
const FACTOR_INTEGRACION_DEMO = 1.0521;
const SALARIO_INTEGRADO_DEMO =
  Math.round(SALARIO_DIARIO_DEMO * FACTOR_INTEGRACION_DEMO * 100) / 100;

export const DEMO_CLIENT_EMPRESA_ID = 'demo-empresa-innovacion-2026';
export const DEMO_CLIENT_TRABAJADOR_ID = 'demo-trabajador-carlos-2026';

export const DEMO_EMPRESA: ClientRecord = {
  id: DEMO_CLIENT_EMPRESA_ID,
  tenant_id: 'tenant-demo-sandbox',
  user_id: 'user-demo',
  parent_id: null,
  tipo: 'empresa',
  nombre: 'Innovación y Servicios Contables S.A. de C.V.',
  rfc: 'ISC200101AB1',
  curp: null,
  nss: null,
  salario_diario: 0,
  salario_diario_integrado: 0,
  fecha_ingreso: null,
  factor_integracion: 1,
  estado: 'activo',
  metadata: {
    is_demo: true,
    regimen: 'Régimen General de Ley Personas Morales (601)',
    entidad: 'Ciudad de México',
    tasa_isn: 0.03,
  },
  created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
};

export const DEMO_TRABAJADOR: ClientRecord = {
  id: DEMO_CLIENT_TRABAJADOR_ID,
  tenant_id: 'tenant-demo-sandbox',
  user_id: 'user-demo',
  parent_id: DEMO_CLIENT_EMPRESA_ID,
  tipo: 'trabajador',
  nombre: 'Carlos Mendoza Morales',
  rfc: 'MEMC880512XYZ',
  curp: 'MEMC880512HDFRRN01',
  nss: '12948576023',
  salario_diario: SALARIO_DIARIO_DEMO,
  salario_diario_integrado: SALARIO_INTEGRADO_DEMO,
  fecha_ingreso: '2023-01-16',
  factor_integracion: FACTOR_INTEGRACION_DEMO,
  estado: 'activo',
  metadata: {
    is_demo: true,
    puesto: 'Especialista Contable Jr.',
    departamento: 'Auditoría',
    jornada: 'Diurna',
  },
  created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
};

export const DEMO_EXPEDIENTE_EJEMPLO: ExpedienteRecord = {
  id: 'exp-demo-001',
  tenant_id: 'tenant-demo-sandbox',
  client_id: DEMO_CLIENT_TRABAJADOR_ID,
  tool_id: 'nomina',
  titulo: 'Cálculo Quincenal Nómina Ordinaria',
  input_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  inputs: {
    salarioDiario: SALARIO_DIARIO_DEMO,
    diasTrabajados: 15,
    periodicidad: 'quincenal',
    zona: 'general',
  },
  outputs: {
    percepciones: SALARIO_DIARIO_DEMO * 15,
    isrRetenido: 512.4,
    imssObrero: 198.75,
    netoPagar: SALARIO_DIARIO_DEMO * 15 - 512.4 - 198.75,
  },
  catalog_version: 'DOF-2026-RMF-ANEXO8',
  created_by: 'user-demo',
  created_at: new Date().toISOString(),
};

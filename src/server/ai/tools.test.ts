import { describe, it, expect, vi } from 'vitest';
import { executeAiTool, AI_TOOLS_CATALOG } from './tools';
import type { Env } from '../../index';

describe('Workers AI — Tools Catalog & Executor', () => {
  it('tiene definidas las herramientas esenciales con sus esquemas', () => {
    const toolNames = AI_TOOLS_CATALOG.map((t) => t.name);
    expect(toolNames).toContain('consultar_progreso_guia');
    expect(toolNames).toContain('consultar_auditoria_ledger');
    expect(toolNames).toContain('consultar_watchlist_activos');
    expect(toolNames).toContain('obtener_info_despacho');

    for (const tool of AI_TOOLS_CATALOG) {
      expect(tool.description).toBeTruthy();
      expect(tool.parameters.type).toBe('object');
    }
  });

  it('retorna error amigable si D1 no está configurado', async () => {
    const mockEnv = {} as Env;
    const res = await executeAiTool('consultar_progreso_guia', {}, mockEnv, 'tenant_123');
    expect(res.success).toBe(false);
    expect(res.error).toContain('D1');
  });

  it('retorna error para herramientas inexistentes', async () => {
    const mockDb = {
      prepare: vi.fn(),
    } as unknown as D1Database;
    const mockEnv = { ARK_TOOLS_DB: mockDb } as Env;

    const res = await executeAiTool('herramienta_fantasma', {}, mockEnv, 'tenant_123');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Herramienta desconocida');
  });

  it('ejecuta consultar_progreso_guia vinculando siempre el tenant_id', async () => {
    const mockAll = vi.fn().mockResolvedValue({
      results: [{ step_id: 1, draft_text: 'Borrador test', updated_at: '2026-10-15' }],
    });
    const mockBind = vi.fn().mockReturnValue({ all: mockAll });
    const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });

    const mockDb = { prepare: mockPrepare } as unknown as D1Database;
    const mockEnv = { ARK_TOOLS_DB: mockDb } as Env;

    const res = await executeAiTool('consultar_progreso_guia', {}, mockEnv, 'tenant_abc');

    expect(res.success).toBe(true);
    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining('FROM guia_progress WHERE tenant_id = ?')
    );
    expect(mockBind).toHaveBeenCalledWith('tenant_abc');
    expect(res.data).toEqual([
      { step_id: 1, draft_text: 'Borrador test', updated_at: '2026-10-15' },
    ]);
  });

  it('ejecuta consultar_auditoria_ledger con caso_id y límite', async () => {
    const mockAll = vi.fn().mockResolvedValue({
      results: [{ id: 1, caso_id: 'CASO-01', estado: 'BLOQUEADO' }],
    });
    const mockBind = vi.fn().mockReturnValue({ all: mockAll });
    const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });

    const mockDb = { prepare: mockPrepare } as unknown as D1Database;
    const mockEnv = { ARK_TOOLS_DB: mockDb } as Env;

    const res = await executeAiTool(
      'consultar_auditoria_ledger',
      { caso_id: 'CASO-01', limit: 5 },
      mockEnv,
      'tenant_test'
    );

    expect(res.success).toBe(true);
    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining('FROM arkangel_ledger WHERE tenant_id = ? AND caso_id = ?')
    );
    expect(mockBind).toHaveBeenCalledWith('tenant_test', 'CASO-01', 5);
  });

  it('ejecuta calcular_finiquito_lft sin requerir conexión a D1', async () => {
    const mockEnv = {} as Env; // sin DB

    const res = await executeAiTool(
      'calcular_finiquito_lft',
      {
        tipoBaja: 'finiquito',
        fechaIngreso: '2025-01-01',
        fechaBaja: '2025-12-31',
        salarioDiario: 500,
        sdi: 525,
      },
      mockEnv,
      'tenant_test'
    );

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    const data = res.data as any;
    expect(data.totalFiniquito).toBeGreaterThan(0);
    expect(data.importeAguinaldo).toBe(7500); // 15 días * $500
  });

  it('ejecuta calcular_resico sin requerir conexión a D1', async () => {
    const mockEnv = {} as Env;

    const res = await executeAiTool(
      'calcular_resico',
      {
        tipoPersona: 'fisica',
        ingresosCobrados: 50000,
        retencionISR: 500,
        ivaCobrado: 8000,
        ivaAcreditable: 3000,
        mes: 3,
      },
      mockEnv,
      'tenant_test'
    );

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    const data = res.data as any;
    expect(data.tipoPersona).toBe('fisica');
    expect(data.tasaISRPct).toBe(1.1); // hasta 50,000 -> 1.1% = 550
    expect(data.isrCausado).toBe(550);
    expect(data.isrNetoPagar).toBe(50); // 550 - 500
    expect(data.ivaNetoPagar).toBe(5000); // 8000 - 3000
    expect(data.totalImpuestosPagar).toBe(5050);
  });

  it('ejecuta consultar_leads_crm retornando métricas y prospectos filtrados', async () => {
    const mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(async () => {
          if (query.includes('COUNT(*) AS total')) return { total: 45 };
          return null;
        }),
        all: vi.fn(async () => {
          if (query.includes('GROUP BY status')) {
            return {
              results: [
                { status: 'Nuevo', count: 30 },
                { status: 'WhatsApp_enviado', count: 15 },
              ],
            };
          }
          if (query.includes('GROUP BY ciudad')) {
            return {
              results: [
                { ciudad: 'Merida', count: 25 },
                { ciudad: 'Metropolitana', count: 20 },
              ],
            };
          }
          if (query.includes('FROM leads_ark_tools')) {
            return {
              results: [
                {
                  id: 'lead-101',
                  web: 'https://despachomerida.mx',
                  contacto_nombre: 'CP Garcia',
                  ciudad: 'Merida',
                  status: 'Nuevo',
                },
              ],
            };
          }
          return { results: [] };
        }),
      })),
    } as unknown as D1Database;

    const mockEnv = { ARK_TOOLS_DB: mockDb } as Env;

    const res = await executeAiTool(
      'consultar_leads_crm',
      { ciudad: 'Merida', status: 'Nuevo', limit: 5 },
      mockEnv,
      'ark'
    );

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    const data = res.data as any;
    expect(data.total_leads).toBe(45);
    expect(data.por_status).toHaveLength(2);
    expect(data.por_ciudad).toHaveLength(2);
    expect(data.prospectos).toHaveLength(1);
    expect(data.prospectos[0].id).toBe('lead-101');
    expect(data.filtros_aplicados.ciudad).toBe('Merida');
  });

  it('ejecuta consultar_alertas_regulatorias consultando sentinela_events en D1', async () => {
    const mockDb = {
      prepare: vi.fn().mockImplementation((_query: string) => ({
        bind: vi.fn().mockImplementation((..._binds: any[]) => ({
          all: vi.fn().mockResolvedValue({
            results: [
              {
                id: 'reg_dof_123',
                channel: 'fiscal',
                source: 'Diario Oficial de la Federación',
                source_url: 'https://dof.gob.mx/test',
                severity: 'critico',
                title: 'Reforma Fiscal DOF 2026',
                summary: 'Actualización urgente de tasas',
                effective_date: '2026-11-01',
                laws_affected: JSON.stringify(['CFF Art. 29-A']),
                action_required: 'Revisar sistemas',
                created_at: '2026-10-31 12:00:00',
                read_status: 0,
              },
            ],
          }),
        })),
      })),
    } as unknown as D1Database;

    const mockEnv = { ARK_TOOLS_DB: mockDb } as Env;

    const res = await executeAiTool(
      'consultar_alertas_regulatorias',
      { canal: 'fiscal', severidad: 'critico', limite: 5 },
      mockEnv,
      'ark'
    );

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    const data = res.data as any;
    expect(data.total).toBe(1);
    expect(data.filtro_canal).toBe('fiscal');
    expect(data.filtro_severidad).toBe('critico');
    expect(data.alertas[0].id).toBe('reg_dof_123');
    expect(data.alertas[0].leyes_afectadas).toEqual(['CFF Art. 29-A']);
    expect(data.alertas[0].titulo).toBe('Reforma Fiscal DOF 2026');
  });
});

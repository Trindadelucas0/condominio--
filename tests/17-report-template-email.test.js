const { renderReportEmailHtml } = require('../src/services/reports/reportEmailTemplateService');

const basePayload = {
  reportType: 'DAILY',
  condominiumName: 'Cond Teste',
  generatedAt: new Date().toISOString(),
  period: { startDate: '2026-03-01', endDate: '2026-03-01' },
  daily: {
    period: { startDate: '2026-03-01', endDate: '2026-03-01' },
    date: '2026-03-01',
    entries: 1000,
    exits: 500,
    balance: 500,
    maintenances: { pendentes: 2, emAndamento: 1, concluidas: 0 },
    categories: [{ category: 'Limpeza', total: 200 }],
  },
};

async function run(runner) {
  runner.logInfo('Testes do template HTML de relatório (preferências)...');

  await runner.test('HTML omite resumo financeiro quando include_financial false', async () => {
    const html = renderReportEmailHtml({
      payload: basePayload,
      insight: { enabled: false, reason: 'NOT_REQUIRED' },
      reportLayout: {
        includeFinancial: false,
        includeMaintenance: true,
        includeCharts: false,
        includeAiInsights: false,
      },
    });
    if (html.includes('Resumo financeiro')) {
      throw new Error('Não deveria conter título Resumo financeiro');
    }
    if (!html.includes('Manutenções no período')) {
      throw new Error('Deveria exibir bloco de manutenções');
    }
  });

  await runner.test('HTML contém análise IA quando include_ai_insights true e insight habilitado', async () => {
    const html = renderReportEmailHtml({
      payload: basePayload,
      insight: {
        enabled: true,
        source: 'IA',
        data: {
          executive_summary: 'Teste.',
          top_insights: ['a', 'b', 'c'],
          risks: ['r1', 'r2', 'r3'],
          recommended_actions: ['x', 'y', 'z'],
          confidence: 80,
        },
      },
      reportLayout: {
        includeFinancial: true,
        includeMaintenance: true,
        includeCharts: false,
        includeAiInsights: true,
      },
    });
    if (!html.includes('Análise IA') || !html.includes('Teste.')) {
      throw new Error('Bloco IA esperado');
    }
  });
}

module.exports = { run };

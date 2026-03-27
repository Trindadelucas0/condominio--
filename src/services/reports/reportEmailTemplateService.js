/** Paleta alinhada a public/css/design-system.css (primário #2CB930, cinzas) */
const DS = {
  primary: '#22a329',
  primaryLight: '#dcfce7',
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  danger: '#dc2626',
  success: '#16a34a',
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const escapeHtml = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const card = (label, value, valueColor = DS.gray900) => `
  <div style="background:#ffffff;border:1px solid ${DS.gray200};border-radius:12px;padding:14px 16px;min-width:160px;flex:1;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
    <div style="font-size:11px;color:${DS.gray500};margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${escapeHtml(label)}</div>
    <div style="font-size:20px;font-weight:700;color:${valueColor};line-height:1.2;">${escapeHtml(value)}</div>
  </div>
`;

const listItems = (items = []) => {
  if (!items.length) return '<li>Sem dados disponíveis.</li>';
  return items.map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join('');
};

const renderDailyDetails = (payload, layout) => {
  const daily = payload.daily;
  const periodLabel =
    daily?.period?.startDate && daily?.period?.endDate
      ? `${daily.period.startDate} até ${daily.period.endDate}`
      : daily?.date || '-';
  const maintenance = daily?.maintenances || {};
  const categories = (daily?.categories || [])
    .map(
      (item) =>
        `<tr><td style="padding:10px 12px;border-bottom:1px solid ${DS.gray200};">${escapeHtml(item.category)}</td><td style="padding:10px 12px;border-bottom:1px solid ${DS.gray200};text-align:right;font-weight:600;color:${DS.gray900};">${escapeHtml(formatCurrency(item.total))}</td></tr>`
    )
    .join('');

  const maintLine =
    layout.includeMaintenance &&
    `<p style="margin:0 0 12px;color:${DS.gray700};font-size:14px;line-height:1.5;">Manutenções: <strong>${maintenance.pendentes || 0}</strong> pendentes, <strong>${maintenance.emAndamento || 0}</strong> em andamento, <strong>${maintenance.concluidas || 0}</strong> concluídas.</p>`;

  const tableBlock =
    layout.includeFinancial &&
    `
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid ${DS.gray200};border-radius:12px;overflow:hidden;">
      <thead><tr style="background:${DS.gray50};"><th style="text-align:left;padding:12px 14px;font-size:12px;color:${DS.gray500};text-transform:uppercase;">Categoria</th><th style="text-align:right;padding:12px 14px;font-size:12px;color:${DS.gray500};text-transform:uppercase;">Total</th></tr></thead>
      <tbody>${categories || `<tr><td colspan="2" style="padding:14px;color:${DS.gray500};">Sem categorias no período.</td></tr>`}</tbody>
    </table>`;

  if (!layout.includeFinancial && !layout.includeMaintenance) {
    return `
    <div style="margin-top:20px;padding:16px;background:${DS.gray50};border-radius:12px;border:1px solid ${DS.gray200};">
      <p style="margin:0;color:${DS.gray700};font-size:14px;">Nenhum detalhe de período exibido (conforme preferências do relatório).</p>
    </div>`;
  }

  return `
    <h3 style="margin:24px 0 12px;color:${DS.gray900};font-size:17px;font-weight:700;">Detalhes do período (${escapeHtml(periodLabel)})</h3>
    ${maintLine || ''}
    ${tableBlock || ''}
  `;
};

const renderWeeklyDetails = (payload, layout) => {
  if (!layout.includeFinancial) {
    return `
    <div style="margin-top:20px;padding:16px;background:${DS.gray50};border-radius:12px;border:1px solid ${DS.gray200};">
      <p style="margin:0 0 8px;color:${DS.gray700};font-size:14px;"><strong>Período:</strong> ${escapeHtml(payload.weekly?.period?.startDate)} até ${escapeHtml(payload.weekly?.period?.endDate)}</p>
      <p style="margin:0;color:${DS.gray500};font-size:13px;">A série diária de valores foi omitida conforme preferências.</p>
    </div>`;
  }

  const rows = (payload.weekly?.days || [])
    .map(
      (day) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.gray200};">${escapeHtml(day.date)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.gray200};text-align:right;">${escapeHtml(formatCurrency(day.entries))}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.gray200};text-align:right;">${escapeHtml(formatCurrency(day.exits))}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${DS.gray200};text-align:right;font-weight:600;">${escapeHtml(formatCurrency(day.balance))}</td>
      </tr>`
    )
    .join('');

  return `
    <h3 style="margin:24px 0 12px;color:${DS.gray900};font-size:17px;font-weight:700;">Série diária</h3>
    <p style="margin:0 0 12px;color:${DS.gray700};font-size:14px;">${escapeHtml(payload.weekly?.period?.startDate)} até ${escapeHtml(payload.weekly?.period?.endDate)}</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid ${DS.gray200};border-radius:12px;overflow:hidden;">
      <thead><tr style="background:${DS.gray50};">
        <th style="text-align:left;padding:12px 14px;font-size:12px;color:${DS.gray500};text-transform:uppercase;">Data</th>
        <th style="text-align:right;padding:12px 14px;font-size:12px;color:${DS.gray500};text-transform:uppercase;">Entradas</th>
        <th style="text-align:right;padding:12px 14px;font-size:12px;color:${DS.gray500};text-transform:uppercase;">Saídas</th>
        <th style="text-align:right;padding:12px 14px;font-size:12px;color:${DS.gray500};text-transform:uppercase;">Saldo</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="4" style="padding:14px;color:${DS.gray500};">Sem dados no período.</td></tr>`}</tbody>
    </table>
  `;
};

const defaultLayout = () => ({
  includeFinancial: true,
  includeMaintenance: true,
  includeCharts: true,
  includeAiInsights: true,
});

const renderReportEmailHtml = ({
  payload,
  insight,
  chart = null,
  timezone = 'America/Sao_Paulo',
  reportLayout = null,
}) => {
  const layout = { ...defaultLayout(), ...(reportLayout || {}) };
  const isWeekly = payload.reportType === 'WEEKLY';
  const metrics = isWeekly ? payload.weekly?.totals || {} : payload.daily || {};
  const balanceVal = Number(metrics.balance || 0);
  const balanceColor = balanceVal >= 0 ? DS.success : DS.danger;

  const showAiSection = layout.includeAiInsights;
  const insightData = showAiSection && insight?.enabled ? insight.data || {} : null;
  const periodLabel = payload?.period
    ? `${payload.period.startDate} até ${payload.period.endDate}`
    : '-';
  const insightSource = insight?.source === 'LOCAL_FALLBACK' ? 'Fallback local' : 'IA (Gemini)';
  const sourceBg = insight?.source === 'LOCAL_FALLBACK' ? '#fef3c7' : DS.primaryLight;
  const sourceColor = insight?.source === 'LOCAL_FALLBACK' ? '#92400e' : '#166534';

  const appUrl = String(process.env.APP_URL || process.env.PUBLIC_URL || '').replace(/\/$/, '');
  const appLink = appUrl
    ? `<p style="margin:16px 0 0;text-align:center;"><a href="${escapeHtml(appUrl)}" style="display:inline-block;color:${DS.primary};font-weight:600;font-size:14px;text-decoration:none;">Abrir sistema</a></p>`
    : '';

  const financialBlock =
    layout.includeFinancial &&
    `
        <div>
          <h2 style="margin:0 0 14px;color:${DS.gray900};font-size:18px;font-weight:700;">Resumo financeiro</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${card('Entradas', formatCurrency(metrics.entries))}
            ${card('Saídas', formatCurrency(metrics.exits))}
            ${card('Saldo', formatCurrency(metrics.balance), balanceColor)}
            ${
              isWeekly
                ? card('Dias no período', String(payload.weekly?.days?.length || 0))
                : layout.includeMaintenance
                  ? card('Manutenções pendentes', String(payload.daily?.maintenances?.pendentes || 0))
                  : ''
            }
          </div>
        </div>`;

  const maintenanceOnlyBlock =
    !layout.includeFinancial &&
    layout.includeMaintenance &&
    !isWeekly &&
    `
        <div>
          <h2 style="margin:0 0 14px;color:${DS.gray900};font-size:18px;font-weight:700;">Manutenções no período</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${card('Pendentes', String(payload.daily?.maintenances?.pendentes || 0))}
            ${card('Em andamento', String(payload.daily?.maintenances?.emAndamento || 0))}
            ${card('Concluídas', String(payload.daily?.maintenances?.concluidas || 0))}
          </div>
        </div>`;

  const chartBlock =
    layout.includeCharts &&
    chart?.dataUri &&
    `<div style="margin-top:18px;background:${DS.gray50};border:1px solid ${DS.gray200};border-radius:12px;padding:14px;">
                <div style="font-size:13px;color:${DS.gray800};margin:0 0 10px;font-weight:700;">${escapeHtml(chart.title || 'Gráfico')}</div>
                <img alt="${escapeHtml(chart.alt || 'grafico')}" src="${chart.dataUri}" style="width:100%;border-radius:10px;display:block;"/>
              </div>`;

  const aiBlock = showAiSection
    ? `<div style="margin-top:22px;padding:16px;border:1px solid ${DS.primaryLight};background:linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);border-radius:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <h3 style="margin:0;color:${DS.gray900};font-size:16px;font-weight:700;">Análise IA</h3>
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:${sourceBg};color:${sourceColor};">
              Origem: ${insightData ? insightSource : insight?.reason === 'DISABLED_BY_PREFERENCE' ? 'Desativada' : 'Sem análise'}
            </span>
          </div>
          ${
            insightData
              ? `
                <p style="margin:0 0 10px;color:${DS.gray800};line-height:1.5;font-size:14px;">${escapeHtml(insightData.executive_summary || 'Sem resumo da IA.')}</p>
                <p style="margin:0 0 10px;color:${DS.gray700};font-size:13px;"><strong>Confiança:</strong> ${escapeHtml(String(insightData.confidence ?? 0))}%</p>
                <strong style="display:block;margin-top:10px;color:${DS.primary};font-size:13px;">Principais insights</strong>
                <ul style="margin:8px 0 0;padding-left:20px;color:${DS.gray800};line-height:1.5;font-size:14px;">${listItems(insightData.top_insights)}</ul>
                <strong style="display:block;margin-top:12px;color:${DS.primary};font-size:13px;">Riscos</strong>
                <ul style="margin:8px 0 0;padding-left:20px;color:${DS.gray800};line-height:1.5;font-size:14px;">${listItems(insightData.risks)}</ul>
                <strong style="display:block;margin-top:12px;color:${DS.primary};font-size:13px;">Ações recomendadas</strong>
                <ul style="margin:8px 0 0;padding-left:20px;color:${DS.gray800};line-height:1.5;font-size:14px;">${listItems(insightData.recommended_actions)}</ul>
              `
              : `<p style="margin:0;color:${DS.gray700};font-size:14px;">${
                  insight?.reason === 'DISABLED_BY_PREFERENCE'
                    ? 'Nesta configuração, a análise por IA está desativada.'
                    : 'Não foi possível gerar análise para este relatório.'
                }</p>`
          }
        </div>`
    : `<div style="margin-top:18px;padding:12px 14px;background:${DS.gray50};border-radius:12px;border:1px solid ${DS.gray200};">
          <p style="margin:0;color:${DS.gray500};font-size:13px;">A análise por IA está desativada nas preferências deste condomínio.</p>
        </div>`;

  return `
  <div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:${DS.gray50};padding:24px 12px;">
    <div style="max-width:960px;margin:0 auto;background:#ffffff;border-radius:16px;padding:0;border:1px solid ${DS.gray200};overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.08);">
      <div style="height:4px;background:linear-gradient(90deg,${DS.primary} 0%,#16a34a 100%);"></div>
      <div style="background:linear-gradient(180deg,${DS.gray900} 0%,#1f2937 100%);padding:22px 24px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="display:inline-block;background:rgba(255,255,255,0.12);color:#e5e7eb;font-size:11px;padding:5px 10px;border-radius:999px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">
              Relatório ${isWeekly ? 'Semanal' : 'Diário'}
            </div>
            <h1 style="margin:0;color:#f9fafb;font-size:26px;line-height:1.25;font-weight:800;">${escapeHtml(payload.condominiumName)}</h1>
            <p style="margin:10px 0 0;color:#d1d5db;font-size:14px;">Período: <strong style="color:#fff;">${escapeHtml(periodLabel)}</strong></p>
          </div>
          <div style="text-align:right;color:#9ca3af;font-size:12px;line-height:1.6;">
            <div>Gerado em ${escapeHtml(new Date(payload.generatedAt).toLocaleString('pt-BR'))}</div>
            <div>Timezone: ${escapeHtml(timezone)}</div>
          </div>
        </div>
      </div>

      <div style="padding:22px 24px;">
        ${financialBlock || ''}
        ${maintenanceOnlyBlock || ''}

        ${chartBlock || ''}

        ${isWeekly ? renderWeeklyDetails(payload, layout) : renderDailyDetails(payload, layout)}

        ${aiBlock}
        ${appLink}

        <p style="margin:18px 0 0;color:${DS.gray500};font-size:12px;text-align:center;">
          Este email foi gerado automaticamente pelo sistema de gestão condominial.
        </p>
      </div>
    </div>
  </div>`;
};

module.exports = {
  renderReportEmailHtml,
};

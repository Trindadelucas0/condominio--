const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const escapeHtml = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const card = (label, value) => `
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;min-width:160px;">
    <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">${escapeHtml(label)}</div>
    <div style="font-size:18px;font-weight:700;color:#111827;">${escapeHtml(value)}</div>
  </div>
`;

const listItems = (items = []) => {
  if (!items.length) return '<li>Sem dados disponíveis.</li>';
  return items.map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join('');
};

const renderDailyDetails = (payload) => {
  const daily = payload.daily;
  const maintenance = daily?.maintenances || {};
  const categories = (daily?.categories || [])
    .map((item) => `<tr><td style="padding:6px 0;">${escapeHtml(item.category)}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(formatCurrency(item.total))}</td></tr>`)
    .join('');

  return `
    <h3 style="margin:20px 0 10px;color:#111827;">Detalhes do dia (${escapeHtml(daily?.date)})</h3>
    <p style="margin:0 0 8px;color:#374151;">Manutenções: ${maintenance.pendentes || 0} pendentes, ${maintenance.emAndamento || 0} em andamento, ${maintenance.concluidas || 0} concluídas.</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:10px;">
      <thead><tr><th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Categoria</th><th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;">Total</th></tr></thead>
      <tbody>${categories || '<tr><td colspan="2" style="padding:10px;color:#6b7280;">Sem categorias no período.</td></tr>'}</tbody>
    </table>
  `;
};

const renderWeeklyDetails = (payload) => {
  const rows = (payload.weekly?.days || [])
    .map(
      (day) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(day.date)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCurrency(day.entries))}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCurrency(day.exits))}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCurrency(day.balance))}</td>
      </tr>`
    )
    .join('');

  return `
    <h3 style="margin:20px 0 10px;color:#111827;">Período semanal</h3>
    <p style="margin:0 0 8px;color:#374151;">${escapeHtml(payload.weekly?.period?.startDate)} até ${escapeHtml(payload.weekly?.period?.endDate)}</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:10px;">
      <thead><tr>
        <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e7eb;">Data</th>
        <th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;">Entradas</th>
        <th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;">Saídas</th>
        <th style="text-align:right;padding:10px;border-bottom:1px solid #e5e7eb;">Saldo</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="padding:10px;color:#6b7280;">Sem dados no período.</td></tr>'}</tbody>
    </table>
  `;
};

const renderReportEmailHtml = ({ payload, insight, chart = null, timezone = 'America/Sao_Paulo' }) => {
  const isWeekly = payload.reportType === 'WEEKLY';
  const metrics = isWeekly ? payload.weekly?.totals || {} : payload.daily || {};
  const insightData = insight?.enabled ? insight.data || {} : null;

  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#f3f4f6;padding:24px;">
    <div style="max-width:960px;margin:0 auto;background:#ffffff;border-radius:16px;padding:20px;border:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <h1 style="margin:0;color:#111827;">Relatório ${isWeekly ? 'Semanal' : 'Diário'}</h1>
          <p style="margin:6px 0 0;color:#4b5563;">${escapeHtml(payload.condominiumName)}</p>
        </div>
        <div style="text-align:right;color:#6b7280;font-size:12px;">
          <div>Gerado em ${escapeHtml(new Date(payload.generatedAt).toLocaleString('pt-BR'))}</div>
          <div>Timezone: ${escapeHtml(timezone)}</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;">
        ${card('Entradas', formatCurrency(metrics.entries))}
        ${card('Saídas', formatCurrency(metrics.exits))}
        ${card('Saldo', formatCurrency(metrics.balance))}
        ${
          isWeekly
            ? ''
            : card(
                'Manutenções (pendentes)',
                String(payload.daily?.maintenances?.pendentes || 0)
              )
        }
      </div>

      ${
        chart?.dataUri
          ? `<div style="margin-top:18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:10px;">
              <div style="font-size:13px;color:#374151;margin:4px 4px 10px 4px;font-weight:600;">${escapeHtml(chart.title || 'Gráfico')}</div>
              <img alt="${escapeHtml(chart.alt || 'grafico')}" src="${chart.dataUri}" style="width:100%;border-radius:8px;display:block;"/>
            </div>`
          : ''
      }

      ${isWeekly ? renderWeeklyDetails(payload) : renderDailyDetails(payload)}

      <div style="margin-top:22px;padding:14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:12px;">
        <h3 style="margin:0 0 8px;color:#1d4ed8;">Análise IA</h3>
        ${
          insightData
            ? `
              <p style="margin:0 0 8px;color:#1f2937;">${escapeHtml(insightData.executive_summary || 'Sem resumo da IA.')}</p>
              <p style="margin:0 0 8px;color:#1f2937;"><strong>Confiança:</strong> ${escapeHtml(String(insightData.confidence ?? 0))}%</p>
              <strong style="display:block;margin-top:8px;">Principais insights</strong>
              <ul style="margin-top:6px;color:#1f2937;">${listItems(insightData.top_insights)}</ul>
              <strong style="display:block;margin-top:8px;">Riscos</strong>
              <ul style="margin-top:6px;color:#1f2937;">${listItems(insightData.risks)}</ul>
              <strong style="display:block;margin-top:8px;">Ações recomendadas</strong>
              <ul style="margin-top:6px;color:#1f2937;">${listItems(insightData.recommended_actions)}</ul>
            `
            : '<p style="margin:0;color:#374151;">Insight indisponível para este relatório.</p>'
        }
      </div>
    </div>
  </div>`;
};

module.exports = {
  renderReportEmailHtml,
};

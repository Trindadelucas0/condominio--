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
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;min-width:170px;box-shadow:0 1px 0 rgba(17,24,39,0.03);">
    <div style="font-size:12px;color:#6b7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px;">${escapeHtml(label)}</div>
    <div style="font-size:20px;font-weight:700;color:#111827;line-height:1.2;">${escapeHtml(value)}</div>
  </div>
`;

const listItems = (items = []) => {
  if (!items.length) return '<li>Sem dados disponíveis.</li>';
  return items.map((item) => `<li style="margin-bottom:6px;">${escapeHtml(item)}</li>`).join('');
};

const renderDailyDetails = (payload) => {
  const daily = payload.daily;
  const periodLabel =
    daily?.period?.startDate && daily?.period?.endDate
      ? `${daily.period.startDate} até ${daily.period.endDate}`
      : daily?.date || '-';
  const maintenance = daily?.maintenances || {};
  const categories = (daily?.categories || [])
    .map((item) => `<tr><td style="padding:6px 0;">${escapeHtml(item.category)}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(formatCurrency(item.total))}</td></tr>`)
    .join('');

  return `
    <h3 style="margin:20px 0 10px;color:#111827;">Detalhes do período (${escapeHtml(periodLabel)})</h3>
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
  const periodLabel = payload?.period
    ? `${payload.period.startDate} até ${payload.period.endDate}`
    : '-';
  const insightSource = insight?.source === 'LOCAL_FALLBACK' ? 'Fallback local' : 'IA (Gemini)';
  const sourceBg = insight?.source === 'LOCAL_FALLBACK' ? '#fef3c7' : '#dcfce7';
  const sourceColor = insight?.source === 'LOCAL_FALLBACK' ? '#92400e' : '#166534';

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f1f5f9;padding:24px 12px;">
    <div style="max-width:960px;margin:0 auto;background:#ffffff;border-radius:18px;padding:0;border:1px solid #e2e8f0;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:20px 22px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="display:inline-block;background:#334155;color:#e2e8f0;font-size:11px;padding:4px 8px;border-radius:999px;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.4px;">
              Relatório ${isWeekly ? 'Semanal' : 'Diário'}
            </div>
            <h1 style="margin:0;color:#f8fafc;font-size:24px;line-height:1.2;">${escapeHtml(payload.condominiumName)}</h1>
            <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;">Período: <strong style="color:#e2e8f0;">${escapeHtml(periodLabel)}</strong></p>
          </div>
          <div style="text-align:right;color:#cbd5e1;font-size:12px;">
            <div>Gerado em ${escapeHtml(new Date(payload.generatedAt).toLocaleString('pt-BR'))}</div>
            <div>Timezone: ${escapeHtml(timezone)}</div>
          </div>
        </div>
      </div>

      <div style="padding:20px 22px;">
        <div>
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:16px;">Resumo financeiro</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${card('Entradas', formatCurrency(metrics.entries))}
            ${card('Saídas', formatCurrency(metrics.exits))}
            ${card('Saldo', formatCurrency(metrics.balance))}
            ${
              isWeekly
                ? ''
                : card(
                    'Manutenções pendentes',
                    String(payload.daily?.maintenances?.pendentes || 0)
                  )
            }
          </div>
        </div>

        ${
          chart?.dataUri
            ? `<div style="margin-top:18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
                <div style="font-size:13px;color:#334155;margin:2px 2px 10px 2px;font-weight:600;">${escapeHtml(chart.title || 'Gráfico')}</div>
                <img alt="${escapeHtml(chart.alt || 'grafico')}" src="${chart.dataUri}" style="width:100%;border-radius:10px;display:block;"/>
              </div>`
            : ''
        }

        ${isWeekly ? renderWeeklyDetails(payload) : renderDailyDetails(payload)}

        <div style="margin-top:22px;padding:14px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <h3 style="margin:0;color:#1e40af;font-size:15px;">Análise IA</h3>
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:${sourceBg};color:${sourceColor};">
              Origem: ${insightData ? insightSource : 'Sem análise'}
            </span>
          </div>
          ${
            insightData
              ? `
                <p style="margin:0 0 10px;color:#1f2937;line-height:1.45;">${escapeHtml(insightData.executive_summary || 'Sem resumo da IA.')}</p>
                <p style="margin:0 0 10px;color:#1f2937;"><strong>Confiança:</strong> ${escapeHtml(String(insightData.confidence ?? 0))}%</p>
                <strong style="display:block;margin-top:8px;color:#1e3a8a;">Principais insights</strong>
                <ul style="margin-top:6px;color:#1f2937;line-height:1.45;">${listItems(insightData.top_insights)}</ul>
                <strong style="display:block;margin-top:8px;color:#1e3a8a;">Riscos</strong>
                <ul style="margin-top:6px;color:#1f2937;line-height:1.45;">${listItems(insightData.risks)}</ul>
                <strong style="display:block;margin-top:8px;color:#1e3a8a;">Ações recomendadas</strong>
                <ul style="margin-top:6px;color:#1f2937;line-height:1.45;">${listItems(insightData.recommended_actions)}</ul>
              `
              : '<p style="margin:0;color:#334155;">Não foi possível gerar análise para este relatório.</p>'
          }
        </div>

        <p style="margin:18px 0 2px;color:#64748b;font-size:12px;text-align:center;">
          Este email foi gerado automaticamente pelo sistema de gestão condominial.
        </p>
      </div>
    </div>
  </div>`;
};

module.exports = {
  renderReportEmailHtml,
};

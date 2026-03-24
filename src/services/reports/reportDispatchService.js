const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { query } = require('../../config/database');
const { sendEmail } = require('../email/resendService');
const { buildReportPayload } = require('./dailyWeeklyReportService');
const { generateInsight } = require('./reportInsightService');
const { buildReportChart } = require('./reportChartService');
const { renderReportEmailHtml } = require('./reportEmailTemplateService');

const reportsDir = path.join(__dirname, '../../../uploads/reports/auto');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const getActiveCondominiums = async () => {
  const result = await query(`SELECT id, name FROM condominiums WHERE active = TRUE`);
  return result.rows;
};

const getPreferences = async (condominiumId) => {
  const result = await query(
    `SELECT *
     FROM report_preferences
     WHERE condominium_id = $1
     LIMIT 1`,
    [condominiumId]
  );
  return result.rows[0] || null;
};

const getRecipients = async (condominiumId) => {
  const result = await query(
    `SELECT email
     FROM report_recipients
     WHERE condominium_id = $1
       AND active = TRUE
     ORDER BY id DESC`,
    [condominiumId]
  );
  return result.rows.map((row) => row.email).filter(Boolean);
};

const listCondominiumSchedules = async () => {
  const result = await query(
    `SELECT c.id AS condominium_id,
            c.name AS condominium_name,
            p.enabled,
            p.daily_enabled,
            p.weekly_enabled,
            p.daily_cron,
            p.weekly_cron,
            p.timezone,
            p.custom_start_date,
            p.custom_end_date
       FROM condominiums c
       JOIN report_preferences p ON p.condominium_id = c.id
      WHERE c.active = TRUE`
  );
  return result.rows;
};

const resolveFromForCondominium = (preference) => {
  // Prioriza configuração global do .env para evitar divergência por condomínio.
  const fromEmail = process.env.RESEND_FROM_EMAIL || preference?.from_email;
  const fromName = process.env.RESEND_FROM_NAME || preference?.from_name || 'Sistema Condominio';
  if (!fromEmail) {
    throw new Error(
      'Remetente não configurado para este condomínio. Defina o email de envio no Admin ou RESEND_FROM_EMAIL no .env'
    );
  }
  return { email: fromEmail, name: fromName };
};

const shouldSendType = (preference, reportType) => {
  if (!preference || preference.enabled === false) return false;
  if (reportType === 'WEEKLY') return preference.weekly_enabled !== false;
  return preference.daily_enabled !== false;
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const createPdfReport = async (payload, insight) => {
  const fileName = `relatorio_${payload.reportType.toLowerCase()}_${payload.condominiumId}_${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, fileName);
  const periodLabel = payload?.period
    ? `${payload.period.startDate} até ${payload.period.endDate}`
    : new Date(payload.generatedAt).toISOString().slice(0, 10);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    const pageWidth = doc.page.width - 100;

    const drawCard = ({ x, y, w, h, label, value }) => {
      doc.roundedRect(x, y, w, h, 8).fillAndStroke('#ffffff', '#e5e7eb');
      doc.fillColor('#6b7280').fontSize(9).text(label, x + 10, y + 8, { width: w - 20 });
      doc.fillColor('#111827').fontSize(14).text(value, x + 10, y + 24, { width: w - 20 });
    };

    doc.roundedRect(50, 50, pageWidth, 74, 10).fill('#0f172a');
    doc.fillColor('#f8fafc').fontSize(18).text(
      `Relatório ${payload.reportType === 'WEEKLY' ? 'Semanal' : 'Diário'}`,
      64,
      68
    );
    doc.fillColor('#cbd5e1').fontSize(12).text(payload.condominiumName, 64, 91);
    doc.fillColor('#cbd5e1').fontSize(10).text(`Período: ${periodLabel}`, 64, 108);
    doc.fillColor('#ffffff').fontSize(9).text(
      `Gerado em ${new Date(payload.generatedAt).toLocaleString('pt-BR')}`,
      50,
      68,
      { width: pageWidth - 12, align: 'right' }
    );

    const baseMetrics = payload.reportType === 'WEEKLY' ? payload.weekly.totals : payload.daily;
    const cardY = 138;
    const gap = 10;
    const cardW = (pageWidth - gap * 3) / 4;
    drawCard({
      x: 50,
      y: cardY,
      w: cardW,
      h: 58,
      label: 'Entradas',
      value: formatCurrency(baseMetrics.entries),
    });
    drawCard({
      x: 50 + cardW + gap,
      y: cardY,
      w: cardW,
      h: 58,
      label: 'Saídas',
      value: formatCurrency(baseMetrics.exits),
    });
    drawCard({
      x: 50 + (cardW + gap) * 2,
      y: cardY,
      w: cardW,
      h: 58,
      label: 'Saldo',
      value: formatCurrency(baseMetrics.balance),
    });
    drawCard({
      x: 50 + (cardW + gap) * 3,
      y: cardY,
      w: cardW,
      h: 58,
      label: payload.reportType === 'WEEKLY' ? 'Dias no período' : 'Manut. pendentes',
      value:
        payload.reportType === 'WEEKLY'
          ? String(payload.weekly.days.length || 0)
          : String(payload.daily?.maintenances?.pendentes || 0),
    });
    let cursorY = 214;

    if (payload.reportType === 'WEEKLY') {
      const totals = payload.weekly.totals;
      doc.fillColor('#0f172a').fontSize(13).text('Resumo do período', 50, cursorY);
      cursorY += 22;
      doc.fillColor('#1f2937').fontSize(10).text(
        `Entradas ${formatCurrency(totals.entries)} | Saídas ${formatCurrency(totals.exits)} | Saldo ${formatCurrency(totals.balance)}`,
        50,
        cursorY
      );
      cursorY += 24;
      doc.fillColor('#0f172a').fontSize(12).text('Série diária (entradas x saídas)', 50, cursorY);
      cursorY += 18;
      payload.weekly.days.forEach((day) => {
        doc.fillColor('#334155').fontSize(10).text(
          `${day.date} | E: ${formatCurrency(day.entries)} | S: ${formatCurrency(day.exits)} | Saldo: ${formatCurrency(day.balance)}`
          ,
          50,
          cursorY
        );
        cursorY += 14;
      });
    } else {
      const daily = payload.daily;
      doc.fillColor('#0f172a').fontSize(13).text('Resumo do período', 50, cursorY);
      cursorY += 22;
      doc.fillColor('#1f2937').fontSize(10).text(`Entradas recebidas: ${formatCurrency(daily.entries)}`, 50, cursorY);
      cursorY += 14;
      doc.text(`Saídas pagas: ${formatCurrency(daily.exits)}`, 50, cursorY);
      cursorY += 14;
      doc.text(`Saldo do período: ${formatCurrency(daily.balance)}`, 50, cursorY);
      cursorY += 14;
      doc.text(
        `Manutenções: ${daily.maintenances.pendentes} pendentes, ${daily.maintenances.emAndamento} em andamento, ${daily.maintenances.concluidas} concluídas`
        ,
        50,
        cursorY
      );
      cursorY += 22;
      doc.fillColor('#0f172a').fontSize(12).text('Top categorias de saída', 50, cursorY);
      cursorY += 16;
      daily.categories.forEach((item) => {
        doc.fillColor('#334155').fontSize(10).text(`${item.category}: ${formatCurrency(item.total)}`, 50, cursorY);
        cursorY += 14;
      });
    }

    if (insight?.enabled && insight.data) {
      doc.addPage();
      const sourceLabel = insight?.source === 'LOCAL_FALLBACK' ? 'Fallback local' : 'IA (Gemini)';
      doc.roundedRect(50, 50, pageWidth, 52, 8).fill('#eff6ff');
      doc.fillColor('#1e40af').fontSize(15).text('Análise do período', 64, 68);
      doc.fillColor('#1d4ed8').fontSize(10).text(`Origem: ${sourceLabel} | Confiança: ${insight.data.confidence ?? 0}%`, 64, 86);
      let aiY = 124;
      doc.fillColor('#0f172a').fontSize(11).text('Resumo executivo', 50, aiY);
      aiY += 16;
      doc.fillColor('#334155').fontSize(10).text(insight.data.executive_summary || '-', 50, aiY, { width: pageWidth, lineGap: 3 });
      aiY = doc.y + 12;
      doc.fillColor('#0f172a').fontSize(11).text('Principais insights', 50, aiY);
      aiY += 14;
      (insight.data.top_insights || []).forEach((line) => {
        doc.fillColor('#334155').fontSize(10).text(`- ${line}`, 58, aiY, { width: pageWidth - 8 });
        aiY = doc.y + 4;
      });
      doc.fillColor('#0f172a').fontSize(11).text('Riscos', 50, aiY + 4);
      aiY = doc.y + 10;
      (insight.data.risks || []).forEach((line) => {
        doc.fillColor('#334155').fontSize(10).text(`- ${line}`, 58, aiY, { width: pageWidth - 8 });
        aiY = doc.y + 4;
      });
      doc.fillColor('#0f172a').fontSize(11).text('Ações recomendadas', 50, aiY + 4);
      aiY = doc.y + 10;
      (insight.data.recommended_actions || []).forEach((line) => {
        doc.fillColor('#334155').fontSize(10).text(`- ${line}`, 58, aiY, { width: pageWidth - 8 });
        aiY = doc.y + 4;
      });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { fileName, filePath };
};

const logDispatch = async ({
  condominiumId,
  reportType,
  periodRef,
  recipientCount,
  status,
  errorMessage = null,
}) => {
  await query(
    `INSERT INTO report_dispatch_logs (
      condominium_id, report_type, period_ref, recipient_count, status, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [condominiumId, reportType, periodRef, recipientCount, status, errorMessage]
  );
};

const resolveReportRange = (preference, options = {}) => {
  const startDate = String(options.startDate || preference?.custom_start_date || '').trim() || null;
  const endDate = String(options.endDate || preference?.custom_end_date || '').trim() || null;
  if (!startDate && !endDate) return { startDate: null, endDate: null };
  if (!startDate || !endDate) {
    throw new Error('Período personalizado inválido: informe data inicial e final.');
  }
  if (startDate > endDate) {
    throw new Error('Período personalizado inválido: data inicial maior que data final.');
  }
  return { startDate, endDate };
};

const dispatchCondominiumReport = async (condominiumId, reportType = 'DAILY', options = {}) => {
  console.log('[REPORT_DISPATCH] Iniciando dispatch', { condominiumId, reportType, source: options.source || 'AUTO' });
  const preference = await getPreferences(condominiumId);
  if (!shouldSendType(preference, reportType)) {
    console.log('[REPORT_DISPATCH] Dispatch ignorado por preferência', { condominiumId, reportType });
    return { skipped: true, reason: 'DISABLED_BY_PREFERENCE' };
  }

  const recipients = await getRecipients(condominiumId);
  console.log('[REPORT_DISPATCH] Destinatários carregados', { condominiumId, reportType, recipients: recipients.length });
  if (recipients.length === 0) {
    await logDispatch({
      condominiumId,
      reportType,
      periodRef: new Date().toISOString().slice(0, 10),
      recipientCount: 0,
      status: 'SKIPPED',
      errorMessage: 'Sem destinatários ativos',
    });
    return { skipped: true, reason: 'NO_RECIPIENTS' };
  }

  try {
    const reportRange = resolveReportRange(preference, options);
    console.log('[REPORT_DISPATCH] Montando payload do relatório', { condominiumId, reportType });
    const payload = await buildReportPayload(condominiumId, reportType, reportRange);
    console.log('[REPORT_DISPATCH] Payload pronto', {
      condominiumId,
      reportType,
      hasDaily: Boolean(payload.daily),
      hasWeekly: Boolean(payload.weekly),
      startDate: reportRange.startDate,
      endDate: reportRange.endDate,
    });
    const insight = await generateInsight(payload);
    console.log('[REPORT_DISPATCH] Insight processado', {
      condominiumId,
      reportType,
      enabled: insight?.enabled || false,
      reason: insight?.reason || null,
    });
    let chart = null;
    try {
      chart = buildReportChart(payload);
      console.log('[REPORT_DISPATCH] Gráfico processado', {
        condominiumId,
        reportType,
        enabled: Boolean(chart?.dataUri),
      });
    } catch (chartError) {
      console.warn('[REPORT_DISPATCH] Falha ao gerar gráfico, seguindo sem gráfico', {
        condominiumId,
        reportType,
        message: chartError.message,
      });
    }

    const subject =
      reportType === 'WEEKLY'
        ? `Relatório Semanal - ${payload.condominiumName} (${payload.period?.startDate} a ${payload.period?.endDate})`
        : `Relatório Diário - ${payload.condominiumName} (${payload.period?.startDate} a ${payload.period?.endDate})`;
    const html = renderReportEmailHtml({
      payload,
      insight,
      chart,
      timezone: preference?.timezone || process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo',
    });
    const pdf = await createPdfReport(payload, insight);
    const content = fs.readFileSync(pdf.filePath).toString('base64');

    await sendEmail({
      to: recipients,
      subject,
      text: `${subject}\n\nRelatório enviado em HTML e em anexo PDF.`,
      html,
      from: resolveFromForCondominium(preference),
      attachments: [
        {
          filename: pdf.fileName,
          content,
        },
      ],
    });
    console.log('[REPORT_DISPATCH] Email enviado', { condominiumId, reportType, recipients: recipients.length, subject });

    await logDispatch({
      condominiumId,
      reportType,
      periodRef: new Date().toISOString().slice(0, 10),
      recipientCount: recipients.length,
      status: 'SENT',
    });

    return {
      skipped: false,
      recipients: recipients.length,
      mode: 'HTML_ONLY',
      period: payload.period,
    };
  } catch (error) {
    console.error('[REPORT_DISPATCH] Falha no dispatch', {
      condominiumId,
      reportType,
      message: error.message,
    });
    await logDispatch({
      condominiumId,
      reportType,
      periodRef: new Date().toISOString().slice(0, 10),
      recipientCount: recipients.length,
      status: 'ERROR',
      errorMessage: error.message,
    });
    throw error;
  }
};

const dispatchReportsForAll = async (reportType = 'DAILY') => {
  const condominiums = await getActiveCondominiums();
  console.log('[REPORT_DISPATCH] Iniciando dispatch em lote', { reportType, condominiums: condominiums.length });
  const results = [];
  for (const condominium of condominiums) {
    try {
      const result = await dispatchCondominiumReport(condominium.id, reportType);
      results.push({ condominiumId: condominium.id, success: true, ...result });
    } catch (error) {
      results.push({ condominiumId: condominium.id, success: false, error: error.message });
    }
  }
  return results;
};

module.exports = {
  dispatchReportsForAll,
  dispatchCondominiumReport,
  listCondominiumSchedules,
  shouldSendType,
};

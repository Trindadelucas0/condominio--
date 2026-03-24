const { query } = require('../../config/database');
const { sendEmail } = require('../email/resendService');
const { buildReportPayload } = require('./dailyWeeklyReportService');
const { generateInsight } = require('./reportInsightService');
const { buildReportChart } = require('./reportChartService');
const { renderReportEmailHtml } = require('./reportEmailTemplateService');

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
            p.timezone
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

const dispatchCondominiumReport = async (condominiumId, reportType = 'DAILY') => {
  console.log('[REPORT_DISPATCH] Iniciando dispatch', { condominiumId, reportType });
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
    console.log('[REPORT_DISPATCH] Montando payload do relatório', { condominiumId, reportType });
    const payload = await buildReportPayload(condominiumId, reportType);
    console.log('[REPORT_DISPATCH] Payload pronto', {
      condominiumId,
      reportType,
      hasDaily: Boolean(payload.daily),
      hasWeekly: Boolean(payload.weekly),
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
        ? `Relatório Semanal - ${payload.condominiumName}`
        : `Relatório Diário - ${payload.condominiumName}`;
    const html = renderReportEmailHtml({
      payload,
      insight,
      chart,
      timezone: preference?.timezone || process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo',
    });

    await sendEmail({
      to: recipients,
      subject,
      text: `${subject}\n\nRelatório enviado em HTML no corpo do email.`,
      html,
      from: resolveFromForCondominium(preference),
      attachments: [],
    });
    console.log('[REPORT_DISPATCH] Email enviado', { condominiumId, reportType, recipients: recipients.length, subject });

    await logDispatch({
      condominiumId,
      reportType,
      periodRef: new Date().toISOString().slice(0, 10),
      recipientCount: recipients.length,
      status: 'SENT',
    });

    return { skipped: false, recipients: recipients.length, mode: 'HTML_ONLY' };
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

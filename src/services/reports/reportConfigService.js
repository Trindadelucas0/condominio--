const { query } = require('../../config/database');

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

const upsertPreferences = async (condominiumId, data) => {
  const result = await query(
    `INSERT INTO report_preferences (
      condominium_id, enabled, daily_enabled, weekly_enabled, daily_cron, weekly_cron, timezone,
      include_financial, include_maintenance, include_charts, include_ai_insights,
      from_email, from_name, ai_daily_request_limit, ai_monthly_token_limit
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (condominium_id)
    DO UPDATE SET
      enabled = EXCLUDED.enabled,
      daily_enabled = EXCLUDED.daily_enabled,
      weekly_enabled = EXCLUDED.weekly_enabled,
      daily_cron = EXCLUDED.daily_cron,
      weekly_cron = EXCLUDED.weekly_cron,
      timezone = EXCLUDED.timezone,
      include_financial = EXCLUDED.include_financial,
      include_maintenance = EXCLUDED.include_maintenance,
      include_charts = EXCLUDED.include_charts,
      include_ai_insights = EXCLUDED.include_ai_insights,
      from_email = EXCLUDED.from_email,
      from_name = EXCLUDED.from_name,
      ai_daily_request_limit = EXCLUDED.ai_daily_request_limit,
      ai_monthly_token_limit = EXCLUDED.ai_monthly_token_limit,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [
      condominiumId,
      data.enabled !== false,
      data.daily_enabled !== false,
      data.weekly_enabled !== false,
      data.daily_cron || process.env.REPORT_SCHEDULE_DAILY || '0 7 * * *',
      data.weekly_cron || process.env.REPORT_SCHEDULE_WEEKLY || '30 7 * * 1',
      data.timezone || process.env.REPORT_DEFAULT_TZ || 'America/Sao_Paulo',
      data.include_financial !== false,
      data.include_maintenance !== false,
      data.include_charts !== false,
      data.include_ai_insights !== false,
      data.from_email ? String(data.from_email).trim().toLowerCase() : null,
      data.from_name ? String(data.from_name).trim() : null,
      parseInt(data.ai_daily_request_limit || process.env.GEMINI_DAILY_REQUEST_LIMIT || '200', 10),
      parseInt(data.ai_monthly_token_limit || process.env.GEMINI_MONTHLY_TOKEN_LIMIT || '2000000', 10),
    ]
  );
  return result.rows[0];
};

const listRecipients = async (condominiumId) => {
  const result = await query(
    `SELECT id, user_id, email, role_scope, active
     FROM report_recipients
     WHERE condominium_id = $1
     ORDER BY id DESC`,
    [condominiumId]
  );
  return result.rows;
};

const addRecipient = async (condominiumId, { user_id = null, email, role_scope = 'CUSTOM' }) => {
  const result = await query(
    `INSERT INTO report_recipients (condominium_id, user_id, email, role_scope, active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING *`,
    [condominiumId, user_id, String(email || '').trim().toLowerCase(), role_scope]
  );
  return result.rows[0];
};

const removeRecipient = async (condominiumId, recipientId) => {
  const result = await query(
    `UPDATE report_recipients
     SET active = FALSE, updated_at = CURRENT_TIMESTAMP
     WHERE condominium_id = $1 AND id = $2
     RETURNING id`,
    [condominiumId, recipientId]
  );
  return Boolean(result.rows.length);
};

const getUsageSummary = async (condominiumId) => {
  const dailyRef = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const monthRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const usageResult = await query(
    `SELECT period_type, request_count, token_count
     FROM ai_quota_snapshots
     WHERE condominium_id = $1
       AND ((period_type = 'DAILY' AND period_ref = $2) OR (period_type = 'MONTHLY' AND period_ref = $3))`,
    [condominiumId, dailyRef, monthRef]
  );

  const summary = {
    daily: { request_count: 0, token_count: 0 },
    monthly: { request_count: 0, token_count: 0 },
  };
  usageResult.rows.forEach((row) => {
    if (row.period_type === 'DAILY') summary.daily = row;
    if (row.period_type === 'MONTHLY') summary.monthly = row;
  });
  return summary;
};

module.exports = {
  getPreferences,
  upsertPreferences,
  listRecipients,
  addRecipient,
  removeRecipient,
  getUsageSummary,
};

const { query } = require('../../config/database');
const cacheService = require('../cacheService');

const DAILY_LIMIT_DEFAULT = parseInt(process.env.GEMINI_DAILY_REQUEST_LIMIT || '200', 10);
const MONTHLY_TOKEN_LIMIT_DEFAULT = parseInt(process.env.GEMINI_MONTHLY_TOKEN_LIMIT || '2000000', 10);
const PER_MINUTE_LIMIT = parseInt(process.env.GEMINI_PER_MINUTE_LIMIT || '5', 10);

const minuteKey = (condominiumId) => `ai:rate:${condominiumId}:${new Date().toISOString().slice(0, 16)}`;

const getDateRef = () => new Date().toISOString().slice(0, 10);
const getMonthRef = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCondominiumQuota = async (condominiumId) => {
  const result = await query(
    `SELECT ai_daily_request_limit, ai_monthly_token_limit
     FROM report_preferences
     WHERE condominium_id = $1
     LIMIT 1`,
    [condominiumId]
  );

  if (!result.rows.length) {
    return {
      dailyLimit: DAILY_LIMIT_DEFAULT,
      monthlyTokenLimit: MONTHLY_TOKEN_LIMIT_DEFAULT,
    };
  }

  const row = result.rows[0];
  return {
    dailyLimit: row.ai_daily_request_limit || DAILY_LIMIT_DEFAULT,
    monthlyTokenLimit: row.ai_monthly_token_limit || MONTHLY_TOKEN_LIMIT_DEFAULT,
  };
};

const upsertSnapshot = async (condominiumId, periodType, periodRef, requestInc, tokenInc) => {
  await query(
    `INSERT INTO ai_quota_snapshots (condominium_id, period_type, period_ref, request_count, token_count)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (condominium_id, period_type, period_ref)
     DO UPDATE SET
       request_count = ai_quota_snapshots.request_count + EXCLUDED.request_count,
       token_count = ai_quota_snapshots.token_count + EXCLUDED.token_count,
       updated_at = CURRENT_TIMESTAMP`,
    [condominiumId, periodType, periodRef, requestInc, tokenInc]
  );
};

const logUsage = async ({
  condominiumId,
  feature,
  requestTokens = 0,
  responseTokens = 0,
  latencyMs = 0,
  status = 'SUCCESS',
  errorMessage = null,
}) => {
  await query(
    `INSERT INTO ai_usage_logs (
      condominium_id, feature, request_tokens, response_tokens, latency_ms, status, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [condominiumId, feature, requestTokens, responseTokens, latencyMs, status, errorMessage]
  );

  if (status === 'SUCCESS') {
    await upsertSnapshot(condominiumId, 'DAILY', getDateRef(), 1, requestTokens + responseTokens);
    await upsertSnapshot(condominiumId, 'MONTHLY', getMonthRef(), 1, requestTokens + responseTokens);
  }
};

const getSnapshot = async (condominiumId, periodType, periodRef) => {
  const result = await query(
    `SELECT request_count, token_count
     FROM ai_quota_snapshots
     WHERE condominium_id = $1 AND period_type = $2 AND period_ref = $3`,
    [condominiumId, periodType, periodRef]
  );
  return result.rows[0] || { request_count: 0, token_count: 0 };
};

const checkQuota = async (condominiumId) => {
  const key = minuteKey(condominiumId);
  const minuteHits = cacheService.get(key) || 0;
  if (minuteHits >= PER_MINUTE_LIMIT) {
    return { allowed: false, reason: 'RATE_LIMIT_PER_MINUTE' };
  }

  const { dailyLimit, monthlyTokenLimit } = await getCondominiumQuota(condominiumId);
  const daily = await getSnapshot(condominiumId, 'DAILY', getDateRef());
  const monthly = await getSnapshot(condominiumId, 'MONTHLY', getMonthRef());

  if (daily.request_count >= dailyLimit) {
    return { allowed: false, reason: 'DAILY_REQUEST_LIMIT' };
  }

  if (monthly.token_count >= monthlyTokenLimit) {
    return { allowed: false, reason: 'MONTHLY_TOKEN_LIMIT' };
  }

  cacheService.set(key, minuteHits + 1, 60);
  return { allowed: true };
};

module.exports = {
  checkQuota,
  logUsage,
};

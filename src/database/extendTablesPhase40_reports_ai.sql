-- FASE 40: Relatórios com IA + controles de envio/cota

CREATE TABLE IF NOT EXISTS report_preferences (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL UNIQUE REFERENCES condominiums(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  daily_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  daily_cron VARCHAR(100) NOT NULL DEFAULT '0 7 * * *',
  weekly_cron VARCHAR(100) NOT NULL DEFAULT '30 7 * * 1',
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
  include_financial BOOLEAN NOT NULL DEFAULT TRUE,
  include_maintenance BOOLEAN NOT NULL DEFAULT TRUE,
  include_charts BOOLEAN NOT NULL DEFAULT TRUE,
  include_ai_insights BOOLEAN NOT NULL DEFAULT TRUE,
  custom_start_date DATE NULL,
  custom_end_date DATE NULL,
  from_email VARCHAR(255) NULL,
  from_name VARCHAR(120) NULL,
  ai_daily_request_limit INTEGER NOT NULL DEFAULT 200,
  ai_monthly_token_limit BIGINT NOT NULL DEFAULT 2000000,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE report_preferences ADD COLUMN IF NOT EXISTS from_email VARCHAR(255) NULL;
ALTER TABLE report_preferences ADD COLUMN IF NOT EXISTS from_name VARCHAR(120) NULL;
ALTER TABLE report_preferences ADD COLUMN IF NOT EXISTS custom_start_date DATE NULL;
ALTER TABLE report_preferences ADD COLUMN IF NOT EXISTS custom_end_date DATE NULL;

CREATE TABLE IF NOT EXISTS report_recipients (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  role_scope VARCHAR(50) NOT NULL DEFAULT 'CUSTOM',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_recipients_active_unique
ON report_recipients(condominium_id, email)
WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  feature VARCHAR(80) NOT NULL,
  request_tokens INTEGER NOT NULL DEFAULT 0,
  response_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_condo_created
ON ai_usage_logs(condominium_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_quota_snapshots (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('DAILY', 'MONTHLY')),
  period_ref VARCHAR(20) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  token_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (condominium_id, period_type, period_ref)
);

CREATE TABLE IF NOT EXISTS report_dispatch_logs (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  period_ref VARCHAR(20) NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'SENT',
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_dispatch_logs_condo_created
ON report_dispatch_logs(condominium_id, created_at DESC);

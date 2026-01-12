-- Script de extensão das tabelas - FASE 21b (LOGS FALHADOS)
-- Cria tabela para registrar logs que falharam após esgotar tentativas

CREATE TABLE IF NOT EXISTS audit_logs_failed (
  id SERIAL PRIMARY KEY,
  log_data JSONB NOT NULL, -- Dados do log que falhou
  failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Quando falhou
  error_message TEXT, -- Mensagem de erro
  retried BOOLEAN DEFAULT FALSE, -- Se foi tentado novamente
  retried_at TIMESTAMP NULL -- Quando foi tentado novamente
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_failed_at ON audit_logs_failed(failed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_retried ON audit_logs_failed(retried);

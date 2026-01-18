-- Script de criação de tabela para configuração do dashboard personalizável
-- Permite que cada usuário customize seu dashboard

-- Tabela para armazenar configuração do dashboard por usuário
CREATE TABLE IF NOT EXISTS dashboard_config (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  widget_key VARCHAR(50) NOT NULL, -- 'pending_approvals', 'balance', 'alerts', etc
  position INTEGER NOT NULL, -- Ordem de exibição (1, 2, 3...)
  visible BOOLEAN DEFAULT TRUE, -- Se o widget está visível
  config JSONB DEFAULT '{}', -- Configurações específicas do widget (ex: período, limite de registros)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, widget_key) -- Um widget por usuário (pode ser reposicionado)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_dashboard_config_user ON dashboard_config(user_id, condominium_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_config_condominium ON dashboard_config(condominium_id);

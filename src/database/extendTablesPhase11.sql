-- Script de extensão das tabelas - FASE 11 (CONFIGURAÇÕES DO CONDOMÍNIO)
-- Adiciona tabelas necessárias para centralizar configurações do condomínio
-- Executado após a criação das tabelas anteriores
-- 
-- OBJETIVO: Centralizar regras que afetam todos os módulos, sem hardcode
-- REGRA: Síndico e Super Master podem alterar configurações

-- Tabela de configurações do condomínio
-- Centraliza todas as configurações que afetam o funcionamento do sistema
CREATE TABLE IF NOT EXISTS condominium_settings (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  setting_key VARCHAR(100) NOT NULL, -- Chave da configuração (ex: 'financial_approval_limit')
  setting_value TEXT NOT NULL, -- Valor da configuração (JSON ou texto)
  setting_type VARCHAR(50) DEFAULT 'TEXT', -- Tipo: TEXT, NUMBER, BOOLEAN, JSON
  description TEXT, -- Descrição do que a configuração faz
  category VARCHAR(50) NOT NULL, -- Categoria: FINANCIAL, SLA, ALERT, OCCURRENCE, ASSET, OTHER
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem atualizou
  UNIQUE(condominium_id, setting_key) -- Uma configuração por chave por condomínio
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_condominium_settings_condominium ON condominium_settings(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_condominium_settings_category ON condominium_settings(category); -- Filtros por categoria
CREATE INDEX IF NOT EXISTS idx_condominium_settings_key ON condominium_settings(setting_key); -- Busca por chave

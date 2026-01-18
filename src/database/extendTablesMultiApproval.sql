-- Script de criação de tabelas para multi-aprovação
-- Permite que itens de alto valor requeram múltiplas aprovações

-- Tabela para armazenar múltiplas aprovações necessárias
CREATE TABLE IF NOT EXISTS multi_approvals (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'financial_exits', 'budget_requests', etc
  entity_id INTEGER NOT NULL,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  required_approvals INTEGER NOT NULL DEFAULT 2, -- Quantas aprovações são necessárias
  current_approvals INTEGER DEFAULT 0, -- Quantas já foram feitas
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, entity_id, condominium_id) -- Evita duplicatas
);

-- Tabela para armazenar cada aprovação individual
CREATE TABLE IF NOT EXISTS multi_approval_votes (
  id SERIAL PRIMARY KEY,
  multi_approval_id INTEGER NOT NULL REFERENCES multi_approvals(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote VARCHAR(20) NOT NULL, -- 'APPROVE' ou 'REJECT'
  notes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(multi_approval_id, user_id) -- Um usuário só pode votar uma vez
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_multi_approvals_entity ON multi_approvals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_multi_approvals_condominium ON multi_approvals(condominium_id);
CREATE INDEX IF NOT EXISTS idx_multi_approvals_status ON multi_approvals(status);
CREATE INDEX IF NOT EXISTS idx_multi_approval_votes_multi_approval ON multi_approval_votes(multi_approval_id);
CREATE INDEX IF NOT EXISTS idx_multi_approval_votes_user ON multi_approval_votes(user_id);

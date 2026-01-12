-- Script de extensão das tabelas do banco de dados
-- Adiciona tabelas necessárias para funcionalidades do sistema
-- Executado após a criação das tabelas base

-- Tabela de aprovações
-- Registra itens que precisam de aprovação do síndico (despesas, contratos, etc)
CREATE TABLE IF NOT EXISTS approvals (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio relacionado
  approval_type VARCHAR(50) NOT NULL, -- Tipo de aprovação: FINANCIAL_EXIT, CONTRACT, MAINTENANCE, etc
  entity_type VARCHAR(50) NOT NULL, -- Tipo de entidade: financial_exits, contracts, etc
  entity_id INTEGER NOT NULL, -- ID da entidade que precisa de aprovação
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Usuário que solicitou
  requested_amount DECIMAL(15,2), -- Valor solicitado (se aplicável)
  description TEXT, -- Descrição do que precisa ser aprovado
  status VARCHAR(20) DEFAULT 'PENDING', -- Status: PENDING, APPROVED, REJECTED
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Usuário que aprovou
  approved_at TIMESTAMP NULL, -- Data/hora da aprovação
  rejection_reason TEXT, -- Motivo da rejeição (se rejeitado)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Tabela de alertas
-- Registra alertas do sistema (vencimentos, pendências, etc)
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio relacionado
  alert_type VARCHAR(50) NOT NULL, -- Tipo: OVERDUE_TASK, CONTRACT_EXPIRING, FINANCIAL_WARNING, etc
  severity VARCHAR(20) DEFAULT 'INFO', -- Severidade: INFO, WARNING, CRITICAL
  title VARCHAR(255) NOT NULL, -- Título do alerta
  message TEXT NOT NULL, -- Mensagem do alerta
  entity_type VARCHAR(50), -- Tipo de entidade relacionada
  entity_id INTEGER, -- ID da entidade relacionada
  resolved BOOLEAN DEFAULT FALSE, -- Se foi resolvido
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem resolveu
  resolved_at TIMESTAMP NULL, -- Data/hora da resolução
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Tabela de saídas financeiras (despesas)
-- Registra todas as saídas de dinheiro do condomínio
CREATE TABLE IF NOT EXISTS financial_exits (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  description TEXT NOT NULL, -- Descrição da despesa
  amount DECIMAL(15,2) NOT NULL, -- Valor da despesa
  exit_date DATE NOT NULL, -- Data da saída
  cost_center VARCHAR(100), -- Centro de custo
  category VARCHAR(50), -- Categoria: MANUTENCAO, CONTA, CONTRATO, etc
  payment_status VARCHAR(20) DEFAULT 'PENDING', -- Status: PENDING, APPROVED, PAID, REJECTED
  requires_approval BOOLEAN DEFAULT FALSE, -- Se requer aprovação do síndico
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem aprovou
  approved_at TIMESTAMP NULL, -- Data da aprovação
  paid_at TIMESTAMP NULL, -- Data do pagamento
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_approvals_condominium ON approvals(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_approvals_type ON approvals(approval_type); -- Filtros por tipo
CREATE INDEX IF NOT EXISTS idx_alerts_condominium ON alerts(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved); -- Filtros por resolvido
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity); -- Filtros por severidade
CREATE INDEX IF NOT EXISTS idx_financial_exits_condominium ON financial_exits(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_financial_exits_status ON financial_exits(payment_status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_financial_exits_date ON financial_exits(exit_date); -- Ordenação por data

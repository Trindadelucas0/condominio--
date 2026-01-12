-- Script de inserção inicial de permissões formais
-- Define todas as ações possíveis sobre entidades
-- Executado após a criação da tabela permissions

-- ============================================
-- PERMISSÕES PARA TASKS
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('tasks', 'create', 'Criar tarefas')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('tasks', 'read', 'Visualizar tarefas')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('tasks', 'update', 'Editar tarefas')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('tasks', 'delete', 'Deletar tarefas')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('tasks', 'complete', 'Concluir tarefas')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('tasks', 'reopen', 'Reabrir tarefas')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('tasks', 'add_observation', 'Adicionar observações em tarefas')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA OCCURRENCES
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('occurrences', 'create', 'Criar ocorrências')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('occurrences', 'read', 'Visualizar ocorrências')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('occurrences', 'update', 'Editar ocorrências')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('occurrences', 'triage', 'Triar ocorrências (classificar, definir SLA)')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('occurrences', 'resolve', 'Resolver ocorrências')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('occurrences', 'reopen', 'Reabrir ocorrências')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('occurrences', 'add_observation', 'Adicionar observações em ocorrências')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA FINANCIAL_ENTRIES
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_entries', 'create', 'Criar entradas financeiras')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_entries', 'read', 'Visualizar entradas financeiras')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_entries', 'update', 'Editar entradas financeiras')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_entries', 'mark_received', 'Marcar entrada como recebida (com comprovante)')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_entries', 'view_receipt', 'Visualizar comprovante de entrada')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA FINANCIAL_EXITS
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'create', 'Criar saídas financeiras')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'read', 'Visualizar saídas financeiras')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'update', 'Editar saídas financeiras')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'approve', 'Aprovar saídas financeiras (até limite configurado)')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'approve_high_value', 'Aprovar saídas financeiras acima do limite (apenas síndico)')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'pay', 'Marcar saída como paga (com comprovante)')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'view_receipt', 'Visualizar comprovante de pagamento')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('financial_exits', 'reopen', 'Reabrir saídas financeiras')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA DOCUMENTS
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('documents', 'create', 'Criar documentos')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('documents', 'read', 'Visualizar documentos')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('documents', 'update', 'Editar documentos')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('documents', 'delete', 'Deletar documentos')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA ASSETS
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('assets', 'create', 'Criar ativos')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('assets', 'read', 'Visualizar ativos')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('assets', 'update', 'Editar ativos')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('assets', 'register_maintenance', 'Registrar manutenções em ativos')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('assets', 'calculate_depreciation', 'Calcular depreciação de ativos')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA INVENTORY_ITEMS
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('inventory_items', 'create', 'Criar itens de estoque')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('inventory_items', 'read', 'Visualizar itens de estoque')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('inventory_items', 'update', 'Editar itens de estoque')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('inventory_items', 'movement', 'Registrar movimentações de estoque')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA BUDGET_REQUESTS
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('budget_requests', 'create', 'Criar solicitações de orçamento')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('budget_requests', 'read', 'Visualizar solicitações de orçamento')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('budget_requests', 'approve', 'Aprovar solicitações de orçamento')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA MONTHLY_CONSUMPTION
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('monthly_consumption', 'create', 'Registrar consumo mensal')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('monthly_consumption', 'read', 'Visualizar consumo mensal')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('monthly_consumption', 'update', 'Editar consumo mensal')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA USERS (SUPER_MASTER)
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('users', 'create', 'Criar usuários')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('users', 'read', 'Visualizar usuários')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('users', 'update', 'Editar usuários')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('users', 'assign_roles', 'Atribuir perfis a usuários')
ON CONFLICT (entity_type, action) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA CONDOMINIUMS (SUPER_MASTER)
-- ============================================
INSERT INTO permissions (entity_type, action, description) VALUES
  ('condominiums', 'create', 'Criar condomínios')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('condominiums', 'read', 'Visualizar condomínios')
ON CONFLICT (entity_type, action) DO NOTHING;

INSERT INTO permissions (entity_type, action, description) VALUES
  ('condominiums', 'update', 'Editar condomínios')
ON CONFLICT (entity_type, action) DO NOTHING;

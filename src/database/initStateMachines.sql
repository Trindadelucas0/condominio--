-- Script de inserção de state machines padronizadas
-- Define estados válidos para cada entidade
-- Executado após a criação da tabela state_machines

-- ============================================
-- STATE MACHINE: TASKS
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('tasks', 'PENDING', 'Pendente', 'Tarefa criada, aguardando execução', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('tasks', 'IN_PROGRESS', 'Em Andamento', 'Tarefa em execução', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('tasks', 'COMPLETED', 'Concluída', 'Tarefa concluída com sucesso', FALSE, TRUE, 3)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('tasks', 'CANCELLED', 'Cancelada', 'Tarefa cancelada', FALSE, TRUE, 4)
ON CONFLICT (entity_type, state) DO NOTHING;

-- ============================================
-- STATE MACHINE: OCCURRENCES
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('occurrences', 'ABERTA', 'Aberta', 'Ocorrência criada, aguardando triagem', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('occurrences', 'EM_ATENDIMENTO', 'Em Atendimento', 'Ocorrência em processo de resolução', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('occurrences', 'AGUARDANDO_TERCEIRO', 'Aguardando Terceiro', 'Aguardando ação de terceiro', FALSE, FALSE, 3)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('occurrences', 'RESOLVIDA', 'Resolvida', 'Ocorrência resolvida', FALSE, TRUE, 4)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('occurrences', 'ENCERRADA', 'Encerrada', 'Ocorrência encerrada', FALSE, TRUE, 5)
ON CONFLICT (entity_type, state) DO NOTHING;

-- ============================================
-- STATE MACHINE: FINANCIAL_EXITS (payment_status)
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_exits', 'PENDING', 'Pendente', 'Saída criada, aguardando aprovação', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_exits', 'APPROVED', 'Aprovada', 'Saída aprovada, aguardando pagamento', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_exits', 'PAID', 'Paga', 'Saída paga (final)', FALSE, TRUE, 3)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_exits', 'REJECTED', 'Rejeitada', 'Saída rejeitada', FALSE, TRUE, 4)
ON CONFLICT (entity_type, state) DO NOTHING;

-- ============================================
-- STATE MACHINE: FINANCIAL_ENTRIES (received)
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_entries', 'PENDING', 'Pendente', 'Entrada criada, aguardando recebimento', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_entries', 'RECEIVED', 'Recebida', 'Entrada recebida (final)', FALSE, TRUE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

-- ============================================
-- STATE MACHINE: CHECKLISTS
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('checklists', 'PENDING', 'Pendente', 'Item de checklist pendente', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('checklists', 'DONE', 'Feito', 'Item concluído', FALSE, TRUE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('checklists', 'NOT_DONE', 'Não Feito', 'Item não concluído', FALSE, TRUE, 3)
ON CONFLICT (entity_type, state) DO NOTHING;

-- ============================================
-- STATE MACHINE: ASSETS
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('assets', 'ACTIVE', 'Ativo', 'Ativo em funcionamento', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('assets', 'INACTIVE', 'Inativo', 'Ativo inativo', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('assets', 'MAINTENANCE', 'Em Manutenção', 'Ativo em manutenção', FALSE, FALSE, 3)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('assets', 'DECOMMISSIONED', 'Desativado', 'Ativo desativado permanentemente', FALSE, TRUE, 4)
ON CONFLICT (entity_type, state) DO NOTHING;

-- ============================================
-- STATE MACHINE: DOCUMENTS
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('documents', 'ACTIVE', 'Ativo', 'Documento ativo', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('documents', 'EXPIRED', 'Vencido', 'Documento vencido', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('documents', 'ARCHIVED', 'Arquivado', 'Documento arquivado', FALSE, TRUE, 3)
ON CONFLICT (entity_type, state) DO NOTHING;

-- ============================================
-- STATE MACHINE: BUDGET_REQUESTS
-- ============================================
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('budget_requests', 'PENDING', 'Pendente', 'Solicitação aguardando aprovação', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('budget_requests', 'APPROVED', 'Aprovada', 'Solicitação aprovada', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('budget_requests', 'REJECTED', 'Rejeitada', 'Solicitação rejeitada', FALSE, TRUE, 3)
ON CONFLICT (entity_type, state) DO NOTHING;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('budget_requests', 'PURCHASED', 'Comprada', 'Solicitação comprada/executada', FALSE, TRUE, 4)
ON CONFLICT (entity_type, state) DO NOTHING;

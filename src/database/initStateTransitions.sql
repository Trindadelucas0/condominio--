-- Script de inserção de transições de estado permitidas
-- Define quais transições são válidas e quais permissões são necessárias
-- Executado após a criação das state machines

-- ============================================
-- TRANSIÇÕES: TASKS
-- ============================================
-- PENDING -> IN_PROGRESS (automático quando atribuído)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('tasks', 'PENDING', 'IN_PROGRESS', 'tasks:read', 'Tarefa iniciada')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- PENDING/IN_PROGRESS -> COMPLETED (operacional completa)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('tasks', 'PENDING', 'COMPLETED', 'tasks:complete', 'Tarefa concluída')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('tasks', 'IN_PROGRESS', 'COMPLETED', 'tasks:complete', 'Tarefa concluída')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- COMPLETED -> PENDING (reabertura - apenas síndico)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('tasks', 'COMPLETED', 'PENDING', 'tasks:reopen', 'Tarefa reaberta')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- Qualquer -> CANCELLED (cancelamento - administrativo)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('tasks', 'PENDING', 'CANCELLED', 'tasks:update', 'Tarefa cancelada')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ============================================
-- TRANSIÇÕES: OCCURRENCES
-- ============================================
-- ABERTA -> EM_ATENDIMENTO (após triagem e atribuição)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'ABERTA', 'EM_ATENDIMENTO', 'occurrences:triage', 'Ocorrência triada e atribuída')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- EM_ATENDIMENTO -> AGUARDANDO_TERCEIRO
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'EM_ATENDIMENTO', 'AGUARDANDO_TERCEIRO', 'occurrences:update', 'Aguardando ação de terceiro')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- AGUARDANDO_TERCEIRO -> EM_ATENDIMENTO
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'AGUARDANDO_TERCEIRO', 'EM_ATENDIMENTO', 'occurrences:update', 'Retomada do atendimento')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ABERTA -> RESOLVIDA (operacional resolve sua própria ocorrência diretamente)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'ABERTA', 'RESOLVIDA', 'occurrences:resolve', 'Ocorrência resolvida diretamente pelo operacional')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- EM_ATENDIMENTO/AGUARDANDO_TERCEIRO -> RESOLVIDA (operacional resolve)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'EM_ATENDIMENTO', 'RESOLVIDA', 'occurrences:resolve', 'Ocorrência resolvida')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'AGUARDANDO_TERCEIRO', 'RESOLVIDA', 'occurrences:resolve', 'Ocorrência resolvida')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- RESOLVIDA -> ENCERRADA (fechamento final)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'RESOLVIDA', 'ENCERRADA', 'occurrences:update', 'Ocorrência encerrada')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- RESOLVIDA/ENCERRADA -> ABERTA (reabertura - apenas síndico)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'RESOLVIDA', 'ABERTA', 'occurrences:reopen', 'Ocorrência reaberta')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('occurrences', 'ENCERRADA', 'ABERTA', 'occurrences:reopen', 'Ocorrência reaberta')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ============================================
-- TRANSIÇÕES: FINANCIAL_EXITS
-- ============================================
-- PENDING -> APPROVED (aprovação - ADMINISTRATIVO até limite, SINDICO acima)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_exits', 'PENDING', 'APPROVED', 'financial_exits:approve', 'Saída aprovada (até limite)')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_exits', 'PENDING', 'APPROVED', 'financial_exits:approve_high_value', 'Saída aprovada (acima do limite)')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- PENDING -> REJECTED (rejeição - apenas síndico)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_exits', 'PENDING', 'REJECTED', 'financial_exits:approve_high_value', 'Saída rejeitada')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- APPROVED -> PAID (pagamento - financeiro)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_exits', 'APPROVED', 'PAID', 'financial_exits:pay', 'Saída paga')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- REJECTED -> PENDING (reabertura - apenas síndico)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_exits', 'REJECTED', 'PENDING', 'financial_exits:reopen', 'Saída reaberta')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ============================================
-- TRANSIÇÕES: FINANCIAL_ENTRIES
-- ============================================
-- PENDING -> RECEIVED (marcar como recebida - financeiro)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_entries', 'PENDING', 'RECEIVED', 'financial_entries:mark_received', 'Entrada recebida')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ============================================
-- TRANSIÇÕES: CHECKLISTS
-- ============================================
-- PENDING -> DONE (marcar como feito)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('checklists', 'PENDING', 'DONE', 'tasks:complete', 'Item marcado como feito')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- PENDING -> NOT_DONE (marcar como não feito)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('checklists', 'PENDING', 'NOT_DONE', 'tasks:complete', 'Item marcado como não feito')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- DONE/NOT_DONE -> PENDING (reverter)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('checklists', 'DONE', 'PENDING', 'tasks:complete', 'Item revertido para pendente')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('checklists', 'NOT_DONE', 'PENDING', 'tasks:complete', 'Item revertido para pendente')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ============================================
-- TRANSIÇÕES: ASSETS
-- ============================================
-- ACTIVE -> MAINTENANCE (registrar manutenção)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('assets', 'ACTIVE', 'MAINTENANCE', 'assets:register_maintenance', 'Ativo em manutenção')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- MAINTENANCE -> ACTIVE (manutenção concluída)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('assets', 'MAINTENANCE', 'ACTIVE', 'assets:register_maintenance', 'Manutenção concluída')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ACTIVE/MAINTENANCE -> INACTIVE (desativar temporariamente)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('assets', 'ACTIVE', 'INACTIVE', 'assets:update', 'Ativo desativado')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('assets', 'MAINTENANCE', 'INACTIVE', 'assets:update', 'Ativo desativado')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- INACTIVE -> ACTIVE (reativar)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('assets', 'INACTIVE', 'ACTIVE', 'assets:update', 'Ativo reativado')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- Qualquer -> DECOMMISSIONED (desativar permanentemente)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('assets', 'ACTIVE', 'DECOMMISSIONED', 'assets:update', 'Ativo desativado permanentemente')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('assets', 'INACTIVE', 'DECOMMISSIONED', 'assets:update', 'Ativo desativado permanentemente')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ============================================
-- TRANSIÇÕES: DOCUMENTS
-- ============================================
-- ACTIVE -> EXPIRED (vencimento automático)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('documents', 'ACTIVE', 'EXPIRED', 'documents:read', 'Documento vencido')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ACTIVE/EXPIRED -> ARCHIVED (arquivar)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('documents', 'ACTIVE', 'ARCHIVED', 'documents:update', 'Documento arquivado')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('documents', 'EXPIRED', 'ARCHIVED', 'documents:update', 'Documento arquivado')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- ============================================
-- TRANSIÇÕES: BUDGET_REQUESTS
-- ============================================
-- PENDING -> APPROVED (aprovação - síndico)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'PENDING', 'APPROVED', 'budget_requests:approve', 'Solicitação aprovada')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- PENDING -> REJECTED (rejeição - síndico)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'PENDING', 'REJECTED', 'budget_requests:approve', 'Solicitação rejeitada')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

-- APPROVED -> PURCHASED (comprada/executada)
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'APPROVED', 'PURCHASED', 'budget_requests:update', 'Solicitação comprada/executada')
ON CONFLICT (entity_type, from_state, to_state) DO NOTHING;

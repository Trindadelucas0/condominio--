-- Script de extensão - FASE 22b (Estados adicionais para State Machines)
-- Adiciona novos estados para budget_requests e financial_entries

-- Adicionar novos estados para budget_requests
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('budget_requests', 'PENDING_FINANCEIRO', 'Aguardando Financeiro', 'Aguardando análise do financeiro', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_initial = EXCLUDED.is_initial,
  is_final = EXCLUDED.is_final,
  display_order = EXCLUDED.display_order;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('budget_requests', 'PENDING_SINDICO', 'Aguardando Síndico', 'Aguardando aprovação do síndico', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_initial = EXCLUDED.is_initial,
  is_final = EXCLUDED.is_final,
  display_order = EXCLUDED.display_order;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('budget_requests', 'LIBERATED', 'Liberado', 'Orçamento liberado para operacional', FALSE, FALSE, 5)
ON CONFLICT (entity_type, state) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_initial = EXCLUDED.is_initial,
  is_final = EXCLUDED.is_final,
  display_order = EXCLUDED.display_order;

-- Adicionar novos estados para financial_entries
INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_entries', 'PENDING_REVIEW', 'Aguardando Análise', 'Aguardando análise do síndico', TRUE, FALSE, 1)
ON CONFLICT (entity_type, state) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_initial = EXCLUDED.is_initial,
  is_final = EXCLUDED.is_final,
  display_order = EXCLUDED.display_order;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_entries', 'APPROVED', 'Aprovada', 'Entrada aprovada pelo síndico', FALSE, FALSE, 2)
ON CONFLICT (entity_type, state) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_initial = EXCLUDED.is_initial,
  is_final = EXCLUDED.is_final,
  display_order = EXCLUDED.display_order;

INSERT INTO state_machines (entity_type, state, display_name, description, is_initial, is_final, display_order) VALUES
  ('financial_entries', 'REJECTED', 'Rejeitada', 'Entrada rejeitada pelo síndico', FALSE, FALSE, 3)
ON CONFLICT (entity_type, state) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_initial = EXCLUDED.is_initial,
  is_final = EXCLUDED.is_final,
  display_order = EXCLUDED.display_order;

-- Adicionar transições para budget_requests
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'PENDING_FINANCEIRO', 'PENDING_SINDICO', 'budget_requests:review_financeiro', 'Financeiro revisou e enviou para síndico')
ON CONFLICT DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'PENDING_SINDICO', 'APPROVED', 'budget_requests:approve', 'Síndico aprovou')
ON CONFLICT DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'PENDING_SINDICO', 'REJECTED', 'budget_requests:approve', 'Síndico rejeitou')
ON CONFLICT DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'APPROVED', 'LIBERATED', 'budget_requests:release', 'Financeiro liberou para operacional')
ON CONFLICT DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('budget_requests', 'APPROVED', 'PENDING_SINDICO', 'budget_requests:release', 'Financeiro retornou para síndico')
ON CONFLICT DO NOTHING;

-- Adicionar transições para financial_entries
INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_entries', 'PENDING_REVIEW', 'APPROVED', 'financial_entries:approve', 'Síndico aprovou entrada')
ON CONFLICT DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_entries', 'PENDING_REVIEW', 'REJECTED', 'financial_entries:approve', 'Síndico rejeitou entrada')
ON CONFLICT DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_entries', 'APPROVED', 'RECEIVED', 'financial_entries:mark_received', 'Entrada recebida')
ON CONFLICT DO NOTHING;

INSERT INTO state_transitions (entity_type, from_state, to_state, required_permission, description) VALUES
  ('financial_entries', 'REJECTED', 'PENDING_REVIEW', 'financial_entries:update', 'Financeiro editou e reenviou')
ON CONFLICT DO NOTHING;

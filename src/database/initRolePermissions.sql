-- Script de atribuição de permissões aos papéis
-- Define quais permissões cada papel tem
-- Executado após a criação das permissões

-- ============================================
-- PERMISSÕES PARA OPERACIONAL
-- ============================================
-- O operacional pode criar, ler, atualizar e resolver ocorrências
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'OPERACIONAL'
  AND p.entity_type = 'occurrences'
  AND p.action IN ('create', 'read', 'update', 'resolve', 'add_observation')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- O operacional pode completar tarefas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'OPERACIONAL'
  AND p.entity_type = 'tasks'
  AND p.action IN ('read', 'complete', 'add_observation')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA SINDICO
-- ============================================
-- O síndico pode fazer tudo com ocorrências (exceto resolver diretamente - isso é do operacional)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SINDICO', 'SUBSINDICO')
  AND p.entity_type = 'occurrences'
  AND p.action IN ('read', 'update', 'triage', 'reopen', 'add_observation')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- O síndico pode aprovar saídas financeiras de alto valor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SINDICO', 'SUBSINDICO')
  AND p.entity_type = 'financial_exits'
  AND p.action IN ('read', 'approve', 'approve_high_value', 'view_receipt')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- O síndico pode aprovar entradas financeiras
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SINDICO', 'SUBSINDICO')
  AND p.entity_type = 'financial_entries'
  AND p.action IN ('read', 'update', 'mark_received', 'view_receipt')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- O síndico pode aprovar orçamentos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('SINDICO', 'SUBSINDICO')
  AND p.entity_type = 'budget_requests'
  AND p.action IN ('read', 'approve')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA FINANCEIRO
-- ============================================
-- O financeiro pode criar, ler e atualizar entradas e saídas
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'FINANCEIRO'
  AND p.entity_type IN ('financial_entries', 'financial_exits')
  AND p.action IN ('create', 'read', 'update', 'pay', 'view_receipt')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- O financeiro pode aprovar saídas até o limite configurado
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'FINANCEIRO'
  AND p.entity_type = 'financial_exits'
  AND p.action = 'approve'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- O financeiro pode revisar orçamentos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'FINANCEIRO'
  AND p.entity_type = 'budget_requests'
  AND p.action IN ('read', 'update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA ADMINISTRATIVO
-- ============================================
-- O administrativo pode criar tarefas e triar ocorrências
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMINISTRATIVO'
  AND p.entity_type = 'tasks'
  AND p.action IN ('create', 'read', 'update', 'delete', 'add_observation')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMINISTRATIVO'
  AND p.entity_type = 'occurrences'
  AND p.action IN ('read', 'triage', 'add_observation')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- PERMISSÕES PARA SUPER_MASTER
-- ============================================
-- O super master tem todas as permissões
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_MASTER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

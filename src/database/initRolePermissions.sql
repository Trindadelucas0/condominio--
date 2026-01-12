-- Script de atribuição de permissões aos perfis
-- Define quais perfis têm quais permissões
-- Executado após a criação das permissões

-- ============================================
-- SUPER_MASTER - Permissões completas
-- ============================================
-- SUPER_MASTER tem acesso a tudo relacionado a usuários e condomínios
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SUPER_MASTER'
  AND p.entity_type IN ('users', 'condominiums')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- SINDICO - Aprovações e visualização
-- ============================================
-- SINDICO pode aprovar valores altos e visualizar tudo
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SINDICO'
  AND (
    -- Aprovações
    (p.entity_type = 'financial_exits' AND p.action = 'approve_high_value') OR
    -- Visualização completa
    (p.action = 'read') OR
    -- Observações
    (p.action = 'add_observation') OR
    -- Reaberturas
    (p.action = 'reopen')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- SUBSINDICO - Mesmas permissões do SINDICO
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SUBSINDICO'
  AND (
    -- Aprovações
    (p.entity_type = 'financial_exits' AND p.action = 'approve_high_value') OR
    -- Visualização completa
    (p.action = 'read') OR
    -- Observações
    (p.action = 'add_observation') OR
    -- Reaberturas
    (p.action = 'reopen')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- ADMINISTRATIVO - Organização e triagem
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMINISTRATIVO'
  AND (
    -- Tarefas
    (p.entity_type = 'tasks' AND p.action IN ('create', 'read', 'update', 'reopen')) OR
    -- Ocorrências
    (p.entity_type = 'occurrences' AND p.action IN ('read', 'triage', 'reopen')) OR
    -- Documentos
    (p.entity_type = 'documents' AND p.action IN ('create', 'read', 'update', 'delete')) OR
    -- Orçamentos
    (p.entity_type = 'budget_requests' AND p.action IN ('create', 'read')) OR
    -- Aprovações até limite (DECISÃO: ADMINISTRATIVO aprova até limite)
    (p.entity_type = 'financial_exits' AND p.action = 'approve') OR
    -- Estoque
    (p.entity_type = 'inventory_items' AND p.action IN ('create', 'read', 'update', 'movement'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- FINANCEIRO - Gestão financeira
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'FINANCEIRO'
  AND (
    -- Entradas
    (p.entity_type = 'financial_entries' AND p.action IN ('create', 'read', 'update', 'mark_received', 'view_receipt')) OR
    -- Saídas
    (p.entity_type = 'financial_exits' AND p.action IN ('create', 'read', 'update', 'pay', 'view_receipt', 'reopen')) OR
    -- Consumo mensal
    (p.entity_type = 'monthly_consumption' AND p.action IN ('create', 'read', 'update'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- PATRIMONIO - Gestão de ativos
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'PATRIMONIO'
  AND (
    -- Ativos
    (p.entity_type = 'assets' AND p.action IN ('create', 'read', 'update', 'register_maintenance', 'calculate_depreciation'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- OPERACIONAL - Execução
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'OPERACIONAL'
  AND (
    -- Tarefas (apenas suas)
    (p.entity_type = 'tasks' AND p.action IN ('read', 'complete')) OR
    -- Ocorrências
    (p.entity_type = 'occurrences' AND p.action IN ('create', 'read', 'resolve'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- LIMPEZA - Ocorrências de limpeza
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'LIMPEZA'
  AND (
    -- Ocorrências (apenas de limpeza)
    (p.entity_type = 'occurrences' AND p.action IN ('create', 'read'))
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- CONSELHO - Apenas leitura
-- ============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'CONSELHO'
  AND (
    -- Apenas visualização
    (p.action = 'read')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

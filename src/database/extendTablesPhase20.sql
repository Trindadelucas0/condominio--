-- Script de extensão das tabelas - FASE 20 (PERMISSÕES FORMAIS E STATE MACHINE)
-- Adiciona sistema formal de permissões (AÇÃO x ENTIDADE) e padronização de estados
-- Executado após a criação das tabelas anteriores

-- Tabela de permissões formais
-- Define todas as ações possíveis sobre entidades
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY, -- ID único
  entity_type VARCHAR(50) NOT NULL, -- Tipo de entidade (tasks, occurrences, financial_exits, etc)
  action VARCHAR(50) NOT NULL, -- Ação (create, read, update, delete, approve, pay, complete, etc)
  description TEXT, -- Descrição da permissão
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  UNIQUE(entity_type, action) -- Uma permissão única por entidade+ação
);

-- Tabela de mapeamento role_permissions
-- Define quais perfis têm quais permissões
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY, -- ID único
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE, -- Perfil
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, -- Permissão
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de atribuição
  UNIQUE(role_id, permission_id) -- Um perfil não pode ter a mesma permissão duplicada
);

-- Tabela de state machines padronizadas
-- Define estados válidos e transições permitidas para cada entidade
CREATE TABLE IF NOT EXISTS state_machines (
  id SERIAL PRIMARY KEY, -- ID único
  entity_type VARCHAR(50) NOT NULL, -- Tipo de entidade
  state VARCHAR(50) NOT NULL, -- Estado (ex: PENDING, APPROVED, PAID)
  display_name VARCHAR(100) NOT NULL, -- Nome para exibição
  description TEXT, -- Descrição do estado
  is_initial BOOLEAN DEFAULT FALSE, -- Se é estado inicial
  is_final BOOLEAN DEFAULT FALSE, -- Se é estado final
  display_order INTEGER DEFAULT 0, -- Ordem de exibição
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  UNIQUE(entity_type, state) -- Um estado único por entidade
);

-- Tabela de transições de estado permitidas
-- Define quais transições são válidas (de -> para)
CREATE TABLE IF NOT EXISTS state_transitions (
  id SERIAL PRIMARY KEY, -- ID único
  entity_type VARCHAR(50) NOT NULL, -- Tipo de entidade
  from_state VARCHAR(50) NOT NULL, -- Estado de origem
  to_state VARCHAR(50) NOT NULL, -- Estado de destino
  required_permission VARCHAR(100), -- Permissão necessária (entity_type:action)
  description TEXT, -- Descrição da transição
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  UNIQUE(entity_type, from_state, to_state) -- Transição única
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_permissions_entity ON permissions(entity_type); -- Busca por entidade
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id); -- Busca por perfil
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id); -- Busca por permissão
CREATE INDEX IF NOT EXISTS idx_state_machines_entity ON state_machines(entity_type); -- Busca por entidade
CREATE INDEX IF NOT EXISTS idx_state_transitions_entity ON state_transitions(entity_type); -- Busca por entidade
CREATE INDEX IF NOT EXISTS idx_state_transitions_from ON state_transitions(from_state); -- Busca por estado origem

-- Script de criação inicial do banco de dados
-- Este arquivo contém todas as tabelas base do sistema
-- É executado automaticamente ao iniciar o servidor se as tabelas não existirem

-- Tabela de condomínios
-- Armazena informações dos condomínios cadastrados no sistema
CREATE TABLE IF NOT EXISTS condominiums (
  id SERIAL PRIMARY KEY, -- ID único e auto-incremento
  name VARCHAR(255) NOT NULL, -- Nome do condomínio (obrigatório)
  address TEXT, -- Endereço completo
  cnpj VARCHAR(18) UNIQUE, -- CNPJ único (se houver)
  phone VARCHAR(20), -- Telefone de contato
  email VARCHAR(255), -- Email de contato
  active BOOLEAN DEFAULT TRUE, -- Status ativo/inativo (soft delete)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  archived_at TIMESTAMP NULL -- Data de arquivamento (soft delete)
);

-- Tabela de perfis/roles
-- Define os tipos de usuários do sistema (SUPER_MASTER, SINDICO, etc)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY, -- ID único
  name VARCHAR(50) UNIQUE NOT NULL, -- Nome do perfil (SUPER_MASTER, SINDICO, etc)
  description TEXT, -- Descrição do que o perfil pode fazer
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Tabela de usuários
-- Armazena dados de login e informações básicas dos usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, -- ID único
  username VARCHAR(100) UNIQUE NOT NULL, -- Nome de usuário único (usado no login)
  email VARCHAR(255) UNIQUE NOT NULL, -- Email único
  password_hash VARCHAR(255) NOT NULL, -- Senha criptografada com bcrypt
  full_name VARCHAR(255) NOT NULL, -- Nome completo
  condominium_id INTEGER REFERENCES condominiums(id) ON DELETE SET NULL, -- Vinculação ao condomínio (pode ser NULL para SUPER_MASTER)
  active BOOLEAN DEFAULT TRUE, -- Status ativo/inativo (soft delete)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  archived_at TIMESTAMP NULL, -- Data de arquivamento
  last_login TIMESTAMP NULL -- Data do último login
);

-- Tabela de relacionamento usuário-perfil
-- Um usuário pode ter múltiplos perfis (ex: SINDICO + ADMINISTRATIVO)
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY, -- ID único
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- ID do usuário
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE, -- ID do perfil
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de atribuição
  UNIQUE(user_id, role_id) -- Um usuário não pode ter o mesmo perfil duplicado
);

-- Tabela de logs de auditoria
-- Registra TODAS as ações importantes do sistema (imutável)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY, -- ID único
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Usuário que executou a ação (pode ser NULL se sistema)
  condominium_id INTEGER REFERENCES condominiums(id) ON DELETE SET NULL, -- Condomínio relacionado (pode ser NULL)
  action VARCHAR(100) NOT NULL, -- Tipo de ação (CREATE, UPDATE, DELETE, LOGIN, etc)
  module VARCHAR(50) NOT NULL, -- Módulo onde ocorreu (USER, FINANCIAL, MAINTENANCE, etc)
  entity_type VARCHAR(50) NOT NULL, -- Tipo de entidade afetada (users, condominiums, etc)
  entity_id INTEGER, -- ID da entidade afetada
  before_data JSONB, -- Estado ANTES da alteração (JSON)
  after_data JSONB, -- Estado DEPOIS da alteração (JSON)
  ip_address VARCHAR(45), -- IP de origem da ação
  user_agent TEXT, -- Navegador/dispositivo usado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data/hora exata da ação (nunca altera)
);

-- Índices para melhorar performance de consultas frequentes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username); -- Busca rápida por username
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); -- Busca rápida por email
CREATE INDEX IF NOT EXISTS idx_users_condominium ON users(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id); -- Busca de perfis do usuário
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id); -- Filtros de auditoria por usuário
CREATE INDEX IF NOT EXISTS idx_audit_logs_condominium ON audit_logs(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at); -- Ordenação por data
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module); -- Filtros por módulo

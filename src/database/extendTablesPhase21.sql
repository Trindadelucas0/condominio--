-- Script de extensão das tabelas - FASE 21 (VALIDAÇÕES E CONSTRAINTS)
-- Adiciona constraints de segurança e validações em nível de banco
-- Executado após a criação das tabelas anteriores

-- ============================================
-- CONSTRAINTS CHECK PARA CONDOMINIUM_ID
-- ============================================

-- Garante que condominium_id não é NULL em tabelas críticas
DO $$
BEGIN
  -- Financial entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_financial_entries_condominium_not_null'
  ) THEN
    ALTER TABLE financial_entries 
    ADD CONSTRAINT check_financial_entries_condominium_not_null 
    CHECK (condominium_id IS NOT NULL);
  END IF;

  -- Financial exits
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_financial_exits_condominium_not_null'
  ) THEN
    ALTER TABLE financial_exits 
    ADD CONSTRAINT check_financial_exits_condominium_not_null 
    CHECK (condominium_id IS NOT NULL);
  END IF;

  -- Tasks
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_tasks_condominium_not_null'
  ) THEN
    ALTER TABLE tasks 
    ADD CONSTRAINT check_tasks_condominium_not_null 
    CHECK (condominium_id IS NOT NULL);
  END IF;

  -- Occurrences
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_occurrences_condominium_not_null'
  ) THEN
    ALTER TABLE occurrences 
    ADD CONSTRAINT check_occurrences_condominium_not_null 
    CHECK (condominium_id IS NOT NULL);
  END IF;

  -- Assets
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_assets_condominium_not_null'
  ) THEN
    ALTER TABLE assets 
    ADD CONSTRAINT check_assets_condominium_not_null 
    CHECK (condominium_id IS NOT NULL);
  END IF;

  -- Documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_documents_condominium_not_null'
  ) THEN
    ALTER TABLE documents 
    ADD CONSTRAINT check_documents_condominium_not_null 
    CHECK (condominium_id IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- CONSTRAINTS CHECK PARA VALORES FINANCEIROS
-- ============================================

-- Garante que valores financeiros são positivos e dentro de limites
DO $$
BEGIN
  -- Financial entries: valor deve ser positivo e <= 10 milhões
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_financial_entries_amount_valid'
  ) THEN
    ALTER TABLE financial_entries 
    ADD CONSTRAINT check_financial_entries_amount_valid 
    CHECK (amount > 0 AND amount <= 10000000);
  END IF;

  -- Financial exits: valor deve ser positivo e <= 10 milhões
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_financial_exits_amount_valid'
  ) THEN
    ALTER TABLE financial_exits 
    ADD CONSTRAINT check_financial_exits_amount_valid 
    CHECK (amount > 0 AND amount <= 10000000);
  END IF;

  -- Approval limit: deve ser positivo se não NULL
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_financial_exits_approval_limit_valid'
  ) THEN
    ALTER TABLE financial_exits 
    ADD CONSTRAINT check_financial_exits_approval_limit_valid 
    CHECK (approval_limit IS NULL OR (approval_limit > 0 AND approval_limit <= 10000000));
  END IF;
END $$;

-- ============================================
-- ADICIONA CAMPOS DE VERSÃO PARA LOCK OTIMISTA
-- ============================================

-- Adiciona campo version para controle de concorrência
DO $$
BEGIN
  -- Financial exits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_exits' AND column_name = 'version'
  ) THEN
    ALTER TABLE financial_exits ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  -- Financial entries
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_entries' AND column_name = 'version'
  ) THEN
    ALTER TABLE financial_entries ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  -- Tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'version'
  ) THEN
    ALTER TABLE tasks ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  -- Occurrences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'occurrences' AND column_name = 'version'
  ) THEN
    ALTER TABLE occurrences ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  -- Assets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'version'
  ) THEN
    ALTER TABLE assets ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_financial_exits_version ON financial_exits(version);
CREATE INDEX IF NOT EXISTS idx_financial_entries_version ON financial_entries(version);
CREATE INDEX IF NOT EXISTS idx_tasks_version ON tasks(version);
CREATE INDEX IF NOT EXISTS idx_occurrences_version ON occurrences(version);

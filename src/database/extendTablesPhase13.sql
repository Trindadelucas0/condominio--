-- Script de extensão das tabelas - FASE 13 (REABERTURA)
-- Adiciona campos necessários para reabertura de ocorrências, tarefas e despesas
-- Executado após a criação das tabelas anteriores
--
-- OBJETIVO: Permitir reabertura de itens fechados/rejeitados
-- REGRA: Toda reabertura gera log especial

-- Adiciona campos de reabertura na tabela de ocorrências
-- REGRA: Síndico pode reabrir ocorrências
DO $$
BEGIN
  -- Adiciona campos de reabertura se não existirem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='reopened') THEN
    ALTER TABLE occurrences ADD COLUMN reopened BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='reopened_at') THEN
    ALTER TABLE occurrences ADD COLUMN reopened_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='reopened_by') THEN
    ALTER TABLE occurrences ADD COLUMN reopened_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='reopening_reason') THEN
    ALTER TABLE occurrences ADD COLUMN reopening_reason TEXT;
  END IF;
END $$;

-- Adiciona campos de reabertura na tabela de tarefas
-- REGRA: Administrativo ou Síndico pode reabrir tarefas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='reopened') THEN
    ALTER TABLE tasks ADD COLUMN reopened BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='reopened_at') THEN
    ALTER TABLE tasks ADD COLUMN reopened_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='reopened_by') THEN
    ALTER TABLE tasks ADD COLUMN reopened_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='reopening_reason') THEN
    ALTER TABLE tasks ADD COLUMN reopening_reason TEXT;
  END IF;
END $$;

-- Adiciona campos de reabertura na tabela de despesas (financial_exits)
-- REGRA: Financeiro pode criar nova despesa (rejeitada vira nova) + Síndico aprova
-- Na prática, não reabre a despesa rejeitada, mas cria nova
-- Mas vamos adicionar campo para histórico
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='reopened') THEN
    ALTER TABLE financial_exits ADD COLUMN reopened BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='reopened_at') THEN
    ALTER TABLE financial_exits ADD COLUMN reopened_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='reopened_by') THEN
    ALTER TABLE financial_exits ADD COLUMN reopened_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='reopening_reason') THEN
    ALTER TABLE financial_exits ADD COLUMN reopening_reason TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='reopened_from_id') THEN
    ALTER TABLE financial_exits ADD COLUMN reopened_from_id INTEGER REFERENCES financial_exits(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_occurrences_reopened ON occurrences(reopened); -- Filtros por reabertas
CREATE INDEX IF NOT EXISTS idx_tasks_reopened ON tasks(reopened); -- Filtros por reabertas
CREATE INDEX IF NOT EXISTS idx_financial_exits_reopened ON financial_exits(reopened); -- Filtros por reabertas

-- Script de extensão das tabelas - FASE 19 (RECORRÊNCIA E PROJEÇÕES)
-- Adiciona campos para recorrência em entradas e saídas financeiras
-- Executado após a criação das tabelas anteriores

-- Adiciona campos de recorrência em financial_entries
DO $$
BEGIN
  -- Campo para indicar se é recorrente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='is_recurring') THEN
    ALTER TABLE financial_entries ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Campo para indicar tipo de recorrência (MONTHLY, QUARTERLY, YEARLY, UNIQUE)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='recurrence_type') THEN
    ALTER TABLE financial_entries ADD COLUMN recurrence_type VARCHAR(20) DEFAULT 'UNIQUE';
  END IF;
  
  -- Campo para indicar se valor é variável (para projeções)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='is_variable') THEN
    ALTER TABLE financial_entries ADD COLUMN is_variable BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Campo para valor médio (quando variável, usa média para projeções)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='average_amount') THEN
    ALTER TABLE financial_entries ADD COLUMN average_amount DECIMAL(15,2) NULL;
  END IF;
END $$;

-- Adiciona campos de recorrência em financial_exits
DO $$
BEGIN
  -- Campo para indicar se é recorrente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='is_recurring') THEN
    ALTER TABLE financial_exits ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Campo para indicar tipo de recorrência (MONTHLY, QUARTERLY, YEARLY, UNIQUE)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='recurrence_type') THEN
    ALTER TABLE financial_exits ADD COLUMN recurrence_type VARCHAR(20) DEFAULT 'UNIQUE';
  END IF;
  
  -- Campo para indicar se valor é variável (para projeções)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='is_variable') THEN
    ALTER TABLE financial_exits ADD COLUMN is_variable BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Campo para valor médio (quando variável, usa média para projeções)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='average_amount') THEN
    ALTER TABLE financial_exits ADD COLUMN average_amount DECIMAL(15,2) NULL;
  END IF;
END $$;

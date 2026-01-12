-- Script de correção - Adiciona colunas faltantes da FASE 22
-- Execute este script se as colunas não foram criadas corretamente

-- Adicionar colunas em financial_entries se não existirem
DO $$
BEGIN
  -- review_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'financial_entries' 
                 AND column_name = 'review_status') THEN
    ALTER TABLE financial_entries ADD COLUMN review_status VARCHAR(20) DEFAULT 'PENDING_REVIEW';
    RAISE NOTICE 'Coluna review_status adicionada em financial_entries';
  ELSE
    RAISE NOTICE 'Coluna review_status já existe em financial_entries';
  END IF;
  
  -- reviewed_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'financial_entries' 
                 AND column_name = 'reviewed_by') THEN
    ALTER TABLE financial_entries ADD COLUMN reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna reviewed_by adicionada em financial_entries';
  END IF;
  
  -- reviewed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'financial_entries' 
                 AND column_name = 'reviewed_at') THEN
    ALTER TABLE financial_entries ADD COLUMN reviewed_at TIMESTAMP NULL;
    RAISE NOTICE 'Coluna reviewed_at adicionada em financial_entries';
  END IF;
  
  -- review_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'financial_entries' 
                 AND column_name = 'review_notes') THEN
    ALTER TABLE financial_entries ADD COLUMN review_notes TEXT;
    RAISE NOTICE 'Coluna review_notes adicionada em financial_entries';
  END IF;
  
  -- rejection_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'financial_entries' 
                 AND column_name = 'rejection_reason') THEN
    ALTER TABLE financial_entries ADD COLUMN rejection_reason TEXT;
    RAISE NOTICE 'Coluna rejection_reason adicionada em financial_entries';
  END IF;
  
  -- linked_to_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'financial_entries' 
                 AND column_name = 'linked_to_id') THEN
    ALTER TABLE financial_entries ADD COLUMN linked_to_id INTEGER REFERENCES financial_entries(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna linked_to_id adicionada em financial_entries';
  END IF;
  
  -- linked_to_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'financial_entries' 
                 AND column_name = 'linked_to_type') THEN
    ALTER TABLE financial_entries ADD COLUMN linked_to_type VARCHAR(50);
    RAISE NOTICE 'Coluna linked_to_type adicionada em financial_entries';
  END IF;
END $$;

-- Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_financial_entries_review_status ON financial_entries(review_status);

-- Atualizar registros existentes para ter review_status = 'APPROVED' se já foram recebidos
UPDATE financial_entries 
SET review_status = 'APPROVED' 
WHERE review_status IS NULL 
  AND received = TRUE;

-- Atualizar registros que não foram recebidos e não têm review_status
UPDATE financial_entries 
SET review_status = 'PENDING_REVIEW' 
WHERE review_status IS NULL 
  AND received = FALSE;

-- Garantir que todos os registros tenham review_status
UPDATE financial_entries 
SET review_status = 'PENDING_REVIEW' 
WHERE review_status IS NULL;

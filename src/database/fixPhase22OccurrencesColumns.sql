-- Script de correção - Adiciona colunas faltantes em occurrences da FASE 22
-- Execute este script se as colunas não foram criadas corretamente

-- Adicionar colunas em occurrences se não existirem
DO $$
BEGIN
  -- requires_approval
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'requires_approval') THEN
    ALTER TABLE occurrences ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna requires_approval adicionada em occurrences';
  END IF;
  
  -- approval_required_from
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'approval_required_from') THEN
    ALTER TABLE occurrences ADD COLUMN approval_required_from VARCHAR(50);
    RAISE NOTICE 'Coluna approval_required_from adicionada em occurrences';
  END IF;
  
  -- approval_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'approval_status') THEN
    ALTER TABLE occurrences ADD COLUMN approval_status VARCHAR(20) DEFAULT 'PENDING';
    RAISE NOTICE 'Coluna approval_status adicionada em occurrences';
  END IF;
  
  -- approved_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'approved_by') THEN
    ALTER TABLE occurrences ADD COLUMN approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna approved_by adicionada em occurrences';
  END IF;
  
  -- approved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'approved_at') THEN
    ALTER TABLE occurrences ADD COLUMN approved_at TIMESTAMP NULL;
    RAISE NOTICE 'Coluna approved_at adicionada em occurrences';
  END IF;
  
  -- approval_rejection_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'approval_rejection_reason') THEN
    ALTER TABLE occurrences ADD COLUMN approval_rejection_reason TEXT;
    RAISE NOTICE 'Coluna approval_rejection_reason adicionada em occurrences';
  END IF;
  
  -- sent_to_user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'sent_to_user_id') THEN
    ALTER TABLE occurrences ADD COLUMN sent_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna sent_to_user_id adicionada em occurrences';
  END IF;
  
  -- sent_to_role
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'sent_to_role') THEN
    ALTER TABLE occurrences ADD COLUMN sent_to_role VARCHAR(50);
    RAISE NOTICE 'Coluna sent_to_role adicionada em occurrences';
  END IF;
  
  -- occurrence_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'occurrence_type') THEN
    ALTER TABLE occurrences ADD COLUMN occurrence_type VARCHAR(50) DEFAULT 'NON_ROUTINE';
    RAISE NOTICE 'Coluna occurrence_type adicionada em occurrences';
  END IF;
  
  -- is_in_checklist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'is_in_checklist') THEN
    ALTER TABLE occurrences ADD COLUMN is_in_checklist BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna is_in_checklist adicionada em occurrences';
  END IF;
  
  -- is_routine_task
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'is_routine_task') THEN
    ALTER TABLE occurrences ADD COLUMN is_routine_task BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna is_routine_task adicionada em occurrences';
  END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_occurrences_requires_approval ON occurrences(requires_approval);
CREATE INDEX IF NOT EXISTS idx_occurrences_approval_status ON occurrences(approval_status);
CREATE INDEX IF NOT EXISTS idx_occurrences_sent_to_user ON occurrences(sent_to_user_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_sent_to_role ON occurrences(sent_to_role);

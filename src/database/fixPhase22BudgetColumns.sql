-- Script de correção - Adiciona colunas faltantes em budget_requests da FASE 22
-- Execute este script se as colunas não foram criadas corretamente

-- Adicionar colunas em budget_requests se não existirem
DO $$
BEGIN
  -- financeiro_reviewed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'financeiro_reviewed') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_reviewed BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna financeiro_reviewed adicionada em budget_requests';
  END IF;
  
  -- financeiro_reviewed_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'financeiro_reviewed_by') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna financeiro_reviewed_by adicionada em budget_requests';
  END IF;
  
  -- financeiro_reviewed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'financeiro_reviewed_at') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_reviewed_at TIMESTAMP NULL;
    RAISE NOTICE 'Coluna financeiro_reviewed_at adicionada em budget_requests';
  END IF;
  
  -- financeiro_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'financeiro_notes') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_notes TEXT;
    RAISE NOTICE 'Coluna financeiro_notes adicionada em budget_requests';
  END IF;
  
  -- sindico_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'sindico_notes') THEN
    ALTER TABLE budget_requests ADD COLUMN sindico_notes TEXT;
    RAISE NOTICE 'Coluna sindico_notes adicionada em budget_requests';
  END IF;
  
  -- budget_approved_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'budget_approved_amount') THEN
    ALTER TABLE budget_requests ADD COLUMN budget_approved_amount DECIMAL(15,2);
    RAISE NOTICE 'Coluna budget_approved_amount adicionada em budget_requests';
  END IF;
  
  -- released_to_operational
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'released_to_operational') THEN
    ALTER TABLE budget_requests ADD COLUMN released_to_operational BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna released_to_operational adicionada em budget_requests';
  END IF;
  
  -- released_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'released_at') THEN
    ALTER TABLE budget_requests ADD COLUMN released_at TIMESTAMP NULL;
    RAISE NOTICE 'Coluna released_at adicionada em budget_requests';
  END IF;
  
  -- released_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'budget_requests' 
                 AND column_name = 'released_by') THEN
    ALTER TABLE budget_requests ADD COLUMN released_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Coluna released_by adicionada em budget_requests';
  END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_budget_requests_financeiro_reviewed ON budget_requests(financeiro_reviewed);
CREATE INDEX IF NOT EXISTS idx_budget_requests_released ON budget_requests(released_to_operational);

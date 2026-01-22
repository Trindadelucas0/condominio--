-- Script de extensão das tabelas - FASE 30
-- 1. Vinculação Taxas com Entradas Financeiras
-- 2. Permitir Múltiplas Comandas do Mesmo Mês
-- Executado após a criação das tabelas anteriores

-- ============================================
-- 1. VINCULAÇÃO TAXAS COM ENTRADAS FINANCEIRAS
-- ============================================
DO $$
BEGIN
  -- Adiciona financial_entry_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'monthly_fees' AND column_name = 'financial_entry_id'
  ) THEN
    ALTER TABLE monthly_fees 
    ADD COLUMN financial_entry_id INTEGER REFERENCES financial_entries(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Coluna financial_entry_id adicionada à tabela monthly_fees.';
  ELSE
    RAISE NOTICE 'Coluna financial_entry_id já existe na tabela monthly_fees.';
  END IF;
END $$;

-- ============================================
-- 2. REMOVER CONSTRAINT DE UNICIDADE DE FECHAMENTOS MENSALS
-- ============================================
-- Permite criar múltiplas comandas (fechamentos) para o mesmo mês/ano
-- Cada comanda mantém seu próprio ID único

DO $$
BEGIN
  -- Remove a constraint UNIQUE se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'monthly_closures_condominium_id_month_year_key'
    AND table_name = 'monthly_closures'
  ) THEN
    ALTER TABLE monthly_closures 
    DROP CONSTRAINT monthly_closures_condominium_id_month_year_key;
    
    RAISE NOTICE 'Constraint de unicidade removida com sucesso. Agora é possível criar múltiplas comandas do mesmo mês.';
  ELSE
    RAISE NOTICE 'Constraint de unicidade não encontrada. Pode já ter sido removida anteriormente.';
  END IF;
END $$;

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON TABLE monthly_closures IS 'Fechamentos mensais financeiros - permite múltiplas comandas por mês/ano. Cada comanda mantém seu ID único.';
COMMENT ON COLUMN monthly_closures.id IS 'ID único de cada comanda. Permite múltiplas comandas do mesmo mês/ano.';
COMMENT ON COLUMN monthly_closures.status IS 'Status: OPEN (aberto), CLOSING (fechando), CLOSED (fechado), REOPENED (reaberto)';
COMMENT ON COLUMN monthly_fees.financial_entry_id IS 'Vinculação com entrada financeira relacionada (se houver)';

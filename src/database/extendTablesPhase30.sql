-- Script de extensão das tabelas - FASE 30 (VINCULAÇÃO TAXAS COM ENTRADAS FINANCEIRAS)
-- Adiciona campo para vincular taxas mensais com entradas financeiras
-- Executado após a criação das tabelas anteriores

-- Adiciona campo financial_entry_id na tabela monthly_fees
-- Para vincular a taxa com a entrada financeira criada automaticamente
DO $$
BEGIN
  -- Adiciona financial_entry_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='monthly_fees' AND column_name='financial_entry_id') THEN
    ALTER TABLE monthly_fees 
    ADD COLUMN financial_entry_id INTEGER REFERENCES financial_entries(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Coluna financial_entry_id adicionada em monthly_fees';
  ELSE
    RAISE NOTICE 'Coluna financial_entry_id já existe em monthly_fees';
  END IF;
END $$;

-- Índice para melhorar performance na busca de entrada financeira pela taxa
CREATE INDEX IF NOT EXISTS idx_monthly_fees_financial_entry ON monthly_fees(financial_entry_id);

-- Comentário explicativo
COMMENT ON COLUMN monthly_fees.financial_entry_id IS 'ID da entrada financeira criada automaticamente quando a taxa é gerada - atualiza o saldo do condomínio';

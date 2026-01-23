-- Script de extensão das tabelas - FASE 31 (FUNDO DE RESERVA NO FECHAMENTO MENSAL)
-- Adiciona campo para valor do fundo de reserva no fechamento mensal

-- Adiciona coluna reserve_fund_amount na tabela monthly_closures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='monthly_closures' AND column_name='reserve_fund_amount'
  ) THEN
    ALTER TABLE monthly_closures 
    ADD COLUMN reserve_fund_amount DECIMAL(15,2) DEFAULT 0;
    
    COMMENT ON COLUMN monthly_closures.reserve_fund_amount IS 'Valor adicionado ao fundo de reserva neste fechamento';
  END IF;
END $$;

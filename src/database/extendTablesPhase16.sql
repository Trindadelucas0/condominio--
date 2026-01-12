-- Script de extensão das tabelas - FASE 16 (COMPROVANTES DE RECEBIMENTO)
-- Adiciona campos para armazenar comprovante PDF e detalhes do recebimento
-- Executado após a criação das tabelas anteriores

-- Adiciona campos na tabela financial_entries para comprovante de recebimento
DO $$
BEGIN
  -- Adiciona campo para caminho do PDF do comprovante
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='receipt_pdf_path') THEN
    ALTER TABLE financial_entries ADD COLUMN receipt_pdf_path VARCHAR(500) NULL;
  END IF;
  
  -- Adiciona campo para detalhes do recebimento (formulário estruturado)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='receipt_details') THEN
    ALTER TABLE financial_entries ADD COLUMN receipt_details TEXT NULL;
  END IF;
  
  -- Adiciona campo para método de recebimento (PIX, Transferência, Dinheiro, Cheque, etc)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='receipt_method') THEN
    ALTER TABLE financial_entries ADD COLUMN receipt_method VARCHAR(50) NULL;
  END IF;
  
  -- Adiciona campo para observações adicionais sobre o recebimento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='receipt_notes') THEN
    ALTER TABLE financial_entries ADD COLUMN receipt_notes TEXT NULL;
  END IF;
END $$;

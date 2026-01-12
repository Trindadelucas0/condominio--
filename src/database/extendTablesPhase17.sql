-- Script de extensão das tabelas - FASE 17 (COMPROVANTES DE PAGAMENTO)
-- Adiciona campos para armazenar comprovante PDF e detalhes do pagamento em saídas
-- Executado após a criação das tabelas anteriores

-- Adiciona campos na tabela financial_exits para comprovante de pagamento
DO $$
BEGIN
  -- Adiciona campo para caminho do PDF do comprovante
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='payment_receipt_pdf_path') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_receipt_pdf_path VARCHAR(500) NULL;
  END IF;
  
  -- Adiciona campo para detalhes do pagamento (formulário estruturado)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='payment_details') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_details TEXT NULL;
  END IF;
  
  -- Adiciona campo para método de pagamento (PIX, Transferência, Dinheiro, Cheque, etc)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='payment_method') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_method VARCHAR(50) NULL;
  END IF;
  
  -- Adiciona campo para observações adicionais sobre o pagamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='payment_notes') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_notes TEXT NULL;
  END IF;
END $$;

-- Script de extensão das tabelas - FASE 34 (COMPROVANTE DE PAGAMENTO EM SAÍDAS)
-- Adiciona campos para comprovante PDF e detalhes do pagamento em financial_exits
-- Usado ao "marcar como paga" uma saída aprovada

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'financial_exits' AND column_name = 'payment_receipt_pdf_path') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_receipt_pdf_path VARCHAR(500) NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'financial_exits' AND column_name = 'payment_details') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_details TEXT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'financial_exits' AND column_name = 'payment_method') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_method VARCHAR(50) NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'financial_exits' AND column_name = 'payment_notes') THEN
    ALTER TABLE financial_exits ADD COLUMN payment_notes TEXT NULL;
  END IF;
END $$;

COMMENT ON COLUMN financial_exits.payment_receipt_pdf_path IS 'Caminho do PDF do comprovante de pagamento (obrigatório ao marcar como paga)';
COMMENT ON COLUMN financial_exits.payment_details IS 'Detalhes do pagamento (ex.: número do documento, referência)';
COMMENT ON COLUMN financial_exits.payment_method IS 'Método de pagamento (PIX, BOLETO, TRANSFERENCIA, etc)';
COMMENT ON COLUMN financial_exits.payment_notes IS 'Observações sobre o pagamento';

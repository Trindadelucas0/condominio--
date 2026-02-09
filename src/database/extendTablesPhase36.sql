-- FASE 36: Anexo do boleto ao cadastrar vencimento (payable_items)
-- Permite anexar PDF do boleto ao adicionar novo boleto/vencimento

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payable_items' AND column_name = 'boleto_pdf_path') THEN
    ALTER TABLE payable_items ADD COLUMN boleto_pdf_path VARCHAR(500) NULL;
  END IF;
END $$;

COMMENT ON COLUMN payable_items.boleto_pdf_path IS 'Anexo do boleto (PDF) ao cadastrar o vencimento; opcional.';

-- Script de extensão das tabelas - FASE 24 (ANEXOS ESPECÍFICOS)
-- Adiciona campos para anexos específicos (nota fiscal, foto serviço, etc)

-- ============================================
-- 1. ADICIONAR CAMPO DE NOTA FISCAL EM SAÍDAS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='invoice_path') THEN
    ALTER TABLE financial_exits ADD COLUMN invoice_path VARCHAR(500) NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='invoice_file_name') THEN
    ALTER TABLE financial_exits ADD COLUMN invoice_file_name VARCHAR(255) NULL;
  END IF;
END $$;

-- ============================================
-- 2. ADICIONAR CAMPO DE FOTO DE SERVIÇO EM MANUTENÇÕES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='maintenances' AND column_name='service_photo_path') THEN
    ALTER TABLE maintenances ADD COLUMN service_photo_path VARCHAR(500) NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='maintenances' AND column_name='service_photo_file_name') THEN
    ALTER TABLE maintenances ADD COLUMN service_photo_file_name VARCHAR(255) NULL;
  END IF;
END $$;

-- ============================================
-- 3. COMENTÁRIOS
-- ============================================
COMMENT ON COLUMN financial_exits.invoice_path IS 'Caminho do arquivo da nota fiscal anexada';
COMMENT ON COLUMN financial_exits.invoice_file_name IS 'Nome original do arquivo da nota fiscal';
COMMENT ON COLUMN maintenances.service_photo_path IS 'Caminho da foto do serviço realizado';
COMMENT ON COLUMN maintenances.service_photo_file_name IS 'Nome original do arquivo da foto';

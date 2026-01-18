-- Script de extensão das tabelas - FASE 25 (CONTRATOS E RELATÓRIOS AVANÇADOS)
-- Adiciona suporte completo para gestão de contratos e relatórios financeiros avançados
-- Executado após a criação das tabelas anteriores

-- ============================================
-- 1. TABELA DE CONTRATOS (Gestão completa)
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  contract_number VARCHAR(100), -- Número do contrato
  title VARCHAR(255) NOT NULL, -- Título/nome do contrato
  description TEXT, -- Descrição detalhada
  supplier_name VARCHAR(255) NOT NULL, -- Nome do fornecedor/prestador
  supplier_document VARCHAR(50), -- CPF/CNPJ do fornecedor
  supplier_contact VARCHAR(255), -- Contato do fornecedor
  contract_type VARCHAR(50) DEFAULT 'SERVICE', -- Tipo: SERVICE, PRODUCT, MAINTENANCE, SECURITY, CLEANING, etc
  start_date DATE NOT NULL, -- Data de início
  end_date DATE, -- Data de término (NULL para sem prazo)
  renewal_date DATE, -- Data para renovação (calculado automaticamente)
  monthly_value DECIMAL(15,2), -- Valor mensal (se aplicável)
  total_value DECIMAL(15,2), -- Valor total do contrato
  payment_day INTEGER, -- Dia do mês para pagamento (1-28)
  document_path VARCHAR(500), -- Caminho do arquivo do contrato
  document_file_name VARCHAR(255), -- Nome do arquivo
  status VARCHAR(20) DEFAULT 'ACTIVE', -- Status: ACTIVE, EXPIRED, TERMINATED, RENEWED
  auto_renew BOOLEAN DEFAULT FALSE, -- Se renova automaticamente
  alert_30_days BOOLEAN DEFAULT TRUE, -- Alertar 30 dias antes do vencimento
  alert_60_days BOOLEAN DEFAULT TRUE, -- Alertar 60 dias antes do vencimento
  alert_90_days BOOLEAN DEFAULT TRUE, -- Alertar 90 dias antes do vencimento
  notes TEXT, -- Observações gerais
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  terminated_at TIMESTAMP NULL, -- Data de rescisão (se houver)
  terminated_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem terminou
  termination_reason TEXT -- Motivo da rescisão
);

-- Tabela de histórico de contratos (versionamento)
CREATE TABLE IF NOT EXISTS contract_history (
  id SERIAL PRIMARY KEY, -- ID único
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE, -- Contrato
  version_number INTEGER NOT NULL, -- Número da versão
  action VARCHAR(50) NOT NULL, -- Ação: CREATED, UPDATED, RENEWED, TERMINATED
  old_data JSONB, -- Dados antes da mudança
  new_data JSONB, -- Dados após a mudança
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem alterou
  change_reason TEXT, -- Motivo da alteração
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da alteração
);

-- Índices para contratos
CREATE INDEX IF NOT EXISTS idx_contracts_condominium ON contracts(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date); -- Busca por vencimento
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date ON contracts(renewal_date); -- Busca por renovação
CREATE INDEX IF NOT EXISTS idx_contract_history_contract ON contract_history(contract_id); -- Histórico por contrato

-- ============================================
-- 2. MELHORIAS NA TABELA DE DOCUMENTOS
-- ============================================
DO $$
BEGIN
  -- Adiciona campo de versão se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='version') THEN
    ALTER TABLE documents ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
  
  -- Adiciona campo de documento pai (para versionamento)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='parent_document_id') THEN
    ALTER TABLE documents ADD COLUMN parent_document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
  
  -- Adiciona campo de pasta se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='folder') THEN
    ALTER TABLE documents ADD COLUMN folder VARCHAR(255);
  END IF;
  
  -- Adiciona campo de tags (JSON)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='tags') THEN
    ALTER TABLE documents ADD COLUMN tags JSONB;
  END IF;
  
  -- Adiciona campo para compartilhamento seguro
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='share_token') THEN
    ALTER TABLE documents ADD COLUMN share_token VARCHAR(100) UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='share_expires_at') THEN
    ALTER TABLE documents ADD COLUMN share_expires_at TIMESTAMP NULL;
  END IF;
END $$;

-- Tabela de links compartilhados para documentos
CREATE TABLE IF NOT EXISTS document_shares (
  id SERIAL PRIMARY KEY, -- ID único
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE, -- Documento
  token VARCHAR(100) UNIQUE NOT NULL, -- Token único para acesso
  shared_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem compartilhou
  expires_at TIMESTAMP NULL, -- Data de expiração do link
  access_count INTEGER DEFAULT 0, -- Contador de acessos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder); -- Busca por pasta
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id); -- Versionamento
CREATE INDEX IF NOT EXISTS idx_documents_share_token ON documents(share_token); -- Links compartilhados
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(token); -- Busca por token

-- ============================================
-- 3. CENTROS DE CUSTO HIERÁRQUICOS
-- ============================================
DO $$
BEGIN
  -- Adiciona campo de pai (para hierarquia) se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='cost_centers' AND column_name='parent_id') THEN
    ALTER TABLE cost_centers ADD COLUMN parent_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL;
  END IF;
  
  -- Adiciona campo de orçamento anual se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='cost_centers' AND column_name='budget_amount') THEN
    ALTER TABLE cost_centers ADD COLUMN budget_amount DECIMAL(15,2);
  END IF;
  
  -- Adiciona campo de ano do orçamento se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='cost_centers' AND column_name='budget_year') THEN
    ALTER TABLE cost_centers ADD COLUMN budget_year INTEGER;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cost_centers_parent ON cost_centers(parent_id); -- Hierarquia

-- ============================================
-- 4. REGRAS DE INADIMPLÊNCIA (na tabela de configurações)
-- ============================================
-- Será gerenciado via condominium_settings com chaves específicas:
-- - late_fee_percentage (percentual de multa)
-- - late_fee_amount (valor fixo de multa)
-- - interest_rate (taxa de juros ao mês)
-- - days_before_late (dias para considerar em atraso)
-- - late_notification_days (dias para enviar notificação)

-- ============================================
-- 5. PERÍODOS DE FECHAMENTO
-- ============================================
DO $$
BEGIN
  -- Adiciona campo de bloqueio para novos lançamentos após fechamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='monthly_closures' AND column_name='blocks_new_entries') THEN
    ALTER TABLE monthly_closures ADD COLUMN blocks_new_entries BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- ============================================
-- 6. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE contracts IS 'Tabela de contratos do condomínio (fornecedores, prestadores de serviço)';
COMMENT ON TABLE contract_history IS 'Histórico de alterações dos contratos (versionamento)';
COMMENT ON TABLE document_shares IS 'Links compartilhados para acesso temporário a documentos';
COMMENT ON COLUMN documents.version IS 'Versão do documento (para versionamento)';
COMMENT ON COLUMN documents.parent_document_id IS 'ID do documento pai (para versionamento)';
COMMENT ON COLUMN documents.folder IS 'Pasta/categoria adicional para organização';
COMMENT ON COLUMN documents.tags IS 'Tags para busca e categorização (array JSON)';
COMMENT ON COLUMN documents.share_token IS 'Token único para compartilhamento temporário';
COMMENT ON COLUMN cost_centers.parent_id IS 'ID do centro de custo pai (para hierarquia)';
COMMENT ON COLUMN cost_centers.budget_amount IS 'Orçamento anual do centro de custo';

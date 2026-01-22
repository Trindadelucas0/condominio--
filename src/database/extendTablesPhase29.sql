-- Script de extensão das tabelas - FASE 29 (MÚLTIPLOS ORÇAMENTOS POR SOLICITAÇÃO)
-- Adiciona suporte para múltiplos orçamentos (cotações) em uma solicitação
-- Executado após a criação das tabelas anteriores

-- Tabela de cotações/orçamentos
-- Permite múltiplos orçamentos por solicitação (para comparação)
CREATE TABLE IF NOT EXISTS budget_quotes (
  id SERIAL PRIMARY KEY, -- ID único
  budget_request_id INTEGER NOT NULL REFERENCES budget_requests(id) ON DELETE CASCADE, -- Solicitação relacionada
  supplier_name VARCHAR(255) NOT NULL, -- Nome do fornecedor
  supplier_contact VARCHAR(255), -- Contato do fornecedor (telefone, email, etc)
  quote_value DECIMAL(15,2) NOT NULL, -- Valor do orçamento
  quote_description TEXT, -- Descrição detalhada do orçamento
  quote_validity_date DATE, -- Validade do orçamento
  status VARCHAR(20) DEFAULT 'PENDING', -- Status: PENDING, APPROVED, REJECTED
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem aprovou este orçamento
  approved_at TIMESTAMP NULL, -- Quando foi aprovado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Adiciona campos em budget_requests se não existirem
DO $$
BEGIN
  -- Campo para referenciar o orçamento aprovado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='approved_quote_id') THEN
    ALTER TABLE budget_requests ADD COLUMN approved_quote_id INTEGER REFERENCES budget_quotes(id) ON DELETE SET NULL;
  END IF;
  
  -- Campo para referenciar a saída financeira criada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='related_financial_exit_id') THEN
    ALTER TABLE budget_requests ADD COLUMN related_financial_exit_id INTEGER REFERENCES financial_exits(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adiciona campos em financial_exits se não existirem
DO $$
BEGIN
  -- Campo para referenciar a solicitação de orçamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='related_budget_request_id') THEN
    ALTER TABLE financial_exits ADD COLUMN related_budget_request_id INTEGER REFERENCES budget_requests(id) ON DELETE SET NULL;
  END IF;
  
  -- Campo para referenciar o orçamento aprovado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='related_budget_quote_id') THEN
    ALTER TABLE financial_exits ADD COLUMN related_budget_quote_id INTEGER REFERENCES budget_quotes(id) ON DELETE SET NULL;
  END IF;
  
  -- Campo para indicar se precisa verificação
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='needs_verification') THEN
    ALTER TABLE financial_exits ADD COLUMN needs_verification BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Campo para indicar se foi verificado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='verified') THEN
    ALTER TABLE financial_exits ADD COLUMN verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Campo para quem verificou
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='verified_by') THEN
    ALTER TABLE financial_exits ADD COLUMN verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- Campo para quando foi verificado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='verified_at') THEN
    ALTER TABLE financial_exits ADD COLUMN verified_at TIMESTAMP NULL;
  END IF;
END $$;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_budget_quotes_request ON budget_quotes(budget_request_id); -- Filtros por solicitação
CREATE INDEX IF NOT EXISTS idx_budget_quotes_status ON budget_quotes(status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_budget_requests_approved_quote ON budget_requests(approved_quote_id); -- Filtros por orçamento aprovado
CREATE INDEX IF NOT EXISTS idx_financial_exits_budget_request ON financial_exits(related_budget_request_id); -- Filtros por solicitação
CREATE INDEX IF NOT EXISTS idx_financial_exits_needs_verification ON financial_exits(needs_verification) WHERE needs_verification = TRUE; -- Filtros por saídas que precisam verificação

-- Comentários
COMMENT ON TABLE budget_quotes IS 'Cotações/orçamentos de fornecedores para uma solicitação de orçamento';
COMMENT ON COLUMN budget_quotes.supplier_name IS 'Nome do fornecedor que forneceu o orçamento';
COMMENT ON COLUMN budget_quotes.quote_value IS 'Valor do orçamento fornecido';
COMMENT ON COLUMN budget_quotes.status IS 'Status: PENDING (pendente), APPROVED (aprovado), REJECTED (rejeitado)';
COMMENT ON COLUMN budget_requests.approved_quote_id IS 'Referência ao orçamento que foi aprovado pelo síndico';
COMMENT ON COLUMN budget_requests.related_financial_exit_id IS 'Referência à saída financeira criada automaticamente ao aprovar';
COMMENT ON COLUMN financial_exits.needs_verification IS 'Se a saída precisa ser verificada pelo financeiro (criada automaticamente de orçamento)';
COMMENT ON COLUMN financial_exits.verified IS 'Se a saída foi verificada pelo financeiro';

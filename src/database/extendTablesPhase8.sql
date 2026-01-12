-- Script de extensão das tabelas - FASE 8 (FINANCEIRO)
-- Adiciona tabelas necessárias para funcionalidades financeiras
-- Executado após a criação das tabelas anteriores

-- Tabela de centros de custo
-- Organiza despesas por centro de custo (Manutenção, Contas, Contratos, etc)
CREATE TABLE IF NOT EXISTS cost_centers (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  name VARCHAR(100) NOT NULL, -- Nome do centro de custo
  description TEXT, -- Descrição do centro de custo
  active BOOLEAN DEFAULT TRUE, -- Status ativo/inativo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Tabela de entradas financeiras (receitas)
-- Registra todas as entradas de dinheiro do condomínio
CREATE TABLE IF NOT EXISTS financial_entries (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  description TEXT NOT NULL, -- Descrição da entrada
  amount DECIMAL(15,2) NOT NULL, -- Valor da entrada
  entry_date DATE NOT NULL, -- Data da entrada
  cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL, -- Centro de custo
  category VARCHAR(50) DEFAULT 'TAXA', -- Categoria: TAXA, RECEITA, OUTRA
  received BOOLEAN DEFAULT FALSE, -- Se foi recebido
  received_at TIMESTAMP NULL, -- Data do recebimento
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Tabela de contas recorrentes (água, luz, gás)
-- Registra contas que se repetem mensalmente
CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  name VARCHAR(255) NOT NULL, -- Nome da conta (Ex: Conta de Água)
  bill_type VARCHAR(50) NOT NULL, -- Tipo: AGUA, LUZ, GAS, TELEFONE, INTERNET, OUTRA
  cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL, -- Centro de custo
  provider VARCHAR(255), -- Fornecedor/prestador
  account_number VARCHAR(100), -- Número da conta/cliente
  recurring BOOLEAN DEFAULT TRUE, -- Se é recorrente
  active BOOLEAN DEFAULT TRUE, -- Status ativo/inativo
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Atualiza tabela financial_exits para incluir relacionamento com cost_center e bill
-- Adiciona colunas se não existirem (usando IF NOT EXISTS através de DO)
DO $$
BEGIN
  -- Adiciona cost_center_id se não existir (substitui cost_center VARCHAR)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='cost_center_id') THEN
    ALTER TABLE financial_exits ADD COLUMN cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL;
  END IF;
  
  -- Adiciona bill_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='bill_id') THEN
    ALTER TABLE financial_exits ADD COLUMN bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL;
  END IF;
  
  -- Adiciona approval_limit se não existir (limite de aprovação do administrativo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='approval_limit') THEN
    ALTER TABLE financial_exits ADD COLUMN approval_limit DECIMAL(15,2) DEFAULT 1000.00;
  END IF;
END $$;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_cost_centers_condominium ON cost_centers(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_financial_entries_condominium ON financial_entries(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_financial_entries_date ON financial_entries(entry_date); -- Ordenação por data
CREATE INDEX IF NOT EXISTS idx_financial_entries_cost_center ON financial_entries(cost_center_id); -- Filtros por centro de custo
CREATE INDEX IF NOT EXISTS idx_bills_condominium ON bills(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(bill_type); -- Filtros por tipo
CREATE INDEX IF NOT EXISTS idx_financial_exits_cost_center ON financial_exits(cost_center_id); -- Filtros por centro de custo
CREATE INDEX IF NOT EXISTS idx_financial_exits_bill ON financial_exits(bill_id); -- Filtros por conta

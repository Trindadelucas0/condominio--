-- Script FASE 35: Contas a pagar - novos campos em bills + tabela payable_items
-- Executado após FASE 34
-- Não altera comportamento existente; apenas adiciona colunas e tabela nova

-- Novos campos em bills (todos opcionais/default para não quebrar fluxo atual)
DO $$
BEGIN
  -- Dia do vencimento (1-31) para contas fixas/recorrentes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'due_day') THEN
    ALTER TABLE bills ADD COLUMN due_day INTEGER CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 31));
  END IF;
  -- Tipo: FIXA (recorrente) ou VARIAVEL (pontual)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'account_kind') THEN
    ALTER TABLE bills ADD COLUMN account_kind VARCHAR(20) DEFAULT 'FIXA' CHECK (account_kind IN ('FIXA', 'VARIAVEL'));
  END IF;
  -- Frequência para contas fixas: DAILY, WEEKLY, MONTHLY, YEARLY
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'recurrence') THEN
    ALTER TABLE bills ADD COLUMN recurrence VARCHAR(20) DEFAULT 'MONTHLY' CHECK (recurrence IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'));
  END IF;
  -- Comprovante do cadastro da conta (PDF)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'receipt_pdf_path') THEN
    ALTER TABLE bills ADD COLUMN receipt_pdf_path VARCHAR(500) NULL;
  END IF;
END $$;

-- Tabela de itens a pagar (cada linha = um vencimento)
CREATE TABLE IF NOT EXISTS payable_items (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description VARCHAR(500),
  cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
  paid_at TIMESTAMP NULL,
  financial_exit_id INTEGER REFERENCES financial_exits(id) ON DELETE SET NULL,
  receipt_pdf_path VARCHAR(500) NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evita duplicar mesmo vencimento para a mesma conta (bill_id); itens variáveis (bill_id NULL) não têm essa restrição
CREATE UNIQUE INDEX IF NOT EXISTS idx_payable_items_unique_bill_due
  ON payable_items(condominium_id, bill_id, due_date) WHERE bill_id IS NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payable_items_condominium ON payable_items(condominium_id);
CREATE INDEX IF NOT EXISTS idx_payable_items_due_date ON payable_items(due_date);
CREATE INDEX IF NOT EXISTS idx_payable_items_status ON payable_items(status);
CREATE INDEX IF NOT EXISTS idx_payable_items_bill ON payable_items(bill_id);

-- Comentários
COMMENT ON TABLE payable_items IS 'Itens de contas a pagar - cada linha é um vencimento (data, valor, status). Ao pagar, gera financial_exit e atualiza status.';
COMMENT ON COLUMN bills.due_day IS 'Dia do mês (1-31) em que a conta vence - usado para gerar payable_items em contas fixas.';
COMMENT ON COLUMN bills.account_kind IS 'FIXA = recorrente (gera vencimentos); VARIAVEL = pontual (item avulso).';
COMMENT ON COLUMN bills.recurrence IS 'Frequência para contas fixas: DAILY, WEEKLY, MONTHLY, YEARLY.';

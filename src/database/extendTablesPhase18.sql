-- Script de extensão das tabelas - FASE 18 (CONSUMO MENSAL E KPIs)
-- Adiciona tabela para registrar consumo mensal de contas (água, energia, etc.)
-- Executado após a criação das tabelas anteriores

-- Tabela de consumo mensal de contas
-- Registra consumo e valores mensais de água, energia, gás, etc.
CREATE TABLE IF NOT EXISTS monthly_consumption (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE, -- Conta relacionada
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12), -- Mês (1-12)
  year INTEGER NOT NULL CHECK (year >= 2020), -- Ano
  consumption_value DECIMAL(15,2), -- Valor do consumo (ex: m³ de água, kWh de energia)
  consumption_unit VARCHAR(20) DEFAULT 'UNIDADE', -- Unidade: M3, KWH, M3_GAS, etc.
  bill_amount DECIMAL(15,2) NOT NULL, -- Valor da conta em R$
  due_date DATE, -- Data de vencimento
  paid BOOLEAN DEFAULT FALSE, -- Se foi paga
  paid_at TIMESTAMP NULL, -- Data do pagamento
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  UNIQUE(condominium_id, bill_id, month, year) -- Evita duplicatas
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_monthly_consumption_condominium ON monthly_consumption(condominium_id);
CREATE INDEX IF NOT EXISTS idx_monthly_consumption_bill ON monthly_consumption(bill_id);
CREATE INDEX IF NOT EXISTS idx_monthly_consumption_date ON monthly_consumption(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_consumption_unique ON monthly_consumption(condominium_id, bill_id, month, year);

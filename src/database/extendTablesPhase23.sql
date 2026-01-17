-- Script de extensão das tabelas - FASE 23 (FECHAMENTO MENSAL, INADIMPLÊNCIA, ASSEMBLEIAS, FUNDO DE RESERVA)
-- Adiciona tabelas necessárias para funcionalidades críticas faltantes
-- Executado após a criação das tabelas anteriores

-- ============================================
-- 1. TABELA DE FECHAMENTOS MENSALS
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_closures (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12), -- Mês (1-12)
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100), -- Ano
  status VARCHAR(20) DEFAULT 'OPEN', -- Status: OPEN, CLOSING, CLOSED, REOPENED
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem fechou
  closed_at TIMESTAMP NULL, -- Data/hora do fechamento
  reopened_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem reabriu (se reaberto)
  reopened_at TIMESTAMP NULL, -- Data/hora da reabertura
  reopening_reason TEXT, -- Motivo da reabertura (obrigatório se reaberto)
  notes TEXT, -- Observações do fechamento
  total_entries DECIMAL(15,2) DEFAULT 0, -- Total de entradas do mês
  total_exits DECIMAL(15,2) DEFAULT 0, -- Total de saídas do mês
  balance DECIMAL(15,2) DEFAULT 0, -- Saldo do mês (entradas - saídas)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  UNIQUE(condominium_id, month, year) -- Um fechamento por mês/ano por condomínio
);

-- Índices para fechamentos mensais
CREATE INDEX IF NOT EXISTS idx_monthly_closures_condominium ON monthly_closures(condominium_id);
CREATE INDEX IF NOT EXISTS idx_monthly_closures_date ON monthly_closures(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_closures_status ON monthly_closures(status);

-- ============================================
-- 2. TABELA DE APARTAMENTOS (Para Inadimplência)
-- ============================================
CREATE TABLE IF NOT EXISTS apartments (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  number VARCHAR(20) NOT NULL, -- Número do apartamento (ex: "101", "A-12")
  block VARCHAR(50), -- Bloco (se houver)
  owner_name VARCHAR(255), -- Nome do proprietário
  owner_document VARCHAR(50), -- CPF/CNPJ do proprietário
  owner_phone VARCHAR(20), -- Telefone do proprietário
  owner_email VARCHAR(255), -- Email do proprietário
  fraction_ideal DECIMAL(10,4), -- Fração ideal (para rateio proporcional)
  active BOOLEAN DEFAULT TRUE, -- Se está ativo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  UNIQUE(condominium_id, number, block) -- Número único por condomínio/bloco
);

-- Índices para apartamentos
CREATE INDEX IF NOT EXISTS idx_apartments_condominium ON apartments(condominium_id);
CREATE INDEX IF NOT EXISTS idx_apartments_number ON apartments(number, block);

-- ============================================
-- 3. TABELA DE TAXAS MENSALS (Para Inadimplência)
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_fees (
  id SERIAL PRIMARY KEY, -- ID único
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE, -- Apartamento
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio (redundante para performance)
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12), -- Mês (1-12)
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100), -- Ano
  amount DECIMAL(15,2) NOT NULL, -- Valor da taxa
  due_date DATE NOT NULL, -- Data de vencimento
  paid BOOLEAN DEFAULT FALSE, -- Se foi paga
  paid_at TIMESTAMP NULL, -- Data/hora do pagamento
  payment_method VARCHAR(50), -- Método de pagamento (PIX, BOLETO, TRANSFERENCIA, etc)
  payment_receipt_path VARCHAR(500), -- Caminho do comprovante (PDF)
  days_overdue INTEGER DEFAULT 0, -- Dias em atraso (calculado automaticamente)
  late_fee DECIMAL(15,2) DEFAULT 0, -- Multa por atraso
  interest DECIMAL(15,2) DEFAULT 0, -- Juros por atraso
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  UNIQUE(apartment_id, month, year) -- Uma taxa por apartamento/mês/ano
);

-- Índices para taxas mensais
CREATE INDEX IF NOT EXISTS idx_monthly_fees_apartment ON monthly_fees(apartment_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_condominium ON monthly_fees(condominium_id);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_date ON monthly_fees(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_due_date ON monthly_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_paid ON monthly_fees(paid);
CREATE INDEX IF NOT EXISTS idx_monthly_fees_overdue ON monthly_fees(days_overdue) WHERE paid = FALSE;

-- ============================================
-- 4. TABELA DE ASSEMBLEIAS
-- ============================================
CREATE TABLE IF NOT EXISTS assemblies (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  date DATE NOT NULL, -- Data da assembleia
  time TIME, -- Horário da assembleia
  type VARCHAR(50) NOT NULL, -- Tipo: ORDINARIA, EXTRAORDINARIA, ESPECIAL
  location VARCHAR(255), -- Local da assembleia
  agenda TEXT, -- Pauta da assembleia
  quorum INTEGER, -- Quórum necessário (número de apartamentos)
  quorum_achieved BOOLEAN DEFAULT FALSE, -- Se atingiu quórum
  status VARCHAR(20) DEFAULT 'SCHEDULED', -- Status: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Índices para assembleias
CREATE INDEX IF NOT EXISTS idx_assemblies_condominium ON assemblies(condominium_id);
CREATE INDEX IF NOT EXISTS idx_assemblies_date ON assemblies(date);
CREATE INDEX IF NOT EXISTS idx_assemblies_status ON assemblies(status);

-- ============================================
-- 5. TABELA DE PARTICIPANTES DE ASSEMBLEIA
-- ============================================
CREATE TABLE IF NOT EXISTS assembly_participants (
  id SERIAL PRIMARY KEY, -- ID único
  assembly_id INTEGER NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE, -- Assembleia
  apartment_id INTEGER REFERENCES apartments(id) ON DELETE SET NULL, -- Apartamento (opcional)
  owner_name VARCHAR(255) NOT NULL, -- Nome do participante
  owner_document VARCHAR(50), -- CPF/CNPJ do participante
  present BOOLEAN DEFAULT FALSE, -- Se estava presente
  signed BOOLEAN DEFAULT FALSE, -- Se assinou a ata
  signed_at TIMESTAMP NULL, -- Data/hora da assinatura
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de registro
);

-- Índices para participantes
CREATE INDEX IF NOT EXISTS idx_assembly_participants_assembly ON assembly_participants(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_participants_apartment ON assembly_participants(apartment_id);

-- ============================================
-- 6. TABELA DE DECISÕES DE ASSEMBLEIA
-- ============================================
CREATE TABLE IF NOT EXISTS assembly_decisions (
  id SERIAL PRIMARY KEY, -- ID único
  assembly_id INTEGER NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE, -- Assembleia
  decision_number INTEGER NOT NULL, -- Número da decisão na pauta
  title VARCHAR(255) NOT NULL, -- Título da decisão
  description TEXT NOT NULL, -- Descrição detalhada
  votes_for INTEGER DEFAULT 0, -- Votos a favor
  votes_against INTEGER DEFAULT 0, -- Votos contra
  votes_abstention INTEGER DEFAULT 0, -- Votos em abstenção
  approved BOOLEAN DEFAULT FALSE, -- Se foi aprovada
  notes TEXT, -- Observações adicionais
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de registro
);

-- Índices para decisões
CREATE INDEX IF NOT EXISTS idx_assembly_decisions_assembly ON assembly_decisions(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_decisions_number ON assembly_decisions(assembly_id, decision_number);

-- ============================================
-- 7. TABELA DE DOCUMENTOS DE ASSEMBLEIA (Atas assinadas)
-- ============================================
CREATE TABLE IF NOT EXISTS assembly_documents (
  id SERIAL PRIMARY KEY, -- ID único
  assembly_id INTEGER NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE, -- Assembleia
  document_type VARCHAR(50) NOT NULL, -- Tipo: ATA, CONVOCACAO, PAUTA, OUTRO
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo
  file_name VARCHAR(255) NOT NULL, -- Nome original do arquivo
  signed BOOLEAN DEFAULT FALSE, -- Se está assinada
  signed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem assinou (síndico)
  signed_at TIMESTAMP NULL, -- Data/hora da assinatura
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de upload
);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_assembly_documents_assembly ON assembly_documents(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_documents_type ON assembly_documents(document_type);

-- ============================================
-- 8. TABELA DE FUNDO DE RESERVA
-- ============================================
CREATE TABLE IF NOT EXISTS reserve_fund (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  current_balance DECIMAL(15,2) DEFAULT 0, -- Saldo atual
  target_balance DECIMAL(15,2) DEFAULT 0, -- Meta de saldo (ex: 6 meses de despesas)
  monthly_contribution_percent DECIMAL(5,2) DEFAULT 0, -- % de contribuição mensal (ex: 10%)
  monthly_contribution_amount DECIMAL(15,2) DEFAULT 0, -- Valor fixo de contribuição mensal
  contribution_method VARCHAR(20) DEFAULT 'PERCENT', -- PERCENT ou FIXED
  last_contribution_date DATE, -- Data da última contribuição
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem atualizou
  UNIQUE(condominium_id) -- Um fundo de reserva por condomínio
);

-- Índices para fundo de reserva
CREATE INDEX IF NOT EXISTS idx_reserve_fund_condominium ON reserve_fund(condominium_id);

-- ============================================
-- 9. TABELA DE RATEIO DE DESPESAS
-- ============================================
CREATE TABLE IF NOT EXISTS expense_allocation (
  id SERIAL PRIMARY KEY, -- ID único
  financial_exit_id INTEGER NOT NULL REFERENCES financial_exits(id) ON DELETE CASCADE, -- Despesa
  apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE, -- Apartamento
  amount DECIMAL(15,2) NOT NULL, -- Valor rateado para este apartamento
  allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data do rateio
  allocated_by INTEGER REFERENCES users(id) ON DELETE SET NULL -- Quem fez o rateio
);

-- Índices para rateio
CREATE INDEX IF NOT EXISTS idx_expense_allocation_exit ON expense_allocation(financial_exit_id);
CREATE INDEX IF NOT EXISTS idx_expense_allocation_apartment ON expense_allocation(apartment_id);

-- ============================================
-- 10. TABELA DE RELATÓRIOS GERADOS
-- ============================================
CREATE TABLE IF NOT EXISTS generated_reports (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  report_type VARCHAR(50) NOT NULL, -- Tipo: MONTHLY_FINANCIAL, OPERATIONAL, ASSEMBLY, etc
  month INTEGER, -- Mês (se aplicável)
  year INTEGER, -- Ano (se aplicável)
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo PDF
  file_name VARCHAR(255) NOT NULL, -- Nome do arquivo
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem gerou
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data/hora da geração
);

-- Índices para relatórios
CREATE INDEX IF NOT EXISTS idx_generated_reports_condominium ON generated_reports(condominium_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_date ON generated_reports(year, month);

-- ============================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON TABLE monthly_closures IS 'Fechamentos mensais financeiros - bloqueia edição após fechamento';
COMMENT ON COLUMN monthly_closures.status IS 'Status: OPEN (aberto), CLOSING (fechando), CLOSED (fechado), REOPENED (reaberto)';
COMMENT ON COLUMN monthly_closures.reopening_reason IS 'Motivo obrigatório quando reabre um mês fechado';

COMMENT ON TABLE apartments IS 'Apartamentos do condomínio - usado para inadimplência e rateio';
COMMENT ON TABLE monthly_fees IS 'Taxas mensais de condomínio - controle de inadimplência';
COMMENT ON COLUMN monthly_fees.days_overdue IS 'Calculado automaticamente: CURRENT_DATE - due_date quando não pago';

COMMENT ON TABLE assemblies IS 'Assembleias do condomínio - registro completo com decisões';
COMMENT ON TABLE assembly_decisions IS 'Decisões tomadas em assembleias - votação e aprovação';
COMMENT ON TABLE assembly_documents IS 'Documentos de assembleias - atas assinadas, convocações, etc';

COMMENT ON TABLE reserve_fund IS 'Fundo de reserva do condomínio - meta e contribuições mensais';
COMMENT ON TABLE expense_allocation IS 'Rateio de despesas por apartamento - para cobrança individual';

COMMENT ON TABLE generated_reports IS 'Histórico de relatórios PDF gerados - para auditoria';

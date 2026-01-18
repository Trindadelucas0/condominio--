-- Script de extensão das tabelas - FASE 26 (KPIs E RELATÓRIOS AVANÇADOS)
-- Adiciona suporte para KPIs, análises e relatórios financeiros avançados
-- Executado após a criação das tabelas anteriores

-- ============================================
-- 1. TABELA DE RELATÓRIOS GERADOS (Melhorias)
-- ============================================
-- Verifica se a tabela existe, se não, cria
CREATE TABLE IF NOT EXISTS generated_reports (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  report_type VARCHAR(50) NOT NULL, -- Tipo: MONTHLY_FINANCIAL, YEARLY_CONSOLIDATED, DELINQUENCY_DETAILED, RESERVE_FUND, EXPENSES_BY_CATEGORY, REVENUE_VS_EXPENSES, BUDGET_VS_ACTUAL, COMPARATIVE, EXECUTIVE_SUMMARY
  month INTEGER, -- Mês do relatório (se aplicável)
  year INTEGER, -- Ano do relatório
  period_start DATE, -- Data inicial do período (para relatórios customizados)
  period_end DATE, -- Data final do período (para relatórios customizados)
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo gerado
  file_name VARCHAR(255) NOT NULL, -- Nome do arquivo
  file_format VARCHAR(10) DEFAULT 'PDF', -- Formato: PDF, XLSX, CSV
  file_size BIGINT, -- Tamanho do arquivo em bytes
  parameters JSONB, -- Parâmetros usados na geração (filtros, opções, etc)
  generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem gerou
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de geração
);

DO $$
BEGIN
  -- Adiciona campos novos se a tabela já existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='generated_reports' AND column_name='period_start') THEN
    ALTER TABLE generated_reports ADD COLUMN period_start DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='generated_reports' AND column_name='period_end') THEN
    ALTER TABLE generated_reports ADD COLUMN period_end DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='generated_reports' AND column_name='file_format') THEN
    ALTER TABLE generated_reports ADD COLUMN file_format VARCHAR(10) DEFAULT 'PDF';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='generated_reports' AND column_name='file_size') THEN
    ALTER TABLE generated_reports ADD COLUMN file_size BIGINT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='generated_reports' AND column_name='parameters') THEN
    ALTER TABLE generated_reports ADD COLUMN parameters JSONB;
  END IF;
END $$;

-- Índices para relatórios
CREATE INDEX IF NOT EXISTS idx_generated_reports_condominium ON generated_reports(condominium_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_year_month ON generated_reports(year, month);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at);

-- ============================================
-- 2. TABELA DE MÉTRICAS/KPIs CALCULADAS
-- ============================================
-- Armazena KPIs pré-calculados para performance
CREATE TABLE IF NOT EXISTS kpi_metrics (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  metric_type VARCHAR(50) NOT NULL, -- Tipo: ROI, EFFICIENCY, SLA_COMPLIANCE, DELINQUENCY_RATE, COST_PER_UNIT, etc
  period_type VARCHAR(20) NOT NULL, -- Tipo de período: DAILY, MONTHLY, QUARTERLY, YEARLY
  period_value VARCHAR(20) NOT NULL, -- Valor do período (ex: '2024-01', '2024-Q1', '2024')
  metric_value DECIMAL(15,4), -- Valor numérico da métrica
  metric_label VARCHAR(255), -- Rótulo legível (ex: '85.5%', 'R$ 1.250,00')
  metadata JSONB, -- Metadados adicionais (detalhamento, breakdown, etc)
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data do cálculo
  UNIQUE(condominium_id, metric_type, period_type, period_value) -- Uma métrica por tipo/período
);

-- Índices para KPIs
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_condominium ON kpi_metrics(condominium_id);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_type ON kpi_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_kpi_metrics_period ON kpi_metrics(period_type, period_value);

-- ============================================
-- 3. TABELA DE ALERTAS INTELIGENTES (Baseada em Regras)
-- ============================================
CREATE TABLE IF NOT EXISTS intelligent_alerts (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  alert_rule_id VARCHAR(100) NOT NULL, -- ID da regra que gerou o alerta
  alert_type VARCHAR(50) NOT NULL, -- Tipo: HIGH_EXPENSE, LOW_RESERVE, SLA_VIOLATION, TREND_WARNING, etc
  severity VARCHAR(20) DEFAULT 'WARNING', -- Severidade: INFO, WARNING, CRITICAL
  title VARCHAR(255) NOT NULL, -- Título do alerta
  message TEXT NOT NULL, -- Mensagem detalhada
  metric_value DECIMAL(15,4), -- Valor da métrica que disparou o alerta
  threshold_value DECIMAL(15,4), -- Valor do threshold/limite
  entity_type VARCHAR(50), -- Tipo de entidade relacionada
  entity_id INTEGER, -- ID da entidade relacionada
  metadata JSONB, -- Dados adicionais do alerta
  acknowledged BOOLEAN DEFAULT FALSE, -- Se foi reconhecido
  acknowledged_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem reconheceu
  acknowledged_at TIMESTAMP NULL, -- Data do reconhecimento
  resolved BOOLEAN DEFAULT FALSE, -- Se foi resolvido
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem resolveu
  resolved_at TIMESTAMP NULL, -- Data da resolução
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Índices para alertas inteligentes
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_condominium ON intelligent_alerts(condominium_id);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_type ON intelligent_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_acknowledged ON intelligent_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_resolved ON intelligent_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_intelligent_alerts_created ON intelligent_alerts(created_at);

-- ============================================
-- 4. TABELA DE REGRAS DE ALERTAS
-- ============================================
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  rule_key VARCHAR(100) NOT NULL, -- Chave única da regra (ex: 'HIGH_EXPENSE_MONTHLY')
  rule_name VARCHAR(255) NOT NULL, -- Nome legível da regra
  rule_description TEXT, -- Descrição da regra
  alert_type VARCHAR(50) NOT NULL, -- Tipo de alerta gerado
  metric_type VARCHAR(50) NOT NULL, -- Tipo de métrica a monitorar
  threshold_type VARCHAR(20) NOT NULL, -- Tipo: PERCENTAGE, FIXED_VALUE, TREND_UP, TREND_DOWN
  threshold_value DECIMAL(15,4), -- Valor do threshold
  comparison_operator VARCHAR(10) DEFAULT '>', -- Operador: >, <, >=, <=, ==, !=
  period_type VARCHAR(20) DEFAULT 'MONTHLY', -- Tipo de período para análise
  active BOOLEAN DEFAULT TRUE, -- Se a regra está ativa
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de atualização
  UNIQUE(condominium_id, rule_key) -- Uma regra por chave por condomínio
);

-- Índices para regras de alertas
CREATE INDEX IF NOT EXISTS idx_alert_rules_condominium ON alert_rules(condominium_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(active);

-- ============================================
-- 5. COMENTÁRIOS
-- ============================================
COMMENT ON TABLE generated_reports IS 'Relatórios financeiros e administrativos gerados pelo sistema';
COMMENT ON TABLE kpi_metrics IS 'KPIs e métricas pré-calculadas para dashboards e análises';
COMMENT ON TABLE intelligent_alerts IS 'Alertas inteligentes baseados em regras e métricas';
COMMENT ON TABLE alert_rules IS 'Regras configuráveis para geração automática de alertas';

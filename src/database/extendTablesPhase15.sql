-- Script de extensão das tabelas - FASE 15 (TRIAGEM E OBSERVAÇÕES)
-- Adiciona campos para triagem de ocorrências e observações do síndico
-- Executado após a criação das tabelas anteriores

-- Adiciona campos de triagem na tabela occurrences
DO $$
BEGIN
  -- Campo para indicar se foi triada pelo administrativo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='triaged') THEN
    ALTER TABLE occurrences ADD COLUMN triaged BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Quem triou a ocorrência
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='triaged_by') THEN
    ALTER TABLE occurrences ADD COLUMN triaged_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- Data/hora da triagem
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='triaged_at') THEN
    ALTER TABLE occurrences ADD COLUMN triaged_at TIMESTAMP NULL;
  END IF;
  
  -- Classificação da ocorrência (manutenção preventiva, corretiva, etc)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='classification') THEN
    ALTER TABLE occurrences ADD COLUMN classification VARCHAR(50);
  END IF;
  
  -- SLA em horas (definido pelo administrativo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_hours') THEN
    ALTER TABLE occurrences ADD COLUMN sla_hours INTEGER;
  END IF;
  
  -- Data/hora limite do SLA
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_due_date') THEN
    ALTER TABLE occurrences ADD COLUMN sla_due_date TIMESTAMP NULL;
  END IF;
  
  -- Flag indicando se virou tarefa
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='converted_to_task') THEN
    ALTER TABLE occurrences ADD COLUMN converted_to_task BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- ID da tarefa gerada (se convertida)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='related_task_id') THEN
    ALTER TABLE occurrences ADD COLUMN related_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
  
  -- ID do ativo relacionado (vinculação com patrimônio)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='related_asset_id') THEN
    ALTER TABLE occurrences ADD COLUMN related_asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL;
  END IF;
  
  -- ID do ativo relacionado em tarefas (vinculação com patrimônio)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='related_asset_id') THEN
    ALTER TABLE tasks ADD COLUMN related_asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL;
  END IF;
  
  -- Observação do síndico
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sindico_observation') THEN
    ALTER TABLE occurrences ADD COLUMN sindico_observation TEXT;
  END IF;
  
  -- Quem adicionou observação do síndico
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sindico_observation_by') THEN
    ALTER TABLE occurrences ADD COLUMN sindico_observation_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- Data/hora da observação do síndico
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sindico_observation_at') THEN
    ALTER TABLE occurrences ADD COLUMN sindico_observation_at TIMESTAMP NULL;
  END IF;
END $$;

-- Tabela de solicitações de orçamento (quando ADM solicita, Síndico aprova)
CREATE TABLE IF NOT EXISTS budget_requests (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- ADM que solicitou
  title VARCHAR(255) NOT NULL, -- Título da solicitação
  description TEXT NOT NULL, -- Descrição detalhada
  estimated_value DECIMAL(15,2), -- Valor estimado
  priority VARCHAR(20) DEFAULT 'NORMAL', -- Prioridade
  status VARCHAR(20) DEFAULT 'PENDING', -- Status: PENDING, APPROVED, REJECTED, PURCHASED
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Síndico que aprovou
  approved_at TIMESTAMP NULL, -- Data de aprovação
  rejection_reason TEXT, -- Motivo da rejeição (se rejeitada)
  related_occurrence_id INTEGER REFERENCES occurrences(id) ON DELETE SET NULL, -- Ocorrência relacionada (se houver)
  related_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, -- Tarefa relacionada (se houver)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Tabela de anexos de solicitações de orçamento (documentos, PDFs)
CREATE TABLE IF NOT EXISTS budget_request_attachments (
  id SERIAL PRIMARY KEY, -- ID único
  budget_request_id INTEGER NOT NULL REFERENCES budget_requests(id) ON DELETE CASCADE, -- Solicitação
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo
  file_name VARCHAR(255) NOT NULL, -- Nome original
  file_type VARCHAR(50), -- Tipo do arquivo
  file_size BIGINT, -- Tamanho em bytes
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem enviou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de upload
);

-- Tabela de comunicados operacionais (ADM cria, não são oficiais)
CREATE TABLE IF NOT EXISTS operational_communications (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- ADM que criou
  title VARCHAR(255) NOT NULL, -- Título do comunicado
  message TEXT NOT NULL, -- Mensagem do comunicado
  communication_type VARCHAR(50) DEFAULT 'INFO', -- Tipo: INFO, WARNING, MAINTENANCE, BLOCKADE
  target_audience VARCHAR(50) DEFAULT 'ALL', -- Público-alvo: ALL, OPERACIONAL, LIMPEZA, RESIDENTS
  is_active BOOLEAN DEFAULT TRUE, -- Se está ativo
  expires_at TIMESTAMP NULL, -- Data de expiração (se houver)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_occurrences_triaged ON occurrences(triaged);
CREATE INDEX IF NOT EXISTS idx_occurrences_sla_due_date ON occurrences(sla_due_date);
CREATE INDEX IF NOT EXISTS idx_budget_requests_condominium ON budget_requests(condominium_id);
CREATE INDEX IF NOT EXISTS idx_budget_requests_status ON budget_requests(status);
CREATE INDEX IF NOT EXISTS idx_operational_communications_condominium ON operational_communications(condominium_id);
CREATE INDEX IF NOT EXISTS idx_operational_communications_active ON operational_communications(is_active);

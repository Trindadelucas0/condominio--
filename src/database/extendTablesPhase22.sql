-- Script de extensão das tabelas - FASE 22 (NOTIFICAÇÕES, MANUTENÇÕES E FLUXOS COMPLETOS)
-- Adiciona tabelas e campos necessários para notificações, manutenções e fluxos de aprovação
-- Executado após a criação das tabelas anteriores

-- ============================================
-- 1. TABELA DE MANUTENÇÕES (Preventiva e Corretiva)
-- ============================================
CREATE TABLE IF NOT EXISTS maintenances (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  maintenance_type VARCHAR(50) NOT NULL, -- Tipo: PREVENTIVA, CORRETIVA
  title VARCHAR(255) NOT NULL, -- Título da manutenção
  description TEXT NOT NULL, -- Descrição detalhada
  location VARCHAR(255), -- Localização (opcional)
  priority VARCHAR(20) DEFAULT 'NORMAL', -- Prioridade: BAIXA, NORMAL, ALTA, URGENTE
  scheduled_date DATE, -- Data prevista (para preventivas)
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Operacional responsável
  status VARCHAR(20) DEFAULT 'pendente', -- Status: pendente, em_andamento, concluida, cancelada
  started_at TIMESTAMP NULL, -- Quando começou
  completed_at TIMESTAMP NULL, -- Quando foi concluída
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem concluiu
  completion_notes TEXT, -- Notas de conclusão
  cost DECIMAL(15,2), -- Custo (se houver)
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL, -- Ativo relacionado (opcional)
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Síndico que criou
  idempotency_key VARCHAR(120), -- Chave de idempotência para evitar duplicidade por reenvio
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Índices para manutenções
CREATE INDEX IF NOT EXISTS idx_maintenances_condominium ON maintenances(condominium_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_assigned_to ON maintenances(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenances_status ON maintenances(status);
CREATE INDEX IF NOT EXISTS idx_maintenances_type ON maintenances(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenances_scheduled_date ON maintenances(scheduled_date);

-- Suporte a idempotência (também para bancos onde a tabela já existia)
ALTER TABLE maintenances
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS uq_maintenances_idempotency
ON maintenances(condominium_id, created_by, idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- ============================================
-- 2. ATUALIZAR TABELA FINANCIAL_ENTRIES (Fluxo de Aprovação)
-- ============================================
DO $$
BEGIN
  -- Adiciona status de aprovação
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='review_status') THEN
    ALTER TABLE financial_entries ADD COLUMN review_status VARCHAR(20) DEFAULT 'PENDING_REVIEW';
  END IF;
  
  -- Adiciona campos de análise do síndico
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='reviewed_by') THEN
    ALTER TABLE financial_entries ADD COLUMN reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='reviewed_at') THEN
    ALTER TABLE financial_entries ADD COLUMN reviewed_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='review_notes') THEN
    ALTER TABLE financial_entries ADD COLUMN review_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='rejection_reason') THEN
    ALTER TABLE financial_entries ADD COLUMN rejection_reason TEXT;
  END IF;
  
  -- Adiciona campo para vincular a outra entrada/saída
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='linked_to_id') THEN
    ALTER TABLE financial_entries ADD COLUMN linked_to_id INTEGER REFERENCES financial_entries(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_entries' AND column_name='linked_to_type') THEN
    ALTER TABLE financial_entries ADD COLUMN linked_to_type VARCHAR(50); -- 'ENTRY' ou 'EXIT'
  END IF;
END $$;

-- Índices para financial_entries
CREATE INDEX IF NOT EXISTS idx_financial_entries_review_status ON financial_entries(review_status);

-- ============================================
-- 3. ATUALIZAR TABELA FINANCIAL_EXITS (Observações e Rejeição)
-- ============================================
DO $$
BEGIN
  -- Adiciona campos de observações/rejeição
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='review_notes') THEN
    ALTER TABLE financial_exits ADD COLUMN review_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='financial_exits' AND column_name='rejection_reason') THEN
    ALTER TABLE financial_exits ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- ============================================
-- 4. ATUALIZAR TABELA BUDGET_REQUESTS (Fluxo Completo)
-- ============================================
DO $$
BEGIN
  -- Adiciona campos para fluxo financeiro → síndico → financeiro → operacional
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='financeiro_reviewed') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_reviewed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='financeiro_reviewed_by') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='financeiro_reviewed_at') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_reviewed_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='financeiro_notes') THEN
    ALTER TABLE budget_requests ADD COLUMN financeiro_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='sindico_notes') THEN
    ALTER TABLE budget_requests ADD COLUMN sindico_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='budget_approved_amount') THEN
    ALTER TABLE budget_requests ADD COLUMN budget_approved_amount DECIMAL(15,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='released_to_operational') THEN
    ALTER TABLE budget_requests ADD COLUMN released_to_operational BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='released_at') THEN
    ALTER TABLE budget_requests ADD COLUMN released_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='budget_requests' AND column_name='released_by') THEN
    ALTER TABLE budget_requests ADD COLUMN released_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- Adiciona novos status para o fluxo
  -- Status existentes: PENDING, APPROVED, REJECTED, PURCHASED
  -- Novos status implícitos: PENDING_FINANCEIRO, PENDING_SINDICO, LIBERATED
  -- Usaremos o campo status com valores: PENDING_FINANCEIRO, PENDING_SINDICO, APPROVED, REJECTED, LIBERATED, PURCHASED
END $$;

-- Índices para budget_requests
CREATE INDEX IF NOT EXISTS idx_budget_requests_financeiro_reviewed ON budget_requests(financeiro_reviewed);
CREATE INDEX IF NOT EXISTS idx_budget_requests_released ON budget_requests(released_to_operational);

-- ============================================
-- 5. ATUALIZAR TABELA OCCURRENCES (Sistema de Aprovação)
-- ============================================
DO $$
BEGIN
  -- Adiciona campos para sistema de aprovação
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='requires_approval') THEN
    ALTER TABLE occurrences ADD COLUMN requires_approval BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='approval_required_from') THEN
    ALTER TABLE occurrences ADD COLUMN approval_required_from VARCHAR(50); -- 'SINDICO', 'ADMINISTRATIVO', 'FINANCEIRO'
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='approval_status') THEN
    ALTER TABLE occurrences ADD COLUMN approval_status VARCHAR(20) DEFAULT 'PENDING'; -- PENDING, APPROVED, REJECTED
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='approved_by') THEN
    ALTER TABLE occurrences ADD COLUMN approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='approved_at') THEN
    ALTER TABLE occurrences ADD COLUMN approved_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='approval_rejection_reason') THEN
    ALTER TABLE occurrences ADD COLUMN approval_rejection_reason TEXT;
  END IF;
  
  -- Adiciona campo para especificar destinatário
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sent_to_user_id') THEN
    ALTER TABLE occurrences ADD COLUMN sent_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sent_to_role') THEN
    ALTER TABLE occurrences ADD COLUMN sent_to_role VARCHAR(50); -- Role para quem foi enviada
  END IF;
  
  -- Verifica se occurrence_type já existe (pode ter sido criado na FASE 14)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='occurrence_type') THEN
    ALTER TABLE occurrences ADD COLUMN occurrence_type VARCHAR(50) DEFAULT 'NON_ROUTINE'; -- ROUTINE, NON_ROUTINE, EMERGENCY
  END IF;
  
  -- Adiciona campos para verificar se está no checklist/rotina
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='is_in_checklist') THEN
    ALTER TABLE occurrences ADD COLUMN is_in_checklist BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='is_routine_task') THEN
    ALTER TABLE occurrences ADD COLUMN is_routine_task BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Índices para occurrences
CREATE INDEX IF NOT EXISTS idx_occurrences_requires_approval ON occurrences(requires_approval);
CREATE INDEX IF NOT EXISTS idx_occurrences_approval_status ON occurrences(approval_status);
CREATE INDEX IF NOT EXISTS idx_occurrences_sent_to_user ON occurrences(sent_to_user_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_sent_to_role ON occurrences(sent_to_role);

-- ============================================
-- 6. ATUALIZAR TABELA NOTIFICATIONS (Se necessário)
-- ============================================
DO $$
BEGIN
  -- Adiciona campo created_at se não existir (para ordenação)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='created_at') THEN
    ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Índice para ordenação de notificações
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 7. ADICIONAR NOVOS ESTADOS NAS STATE MACHINES
-- ============================================
-- Estados serão adicionados via initStateMachines.sql ou script separado
-- Por enquanto, apenas criamos as estruturas de dados

-- ============================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON TABLE maintenances IS 'Manutenções preventivas e corretivas criadas pelo síndico e executadas pelo operacional';
COMMENT ON COLUMN maintenances.maintenance_type IS 'Tipo: PREVENTIVA (agendada) ou CORRETIVA (reparo)';
COMMENT ON COLUMN maintenances.status IS 'Status: pendente (criada), em_andamento (em execução), concluida (concluída), cancelada (cancelada)';

COMMENT ON COLUMN financial_entries.review_status IS 'Status de análise: PENDING_REVIEW (aguardando), APPROVED (aprovada), REJECTED (rejeitada), RECEIVED (recebida)';
COMMENT ON COLUMN financial_entries.review_notes IS 'Observações do síndico ao aprovar';
COMMENT ON COLUMN financial_entries.rejection_reason IS 'Motivo da rejeição pelo síndico';

COMMENT ON COLUMN budget_requests.financeiro_reviewed IS 'Se o financeiro já revisou e preencheu os campos obrigatórios';
COMMENT ON COLUMN budget_requests.released_to_operational IS 'Se o valor foi liberado para o operacional executar';
COMMENT ON COLUMN budget_requests.budget_approved_amount IS 'Valor aprovado pelo síndico (pode ser diferente do solicitado)';

COMMENT ON COLUMN occurrences.requires_approval IS 'Se a ocorrência precisa de aprovação antes de prosseguir';
COMMENT ON COLUMN occurrences.approval_required_from IS 'Quem deve aprovar: SINDICO, ADMINISTRATIVO ou FINANCEIRO';
COMMENT ON COLUMN occurrences.occurrence_type IS 'Tipo: ROUTINE (rotina), NON_ROUTINE (fora de rotina), EMERGENCY (emergência)';
COMMENT ON COLUMN occurrences.is_in_checklist IS 'Se a ocorrência está relacionada a um item do checklist diário';
COMMENT ON COLUMN occurrences.is_routine_task IS 'Se a ocorrência é uma tarefa de rotina normal';

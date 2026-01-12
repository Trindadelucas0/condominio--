-- Script de extensão das tabelas - FASE 10 (ALERTAS E AUTOMAÇÕES)
-- Adiciona tabelas necessárias para alertas, notificações, SLA e escalonamento
-- Executado após a criação das tabelas anteriores

-- Tabela de notificações (já existe alerts, mas essa é para notificações internas para usuários)
-- Registra notificações que aparecem para usuários específicos
-- REGRA: Notificação não pode ser apagada, apenas resolvida ou justificada
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY, -- ID único
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Usuário destinatário
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  title VARCHAR(255) NOT NULL, -- Título da notificação
  message TEXT NOT NULL, -- Mensagem da notificação
  notification_type VARCHAR(50) NOT NULL, -- Tipo: TASK_OVERDUE, OCCURRENCE_OVERDUE, APPROVAL_PENDING, DOCUMENT_EXPIRING, etc
  entity_type VARCHAR(50), -- Tipo de entidade relacionada (tasks, occurrences, approvals, etc)
  entity_id INTEGER, -- ID da entidade relacionada
  read BOOLEAN DEFAULT FALSE, -- Se foi lida
  read_at TIMESTAMP NULL -- Data/hora da leitura
);

-- Adiciona campos de resolução/justificativa se não existirem (para tabelas existentes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='resolved') THEN
    ALTER TABLE notifications ADD COLUMN resolved BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='resolved_at') THEN
    ALTER TABLE notifications ADD COLUMN resolved_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='resolved_by') THEN
    ALTER TABLE notifications ADD COLUMN resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='justified') THEN
    ALTER TABLE notifications ADD COLUMN justified BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='justification') THEN
    ALTER TABLE notifications ADD COLUMN justification TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='justified_at') THEN
    ALTER TABLE notifications ADD COLUMN justified_at TIMESTAMP NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='notifications' AND column_name='justified_by') THEN
    ALTER TABLE notifications ADD COLUMN justified_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Tabela de configuração de SLA
-- Define regras de SLA por tipo de tarefa/ocorrência
CREATE TABLE IF NOT EXISTS slas (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  entity_type VARCHAR(50) NOT NULL, -- Tipo: TASK, OCCURRENCE
  task_type VARCHAR(50), -- Tipo específico (CHECKLIST, MANUTENCAO, etc) - NULL para aplicar a todos
  priority VARCHAR(20), -- Prioridade (BAIXA, MEDIA, ALTA, URGENTE) - NULL para aplicar a todas
  sla_hours INTEGER NOT NULL, -- Prazo em horas para SLA
  warning_hours INTEGER, -- Horas antes do prazo para alertar (ex: alertar 24h antes)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de atualização
  UNIQUE(condominium_id, entity_type, task_type, priority) -- Uma regra por combinação
);

-- Tabela de regras de escalonamento
-- Define quando e para quem escalonar alertas
CREATE TABLE IF NOT EXISTS escalation_rules (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  entity_type VARCHAR(50) NOT NULL, -- Tipo: TASK, OCCURRENCE
  escalation_level INTEGER NOT NULL DEFAULT 1, -- Nível de escalonamento (1, 2, 3...)
  hours_after_deadline INTEGER NOT NULL, -- Horas após o prazo para escalonar
  escalate_to_role VARCHAR(50) NOT NULL, -- Perfil que recebe o escalonamento (SINDICO, ADMINISTRATIVO)
  active BOOLEAN DEFAULT TRUE, -- Se a regra está ativa
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id); -- Filtros por usuário
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read); -- Filtros por lidas/não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_condominium ON notifications(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_slas_condominium ON slas(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_escalation_rules_condominium ON escalation_rules(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_escalation_rules_active ON escalation_rules(active); -- Filtros por ativas

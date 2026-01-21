-- Script de extensão das tabelas - SLA (Service Level Agreement)
-- Adiciona campos de SLA nas tabelas tasks e occurrences
-- Executado após a criação das tabelas anteriores

-- Adiciona campos de SLA na tabela tasks
DO $$
BEGIN
  -- SLA em horas para conclusão da tarefa
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='sla_hours') THEN
    ALTER TABLE tasks ADD COLUMN sla_hours INTEGER DEFAULT 24; -- Padrão: 24 horas
  END IF;
  
  -- Data/hora limite para cumprir SLA (calculado automaticamente)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='sla_deadline') THEN
    ALTER TABLE tasks ADD COLUMN sla_deadline TIMESTAMP NULL;
  END IF;
  
  -- Marca se SLA foi violado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='sla_violated') THEN
    ALTER TABLE tasks ADD COLUMN sla_violated BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Data/hora em que SLA foi violado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='sla_violated_at') THEN
    ALTER TABLE tasks ADD COLUMN sla_violated_at TIMESTAMP NULL;
  END IF;
  
  -- Marca se alerta de SLA foi enviado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='sla_alert_sent') THEN
    ALTER TABLE tasks ADD COLUMN sla_alert_sent BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Data/hora em que alerta de SLA foi enviado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='sla_alert_sent_at') THEN
    ALTER TABLE tasks ADD COLUMN sla_alert_sent_at TIMESTAMP NULL;
  END IF;
END $$;

-- Adiciona campos de SLA na tabela occurrences
DO $$
BEGIN
  -- SLA em horas para resolução da ocorrência
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_hours') THEN
    ALTER TABLE occurrences ADD COLUMN sla_hours INTEGER DEFAULT 48; -- Padrão: 48 horas
  END IF;
  
  -- Data/hora limite para cumprir SLA (calculado automaticamente)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_deadline') THEN
    ALTER TABLE occurrences ADD COLUMN sla_deadline TIMESTAMP NULL;
  END IF;
  
  -- Marca se SLA foi violado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_violated') THEN
    ALTER TABLE occurrences ADD COLUMN sla_violated BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Data/hora em que SLA foi violado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_violated_at') THEN
    ALTER TABLE occurrences ADD COLUMN sla_violated_at TIMESTAMP NULL;
  END IF;
  
  -- Marca se alerta de SLA foi enviado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_alert_sent') THEN
    ALTER TABLE occurrences ADD COLUMN sla_alert_sent BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Data/hora em que alerta de SLA foi enviado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='sla_alert_sent_at') THEN
    ALTER TABLE occurrences ADD COLUMN sla_alert_sent_at TIMESTAMP NULL;
  END IF;
END $$;

-- Índices para melhorar performance de consultas SLA
CREATE INDEX IF NOT EXISTS idx_tasks_sla_deadline ON tasks(sla_deadline) WHERE status IN ('PENDING', 'IN_PROGRESS');
CREATE INDEX IF NOT EXISTS idx_tasks_sla_violated ON tasks(sla_violated) WHERE sla_violated = TRUE;
CREATE INDEX IF NOT EXISTS idx_occurrences_sla_deadline ON occurrences(sla_deadline) WHERE status NOT IN ('RESOLVIDA', 'ENCERRADA');
CREATE INDEX IF NOT EXISTS idx_occurrences_sla_violated ON occurrences(sla_violated) WHERE sla_violated = TRUE;

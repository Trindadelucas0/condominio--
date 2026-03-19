-- Script de correção - Cria tabelas faltantes da FASE 22
-- Execute este script se as tabelas não foram criadas corretamente

-- Criar tabela maintenances se não existir
CREATE TABLE IF NOT EXISTS maintenances (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  priority VARCHAR(20) DEFAULT 'NORMAL',
  scheduled_date DATE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completion_notes TEXT,
  cost DECIMAL(15,2),
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para manutenções
CREATE INDEX IF NOT EXISTS idx_maintenances_condominium ON maintenances(condominium_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_assigned_to ON maintenances(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenances_status ON maintenances(status);
CREATE INDEX IF NOT EXISTS idx_maintenances_type ON maintenances(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenances_scheduled_date ON maintenances(scheduled_date);

-- Suporte a idempotência e prevenção de duplicidade
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS uq_maintenances_idempotency
ON maintenances(condominium_id, created_by, idempotency_key)
WHERE idempotency_key IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM maintenances
    WHERE status IN ('pendente', 'em_andamento')
    GROUP BY condominium_id, created_by, LOWER(title), COALESCE(scheduled_date, DATE '1900-01-01')
    HAVING COUNT(*) > 1
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_maintenances_active_dedup_lookup
    ON maintenances(condominium_id, created_by, LOWER(title), COALESCE(scheduled_date, DATE '1900-01-01'))
    WHERE status IN ('pendente', 'em_andamento');
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS uq_maintenances_active_dedup
    ON maintenances(condominium_id, created_by, LOWER(title), COALESCE(scheduled_date, DATE '1900-01-01'))
    WHERE status IN ('pendente', 'em_andamento');
  END IF;
END $$;

-- Normalização de status legado (inglês -> português)
UPDATE maintenances
SET status = CASE
  WHEN status = 'PENDING' THEN 'pendente'
  WHEN status = 'IN_PROGRESS' THEN 'em_andamento'
  WHEN status = 'COMPLETED' THEN 'concluida'
  WHEN status = 'CANCELLED' THEN 'cancelada'
  ELSE status
END
WHERE status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Define default e validação de domínio de status
ALTER TABLE maintenances
  ALTER COLUMN status SET DEFAULT 'pendente';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'maintenances_status_check'
  ) THEN
    ALTER TABLE maintenances
      ADD CONSTRAINT maintenances_status_check
      CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada'));
  END IF;
END $$;

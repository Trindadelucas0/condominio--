-- Vinculação de modelos de checklist a pessoas específicas (Operacional/Limpeza)
-- Permite atribuir cada checklist a quem o síndico escolher, não necessariamente todos do departamento.

-- Tabela de vínculos: modelo → usuários atribuídos
CREATE TABLE IF NOT EXISTS checklist_model_assignments (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES checklist_models(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(model_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_model_assignments_model ON checklist_model_assignments(model_id);
CREATE INDEX IF NOT EXISTS idx_checklist_model_assignments_user ON checklist_model_assignments(user_id);

-- Ajuste em daily_checklists: permitir um checklist por (modelo, data, responsável)
DO $$
BEGIN
  ALTER TABLE daily_checklists DROP CONSTRAINT IF EXISTS daily_checklists_condominium_id_model_id_scheduled_date_key;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'daily_checklists'::regclass
    AND conname = 'daily_checklists_condominium_id_model_id_scheduled_date_assigned_to_key'
  ) THEN
    ALTER TABLE daily_checklists
      ADD CONSTRAINT daily_checklists_condominium_id_model_id_scheduled_date_assigned_to_key
      UNIQUE(condominium_id, model_id, scheduled_date, assigned_to);
  END IF;
END $$;

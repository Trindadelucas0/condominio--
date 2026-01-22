-- Síndico acompanha checklists e pode questionar itens não feitos
-- Campos para "questionar o porquê não foi feito"

ALTER TABLE daily_checklist_items
  ADD COLUMN IF NOT EXISTS sindico_question TEXT,
  ADD COLUMN IF NOT EXISTS sindico_question_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sindico_question_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

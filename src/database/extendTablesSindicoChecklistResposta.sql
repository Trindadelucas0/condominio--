-- Síndico: "solicitar resposta" vs "só comentário"; operacional responde ao questionamento

ALTER TABLE daily_checklist_items
  ADD COLUMN IF NOT EXISTS sindico_exige_resposta BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resposta_questionamento TEXT,
  ADD COLUMN IF NOT EXISTS resposta_questionamento_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resposta_questionamento_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

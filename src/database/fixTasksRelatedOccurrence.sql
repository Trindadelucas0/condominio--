-- Script de correção - Adiciona coluna related_occurrence_id à tabela tasks
-- Esta coluna permite vincular tarefas a ocorrências relacionadas
-- Executado para corrigir erro ao criar tarefas

DO $$
BEGIN
  -- Adiciona coluna related_occurrence_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='tasks' AND column_name='related_occurrence_id') THEN
    ALTER TABLE tasks ADD COLUMN related_occurrence_id INTEGER REFERENCES occurrences(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para melhorar performance em consultas que filtram por ocorrência relacionada
CREATE INDEX IF NOT EXISTS idx_tasks_related_occurrence ON tasks(related_occurrence_id);

-- Comentário
COMMENT ON COLUMN tasks.related_occurrence_id IS 'Ocorrência relacionada à tarefa (se houver)';

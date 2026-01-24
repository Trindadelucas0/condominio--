-- Script de extensão das tabelas - FASE 33 (CAMPOS DE CONCLUSÃO DE TAREFAS)
-- Adiciona colunas para armazenar dados detalhados de conclusão de tarefas

-- Adiciona colunas de conclusão na tabela tasks
DO $$
BEGIN
  -- completion_success: indica se a tarefa foi concluída com sucesso
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='completion_success'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completion_success BOOLEAN NULL;
    COMMENT ON COLUMN tasks.completion_success IS 'Indica se a tarefa foi concluída com sucesso (true) ou não (false)';
  END IF;

  -- completion_notes: observações finais sobre a conclusão
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='completion_notes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completion_notes TEXT NULL;
    COMMENT ON COLUMN tasks.completion_notes IS 'Observações finais sobre a conclusão da tarefa';
  END IF;

  -- had_issues: indica se houve problemas durante a execução
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='had_issues'
  ) THEN
    ALTER TABLE tasks ADD COLUMN had_issues BOOLEAN NULL;
    COMMENT ON COLUMN tasks.had_issues IS 'Indica se houve problemas durante a execução da tarefa';
  END IF;

  -- issues_description: descrição dos problemas encontrados
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='issues_description'
  ) THEN
    ALTER TABLE tasks ADD COLUMN issues_description TEXT NULL;
    COMMENT ON COLUMN tasks.issues_description IS 'Descrição detalhada dos problemas encontrados durante a execução';
  END IF;

  -- completion_time_minutes: tempo gasto na conclusão em minutos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='completion_time_minutes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completion_time_minutes INTEGER NULL;
    COMMENT ON COLUMN tasks.completion_time_minutes IS 'Tempo gasto na conclusão da tarefa em minutos';
  END IF;

  -- completion_quality: qualidade da execução (EXCELENTE, BOM, REGULAR, RUIM)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tasks' AND column_name='completion_quality'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completion_quality VARCHAR(20) NULL;
    COMMENT ON COLUMN tasks.completion_quality IS 'Qualidade da execução: EXCELENTE, BOM, REGULAR, RUIM';
  END IF;
END $$;

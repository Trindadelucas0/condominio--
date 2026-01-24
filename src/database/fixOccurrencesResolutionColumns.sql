-- Script de correção - Adiciona colunas de resolução faltantes em occurrences
-- Execute este script para adicionar todas as colunas relacionadas à resolução de ocorrências

DO $$
BEGIN
  -- resolution_success: indica se a resolução foi bem-sucedida
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'resolution_success') THEN
    ALTER TABLE occurrences ADD COLUMN resolution_success BOOLEAN NULL;
    RAISE NOTICE 'Coluna resolution_success adicionada em occurrences';
  END IF;
  
  -- resolution_method: método usado para resolver (INTERNA, TERCEIRO, MANUTENCAO, OUTRA)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'resolution_method') THEN
    ALTER TABLE occurrences ADD COLUMN resolution_method VARCHAR(50);
    RAISE NOTICE 'Coluna resolution_method adicionada em occurrences';
  END IF;
  
  -- resolution_cost: custo da resolução
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'resolution_cost') THEN
    ALTER TABLE occurrences ADD COLUMN resolution_cost DECIMAL(15,2);
    RAISE NOTICE 'Coluna resolution_cost adicionada em occurrences';
  END IF;
  
  -- had_complications: se houve complicações durante a resolução
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'had_complications') THEN
    ALTER TABLE occurrences ADD COLUMN had_complications BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Coluna had_complications adicionada em occurrences';
  END IF;
  
  -- complications_description: descrição das complicações
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'complications_description') THEN
    ALTER TABLE occurrences ADD COLUMN complications_description TEXT;
    RAISE NOTICE 'Coluna complications_description adicionada em occurrences';
  END IF;
  
  -- resolution_time_minutes: tempo gasto na resolução em minutos
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'resolution_time_minutes') THEN
    ALTER TABLE occurrences ADD COLUMN resolution_time_minutes INTEGER;
    RAISE NOTICE 'Coluna resolution_time_minutes adicionada em occurrences';
  END IF;
  
  -- preventive_measures: medidas preventivas tomadas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'occurrences' 
                 AND column_name = 'preventive_measures') THEN
    ALTER TABLE occurrences ADD COLUMN preventive_measures TEXT;
    RAISE NOTICE 'Coluna preventive_measures adicionada em occurrences';
  END IF;
END $$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_occurrences_resolution_success ON occurrences(resolution_success);
CREATE INDEX IF NOT EXISTS idx_occurrences_resolution_method ON occurrences(resolution_method);

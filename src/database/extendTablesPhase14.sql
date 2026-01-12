-- Script de extensão das tabelas - FASE 14 (OCORRÊNCIAS DE LIMPEZA)
-- Adiciona campos necessários para diferenciar ocorrências de LIMPEZA e ZELADORIA
-- Executado após a criação das tabelas anteriores
--
-- OBJETIVO: Separar ocorrências de LIMPEZA das ocorrências de ZELADORIA
-- REGRA: LIMPEZA pode reportar, mas problemas técnicos viram ocorrências de ZELADORIA automaticamente

-- Adiciona campos na tabela de ocorrências para diferenciar tipos
DO $$
BEGIN
  -- Tipo de ocorrência (LIMPEZA ou ZELADORIA)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='occurrence_type') THEN
    ALTER TABLE occurrences ADD COLUMN occurrence_type VARCHAR(50) DEFAULT 'ZELADORIA';
  END IF;
  
  -- Tipo específico de ocorrência de limpeza
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='limpeza_type') THEN
    ALTER TABLE occurrences ADD COLUMN limpeza_type VARCHAR(50);
  END IF;
  
  -- ID da ocorrência de limpeza que originou (se foi convertida para zeladoria)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='converted_from_limpeza_id') THEN
    ALTER TABLE occurrences ADD COLUMN converted_from_limpeza_id INTEGER REFERENCES occurrences(id) ON DELETE SET NULL;
  END IF;
  
  -- Flag indicando se precisa de ação de zeladoria
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='needs_zeladoria') THEN
    ALTER TABLE occurrences ADD COLUMN needs_zeladoria BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Flag indicando se foi convertida automaticamente
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='occurrences' AND column_name='auto_converted') THEN
    ALTER TABLE occurrences ADD COLUMN auto_converted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_occurrences_type ON occurrences(occurrence_type); -- Filtros por tipo
CREATE INDEX IF NOT EXISTS idx_occurrences_limpeza_type ON occurrences(limpeza_type); -- Filtros por tipo de limpeza
CREATE INDEX IF NOT EXISTS idx_occurrences_needs_zeladoria ON occurrences(needs_zeladoria); -- Filtros por necessidade de zeladoria

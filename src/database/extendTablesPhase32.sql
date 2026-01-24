-- Script de extensão das tabelas - FASE 32 (OBSERVAÇÕES DO SÍNDICO)
-- Adiciona tabela para armazenar observações do síndico sobre tarefas e ocorrências

-- Tabela de observações do síndico
-- Permite que o síndico adicione observações/comentários em tarefas e ocorrências
CREATE TABLE IF NOT EXISTS sindico_observations (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  entity_type VARCHAR(50) NOT NULL, -- Tipo de entidade: 'tasks', 'occurrences', etc
  entity_id INTEGER NOT NULL, -- ID da entidade relacionada
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- Usuário que criou a observação
  observation TEXT NOT NULL, -- Texto da observação
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sindico_observations_condominium ON sindico_observations(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_sindico_observations_entity ON sindico_observations(entity_type, entity_id); -- Busca por entidade
CREATE INDEX IF NOT EXISTS idx_sindico_observations_user ON sindico_observations(user_id); -- Filtros por usuário
CREATE INDEX IF NOT EXISTS idx_sindico_observations_created ON sindico_observations(created_at); -- Ordenação por data

-- Comentários nas colunas
COMMENT ON TABLE sindico_observations IS 'Observações/comentários do síndico sobre tarefas e ocorrências';
COMMENT ON COLUMN sindico_observations.entity_type IS 'Tipo de entidade: tasks, occurrences, etc';
COMMENT ON COLUMN sindico_observations.entity_id IS 'ID da entidade relacionada';
COMMENT ON COLUMN sindico_observations.observation IS 'Texto da observação/comentário';

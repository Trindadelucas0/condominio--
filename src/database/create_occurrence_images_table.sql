-- Script para criar tabela occurrence_images manualmente
-- Execute este script diretamente no banco de dados se a tabela não existir

-- Tabela de imagens de ocorrências
-- Fotos/anexos que acompanham a ocorrência
CREATE TABLE IF NOT EXISTS occurrence_images (
  id SERIAL PRIMARY KEY, -- ID único
  occurrence_id INTEGER NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE, -- Ocorrência relacionada
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo
  file_name VARCHAR(255) NOT NULL, -- Nome original do arquivo
  file_type VARCHAR(50), -- Tipo do arquivo (image/jpeg, image/png, etc)
  file_size INTEGER, -- Tamanho do arquivo em bytes
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem enviou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de upload
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_occurrence_images_occurrence ON occurrence_images(occurrence_id); -- Filtros por ocorrência
CREATE INDEX IF NOT EXISTS idx_occurrence_images_uploaded_by ON occurrence_images(uploaded_by); -- Filtros por quem enviou

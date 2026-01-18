-- Script de extensão das tabelas - FASE 27 (MELHORIAS DE DOCUMENTOS)
-- Adiciona funcionalidades avançadas ao módulo de documentos
-- Executado após a criação das tabelas anteriores

-- Tabela de versionamento de documentos
-- Registra histórico de versões de documentos
CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY, -- ID único
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE, -- Documento
  version_number INTEGER NOT NULL, -- Número da versão
  file_path VARCHAR(500), -- Caminho do arquivo desta versão
  file_name VARCHAR(255), -- Nome do arquivo desta versão
  change_description TEXT, -- Descrição das alterações nesta versão
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou esta versão
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação da versão
  UNIQUE(document_id, version_number) -- Uma versão por número por documento
);

-- Adiciona campos de busca full-text e tags se não existirem
DO $$
BEGIN
  -- Campo de busca full-text
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='search_text') THEN
    ALTER TABLE documents ADD COLUMN search_text TEXT;
  END IF;
  
  -- Campo de tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='tags') THEN
    ALTER TABLE documents ADD COLUMN tags TEXT[];
  END IF;
  
  -- Campo de pasta
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='folder') THEN
    ALTER TABLE documents ADD COLUMN folder VARCHAR(255);
  END IF;
  
  -- Campo de compartilhamento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='shared') THEN
    ALTER TABLE documents ADD COLUMN shared BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Campo de link temporário
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='share_token') THEN
    ALTER TABLE documents ADD COLUMN share_token VARCHAR(100);
  END IF;
  
  -- Campo de expiração do link
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='documents' AND column_name='share_expires_at') THEN
    ALTER TABLE documents ADD COLUMN share_expires_at TIMESTAMP;
  END IF;
END $$;

-- Índice para busca full-text
CREATE INDEX IF NOT EXISTS idx_documents_search_text ON documents USING gin(to_tsvector('portuguese', COALESCE(search_text, '')));
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);

-- Comentários
COMMENT ON TABLE document_versions IS 'Versionamento de documentos - histórico de versões';
COMMENT ON COLUMN documents.search_text IS 'Texto indexado para busca full-text';
COMMENT ON COLUMN documents.tags IS 'Tags para categorização e busca';
COMMENT ON COLUMN documents.folder IS 'Pasta/organização do documento';
COMMENT ON COLUMN documents.share_token IS 'Token para compartilhamento seguro';

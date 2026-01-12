-- Script de extensão das tabelas - FASE 7 (ADMINISTRATIVO)
-- Adiciona tabelas necessárias para funcionalidades administrativas
-- Executado após a criação das tabelas anteriores

-- Tabela de categorias de documentos
-- Organiza documentos por categoria (Contratos, Atas, Laudos, etc)
CREATE TABLE IF NOT EXISTS document_categories (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  name VARCHAR(100) NOT NULL, -- Nome da categoria
  description TEXT, -- Descrição da categoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Tabela de documentos
-- Armazena informações de documentos do condomínio
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  category_id INTEGER REFERENCES document_categories(id) ON DELETE SET NULL, -- Categoria do documento
  title VARCHAR(255) NOT NULL, -- Título do documento
  description TEXT, -- Descrição do documento
  file_path VARCHAR(500), -- Caminho do arquivo (se houver upload)
  file_name VARCHAR(255), -- Nome original do arquivo
  file_type VARCHAR(50), -- Tipo do arquivo
  document_type VARCHAR(50) DEFAULT 'DOCUMENT', -- Tipo: CONTRACT, ATA, LAUDO, OUTRO
  expiry_date DATE, -- Data de vencimento (para contratos, seguros, etc)
  status VARCHAR(20) DEFAULT 'ACTIVE', -- Status: ACTIVE, EXPIRED, ARCHIVED
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_document_categories_condominium ON document_categories(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_documents_condominium ON documents(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id); -- Filtros por categoria
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON documents(expiry_date); -- Filtros por vencimento
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status); -- Filtros por status

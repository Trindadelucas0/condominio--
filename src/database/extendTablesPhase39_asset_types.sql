-- Tipos de ativo por condomínio (criados via "Criar novo tipo" no formulário de ativos)
-- Permite que todos os usuários do condomínio vejam os mesmos tipos ao cadastrar ativos

CREATE TABLE IF NOT EXISTS asset_types (
  id SERIAL PRIMARY KEY,
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE,
  type_code VARCHAR(50) NOT NULL,
  type_label VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(condominium_id, type_code)
);

CREATE INDEX IF NOT EXISTS idx_asset_types_condominium ON asset_types(condominium_id);

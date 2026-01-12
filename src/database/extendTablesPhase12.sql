-- Script de extensão das tabelas - FASE 12 (ESTOQUE/INSUMOS)
-- Adiciona tabelas necessárias para gestão de estoque e insumos
-- Executado após a criação das tabelas anteriores
--
-- OBJETIVO: Controlar insumos do condomínio, alertar quando abaixo do mínimo
-- REGRA: Operacional baixa, Administrativo controla, Financeiro vê impacto

-- Tabela de insumos (estoque)
-- Cadastro de itens de estoque do condomínio
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  name VARCHAR(255) NOT NULL, -- Nome do insumo (ex: "Detergente", "Lâmpada LED 9W")
  description TEXT, -- Descrição do insumo
  unit VARCHAR(50) NOT NULL DEFAULT 'UN', -- Unidade de medida (UN, KG, L, M, etc)
  current_quantity DECIMAL(10,2) DEFAULT 0, -- Quantidade atual em estoque
  minimum_quantity DECIMAL(10,2) DEFAULT 0, -- Quantidade mínima (gera alerta se abaixo)
  category VARCHAR(100), -- Categoria (LIMPEZA, MANUTENCAO, JARDINAGEM, OUTROS)
  supplier VARCHAR(255), -- Fornecedor padrão
  last_purchase_price DECIMAL(10,2), -- Último preço de compra
  location VARCHAR(255), -- Localização no condomínio (estoque, depósito, etc)
  active BOOLEAN DEFAULT TRUE, -- Status ativo/inativo
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  archived_at TIMESTAMP NULL -- Soft delete
);

-- Tabela de movimentações de estoque
-- Registra todas as entradas e saídas do estoque
CREATE TABLE IF NOT EXISTS inventory_movements (
  id SERIAL PRIMARY KEY, -- ID único
  inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE, -- Item do estoque
  movement_type VARCHAR(20) NOT NULL, -- Tipo: ENTRY (entrada), EXIT (saída), ADJUSTMENT (ajuste)
  quantity DECIMAL(10,2) NOT NULL, -- Quantidade movimentada (positiva para entrada, negativa para saída)
  quantity_before DECIMAL(10,2) NOT NULL, -- Quantidade antes da movimentação
  quantity_after DECIMAL(10,2) NOT NULL, -- Quantidade após a movimentação
  reason TEXT, -- Motivo da movimentação
  cost DECIMAL(10,2), -- Custo (para entradas)
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Data da movimentação
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem registrou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de registro
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_condominium ON inventory_items(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category); -- Filtros por categoria
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON inventory_items(active); -- Filtros por ativo
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(inventory_item_id); -- Filtros por item
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date); -- Ordenação por data
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type); -- Filtros por tipo

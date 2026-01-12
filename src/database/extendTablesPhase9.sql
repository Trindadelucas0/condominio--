-- Script de extensão das tabelas - FASE 9 (PATRIMÔNIO)
-- Adiciona tabelas necessárias para gestão de patrimônio
-- Executado após a criação das tabelas anteriores

-- Tabela de ativos (equipamentos, elevadores, bombas, etc)
-- Registra todos os ativos do condomínio
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  name VARCHAR(255) NOT NULL, -- Nome do ativo (Ex: Elevador A, Bomba d'água 1)
  description TEXT, -- Descrição do ativo
  asset_type VARCHAR(50) NOT NULL, -- Tipo: ELEVADOR, BOMBA, GERADOR, PORTARIA, OUTRO
  manufacturer VARCHAR(255), -- Fabricante
  model VARCHAR(255), -- Modelo
  serial_number VARCHAR(100), -- Número de série
  acquisition_date DATE, -- Data de aquisição
  acquisition_cost DECIMAL(15,2), -- Valor de aquisição
  current_value DECIMAL(15,2), -- Valor atual (calculado via depreciação)
  depreciation_rate DECIMAL(5,2) DEFAULT 10.00, -- Taxa de depreciação anual (%)
  useful_life_years INTEGER DEFAULT 10, -- Vida útil em anos
  location VARCHAR(255), -- Localização do ativo
  status VARCHAR(50) DEFAULT 'ACTIVE', -- Status: ACTIVE, INACTIVE, MAINTENANCE, DECOMMISSIONED
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data da última atualização
  archived_at TIMESTAMP NULL -- Soft delete
);

-- Tabela de manutenções vinculadas a ativos
-- Relaciona manutenções com ativos específicos
CREATE TABLE IF NOT EXISTS asset_maintenances (
  id SERIAL PRIMARY KEY, -- ID único
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE, -- Ativo
  maintenance_type VARCHAR(50) NOT NULL, -- Tipo: PREVENTIVA, CORRETIVA
  description TEXT NOT NULL, -- Descrição da manutenção
  cost DECIMAL(15,2), -- Custo da manutenção
  maintenance_date DATE NOT NULL, -- Data da manutenção
  next_maintenance_date DATE, -- Próxima manutenção (para preventivas)
  performed_by VARCHAR(255), -- Quem realizou (empresa/funcionário)
  notes TEXT, -- Observações
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem registrou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de registro
);

-- Tabela de histórico de depreciação
-- Registra o histórico de cálculo de depreciação dos ativos
CREATE TABLE IF NOT EXISTS asset_depreciation (
  id SERIAL PRIMARY KEY, -- ID único
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE, -- Ativo
  calculation_date DATE NOT NULL, -- Data do cálculo
  acquisition_value DECIMAL(15,2) NOT NULL, -- Valor de aquisição no momento do cálculo
  depreciation_amount DECIMAL(15,2) NOT NULL, -- Valor depreciado
  current_value DECIMAL(15,2) NOT NULL, -- Valor atual após depreciação
  years_in_use DECIMAL(5,2) NOT NULL, -- Anos de uso até a data do cálculo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação do registro
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_assets_condominium ON assets(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type); -- Filtros por tipo
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_asset ON asset_maintenances(asset_id); -- Filtros por ativo
CREATE INDEX IF NOT EXISTS idx_asset_maintenances_date ON asset_maintenances(maintenance_date); -- Ordenação por data
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_asset ON asset_depreciation(asset_id); -- Filtros por ativo
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_date ON asset_depreciation(calculation_date); -- Ordenação por data

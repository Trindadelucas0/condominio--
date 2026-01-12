-- Script de extensão das tabelas - FASE 17 (CHECKLISTS BASEADOS EM REGRAS)
-- Sistema de checklists automáticos baseados em modelos/templates
-- Executado após a criação das tabelas anteriores

-- Tabela de modelos/templates de checklist
-- Modelos criados pelo Síndico que definem regras de execução
CREATE TABLE IF NOT EXISTS checklist_models (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  name VARCHAR(255) NOT NULL, -- Nome do modelo (ex: "Inspeção Zeladoria - Semanal")
  description TEXT, -- Descrição do modelo
  
  -- Configuração de execução
  department VARCHAR(50) NOT NULL, -- Departamento: ZELADORIA, LIMPEZA
  days_of_week INTEGER[], -- Dias da semana: [1,3,5] = Segunda, Quarta, Sexta (0=Domingo, 6=Sábado)
  is_active BOOLEAN DEFAULT TRUE, -- Modelo ativo/inativo
  
  -- Regras de execução
  requires_photo BOOLEAN DEFAULT TRUE, -- Requer foto obrigatória?
  requires_justification BOOLEAN DEFAULT TRUE, -- Requer justificativa se item não feito?
  default_assigned_role VARCHAR(50), -- Role padrão: OPERACIONAL, LIMPEZA
  
  -- Metadados
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou (Síndico)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Tabela de itens dos modelos de checklist
-- Itens que fazem parte de um modelo
CREATE TABLE IF NOT EXISTS checklist_model_items (
  id SERIAL PRIMARY KEY, -- ID único
  model_id INTEGER NOT NULL REFERENCES checklist_models(id) ON DELETE CASCADE, -- Modelo relacionado
  item_name VARCHAR(255) NOT NULL, -- Nome do item (ex: "Verificar lâmpadas")
  item_order INTEGER DEFAULT 0, -- Ordem de exibição
  requires_photo BOOLEAN DEFAULT FALSE, -- Este item específico requer foto?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Tabela de checklists diários (gerados automaticamente)
-- Checklists criados pelo sistema baseados nos modelos
CREATE TABLE IF NOT EXISTS daily_checklists (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  model_id INTEGER REFERENCES checklist_models(id) ON DELETE SET NULL, -- Modelo que originou este checklist
  
  -- Data e responsável
  scheduled_date DATE NOT NULL, -- Data do checklist (10/03/2025)
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Responsável específico (pode ser NULL)
  assigned_role VARCHAR(50), -- Role do responsável: OPERACIONAL, LIMPEZA
  
  -- Status
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, LATE, CANCELLED
  started_at TIMESTAMP NULL, -- Quando começou a execução
  completed_at TIMESTAMP NULL, -- Quando foi finalizado
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem completou
  
  -- Metadados
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  created_by_system BOOLEAN DEFAULT TRUE, -- TRUE = gerado automaticamente, FALSE = criado manualmente
  
  -- Constraint: não pode ter 2 checklists do mesmo modelo no mesmo dia
  UNIQUE(condominium_id, model_id, scheduled_date)
);

-- Tabela de itens dos checklists diários
-- Itens do checklist do dia (copiados do modelo no momento da criação)
CREATE TABLE IF NOT EXISTS daily_checklist_items (
  id SERIAL PRIMARY KEY, -- ID único
  checklist_id INTEGER NOT NULL REFERENCES daily_checklists(id) ON DELETE CASCADE, -- Checklist relacionado
  model_item_id INTEGER REFERENCES checklist_model_items(id) ON DELETE SET NULL, -- Referência ao item do modelo (opcional, pode ter sido removido)
  
  -- Dados copiados do modelo (para preservar histórico mesmo se modelo mudar)
  item_name VARCHAR(255) NOT NULL, -- Nome do item (copiado do modelo)
  item_order INTEGER DEFAULT 0, -- Ordem (copiada do modelo)
  
  -- Execução
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, DONE, NOT_DONE
  comment TEXT, -- Comentário (obrigatório se NOT_DONE e requires_justification = TRUE)
  done_at TIMESTAMP NULL, -- Data/hora de conclusão
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Tabela de evidências (fotos) dos checklists
-- Fotos que comprovam a execução dos itens do checklist
CREATE TABLE IF NOT EXISTS checklist_evidences (
  id SERIAL PRIMARY KEY, -- ID único
  checklist_id INTEGER REFERENCES daily_checklists(id) ON DELETE CASCADE, -- Checklist relacionado
  checklist_item_id INTEGER REFERENCES daily_checklist_items(id) ON DELETE CASCADE, -- Item específico (opcional, NULL = foto geral do checklist)
  
  -- Dados do arquivo
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo
  file_name VARCHAR(255), -- Nome original do arquivo
  file_type VARCHAR(50), -- Tipo do arquivo (image/jpeg, image/png, etc)
  file_size INTEGER, -- Tamanho do arquivo em bytes
  
  -- Metadados
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem enviou
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data/hora do upload
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_checklist_models_condominium ON checklist_models(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_checklist_models_active ON checklist_models(is_active); -- Filtros por status ativo
CREATE INDEX IF NOT EXISTS idx_checklist_model_items_model ON checklist_model_items(model_id); -- Filtros por modelo

CREATE INDEX IF NOT EXISTS idx_daily_checklists_condominium ON daily_checklists(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_daily_checklists_date ON daily_checklists(scheduled_date); -- Filtros por data
CREATE INDEX IF NOT EXISTS idx_daily_checklists_status ON daily_checklists(status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_daily_checklists_assigned ON daily_checklists(assigned_to); -- Filtros por responsável
CREATE INDEX IF NOT EXISTS idx_daily_checklists_model ON daily_checklists(model_id); -- Filtros por modelo

CREATE INDEX IF NOT EXISTS idx_daily_checklist_items_checklist ON daily_checklist_items(checklist_id); -- Filtros por checklist
CREATE INDEX IF NOT EXISTS idx_daily_checklist_items_status ON daily_checklist_items(status); -- Filtros por status

CREATE INDEX IF NOT EXISTS idx_checklist_evidences_checklist ON checklist_evidences(checklist_id); -- Filtros por checklist
CREATE INDEX IF NOT EXISTS idx_checklist_evidences_item ON checklist_evidences(checklist_item_id); -- Filtros por item

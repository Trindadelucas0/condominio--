-- Script de extensão das tabelas - FASE 6 (OPERACIONAL)
-- Adiciona tabelas necessárias para funcionalidades operacionais
-- Executado após a criação das tabelas anteriores

-- Tabela de ocorrências
-- Registra problemas e ocorrências reportadas pelo operacional
CREATE TABLE IF NOT EXISTS occurrences (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  reported_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- Usuário que reportou
  title VARCHAR(255) NOT NULL, -- Título da ocorrência
  description TEXT NOT NULL, -- Descrição detalhada
  location VARCHAR(255), -- Localização do problema
  status VARCHAR(20) DEFAULT 'ABERTA', -- Status: ABERTA, EM_ATENDIMENTO, AGUARDANDO_TERCEIRO, RESOLVIDA, ENCERRADA
  priority VARCHAR(20) DEFAULT 'NORMAL', -- Prioridade: BAIXA, NORMAL, ALTA, URGENTE
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Responsável pela resolução
  resolved_at TIMESTAMP NULL, -- Data/hora da resolução
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem resolveu
  resolution_notes TEXT, -- Notas da resolução
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Tabela de tarefas
-- Tarefas criadas pelo administrativo para o operacional executar
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY, -- ID único
  condominium_id INTEGER NOT NULL REFERENCES condominiums(id) ON DELETE CASCADE, -- Condomínio
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem criou (administrativo)
  assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- Responsável (operacional)
  title VARCHAR(255) NOT NULL, -- Título da tarefa
  description TEXT, -- Descrição da tarefa
  task_type VARCHAR(50) DEFAULT 'CHECKLIST', -- Tipo: CHECKLIST, MANUTENCAO, OUTRA
  status VARCHAR(20) DEFAULT 'PENDING', -- Status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  priority VARCHAR(20) DEFAULT 'NORMAL', -- Prioridade: BAIXA, NORMAL, ALTA, URGENTE
  due_date DATE NOT NULL, -- Data de vencimento (obrigatório)
  completed_at TIMESTAMP NULL, -- Data/hora de conclusão
  evidence_required BOOLEAN DEFAULT TRUE, -- Se requer evidência (foto)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data da última atualização
);

-- Tabela de checklists
-- Itens de checklist vinculados a tarefas
CREATE TABLE IF NOT EXISTS checklists (
  id SERIAL PRIMARY KEY, -- ID único
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, -- Tarefa relacionada
  item_name VARCHAR(255) NOT NULL, -- Nome do item de checklist
  item_order INTEGER DEFAULT 0, -- Ordem do item
  status VARCHAR(20) DEFAULT 'PENDING', -- Status: PENDING, DONE, NOT_DONE
  comment TEXT, -- Comentário (obrigatório se NOT_DONE)
  done_at TIMESTAMP NULL, -- Data/hora de conclusão
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de criação
);

-- Tabela de evidências de tarefas
-- Fotos/anexos que comprovam a execução da tarefa
CREATE TABLE IF NOT EXISTS task_evidences (
  id SERIAL PRIMARY KEY, -- ID único
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, -- Tarefa relacionada
  checklist_id INTEGER REFERENCES checklists(id) ON DELETE SET NULL, -- Item de checklist (se aplicável)
  file_path VARCHAR(500) NOT NULL, -- Caminho do arquivo
  file_name VARCHAR(255) NOT NULL, -- Nome original do arquivo
  file_type VARCHAR(50), -- Tipo do arquivo (image/jpeg, etc)
  evidence_type VARCHAR(20) DEFAULT 'BEFORE', -- Tipo: BEFORE, AFTER
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Quem enviou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data de upload
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_occurrences_condominium ON occurrences(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_occurrences_reported_by ON occurrences(reported_by); -- Filtros por quem reportou
CREATE INDEX IF NOT EXISTS idx_occurrences_status ON occurrences(status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_tasks_condominium ON tasks(condominium_id); -- Filtros por condomínio
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to); -- Filtros por responsável
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status); -- Filtros por status
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date); -- Ordenação por data de vencimento
CREATE INDEX IF NOT EXISTS idx_checklists_task ON checklists(task_id); -- Filtros por tarefa
CREATE INDEX IF NOT EXISTS idx_task_evidences_task ON task_evidences(task_id); -- Filtros por tarefa

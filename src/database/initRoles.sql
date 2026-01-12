-- Script de inserção inicial de perfis (roles)
-- Estes são os perfis base do sistema
-- Executado apenas uma vez ao inicializar o banco

-- Insere perfis apenas se não existirem
-- Usa INSERT ... ON CONFLICT para evitar duplicação

INSERT INTO roles (name, description) VALUES
  ('SUPER_MASTER', 'Administrador do sistema. Pode criar condomínios e usuários. Não governa condomínios específicos.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('SINDICO', 'Síndico do condomínio. Decide e aprova. Não executa tarefas operacionais.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('SUBSINDICO', 'Subsíndico do condomínio. Mesmas permissões do síndico.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('ADMINISTRATIVO', 'Equipe administrativa. Organiza tarefas e documentos. Não executa checklists.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('OPERACIONAL', 'Equipe operacional (zeladoria). Executa checklists e tarefas. Não vê dados financeiros.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('FINANCEIRO', 'Equipe financeira. Controla entradas e saídas. NÃO aprova valores altos (apenas SINDICO aprova).')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('PATRIMONIO', 'Controle patrimonial. Cadastra ativos e gerencia depreciação. NÃO cria despesas.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('LIMPEZA', 'Equipe de limpeza (subset operacional). Executa checklists de limpeza. NÃO cria ocorrências. NÃO vê financeiro.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description) VALUES
  ('CONSELHO', 'Membro do conselho. Apenas leitura. Não pode criar, editar ou aprovar nada.')
ON CONFLICT (name) DO NOTHING;

-- Script para criar o primeiro usuário SUPER_MASTER
-- Execute este script manualmente no banco de dados após a inicialização
-- 
-- IMPORTANTE: Altere a senha antes de executar!
-- A senha padrão é 'admin123' - ALTERE ISSO IMEDIATAMENTE após o primeiro login

-- Primeiro, verifica se já existe um SUPER_MASTER
DO $$
DECLARE
  master_exists BOOLEAN;
  master_role_id INTEGER;
  new_user_id INTEGER;
BEGIN
  -- Verifica se já existe um usuário SUPER_MASTER
  SELECT EXISTS(
    SELECT 1 FROM users u
    INNER JOIN user_roles ur ON u.id = ur.user_id
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'SUPER_MASTER'
  ) INTO master_exists;

  IF master_exists THEN
    RAISE NOTICE 'Usuário SUPER_MASTER já existe. Pulando criação.';
  ELSE
    -- Busca o ID do role SUPER_MASTER
    SELECT id INTO master_role_id FROM roles WHERE name = 'SUPER_MASTER';
    
    IF master_role_id IS NULL THEN
      RAISE EXCEPTION 'Role SUPER_MASTER não encontrado. Execute initRoles.sql primeiro.';
    END IF;

    -- Cria o usuário master
    -- SENHA PADRÃO: admin123 (ALTERE ISSO!)
    -- Para gerar um novo hash: use bcrypt com salt rounds 10
    -- Exemplo em Node.js: const hash = await bcrypt.hash('sua_senha', 10);
    INSERT INTO users (username, email, password_hash, full_name, condominium_id, active)
    VALUES (
      'admin',
      'admin@condominio.com',
      '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- Hash de 'admin123'
      'Administrador Master',
      NULL, -- SUPER_MASTER não pertence a condomínio
      TRUE
    )
    RETURNING id INTO new_user_id;

    -- Atribui o role SUPER_MASTER
    INSERT INTO user_roles (user_id, role_id)
    VALUES (new_user_id, master_role_id);

    RAISE NOTICE 'Usuário SUPER_MASTER criado com sucesso!';
    RAISE NOTICE 'Username: admin';
    RAISE NOTICE 'Senha padrão: admin123';
    RAISE NOTICE 'IMPORTANTE: Altere a senha após o primeiro login!';
  END IF;
END $$;

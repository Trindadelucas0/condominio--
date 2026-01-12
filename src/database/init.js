// Script de inicialização do banco de dados
// Este arquivo verifica e cria as tabelas necessárias ao iniciar o servidor
// Também cria o usuário SUPER_MASTER padrão se não existir

const fs = require('fs'); // Para ler arquivos SQL
const path = require('path'); // Para caminhos de arquivos
const { query } = require('../config/database'); // Funções de query do banco
const bcrypt = require('bcrypt'); // Para hash de senha

// Função para verificar se uma tabela existe
// Recebe: nome da tabela
// Retorna: true se existe, false se não existe
const tableExists = async (tableName) => {
  try {
    const result = await query(
      // Query SQL que verifica se a tabela existe no schema public
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists; // Retorna boolean (true/false)
  } catch (error) {
    console.error(`Erro ao verificar existência da tabela ${tableName}:`, error);
    return false; // Em caso de erro, assume que não existe
  }
};

// Função para executar script SQL de um arquivo
// Recebe: caminho do arquivo SQL
// Executa o conteúdo do arquivo no banco
const executeSQLFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8'); // Lê conteúdo do arquivo
    await query(sql); // Executa o SQL no banco
    console.log(`✓ Script executado: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Erro ao executar script ${filePath}:`, error);
    throw error; // Propaga erro para interromper inicialização
  }
};

// Função para inicializar todas as tabelas
// Verifica cada tabela e cria se não existir
const initTables = async () => {
  console.log('🔍 Verificando tabelas do banco de dados...');

  // Lista de tabelas obrigatórias (base)
  const requiredTables = ['users', 'roles', 'user_roles', 'condominiums', 'audit_logs'];
  
  // Lista de tabelas estendidas (funcionalidades adicionais)
  const extendedTables = ['approvals', 'alerts', 'financial_exits'];
  
  // Lista de tabelas da FASE 6 (operacional)
  const phase6Tables = ['occurrences', 'tasks', 'checklists', 'task_evidences'];
  
  // Lista de tabelas da FASE 7 (administrativo)
  const phase7Tables = ['documents', 'document_categories'];
  
  // Lista de tabelas da FASE 8 (financeiro)
  const phase8Tables = ['cost_centers', 'financial_entries', 'bills'];
  
  // Lista de tabelas da FASE 9 (patrimônio)
  const phase9Tables = ['assets', 'asset_maintenances', 'asset_depreciation'];

  // Verifica cada tabela base
  for (const table of requiredTables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      // Se alguma tabela não existe, executa script completo de criação
      await executeSQLFile(path.join(__dirname, 'init.sql'));
      break; // Para o loop após criar (script cria todas de uma vez)
    }
  }

  console.log('✅ Tabelas base verificadas/criadas com sucesso');

  // Verifica e cria tabelas estendidas
  console.log('🔍 Verificando tabelas estendidas...');
  for (const table of extendedTables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      // Se alguma tabela estendida não existe, executa script de extensão
      await executeSQLFile(path.join(__dirname, 'extendTables.sql'));
      break; // Para o loop após criar (script cria todas de uma vez)
    }
  }

  console.log('✅ Tabelas estendidas verificadas/criadas com sucesso');

  // Verifica e cria tabelas da FASE 6 (operacional)
  console.log('🔍 Verificando tabelas da FASE 6 (operacional)...');
  for (const table of phase6Tables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      // Se alguma tabela da FASE 6 não existe, executa script de extensão
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase6.sql'));
      break; // Para o loop após criar (script cria todas de uma vez)
    }
  }

  console.log('✅ Tabelas da FASE 6 verificadas/criadas com sucesso');

  // Verifica e cria tabelas da FASE 7 (administrativo)
  console.log('🔍 Verificando tabelas da FASE 7 (administrativo)...');
  for (const table of phase7Tables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      // Se alguma tabela da FASE 7 não existe, executa script de extensão
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase7.sql'));
      break; // Para o loop após criar (script cria todas de uma vez)
    }
  }

  console.log('✅ Tabelas da FASE 7 verificadas/criadas com sucesso');

  // Verifica e cria tabelas da FASE 8 (financeiro)
  console.log('🔍 Verificando tabelas da FASE 8 (financeiro)...');
  for (const table of phase8Tables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      // Se alguma tabela da FASE 8 não existe, executa script de extensão
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase8.sql'));
      break; // Para o loop após criar (script cria todas de uma vez)
    }
  }

  console.log('✅ Tabelas da FASE 8 verificadas/criadas com sucesso');

  // Verifica e cria tabelas da FASE 9 (patrimônio)
  console.log('🔍 Verificando tabelas da FASE 9 (patrimônio)...');
  for (const table of phase9Tables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      // Se alguma tabela da FASE 9 não existe, executa script de extensão
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase9.sql'));
      break; // Para o loop após criar (script cria todas de uma vez)
    }
  }

  console.log('✅ Tabelas da FASE 9 verificadas/criadas com sucesso');
};

// Função para inicializar perfis (roles) padrão
// Insere os perfis base se não existirem
const initRoles = async () => {
  console.log('🔍 Verificando perfis padrão...');
  try {
    await executeSQLFile(path.join(__dirname, 'initRoles.sql'));
    console.log('✅ Perfis padrão verificados/criados');
  } catch (error) {
    console.error('Erro ao inicializar perfis:', error);
    throw error;
  }
};

// Função para criar usuário SUPER_MASTER padrão
// Cria apenas se não existir nenhum SUPER_MASTER no sistema
const initSuperMaster = async () => {
  console.log('🔍 Verificando usuário SUPER_MASTER padrão...');

  try {
    // Verifica se já existe algum usuário com perfil SUPER_MASTER
    const existingSuperMaster = await query(
      `SELECT u.id 
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE r.name = 'SUPER_MASTER' 
       AND u.active = TRUE
       LIMIT 1`
    );

    // Se já existe, não cria outro
    if (existingSuperMaster.rows.length > 0) {
      console.log('✅ SUPER_MASTER já existe no sistema');
      return;
    }

    // Se não existe, cria o usuário padrão
    console.log('⚠️  SUPER_MASTER não encontrado. Criando usuário padrão...');

    // Obtém ID do perfil SUPER_MASTER
    const roleResult = await query("SELECT id FROM roles WHERE name = 'SUPER_MASTER'");
    if (roleResult.rows.length === 0) {
      throw new Error('Perfil SUPER_MASTER não encontrado na tabela roles');
    }
    const superMasterRoleId = roleResult.rows[0].id;

    // Dados padrão do SUPER_MASTER
    const defaultUsername = 'admin';
    const defaultEmail = 'admin@sistema.local';
    const defaultPassword = 'admin123'; // SENHA PADRÃO - DEVE SER ALTERADA EM PRODUÇÃO
    const defaultFullName = 'Administrador do Sistema';

    // Criptografa a senha com bcrypt (10 rounds de salt)
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Insere usuário (sem condominium_id, pois SUPER_MASTER não pertence a condomínio específico)
    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, full_name, active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id`,
      [defaultUsername, defaultEmail, passwordHash, defaultFullName]
    );

    const userId = userResult.rows[0].id;

    // Vincula perfil SUPER_MASTER ao usuário
    await query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)`,
      [userId, superMasterRoleId]
    );

    // Registra ação no log de auditoria
    await query(
      `INSERT INTO audit_logs (user_id, action, module, entity_type, entity_id, after_data)
       VALUES ($1, 'CREATE', 'SYSTEM', 'users', $2, $3)`,
      [
        userId,
        userId,
        JSON.stringify({
          username: defaultUsername,
          email: defaultEmail,
          role: 'SUPER_MASTER',
          created_by: 'SYSTEM_INIT',
        }),
      ]
    );

    console.log('✅ SUPER_MASTER criado com sucesso');
    console.log('📧 Credenciais padrão:');
    console.log(`   Usuário: ${defaultUsername}`);
    console.log(`   Senha: ${defaultPassword}`);
    console.log('⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!');
  } catch (error) {
    console.error('Erro ao criar SUPER_MASTER:', error);
    throw error;
  }
};

// Função principal de inicialização
// Executa todas as etapas na ordem correta
const initializeDatabase = async () => {
  try {
    console.log('🚀 Iniciando inicialização do banco de dados...\n');

    // Etapa 1: Criar tabelas se não existirem
    await initTables();

    // Etapa 2: Inserir perfis padrão
    await initRoles();

    // Etapa 3: Criar SUPER_MASTER se não existir
    await initSuperMaster();

    console.log('\n✅ Inicialização do banco de dados concluída!\n');
  } catch (error) {
    console.error('\n❌ Erro durante inicialização do banco:', error);
    process.exit(1); // Encerra processo em caso de erro crítico
  }
};

// Exporta função principal para uso no server.js
module.exports = initializeDatabase;

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
  
  // Lista de tabelas da FASE 10 (alertas e automações)
  const phase10Tables = ['notifications', 'slas', 'escalation_rules'];
  
  // Lista de tabelas da FASE 11 (configurações do condomínio)
  const phase11Tables = ['condominium_settings'];
  
  // Lista de tabelas da FASE 12 (estoque/insumos)
  const phase12Tables = ['inventory_items', 'inventory_movements'];
  
  // FASE 13 não adiciona novas tabelas, apenas campos nas existentes

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

  // Verifica e cria tabelas da FASE 10 (alertas e automações)
  console.log('🔍 Verificando tabelas da FASE 10 (alertas e automações)...');
  for (const table of phase10Tables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      // Se alguma tabela da FASE 10 não existe, executa script de extensão
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase10.sql'));
      break; // Para o loop após criar (script cria todas de uma vez)
    }
  }

  console.log('✅ Tabelas da FASE 10 verificadas/criadas com sucesso');

  // Verifica e cria tabelas da FASE 11 (configurações do condomínio)
  console.log('🔍 Verificando tabelas da FASE 11 (configurações)...');
  for (const table of phase11Tables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase11.sql'));
      break;
    }
  }

  console.log('✅ Tabelas da FASE 11 verificadas/criadas com sucesso');

  // Verifica e cria tabelas da FASE 12 (estoque/insumos)
  console.log('🔍 Verificando tabelas da FASE 12 (estoque)...');
  for (const table of phase12Tables) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`⚠️  Tabela ${table} não encontrada. Criando...`);
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase12.sql'));
      break;
    }
  }

  console.log('✅ Tabelas da FASE 12 verificadas/criadas com sucesso');

  // FASE 13 adiciona campos nas tabelas existentes (não cria novas tabelas)
  console.log('🔍 Verificando campos da FASE 13 (reabertura)...');
  try {
    // Verifica se campos de reabertura já existem (testa em occurrences)
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'occurrences' AND column_name = 'reopened'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('⚠️  Campos de reabertura não encontrados. Criando...');
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase13.sql'));
      console.log('✅ Campos da FASE 13 criados com sucesso');
    } else {
      console.log('✅ Campos da FASE 13 já existem');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar campos da FASE 13:', error);
    // Não interrompe inicialização se falhar (pode ser que tabelas ainda não existam)
  }

  // FASE 14 adiciona campos na tabela occurrences para diferenciar LIMPEZA e ZELADORIA
  console.log('🔍 Verificando campos da FASE 14 (ocorrências de limpeza)...');
  try {
    // Verifica se campos de ocorrências de limpeza já existem
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'occurrences' AND column_name = 'occurrence_type'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('⚠️  Campos de ocorrências de limpeza não encontrados. Criando...');
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase14.sql'));
      console.log('✅ Campos da FASE 14 criados com sucesso');
    } else {
      console.log('✅ Campos da FASE 14 já existem');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar campos da FASE 14:', error);
    // Não interrompe inicialização se falhar
  }

  // FASE 15 adiciona campos de triagem, observações do síndico, solicitações de orçamento e comunicados
  console.log('🔍 Verificando campos/tabelas da FASE 15 (triagem e observações)...');
  try {
    // Verifica se campos de triagem já existem
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'occurrences' AND column_name = 'triaged'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('⚠️  Campos/tabelas da FASE 15 não encontrados. Criando...');
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase15.sql'));
      console.log('✅ Campos/tabelas da FASE 15 criados com sucesso');
    } else {
      console.log('✅ Campos/tabelas da FASE 15 já existem');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar campos/tabelas da FASE 15:', error);
  }

  // FASE 16 adiciona campos de comprovante PDF e detalhes em financial_entries
  console.log('🔍 Verificando campos da FASE 16 (comprovantes de recebimento)...');
  try {
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'financial_entries' AND column_name = 'receipt_pdf_path'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('⚠️  Campos de comprovante não encontrados. Criando...');
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase16.sql'));
      console.log('✅ Campos da FASE 16 criados com sucesso');
    } else {
      console.log('✅ Campos da FASE 16 já existem');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar campos da FASE 16:', error);
  }

  // FASE 17 adiciona campos de comprovante PDF e detalhes em financial_exits
  console.log('🔍 Verificando campos da FASE 17 (comprovantes de pagamento)...');
  try {
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'financial_exits' AND column_name = 'payment_receipt_pdf_path'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('⚠️  Campos de comprovante de pagamento não encontrados. Criando...');
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase17.sql'));
      console.log('✅ Campos da FASE 17 criados com sucesso');
    } else {
      console.log('✅ Campos da FASE 17 já existem');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar campos da FASE 17:', error);
  }

  // FASE 18 adiciona tabela de consumo mensal
  console.log('🔍 Verificando tabela da FASE 18 (consumo mensal)...');
  try {
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'monthly_consumption'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️  Tabela de consumo mensal não encontrada. Criando...');
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase18.sql'));
      console.log('✅ Tabela da FASE 18 criada com sucesso');
    } else {
      console.log('✅ Tabela da FASE 18 já existe');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar tabela da FASE 18:', error);
  }

  // FASE 19 adiciona campos de recorrência e projeções
  console.log('🔍 Verificando campos da FASE 19 (recorrência e projeções)...');
  try {
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'financial_entries' AND column_name = 'is_recurring'
      )
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('⚠️  Campos de recorrência não encontrados. Criando...');
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase19.sql'));
      console.log('✅ Campos da FASE 19 criados com sucesso');
    } else {
      console.log('✅ Campos da FASE 19 já existem');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar campos da FASE 19:', error);
  }
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

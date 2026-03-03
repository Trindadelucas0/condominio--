// Script de inicialização do banco de dados
// Executa automaticamente todas as tabelas e dados iniciais
// É chamado ao iniciar o servidor

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Função para executar arquivo SQL
const executeSQLFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await query(sql);
  } catch (error) {
    console.error(`Erro ao executar arquivo SQL ${filePath}:`, error);
    throw error;
  }
};

// Função para criar o usuário master inicial
const createInitialMasterUser = async () => {
  try {
    // Verifica se já existe um SUPER_MASTER
    const existingMaster = await query(`
      SELECT u.id, u.username
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'SUPER_MASTER'
      LIMIT 1
    `);

    if (existingMaster.rows.length > 0) {
      console.log(`✅ Usuário SUPER_MASTER já existe: ${existingMaster.rows[0].username}`);
      return;
    }

    // Busca o ID do role SUPER_MASTER
    const roleResult = await query(`
      SELECT id FROM roles WHERE name = 'SUPER_MASTER'
    `);

    if (roleResult.rows.length === 0) {
      console.log('⚠️  Role SUPER_MASTER não encontrado. Pulando criação do usuário master.');
      return;
    }

    const masterRoleId = roleResult.rows[0].id;

    // Configurações do usuário master
    const username = 'admin';
    const email = 'admin@condominio.com';
    const password = 'admin123'; // ALTERE ISSO APÓS O PRIMEIRO LOGIN!
    const fullName = 'Administrador Master';

    // Verifica se o username já existe (mesmo sem ser SUPER_MASTER)
    const existingUsername = await query(`
      SELECT id FROM users WHERE LOWER(username) = LOWER($1)
    `, [username]);

    if (existingUsername.rows.length > 0) {
      console.log(`⚠️  Username '${username}' já existe. Pulando criação do usuário master.`);
      return;
    }

    // Gera hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Cria o usuário
    const userResult = await query(`
      INSERT INTO users (username, email, password_hash, full_name, condominium_id, active)
      VALUES ($1, $2, $3, $4, NULL, TRUE)
      RETURNING id, username, email
    `, [username, email, passwordHash, fullName]);

    const newUser = userResult.rows[0];

    // Atribui o role SUPER_MASTER
    await query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `, [newUser.id, masterRoleId]);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Usuário SUPER_MASTER criado com sucesso!');
    console.log('📋 Credenciais de acesso:');
    console.log(`   Username: ${username}`);
    console.log(`   Senha: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Erro ao criar usuário master:', error.message);
    // Não lança erro para não interromper a inicialização
  }
};

// Função principal de inicialização
const initializeDatabase = async () => {
  try {
    console.log('🚀 Inicializando banco de dados...');

    // FASE 1: Tabelas base
    console.log('🔍 Verificando tabelas base...');
    const baseTablesExist = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'condominiums'
      )
    `);

    if (!baseTablesExist.rows[0].exists) {
      console.log('⚠️  Tabelas base não encontradas. Criando...');
      await executeSQLFile(path.join(__dirname, 'init.sql'));
      console.log('✅ Tabelas base criadas com sucesso');
    } else {
      console.log('✅ Tabelas base já existem');
    }

    // FASE 2: Perfis (roles)
    console.log('🔍 Verificando perfis...');
    const rolesExist = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'roles'
      )
    `);

    if (rolesExist.rows[0].exists) {
      const rolesCount = await query(`SELECT COUNT(*) as count FROM roles`);
      if (parseInt(rolesCount.rows[0].count) === 0) {
        console.log('⚠️  Perfis não encontrados. Criando...');
        await executeSQLFile(path.join(__dirname, 'initRoles.sql'));
        console.log('✅ Perfis criados com sucesso');
      } else {
        console.log('✅ Perfis já existem');
      }
    }

    // FASE 6: Operacional
    console.log('🔍 Verificando tabelas da FASE 6 (operacional)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'tasks'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 6 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase6.sql'));
        console.log('✅ Tabelas da FASE 6 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 6 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 6:', error);
    }

    // FASE 7: Administrativo
    console.log('🔍 Verificando tabelas da FASE 7 (administrativo)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'documents'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 7 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase7.sql'));
        console.log('✅ Tabelas da FASE 7 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 7 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 7:', error);
    }

    // FASE 8: Financeiro
    console.log('🔍 Verificando tabelas da FASE 8 (financeiro)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'financial_exits'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 8 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTables.sql'));
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase8.sql'));
        console.log('✅ Tabelas da FASE 8 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 8 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 8:', error);
    }

    // FASE 9: Patrimônio
    console.log('🔍 Verificando tabelas da FASE 9 (patrimônio)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'assets'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 9 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase9.sql'));
        console.log('✅ Tabelas da FASE 9 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 9 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 9:', error);
    }

    // FASE 10: Automações
    console.log('🔍 Verificando tabelas da FASE 10 (automações)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'notifications'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 10 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase10.sql'));
        console.log('✅ Tabelas da FASE 10 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 10 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 10:', error);
    }

    // FASE 11: Configurações
    console.log('🔍 Verificando tabelas da FASE 11 (configurações)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'condominium_settings'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 11 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase11.sql'));
        console.log('✅ Tabelas da FASE 11 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 11 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 11:', error);
    }

    // FASE 12: Estoque
    console.log('🔍 Verificando tabelas da FASE 12 (estoque)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'inventory_items'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 12 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase12.sql'));
        console.log('✅ Tabelas da FASE 12 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 12 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 12:', error);
    }

    // FASE 13: Reabertura
    console.log('🔍 Verificando campos da FASE 13 (reabertura)...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'occurrences' AND column_name = 'reopened'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Campos da FASE 13 não encontrados. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase13.sql'));
        console.log('✅ Campos da FASE 13 criados com sucesso');
      } else {
        console.log('✅ Campos da FASE 13 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar campos da FASE 13:', error);
    }

    // FASE 14: Limpeza
    console.log('🔍 Verificando campos da FASE 14 (limpeza)...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'occurrences' AND column_name = 'limpeza_type'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Campos da FASE 14 não encontrados. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase14.sql'));
        console.log('✅ Campos da FASE 14 criados com sucesso');
      } else {
        console.log('✅ Campos da FASE 14 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar campos da FASE 14:', error);
    }

    // FASE 15: Triagem
    console.log('🔍 Verificando tabelas da FASE 15 (triagem)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'budget_requests'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 15 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase15.sql'));
        console.log('✅ Tabelas da FASE 15 criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 15 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 15:', error);
    }

    // FASE 16: Comprovantes Entrada
    console.log('🔍 Verificando campos da FASE 16 (comprovantes entrada)...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'financial_entries' AND column_name = 'receipt_pdf_path'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Campos da FASE 16 não encontrados. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase16.sql'));
        console.log('✅ Campos da FASE 16 criados com sucesso');
      } else {
        console.log('✅ Campos da FASE 16 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar campos da FASE 16:', error);
    }

    // FASE 17: Modelos de checklist e checklists diários (checklist_models, daily_checklists, etc.)
    console.log('🔍 Verificando tabelas da FASE 17 (checklist_models, checklists diários)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'checklist_models'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 17 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase17.sql'));
        console.log('✅ Tabelas da FASE 17 (checklist_models, etc.) criadas com sucesso');
      } else {
        console.log('✅ Tabelas da FASE 17 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 17:', error);
    }

    // Checklist Assignments: vínculo modelo → pessoas específicas (após FASE 17)
    try {
      const asgExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'checklist_model_assignments'
        )
      `);
      if (!asgExists.rows[0].exists) {
        console.log('🔍 Criando tabela checklist_model_assignments e ajustando unique em daily_checklists...');
        await executeSQLFile(path.join(__dirname, 'extendTablesChecklistAssignments.sql'));
        console.log('✅ Checklist assignments criados');
      }
    } catch (e) {
      console.warn('Aviso ao aplicar extendTablesChecklistAssignments:', e.message);
    }

    // Síndico acompanha checklists + questionar itens não feitos
    try {
      const colExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'daily_checklist_items' AND column_name = 'sindico_question'
        )
      `);
      if (!colExists.rows[0].exists) {
        console.log('🔍 Adicionando colunas sindico_question em daily_checklist_items...');
        await executeSQLFile(path.join(__dirname, 'extendTablesSindicoChecklist.sql'));
        console.log('✅ Sindico checklist OK');
      }
    } catch (e) {
      console.warn('Aviso ao aplicar extendTablesSindicoChecklist:', e.message);
    }

    // Síndico: exige resposta vs só comentário; resposta ao questionamento
    try {
      const respExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'daily_checklist_items' AND column_name = 'resposta_questionamento'
        )
      `);
      if (!respExists.rows[0].exists) {
        console.log('🔍 Adicionando colunas resposta_questionamento e sindico_exige_resposta...');
        await executeSQLFile(path.join(__dirname, 'extendTablesSindicoChecklistResposta.sql'));
        console.log('✅ Sindico checklist resposta OK');
      }
    } catch (e) {
      console.warn('Aviso ao aplicar extendTablesSindicoChecklistResposta:', e.message);
    }

    // SLA: sla_hours, sla_deadline em tasks e occurrences (criação de tarefas ADM, etc.)
    try {
      const slaExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'sla_hours'
        )
      `);
      if (!slaExists.rows[0].exists) {
        console.log('🔍 Adicionando colunas SLA (sla_hours, sla_deadline) em tasks e occurrences...');
        await executeSQLFile(path.join(__dirname, 'extendTablesSLA.sql'));
        console.log('✅ SLA OK');
      }
    } catch (e) {
      console.warn('Aviso ao aplicar extendTablesSLA:', e.message);
    }

    // FASE 18: Consumo Mensal
    console.log('🔍 Verificando tabelas da FASE 18 (consumo mensal)...');
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

    // FASE 19: Recorrência e Projeções
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

    // FASE 20: Permissões Formais e State Machines
    console.log('🔍 Verificando tabelas da FASE 20 (permissões formais e state machines)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'permissions'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 20 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase20.sql'));
        console.log('✅ Tabelas da FASE 20 criadas com sucesso');
        
        // Popula permissões
        console.log('📝 Populando permissões base...');
        await executeSQLFile(path.join(__dirname, 'initPermissions.sql'));
        console.log('✅ Permissões base criadas');
        
        // Popula state machines
        console.log('📝 Populando state machines...');
        await executeSQLFile(path.join(__dirname, 'initStateMachines.sql'));
        console.log('✅ State machines criadas');
        
        // Popula transições
        console.log('📝 Populando transições de estado...');
        await executeSQLFile(path.join(__dirname, 'initStateTransitions.sql'));
        console.log('✅ Transições criadas');
        
        // Atribui permissões aos perfis
        console.log('📝 Atribuindo permissões aos perfis...');
        await executeSQLFile(path.join(__dirname, 'initRolePermissions.sql'));
        console.log('✅ Permissões atribuídas aos perfis');
      } else {
        console.log('✅ Tabelas da FASE 20 já existem');
        
        // Sempre verifica e atualiza permissões aos papéis (pode ter novas permissões)
        try {
          console.log('📝 Verificando atribuições de permissões aos papéis...');
          await executeSQLFile(path.join(__dirname, 'initRolePermissions.sql'));
          console.log('✅ Permissões aos papéis verificadas/atualizadas');
        } catch (error) {
          console.error('⚠️  Erro ao atualizar permissões aos papéis (pode ser normal se já existirem):', error.message);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 20:', error);
    }

    // FASE 21: Validações e Constraints de Segurança
    console.log('🔍 Verificando constraints da FASE 21 (validações e segurança)...');
    try {
      const constraintExists = await query(`
        SELECT EXISTS (
          SELECT FROM pg_constraint 
          WHERE conname = 'check_financial_exits_condominium_not_null'
        )
      `);
      
      if (!constraintExists.rows[0].exists) {
        console.log('⚠️  Constraints da FASE 21 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase21.sql'));
        console.log('✅ Constraints da FASE 21 criadas com sucesso');
      } else {
        console.log('✅ Constraints da FASE 21 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar constraints da FASE 21:', error);
    }

    // FASE 21b: Logs Falhados
    console.log('🔍 Verificando tabela da FASE 21b (logs falhados)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'audit_logs_failed'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabela da FASE 21b não encontrada. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase21b.sql'));
        console.log('✅ Tabela da FASE 21b criada com sucesso');
      } else {
        console.log('✅ Tabela da FASE 21b já existe');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabela da FASE 21b:', error);
    }

    // FASE 22: Notificações, Manutenções e Fluxos Completos
    console.log('🔍 Verificando tabelas da FASE 22 (notificações, manutenções e fluxos)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'maintenances'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 22 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase22.sql'));
        console.log('✅ Tabelas da FASE 22 criadas com sucesso');
      } else {
        // Tabela já existe: não re-executar o script pesado (evita ~1.5s por startup).
        // Colunas faltantes são cobertas pelos scripts fixPhase22*.sql abaixo.
        console.log('✅ Tabelas da FASE 22 já existem (atualizações via scripts de correção)');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 22:', error);
    }

    // FASE 22b: Estados adicionais para State Machines
    console.log('🔍 Verificando estados da FASE 22b (state machines)...');
    try {
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase22b.sql'));
      console.log('✅ Estados da FASE 22b atualizados');
    } catch (error) {
      console.error('Erro ao atualizar estados da FASE 22b:', error);
    }

    // Correção: Garantir que tabelas da FASE 22 foram criadas
    console.log('🔍 Verificando tabelas da FASE 22 (correção)...');
    try {
      await executeSQLFile(path.join(__dirname, 'fixPhase22Tables.sql'));
      console.log('✅ Tabelas da FASE 22 verificadas/criadas');
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 22:', error);
    }

    // Correção: Garantir que colunas da FASE 22 foram criadas
    console.log('🔍 Verificando colunas da FASE 22 (correção)...');
    try {
      await executeSQLFile(path.join(__dirname, 'fixPhase22Columns.sql'));
      console.log('✅ Colunas da FASE 22 verificadas/corrigidas');
    } catch (error) {
      console.error('Erro ao verificar/corrigir colunas da FASE 22:', error);
    }

    // Correção: Garantir que colunas de budget_requests da FASE 22 foram criadas
    console.log('🔍 Verificando colunas de budget_requests da FASE 22 (correção)...');
    try {
      await executeSQLFile(path.join(__dirname, 'fixPhase22BudgetColumns.sql'));
      console.log('✅ Colunas de budget_requests da FASE 22 verificadas/corrigidas');
    } catch (error) {
      console.error('Erro ao verificar/corrigir colunas de budget_requests da FASE 22:', error);
    }

    // Correção: Garantir que colunas de occurrences da FASE 22 foram criadas
    console.log('🔍 Verificando colunas de occurrences da FASE 22 (correção)...');
    try {
      await executeSQLFile(path.join(__dirname, 'fixPhase22OccurrencesColumns.sql'));
      console.log('✅ Colunas de occurrences da FASE 22 verificadas/corrigidas');
    } catch (error) {
      console.error('Erro ao verificar/corrigir colunas de occurrences da FASE 22:', error);
    }

    // Correção: Garantir que colunas de resolução de occurrences foram criadas
    console.log('🔍 Verificando colunas de resolução de occurrences (correção)...');
    try {
      await executeSQLFile(path.join(__dirname, 'fixOccurrencesResolutionColumns.sql'));
      console.log('✅ Colunas de resolução de occurrences verificadas/corrigidas');
    } catch (error) {
      console.error('Erro ao verificar/corrigir colunas de resolução de occurrences:', error);
    }

    // FASE 23: Fechamento Mensal, Inadimplência, Assembleias, Fundo de Reserva
    console.log('🔍 Verificando tabelas da FASE 23 (fechamento mensal, inadimplência, assembleias, fundo de reserva)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'monthly_closures'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 23 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase23.sql'));
        console.log('✅ Tabelas da FASE 23 criadas com sucesso');
      } else {
        // Verifica se campos novos foram adicionados (executa mesmo se tabela existe)
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase23.sql'));
        console.log('✅ Tabelas da FASE 23 atualizadas');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 23:', error);
    }

    // FASE 24: Anexos Específicos
    console.log('🔍 Verificando campos da FASE 24 (anexos específicos)...');
    try {
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase24.sql'));
      console.log('✅ Campos da FASE 24 atualizados');
    } catch (error) {
      console.error('Erro ao verificar/criar campos da FASE 24:', error);
    }

    // FASE 25: Contratos e Relatórios Avançados
    console.log('🔍 Verificando tabelas da FASE 25 (contratos e relatórios avançados)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'contracts'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 25 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase25.sql'));
        console.log('✅ Tabelas da FASE 25 criadas com sucesso');
      } else {
        // Executa mesmo se existir para adicionar novos campos
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase25.sql'));
        console.log('✅ Tabelas da FASE 25 atualizadas');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 25:', error);
    }

    // FASE 26: KPIs e Relatórios Avançados
    console.log('🔍 Verificando tabelas da FASE 26 (KPIs e relatórios avançados)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'kpi_metrics'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 26 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase26.sql'));
        console.log('✅ Tabelas da FASE 26 criadas com sucesso');
      } else {
        // Executa mesmo se existir para adicionar novos campos
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase26.sql'));
        console.log('✅ Tabelas da FASE 26 atualizadas');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 26:', error);
    }

    // FASE 27: Melhorias de Documentos
    console.log('🔍 Verificando tabelas da FASE 27 (melhorias de documentos)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'document_versions'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 27 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase27.sql'));
        console.log('✅ Tabelas da FASE 27 criadas com sucesso');
      } else {
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase27.sql'));
        console.log('✅ Tabelas da FASE 27 atualizadas');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 27:', error);
    }

    // FASE 28: Imagens de Ocorrências
    console.log('🔍 Verificando tabelas da FASE 28 (imagens de ocorrências)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'occurrence_images'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 28 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase28.sql'));
        console.log('✅ Tabelas da FASE 28 criadas com sucesso');
      } else {
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase28.sql'));
        console.log('✅ Tabelas da FASE 28 atualizadas');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 28:', error);
    }

    // FASE 29: Múltiplos Orçamentos por Solicitação
    console.log('🔍 Verificando tabelas da FASE 29 (múltiplos orçamentos)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'budget_quotes'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas da FASE 29 não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase29.sql'));
        console.log('✅ Tabelas da FASE 29 criadas com sucesso');
      } else {
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase29.sql'));
        console.log('✅ Tabelas da FASE 29 atualizadas');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas da FASE 29:', error);
    }

    // FASE 30: Vinculação Taxas com Entradas Financeiras
    console.log('🔍 Verificando campos da FASE 30 (vinculação taxas com entradas financeiras)...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'monthly_fees' AND column_name = 'financial_entry_id'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Campos da FASE 30 não encontrados. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase30.sql'));
        console.log('✅ Campos da FASE 30 criados com sucesso');
      } else {
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase30.sql'));
        console.log('✅ Campos da FASE 30 atualizados');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar campos da FASE 30:', error);
    }

    // FASE 31: Fundo de Reserva no Fechamento Mensal
    console.log('🔍 Verificando coluna reserve_fund_amount na FASE 31...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'monthly_closures' AND column_name = 'reserve_fund_amount'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Coluna reserve_fund_amount não encontrada. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase31.sql'));
        console.log('✅ Coluna reserve_fund_amount criada com sucesso');
      } else {
        console.log('✅ Coluna reserve_fund_amount já existe');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar coluna da FASE 31:', error);
    }

    // Multi-Aprovação: Tabelas para múltiplas aprovações necessárias
    console.log('🔍 Verificando tabelas de multi-aprovação...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'multi_approvals'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabelas de multi-aprovação não encontradas. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesMultiApproval.sql'));
        console.log('✅ Tabelas de multi-aprovação criadas com sucesso');
      } else {
        console.log('✅ Tabelas de multi-aprovação já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabelas de multi-aprovação:', error);
    }

    // Dashboard Config: Configuração personalizada do dashboard por usuário
    console.log('🔍 Verificando tabela de configuração do dashboard...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'dashboard_config'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabela de dashboard config não encontrada. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesDashboardConfig.sql'));
        console.log('✅ Tabela de dashboard config criada com sucesso');
      } else {
        console.log('✅ Tabela de dashboard config já existe');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabela de dashboard config:', error);
    }

    // Correção: Coluna related_occurrence_id em tasks
    console.log('🔍 Verificando coluna related_occurrence_id em tasks...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'tasks' AND column_name = 'related_occurrence_id'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Coluna related_occurrence_id não encontrada em tasks. Criando...');
        await executeSQLFile(path.join(__dirname, 'fixTasksRelatedOccurrence.sql'));
        console.log('✅ Coluna related_occurrence_id criada com sucesso');
      } else {
        console.log('✅ Coluna related_occurrence_id já existe em tasks');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar coluna related_occurrence_id em tasks:', error);
    }

    // FASE 32: Observações do Síndico
    console.log('🔍 Verificando tabela da FASE 32 (observações do síndico)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'sindico_observations'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabela sindico_observations não encontrada. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase32.sql'));
        console.log('✅ Tabela sindico_observations criada com sucesso');
      } else {
        console.log('✅ Tabela sindico_observations já existe');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar tabela da FASE 32:', error);
    }

    // FASE 33: Campos de Conclusão de Tarefas
    console.log('🔍 Verificando colunas de conclusão da FASE 33 (campos de conclusão de tarefas)...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'tasks' AND column_name = 'completion_success'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Colunas de conclusão não encontradas em tasks. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase33.sql'));
        console.log('✅ Colunas de conclusão criadas com sucesso');
      } else {
        console.log('✅ Colunas de conclusão já existem em tasks');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar colunas da FASE 33:', error);
    }

    // FASE 34: Comprovante de pagamento em financial_exits (marcar saída como paga)
    console.log('🔍 Verificando colunas da FASE 34 (comprovante de pagamento em saídas)...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'financial_exits' AND column_name = 'payment_receipt_pdf_path'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Colunas de comprovante de pagamento não encontradas em financial_exits. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase34.sql'));
        console.log('✅ Colunas de comprovante de pagamento criadas com sucesso');
      } else {
        console.log('✅ Colunas de comprovante de pagamento já existem em financial_exits');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar colunas da FASE 34:', error);
    }

    // FASE 35: Contas a pagar - bills (due_day, account_kind, recurrence, receipt_pdf_path) + payable_items
    console.log('🔍 Verificando tabela/colunas da FASE 35 (contas a pagar)...');
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'payable_items'
        )
      `);
      if (!tableExists.rows[0].exists) {
        console.log('⚠️  Tabela payable_items não encontrada. Criando FASE 35...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase35.sql'));
        console.log('✅ FASE 35 (contas a pagar) criada com sucesso');
      } else {
        console.log('✅ FASE 35 já aplicada (payable_items existe)');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar FASE 35:', error);
    }

    // FASE 36: Anexo do boleto em payable_items (boleto_pdf_path)
    console.log('🔍 Verificando coluna boleto_pdf_path (FASE 36)...');
    try {
      const colExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'payable_items' AND column_name = 'boleto_pdf_path'
        )
      `);
      if (!colExists.rows[0].exists) {
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase36.sql'));
        console.log('✅ FASE 36 aplicada (boleto_pdf_path)');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar FASE 36:', error);
    }

    // FASE 37: Controle de notificação de contas vencidas (overdue_notified_at)
    console.log('🔍 Verificando coluna overdue_notified_at (FASE 37)...');
    try {
      const colExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'payable_items' AND column_name = 'overdue_notified_at'
        )
      `);
      if (!colExists.rows[0].exists) {
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase37.sql'));
        console.log('✅ FASE 37 aplicada (overdue_notified_at)');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar FASE 37:', error);
    }

    // FASE 38: Flags fundo de reserva (reserve_fund_credited / reserve_fund_debited)
    console.log('🔍 Verificando colunas da FASE 38 (fundo de reserva como conta)...');
    try {
      await executeSQLFile(path.join(__dirname, 'extendTablesPhase38.sql'));
      console.log('✅ FASE 38 aplicada (reserve_fund_credited / reserve_fund_debited)');
    } catch (error) {
      console.error('Erro ao verificar/criar FASE 38:', error);
    }

    // Criação do usuário master inicial (se não existir)
    console.log('🔍 Verificando usuário SUPER_MASTER inicial...');
    try {
      await createInitialMasterUser();
    } catch (error) {
      console.error('Erro ao verificar/criar usuário master inicial:', error);
      // Não interrompe a inicialização se falhar
    }

    console.log('✅ Inicialização do banco de dados concluída!');
  } catch (error) {
    console.error('❌ Erro crítico na inicialização do banco de dados:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };

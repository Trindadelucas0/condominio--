// Script de inicialização do banco de dados
// Executa automaticamente todas as tabelas e dados iniciais
// É chamado ao iniciar o servidor

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

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

    // FASE 17: Comprovantes Saída
    console.log('🔍 Verificando campos da FASE 17 (comprovantes saída)...');
    try {
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'financial_exits' AND column_name = 'payment_receipt_pdf_path'
        )
      `);
      
      if (!columnExists.rows[0].exists) {
        console.log('⚠️  Campos da FASE 17 não encontrados. Criando...');
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase17.sql'));
        console.log('✅ Campos da FASE 17 criados com sucesso');
      } else {
        console.log('✅ Campos da FASE 17 já existem');
      }
    } catch (error) {
      console.error('Erro ao verificar/criar campos da FASE 17:', error);
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
        // Verifica se campos novos foram adicionados (executa mesmo se tabela existe)
        await executeSQLFile(path.join(__dirname, 'extendTablesPhase22.sql'));
        console.log('✅ Tabelas da FASE 22 atualizadas');
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

    console.log('✅ Inicialização do banco de dados concluída!');
  } catch (error) {
    console.error('❌ Erro crítico na inicialização do banco de dados:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };

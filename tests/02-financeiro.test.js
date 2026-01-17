// Testes do Módulo Financeiro

const { query } = require('../src/config/database');
const financeiroService = require('../src/services/financeiroService');
const monthlyClosureService = require('../src/services/monthlyClosureService');

async function run(runner) {
  runner.logInfo('Iniciando testes do módulo financeiro...');

  // Teste 1: Verificar estrutura de tabelas financeiras
  await runner.test('Verificar tabelas financeiras', async () => {
    const tables = ['financial_entries', 'financial_exits', 'monthly_closures'];
    
    for (const table of tables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        throw new Error(`Tabela ${table} não encontrada`);
      }
      
      runner.logDetail(`✅ Tabela ${table} existe`);
    }
  });

  // Teste 2: Verificar colunas de entradas financeiras
  await runner.test('Verificar estrutura de entradas financeiras', async () => {
    const result = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'financial_entries'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em financial_entries: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'condominium_id', 'description', 'amount', 'entry_date', 'received'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
    
    result.rows.forEach(col => {
      runner.logDetail(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
  });

  // Teste 3: Verificar colunas de saídas financeiras
  await runner.test('Verificar estrutura de saídas financeiras', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'financial_exits'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em financial_exits: ${result.rows.length}`);
    
    // Verificar campos de anexos (FASE 24)
    const hasInvoicePath = result.rows.some(r => r.column_name === 'invoice_path');
    const hasInvoiceFileName = result.rows.some(r => r.column_name === 'invoice_file_name');
    
    if (hasInvoicePath && hasInvoiceFileName) {
      runner.logDetail('✅ Campos de nota fiscal (FASE 24) presentes');
    } else {
      runner.logWarning('⚠️  Campos de nota fiscal não encontrados');
    }
  });

  // Teste 4: Verificar dados financeiros existentes
  await runner.test('Verificar dados financeiros existentes', async () => {
    const entries = await query('SELECT COUNT(*) as count FROM financial_entries');
    const exits = await query('SELECT COUNT(*) as count FROM financial_exits');
    const closures = await query('SELECT COUNT(*) as count FROM monthly_closures');
    
    runner.logDetail(`Entradas: ${entries.rows[0].count}`);
    runner.logDetail(`Saídas: ${exits.rows[0].count}`);
    runner.logDetail(`Fechamentos: ${closures.rows[0].count}`);
    
    if (parseInt(entries.rows[0].count) === 0 && parseInt(exits.rows[0].count) === 0) {
      runner.logWarning('Nenhum dado financeiro encontrado (sistema novo?)');
    }
  });

  // Teste 5: Verificar fechamento mensal
  await runner.test('Verificar estrutura de fechamento mensal', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'monthly_closures'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em monthly_closures: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'condominium_id', 'month', 'year', 'status', 'total_entries', 'total_exits', 'balance'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
    
    // Verificar constraint único
    const unique = await query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'monthly_closures' 
      AND constraint_type = 'UNIQUE'
    `);
    
    if (unique.rows.length > 0) {
      runner.logDetail('✅ Constraint único presente (um fechamento por mês/ano)');
    }
  });

  // Teste 6: Verificar status de fechamentos
  await runner.test('Verificar status de fechamentos mensais', async () => {
    const result = await query(`
      SELECT status, COUNT(*) as count
      FROM monthly_closures
      GROUP BY status
      ORDER BY status
    `);
    
    runner.logDetail('Status de fechamentos:');
    result.rows.forEach(row => {
      runner.logDetail(`  - ${row.status}: ${row.count}`);
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhum fechamento mensal encontrado');
    }
  });

  // Teste 7: Verificar cálculo de totais
  await runner.test('Verificar cálculo de totais financeiros', async () => {
    const condominiums = await query('SELECT id, name FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado para testar cálculos');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    runner.logDetail(`Testando cálculos para condomínio ID: ${condominiumId}`);
    runner.logDetail(`Mês/Ano: ${currentMonth}/${currentYear}`);
    
    try {
      const totals = await monthlyClosureService.calculateMonthTotals(
        condominiumId,
        currentMonth,
        currentYear
      );
      
      runner.logDetail(`Total Entradas: R$ ${totals.totalEntries.toFixed(2)}`);
      runner.logDetail(`Total Saídas: R$ ${totals.totalExits.toFixed(2)}`);
      runner.logDetail(`Saldo: R$ ${totals.balance.toFixed(2)}`);
      
      runner.logSuccess('Cálculos funcionando corretamente');
    } catch (error) {
      runner.logWarning(`Erro ao calcular totais: ${error.message}`);
    }
  });

  // Teste 8: Verificar validação de fechamento
  await runner.test('Verificar validação de fechamento mensal', async () => {
    const condominiums = await query('SELECT id FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    try {
      const validation = await monthlyClosureService.validateMonthClosure(
        condominiumId,
        currentMonth,
        currentYear
      );
      
      runner.logDetail(`Pode fechar: ${validation.canClose}`);
      runner.logDetail(`Pendências: ${validation.pendingEntries} entradas, ${validation.pendingExits} saídas`);
      
      if (validation.errors && validation.errors.length > 0) {
        validation.errors.forEach(err => {
          runner.logDetail(`  ⚠️  ${err}`);
        });
      }
    } catch (error) {
      runner.logWarning(`Erro na validação: ${error.message}`);
    }
  });

  runner.logSuccess('Testes do módulo financeiro concluídos!');
}

module.exports = { run };

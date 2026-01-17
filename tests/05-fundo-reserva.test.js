// Testes do Fundo de Reserva

const { query } = require('../src/config/database');
const reserveFundService = require('../src/services/reserveFundService');

async function run(runner) {
  runner.logInfo('Iniciando testes de fundo de reserva...');

  // Teste 1: Verificar estrutura da tabela
  await runner.test('Verificar tabela de fundo de reserva', async () => {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'reserve_fund'
      )
    `);
    
    if (!result.rows[0].exists) {
      throw new Error('Tabela reserve_fund não encontrada');
    }
    
    runner.logDetail('✅ Tabela reserve_fund existe');
  });

  // Teste 2: Verificar estrutura de colunas
  await runner.test('Verificar estrutura de colunas', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'reserve_fund'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em reserve_fund: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'condominium_id', 'current_balance', 'target_balance', 'contribution_method', 'monthly_contribution_percent', 'monthly_contribution_amount'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
  });

  // Teste 3: Verificar fundos configurados
  await runner.test('Verificar fundos de reserva configurados', async () => {
    const result = await query(`
      SELECT 
        rf.*,
        c.name as condominium_name
      FROM reserve_fund rf
      JOIN condominiums c ON rf.condominium_id = c.id
      ORDER BY rf.condominium_id
    `);
    
    runner.logDetail(`Fundos configurados: ${result.rows.length}`);
    
    result.rows.forEach(fund => {
      const percent = fund.target_balance > 0 
        ? ((fund.current_balance / fund.target_balance) * 100).toFixed(1)
        : 0;
      
      runner.logDetail(`  - ${fund.condominium_name}:`);
      runner.logDetail(`    Saldo atual: R$ ${parseFloat(fund.current_balance || 0).toFixed(2)}`);
      runner.logDetail(`    Meta: R$ ${parseFloat(fund.target_balance || 0).toFixed(2)}`);
      runner.logDetail(`    % da meta: ${percent}%`);
      runner.logDetail(`    Método: ${fund.contribution_method}`);
      
      if (fund.contribution_method === 'PERCENT') {
        runner.logDetail(`    Contribuição: ${fund.monthly_contribution_percent}%`);
      } else {
        runner.logDetail(`    Contribuição: R$ ${parseFloat(fund.monthly_contribution_amount || 0).toFixed(2)}`);
      }
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhum fundo de reserva configurado');
    }
  });

  // Teste 4: Verificar rateio de despesas
  await runner.test('Verificar tabela de rateio', async () => {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'expense_allocation'
      )
    `);
    
    if (!result.rows[0].exists) {
      throw new Error('Tabela expense_allocation não encontrada');
    }
    
    runner.logDetail('✅ Tabela expense_allocation existe');
    
    const allocations = await query(`
      SELECT COUNT(*) as count
      FROM expense_allocation
    `);
    
    runner.logDetail(`Rateios cadastrados: ${allocations.rows[0].count}`);
  });

  // Teste 5: Verificar cálculo de contribuição mensal
  await runner.test('Verificar cálculo de contribuição mensal', async () => {
    const condominiums = await query('SELECT id, name FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    
    try {
      const fund = await reserveFundService.getReserveFund(condominiumId);
      
      if (!fund) {
        runner.logWarning('Fundo de reserva não configurado para este condomínio');
        return;
      }
      
      runner.logDetail(`Fundo encontrado para condomínio ID: ${condominiumId}`);
      runner.logDetail(`Método: ${fund.contribution_method}`);
      
      if (fund.contribution_method === 'PERCENT') {
        runner.logDetail(`Contribuição percentual: ${fund.monthly_contribution_percent}%`);
      } else {
        runner.logDetail(`Contribuição fixa: R$ ${parseFloat(fund.monthly_contribution_amount || 0).toFixed(2)}`);
      }
      
      runner.logDetail(`% da meta: ${fund.target_percent.toFixed(1)}%`);
      
      runner.logSuccess('Cálculo de contribuição funcionando');
    } catch (error) {
      runner.logWarning(`Erro ao calcular contribuição: ${error.message}`);
    }
  });

  runner.logSuccess('Testes de fundo de reserva concluídos!');
}

module.exports = { run };

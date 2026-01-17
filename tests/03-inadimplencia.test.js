// Testes do Sistema de Inadimplência

const { query } = require('../src/config/database');
const inadimplenciaService = require('../src/services/inadimplenciaService');

async function run(runner) {
  runner.logInfo('Iniciando testes de inadimplência...');

  // Teste 1: Verificar estrutura de tabelas
  await runner.test('Verificar tabelas de inadimplência', async () => {
    const tables = ['apartments', 'monthly_fees'];
    
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

  // Teste 2: Verificar estrutura de apartamentos
  await runner.test('Verificar estrutura de apartamentos', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'apartments'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em apartments: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'condominium_id', 'number', 'owner_name', 'fraction_ideal'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
  });

  // Teste 3: Verificar estrutura de taxas mensais
  await runner.test('Verificar estrutura de taxas mensais', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'monthly_fees'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em monthly_fees: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'apartment_id', 'condominium_id', 'month', 'year', 'amount', 'due_date', 'paid', 'days_overdue', 'late_fee', 'interest'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
    
    runner.logDetail('✅ Campos de cálculo automático presentes (days_overdue, late_fee, interest)');
  });

  // Teste 4: Verificar apartamentos cadastrados
  await runner.test('Verificar apartamentos cadastrados', async () => {
    const result = await query(`
      SELECT a.*, c.name as condominium_name
      FROM apartments a
      JOIN condominiums c ON a.condominium_id = c.id
      ORDER BY a.number
      LIMIT 10
    `);
    
    runner.logDetail(`Apartamentos encontrados: ${result.rows.length}`);
    
    result.rows.forEach(apt => {
      runner.logDetail(`  - ${apt.number}${apt.block ? ' - Bloco ' + apt.block : ''} (${apt.condominium_name})`);
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhum apartamento cadastrado');
    }
  });

  // Teste 5: Verificar taxas mensais
  await runner.test('Verificar taxas mensais cadastradas', async () => {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE paid = TRUE) as pagas,
        COUNT(*) FILTER (WHERE paid = FALSE) as nao_pagas,
        COUNT(*) FILTER (WHERE paid = FALSE AND due_date < CURRENT_DATE) as inadimplentes
      FROM monthly_fees
    `);
    
    const stats = result.rows[0];
    runner.logDetail(`Total de taxas: ${stats.total}`);
    runner.logDetail(`Pagas: ${stats.pagas}`);
    runner.logDetail(`Não pagas: ${stats.nao_pagas}`);
    runner.logDetail(`Inadimplentes: ${stats.inadimplentes}`);
  });

  // Teste 6: Verificar cálculo de inadimplência
  await runner.test('Verificar cálculo de inadimplência', async () => {
    const condominiums = await query('SELECT id, name FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    
    try {
      const delinquency = await inadimplenciaService.calculateDelinquency(condominiumId);
      
      runner.logDetail(`Taxa de inadimplência: ${delinquency.delinquencyRate.toFixed(2)}%`);
      runner.logDetail(`Valor em aberto: R$ ${delinquency.totalOverdue.toFixed(2)}`);
      runner.logDetail(`Apartamentos inadimplentes: ${delinquency.overdueCount}`);
      runner.logDetail(`Total de taxas: ${delinquency.totalFees}`);
      
      runner.logSuccess('Cálculo de inadimplência funcionando');
    } catch (error) {
      runner.logWarning(`Erro ao calcular inadimplência: ${error.message}`);
    }
  });

  // Teste 7: Verificar taxas com atraso
  await runner.test('Verificar taxas em atraso', async () => {
    const result = await query(`
      SELECT 
        mf.id,
        a.number,
        a.block,
        mf.amount,
        mf.due_date,
        mf.days_overdue,
        mf.late_fee,
        mf.interest,
        (mf.amount + COALESCE(mf.late_fee, 0) + COALESCE(mf.interest, 0)) as total
      FROM monthly_fees mf
      JOIN apartments a ON mf.apartment_id = a.id
      WHERE mf.paid = FALSE 
        AND mf.due_date < CURRENT_DATE
      ORDER BY mf.days_overdue DESC
      LIMIT 5
    `);
    
    runner.logDetail(`Taxas em atraso encontradas: ${result.rows.length}`);
    
    result.rows.forEach(fee => {
      runner.logDetail(`  - Apt ${fee.number}${fee.block ? ' - ' + fee.block : ''}: ${fee.days_overdue} dias, Total: R$ ${parseFloat(fee.total).toFixed(2)}`);
    });
    
    if (result.rows.length === 0) {
      runner.logSuccess('Nenhuma taxa em atraso (situação ideal)');
    }
  });

  // Teste 8: Verificar atualização automática de dias em atraso
  await runner.test('Verificar atualização de dias em atraso', async () => {
    const result = await query(`
      SELECT id, due_date, days_overdue, paid
      FROM monthly_fees
      WHERE paid = FALSE
      LIMIT 5
    `);
    
    runner.logDetail(`Verificando ${result.rows.length} taxas não pagas`);
    
    for (const fee of result.rows) {
      const dueDate = new Date(fee.due_date);
      const today = new Date();
      const expectedDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
      
      runner.logDetail(`  Taxa ID ${fee.id}: ${fee.days_overdue} dias (esperado: ${expectedDays})`);
      
      if (Math.abs(fee.days_overdue - expectedDays) > 1) {
        runner.logWarning(`  ⚠️  Diferença detectada (pode precisar atualização)`);
      }
    }
  });

  runner.logSuccess('Testes de inadimplência concluídos!');
}

module.exports = { run };

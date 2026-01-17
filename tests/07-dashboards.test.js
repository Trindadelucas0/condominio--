// Testes de Dashboards

const { query } = require('../src/config/database');
const sindicoService = require('../src/services/sindicoService');
const inadimplenciaService = require('../src/services/inadimplenciaService');

async function run(runner) {
  runner.logInfo('Iniciando testes de dashboards...');

  // Teste 1: Verificar dados do dashboard do síndico
  await runner.test('Verificar dashboard do síndico', async () => {
    const condominiums = await query('SELECT id, name FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    
    try {
      const stats = await sindicoService.getDashboardStats(condominiumId);
      
      runner.logDetail('Estatísticas do Dashboard:');
      runner.logDetail(`  Inadimplência: ${stats.delinquencyRate?.toFixed(2) || 0}%`);
      runner.logDetail(`  Valor em aberto: R$ ${stats.totalOverdue?.toFixed(2) || 0}`);
      runner.logDetail(`  Apartamentos inadimplentes: ${stats.overdueCount || 0}`);
      runner.logDetail(`  Gastos do mês: R$ ${stats.currentMonthExpenses?.toFixed(2) || 0}`);
      runner.logDetail(`  Variação: ${stats.expensesVariation?.toFixed(2) || 0}%`);
      
      runner.logSuccess('Dashboard do síndico funcionando');
    } catch (error) {
      runner.logWarning(`Erro ao carregar dashboard: ${error.message}`);
    }
  });

  // Teste 2: Verificar cálculo de inadimplência no dashboard
  await runner.test('Verificar cálculo de inadimplência', async () => {
    const condominiums = await query('SELECT id FROM condominiums LIMIT 1');
    
    if (condominiums.rows.length === 0) {
      runner.logWarning('Nenhum condomínio encontrado');
      return;
    }
    
    const condominiumId = condominiums.rows[0].id;
    
    try {
      const delinquency = await inadimplenciaService.calculateDelinquency(condominiumId);
      
      runner.logDetail('Cálculo de inadimplência:');
      runner.logDetail(`  Taxa: ${delinquency.delinquencyRate.toFixed(2)}%`);
      runner.logDetail(`  Valor: R$ ${delinquency.totalOverdue.toFixed(2)}`);
      runner.logDetail(`  Apartamentos: ${delinquency.overdueCount}`);
      runner.logDetail(`  Total de taxas: ${delinquency.totalFees}`);
      
      runner.logSuccess('Cálculo de inadimplência funcionando');
    } catch (error) {
      runner.logWarning(`Erro ao calcular inadimplência: ${error.message}`);
    }
  });

  // Teste 3: Verificar gastos do mês
  await runner.test('Verificar gastos do mês', async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const result = await query(`
      SELECT 
        condominium_id,
        SUM(amount) as total_gastos,
        COUNT(*) as quantidade
      FROM financial_exits
      WHERE EXTRACT(MONTH FROM exit_date) = $1
        AND EXTRACT(YEAR FROM exit_date) = $2
        AND payment_status = 'PAID'
      GROUP BY condominium_id
    `, [currentMonth, currentYear]);
    
    runner.logDetail(`Gastos do mês ${currentMonth}/${currentYear}:`);
    result.rows.forEach(row => {
      runner.logDetail(`  Condomínio ${row.condominium_id}: R$ ${parseFloat(row.total_gastos || 0).toFixed(2)} (${row.quantidade} saídas)`);
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhum gasto encontrado para o mês atual');
    }
  });

  // Teste 4: Verificar saldo atual
  await runner.test('Verificar saldo atual', async () => {
    const result = await query(`
      SELECT 
        c.id,
        c.name,
        COALESCE(SUM(CASE WHEN fe.received = TRUE THEN fe.amount ELSE 0 END), 0) as entradas,
        COALESCE(SUM(CASE WHEN fx.payment_status = 'PAID' THEN fx.amount ELSE 0 END), 0) as saidas,
        COALESCE(SUM(CASE WHEN fe.received = TRUE THEN fe.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN fx.payment_status = 'PAID' THEN fx.amount ELSE 0 END), 0) as saldo
      FROM condominiums c
      LEFT JOIN financial_entries fe ON c.id = fe.condominium_id
      LEFT JOIN financial_exits fx ON c.id = fx.condominium_id
      GROUP BY c.id, c.name
      LIMIT 5
    `);
    
    runner.logDetail('Saldo atual por condomínio:');
    result.rows.forEach(row => {
      runner.logDetail(`  ${row.name}:`);
      runner.logDetail(`    Entradas: R$ ${parseFloat(row.entradas).toFixed(2)}`);
      runner.logDetail(`    Saídas: R$ ${parseFloat(row.saidas).toFixed(2)}`);
      runner.logDetail(`    Saldo: R$ ${parseFloat(row.saldo).toFixed(2)}`);
    });
  });

  // Teste 5: Verificar alertas críticos
  await runner.test('Verificar alertas críticos', async () => {
    const result = await query(`
      SELECT 
        notification_type,
        COUNT(*) as count
      FROM notifications
      WHERE read = FALSE OR read_at IS NULL
      GROUP BY notification_type
      ORDER BY notification_type
    `);
    
    runner.logDetail('Notificações por tipo:');
    result.rows.forEach(row => {
      runner.logDetail(`  - ${row.notification_type}: ${row.count}`);
    });
    
    // Verificar também na tabela alerts (se existir)
    const alertsResult = await query(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM alerts
      WHERE resolved = FALSE
      GROUP BY severity
      ORDER BY 
        CASE severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'WARNING' THEN 2
          WHEN 'INFO' THEN 3
        END
    `).catch(() => ({ rows: [] }));
    
    if (alertsResult.rows.length > 0) {
      runner.logDetail('Alertas por severidade:');
      alertsResult.rows.forEach(row => {
        const emoji = row.severity === 'CRITICAL' ? '🔴' : row.severity === 'WARNING' ? '🟡' : '🔵';
        runner.logDetail(`  ${emoji} ${row.severity}: ${row.count}`);
      });
    }
    
    if (result.rows.length === 0 && alertsResult.rows.length === 0) {
      runner.logSuccess('Nenhum alerta pendente');
    }
  });

  runner.logSuccess('Testes de dashboards concluídos!');
}

module.exports = { run };

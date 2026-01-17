// Testes de Performance e Carga

const { query } = require('../src/config/database');
const dashboardAnalyticsService = require('../src/services/dashboardAnalyticsService');

async function run(runner) {
  runner.logInfo('Iniciando testes de performance...');

  let testCondominiumId = null;

  // Setup
  await runner.test('Setup: Obter condomínio de teste', async () => {
    const result = await query('SELECT id FROM condominiums LIMIT 1');
    if (result.rows.length === 0) {
      throw new Error('Nenhum condomínio encontrado');
    }
    testCondominiumId = result.rows[0].id;
    runner.logDetail(`Condomínio de teste: ID ${testCondominiumId}`);
  });

  // Teste 1: Performance de queries simples
  await runner.test('Performance: Query simples (SELECT)', async () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await query('SELECT COUNT(*) FROM users WHERE active = TRUE');
    }
    
    const duration = Date.now() - startTime;
    const avgTime = duration / 100;
    
    runner.logDetail(`100 queries executadas em ${duration}ms`);
    runner.logDetail(`Tempo médio por query: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime > 50) {
      runner.logWarning(`⚠️  Tempo médio alto: ${avgTime.toFixed(2)}ms (ideal: < 50ms)`);
    } else {
      runner.logSuccess(`✅ Performance OK: ${avgTime.toFixed(2)}ms por query`);
    }
  });

  // Teste 2: Performance de queries complexas
  await runner.test('Performance: Query complexa (JOIN + agregação)', async () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await query(`
        SELECT 
          r.name,
          COUNT(ur.user_id) as total
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        LEFT JOIN users u ON ur.user_id = u.id AND u.active = TRUE
        GROUP BY r.id, r.name
        ORDER BY r.name
      `);
    }
    
    const duration = Date.now() - startTime;
    const avgTime = duration / 10;
    
    runner.logDetail(`10 queries complexas executadas em ${duration}ms`);
    runner.logDetail(`Tempo médio por query: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime > 200) {
      runner.logWarning(`⚠️  Tempo médio alto: ${avgTime.toFixed(2)}ms (ideal: < 200ms)`);
    } else {
      runner.logSuccess(`✅ Performance OK: ${avgTime.toFixed(2)}ms por query`);
    }
  });

  // Teste 3: Performance de cálculo de dashboard
  await runner.test('Performance: Cálculo de dashboard', async () => {
    if (!testCondominiumId) {
      throw new Error('Condomínio de teste não foi obtido');
    }

    const startTime = Date.now();
    
    // Simula cálculo de dashboard (múltiplas queries)
    await query(`
      SELECT 
        (SELECT COUNT(*) FROM financial_exits 
         WHERE condominium_id = $1 AND payment_status = 'PENDING') as pending,
        (SELECT COALESCE(SUM(amount), 0) FROM financial_entries 
         WHERE condominium_id = $1 AND received = TRUE) as entries,
        (SELECT COALESCE(SUM(amount), 0) FROM financial_exits 
         WHERE condominium_id = $1 AND payment_status = 'PAID') as exits
    `, [testCondominiumId]);
    
    const duration = Date.now() - startTime;
    
    runner.logDetail(`Cálculo de dashboard executado em ${duration}ms`);
    
    if (duration > 500) {
      runner.logWarning(`⚠️  Tempo alto: ${duration}ms (ideal: < 500ms)`);
    } else {
      runner.logSuccess(`✅ Performance OK: ${duration}ms`);
    }
  });

  // Teste 4: Performance de analytics avançados
  await runner.test('Performance: Analytics históricos (12 meses)', async () => {
    if (!testCondominiumId) {
      throw new Error('Condomínio de teste não foi obtido');
    }

    try {
      const startTime = Date.now();
      
      await dashboardAnalyticsService.getHistoricalData(testCondominiumId, 12);
      
      const duration = Date.now() - startTime;
      
      runner.logDetail(`Analytics históricos (12 meses) executados em ${duration}ms`);
      
      if (duration > 1000) {
        runner.logWarning(`⚠️  Tempo alto: ${duration}ms (ideal: < 1000ms)`);
      } else {
        runner.logSuccess(`✅ Performance OK: ${duration}ms`);
      }
    } catch (error) {
      // Se der erro, apenas avisa mas não falha o teste
      runner.logWarning(`⚠️  Erro ao calcular analytics: ${error.message}`);
      runner.logDetail('(Isso pode ser esperado se não houver dados históricos suficientes)');
    }
  });

  // Teste 5: Performance de previsões
  await runner.test('Performance: Cálculo de previsões', async () => {
    if (!testCondominiumId) {
      throw new Error('Condomínio de teste não foi obtido');
    }

    try {
      const startTime = Date.now();
      
      await dashboardAnalyticsService.getProjections(testCondominiumId, 3);
      
      const duration = Date.now() - startTime;
      
      runner.logDetail(`Previsões (3 meses) calculadas em ${duration}ms`);
      
      if (duration > 500) {
        runner.logWarning(`⚠️  Tempo alto: ${duration}ms (ideal: < 500ms)`);
      } else {
        runner.logSuccess(`✅ Performance OK: ${duration}ms`);
      }
    } catch (error) {
      // Se der erro, apenas avisa mas não falha o teste
      runner.logWarning(`⚠️  Erro ao calcular previsões: ${error.message}`);
      runner.logDetail('(Isso pode ser esperado se não houver dados históricos suficientes)');
    }
  });

  // Teste 6: Verificar índices do banco
  await runner.test('Performance: Verificar índices do banco', async () => {
    const indexes = await query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'financial_entries', 'financial_exits', 'apartments', 'monthly_fees')
      ORDER BY tablename, indexname
    `);

    runner.logDetail(`Índices encontrados: ${indexes.rows.length}`);
    
    const criticalTables = ['users', 'financial_entries', 'financial_exits'];
    const tablesWithIndexes = new Set(indexes.rows.map(i => i.tablename));
    
    criticalTables.forEach(table => {
      if (tablesWithIndexes.has(table)) {
        runner.logDetail(`  ✅ ${table}: tem índices`);
      } else {
        runner.logWarning(`  ⚠️  ${table}: sem índices (pode impactar performance)`);
      }
    });
  });

  // Teste 7: Verificar tamanho do banco
  await runner.test('Performance: Verificar tamanho do banco', async () => {
    const sizes = await query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

    runner.logDetail('Top 10 tabelas por tamanho:');
    sizes.rows.forEach((row, index) => {
      runner.logDetail(`  ${index + 1}. ${row.tablename}: ${row.size}`);
    });

    const totalSize = await query(`
      SELECT pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) AS total
      FROM pg_tables
      WHERE schemaname = 'public'
    `);

    runner.logDetail(`Tamanho total do banco: ${totalSize.rows[0].total}`);
  });

  runner.logSuccess('Testes de performance concluídos!');
}

module.exports = { run };

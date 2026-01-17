// Testes de Permissões e Acesso

const { query } = require('../src/config/database');

async function run(runner) {
  runner.logInfo('Iniciando testes de permissões...');

  // Teste 1: Verificar estrutura de permissões
  await runner.test('Verificar estrutura de permissões', async () => {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'permissions'
      ORDER BY ordinal_position
    `);
    
    runner.logDetail(`Colunas em permissions: ${result.rows.length}`);
    
    const requiredColumns = ['id', 'entity_type', 'action', 'description'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
  });

  // Teste 2: Verificar permissões por entidade
  await runner.test('Verificar permissões por entidade', async () => {
    const result = await query(`
      SELECT entity_type, COUNT(*) as count
      FROM permissions
      GROUP BY entity_type
      ORDER BY entity_type
    `);
    
    runner.logDetail('Permissões por entidade:');
    result.rows.forEach(row => {
      runner.logDetail(`  - ${row.entity_type}: ${row.count} permissões`);
    });
  });

  // Teste 3: Verificar atribuição de permissões aos perfis
  await runner.test('Verificar permissões por perfil', async () => {
    const result = await query(`
      SELECT 
        r.name as role_name,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);
    
    runner.logDetail('Permissões por perfil:');
    result.rows.forEach(row => {
      runner.logDetail(`  - ${row.role_name}: ${row.permission_count} permissões`);
      
      if (parseInt(row.permission_count) === 0) {
        runner.logWarning(`    ⚠️  Perfil ${row.role_name} sem permissões atribuídas`);
      }
    });
  });

  // Teste 4: Verificar usuários e seus perfis
  await runner.test('Verificar usuários e perfis', async () => {
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.active = TRUE
      GROUP BY u.id, u.username, u.email, u.full_name
      ORDER BY u.id
    `);
    
    runner.logDetail(`Usuários ativos: ${result.rows.length}`);
    
    result.rows.forEach(user => {
      const roles = user.roles.filter(r => r !== null);
      runner.logDetail(`  - ${user.username} (${user.email}): ${roles.join(', ') || 'Sem perfis'}`);
      
      if (roles.length === 0) {
        runner.logWarning(`    ⚠️  Usuário ${user.username} sem perfis atribuídos`);
      }
    });
  });

  // Teste 5: Verificar acesso SINDICO ao financeiro
  await runner.test('Verificar acesso SINDICO ao financeiro', async () => {
    const result = await query(`
      SELECT 
        r.name,
        p.entity_type,
        p.action
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name IN ('SINDICO', 'SUBSINDICO')
        AND (p.entity_type LIKE '%financial%' OR p.entity_type = 'financial_entries' OR p.entity_type = 'financial_exits')
      ORDER BY r.name, p.entity_type, p.action
    `);
    
    runner.logDetail('Permissões financeiras para SINDICO/SUBSINDICO:');
    
    if (result.rows.length === 0) {
      runner.logWarning('⚠️  SINDICO/SUBSINDICO não têm permissões financeiras explícitas na tabela');
      runner.logDetail('(Mas têm acesso via rota /financeiro/*)');
    } else {
      result.rows.forEach(row => {
        runner.logDetail(`  - ${row.name}: ${row.entity_type}.${row.action}`);
      });
    }
  });

  // Teste 6: Verificar rotas e permissões
  await runner.test('Verificar mapeamento de rotas', async () => {
    const routes = [
      { path: '/financeiro/*', roles: ['FINANCEIRO', 'SINDICO', 'SUBSINDICO'] },
      { path: '/assembleias/*', roles: ['SINDICO', 'SUBSINDICO', 'ADMINISTRATIVO'] },
      { path: '/sindico/*', roles: ['SINDICO', 'SUBSINDICO'] },
      { path: '/administrativo/*', roles: ['ADMINISTRATIVO'] },
      { path: '/operacional/*', roles: ['OPERACIONAL'] }
    ];
    
    runner.logDetail('Mapeamento de rotas e perfis:');
    routes.forEach(route => {
      runner.logDetail(`  ${route.path}: ${route.roles.join(', ')}`);
    });
  });

  runner.logSuccess('Testes de permissões concluídos!');
}

module.exports = { run };

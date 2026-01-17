// Testes de Autenticação e Autorização

const { query } = require('../src/config/database');
const authService = require('../src/services/authService');
const jwt = require('jsonwebtoken');

async function run(runner) {
  runner.logInfo('Iniciando testes de autenticação...');

  // Teste 1: Verificar estrutura de usuários
  await runner.test('Verificar estrutura de tabela users', async () => {
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    runner.logDetail(`Colunas encontradas: ${result.rows.length}`);
    runner.logDetail(`Colunas: ${result.rows.map(r => r.column_name).join(', ')}`);
    
    if (result.rows.length === 0) {
      throw new Error('Tabela users não encontrada');
    }
    
    const requiredColumns = ['id', 'username', 'email', 'password_hash', 'condominium_id', 'active'];
    const foundColumns = result.rows.map(r => r.column_name);
    const missing = requiredColumns.filter(col => !foundColumns.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Colunas faltando: ${missing.join(', ')}`);
    }
  });

  // Teste 2: Verificar perfis (roles)
  await runner.test('Verificar estrutura de perfis', async () => {
    const result = await query('SELECT * FROM roles ORDER BY name');
    runner.logDetail(`Perfis encontrados: ${result.rows.length}`);
    
    result.rows.forEach(role => {
      runner.logDetail(`  - ${role.name} (ID: ${role.id})`);
    });
    
    const requiredRoles = ['SUPER_MASTER', 'SINDICO', 'SUBSINDICO', 'FINANCEIRO', 'ADMINISTRATIVO', 'OPERACIONAL'];
    const foundRoles = result.rows.map(r => r.name);
    const missing = requiredRoles.filter(role => !foundRoles.includes(role));
    
    if (missing.length > 0) {
      runner.logWarning(`Perfis faltando: ${missing.join(', ')}`);
    }
  });

  // Teste 3: Verificar usuários existentes
  await runner.test('Listar usuários do sistema', async () => {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.full_name, u.condominium_id, u.active,
             array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.username, u.email, u.full_name, u.condominium_id, u.active
      ORDER BY u.id
    `);
    
    runner.logDetail(`Total de usuários: ${result.rows.length}`);
    
    result.rows.forEach(user => {
      const roles = user.roles.filter(r => r !== null);
      runner.logDetail(`  - ${user.username} (${user.email}) - Roles: ${roles.join(', ') || 'Nenhum'}`);
    });
    
    if (result.rows.length === 0) {
      runner.logWarning('Nenhum usuário encontrado no sistema');
    }
  });

  // Teste 4: Verificar permissões
  await runner.test('Verificar sistema de permissões', async () => {
    const result = await query(`
      SELECT p.entity_type, p.action, COUNT(rp.role_id) as role_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      GROUP BY p.id, p.entity_type, p.action
      ORDER BY p.entity_type, p.action
    `);
    
    runner.logDetail(`Total de permissões: ${result.rows.length}`);
    
    const byEntity = {};
    result.rows.forEach(perm => {
      if (!byEntity[perm.entity_type]) {
        byEntity[perm.entity_type] = [];
      }
      byEntity[perm.entity_type].push(`${perm.action} (${perm.role_count} roles)`);
    });
    
    Object.keys(byEntity).forEach(entity => {
      runner.logDetail(`  Entidade ${entity}: ${byEntity[entity].length} permissões`);
    });
  });

  // Teste 5: Verificar JWT secret
  await runner.test('Verificar configuração JWT', async () => {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não configurado no .env');
    }
    
    if (jwtSecret.length < 32) {
      runner.logWarning('JWT_SECRET muito curto (recomendado: 32+ caracteres)');
    }
    
    runner.logDetail(`JWT_SECRET configurado (${jwtSecret.length} caracteres)`);
  });

  // Teste 6: Simular login (sem senha real)
  await runner.test('Verificar estrutura de login', async () => {
    const testUser = await query('SELECT id, username, email FROM users LIMIT 1');
    
    if (testUser.rows.length === 0) {
      runner.logWarning('Nenhum usuário para testar login');
      return;
    }
    
    const user = testUser.rows[0];
    runner.logDetail(`Usuário de teste: ${user.username} (ID: ${user.id})`);
    
    // Verifica se tem senha hash
    const userWithPassword = await query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
    
    if (!userWithPassword.rows[0].password_hash) {
      runner.logWarning(`Usuário ${user.username} não tem senha configurada`);
    } else {
      runner.logDetail(`Usuário ${user.username} tem senha configurada`);
    }
  });

  runner.logSuccess('Testes de autenticação concluídos!');
}

module.exports = { run };

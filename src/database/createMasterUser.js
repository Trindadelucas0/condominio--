// Script para criar o primeiro usuário SUPER_MASTER
// Execute: node src/database/createMasterUser.js
// 
// IMPORTANTE: Altere a senha padrão após o primeiro login!

const bcrypt = require('bcrypt');
const { query } = require('../config/database');

async function createMasterUser() {
  try {
    console.log('🔍 Verificando se já existe usuário SUPER_MASTER...');

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
      console.log('⚠️  Usuário SUPER_MASTER já existe!');
      console.log(`   Username: ${existingMaster.rows[0].username}`);
      console.log('   Para criar outro usuário, use a interface web após fazer login.');
      return;
    }

    // Busca o ID do role SUPER_MASTER
    const roleResult = await query(`
      SELECT id FROM roles WHERE name = 'SUPER_MASTER'
    `);

    if (roleResult.rows.length === 0) {
      throw new Error('Role SUPER_MASTER não encontrado. Execute a inicialização do banco primeiro.');
    }

    const masterRoleId = roleResult.rows[0].id;

    // Configurações do usuário master
    const username = 'admin';
    const email = 'admin@condominio.com';
    const password = 'admin123'; // ALTERE ISSO APÓS O PRIMEIRO LOGIN!
    const fullName = 'Administrador Master';

    // Gera hash da senha
    console.log('🔐 Gerando hash da senha...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Cria o usuário
    console.log('👤 Criando usuário master...');
    const userResult = await query(`
      INSERT INTO users (username, email, password_hash, full_name, condominium_id, active)
      VALUES ($1, $2, $3, $4, NULL, TRUE)
      RETURNING id, username, email
    `, [username, email, passwordHash, fullName]);

    const newUser = userResult.rows[0];

    // Atribui o role SUPER_MASTER
    console.log('🔑 Atribuindo role SUPER_MASTER...');
    await query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `, [newUser.id, masterRoleId]);

    console.log('\n✅ Usuário SUPER_MASTER criado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Credenciais de acesso:');
    console.log(`   Username: ${username}`);
    console.log(`   Senha: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erro ao criar usuário master:', error.message);
    process.exit(1);
  } finally {
    // Fecha a conexão
    const { pool } = require('../config/database');
    await pool.end();
  }
}

// Executa o script
createMasterUser();

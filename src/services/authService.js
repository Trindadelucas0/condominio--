// Service de autenticação
// Lógica de negócio relacionada a login e autenticação
// Não contém validação de permissões (isso é feito no middleware)

const bcrypt = require('bcrypt'); // Para comparar senha com hash
const jwt = require('jsonwebtoken'); // Para gerar tokens JWT
const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para registrar login no log

// Função para realizar login
// Recebe: username e senha
// Retorna: dados do usuário e token JWT se credenciais válidas
// Lança erro se credenciais inválidas
const login = async (username, password, ipAddress = null, userAgent = null) => {
  try {
    // Busca usuário pelo username (case-insensitive)
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, 
              u.condominium_id, u.active
       FROM users u
       WHERE LOWER(u.username) = LOWER($1)`,
      [username]
    );

    // Se usuário não existe, lança erro genérico (não revela se usuário existe)
    if (userResult.rows.length === 0) {
      throw new Error('Credenciais inválidas');
    }

    const user = userResult.rows[0];

    // Se usuário está inativo, lança erro
    if (!user.active) {
      throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }

    // Compara senha informada com hash armazenado
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    // Se senha não confere, lança erro
    if (!passwordMatch) {
      throw new Error('Credenciais inválidas');
    }

    // Busca perfis (roles) do usuário
    const rolesResult = await query(
      `SELECT r.name
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const roles = rolesResult.rows.map((row) => row.name);

    // Atualiza último login do usuário
    await query(
      `UPDATE users 
       SET last_login = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [user.id]
    );

    // Gera token JWT com dados do usuário
    // Expira em 24 horas
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        roles: roles,
      },
      process.env.JWT_SECRET, // Chave secreta do .env
      { expiresIn: '24h' } // Token expira em 24 horas
    );

    // Registra login no log de auditoria
    await logAction({
      userId: user.id,
      condominiumId: user.condominium_id,
      action: 'LOGIN',
      module: 'AUTH',
      entityType: 'users',
      entityId: user.id,
      afterData: {
        username: user.username,
        loginAt: new Date().toISOString(),
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Retorna dados do usuário (sem senha) e token
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        condominiumId: user.condominium_id,
        roles: roles,
      },
      token: token,
    };
  } catch (error) {
    // Propaga erro para o controller
    throw error;
  }
};

// Exporta funções para uso nos controllers
module.exports = {
  login,
};

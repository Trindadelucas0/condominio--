// Service do módulo SUPER_MASTER
// Contém lógica de negócio para gestão de condomínios e usuários
// Apenas SUPER_MASTER pode executar essas operações

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria
const bcrypt = require('bcrypt'); // Para hash de senha

// Função para obter estatísticas gerais do sistema
// Retorna: total de condomínios, usuários ativos, etc
const getDashboardStats = async () => {
  try {
    // Conta total de condomínios ativos
    const condominiosResult = await query(
      `SELECT COUNT(*) as total FROM condominiums WHERE active = TRUE`
    );
    const totalCondominios = parseInt(condominiosResult.rows[0].total);

    // Conta total de usuários ativos
    const usuariosResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE active = TRUE`
    );
    const totalUsuarios = parseInt(usuariosResult.rows[0].total);

    // Conta logs das últimas 24 horas
    const logsResult = await query(
      `SELECT COUNT(*) as total FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours'`
    );
    const logs24h = parseInt(logsResult.rows[0].total);

    // Retorna estatísticas
    return {
      totalCondominios,
      totalUsuarios,
      logs24h,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    throw error;
  }
};

// Função para listar todos os condomínios
// Retorna: array de condomínios com informações básicas
const listCondominios = async () => {
  try {
    const result = await query(
      `SELECT id, name, address, cnpj, phone, email, active, created_at, updated_at
       FROM condominiums
       ORDER BY created_at DESC`
    );
    return result.rows; // Retorna array de condomínios
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    throw error;
  }
};

// Função para buscar um condomínio por ID
// Recebe: id do condomínio
// Retorna: dados do condomínio ou null se não existir
const getCondominioById = async (id) => {
  try {
    const result = await query(
      `SELECT id, name, address, cnpj, phone, email, active, created_at, updated_at
       FROM condominiums
       WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Erro ao buscar condomínio:', error);
    throw error;
  }
};

// Função para criar novo condomínio
// Recebe: dados do condomínio
// Retorna: condomínio criado
const createCondominio = async (data, userId, ipAddress, userAgent) => {
  try {
    const { name, address, cnpj, phone, email } = data;

    // Validação: nome é obrigatório
    if (!name || name.trim() === '') {
      throw new Error('Nome do condomínio é obrigatório');
    }

    // Insere condomínio no banco
    const result = await query(
      `INSERT INTO condominiums (name, address, cnpj, phone, email, active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [name.trim(), address || null, cnpj || null, phone || null, email || null]
    );

    const condominio = result.rows[0];

    // Registra ação no log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominio.id,
      action: 'CREATE',
      module: 'CONDOMINIUM',
      entityType: 'condominiums',
      entityId: condominio.id,
      afterData: condominio,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return condominio;
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    throw error;
  }
};

// Função para atualizar condomínio
// Recebe: id e dados atualizados
// Retorna: condomínio atualizado
const updateCondominio = async (id, data, userId, ipAddress, userAgent) => {
  try {
    // Busca condomínio atual (para log de auditoria)
    const current = await getCondominioById(id);
    if (!current) {
      throw new Error('Condomínio não encontrado');
    }

    const { name, address, cnpj, phone, email, active } = data;

    // Atualiza condomínio
    const result = await query(
      `UPDATE condominiums 
       SET name = $1, address = $2, cnpj = $3, phone = $4, email = $5, active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name.trim(), address || null, cnpj || null, phone || null, email || null, active !== false, id]
    );

    const updated = result.rows[0];

    // Registra ação no log de auditoria (antes e depois)
    await logAction({
      userId: userId,
      condominiumId: id,
      action: 'UPDATE',
      module: 'CONDOMINIUM',
      entityType: 'condominiums',
      entityId: id,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    throw error;
  }
};

// Função para listar todos os usuários (com informações de condomínio e perfis)
// Retorna: array de usuários com perfis e condomínio
const listUsuarios = async () => {
  try {
    // Busca usuários com condomínio
    const result = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.active, u.created_at, u.last_login,
              c.name as condominium_name, c.id as condominium_id
       FROM users u
       LEFT JOIN condominiums c ON u.condominium_id = c.id
       ORDER BY u.created_at DESC`
    );

    // Para cada usuário, busca seus perfis
    const usuarios = [];
    for (const user of result.rows) {
      const rolesResult = await query(
        `SELECT r.name, r.id
         FROM roles r
         INNER JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $1`,
        [user.id]
      );
      usuarios.push({
        ...user,
        roles: rolesResult.rows.map((r) => r.name),
      });
    }

    return usuarios;
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
};

// Função para buscar um usuário por ID (com perfis)
// Recebe: id do usuário
// Retorna: dados do usuário ou null
const getUsuarioById = async (id) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.condominium_id, u.active,
              c.name as condominium_name
       FROM users u
       LEFT JOIN condominiums c ON u.condominium_id = c.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // Busca perfis do usuário
    const rolesResult = await query(
      `SELECT r.id, r.name
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [id]
    );

    user.roles = rolesResult.rows.map((r) => ({ id: r.id, name: r.name }));

    return user;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};

// Função para buscar todos os perfis disponíveis
// Retorna: array de perfis (roles)
const getAllRoles = async () => {
  try {
    const result = await query(
      `SELECT id, name, description FROM roles ORDER BY name`
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    throw error;
  }
};

// Função para criar novo usuário
// Recebe: dados do usuário (username, email, senha, nome, condominium_id, roles)
// Retorna: usuário criado
const createUsuario = async (data, userId, ipAddress, userAgent) => {
  try {
    const { username, email, password, fullName, condominiumId, roleIds } = data;

    // Validações
    if (!username || !email || !password || !fullName) {
      throw new Error('Campos obrigatórios: username, email, senha e nome completo');
    }

    if (!roleIds || roleIds.length === 0) {
      throw new Error('Usuário deve ter pelo menos um perfil');
    }

    // Verifica se username já existe
    const existingUser = await query(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1)`,
      [username]
    );
    if (existingUser.rows.length > 0) {
      throw new Error('Username já existe');
    }

    // Verifica se email já existe
    const existingEmail = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    if (existingEmail.rows.length > 0) {
      throw new Error('Email já existe');
    }

    // Criptografa senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Insere usuário (sem condominium_id se for SUPER_MASTER)
    const userResult = await query(
      `INSERT INTO users (username, email, password_hash, full_name, condominium_id, active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, username, email, full_name, condominium_id, active`,
      [username.trim(), email.trim(), passwordHash, fullName.trim(), condominiumId || null]
    );

    const newUser = userResult.rows[0];

    // Vincula perfis ao usuário
    for (const roleId of roleIds) {
      await query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [newUser.id, roleId]
      );
    }

    // Busca perfis vinculados para log
    const rolesResult = await query(
      `SELECT r.name FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1`,
      [newUser.id]
    );

    // Registra ação no log
    await logAction({
      userId: userId,
      condominiumId: newUser.condominium_id,
      action: 'CREATE',
      module: 'USER',
      entityType: 'users',
      entityId: newUser.id,
      afterData: {
        ...newUser,
        roles: rolesResult.rows.map((r) => r.name),
      },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return newUser;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
};

// Função para atualizar usuário
// Recebe: id e dados atualizados
// Retorna: usuário atualizado
const updateUsuario = async (id, data, userId, ipAddress, userAgent) => {
  try {
    // Busca usuário atual
    const current = await getUsuarioById(id);
    if (!current) {
      throw new Error('Usuário não encontrado');
    }

    const { username, email, fullName, condominiumId, active, roleIds } = data;

    // Atualiza dados básicos do usuário
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramCount++}`);
      updateValues.push(username.trim());
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      updateValues.push(email.trim());
    }
    if (fullName !== undefined) {
      updateFields.push(`full_name = $${paramCount++}`);
      updateValues.push(fullName.trim());
    }
    if (condominiumId !== undefined) {
      updateFields.push(`condominium_id = $${paramCount++}`);
      updateValues.push(condominiumId || null);
    }
    if (active !== undefined) {
      updateFields.push(`active = $${paramCount++}`);
      updateValues.push(active);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    if (updateFields.length > 1) {
      await query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        updateValues
      );
    }

    // Se roleIds foi fornecido, atualiza perfis
    if (roleIds !== undefined) {
      // Remove todos os perfis atuais
      await query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);

      // Adiciona novos perfis
      for (const roleId of roleIds) {
        await query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
          [id, roleId]
        );
      }
    }

    // Busca usuário atualizado
    const updated = await getUsuarioById(id);

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: updated.condominium_id,
      action: 'UPDATE',
      module: 'USER',
      entityType: 'users',
      entityId: id,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  getDashboardStats,
  listCondominios,
  getCondominioById,
  createCondominio,
  updateCondominio,
  listUsuarios,
  getUsuarioById,
  getAllRoles,
  createUsuario,
  updateUsuario,
};

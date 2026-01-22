// Service do módulo SUPER_MASTER
// Gerencia lógica de negócio para condomínios e usuários

const { query, getClient } = require('../config/database');
const masterServiceEnhanced = require('./masterServiceEnhanced');

// Função para obter estatísticas do dashboard
// Retorna: estatísticas gerais do sistema
const getDashboardStats = async () => {
  try {
    // Total de condomínios ativos
    const condominiosAtivos = await query(
      `SELECT COUNT(*) as total FROM condominiums WHERE active = TRUE`
    );
    const totalCondominios = parseInt(condominiosAtivos.rows[0].total);

    // Total de condomínios inativos
    const condominiosInativos = await query(
      `SELECT COUNT(*) as total FROM condominiums WHERE active = FALSE`
    );
    const totalCondominiosInativos = parseInt(condominiosInativos.rows[0].total);

    // Total de usuários ativos
    const usuariosAtivos = await query(
      `SELECT COUNT(*) as total FROM users WHERE active = TRUE`
    );
    const totalUsuarios = parseInt(usuariosAtivos.rows[0].total);

    // Logs das últimas 24 horas
    const logs24h = await query(
      `SELECT COUNT(*) as total FROM audit_logs 
       WHERE created_at >= NOW() - INTERVAL '24 hours'`
    );
    const logs24hCount = parseInt(logs24h.rows[0].total);

    // Logs dos últimos 7 dias
    const logs7d = await query(
      `SELECT COUNT(*) as total FROM audit_logs 
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    );
    const logs7dCount = parseInt(logs7d.rows[0].total);

    // Aprovações pendentes (de todos os condomínios)
    const aprovacoesPendentes = await query(
      `SELECT COUNT(*) as total FROM financial_exits 
       WHERE payment_status = 'PENDING' AND requires_approval = TRUE`
    );
    const aprovacoesPendentesCount = parseInt(aprovacoesPendentes.rows[0].total);

    // Usuários por perfil
    const usuariosPorPerfil = await query(
      `SELECT r.name, COUNT(ur.user_id) as total
       FROM roles r
       LEFT JOIN user_roles ur ON r.id = ur.role_id
       LEFT JOIN users u ON ur.user_id = u.id AND u.active = TRUE
       GROUP BY r.id, r.name
       ORDER BY r.name`
    );

    // Alertas críticos (pode ser expandido no futuro)
    const alertasCriticos = 0;

    return {
      totalCondominios,
      totalCondominiosInativos,
      totalUsuarios,
      logs24h: logs24hCount,
      logs7d: logs7dCount,
      aprovaçõesPendentes: aprovacoesPendentesCount,
      usuariosPorPerfil: usuariosPorPerfil.rows,
      alertasCriticos,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    throw error;
  }
};

// Função para listar condomínios
// Retorna: lista de condomínios (apenas ativos por padrão)
const listCondominios = async (includeInactive = false) => {
  try {
    let sql = `SELECT * FROM condominiums`;
    if (!includeInactive) {
      sql += ` WHERE active = TRUE`;
    }
    sql += ` ORDER BY name ASC`;
    
    const result = await query(sql);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    throw error;
  }
};

// Função para buscar condomínio por ID
// Recebe: id do condomínio
// Retorna: condomínio
const getCondominiumById = async (id) => {
  try {
    // Valida se ID existe e é válido
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('ID do condomínio não fornecido ou inválido');
    }

    // Converte para inteiro se for string numérica
    const condominiumId = parseInt(id, 10);
    if (isNaN(condominiumId)) {
      throw new Error('ID do condomínio deve ser um número válido');
    }

    const result = await query(
      `SELECT * FROM condominiums WHERE id = $1`,
      [condominiumId]
    );
    if (result.rows.length === 0) {
      throw new Error('Condomínio não encontrado');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar condomínio:', error);
    throw error;
  }
};

// Função para atualizar condomínio
// Recebe: id e dados do condomínio
// Retorna: condomínio atualizado
// REGRA: Se condomínio for inativado, inativa todos os usuários desse condomínio
const updateCondominium = async (id, data, userId, ipAddress, userAgent) => {
  // Valida se ID existe e é válido
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error('ID do condomínio não fornecido ou inválido');
  }

  // Converte para inteiro se for string numérica
  const condominiumId = parseInt(id, 10);
  if (isNaN(condominiumId)) {
    throw new Error('ID do condomínio deve ser um número válido');
  }

  const client = await require('../config/database').getClient();
  
  try {
    await client.query('BEGIN'); // Inicia transação

    const { name, address, cnpj, phone, email, active } = data;

    // Busca condomínio atual para log
    const current = await getCondominiumById(condominiumId);

    // Converte active para boolean
    // Se vier como string "true" ou "false", converte
    let activeValue = current.active;
    if (active !== undefined) {
      if (typeof active === 'string') {
        activeValue = active === 'true' || active === '1';
      } else if (typeof active === 'boolean') {
        activeValue = active;
      } else {
        activeValue = Boolean(active);
      }
    }

    console.log('🔍 [DEBUG] Service - Active recebido:', active, 'Tipo:', typeof active, 'Valor final:', activeValue);

    // Atualiza condomínio
    const result = await client.query(
      `UPDATE condominiums 
       SET name = $1, address = $2, cnpj = $3, phone = $4, email = $5, active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        name ? name.trim() : current.name,
        address ? address.trim() : current.address,
        cnpj ? cnpj.trim() : current.cnpj,
        phone ? phone.trim() : current.phone,
        email ? email.trim().toLowerCase() : current.email,
        activeValue,
        condominiumId
      ]
    );

    const updated = result.rows[0];

    // Se condomínio foi INATIVADO, inativa todos os usuários desse condomínio
    if (current.active === true && activeValue === false) {
      console.log(`🔒 Inativando condomínio ${condominiumId} - inativando todos os usuários...`);
      
      const usersInactivated = await client.query(
        `UPDATE users 
         SET active = FALSE, updated_at = NOW()
         WHERE condominium_id = $1 AND active = TRUE
         RETURNING id, username`,
        [condominiumId]
      );

      console.log(`✅ ${usersInactivated.rows.length} usuários inativados do condomínio ${condominiumId}`);
    }

    // Se condomínio foi ATIVADO novamente, reativa todos os usuários desse condomínio
    if (current.active === false && activeValue === true) {
      console.log(`🔓 Reativando condomínio ${condominiumId} - reativando todos os usuários...`);
      
      const usersReactivated = await client.query(
        `UPDATE users 
         SET active = TRUE, updated_at = NOW()
         WHERE condominium_id = $1 AND active = FALSE
         RETURNING id, username`,
        [condominiumId]
      );

      console.log(`✅ ${usersReactivated.rows.length} usuários reativados do condomínio ${condominiumId}`);
    }

    await client.query('COMMIT'); // Confirma transação

    // Registra no log
    const { logAction } = require('../utils/logger');
    await logAction({
      userId: userId,
      condominiumId: null,
      action: 'UPDATE',
      module: 'MASTER',
      entityType: 'condominiums',
      entityId: updated.id,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    await client.query('ROLLBACK'); // Reverte transação em caso de erro
    console.error('Erro ao atualizar condomínio:', error);
    throw error;
  } finally {
    client.release(); // Libera conexão
  }
};

// Função para listar usuários
// Retorna: lista de usuários com seus perfis
const listUsuarios = async () => {
  try {
    const result = await query(
      `SELECT u.*, 
              c.name as condominium_name,
              COALESCE(
                array_agg(DISTINCT r.name) 
                FILTER (WHERE r.id IS NOT NULL),
                ARRAY[]::text[]
              ) as roles
       FROM users u
       LEFT JOIN condominiums c ON u.condominium_id = c.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       GROUP BY u.id, c.name
       ORDER BY u.full_name ASC`
    );
    
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
};

// Função para buscar usuário por ID
// Recebe: id do usuário
// Retorna: usuário com perfis
const getUsuarioById = async (id) => {
  try {
    const result = await query(
      `SELECT u.*, 
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name)) 
                FILTER (WHERE r.id IS NOT NULL),
                '[]'
              ) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
};

// Função para atualizar usuário
// Recebe: id e dados do usuário
// Retorna: usuário atualizado
const updateUsuario = async (id, data, userId, ipAddress, userAgent) => {
  try {
    const { username, email, password, fullName, condominiumId, active, roleIds } = data;

    // Busca usuário atual para log
    const current = await getUsuarioById(id);

    // Atualiza senha se fornecida
    let passwordHash = current.password_hash;
    if (password && password.length >= 6) {
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    // Atualiza usuário
    const result = await query(
      `UPDATE users 
       SET username = $1, email = $2, password_hash = $3, full_name = $4, 
           condominium_id = $5, active = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        username ? username.trim() : current.username,
        email ? email.trim().toLowerCase() : current.email,
        passwordHash,
        fullName ? fullName.trim() : current.full_name,
        condominiumId !== undefined ? condominiumId : current.condominium_id,
        active !== undefined ? active : current.active,
        id
      ]
    );

    const updated = result.rows[0];

    // Atualiza perfis se fornecidos
    if (roleIds && Array.isArray(roleIds)) {
      // Remove todos os perfis atuais
      await query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);

      // Adiciona novos perfis
      for (const roleId of roleIds) {
        await query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
           ON CONFLICT (user_id, role_id) DO NOTHING`,
          [id, roleId]
        );
      }
    }

    // Remove password_hash do retorno
    delete updated.password_hash;

    // Registra no log
    const { logAction } = require('../utils/logger');
    await logAction({
      userId: userId,
      condominiumId: updated.condominium_id,
      action: 'UPDATE',
      module: 'MASTER',
      entityType: 'users',
      entityId: updated.id,
      beforeData: { ...current, password_hash: '[REDACTED]' },
      afterData: { ...updated, roles: roleIds || [] },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

// Função para listar todos os perfis (roles)
// Retorna: lista de perfis disponíveis
const listRoles = async () => {
  try {
    const result = await query(
      `SELECT * FROM roles ORDER BY name ASC`
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar perfis:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  getDashboardStats,
  listCondominios,
  getCondominiumById,
  createCondominium: masterServiceEnhanced.createCondominium,
  updateCondominium,
  listUsuarios,
  getUsuarioById,
  createUser: masterServiceEnhanced.createUser,
  updateUsuario,
  listRoles,
};

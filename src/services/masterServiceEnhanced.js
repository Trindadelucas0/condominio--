// Service do módulo SUPER_MASTER com validações melhoradas
// Extensão do masterService.js original com validações de CNPJ e email

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateCNPJ, validateEmail } = require('../utils/validators');
const bcrypt = require('bcrypt');

// Função para criar condomínio com validações
// Recebe: dados do condomínio
// Retorna: condomínio criado
const createCondominium = async (data, userId, ipAddress, userAgent) => {
  try {
    const { name, address, cnpj, phone, email } = data;

    // Validações obrigatórias
    if (!name || !name.trim()) {
      throw new Error('Nome do condomínio é obrigatório');
    }

    // Valida CNPJ se fornecido
    if (cnpj && cnpj.trim()) {
      const cnpjValidation = validateCNPJ(cnpj);
      if (!cnpjValidation.valid) {
        throw new Error(cnpjValidation.error);
      }
    }

    // Valida email se fornecido
    if (email && email.trim()) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error);
      }
    }

    // Verifica se CNPJ já existe (se fornecido)
    if (cnpj && cnpj.trim()) {
      const existingCnpj = await query(
        `SELECT id FROM condominiums WHERE cnpj = $1`,
        [cnpj.trim()]
      );

      if (existingCnpj.rows.length > 0) {
        throw new Error('CNPJ já cadastrado no sistema');
      }
    }

    // Verifica se email já existe (se fornecido)
    if (email && email.trim()) {
      const existingEmail = await query(
        `SELECT id FROM condominiums WHERE email = $1`,
        [email.trim().toLowerCase()]
      );

      if (existingEmail.rows.length > 0) {
        throw new Error('Email já cadastrado no sistema');
      }
    }

    // Cria condomínio
    const result = await query(
      `INSERT INTO condominiums (name, address, cnpj, phone, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name.trim(),
        address ? address.trim() : null,
        cnpj && cnpj.trim() ? cnpj.trim() : null,
        phone ? phone.trim() : null,
        email ? email.trim().toLowerCase() : null
      ]
    );

    const condominium = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: null, // SUPER_MASTER não tem condominium_id
      action: 'CREATE',
      module: 'MASTER',
      entityType: 'condominiums',
      entityId: condominium.id,
      beforeData: null,
      afterData: condominium,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return condominium;
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    throw error;
  }
};

// Função para criar usuário com validações
// Recebe: dados do usuário
// Retorna: usuário criado
const createUser = async (data, userId, ipAddress, userAgent) => {
  try {
    const { username, email, password, fullName, condominiumId, roleIds } = data;

    // Validações obrigatórias
    if (!username || !username.trim()) {
      throw new Error('Username é obrigatório');
    }

    if (!email || !email.trim()) {
      throw new Error('Email é obrigatório');
    }

    if (!password || password.length < 6) {
      throw new Error('Senha deve ter no mínimo 6 caracteres');
    }

    if (!fullName || !fullName.trim()) {
      throw new Error('Nome completo é obrigatório');
    }

    // Valida email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new Error(emailValidation.error);
    }

    // Verifica se username já existe
    const existingUsername = await query(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1)`,
      [username.trim()]
    );

    if (existingUsername.rows.length > 0) {
      throw new Error('Username já está em uso');
    }

    // Verifica se email já existe
    const existingEmail = await query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim().toLowerCase()]
    );

    if (existingEmail.rows.length > 0) {
      throw new Error('Email já está em uso');
    }

    // Valida condomínio se fornecido
    if (condominiumId) {
      const condominiumExists = await query(
        `SELECT id FROM condominiums WHERE id = $1 AND active = TRUE`,
        [condominiumId]
      );

      if (condominiumExists.rows.length === 0) {
        throw new Error('Condomínio não encontrado ou inativo');
      }
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Cria usuário
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, condominium_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        username.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        fullName.trim(),
        condominiumId || null
      ]
    );

    const user = result.rows[0];

    // Atribui perfis se fornecidos
    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        await query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, role_id) DO NOTHING`,
          [user.id, roleId]
        );
      }
    }

    // Remove password_hash do retorno
    delete user.password_hash;

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId || null,
      action: 'CREATE',
      module: 'MASTER',
      entityType: 'users',
      entityId: user.id,
      beforeData: null,
      afterData: { ...user, roles: roleIds || [] },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return user;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
};

module.exports = {
  createCondominium,
  createUser,
};

// Helper para garantir isolamento multi-tenant em todas as queries
// Força validação de condominium_id em operações críticas

const { query } = require('../config/database');

// Função para validar que um registro pertence ao condomínio
// Recebe: tableName, recordId, condominiumId
// Retorna: boolean
const validateCondominiumOwnership = async (tableName, recordId, condominiumId) => {
  try {
    const result = await query(
      `SELECT condominium_id FROM ${tableName} WHERE id = $1`,
      [recordId]
    );

    if (result.rows.length === 0) {
      return false; // Registro não existe
    }

    return result.rows[0].condominium_id === condominiumId;
  } catch (error) {
    console.error(`Erro ao validar ownership de ${tableName}:`, error);
    return false;
  }
};

// Função para validar que um usuário pertence ao condomínio
// Recebe: userId, condominiumId
// Retorna: boolean
const validateUserBelongsToCondominium = async (userId, condominiumId) => {
  try {
    const result = await query(
      `SELECT condominium_id FROM users WHERE id = $1 AND active = TRUE`,
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const userCondominiumId = result.rows[0].condominium_id;
    
    // SUPER_MASTER pode ter condominium_id NULL, mas não pode ser usado em operações de condomínio
    if (userCondominiumId === null) {
      return false; // Usuário não pertence a nenhum condomínio
    }

    return userCondominiumId === condominiumId;
  } catch (error) {
    console.error('Erro ao validar usuário pertence ao condomínio:', error);
    return false;
  }
};

// Função para construir query segura com condominium_id
// Garante que condominium_id está sempre presente e validado
// Recebe: baseQuery (string), params (array), condominiumId (number)
// Retorna: { sql: string, params: array }
const buildSecureQuery = (baseQuery, params = [], condominiumId) => {
  if (!condominiumId) {
    throw new Error('condominium_id é obrigatório para queries seguras');
  }

  // Verifica se query já tem WHERE
  const hasWhere = baseQuery.toUpperCase().includes('WHERE');
  
  // Adiciona condominium_id ao WHERE ou cria WHERE
  let secureQuery = baseQuery;
  const secureParams = [...params, condominiumId];
  
  if (hasWhere) {
    secureQuery += ` AND condominium_id = $${secureParams.length}`;
  } else {
    secureQuery += ` WHERE condominium_id = $${secureParams.length}`;
  }

  return {
    sql: secureQuery,
    params: secureParams
  };
};

// Função para validar JOINs incluem condominium_id
// Recebe: sql (string)
// Retorna: boolean (se é seguro)
const validateJoinSecurity = (sql) => {
  const upperSql = sql.toUpperCase();
  
  // Se tem JOIN, verifica se há validação de condominium_id
  if (upperSql.includes('JOIN')) {
    // Verifica se há WHERE com condominium_id ou se JOIN já valida
    const hasCondominiumCheck = upperSql.includes('CONDOMINIUM_ID');
    if (!hasCondominiumCheck) {
      console.warn('⚠️  Query com JOIN sem validação explícita de condominium_id:', sql.substring(0, 100));
      return false;
    }
  }
  
  return true;
};

module.exports = {
  validateCondominiumOwnership,
  validateUserBelongsToCondominium,
  buildSecureQuery,
  validateJoinSecurity,
};

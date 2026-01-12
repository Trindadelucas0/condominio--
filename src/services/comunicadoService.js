// Serviço de comunicados operacionais
// REGRA: ADM cria comunicados operacionais (não oficiais)

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');

// Função para criar comunicado operacional
// Recebe: data, userId, condominiumId
// Retorna: comunicado criado
const createCommunication = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { title, message, communicationType, targetAudience, expiresAt } = data;

    if (!title || !message) {
      throw new Error('Título e mensagem são obrigatórios');
    }

    const result = await query(
      `INSERT INTO operational_communications (
        condominium_id, created_by, title, message, communication_type,
        target_audience, expires_at, is_active
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [
        condominiumId,
        userId,
        title.trim(),
        message.trim(),
        communicationType || 'INFO',
        targetAudience || 'ALL',
        expiresAt || null,
      ]
    );

    const communication = result.rows[0];

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ADMINISTRATIVO',
      entityType: 'operational_communications',
      entityId: communication.id,
      beforeData: null,
      afterData: communication,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return communication;
  } catch (error) {
    console.error('Erro ao criar comunicado:', error);
    throw error;
  }
};

// Função para listar comunicados ativos
// Recebe: condominiumId, filtros
// Retorna: lista de comunicados
const listCommunications = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT oc.*, u.full_name as created_by_name
      FROM operational_communications oc
      LEFT JOIN users u ON oc.created_by = u.id
      WHERE oc.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.active !== undefined) {
      sql += ` AND oc.is_active = $${paramCount++}`;
      params.push(filters.active);
    } else {
      sql += ` AND oc.is_active = TRUE`;
    }

    if (filters.targetAudience) {
      sql += ` AND (oc.target_audience = $${paramCount++} OR oc.target_audience = 'ALL')`;
      params.push(filters.targetAudience);
    }

    sql += ` AND (oc.expires_at IS NULL OR oc.expires_at >= CURRENT_TIMESTAMP)`;

    sql += ` ORDER BY oc.created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar comunicados:', error);
    throw error;
  }
};

// Função para desativar comunicado
// Recebe: communicationId, userId, condominiumId
// Retorna: comunicado atualizado
const deactivateCommunication = async (communicationId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const result = await query(
      `UPDATE operational_communications 
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND condominium_id = $2
       RETURNING *`,
      [communicationId, condominiumId]
    );

    if (result.rows.length === 0) {
      throw new Error('Comunicado não encontrado');
    }

    const updated = result.rows[0];

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'ADMINISTRATIVO',
      entityType: 'operational_communications',
      entityId: communicationId,
      beforeData: { ...updated, is_active: true },
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao desativar comunicado:', error);
    throw error;
  }
};

module.exports = {
  createCommunication,
  listCommunications,
  deactivateCommunication,
};

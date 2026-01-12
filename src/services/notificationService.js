// Service de Notificações
// Gerencia criação, leitura e gerenciamento de notificações do sistema

const { query } = require('../config/database');

// Função para criar notificação
// Recebe: userId, condominiumId, title, message, notificationType, entityType, entityId
// Retorna: notificação criada
const createNotification = async (userId, condominiumId, title, message, notificationType, entityType = null, entityId = null) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, condominium_id, title, message, notification_type, entity_type, entity_id, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, condominiumId, title, message, notificationType, entityType, entityId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

// Função para criar notificações para múltiplos usuários (por role)
// Recebe: roleName, condominiumId, title, message, notificationType, entityType, entityId
// Retorna: array de notificações criadas
const createNotificationForRole = async (roleName, condominiumId, title, message, notificationType, entityType = null, entityId = null) => {
  try {
    // Busca todos os usuários com a role no condomínio
    const usersResult = await query(
      `SELECT DISTINCT u.id
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE u.condominium_id = $1 AND r.name = $2 AND u.active = TRUE`,
      [condominiumId, roleName]
    );

    const notifications = [];
    for (const user of usersResult.rows) {
      const notification = await createNotification(
        user.id,
        condominiumId,
        title,
        message,
        notificationType,
        entityType,
        entityId
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Erro ao criar notificações para role:', error);
    throw error;
  }
};

// Função para buscar notificações de um usuário
// Recebe: userId, condominiumId, options (read, limit, offset)
// Retorna: array de notificações
const getUserNotifications = async (userId, condominiumId, options = {}) => {
  try {
    const { read = null, limit = 50, offset = 0 } = options;
    
    let whereClause = 'WHERE user_id = $1 AND condominium_id = $2';
    const params = [userId, condominiumId];
    let paramCount = 3;

    if (read !== null) {
      whereClause += ` AND read = $${paramCount++}`;
      params.push(read);
    }

    const result = await query(
      `SELECT * FROM notifications
       ${whereClause}
       ORDER BY created_at DESC, read ASC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar notificações do usuário:', error);
    throw error;
  }
};

// Função para contar notificações não lidas
// Recebe: userId, condominiumId
// Retorna: número de notificações não lidas
const getUnreadCount = async (userId, condominiumId) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND condominium_id = $2 AND read = FALSE`,
      [userId, condominiumId]
    );

    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Erro ao contar notificações não lidas:', error);
    throw error;
  }
};

// Função para marcar notificação como lida
// Recebe: notificationId, userId
// Retorna: notificação atualizada
const markAsRead = async (notificationId, userId) => {
  try {
    const result = await query(
      `UPDATE notifications
       SET read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Notificação não encontrada ou não pertence ao usuário');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
};

// Função para marcar todas as notificações como lidas
// Recebe: userId, condominiumId
// Retorna: número de notificações atualizadas
const markAllAsRead = async (userId, condominiumId) => {
  try {
    const result = await query(
      `UPDATE notifications
       SET read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND condominium_id = $2 AND read = FALSE
       RETURNING id`,
      [userId, condominiumId]
    );

    return result.rows.length;
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    throw error;
  }
};

// Função para deletar notificação (soft delete - apenas marca como lida e arquivada)
// Recebe: notificationId, userId
// Retorna: sucesso
const deleteNotification = async (notificationId, userId) => {
  try {
    // Notificações não são deletadas, apenas marcadas como lidas
    await markAsRead(notificationId, userId);
    return true;
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createNotificationForRole,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

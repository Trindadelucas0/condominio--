// Service de Manutenções (Preventiva e Corretiva)
// Gerencia manutenções criadas pelo síndico e executadas pelo operacional

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');
const notificationService = require('./notificationService');

// Função para criar manutenção
// Recebe: condominiumId, userId, dados da manutenção
// Retorna: manutenção criada
const createMaintenance = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { maintenanceType, title, description, location, priority, scheduledDate, assignedTo, assetId } = data;

    // Validações
    if (!maintenanceType || !['PREVENTIVA', 'CORRETIVA'].includes(maintenanceType.toUpperCase())) {
      throw new Error('Tipo de manutenção inválido. Deve ser PREVENTIVA ou CORRETIVA');
    }

    if (!title || !title.trim()) {
      throw new Error('Título é obrigatório');
    }

    if (!description || !description.trim()) {
      throw new Error('Descrição é obrigatória');
    }

    if (!assignedTo) {
      throw new Error('Operacional responsável é obrigatório');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida que assignedTo é operacional do condomínio
    const assignedUserResult = await query(
      `SELECT u.id, u.condominium_id
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1 AND r.name = 'OPERACIONAL' AND u.condominium_id = $2 AND u.active = TRUE`,
      [assignedTo, condominiumId]
    );

    if (assignedUserResult.rows.length === 0) {
      throw new Error('Operacional não encontrado ou não pertence a este condomínio');
    }

    // Cria manutenção
    const result = await query(
      `INSERT INTO maintenances (
        condominium_id, maintenance_type, title, description, location, priority,
        scheduled_date, assigned_to, status, asset_id, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10)
       RETURNING *`,
      [
        condominiumId,
        maintenanceType.toUpperCase(),
        title.trim(),
        description.trim(),
        location || null,
        priority || 'NORMAL',
        scheduledDate || null,
        assignedTo,
        assetId || null,
        userId
      ]
    );

    const maintenance = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'MAINTENANCE',
      entityType: 'maintenances',
      entityId: maintenance.id,
      afterData: maintenance,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Cria notificação para o operacional
    await notificationService.createNotification(
      assignedTo,
      condominiumId,
      'Nova Manutenção Atribuída',
      `Uma nova manutenção ${maintenanceType.toLowerCase()} foi atribuída a você: ${title}`,
      'MAINTENANCE_ASSIGNED',
      'maintenances',
      maintenance.id
    );

    return maintenance;
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    throw error;
  }
};

// Função para listar manutenções
// Recebe: condominiumId, userId, filters (status, type, assignedTo)
// Retorna: array de manutenções
const listMaintenances = async (condominiumId, userId, filters = {}) => {
  try {
    const { status, maintenanceType, assignedTo, myMaintenances } = filters;

    let whereClause = 'WHERE m.condominium_id = $1';
    const params = [condominiumId];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND m.status = $${paramCount++}`;
      params.push(status);
    }

    if (maintenanceType) {
      whereClause += ` AND m.maintenance_type = $${paramCount++}`;
      params.push(maintenanceType);
    }

    if (assignedTo) {
      whereClause += ` AND m.assigned_to = $${paramCount++}`;
      params.push(assignedTo);
    }

    if (myMaintenances) {
      whereClause += ` AND m.assigned_to = $${paramCount++}`;
      params.push(userId);
    }

    const result = await query(
      `SELECT m.*,
              u1.full_name as assigned_to_name,
              u2.full_name as created_by_name,
              a.name as asset_name
       FROM maintenances m
       LEFT JOIN users u1 ON m.assigned_to = u1.id
       LEFT JOIN users u2 ON m.created_by = u2.id
       LEFT JOIN assets a ON m.asset_id = a.id
       ${whereClause}
       ORDER BY m.created_at DESC`,
      params
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao listar manutenções:', error);
    throw error;
  }
};

// Função para buscar manutenção por ID
// Recebe: maintenanceId, condominiumId
// Retorna: manutenção
const getMaintenanceById = async (maintenanceId, condominiumId) => {
  try {
    const result = await query(
      `SELECT m.*,
              u1.full_name as assigned_to_name,
              u2.full_name as created_by_name,
              a.name as asset_name
       FROM maintenances m
       LEFT JOIN users u1 ON m.assigned_to = u1.id
       LEFT JOIN users u2 ON m.created_by = u2.id
       LEFT JOIN assets a ON m.asset_id = a.id
       WHERE m.id = $1 AND m.condominium_id = $2`,
      [maintenanceId, condominiumId]
    );

    if (result.rows.length === 0) {
      throw new Error('Manutenção não encontrada');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar manutenção:', error);
    throw error;
  }
};

// Função para iniciar manutenção
// Recebe: maintenanceId, userId, condominiumId
// Retorna: manutenção atualizada
const startMaintenance = async (maintenanceId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca manutenção
    const maintenance = await getMaintenanceById(maintenanceId, condominiumId);

    if (maintenance.status !== 'PENDING') {
      throw new Error('Manutenção não está pendente');
    }

    if (maintenance.assigned_to !== userId) {
      throw new Error('Você não está atribuído a esta manutenção');
    }

    // Atualiza status
    const result = await query(
      `UPDATE maintenances
       SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND condominium_id = $2
       RETURNING *`,
      [maintenanceId, condominiumId]
    );

    const updated = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'MAINTENANCE',
      entityType: 'maintenances',
      entityId: maintenanceId,
      beforeData: maintenance,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica síndico
    if (maintenance.created_by) {
      await notificationService.createNotification(
        maintenance.created_by,
        condominiumId,
        'Manutenção Iniciada',
        `A manutenção "${maintenance.title}" foi iniciada pelo operacional`,
        'MAINTENANCE_STARTED',
        'maintenances',
        maintenanceId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao iniciar manutenção:', error);
    throw error;
  }
};

// Função para completar manutenção
// Recebe: maintenanceId, userId, condominiumId, dados de conclusão
// Retorna: manutenção atualizada
const completeMaintenance = async (maintenanceId, userId, condominiumId, data, ipAddress, userAgent) => {
  try {
    const { completionNotes, cost } = data;

    // Busca manutenção
    const maintenance = await getMaintenanceById(maintenanceId, condominiumId);

    if (maintenance.status === 'COMPLETED' || maintenance.status === 'CANCELLED') {
      throw new Error('Manutenção já foi finalizada');
    }

    if (maintenance.assigned_to !== userId) {
      throw new Error('Você não está atribuído a esta manutenção');
    }

    // Atualiza manutenção
    const result = await query(
      `UPDATE maintenances
       SET status = 'COMPLETED',
           completed_at = CURRENT_TIMESTAMP,
           completed_by = $1,
           completion_notes = $2,
           cost = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND condominium_id = $5
       RETURNING *`,
      [
        userId,
        completionNotes || null,
        cost ? parseFloat(cost) : null,
        maintenanceId,
        condominiumId
      ]
    );

    const updated = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'COMPLETE',
      module: 'MAINTENANCE',
      entityType: 'maintenances',
      entityId: maintenanceId,
      beforeData: maintenance,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica síndico
    if (maintenance.created_by) {
      await notificationService.createNotification(
        maintenance.created_by,
        condominiumId,
        'Manutenção Concluída',
        `A manutenção "${maintenance.title}" foi concluída pelo operacional`,
        'MAINTENANCE_COMPLETED',
        'maintenances',
        maintenanceId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao completar manutenção:', error);
    throw error;
  }
};

// Função para buscar estatísticas de manutenções para dashboard
// Recebe: condominiumId, userId (opcional - se fornecido, filtra por usuário)
// Retorna: estatísticas
const getMaintenanceStats = async (condominiumId, userId = null) => {
  try {
    let whereClause = 'WHERE condominium_id = $1';
    const params = [condominiumId];
    let paramCount = 2;

    if (userId) {
      whereClause += ` AND assigned_to = $${paramCount++}`;
      params.push(userId);
    }

    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        COUNT(*) FILTER (WHERE maintenance_type = 'PREVENTIVA') as preventiva,
        COUNT(*) FILTER (WHERE maintenance_type = 'CORRETIVA') as corretiva
       FROM maintenances
       ${whereClause}`,
      params
    );

    return {
      pending: parseInt(result.rows[0].pending) || 0,
      inProgress: parseInt(result.rows[0].in_progress) || 0,
      completed: parseInt(result.rows[0].completed) || 0,
      preventiva: parseInt(result.rows[0].preventiva) || 0,
      corretiva: parseInt(result.rows[0].corretiva) || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de manutenções:', error);
    throw error;
  }
};

module.exports = {
  createMaintenance,
  listMaintenances,
  getMaintenanceById,
  startMaintenance,
  completeMaintenance,
  getMaintenanceStats
};

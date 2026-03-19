// Service de Manutenções (Preventiva e Corretiva)
// Gerencia manutenções criadas pelo síndico e executadas pelo operacional

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');
const notificationService = require('./notificationService');
const { validateDate } = require('../utils/validators');

const ALLOWED_TYPES = ['PREVENTIVA', 'CORRETIVA'];
const ALLOWED_PRIORITIES = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'];
const STATUS = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada',
};
const ACTIVE_STATUSES = [STATUS.PENDENTE, STATUS.EM_ANDAMENTO];
const FINALIZED_STATUSES = [STATUS.CONCLUIDA, STATUS.CANCELADA];
const STATUS_TRANSITIONS = {
  [STATUS.PENDENTE]: [STATUS.EM_ANDAMENTO, STATUS.CANCELADA],
  [STATUS.EM_ANDAMENTO]: [STATUS.CONCLUIDA, STATUS.CANCELADA],
  [STATUS.CONCLUIDA]: [],
  [STATUS.CANCELADA]: [],
};
const STATUS_SYNONYMS = {
  PENDING: STATUS.PENDENTE,
  IN_PROGRESS: STATUS.EM_ANDAMENTO,
  COMPLETED: STATUS.CONCLUIDA,
  CANCELLED: STATUS.CANCELADA,
  PENDENTE: STATUS.PENDENTE,
  EM_ANDAMENTO: STATUS.EM_ANDAMENTO,
  CONCLUIDA: STATUS.CONCLUIDA,
  CANCELADA: STATUS.CANCELADA,
  DAR_BAIXA: STATUS.CONCLUIDA,
};

const createAppError = (message, statusCode = 400, code = 'VALIDATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const sanitizeText = (value, maxLength = 255) => {
  if (value === null || value === undefined) return null;
  const sanitized = String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!sanitized) return null;
  return sanitized.substring(0, maxLength);
};

const parseOptionalInt = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number.parseInt(value, 10);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const normalizeStatus = (value) => {
  if (!value && value !== 0) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalizedKey = raw.toUpperCase();
  return STATUS_SYNONYMS[normalizedKey] || raw.toLowerCase();
};

const isManagerRole = (roles = []) =>
  Array.isArray(roles) && roles.some((role) => role === 'SINDICO' || role === 'SUBSINDICO');

const normalizeMaintenanceData = (data = {}) => {
  const maintenanceType = sanitizeText(data.maintenanceType, 20);
  const title = sanitizeText(data.title, 255);
  const description = sanitizeText(data.description, 5000);
  const location = sanitizeText(data.location, 255);
  const priority = sanitizeText(data.priority, 20);
  const scheduledDate = sanitizeText(data.scheduledDate, 10);
  const assignedTo = parseOptionalInt(data.assignedTo);
  const assetId = parseOptionalInt(data.assetId);
  const idempotencyKey = sanitizeText(data.idempotencyKey, 120);

  return {
    maintenanceType: maintenanceType ? maintenanceType.toUpperCase() : null,
    title,
    description,
    location,
    priority: priority ? priority.toUpperCase() : 'NORMAL',
    scheduledDate,
    assignedTo,
    assetId,
    idempotencyKey,
  };
};

const validateScheduledDate = (scheduledDate) => {
  if (!scheduledDate) return;
  const dateValidation = validateDate(scheduledDate, {
    allowFuture: true,
    allowPast: true,
    fieldName: 'Data prevista',
    maxFutureDays: 3650,
  });
  if (!dateValidation.valid) {
    throw createAppError(dateValidation.error, 400, 'INVALID_SCHEDULED_DATE');
  }
};

const validateAssignedOperational = async (assignedTo, condominiumId) => {
  const assignedUserResult = await query(
    `SELECT u.id, u.condominium_id
     FROM users u
     INNER JOIN user_roles ur ON u.id = ur.user_id
     INNER JOIN roles r ON ur.role_id = r.id
     WHERE u.id = $1 AND r.name = 'OPERACIONAL' AND u.condominium_id = $2 AND u.active = TRUE`,
    [assignedTo, condominiumId]
  );
  if (assignedUserResult.rows.length === 0) {
    throw createAppError('Operacional não encontrado ou não pertence a este condomínio', 400, 'INVALID_ASSIGNED_TO');
  }
};

const ensureNoDuplicateActiveMaintenance = async (
  condominiumId,
  userId,
  title,
  scheduledDate,
  excludeId = null
) => {
  const params = [condominiumId, userId, title, scheduledDate || null];
  let where = `
    WHERE condominium_id = $1
      AND created_by = $2
      AND LOWER(title) = LOWER($3)
      AND scheduled_date IS NOT DISTINCT FROM $4::date
      AND status = ANY($5::text[])
  `;
  params.push(ACTIVE_STATUSES);
  if (excludeId) {
    where += ' AND id <> $6';
    params.push(excludeId);
  }
  const duplicateResult = await query(
    `SELECT id, title
     FROM maintenances
     ${where}
     LIMIT 1`,
    params
  );

  if (duplicateResult.rows.length > 0) {
    throw createAppError(
      'Já existe uma manutenção ativa com o mesmo título e data prevista para este usuário.',
      409,
      'DUPLICATE_MAINTENANCE'
    );
  }
};

// Função para criar manutenção
// Recebe: condominiumId, userId, dados da manutenção
// Retorna: manutenção criada
const createMaintenance = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const normalizedData = normalizeMaintenanceData(data);
    const {
      maintenanceType,
      title,
      description,
      location,
      priority,
      scheduledDate,
      assignedTo,
      assetId,
      idempotencyKey,
    } = normalizedData;

    // Validações
    if (!maintenanceType || !ALLOWED_TYPES.includes(maintenanceType)) {
      throw createAppError('Tipo de manutenção inválido. Deve ser PREVENTIVA ou CORRETIVA', 400, 'INVALID_MAINTENANCE_TYPE');
    }

    if (!title) {
      throw createAppError('Título é obrigatório', 400, 'TITLE_REQUIRED');
    }

    if (!description) {
      throw createAppError('Descrição é obrigatória', 400, 'DESCRIPTION_REQUIRED');
    }

    if (!assignedTo) {
      throw createAppError('Operacional responsável é obrigatório', 400, 'ASSIGNED_TO_REQUIRED');
    }

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      throw createAppError('Prioridade inválida', 400, 'INVALID_PRIORITY');
    }

    validateScheduledDate(scheduledDate);

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw createAppError('Usuário não pertence a este condomínio', 403, 'USER_NOT_IN_CONDOMINIUM');
    }

    await validateAssignedOperational(assignedTo, condominiumId);

    if (idempotencyKey) {
      const existingByKey = await query(
        `SELECT *
         FROM maintenances
         WHERE condominium_id = $1
           AND created_by = $2
           AND idempotency_key = $3
         LIMIT 1`,
        [condominiumId, userId, idempotencyKey]
      );
      if (existingByKey.rows.length > 0) {
        return existingByKey.rows[0];
      }
    }

    await ensureNoDuplicateActiveMaintenance(condominiumId, userId, title, scheduledDate);

    // Cria manutenção
    let result;
    try {
      result = await query(
      `INSERT INTO maintenances (
        condominium_id, maintenance_type, title, description, location, priority,
        scheduled_date, assigned_to, status, asset_id, created_by, idempotency_key
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente', $9, $10, $11)
       RETURNING *`,
      [
        condominiumId,
        maintenanceType,
        title,
        description,
        location || null,
        priority,
        scheduledDate || null,
        assignedTo,
        assetId || null,
        userId,
        idempotencyKey || null,
      ]
    );
    } catch (dbError) {
      if (dbError && dbError.code === '23505') {
        throw createAppError(
          'Já existe uma manutenção ativa igual ou esta requisição já foi processada.',
          409,
          'DUPLICATE_MAINTENANCE'
        );
      }
      throw dbError;
    }

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

const updateMaintenance = async (maintenanceId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const existing = await getMaintenanceById(maintenanceId, condominiumId);
    if (FINALIZED_STATUSES.includes(normalizeStatus(existing.status))) {
      throw createAppError('Não é possível editar uma manutenção finalizada', 409, 'MAINTENANCE_FINALIZED');
    }

    const normalizedData = normalizeMaintenanceData(data);
    const {
      maintenanceType,
      title,
      description,
      location,
      priority,
      scheduledDate,
      assignedTo,
      assetId,
    } = normalizedData;

    if (!maintenanceType || !ALLOWED_TYPES.includes(maintenanceType)) {
      throw createAppError('Tipo de manutenção inválido. Deve ser PREVENTIVA ou CORRETIVA', 400, 'INVALID_MAINTENANCE_TYPE');
    }
    if (!title) {
      throw createAppError('Título é obrigatório', 400, 'TITLE_REQUIRED');
    }
    if (!description) {
      throw createAppError('Descrição é obrigatória', 400, 'DESCRIPTION_REQUIRED');
    }
    if (!assignedTo) {
      throw createAppError('Operacional responsável é obrigatório', 400, 'ASSIGNED_TO_REQUIRED');
    }
    if (!ALLOWED_PRIORITIES.includes(priority)) {
      throw createAppError('Prioridade inválida', 400, 'INVALID_PRIORITY');
    }

    validateScheduledDate(scheduledDate);
    await validateAssignedOperational(assignedTo, condominiumId);
    await ensureNoDuplicateActiveMaintenance(
      condominiumId,
      existing.created_by || userId,
      title,
      scheduledDate,
      maintenanceId
    );

    const result = await query(
      `UPDATE maintenances
       SET maintenance_type = $1,
           title = $2,
           description = $3,
           location = $4,
           priority = $5,
           scheduled_date = $6,
           assigned_to = $7,
           asset_id = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND condominium_id = $10
       RETURNING *`,
      [
        maintenanceType,
        title,
        description,
        location || null,
        priority,
        scheduledDate || null,
        assignedTo,
        assetId || null,
        maintenanceId,
        condominiumId,
      ]
    );
    const updated = result.rows[0];

    await logAction({
      userId,
      condominiumId,
      action: 'UPDATE',
      module: 'MAINTENANCE',
      entityType: 'maintenances',
      entityId: maintenanceId,
      beforeData: existing,
      afterData: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    throw error;
  }
};

const deleteMaintenance = async (maintenanceId, condominiumId, userId, ipAddress, userAgent) => {
  try {
    const existing = await getMaintenanceById(maintenanceId, condominiumId);
    const result = await query(
      `DELETE FROM maintenances
       WHERE id = $1 AND condominium_id = $2
       RETURNING *`,
      [maintenanceId, condominiumId]
    );
    if (result.rows.length === 0) {
      throw createAppError('Manutenção não encontrada', 404, 'MAINTENANCE_NOT_FOUND');
    }

    await logAction({
      userId,
      condominiumId,
      action: 'DELETE',
      module: 'MAINTENANCE',
      entityType: 'maintenances',
      entityId: maintenanceId,
      beforeData: existing,
      afterData: null,
      ipAddress,
      userAgent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao excluir manutenção:', error);
    throw error;
  }
};

// Função para listar manutenções
// Recebe: condominiumId, userId, filters (status, type, assignedTo)
// Retorna: array de manutenções
const listMaintenances = async (condominiumId, userId, filters = {}) => {
  try {
    const { status, maintenanceType, assignedTo, myMaintenances } = filters;
    const normalizedStatus = normalizeStatus(status);

    let whereClause = 'WHERE m.condominium_id = $1';
    const params = [condominiumId];
    let paramCount = 2;

    if (normalizedStatus) {
      whereClause += ` AND m.status = $${paramCount++}`;
      params.push(normalizedStatus);
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
    return updateMaintenanceStatus(
      maintenanceId,
      userId,
      condominiumId,
      STATUS.EM_ANDAMENTO,
      {},
      ipAddress,
      userAgent,
      { actorRoles: ['OPERACIONAL'] }
    );
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
    return updateMaintenanceStatus(
      maintenanceId,
      userId,
      condominiumId,
      STATUS.CONCLUIDA,
      data,
      ipAddress,
      userAgent,
      { actorRoles: ['OPERACIONAL'] }
    );
  } catch (error) {
    console.error('Erro ao completar manutenção:', error);
    throw error;
  }
};

const updateMaintenanceStatus = async (
  maintenanceId,
  userId,
  condominiumId,
  nextStatusInput,
  data = {},
  ipAddress,
  userAgent,
  options = {}
) => {
  try {
    const nextStatus = normalizeStatus(nextStatusInput);
    if (!Object.values(STATUS).includes(nextStatus)) {
      throw createAppError('Status de manutenção inválido', 400, 'INVALID_STATUS');
    }

    const maintenance = await getMaintenanceById(maintenanceId, condominiumId);
    const currentStatus = normalizeStatus(maintenance.status);
    const actorRoles = options.actorRoles || [];
    const canManage = maintenance.assigned_to === userId || isManagerRole(actorRoles);

    if (!canManage) {
      throw createAppError('Você não tem permissão para alterar esta manutenção', 403, 'FORBIDDEN_STATUS_CHANGE');
    }

    if (currentStatus === nextStatus) {
      return maintenance;
    }

    const allowedNext = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(nextStatus)) {
      throw createAppError(
        `Transição de status inválida: ${currentStatus} -> ${nextStatus}`,
        409,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const completionNotes = sanitizeText(data.completionNotes, 4000);
    const costValue = data.cost !== undefined && data.cost !== null && data.cost !== ''
      ? Number.parseFloat(data.cost)
      : null;
    if (costValue !== null && Number.isNaN(costValue)) {
      throw createAppError('Custo inválido', 400, 'INVALID_COST');
    }

    const updateQueryByStatus = {
      [STATUS.EM_ANDAMENTO]: {
        sql: `UPDATE maintenances
              SET status = $1,
                  started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $2 AND condominium_id = $3
              RETURNING *`,
        params: [nextStatus, maintenanceId, condominiumId],
        action: 'START',
      },
      [STATUS.CONCLUIDA]: {
        sql: `UPDATE maintenances
              SET status = $1,
                  completed_at = CURRENT_TIMESTAMP,
                  completed_by = $2,
                  completion_notes = $3,
                  cost = $4,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $5 AND condominium_id = $6
              RETURNING *`,
        params: [nextStatus, userId, completionNotes, costValue, maintenanceId, condominiumId],
        action: 'COMPLETE',
      },
      [STATUS.CANCELADA]: {
        sql: `UPDATE maintenances
              SET status = $1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = $2 AND condominium_id = $3
              RETURNING *`,
        params: [nextStatus, maintenanceId, condominiumId],
        action: 'CANCEL',
      },
    };

    const updateDef = updateQueryByStatus[nextStatus];
    if (!updateDef) {
      throw createAppError('Status de destino não suportado', 400, 'UNSUPPORTED_STATUS');
    }

    const result = await query(updateDef.sql, updateDef.params);
    const updated = result.rows[0];

    await logAction({
      userId,
      condominiumId,
      action: updateDef.action,
      module: 'MAINTENANCE',
      entityType: 'maintenances',
      entityId: maintenanceId,
      beforeData: maintenance,
      afterData: updated,
      ipAddress,
      userAgent,
    });

    if (maintenance.created_by) {
      const messages = {
        [STATUS.EM_ANDAMENTO]: {
          title: 'Manutenção Iniciada',
          body: `A manutenção "${maintenance.title}" foi iniciada.`,
          type: 'MAINTENANCE_STARTED',
        },
        [STATUS.CONCLUIDA]: {
          title: 'Manutenção Concluída',
          body: `A manutenção "${maintenance.title}" foi concluída (dar baixa).`,
          type: 'MAINTENANCE_COMPLETED',
        },
        [STATUS.CANCELADA]: {
          title: 'Manutenção Cancelada',
          body: `A manutenção "${maintenance.title}" foi cancelada.`,
          type: 'MAINTENANCE_CANCELLED',
        },
      };
      const notification = messages[nextStatus];
      await notificationService.createNotification(
        maintenance.created_by,
        condominiumId,
        notification.title,
        notification.body,
        notification.type,
        'maintenances',
        maintenanceId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar status da manutenção:', error);
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
        COUNT(*) FILTER (WHERE status = 'pendente') as pending,
        COUNT(*) FILTER (WHERE status = 'em_andamento') as in_progress,
        COUNT(*) FILTER (WHERE status = 'concluida') as completed,
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
  updateMaintenance,
  deleteMaintenance,
  listMaintenances,
  getMaintenanceById,
  startMaintenance,
  completeMaintenance,
  updateMaintenanceStatus,
  getMaintenanceStats,
};

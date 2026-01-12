// Serviço de solicitações de orçamento
// REGRA: ADM solicita, Síndico aprova

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { createNotification } = require('./automationService');

// Função para criar solicitação de orçamento
// Recebe: data, files, userId, condominiumId
// Retorna: solicitação criada
const createBudgetRequest = async (data, files, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { title, description, estimatedValue, priority, relatedOccurrenceId, relatedTaskId } = data;

    if (!title || !description) {
      throw new Error('Título e descrição são obrigatórios');
    }

    // Cria solicitação
    const result = await query(
      `INSERT INTO budget_requests (
        condominium_id, requested_by, title, description, estimated_value,
        priority, related_occurrence_id, related_task_id, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
       RETURNING *`,
      [
        condominiumId,
        userId,
        title.trim(),
        description.trim(),
        estimatedValue ? parseFloat(estimatedValue) : null,
        priority || 'NORMAL',
        relatedOccurrenceId ? parseInt(relatedOccurrenceId) : null,
        relatedTaskId ? parseInt(relatedTaskId) : null,
      ]
    );

    const request = result.rows[0];

    // Se há arquivos, cria anexos
    if (files && files.length > 0) {
      for (const file of files) {
        await query(
          `INSERT INTO budget_request_attachments (
            budget_request_id, file_path, file_name, file_type, file_size, uploaded_by
          )
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            request.id,
            file.path,
            file.originalname,
            file.mimetype,
            file.size,
            userId,
          ]
        );
      }
    }

    // Notifica síndico
    const sindicoUsers = await query(
      `SELECT u.id FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE u.condominium_id = $1 AND (r.name = 'SINDICO' OR r.name = 'SUBSINDICO') AND u.active = TRUE`,
      [condominiumId]
    );

    for (const sindico of sindicoUsers.rows) {
      await createNotification(sindico.id, condominiumId, {
        title: `Nova solicitação de orçamento: ${title.trim()}`,
        message: `Uma nova solicitação de orçamento foi criada e aguarda sua aprovação.`,
        notificationType: 'BUDGET_REQUEST_PENDING',
        entityType: 'budget_requests',
        entityId: request.id,
      });
    }

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ADMINISTRATIVO',
      entityType: 'budget_requests',
      entityId: request.id,
      beforeData: null,
      afterData: request,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return request;
  } catch (error) {
    console.error('Erro ao criar solicitação de orçamento:', error);
    throw error;
  }
};

// Função para listar solicitações de orçamento
// Recebe: condominiumId, filtros
// Retorna: lista de solicitações
const listBudgetRequests = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT br.*, u.full_name as requested_by_name, u2.full_name as approved_by_name
      FROM budget_requests br
      LEFT JOIN users u ON br.requested_by = u.id
      LEFT JOIN users u2 ON br.approved_by = u2.id
      WHERE br.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND br.status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY br.created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar solicitações de orçamento:', error);
    throw error;
  }
};

// Função para obter anexos de uma solicitação
// Recebe: budgetRequestId
// Retorna: lista de anexos
const getBudgetRequestAttachments = async (budgetRequestId) => {
  try {
    const result = await query(
      `SELECT * FROM budget_request_attachments
       WHERE budget_request_id = $1
       ORDER BY created_at ASC`,
      [budgetRequestId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar anexos:', error);
    throw error;
  }
};

module.exports = {
  createBudgetRequest,
  listBudgetRequests,
  getBudgetRequestAttachments,
};

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

    // Cria solicitação com status PENDING_FINANCEIRO
    const result = await query(
      `INSERT INTO budget_requests (
        condominium_id, requested_by, title, description, estimated_value,
        priority, related_occurrence_id, related_task_id, status, financeiro_reviewed
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_FINANCEIRO', FALSE)
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

    // Notifica financeiro (novo fluxo)
    const notificationService = require('./notificationService');
    await notificationService.createNotificationForRole(
      'FINANCEIRO',
      condominiumId,
      'Nova Solicitação de Orçamento',
      `Uma nova solicitação de orçamento foi criada e aguarda sua análise: ${title.trim()}`,
      'BUDGET_PENDING_FINANCEIRO',
      'budget_requests',
      request.id
    );

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

    if (filters.requestedBy) {
      sql += ` AND br.requested_by = $${paramCount++}`;
      params.push(filters.requestedBy);
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

// Função para financeiro revisar orçamento
// Recebe: budgetRequestId, userId, condominiumId, financeiroNotes, costCenterId
// Retorna: orçamento atualizado
const reviewByFinanceiro = async (budgetRequestId, userId, condominiumId, data, ipAddress, userAgent) => {
  try {
    const { financeiroNotes, costCenterId } = data;

    // Busca orçamento
    const requestResult = await query(
      `SELECT * FROM budget_requests WHERE id = $1 AND condominium_id = $2`,
      [budgetRequestId, condominiumId]
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Solicitação de orçamento não encontrada');
    }

    const request = requestResult.rows[0];

    if (request.status !== 'PENDING_FINANCEIRO') {
      throw new Error('Orçamento não está aguardando análise do financeiro');
    }

    // Atualiza orçamento
    const result = await query(
      `UPDATE budget_requests
       SET financeiro_reviewed = TRUE,
           financeiro_reviewed_by = $1,
           financeiro_reviewed_at = CURRENT_TIMESTAMP,
           financeiro_notes = $2,
           status = 'PENDING_SINDICO'
       WHERE id = $3 AND condominium_id = $4
       RETURNING *`,
      [userId, financeiroNotes || null, budgetRequestId, condominiumId]
    );

    const updated = result.rows[0];

    // Log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'budget_requests',
      entityId: budgetRequestId,
      beforeData: request,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica síndico
    const notificationService = require('./notificationService');
    await notificationService.createNotificationForRole(
      'SINDICO',
      condominiumId,
      'Orçamento Aguardando Aprovação',
      `Uma solicitação de orçamento foi revisada pelo financeiro e aguarda sua aprovação: ${request.title}`,
      'BUDGET_PENDING_SINDICO',
      'budget_requests',
      budgetRequestId
    );

    return updated;
  } catch (error) {
    console.error('Erro ao revisar orçamento pelo financeiro:', error);
    throw error;
  }
};

// Função para síndico aprovar/rejeitar orçamento
// Recebe: budgetRequestId, userId, condominiumId, action, budgetApprovedAmount, sindicoNotes, rejectionReason
// Retorna: orçamento atualizado
const approveOrRejectBySindico = async (budgetRequestId, userId, condominiumId, action, data, ipAddress, userAgent) => {
  try {
    const { budgetApprovedAmount, sindicoNotes, rejectionReason } = data;

    // Busca orçamento
    const requestResult = await query(
      `SELECT * FROM budget_requests WHERE id = $1 AND condominium_id = $2`,
      [budgetRequestId, condominiumId]
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Solicitação de orçamento não encontrada');
    }

    const request = requestResult.rows[0];

    if (request.status !== 'PENDING_SINDICO') {
      throw new Error('Orçamento não está aguardando aprovação do síndico');
    }

    let newStatus, updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (action === 'APPROVE') {
      if (!budgetApprovedAmount) {
        throw new Error('Valor aprovado é obrigatório');
      }

      newStatus = 'APPROVED';
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(newStatus);
      updateFields.push(`approved_by = $${paramCount++}`);
      updateValues.push(userId);
      updateFields.push(`approved_at = CURRENT_TIMESTAMP`);
      updateFields.push(`budget_approved_amount = $${paramCount++}`);
      updateValues.push(parseFloat(budgetApprovedAmount));
      if (sindicoNotes) {
        updateFields.push(`sindico_notes = $${paramCount++}`);
        updateValues.push(sindicoNotes.trim());
      }
    } else if (action === 'REJECT') {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Motivo da rejeição é obrigatório');
      }

      newStatus = 'REJECTED';
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(newStatus);
      updateFields.push(`approved_by = $${paramCount++}`);
      updateValues.push(userId);
      updateFields.push(`approved_at = CURRENT_TIMESTAMP`);
      updateFields.push(`sindico_notes = $${paramCount++}`);
      updateValues.push(rejectionReason.trim());
    } else {
      throw new Error('Ação inválida. Deve ser APPROVE ou REJECT');
    }

    updateValues.push(budgetRequestId, condominiumId);

    // Atualiza orçamento
    const result = await query(
      `UPDATE budget_requests
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND condominium_id = $${paramCount++}
       RETURNING *`,
      updateValues
    );

    const updated = result.rows[0];

    // Log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: action === 'APPROVE' ? 'APPROVE' : 'REJECT',
      module: 'SINDICO',
      entityType: 'budget_requests',
      entityId: budgetRequestId,
      beforeData: request,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica financeiro
    const notificationService = require('./notificationService');
    if (action === 'APPROVE') {
      await notificationService.createNotificationForRole(
        'FINANCEIRO',
        condominiumId,
        'Orçamento Aprovado',
        `O orçamento "${request.title}" foi aprovado pelo síndico. Valor aprovado: R$ ${budgetApprovedAmount}`,
        'BUDGET_APPROVED',
        'budget_requests',
        budgetRequestId
      );
    } else {
      await notificationService.createNotificationForRole(
        'FINANCEIRO',
        condominiumId,
        'Orçamento Rejeitado',
        `O orçamento "${request.title}" foi rejeitado pelo síndico. Motivo: ${rejectionReason.trim()}`,
        'BUDGET_REJECTED',
        'budget_requests',
        budgetRequestId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao aprovar/rejeitar orçamento:', error);
    throw error;
  }
};

// Função para financeiro liberar orçamento para operacional
// Recebe: budgetRequestId, userId, condominiumId, action (RELEASE ou RETURN)
// Retorna: orçamento atualizado
const releaseOrReturnByFinanceiro = async (budgetRequestId, userId, condominiumId, action, financeiroNotes, ipAddress, userAgent) => {
  try {
    // Busca orçamento
    const requestResult = await query(
      `SELECT * FROM budget_requests WHERE id = $1 AND condominium_id = $2`,
      [budgetRequestId, condominiumId]
    );

    if (requestResult.rows.length === 0) {
      throw new Error('Solicitação de orçamento não encontrada');
    }

    const request = requestResult.rows[0];

    if (request.status !== 'APPROVED') {
      throw new Error('Orçamento precisa estar aprovado para ser liberado');
    }

    let updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (action === 'RELEASE') {
      // Libera para operacional
      updateFields.push(`released_to_operational = TRUE`);
      updateFields.push(`released_at = CURRENT_TIMESTAMP`);
      updateFields.push(`released_by = $${paramCount++}`);
      updateValues.push(userId);
      updateFields.push(`status = 'LIBERATED'`);
      if (financeiroNotes) {
        updateFields.push(`financeiro_notes = COALESCE(financeiro_notes, '') || $${paramCount++}`);
        updateValues.push(`\n\nNota adicional: ${financeiroNotes.trim()}`);
      }
    } else if (action === 'RETURN') {
      // Retorna para síndico
      if (!financeiroNotes || !financeiroNotes.trim()) {
        throw new Error('Observações são obrigatórias ao retornar para síndico');
      }
      updateFields.push(`status = 'PENDING_SINDICO'`);
      updateFields.push(`financeiro_notes = COALESCE(financeiro_notes, '') || $${paramCount++}`);
      updateValues.push(`\n\nRetornado para revisão: ${financeiroNotes.trim()}`);
    } else {
      throw new Error('Ação inválida. Deve ser RELEASE ou RETURN');
    }

    updateValues.push(budgetRequestId, condominiumId);

    // Atualiza orçamento
    const result = await query(
      `UPDATE budget_requests
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND condominium_id = $${paramCount++}
       RETURNING *`,
      updateValues
    );

    const updated = result.rows[0];

    // Log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: action === 'RELEASE' ? 'RELEASE' : 'RETURN',
      module: 'FINANCIAL',
      entityType: 'budget_requests',
      entityId: budgetRequestId,
      beforeData: request,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica
    const notificationService = require('./notificationService');
    if (action === 'RELEASE') {
      // Notifica operacional que criou
      if (request.requested_by) {
        await notificationService.createNotification(
          request.requested_by,
          condominiumId,
          'Orçamento Liberado',
          `O orçamento "${request.title}" foi liberado. Valor aprovado: R$ ${request.budget_approved_amount}`,
          'BUDGET_LIBERATED',
          'budget_requests',
          budgetRequestId
        );
      }
    } else {
      // Notifica síndico
      await notificationService.createNotificationForRole(
        'SINDICO',
        condominiumId,
        'Orçamento Retornado para Revisão',
        `O orçamento "${request.title}" foi retornado pelo financeiro para revisão`,
        'BUDGET_RETURNED',
        'budget_requests',
        budgetRequestId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao liberar/retornar orçamento:', error);
    throw error;
  }
};

// Função para listar orçamentos por status
const listBudgetRequestsByStatus = async (condominiumId, status) => {
  try {
    const result = await query(
      `SELECT br.*, u.full_name as requested_by_name, u2.full_name as approved_by_name, u3.full_name as financeiro_reviewed_by_name
       FROM budget_requests br
       LEFT JOIN users u ON br.requested_by = u.id
       LEFT JOIN users u2 ON br.approved_by = u2.id
       LEFT JOIN users u3 ON br.financeiro_reviewed_by = u3.id
       WHERE br.condominium_id = $1 AND br.status = $2
       ORDER BY br.created_at DESC`,
      [condominiumId, status]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao listar orçamentos por status:', error);
    throw error;
  }
};

module.exports = {
  createBudgetRequest,
  listBudgetRequests,
  getBudgetRequestAttachments,
  reviewByFinanceiro,
  approveOrRejectBySindico,
  releaseOrReturnByFinanceiro,
  listBudgetRequestsByStatus,
};

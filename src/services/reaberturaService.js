// Serviço de reabertura
// Permite reabrir ocorrências, tarefas e despesas rejeitadas
// REGRA: Toda reabertura gera log especial

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { DEFAULT_DESPESA_CATEGORY } = require('../constants/financialCategories');

// Função para reabrir ocorrência
// REGRA: Apenas Síndico pode reabrir ocorrências
// Recebe: occurrenceId, userId, condominiumId, reason
// Retorna: ocorrência atualizada
const reopenOccurrence = async (occurrenceId, userId, condominiumId, reason, ipAddress, userAgent) => {
  try {
    // Busca ocorrência atual
    const occurrenceResult = await query(
      `SELECT * FROM occurrences 
       WHERE id = $1 AND condominium_id = $2`,
      [occurrenceId, condominiumId]
    );

    if (occurrenceResult.rows.length === 0) {
      throw new Error('Ocorrência não encontrada');
    }

    const occurrence = occurrenceResult.rows[0];

    // Verifica se está fechada (RESOLVIDA ou ENCERRADA)
    if (occurrence.status !== 'RESOLVIDA' && occurrence.status !== 'ENCERRADA') {
      throw new Error('Apenas ocorrências resolvidas ou encerradas podem ser reabertas');
    }

    // Verifica se já foi reaberta
    if (occurrence.reopened) {
      throw new Error('Ocorrência já foi reaberta anteriormente');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Motivo da reabertura é obrigatório');
    }

    // Atualiza ocorrência
    const updateResult = await query(
      `UPDATE occurrences 
       SET status = 'ABERTA', reopened = TRUE, reopened_at = CURRENT_TIMESTAMP,
           reopened_by = $1, reopening_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [userId, reason.trim(), occurrenceId]
    );

    const updated = updateResult.rows[0];

    // Log especial de reabertura
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'REOPEN',
      module: 'OCCURRENCE',
      entityType: 'occurrences',
      entityId: occurrenceId,
      beforeData: occurrence,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao reabrir ocorrência:', error);
    throw error;
  }
};

// Função para reabrir tarefa
// REGRA: Administrativo ou Síndico pode reabrir tarefas
// Recebe: taskId, userId, condominiumId, reason
// Retorna: tarefa atualizada
const reopenTask = async (taskId, userId, condominiumId, reason, ipAddress, userAgent) => {
  try {
    // Busca tarefa atual
    const taskResult = await query(
      `SELECT * FROM tasks 
       WHERE id = $1 AND condominium_id = $2`,
      [taskId, condominiumId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Tarefa não encontrada');
    }

    const task = taskResult.rows[0];

    // REGRA: Tarefa CONCLUÍDA não pode ser reaberta / enviada de volta
    if (task.status === 'COMPLETED') {
      throw new Error('Tarefa concluída não pode ser reaberta nem enviada de volta.');
    }

    // Apenas tarefas canceladas podem ser reabertas
    if (task.status !== 'CANCELLED') {
      throw new Error('Apenas tarefas canceladas podem ser reabertas');
    }

    // Verifica se já foi reaberta
    if (task.reopened) {
      throw new Error('Tarefa já foi reaberta anteriormente');
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Motivo da reabertura é obrigatório');
    }

    // Atualiza tarefa
    const updateResult = await query(
      `UPDATE tasks 
       SET status = 'PENDING', reopened = TRUE, reopened_at = CURRENT_TIMESTAMP,
           reopened_by = $1, reopening_reason = $2, completed_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [userId, reason.trim(), taskId]
    );

    const updated = updateResult.rows[0];

    // Log especial de reabertura
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'REOPEN',
      module: 'TASK',
      entityType: 'tasks',
      entityId: taskId,
      beforeData: task,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao reabrir tarefa:', error);
    throw error;
  }
};

// Função para criar nova despesa a partir de uma rejeitada
// REGRA: Financeiro cria nova, Síndico aprova
// Na prática, não "reabre" a despesa rejeitada, mas cria uma nova vinculada
// Recebe: rejectedExitId, data, userId, condominiumId, reason
// Retorna: nova despesa criada
const reopenRejectedExpense = async (rejectedExitId, data, userId, condominiumId, reason, ipAddress, userAgent) => {
  try {
    // Busca despesa rejeitada
    const rejectedResult = await query(
      `SELECT * FROM financial_exits 
       WHERE id = $1 AND condominium_id = $2 AND payment_status = 'REJECTED'`,
      [rejectedExitId, condominiumId]
    );

    if (rejectedResult.rows.length === 0) {
      throw new Error('Despesa rejeitada não encontrada');
    }

    const rejected = rejectedResult.rows[0];

    if (!reason || reason.trim() === '') {
      throw new Error('Motivo da reabertura é obrigatório');
    }

    const { description, amount, exitDate, costCenterId, category, billId, requiresApproval, approvalLimit } = data;

    if (!description || !amount || !exitDate) {
      throw new Error('Descrição, valor e data são obrigatórios');
    }

    const amountValue = parseFloat(amount);
    const limitValue = approvalLimit ? parseFloat(approvalLimit) : 1000.00;

    // Se requer aprovação e valor é maior que o limite, cria aprovação pendente
    const needsApproval = requiresApproval && amountValue > limitValue;
    const paymentStatus = needsApproval ? 'PENDING' : 'APPROVED';

    // Cria nova despesa vinculada à rejeitada
    const result = await query(
      `INSERT INTO financial_exits (
        condominium_id, description, amount, exit_date, cost_center_id, category, bill_id,
        requires_approval, approval_limit, payment_status, reopened_from_id, reopened, reopened_at,
        reopened_by, reopening_reason, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, CURRENT_TIMESTAMP, $12, $13, $12)
       RETURNING *`,
      [
        condominiumId,
        description.trim(),
        amountValue,
        exitDate,
        costCenterId || null,
        category || DEFAULT_DESPESA_CATEGORY,
        billId || null,
        requiresApproval || false,
        limitValue,
        paymentStatus,
        rejectedExitId,
        userId,
        reason.trim(),
      ]
    );

    const newExit = result.rows[0];

    // Se precisa de aprovação, cria registro na tabela approvals
    if (needsApproval) {
      await query(
        `INSERT INTO approvals (condominium_id, approval_type, entity_type, entity_id, requested_by, requested_amount, description, status)
         VALUES ($1, 'FINANCIAL_EXIT', 'financial_exits', $2, $3, $4, $5, 'PENDING')`,
        [condominiumId, newExit.id, userId, amountValue, description.trim()]
      );
    }

    // Log especial de reabertura
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'REOPEN',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: newExit.id,
      beforeData: { rejected_exit_id: rejectedExitId, rejected_exit: rejected },
      afterData: newExit,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return newExit;
  } catch (error) {
    console.error('Erro ao reabrir despesa rejeitada:', error);
    throw error;
  }
};

module.exports = {
  reopenOccurrence,
  reopenTask,
  reopenRejectedExpense,
};

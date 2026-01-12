// Service do módulo FINANCEIRO
// Contém lógica de negócio para gestão financeira
// Acesso: FINANCEIRO, SINDICO

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateFinancialAmount, validateDate } = require('../utils/validators');
const { validateCondominiumOwnership, validateUserBelongsToCondominium } = require('../utils/queryHelper');

// Função para criar saída financeira
// Recebe: condominiumId, userId, dados da saída
// Retorna: saída criada
const createExit = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { description, amount, exitDate, costCenterId, category, billId, requiresApproval, approvalLimit, isRecurring, recurrenceType, isVariable, averageAmount } = data;

    // Validações obrigatórias
    if (!description || !description.trim()) {
      throw new Error('Descrição é obrigatória');
    }

    if (!amount || !exitDate) {
      throw new Error('Valor e data são obrigatórios');
    }

    // Valida valor financeiro (não pode ser negativo, zero, ou muito grande)
    const amountValidation = validateFinancialAmount(amount, {
      allowZero: false,
      allowNegative: false,
      maxValue: 10000000,
      fieldName: 'Valor da saída'
    });

    if (!amountValidation.valid) {
      throw new Error(amountValidation.error);
    }

    const amountValue = amountValidation.value;

    // Valida data (não pode ser muito futura)
    const dateValidation = validateDate(exitDate, {
      allowFuture: true,
      maxFutureDays: 365,
      allowPast: true,
      fieldName: 'Data da saída'
    });

    if (!dateValidation.valid) {
      throw new Error(dateValidation.error);
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida approval_limit se fornecido
    let limitValue = approvalLimit ? parseFloat(approvalLimit) : 1000.00;
    if (approvalLimit) {
      const limitValidation = validateFinancialAmount(approvalLimit, {
        allowZero: false,
        allowNegative: false,
        maxValue: 10000000,
        fieldName: 'Limite de aprovação'
      });

      if (!limitValidation.valid) {
        throw new Error(limitValidation.error);
      }

      limitValue = limitValidation.value;
    }

    // Se requer aprovação e valor é maior que o limite, cria aprovação pendente
    const needsApproval = requiresApproval && amountValue > limitValue;
    const paymentStatus = needsApproval ? 'PENDING' : 'APPROVED';

    const result = await query(
      `INSERT INTO financial_exits (condominium_id, description, amount, exit_date, cost_center_id, category, bill_id, requires_approval, approval_limit, payment_status, created_by, is_recurring, recurrence_type, is_variable, average_amount, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 1)
       RETURNING *`,
      [
        condominiumId, 
        description.trim(), 
        amountValue, 
        exitDate, 
        costCenterId || null, 
        category || 'OUTRA', 
        billId || null,
        requiresApproval || false,
        limitValue,
        paymentStatus,
        userId,
        isRecurring || false,
        recurrenceType || 'UNIQUE',
        isVariable || false,
        averageAmount || null
      ]
    );

    const exit = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exit.id,
      beforeData: null,
      afterData: exit,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return exit;
  } catch (error) {
    console.error('Erro ao criar saída financeira:', error);
    throw error;
  }
};

// Função para atualizar saída financeira
// Recebe: exitId, condominiumId, userId, dados atualizados
// Retorna: saída atualizada
// REGRA: Não pode alterar amount ou approval_limit após aprovação (exceto SINDICO)
const updateExit = async (exitId, condominiumId, userId, data, userRoles, ipAddress, userAgent) => {
  try {
    // Busca saída atual
    const currentResult = await query(
      `SELECT * FROM financial_exits WHERE id = $1 AND condominium_id = $2`,
      [exitId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Saída não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida ownership
    const owns = await validateCondominiumOwnership('financial_exits', exitId, condominiumId);
    if (!owns) {
      throw new Error('Saída não pertence a este condomínio');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Bloqueia edição se já está paga
    if (current.payment_status === 'PAID') {
      throw new Error('Saída já foi paga e não pode ser editada');
    }

    // Valida lock otimista (version)
    if (data.version !== undefined && data.version !== current.version) {
      throw new Error('Saída foi modificada por outro usuário. Recarregue a página e tente novamente.');
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Validações de campos que podem ser alterados
    if (data.description !== undefined) {
      if (!data.description || !data.description.trim()) {
        throw new Error('Descrição não pode ser vazia');
      }
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(data.description.trim());
    }

    if (data.amount !== undefined) {
      // SINDICO/SUBSINDICO pode alterar amount mesmo após aprovação
      const canChangeAmount = userRoles.includes('SINDICO') || userRoles.includes('SUBSINDICO');
      
      if (current.payment_status === 'APPROVED' && !canChangeAmount) {
        throw new Error('Valor não pode ser alterado após aprovação. Apenas síndico pode alterar.');
      }

      const amountValidation = validateFinancialAmount(data.amount, {
        allowZero: false,
        allowNegative: false,
        maxValue: 10000000,
        fieldName: 'Valor da saída'
      });

      if (!amountValidation.valid) {
        throw new Error(amountValidation.error);
      }

      updateFields.push(`amount = $${paramCount++}`);
      updateValues.push(amountValidation.value);
    }

    if (data.exitDate !== undefined) {
      const dateValidation = validateDate(data.exitDate, {
        allowFuture: true,
        maxFutureDays: 365,
        allowPast: true,
        fieldName: 'Data da saída'
      });

      if (!dateValidation.valid) {
        throw new Error(dateValidation.error);
      }

      updateFields.push(`exit_date = $${paramCount++}`);
      updateValues.push(data.exitDate);
    }

    // approval_limit não pode ser alterado após criação (mesmo por SINDICO)
    if (data.approvalLimit !== undefined && current.payment_status === 'PENDING') {
      // Só pode alterar se ainda está pendente
      const limitValidation = validateFinancialAmount(data.approvalLimit, {
        allowZero: false,
        allowNegative: false,
        maxValue: 10000000,
        fieldName: 'Limite de aprovação'
      });

      if (!limitValidation.valid) {
        throw new Error(limitValidation.error);
      }

      updateFields.push(`approval_limit = $${paramCount++}`);
      updateValues.push(limitValidation.value);
    } else if (data.approvalLimit !== undefined) {
      throw new Error('Limite de aprovação não pode ser alterado após criação de saída pendente');
    }

    if (data.category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      updateValues.push(data.category);
    }

    if (data.costCenterId !== undefined) {
      updateFields.push(`cost_center_id = $${paramCount++}`);
      updateValues.push(data.costCenterId || null);
    }

    if (data.billId !== undefined) {
      updateFields.push(`bill_id = $${paramCount++}`);
      updateValues.push(data.billId || null);
    }

    // Incrementa version para lock otimista
    updateFields.push(`version = version + 1`);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 2) {
      throw new Error('Nenhum campo para atualizar');
    }

    updateValues.push(exitId, condominiumId);

    const updateResult = await query(
      `UPDATE financial_exits 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND condominium_id = $${paramCount++} AND version = $${paramCount++}
       RETURNING *`,
      [...updateValues, current.version]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída foi modificada por outro usuário. Recarregue a página e tente novamente.');
    }

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar saída financeira:', error);
    throw error;
  }
};

// Função para aprovar saída financeira (com controle de concorrência)
// Recebe: exitId, condominiumId, userId, userRoles
// Retorna: saída atualizada
const approveExit = async (exitId, condominiumId, userId, userRoles, ipAddress, userAgent) => {
  try {
    // Busca saída atual com lock (SELECT FOR UPDATE)
    const currentResult = await query(
      `SELECT * FROM financial_exits 
       WHERE id = $1 AND condominium_id = $2 
       FOR UPDATE`,
      [exitId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Saída não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida ownership
    const owns = await validateCondominiumOwnership('financial_exits', exitId, condominiumId);
    if (!owns) {
      throw new Error('Saída não pertence a este condomínio');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida estado atual
    if (current.payment_status !== 'PENDING') {
      throw new Error('Saída já foi processada');
    }

    // Valida permissão usando permissionService
    const permissionService = require('./permissionService');
    const limitValue = current.approval_limit || 1000.00;
    const isHighValue = parseFloat(current.amount) > limitValue;

    if (isHighValue) {
      const canApprove = await permissionService.hasPermission(userId, 'financial_exits', 'approve_high_value');
      if (!canApprove) {
        throw new Error('Você não tem permissão para aprovar valores acima do limite');
      }
    } else {
      const canApprove = await permissionService.hasPermission(userId, 'financial_exits', 'approve');
      if (!canApprove) {
        throw new Error('Você não tem permissão para aprovar esta saída');
      }
    }

    // Atualiza com lock otimista
    const updateResult = await query(
      `UPDATE financial_exits 
       SET payment_status = 'APPROVED', 
           approved_by = $1, 
           approved_at = CURRENT_TIMESTAMP,
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND condominium_id = $3 AND version = $4 AND payment_status = 'PENDING'
       RETURNING *`,
      [userId, exitId, condominiumId, current.version]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída foi modificada por outro usuário. Recarregue a página e tente novamente.');
    }

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'APPROVE',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao aprovar saída financeira:', error);
    throw error;
  }
};

// Função para marcar saída como paga (com validação de comprovante)
// Recebe: exitId, condominiumId, userId, dados do pagamento
// Retorna: saída atualizada
const markExitAsPaid = async (exitId, condominiumId, userId, paymentData, ipAddress, userAgent) => {
  try {
    const { paymentReceiptPdfPath, paymentDetails, paymentMethod, paymentNotes } = paymentData || {};

    // Busca saída atual
    const currentResult = await query(
      `SELECT * FROM financial_exits WHERE id = $1 AND condominium_id = $2`,
      [exitId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Saída não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida ownership
    const owns = await validateCondominiumOwnership('financial_exits', exitId, condominiumId);
    if (!owns) {
      throw new Error('Saída não pertence a este condomínio');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida transição de estado
    const stateValidator = require('../utils/stateValidator');
    const transitionValidation = await stateValidator.validateAndTransition(
      userId,
      'financial_exits',
      current.payment_status,
      'PAID',
      exitId
    );

    if (!transitionValidation.valid) {
      throw new Error(transitionValidation.error || 'Transição de estado não permitida');
    }

    // Valida que está aprovada
    if (current.payment_status !== 'APPROVED') {
      throw new Error('Saída deve estar aprovada antes de ser marcada como paga');
    }

    // Valida que tem comprovante
    if (!paymentReceiptPdfPath || !paymentReceiptPdfPath.trim()) {
      throw new Error('Comprovante de pagamento é obrigatório');
    }

    // Atualiza com lock otimista
    const updateResult = await query(
      `UPDATE financial_exits 
       SET payment_status = 'PAID', 
           paid_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP,
           version = version + 1,
           payment_receipt_pdf_path = $1,
           payment_details = $2,
           payment_method = $3,
           payment_notes = $4
       WHERE id = $5 AND condominium_id = $6 AND version = $7 AND payment_status = 'APPROVED'
       RETURNING *`,
      [
        paymentReceiptPdfPath,
        paymentDetails || null,
        paymentMethod || null,
        paymentNotes || null,
        exitId,
        condominiumId,
        current.version
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída foi modificada por outro usuário. Recarregue a página e tente novamente.');
    }

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'PAY',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao marcar saída como paga:', error);
    throw error;
  }
};

// Função para listar saídas financeiras
// Recebe: condominiumId, filtros
// Retorna: lista de saídas
const listExits = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT fe.*, cc.name as cost_center_name, b.name as bill_name, u.full_name as created_by_name
      FROM financial_exits fe
      LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id AND cc.condominium_id = $1
      LEFT JOIN bills b ON fe.bill_id = b.id AND b.condominium_id = $1
      LEFT JOIN users u ON fe.created_by = u.id
      WHERE fe.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.paymentStatus) {
      sql += ` AND fe.payment_status = $${paramCount++}`;
      params.push(filters.paymentStatus);
    }

    if (filters.category) {
      sql += ` AND fe.category = $${paramCount++}`;
      params.push(filters.category);
    }

    if (filters.startDate) {
      sql += ` AND fe.exit_date >= $${paramCount++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND fe.exit_date <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY fe.created_at DESC LIMIT $${paramCount}`;
    params.push(filters.limit || 100);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar saídas financeiras:', error);
    throw error;
  }
};

module.exports = {
  createExit,
  updateExit,
  approveExit,
  markExitAsPaid,
  listExits,
};

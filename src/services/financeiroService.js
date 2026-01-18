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
      `INSERT INTO financial_exits (condominium_id, description, amount, exit_date, cost_center_id, category, bill_id, requires_approval, approval_limit, payment_status, created_by, is_recurring, recurrence_type, is_variable, average_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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

    // Lock otimista removido - coluna version não existe

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

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      throw new Error('Nenhum campo para atualizar');
    }

    updateValues.push(exitId, condominiumId);

    const updateResult = await query(
      `UPDATE financial_exits 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND condominium_id = $${paramCount++}
       RETURNING *`,
      updateValues
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída não encontrada ou não pertence a este condomínio');
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

    // VALIDAÇÃO DE SALDO DISPONÍVEL
    const exitAmount = parseFloat(current.amount);
    
    // Calcular saldo disponível
    const entriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_entries 
       WHERE condominium_id = $1 AND received = TRUE`,
      [condominiumId]
    );
    const totalEntries = parseFloat(entriesResult.rows[0].total);
    
    const exitsPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PAID'`,
      [condominiumId]
    );
    const totalExitsPaid = parseFloat(exitsPaidResult.rows[0].total);
    
    // Saídas aprovadas mas não pagas (incluindo a atual se já estiver aprovada)
    const exitsApprovedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_exits 
       WHERE condominium_id = $1 
         AND payment_status = 'APPROVED' 
         AND id != $2`,
      [condominiumId, exitId]
    );
    const totalExitsApproved = parseFloat(exitsApprovedResult.rows[0].total);
    
    const availableBalance = totalEntries - totalExitsPaid - totalExitsApproved;
    
    // Validar se há saldo suficiente
    if (exitAmount > availableBalance) {
      const deficit = exitAmount - availableBalance;
      const error = new Error('EXIT_INSUFFICIENT_BALANCE');
      error.details = {
        availableBalance: availableBalance.toFixed(2),
        exitAmount: exitAmount.toFixed(2),
        deficit: deficit.toFixed(2)
      };
      throw error;
    }

    // Verificar se requer multi-aprovação
    const multiApprovalService = require('./multiApprovalService');
    const requiresMulti = await multiApprovalService.requiresMultiApproval(
      'financial_exits',
      exitId,
      condominiumId
    );
    
    if (requiresMulti) {
      // Buscar ou criar multi-aprovação
      let multiApproval = await multiApprovalService.getMultiApproval(
        'financial_exits',
        exitId,
        condominiumId
      );
      
      if (!multiApproval) {
        const requiredApprovals = multiApprovalService.getRequiredApprovals('financial_exits', exitAmount);
        multiApproval = await multiApprovalService.createMultiApproval(
          'financial_exits',
          exitId,
          condominiumId,
          requiredApprovals
        );
      }
      
      // Votar na multi-aprovação
      const voteResult = await multiApprovalService.vote(
        multiApproval.id,
        userId,
        'APPROVE',
        null,
        ipAddress,
        userAgent
      );
      
      // Se ainda não atingiu aprovações necessárias, retornar status pendente
      if (voteResult.status === 'PENDING') {
        return {
          ...current,
          payment_status: 'PENDING',
          message: `Aprovação registrada. Aguardando ${voteResult.remainingApprovals} aprovação(ões) adicional(is).`,
          multi_approval: voteResult
        };
      }
      
      // Se foi rejeitada
      if (voteResult.status === 'REJECTED') {
        await query(
          `UPDATE financial_exits SET payment_status = 'REJECTED' WHERE id = $1`,
          [exitId]
        );
        throw new Error('Saída rejeitada por multi-aprovação');
      }
      
      // Se foi aprovada (atingiu todas as aprovações), continuar com aprovação normal
    }

    // Invalidar cache do dashboard após aprovar
    const cacheService = require('./cacheService');
    cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);

    // Atualiza status para aprovado
    const updateResult = await query(
      `UPDATE financial_exits 
       SET payment_status = 'APPROVED', 
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND condominium_id = $3 AND payment_status = 'PENDING'
       RETURNING *`,
      [userId, exitId, condominiumId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída não encontrada, não pertence a este condomínio ou já foi aprovada/rejeitada');
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

// Função para rejeitar saída financeira
// Recebe: exitId, condominiumId, userId, motivo da rejeição
// Retorna: saída atualizada
const rejectExit = async (exitId, condominiumId, userId, rejectionReason, ipAddress, userAgent) => {
  try {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Motivo da rejeição é obrigatório');
    }

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

    // Valida estado atual
    if (current.payment_status !== 'PENDING') {
      throw new Error('Saída já foi processada');
    }

    // Atualiza status para rejeitado
    const updateResult = await query(
      `UPDATE financial_exits 
       SET payment_status = 'REJECTED', 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND condominium_id = $2 AND payment_status = 'PENDING'
       RETURNING *`,
      [exitId, condominiumId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída não encontrada, não pertence a este condomínio ou já foi processada');
    }

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'REJECT',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
      notes: `Motivo: ${rejectionReason.trim()}`,
    });

    // Notifica financeiro que criou a saída
    if (current.created_by) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification(
        current.created_by,
        condominiumId,
        'Saída Financeira Rejeitada',
        `A saída financeira "${current.description}" foi rejeitada pelo síndico. Motivo: ${rejectionReason.trim()}`,
        'EXIT_REJECTED',
        'financial_exits',
        exitId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao rejeitar saída financeira:', error);
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

    // Atualiza status para pago
    const updateResult = await query(
      `UPDATE financial_exits 
       SET payment_status = 'PAID', 
           paid_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP,
           payment_receipt_pdf_path = $1,
           payment_details = $2,
           payment_method = $3,
           payment_notes = $4
       WHERE id = $5 AND condominium_id = $6 AND payment_status = 'APPROVED'
       RETURNING *`,
      [
        paymentReceiptPdfPath,
        paymentDetails || null,
        paymentMethod || null,
        paymentNotes || null,
        exitId,
        condominiumId
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída não encontrada, não pertence a este condomínio ou não está aprovada');
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

// Função para obter estatísticas do dashboard financeiro
// Recebe: condominiumId
// Retorna: estatísticas financeiras (KPIs, gráficos, etc)
const getDashboardStats = async (condominiumId) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

    // Saldo financeiro (entradas recebidas - saídas pagas - saídas aprovadas mas não pagas)
    const entriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 AND received = TRUE AND deleted_at IS NULL`,
      [condominiumId]
    );
    const totalEntries = parseFloat(entriesResult.rows[0].total);

    const exitsPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PAID'`,
      [condominiumId]
    );
    const totalExitsPaid = parseFloat(exitsPaidResult.rows[0].total);

    const exitsApprovedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'APPROVED'`,
      [condominiumId]
    );
    const totalExitsApproved = parseFloat(exitsApprovedResult.rows[0].total);

    const balance = totalEntries - totalExitsPaid - totalExitsApproved;

    // Entradas do mês atual
    const currentMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND EXTRACT(YEAR FROM entry_date) = $2 
       AND EXTRACT(MONTH FROM entry_date) = $3
       AND received = TRUE AND deleted_at IS NULL`,
      [condominiumId, currentYear, currentMonth]
    );
    const currentMonthEntries = parseFloat(currentMonthEntriesResult.rows[0].total);

    // Saídas do mês atual
    const currentMonthExitsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(YEAR FROM exit_date) = $2 
       AND EXTRACT(MONTH FROM exit_date) = $3
       AND payment_status IN ('PAID', 'APPROVED')`,
      [condominiumId, currentYear, currentMonth]
    );
    const currentMonthExits = parseFloat(currentMonthExitsResult.rows[0].total);

    // Mês anterior
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Entradas do mês anterior
    const prevMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND EXTRACT(YEAR FROM entry_date) = $2 
       AND EXTRACT(MONTH FROM entry_date) = $3
       AND received = TRUE AND deleted_at IS NULL`,
      [condominiumId, prevYear, prevMonth]
    );
    const prevMonthEntries = parseFloat(prevMonthEntriesResult.rows[0].total);

    // Saídas do mês anterior
    const prevMonthExitsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(YEAR FROM exit_date) = $2 
       AND EXTRACT(MONTH FROM exit_date) = $3
       AND payment_status IN ('PAID', 'APPROVED')`,
      [condominiumId, prevYear, prevMonth]
    );
    const prevMonthExits = parseFloat(prevMonthExitsResult.rows[0].total);

    // Variações percentuais
    const entriesVariation = prevMonthEntries > 0 
      ? ((currentMonthEntries - prevMonthEntries) / prevMonthEntries) * 100 
      : (currentMonthEntries > 0 ? 100 : 0);
    const exitsVariation = prevMonthExits > 0 
      ? ((currentMonthExits - prevMonthExits) / prevMonthExits) * 100 
      : (currentMonthExits > 0 ? 100 : 0);

    // Dados dos últimos 6 meses
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const monthEntriesResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
         WHERE condominium_id = $1 
         AND EXTRACT(YEAR FROM entry_date) = $2 
         AND EXTRACT(MONTH FROM entry_date) = $3
         AND received = TRUE`,
        [condominiumId, year, month]
      );
      const monthEntries = parseFloat(monthEntriesResult.rows[0].total);

      const monthExitsResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
         WHERE condominium_id = $1 
         AND EXTRACT(YEAR FROM exit_date) = $2 
         AND EXTRACT(MONTH FROM exit_date) = $3
         AND payment_status IN ('PAID', 'APPROVED')`,
        [condominiumId, year, month]
      );
      const monthExits = parseFloat(monthExitsResult.rows[0].total);

      const monthBalance = monthEntries - monthExits;

      last6Months.push({
        period: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month,
        entries: monthEntries,
        exits: monthExits,
        balance: monthBalance
      });
    }

    // Médias dos últimos 6 meses
    const avgEntries = last6Months.reduce((sum, m) => sum + m.entries, 0) / 6;
    const avgExits = last6Months.reduce((sum, m) => sum + m.exits, 0) / 6;

    // Média de consumo por tipo de conta (últimos 6 meses)
    const avgConsumptionResult = await query(
      `SELECT 
        b.bill_type,
        AVG(mc.bill_amount) as avg_amount
       FROM monthly_consumption mc
       INNER JOIN bills b ON mc.bill_id = b.id
       WHERE mc.condominium_id = $1
       AND (mc.year * 100 + mc.month) >= ($2 * 100 + $3 - 600)
       GROUP BY b.bill_type`,
      [condominiumId, currentYear, currentMonth]
    );
    const avgConsumption = avgConsumptionResult.rows.map(row => ({
      billType: row.bill_type,
      avgAmount: parseFloat(row.avg_amount) || 0
    }));

    // Consumo mensal (últimos registros)
    const consumptionResult = await query(
      `SELECT 
        mc.*,
        b.name as bill_name,
        b.bill_type
       FROM monthly_consumption mc
       INNER JOIN bills b ON mc.bill_id = b.id
       WHERE mc.condominium_id = $1
       ORDER BY mc.year DESC, mc.month DESC
       LIMIT 10`,
      [condominiumId]
    );
    const consumption = consumptionResult.rows.map(row => ({
      id: row.id,
      billId: row.bill_id,
      billName: row.bill_name,
      billType: row.bill_type,
      month: row.month,
      year: row.year,
      consumptionValue: parseFloat(row.consumption_value) || null,
      consumptionUnit: row.consumption_unit,
      billAmount: parseFloat(row.bill_amount) || 0,
      paid: row.paid
    }));

    // Conta entradas rejeitadas (para financeiro corrigir)
    const rejectedEntriesResult = await query(
      `SELECT COUNT(*) as total FROM financial_entries 
       WHERE condominium_id = $1 AND review_status = 'REJECTED' AND deleted_at IS NULL`,
      [condominiumId]
    );
    const rejectedEntries = parseInt(rejectedEntriesResult.rows[0].total);

    // Conta orçamentos aguardando análise do financeiro
    const pendingBudgetFinanceiroResult = await query(
      `SELECT COUNT(*) as total FROM budget_requests 
       WHERE condominium_id = $1 AND status = 'PENDING_FINANCEIRO'`,
      [condominiumId]
    );
    const pendingBudgetFinanceiro = parseInt(pendingBudgetFinanceiroResult.rows[0].total);

    // Conta orçamentos aprovados aguardando liberação
    const approvedBudgetsResult = await query(
      `SELECT COUNT(*) as total FROM budget_requests 
       WHERE condominium_id = $1 AND status = 'APPROVED'`,
      [condominiumId]
    );
    const approvedBudgets = parseInt(approvedBudgetsResult.rows[0].total);

    // Conta orçamentos rejeitados (para ajustar)
    const rejectedBudgetsResult = await query(
      `SELECT COUNT(*) as total FROM budget_requests 
       WHERE condominium_id = $1 AND status = 'REJECTED'`,
      [condominiumId]
    );
    const rejectedBudgets = parseInt(rejectedBudgetsResult.rows[0].total);

    return {
      stats: {
        saldo: balance,
        balance: balance,
        totalEntradas: totalEntries,
        totalSaidas: totalExitsPaid + totalExitsApproved,
        rejectedEntries,
        pendingBudgetFinanceiro,
        approvedBudgets,
        rejectedBudgets,
      },
      kpis: {
        currentMonth: {
          entries: currentMonthEntries,
          exits: currentMonthExits
        },
        variations: {
          entries: entriesVariation,
          exits: exitsVariation
        },
        averages: {
          entries: avgEntries,
          exits: avgExits
        },
        last6Months,
        avgConsumption,
        consumption
      }
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas financeiras:', error);
    throw error;
  }
};

// Função para criar entrada financeira
// Recebe: condominiumId, userId, dados da entrada
// Retorna: entrada criada
const createEntry = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { description, amount, entryDate, costCenterId, category, received } = data;

    // Validações obrigatórias
    if (!description || !description.trim()) {
      throw new Error('Descrição é obrigatória');
    }

    if (!amount || !entryDate) {
      throw new Error('Valor e data são obrigatórios');
    }

    // Valida valor financeiro
    const amountValidation = validateFinancialAmount(amount, {
      allowZero: false,
      allowNegative: false,
      maxValue: 10000000,
      fieldName: 'Valor da entrada'
    });

    if (!amountValidation.valid) {
      throw new Error(amountValidation.error);
    }

    const amountValue = amountValidation.value;

    // Valida data
    const dateValidation = validateDate(entryDate, {
      allowFuture: true,
      maxFutureDays: 365,
      allowPast: true,
      fieldName: 'Data da entrada'
    });

    if (!dateValidation.valid) {
      throw new Error(dateValidation.error);
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    const result = await query(
      `INSERT INTO financial_entries (condominium_id, description, amount, entry_date, cost_center_id, category, received, received_at, created_by, review_status, linked_to_id, linked_to_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING_REVIEW', $10, $11)
       RETURNING *`,
      [
        condominiumId,
        description.trim(),
        amountValue,
        entryDate,
        costCenterId || null,
        category || 'TAXA',
        received || false,
        received ? new Date() : null,
        userId,
        data.linkedToId || null,
        data.linkedToType || null
      ]
    );

    const entry = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entry.id,
      beforeData: null,
      afterData: entry,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Cria notificação para síndico
    const notificationService = require('./notificationService');
    await notificationService.createNotificationForRole(
      'SINDICO',
      condominiumId,
      'Nova Entrada Financeira Aguardando Análise',
      `Uma nova entrada financeira foi criada e aguarda sua análise: ${description.trim()}`,
      'ENTRY_PENDING_REVIEW',
      'financial_entries',
      entry.id
    );

    return entry;
  } catch (error) {
    console.error('Erro ao criar entrada financeira:', error);
    throw error;
  }
};

// Função para buscar entrada por ID
// Recebe: entryId, condominiumId
// Retorna: entrada encontrada
const getEntryById = async (entryId, condominiumId) => {
  try {
    const result = await query(
      `SELECT fe.*, cc.name as cost_center_name, u.full_name as created_by_name
       FROM financial_entries fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id AND cc.condominium_id = $2
       LEFT JOIN users u ON fe.created_by = u.id
       WHERE fe.id = $1 AND fe.condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (result.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar entrada:', error);
    throw error;
  }
};

// Função para atualizar entrada financeira
// Recebe: entryId, condominiumId, userId, data, ipAddress, userAgent
// Retorna: entrada atualizada
const updateEntry = async (entryId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    // Busca entrada atual
    const currentResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Só pode editar se estiver rejeitada ou pendente
    if (current.review_status === 'APPROVED' && current.received) {
      throw new Error('Não é possível editar uma entrada já aprovada e recebida');
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (data.description !== undefined) {
      if (!data.description || !data.description.trim()) {
        throw new Error('Descrição é obrigatória');
      }
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(data.description.trim());
    }

    if (data.amount !== undefined) {
      const amountValidation = validateFinancialAmount(data.amount, {
        allowZero: false,
        allowNegative: false,
        maxValue: 10000000,
        fieldName: 'Valor da entrada'
      });

      if (!amountValidation.valid) {
        throw new Error(amountValidation.error);
      }

      updateFields.push(`amount = $${paramCount++}`);
      updateValues.push(amountValidation.value);
    }

    if (data.entryDate !== undefined) {
      const dateValidation = validateDate(data.entryDate, {
        allowFuture: true,
        maxFutureDays: 365,
        allowPast: true,
        fieldName: 'Data da entrada'
      });

      if (!dateValidation.valid) {
        throw new Error(dateValidation.error);
      }

      updateFields.push(`entry_date = $${paramCount++}`);
      updateValues.push(data.entryDate);
    }

    if (data.costCenterId !== undefined) {
      updateFields.push(`cost_center_id = $${paramCount++}`);
      updateValues.push(data.costCenterId || null);
    }

    if (data.category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      updateValues.push(data.category);
    }

    // Se estava rejeitada, reseta para pendente
    if (current.review_status === 'REJECTED') {
      updateFields.push(`review_status = 'PENDING_REVIEW'`);
      updateFields.push(`rejection_reason = NULL`);
      updateFields.push(`reviewed_by = NULL`);
      updateFields.push(`reviewed_at = NULL`);
    }

    if (updateFields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(entryId, condominiumId);

    const result = await query(
      `UPDATE financial_entries 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND condominium_id = $${paramCount++}
       RETURNING *`,
      updateValues
    );

    const updated = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Se estava rejeitada e foi atualizada, notifica síndico novamente
    if (current.review_status === 'REJECTED') {
      const notificationService = require('./notificationService');
      await notificationService.createNotificationForRole(
        'SINDICO',
        condominiumId,
        'Entrada Financeira Corrigida',
        `Uma entrada financeira rejeitada foi corrigida e aguarda nova análise: ${updated.description}`,
        'ENTRY_PENDING_REVIEW',
        'financial_entries',
        entryId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar entrada:', error);
    throw error;
  }
};

// Função para excluir entrada financeira
// Recebe: entryId, condominiumId, userId, ipAddress, userAgent
// Retorna: void
const deleteEntry = async (entryId, condominiumId, userId, ipAddress, userAgent) => {
  try {
    // Busca entrada atual
    const currentResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Verifica se já foi deletada (soft delete)
    if (current.deleted_at) {
      throw new Error('Entrada já foi excluída');
    }

    // Só pode excluir se estiver rejeitada ou pendente
    if (current.review_status === 'APPROVED' && current.received) {
      throw new Error('Não é possível excluir uma entrada já aprovada e recebida');
    }

    // Soft delete: marca deleted_at, deleted_by
    const deleteReason = current.review_status === 'REJECTED' 
      ? 'Entrada rejeitada excluída' 
      : 'Entrada pendente excluída';

    await query(
      `UPDATE financial_entries 
       SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, delete_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND condominium_id = $4`,
      [userId, deleteReason, entryId, condominiumId]
    );

    // Busca entrada atualizada para log
    const updatedResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );
    const updated = updatedResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'DELETE',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao excluir entrada:', error);
    throw error;
  }
};

// Função para listar entradas financeiras
// Recebe: condominiumId, filtros
// Retorna: lista de entradas
const listEntries = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT fe.*, cc.name as cost_center_name, u.full_name as created_by_name
      FROM financial_entries fe
      LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id AND cc.condominium_id = $1
      LEFT JOIN users u ON fe.created_by = u.id
      WHERE fe.condominium_id = $1 AND fe.deleted_at IS NULL
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.received !== undefined) {
      sql += ` AND fe.received = $${paramCount++}`;
      params.push(filters.received);
    }

    if (filters.category) {
      sql += ` AND fe.category = $${paramCount++}`;
      params.push(filters.category);
    }

    if (filters.startDate) {
      sql += ` AND fe.entry_date >= $${paramCount++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND fe.entry_date <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY fe.created_at DESC LIMIT $${paramCount}`;
    params.push(filters.limit || 100);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar entradas financeiras:', error);
    throw error;
  }
};

// Função para criar conta recorrente
// Recebe: condominiumId, userId, dados da conta
// Retorna: conta criada
const createAccount = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { name, billType, provider, accountNumber, costCenterId } = data;

    // Validações obrigatórias
    if (!name || !name.trim()) {
      throw new Error('Nome da conta é obrigatório');
    }

    if (!billType) {
      throw new Error('Tipo da conta é obrigatório');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    const result = await query(
      `INSERT INTO bills (condominium_id, name, bill_type, provider, account_number, cost_center_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        condominiumId,
        name.trim(),
        billType,
        provider || null,
        accountNumber || null,
        costCenterId || null,
        userId
      ]
    );

    const account = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'bills',
      entityId: account.id,
      beforeData: null,
      afterData: account,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return account;
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    throw error;
  }
};

// Função para listar contas recorrentes
// Recebe: condominiumId, filtros
// Retorna: lista de contas
const listAccounts = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT b.*, cc.name as cost_center_name, u.full_name as created_by_name
      FROM bills b
      LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id AND cc.condominium_id = $1
      LEFT JOIN users u ON b.created_by = u.id
      WHERE b.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.active !== undefined) {
      sql += ` AND b.active = $${paramCount++}`;
      params.push(filters.active);
    }

    if (filters.billType) {
      sql += ` AND b.bill_type = $${paramCount++}`;
      params.push(filters.billType);
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramCount}`;
    params.push(filters.limit || 100);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    throw error;
  }
};

// Função para criar consumo mensal
// Recebe: condominiumId, userId, dados do consumo
// Retorna: consumo criado
const createConsumption = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { billId, month, year, consumptionValue, consumptionUnit, billAmount, dueDate } = data;

    // Validações obrigatórias
    if (!billId) {
      throw new Error('Conta é obrigatória');
    }

    if (!month || !year) {
      throw new Error('Mês e ano são obrigatórios');
    }

    if (!billAmount) {
      throw new Error('Valor da conta é obrigatório');
    }

    // Valida que a conta pertence ao condomínio
    const billResult = await query(
      `SELECT * FROM bills WHERE id = $1 AND condominium_id = $2`,
      [billId, condominiumId]
    );

    if (billResult.rows.length === 0) {
      throw new Error('Conta não encontrada ou não pertence a este condomínio');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida valor financeiro
    const amountValidation = validateFinancialAmount(billAmount, {
      allowZero: false,
      allowNegative: false,
      maxValue: 10000000,
      fieldName: 'Valor da conta'
    });

    if (!amountValidation.valid) {
      throw new Error(amountValidation.error);
    }

    const amountValue = amountValidation.value;

    // Verifica se já existe consumo para este período
    const existingResult = await query(
      `SELECT * FROM monthly_consumption 
       WHERE condominium_id = $1 AND bill_id = $2 AND month = $3 AND year = $4`,
      [condominiumId, billId, month, year]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Já existe consumo registrado para esta conta neste período');
    }

    const result = await query(
      `INSERT INTO monthly_consumption (condominium_id, bill_id, month, year, consumption_value, consumption_unit, bill_amount, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        condominiumId,
        billId,
        month,
        year,
        consumptionValue || null,
        consumptionUnit || 'UNIDADE',
        amountValue,
        dueDate || null,
        userId
      ]
    );

    const consumption = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'monthly_consumption',
      entityId: consumption.id,
      beforeData: null,
      afterData: consumption,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return consumption;
  } catch (error) {
    console.error('Erro ao criar consumo:', error);
    throw error;
  }
};

// Função para listar consumo mensal
// Recebe: condominiumId, filtros
// Retorna: lista de consumo
const listConsumption = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT mc.*, b.name as bill_name, b.bill_type, u.full_name as created_by_name
      FROM monthly_consumption mc
      INNER JOIN bills b ON mc.bill_id = b.id
      LEFT JOIN users u ON mc.created_by = u.id
      WHERE mc.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.billId) {
      sql += ` AND mc.bill_id = $${paramCount++}`;
      params.push(filters.billId);
    }

    if (filters.year) {
      sql += ` AND mc.year = $${paramCount++}`;
      params.push(filters.year);
    }

    if (filters.month) {
      sql += ` AND mc.month = $${paramCount++}`;
      params.push(filters.month);
    }

    sql += ` ORDER BY mc.year DESC, mc.month DESC LIMIT $${paramCount}`;
    params.push(filters.limit || 100);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar consumo:', error);
    throw error;
  }
};

// Função para criar centro de custo
// Recebe: condominiumId, userId, dados do centro de custo
// Retorna: centro de custo criado
const createCostCenter = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { name, description, active } = data;

    // Validações
    if (!name || !name.trim()) {
      throw new Error('Nome do centro de custo é obrigatório');
    }

    // Verifica se já existe centro de custo com mesmo nome no condomínio
    const existingResult = await query(
      `SELECT id FROM cost_centers 
       WHERE condominium_id = $1 AND LOWER(name) = LOWER($2)`,
      [condominiumId, name.trim()]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Já existe um centro de custo com este nome');
    }

    // Cria centro de custo
    const result = await query(
      `INSERT INTO cost_centers (condominium_id, name, description, active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        condominiumId,
        name.trim(),
        description ? description.trim() : null,
        active !== undefined ? (active === 'true' || active === true) : true
      ]
    );

    const costCenter = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'cost_centers',
      entityId: costCenter.id,
      beforeData: null,
      afterData: costCenter,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return costCenter;
  } catch (error) {
    console.error('Erro ao criar centro de custo:', error);
    throw error;
  }
};

// Função para listar centros de custo
// Recebe: condominiumId
// Retorna: lista de centros de custo
const listCostCenters = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT * FROM cost_centers
       WHERE condominium_id = $1 AND active = TRUE
       ORDER BY name ASC`,
      [condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar centros de custo:', error);
    throw error;
  }
};

// Função para aprovar entrada financeira (Síndico)
// Recebe: entryId, userId, condominiumId, reviewNotes (opcional)
// Retorna: entrada atualizada
const approveEntry = async (entryId, userId, condominiumId, reviewNotes, ipAddress, userAgent) => {
  try {
    // Busca entrada
    const entryResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (entryResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const entry = entryResult.rows[0];

    if (entry.review_status !== 'PENDING_REVIEW') {
      throw new Error('Entrada já foi analisada');
    }

    // Atualiza entrada
    const result = await query(
      `UPDATE financial_entries
       SET review_status = 'APPROVED',
           reviewed_by = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           review_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND condominium_id = $4
       RETURNING *`,
      [userId, reviewNotes || null, entryId, condominiumId]
    );

    const updated = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'APPROVE',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: entry,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica financeiro
    if (entry.created_by) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification(
        entry.created_by,
        condominiumId,
        'Entrada Financeira Aprovada',
        `A entrada financeira "${entry.description}" foi aprovada${reviewNotes ? ' com observações' : ''}`,
        'ENTRY_APPROVED',
        'financial_entries',
        entryId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao aprovar entrada financeira:', error);
    throw error;
  }
};

// Função para rejeitar entrada financeira (Síndico)
// Recebe: entryId, userId, condominiumId, rejectionReason
// Retorna: entrada atualizada
const rejectEntry = async (entryId, userId, condominiumId, rejectionReason, ipAddress, userAgent) => {
  try {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Motivo da rejeição é obrigatório');
    }

    // Busca entrada
    const entryResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (entryResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const entry = entryResult.rows[0];

    if (entry.review_status !== 'PENDING_REVIEW') {
      throw new Error('Entrada já foi analisada');
    }

    // Atualiza entrada
    const result = await query(
      `UPDATE financial_entries
       SET review_status = 'REJECTED',
           reviewed_by = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           rejection_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND condominium_id = $4
       RETURNING *`,
      [userId, rejectionReason.trim(), entryId, condominiumId]
    );

    const updated = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'REJECT',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: entry,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica financeiro
    if (entry.created_by) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification(
        entry.created_by,
        condominiumId,
        'Entrada Financeira Rejeitada',
        `A entrada financeira "${entry.description}" foi rejeitada. Motivo: ${rejectionReason.trim()}`,
        'ENTRY_REJECTED',
        'financial_entries',
        entryId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao rejeitar entrada financeira:', error);
    throw error;
  }
};

// Função para listar entradas pendentes de análise (Síndico)
// Recebe: condominiumId
// Retorna: lista de entradas pendentes
const listPendingEntries = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT fe.*, cc.name as cost_center_name, u.full_name as created_by_name
       FROM financial_entries fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
       LEFT JOIN users u ON fe.created_by = u.id
       WHERE fe.condominium_id = $1 AND fe.review_status = 'PENDING_REVIEW'
       ORDER BY fe.created_at ASC`,
      [condominiumId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao listar entradas pendentes:', error);
    throw error;
  }
};

// Função para listar entradas rejeitadas (Financeiro)
// Recebe: condominiumId
// Retorna: lista de entradas rejeitadas
const listRejectedEntries = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT fe.*, cc.name as cost_center_name, u.full_name as reviewed_by_name
       FROM financial_entries fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
       LEFT JOIN users u ON fe.reviewed_by = u.id
       WHERE fe.condominium_id = $1 AND fe.review_status = 'REJECTED' AND fe.deleted_at IS NULL
       ORDER BY fe.reviewed_at DESC`,
      [condominiumId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao listar entradas rejeitadas:', error);
    throw error;
  }
};

// Função para marcar entrada como recebida
// Recebe: entryId, condominiumId, userId, dados do recebimento
// Retorna: entrada atualizada
const markEntryAsReceived = async (entryId, condominiumId, userId, receiptData, ipAddress, userAgent) => {
  try {
    const { receiptMethod, receiptPdfPath, receiptDetails, receiptNotes } = receiptData;

    // Validações
    if (!receiptMethod || !receiptMethod.trim()) {
      throw new Error('Método de recebimento é obrigatório');
    }

    if (!receiptPdfPath || !receiptPdfPath.trim()) {
      throw new Error('Comprovante em PDF é obrigatório');
    }

    if (!receiptDetails || !receiptDetails.trim()) {
      throw new Error('Detalhes do recebimento são obrigatórios');
    }

    // Busca entrada atual
    const currentResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida ownership
    const owns = await validateCondominiumOwnership('financial_entries', entryId, condominiumId);
    if (!owns) {
      throw new Error('Entrada não pertence a este condomínio');
    }

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida que não está já recebida
    if (current.received === true) {
      throw new Error('Entrada já foi marcada como recebida');
    }

    // Atualiza entrada como recebida
    const updateResult = await query(
      `UPDATE financial_entries 
       SET received = TRUE, 
           received_at = CURRENT_TIMESTAMP,
           receipt_pdf_path = $1,
           receipt_method = $2,
           receipt_details = $3,
           receipt_notes = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND condominium_id = $6 AND received = FALSE
       RETURNING *`,
      [
        receiptPdfPath.trim(),
        receiptMethod.trim(),
        receiptDetails.trim(),
        receiptNotes ? receiptNotes.trim() : null,
        entryId,
        condominiumId
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Entrada não encontrada, não pertence a este condomínio ou já foi recebida');
    }

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'MARK_RECEIVED',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao marcar entrada como recebida:', error);
    throw error;
  }
};

module.exports = {
  createExit,
  updateExit,
  approveExit,
  rejectExit,
  markExitAsPaid,
  listExits,
  getDashboardStats,
  createEntry,
  getEntryById,
  updateEntry,
  deleteEntry,
  listEntries,
  approveEntry,
  rejectEntry,
  listPendingEntries,
  listRejectedEntries,
  markEntryAsReceived,
  createAccount,
  listAccounts,
  createConsumption,
  listConsumption,
  createCostCenter,
  listCostCenters,
};

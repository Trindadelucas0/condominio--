// Service do módulo FINANCEIRO
// Contém lógica de negócio para gestão financeira
// Acesso: FINANCEIRO, SINDICO

const { query, getClient } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateFinancialAmount, validateDate } = require('../utils/validators');
const { validateCondominiumOwnership, validateUserBelongsToCondominium } = require('../utils/queryHelper');
const { DEFAULT_RECEITA_CATEGORY, DEFAULT_DESPESA_CATEGORY } = require('../constants/financialCategories');
const fs = require('fs/promises');
const path = require('path');
const RESERVA_RECEITA = 'RECEITAS_FUNDO_RESERVA';
const RESERVA_DESPESA = 'DESPESAS_FUNDO_RESERVA';
const reserveFundService = require('./reserveFundService');
const { resolveDashboardPeriod } = require('../utils/periodRange');

const PROJECT_ROOT = path.join(__dirname, '../../');
const PAYMENTS_UPLOAD_DIR = path.join(PROJECT_ROOT, 'uploads/payments');

const resolveSafePaymentPath = (storedPath) => {
  if (!storedPath || !String(storedPath).trim()) return null;
  const normalized = String(storedPath).replace(/^\//, '');
  const absolute = path.resolve(PROJECT_ROOT, normalized);
  const relativeFromPayments = path.relative(PAYMENTS_UPLOAD_DIR, absolute);
  if (relativeFromPayments.startsWith('..') || path.isAbsolute(relativeFromPayments)) return null;
  return absolute;
};

const unlinkIfExistsSafe = async (storedPath) => {
  const absolute = resolveSafePaymentPath(storedPath);
  if (!absolute) return false;
  try {
    await fs.unlink(absolute);
    return true;
  } catch (error) {
    if (error && error.code === 'ENOENT') return false;
    throw error;
  }
};

// Função para criar saída financeira
// Recebe: condominiumId, userId, dados da saída
// Retorna: saída criada
const createExit = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { description, amount, exitDate, costCenterId, category, billId, requiresApproval, approvalLimit, isRecurring, recurrenceType, isVariable, averageAmount, needsVerification, relatedBudgetRequestId, relatedBudgetQuoteId, assetId, asset_id, paymentReceiptPdfPath, invoicePath, invoiceFileName } = data;
    const assetIdValue = assetId != null ? assetId : asset_id;

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

    // Verifica se o mês da data está fechado (e não reaberto)
    // Se houver pelo menos um fechamento CLOSED (não reaberto), bloqueia
    const monthlyClosureService = require('./monthlyClosureService');
    const isClosed = await monthlyClosureService.isMonthClosed(condominiumId, exitDate);
    
    if (isClosed) {
      const exitMonth = new Date(exitDate).getMonth() + 1;
      const exitYear = new Date(exitDate).getFullYear();
      throw new Error(`Não é possível criar saída financeira. O mês ${exitMonth}/${exitYear} está fechado. Reabra o mês primeiro se necessário.`);
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
    // Se precisa verificação (criado automaticamente de orçamento), status é PENDING
    const needsApproval = requiresApproval && amountValue > limitValue;
    const paymentStatus = needsVerification ? 'PENDING' : (needsApproval ? 'PENDING' : 'APPROVED');

    // Monta campos dinamicamente para suportar campos opcionais
    const insertFields = ['condominium_id', 'description', 'amount', 'exit_date', 'cost_center_id', 'category', 'bill_id', 'requires_approval', 'approval_limit', 'payment_status', 'created_by', 'is_recurring', 'recurrence_type', 'is_variable', 'average_amount'];
    const insertValues = [condominiumId, description.trim(), amountValue, exitDate, costCenterId || null, category || DEFAULT_DESPESA_CATEGORY, billId || null, requiresApproval || false, limitValue, paymentStatus, userId, isRecurring || false, recurrenceType || 'UNIQUE', isVariable || false, averageAmount || null];
    let paramCount = insertValues.length + 1;

    // Adiciona campos opcionais se existirem
    if (needsVerification !== undefined) {
      insertFields.push('needs_verification');
      insertValues.push(needsVerification);
      paramCount++;
    }

    if (relatedBudgetRequestId) {
      insertFields.push('related_budget_request_id');
      insertValues.push(relatedBudgetRequestId);
      paramCount++;
    }

    if (relatedBudgetQuoteId) {
      insertFields.push('related_budget_quote_id');
      insertValues.push(relatedBudgetQuoteId);
      paramCount++;
    }

    if (assetIdValue != null) {
      insertFields.push('asset_id');
      insertValues.push(assetIdValue);
      paramCount++;
    }

    if (paymentReceiptPdfPath && String(paymentReceiptPdfPath).trim()) {
      insertFields.push('payment_receipt_pdf_path');
      insertValues.push(String(paymentReceiptPdfPath).trim());
      paramCount++;
    }

    if (invoicePath && String(invoicePath).trim()) {
      insertFields.push('invoice_path');
      insertValues.push(String(invoicePath).trim());
      paramCount++;
    }

    if (invoiceFileName && String(invoiceFileName).trim()) {
      insertFields.push('invoice_file_name');
      insertValues.push(String(invoiceFileName).trim());
      paramCount++;
    }

    const placeholders = insertFields.map((_, index) => `$${index + 1}`).join(', ');

    const result = await query(
      `INSERT INTO financial_exits (${insertFields.join(', ')})
       VALUES (${placeholders})
       RETURNING *`,
      insertValues
    );

    const exit = result.rows[0];

    // Se precisa de aprovação do síndico (valor > limite), cria registro em approvals
    // para que apareça em /sindico/aprovacoes
    if (needsApproval) {
      await query(
        `INSERT INTO approvals (condominium_id, approval_type, entity_type, entity_id, requested_by, requested_amount, description, status)
         VALUES ($1, 'FINANCIAL_EXIT', 'financial_exits', $2, $3, $4, $5, 'PENDING')`,
        [condominiumId, exit.id, userId, amountValue, description.trim()]
      );
    }

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

    if (data.requiresApproval !== undefined) {
      updateFields.push(`requires_approval = $${paramCount++}`);
      updateValues.push(!!data.requiresApproval);
    }

    // approval_limit pode ser alterado em qualquer status editável (PAID já é bloqueado acima)
    if (data.approvalLimit !== undefined) {
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
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Busca saída atual com lock (SELECT FOR UPDATE)
    const currentResult = await client.query(
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
    const entriesResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_entries 
       WHERE condominium_id = $1 AND received = TRUE`,
      [condominiumId]
    );
    const totalEntries = parseFloat(entriesResult.rows[0].total);
    
    const exitsPaidResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PAID'`,
      [condominiumId]
    );
    const totalExitsPaid = parseFloat(exitsPaidResult.rows[0].total);
    
    // Saídas aprovadas mas não pagas (incluindo a atual se já estiver aprovada)
    const exitsApprovedResult = await client.query(
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
        await client.query(
          `UPDATE financial_exits SET payment_status = 'REJECTED' WHERE id = $1`,
          [exitId]
        );
        await client.query('COMMIT');
        throw new Error('Saída rejeitada por multi-aprovação');
      }
      
      // Se foi aprovada (atingiu todas as aprovações), continuar com aprovação normal
    }

    // Invalidar cache do dashboard após aprovar
    const cacheService = require('./cacheService');
    cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);

    // Atualiza status para aprovado
    const updateResult = await client.query(
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
    await client.query('COMMIT');

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
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro ao aprovar saída financeira:', error);
    throw error;
  } finally {
    client.release();
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
    const { paymentReceiptPdfPath, paymentDetails, paymentMethod, paymentNotes, invoicePath, invoiceFileName } = paymentData || {};

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

    const nextPaymentReceiptPath = paymentReceiptPdfPath && paymentReceiptPdfPath.trim()
      ? paymentReceiptPdfPath.trim()
      : null;
    const nextInvoicePath = invoicePath && invoicePath.trim() ? invoicePath.trim() : null;
    const nextInvoiceFileName = invoiceFileName && invoiceFileName.trim() ? invoiceFileName.trim() : null;

    // Atualiza status para pago
    const updateResult = await query(
      `UPDATE financial_exits 
       SET payment_status = 'PAID', 
           paid_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP,
           payment_receipt_pdf_path = $1,
           payment_details = $2,
           payment_method = $3,
           payment_notes = $4,
           invoice_path = $5,
           invoice_file_name = $6
       WHERE id = $7 AND condominium_id = $8 AND payment_status = 'APPROVED'
       RETURNING *`,
      [
        nextPaymentReceiptPath,
        paymentDetails || null,
        paymentMethod || null,
        paymentNotes || null,
        nextInvoicePath,
        nextInvoiceFileName,
        exitId,
        condominiumId
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída não encontrada, não pertence a este condomínio ou não está aprovada');
    }

    const updated = updateResult.rows[0];
    if (current.payment_receipt_pdf_path && current.payment_receipt_pdf_path !== nextPaymentReceiptPath) {
      await unlinkIfExistsSafe(current.payment_receipt_pdf_path).catch((error) => {
        console.warn('Aviso ao remover comprovante antigo de saída:', error.message);
      });
    }
    if (current.invoice_path && current.invoice_path !== nextInvoicePath) {
      await unlinkIfExistsSafe(current.invoice_path).catch((error) => {
        console.warn('Aviso ao remover nota fiscal antiga de saída:', error.message);
      });
    }

    // Fundo de reserva como conta: saída paga com DESPESAS_FUNDO_RESERVA debita o fundo
    if (current.category === RESERVA_DESPESA && !current.reserve_fund_debited) {
      try {
        await reserveFundService.subtractFromReserveFund(condominiumId, userId, updated.amount, ipAddress, userAgent);
        await query(`UPDATE financial_exits SET reserve_fund_debited = TRUE WHERE id = $1 AND condominium_id = $2`, [exitId, condominiumId]);
        updated.reserve_fund_debited = true;
      } catch (err) {
        console.warn('Aviso: não foi possível debitar saída do fundo de reserva:', err.message);
      }
    }

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

    // Invalidar cache do dashboard para o saldo refletir a saída concluída (paga)
    const cacheServicePay = require('./cacheService');
    cacheServicePay.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheServicePay.deletePattern(`dashboard:analytics:${condominiumId}`);

    return updated;
  } catch (error) {
    console.error('Erro ao marcar saída como paga:', error);
    throw error;
  }
};

// Função para desfazer pagamento de saída financeira
// Recebe: exitId, condominiumId, userId, motivo, ipAddress, userAgent
// Retorna: saída atualizada
const unmarkExitAsPaid = async (exitId, condominiumId, userId, reason, ipAddress, userAgent) => {
  try {
    if (!reason || !reason.trim()) {
      throw new Error('Motivo para desfazer pagamento é obrigatório');
    }

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

    if (current.payment_status !== 'PAID') {
      throw new Error('Somente saídas pagas podem ter o pagamento desfeito');
    }

    // Verifica fechamento mensal na data de pagamento (ou data da saída)
    const monthlyClosureService = require('./monthlyClosureService');
    const referenceDate = current.paid_at || current.exit_date;
    const isClosed = await monthlyClosureService.isMonthClosed(condominiumId, referenceDate);
    if (isClosed) {
      const d = new Date(referenceDate);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      throw new Error(`Não é possível desfazer o pagamento. O mês ${m}/${y} está fechado.`);
    }

    // Fundo de reserva: devolver valor ao fundo se esta saída havia debitado
    if (current.reserve_fund_debited === true) {
      try {
        await reserveFundService.addContribution(condominiumId, userId, current.amount, ipAddress, userAgent);
      } catch (err) {
        console.warn('Aviso: não foi possível devolver valor ao fundo de reserva:', err.message);
      }
    }

    // Ao desfazer pagamento, voltamos o status para PENDING,
    // assim a saída deixa de impactar o saldo como saída concluída/aprovada.
    const updateResult = await query(
      `UPDATE financial_exits
       SET payment_status = 'PENDING',
           paid_at = NULL,
           reserve_fund_debited = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND condominium_id = $2
       RETURNING *`,
      [exitId, condominiumId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Saída não encontrada ou não pertence a este condomínio');
    }

    const updated = updateResult.rows[0];

    await logAction({
      userId,
      condominiumId,
      action: 'UNPAY',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: updated,
      ipAddress,
      userAgent,
      notes: `Motivo desfazer pagamento: ${reason.trim()}`,
    });

    // Atualiza cache do dashboard para refletir saldo
    const cacheService = require('./cacheService');
    cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);

    return updated;
  } catch (error) {
    console.error('Erro ao desfazer pagamento da saída:', error);
    throw error;
  }
};

// Função para excluir saída financeira
// Recebe: exitId, condominiumId, userId, motivo, ipAddress, userAgent
// Retorna: saída excluída
const deleteExit = async (exitId, condominiumId, userId, reason, ipAddress, userAgent) => {
  try {
    if (!reason || !reason.trim()) {
      throw new Error('Motivo para excluir a despesa é obrigatório');
    }

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

    // Bloqueia exclusão quando o mês de referência estiver fechado
    const monthlyClosureService = require('./monthlyClosureService');
    const referenceDate = current.payment_status === 'PAID'
      ? (current.paid_at || current.exit_date)
      : current.exit_date;
    const isClosed = await monthlyClosureService.isMonthClosed(condominiumId, referenceDate);
    if (isClosed) {
      const d = new Date(referenceDate);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      throw new Error(`Não é possível excluir a despesa. O mês ${m}/${y} está fechado.`);
    }

    // Se estiver paga, primeiro desfaz pagamento para reverter saldo/fundo de reserva.
    if (current.payment_status === 'PAID') {
      await unmarkExitAsPaid(
        exitId,
        condominiumId,
        userId,
        `Exclusão da despesa: ${reason.trim()}`,
        ipAddress,
        userAgent
      );
    }

    const deleteResult = await query(
      `DELETE FROM financial_exits
       WHERE id = $1 AND condominium_id = $2
       RETURNING *`,
      [exitId, condominiumId]
    );

    if (deleteResult.rows.length === 0) {
      throw new Error('Saída não encontrada ou não pertence a este condomínio');
    }

    const deleted = deleteResult.rows[0];

    if (deleted.payment_receipt_pdf_path) {
      await unlinkIfExistsSafe(deleted.payment_receipt_pdf_path).catch((error) => {
        console.warn('Aviso ao remover comprovante de saída excluída:', error.message);
      });
    }
    if (deleted.invoice_path) {
      await unlinkIfExistsSafe(deleted.invoice_path).catch((error) => {
        console.warn('Aviso ao remover nota fiscal de saída excluída:', error.message);
      });
    }

    await logAction({
      userId,
      condominiumId,
      action: 'DELETE',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: null,
      ipAddress,
      userAgent,
      notes: `Motivo exclusão: ${reason.trim()}`,
    });

    const cacheService = require('./cacheService');
    cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);

    return deleted;
  } catch (error) {
    console.error('Erro ao excluir saída financeira:', error);
    throw error;
  }
};

// Função para solicitar desfazer pagamento de saída (cria aprovação para o síndico)
// Recebe: exitId, condominiumId, userId, motivo, ipAddress, userAgent
// Não altera o status da saída; apenas registra solicitação na tabela approvals
const requestUnpayExit = async (exitId, condominiumId, userId, reason, ipAddress, userAgent) => {
  try {
    if (!reason || !reason.trim()) {
      throw new Error('Motivo para solicitar desfazer pagamento é obrigatório');
    }

    // Busca saída atual
    const exitResult = await query(
      `SELECT * FROM financial_exits WHERE id = $1 AND condominium_id = $2`,
      [exitId, condominiumId]
    );

    if (exitResult.rows.length === 0) {
      throw new Error('Saída não encontrada');
    }

    const exit = exitResult.rows[0];

    if (exit.payment_status !== 'PAID') {
      throw new Error('Somente saídas pagas podem ter o pagamento solicitado para desfazer');
    }

    // Verifica se já existe solicitação pendente para esta saída
    const existingApproval = await query(
      `SELECT id FROM approvals 
       WHERE condominium_id = $1 
         AND entity_type = 'financial_exits' 
         AND entity_id = $2 
         AND approval_type = 'FINANCIAL_EXIT_UNPAY'
         AND status = 'PENDING'`,
      [condominiumId, exitId]
    );

    if (existingApproval.rows.length > 0) {
      throw new Error('Já existe uma solicitação pendente para desfazer o pagamento desta saída');
    }

    // Cria registro na tabela approvals para o síndico aprovar
    await query(
      `INSERT INTO approvals (
         condominium_id,
         approval_type,
         entity_type,
         entity_id,
         requested_by,
         requested_amount,
         description,
         status
       )
       VALUES ($1, 'FINANCIAL_EXIT_UNPAY', 'financial_exits', $2, $3, $4, $5, 'PENDING')`,
      [
        condominiumId,
        exitId,
        userId,
        exit.amount,
        `Solicitação para desfazer pagamento da saída "${exit.description}". Motivo: ${reason.trim()}`,
      ]
    );

    // Registra no log de auditoria
    await logAction({
      userId,
      condominiumId,
      action: 'REQUEST_UNPAY',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: exit,
      afterData: exit,
      ipAddress,
      userAgent,
      notes: `Motivo solicitação desfazer pagamento: ${reason.trim()}`,
    });

    return true;
  } catch (error) {
    console.error('Erro ao solicitar desfazer pagamento da saída:', error);
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

const getExitById = async (exitId, condominiumId) => {
  const result = await query(
    `SELECT fe.*, cc.name as cost_center_name, b.name as bill_name, u.full_name as created_by_name
     FROM financial_exits fe
     LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id AND cc.condominium_id = $2
     LEFT JOIN bills b ON fe.bill_id = b.id AND b.condominium_id = $2
     LEFT JOIN users u ON fe.created_by = u.id
     WHERE fe.id = $1 AND fe.condominium_id = $2`,
    [exitId, condominiumId]
  );
  if (result.rows.length === 0) {
    throw new Error('Saída não encontrada');
  }
  return result.rows[0];
};

const updateExitAttachments = async (exitId, condominiumId, userId, attachments, ipAddress, userAgent) => {
  try {
    const current = await getExitById(exitId, condominiumId);
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    const hasComprovante = Object.prototype.hasOwnProperty.call(attachments || {}, 'comprovantePagamentoPath');
    const hasNota = Object.prototype.hasOwnProperty.call(attachments || {}, 'notaFiscalPath');
    if (!hasComprovante && !hasNota) {
      throw new Error('Nenhum anexo para atualizar');
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (hasComprovante) {
      const nextComprovante = attachments.comprovantePagamentoPath && attachments.comprovantePagamentoPath.trim()
        ? attachments.comprovantePagamentoPath.trim()
        : null;
      updateFields.push(`payment_receipt_pdf_path = $${paramCount++}`);
      updateValues.push(nextComprovante);
    }

    if (hasNota) {
      const nextNota = attachments.notaFiscalPath && attachments.notaFiscalPath.trim()
        ? attachments.notaFiscalPath.trim()
        : null;
      const nextNotaNome = attachments.notaFiscalFileName && attachments.notaFiscalFileName.trim()
        ? attachments.notaFiscalFileName.trim()
        : null;
      updateFields.push(`invoice_path = $${paramCount++}`);
      updateValues.push(nextNota);
      updateFields.push(`invoice_file_name = $${paramCount++}`);
      updateValues.push(nextNotaNome);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(exitId, condominiumId);

    const result = await query(
      `UPDATE financial_exits
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND condominium_id = $${paramCount++}
       RETURNING *`,
      updateValues
    );
    const updated = result.rows[0];

    if (hasComprovante && current.payment_receipt_pdf_path && current.payment_receipt_pdf_path !== updated.payment_receipt_pdf_path) {
      await unlinkIfExistsSafe(current.payment_receipt_pdf_path).catch((error) => {
        console.warn('Aviso ao remover comprovante substituído/removido:', error.message);
      });
    }
    if (hasNota && current.invoice_path && current.invoice_path !== updated.invoice_path) {
      await unlinkIfExistsSafe(current.invoice_path).catch((error) => {
        console.warn('Aviso ao remover nota fiscal substituída/removida:', error.message);
      });
    }

    await logAction({
      userId,
      condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: updated,
      ipAddress,
      userAgent,
      notes: 'Atualização de anexos da saída',
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar anexos da saída:', error);
    throw error;
  }
};

const removeExitAttachment = async (exitId, condominiumId, userId, attachmentType, ipAddress, userAgent) => {
  const normalizedType = String(attachmentType || '').trim();
  if (normalizedType !== 'comprovantePagamento' && normalizedType !== 'notaFiscal') {
    throw new Error('Tipo de anexo inválido');
  }
  const payload = normalizedType === 'comprovantePagamento'
    ? { comprovantePagamentoPath: null }
    : { notaFiscalPath: null, notaFiscalFileName: null };
  return updateExitAttachments(exitId, condominiumId, userId, payload, ipAddress, userAgent);
};

// Função para obter estatísticas do dashboard financeiro
// Recebe: condominiumId, options opcional { dataInicio, dataFim } (YYYY-MM-DD)
// Retorna: estatísticas financeiras (KPIs, gráficos, etc)
const getDashboardStats = async (condominiumId, options = {}) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const periodo = resolveDashboardPeriod(options.dataInicio, options.dataFim);
    const {
      dataInicio,
      dataFim,
      dataInicioAnterior,
      dataFimAnterior,
      label: periodoLabel,
      labelAnterior: periodoLabelAnterior,
    } = periodo;

    const anchorEnd = new Date(
      Number(dataFim.slice(0, 4)),
      Number(dataFim.slice(5, 7)) - 1,
      Number(dataFim.slice(8, 10))
    );
    const anchorYear = anchorEnd.getFullYear();
    const anchorMonth = anchorEnd.getMonth() + 1;

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

    // Entradas do período selecionado
    const currentMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND entry_date::date >= $2::date AND entry_date::date <= $3::date
       AND received = TRUE AND deleted_at IS NULL`,
      [condominiumId, dataInicio, dataFim]
    );
    const currentMonthEntries = parseFloat(currentMonthEntriesResult.rows[0].total);

    // Saídas do período selecionado
    const currentMonthExitsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND exit_date::date >= $2::date AND exit_date::date <= $3::date
       AND payment_status IN ('PAID', 'APPROVED')`,
      [condominiumId, dataInicio, dataFim]
    );
    const currentMonthExits = parseFloat(currentMonthExitsResult.rows[0].total);

    // Período anterior (mesma duração)
    const prevMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND entry_date::date >= $2::date AND entry_date::date <= $3::date
       AND received = TRUE AND deleted_at IS NULL`,
      [condominiumId, dataInicioAnterior, dataFimAnterior]
    );
    const prevMonthEntries = parseFloat(prevMonthEntriesResult.rows[0].total);

    const prevMonthExitsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND exit_date::date >= $2::date AND exit_date::date <= $3::date
       AND payment_status IN ('PAID', 'APPROVED')`,
      [condominiumId, dataInicioAnterior, dataFimAnterior]
    );
    const prevMonthExits = parseFloat(prevMonthExitsResult.rows[0].total);

    const saldoMesAtual = currentMonthEntries - currentMonthExits;
    const saldoMesPassado = prevMonthEntries - prevMonthExits;

    const entriesVariation = prevMonthEntries > 0
      ? ((currentMonthEntries - prevMonthEntries) / prevMonthEntries) * 100
      : (currentMonthEntries > 0 ? 100 : 0);
    const exitsVariation = prevMonthExits > 0
      ? ((currentMonthExits - prevMonthExits) / prevMonthExits) * 100
      : (currentMonthExits > 0 ? 100 : 0);

    // Últimos 6 meses calendário terminando no mês de dataFim
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(anchorYear, anchorMonth - 1 - i, 1);
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

    const avgEntries = last6Months.reduce((sum, m) => sum + m.entries, 0) / 6;
    const avgExits = last6Months.reduce((sum, m) => sum + m.exits, 0) / 6;

    // Média de consumo por tipo de conta (últimos 6 meses ancorados em dataFim)
    const avgConsumptionResult = await query(
      `SELECT 
        b.bill_type,
        AVG(mc.bill_amount) as avg_amount
       FROM monthly_consumption mc
       INNER JOIN bills b ON mc.bill_id = b.id
       WHERE mc.condominium_id = $1
       AND (mc.year * 12 + mc.month) >= ($2 * 12 + $3 - 5)
       GROUP BY b.bill_type`,
      [condominiumId, anchorYear, anchorMonth]
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

    const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const payableOverdueResult = await query(
      `SELECT COUNT(*) as total FROM payable_items WHERE condominium_id = $1 AND status = 'PENDING' AND due_date < $2`,
      [condominiumId, todayStr]
    );
    const payableDueTodayResult = await query(
      `SELECT COUNT(*) as total FROM payable_items WHERE condominium_id = $1 AND status = 'PENDING' AND due_date = $2`,
      [condominiumId, todayStr]
    );
    const payableOverdueCount = parseInt(payableOverdueResult.rows[0].total);
    const payableDueTodayCount = parseInt(payableDueTodayResult.rows[0].total);

    return {
      stats: {
        saldo: balance,
        balance: balance,
        saldoMesAtual,
        saldoMesPassado,
        saldoPeriodo: saldoMesAtual,
        saldoPeriodoAnterior: saldoMesPassado,
        entradasPeriodo: currentMonthEntries,
        saidasPeriodo: currentMonthExits,
        totalEntradas: totalEntries,
        totalSaidas: totalExitsPaid + totalExitsApproved,
        rejectedEntries,
        pendingBudgetFinanceiro,
        approvedBudgets,
        rejectedBudgets,
        payableOverdueCount,
        payableDueTodayCount,
        periodo: {
          dataInicio,
          dataFim,
          dataInicioAnterior,
          dataFimAnterior,
          label: periodoLabel,
          labelAnterior: periodoLabelAnterior,
        },
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

const ALLOWED_CONSUMO_BILL_TYPES = ['AGUA', 'LUZ', 'GAS', 'TELEFONE', 'INTERNET', 'OUTRA'];

/**
 * Análise de consumo mensal de contas (monthly_consumption) alinhada ao período do dashboard.
 * @param {number} condominiumId
 * @param {{ dataInicio?: string, dataFim?: string, consumoBillId?: number|string, consumoBillType?: string }} options
 */
const getConsumptionAnalytics = async (condominiumId, options = {}) => {
  const periodo = resolveDashboardPeriod(options.dataInicio, options.dataFim);
  const { dataInicio, dataFim, dataInicioAnterior, dataFimAnterior } = periodo;

  const parseYmd = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());
    if (!m) return null;
    return { y: parseInt(m[1], 10), mo: parseInt(m[2], 10) };
  };

  const empty = () => ({
    periodo: {
      dataInicio,
      dataFim,
      dataInicioAnterior,
      dataFimAnterior,
      label: periodo.label,
      labelAnterior: periodo.labelAnterior,
    },
    filters: { consumoBillId: null, consumoBillType: null },
    totalAmount: 0,
    countRecords: 0,
    monthsInPeriod: 0,
    avgMonthlyAmount: 0,
    prevTotalAmount: 0,
    variationPct: 0,
    lastMonthLabel: null,
    series: [],
    seriesPorConta: [],
    seriesConsumption: null,
    consumptionUnitLabel: null,
    recentRecords: [],
  });

  const start = parseYmd(dataInicio);
  const end = parseYmd(dataFim);
  const prevStart = parseYmd(dataInicioAnterior);
  const prevEnd = parseYmd(dataFimAnterior);
  if (!start || !end || !prevStart || !prevEnd) {
    return empty();
  }

  let consumoBillId =
    options.consumoBillId != null && options.consumoBillId !== ''
      ? parseInt(options.consumoBillId, 10)
      : null;
  if (consumoBillId != null && Number.isNaN(consumoBillId)) consumoBillId = null;

  let consumoBillType =
    options.consumoBillType && String(options.consumoBillType).trim()
      ? String(options.consumoBillType).trim()
      : null;
  if (consumoBillType && !ALLOWED_CONSUMO_BILL_TYPES.includes(consumoBillType)) {
    consumoBillType = null;
  }

  if (consumoBillId != null) {
    const billCheck = await query(
      `SELECT id FROM bills WHERE id = $1 AND condominium_id = $2`,
      [consumoBillId, condominiumId]
    );
    if (billCheck.rows.length === 0) consumoBillId = null;
  }

  const buildFilteredSql = (selectAgg) => {
    let sql = `
      ${selectAgg}
      FROM monthly_consumption mc
      INNER JOIN bills b ON mc.bill_id = b.id
      WHERE mc.condominium_id = $1
      AND (mc.year * 12 + mc.month) >= ($2 * 12 + $3)
      AND (mc.year * 12 + mc.month) <= ($4 * 12 + $5)`;
    const params = [condominiumId, start.y, start.mo, end.y, end.mo];
    let pc = 6;
    if (consumoBillId != null) {
      sql += ` AND mc.bill_id = $${pc++}`;
      params.push(consumoBillId);
    }
    if (consumoBillType) {
      sql += ` AND b.bill_type = $${pc++}`;
      params.push(consumoBillType);
    }
    return { sql, params };
  };

  const sumSql = buildFilteredSql(`SELECT COALESCE(SUM(mc.bill_amount), 0) as total, COUNT(*)::int as cnt`);
  const sumRes = await query(sumSql.sql, sumSql.params);
  const totalAmount = parseFloat(sumRes.rows[0].total) || 0;
  const countRecords = parseInt(sumRes.rows[0].cnt, 10) || 0;

  const buildPrevSql = (selectAgg) => {
    let sql = `
      ${selectAgg}
      FROM monthly_consumption mc
      INNER JOIN bills b ON mc.bill_id = b.id
      WHERE mc.condominium_id = $1
      AND (mc.year * 12 + mc.month) >= ($2 * 12 + $3)
      AND (mc.year * 12 + mc.month) <= ($4 * 12 + $5)`;
    const params = [condominiumId, prevStart.y, prevStart.mo, prevEnd.y, prevEnd.mo];
    let pc = 6;
    if (consumoBillId != null) {
      sql += ` AND mc.bill_id = $${pc++}`;
      params.push(consumoBillId);
    }
    if (consumoBillType) {
      sql += ` AND b.bill_type = $${pc++}`;
      params.push(consumoBillType);
    }
    return { sql, params };
  };

  const prevSql = buildPrevSql(`SELECT COALESCE(SUM(mc.bill_amount), 0) as total`);
  const prevRes = await query(prevSql.sql, prevSql.params);
  const prevTotalAmount = parseFloat(prevRes.rows[0].total) || 0;

  const monthsInPeriod = end.y * 12 + end.mo - (start.y * 12 + start.mo) + 1;
  const avgMonthlyAmount = monthsInPeriod > 0 ? totalAmount / monthsInPeriod : 0;

  let variationPct = 0;
  if (prevTotalAmount > 0) {
    variationPct = ((totalAmount - prevTotalAmount) / prevTotalAmount) * 100;
  } else if (totalAmount > 0) {
    variationPct = 100;
  }

  const seriesSql = buildFilteredSql(
    `SELECT mc.year, mc.month, COALESCE(SUM(mc.bill_amount), 0) as total_amount`
  );
  const seriesQuery = `${seriesSql.sql} GROUP BY mc.year, mc.month ORDER BY mc.year, mc.month`;
  const seriesRes = await query(seriesQuery, seriesSql.params);

  const byKey = new Map();
  seriesRes.rows.forEach((row) => {
    const k = `${row.year}-${row.month}`;
    byKey.set(k, parseFloat(row.total_amount) || 0);
  });

  const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const series = [];
  let y = start.y;
  let m = start.mo;
  while (y * 12 + m <= end.y * 12 + end.mo) {
    const k = `${y}-${m}`;
    series.push({
      year: y,
      month: m,
      label: `${monthShort[m - 1]}/${y}`,
      totalAmount: byKey.get(k) || 0,
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  let lastMonthLabel = null;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].totalAmount > 0) {
      lastMonthLabel = series[i].label;
      break;
    }
  }

  /** Uma linha por conta (quando não há filtro de conta única) — para o gráfico multi-série */
  let seriesPorConta = [];
  if (consumoBillId == null) {
    const perBillSql = buildFilteredSql(
      `SELECT mc.bill_id, b.name as bill_name, mc.year, mc.month, mc.bill_amount`
    );
    const perBillQuery = `${perBillSql.sql} ORDER BY b.name ASC, mc.year ASC, mc.month ASC`;
    const perBillRes = await query(perBillQuery, perBillSql.params);
    const billMaps = new Map();
    perBillRes.rows.forEach((row) => {
      const bid = row.bill_id;
      if (!billMaps.has(bid)) {
        billMaps.set(bid, { billName: row.bill_name, amounts: new Map() });
      }
      const k = `${row.year}-${row.month}`;
      billMaps.get(bid).amounts.set(k, parseFloat(row.bill_amount) || 0);
    });
    billMaps.forEach((data, bid) => {
      const points = [];
      let yy = start.y;
      let mm = start.mo;
      while (yy * 12 + mm <= end.y * 12 + end.mo) {
        const key = `${yy}-${mm}`;
        points.push({
          year: yy,
          month: mm,
          label: `${monthShort[mm - 1]}/${yy}`,
          totalAmount: data.amounts.get(key) || 0,
        });
        mm += 1;
        if (mm > 12) {
          mm = 1;
          yy += 1;
        }
      }
      seriesPorConta.push({ billId: bid, billName: data.billName, points });
    });
  }

  /** Segundo eixo: consumo físico (só se uma unidade distinta no período filtrado) */
  let seriesConsumption = null;
  let consumptionUnitLabel = null;
  const buildUnitDistinctQuery = () => {
    let sql = `SELECT DISTINCT NULLIF(TRIM(mc.consumption_unit), '') AS u
      FROM monthly_consumption mc
      INNER JOIN bills b ON mc.bill_id = b.id
      WHERE mc.condominium_id = $1
      AND (mc.year * 12 + mc.month) >= ($2 * 12 + $3)
      AND (mc.year * 12 + mc.month) <= ($4 * 12 + $5)
      AND mc.consumption_value IS NOT NULL
      AND NULLIF(TRIM(mc.consumption_unit), '') IS NOT NULL`;
    const params = [condominiumId, start.y, start.mo, end.y, end.mo];
    let pc = 6;
    if (consumoBillId != null) {
      sql += ` AND mc.bill_id = $${pc++}`;
      params.push(consumoBillId);
    }
    if (consumoBillType) {
      sql += ` AND b.bill_type = $${pc++}`;
      params.push(consumoBillType);
    }
    return { sql, params };
  };
  const uq = buildUnitDistinctQuery();
  const unitRes = await query(uq.sql, uq.params);
  const distinctUnits = unitRes.rows.map((r) => r.u).filter(Boolean);
  if (distinctUnits.length === 1) {
    consumptionUnitLabel = distinctUnits[0];
    const consAggSql = buildFilteredSql(
      `SELECT mc.year, mc.month, COALESCE(SUM(mc.consumption_value), 0) AS total_cv`
    );
    const consAggQuery = `${consAggSql.sql} GROUP BY mc.year, mc.month ORDER BY mc.year, mc.month`;
    const consRes = await query(consAggQuery, consAggSql.params);
    const consByKey = new Map();
    consRes.rows.forEach((row) => {
      consByKey.set(`${row.year}-${row.month}`, parseFloat(row.total_cv) || 0);
    });
    seriesConsumption = [];
    let cy = start.y;
    let cm = start.mo;
    while (cy * 12 + cm <= end.y * 12 + end.mo) {
      const ck = `${cy}-${cm}`;
      seriesConsumption.push({
        year: cy,
        month: cm,
        label: `${monthShort[cm - 1]}/${cy}`,
        totalConsumption: consByKey.get(ck) || 0,
      });
      cm += 1;
      if (cm > 12) {
        cm = 1;
        cy += 1;
      }
    }
  }

  const recentSql = buildFilteredSql(
    `SELECT mc.id, mc.month, mc.year, mc.bill_amount, mc.consumption_value, mc.consumption_unit,
            b.name as bill_name, b.bill_type`
  );
  const recentQuery = `${recentSql.sql} ORDER BY mc.year DESC, mc.month DESC, b.name ASC LIMIT 5000`;
  const recentRes = await query(recentQuery, recentSql.params);
  const recentRecords = recentRes.rows.map((row) => ({
    id: row.id,
    billName: row.bill_name,
    billType: row.bill_type,
    month: row.month,
    year: row.year,
    billAmount: parseFloat(row.bill_amount) || 0,
    consumptionValue: row.consumption_value != null ? parseFloat(row.consumption_value) : null,
    consumptionUnit: row.consumption_unit,
  }));

  return {
    periodo: {
      dataInicio,
      dataFim,
      dataInicioAnterior,
      dataFimAnterior,
      label: periodo.label,
      labelAnterior: periodo.labelAnterior,
    },
    filters: {
      consumoBillId,
      consumoBillType,
    },
    totalAmount,
    countRecords,
    monthsInPeriod,
    avgMonthlyAmount,
    prevTotalAmount,
    variationPct,
    lastMonthLabel,
    series,
    seriesPorConta,
    seriesConsumption,
    consumptionUnitLabel,
    recentRecords,
  };
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

    // Verifica se o mês da data está fechado (e não reaberto)
    // Se houver pelo menos um fechamento CLOSED (não reaberto), bloqueia
    const monthlyClosureService = require('./monthlyClosureService');
    const isClosed = await monthlyClosureService.isMonthClosed(condominiumId, entryDate);
    
    if (isClosed) {
      const entryMonth = new Date(entryDate).getMonth() + 1;
      const entryYear = new Date(entryDate).getFullYear();
      throw new Error(`Não é possível criar entrada financeira. O mês ${entryMonth}/${entryYear} está fechado. Reabra o mês primeiro se necessário.`);
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
        category || DEFAULT_RECEITA_CATEGORY,
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

    // Fundo de reserva como conta: receita RECEITAS_FUNDO_RESERVA recebida credita o fundo
    if (entry.category === RESERVA_RECEITA && entry.received === true) {
      try {
        await reserveFundService.addContribution(condominiumId, userId, entry.amount, ipAddress, userAgent);
        await query(`UPDATE financial_entries SET reserve_fund_credited = TRUE WHERE id = $1 AND condominium_id = $2`, [entry.id, condominiumId]);
        entry.reserve_fund_credited = true;
      } catch (err) {
        console.warn('Aviso: não foi possível creditar entrada no fundo de reserva:', err.message);
      }
    }

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
       WHERE fe.id = $1 AND fe.condominium_id = $2 AND fe.deleted_at IS NULL`,
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

// Listar entradas excluídas (soft delete) para recuperação
const listDeletedEntries = async (condominiumId, limit = 50) => {
  try {
    const result = await query(
      `SELECT fe.*, cc.name as cost_center_name, u.full_name as created_by_name,
              du.full_name as deleted_by_name
       FROM financial_entries fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id AND cc.condominium_id = fe.condominium_id
       LEFT JOIN users u ON fe.created_by = u.id
       LEFT JOIN users du ON fe.deleted_by = du.id
       WHERE fe.condominium_id = $1 AND fe.deleted_at IS NOT NULL
       ORDER BY fe.deleted_at DESC
       LIMIT $2`,
      [condominiumId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar entradas excluídas:', error);
    throw error;
  }
};

// Restaurar entrada que foi excluída (soft delete)
const restoreEntry = async (entryId, condominiumId, userId, ipAddress, userAgent) => {
  try {
    const currentResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );
    if (currentResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }
    const current = currentResult.rows[0];
    if (!current.deleted_at) {
      throw new Error('Entrada não está excluída');
    }

    await query(
      `UPDATE financial_entries
       SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    const updatedResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );
    const updated = updatedResult.rows[0];

    await logAction({
      userId,
      condominiumId,
      action: 'RESTORE',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: current,
      afterData: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao restaurar entrada:', error);
    throw error;
  }
};

// Função para criar conta recorrente
// Recebe: condominiumId, userId, dados da conta
// Retorna: conta criada
// Novos campos opcionais (Fase 35): due_day, account_kind, recurrence, receipt_pdf_path
const createAccount = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { name, billType, provider, accountNumber, costCenterId, dueDay, accountKind, recurrence, receiptPdfPath } = data;

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

    const dueDayVal = dueDay != null && dueDay !== '' ? parseInt(dueDay, 10) : null;
    if (dueDayVal != null && (dueDayVal < 1 || dueDayVal > 31)) {
      throw new Error('Dia de vencimento deve ser entre 1 e 31');
    }
    const accountKindVal = (accountKind === 'VARIAVEL' || accountKind === 'FIXA') ? accountKind : 'FIXA';
    const recurrenceVal = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(recurrence) ? recurrence : 'MONTHLY';

    const result = await query(
      `INSERT INTO bills (condominium_id, name, bill_type, provider, account_number, cost_center_id, created_by, due_day, account_kind, recurrence, receipt_pdf_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        condominiumId,
        name.trim(),
        billType,
        provider || null,
        accountNumber || null,
        costCenterId || null,
        userId,
        dueDayVal,
        accountKindVal,
        recurrenceVal,
        receiptPdfPath && receiptPdfPath.trim() ? receiptPdfPath.trim() : null
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

// Função para buscar conta por ID (Fase 35 - comprovante, edição)
const getAccountById = async (accountId, condominiumId) => {
  try {
    const result = await query(
      `SELECT b.*, cc.name as cost_center_name, u.full_name as created_by_name
       FROM bills b
       LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id AND cc.condominium_id = $2
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = $1 AND b.condominium_id = $2`,
      [accountId, condominiumId]
    );
    if (result.rows.length === 0) {
      throw new Error('Conta não encontrada');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar conta:', error);
    throw error;
  }
};

// Função para atualizar conta recorrente
// Recebe: accountId, condominiumId, userId, dados atualizados
// Retorna: conta atualizada
const updateAccount = async (accountId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    // Busca conta atual e valida ownership
    const currentResult = await query(
      `SELECT * FROM bills WHERE id = $1 AND condominium_id = $2`,
      [accountId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Conta não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      if (!data.name || !data.name.trim()) {
        throw new Error('Nome da conta é obrigatório');
      }
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(data.name.trim());
    }

    if (data.billType !== undefined) {
      if (!data.billType) {
        throw new Error('Tipo da conta é obrigatório');
      }
      updateFields.push(`bill_type = $${paramCount++}`);
      updateValues.push(data.billType);
    }

    if (data.provider !== undefined) {
      updateFields.push(`provider = $${paramCount++}`);
      updateValues.push(data.provider || null);
    }

    if (data.accountNumber !== undefined) {
      updateFields.push(`account_number = $${paramCount++}`);
      updateValues.push(data.accountNumber || null);
    }

    if (data.costCenterId !== undefined) {
      updateFields.push(`cost_center_id = $${paramCount++}`);
      updateValues.push(data.costCenterId || null);
    }

    if (data.dueDay !== undefined) {
      const dueDayVal = data.dueDay != null && data.dueDay !== '' ? parseInt(data.dueDay, 10) : null;
      if (dueDayVal != null && (dueDayVal < 1 || dueDayVal > 31)) {
        throw new Error('Dia de vencimento deve ser entre 1 e 31');
      }
      updateFields.push(`due_day = $${paramCount++}`);
      updateValues.push(dueDayVal);
    }

    if (data.accountKind !== undefined) {
      const accountKindVal = (data.accountKind === 'VARIAVEL' || data.accountKind === 'FIXA') ? data.accountKind : 'FIXA';
      updateFields.push(`account_kind = $${paramCount++}`);
      updateValues.push(accountKindVal);
    }

    if (data.recurrence !== undefined) {
      const recurrenceVal = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(data.recurrence) ? data.recurrence : 'MONTHLY';
      updateFields.push(`recurrence = $${paramCount++}`);
      updateValues.push(recurrenceVal);
    }

    if (data.receiptPdfPath !== undefined) {
      updateFields.push(`receipt_pdf_path = $${paramCount++}`);
      updateValues.push(data.receiptPdfPath && data.receiptPdfPath.trim() ? data.receiptPdfPath.trim() : null);
    }

    if (data.active !== undefined) {
      updateFields.push(`active = $${paramCount++}`);
      updateValues.push(data.active);
    }

    if (updateFields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(accountId, condominiumId);

    const updateResult = await query(
      `UPDATE bills
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND condominium_id = $${paramCount++}
       RETURNING *`,
      updateValues
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Conta não encontrada ou não pertence a este condomínio');
    }

    const updated = updateResult.rows[0];

    await logAction({
      userId,
      condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'bills',
      entityId: accountId,
      beforeData: current,
      afterData: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
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

const findConsumptionIdByBillPeriod = async (condominiumId, billId, month, year) => {
  const result = await query(
    `SELECT id FROM monthly_consumption
     WHERE condominium_id = $1 AND bill_id = $2 AND month = $3 AND year = $4
     LIMIT 1`,
    [condominiumId, billId, month, year]
  );
  return result.rows[0] ? result.rows[0].id : null;
};

const getConsumptionById = async (consumptionId, condominiumId) => {
  const result = await query(
    `SELECT mc.*, b.name as bill_name, b.bill_type
     FROM monthly_consumption mc
     INNER JOIN bills b ON mc.bill_id = b.id
     WHERE mc.id = $1 AND mc.condominium_id = $2`,
    [consumptionId, condominiumId]
  );
  return result.rows[0] || null;
};

const updateConsumption = async (consumptionId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const current = await getConsumptionById(consumptionId, condominiumId);
    if (!current) {
      throw new Error('Registro de consumo não encontrado');
    }

    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    const billId = data.billId != null ? parseInt(data.billId, 10) : current.bill_id;
    const month = data.month != null ? parseInt(data.month, 10) : current.month;
    const year = data.year != null ? parseInt(data.year, 10) : current.year;
    const consumptionValue = data.consumptionValue !== undefined ? data.consumptionValue : current.consumption_value;
    const consumptionUnit = data.consumptionUnit !== undefined ? data.consumptionUnit : current.consumption_unit;
    const billAmount = data.billAmount !== undefined ? data.billAmount : current.bill_amount;
    const dueDate = data.dueDate !== undefined ? data.dueDate : current.due_date;

    const billResult = await query(`SELECT id FROM bills WHERE id = $1 AND condominium_id = $2`, [billId, condominiumId]);
    if (billResult.rows.length === 0) {
      throw new Error('Conta não encontrada ou não pertence a este condomínio');
    }

    const amountValidation = validateFinancialAmount(billAmount, {
      allowZero: false,
      allowNegative: false,
      maxValue: 10000000,
      fieldName: 'Valor da conta',
    });
    if (!amountValidation.valid) {
      throw new Error(amountValidation.error);
    }
    const amountValue = amountValidation.value;

    const dup = await query(
      `SELECT id FROM monthly_consumption
       WHERE condominium_id = $1 AND bill_id = $2 AND month = $3 AND year = $4 AND id <> $5`,
      [condominiumId, billId, month, year, consumptionId]
    );
    if (dup.rows.length > 0) {
      throw new Error('Já existe consumo registrado para esta conta neste período');
    }

    const updatedResult = await query(
      `UPDATE monthly_consumption
       SET bill_id = $1, month = $2, year = $3, consumption_value = $4, consumption_unit = $5,
           bill_amount = $6, due_date = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND condominium_id = $9
       RETURNING *`,
      [
        billId,
        month,
        year,
        consumptionValue === '' || consumptionValue == null ? null : consumptionValue,
        consumptionUnit || 'UNIDADE',
        amountValue,
        dueDate || null,
        consumptionId,
        condominiumId,
      ]
    );

    const updated = updatedResult.rows[0];

    await logAction({
      userId,
      condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'monthly_consumption',
      entityId: consumptionId,
      beforeData: current,
      afterData: updated,
      ipAddress,
      userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar consumo:', error);
    throw error;
  }
};

const deleteConsumption = async (consumptionId, condominiumId, userId, ipAddress, userAgent) => {
  try {
    const current = await getConsumptionById(consumptionId, condominiumId);
    if (!current) {
      throw new Error('Registro de consumo não encontrado');
    }

    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    await query(`DELETE FROM monthly_consumption WHERE id = $1 AND condominium_id = $2`, [consumptionId, condominiumId]);

    await logAction({
      userId,
      condominiumId,
      action: 'DELETE',
      module: 'FINANCIAL',
      entityType: 'monthly_consumption',
      entityId: consumptionId,
      beforeData: current,
      afterData: null,
      ipAddress,
      userAgent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao excluir consumo:', error);
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

    if (filters.billType && ALLOWED_CONSUMO_BILL_TYPES.includes(String(filters.billType))) {
      sql += ` AND b.bill_type = $${paramCount++}`;
      params.push(filters.billType);
    }

    if (filters.monthFromKey != null && filters.monthToKey != null) {
      sql += ` AND (mc.year * 12 + mc.month) >= $${paramCount++} AND (mc.year * 12 + mc.month) <= $${paramCount++}`;
      params.push(filters.monthFromKey, filters.monthToKey);
    }

    sql += ` ORDER BY mc.year DESC, mc.month DESC, b.name ASC LIMIT $${paramCount}`;
    params.push(filters.limit || 500);

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

    // Método e detalhes são opcionais; aceita null/empty
    const finalReceiptMethod = receiptMethod && receiptMethod.trim() ? receiptMethod.trim() : null;
    const finalReceiptDetails = receiptDetails && receiptDetails.trim() ? receiptDetails.trim() : null;

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

    // Comprovante é opcional: pode ser adicionado depois pelo fluxo "Ver Comprovante" → Adicionar
    const isTaxaEntry = current.linked_to_type === 'MONTHLY_FEE';
    let finalReceiptPdfPath = receiptPdfPath && receiptPdfPath.trim() ? receiptPdfPath.trim() : null;
    if (isTaxaEntry && !finalReceiptPdfPath) {
      finalReceiptPdfPath = 'taxa_paga_sem_comprovante.pdf';
    }

    // Atualiza entrada como recebida
    // IMPORTANTE: Isso atualiza o saldo financeiro automaticamente
    // O saldo é calculado como: entradas recebidas (received = TRUE) - saídas pagas
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
        finalReceiptPdfPath,
        finalReceiptMethod,
        finalReceiptDetails,
        receiptNotes ? receiptNotes.trim() : null,
        entryId,
        condominiumId
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Entrada não encontrada, não pertence a este condomínio ou já foi recebida');
    }

    const updated = updateResult.rows[0];

    // Fundo de reserva como conta: ao marcar como recebida, se for RECEITAS_FUNDO_RESERVA, credita o fundo
    if (current.category === RESERVA_RECEITA && !current.reserve_fund_credited) {
      try {
        await reserveFundService.addContribution(condominiumId, userId, updated.amount, ipAddress, userAgent);
        await query(`UPDATE financial_entries SET reserve_fund_credited = TRUE WHERE id = $1 AND condominium_id = $2`, [entryId, condominiumId]);
        updated.reserve_fund_credited = true;
      } catch (err) {
        console.warn('Aviso: não foi possível creditar entrada no fundo de reserva:', err.message);
      }
    }

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

    // Invalidar cache do dashboard para o saldo refletir a entrada concluída
    const cacheService = require('./cacheService');
    cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);

    return updated;
  } catch (error) {
    console.error('Erro ao marcar entrada como recebida:', error);
    throw error;
  }
};

// Função para desfazer recebimento de entrada financeira
// Recebe: entryId, condominiumId, userId, motivo, ipAddress, userAgent
// Retorna: entrada atualizada
const unmarkEntryAsReceived = async (entryId, condominiumId, userId, reason, ipAddress, userAgent) => {
  try {
    if (!reason || !reason.trim()) {
      throw new Error('Motivo para desfazer recebimento é obrigatório');
    }

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

    if (!current.received) {
      throw new Error('Entrada não está marcada como recebida');
    }

    // Verifica fechamento mensal na data do recebimento (ou da entrada, se não houver)
    const monthlyClosureService = require('./monthlyClosureService');
    const referenceDate = current.received_at || current.entry_date;
    const isClosed = await monthlyClosureService.isMonthClosed(condominiumId, referenceDate);
    if (isClosed) {
      const d = new Date(referenceDate);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      throw new Error(`Não é possível desfazer o recebimento. O mês ${m}/${y} está fechado.`);
    }

    // Fundo de reserva: reverter crédito se esta entrada havia creditado o fundo
    if (current.reserve_fund_credited === true) {
      try {
        await reserveFundService.subtractFromReserveFund(condominiumId, userId, current.amount, ipAddress, userAgent);
      } catch (err) {
        console.warn('Aviso: não foi possível reverter crédito no fundo de reserva:', err.message);
      }
    }

    const updateResult = await query(
      `UPDATE financial_entries
       SET received = FALSE,
           received_at = NULL,
           reserve_fund_credited = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND condominium_id = $2
       RETURNING *`,
      [entryId, condominiumId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Entrada não encontrada ou não pertence a este condomínio');
    }

    const updated = updateResult.rows[0];

    await logAction({
      userId,
      condominiumId,
      action: 'UNMARK_RECEIVED',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: current,
      afterData: updated,
      ipAddress,
      userAgent,
      notes: `Motivo desfazer recebimento: ${reason.trim()}`,
    });

    // Invalidar cache do dashboard, já que o saldo muda
    const cacheService = require('./cacheService');
    cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);

    return updated;
  } catch (error) {
    console.error('Erro ao desfazer recebimento da entrada:', error);
    throw error;
  }
};

// Função para adicionar/atualizar comprovante em entrada já recebida
// Recebe: entryId, condominiumId, userId, { receiptPdfPath, receiptDetails, receiptNotes, receiptMethod }, ipAddress, userAgent
// Retorna: entrada atualizada
const addReceiptToEntry = async (entryId, condominiumId, userId, receiptData, ipAddress, userAgent) => {
  try {
    const { receiptPdfPath, receiptDetails, receiptNotes, receiptMethod } = receiptData;

    if (!receiptPdfPath || !receiptPdfPath.trim()) {
      throw new Error('Comprovante em PDF é obrigatório');
    }
    if (!receiptDetails || !receiptDetails.trim()) {
      throw new Error('Detalhes do recebimento são obrigatórios');
    }

    const currentResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2 AND deleted_at IS NULL`,
      [entryId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const current = currentResult.rows[0];

    if (!current.received) {
      throw new Error('Entrada ainda não foi marcada como recebida. Use o fluxo "Marcar como Recebido".');
    }

    const owns = await validateCondominiumOwnership('financial_entries', entryId, condominiumId);
    if (!owns) {
      throw new Error('Entrada não pertence a este condomínio');
    }

    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    const updateResult = await query(
      `UPDATE financial_entries
       SET receipt_pdf_path = $1,
           receipt_details = $2,
           receipt_notes = $3,
           receipt_method = COALESCE(NULLIF(TRIM($4), ''), receipt_method),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND condominium_id = $6 AND received = TRUE
       RETURNING *`,
      [
        receiptPdfPath.trim(),
        receiptDetails.trim(),
        receiptNotes ? receiptNotes.trim() : null,
        receiptMethod ? receiptMethod.trim() : null,
        entryId,
        condominiumId
      ]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Entrada não encontrada ou não está recebida');
    }

    const updated = updateResult.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'ADD_RECEIPT',
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
    console.error('Erro ao adicionar comprovante à entrada:', error);
    throw error;
  }
};

module.exports = {
  createExit,
  updateExit,
  approveExit,
  rejectExit,
  markExitAsPaid,
  unmarkExitAsPaid,
  deleteExit,
  requestUnpayExit,
  listExits,
  getExitById,
  updateExitAttachments,
  removeExitAttachment,
  getDashboardStats,
  getConsumptionAnalytics,
  createEntry,
  getEntryById,
  updateEntry,
  deleteEntry,
  listEntries,
  listDeletedEntries,
  restoreEntry,
  approveEntry,
  rejectEntry,
  listPendingEntries,
  listRejectedEntries,
  markEntryAsReceived,
  addReceiptToEntry,
  unmarkEntryAsReceived,
  createAccount,
  listAccounts,
  getAccountById,
   updateAccount,
  createConsumption,
  findConsumptionIdByBillPeriod,
  getConsumptionById,
  updateConsumption,
  deleteConsumption,
  listConsumption,
  createCostCenter,
  listCostCenters,
};

// Service do módulo SINDICO/SUBSINDICO
// Contém lógica de negócio para o painel do síndico
// Apenas SINDICO ou SUBSINDICO podem executar essas operações

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria

// Função para obter estatísticas do condomínio do síndico
// Recebe: condominiumId
// Retorna: estatísticas (alertas críticos, aprovações pendentes, financeiro, etc)
const getDashboardStats = async (condominiumId) => {
  try {
    // Conta aprovações pendentes
    const pendingApprovalsResult = await query(
      `SELECT COUNT(*) as total FROM approvals 
       WHERE condominium_id = $1 AND status = 'PENDING'`,
      [condominiumId]
    );
    const pendingApprovals = parseInt(pendingApprovalsResult.rows[0].total);

    // Conta alertas críticos não resolvidos
    const criticalAlertsResult = await query(
      `SELECT COUNT(*) as total FROM alerts 
       WHERE condominium_id = $1 AND severity = 'CRITICAL' AND resolved = FALSE`,
      [condominiumId]
    );
    const criticalAlerts = parseInt(criticalAlertsResult.rows[0].total);

    // Conta alertas de warning não resolvidos
    const warningAlertsResult = await query(
      `SELECT COUNT(*) as total FROM alerts 
       WHERE condominium_id = $1 AND severity = 'WARNING' AND resolved = FALSE`,
      [condominiumId]
    );
    const warningAlerts = parseInt(warningAlertsResult.rows[0].total);

    // Conta despesas pendentes de aprovação
    const pendingExpensesResult = await query(
      `SELECT COUNT(*) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PENDING' AND requires_approval = TRUE`,
      [condominiumId]
    );
    const pendingExpenses = parseInt(pendingExpensesResult.rows[0].total);

    // Valor total pendente de aprovação
    const pendingAmountResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PENDING' AND requires_approval = TRUE`,
      [condominiumId]
    );
    const pendingAmount = parseFloat(pendingAmountResult.rows[0].total);

    // Saldo financeiro (entradas - saídas pagas)
    const entriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 AND received = TRUE`,
      [condominiumId]
    );
    const totalEntries = parseFloat(entriesResult.rows[0].total);

    const exitsPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PAID'`,
      [condominiumId]
    );
    const totalExitsPaid = parseFloat(exitsPaidResult.rows[0].total);
    const balance = totalEntries - totalExitsPaid;

    // Tarefas atrasadas
    const overdueTasksResult = await query(
      `SELECT COUNT(*) as total FROM tasks 
       WHERE condominium_id = $1 AND status IN ('PENDING', 'IN_PROGRESS') 
       AND due_date < CURRENT_DATE`,
      [condominiumId]
    );
    const overdueTasks = parseInt(overdueTasksResult.rows[0].total);

    // Ocorrências abertas
    const openOccurrencesResult = await query(
      `SELECT COUNT(*) as total FROM occurrences 
       WHERE condominium_id = $1 AND status IN ('ABERTA', 'EM_ATENDIMENTO')`,
      [condominiumId]
    );
    const openOccurrences = parseInt(openOccurrencesResult.rows[0].total);

    return {
      pendingApprovals,
      criticalAlerts,
      warningAlerts,
      pendingExpenses,
      pendingAmount,
      balance,
      totalEntries,
      totalExitsPaid,
      overdueTasks,
      openOccurrences,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard síndico:', error);
    throw error;
  }
};

// Função para listar aprovações pendentes
// Recebe: condominiumId
// Retorna: lista de aprovações pendentes
const listPendingApprovals = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT a.*, u.full_name as requested_by_name
       FROM approvals a
       LEFT JOIN users u ON a.requested_by = u.id
       WHERE a.condominium_id = $1 AND a.status = 'PENDING'
       ORDER BY a.created_at DESC`,
      [condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar aprovações pendentes:', error);
    throw error;
  }
};

// Função para aprovar ou rejeitar uma aprovação
// Recebe: approvalId, action ('APPROVE' ou 'REJECT'), reason (opcional), userId
// Retorna: aprovação atualizada
const processApproval = async (approvalId, action, reason, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca aprovação atual
    const approvalResult = await query(
      `SELECT * FROM approvals WHERE id = $1 AND condominium_id = $2`,
      [approvalId, condominiumId]
    );

    if (approvalResult.rows.length === 0) {
      throw new Error('Aprovação não encontrada');
    }

    const approval = approvalResult.rows[0];

    if (approval.status !== 'PENDING') {
      throw new Error('Aprovação já foi processada');
    }

    // Atualiza status
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updateResult = await query(
      `UPDATE approvals 
       SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, 
           rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [newStatus, userId, reason || null, approvalId]
    );

    const updated = updateResult.rows[0];

    // Se foi aprovada, atualiza a entidade relacionada (se for despesa financeira)
    if (newStatus === 'APPROVED' && approval.entity_type === 'financial_exits') {
      await query(
        `UPDATE financial_exits 
         SET payment_status = 'APPROVED', approved_by = $1, approved_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [userId, approval.entity_id]
      );
    }

    // Registra no log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: newStatus === 'APPROVED' ? 'APPROVE' : 'REJECT',
      module: 'APPROVAL',
      entityType: 'approvals',
      entityId: approvalId,
      beforeData: approval,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    throw error;
  }
};

// Função para listar alertas do condomínio
// Recebe: condominiumId, filtros opcionais (resolved, severity)
// Retorna: lista de alertas
const listAlerts = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT a.*, u.full_name as resolved_by_name
      FROM alerts a
      LEFT JOIN users u ON a.resolved_by = u.id
      WHERE a.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Aplica filtros
    if (filters.resolved !== undefined) {
      sql += ` AND a.resolved = $${paramCount++}`;
      params.push(filters.resolved);
    }

    if (filters.severity) {
      sql += ` AND a.severity = $${paramCount++}`;
      params.push(filters.severity);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    throw error;
  }
};

// Função para resolver um alerta
// Recebe: alertId, userId, condominiumId
// Retorna: alerta atualizado
const resolveAlert = async (alertId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca alerta atual
    const alertResult = await query(
      `SELECT * FROM alerts WHERE id = $1 AND condominium_id = $2`,
      [alertId, condominiumId]
    );

    if (alertResult.rows.length === 0) {
      throw new Error('Alerta não encontrado');
    }

    const alert = alertResult.rows[0];

    // Atualiza alerta
    const updateResult = await query(
      `UPDATE alerts 
       SET resolved = TRUE, resolved_by = $1, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [userId, alertId]
    );

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'RESOLVE',
      module: 'ALERT',
      entityType: 'alerts',
      entityId: alertId,
      beforeData: alert,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    throw error;
  }
};

// Função para listar logs de auditoria do condomínio
// Recebe: condominiumId, filtros opcionais (module, userId, limit, startDate, endDate, action)
// Retorna: lista de logs
const listAuditLogs = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT al.*, u.full_name as user_name, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Aplica filtros
    if (filters.module) {
      sql += ` AND al.module = $${paramCount++}`;
      params.push(filters.module);
    }

    if (filters.userId) {
      sql += ` AND al.user_id = $${paramCount++}`;
      params.push(filters.userId);
    }

    if (filters.action) {
      sql += ` AND al.action = $${paramCount++}`;
      params.push(filters.action);
    }

    if (filters.startDate) {
      sql += ` AND al.created_at >= $${paramCount++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND al.created_at <= $${paramCount++}`;
      params.push(filters.endDate + ' 23:59:59');
    }

    sql += ` ORDER BY al.created_at DESC LIMIT $${paramCount}`;
    params.push(filters.limit || 100);

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar logs de auditoria:', error);
    throw error;
  }
};

// Função para listar usuários do condomínio (para filtros)
// Recebe: condominiumId
// Retorna: lista de usuários
const listUsers = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT u.id, u.full_name, u.username
       FROM users u
       WHERE u.condominium_id = $1 AND u.active = TRUE
       ORDER BY u.full_name`,
      [condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  getDashboardStats,
  listPendingApprovals,
  processApproval,
  listAlerts,
  resolveAlert,
  listAuditLogs,
  listUsers,
};

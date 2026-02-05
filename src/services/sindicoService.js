// Service do módulo SINDICO/SUBSINDICO
// Contém lógica de negócio para o painel do síndico
// Apenas SINDICO ou SUBSINDICO podem executar essas operações

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria
const cacheService = require('./cacheService'); // Service de cache

// Função para obter estatísticas do condomínio do síndico
// Recebe: condominiumId
// Retorna: estatísticas (alertas críticos, aprovações pendentes, financeiro, etc)
const getDashboardStats = async (condominiumId) => {
  try {
    // Tentar obter do cache
    const cacheKey = `dashboard:stats:${condominiumId}`;
    const cachedStats = cacheService.get(cacheKey);
    if (cachedStats) {
      console.log('📦 Dashboard stats retornados do cache');
      return cachedStats;
    }
    
    // Se não estiver no cache, calcular
    console.log('🔄 Calculando dashboard stats...');
    // Conta aprovações pendentes (se a tabela existir)
    let pendingApprovals = 0;
    try {
      const pendingApprovalsResult = await query(
        `SELECT COUNT(*) as total FROM approvals 
         WHERE condominium_id = $1 AND status = 'PENDING'`,
        [condominiumId]
      );
      pendingApprovals = parseInt(pendingApprovalsResult.rows[0].total);
    } catch (error) {
      // Tabela approvals não existe, usar valor padrão
      console.log('⚠️ Tabela approvals não encontrada, usando valor padrão');
      pendingApprovals = 0;
    }

    // Conta alertas críticos não resolvidos (se a tabela existir)
    let criticalAlerts = 0;
    let warningAlerts = 0;
    try {
      // Verificar se a tabela existe antes de consultar
      const tableExists = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'alerts'
        )`
      );
      
      if (tableExists.rows[0].exists) {
        const criticalAlertsResult = await query(
          `SELECT COUNT(*) as total FROM alerts 
           WHERE condominium_id = $1 AND severity = 'CRITICAL' AND resolved = FALSE`,
          [condominiumId]
        );
        criticalAlerts = parseInt(criticalAlertsResult.rows[0].total);

        // Conta alertas de warning não resolvidos
        const warningAlertsResult = await query(
          `SELECT COUNT(*) as total FROM alerts 
           WHERE condominium_id = $1 AND severity = 'WARNING' AND resolved = FALSE`,
          [condominiumId]
        );
        warningAlerts = parseInt(warningAlertsResult.rows[0].total);
      } else {
        // Tabela não existe, usar valores padrão silenciosamente
        criticalAlerts = 0;
        warningAlerts = 0;
      }
    } catch (error) {
      // Se houver qualquer erro, usar valores padrão silenciosamente
      // Não logar erro para evitar poluição do console
      criticalAlerts = 0;
      warningAlerts = 0;
    }

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

    // Saídas aprovadas mas não pagas (comprometem o saldo)
    const exitsApprovedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'APPROVED'`,
      [condominiumId]
    );
    const totalExitsApproved = parseFloat(exitsApprovedResult.rows[0].total);

    const balance = totalEntries - totalExitsPaid - totalExitsApproved;

    // Gastos do mês atual (consolidado)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentMonthExitsPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM exit_date) = $2 
       AND EXTRACT(YEAR FROM exit_date) = $3 
       AND payment_status = 'PAID'`,
      [condominiumId, currentMonth, currentYear]
    );
    const currentMonthExitsPaid = parseFloat(currentMonthExitsPaidResult.rows[0].total);

    const currentMonthExitsApprovedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM exit_date) = $2 
       AND EXTRACT(YEAR FROM exit_date) = $3 
       AND payment_status = 'APPROVED'`,
      [condominiumId, currentMonth, currentYear]
    );
    const currentMonthExitsApproved = parseFloat(currentMonthExitsApprovedResult.rows[0].total);
    
    const currentMonthExpenses = currentMonthExitsPaid + currentMonthExitsApproved;

    // Entradas recebidas do mês atual (para saldo do mês)
    const currentMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM entry_date) = $2 
       AND EXTRACT(YEAR FROM entry_date) = $3 
       AND received = TRUE AND deleted_at IS NULL`,
      [condominiumId, currentMonth, currentYear]
    );
    const currentMonthEntries = parseFloat(currentMonthEntriesResult.rows[0].total);

    // Gastos do mês anterior (para comparação)
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Entradas recebidas do mês passado (para saldo do mês passado)
    const lastMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM entry_date) = $2 
       AND EXTRACT(YEAR FROM entry_date) = $3 
       AND received = TRUE AND deleted_at IS NULL`,
      [condominiumId, lastMonth, lastMonthYear]
    );
    const lastMonthEntries = parseFloat(lastMonthEntriesResult.rows[0].total);
    
    const lastMonthExitsPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM exit_date) = $2 
       AND EXTRACT(YEAR FROM exit_date) = $3 
       AND payment_status = 'PAID'`,
      [condominiumId, lastMonth, lastMonthYear]
    );
    const lastMonthExitsPaid = parseFloat(lastMonthExitsPaidResult.rows[0].total);

    const lastMonthExitsApprovedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM exit_date) = $2 
       AND EXTRACT(YEAR FROM exit_date) = $3 
       AND payment_status = 'APPROVED'`,
      [condominiumId, lastMonth, lastMonthYear]
    );
    const lastMonthExitsApproved = parseFloat(lastMonthExitsApprovedResult.rows[0].total);
    
    const lastMonthExpenses = lastMonthExitsPaid + lastMonthExitsApproved;

    // Saldo do mês atual e do mês passado (entradas recebidas - saídas pagas - saídas aprovadas do mês)
    const currentMonthExits = currentMonthExitsPaid + currentMonthExitsApproved;
    const lastMonthExits = lastMonthExitsPaid + lastMonthExitsApproved;
    const saldoMesAtual = currentMonthEntries - currentMonthExits;
    const saldoMesPassado = lastMonthEntries - lastMonthExits;
    
    // Comparativo com mês anterior (%)
    const expensesVariation = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0;

    // Inadimplência (se existir tabela monthly_fees)
    let delinquencyRate = 0;
    let totalOverdue = 0;
    let overdueCount = 0;
    
    try {
      const overdueResult = await query(
        `SELECT COUNT(*) as total, COALESCE(SUM(amount + late_fee + interest), 0) as total_amount
         FROM monthly_fees 
         WHERE condominium_id = $1 AND paid = FALSE AND due_date < CURRENT_DATE`,
        [condominiumId]
      );
      
      overdueCount = parseInt(overdueResult.rows[0].total);
      totalOverdue = parseFloat(overdueResult.rows[0].total_amount);

      const totalFeesResult = await query(
        `SELECT COUNT(*) as total FROM monthly_fees 
         WHERE condominium_id = $1 
         AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
        [condominiumId]
      );
      
      const totalFees = parseInt(totalFeesResult.rows[0].total);
      delinquencyRate = totalFees > 0 ? (overdueCount / totalFees) * 100 : 0;
    } catch (error) {
      // Tabela pode não existir ainda, ignora erro
      console.log('Tabela monthly_fees ainda não existe ou erro ao calcular inadimplência:', error.message);
    }

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

    // Conta entradas pendentes de análise
    const pendingEntriesResult = await query(
      `SELECT COUNT(*) as total FROM financial_entries 
       WHERE condominium_id = $1 AND review_status = 'PENDING_REVIEW' AND deleted_at IS NULL`,
      [condominiumId]
    );
    const pendingEntries = parseInt(pendingEntriesResult.rows[0].total);

    // Conta orçamentos aguardando aprovação (apenas os que têm quotes pendentes)
    // Mesma lógica da página de orçamentos pendentes
    // Query otimizada: conta apenas budget_requests com status PENDING_SINDICO
    // que têm pelo menos um quote que não está APPROVED nem REJECTED
    const pendingBudgetsResult = await query(
      `SELECT COUNT(DISTINCT br.id) as total 
       FROM budget_requests br
       INNER JOIN budget_quotes bq ON br.id = bq.budget_request_id
       WHERE br.condominium_id = $1 
       AND br.status = 'PENDING_SINDICO'
       AND UPPER(TRIM(COALESCE(bq.status, ''))) NOT IN ('APPROVED', 'REJECTED')`,
      [condominiumId]
    );
    const pendingBudgets = parseInt(pendingBudgetsResult.rows[0].total);

    // Conta manutenções concluídas aguardando revisão
    const completedMaintenancesResult = await query(
      `SELECT COUNT(*) as total FROM maintenances 
       WHERE condominium_id = $1 AND status = 'COMPLETED' AND created_by IN (
         SELECT id FROM users WHERE condominium_id = $1
       )`,
      [condominiumId]
    );
    const completedMaintenances = parseInt(completedMaintenancesResult.rows[0].total);

    // Conta ocorrências pendentes de aprovação
    const pendingOccurrencesApprovalResult = await query(
      `SELECT COUNT(*) as total FROM occurrences 
       WHERE condominium_id = $1 AND requires_approval = TRUE AND approval_status = 'PENDING' 
       AND (approval_required_from = 'SINDICO' OR approval_required_from = 'SUBSINDICO')`,
      [condominiumId]
    );
    const pendingOccurrencesApproval = parseInt(pendingOccurrencesApprovalResult.rows[0].total);

    return {
      pendingApprovals,
      criticalAlerts,
      warningAlerts,
      pendingExpenses,
      pendingAmount,
      balance,
      saldoMesAtual,
      saldoMesPassado,
      totalEntries,
      totalExitsPaid,
      overdueTasks,
      openOccurrences,
      pendingEntries,
      pendingBudgets,
      completedMaintenances,
      pendingOccurrencesApproval,
      currentMonthExpenses,
      lastMonthExpenses,
      expensesVariation,
      delinquencyRate,
      totalOverdue,
      overdueCount,
    };
    
    // Salvar no cache (5 minutos)
    cacheService.set(cacheKey, stats, 300);
    
    return stats;
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard síndico:', error);
    throw error;
  }
};

// Função para listar aprovações pendentes
// Recebe: condominiumId
// Retorna: lista de aprovações pendentes
const listPendingApprovals = async (condominiumId, filters = {}) => {
  try {
    // Padrões para filtros
    const {
      search = '',
      page = 1,
      perPage = 20,
      orderBy = 'created_at',
      orderDir = 'DESC'
    } = filters;

    // Construir query base
    let sql = `
      SELECT a.*, u.full_name as requested_by_name
      FROM approvals a
      LEFT JOIN users u ON a.requested_by = u.id
      WHERE a.condominium_id = $1 AND a.status = 'PENDING'
    `;
    const params = [condominiumId];
    let paramIndex = 2;

    // Adicionar busca por texto
    if (search) {
      sql += ` AND (
        a.approval_type ILIKE $${paramIndex} OR
        a.description ILIKE $${paramIndex} OR
        u.full_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Adicionar ordenação
    const validOrderBy = ['created_at', 'approval_type', 'amount', 'due_date'];
    const validOrderDir = ['ASC', 'DESC'];
    const orderByField = validOrderBy.includes(orderBy) ? orderBy : 'created_at';
    const orderDirection = validOrderDir.includes(orderDir.toUpperCase()) ? orderDir.toUpperCase() : 'DESC';
    sql += ` ORDER BY a.${orderByField} ${orderDirection}`;

    // Adicionar paginação
    const offset = (page - 1) * perPage;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(perPage, offset);

    // Executar query principal
    const result = await query(sql, params);

    // Contar total de registros (sem LIMIT e OFFSET)
    let countSql = `
      SELECT COUNT(*) as total
      FROM approvals a
      LEFT JOIN users u ON a.requested_by = u.id
      WHERE a.condominium_id = $1 AND a.status = 'PENDING'
    `;
    const countParams = [condominiumId];
    let countParamIndex = 2;

    if (search) {
      countSql += ` AND (
        a.approval_type ILIKE $${countParamIndex} OR
        a.description ILIKE $${countParamIndex} OR
        u.full_name ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await query(countSql, countParams);
    const totalRecords = countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0;
    const totalPages = Math.ceil(totalRecords / perPage);

    return {
      approvals: result.rows,
      pagination: {
        currentPage: page,
        perPage: perPage,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages
      }
    };
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
    const { validateUserBelongsToCondominium } = require('../utils/queryHelper');
    const permissionService = require('./permissionService');

    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Busca aprovação atual com lock (SELECT FOR UPDATE) para controle de concorrência
    const approvalResult = await query(
      `SELECT * FROM approvals 
       WHERE id = $1 AND condominium_id = $2 
       FOR UPDATE`,
      [approvalId, condominiumId]
    );

    if (approvalResult.rows.length === 0) {
      throw new Error('Aprovação não encontrada');
    }

    const approval = approvalResult.rows[0];

    if (approval.status !== 'PENDING') {
      throw new Error('Aprovação já foi processada');
    }

    // Valida permissão
    if (action === 'APPROVE') {
      if (approval.entity_type === 'financial_exits') {
        // Busca a saída para verificar se é alto valor
        const exitResult = await query(
          `SELECT amount, approval_limit FROM financial_exits WHERE id = $1`,
          [approval.entity_id]
        );
        
        if (exitResult.rows.length > 0) {
          const exit = exitResult.rows[0];
          const limitValue = exit.approval_limit || 1000.00;
          const isHighValue = parseFloat(exit.amount) > limitValue;
          
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
        }
      }
    }

    // Atualiza status
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updateResult = await query(
      `UPDATE approvals 
       SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, 
           rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status = 'PENDING'
       RETURNING *`,
      [newStatus, userId, reason || null, approvalId]
    );

    if (updateResult.rows.length === 0) {
      throw new Error('Aprovação foi modificada por outro usuário. Recarregue a página e tente novamente.');
    }

    const updated = updateResult.rows[0];

    // Se foi aprovada, atualiza a entidade relacionada (se for despesa financeira)
    if (newStatus === 'APPROVED' && approval.entity_type === 'financial_exits') {
      // Usa lock otimista com version
      const exitResult = await query(
        `SELECT version FROM financial_exits WHERE id = $1`,
        [approval.entity_id]
      );
      
      if (exitResult.rows.length > 0) {
        const currentVersion = exitResult.rows[0].version;
        await query(
          `UPDATE financial_exits 
           SET payment_status = 'APPROVED', 
               approved_by = $1, 
               approved_at = CURRENT_TIMESTAMP,
               version = version + 1
           WHERE id = $2 AND version = $3 AND payment_status = 'PENDING'`,
          [userId, approval.entity_id, currentVersion]
        );
      }
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

    // Quando aprovação é de saída financeira, o saldo muda; invalidar cache do dashboard
    if (approval.entity_type === 'financial_exits') {
      cacheService.deletePattern(`dashboard:stats:${condominiumId}`);
      cacheService.deletePattern(`dashboard:analytics:${condominiumId}`);
    }

    return updated;
  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    throw error;
  }
};

// Função para listar alertas do condomínio
// Recebe: condominiumId, filtros opcionais (resolved, severity, search, page, perPage)
// Retorna: lista de alertas com paginação
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

    // Busca por texto (título, mensagem, nome do resolvedor)
    if (filters.search) {
      sql += ` AND (
        a.title ILIKE $${paramCount} OR 
        a.message ILIKE $${paramCount} OR
        u.full_name ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Aplica filtros
    if (filters.resolved !== undefined) {
      sql += ` AND a.resolved = $${paramCount++}`;
      params.push(filters.resolved);
    }

    if (filters.severity) {
      sql += ` AND a.severity = $${paramCount++}`;
      params.push(filters.severity);
    }

    // Contar total de registros para paginação (query separada e mais simples)
    let countSql = `
      SELECT COUNT(*) as total
      FROM alerts a
      LEFT JOIN users u ON a.resolved_by = u.id
      WHERE a.condominium_id = $1
    `;
    const countParams = [condominiumId];
    let countParamCount = 2;
    
    // Aplicar os mesmos filtros da query principal
    if (filters.search) {
      countSql += ` AND (
        a.title ILIKE $${countParamCount} OR 
        a.message ILIKE $${countParamCount} OR
        u.full_name ILIKE $${countParamCount}
      )`;
      countParams.push(`%${filters.search}%`);
      countParamCount++;
    }
    
    if (filters.resolved !== undefined) {
      countSql += ` AND a.resolved = $${countParamCount++}`;
      countParams.push(filters.resolved);
    }
    
    if (filters.severity) {
      countSql += ` AND a.severity = $${countParamCount++}`;
      countParams.push(filters.severity);
    }
    
    const countResult = await query(countSql, countParams);
    const totalRecords = countResult && countResult.rows && countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0;

    // Paginação
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const offset = (page - 1) * perPage;
    const totalPages = Math.ceil(totalRecords / perPage);

    // Ordenação
    const orderBy = filters.orderBy || 'created_at';
    const orderDir = filters.orderDir || 'DESC';
    sql += ` ORDER BY a.${orderBy} ${orderDir} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(perPage, offset);

    const result = await query(sql, params);
    
    return {
      alerts: result.rows,
      pagination: {
        currentPage: page,
        perPage: perPage,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
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
// Recebe: condominiumId, filtros opcionais (module, userId, limit, startDate, endDate, action, search, page, perPage)
// Retorna: lista de logs com paginação
const listAuditLogs = async (condominiumId, filters = {}) => {
  try {
    // Construir query base
    let sql = `
      SELECT al.*, u.full_name as user_name, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Busca por texto (módulo, ação, nome do usuário)
    if (filters.search) {
      sql += ` AND (
        al.module ILIKE $${paramCount} OR 
        al.action ILIKE $${paramCount} OR
        u.full_name ILIKE $${paramCount} OR
        u.username ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

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

    // Contar total de registros para paginação (query separada)
    let countSql = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.condominium_id = $1
    `;
    const countParams = [condominiumId];
    let countParamCount = 2;
    
    // Aplicar os mesmos filtros
    if (filters.search) {
      countSql += ` AND (
        al.module ILIKE $${countParamCount} OR 
        al.action ILIKE $${countParamCount} OR
        u.full_name ILIKE $${countParamCount} OR
        u.username ILIKE $${countParamCount}
      )`;
      countParams.push(`%${filters.search}%`);
      countParamCount++;
    }
    
    if (filters.module) {
      countSql += ` AND al.module = $${countParamCount++}`;
      countParams.push(filters.module);
    }
    
    if (filters.userId) {
      countSql += ` AND al.user_id = $${countParamCount++}`;
      countParams.push(filters.userId);
    }
    
    if (filters.action) {
      countSql += ` AND al.action = $${countParamCount++}`;
      countParams.push(filters.action);
    }
    
    if (filters.startDate) {
      countSql += ` AND al.created_at >= $${countParamCount++}`;
      countParams.push(filters.startDate);
    }
    
    if (filters.endDate) {
      countSql += ` AND al.created_at <= $${countParamCount++}`;
      countParams.push(filters.endDate + ' 23:59:59');
    }
    
    const countResult = await query(countSql, countParams);
    const totalRecords = countResult && countResult.rows && countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0;

    // Paginação
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const offset = (page - 1) * perPage;
    const totalPages = Math.ceil(totalRecords / perPage);

    // Aplicar ordenação e paginação
    sql += ` ORDER BY al.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(perPage, offset);

    const result = await query(sql, params);
    
    return {
      logs: result.rows,
      pagination: {
        currentPage: page,
        perPage: perPage,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
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

// Função para listar tarefas do condomínio (para o síndico)
// Recebe: condominiumId, filtros opcionais (status, search, page, perPage)
// Retorna: lista de tarefas com informações completas e paginação
const listTasks = async (condominiumId, filters = {}) => {
  try {
    // Query otimizada com JOINs e subqueries para evitar N+1
    let sql = `
      SELECT 
        t.*,
        creator.full_name as created_by_name,
        assignee.full_name as assigned_to_name,
        -- Subquery para última observação
        (
          SELECT json_build_object(
            'observation', so.observation,
            'created_at', so.created_at,
            'user_name', u.full_name
          )
          FROM sindico_observations so
          LEFT JOIN users u ON so.user_id = u.id
          WHERE so.entity_type = 'tasks' 
            AND so.entity_id = t.id 
            AND so.condominium_id = $1
          ORDER BY so.created_at DESC
          LIMIT 1
        ) as last_observation,
        -- Subquery para contagem de checklists
        (
          SELECT json_build_object(
            'total', COUNT(*),
            'done', SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END)
          )
          FROM checklists
          WHERE task_id = t.id
        ) as checklists_stats
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Busca por texto (título, descrição, nome do criador/atribuído)
    if (filters.search) {
      sql += ` AND (
        t.title ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount} OR
        creator.full_name ILIKE $${paramCount} OR
        assignee.full_name ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Aplica filtros
    if (filters.status) {
      sql += ` AND t.status = $${paramCount++}`;
      params.push(filters.status);
    }

    // Contar total de registros para paginação (query separada)
    let countSql = `
      SELECT COUNT(*) as total
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.condominium_id = $1
    `;
    const countParams = [condominiumId];
    let countParamCount = 2;
    
    // Aplicar os mesmos filtros
    if (filters.search) {
      countSql += ` AND (
        t.title ILIKE $${countParamCount} OR 
        t.description ILIKE $${countParamCount} OR
        creator.full_name ILIKE $${countParamCount} OR
        assignee.full_name ILIKE $${countParamCount}
      )`;
      countParams.push(`%${filters.search}%`);
      countParamCount++;
    }
    
    if (filters.status) {
      countSql += ` AND t.status = $${countParamCount++}`;
      countParams.push(filters.status);
    }
    
    const countResult = await query(countSql, countParams);
    const totalRecords = countResult && countResult.rows && countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0;

    // Paginação
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const offset = (page - 1) * perPage;
    const totalPages = Math.ceil(totalRecords / perPage);

    // Ordenação (permitir customização)
    const orderBy = filters.orderBy || 'created_at';
    const orderDir = filters.orderDir || 'DESC';
    sql += ` ORDER BY t.${orderBy} ${orderDir} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(perPage, offset);

    const result = await query(sql, params);
    
    // Processar resultados
    const tasks = result.rows.map(row => {
      const task = { ...row };
      // Parse JSON fields
      if (task.last_observation) {
        task.last_observation = typeof task.last_observation === 'string' 
          ? JSON.parse(task.last_observation) 
          : task.last_observation;
      }
      if (task.checklists_stats) {
        const stats = typeof task.checklists_stats === 'string' 
          ? JSON.parse(task.checklists_stats) 
          : task.checklists_stats;
        task.checklists_count = parseInt(stats.total) || 0;
        task.checklists_done = parseInt(stats.done) || 0;
      } else {
        task.checklists_count = 0;
        task.checklists_done = 0;
      }
      return task;
    });

    return {
      tasks: tasks,
      pagination: {
        currentPage: page,
        perPage: perPage,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Erro ao listar tarefas do condomínio:', error);
    throw error;
  }
};

// Função para buscar uma tarefa específica com detalhes completos
// Recebe: taskId, condominiumId
// Retorna: tarefa com checklists e informações completas
const getTaskById = async (taskId, condominiumId) => {
  try {
    const taskResult = await query(
      `SELECT t.*, 
              creator.full_name as created_by_name,
              assignee.full_name as assigned_to_name
       FROM tasks t
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = $1 AND t.condominium_id = $2`,
      [taskId, condominiumId]
    );

    if (taskResult.rows.length === 0) {
      return null;
    }

    const task = taskResult.rows[0];

    // Busca checklists
    const checklistsResult = await query(
      `SELECT * FROM checklists WHERE task_id = $1 ORDER BY item_order, id`,
      [taskId]
    );
    task.checklists = checklistsResult.rows;

    // Busca observações do síndico
    const observationsResult = await query(
      `SELECT so.id, so.condominium_id, so.entity_type, so.entity_id, so.user_id, 
              so.observation, so.created_at, so.updated_at,
              u.full_name as user_name
       FROM sindico_observations so
       LEFT JOIN users u ON so.user_id = u.id
       WHERE so.entity_type = 'tasks' AND so.entity_id = $1 AND so.condominium_id = $2
       ORDER BY so.created_at DESC`,
      [taskId, condominiumId]
    );
    task.observations = observationsResult.rows;

    return task;
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    throw error;
  }
};

// Função para listar ocorrências do condomínio (para o síndico)
// Recebe: condominiumId, filtros opcionais (status, search, page, perPage)
// Retorna: lista de ocorrências com informações completas e paginação
const listOccurrences = async (condominiumId, filters = {}) => {
  try {
    // Query otimizada com JOINs e subqueries para evitar N+1
    let sql = `
      SELECT 
        o.*,
        reporter.full_name as reported_by_name,
        resolver.full_name as resolved_by_name,
        assignee.full_name as assigned_to_name,
        -- Subquery para última observação
        (
          SELECT json_build_object(
            'observation', so.observation,
            'created_at', so.created_at,
            'user_name', u.full_name
          )
          FROM sindico_observations so
          LEFT JOIN users u ON so.user_id = u.id
          WHERE so.entity_type = 'occurrences' 
            AND so.entity_id = o.id 
            AND so.condominium_id = $1
          ORDER BY so.created_at DESC
          LIMIT 1
        ) as last_observation
      FROM occurrences o
      LEFT JOIN users reporter ON o.reported_by = reporter.id
      LEFT JOIN users resolver ON o.resolved_by = resolver.id
      LEFT JOIN users assignee ON o.assigned_to = assignee.id
      WHERE o.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Busca por texto (título, descrição, nome do reportador)
    if (filters.search) {
      sql += ` AND (
        o.title ILIKE $${paramCount} OR 
        o.description ILIKE $${paramCount} OR
        reporter.full_name ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Aplica filtros
    if (filters.status) {
      sql += ` AND o.status = $${paramCount++}`;
      params.push(filters.status);
    }

    // Contar total de registros para paginação (query separada)
    let countSql = `
      SELECT COUNT(*) as total
      FROM occurrences o
      LEFT JOIN users reporter ON o.reported_by = reporter.id
      LEFT JOIN users resolver ON o.resolved_by = resolver.id
      LEFT JOIN users assignee ON o.assigned_to = assignee.id
      WHERE o.condominium_id = $1
    `;
    const countParams = [condominiumId];
    let countParamCount = 2;
    
    // Aplicar os mesmos filtros
    if (filters.search) {
      countSql += ` AND (
        o.title ILIKE $${countParamCount} OR 
        o.description ILIKE $${countParamCount} OR
        reporter.full_name ILIKE $${countParamCount}
      )`;
      countParams.push(`%${filters.search}%`);
      countParamCount++;
    }
    
    if (filters.status) {
      countSql += ` AND o.status = $${countParamCount++}`;
      countParams.push(filters.status);
    }
    
    const countResult = await query(countSql, countParams);
    const totalRecords = countResult && countResult.rows && countResult.rows.length > 0 ? parseInt(countResult.rows[0].total) : 0;

    // Paginação
    const page = filters.page || 1;
    const perPage = filters.perPage || 20;
    const offset = (page - 1) * perPage;
    const totalPages = Math.ceil(totalRecords / perPage);

    // Ordenação (permitir customização)
    const orderBy = filters.orderBy || 'created_at';
    const orderDir = filters.orderDir || 'DESC';
    sql += ` ORDER BY o.${orderBy} ${orderDir} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(perPage, offset);

    const result = await query(sql, params);
    
    // Processar resultados
    const occurrences = result.rows.map(row => {
      const occurrence = { ...row };
      // Parse JSON fields
      if (occurrence.last_observation) {
        occurrence.last_observation = typeof occurrence.last_observation === 'string' 
          ? JSON.parse(occurrence.last_observation) 
          : occurrence.last_observation;
      }
      return occurrence;
    });

    return {
      occurrences: occurrences,
      pagination: {
        currentPage: page,
        perPage: perPage,
        totalRecords: totalRecords,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Erro ao listar ocorrências do condomínio:', error);
    throw error;
  }
};

// Função para buscar uma ocorrência específica com detalhes completos
// Recebe: occurrenceId, condominiumId
// Retorna: ocorrência com informações completas
const getOccurrenceById = async (occurrenceId, condominiumId) => {
  try {
    const result = await query(
      `SELECT o.*, 
              reporter.full_name as reported_by_name,
              resolver.full_name as resolved_by_name,
              assignee.full_name as assigned_to_name
       FROM occurrences o
       LEFT JOIN users reporter ON o.reported_by = reporter.id
       LEFT JOIN users resolver ON o.resolved_by = resolver.id
       LEFT JOIN users assignee ON o.assigned_to = assignee.id
       WHERE o.id = $1 AND o.condominium_id = $2`,
      [occurrenceId, condominiumId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const occurrence = result.rows[0];

    // Busca observações do síndico
    const observationsResult = await query(
      `SELECT so.id, so.condominium_id, so.entity_type, so.entity_id, so.user_id, 
              so.observation, so.created_at, so.updated_at,
              u.full_name as user_name
       FROM sindico_observations so
       LEFT JOIN users u ON so.user_id = u.id
       WHERE so.entity_type = 'occurrences' AND so.entity_id = $1 AND so.condominium_id = $2
       ORDER BY so.created_at DESC`,
      [occurrenceId, condominiumId]
    );
    occurrence.observations = observationsResult.rows;

    return occurrence;
  } catch (error) {
    console.error('Erro ao buscar ocorrência:', error);
    throw error;
  }
};

// Função para adicionar observação do síndico em tarefa ou ocorrência
// Recebe: entityType ('tasks' ou 'occurrences'), entityId, observation, userId, condominiumId
// Retorna: observação criada
const addObservation = async (entityType, entityId, observation, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Validação
    if (!observation || observation.trim() === '') {
      throw new Error('Observação não pode estar vazia');
    }

    if (entityType !== 'tasks' && entityType !== 'occurrences') {
      throw new Error('Tipo de entidade inválido');
    }

    // Verifica se a entidade existe e pertence ao condomínio
    if (entityType === 'tasks') {
      const taskCheck = await query(
        `SELECT id, status FROM tasks WHERE id = $1 AND condominium_id = $2`,
        [entityId, condominiumId]
      );
      if (taskCheck.rows.length === 0) {
        throw new Error('Tarefa não encontrada');
      }
      if (taskCheck.rows[0].status === 'COMPLETED') {
        throw new Error('Tarefa concluída não pode receber observações nem ser enviada de volta.');
      }
    } else {
      const occurrenceCheck = await query(
        `SELECT id FROM occurrences WHERE id = $1 AND condominium_id = $2`,
        [entityId, condominiumId]
      );
      if (occurrenceCheck.rows.length === 0) {
        throw new Error('Ocorrência não encontrada');
      }
    }

    // Se for ocorrência, atualiza campos diretos na tabela occurrences
    if (entityType === 'occurrences') {
      await query(
        `UPDATE occurrences 
         SET sindico_observation = $1, sindico_observation_by = $2, sindico_observation_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND condominium_id = $4`,
        [observation.trim(), userId, entityId, condominiumId]
      );
    }

    // Insere observação (mantém compatibilidade com sistema antigo)
    const result = await query(
      `INSERT INTO sindico_observations (condominium_id, entity_type, entity_id, user_id, observation)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [condominiumId, entityType, entityId, userId, observation.trim()]
    );

    const observationRecord = result.rows[0];

    // Registra no log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'OBSERVATION',
      entityType: 'sindico_observations',
      entityId: observationRecord.id,
      afterData: observationRecord,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return observationRecord;
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    throw error;
  }
};

// Função para listar observações de uma entidade
// Recebe: entityType, entityId, condominiumId
// Retorna: lista de observações
const listObservations = async (entityType, entityId, condominiumId) => {
  try {
    const result = await query(
      `SELECT so.id, so.condominium_id, so.entity_type, so.entity_id, so.user_id, 
              so.observation, so.created_at, so.updated_at,
              u.full_name as user_name
       FROM sindico_observations so
       LEFT JOIN users u ON so.user_id = u.id
       WHERE so.entity_type = $1 AND so.entity_id = $2 AND so.condominium_id = $3
       ORDER BY so.created_at DESC`,
      [entityType, entityId, condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar observações:', error);
    throw error;
  }
};

// Exporta funções
// Função para aprovar ocorrência
// Recebe: occurrenceId, userId, condominiumId
// Retorna: ocorrência atualizada
const approveOccurrence = async (occurrenceId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca ocorrência
    const occurrenceResult = await query(
      `SELECT * FROM occurrences WHERE id = $1 AND condominium_id = $2`,
      [occurrenceId, condominiumId]
    );

    if (occurrenceResult.rows.length === 0) {
      throw new Error('Ocorrência não encontrada');
    }

    const occurrence = occurrenceResult.rows[0];

    if (!occurrence.requires_approval) {
      throw new Error('Esta ocorrência não requer aprovação');
    }

    if (occurrence.approval_status !== 'PENDING') {
      throw new Error('Ocorrência já foi analisada');
    }

    // Atualiza ocorrência
    const result = await query(
      `UPDATE occurrences
       SET approval_status = 'APPROVED',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND condominium_id = $3
       RETURNING *`,
      [userId, occurrenceId, condominiumId]
    );

    const updated = result.rows[0];

    // Registra no log
    const { logAction } = require('../utils/logger');
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'APPROVE',
      module: 'OCCURRENCE',
      entityType: 'occurrences',
      entityId: occurrenceId,
      beforeData: occurrence,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica operacional que criou
    if (occurrence.reported_by) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification(
        occurrence.reported_by,
        condominiumId,
        'Ocorrência Aprovada',
        `A ocorrência "${occurrence.title}" foi aprovada`,
        'OCCURRENCE_APPROVED',
        'occurrences',
        occurrenceId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao aprovar ocorrência:', error);
    throw error;
  }
};

// Função para rejeitar ocorrência
// Recebe: occurrenceId, userId, condominiumId, rejectionReason
// Retorna: ocorrência atualizada
const rejectOccurrence = async (occurrenceId, userId, condominiumId, rejectionReason, ipAddress, userAgent) => {
  try {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Motivo da rejeição é obrigatório');
    }

    // Busca ocorrência
    const occurrenceResult = await query(
      `SELECT * FROM occurrences WHERE id = $1 AND condominium_id = $2`,
      [occurrenceId, condominiumId]
    );

    if (occurrenceResult.rows.length === 0) {
      throw new Error('Ocorrência não encontrada');
    }

    const occurrence = occurrenceResult.rows[0];

    if (!occurrence.requires_approval) {
      throw new Error('Esta ocorrência não requer aprovação');
    }

    if (occurrence.approval_status !== 'PENDING') {
      throw new Error('Ocorrência já foi analisada');
    }

    // Atualiza ocorrência
    const result = await query(
      `UPDATE occurrences
       SET approval_status = 'REJECTED',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           approval_rejection_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND condominium_id = $4
       RETURNING *`,
      [userId, rejectionReason.trim(), occurrenceId, condominiumId]
    );

    const updated = result.rows[0];

    // Registra no log
    const { logAction } = require('../utils/logger');
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'REJECT',
      module: 'OCCURRENCE',
      entityType: 'occurrences',
      entityId: occurrenceId,
      beforeData: occurrence,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Notifica operacional que criou
    if (occurrence.reported_by) {
      const notificationService = require('./notificationService');
      await notificationService.createNotification(
        occurrence.reported_by,
        condominiumId,
        'Ocorrência Rejeitada',
        `A ocorrência "${occurrence.title}" foi rejeitada. Motivo: ${rejectionReason.trim()}`,
        'OCCURRENCE_REJECTED',
        'occurrences',
        occurrenceId
      );
    }

    return updated;
  } catch (error) {
    console.error('Erro ao rejeitar ocorrência:', error);
    throw error;
  }
};

// Função para listar ocorrências pendentes de aprovação
// Recebe: condominiumId, userId (opcional - filtra por role do usuário)
// Retorna: lista de ocorrências pendentes
const listPendingOccurrencesForApproval = async (condominiumId, userId = null) => {
  try {
    let sql = `
      SELECT o.*, u.full_name as reported_by_name
      FROM occurrences o
      LEFT JOIN users u ON o.reported_by = u.id
      WHERE o.condominium_id = $1 
        AND o.requires_approval = TRUE 
        AND o.approval_status = 'PENDING'
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Se userId fornecido, filtra por approval_required_from baseado nas roles do usuário
    if (userId) {
      const userRolesResult = await query(
        `SELECT r.name
         FROM users u
         INNER JOIN user_roles ur ON u.id = ur.user_id
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE u.id = $1`,
        [userId]
      );

      const userRoles = userRolesResult.rows.map(row => row.name);
      
      // Filtra ocorrências que o usuário pode aprovar
      if (userRoles.includes('SINDICO') || userRoles.includes('SUBSINDICO')) {
        sql += ` AND (o.approval_required_from = 'SINDICO' OR o.approval_required_from = 'SUBSINDICO')`;
      } else if (userRoles.includes('ADMINISTRATIVO')) {
        sql += ` AND o.approval_required_from = 'ADMINISTRATIVO'`;
      } else if (userRoles.includes('FINANCEIRO')) {
        sql += ` AND o.approval_required_from = 'FINANCEIRO'`;
      } else {
        // Usuário não tem permissão para aprovar nenhuma ocorrência
        return [];
      }
    }

    sql += ` ORDER BY o.created_at ASC`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar ocorrências pendentes de aprovação:', error);
    throw error;
  }
};

module.exports = {
  getDashboardStats,
  listPendingApprovals,
  processApproval,
  listAlerts,
  resolveAlert,
  listAuditLogs,
  listUsers,
  listTasks,
  getTaskById,
  listOccurrences,
  getOccurrenceById,
  addObservation,
  listObservations,
  approveOccurrence,
  rejectOccurrence,
  listPendingOccurrencesForApproval,
};

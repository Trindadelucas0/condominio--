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

    // Saldo financeiro (entradas recebidas - saídas pagas - saídas aprovadas mas não pagas)
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

    // Saídas aprovadas mas não pagas (comprometem o saldo)
    const exitsApprovedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'APPROVED'`,
      [condominiumId]
    );
    const totalExitsApproved = parseFloat(exitsApprovedResult.rows[0].total);

    const balance = totalEntries - totalExitsPaid - totalExitsApproved;

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

// Função para listar tarefas do condomínio (para o síndico)
// Recebe: condominiumId, filtros opcionais (status)
// Retorna: lista de tarefas com informações completas
const listTasks = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT t.*, 
             creator.full_name as created_by_name,
             assignee.full_name as assigned_to_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Aplica filtros
    if (filters.status) {
      sql += ` AND t.status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT 200`;

    const result = await query(sql, params);
    const tasks = result.rows;

    // Para cada tarefa, busca checklists (se necessário) e observações
    for (const task of tasks) {
      const checklistsResult = await query(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_count
         FROM checklists WHERE task_id = $1`,
        [task.id]
      );
      task.checklists_count = parseInt(checklistsResult.rows[0].total);
      task.checklists_done = parseInt(checklistsResult.rows[0].done_count);

      // Busca última observação do síndico (para preview)
      const lastObservationResult = await query(
        `SELECT so.observation, so.created_at, u.full_name as user_name
         FROM sindico_observations so
         LEFT JOIN users u ON so.user_id = u.id
         WHERE so.entity_type = 'tasks' AND so.entity_id = $1 AND so.condominium_id = $2
         ORDER BY so.created_at DESC LIMIT 1`,
        [task.id, condominiumId]
      );
      if (lastObservationResult.rows.length > 0) {
        task.last_observation = lastObservationResult.rows[0];
      }
    }

    return tasks;
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
// Recebe: condominiumId, filtros opcionais (status)
// Retorna: lista de ocorrências com informações completas
const listOccurrences = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT o.*, 
             reporter.full_name as reported_by_name,
             resolver.full_name as resolved_by_name,
             assignee.full_name as assigned_to_name
      FROM occurrences o
      LEFT JOIN users reporter ON o.reported_by = reporter.id
      LEFT JOIN users resolver ON o.resolved_by = resolver.id
      LEFT JOIN users assignee ON o.assigned_to = assignee.id
      WHERE o.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    // Aplica filtros
    if (filters.status) {
      sql += ` AND o.status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT 200`;

    const result = await query(sql, params);
    const occurrences = result.rows;

    // Para cada ocorrência, busca última observação do síndico (para preview)
    for (const occurrence of occurrences) {
      const lastObservationResult = await query(
        `SELECT so.observation, so.created_at, u.full_name as user_name
         FROM sindico_observations so
         LEFT JOIN users u ON so.user_id = u.id
         WHERE so.entity_type = 'occurrences' AND so.entity_id = $1 AND so.condominium_id = $2
         ORDER BY so.created_at DESC LIMIT 1`,
        [occurrence.id, condominiumId]
      );
      if (lastObservationResult.rows.length > 0) {
        occurrence.last_observation = lastObservationResult.rows[0];
      }
    }

    return occurrences;
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
        `SELECT id FROM tasks WHERE id = $1 AND condominium_id = $2`,
        [entityId, condominiumId]
      );
      if (taskCheck.rows.length === 0) {
        throw new Error('Tarefa não encontrada');
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
};

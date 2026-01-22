// Service do módulo OPERACIONAL
// Contém lógica de negócio para o painel operacional (zeladoria)
// Apenas OPERACIONAL pode executar essas operações

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria

// Função para obter estatísticas do operacional
// Recebe: userId (operacional)
// Retorna: estatísticas (tarefas pendentes, ocorrências abertas, etc)
// Função auxiliar para verificar e atualizar SLA de uma tarefa
const checkAndUpdateTaskSLA = async (task) => {
  if (!task.sla_deadline) {
    return task; // Sem SLA definido
  }
  
  const slaUtils = require('../utils/slaUtils');
  const isViolated = slaUtils.isSLAViolated(task.sla_deadline, task.completed_at);
  
  // Se SLA foi violado e ainda não está marcado, atualiza
  if (isViolated && !task.sla_violated) {
    const { query } = require('../config/database');
    await query(
      `UPDATE tasks SET sla_violated = TRUE, sla_violated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [task.id]
    );
    task.sla_violated = true;
    task.sla_violated_at = new Date();
  }
  
  // Calcula informações de SLA para exibição
  task.sla_info = slaUtils.formatSLAForDisplay(task.sla_deadline, task.completed_at);
  
  return task;
};

// Função auxiliar para verificar e atualizar SLA de uma ocorrência
const checkAndUpdateOccurrenceSLA = async (occurrence) => {
  if (!occurrence.sla_deadline) {
    return occurrence; // Sem SLA definido
  }
  
  const slaUtils = require('../utils/slaUtils');
  const isViolated = slaUtils.isSLAViolated(occurrence.sla_deadline, occurrence.resolved_at);
  
  // Se SLA foi violado e ainda não está marcado, atualiza
  if (isViolated && !occurrence.sla_violated) {
    const { query } = require('../config/database');
    await query(
      `UPDATE occurrences SET sla_violated = TRUE, sla_violated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [occurrence.id]
    );
    occurrence.sla_violated = true;
    occurrence.sla_violated_at = new Date();
  }
  
  // Calcula informações de SLA para exibição
  occurrence.sla_info = slaUtils.formatSLAForDisplay(occurrence.sla_deadline, occurrence.resolved_at);
  
  return occurrence;
};

const getDashboardStats = async (userId, condominiumId) => {
  try {
    // Conta tarefas pendentes do usuário
    const pendingTasksResult = await query(
      `SELECT COUNT(*) as total FROM tasks 
       WHERE assigned_to = $1 AND status IN ('PENDING', 'IN_PROGRESS') AND condominium_id = $2`,
      [userId, condominiumId]
    );
    const pendingTasks = parseInt(pendingTasksResult.rows[0].total);

    // Conta tarefas atrasadas
    const overdueTasksResult = await query(
      `SELECT COUNT(*) as total FROM tasks 
       WHERE assigned_to = $1 AND status IN ('PENDING', 'IN_PROGRESS') 
       AND due_date < CURRENT_DATE AND condominium_id = $2`,
      [userId, condominiumId]
    );
    const overdueTasks = parseInt(overdueTasksResult.rows[0].total);

    // Conta ocorrências abertas reportadas pelo usuário ou atribuídas a ele
    const openOccurrencesResult = await query(
      `SELECT COUNT(*) as total FROM occurrences 
       WHERE (reported_by = $1 OR assigned_to = $1) 
         AND status IN ('ABERTA', 'EM_ATENDIMENTO') 
         AND condominium_id = $2 
         AND (occurrence_type != 'LIMPEZA' OR occurrence_type IS NULL)`,
      [userId, condominiumId]
    );
    const openOccurrences = parseInt(openOccurrencesResult.rows[0].total);

    // Conta manutenções pendentes atribuídas ao usuário
    const pendingMaintenancesResult = await query(
      `SELECT COUNT(*) as total FROM maintenances 
       WHERE assigned_to = $1 AND status = 'PENDING' AND condominium_id = $2`,
      [userId, condominiumId]
    );
    const pendingMaintenances = parseInt(pendingMaintenancesResult.rows[0].total);

    // Conta manutenções em andamento
    const inProgressMaintenancesResult = await query(
      `SELECT COUNT(*) as total FROM maintenances 
       WHERE assigned_to = $1 AND status = 'IN_PROGRESS' AND condominium_id = $2`,
      [userId, condominiumId]
    );
    const inProgressMaintenances = parseInt(inProgressMaintenancesResult.rows[0].total);

    // Conta orçamentos liberados para o usuário
    const releasedBudgetsResult = await query(
      `SELECT COUNT(*) as total FROM budget_requests 
       WHERE requested_by = $1 AND status = 'LIBERATED' AND condominium_id = $2`,
      [userId, condominiumId]
    );
    const releasedBudgets = parseInt(releasedBudgetsResult.rows[0].total);

    return {
      pendingTasks,
      overdueTasks,
      openOccurrences,
      pendingMaintenances,
      inProgressMaintenances,
      releasedBudgets,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard operacional:', error);
    throw error;
  }
};

// Função para listar tarefas do operacional
// Recebe: userId, condominiumId, filtros (status, dueDate, search, page, perPage)
// Retorna: { tasks, total, page, perPage, totalPages } com checklists
const listTasks = async (userId, condominiumId, filters = {}) => {
  try {
    // Paginação: padrão page=1, perPage=20 (pode ser 10, 20, 50)
    const page = parseInt(filters.page) || 1;
    const perPage = parseInt(filters.perPage) || 20;
    const offset = (page - 1) * perPage;

    // Query base para contar total
    let countSql = `
      SELECT COUNT(*) as total
      FROM tasks t
      WHERE t.assigned_to = $1 AND t.condominium_id = $2
    `;
    const countParams = [userId, condominiumId];
    let countParamCount = 3;

    // Query principal
    let sql = `
      SELECT t.*, u.full_name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.assigned_to = $1 AND t.condominium_id = $2
    `;
    const params = [userId, condominiumId];
    let paramCount = 3;

    // Aplica filtros (tanto na query principal quanto na contagem)
    if (filters.status) {
      sql += ` AND t.status = $${paramCount++}`;
      countSql += ` AND t.status = $${countParamCount++}`;
      params.push(filters.status);
      countParams.push(filters.status);
    } else {
      // Por padrão, mostra apenas tarefas pendentes e em andamento (não concluídas)
      sql += ` AND t.status IN ('PENDING', 'IN_PROGRESS')`;
      countSql += ` AND t.status IN ('PENDING', 'IN_PROGRESS')`;
    }

    // Filtro por data de vencimento (dateFrom)
    if (filters.dateFrom) {
      sql += ` AND t.due_date >= $${paramCount++}`;
      countSql += ` AND t.due_date >= $${countParamCount++}`;
      params.push(filters.dateFrom);
      countParams.push(filters.dateFrom);
    }

    // Filtro por data de vencimento (dateTo)
    if (filters.dateTo) {
      sql += ` AND t.due_date <= $${paramCount++}`;
      countSql += ` AND t.due_date <= $${countParamCount++}`;
      params.push(filters.dateTo);
      countParams.push(filters.dateTo);
    }

    // Filtro por prioridade
    if (filters.priority) {
      sql += ` AND t.priority = $${paramCount++}`;
      countSql += ` AND t.priority = $${countParamCount++}`;
      params.push(filters.priority);
      countParams.push(filters.priority);
    }

    // Busca textual (se fornecido)
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = `%${filters.search.trim()}%`;
      sql += ` AND (t.title ILIKE $${paramCount++} OR t.description ILIKE $${paramCount++})`;
      countSql += ` AND (t.title ILIKE $${countParamCount++} OR t.description ILIKE $${countParamCount++})`;
      params.push(searchTerm);
      params.push(searchTerm);
      countParams.push(searchTerm);
      countParams.push(searchTerm);
    }

    // Ordenação: Prioriza URGENTE (ordem: URGENTE=4, ALTA=3, NORMAL=2, BAIXA=1)
    // Usa CASE para ordenar por prioridade primeiro, depois por data de vencimento
    sql += ` ORDER BY 
      CASE t.priority 
        WHEN 'URGENTE' THEN 4
        WHEN 'ALTA' THEN 3
        WHEN 'NORMAL' THEN 2
        WHEN 'BAIXA' THEN 1
        ELSE 0
      END DESC, 
      t.due_date ASC 
      LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    
    params.push(perPage);
    params.push(offset);

    // Executa query principal
    const result = await query(sql, params);
    const tasks = result.rows;

    // Executa query de contagem
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / perPage);

    // Log para debug (remover em produção se necessário)
    console.log(`[OPERACIONAL] listTasks - userId: ${userId}, condominiumId: ${condominiumId}, encontradas: ${tasks.length} tarefas`);
    if (tasks.length > 0) {
      console.log(`[OPERACIONAL] Tarefas encontradas:`, tasks.map(t => ({ id: t.id, title: t.title, status: t.status, assigned_to: t.assigned_to })));
    } else {
      // Verifica se há tarefas atribuídas mas com condominium_id diferente
      const debugResult = await query(
        `SELECT COUNT(*) as total FROM tasks WHERE assigned_to = $1`,
        [userId]
      );
      console.log(`[OPERACIONAL] Debug - Total de tarefas atribuídas ao usuário ${userId} (qualquer condomínio): ${debugResult.rows[0].total}`);
    }

    // Para cada tarefa, busca checklists e verifica SLA
    for (const task of tasks) {
      const checklistsResult = await query(
        `SELECT * FROM checklists WHERE task_id = $1 ORDER BY item_order, id`,
        [task.id]
      );
      task.checklists = checklistsResult.rows;
      
      // Verifica e atualiza SLA
      await checkAndUpdateTaskSLA(task);
    }

    return {
      tasks,
      total,
      page,
      perPage,
      totalPages,
    };
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    throw error;
  }
};

// Função para buscar uma tarefa específica com checklists
// Recebe: taskId, userId (para validação)
// Retorna: tarefa com checklists e evidências
const getTaskById = async (taskId, userId) => {
  try {
    const taskResult = await query(
      `SELECT t.*, u.full_name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1 AND t.assigned_to = $2`,
      [taskId, userId]
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

    // Busca evidências
    const evidencesResult = await query(
      `SELECT * FROM task_evidences WHERE task_id = $1 ORDER BY created_at`,
      [taskId]
    );
    task.evidences = evidencesResult.rows;

    return task;
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    throw error;
  }
};

// Função para atualizar status de um item de checklist
// Recebe: checklistId, status, comment, userId
// Retorna: checklist atualizado
const updateChecklistItem = async (checklistId, status, comment, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Validação: se status é NOT_DONE, comentário é obrigatório
    if (status === 'NOT_DONE' && (!comment || comment.trim() === '')) {
      throw new Error('Comentário é obrigatório quando o item não foi feito');
    }

    // Busca checklist atual
    const checklistResult = await query(
      `SELECT c.*, t.id as task_id, t.condominium_id
       FROM checklists c
       INNER JOIN tasks t ON c.task_id = t.id
       WHERE c.id = $1`,
      [checklistId]
    );

    if (checklistResult.rows.length === 0) {
      throw new Error('Item de checklist não encontrado');
    }

    const currentChecklist = checklistResult.rows[0];

    // Valida condomínio
    if (currentChecklist.condominium_id !== condominiumId) {
      throw new Error('Acesso negado');
    }

    // Atualiza checklist
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    updateFields.push(`status = $${paramCount++}`);
    updateValues.push(status);

    if (comment) {
      updateFields.push(`comment = $${paramCount++}`);
      updateValues.push(comment.trim());
    }

    if (status === 'DONE') {
      updateFields.push(`done_at = CURRENT_TIMESTAMP`);
    } else {
      updateFields.push(`done_at = NULL`);
    }

    updateValues.push(checklistId);

    await query(
      `UPDATE checklists SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
      updateValues
    );

    // Busca checklist atualizado
    const updatedResult = await query(`SELECT * FROM checklists WHERE id = $1`, [checklistId]);
    const updated = updatedResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'CHECKLIST',
      entityType: 'checklists',
      entityId: checklistId,
      beforeData: currentChecklist,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar item de checklist:', error);
    throw error;
  }
};

// Função para adicionar evidência (foto) a uma tarefa
// Recebe: taskId, filePath, fileName, fileType, userId
// Retorna: evidência criada
const addTaskEvidence = async (taskId, filePath, fileName, fileType, userId) => {
  const res = await query(
    `INSERT INTO task_evidences (task_id, file_path, file_name, file_type, evidence_type, uploaded_by)
     VALUES ($1, $2, $3, $4, 'AFTER', $5)
     RETURNING *`,
    [taskId, filePath, fileName || 'evidencia', fileType || 'image/jpeg', userId]
  );
  return res.rows[0];
};

// Função para adicionar imagem a uma ocorrência
// Recebe: occurrenceId, filePath, fileName, fileType, fileSize, userId
// Retorna: imagem criada
const addOccurrenceImage = async (occurrenceId, filePath, fileName, fileType, fileSize, userId) => {
  try {
    const res = await query(
      `INSERT INTO occurrence_images (occurrence_id, file_path, file_name, file_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [occurrenceId, filePath, fileName || 'imagem', fileType || 'image/jpeg', fileSize || 0, userId]
    );
    return res.rows[0];
  } catch (error) {
    console.error('Erro ao adicionar imagem à ocorrência:', error);
    throw error;
  }
};

// Função para finalizar tarefa com dados estruturados
// Recebe: taskId, userId, dados de conclusão (completionData)
// Retorna: tarefa atualizada
const completeTask = async (taskId, userId, condominiumId, completionData, ipAddress, userAgent) => {
  try {
    // Busca tarefa atual
    const taskResult = await query(
      `SELECT * FROM tasks WHERE id = $1 AND assigned_to = $2 AND condominium_id = $3`,
      [taskId, userId, condominiumId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Tarefa não encontrada');
    }

    const task = taskResult.rows[0];

    // Verifica se todos os checklists estão DONE (se houver)
    const checklistsResult = await query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as done_count
       FROM checklists WHERE task_id = $1`,
      [taskId]
    );

    const { total, done_count } = checklistsResult.rows[0];
    if (total > 0 && parseInt(done_count) !== parseInt(total)) {
      throw new Error('Todos os itens do checklist devem estar concluídos');
    }

    // Validação: Se evidence_required = TRUE, verifica se há evidências (fotos)
    if (task.evidence_required === true) {
      const evidencesResult = await query(
        `SELECT COUNT(*) as total FROM task_evidences WHERE task_id = $1`,
        [taskId]
      );
      const evidencesCount = parseInt(evidencesResult.rows[0].total);
      if (evidencesCount === 0) {
        throw new Error('Esta tarefa requer evidências (fotos) obrigatórias. Por favor, anexe pelo menos uma foto antes de concluir a tarefa.');
      }
    }

    // Validação: completion_success é obrigatório
    if (completionData.completion_success === undefined || completionData.completion_success === null) {
      throw new Error('É obrigatório informar se a tarefa foi concluída com sucesso');
    }

    // Prepara campos de atualização
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    updateFields.push(`status = 'COMPLETED'`);
    updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateFields.push(`completion_success = $${paramCount++}`);
    updateValues.push(completionData.completion_success === true || completionData.completion_success === 'true');

    // Campos opcionais
    if (completionData.completion_notes !== undefined && completionData.completion_notes !== null) {
      updateFields.push(`completion_notes = $${paramCount++}`);
      updateValues.push(completionData.completion_notes.trim());
    }

    if (completionData.had_issues !== undefined && completionData.had_issues !== null) {
      updateFields.push(`had_issues = $${paramCount++}`);
      updateValues.push(completionData.had_issues === true || completionData.had_issues === 'true');
    }

    if (completionData.issues_description !== undefined && completionData.issues_description !== null && completionData.issues_description.trim() !== '') {
      updateFields.push(`issues_description = $${paramCount++}`);
      updateValues.push(completionData.issues_description.trim());
    }

    if (completionData.completion_time_minutes !== undefined && completionData.completion_time_minutes !== null) {
      const minutes = parseInt(completionData.completion_time_minutes);
      if (!isNaN(minutes) && minutes > 0) {
        updateFields.push(`completion_time_minutes = $${paramCount++}`);
        updateValues.push(minutes);
      }
    }

    if (completionData.completion_quality !== undefined && completionData.completion_quality !== null) {
      const validQualities = ['EXCELENTE', 'BOM', 'REGULAR', 'RUIM'];
      if (validQualities.includes(completionData.completion_quality.toUpperCase())) {
        updateFields.push(`completion_quality = $${paramCount++}`);
        updateValues.push(completionData.completion_quality.toUpperCase());
      }
    }

    updateValues.push(taskId);

    // Atualiza tarefa
    const updateResult = await query(
      `UPDATE tasks 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'COMPLETE',
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
    console.error('Erro ao finalizar tarefa:', error);
    throw error;
  }
};

// Função para criar ocorrência
// Recebe: dados da ocorrência, userId
// Retorna: ocorrência criada
const createOccurrence = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { title, description, location, priority, occurrenceType, requiresApproval, approvalRequiredFrom, sentToUserId, sentToRole, isInChecklist, isRoutineTask } = data;

    // Validações
    if (!title || title.trim() === '') {
      throw new Error('Título é obrigatório');
    }
    if (!description || description.trim() === '') {
      throw new Error('Descrição é obrigatória');
    }

    // Define tipo de ocorrência (padrão: NON_ROUTINE)
    const finalOccurrenceType = occurrenceType || 'NON_ROUTINE';
    
    // Define se precisa aprovação baseado no tipo
    let finalRequiresApproval = requiresApproval || false;
    if (finalOccurrenceType === 'EMERGENCY') {
      finalRequiresApproval = true; // Emergências sempre precisam aprovação
    }

    // Define quem deve aprovar
    let finalApprovalRequiredFrom = approvalRequiredFrom || null;
    if (finalRequiresApproval && !finalApprovalRequiredFrom) {
      // Se precisa aprovação mas não especificou quem, usa SINDICO como padrão
      finalApprovalRequiredFrom = 'SINDICO';
    }

    // Calcula SLA deadline baseado na prioridade
    const slaUtils = require('../utils/slaUtils');
    const occurrencePriority = priority || 'NORMAL';
    const slaHours = slaUtils.getDefaultSLAHours(occurrencePriority, 'occurrence');
    const createdAt = new Date();
    const slaDeadline = slaUtils.calculateSLADeadline(createdAt, slaHours);

    // Insere ocorrência
    const result = await query(
      `INSERT INTO occurrences (
        condominium_id, reported_by, title, description, location, priority, status, 
        occurrence_type, requires_approval, approval_required_from, approval_status,
        sent_to_user_id, sent_to_role, is_in_checklist, is_routine_task, sla_hours, sla_deadline
      )
       VALUES ($1, $2, $3, $4, $5, $6, 'ABERTA', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        condominiumId, 
        userId, 
        title.trim(), 
        description.trim(), 
        location || null, 
        occurrencePriority,
        finalOccurrenceType,
        finalRequiresApproval,
        finalApprovalRequiredFrom,
        finalRequiresApproval ? 'PENDING' : null,
        sentToUserId || null,
        sentToRole || null,
        isInChecklist || false,
        isRoutineTask || false,
        slaHours,
        slaDeadline
      ]
    );

    const occurrence = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'OCCURRENCE',
      entityType: 'occurrences',
      entityId: occurrence.id,
      afterData: occurrence,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Cria notificações se necessário
    const notificationService = require('./notificationService');
    
    if (finalRequiresApproval) {
      // Notifica destinatário específico ou role
      if (sentToUserId) {
        await notificationService.createNotification(
          sentToUserId,
          condominiumId,
          'Ocorrência Aguardando Aprovação',
          `Uma nova ocorrência foi criada e aguarda sua aprovação: ${title.trim()}`,
          'OCCURRENCE_REQUIRES_APPROVAL',
          'occurrences',
          occurrence.id
        );
      } else if (sentToRole) {
        await notificationService.createNotificationForRole(
          sentToRole,
          condominiumId,
          'Ocorrência Aguardando Aprovação',
          `Uma nova ocorrência foi criada e aguarda sua aprovação: ${title.trim()}`,
          'OCCURRENCE_REQUIRES_APPROVAL',
          'occurrences',
          occurrence.id
        );
      } else if (finalApprovalRequiredFrom) {
        // Notifica role baseado em approval_required_from
        await notificationService.createNotificationForRole(
          finalApprovalRequiredFrom,
          condominiumId,
          'Ocorrência Aguardando Aprovação',
          `Uma nova ocorrência foi criada e aguarda sua aprovação: ${title.trim()}`,
          'OCCURRENCE_REQUIRES_APPROVAL',
          'occurrences',
          occurrence.id
        );
      }
    } else {
      // Se não precisa aprovação, notifica administrativo para triagem normal
      await notificationService.createNotificationForRole(
        'ADMINISTRATIVO',
        condominiumId,
        'Nova Ocorrência Criada',
        `Uma nova ocorrência foi criada: ${title.trim()}`,
        'OCCURRENCE_CREATED',
        'occurrences',
        occurrence.id
      );
    }

    return occurrence;
  } catch (error) {
    console.error('Erro ao criar ocorrência:', error);
    throw error;
  }
};

// Função para listar ocorrências de ZELADORIA (OPERACIONAL)
// Recebe: userId, condominiumId, filtros (status, search, page, perPage)
// Retorna: { occurrences, total, page, perPage, totalPages }
const listOccurrences = async (userId, condominiumId, filters = {}) => {
  try {
    // Paginação: padrão page=1, perPage=20
    const page = parseInt(filters.page) || 1;
    const perPage = parseInt(filters.perPage) || 20;
    const offset = (page - 1) * perPage;

    // Query base para contar total
    // IMPORTANTE: Mostra ocorrências que:
    // 1. O usuário reportou (e não são de limpeza)
    // 2. OU foram atribuídas a ele (independente do tipo, exceto limpeza que tem módulo próprio)
    let countSql = `
      SELECT COUNT(*) as total
      FROM occurrences 
      WHERE condominium_id = $1 
        AND (
          (reported_by = $2 AND (occurrence_type != 'LIMPEZA' OR occurrence_type IS NULL))
          OR 
          (assigned_to = $2 AND occurrence_type != 'LIMPEZA')
        )
    `;
    const countParams = [condominiumId, userId];
    let countParamCount = 3;

    // Query principal
    // IMPORTANTE: Mostra ocorrências que:
    // 1. O usuário reportou (e não são de limpeza)
    // 2. OU foram atribuídas a ele (independente do tipo, exceto limpeza que tem módulo próprio)
    let sql = `
      SELECT * FROM occurrences 
      WHERE condominium_id = $1 
        AND (
          (reported_by = $2 AND (occurrence_type != 'LIMPEZA' OR occurrence_type IS NULL))
          OR 
          (assigned_to = $2 AND occurrence_type != 'LIMPEZA')
        )
    `;
    const params = [condominiumId, userId];
    let paramCount = 3;

    if (filters.status) {
      sql += ` AND status = $${paramCount++}`;
      countSql += ` AND status = $${countParamCount++}`;
      params.push(filters.status);
      countParams.push(filters.status);
    }

    // Filtro por data de criação (dateFrom) — comparação por data
    if (filters.dateFrom) {
      sql += ` AND (created_at::date >= $${paramCount}::date)`;
      countSql += ` AND (created_at::date >= $${countParamCount}::date)`;
      paramCount++;
      countParamCount++;
      params.push(filters.dateFrom);
      countParams.push(filters.dateFrom);
    }

    // Filtro por data de criação (dateTo) — até fim do dia
    if (filters.dateTo) {
      sql += ` AND (created_at::date <= $${paramCount}::date)`;
      countSql += ` AND (created_at::date <= $${countParamCount}::date)`;
      paramCount++;
      countParamCount++;
      params.push(filters.dateTo);
      countParams.push(filters.dateTo);
    }

    // Filtro por prioridade
    if (filters.priority) {
      sql += ` AND priority = $${paramCount++}`;
      countSql += ` AND priority = $${countParamCount++}`;
      params.push(filters.priority);
      countParams.push(filters.priority);
    }

    // Filtro por tipo (atribuídas a mim ou criadas por mim)
    if (filters.assignedToMe === 'assigned') {
      // Apenas ocorrências atribuídas a mim (mas não criadas por mim)
      // Adiciona condição adicional para restringir apenas assigned_to
      sql += ` AND assigned_to = $2 AND reported_by != $2`;
      countSql += ` AND assigned_to = $2 AND reported_by != $2`;
    } else if (filters.assignedToMe === 'reported') {
      // Apenas ocorrências criadas por mim
      // Adiciona condição adicional para restringir apenas reported_by
      sql += ` AND reported_by = $2 AND assigned_to IS NULL`;
      countSql += ` AND reported_by = $2 AND assigned_to IS NULL`;
    }

    // Busca textual (se fornecido)
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = `%${filters.search.trim()}%`;
      sql += ` AND (title ILIKE $${paramCount++} OR description ILIKE $${paramCount++} OR location ILIKE $${paramCount++})`;
      countSql += ` AND (title ILIKE $${countParamCount++} OR description ILIKE $${countParamCount++} OR location ILIKE $${countParamCount++})`;
      params.push(searchTerm);
      params.push(searchTerm);
      params.push(searchTerm);
      countParams.push(searchTerm);
      countParams.push(searchTerm);
      countParams.push(searchTerm);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(perPage);
    params.push(offset);

    const result = await query(sql, params);
    const occurrences = result.rows;

    // Verifica e atualiza SLA para cada ocorrência
    for (const occurrence of occurrences) {
      await checkAndUpdateOccurrenceSLA(occurrence);
    }

    // Executa query de contagem
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / perPage);

    return {
      occurrences,
      total,
      page,
      perPage,
      totalPages,
    };
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    throw error;
  }
};

// Função para resolver ocorrência com dados estruturados
// Recebe: occurrenceId, userId, condominiumId, dados de resolução (resolutionData)
// Retorna: ocorrência atualizada
const resolveOccurrence = async (occurrenceId, userId, condominiumId, resolutionData, ipAddress, userAgent) => {
  try {
    // Busca ocorrência atual
    const occurrenceResult = await query(
      `SELECT * FROM occurrences WHERE id = $1 AND condominium_id = $2`,
      [occurrenceId, condominiumId]
    );

    if (occurrenceResult.rows.length === 0) {
      throw new Error('Ocorrência não encontrada');
    }

    const occurrence = occurrenceResult.rows[0];

    // Validação: resolution_success é obrigatório
    if (resolutionData.resolution_success === undefined || resolutionData.resolution_success === null) {
      throw new Error('É obrigatório informar se a ocorrência foi resolvida com sucesso');
    }

    // Validação: resolution_notes é obrigatório
    if (!resolutionData.resolution_notes || resolutionData.resolution_notes.trim() === '') {
      throw new Error('Notas de resolução são obrigatórias');
    }

    // Prepara campos de atualização
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    // Valida transição de estado
    const stateValidator = require('../utils/stateValidator');
    const transitionValidation = await stateValidator.validateAndTransition(
      userId,
      'occurrences',
      occurrence.status,
      'RESOLVIDA',
      occurrenceId
    );

    if (!transitionValidation.valid) {
      throw new Error(transitionValidation.error || 'Transição de estado não permitida');
    }

    updateFields.push(`status = 'RESOLVIDA'`);
    updateFields.push(`resolved_at = CURRENT_TIMESTAMP`);
    updateFields.push(`resolved_by = $${paramCount++}`);
    updateValues.push(userId);
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateFields.push(`resolution_success = $${paramCount++}`);
    updateValues.push(resolutionData.resolution_success === true || resolutionData.resolution_success === 'true');
    updateFields.push(`resolution_notes = $${paramCount++}`);
    updateValues.push(resolutionData.resolution_notes.trim());

    // Campos opcionais
    if (resolutionData.resolution_method !== undefined && resolutionData.resolution_method !== null) {
      const validMethods = ['INTERNA', 'TERCEIRO', 'MANUTENCAO', 'OUTRA'];
      if (validMethods.includes(resolutionData.resolution_method.toUpperCase())) {
        updateFields.push(`resolution_method = $${paramCount++}`);
        updateValues.push(resolutionData.resolution_method.toUpperCase());
      }
    }

    if (resolutionData.resolution_cost !== undefined && resolutionData.resolution_cost !== null) {
      const cost = parseFloat(resolutionData.resolution_cost);
      if (!isNaN(cost) && cost >= 0) {
        updateFields.push(`resolution_cost = $${paramCount++}`);
        updateValues.push(cost);
      }
    }

    if (resolutionData.had_complications !== undefined && resolutionData.had_complications !== null) {
      updateFields.push(`had_complications = $${paramCount++}`);
      updateValues.push(resolutionData.had_complications === true || resolutionData.had_complications === 'true');
    }

    if (resolutionData.complications_description !== undefined && resolutionData.complications_description !== null && resolutionData.complications_description.trim() !== '') {
      updateFields.push(`complications_description = $${paramCount++}`);
      updateValues.push(resolutionData.complications_description.trim());
    }

    if (resolutionData.resolution_time_minutes !== undefined && resolutionData.resolution_time_minutes !== null) {
      const minutes = parseInt(resolutionData.resolution_time_minutes);
      if (!isNaN(minutes) && minutes > 0) {
        updateFields.push(`resolution_time_minutes = $${paramCount++}`);
        updateValues.push(minutes);
      }
    }

    if (resolutionData.preventive_measures !== undefined && resolutionData.preventive_measures !== null && resolutionData.preventive_measures.trim() !== '') {
      updateFields.push(`preventive_measures = $${paramCount++}`);
      updateValues.push(resolutionData.preventive_measures.trim());
    }

    updateValues.push(occurrenceId);

    // Atualiza ocorrência
    const updateResult = await query(
      `UPDATE occurrences 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      updateValues
    );

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'RESOLVE',
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
    console.error('Erro ao resolver ocorrência:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  getDashboardStats,
  listTasks,
  getTaskById,
  updateChecklistItem,
  addTaskEvidence,
  completeTask,
  createOccurrence,
  addOccurrenceImage,
  listOccurrences,
  resolveOccurrence,
};

// Service do módulo OPERACIONAL
// Contém lógica de negócio para o painel operacional (zeladoria)
// Apenas OPERACIONAL pode executar essas operações

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria

// Função para obter estatísticas do operacional
// Recebe: userId (operacional)
// Retorna: estatísticas (tarefas pendentes, ocorrências abertas, etc)
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

    // Conta ocorrências abertas reportadas pelo usuário
    const openOccurrencesResult = await query(
      `SELECT COUNT(*) as total FROM occurrences 
       WHERE reported_by = $1 AND status IN ('ABERTA', 'EM_ATENDIMENTO') 
         AND condominium_id = $2 
         AND (occurrence_type = 'ZELADORIA' OR occurrence_type IS NULL)`,
      [userId, condominiumId]
    );
    const openOccurrences = parseInt(openOccurrencesResult.rows[0].total);

    return {
      pendingTasks,
      overdueTasks,
      openOccurrences,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard operacional:', error);
    throw error;
  }
};

// Função para listar tarefas do operacional
// Recebe: userId, condominiumId, filtros (status, dueDate)
// Retorna: lista de tarefas com checklists
const listTasks = async (userId, condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT t.*, u.full_name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.assigned_to = $1 AND t.condominium_id = $2
    `;
    const params = [userId, condominiumId];
    let paramCount = 3;

    // Aplica filtros
    if (filters.status) {
      sql += ` AND t.status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY t.due_date ASC, t.priority DESC LIMIT 50`;

    const result = await query(sql, params);
    const tasks = result.rows;

    // Para cada tarefa, busca checklists
    for (const task of tasks) {
      const checklistsResult = await query(
        `SELECT * FROM checklists WHERE task_id = $1 ORDER BY item_order, id`,
        [task.id]
      );
      task.checklists = checklistsResult.rows;
    }

    return tasks;
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
    const { title, description, location, priority } = data;

    // Validações
    if (!title || title.trim() === '') {
      throw new Error('Título é obrigatório');
    }
    if (!description || description.trim() === '') {
      throw new Error('Descrição é obrigatória');
    }

    // Insere ocorrência de ZELADORIA (OPERACIONAL cria ocorrências técnicas)
    const result = await query(
      `INSERT INTO occurrences (condominium_id, reported_by, title, description, location, priority, status, occurrence_type)
       VALUES ($1, $2, $3, $4, $5, $6, 'ABERTA', 'ZELADORIA')
       RETURNING *`,
      [condominiumId, userId, title.trim(), description.trim(), location || null, priority || 'NORMAL']
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

    return occurrence;
  } catch (error) {
    console.error('Erro ao criar ocorrência:', error);
    throw error;
  }
};

// Função para listar ocorrências de ZELADORIA (OPERACIONAL)
// Recebe: userId, condominiumId, filtros
// Retorna: lista de ocorrências de zeladoria
const listOccurrences = async (userId, condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT * FROM occurrences 
      WHERE reported_by = $1 AND condominium_id = $2 
        AND (occurrence_type = 'ZELADORIA' OR occurrence_type IS NULL)
    `;
    const params = [userId, condominiumId];
    let paramCount = 3;

    if (filters.status) {
      sql += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
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
  completeTask,
  createOccurrence,
  listOccurrences,
  resolveOccurrence,
};

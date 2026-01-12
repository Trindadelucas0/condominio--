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
       WHERE reported_by = $1 AND status IN ('ABERTA', 'EM_ATENDIMENTO') AND condominium_id = $2`,
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

// Função para finalizar tarefa
// Recebe: taskId, userId
// Retorna: tarefa atualizada
const completeTask = async (taskId, userId, condominiumId, ipAddress, userAgent) => {
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

    // Atualiza tarefa
    const updateResult = await query(
      `UPDATE tasks 
       SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [taskId]
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

    // Insere ocorrência
    const result = await query(
      `INSERT INTO occurrences (condominium_id, reported_by, title, description, location, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ABERTA')
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

// Função para listar ocorrências do operacional
// Recebe: userId, condominiumId, filtros
// Retorna: lista de ocorrências
const listOccurrences = async (userId, condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT * FROM occurrences 
      WHERE reported_by = $1 AND condominium_id = $2
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

// Exporta funções
module.exports = {
  getDashboardStats,
  listTasks,
  getTaskById,
  updateChecklistItem,
  completeTask,
  createOccurrence,
  listOccurrences,
};

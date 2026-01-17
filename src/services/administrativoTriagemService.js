// Serviço de triagem de ocorrências pelo administrativo
// REGRA: ADM classifica ocorrências, define prioridade, decide se vira tarefa, define SLA

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const administrativoService = require('./administrativoService');
const { createNotification } = require('./automationService');

// Função para triar ocorrência
// Recebe: occurrenceId, triagemData, userId, condominiumId
// Retorna: ocorrência atualizada
const triageOccurrence = async (occurrenceId, triagemData, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { priority, classification, slaHours, assignTo, convertToTask, taskData } = triagemData;

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

    // Calcula data limite do SLA
    let slaDueDate = null;
    if (slaHours) {
      slaDueDate = new Date();
      slaDueDate.setHours(slaDueDate.getHours() + parseInt(slaHours));
    }

    // Atualiza ocorrência com dados de triagem
    // Nota: Fazemos cast explícito de $6 para INTEGER para evitar erro de tipo quando NULL
    const assignedToValue = assignTo || occurrence.assigned_to;
    const updateResult = await query(
      `UPDATE occurrences 
       SET triaged = TRUE, triaged_by = $1, triaged_at = CURRENT_TIMESTAMP,
           priority = $2, classification = $3, sla_hours = $4, sla_due_date = $5,
           assigned_to = $6::INTEGER, 
           status = CASE WHEN $6::INTEGER IS NOT NULL THEN 'EM_ATENDIMENTO' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        userId,
        priority || occurrence.priority,
        classification || null,
        slaHours || null,
        slaDueDate,
        assignedToValue,
        occurrenceId,
      ]
    );

    const updated = updateResult.rows[0];

    // Se deve converter para tarefa
    let task = null;
    if (convertToTask && taskData) {
      task = await administrativoService.createTask(
        {
          title: taskData.title || occurrence.title,
          description: taskData.description || occurrence.description,
          assignedTo: assignTo || taskData.assignedTo,
          dueDate: taskData.dueDate || slaDueDate,
          priority: priority || 'NORMAL',
          taskType: taskData.taskType || 'CORRECTIVE',
          checklistItems: taskData.checklistItems || [],
          relatedOccurrenceId: occurrenceId,
        },
        userId,
        condominiumId,
        ipAddress,
        userAgent
      );

      // Atualiza ocorrência com referência à tarefa
      await query(
        `UPDATE occurrences 
         SET converted_to_task = TRUE, related_task_id = $1 
         WHERE id = $2`,
        [task.id, occurrenceId]
      );

      // Notifica responsável pela tarefa
      if (task.assigned_to) {
        await createNotification(task.assigned_to, condominiumId, {
          title: `Nova tarefa: ${task.title}`,
          message: `Uma nova tarefa foi criada a partir da ocorrência "${occurrence.title}"`,
          notificationType: 'TASK_CREATED',
          entityType: 'tasks',
          entityId: task.id,
        });
      }
    }

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'TRIAGE',
      module: 'ADMINISTRATIVO',
      entityType: 'occurrences',
      entityId: occurrenceId,
      beforeData: occurrence,
      afterData: { ...updated, taskCreated: task ? true : false },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Retorna resultado com informação sobre tarefa criada
    return {
      occurrence: updated,
      taskCreated: !!task,
      task: task || null,
    };
  } catch (error) {
    console.error('Erro ao triar ocorrência:', error);
    throw error;
  }
};

// Função para listar ocorrências não triadas
// Recebe: condominiumId
// Retorna: lista de ocorrências aguardando triagem
const listOccurrencesPendingTriage = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT o.*, u.full_name as reported_by_name,
              u2.full_name as sindico_observation_by_name,
              CASE WHEN o.occurrence_type = 'LIMPEZA' THEN 'Limpeza' ELSE 'Zeladoria' END as occurrence_type_label
       FROM occurrences o
       LEFT JOIN users u ON o.reported_by = u.id
       LEFT JOIN users u2 ON o.sindico_observation_by = u2.id
       WHERE o.condominium_id = $1 
         AND o.triaged = FALSE
         AND o.status NOT IN ('RESOLVIDA', 'ENCERRADA')
       ORDER BY o.created_at ASC`,
      [condominiumId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao listar ocorrências pendentes de triagem:', error);
    throw error;
  }
};

// Função para listar todas as ocorrências (para ADM ver tudo)
// Recebe: condominiumId, filtros
// Retorna: lista de ocorrências
const listAllOccurrences = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT o.*, u.full_name as reported_by_name,
             u2.full_name as assigned_to_name,
             CASE WHEN o.occurrence_type = 'LIMPEZA' THEN 'Limpeza' ELSE 'Zeladoria' END as occurrence_type_label
      FROM occurrences o
      LEFT JOIN users u ON o.reported_by = u.id
      LEFT JOIN users u2 ON o.assigned_to = u2.id
      WHERE o.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.status) {
      sql += ` AND o.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.priority) {
      sql += ` AND o.priority = $${paramCount++}`;
      params.push(filters.priority);
    }

    if (filters.occurrenceType) {
      sql += ` AND o.occurrence_type = $${paramCount++}`;
      params.push(filters.occurrenceType);
    }

    if (filters.triaged !== undefined) {
      sql += ` AND o.triaged = $${paramCount++}`;
      params.push(filters.triaged);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT 200`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    throw error;
  }
};

module.exports = {
  triageOccurrence,
  listOccurrencesPendingTriage,
  listAllOccurrences,
};

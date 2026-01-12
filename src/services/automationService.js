// Service de automações e alertas
// Contém lógica para SLA, escalonamento e notificações
// Executado periodicamente (via job/cron)

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria

// Função para verificar tarefas com SLA expirado ou próximo
// Retorna: lista de tarefas que precisam de atenção
const checkTasksSLA = async (condominiumId) => {
  try {
    const now = new Date();
    
    // Busca tarefas pendentes ou em progresso que estão próximas ou após o prazo
    const tasks = await query(
      `SELECT t.*, u.full_name as assigned_to_name, creator.full_name as created_by_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users creator ON t.created_by = creator.id
       WHERE t.condominium_id = $1
         AND t.status IN ('PENDING', 'IN_PROGRESS')
         AND t.due_date IS NOT NULL
         AND t.due_date <= $2
       ORDER BY t.due_date ASC`,
      [condominiumId, now]
    );

    return tasks.rows;
  } catch (error) {
    console.error('Erro ao verificar SLA de tarefas:', error);
    throw error;
  }
};

// Função para verificar ocorrências com SLA expirado
// Retorna: lista de ocorrências que precisam de atenção
const checkOccurrencesSLA = async (condominiumId) => {
  try {
    const now = new Date();
    
    // Busca ocorrências abertas ou em atendimento que estão próximas ou após o prazo SLA
    const occurrences = await query(
      `SELECT o.*, u.full_name as reported_by_name
       FROM occurrences o
       LEFT JOIN users u ON o.reported_by = u.id
       WHERE o.condominium_id = $1
         AND o.status IN ('ABERTA', 'EM_ATENDIMENTO')
         AND o.s_l_a_due_date IS NOT NULL
         AND o.s_l_a_due_date <= $2
       ORDER BY o.s_l_a_due_date ASC`,
      [condominiumId, now]
    );

    return occurrences.rows;
  } catch (error) {
    console.error('Erro ao verificar SLA de ocorrências:', error);
    throw error;
  }
};

// Função para criar notificação para usuário
// Recebe: userId, condominiumId, dados da notificação
// Retorna: notificação criada
const createNotification = async (userId, condominiumId, data) => {
  try {
    const {
      title,
      message,
      notificationType,
      entityType,
      entityId,
    } = data;

    // Verifica se já existe notificação não lida para a mesma entidade
    const existing = await query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3 AND read = FALSE`,
      [userId, entityType, entityId]
    );

    // Se já existe, não cria duplicada
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const result = await query(
      `INSERT INTO notifications (
        user_id, condominium_id, title, message, notification_type, entity_type, entity_id
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, condominiumId, title, message, notificationType, entityType || null, entityId || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

// Função para criar alerta no sistema (tabela alerts)
// Recebe: condominiumId, dados do alerta
// Retorna: alerta criado
const createAlert = async (condominiumId, data) => {
  try {
    const {
      alertType,
      severity,
      title,
      message,
      entityType,
      entityId,
    } = data;

    // Verifica se já existe alerta não resolvido para a mesma entidade
    const existing = await query(
      `SELECT id FROM alerts
       WHERE condominium_id = $1 AND entity_type = $2 AND entity_id = $3 AND resolved = FALSE`,
      [condominiumId, entityType, entityId]
    );

    // Se já existe, não cria duplicado
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const result = await query(
      `INSERT INTO alerts (
        condominium_id, alert_type, severity, title, message, entity_type, entity_id
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [condominiumId, alertType, severity || 'WARNING', title, message, entityType || null, entityId || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    throw error;
  }
};

// Função para processar tarefas com SLA expirado
// Cria notificações e alertas conforme necessário
const processTasksSLA = async (condominiumId) => {
  try {
    const overdueTasks = await checkTasksSLA(condominiumId);
    const alerts = [];

    for (const task of overdueTasks) {
      const hoursOverdue = Math.floor((new Date() - new Date(task.due_date)) / (1000 * 60 * 60));

      // Cria alerta no sistema
      await createAlert(condominiumId, {
        alertType: 'TASK_OVERDUE',
        severity: hoursOverdue > 48 ? 'CRITICAL' : 'WARNING',
        title: `Tarefa atrasada: ${task.title}`,
        message: `A tarefa "${task.title}" está atrasada há ${hoursOverdue} horas. Responsável: ${task.assigned_to_name || 'Não atribuído'}`,
        entityType: 'tasks',
        entityId: task.id,
      });

      // Cria notificação para o responsável
      if (task.assigned_to) {
        await createNotification(task.assigned_to, condominiumId, {
          title: `Tarefa atrasada: ${task.title}`,
          message: `A tarefa "${task.title}" está atrasada há ${hoursOverdue} horas.`,
          notificationType: 'TASK_OVERDUE',
          entityType: 'tasks',
          entityId: task.id,
        });
      }

      // Cria notificação para quem criou (administrativo)
      if (task.created_by) {
        await createNotification(task.created_by, condominiumId, {
          title: `Tarefa atrasada: ${task.title}`,
          message: `A tarefa "${task.title}" está atrasada há ${hoursOverdue} horas.`,
          notificationType: 'TASK_OVERDUE',
          entityType: 'tasks',
          entityId: task.id,
        });
      }

      alerts.push(task);
    }

    return alerts;
  } catch (error) {
    console.error('Erro ao processar SLA de tarefas:', error);
    throw error;
  }
};

// Função para processar ocorrências com SLA expirado
// Cria notificações e alertas conforme necessário
const processOccurrencesSLA = async (condominiumId) => {
  try {
    const overdueOccurrences = await checkOccurrencesSLA(condominiumId);
    const alerts = [];

    for (const occurrence of overdueOccurrences) {
      const hoursOverdue = Math.floor((new Date() - new Date(occurrence.s_l_a_due_date)) / (1000 * 60 * 60));

      // Cria alerta no sistema
      await createAlert(condominiumId, {
        alertType: 'OCCURRENCE_OVERDUE',
        severity: hoursOverdue > 48 ? 'CRITICAL' : 'WARNING',
        title: `Ocorrência atrasada: ${occurrence.title}`,
        message: `A ocorrência "${occurrence.title}" está atrasada há ${hoursOverdue} horas.`,
        entityType: 'occurrences',
        entityId: occurrence.id,
      });

      // Cria notificação para quem reportou
      if (occurrence.reported_by) {
        await createNotification(occurrence.reported_by, condominiumId, {
          title: `Ocorrência atrasada: ${occurrence.title}`,
          message: `A ocorrência "${occurrence.title}" está atrasada há ${hoursOverdue} horas.`,
          notificationType: 'OCCURRENCE_OVERDUE',
          entityType: 'occurrences',
          entityId: occurrence.id,
        });
      }

      alerts.push(occurrence);
    }

    return alerts;
  } catch (error) {
    console.error('Erro ao processar SLA de ocorrências:', error);
    throw error;
  }
};

// Função para processar escalonamento
// Verifica tarefas/ocorrências muito atrasadas e escalona para síndico
const processEscalation = async (condominiumId) => {
  try {
    // Busca regras de escalonamento ativas
    const rules = await query(
      `SELECT * FROM escalation_rules
       WHERE condominium_id = $1 AND active = TRUE
       ORDER BY escalation_level ASC`,
      [condominiumId]
    );

    if (rules.rows.length === 0) {
      return []; // Sem regras de escalonamento
    }

    const escalated = [];

    // Para cada regra, verifica entidades que ultrapassaram o prazo
    for (const rule of rules.rows) {
      const deadlineThreshold = new Date();
      deadlineThreshold.setHours(deadlineThreshold.getHours() - rule.hours_after_deadline);

      if (rule.entity_type === 'TASK') {
        const tasks = await query(
          `SELECT t.* FROM tasks t
           WHERE t.condominium_id = $1
             AND t.status IN ('PENDING', 'IN_PROGRESS')
             AND t.due_date IS NOT NULL
             AND t.due_date <= $2`,
          [condominiumId, deadlineThreshold]
        );

        // Busca síndicos/subsíndicos do condomínio
        const sindicos = await query(
          `SELECT u.id FROM users u
           INNER JOIN user_roles ur ON u.id = ur.user_id
           INNER JOIN roles r ON ur.role_id = r.id
           WHERE u.condominium_id = $1
             AND r.name IN ('SINDICO', 'SUBSINDICO')
             AND u.active = TRUE`,
          [condominiumId]
        );

        for (const task of tasks.rows) {
          for (const sindico of sindicos.rows) {
            await createNotification(sindico.id, condominiumId, {
              title: `[ESCALADO] Tarefa muito atrasada: ${task.title}`,
              message: `A tarefa "${task.title}" está atrasada há mais de ${rule.hours_after_deadline} horas e foi escalada.`,
              notificationType: 'TASK_ESCALATED',
              entityType: 'tasks',
              entityId: task.id,
            });
          }
          escalated.push(task);
        }
      } else if (rule.entity_type === 'OCCURRENCE') {
        const occurrences = await query(
          `SELECT o.* FROM occurrences o
           WHERE o.condominium_id = $1
             AND o.status IN ('ABERTA', 'EM_ATENDIMENTO')
             AND o.s_l_a_due_date IS NOT NULL
             AND o.s_l_a_due_date <= $2`,
          [condominiumId, deadlineThreshold]
        );

        // Busca síndicos/subsíndicos do condomínio
        const sindicos = await query(
          `SELECT u.id FROM users u
           INNER JOIN user_roles ur ON u.id = ur.user_id
           INNER JOIN roles r ON ur.role_id = r.id
           WHERE u.condominium_id = $1
             AND r.name IN ('SINDICO', 'SUBSINDICO')
             AND u.active = TRUE`,
          [condominiumId]
        );

        for (const occurrence of occurrences.rows) {
          for (const sindico of sindicos.rows) {
            await createNotification(sindico.id, condominiumId, {
              title: `[ESCALADO] Ocorrência muito atrasada: ${occurrence.title}`,
              message: `A ocorrência "${occurrence.title}" está atrasada há mais de ${rule.hours_after_deadline} horas e foi escalada.`,
              notificationType: 'OCCURRENCE_ESCALATED',
              entityType: 'occurrences',
              entityId: occurrence.id,
            });
          }
          escalated.push(occurrence);
        }
      }
    }

    return escalated;
  } catch (error) {
    console.error('Erro ao processar escalonamento:', error);
    throw error;
  }
};

// Função principal para executar todas as automações
// Deve ser chamada periodicamente (via cron/job)
const runAutomations = async (condominiumId) => {
  try {
    console.log(`[AUTOMAÇÃO] Iniciando automações para condomínio ${condominiumId}...`);

    const tasksProcessed = await processTasksSLA(condominiumId);
    const occurrencesProcessed = await processOccurrencesSLA(condominiumId);
    const escalated = await processEscalation(condominiumId);

    console.log(`[AUTOMAÇÃO] Processadas ${tasksProcessed.length} tarefas, ${occurrencesProcessed.length} ocorrências, ${escalated.length} escalonamentos`);

    return {
      tasksProcessed: tasksProcessed.length,
      occurrencesProcessed: occurrencesProcessed.length,
      escalated: escalated.length,
    };
  } catch (error) {
    console.error('Erro ao executar automações:', error);
    throw error;
  }
};

// Função para obter notificações não lidas de um usuário
const getUnreadNotifications = async (userId, condominiumId) => {
  try {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND condominium_id = $2 AND read = FALSE
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId, condominiumId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    throw error;
  }
};

// Função para marcar notificação como lida
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const result = await query(
      `UPDATE notifications SET read = TRUE, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  checkTasksSLA,
  checkOccurrencesSLA,
  createNotification,
  createAlert,
  processTasksSLA,
  processOccurrencesSLA,
  processEscalation,
  runAutomations,
  getUnreadNotifications,
  markNotificationAsRead,
};

// Service para gerenciar checklists diários (gerados automaticamente)
// Gerencia execução e visualização de checklists do dia

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');

// Retorna YYYY-MM-DD em data local (evita problema de timezone com toISOString)
const toLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Função para gerar checklists diários baseados em modelos ativos
// Recebe: condominiumId, date (opcional, padrão = hoje)
// Retorna: lista de checklists criados
// IMPORTANTE: Esta função é chamada pelo job automático todo dia
const generateDailyChecklists = async (condominiumId, date = null) => {
  try {
    const targetDate = date || new Date();
    const dayOfWeek = targetDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.

    // Busca modelos ativos que devem rodar hoje
    const modelsResult = await query(
      `SELECT * FROM checklist_models
       WHERE condominium_id = $1
       AND is_active = TRUE
       AND $2 = ANY(days_of_week)`,
      [condominiumId, dayOfWeek]
    );

    const models = modelsResult.rows;
    const createdChecklists = [];

    // Mapeia departamento → role quando default_assigned_role não está definido
    const departmentToRole = { ZELADORIA: 'OPERACIONAL', LIMPEZA: 'LIMPEZA' };

    const dateStr = toLocalDateString(targetDate);

    for (const model of models) {
      let assignedList = [];
      try {
        const asgResult = await query(
          `SELECT cma.user_id, (
             SELECT r.name FROM user_roles ur
             INNER JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = cma.user_id AND r.name IN ('OPERACIONAL', 'LIMPEZA')
             LIMIT 1
           ) as role_name
           FROM checklist_model_assignments cma
           INNER JOIN users u ON u.id = cma.user_id
           WHERE cma.model_id = $1 AND u.condominium_id = $2 AND u.active = TRUE`,
          [model.id, condominiumId]
        );
        assignedList = asgResult.rows || [];
      } catch (_) {
        assignedList = [];
      }

      const roleFallback = model.default_assigned_role ||
        (model.department && departmentToRole[model.department]) ||
        null;

      if (assignedList.length > 0) {
        // Pessoas específicas: um checklist por usuário vinculado
        for (const row of assignedList) {
          const assignedTo = row.user_id;
          const assignedRole = row.role_name || roleFallback;
          const existsPerUser = await query(
            `SELECT id FROM daily_checklists
             WHERE condominium_id = $1 AND model_id = $2 AND scheduled_date = $3 AND assigned_to = $4`,
            [condominiumId, model.id, dateStr, assignedTo]
          );
          if (existsPerUser.rows.length > 0) continue;

          const checklistResult = await query(
            `INSERT INTO daily_checklists (
              condominium_id, model_id, scheduled_date,
              assigned_to, assigned_role, status, created_by_system
            ) VALUES ($1, $2, $3, $4, $5, 'PENDING', TRUE)
            RETURNING *`,
            [condominiumId, model.id, dateStr, assignedTo, assignedRole]
          );
          const checklist = checklistResult.rows[0];

          const modelItemsResult = await query(
            `SELECT * FROM checklist_model_items WHERE model_id = $1 ORDER BY item_order, id`,
            [model.id]
          );
          for (const modelItem of modelItemsResult.rows) {
            await query(
              `INSERT INTO daily_checklist_items (
                checklist_id, model_item_id, item_name, item_order, status
              ) VALUES ($1, $2, $3, $4, 'PENDING')`,
              [checklist.id, modelItem.id, modelItem.item_name, modelItem.item_order]
            );
          }
          createdChecklists.push(checklist);
        }
      } else {
        // Sem vínculos: comportamento anterior (um checklist, primeiro usuário do role)
        const existsResult = await query(
          `SELECT id FROM daily_checklists
           WHERE condominium_id = $1 AND model_id = $2 AND scheduled_date = $3`,
          [condominiumId, model.id, dateStr]
        );
        if (existsResult.rows.length > 0) continue;

        let assignedTo = null;
        if (roleFallback) {
          const userResult = await query(
            `SELECT u.id FROM users u
             INNER JOIN user_roles ur ON u.id = ur.user_id
             INNER JOIN roles r ON ur.role_id = r.id
             WHERE u.condominium_id = $1 AND r.name = $2 AND u.active = TRUE
             LIMIT 1`,
            [condominiumId, roleFallback]
          );
          if (userResult.rows.length > 0) assignedTo = userResult.rows[0].id;
        }

        const checklistResult = await query(
          `INSERT INTO daily_checklists (
            condominium_id, model_id, scheduled_date,
            assigned_to, assigned_role, status, created_by_system
          ) VALUES ($1, $2, $3, $4, $5, 'PENDING', TRUE)
          RETURNING *`,
          [condominiumId, model.id, dateStr, assignedTo, roleFallback]
        );
        const checklist = checklistResult.rows[0];

        const modelItemsResult = await query(
          `SELECT * FROM checklist_model_items WHERE model_id = $1 ORDER BY item_order, id`,
          [model.id]
        );
        for (const modelItem of modelItemsResult.rows) {
          await query(
            `INSERT INTO daily_checklist_items (
              checklist_id, model_item_id, item_name, item_order, status
            ) VALUES ($1, $2, $3, $4, 'PENDING')`,
            [checklist.id, modelItem.id, modelItem.item_name, modelItem.item_order]
          );
        }
        createdChecklists.push(checklist);
      }
    }

    return createdChecklists;
  } catch (error) {
    console.error('Erro ao gerar checklists diários:', error);
    throw error;
  }
};

// Função para listar checklists do dia para um usuário
// Recebe: userId, condominiumId, date (opcional)
// Retorna: lista de checklists
const listDailyChecklists = async (userId, condominiumId, date = null) => {
  try {
    const targetDate = date || new Date();
    const dateStr = toLocalDateString(targetDate);

    // Busca checklists do dia atribuídos ao usuário OU ao role do usuário
    const userRolesResult = await query(
      `SELECT r.name FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    const userRoles = userRolesResult.rows.map(row => row.name);

    let sql = `
      SELECT dc.*, cm.name as model_name, cm.description as model_description,
             u.full_name as assigned_to_name
      FROM daily_checklists dc
      LEFT JOIN checklist_models cm ON dc.model_id = cm.id
      LEFT JOIN users u ON dc.assigned_to = u.id
      WHERE dc.condominium_id = $1
      AND dc.scheduled_date = $2
    `;

    const params = [condominiumId, dateStr];
    let paramCount = 3;

    // Filtra por usuário OU role
    if (userRoles.length > 0) {
      sql += ` AND (
        dc.assigned_to = $${paramCount++}
        OR dc.assigned_role = ANY($${paramCount++}::text[])
      )`;
      params.push(userId);
      params.push(userRoles);
    } else {
      sql += ` AND dc.assigned_to = $${paramCount++}`;
      params.push(userId);
    }

    sql += ` ORDER BY dc.created_at ASC`;

    const checklistsResult = await query(sql, params);
    const checklists = checklistsResult.rows;

    // Para cada checklist, busca seus itens
    for (const checklist of checklists) {
      const itemsResult = await query(
        `SELECT * FROM daily_checklist_items
         WHERE checklist_id = $1
         ORDER BY item_order, id`,
        [checklist.id]
      );
      checklist.items = itemsResult.rows;

      // Conta quantos itens estão feitos
      checklist.items_done = itemsResult.rows.filter(item => item.status === 'DONE').length;
      checklist.items_total = itemsResult.rows.length;
    }

    return checklists;
  } catch (error) {
    console.error('Erro ao listar checklists diários:', error);
    throw error;
  }
};

// Função para buscar um checklist específico
// Recebe: checklistId, userId (para validação)
// Retorna: checklist com itens e evidências
const getChecklistById = async (checklistId, userId, condominiumId) => {
  try {
    // Busca checklist
    const checklistResult = await query(
      `SELECT dc.*, cm.name as model_name, cm.description as model_description,
              cm.requires_photo, cm.requires_justification,
              u.full_name as assigned_to_name
       FROM daily_checklists dc
       LEFT JOIN checklist_models cm ON dc.model_id = cm.id
       LEFT JOIN users u ON dc.assigned_to = u.id
       WHERE dc.id = $1 AND dc.condominium_id = $2`,
      [checklistId, condominiumId]
    );

    if (checklistResult.rows.length === 0) {
      return null;
    }

    const checklist = checklistResult.rows[0];

    // Busca itens
    const itemsResult = await query(
      `SELECT * FROM daily_checklist_items
       WHERE checklist_id = $1
       ORDER BY item_order, id`,
      [checklistId]
    );
    checklist.items = itemsResult.rows;
    checklist.items_total = itemsResult.rows.length;
    checklist.items_done = itemsResult.rows.filter(i => i.status === 'DONE').length;

    // Busca evidências (fotos)
    const evidencesResult = await query(
      `SELECT * FROM checklist_evidences
       WHERE checklist_id = $1
       ORDER BY uploaded_at`,
      [checklistId]
    );
    checklist.evidences = evidencesResult.rows;

    return checklist;
  } catch (error) {
    console.error('Erro ao buscar checklist:', error);
    throw error;
  }
};

// Função para atualizar status de um item do checklist
// Recebe: itemId, status, comment, userId, condominiumId
// Retorna: { item, progress: { done, total }, checklistStatus } — checklist inicia ao marcar primeira tarefa (DONE/NOT_DONE)
const updateChecklistItem = async (itemId, status, comment, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Valida status
    if (!['PENDING', 'DONE', 'NOT_DONE'].includes(status)) {
      throw new Error('Status inválido');
    }

    // Busca item e checklist
    const itemResult = await query(
      `SELECT dci.*, dc.id as checklist_id, dc.status as checklist_status, dc.condominium_id,
              cm.requires_justification
       FROM daily_checklist_items dci
       INNER JOIN daily_checklists dc ON dci.checklist_id = dc.id
       LEFT JOIN checklist_models cm ON dc.model_id = cm.id
       WHERE dci.id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw new Error('Item não encontrado');
    }

    const item = itemResult.rows[0];
    const checklistId = item.checklist_id;

    if (item.condominium_id !== condominiumId) {
      throw new Error('Acesso negado');
    }

    // Validação: se NOT_DONE e requires_justification, comentário é obrigatório
    if (status === 'NOT_DONE' && item.requires_justification && (!comment || comment.trim() === '')) {
      throw new Error('Comentário é obrigatório quando o item não foi feito');
    }

    // Inicia checklist na primeira tarefa: se ainda PENDING e usuário marca DONE ou NOT_DONE
    if (item.checklist_status === 'PENDING' && (status === 'DONE' || status === 'NOT_DONE')) {
      await query(
        `UPDATE daily_checklists
         SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [checklistId]
      );
    }

    // Atualiza item
    const updateFields = ['status = $1'];
    const updateValues = [status];
    let paramCount = 2;

    if (status === 'DONE' || status === 'NOT_DONE') {
      updateFields.push(`done_at = CURRENT_TIMESTAMP`);
    } else {
      updateFields.push(`done_at = NULL`);
    }

    if (comment !== undefined) {
      updateFields.push(`comment = $${paramCount++}`);
      updateValues.push(comment || null);
    }

    updateValues.push(itemId);

    await query(
      `UPDATE daily_checklist_items 
       SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount}`,
      updateValues
    );

    // Busca item atualizado
    const updatedItemResult = await query(
      `SELECT * FROM daily_checklist_items WHERE id = $1`,
      [itemId]
    );
    const updatedItem = updatedItemResult.rows[0];

    // Conta progresso (done = apenas DONE)
    const countResult = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'DONE') as done,
         COUNT(*) as total
       FROM daily_checklist_items WHERE checklist_id = $1`,
      [checklistId]
    );
    const progress = {
      done: parseInt(countResult.rows[0].done, 10),
      total: parseInt(countResult.rows[0].total, 10)
    };

    const statusResult = await query(
      `SELECT status FROM daily_checklists WHERE id = $1`,
      [checklistId]
    );
    const checklistStatus = statusResult.rows[0].status;

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'DAILY_CHECKLIST',
      entityType: 'daily_checklist_items',
      entityId: itemId,
      beforeData: item,
      afterData: updatedItem,
      ipAddress: ipAddress,
      userAgent: userAgent
    });

    return { item: updatedItem, progress, checklistStatus };
  } catch (error) {
    console.error('Erro ao atualizar item do checklist:', error);
    throw error;
  }
};

// Função para iniciar checklist (marca como IN_PROGRESS)
// Recebe: checklistId, userId, condominiumId
// Retorna: checklist atualizado
const startChecklist = async (checklistId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const checklistResult = await query(
      `SELECT * FROM daily_checklists
       WHERE id = $1 AND condominium_id = $2`,
      [checklistId, condominiumId]
    );

    if (checklistResult.rows.length === 0) {
      throw new Error('Checklist não encontrado');
    }

    const checklist = checklistResult.rows[0];

    if (checklist.status !== 'PENDING') {
      throw new Error('Checklist já foi iniciado ou finalizado');
    }

    await query(
      `UPDATE daily_checklists
       SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [checklistId]
    );

    const updated = await getChecklistById(checklistId, userId, condominiumId);

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'DAILY_CHECKLIST',
      entityType: 'daily_checklists',
      entityId: checklistId,
      beforeData: checklist,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent
    });

    return updated;
  } catch (error) {
    console.error('Erro ao iniciar checklist:', error);
    throw error;
  }
};

// Função para finalizar checklist
// Recebe: checklistId, userId, condominiumId
// Validações: todos os itens devem estar DONE ou NOT_DONE, fotos obrigatórias se requires_photo
// Retorna: checklist atualizado
const completeChecklist = async (checklistId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const checklist = await getChecklistById(checklistId, userId, condominiumId);

    if (!checklist) {
      throw new Error('Checklist não encontrado');
    }

    if (checklist.status === 'COMPLETED') {
      throw new Error('Checklist já foi finalizado');
    }

    // Validação: todos os itens devem estar DONE ou NOT_DONE
    const pendingItems = checklist.items.filter(item => item.status === 'PENDING');
    if (pendingItems.length > 0) {
      throw new Error('Todos os itens devem estar concluídos antes de finalizar o checklist');
    }

    // Validação: se requires_justification, todos NOT_DONE devem ter comentário
    if (checklist.requires_justification) {
      const notDoneWithoutComment = checklist.items.filter(
        item => item.status === 'NOT_DONE' && (!item.comment || item.comment.trim() === '')
      );
      if (notDoneWithoutComment.length > 0) {
        throw new Error('Itens não feitos devem ter justificativa');
      }
    }

    // Validação: se requires_photo, deve ter pelo menos uma foto
    if (checklist.requires_photo) {
      if (!checklist.evidences || checklist.evidences.length === 0) {
        throw new Error('É necessário enviar pelo menos uma foto para finalizar o checklist');
      }
    }

    // Finaliza checklist
    await query(
      `UPDATE daily_checklists
       SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, completed_by = $1
       WHERE id = $2`,
      [userId, checklistId]
    );

    const updated = await getChecklistById(checklistId, userId, condominiumId);

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'DAILY_CHECKLIST',
      entityType: 'daily_checklists',
      entityId: checklistId,
      beforeData: checklist,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent
    });

    return updated;
  } catch (error) {
    console.error('Erro ao finalizar checklist:', error);
    throw error;
  }
};

// Função para adicionar evidência (foto) ao checklist
// Recebe: checklistId, filePath, fileName, fileType, fileSize, userId, condominiumId
// Retorna: evidência criada
const addEvidence = async (checklistId, filePath, fileName, fileType, fileSize, checklistItemId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Valida que checklist existe e pertence ao condomínio
    const checklistResult = await query(
      `SELECT id FROM daily_checklists
       WHERE id = $1 AND condominium_id = $2`,
      [checklistId, condominiumId]
    );

    if (checklistResult.rows.length === 0) {
      throw new Error('Checklist não encontrado');
    }

    // Se checklist já foi finalizado, não permite adicionar evidências
    const checklist = await getChecklistById(checklistId, userId, condominiumId);
    if (checklist.status === 'COMPLETED') {
      throw new Error('Não é possível adicionar evidências a um checklist já finalizado');
    }

    // Máximo 2 imagens por checklist; após isso, não permite mais envio
    const countResult = await query(
      `SELECT COUNT(*) as n FROM checklist_evidences WHERE checklist_id = $1`,
      [checklistId]
    );
    const count = parseInt(countResult.rows[0].n, 10);
    if (count >= 2) {
      throw new Error('Este checklist já possui o limite de 2 imagens. Não é possível enviar mais.');
    }

    // Insere evidência
    const evidenceResult = await query(
      `INSERT INTO checklist_evidences (
        checklist_id, checklist_item_id, file_path, file_name, file_type, file_size, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [checklistId, checklistItemId || null, filePath, fileName, fileType, fileSize, userId]
    );

    const evidence = evidenceResult.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'DAILY_CHECKLIST',
      entityType: 'checklist_evidences',
      entityId: evidence.id,
      afterData: evidence,
      ipAddress: ipAddress,
      userAgent: userAgent
    });

    return evidence;
  } catch (error) {
    console.error('Erro ao adicionar evidência:', error);
    throw error;
  }
};

// --- Síndico: acompanhar checklists e questionar itens não feitos ---

// Lista todos os checklists do condomínio para o síndico (qualquer data)
const listDailyChecklistsForSindico = async (condominiumId, date = null) => {
  try {
    const targetDate = date || new Date();
    const dateStr = toLocalDateString(targetDate);

    const checklistsResult = await query(
      `SELECT dc.*, cm.name as model_name, cm.description as model_description,
              u.full_name as assigned_to_name
       FROM daily_checklists dc
       LEFT JOIN checklist_models cm ON dc.model_id = cm.id
       LEFT JOIN users u ON dc.assigned_to = u.id
       WHERE dc.condominium_id = $1 AND dc.scheduled_date = $2
       ORDER BY dc.created_at ASC`,
      [condominiumId, dateStr]
    );
    const checklists = checklistsResult.rows;

    for (const checklist of checklists) {
      const itemsResult = await query(
        `SELECT * FROM daily_checklist_items WHERE checklist_id = $1 ORDER BY item_order, id`,
        [checklist.id]
      );
      checklist.items = itemsResult.rows;
      checklist.items_done = itemsResult.rows.filter((i) => i.status === 'DONE').length;
      checklist.items_total = itemsResult.rows.length;
      checklist.items_not_done = itemsResult.rows.filter((i) => i.status === 'NOT_DONE').length;
    }

    return checklists;
  } catch (error) {
    console.error('Erro ao listar checklists para síndico:', error);
    throw error;
  }
};

// Busca um checklist completo para o síndico (acompanhamento, read-only)
const getChecklistByIdForSindico = async (checklistId, condominiumId) => {
  try {
    const checklistResult = await query(
      `SELECT dc.*, cm.name as model_name, cm.description as model_description,
              cm.requires_photo, cm.requires_justification,
              u.full_name as assigned_to_name
       FROM daily_checklists dc
       LEFT JOIN checklist_models cm ON dc.model_id = cm.id
       LEFT JOIN users u ON dc.assigned_to = u.id
       WHERE dc.id = $1 AND dc.condominium_id = $2`,
      [checklistId, condominiumId]
    );
    if (checklistResult.rows.length === 0) return null;

    const checklist = checklistResult.rows[0];
    const itemsResult = await query(
      `SELECT * FROM daily_checklist_items WHERE checklist_id = $1 ORDER BY item_order, id`,
      [checklistId]
    );
    checklist.items = itemsResult.rows;
    checklist.items_total = itemsResult.rows.length;
    checklist.items_done = itemsResult.rows.filter((i) => i.status === 'DONE').length;
    checklist.items_not_done = itemsResult.rows.filter((i) => i.status === 'NOT_DONE').length;

    const evidencesResult = await query(
      `SELECT * FROM checklist_evidences WHERE checklist_id = $1 ORDER BY uploaded_at`,
      [checklistId]
    );
    checklist.evidences = evidencesResult.rows;

    return checklist;
  } catch (error) {
    console.error('Erro ao buscar checklist para síndico:', error);
    throw error;
  }
};

// Síndico questiona item não feito (por que não foi feito?)
const addSindicoQuestion = async (itemId, question, exigeResposta, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const itemResult = await query(
      `SELECT dci.*, dc.condominium_id
       FROM daily_checklist_items dci
       INNER JOIN daily_checklists dc ON dci.checklist_id = dc.id
       WHERE dci.id = $1`,
      [itemId]
    );
    if (itemResult.rows.length === 0) throw new Error('Item não encontrado');
    const item = itemResult.rows[0];
    if (item.condominium_id !== condominiumId) throw new Error('Acesso negado');

    const exige = exigeResposta === true || exigeResposta === 'true' || exigeResposta === '1';

    await query(
      `UPDATE daily_checklist_items
       SET sindico_question = $1, sindico_question_at = CURRENT_TIMESTAMP, sindico_question_by = $2, sindico_exige_resposta = $3
       WHERE id = $4`,
      [(question || '').trim() || null, userId, exige, itemId]
    );

    const updated = await query(
      `SELECT * FROM daily_checklist_items WHERE id = $1`,
      [itemId]
    );

    await logAction({
      userId,
      condominiumId,
      action: 'UPDATE',
      module: 'DAILY_CHECKLIST',
      entityType: 'daily_checklist_items',
      entityId: itemId,
      beforeData: item,
      afterData: updated.rows[0],
      ipAddress,
      userAgent
    });

    return updated.rows[0];
  } catch (error) {
    console.error('Erro ao registrar questionamento do síndico:', error);
    throw error;
  }
};

// Operacional/Limpeza responde ao questionamento do síndico
const addRespostaQuestionamento = async (itemId, resposta, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const itemResult = await query(
      `SELECT dci.*, dc.condominium_id, dc.assigned_to
       FROM daily_checklist_items dci
       INNER JOIN daily_checklists dc ON dci.checklist_id = dc.id
       WHERE dci.id = $1`,
      [itemId]
    );
    if (itemResult.rows.length === 0) throw new Error('Item não encontrado');
    const item = itemResult.rows[0];
    if (item.condominium_id !== condominiumId) throw new Error('Acesso negado');
    if (!item.sindico_question) throw new Error('Não há questionamento do síndico para responder');

    await query(
      `UPDATE daily_checklist_items
       SET resposta_questionamento = $1, resposta_questionamento_at = CURRENT_TIMESTAMP, resposta_questionamento_by = $2
       WHERE id = $3`,
      [(resposta || '').trim() || null, userId, itemId]
    );

    const updated = await query(
      `SELECT * FROM daily_checklist_items WHERE id = $1`,
      [itemId]
    );

    await logAction({
      userId,
      condominiumId,
      action: 'UPDATE',
      module: 'DAILY_CHECKLIST',
      entityType: 'daily_checklist_items',
      entityId: itemId,
      beforeData: item,
      afterData: updated.rows[0],
      ipAddress,
      userAgent
    });

    return updated.rows[0];
  } catch (error) {
    console.error('Erro ao registrar resposta ao questionamento:', error);
    throw error;
  }
};

module.exports = {
  generateDailyChecklists,
  listDailyChecklists,
  getChecklistById,
  updateChecklistItem,
  startChecklist,
  completeChecklist,
  addEvidence,
  listDailyChecklistsForSindico,
  getChecklistByIdForSindico,
  addSindicoQuestion,
  addRespostaQuestionamento
};

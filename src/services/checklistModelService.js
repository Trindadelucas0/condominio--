// Service para gerenciar modelos/templates de checklist
// Apenas SÍNDICO pode criar modelos (regras de execução)
// Modelos são usados para gerar checklists diários automaticamente

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');

// Função para listar modelos de checklist
// Recebe: condominiumId
// Retorna: lista de modelos com seus itens
const listModels = async (condominiumId) => {
  try {
    // Busca modelos
    const modelsResult = await query(
      `SELECT cm.*, u.full_name as created_by_name
       FROM checklist_models cm
       LEFT JOIN users u ON cm.created_by = u.id
       WHERE cm.condominium_id = $1
       ORDER BY cm.name`,
      [condominiumId]
    );

    const models = modelsResult.rows;

    // Para cada modelo, busca seus itens
    for (const model of models) {
      const itemsResult = await query(
        `SELECT * FROM checklist_model_items
         WHERE model_id = $1
         ORDER BY item_order, id`,
        [model.id]
      );
      model.items = itemsResult.rows;
    }

    return models;
  } catch (error) {
    console.error('Erro ao listar modelos de checklist:', error);
    throw error;
  }
};

// Função para buscar um modelo específico
// Recebe: modelId, condominiumId
// Retorna: modelo com seus itens
const getModelById = async (modelId, condominiumId) => {
  try {
    // Busca modelo
    const modelResult = await query(
      `SELECT cm.*, u.full_name as created_by_name
       FROM checklist_models cm
       LEFT JOIN users u ON cm.created_by = u.id
       WHERE cm.id = $1 AND cm.condominium_id = $2`,
      [modelId, condominiumId]
    );

    if (modelResult.rows.length === 0) {
      return null;
    }

    const model = modelResult.rows[0];

    // Busca itens do modelo
    const itemsResult = await query(
      `SELECT * FROM checklist_model_items
       WHERE model_id = $1
       ORDER BY item_order, id`,
      [modelId]
    );
    model.items = itemsResult.rows;

    return model;
  } catch (error) {
    console.error('Erro ao buscar modelo:', error);
    throw error;
  }
};

// Função para criar modelo de checklist
// Recebe: dados do modelo, userId, condominiumId
// Retorna: modelo criado
const createModel = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const {
      name,
      description,
      department,
      daysOfWeek, // Array de números [1, 3, 5]
      isActive,
      requiresPhoto,
      requiresJustification,
      defaultAssignedRole,
      items // Array de itens [{ name, order, requiresPhoto }]
    } = data;

    // Validações
    if (!name || name.trim() === '') {
      throw new Error('Nome do modelo é obrigatório');
    }

    if (!department) {
      throw new Error('Departamento é obrigatório');
    }

    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      throw new Error('É necessário selecionar pelo menos um dia da semana');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('É necessário adicionar pelo menos um item ao modelo');
    }

    // Cria modelo
    const modelResult = await query(
      `INSERT INTO checklist_models (
        condominium_id, name, description, department, days_of_week,
        is_active, requires_photo, requires_justification, default_assigned_role, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        condominiumId,
        name.trim(),
        description || null,
        department,
        daysOfWeek, // PostgreSQL aceita arrays diretamente
        isActive !== undefined ? isActive : true,
        requiresPhoto !== undefined ? requiresPhoto : true,
        requiresJustification !== undefined ? requiresJustification : true,
        defaultAssignedRole || null,
        userId
      ]
    );

    const model = modelResult.rows[0];

    // Cria itens do modelo
    for (const item of items) {
      if (item.name && item.name.trim() !== '') {
        await query(
          `INSERT INTO checklist_model_items (model_id, item_name, item_order, requires_photo)
           VALUES ($1, $2, $3, $4)`,
          [
            model.id,
            item.name.trim(),
            item.order || 0,
            item.requiresPhoto || false
          ]
        );
      }
    }

    // Busca modelo completo com itens
    const completeModel = await getModelById(model.id, condominiumId);

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'CHECKLIST_MODEL',
      entityType: 'checklist_models',
      entityId: model.id,
      afterData: completeModel,
      ipAddress: ipAddress,
      userAgent: userAgent
    });

    return completeModel;
  } catch (error) {
    console.error('Erro ao criar modelo de checklist:', error);
    throw error;
  }
};

// Função para atualizar modelo
// Recebe: modelId, dados, userId, condominiumId
// Retorna: modelo atualizado
const updateModel = async (modelId, data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca modelo atual (para log)
    const currentModel = await getModelById(modelId, condominiumId);
    if (!currentModel) {
      throw new Error('Modelo não encontrado');
    }

    const {
      name,
      description,
      department,
      daysOfWeek,
      isActive,
      requiresPhoto,
      requiresJustification,
      defaultAssignedRole,
      items
    } = data;

    // Atualiza modelo
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      updateValues.push(name.trim());
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description || null);
    }

    if (department !== undefined) {
      updateFields.push(`department = $${paramCount++}`);
      updateValues.push(department);
    }

    if (daysOfWeek !== undefined) {
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        throw new Error('É necessário selecionar pelo menos um dia da semana');
      }
      updateFields.push(`days_of_week = $${paramCount++}`);
      updateValues.push(daysOfWeek);
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      updateValues.push(isActive);
    }

    if (requiresPhoto !== undefined) {
      updateFields.push(`requires_photo = $${paramCount++}`);
      updateValues.push(requiresPhoto);
    }

    if (requiresJustification !== undefined) {
      updateFields.push(`requires_justification = $${paramCount++}`);
      updateValues.push(requiresJustification);
    }

    if (defaultAssignedRole !== undefined) {
      updateFields.push(`default_assigned_role = $${paramCount++}`);
      updateValues.push(defaultAssignedRole || null);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length > 1) {
      updateValues.push(modelId);
      await query(
        `UPDATE checklist_models SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        updateValues
      );
    }

    // Se items foi fornecido, atualiza itens
    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('É necessário ter pelo menos um item no modelo');
      }

      // Remove itens antigos
      await query(`DELETE FROM checklist_model_items WHERE model_id = $1`, [modelId]);

      // Insere novos itens
      for (const item of items) {
        if (item.name && item.name.trim() !== '') {
          await query(
            `INSERT INTO checklist_model_items (model_id, item_name, item_order, requires_photo)
             VALUES ($1, $2, $3, $4)`,
            [
              modelId,
              item.name.trim(),
              item.order || 0,
              item.requiresPhoto || false
            ]
          );
        }
      }
    }

    // Busca modelo atualizado
    const updatedModel = await getModelById(modelId, condominiumId);

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'CHECKLIST_MODEL',
      entityType: 'checklist_models',
      entityId: modelId,
      beforeData: currentModel,
      afterData: updatedModel,
      ipAddress: ipAddress,
      userAgent: userAgent
    });

    return updatedModel;
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
    throw error;
  }
};

// Função para desativar/ativar modelo
// Recebe: modelId, isActive, userId, condominiumId
// Retorna: modelo atualizado
const toggleModelActive = async (modelId, isActive, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const currentModel = await getModelById(modelId, condominiumId);
    if (!currentModel) {
      throw new Error('Modelo não encontrado');
    }

    await query(
      `UPDATE checklist_models 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [isActive, modelId]
    );

    const updatedModel = await getModelById(modelId, condominiumId);

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'CHECKLIST_MODEL',
      entityType: 'checklist_models',
      entityId: modelId,
      beforeData: currentModel,
      afterData: updatedModel,
      ipAddress: ipAddress,
      userAgent: userAgent
    });

    return updatedModel;
  } catch (error) {
    console.error('Erro ao alterar status do modelo:', error);
    throw error;
  }
};

module.exports = {
  listModels,
  getModelById,
  createModel,
  updateModel,
  toggleModelActive
};

// Serviço de estoque/insumos
// Gerencia cadastro de insumos, movimentações e alertas de estoque mínimo
// REGRA: Operacional baixa, Administrativo controla, Financeiro vê impacto

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { createNotification } = require('./automationService');

// Função para listar itens de estoque
// Recebe: condominiumId, filtros opcionais (category, active, belowMinimum)
// Retorna: lista de itens
const listItems = async (condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT * FROM inventory_items
      WHERE condominium_id = $1
    `;
    const params = [condominiumId];

    if (filters.category) {
      queryText += ` AND category = $${params.length + 1}`;
      params.push(filters.category);
    }

    if (filters.active !== undefined) {
      queryText += ` AND active = $${params.length + 1}`;
      params.push(filters.active);
    } else {
      queryText += ` AND archived_at IS NULL`;
    }

    // Filtro para itens abaixo do mínimo
    if (filters.belowMinimum) {
      queryText += ` AND current_quantity <= minimum_quantity`;
    }

    queryText += ` ORDER BY name`;

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar itens de estoque:', error);
    throw error;
  }
};

// Função para criar item de estoque
// Recebe: data, userId, condominiumId
// Retorna: item criado
const createItem = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const {
      name,
      description,
      unit,
      minimumQuantity,
      category,
      supplier,
      lastPurchasePrice,
      location,
    } = data;

    if (!name || !unit) {
      throw new Error('Nome e unidade são obrigatórios');
    }

    const result = await query(
      `INSERT INTO inventory_items (
        condominium_id, name, description, unit, current_quantity, minimum_quantity,
        category, supplier, last_purchase_price, location, created_by
      )
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        condominiumId,
        name.trim(),
        description || null,
        unit,
        minimumQuantity || 0,
        category || null,
        supplier || null,
        lastPurchasePrice ? parseFloat(lastPurchasePrice) : null,
        location || null,
        userId,
      ]
    );

    const item = result.rows[0];

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ESTOQUE',
      entityType: 'inventory_items',
      entityId: item.id,
      beforeData: null,
      afterData: item,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return item;
  } catch (error) {
    console.error('Erro ao criar item de estoque:', error);
    throw error;
  }
};

// Função para atualizar item de estoque
// Recebe: itemId, data, userId, condominiumId
// Retorna: item atualizado
const updateItem = async (itemId, data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca item atual
    const itemResult = await query(
      `SELECT * FROM inventory_items 
       WHERE id = $1 AND condominium_id = $2 AND archived_at IS NULL`,
      [itemId, condominiumId]
    );

    if (itemResult.rows.length === 0) {
      throw new Error('Item não encontrado');
    }

    const oldItem = itemResult.rows[0];

    const {
      name,
      description,
      unit,
      minimumQuantity,
      category,
      supplier,
      lastPurchasePrice,
      location,
      active,
    } = data;

    // Atualiza item
    const result = await query(
      `UPDATE inventory_items 
       SET name = $1, description = $2, unit = $3, minimum_quantity = $4,
           category = $5, supplier = $6, last_purchase_price = $7, location = $8,
           active = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        name || oldItem.name,
        description !== undefined ? description : oldItem.description,
        unit || oldItem.unit,
        minimumQuantity !== undefined ? parseFloat(minimumQuantity) : oldItem.minimum_quantity,
        category !== undefined ? category : oldItem.category,
        supplier !== undefined ? supplier : oldItem.supplier,
        lastPurchasePrice !== undefined ? (lastPurchasePrice ? parseFloat(lastPurchasePrice) : null) : oldItem.last_purchase_price,
        location !== undefined ? location : oldItem.location,
        active !== undefined ? active : oldItem.active,
        itemId,
      ]
    );

    const updated = result.rows[0];

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'ESTOQUE',
      entityType: 'inventory_items',
      entityId: itemId,
      beforeData: oldItem,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar item de estoque:', error);
    throw error;
  }
};

// Função para registrar movimentação de estoque
// Recebe: itemId, movementType, quantity, reason, cost, movementDate, userId, condominiumId
// Retorna: movimentação criada
const createMovement = async (itemId, movementType, quantity, reason, cost, movementDate, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca item atual
    const itemResult = await query(
      `SELECT * FROM inventory_items 
       WHERE id = $1 AND condominium_id = $2 AND archived_at IS NULL`,
      [itemId, condominiumId]
    );

    if (itemResult.rows.length === 0) {
      throw new Error('Item não encontrado');
    }

    const item = itemResult.rows[0];
    const quantityBefore = parseFloat(item.current_quantity);
    let quantityAfter = quantityBefore;

    // Calcula nova quantidade conforme tipo de movimentação
    if (movementType === 'ENTRY') {
      quantityAfter = quantityBefore + parseFloat(quantity);
    } else if (movementType === 'EXIT') {
      quantityAfter = quantityBefore - parseFloat(quantity);
      if (quantityAfter < 0) {
        throw new Error('Quantidade insuficiente em estoque');
      }
    } else if (movementType === 'ADJUSTMENT') {
      quantityAfter = parseFloat(quantity);
    } else {
      throw new Error('Tipo de movimentação inválido');
    }

    // Cria movimentação
    const movementResult = await query(
      `INSERT INTO inventory_movements (
        inventory_item_id, movement_type, quantity, quantity_before, quantity_after,
        reason, cost, movement_date, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        itemId,
        movementType,
        parseFloat(quantity),
        quantityBefore,
        quantityAfter,
        reason || null,
        cost ? parseFloat(cost) : null,
        movementDate || new Date(),
        userId,
      ]
    );

    const movement = movementResult.rows[0];

    // Atualiza quantidade do item
    await query(
      `UPDATE inventory_items 
       SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantityAfter, itemId]
    );

    // Verifica se ficou abaixo do mínimo e cria alerta
    if (quantityAfter <= item.minimum_quantity) {
      // Busca usuários administrativos para notificar
      const adminUsers = await query(
        `SELECT u.id FROM users u
         INNER JOIN user_roles ur ON u.id = ur.user_id
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE u.condominium_id = $1 AND r.name = 'ADMINISTRATIVO' AND u.active = TRUE`,
        [condominiumId]
      );

      for (const admin of adminUsers.rows) {
        await createNotification(admin.id, condominiumId, {
          title: `Estoque mínimo atingido: ${item.name}`,
          message: `O item "${item.name}" está abaixo ou no limite mínimo (${item.minimum_quantity} ${item.unit}). Quantidade atual: ${quantityAfter} ${item.unit}`,
          notificationType: 'INVENTORY_MINIMUM',
          entityType: 'inventory_items',
          entityId: itemId,
        });
      }
    }

    // Log de auditoria
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'ESTOQUE',
      entityType: 'inventory_movements',
      entityId: movement.id,
      beforeData: { item_id: itemId, quantity_before: quantityBefore },
      afterData: { item_id: itemId, quantity_after: quantityAfter, movement },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return movement;
  } catch (error) {
    console.error('Erro ao criar movimentação de estoque:', error);
    throw error;
  }
};

// Função para listar movimentações de um item
// Recebe: itemId, condominiumId
// Retorna: lista de movimentações
const listMovements = async (itemId, condominiumId) => {
  try {
    const result = await query(
      `SELECT m.*, u.full_name as created_by_name
       FROM inventory_movements m
       LEFT JOIN users u ON m.created_by = u.id
       WHERE m.inventory_item_id = $1
       ORDER BY m.movement_date DESC, m.created_at DESC
       LIMIT 100`,
      [itemId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    throw error;
  }
};

// Função para obter itens abaixo do mínimo
// Recebe: condominiumId
// Retorna: lista de itens abaixo do mínimo
const getItemsBelowMinimum = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT * FROM inventory_items
       WHERE condominium_id = $1 
         AND current_quantity <= minimum_quantity
         AND archived_at IS NULL
         AND active = TRUE
       ORDER BY (current_quantity - minimum_quantity) ASC`,
      [condominiumId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao obter itens abaixo do mínimo:', error);
    throw error;
  }
};

module.exports = {
  listItems,
  createItem,
  updateItem,
  createMovement,
  listMovements,
  getItemsBelowMinimum,
};

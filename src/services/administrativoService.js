// Service do módulo ADMINISTRATIVO
// Contém lógica de negócio para o painel administrativo
// Apenas ADMINISTRATIVO pode executar essas operações

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria

// Função para obter estatísticas do administrativo
// Recebe: condominiumId
// Retorna: estatísticas (tarefas criadas, documentos próximos do vencimento, etc)
const getDashboardStats = async (condominiumId) => {
  try {
    // Conta tarefas criadas (não finalizadas)
    const activeTasksResult = await query(
      `SELECT COUNT(*) as total FROM tasks 
       WHERE condominium_id = $1 AND status IN ('PENDING', 'IN_PROGRESS')`,
      [condominiumId]
    );
    const activeTasks = parseInt(activeTasksResult.rows[0].total);

    // Conta documentos próximos do vencimento (30 dias)
    const expiringDocumentsResult = await query(
      `SELECT COUNT(*) as total FROM documents 
       WHERE condominium_id = $1 AND expiry_date IS NOT NULL 
       AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       AND status = 'ACTIVE'`,
      [condominiumId]
    );
    const expiringDocuments = parseInt(expiringDocumentsResult.rows[0].total);

    // Conta documentos vencidos
    const expiredDocumentsResult = await query(
      `SELECT COUNT(*) as total FROM documents 
       WHERE condominium_id = $1 AND expiry_date IS NOT NULL 
       AND expiry_date < CURRENT_DATE AND status = 'ACTIVE'`,
      [condominiumId]
    );
    const expiredDocuments = parseInt(expiredDocumentsResult.rows[0].total);

    return {
      activeTasks,
      expiringDocuments,
      expiredDocuments,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard administrativo:', error);
    throw error;
  }
};

// Função para listar usuários operacionais do condomínio
// Recebe: condominiumId
// Retorna: lista de usuários com perfil OPERACIONAL
const listOperacionais = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT u.id, u.full_name, u.username, u.email
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE u.condominium_id = $1 AND r.name = 'OPERACIONAL' AND u.active = TRUE
       ORDER BY u.full_name`,
      [condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar operacionais:', error);
    throw error;
  }
};

// Função para criar tarefa
// Recebe: dados da tarefa, userId, condominiumId
// Retorna: tarefa criada
const createTask = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { title, description, assignedTo, dueDate, priority, taskType, checklistItems } = data;

    // Validações
    if (!title || title.trim() === '') {
      throw new Error('Título é obrigatório');
    }
    if (!dueDate) {
      throw new Error('Data de vencimento é obrigatória');
    }
    if (!assignedTo) {
      throw new Error('Responsável é obrigatório');
    }

    // Valida se o usuário atribuído é operacional do mesmo condomínio
    const userResult = await query(
      `SELECT u.id, u.condominium_id
       FROM users u
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1 AND r.name = 'OPERACIONAL' AND u.condominium_id = $2 AND u.active = TRUE`,
      [assignedTo, condominiumId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Usuário responsável inválido ou não é operacional');
    }

    // Insere tarefa
    const taskResult = await query(
      `INSERT INTO tasks (condominium_id, created_by, assigned_to, title, description, task_type, priority, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
       RETURNING *`,
      [condominiumId, userId, assignedTo, title.trim(), description || null, taskType || 'CHECKLIST', priority || 'NORMAL', dueDate]
    );

    const task = taskResult.rows[0];

    // Se há itens de checklist, insere
    if (checklistItems && checklistItems.length > 0) {
      for (let i = 0; i < checklistItems.length; i++) {
        const item = checklistItems[i];
        if (item && item.trim() !== '') {
          await query(
            `INSERT INTO checklists (task_id, item_name, item_order, status)
             VALUES ($1, $2, $3, 'PENDING')`,
            [task.id, item.trim(), i + 1]
          );
        }
      }
    }

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'TASK',
      entityType: 'tasks',
      entityId: task.id,
      afterData: task,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return task;
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    throw error;
  }
};

// Função para listar tarefas criadas pelo administrativo
// Recebe: userId, condominiumId, filtros
// Retorna: lista de tarefas
const listTasks = async (userId, condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT t.*, u.full_name as assigned_to_name, u2.full_name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.created_by = $1 AND t.condominium_id = $2
    `;
    const params = [userId, condominiumId];
    let paramCount = 3;

    if (filters.status) {
      sql += ` AND t.status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    throw error;
  }
};

// Função para listar documentos
// Recebe: condominiumId, filtros
// Retorna: lista de documentos
const listDocuments = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT d.*, dc.name as category_name, u.full_name as created_by_name
      FROM documents d
      LEFT JOIN document_categories dc ON d.category_id = dc.id
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.categoryId) {
      sql += ` AND d.category_id = $${paramCount++}`;
      params.push(filters.categoryId);
    }

    if (filters.status) {
      sql += ` AND d.status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY d.created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    throw error;
  }
};

// Função para listar categorias de documentos
// Recebe: condominiumId
// Retorna: lista de categorias
const listDocumentCategories = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT * FROM document_categories 
       WHERE condominium_id = $1 
       ORDER BY name`,
      [condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar categorias de documentos:', error);
    throw error;
  }
};

// Função para criar categoria de documento
// Recebe: dados da categoria, userId, condominiumId
// Retorna: categoria criada
const createDocumentCategory = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { name, description } = data;

    if (!name || name.trim() === '') {
      throw new Error('Nome da categoria é obrigatório');
    }

    const result = await query(
      `INSERT INTO document_categories (condominium_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [condominiumId, name.trim(), description || null]
    );

    const category = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'DOCUMENT',
      entityType: 'document_categories',
      entityId: category.id,
      afterData: category,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return category;
  } catch (error) {
    console.error('Erro ao criar categoria de documento:', error);
    throw error;
  }
};

// Função para criar documento
// Recebe: dados do documento, userId, condominiumId
// Retorna: documento criado
const createDocument = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { title, description, categoryId, documentType, expiryDate } = data;

    if (!title || title.trim() === '') {
      throw new Error('Título é obrigatório');
    }

    const result = await query(
      `INSERT INTO documents (condominium_id, category_id, title, description, document_type, expiry_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)
       RETURNING *`,
      [condominiumId, categoryId || null, title.trim(), description || null, documentType || 'DOCUMENT', expiryDate || null, userId]
    );

    const document = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'DOCUMENT',
      entityType: 'documents',
      entityId: document.id,
      afterData: document,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return document;
  } catch (error) {
    console.error('Erro ao criar documento:', error);
    throw error;
  }
};

// Função para atualizar documento
// Recebe: documentId, data, userId, condominiumId
// Retorna: documento atualizado
const updateDocument = async (documentId, data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Busca documento atual
    const currentResult = await query(
      `SELECT * FROM documents WHERE id = $1 AND condominium_id = $2`,
      [documentId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Documento não encontrado');
    }

    const current = currentResult.rows[0];
    const { title, description, categoryId, documentType, expiryDate, status } = data;

    // Atualiza documento
    const updateResult = await query(
      `UPDATE documents 
       SET title = $1, description = $2, category_id = $3, document_type = $4, 
           expiry_date = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title.trim(), description || null, categoryId || null, documentType || 'DOCUMENT', expiryDate || null, status || 'ACTIVE', documentId]
    );

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'DOCUMENT',
      entityType: 'documents',
      entityId: documentId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  getDashboardStats,
  listOperacionais,
  createTask,
  listTasks,
  listDocuments,
  listDocumentCategories,
  createDocumentCategory,
  createDocument,
  updateDocument,
};

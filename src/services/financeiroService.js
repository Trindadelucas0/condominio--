// Service do módulo FINANCEIRO
// Contém lógica de negócio para o painel financeiro
// Apenas ADMINISTRATIVO pode acessar (operacional não acessa)

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria

// Função para obter estatísticas financeiras
// Recebe: condominiumId
// Retorna: estatísticas (saldo, entradas, saídas, etc)
const getDashboardStats = async (condominiumId) => {
  try {
    // Soma entradas recebidas
    const entriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 AND received = TRUE`,
      [condominiumId]
    );
    const totalEntries = parseFloat(entriesResult.rows[0].total);

    // Soma saídas pagas
    const exitsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PAID'`,
      [condominiumId]
    );
    const totalExits = parseFloat(exitsResult.rows[0].total);

    // Calcula saldo
    const balance = totalEntries - totalExits;

    // Conta saídas pendentes de aprovação
    const pendingApprovalsResult = await query(
      `SELECT COUNT(*) as total FROM financial_exits 
       WHERE condominium_id = $1 AND payment_status = 'PENDING' AND requires_approval = TRUE`,
      [condominiumId]
    );
    const pendingApprovals = parseInt(pendingApprovalsResult.rows[0].total);

    return {
      totalEntries,
      totalExits,
      balance,
      pendingApprovals,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas financeiras:', error);
    throw error;
  }
};

// Função para listar centros de custo
// Recebe: condominiumId
// Retorna: lista de centros de custo
const listCostCenters = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT * FROM cost_centers 
       WHERE condominium_id = $1 AND active = TRUE 
       ORDER BY name`,
      [condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar centros de custo:', error);
    throw error;
  }
};

// Função para criar centro de custo
// Recebe: data, userId, condominiumId
// Retorna: centro de custo criado
const createCostCenter = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { name, description } = data;

    if (!name || name.trim() === '') {
      throw new Error('Nome do centro de custo é obrigatório');
    }

    const result = await query(
      `INSERT INTO cost_centers (condominium_id, name, description, active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [condominiumId, name.trim(), description || null]
    );

    const costCenter = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'cost_centers',
      entityId: costCenter.id,
      afterData: costCenter,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return costCenter;
  } catch (error) {
    console.error('Erro ao criar centro de custo:', error);
    throw error;
  }
};

// Função para listar entradas financeiras
// Recebe: condominiumId, filtros
// Retorna: lista de entradas
const listEntries = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT fe.*, cc.name as cost_center_name, u.full_name as created_by_name
      FROM financial_entries fe
      LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
      LEFT JOIN users u ON fe.created_by = u.id
      WHERE fe.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.received !== undefined) {
      sql += ` AND fe.received = $${paramCount++}`;
      params.push(filters.received);
    }

    sql += ` ORDER BY fe.entry_date DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar entradas:', error);
    throw error;
  }
};

// Função para criar entrada financeira
// Recebe: data, userId, condominiumId
// Retorna: entrada criada
const createEntry = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { description, amount, entryDate, costCenterId, category } = data;

    if (!description || !amount || !entryDate) {
      throw new Error('Descrição, valor e data são obrigatórios');
    }

    const result = await query(
      `INSERT INTO financial_entries (condominium_id, description, amount, entry_date, cost_center_id, category, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [condominiumId, description.trim(), parseFloat(amount), entryDate, costCenterId || null, category || 'TAXA', userId]
    );

    const entry = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entry.id,
      afterData: entry,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return entry;
  } catch (error) {
    console.error('Erro ao criar entrada:', error);
    throw error;
  }
};

// Função para marcar entrada como recebida
// Recebe: entryId, userId, condominiumId
// Retorna: entrada atualizada
const markEntryAsReceived = async (entryId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const currentResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const current = currentResult.rows[0];

    const updateResult = await query(
      `UPDATE financial_entries 
       SET received = TRUE, received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [entryId]
    );

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'financial_entries',
      entityId: entryId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao marcar entrada como recebida:', error);
    throw error;
  }
};

// Função para listar saídas financeiras
// Recebe: condominiumId, filtros
// Retorna: lista de saídas
const listExits = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT fe.*, cc.name as cost_center_name, b.name as bill_name, u.full_name as created_by_name
      FROM financial_exits fe
      LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
      LEFT JOIN bills b ON fe.bill_id = b.id
      LEFT JOIN users u ON fe.created_by = u.id
      WHERE fe.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.paymentStatus) {
      sql += ` AND fe.payment_status = $${paramCount++}`;
      params.push(filters.paymentStatus);
    }

    sql += ` ORDER BY fe.exit_date DESC LIMIT 100`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar saídas:', error);
    throw error;
  }
};

// Função para criar saída financeira
// Recebe: data, userId, condominiumId
// Retorna: saída criada
const createExit = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { description, amount, exitDate, costCenterId, category, billId, requiresApproval, approvalLimit } = data;

    if (!description || !amount || !exitDate) {
      throw new Error('Descrição, valor e data são obrigatórios');
    }

    const amountValue = parseFloat(amount);
    const limitValue = approvalLimit ? parseFloat(approvalLimit) : 1000.00;

    // Se requer aprovação e valor é maior que o limite, cria aprovação pendente
    const needsApproval = requiresApproval && amountValue > limitValue;
    const paymentStatus = needsApproval ? 'PENDING' : 'APPROVED';

    const result = await query(
      `INSERT INTO financial_exits (condominium_id, description, amount, exit_date, cost_center_id, category, bill_id, requires_approval, approval_limit, payment_status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [condominiumId, description.trim(), amountValue, exitDate, costCenterId || null, category || 'OUTRA', billId || null, requiresApproval || false, limitValue, paymentStatus, userId]
    );

    const exit = result.rows[0];

    // Se precisa de aprovação, cria registro na tabela approvals
    if (needsApproval) {
      await query(
        `INSERT INTO approvals (condominium_id, approval_type, entity_type, entity_id, requested_by, requested_amount, description, status)
         VALUES ($1, 'FINANCIAL_EXIT', 'financial_exits', $2, $3, $4, $5, 'PENDING')`,
        [condominiumId, exit.id, userId, amountValue, description.trim()]
      );
    }

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exit.id,
      afterData: exit,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return exit;
  } catch (error) {
    console.error('Erro ao criar saída:', error);
    throw error;
  }
};

// Função para marcar saída como paga
// Recebe: exitId, userId, condominiumId
// Retorna: saída atualizada
const markExitAsPaid = async (exitId, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const currentResult = await query(
      `SELECT * FROM financial_exits WHERE id = $1 AND condominium_id = $2`,
      [exitId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Saída não encontrada');
    }

    const current = currentResult.rows[0];

    // Valida se está aprovada
    if (current.payment_status !== 'APPROVED') {
      throw new Error('Saída deve estar aprovada antes de ser marcada como paga');
    }

    // Valida se não está já paga
    if (current.payment_status === 'PAID') {
      throw new Error('Saída já está marcada como paga');
    }

    const updateResult = await query(
      `UPDATE financial_exits 
       SET payment_status = 'PAID', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [exitId]
    );

    const updated = updateResult.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'financial_exits',
      entityId: exitId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao marcar saída como paga:', error);
    throw error;
  }
};

// Função para listar contas (bills)
// Recebe: condominiumId
// Retorna: lista de contas
const listBills = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT b.*, cc.name as cost_center_name
       FROM bills b
       LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id
       WHERE b.condominium_id = $1 AND b.active = TRUE
       ORDER BY b.name`,
      [condominiumId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    throw error;
  }
};

// Função para criar conta (bill)
// Recebe: data, userId, condominiumId
// Retorna: conta criada
const createBill = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { name, billType, costCenterId, provider, accountNumber } = data;

    if (!name || !billType) {
      throw new Error('Nome e tipo da conta são obrigatórios');
    }

    const result = await query(
      `INSERT INTO bills (condominium_id, name, bill_type, cost_center_id, provider, account_number, active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [condominiumId, name.trim(), billType, costCenterId || null, provider || null, accountNumber || null]
    );

    const bill = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'bills',
      entityId: bill.id,
      afterData: bill,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return bill;
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  getDashboardStats,
  listCostCenters,
  createCostCenter,
  listEntries,
  createEntry,
  markEntryAsReceived,
  listExits,
  createExit,
  markExitAsPaid,
  listBills,
  createBill,
};

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
    const { description, amount, entryDate, costCenterId, category, isRecurring, recurrenceType, isVariable, averageAmount } = data;

    if (!description || !amount || !entryDate) {
      throw new Error('Descrição, valor e data são obrigatórios');
    }

    const result = await query(
      `INSERT INTO financial_entries (condominium_id, description, amount, entry_date, cost_center_id, category, created_by, is_recurring, recurrence_type, is_variable, average_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        condominiumId, 
        description.trim(), 
        parseFloat(amount), 
        entryDate, 
        costCenterId || null, 
        category || 'TAXA', 
        userId,
        isRecurring === 'true' || isRecurring === true,
        recurrenceType || 'UNIQUE',
        isVariable === 'true' || isVariable === true,
        averageAmount ? parseFloat(averageAmount) : null
      ]
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

// Função para obter entrada por ID
// Recebe: entryId, condominiumId
// Retorna: entrada encontrada
const getEntryById = async (entryId, condominiumId) => {
  try {
    const result = await query(
      `SELECT fe.*, cc.name as cost_center_name
       FROM financial_entries fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
       WHERE fe.id = $1 AND fe.condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (result.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar entrada:', error);
    throw error;
  }
};

// Função para marcar entrada como recebida
// Recebe: entryId, userId, condominiumId, dados do recebimento (pdfPath, details, method, notes)
// Retorna: entrada atualizada
const markEntryAsReceived = async (entryId, userId, condominiumId, receiptData, ipAddress, userAgent) => {
  try {
    const { receiptPdfPath, receiptDetails, receiptMethod, receiptNotes } = receiptData || {};

    const currentResult = await query(
      `SELECT * FROM financial_entries WHERE id = $1 AND condominium_id = $2`,
      [entryId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    const current = currentResult.rows[0];

    if (current.received) {
      throw new Error('Entrada já foi marcada como recebida');
    }

    const updateResult = await query(
      `UPDATE financial_entries 
       SET received = TRUE, 
           received_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP,
           receipt_pdf_path = $1,
           receipt_details = $2,
           receipt_method = $3,
           receipt_notes = $4
       WHERE id = $5
       RETURNING *`,
      [receiptPdfPath || null, receiptDetails || null, receiptMethod || null, receiptNotes || null, entryId]
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
    const { description, amount, exitDate, costCenterId, category, billId, requiresApproval, approvalLimit, isRecurring, recurrenceType, isVariable, averageAmount } = data;

    if (!description || !amount || !exitDate) {
      throw new Error('Descrição, valor e data são obrigatórios');
    }

    const amountValue = parseFloat(amount);
    const limitValue = approvalLimit ? parseFloat(approvalLimit) : 1000.00;

    // Se requer aprovação e valor é maior que o limite, cria aprovação pendente
    const needsApproval = requiresApproval && amountValue > limitValue;
    const paymentStatus = needsApproval ? 'PENDING' : 'APPROVED';

    const result = await query(
      `INSERT INTO financial_exits (condominium_id, description, amount, exit_date, cost_center_id, category, bill_id, requires_approval, approval_limit, payment_status, created_by, is_recurring, recurrence_type, is_variable, average_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        condominiumId, 
        description.trim(), 
        amountValue, 
        exitDate, 
        costCenterId || null, 
        category || 'OUTRA', 
        billId || null, 
        requiresApproval || false, 
        limitValue, 
        paymentStatus, 
        userId,
        isRecurring === 'true' || isRecurring === true,
        recurrenceType || 'UNIQUE',
        isVariable === 'true' || isVariable === true,
        averageAmount ? parseFloat(averageAmount) : null
      ]
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

// Função para obter saída por ID
// Recebe: exitId, condominiumId
// Retorna: saída encontrada
const getExitById = async (exitId, condominiumId) => {
  try {
    const result = await query(
      `SELECT fe.*, cc.name as cost_center_name, b.name as bill_name
       FROM financial_exits fe
       LEFT JOIN cost_centers cc ON fe.cost_center_id = cc.id
       LEFT JOIN bills b ON fe.bill_id = b.id
       WHERE fe.id = $1 AND fe.condominium_id = $2`,
      [exitId, condominiumId]
    );

    if (result.rows.length === 0) {
      throw new Error('Saída não encontrada');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao buscar saída:', error);
    throw error;
  }
};

// Função para marcar saída como paga
// Recebe: exitId, userId, condominiumId, dados do pagamento (pdfPath, details, method, notes)
// Retorna: saída atualizada
const markExitAsPaid = async (exitId, userId, condominiumId, paymentData, ipAddress, userAgent) => {
  try {
    const { paymentReceiptPdfPath, paymentDetails, paymentMethod, paymentNotes } = paymentData || {};

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
       SET payment_status = 'PAID', 
           paid_at = CURRENT_TIMESTAMP, 
           updated_at = CURRENT_TIMESTAMP,
           payment_receipt_pdf_path = $1,
           payment_details = $2,
           payment_method = $3,
           payment_notes = $4
       WHERE id = $5
       RETURNING *`,
      [paymentReceiptPdfPath || null, paymentDetails || null, paymentMethod || null, paymentNotes || null, exitId]
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
// Função para obter KPIs financeiros avançados
// Recebe: condominiumId
// Retorna: KPIs com médias, tendências, comparações, etc.
const getFinancialKPIs = async (condominiumId) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Entradas do mês atual
    const currentMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_entries 
       WHERE condominium_id = $1 
       AND received = TRUE 
       AND EXTRACT(MONTH FROM received_at) = $2 
       AND EXTRACT(YEAR FROM received_at) = $3`,
      [condominiumId, currentMonth, currentYear]
    );
    const currentMonthEntries = parseFloat(currentMonthEntriesResult.rows[0].total);

    // Saídas do mês atual
    const currentMonthExitsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_exits 
       WHERE condominium_id = $1 
       AND payment_status = 'PAID' 
       AND EXTRACT(MONTH FROM paid_at) = $2 
       AND EXTRACT(YEAR FROM paid_at) = $3`,
      [condominiumId, currentMonth, currentYear]
    );
    const currentMonthExits = parseFloat(currentMonthExitsResult.rows[0].total);

    // Média de entradas dos últimos 6 meses
    const avgEntriesResult = await query(
      `SELECT COALESCE(AVG(monthly_total), 0) as avg 
       FROM (
         SELECT EXTRACT(MONTH FROM received_at) as month, 
                EXTRACT(YEAR FROM received_at) as year,
                SUM(amount) as monthly_total
         FROM financial_entries 
         WHERE condominium_id = $1 
         AND received = TRUE 
         AND received_at >= CURRENT_DATE - INTERVAL '6 months'
         GROUP BY EXTRACT(MONTH FROM received_at), EXTRACT(YEAR FROM received_at)
       ) monthly`,
      [condominiumId]
    );
    const avgEntries = parseFloat(avgEntriesResult.rows[0].avg);

    // Média de saídas dos últimos 6 meses
    const avgExitsResult = await query(
      `SELECT COALESCE(AVG(monthly_total), 0) as avg 
       FROM (
         SELECT EXTRACT(MONTH FROM paid_at) as month, 
                EXTRACT(YEAR FROM paid_at) as year,
                SUM(amount) as monthly_total
         FROM financial_exits 
         WHERE condominium_id = $1 
         AND payment_status = 'PAID' 
         AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
         GROUP BY EXTRACT(MONTH FROM paid_at), EXTRACT(YEAR FROM paid_at)
       ) monthly`,
      [condominiumId]
    );
    const avgExits = parseFloat(avgExitsResult.rows[0].avg);

    // Dados dos últimos 6 meses para gráficos
    const last6MonthsResult = await query(
      `SELECT
         TO_CHAR(month_year, 'YYYY-MM') as period,
         COALESCE(e.entries, 0) as entries,
         COALESCE(s.exits, 0) as exits
       FROM generate_series(
         DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
         DATE_TRUNC('month', CURRENT_DATE),
         '1 month'::interval
       ) AS month_year
       LEFT JOIN (
         SELECT
           DATE_TRUNC('month', received_at) as month,
           SUM(amount) as entries
         FROM financial_entries
         WHERE condominium_id = $1 AND received = TRUE
         GROUP BY DATE_TRUNC('month', received_at)
       ) e ON DATE_TRUNC('month', month_year) = e.month
       LEFT JOIN (
         SELECT
           DATE_TRUNC('month', paid_at) as month,
           SUM(amount) as exits
         FROM financial_exits
         WHERE condominium_id = $1 AND payment_status = 'PAID'
         GROUP BY DATE_TRUNC('month', paid_at)
       ) s ON DATE_TRUNC('month', month_year) = s.month
       ORDER BY month_year`,
      [condominiumId]
    );

    // Consumo mensal de contas (água, energia, etc.)
    const consumptionResult = await query(
      `SELECT 
         b.bill_type,
         b.name as bill_name,
         mc.month,
         mc.year,
         mc.consumption_value,
         mc.consumption_unit,
         mc.bill_amount
       FROM monthly_consumption mc
       INNER JOIN bills b ON mc.bill_id = b.id
       WHERE mc.condominium_id = $1
       AND mc.year >= $2 - 1
       ORDER BY mc.year DESC, mc.month DESC, b.bill_type
       LIMIT 24`,
      [condominiumId, currentYear]
    );

    // Média de consumo por tipo de conta
    const avgConsumptionResult = await query(
      `SELECT 
         b.bill_type,
         AVG(mc.bill_amount) as avg_amount,
         AVG(mc.consumption_value) as avg_consumption
       FROM monthly_consumption mc
       INNER JOIN bills b ON mc.bill_id = b.id
       WHERE mc.condominium_id = $1
       AND mc.year >= $2 - 1
       GROUP BY b.bill_type`,
      [condominiumId, currentYear]
    );

    // Comparação mês atual vs mês anterior
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const previousMonthEntriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_entries 
       WHERE condominium_id = $1 
       AND received = TRUE 
       AND EXTRACT(MONTH FROM received_at) = $2 
       AND EXTRACT(YEAR FROM received_at) = $3`,
      [condominiumId, previousMonth, previousYear]
    );
    const previousMonthEntries = parseFloat(previousMonthEntriesResult.rows[0].total);

    const previousMonthExitsResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM financial_exits 
       WHERE condominium_id = $1 
       AND payment_status = 'PAID' 
       AND EXTRACT(MONTH FROM paid_at) = $2 
       AND EXTRACT(YEAR FROM paid_at) = $3`,
      [condominiumId, previousMonth, previousYear]
    );
    const previousMonthExits = parseFloat(previousMonthExitsResult.rows[0].total);

    // Calcula variações percentuais
    const entriesVariation = previousMonthEntries > 0 
      ? ((currentMonthEntries - previousMonthEntries) / previousMonthEntries) * 100 
      : 0;
    const exitsVariation = previousMonthExits > 0 
      ? ((currentMonthExits - previousMonthExits) / previousMonthExits) * 100 
      : 0;

    return {
      currentMonth: {
        entries: currentMonthEntries,
        exits: currentMonthExits,
        balance: currentMonthEntries - currentMonthExits,
      },
      averages: {
        entries: avgEntries,
        exits: avgExits,
      },
      variations: {
        entries: parseFloat(entriesVariation.toFixed(2)),
        exits: parseFloat(exitsVariation.toFixed(2)),
      },
      last6Months: last6MonthsResult.rows.map(row => ({
        period: row.period,
        entries: parseFloat(row.entries),
        exits: parseFloat(row.exits),
        balance: parseFloat(row.entries) - parseFloat(row.exits),
      })),
      consumption: consumptionResult.rows.map(row => ({
        billType: row.bill_type,
        billName: row.bill_name,
        month: row.month,
        year: row.year,
        consumptionValue: parseFloat(row.consumption_value || 0),
        consumptionUnit: row.consumption_unit,
        billAmount: parseFloat(row.bill_amount),
      })),
      avgConsumption: avgConsumptionResult.rows.map(row => ({
        billType: row.bill_type,
        avgAmount: parseFloat(row.avg_amount || 0),
        avgConsumption: parseFloat(row.avg_consumption || 0),
      })),
    };
  } catch (error) {
    console.error('Erro ao buscar KPIs financeiros:', error);
    throw error;
  }
};

// Função para registrar consumo mensal
// Recebe: data, userId, condominiumId
// Retorna: consumo registrado
const createMonthlyConsumption = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const { billId, month, year, consumptionValue, consumptionUnit, billAmount, dueDate } = data;

    if (!billId || !month || !year || !billAmount) {
      throw new Error('Conta, mês, ano e valor são obrigatórios');
    }

    // Verifica se já existe registro para esse mês/ano/conta
    const existingResult = await query(
      `SELECT id FROM monthly_consumption 
       WHERE condominium_id = $1 AND bill_id = $2 AND month = $3 AND year = $4`,
      [condominiumId, billId, month, year]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Atualiza registro existente
      result = await query(
        `UPDATE monthly_consumption 
         SET consumption_value = $1, 
             consumption_unit = $2, 
             bill_amount = $3, 
             due_date = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [consumptionValue || null, consumptionUnit || 'UNIDADE', parseFloat(billAmount), dueDate || null, existingResult.rows[0].id]
      );
    } else {
      // Cria novo registro
      result = await query(
        `INSERT INTO monthly_consumption 
         (condominium_id, bill_id, month, year, consumption_value, consumption_unit, bill_amount, due_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [condominiumId, billId, month, year, consumptionValue || null, consumptionUnit || 'UNIDADE', parseFloat(billAmount), dueDate || null, userId]
      );
    }

    const consumption = result.rows[0];

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: existingResult.rows.length > 0 ? 'UPDATE' : 'CREATE',
      module: 'FINANCIAL',
      entityType: 'monthly_consumption',
      entityId: consumption.id,
      afterData: consumption,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return consumption;
  } catch (error) {
    console.error('Erro ao registrar consumo mensal:', error);
    throw error;
  }
};

// Função para listar consumo mensal
// Recebe: condominiumId, filtros
// Retorna: lista de consumo
const listMonthlyConsumption = async (condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT mc.*, 
             b.name as bill_name, 
             b.bill_type,
             b.provider
      FROM monthly_consumption mc
      INNER JOIN bills b ON mc.bill_id = b.id
      WHERE mc.condominium_id = $1
    `;
    const params = [condominiumId];
    let paramIndex = 2;

    if (filters.billId) {
      queryText += ` AND mc.bill_id = $${paramIndex}`;
      params.push(filters.billId);
      paramIndex++;
    }

    if (filters.year) {
      queryText += ` AND mc.year = $${paramIndex}`;
      params.push(filters.year);
      paramIndex++;
    }

    if (filters.month) {
      queryText += ` AND mc.month = $${paramIndex}`;
      params.push(filters.month);
      paramIndex++;
    }

    queryText += ` ORDER BY mc.year DESC, mc.month DESC, b.bill_type`;

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar consumo mensal:', error);
    throw error;
  }
};

// Função para obter comparação de consumo (água e energia)
// Recebe: condominiumId
// Retorna: dados de consumo para comparação
const getConsumptionComparison = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT 
         mc.month,
         mc.year,
         b.bill_type,
         mc.bill_amount
       FROM monthly_consumption mc
       INNER JOIN bills b ON mc.bill_id = b.id
       WHERE mc.condominium_id = $1
       AND b.bill_type IN ('AGUA', 'LUZ')
       AND mc.year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
       ORDER BY mc.year DESC, mc.month DESC, b.bill_type
       LIMIT 24`,
      [condominiumId]
    );

    return result.rows.map(row => ({
      month: parseInt(row.month),
      year: parseInt(row.year),
      billType: row.bill_type,
      billAmount: parseFloat(row.bill_amount),
    }));
  } catch (error) {
    console.error('Erro ao buscar comparação de consumo:', error);
    throw error;
  }
};

// Função para obter projeções financeiras
// Recebe: condominiumId, monthsAhead (padrão: 3)
// Retorna: projeções de entradas e saídas para os próximos meses
const getFinancialProjections = async (condominiumId, monthsAhead = 3) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const projections = [];

    for (let i = 1; i <= monthsAhead; i++) {
      let targetMonth = currentMonth + i;
      let targetYear = currentYear;
      
      // Ajusta mês e ano se necessário
      while (targetMonth > 12) {
        targetMonth -= 12;
        targetYear += 1;
      }

      // Calcula entradas projetadas (baseadas em recorrências)
      // Busca todas as entradas recorrentes e filtra por tipo de recorrência
      const allEntriesResult = await query(
        `SELECT 
          id,
          amount,
          average_amount,
          is_variable,
          recurrence_type,
          EXTRACT(MONTH FROM entry_date) as entry_month,
          EXTRACT(YEAR FROM entry_date) as entry_year
        FROM financial_entries
        WHERE condominium_id = $1
        AND is_recurring = TRUE`,
        [condominiumId]
      );

      let projectedEntries = 0;
      allEntriesResult.rows.forEach(entry => {
        let shouldInclude = false;
        const entryMonth = parseInt(entry.entry_month);
        const entryYear = parseInt(entry.entry_year);

        if (entry.recurrence_type === 'MONTHLY') {
          // Mensal: sempre inclui
          shouldInclude = true;
        } else if (entry.recurrence_type === 'QUARTERLY') {
          // Trimestral: se o mês de início corresponde ao mês alvo
          // E a diferença de meses é múltiplo de 3
          const monthsDiff = (targetYear - entryYear) * 12 + (targetMonth - entryMonth);
          if (entryMonth === targetMonth && monthsDiff >= 0 && monthsDiff % 3 === 0) {
            shouldInclude = true;
          }
        } else if (entry.recurrence_type === 'YEARLY') {
          // Anual: se o mês corresponde e já passou pelo menos um ano
          if (entryMonth === targetMonth && targetYear > entryYear) {
            shouldInclude = true;
          }
        }

        if (shouldInclude) {
          const amountToUse = entry.is_variable && entry.average_amount 
            ? parseFloat(entry.average_amount) 
            : parseFloat(entry.amount);
          projectedEntries += amountToUse;
        }
      });

      // Calcula saídas projetadas (baseadas em recorrências)
      const allExitsResult = await query(
        `SELECT 
          id,
          amount,
          average_amount,
          is_variable,
          recurrence_type,
          EXTRACT(MONTH FROM exit_date) as exit_month,
          EXTRACT(YEAR FROM exit_date) as exit_year
        FROM financial_exits
        WHERE condominium_id = $1
        AND is_recurring = TRUE`,
        [condominiumId]
      );

      let projectedExits = 0;
      allExitsResult.rows.forEach(exit => {
        let shouldInclude = false;
        const exitMonth = parseInt(exit.exit_month);
        const exitYear = parseInt(exit.exit_year);

        if (exit.recurrence_type === 'MONTHLY') {
          // Mensal: sempre inclui
          shouldInclude = true;
        } else if (exit.recurrence_type === 'QUARTERLY') {
          // Trimestral: se o mês de início corresponde ao mês alvo
          // E a diferença de meses é múltiplo de 3
          const monthsDiff = (targetYear - exitYear) * 12 + (targetMonth - exitMonth);
          if (exitMonth === targetMonth && monthsDiff >= 0 && monthsDiff % 3 === 0) {
            shouldInclude = true;
          }
        } else if (exit.recurrence_type === 'YEARLY') {
          // Anual: se o mês corresponde e já passou pelo menos um ano
          if (exitMonth === targetMonth && targetYear > exitYear) {
            shouldInclude = true;
          }
        }

        if (shouldInclude) {
          const amountToUse = exit.is_variable && exit.average_amount 
            ? parseFloat(exit.average_amount) 
            : parseFloat(exit.amount);
          projectedExits += amountToUse;
        }
      });

      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      projections.push({
        month: targetMonth,
        year: targetYear,
        label: `${monthNames[targetMonth - 1]}/${targetYear}`,
        projectedEntries: projectedEntries,
        projectedExits: projectedExits,
        projectedBalance: projectedEntries - projectedExits,
      });
    }

    return {
      months: projections,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao calcular projeções:', error);
    throw error;
  }
};

module.exports = {
  getDashboardStats,
  getFinancialKPIs,
  listCostCenters,
  createCostCenter,
  listEntries,
  getEntryById,
  createEntry,
  markEntryAsReceived,
  listExits,
  getExitById,
  createExit,
  markExitAsPaid,
  listBills,
  createBill,
  createMonthlyConsumption,
  listMonthlyConsumption,
  getConsumptionComparison,
  getFinancialProjections,
};

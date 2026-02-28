// Serviço de Contas a Pagar (payable_items)
// Listar, criar e pagar itens; ao pagar, gera saída em financial_exits

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateFinancialAmount, validateDate } = require('../utils/validators');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');
const { DEFAULT_DESPESA_CATEGORY } = require('../constants/financialCategories');

/**
 * Lista itens a pagar com filtros opcionais.
 * @param {number} condominiumId
 * @param {{ status?, billId?, startDate?, endDate?, limit? }} filters
 * @returns {Promise<Array>} itens com bill_name, cost_center_name
 */
const listPayableItems = async (condominiumId, filters = {}) => {
  let sql = `
    SELECT pi.*, b.name as bill_name, b.bill_type, cc.name as cost_center_name
    FROM payable_items pi
    LEFT JOIN bills b ON pi.bill_id = b.id AND b.condominium_id = $1
    LEFT JOIN cost_centers cc ON pi.cost_center_id = cc.id AND cc.condominium_id = $1
    WHERE pi.condominium_id = $1
  `;
  const params = [condominiumId];
  let n = 2;

  if (filters.status) {
    sql += ` AND pi.status = $${n++}`;
    params.push(filters.status);
  }
  if (filters.billId) {
    sql += ` AND pi.bill_id = $${n++}`;
    params.push(filters.billId);
  }
  if (filters.startDate) {
    sql += ` AND pi.due_date >= $${n++}`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    sql += ` AND pi.due_date <= $${n++}`;
    params.push(filters.endDate);
  }

  sql += ` ORDER BY pi.due_date ASC, pi.id ASC LIMIT $${n}`;
  params.push(filters.limit || 200);

  const result = await query(sql, params);
  const today = new Date().toISOString().slice(0, 10);
  const toYyyyMmDd = (val) => {
    if (!val) return '';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  };
  return result.rows.map(row => {
    const due = toYyyyMmDd(row.due_date);
    let displayStatus = row.status;
    if (row.status === 'PENDING') {
      if (due && due < today) displayStatus = 'OVERDUE';
      else if (due && due === today) displayStatus = 'DUE_TODAY';
      else displayStatus = 'UPCOMING';
    }
    return { ...row, displayStatus };
  });
};

/**
 * Busca um item por ID.
 */
const getPayableItemById = async (itemId, condominiumId) => {
  const result = await query(
    `SELECT pi.*, b.name as bill_name, b.bill_type, cc.name as cost_center_name
     FROM payable_items pi
     LEFT JOIN bills b ON pi.bill_id = b.id AND b.condominium_id = $2
     LEFT JOIN cost_centers cc ON pi.cost_center_id = cc.id AND cc.condominium_id = $2
     WHERE pi.id = $1 AND pi.condominium_id = $2`,
    [itemId, condominiumId]
  );
  if (result.rows.length === 0) throw new Error('Item não encontrado');
  return result.rows[0];
};

/**
 * Cria um item a pagar (conta variável ou avulso).
 */
const createPayableItem = async (condominiumId, userId, data, ipAddress, userAgent) => {
  const { billId, dueDate, amount, description, costCenterId, boletoPdfPath } = data;

  if (!dueDate || !amount) throw new Error('Data de vencimento e valor são obrigatórios');

  const amountVal = validateFinancialAmount(amount, {
    allowZero: false,
    allowNegative: false,
    maxValue: 10000000,
    fieldName: 'Valor',
  });
  if (!amountVal.valid) throw new Error(amountVal.error);

  const dateVal = validateDate(dueDate, {
    allowFuture: true,
    maxFutureDays: 365,
    allowPast: true,
    fieldName: 'Data de vencimento',
  });
  if (!dateVal.valid) throw new Error(dateVal.error);

  await validateUserBelongsToCondominium(userId, condominiumId);
  if (billId) {
    const bill = await query('SELECT id FROM bills WHERE id = $1 AND condominium_id = $2', [billId, condominiumId]);
    if (bill.rows.length === 0) throw new Error('Conta não encontrada');
  }

  const result = await query(
    `INSERT INTO payable_items (condominium_id, bill_id, due_date, amount, description, cost_center_id, status, created_by, boleto_pdf_path)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8)
     RETURNING *`,
    [
      condominiumId,
      billId || null,
      dueDate,
      amountVal.value,
      description && description.trim() ? description.trim() : null,
      costCenterId || null,
      userId,
      boletoPdfPath && boletoPdfPath.trim() ? boletoPdfPath.trim() : null,
    ]
  );
  const item = result.rows[0];

  await logAction({
    userId,
    condominiumId,
    action: 'CREATE',
    module: 'FINANCIAL',
    entityType: 'payable_items',
    entityId: item.id,
    beforeData: null,
    afterData: item,
    ipAddress,
    userAgent,
  });

  return item;
};

/**
 * Marca item como pago: cria saída em financial_exits e atualiza o item.
 */
const payPayableItem = async (itemId, condominiumId, userId, paymentData, ipAddress, userAgent) => {
  const { receiptPdfPath, paymentDetails, paymentMethod, paymentNotes } = paymentData || {};
  if (!receiptPdfPath || !receiptPdfPath.trim()) throw new Error('Comprovante de pagamento é obrigatório');

  const item = await getPayableItemById(itemId, condominiumId);
  if (item.status === 'PAID') throw new Error('Este item já foi pago');

  await validateUserBelongsToCondominium(userId, condominiumId);

  const financeiroService = require('./financeiroService');
  const exitDate = new Date().toISOString().slice(0, 10);
  const description = item.description || item.bill_name || `Conta a pagar #${item.id}`;

  const exit = await financeiroService.createExit(
    condominiumId,
    userId,
    {
      description,
      amount: item.amount,
      exitDate,
      costCenterId: item.cost_center_id || null,
      category: DEFAULT_DESPESA_CATEGORY,
      billId: item.bill_id || null,
      requiresApproval: false,
    },
    ipAddress,
    userAgent
  );

  await financeiroService.markExitAsPaid(
    exit.id,
    condominiumId,
    userId,
    {
      paymentReceiptPdfPath: receiptPdfPath.trim(),
      paymentDetails: paymentDetails || null,
      paymentMethod: paymentMethod || null,
      paymentNotes: paymentNotes || null,
    },
    ipAddress,
    userAgent
  );

  await query(
    `UPDATE payable_items
     SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, financial_exit_id = $1, receipt_pdf_path = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND condominium_id = $4`,
    [exit.id, receiptPdfPath.trim(), itemId, condominiumId]
  );

  const updated = await getPayableItemById(itemId, condominiumId);
  await logAction({
    userId,
    condominiumId,
    action: 'PAY',
    module: 'FINANCIAL',
    entityType: 'payable_items',
    entityId: itemId,
    beforeData: item,
    afterData: updated,
    ipAddress,
    userAgent,
  });

  return updated;
};

/**
 * Gera itens a pagar para contas fixas (próximos N meses).
 * Não duplica: só insere se não existir (bill_id + due_date).
 */
const generatePayableItemsForRecurringBills = async (condominiumId, options = {}) => {
  const monthsAhead = options.monthsAhead || 3;
  const billsResult = await query(
    `SELECT id, name, due_day, recurrence, cost_center_id FROM bills
     WHERE condominium_id = $1 AND active = TRUE AND account_kind = 'FIXA'`,
    [condominiumId]
  );
  const today = new Date();
  let created = 0;
  for (const bill of billsResult.rows) {
    const dueDay = bill.due_day || 10;
    const recurrence = bill.recurrence || 'MONTHLY';
    for (let m = 0; m < monthsAhead; m++) {
      let dueDate;
      if (recurrence === 'MONTHLY') {
        const d = new Date(today.getFullYear(), today.getMonth() + m, 1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const day = Math.min(dueDay, lastDay);
        dueDate = new Date(d.getFullYear(), d.getMonth(), day).toISOString().slice(0, 10);
      } else if (recurrence === 'YEARLY') {
        dueDate = new Date(today.getFullYear() + m, 0, Math.min(dueDay, 31)).toISOString().slice(0, 10);
      } else {
        continue;
      }
      const existing = await query(
        `SELECT id FROM payable_items WHERE condominium_id = $1 AND bill_id = $2 AND due_date = $3`,
        [condominiumId, bill.id, dueDate]
      );
      if (existing.rows.length > 0) continue;
      await query(
        `INSERT INTO payable_items (condominium_id, bill_id, due_date, amount, description, cost_center_id, status, created_by)
         VALUES ($1, $2, $3, 0, $4, $5, 'PENDING', NULL)`,
        [condominiumId, bill.id, dueDate, `Vencimento ${bill.name} - ${dueDate}`, bill.cost_center_id]
      );
      created++;
    }
  }
  return { created };
};

/**
 * Verifica itens vencidos ainda não pagos e envia notificação para FINANCEIRO.
 * Marca overdue_notified_at para não notificar múltiplas vezes.
 */
const checkAndNotifyOverduePayables = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT pi.id, pi.due_date, pi.amount, pi.description, b.name as bill_name
       FROM payable_items pi
       LEFT JOIN bills b ON pi.bill_id = b.id AND b.condominium_id = pi.condominium_id
       WHERE pi.condominium_id = $1
         AND pi.status = 'PENDING'
         AND pi.due_date < CURRENT_DATE
         AND pi.overdue_notified_at IS NULL`,
      [condominiumId]
    );

    const notificationService = require('./notificationService');
    for (const item of result.rows) {
      const desc = item.description || item.bill_name || `Conta #${item.id}`;
      const dueStr = item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : '-';
      const amountStr = parseFloat(item.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      const title = 'Conta vencida';
      const message = `${desc} - R$ ${amountStr}. Vencimento: ${dueStr}.`;

      await notificationService.createNotificationForRole(
        'FINANCEIRO',
        condominiumId,
        title,
        message,
        'PAYABLE_OVERDUE',
        'payable_items',
        item.id
      );

      await query(
        `UPDATE payable_items SET overdue_notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND condominium_id = $2`,
        [item.id, condominiumId]
      );
    }
  } catch (error) {
    console.error('Erro ao verificar/notificar contas vencidas:', error);
    // Não propaga para não quebrar a listagem/dashboard
  }
};

module.exports = {
  listPayableItems,
  getPayableItemById,
  createPayableItem,
  payPayableItem,
  generatePayableItemsForRecurringBills,
  checkAndNotifyOverduePayables,
};

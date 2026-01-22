// Service do módulo FECHAMENTO MENSAL
// Contém lógica de negócio para fechamento mensal financeiro
// Acesso: FINANCEIRO, SINDICO

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');

// Função para validar se pode fechar o mês
// Recebe: condominiumId, month, year
// Retorna: { canClose: boolean, issues: array }
const validateMonthClosure = async (condominiumId, month, year) => {
  try {
    const issues = [];

    // Verifica se já existe fechamento para este mês
    const existingClosure = await query(
      `SELECT * FROM monthly_closures 
       WHERE condominium_id = $1 AND month = $2 AND year = $3 AND status = 'CLOSED'`,
      [condominiumId, month, year]
    );

    if (existingClosure.rows.length > 0) {
      issues.push('Este mês já foi fechado anteriormente');
    }

    // Verifica entradas pendentes de análise
    const pendingEntries = await query(
      `SELECT COUNT(*) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM entry_date) = $2 
       AND EXTRACT(YEAR FROM entry_date) = $3 
       AND review_status = 'PENDING_REVIEW' 
       AND deleted_at IS NULL`,
      [condominiumId, month, year]
    );

    if (parseInt(pendingEntries.rows[0].total) > 0) {
      issues.push(`Existem ${pendingEntries.rows[0].total} entrada(s) pendente(s) de análise`);
    }

    // Verifica saídas pendentes de aprovação
    const pendingExits = await query(
      `SELECT COUNT(*) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM exit_date) = $2 
       AND EXTRACT(YEAR FROM exit_date) = $3 
       AND payment_status = 'PENDING' 
       AND requires_approval = TRUE`,
      [condominiumId, month, year]
    );

    if (parseInt(pendingExits.rows[0].total) > 0) {
      issues.push(`Existem ${pendingExits.rows[0].total} saída(s) pendente(s) de aprovação`);
    }

    // Verifica se há entradas não recebidas (mas não bloqueia, apenas avisa)
    const unreceivedEntries = await query(
      `SELECT COUNT(*) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM entry_date) = $2 
       AND EXTRACT(YEAR FROM entry_date) = $3 
       AND received = FALSE 
       AND review_status != 'REJECTED' 
       AND deleted_at IS NULL`,
      [condominiumId, month, year]
    );

    if (parseInt(unreceivedEntries.rows[0].total) > 0) {
      issues.push(`Aviso: Existem ${unreceivedEntries.rows[0].total} entrada(s) não recebida(s) (não bloqueia fechamento)`);
    }

    return {
      canClose: issues.filter(i => !i.includes('Aviso:')).length === 0,
      issues: issues
    };
  } catch (error) {
    console.error('Erro ao validar fechamento mensal:', error);
    throw error;
  }
};

// Função para calcular totais do mês
// Recebe: condominiumId, month, year
// Retorna: { totalEntries, totalExits, balance }
const calculateMonthTotals = async (condominiumId, month, year) => {
  try {
    // Total de entradas recebidas
    const entriesResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_entries 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM entry_date) = $2 
       AND EXTRACT(YEAR FROM entry_date) = $3 
       AND received = TRUE 
       AND review_status != 'REJECTED' 
       AND deleted_at IS NULL`,
      [condominiumId, month, year]
    );
    const totalEntries = parseFloat(entriesResult.rows[0].total);

    // Total de saídas pagas
    const exitsPaidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM exit_date) = $2 
       AND EXTRACT(YEAR FROM exit_date) = $3 
       AND payment_status = 'PAID'`,
      [condominiumId, month, year]
    );
    const totalExitsPaid = parseFloat(exitsPaidResult.rows[0].total);

    // Total de saídas aprovadas mas não pagas (comprometem o saldo)
    const exitsApprovedResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM financial_exits 
       WHERE condominium_id = $1 
       AND EXTRACT(MONTH FROM exit_date) = $2 
       AND EXTRACT(YEAR FROM exit_date) = $3 
       AND payment_status = 'APPROVED'`,
      [condominiumId, month, year]
    );
    const totalExitsApproved = parseFloat(exitsApprovedResult.rows[0].total);

    const totalExits = totalExitsPaid + totalExitsApproved;
    const balance = totalEntries - totalExits;

    return {
      totalEntries,
      totalExits,
      balance
    };
  } catch (error) {
    console.error('Erro ao calcular totais do mês:', error);
    throw error;
  }
};

// Função para fechar o mês
// Recebe: condominiumId, month, year, userId, notes
// Retorna: fechamento criado
const closeMonth = async (condominiumId, month, year, userId, notes, ipAddress, userAgent) => {
  try {
    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida se pode fechar
    const validation = await validateMonthClosure(condominiumId, month, year);
    if (!validation.canClose) {
      throw new Error('Não é possível fechar o mês: ' + validation.issues.join(', '));
    }

    // Calcula totais
    const totals = await calculateMonthTotals(condominiumId, month, year);

    // Verifica se já existe fechamento (mesmo que aberto)
    const existingResult = await query(
      `SELECT * FROM monthly_closures 
       WHERE condominium_id = $1 AND month = $2 AND year = $3`,
      [condominiumId, month, year]
    );

    let closure;

    if (existingResult.rows.length > 0) {
      // Atualiza fechamento existente
      const updateResult = await query(
        `UPDATE monthly_closures 
         SET status = 'CLOSED',
             closed_by = $1,
             closed_at = CURRENT_TIMESTAMP,
             notes = $2,
             total_entries = $3,
             total_exits = $4,
             balance = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [userId, notes || null, totals.totalEntries, totals.totalExits, totals.balance, existingResult.rows[0].id]
      );
      closure = updateResult.rows[0];
    } else {
      // Cria novo fechamento
      const insertResult = await query(
        `INSERT INTO monthly_closures (
          condominium_id, month, year, status, closed_by, closed_at, 
          notes, total_entries, total_exits, balance
        )
        VALUES ($1, $2, $3, 'CLOSED', $4, CURRENT_TIMESTAMP, $5, $6, $7, $8)
        RETURNING *`,
        [condominiumId, month, year, userId, notes || null, totals.totalEntries, totals.totalExits, totals.balance]
      );
      closure = insertResult.rows[0];
    }

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'monthly_closures',
      entityId: closure.id,
      afterData: closure,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return closure;
  } catch (error) {
    console.error('Erro ao fechar mês:', error);
    throw error;
  }
};

// Função para reabrir mês fechado
// Recebe: closureId, condominiumId, userId, reason
// Retorna: fechamento atualizado
// IMPORTANTE: Quando um mês é reaberto, todos os registros criados a partir daquele momento
// que tenham data dentro do mês reaberto serão automaticamente associados a esse mês
const reopenMonth = async (closureId, condominiumId, userId, reason, ipAddress, userAgent) => {
  try {
    // Valida que usuário pertence ao condomínio
    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Valida motivo obrigatório
    if (!reason || !reason.trim()) {
      throw new Error('Motivo da reabertura é obrigatório');
    }

    // Busca fechamento
    const closureResult = await query(
      `SELECT * FROM monthly_closures 
       WHERE id = $1 AND condominium_id = $2`,
      [closureId, condominiumId]
    );

    if (closureResult.rows.length === 0) {
      throw new Error('Fechamento não encontrado');
    }

    const closure = closureResult.rows[0];

    if (closure.status !== 'CLOSED') {
      throw new Error('Apenas meses fechados podem ser reabertos');
    }

    // Atualiza status para REOPENED
    const updateResult = await query(
      `UPDATE monthly_closures 
       SET status = 'REOPENED',
           reopened_by = $1,
           reopened_at = CURRENT_TIMESTAMP,
           reopening_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [userId, reason.trim(), closureId]
    );

    const updated = updateResult.rows[0];

    // IMPORTANTE: A partir deste momento, todos os registros financeiros criados
    // com data dentro do mês reaberto serão automaticamente associados a esse mês
    // Isso é feito através da validação de data nas funções createEntry e createExit
    // que verificam se o mês está fechado antes de criar

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'monthly_closures',
      entityId: closureId,
      beforeData: closure,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
      notes: `Mês reaberto. Motivo: ${reason.trim()}. A partir de agora, registros com data neste mês serão aceitos.`
    });

    return updated;
  } catch (error) {
    console.error('Erro ao reabrir mês:', error);
    throw error;
  }
};

// Função para listar fechamentos
// Recebe: condominiumId, filters
// Retorna: lista de fechamentos
const listClosures = async (condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT mc.*, 
             u1.full_name as closed_by_name,
             u2.full_name as reopened_by_name
      FROM monthly_closures mc
      LEFT JOIN users u1 ON mc.closed_by = u1.id
      LEFT JOIN users u2 ON mc.reopened_by = u2.id
      WHERE mc.condominium_id = $1
    `;
    const params = [condominiumId];

    // Filtro por ano
    if (filters.year) {
      queryText += ` AND mc.year = $${params.length + 1}`;
      params.push(filters.year);
    }

    // Filtro por status
    if (filters.status) {
      queryText += ` AND mc.status = $${params.length + 1}`;
      params.push(filters.status);
    }

    queryText += ` ORDER BY mc.year DESC, mc.month DESC LIMIT $${params.length + 1}`;
    params.push(filters.limit || 100);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar fechamentos:', error);
    throw error;
  }
};

// Função para obter fechamento por mês/ano
// Recebe: condominiumId, month, year
// Retorna: fechamento ou null
const getClosureByMonth = async (condominiumId, month, year) => {
  try {
    const result = await query(
      `SELECT mc.*, 
              u1.full_name as closed_by_name,
              u2.full_name as reopened_by_name
       FROM monthly_closures mc
       LEFT JOIN users u1 ON mc.closed_by = u1.id
       LEFT JOIN users u2 ON mc.reopened_by = u2.id
       WHERE mc.condominium_id = $1 AND mc.month = $2 AND mc.year = $3`,
      [condominiumId, month, year]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Erro ao buscar fechamento:', error);
    throw error;
  }
};

// Função para verificar se mês está fechado (bloqueia edição)
// Recebe: condominiumId, date
// Retorna: boolean
const isMonthClosed = async (condominiumId, date) => {
  try {
    const month = new Date(date).getMonth() + 1;
    const year = new Date(date).getFullYear();

    const result = await query(
      `SELECT status FROM monthly_closures 
       WHERE condominium_id = $1 AND month = $2 AND year = $3 AND status = 'CLOSED'`,
      [condominiumId, month, year]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro ao verificar se mês está fechado:', error);
    return false; // Em caso de erro, não bloqueia
  }
};

// Exporta funções
module.exports = {
  validateMonthClosure,
  calculateMonthTotals,
  closeMonth,
  reopenMonth,
  listClosures,
  getClosureByMonth,
  isMonthClosed
};

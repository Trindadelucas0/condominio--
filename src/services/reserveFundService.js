// Service do módulo FUNDO DE RESERVA
// Contém lógica de negócio para gestão do fundo de reserva
// Acesso: FINANCEIRO, SINDICO

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');

// Função para criar ou atualizar fundo de reserva
const setupReserveFund = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const { targetBalance, monthlyContributionPercent, monthlyContributionAmount, contributionMethod, updateOnlyTarget } = data;

    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Verifica se já existe
    const existingResult = await query(
      `SELECT * FROM reserve_fund WHERE condominium_id = $1`,
      [condominiumId]
    );

    let reserveFund;

    if (existingResult.rows.length > 0) {
      // Se updateOnlyTarget = true, atualiza apenas a meta
      if (updateOnlyTarget === 'true' || updateOnlyTarget === true) {
        const updateResult = await query(
          `UPDATE reserve_fund 
           SET target_balance = $1,
               last_updated = CURRENT_TIMESTAMP,
               updated_by = $2
           WHERE condominium_id = $3
           RETURNING *`,
          [
            targetBalance ? parseFloat(targetBalance) : null,
            userId,
            condominiumId
          ]
        );
        reserveFund = updateResult.rows[0];
      } else {
        // Atualiza tudo
        const updateResult = await query(
          `UPDATE reserve_fund 
           SET target_balance = $1,
               monthly_contribution_percent = $2,
               monthly_contribution_amount = $3,
               contribution_method = $4,
               last_updated = CURRENT_TIMESTAMP,
               updated_by = $5
           WHERE condominium_id = $6
           RETURNING *`,
          [
            targetBalance ? parseFloat(targetBalance) : null,
            monthlyContributionPercent ? parseFloat(monthlyContributionPercent) : null,
            monthlyContributionAmount ? parseFloat(monthlyContributionAmount) : null,
            contributionMethod || 'PERCENT',
            userId,
            condominiumId
          ]
        );
        reserveFund = updateResult.rows[0];
      }
    } else {
      // Cria
      const insertResult = await query(
        `INSERT INTO reserve_fund (
          condominium_id, target_balance, monthly_contribution_percent,
          monthly_contribution_amount, contribution_method, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          condominiumId,
          targetBalance ? parseFloat(targetBalance) : null,
          monthlyContributionPercent ? parseFloat(monthlyContributionPercent) : null,
          monthlyContributionAmount ? parseFloat(monthlyContributionAmount) : null,
          contributionMethod || 'PERCENT',
          userId
        ]
      );
      reserveFund = insertResult.rows[0];
    }

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: existingResult.rows.length > 0 ? 'UPDATE' : 'CREATE',
      module: 'FINANCIAL',
      entityType: 'reserve_fund',
      entityId: reserveFund.id,
      afterData: reserveFund,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return reserveFund;
  } catch (error) {
    console.error('Erro ao configurar fundo de reserva:', error);
    throw error;
  }
};

// Função para obter fundo de reserva
const getReserveFund = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT * FROM reserve_fund WHERE condominium_id = $1`,
      [condominiumId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const fund = result.rows[0];

    // Calcula % da meta atingida
    const targetPercent = fund.target_balance > 0 
      ? (fund.current_balance / fund.target_balance) * 100 
      : 0;

    fund.target_percent = Math.min(100, Math.max(0, targetPercent));

    return fund;
  } catch (error) {
    console.error('Erro ao buscar fundo de reserva:', error);
    throw error;
  }
};

// Função para adicionar contribuição
const addContribution = async (condominiumId, userId, amount, ipAddress, userAgent) => {
  try {
    const fundResult = await query(
      `SELECT * FROM reserve_fund WHERE condominium_id = $1`,
      [condominiumId]
    );

    if (fundResult.rows.length === 0) {
      throw new Error('Fundo de reserva não configurado');
    }

    const fund = fundResult.rows[0];
    const newBalance = parseFloat(fund.current_balance) + parseFloat(amount);

    const updateResult = await query(
      `UPDATE reserve_fund 
       SET current_balance = $1,
           last_contribution_date = CURRENT_DATE,
           last_updated = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newBalance, fund.id]
    );

    const updated = updateResult.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'reserve_fund',
      entityId: fund.id,
      beforeData: fund,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao adicionar contribuição:', error);
    throw error;
  }
};

// Função para debitar do fundo de reserva (ex.: despesa paga com categoria DESPESAS_FUNDO_RESERVA)
const subtractFromReserveFund = async (condominiumId, userId, amount, ipAddress, userAgent) => {
  try {
    const fundResult = await query(
      `SELECT * FROM reserve_fund WHERE condominium_id = $1`,
      [condominiumId]
    );

    if (fundResult.rows.length === 0) {
      throw new Error('Fundo de reserva não configurado');
    }

    const fund = fundResult.rows[0];
    const currentBalance = parseFloat(fund.current_balance);
    const subtractAmount = parseFloat(amount);
    const newBalance = Math.max(0, currentBalance - subtractAmount);

    const updateResult = await query(
      `UPDATE reserve_fund 
       SET current_balance = $1,
           last_updated = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newBalance, fund.id]
    );

    const updated = updateResult.rows[0];

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'FINANCIAL',
      entityType: 'reserve_fund',
      entityId: fund.id,
      beforeData: fund,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao debitar do fundo de reserva:', error);
    throw error;
  }
};

// Função para calcular contribuição mensal automática
const calculateMonthlyContribution = async (condominiumId, monthlyExpenses) => {
  try {
    const fundResult = await query(
      `SELECT * FROM reserve_fund WHERE condominium_id = $1`,
      [condominiumId]
    );

    if (fundResult.rows.length === 0) {
      return 0;
    }

    const fund = fundResult.rows[0];

    if (fund.contribution_method === 'PERCENT' && fund.monthly_contribution_percent) {
      return monthlyExpenses * (fund.monthly_contribution_percent / 100);
    } else if (fund.contribution_method === 'FIXED' && fund.monthly_contribution_amount) {
      return fund.monthly_contribution_amount;
    }

    return 0;
  } catch (error) {
    console.error('Erro ao calcular contribuição mensal:', error);
    return 0;
  }
};

// Função para ratear despesa
const allocateExpense = async (exitId, condominiumId, userId, allocations, ipAddress, userAgent) => {
  try {
    // Remove alocações anteriores desta despesa
    await query(
      `DELETE FROM expense_allocation WHERE financial_exit_id = $1`,
      [exitId]
    );

    // Adiciona novas alocações
    for (const allocation of allocations) {
      await query(
        `INSERT INTO expense_allocation (
          financial_exit_id, apartment_id, amount, allocated_by
        )
        VALUES ($1, $2, $3, $4)`,
        [exitId, allocation.apartmentId, parseFloat(allocation.amount), userId]
      );
    }

    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'FINANCIAL',
      entityType: 'expense_allocation',
      entityId: exitId,
      afterData: { allocations },
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return true;
  } catch (error) {
    console.error('Erro ao ratear despesa:', error);
    throw error;
  }
};

// Função para obter rateios de uma despesa
const getExpenseAllocations = async (exitId) => {
  try {
    const result = await query(
      `SELECT ea.*, a.number as apartment_number, a.block
       FROM expense_allocation ea
       JOIN apartments a ON ea.apartment_id = a.id
       WHERE ea.financial_exit_id = $1`,
      [exitId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar rateios:', error);
    throw error;
  }
};

module.exports = {
  setupReserveFund,
  getReserveFund,
  addContribution,
  subtractFromReserveFund,
  calculateMonthlyContribution,
  allocateExpense,
  getExpenseAllocations
};

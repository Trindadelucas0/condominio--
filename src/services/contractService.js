// Service do módulo CONTRATOS
// Contém lógica de negócio para gestão de contratos
// Acesso: ADMINISTRATIVO, FINANCEIRO, SINDICO

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');
const { validateUserBelongsToCondominium } = require('../utils/queryHelper');

// Função para criar contrato
const createContract = async (condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const {
      contractNumber, title, description, supplierName, supplierDocument, supplierContact,
      contractType, startDate, endDate, monthlyValue, totalValue, paymentDay,
      documentPath, documentFileName, autoRenew, alert30Days, alert60Days, alert90Days, notes
    } = data;

    if (!title || !title.trim()) {
      throw new Error('Título do contrato é obrigatório');
    }

    if (!supplierName || !supplierName.trim()) {
      throw new Error('Nome do fornecedor é obrigatório');
    }

    if (!startDate) {
      throw new Error('Data de início é obrigatória');
    }

    const userBelongs = await validateUserBelongsToCondominium(userId, condominiumId);
    if (!userBelongs) {
      throw new Error('Usuário não pertence a este condomínio');
    }

    // Calcula data de renovação (30 dias antes do vencimento se tiver endDate)
    let renewalDate = null;
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() - 30);
      renewalDate = end.toISOString().split('T')[0];
    }

    const result = await query(
      `INSERT INTO contracts (
        condominium_id, contract_number, title, description, supplier_name, supplier_document,
        supplier_contact, contract_type, start_date, end_date, renewal_date,
        monthly_value, total_value, payment_day, document_path, document_file_name,
        auto_renew, alert_30_days, alert_60_days, alert_90_days, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        condominiumId, contractNumber || null, title.trim(), description || null,
        supplierName.trim(), supplierDocument || null, supplierContact || null,
        contractType || 'SERVICE', startDate, endDate || null, renewalDate,
        monthlyValue ? parseFloat(monthlyValue) : null,
        totalValue ? parseFloat(totalValue) : null,
        paymentDay ? parseInt(paymentDay) : null,
        documentPath || null, documentFileName || null,
        autoRenew === true || autoRenew === 'true', alert30Days !== false, alert60Days !== false, alert90Days !== false,
        notes || null, userId
      ]
    );

    const contract = result.rows[0];

    // Cria histórico inicial
    await query(
      `INSERT INTO contract_history (contract_id, version_number, action, new_data, changed_by)
       VALUES ($1, 1, 'CREATED', $2, $3)`,
      [contract.id, JSON.stringify(contract), userId]
    );

    await logAction({
      userId, condominiumId, action: 'CREATE', module: 'CONTRACTS',
      entityType: 'contracts', entityId: contract.id,
      afterData: contract, ipAddress, userAgent,
    });

    return contract;
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    throw error;
  }
};

// Função para listar contratos
const listContracts = async (condominiumId, filters = {}) => {
  try {
    let queryText = `SELECT * FROM contracts WHERE condominium_id = $1`;
    const params = [condominiumId];

    if (filters.status) {
      queryText += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    if (filters.contractType) {
      queryText += ` AND contract_type = $${params.length + 1}`;
      params.push(filters.contractType);
    }

    if (filters.expiringSoon) {
      const days = parseInt(filters.expiringSoon) || 30;
      const date = new Date();
      date.setDate(date.getDate() + days);
      queryText += ` AND end_date <= $${params.length + 1} AND end_date >= CURRENT_DATE`;
      params.push(date.toISOString().split('T')[0]);
    }

    queryText += ` ORDER BY end_date NULLS LAST, start_date DESC LIMIT $${params.length + 1}`;
    params.push(filters.limit || 100);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar contratos:', error);
    throw error;
  }
};

// Função para obter contrato por ID
const getContractById = async (contractId, condominiumId) => {
  try {
    const result = await query(
      `SELECT * FROM contracts WHERE id = $1 AND condominium_id = $2`,
      [contractId, condominiumId]
    );

    if (result.rows.length === 0) {
      throw new Error('Contrato não encontrado');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao obter contrato:', error);
    throw error;
  }
};

// Função para atualizar contrato
const updateContract = async (contractId, condominiumId, userId, data, ipAddress, userAgent) => {
  try {
    const current = await getContractById(contractId, condominiumId);

    // Calcula nova data de renovação se endDate mudou
    let renewalDate = current.renewal_date;
    if (data.endDate && data.endDate !== current.end_date) {
      const end = new Date(data.endDate);
      end.setDate(end.getDate() - 30);
      renewalDate = end.toISOString().split('T')[0];
    } else if (data.endDate === null && current.end_date) {
      renewalDate = null;
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      values.push(data.title);
      paramIndex++;
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }
    if (data.supplierName !== undefined) {
      updateFields.push(`supplier_name = $${paramIndex}`);
      values.push(data.supplierName);
      paramIndex++;
    }
    if (data.supplierDocument !== undefined) {
      updateFields.push(`supplier_document = $${paramIndex}`);
      values.push(data.supplierDocument);
      paramIndex++;
    }
    if (data.supplierContact !== undefined) {
      updateFields.push(`supplier_contact = $${paramIndex}`);
      values.push(data.supplierContact);
      paramIndex++;
    }
    if (data.contractType !== undefined) {
      updateFields.push(`contract_type = $${paramIndex}`);
      values.push(data.contractType);
      paramIndex++;
    }
    if (data.startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex}`);
      values.push(data.startDate);
      paramIndex++;
    }
    if (data.endDate !== undefined) {
      updateFields.push(`end_date = $${paramIndex}`);
      values.push(data.endDate);
      paramIndex++;
    }
    if (renewalDate !== current.renewal_date) {
      updateFields.push(`renewal_date = $${paramIndex}`);
      values.push(renewalDate);
      paramIndex++;
    }
    if (data.monthlyValue !== undefined) {
      updateFields.push(`monthly_value = $${paramIndex}`);
      values.push(data.monthlyValue ? parseFloat(data.monthlyValue) : null);
      paramIndex++;
    }
    if (data.totalValue !== undefined) {
      updateFields.push(`total_value = $${paramIndex}`);
      values.push(data.totalValue ? parseFloat(data.totalValue) : null);
      paramIndex++;
    }
    if (data.paymentDay !== undefined) {
      updateFields.push(`payment_day = $${paramIndex}`);
      values.push(data.paymentDay ? parseInt(data.paymentDay) : null);
      paramIndex++;
    }
    if (data.autoRenew !== undefined) {
      updateFields.push(`auto_renew = $${paramIndex}`);
      values.push(data.autoRenew === true || data.autoRenew === 'true');
      paramIndex++;
    }
    if (data.alert30Days !== undefined) {
      updateFields.push(`alert_30_days = $${paramIndex}`);
      values.push(data.alert30Days);
      paramIndex++;
    }
    if (data.alert60Days !== undefined) {
      updateFields.push(`alert_60_days = $${paramIndex}`);
      values.push(data.alert60Days);
      paramIndex++;
    }
    if (data.alert90Days !== undefined) {
      updateFields.push(`alert_90_days = $${paramIndex}`);
      values.push(data.alert90Days);
      paramIndex++;
    }
    if (data.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      values.push(data.notes);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(contractId, condominiumId);

    const result = await query(
      `UPDATE contracts SET ${updateFields.join(', ')} 
       WHERE id = $${paramIndex} AND condominium_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Contrato não encontrado');
    }

    const updated = result.rows[0];

    // Obtém versão atual do histórico
    const historyResult = await query(
      `SELECT MAX(version_number) as max_version FROM contract_history WHERE contract_id = $1`,
      [contractId]
    );
    const nextVersion = (historyResult.rows[0].max_version || 0) + 1;

    // Cria histórico
    await query(
      `INSERT INTO contract_history (contract_id, version_number, action, old_data, new_data, changed_by)
       VALUES ($1, $2, 'UPDATED', $3, $4, $5)`,
      [contractId, nextVersion, JSON.stringify(current), JSON.stringify(updated), userId]
    );

    await logAction({
      userId, condominiumId, action: 'UPDATE', module: 'CONTRACTS',
      entityType: 'contracts', entityId: contractId,
      beforeData: current, afterData: updated, ipAddress, userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    throw error;
  }
};

// Função para obter contratos próximos do vencimento
const getExpiringContracts = async (condominiumId, days = 90) => {
  try {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const result = await query(
      `SELECT * FROM contracts 
       WHERE condominium_id = $1 
       AND status = 'ACTIVE'
       AND end_date IS NOT NULL
       AND end_date <= $2
       AND end_date >= CURRENT_DATE
       ORDER BY end_date ASC`,
      [condominiumId, date.toISOString().split('T')[0]]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao obter contratos vencendo:', error);
    throw error;
  }
};

// Função para obter histórico do contrato
const getContractHistory = async (contractId, condominiumId) => {
  try {
    // Verifica se o contrato pertence ao condomínio
    const contractResult = await query(
      `SELECT id FROM contracts WHERE id = $1 AND condominium_id = $2`,
      [contractId, condominiumId]
    );

    if (contractResult.rows.length === 0) {
      throw new Error('Contrato não encontrado');
    }

    const result = await query(
      `SELECT ch.*, u.full_name as changed_by_name
       FROM contract_history ch
       LEFT JOIN users u ON ch.changed_by = u.id
       WHERE ch.contract_id = $1
       ORDER BY ch.version_number DESC`,
      [contractId]
    );

    return result.rows;
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    throw error;
  }
};

module.exports = {
  createContract,
  listContracts,
  getContractById,
  updateContract,
  getExpiringContracts,
  getContractHistory
};

// Serviço de configurações do condomínio
// Centraliza todas as configurações que afetam o funcionamento do sistema
// REGRA: Síndico e Super Master podem alterar configurações

const { query } = require('../config/database');
const { logAction } = require('../utils/logger');

// Função para obter uma configuração específica
// Recebe: condominiumId, settingKey
// Retorna: valor da configuração ou null se não existir
const getSetting = async (condominiumId, settingKey) => {
  try {
    const result = await query(
      `SELECT * FROM condominium_settings 
       WHERE condominium_id = $1 AND setting_key = $2`,
      [condominiumId, settingKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const setting = result.rows[0];
    
    // Converte valor conforme o tipo
    if (setting.setting_type === 'NUMBER') {
      return parseFloat(setting.setting_value);
    } else if (setting.setting_type === 'BOOLEAN') {
      return setting.setting_value === 'true';
    } else if (setting.setting_type === 'JSON') {
      return JSON.parse(setting.setting_value);
    }
    
    return setting.setting_value;
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    throw error;
  }
};

// Função para definir/atualizar uma configuração
// Recebe: condominiumId, settingKey, settingValue, settingType, description, category, userId
// Retorna: configuração criada/atualizada
const setSetting = async (condominiumId, settingKey, settingValue, settingType, description, category, userId, ipAddress, userAgent) => {
  try {
    // Converte valor para string conforme o tipo
    let valueString = settingValue;
    if (settingType === 'JSON') {
      valueString = JSON.stringify(settingValue);
    } else if (settingType === 'BOOLEAN') {
      valueString = settingValue ? 'true' : 'false';
    } else if (settingType === 'NUMBER') {
      valueString = String(settingValue);
    }

    // Verifica se já existe
    const existing = await query(
      `SELECT * FROM condominium_settings 
       WHERE condominium_id = $1 AND setting_key = $2`,
      [condominiumId, settingKey]
    );

    let setting;
    if (existing.rows.length > 0) {
      // Atualiza existente
      const result = await query(
        `UPDATE condominium_settings 
         SET setting_value = $1, setting_type = $2, description = $3, category = $4,
             updated_at = CURRENT_TIMESTAMP, updated_by = $5
         WHERE condominium_id = $6 AND setting_key = $7
         RETURNING *`,
        [valueString, settingType, description, category, userId, condominiumId, settingKey]
      );
      setting = result.rows[0];

      // Log de auditoria
      await logAction({
        userId: userId,
        condominiumId: condominiumId,
        action: 'UPDATE',
        module: 'CONFIG',
        entityType: 'condominium_settings',
        entityId: setting.id,
        beforeData: existing.rows[0],
        afterData: setting,
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    } else {
      // Cria nova
      const result = await query(
        `INSERT INTO condominium_settings 
         (condominium_id, setting_key, setting_value, setting_type, description, category, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [condominiumId, settingKey, valueString, settingType, description, category, userId]
      );
      setting = result.rows[0];

      // Log de auditoria
      await logAction({
        userId: userId,
        condominiumId: condominiumId,
        action: 'CREATE',
        module: 'CONFIG',
        entityType: 'condominium_settings',
        entityId: setting.id,
        beforeData: null,
        afterData: setting,
        ipAddress: ipAddress,
        userAgent: userAgent,
      });
    }

    return setting;
  } catch (error) {
    console.error('Erro ao definir configuração:', error);
    throw error;
  }
};

// Função para listar todas as configurações de um condomínio
// Recebe: condominiumId, filtros opcionais (category)
// Retorna: lista de configurações
const listSettings = async (condominiumId, filters = {}) => {
  try {
    let queryText = `
      SELECT * FROM condominium_settings
      WHERE condominium_id = $1
    `;
    const params = [condominiumId];

    if (filters.category) {
      queryText += ` AND category = $${params.length + 1}`;
      params.push(filters.category);
    }

    queryText += ` ORDER BY category, setting_key`;

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao listar configurações:', error);
    throw error;
  }
};

// Função para obter limite financeiro padrão (configuração comum)
// Recebe: condominiumId
// Retorna: limite ou valor padrão (1000.00)
const getFinancialApprovalLimit = async (condominiumId) => {
  try {
    const limit = await getSetting(condominiumId, 'financial_approval_limit');
    return limit !== null ? limit : 1000.00; // Valor padrão
  } catch (error) {
    console.error('Erro ao obter limite financeiro:', error);
    return 1000.00; // Retorna padrão em caso de erro
  }
};

// Função para obter SLA padrão por tipo
// Recebe: condominiumId, entityType, taskType (opcional), priority (opcional)
// Retorna: horas de SLA ou valor padrão
const getSLAHours = async (condominiumId, entityType, taskType = null, priority = null) => {
  try {
    // Primeiro tenta buscar da tabela slas
    let queryText = `
      SELECT sla_hours FROM slas
      WHERE condominium_id = $1 AND entity_type = $2
    `;
    const params = [condominiumId, entityType];

    if (taskType) {
      queryText += ` AND task_type = $${params.length + 1}`;
      params.push(taskType);
    } else {
      queryText += ` AND task_type IS NULL`;
    }

    if (priority) {
      queryText += ` AND priority = $${params.length + 1}`;
      params.push(priority);
    } else {
      queryText += ` AND priority IS NULL`;
    }

    queryText += ` ORDER BY priority DESC, task_type DESC LIMIT 1`;

    const result = await query(queryText, params);
    
    if (result.rows.length > 0) {
      return result.rows[0].sla_hours;
    }

    // Se não encontrou, busca configuração padrão
    const defaultSLA = await getSetting(condominiumId, `sla_${entityType.toLowerCase()}_default`);
    return defaultSLA !== null ? defaultSLA : 24; // Padrão: 24 horas
  } catch (error) {
    console.error('Erro ao obter SLA:', error);
    return 24; // Retorna padrão em caso de erro
  }
};

module.exports = {
  getSetting,
  setSetting,
  listSettings,
  getFinancialApprovalLimit,
  getSLAHours,
};

// Service do módulo PATRIMÔNIO
// Contém lógica de negócio para gestão de patrimônio
// Acesso: ADMINISTRATIVO

const { query } = require('../config/database'); // Conexão com banco
const { logAction } = require('../utils/logger'); // Para logs de auditoria

// Função para calcular valor atual do ativo (depreciação)
// Recebe: asset (objeto do ativo)
// Retorna: valor atual calculado
const calculateCurrentValue = (asset) => {
  if (!asset.acquisition_date || !asset.acquisition_cost) {
    return asset.acquisition_cost || 0;
  }

  const acquisitionDate = new Date(asset.acquisition_date);
  const now = new Date();
  const yearsInUse = (now - acquisitionDate) / (1000 * 60 * 60 * 24 * 365.25); // Anos de uso

  if (yearsInUse <= 0) {
    return asset.acquisition_cost;
  }

  const depreciationRate = asset.depreciation_rate || 10.00;
  const usefulLife = asset.useful_life_years || 10;
  const depreciationPercent = Math.min((yearsInUse / usefulLife) * 100, 100); // Máximo 100%
  
  const depreciationAmount = asset.acquisition_cost * (depreciationPercent / 100);
  const currentValue = asset.acquisition_cost - depreciationAmount;

  return Math.max(currentValue, 0); // Não pode ser negativo
};

// Função para obter estatísticas patrimoniais
// Recebe: condominiumId
// Retorna: estatísticas (total ativos, valor total, etc)
const getDashboardStats = async (condominiumId) => {
  try {
    // Total de ativos
    const assetsResult = await query(
      `SELECT COUNT(*) as total FROM assets 
       WHERE condominium_id = $1 AND archived_at IS NULL`,
      [condominiumId]
    );
    const totalAssets = parseInt(assetsResult.rows[0].total);

    // Valor total de aquisição
    const acquisitionResult = await query(
      `SELECT COALESCE(SUM(acquisition_cost), 0) as total FROM assets 
       WHERE condominium_id = $1 AND archived_at IS NULL`,
      [condominiumId]
    );
    const totalAcquisitionValue = parseFloat(acquisitionResult.rows[0].total);

    // Valor total atual (calculado)
    const assets = await query(
      `SELECT * FROM assets 
       WHERE condominium_id = $1 AND archived_at IS NULL`,
      [condominiumId]
    );
    let totalCurrentValue = 0;
    assets.rows.forEach(asset => {
      const currentValue = calculateCurrentValue(asset);
      totalCurrentValue += currentValue;
    });

    // Ativos em manutenção
    const maintenanceResult = await query(
      `SELECT COUNT(*) as total FROM assets 
       WHERE condominium_id = $1 AND status = 'MAINTENANCE' AND archived_at IS NULL`,
      [condominiumId]
    );
    const assetsInMaintenance = parseInt(maintenanceResult.rows[0].total);

    return {
      totalAssets,
      totalAcquisitionValue,
      totalCurrentValue,
      assetsInMaintenance,
      totalDepreciation: totalAcquisitionValue - totalCurrentValue,
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas patrimoniais:', error);
    throw error;
  }
};

// Função para listar ativos
// Recebe: condominiumId, filtros
// Retorna: lista de ativos com valores atualizados
const listAssets = async (condominiumId, filters = {}) => {
  try {
    let sql = `
      SELECT a.*, u.full_name as created_by_name
      FROM assets a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.condominium_id = $1 AND a.archived_at IS NULL
    `;
    const params = [condominiumId];
    let paramCount = 2;

    if (filters.assetType) {
      sql += ` AND a.asset_type = $${paramCount++}`;
      params.push(filters.assetType);
    }

    if (filters.status) {
      sql += ` AND a.status = $${paramCount++}`;
      params.push(filters.status);
    }

    sql += ` ORDER BY a.name LIMIT 100`;

    const result = await query(sql, params);
    
    // Calcula valor atual para cada ativo
    const assets = result.rows.map(asset => ({
      ...asset,
      current_value: calculateCurrentValue(asset),
    }));

    return assets;
  } catch (error) {
    console.error('Erro ao listar ativos:', error);
    throw error;
  }
};

// Função para obter ativo por ID
// Recebe: assetId, condominiumId
// Retorna: ativo com valor atualizado e histórico
const getAssetById = async (assetId, condominiumId) => {
  try {
    const assetResult = await query(
      `SELECT a.*, u.full_name as created_by_name
       FROM assets a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = $1 AND a.condominium_id = $2 AND a.archived_at IS NULL`,
      [assetId, condominiumId]
    );

    if (assetResult.rows.length === 0) {
      throw new Error('Ativo não encontrado');
    }

    const asset = assetResult.rows[0];
    asset.current_value = calculateCurrentValue(asset);

    // Busca manutenções vinculadas
    const maintenancesResult = await query(
      `SELECT am.*, u.full_name as created_by_name
       FROM asset_maintenances am
       LEFT JOIN users u ON am.created_by = u.id
       WHERE am.asset_id = $1
       ORDER BY am.maintenance_date DESC`,
      [assetId]
    );
    asset.maintenances = maintenancesResult.rows;

    // Busca histórico de depreciação
    const depreciationResult = await query(
      `SELECT * FROM asset_depreciation
       WHERE asset_id = $1
       ORDER BY calculation_date DESC
       LIMIT 12`,
      [assetId]
    );
    asset.depreciation_history = depreciationResult.rows;

    return asset;
  } catch (error) {
    console.error('Erro ao buscar ativo:', error);
    throw error;
  }
};

// Função para criar ativo
// Recebe: data, userId, condominiumId
// Retorna: ativo criado
const createAsset = async (data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const {
      name,
      description,
      assetType,
      manufacturer,
      model,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      depreciationRate,
      usefulLifeYears,
      location,
    } = data;

    if (!name || !assetType) {
      throw new Error('Nome e tipo do ativo são obrigatórios');
    }

    const result = await query(
      `INSERT INTO assets (
        condominium_id, name, description, asset_type, manufacturer, model, 
        serial_number, acquisition_date, acquisition_cost, depreciation_rate, 
        useful_life_years, location, status, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE', $13)
       RETURNING *`,
      [
        condominiumId,
        name.trim(),
        description || null,
        assetType,
        manufacturer || null,
        model || null,
        serialNumber || null,
        acquisitionDate || null,
        acquisitionCost ? parseFloat(acquisitionCost) : null,
        depreciationRate ? parseFloat(depreciationRate) : 10.00,
        usefulLifeYears ? parseInt(usefulLifeYears) : 10,
        location || null,
        userId,
      ]
    );

    const asset = result.rows[0];
    asset.current_value = calculateCurrentValue(asset);

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'PATRIMONY',
      entityType: 'assets',
      entityId: asset.id,
      afterData: asset,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    // Cria registro inicial de depreciação
    if (asset.acquisition_date && asset.acquisition_cost) {
      const currentValue = calculateCurrentValue(asset);
      const acquisitionDate = new Date(asset.acquisition_date);
      const now = new Date();
      const yearsInUse = (now - acquisitionDate) / (1000 * 60 * 60 * 24 * 365.25);

      await query(
        `INSERT INTO asset_depreciation (
          asset_id, calculation_date, acquisition_value, depreciation_amount, 
          current_value, years_in_use
        )
         VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)`,
        [
          asset.id,
          asset.acquisition_cost,
          asset.acquisition_cost - currentValue,
          currentValue,
          yearsInUse > 0 ? yearsInUse : 0,
        ]
      );
    }

    return asset;
  } catch (error) {
    console.error('Erro ao criar ativo:', error);
    throw error;
  }
};

// Função para atualizar ativo
// Recebe: assetId, data, userId, condominiumId
// Retorna: ativo atualizado
const updateAsset = async (assetId, data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    const currentResult = await query(
      `SELECT * FROM assets WHERE id = $1 AND condominium_id = $2 AND archived_at IS NULL`,
      [assetId, condominiumId]
    );

    if (currentResult.rows.length === 0) {
      throw new Error('Ativo não encontrado');
    }

    const current = currentResult.rows[0];

    const {
      name,
      description,
      assetType,
      manufacturer,
      model,
      serialNumber,
      acquisitionDate,
      acquisitionCost,
      depreciationRate,
      usefulLifeYears,
      location,
      status,
    } = data;

    const result = await query(
      `UPDATE assets SET
        name = $3,
        description = $4,
        asset_type = $5,
        manufacturer = $6,
        model = $7,
        serial_number = $8,
        acquisition_date = $9,
        acquisition_cost = $10,
        depreciation_rate = $11,
        useful_life_years = $12,
        location = $13,
        status = $14,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND condominium_id = $2
       RETURNING *`,
      [
        assetId,
        condominiumId,
        name.trim(),
        description || null,
        assetType,
        manufacturer || null,
        model || null,
        serialNumber || null,
        acquisitionDate || null,
        acquisitionCost ? parseFloat(acquisitionCost) : null,
        depreciationRate ? parseFloat(depreciationRate) : 10.00,
        usefulLifeYears ? parseInt(usefulLifeYears) : 10,
        location || null,
        status || current.status,
      ]
    );

    const updated = result.rows[0];
    updated.current_value = calculateCurrentValue(updated);

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'UPDATE',
      module: 'PATRIMONY',
      entityType: 'assets',
      entityId: assetId,
      beforeData: current,
      afterData: updated,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar ativo:', error);
    throw error;
  }
};

// Função para vincular manutenção a ativo
// Recebe: assetId, data, userId, condominiumId
// Retorna: manutenção criada
const createMaintenance = async (assetId, data, userId, condominiumId, ipAddress, userAgent) => {
  try {
    // Verifica se ativo existe
    const assetResult = await query(
      `SELECT id FROM assets WHERE id = $1 AND condominium_id = $2 AND archived_at IS NULL`,
      [assetId, condominiumId]
    );

    if (assetResult.rows.length === 0) {
      throw new Error('Ativo não encontrado');
    }

    const {
      maintenanceType,
      description,
      cost,
      maintenanceDate,
      nextMaintenanceDate,
      performedBy,
      notes,
    } = data;

    if (!maintenanceType || !description || !maintenanceDate) {
      throw new Error('Tipo, descrição e data são obrigatórios');
    }

    const result = await query(
      `INSERT INTO asset_maintenances (
        asset_id, maintenance_type, description, cost, maintenance_date,
        next_maintenance_date, performed_by, notes, created_by
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        assetId,
        maintenanceType,
        description.trim(),
        cost ? parseFloat(cost) : null,
        maintenanceDate,
        nextMaintenanceDate || null,
        performedBy || null,
        notes || null,
        userId,
      ]
    );

    const maintenance = result.rows[0];

    // Atualiza status do ativo para MAINTENANCE se necessário
    await query(
      `UPDATE assets SET status = 'MAINTENANCE', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'ACTIVE'`,
      [assetId]
    );

    // Registra no log
    await logAction({
      userId: userId,
      condominiumId: condominiumId,
      action: 'CREATE',
      module: 'PATRIMONY',
      entityType: 'asset_maintenances',
      entityId: maintenance.id,
      afterData: maintenance,
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    return maintenance;
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    throw error;
  }
};

// Função para calcular e registrar depreciação
// Recebe: assetId, condominiumId
// Retorna: registro de depreciação criado
const calculateDepreciation = async (assetId, condominiumId) => {
  try {
    const assetResult = await query(
      `SELECT * FROM assets WHERE id = $1 AND condominium_id = $2 AND archived_at IS NULL`,
      [assetId, condominiumId]
    );

    if (assetResult.rows.length === 0) {
      throw new Error('Ativo não encontrado');
    }

    const asset = assetResult.rows[0];

    if (!asset.acquisition_date || !asset.acquisition_cost) {
      throw new Error('Ativo precisa ter data e valor de aquisição para calcular depreciação');
    }

    const currentValue = calculateCurrentValue(asset);
    const acquisitionDate = new Date(asset.acquisition_date);
    const now = new Date();
    const yearsInUse = (now - acquisitionDate) / (1000 * 60 * 60 * 24 * 365.25);
    const depreciationAmount = asset.acquisition_cost - currentValue;

    const result = await query(
      `INSERT INTO asset_depreciation (
        asset_id, calculation_date, acquisition_value, depreciation_amount,
        current_value, years_in_use
      )
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
       RETURNING *`,
      [assetId, asset.acquisition_cost, depreciationAmount, currentValue, yearsInUse > 0 ? yearsInUse : 0]
    );

    // Atualiza valor atual no ativo
    await query(
      `UPDATE assets SET current_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [currentValue, assetId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Erro ao calcular depreciação:', error);
    throw error;
  }
};

// Exporta funções
module.exports = {
  getDashboardStats,
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  createMaintenance,
  calculateDepreciation,
  calculateCurrentValue,
};

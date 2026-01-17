// Service para Analytics Avançados dos Dashboards
// Fornece dados para gráficos, previsões e comparações históricas

const { query } = require('../config/database');

// Função para obter dados históricos dos últimos N meses
// Recebe: condominiumId, months (padrão: 12)
// Retorna: Array com dados mensais (entradas, saídas, saldo)
const getHistoricalData = async (condominiumId, months = 12) => {
  try {
    const result = await query(`
      WITH months AS (
        SELECT 
          generate_series(
            date_trunc('month', CURRENT_DATE - INTERVAL '${months - 1} months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          )::date AS month
      )
      SELECT 
        TO_CHAR(m.month, 'YYYY-MM') AS period,
        TO_CHAR(m.month, 'Mon/YYYY') AS label,
        EXTRACT(MONTH FROM m.month)::integer AS month_num,
        EXTRACT(YEAR FROM m.month)::integer AS year,
        COALESCE(SUM(CASE WHEN fe.received = TRUE THEN fe.amount ELSE 0 END), 0) AS entries,
        COALESCE(SUM(CASE WHEN fx.payment_status = 'PAID' THEN fx.amount ELSE 0 END), 0) AS exits,
        COALESCE(SUM(CASE WHEN fe.received = TRUE THEN fe.amount ELSE 0 END), 0) - 
        COALESCE(SUM(CASE WHEN fx.payment_status = 'PAID' THEN fx.amount ELSE 0 END), 0) AS balance
      FROM months m
      LEFT JOIN financial_entries fe ON 
        date_trunc('month', fe.entry_date) = m.month 
        AND fe.condominium_id = $1
      LEFT JOIN financial_exits fx ON 
        date_trunc('month', fx.exit_date) = m.month 
        AND fx.condominium_id = $1
      GROUP BY m.month
      ORDER BY m.month ASC
    `, [condominiumId]);

    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar dados históricos:', error);
    throw error;
  }
};

// Função para calcular previsões baseadas em média móvel
// Recebe: condominiumId, monthsToProject (padrão: 3)
// Retorna: Previsões para os próximos meses
const getProjections = async (condominiumId, monthsToProject = 3) => {
  try {
    // Busca média dos últimos 6 meses
    const historical = await getHistoricalData(condominiumId, 6);
    
    if (historical.length === 0) {
      return [];
    }

    // Calcula médias
    const avgEntries = historical.reduce((sum, h) => sum + parseFloat(h.entries || 0), 0) / historical.length;
    const avgExits = historical.reduce((sum, h) => sum + parseFloat(h.exits || 0), 0) / historical.length;
    
    // Busca entradas e saídas recorrentes
    // Nota: financial_entries tem deleted_at, mas financial_exits não tem essa coluna
    const recurringEntries = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_entries
      WHERE condominium_id = $1 
        AND is_recurring = TRUE
        AND deleted_at IS NULL
    `, [condominiumId]);

    const recurringExits = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_exits
      WHERE condominium_id = $1 
        AND is_recurring = TRUE
    `, [condominiumId]);

    const recurringEntriesTotal = parseFloat(recurringEntries.rows[0].total || 0);
    const recurringExitsTotal = parseFloat(recurringExits.rows[0].total || 0);

    // Gera previsões
    const projections = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= monthsToProject; i++) {
      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Previsão = média histórica + recorrentes
      const projectedEntries = avgEntries + recurringEntriesTotal;
      const projectedExits = avgExits + recurringExitsTotal;
      const projectedBalance = projectedEntries - projectedExits;

      projections.push({
        month: futureDate.getMonth() + 1,
        year: futureDate.getFullYear(),
        label: monthName,
        projectedEntries: Math.max(0, projectedEntries),
        projectedExits: Math.max(0, projectedExits),
        projectedBalance: projectedBalance
      });
    }

    return projections;
  } catch (error) {
    console.error('Erro ao calcular previsões:', error);
    throw error;
  }
};

// Função para comparar períodos
// Recebe: condominiumId, period1 (objeto {month, year}), period2 (objeto {month, year})
// Retorna: Comparação entre os dois períodos
const comparePeriods = async (condominiumId, period1, period2) => {
  try {
    // Garante que os valores são inteiros
    const p1Month = parseInt(period1.month);
    const p1Year = parseInt(period1.year);
    const p2Month = parseInt(period2.month);
    const p2Year = parseInt(period2.year);

    const period1Data = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN fe.received = TRUE THEN fe.amount ELSE 0 END), 0) AS entries,
        COALESCE(SUM(CASE WHEN fx.payment_status = 'PAID' THEN fx.amount ELSE 0 END), 0) AS exits
      FROM financial_entries fe
      FULL OUTER JOIN financial_exits fx ON fx.condominium_id = fe.condominium_id
      WHERE (fe.condominium_id = $1 OR fx.condominium_id = $1)
        AND (
          (EXTRACT(MONTH FROM fe.entry_date) = $2::INTEGER AND EXTRACT(YEAR FROM fe.entry_date) = $3::INTEGER)
          OR
          (EXTRACT(MONTH FROM fx.exit_date) = $2::INTEGER AND EXTRACT(YEAR FROM fx.exit_date) = $3::INTEGER)
        )
    `, [condominiumId, p1Month, p1Year]);

    const period2Data = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN fe.received = TRUE THEN fe.amount ELSE 0 END), 0) AS entries,
        COALESCE(SUM(CASE WHEN fx.payment_status = 'PAID' THEN fx.amount ELSE 0 END), 0) AS exits
      FROM financial_entries fe
      FULL OUTER JOIN financial_exits fx ON fx.condominium_id = fe.condominium_id
      WHERE (fe.condominium_id = $1 OR fx.condominium_id = $1)
        AND (
          (EXTRACT(MONTH FROM fe.entry_date) = $2::INTEGER AND EXTRACT(YEAR FROM fe.entry_date) = $3::INTEGER)
          OR
          (EXTRACT(MONTH FROM fx.exit_date) = $2::INTEGER AND EXTRACT(YEAR FROM fx.exit_date) = $3::INTEGER)
        )
    `, [condominiumId, p2Month, p2Year]);

    const p1 = period1Data.rows[0] || { entries: 0, exits: 0 };
    const p2 = period2Data.rows[0] || { entries: 0, exits: 0 };

    const p1Entries = parseFloat(p1.entries || 0);
    const p1Exits = parseFloat(p1.exits || 0);
    const p2Entries = parseFloat(p2.entries || 0);
    const p2Exits = parseFloat(p2.exits || 0);

    const entriesVariation = p1Entries > 0 ? ((p2Entries - p1Entries) / p1Entries) * 100 : 0;
    const exitsVariation = p1Exits > 0 ? ((p2Exits - p1Exits) / p1Exits) * 100 : 0;

    return {
      period1: {
        entries: p1Entries,
        exits: p1Exits,
        balance: p1Entries - p1Exits
      },
      period2: {
        entries: p2Entries,
        exits: p2Exits,
        balance: p2Entries - p2Exits
      },
      variations: {
        entries: entriesVariation,
        exits: exitsVariation,
        balance: p1Entries - p1Exits > 0 ? 
          (((p2Entries - p2Exits) - (p1Entries - p1Exits)) / (p1Entries - p1Exits)) * 100 : 0
      }
    };
  } catch (error) {
    console.error('Erro ao comparar períodos:', error);
    throw error;
  }
};

// Função para obter tendências (crescimento/declínio)
// Recebe: condominiumId, metric ('entries', 'exits', 'balance')
// Retorna: Tendência e taxa de crescimento
const getTrend = async (condominiumId, metric = 'balance') => {
  try {
    const historical = await getHistoricalData(condominiumId, 6);
    
    if (historical.length < 2) {
      return { trend: 'STABLE', rate: 0 };
    }

    const values = historical.map(h => parseFloat(h[metric] || 0));
    const recent = values.slice(-3); // Últimos 3 meses
    const older = values.slice(0, 3); // Primeiros 3 meses

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const rate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    let trend = 'STABLE';
    if (rate > 5) trend = 'GROWING';
    else if (rate < -5) trend = 'DECLINING';

    return { trend, rate: Math.abs(rate) };
  } catch (error) {
    console.error('Erro ao calcular tendência:', error);
    throw error;
  }
};

// Função para obter dados por categoria
// Recebe: condominiumId, months (padrão: 6)
// Retorna: Dados agrupados por categoria
const getDataByCategory = async (condominiumId, months = 6) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const entries = await query(`
      SELECT 
        COALESCE(category, 'OUTRAS') AS category,
        COUNT(*) AS count,
        SUM(amount) AS total
      FROM financial_entries
      WHERE condominium_id = $1
        AND entry_date >= $2
        AND received = TRUE
      GROUP BY category
      ORDER BY total DESC
    `, [condominiumId, startDate]);

    const exits = await query(`
      SELECT 
        COALESCE(category, 'OUTRAS') AS category,
        COUNT(*) AS count,
        SUM(amount) AS total
      FROM financial_exits
      WHERE condominium_id = $1
        AND exit_date >= $2
        AND payment_status = 'PAID'
      GROUP BY category
      ORDER BY total DESC
    `, [condominiumId, startDate]);

    return {
      entries: entries.rows.map(r => ({
        category: r.category,
        count: parseInt(r.count),
        total: parseFloat(r.total || 0)
      })),
      exits: exits.rows.map(r => ({
        category: r.category,
        count: parseInt(r.count),
        total: parseFloat(r.total || 0)
      }))
    };
  } catch (error) {
    console.error('Erro ao buscar dados por categoria:', error);
    throw error;
  }
};

module.exports = {
  getHistoricalData,
  getProjections,
  comparePeriods,
  getTrend,
  getDataByCategory
};

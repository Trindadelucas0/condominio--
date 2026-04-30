// Service para Analytics Avançados dos Dashboards
// Fornece dados para gráficos, previsões e comparações históricas

const { query } = require('../config/database');

const getMonthBounds = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
};

const getPeriodTotals = async (condominiumId, month, year) => {
  const { start, end } = getMonthBounds(month, year);

  const [entriesResult, exitsResult] = await Promise.all([
    query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM financial_entries
      WHERE condominium_id = $1
        AND deleted_at IS NULL
        AND received = TRUE
        AND entry_date >= $2::date
        AND entry_date < $3::date
    `, [condominiumId, start, end]),
    query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM financial_exits
      WHERE condominium_id = $1
        AND payment_status = 'PAID'
        AND exit_date >= $2::date
        AND exit_date < $3::date
    `, [condominiumId, start, end]),
  ]);

  return {
    entries: parseFloat(entriesResult.rows[0]?.total || 0),
    exits: parseFloat(exitsResult.rows[0]?.total || 0),
  };
};

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
        COALESCE(fe.entries, 0) AS entries,
        COALESCE(fx.exits, 0) AS exits,
        COALESCE(fe.entries, 0) - COALESCE(fx.exits, 0) AS balance
      FROM months m
      LEFT JOIN (
        SELECT
          date_trunc('month', entry_date)::date AS month,
          SUM(amount) AS entries
        FROM financial_entries
        WHERE condominium_id = $1
          AND received = TRUE
          AND deleted_at IS NULL
        GROUP BY date_trunc('month', entry_date)
      ) fe ON fe.month = m.month
      LEFT JOIN (
        SELECT
          date_trunc('month', exit_date)::date AS month,
          SUM(amount) AS exits
        FROM financial_exits
        WHERE condominium_id = $1
          AND payment_status = 'PAID'
        GROUP BY date_trunc('month', exit_date)
      ) fx ON fx.month = m.month
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
      SELECT COALESCE(AVG(amount), 0) as monthly_average
      FROM financial_entries
      WHERE condominium_id = $1 
        AND is_recurring = TRUE
        AND received = TRUE
        AND deleted_at IS NULL
    `, [condominiumId]);

    const recurringExits = await query(`
      SELECT COALESCE(AVG(amount), 0) as monthly_average
      FROM financial_exits
      WHERE condominium_id = $1 
        AND is_recurring = TRUE
        AND payment_status = 'PAID'
    `, [condominiumId]);

    const recurringEntriesMonthly = parseFloat(recurringEntries.rows[0].monthly_average || 0);
    const recurringExitsMonthly = parseFloat(recurringExits.rows[0].monthly_average || 0);

    // Gera previsões
    const projections = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= monthsToProject; i++) {
      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = futureDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      // Previsão = média histórica + recorrentes
      const projectedEntries = avgEntries + recurringEntriesMonthly;
      const projectedExits = avgExits + recurringExitsMonthly;
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

    const [p1, p2] = await Promise.all([
      getPeriodTotals(condominiumId, p1Month, p1Year),
      getPeriodTotals(condominiumId, p2Month, p2Year),
    ]);

    const p1Entries = p1.entries;
    const p1Exits = p1.exits;
    const p2Entries = p2.entries;
    const p2Exits = p2.exits;

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
    const endDate = new Date();

    const entries = await query(`
      SELECT 
        COALESCE(category, 'OUTRAS') AS category,
        COUNT(*) AS count,
        SUM(amount) AS total
      FROM financial_entries
      WHERE condominium_id = $1
        AND entry_date >= $2
        AND entry_date <= $3
        AND received = TRUE
        AND deleted_at IS NULL
      GROUP BY category
      ORDER BY total DESC
    `, [condominiumId, startDate, endDate]);

    const exits = await query(`
      SELECT 
        COALESCE(category, 'OUTRAS') AS category,
        COUNT(*) AS count,
        SUM(amount) AS total
      FROM financial_exits
      WHERE condominium_id = $1
        AND exit_date >= $2
        AND exit_date <= $3
        AND payment_status = 'PAID'
      GROUP BY category
      ORDER BY total DESC
    `, [condominiumId, startDate, endDate]);

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

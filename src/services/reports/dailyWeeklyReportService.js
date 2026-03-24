const { query } = require('../../config/database');

const formatDate = (value) => new Date(value).toISOString().slice(0, 10);
const normalizeDate = (value) => String(value || '').trim().slice(0, 10);
const resolvePeriod = ({ targetDate = null, startDate = null, endDate = null } = {}) => {
  if (startDate || endDate) {
    if (!startDate || !endDate) throw new Error('Período inválido: informe data inicial e final.');
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    if (normalizedStart > normalizedEnd) {
      throw new Error('Período inválido: data inicial maior que data final.');
    }
    return { startDate: normalizedStart, endDate: normalizedEnd };
  }
  const day = formatDate(targetDate || new Date());
  return { startDate: day, endDate: day };
};

const getCondominiumName = async (condominiumId) => {
  const result = await query('SELECT name FROM condominiums WHERE id = $1', [condominiumId]);
  return result.rows[0]?.name || 'Condomínio';
};

const getDailyMetrics = async (condominiumId, options = {}) => {
  const period = resolvePeriod(options);

  const entriesResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM financial_entries
     WHERE condominium_id = $1
       AND received = TRUE
       AND deleted_at IS NULL
       AND DATE(entry_date) BETWEEN $2::date AND $3::date`,
    [condominiumId, period.startDate, period.endDate]
  );

  const exitsResult = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM financial_exits
     WHERE condominium_id = $1
       AND payment_status = 'PAID'
       AND DATE(exit_date) BETWEEN $2::date AND $3::date`,
    [condominiumId, period.startDate, period.endDate]
  );

  const maintenanceResult = await query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes,
      COUNT(*) FILTER (WHERE status = 'em_andamento') AS em_andamento,
      COUNT(*) FILTER (WHERE status = 'concluida') AS concluidas
     FROM maintenances
     WHERE condominium_id = $1
       AND DATE(created_at) BETWEEN $2::date AND $3::date`,
    [condominiumId, period.startDate, period.endDate]
  );

  const categoriesResult = await query(
    `SELECT COALESCE(category, 'OUTRAS') AS category, COALESCE(SUM(amount), 0) AS total
     FROM financial_exits
     WHERE condominium_id = $1
       AND payment_status = 'PAID'
       AND DATE(exit_date) BETWEEN $2::date AND $3::date
     GROUP BY category
     ORDER BY total DESC
     LIMIT 8`,
    [condominiumId, period.startDate, period.endDate]
  );

  const entries = parseFloat(entriesResult.rows[0]?.total || 0);
  const exits = parseFloat(exitsResult.rows[0]?.total || 0);
  const maintenance = maintenanceResult.rows[0] || { pendentes: 0, em_andamento: 0, concluidas: 0 };

  return {
    date: period.startDate === period.endDate ? period.startDate : null,
    period,
    entries,
    exits,
    balance: entries - exits,
    maintenances: {
      pendentes: parseInt(maintenance.pendentes || 0, 10),
      emAndamento: parseInt(maintenance.em_andamento || 0, 10),
      concluidas: parseInt(maintenance.concluidas || 0, 10),
    },
    categories: categoriesResult.rows.map((row) => ({
      category: row.category,
      total: parseFloat(row.total || 0),
    })),
  };
};

const getWeeklyMetrics = async (condominiumId, options = {}) => {
  let period = null;
  if (options.startDate || options.endDate) {
    period = resolvePeriod(options);
  } else {
    const ref = new Date(options.referenceDate || new Date());
    const weekStart = new Date(ref);
    weekStart.setDate(ref.getDate() - 6);
    period = {
      startDate: formatDate(weekStart),
      endDate: formatDate(ref),
    };
  }

  const rowsResult = await query(
    `SELECT d::date AS date,
            COALESCE(e.entries, 0) AS entries,
            COALESCE(x.exits, 0) AS exits
     FROM generate_series($2::date, $3::date, '1 day'::interval) d
     LEFT JOIN (
       SELECT DATE(entry_date) AS day, SUM(amount) AS entries
       FROM financial_entries
       WHERE condominium_id = $1 AND received = TRUE AND deleted_at IS NULL
         AND DATE(entry_date) BETWEEN $2::date AND $3::date
       GROUP BY DATE(entry_date)
     ) e ON e.day = d::date
     LEFT JOIN (
       SELECT DATE(exit_date) AS day, SUM(amount) AS exits
       FROM financial_exits
       WHERE condominium_id = $1 AND payment_status = 'PAID'
         AND DATE(exit_date) BETWEEN $2::date AND $3::date
       GROUP BY DATE(exit_date)
     ) x ON x.day = d::date
     ORDER BY d::date ASC`,
    [condominiumId, period.startDate, period.endDate]
  );

  const days = rowsResult.rows.map((row) => {
    const entries = parseFloat(row.entries || 0);
    const exits = parseFloat(row.exits || 0);
    return {
      date: formatDate(row.date),
      entries,
      exits,
      balance: entries - exits,
    };
  });

  const totals = days.reduce(
    (acc, day) => {
      acc.entries += day.entries;
      acc.exits += day.exits;
      acc.balance += day.balance;
      return acc;
    },
    { entries: 0, exits: 0, balance: 0 }
  );

  return {
    period,
    days,
    totals,
  };
};

const buildReportPayload = async (condominiumId, reportType = 'DAILY', options = {}) => {
  const condominiumName = await getCondominiumName(condominiumId);
  const period = resolvePeriod(options);
  if (reportType === 'WEEKLY') {
    const weekly = await getWeeklyMetrics(condominiumId, options);
    return {
      reportType,
      condominiumId,
      condominiumName,
      generatedAt: new Date().toISOString(),
      period: weekly.period,
      weekly,
    };
  }

  const daily = await getDailyMetrics(condominiumId, options);
  return {
    reportType,
    condominiumId,
    condominiumName,
    generatedAt: new Date().toISOString(),
    period,
    daily,
  };
};

module.exports = {
  buildReportPayload,
  getDailyMetrics,
  getWeeklyMetrics,
};

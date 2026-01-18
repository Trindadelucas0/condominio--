// Service de KPIs Avançados
// Fornece análises avançadas, tendências e métricas de performance
// Acesso: SINDICO, SUBSINDICO

const { query } = require('../config/database');

// Função para calcular KPIs avançados
const getAdvancedKPIs = async (condominiumId) => {
  try {
    // ROI (Return on Investment) - Eficiência financeira
    const roiData = await calculateROI(condominiumId);

    // SLA Compliance - Percentual de tarefas/ocorrências dentro do SLA
    const slaCompliance = await calculateSLACompliance(condominiumId);

    // Taxa de Resolução - Percentual de ocorrências resolvidas
    const resolutionRate = await calculateResolutionRate(condominiumId);

    // Eficiência Operacional - Tempo médio de resolução
    const operationalEfficiency = await calculateOperationalEfficiency(condominiumId);

    // Taxa de Inadimplência
    const delinquencyRate = await calculateDelinquencyRate(condominiumId);

    // Eficiência de Aprovações - Tempo médio de aprovação
    const approvalEfficiency = await calculateApprovalEfficiency(condominiumId);

    return {
      roi: roiData,
      slaCompliance: slaCompliance,
      resolutionRate: resolutionRate,
      operationalEfficiency: operationalEfficiency,
      delinquencyRate: delinquencyRate,
      approvalEfficiency: approvalEfficiency
    };
  } catch (error) {
    console.error('Erro ao calcular KPIs avançados:', error);
    throw error;
  }
};

// Calcula ROI (eficácia financeira)
const calculateROI = async (condominiumId) => {
  try {
    // Busca entradas e saídas dos últimos 12 meses
    const entriesResult = await query(
      `SELECT SUM(amount) as total FROM financial_entries
       WHERE condominium_id = $1
       AND received = TRUE
       AND entry_date >= CURRENT_DATE - INTERVAL '12 months'
       AND deleted_at IS NULL`,
      [condominiumId]
    );

    const exitsResult = await query(
      `SELECT SUM(amount) as total FROM financial_exits
       WHERE condominium_id = $1
       AND payment_status IN ('PAID', 'APPROVED')
       AND exit_date >= CURRENT_DATE - INTERVAL '12 months'`,
      [condominiumId]
    );

    const totalEntries = parseFloat(entriesResult.rows[0].total || 0);
    const totalExits = parseFloat(exitsResult.rows[0].total || 0);
    const netIncome = totalEntries - totalExits;
    const roi = totalExits > 0 ? ((netIncome / totalExits) * 100) : 0;

    return {
      totalEntries,
      totalExits,
      netIncome,
      roi: roi.toFixed(2),
      status: roi > 0 ? 'POSITIVE' : roi === 0 ? 'NEUTRAL' : 'NEGATIVE'
    };
  } catch (error) {
    console.error('Erro ao calcular ROI:', error);
    return { totalEntries: 0, totalExits: 0, netIncome: 0, roi: 0, status: 'NEUTRAL' };
  }
};

// Calcula SLA Compliance
const calculateSLACompliance = async (condominiumId) => {
  try {
    // Tarefas
    const tasksResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL 
          AND (completed_at - created_at) <= (sla_hours || 24) * INTERVAL '1 hour') as within_sla
       FROM tasks
       WHERE condominium_id = $1
       AND status = 'COMPLETED'
       AND created_at >= CURRENT_DATE - INTERVAL '3 months'`,
      [condominiumId]
    );

    // Ocorrências
    const occurrencesResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE resolved_at IS NOT NULL 
          AND (resolved_at - created_at) <= (sla_hours || 24) * INTERVAL '1 hour') as within_sla
       FROM occurrences
       WHERE condominium_id = $1
       AND status IN ('RESOLVIDA', 'ENCERRADA')
       AND created_at >= CURRENT_DATE - INTERVAL '3 months'`,
      [condominiumId]
    );

    const tasksTotal = parseInt(tasksResult.rows[0].total || 0);
    const tasksWithinSLA = parseInt(tasksResult.rows[0].within_sla || 0);
    const occurrencesTotal = parseInt(occurrencesResult.rows[0].total || 0);
    const occurrencesWithinSLA = parseInt(occurrencesResult.rows[0].within_sla || 0);

    const total = tasksTotal + occurrencesTotal;
    const withinSLA = tasksWithinSLA + occurrencesWithinSLA;
    const complianceRate = total > 0 ? (withinSLA / total) * 100 : 100;

    return {
      total,
      withinSLA,
      complianceRate: complianceRate.toFixed(2),
      tasks: { total: tasksTotal, withinSLA: tasksWithinSLA },
      occurrences: { total: occurrencesTotal, withinSLA: occurrencesWithinSLA }
    };
  } catch (error) {
    console.error('Erro ao calcular SLA compliance:', error);
    return { total: 0, withinSLA: 0, complianceRate: 0 };
  }
};

// Calcula Taxa de Resolução
const calculateResolutionRate = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status IN ('RESOLVIDA', 'ENCERRADA')) as resolved,
        COUNT(*) as total
       FROM occurrences
       WHERE condominium_id = $1
       AND created_at >= CURRENT_DATE - INTERVAL '6 months'`,
      [condominiumId]
    );

    const resolved = parseInt(result.rows[0].resolved || 0);
    const total = parseInt(result.rows[0].total || 0);
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

    return {
      resolved,
      total,
      resolutionRate: resolutionRate.toFixed(2),
      pending: total - resolved
    };
  } catch (error) {
    console.error('Erro ao calcular taxa de resolução:', error);
    return { resolved: 0, total: 0, resolutionRate: 0, pending: 0 };
  }
};

// Calcula Eficiência Operacional
const calculateOperationalEfficiency = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours
       FROM occurrences
       WHERE condominium_id = $1
       AND status IN ('RESOLVIDA', 'ENCERRADA')
       AND resolved_at IS NOT NULL
       AND created_at >= CURRENT_DATE - INTERVAL '3 months'`,
      [condominiumId]
    );

    const avgHours = parseFloat(result.rows[0].avg_hours || 0);

    return {
      averageResolutionHours: avgHours.toFixed(2),
      averageResolutionDays: (avgHours / 24).toFixed(2),
      status: avgHours <= 24 ? 'EXCELLENT' : avgHours <= 72 ? 'GOOD' : avgHours <= 168 ? 'REGULAR' : 'POOR'
    };
  } catch (error) {
    console.error('Erro ao calcular eficiência operacional:', error);
    return { averageResolutionHours: 0, averageResolutionDays: 0, status: 'NEUTRAL' };
  }
};

// Calcula Taxa de Inadimplência
const calculateDelinquencyRate = async (condominiumId) => {
  try {
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM apartments
       WHERE condominium_id = $1 AND active = TRUE`,
      [condominiumId]
    );

    const overdueResult = await query(
      `SELECT COUNT(DISTINCT apartment_id) as total FROM monthly_fees
       WHERE condominium_id = $1
       AND paid = FALSE
       AND due_date < CURRENT_DATE`,
      [condominiumId]
    );

    const total = parseInt(totalResult.rows[0].total || 0);
    const overdue = parseInt(overdueResult.rows[0].total || 0);
    const delinquencyRate = total > 0 ? (overdue / total) * 100 : 0;

    return {
      total,
      overdue,
      delinquencyRate: delinquencyRate.toFixed(2),
      status: delinquencyRate < 5 ? 'EXCELLENT' : delinquencyRate < 10 ? 'GOOD' : delinquencyRate < 20 ? 'REGULAR' : 'POOR'
    };
  } catch (error) {
    console.error('Erro ao calcular taxa de inadimplência:', error);
    return { total: 0, overdue: 0, delinquencyRate: 0, status: 'NEUTRAL' };
  }
};

// Calcula Eficiência de Aprovações
const calculateApprovalEfficiency = async (condominiumId) => {
  try {
    const result = await query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600) as avg_hours
       FROM approvals
       WHERE condominium_id = $1
       AND status = 'APPROVED'
       AND approved_at IS NOT NULL
       AND created_at >= CURRENT_DATE - INTERVAL '3 months'`,
      [condominiumId]
    );

    const avgHours = parseFloat(result.rows[0].avg_hours || 0);

    return {
      averageApprovalHours: avgHours.toFixed(2),
      averageApprovalDays: (avgHours / 24).toFixed(2),
      status: avgHours <= 24 ? 'EXCELLENT' : avgHours <= 72 ? 'GOOD' : avgHours <= 168 ? 'REGULAR' : 'POOR'
    };
  } catch (error) {
    console.error('Erro ao calcular eficiência de aprovações:', error);
    return { averageApprovalHours: 0, averageApprovalDays: 0, status: 'NEUTRAL' };
  }
};

// Função para análise de tendências
const getTrendAnalysis = async (condominiumId, metric, period = 6) => {
  try {
    let queryText = '';
    let params = [condominiumId];

    switch (metric) {
      case 'financial_balance':
        queryText = `
          SELECT 
            EXTRACT(MONTH FROM entry_date) as month,
            EXTRACT(YEAR FROM entry_date) as year,
            SUM(CASE WHEN fe.amount IS NOT NULL THEN fe.amount ELSE 0 END) as entries,
            SUM(CASE WHEN fx.amount IS NOT NULL THEN fx.amount ELSE 0 END) as exits
          FROM generate_series(
            CURRENT_DATE - INTERVAL '${period} months',
            CURRENT_DATE,
            '1 month'::interval
          ) AS months
          LEFT JOIN financial_entries fe ON 
            EXTRACT(MONTH FROM fe.entry_date) = EXTRACT(MONTH FROM months)
            AND EXTRACT(YEAR FROM fe.entry_date) = EXTRACT(YEAR FROM months)
            AND fe.condominium_id = $1
            AND fe.received = TRUE
          LEFT JOIN financial_exits fx ON
            EXTRACT(MONTH FROM fx.exit_date) = EXTRACT(MONTH FROM months)
            AND EXTRACT(YEAR FROM fx.exit_date) = EXTRACT(YEAR FROM months)
            AND fx.condominium_id = $1
            AND fx.payment_status IN ('PAID', 'APPROVED')
          GROUP BY month, year
          ORDER BY year, month
        `;
        break;
      case 'occurrences':
        queryText = `
          SELECT 
            EXTRACT(MONTH FROM created_at) as month,
            EXTRACT(YEAR FROM created_at) as year,
            COUNT(*) as total
          FROM occurrences
          WHERE condominium_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '${period} months'
          GROUP BY month, year
          ORDER BY year, month
        `;
        break;
      default:
        throw new Error('Métrica não suportada');
    }

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao analisar tendências:', error);
    throw error;
  }
};

// Função para comparação com benchmarks
const getBenchmarkComparison = async (condominiumId) => {
  try {
    // Busca KPIs do condomínio
    const kpis = await getAdvancedKPIs(condominiumId);

    // Benchmarks padrão (podem ser configuráveis)
    const benchmarks = {
      slaCompliance: { excellent: 95, good: 85, regular: 70 },
      resolutionRate: { excellent: 90, good: 80, regular: 70 },
      delinquencyRate: { excellent: 5, good: 10, regular: 20 },
      approvalEfficiency: { excellent: 24, good: 72, regular: 168 }
    };

    const comparison = {
      slaCompliance: {
        current: parseFloat(kpis.slaCompliance.complianceRate),
        benchmark: benchmarks.slaCompliance,
        status: getBenchmarkStatus(parseFloat(kpis.slaCompliance.complianceRate), benchmarks.slaCompliance)
      },
      resolutionRate: {
        current: parseFloat(kpis.resolutionRate.resolutionRate),
        benchmark: benchmarks.resolutionRate,
        status: getBenchmarkStatus(parseFloat(kpis.resolutionRate.resolutionRate), benchmarks.resolutionRate)
      },
      delinquencyRate: {
        current: parseFloat(kpis.delinquencyRate.delinquencyRate),
        benchmark: benchmarks.delinquencyRate,
        status: getBenchmarkStatus(parseFloat(kpis.delinquencyRate.delinquencyRate), benchmarks.delinquencyRate, true) // Invertido
      },
      approvalEfficiency: {
        current: parseFloat(kpis.approvalEfficiency.averageApprovalHours),
        benchmark: benchmarks.approvalEfficiency,
        status: getBenchmarkStatus(parseFloat(kpis.approvalEfficiency.averageApprovalHours), benchmarks.approvalEfficiency, true) // Invertido
      }
    };

    return comparison;
  } catch (error) {
    console.error('Erro ao comparar com benchmarks:', error);
    throw error;
  }
};

// Helper para determinar status do benchmark
const getBenchmarkStatus = (current, benchmark, inverted = false) => {
  if (inverted) {
    // Para métricas onde menor é melhor (delinquency, tempo)
    if (current <= benchmark.excellent) return 'EXCELLENT';
    if (current <= benchmark.good) return 'GOOD';
    if (current <= benchmark.regular) return 'REGULAR';
    return 'POOR';
  } else {
    // Para métricas onde maior é melhor (compliance, rate)
    if (current >= benchmark.excellent) return 'EXCELLENT';
    if (current >= benchmark.good) return 'GOOD';
    if (current >= benchmark.regular) return 'REGULAR';
    return 'POOR';
  }
};

module.exports = {
  getAdvancedKPIs,
  getTrendAnalysis,
  getBenchmarkComparison,
};

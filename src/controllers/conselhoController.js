// Controller do módulo CONSELHO
// Gerencia requisições do painel do conselho (somente leitura)

const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros
const { query } = require('../config/database');
const sindicoService = require('../services/sindicoService');
const dashboardAnalyticsService = require('../services/dashboardAnalyticsService');
const patrimonioService = require('../services/patrimonioService');
const cacheService = require('../services/cacheService');

// Função para exibir dashboard do conselho
// GET /conselho/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const condominiumId = req.user.condominiumId;

    // Filtro de período (padrão: mês atual)
    const period = req.query.period || (req.query.date ? 'custom' : 'current');
    const customDate = req.query.date || null;
    const now = new Date();
    let filterDateStr, filterDateEndStr, filterYear, filterMonth;
    
    // Calcular datas baseado no período selecionado
    if (period === 'custom' && customDate) {
      // Período personalizado (mês específico)
      const dateParts = customDate.split('-');
      if (dateParts.length === 2) {
        filterYear = parseInt(dateParts[0]);
        filterMonth = parseInt(dateParts[1]);
        if (isNaN(filterYear) || isNaN(filterMonth) || filterMonth < 1 || filterMonth > 12) {
          filterYear = now.getFullYear();
          filterMonth = now.getMonth() + 1;
        }
      } else {
        filterYear = now.getFullYear();
        filterMonth = now.getMonth() + 1;
      }
      filterDateStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1;
      const nextYear = filterMonth === 12 ? filterYear + 1 : filterYear;
      filterDateEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else if (period === 'current') {
      // Mês atual
      filterYear = now.getFullYear();
      filterMonth = now.getMonth() + 1;
      filterDateStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1;
      const nextYear = filterMonth === 12 ? filterYear + 1 : filterYear;
      filterDateEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else if (period === 'last') {
      // Mês anterior
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      filterYear = lastMonthDate.getFullYear();
      filterMonth = lastMonthDate.getMonth() + 1;
      filterDateStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1;
      const nextYear = filterMonth === 12 ? filterYear + 1 : filterYear;
      filterDateEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else if (period === 'quarter') {
      // Trimestre atual (3 meses)
      filterYear = now.getFullYear();
      filterMonth = Math.floor(now.getMonth() / 3) * 3 + 1; // Primeiro mês do trimestre
      filterDateStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const endMonth = filterMonth + 2; // Último mês do trimestre
      const endYear = endMonth > 12 ? filterYear + 1 : filterYear;
      const finalMonth = endMonth > 12 ? endMonth - 12 : endMonth;
      const nextMonth = finalMonth === 12 ? 1 : finalMonth + 1;
      const nextYear = finalMonth === 12 ? endYear + 1 : endYear;
      filterDateEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else if (period === 'semester') {
      // Semestre atual (6 meses)
      filterYear = now.getFullYear();
      filterMonth = now.getMonth() < 6 ? 1 : 7; // Janeiro ou Julho
      filterDateStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const endMonth = filterMonth + 5; // Último mês do semestre
      const endYear = endMonth > 12 ? filterYear + 1 : filterYear;
      const finalMonth = endMonth > 12 ? endMonth - 12 : endMonth;
      const nextMonth = finalMonth === 12 ? 1 : finalMonth + 1;
      const nextYear = finalMonth === 12 ? endYear + 1 : endYear;
      filterDateEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else if (period === 'year') {
      // Ano atual
      filterYear = now.getFullYear();
      filterDateStr = `${filterYear}-01-01`;
      filterDateEndStr = `${filterYear + 1}-01-01`;
    } else if (period === 'last-year') {
      // Ano anterior
      filterYear = now.getFullYear() - 1;
      filterDateStr = `${filterYear}-01-01`;
      filterDateEndStr = `${filterYear + 1}-01-01`;
    } else {
      // Padrão: mês atual
      filterYear = now.getFullYear();
      filterMonth = now.getMonth() + 1;
      filterDateStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
      const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1;
      const nextYear = filterMonth === 12 ? filterYear + 1 : filterYear;
      filterDateEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    }
    
    // Formato para exibição no filtro
    const filterDateDisplay = period === 'custom' && customDate 
      ? customDate 
      : `${filterYear}-${String(filterMonth || 1).padStart(2, '0')}`;
    
    console.log(`📅 Filtro de período: ${period} - ${filterDateStr} até ${filterDateEndStr}`);

    // Buscar nome do condomínio
    const condominiumResult = await query(
      `SELECT name FROM condominiums WHERE id = $1`,
      [condominiumId]
    );
    const condominiumName = condominiumResult.rows.length > 0 ? condominiumResult.rows[0].name : 'Condomínio';

    // Buscar estatísticas financeiras (usando serviço do síndico)
    const stats = await sindicoService.getDashboardStats(condominiumId);

    // Buscar estatísticas financeiras do período selecionado
    const periodEntriesResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_entries
      WHERE condominium_id = $1 
        AND deleted_at IS NULL
        AND entry_date >= $2::date
        AND entry_date < $3::date
        AND received = TRUE
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const periodEntries = parseFloat(periodEntriesResult.rows[0]?.total || 0);

    const periodExitsResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_exits
      WHERE condominium_id = $1
        AND exit_date >= $2::date
        AND exit_date < $3::date
        AND payment_status = 'PAID'
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const periodExits = parseFloat(periodExitsResult.rows[0]?.total || 0);

    const periodBalance = periodEntries - periodExits;

    // Calcular mês anterior para comparações
    const lastMonth = filterMonth === 1 ? 12 : filterMonth - 1;
    const lastMonthYear = filterMonth === 1 ? filterYear - 1 : filterYear;

    // Buscar analytics avançados (com cache)
    const analyticsCacheKey = `dashboard:analytics:conselho:${condominiumId}`;
    let analytics = cacheService.get(analyticsCacheKey);
    
    if (!analytics) {
      analytics = {
        historical: await dashboardAnalyticsService.getHistoricalData(condominiumId, 12),
        projections: await dashboardAnalyticsService.getProjections(condominiumId, 3),
        trend: await dashboardAnalyticsService.getTrend(condominiumId, 'balance'),
        categoryData: await dashboardAnalyticsService.getDataByCategory(condominiumId, 6),
      };
      
      // Comparação com mês anterior
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const currentLastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const currentLastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      analytics.comparison = await dashboardAnalyticsService.comparePeriods(
        condominiumId,
        { month: currentLastMonth, year: currentLastMonthYear },
        { month: currentMonth, year: currentYear }
      );
      
      // Cache por 5 minutos
      cacheService.set(analyticsCacheKey, analytics, 300);
    }

    // Buscar estatísticas patrimoniais
    const patrimonioStats = await patrimonioService.getDashboardStats(condominiumId);

    // Buscar estatísticas de inadimplência
    const delinquencyResult = await query(`
      SELECT 
        COUNT(DISTINCT mf.apartment_id) as total_inadimplentes,
        COUNT(*) as total_taxas_vencidas,
        COALESCE(SUM(mf.amount + COALESCE(mf.late_fee, 0) + COALESCE(mf.interest, 0)), 0) as valor_total_vencido
      FROM monthly_fees mf
      INNER JOIN apartments a ON mf.apartment_id = a.id
      WHERE a.condominium_id = $1
        AND mf.paid = FALSE
        AND mf.due_date < CURRENT_DATE
    `, [condominiumId]);
    const delinquency = delinquencyResult.rows[0] || {
      total_inadimplentes: 0,
      total_taxas_vencidas: 0,
      valor_total_vencido: 0
    };

    // Total de apartamentos
    const apartmentsResult = await query(`
      SELECT COUNT(*) as total FROM apartments WHERE condominium_id = $1
    `, [condominiumId]);
    const totalApartments = parseInt(apartmentsResult.rows[0]?.total || 0);
    const delinquencyRate = totalApartments > 0 
      ? ((parseInt(delinquency.total_inadimplentes) / totalApartments) * 100).toFixed(1)
      : 0;

    // Buscar estatísticas de manutenções
    const maintenanceResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pendentes,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as concluidas,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as canceladas,
        COUNT(*) as total
      FROM maintenances
      WHERE condominium_id = $1
    `, [condominiumId]);
    const maintenanceStats = maintenanceResult.rows[0] || {
      pendentes: 0,
      em_andamento: 0,
      concluidas: 0,
      canceladas: 0,
      total: 0
    };

    // Buscar estatísticas de ocorrências
    const occurrencesResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'ABERTA') as abertas,
        COUNT(*) FILTER (WHERE status = 'EM_ATENDIMENTO') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'RESOLVIDA') as resolvidas,
        COUNT(*) FILTER (WHERE status = 'ENCERRADA') as fechadas,
        COUNT(*) as total
      FROM occurrences
      WHERE condominium_id = $1
    `, [condominiumId]);
    const occurrencesStats = occurrencesResult.rows[0] || {
      abertas: 0,
      em_andamento: 0,
      resolvidas: 0,
      fechadas: 0,
      total: 0
    };

    // Buscar estatísticas de assembleias
    const assembliesResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'SCHEDULED') as agendadas,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as concluidas,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as canceladas,
        COUNT(*) as total
      FROM assemblies
      WHERE condominium_id = $1
    `, [condominiumId]);
    const assembliesStats = assembliesResult.rows[0] || {
      agendadas: 0,
      em_andamento: 0,
      concluidas: 0,
      canceladas: 0,
      total: 0
    };

    // Buscar estatísticas de orçamentos
    const budgetsResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pendentes,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as aprovados,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejeitados,
        COUNT(*) as total
      FROM budget_requests
      WHERE condominium_id = $1
    `, [condominiumId]);
    const budgetsStats = budgetsResult.rows[0] || {
      pendentes: 0,
      aprovados: 0,
      rejeitados: 0,
      total: 0
    };

    // Buscar últimas transações financeiras (filtradas por data)
    const recentEntries = await query(`
      SELECT 
        fe.id,
        fe.description,
        fe.amount,
        fe.entry_date,
        fe.received,
        fe.category,
        fe.receipt_pdf_path,
        u.full_name as created_by_name
      FROM financial_entries fe
      LEFT JOIN users u ON fe.created_by = u.id
      WHERE fe.condominium_id = $1 
        AND fe.deleted_at IS NULL
        AND fe.entry_date >= $2::date
        AND fe.entry_date < $3::date
      ORDER BY fe.entry_date DESC, fe.created_at DESC
      LIMIT 50
    `, [condominiumId, filterDateStr, filterDateEndStr]);

    const recentExits = await query(`
      SELECT 
        fx.id,
        fx.description,
        fx.amount,
        fx.exit_date,
        fx.payment_status,
        fx.category,
        u.full_name as created_by_name
      FROM financial_exits fx
      LEFT JOIN users u ON fx.created_by = u.id
      WHERE fx.condominium_id = $1
        AND fx.exit_date >= $2::date
        AND fx.exit_date < $3::date
      ORDER BY fx.exit_date DESC, fx.created_at DESC
      LIMIT 50
    `, [condominiumId, filterDateStr, filterDateEndStr]);

    // Buscar gastos por categoria (filtrados por data)
    const expensesByCategory = await query(`
      SELECT 
        fx.category,
        COUNT(*) as quantidade,
        COALESCE(SUM(fx.amount), 0) as total
      FROM financial_exits fx
      WHERE fx.condominium_id = $1
        AND fx.exit_date >= $2::date
        AND fx.exit_date < $3::date
        AND fx.payment_status IN ('PAID', 'APPROVED')
      GROUP BY fx.category
      ORDER BY total DESC
      LIMIT 10
    `, [condominiumId, filterDateStr, filterDateEndStr]);

    // ========== KPIs ADICIONAIS ==========
    
    // KPI 1: Taxa de Aprovação de Orçamentos
    const budgetApprovalRate = budgetsStats.total > 0 
      ? ((budgetsStats.aprovados / budgetsStats.total) * 100).toFixed(1)
      : 0;

    // KPI 2: Taxa de Conclusão de Manutenções
    const maintenanceCompletionRate = maintenanceStats.total > 0
      ? ((maintenanceStats.concluidas / maintenanceStats.total) * 100).toFixed(1)
      : 0;

    // KPI 3: Taxa de Resolução de Ocorrências
    const occurrencesResolutionRate = occurrencesStats.total > 0
      ? (((occurrencesStats.resolvidas + occurrencesStats.fechadas) / occurrencesStats.total) * 100).toFixed(1)
      : 0;

    // KPI 4: Taxa de Conclusão de Tarefas
    const tasksResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as concluidas,
        COUNT(*) as total
      FROM tasks
      WHERE condominium_id = $1
    `, [condominiumId]);
    const tasksStats = tasksResult.rows[0] || { concluidas: 0, total: 0 };
    const tasksCompletionRate = tasksStats.total > 0
      ? ((parseInt(tasksStats.concluidas) / parseInt(tasksStats.total)) * 100).toFixed(1)
      : 0;

    // KPI 5: Tempo Médio de Resolução de Ocorrências (em dias)
    const avgResolutionTimeResult = await query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400) as avg_days
      FROM occurrences
      WHERE condominium_id = $1
        AND resolved_at IS NOT NULL
        AND resolved_at >= CURRENT_DATE - INTERVAL '6 months'
    `, [condominiumId]);
    const avgResolutionTime = parseFloat(avgResolutionTimeResult.rows[0]?.avg_days || 0);

    // KPI 6: Eficiência Financeira (Entradas / Saídas)
    const financialEfficiency = periodExits > 0
      ? ((periodEntries / periodExits) * 100).toFixed(1)
      : periodEntries > 0 ? 100 : 0;

    // KPI 7: Taxa de Adimplência
    const complianceRate = totalApartments > 0
      ? (((totalApartments - parseInt(delinquency.total_inadimplentes)) / totalApartments) * 100).toFixed(1)
      : 0;

    // KPI 8: Crescimento de Receitas (comparação com mês anterior)
    const lastMonthEntriesResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_entries
      WHERE condominium_id = $1 
        AND deleted_at IS NULL
        AND entry_date >= $2::date
        AND entry_date < $3::date
        AND received = TRUE
    `, [
      condominiumId, 
      `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
      filterDateStr
    ]);
    const lastMonthEntries = parseFloat(lastMonthEntriesResult.rows[0]?.total || 0);
    const revenueGrowth = lastMonthEntries > 0
      ? (((periodEntries - lastMonthEntries) / lastMonthEntries) * 100).toFixed(1)
      : periodEntries > 0 ? 100 : 0;

    // KPI 9: Redução de Custos (comparação com mês anterior)
    const lastMonthExitsResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_exits
      WHERE condominium_id = $1
        AND exit_date >= $2::date
        AND exit_date < $3::date
        AND payment_status = 'PAID'
    `, [
      condominiumId,
      `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
      filterDateStr
    ]);
    const lastMonthExits = parseFloat(lastMonthExitsResult.rows[0]?.total || 0);
    const costReduction = lastMonthExits > 0
      ? (((lastMonthExits - periodExits) / lastMonthExits) * 100).toFixed(1)
      : periodExits < lastMonthExits ? 100 : 0;

    // KPI 10: Índice de Saúde Financeira (0-100)
    // Baseado em: saldo positivo, baixa inadimplência, eficiência financeira
    let healthScore = 0;
    if (periodBalance > 0) healthScore += 30;
    if (parseFloat(complianceRate) >= 95) healthScore += 30;
    else if (parseFloat(complianceRate) >= 90) healthScore += 20;
    else if (parseFloat(complianceRate) >= 80) healthScore += 10;
    if (parseFloat(financialEfficiency) >= 100) healthScore += 40;
    else if (parseFloat(financialEfficiency) >= 80) healthScore += 30;
    else if (parseFloat(financialEfficiency) >= 60) healthScore += 20;
    else if (parseFloat(financialEfficiency) >= 40) healthScore += 10;

    res.render('conselho/dashboard', {
      title: 'Dashboard Conselho - Prestação de Contas',
      user: req.user,
      condominiumName: condominiumName,
      filterDate: filterDateDisplay,
      period: period,
      error: req.query.error || null,
      success: req.query.success || null,
      stats: stats,
      analytics: analytics,
      patrimonioStats: patrimonioStats,
      delinquency: {
        ...delinquency,
        rate: parseFloat(delinquencyRate),
        totalApartments: totalApartments
      },
      maintenanceStats: maintenanceStats,
      occurrencesStats: occurrencesStats,
      assembliesStats: assembliesStats,
      budgetsStats: budgetsStats,
      recentEntries: recentEntries.rows,
      recentExits: recentExits.rows,
      expensesByCategory: expensesByCategory.rows,
      periodStats: {
        entries: periodEntries,
        exits: periodExits,
        balance: periodBalance
      },
      kpis: {
        budgetApprovalRate: parseFloat(budgetApprovalRate),
        maintenanceCompletionRate: parseFloat(maintenanceCompletionRate),
        occurrencesResolutionRate: parseFloat(occurrencesResolutionRate),
        tasksCompletionRate: parseFloat(tasksCompletionRate),
        avgResolutionTime: avgResolutionTime,
        financialEfficiency: parseFloat(financialEfficiency),
        complianceRate: parseFloat(complianceRate),
        revenueGrowth: parseFloat(revenueGrowth),
        costReduction: parseFloat(costReduction),
        healthScore: healthScore,
        tasksStats: {
          concluidas: parseInt(tasksStats.concluidas),
          total: parseInt(tasksStats.total)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard conselho:', error);
    renderError(res, 500, 'Erro ao carregar dashboard conselho', error);
  }
};

module.exports = {
  showDashboard,
};

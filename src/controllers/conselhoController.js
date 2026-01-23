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

    // Filtro de data (padrão: mês atual)
    let filterDate = req.query.date || null;
    let filterYear, filterMonth;
    
    if (filterDate) {
      // Formato esperado: YYYY-MM
      const dateParts = filterDate.split('-');
      if (dateParts.length === 2) {
        filterYear = parseInt(dateParts[0]);
        filterMonth = parseInt(dateParts[1]);
        // Validação
        if (isNaN(filterYear) || isNaN(filterMonth) || filterMonth < 1 || filterMonth > 12) {
          const now = new Date();
          filterYear = now.getFullYear();
          filterMonth = now.getMonth() + 1;
        }
      } else {
        // Fallback para data atual
        const now = new Date();
        filterYear = now.getFullYear();
        filterMonth = now.getMonth() + 1;
      }
    } else {
      const now = new Date();
      filterYear = now.getFullYear();
      filterMonth = now.getMonth() + 1;
    }
    
    const filterDateStr = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
    const nextMonth = filterMonth === 12 ? 1 : filterMonth + 1;
    const nextYear = filterMonth === 12 ? filterYear + 1 : filterYear;
    const filterDateEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    console.log(`📅 Filtro de data: ${filterDateStr} até ${filterDateEndStr}`);

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
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      analytics.comparison = await dashboardAnalyticsService.comparePeriods(
        condominiumId,
        { month: lastMonth, year: lastMonthYear },
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
        fx.payment_receipt_pdf_path,
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

    res.render('conselho/dashboard', {
      title: 'Dashboard Conselho - Prestação de Contas',
      user: req.user,
      condominiumName: condominiumName,
      filterDate: req.query.date || `${filterYear}-${String(filterMonth).padStart(2, '0')}`,
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

// Controller do módulo CONSELHO
// Gerencia requisições do painel do conselho (somente leitura)

const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros
const { query } = require('../config/database');
const sindicoService = require('../services/sindicoService');
const { ALL_CATEGORY_LABELS } = require('../constants/financialCategories');
const dashboardAnalyticsService = require('../services/dashboardAnalyticsService');
const patrimonioService = require('../services/patrimonioService');
const cacheService = require('../services/cacheService');
const reserveFundService = require('../services/reserveFundService');

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
    if (period === 'all') {
      // Ver tudo (todos os meses) — sem filtro de data
      filterDateStr = '1900-01-01';
      filterDateEndStr = '2100-01-01';
      filterYear = now.getFullYear();
      filterMonth = now.getMonth() + 1;
    } else if (period === 'custom' && customDate) {
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
    const filterDateDisplay = period === 'all'
      ? 'Todos os períodos'
      : period === 'custom' && customDate
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

    // Calcular mês anterior para comparações (usar mês atual se filterMonth não estiver definido)
    const effectiveMonth = filterMonth || now.getMonth() + 1;
    const lastMonth = effectiveMonth === 1 ? 12 : effectiveMonth - 1;
    const lastMonthYear = effectiveMonth === 1 ? filterYear - 1 : filterYear;

    // Buscar analytics avançados (sem cache para respeitar filtros de data)
    // Calcular período anterior para comparação baseado no tipo de período
    let previousPeriodMonth, previousPeriodYear;
    
    if (period === 'all') {
      // Para "ver tudo", comparar com mês anterior
      previousPeriodMonth = lastMonth;
      previousPeriodYear = lastMonthYear;
    } else if (period === 'custom' && customDate) {
      // Para período customizado (mês), comparar com mês anterior
      const effectiveMonth = filterMonth || now.getMonth() + 1;
      previousPeriodMonth = effectiveMonth === 1 ? 12 : effectiveMonth - 1;
      previousPeriodYear = effectiveMonth === 1 ? filterYear - 1 : filterYear;
    } else if (period === 'current' || period === 'last') {
      // Para mês atual ou anterior, comparar com mês anterior
      previousPeriodMonth = lastMonth;
      previousPeriodYear = lastMonthYear;
    } else if (period === 'quarter') {
      // Para trimestre, comparar com trimestre anterior
      const effectiveMonth = filterMonth || (Math.floor(now.getMonth() / 3) * 3 + 1);
      previousPeriodMonth = effectiveMonth === 1 ? 10 : effectiveMonth - 3; // Trimestre anterior
      previousPeriodYear = effectiveMonth === 1 ? filterYear - 1 : filterYear;
    } else if (period === 'semester') {
      // Para semestre, comparar com semestre anterior
      const effectiveMonth = filterMonth || (now.getMonth() < 6 ? 1 : 7);
      previousPeriodMonth = effectiveMonth === 1 ? 7 : 1; // Semestre anterior
      previousPeriodYear = effectiveMonth === 1 ? filterYear - 1 : filterYear;
    } else if (period === 'year' || period === 'last-year') {
      // Para ano, comparar com ano anterior
      previousPeriodMonth = 1;
      previousPeriodYear = filterYear - 1;
    } else {
      // Padrão: mês anterior
      previousPeriodMonth = lastMonth;
      previousPeriodYear = lastMonthYear;
    }

    const analytics = {
      historical: await dashboardAnalyticsService.getHistoricalData(condominiumId, 12),
      projections: await dashboardAnalyticsService.getProjections(condominiumId, 3),
      trend: await dashboardAnalyticsService.getTrend(condominiumId, 'balance'),
      categoryData: await dashboardAnalyticsService.getDataByCategory(condominiumId, 6),
    };
    
    // Comparação com período anterior (usando primeiro mês de cada período para comparação)
    const currentPeriodMonth = filterMonth || parseInt(filterDateStr.split('-')[1]);
    const currentPeriodYear = filterYear || parseInt(filterDateStr.split('-')[0]);
    
    analytics.comparison = await dashboardAnalyticsService.comparePeriods(
      condominiumId,
      { month: previousPeriodMonth, year: previousPeriodYear },
      { month: currentPeriodMonth, year: currentPeriodYear }
    );

    // Buscar estatísticas patrimoniais
    const patrimonioStats = await patrimonioService.getDashboardStats(condominiumId);

    // Buscar estatísticas de inadimplência (taxas vencidas até o final do período selecionado)
    // A inadimplência mostra todas as taxas não pagas que venceram até o final do período
    const delinquencyResult = await query(`
      SELECT 
        COUNT(DISTINCT mf.apartment_id) as total_inadimplentes,
        COUNT(*) as total_taxas_vencidas,
        COALESCE(SUM(mf.amount + COALESCE(mf.late_fee, 0) + COALESCE(mf.interest, 0)), 0) as valor_total_vencido
      FROM monthly_fees mf
      INNER JOIN apartments a ON mf.apartment_id = a.id
      WHERE a.condominium_id = $1
        AND mf.paid = FALSE
        AND mf.due_date < $2::date
    `, [condominiumId, filterDateEndStr]);
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

    // Buscar estatísticas de manutenções (filtradas por período)
    const maintenanceResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as concluidas,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as canceladas,
        COUNT(*) as total
      FROM maintenances
      WHERE condominium_id = $1
        AND created_at >= $2::date
        AND created_at < $3::date
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const maintenanceStats = maintenanceResult.rows[0] || {
      pendentes: 0,
      em_andamento: 0,
      concluidas: 0,
      canceladas: 0,
      total: 0
    };

    // Buscar estatísticas de ocorrências (filtradas por período)
    const occurrencesResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'ABERTA') as abertas,
        COUNT(*) FILTER (WHERE status = 'EM_ATENDIMENTO') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'RESOLVIDA') as resolvidas,
        COUNT(*) FILTER (WHERE status = 'ENCERRADA') as fechadas,
        COUNT(*) as total
      FROM occurrences
      WHERE condominium_id = $1
        AND created_at >= $2::date
        AND created_at < $3::date
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const occurrencesStats = occurrencesResult.rows[0] || {
      abertas: 0,
      em_andamento: 0,
      resolvidas: 0,
      fechadas: 0,
      total: 0
    };

    // Buscar estatísticas de assembleias (filtradas por período)
    const assembliesResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'SCHEDULED') as agendadas,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as em_andamento,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as concluidas,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as canceladas,
        COUNT(*) as total
      FROM assemblies
      WHERE condominium_id = $1
        AND created_at >= $2::date
        AND created_at < $3::date
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const assembliesStats = assembliesResult.rows[0] || {
      agendadas: 0,
      em_andamento: 0,
      concluidas: 0,
      canceladas: 0,
      total: 0
    };

    // Buscar estatísticas de orçamentos (filtradas por período)
    const budgetsResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pendentes,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as aprovados,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejeitados,
        COUNT(*) as total
      FROM budget_requests
      WHERE condominium_id = $1
        AND created_at >= $2::date
        AND created_at < $3::date
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const budgetsStats = budgetsResult.rows[0] || {
      pendentes: 0,
      aprovados: 0,
      rejeitados: 0,
      total: 0
    };

    // Buscar últimas transações do período (só recebidas / só pagas para bater com totais do período)
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
        AND fe.received = TRUE
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
        AND fx.payment_status = 'PAID'
      ORDER BY fx.exit_date DESC, fx.created_at DESC
      LIMIT 50
    `, [condominiumId, filterDateStr, filterDateEndStr]);

    // Gastos por categoria: só PAID para alinhar com total de saídas do período
    const expensesByCategory = await query(`
      SELECT 
        fx.category,
        COUNT(*) as quantidade,
        COALESCE(SUM(fx.amount), 0) as total
      FROM financial_exits fx
      WHERE fx.condominium_id = $1
        AND fx.exit_date >= $2::date
        AND fx.exit_date < $3::date
        AND fx.payment_status = 'PAID'
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

    // KPI 4: Taxa de Conclusão de Tarefas (filtradas por período)
    const tasksResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as concluidas,
        COUNT(*) as total
      FROM tasks
      WHERE condominium_id = $1
        AND created_at >= $2::date
        AND created_at < $3::date
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const tasksStats = tasksResult.rows[0] || { concluidas: 0, total: 0 };
    const tasksCompletionRate = tasksStats.total > 0
      ? ((parseInt(tasksStats.concluidas) / parseInt(tasksStats.total)) * 100).toFixed(1)
      : 0;

    // KPI 5: Tempo Médio de Resolução de Ocorrências (em dias) - filtrado por período
    const avgResolutionTimeResult = await query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400) as avg_days
      FROM occurrences
      WHERE condominium_id = $1
        AND resolved_at IS NOT NULL
        AND created_at >= $2::date
        AND created_at < $3::date
    `, [condominiumId, filterDateStr, filterDateEndStr]);
    const avgResolutionTime = parseFloat(avgResolutionTimeResult.rows[0]?.avg_days || 0);

    // KPI 6: Eficiência Financeira (Entradas / Saídas)
    const financialEfficiency = periodExits > 0
      ? ((periodEntries / periodExits) * 100).toFixed(1)
      : periodEntries > 0 ? 100 : 0;

    // KPI 7: Taxa de Adimplência
    const complianceRate = totalApartments > 0
      ? (((totalApartments - parseInt(delinquency.total_inadimplentes)) / totalApartments) * 100).toFixed(1)
      : 0;

    // KPI 8: Crescimento de Receitas (comparação com período anterior equivalente)
    // Calcular período anterior baseado no tipo de período selecionado
    let previousPeriodStartDate, previousPeriodEndDate;
    if (period === 'year' || period === 'last-year') {
      // Para ano, comparar com ano anterior
      previousPeriodStartDate = `${filterYear - 1}-01-01`;
      previousPeriodEndDate = `${filterYear}-01-01`;
    } else if (period === 'semester') {
      // Para semestre, comparar com semestre anterior
      const effectiveMonth = filterMonth || (now.getMonth() < 6 ? 1 : 7);
      const prevSemesterMonth = effectiveMonth === 1 ? 7 : 1;
      const prevSemesterYear = effectiveMonth === 1 ? filterYear - 1 : filterYear;
      previousPeriodStartDate = `${prevSemesterYear}-${String(prevSemesterMonth).padStart(2, '0')}-01`;
      const nextPrevMonth = prevSemesterMonth === 1 ? 7 : 1;
      const nextPrevYear = prevSemesterMonth === 1 ? prevSemesterYear : prevSemesterYear + 1;
      previousPeriodEndDate = `${nextPrevYear}-${String(nextPrevMonth).padStart(2, '0')}-01`;
    } else if (period === 'quarter') {
      // Para trimestre, comparar com trimestre anterior
      const effectiveMonth = filterMonth || (Math.floor(now.getMonth() / 3) * 3 + 1);
      const prevQuarterMonth = effectiveMonth === 1 ? 10 : effectiveMonth - 3;
      const prevQuarterYear = effectiveMonth === 1 ? filterYear - 1 : filterYear;
      previousPeriodStartDate = `${prevQuarterYear}-${String(prevQuarterMonth).padStart(2, '0')}-01`;
      const nextPrevMonth = prevQuarterMonth === 10 ? 1 : prevQuarterMonth + 3;
      const nextPrevYear = prevQuarterMonth === 10 ? prevQuarterYear + 1 : prevQuarterYear;
      previousPeriodEndDate = `${nextPrevYear}-${String(nextPrevMonth).padStart(2, '0')}-01`;
    } else {
      // Para mês (custom, current, last), comparar com mês anterior
      previousPeriodStartDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
      previousPeriodEndDate = filterDateStr;
    }

    const lastPeriodEntriesResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_entries
      WHERE condominium_id = $1 
        AND deleted_at IS NULL
        AND entry_date >= $2::date
        AND entry_date < $3::date
        AND received = TRUE
    `, [condominiumId, previousPeriodStartDate, previousPeriodEndDate]);
    const lastPeriodEntries = parseFloat(lastPeriodEntriesResult.rows[0]?.total || 0);
    const revenueGrowth = lastPeriodEntries > 0
      ? (((periodEntries - lastPeriodEntries) / lastPeriodEntries) * 100).toFixed(1)
      : periodEntries > 0 ? 100 : 0;

    // KPI 9: Redução de Custos (comparação com período anterior equivalente)
    const lastPeriodExitsResult = await query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_exits
      WHERE condominium_id = $1
        AND exit_date >= $2::date
        AND exit_date < $3::date
        AND payment_status = 'PAID'
    `, [condominiumId, previousPeriodStartDate, previousPeriodEndDate]);
    const lastPeriodExits = parseFloat(lastPeriodExitsResult.rows[0]?.total || 0);
    const costReduction = lastPeriodExits > 0
      ? (((lastPeriodExits - periodExits) / lastPeriodExits) * 100).toFixed(1)
      : periodExits < lastPeriodExits ? 100 : 0;

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
    else     if (parseFloat(financialEfficiency) >= 40) healthScore += 10;

    // Fundo de Reserva (KPI)
    const reserveFund = await reserveFundService.getReserveFund(condominiumId).catch(() => null);

    // Saldo em caixa no início e no fim do período (para prestação de contas)
    const balanceAtStartResult = await query(`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM financial_entries WHERE condominium_id = $1 AND deleted_at IS NULL AND received = TRUE AND entry_date < $2) -
        (SELECT COALESCE(SUM(amount), 0) FROM financial_exits WHERE condominium_id = $1 AND payment_status = 'PAID' AND exit_date < $2) -
        (SELECT COALESCE(SUM(amount), 0) FROM financial_exits WHERE condominium_id = $1 AND payment_status = 'APPROVED' AND exit_date < $2) AS balance
    `, [condominiumId, filterDateStr]);
    const balanceAtStartOfPeriod = parseFloat(balanceAtStartResult.rows[0]?.balance || 0);
    const balanceAtEndOfPeriod = balanceAtStartOfPeriod + periodBalance;

    // Contas a pagar: pagas no período, vencidas pendentes até fim do período, a vencer em 60 dias
    let payablePaidInPeriod = 0;
    let payableOverdueCount = 0;
    let payableOverdueAmount = 0;
    let payableUpcoming60DaysAmount = 0;
    try {
      const payablePaidResult = await query(`
        SELECT COALESCE(SUM(pi.amount), 0) AS total
        FROM payable_items pi
        WHERE pi.condominium_id = $1 AND pi.status = 'PAID'
          AND pi.paid_at >= $2::timestamp AND pi.paid_at < $3::timestamp
      `, [condominiumId, filterDateStr, filterDateEndStr]);
      payablePaidInPeriod = parseFloat(payablePaidResult.rows[0]?.total || 0);

      const payableOverdueResult = await query(`
        SELECT COUNT(*) AS cnt, COALESCE(SUM(pi.amount), 0) AS total
        FROM payable_items pi
        WHERE pi.condominium_id = $1 AND pi.status = 'PENDING' AND pi.due_date < $2::date
      `, [condominiumId, filterDateEndStr]);
      payableOverdueCount = parseInt(payableOverdueResult.rows[0]?.cnt || 0);
      payableOverdueAmount = parseFloat(payableOverdueResult.rows[0]?.total || 0);

      const sixtyDaysEnd = new Date(filterDateEndStr);
      sixtyDaysEnd.setDate(sixtyDaysEnd.getDate() + 60);
      const sixtyDaysEndStr = sixtyDaysEnd.toISOString().slice(0, 10);
      const payableUpcomingResult = await query(`
        SELECT COALESCE(SUM(pi.amount), 0) AS total
        FROM payable_items pi
        WHERE pi.condominium_id = $1 AND pi.status = 'PENDING'
          AND pi.due_date >= $2::date AND pi.due_date < $3::date
      `, [condominiumId, filterDateEndStr, sixtyDaysEndStr]);
      payableUpcoming60DaysAmount = parseFloat(payableUpcomingResult.rows[0]?.total || 0);
    } catch (e) {
      // payable_items pode não existir em instalações antigas
    }

    // Rótulo para comparação (vs mês anterior / vs período anterior)
    const periodLabelForComparison = (period === 'quarter' || period === 'semester' || period === 'year' || period === 'last-year')
      ? 'vs período anterior'
      : 'vs mês anterior';

    // Data segura para impressão/PDF (evitar Invalid Date quando period === 'all' ou ano)
    let filterDateForPrint = filterDateDisplay;
    if (period === 'all' || filterDateDisplay === 'Todos os períodos') {
      filterDateForPrint = 'Todos os períodos';
    } else if (period === 'year' || period === 'last-year') {
      filterDateForPrint = `Ano ${filterYear}`;
    } else if (filterDateDisplay && /^\d{4}-\d{2}$/.test(filterDateDisplay)) {
      try {
        filterDateForPrint = new Date(filterDateDisplay + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      } catch (_) {
        filterDateForPrint = filterDateDisplay;
      }
    }

    // Resumo executivo (texto para o conselho)
    const complianceNum = parseFloat(complianceRate);
    const reservePercent = reserveFund && reserveFund.target_balance > 0 ? (reserveFund.target_percent || 0) : null;
    const executiveSummaryParts = [
      `No período: entradas de R$ ${periodEntries.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, saídas de R$ ${periodExits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, saldo do período R$ ${periodBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      `Inadimplência: ${delinquencyRate}% (${delinquency.total_inadimplentes} de ${totalApartments} apartamentos).`,
    ];
    if (reservePercent != null) {
      executiveSummaryParts.push(`Fundo de reserva: ${reservePercent.toFixed(1)}% da meta.`);
    }
    const executiveSummary = executiveSummaryParts.join(' ');

    // Alertas para tomada de decisão
    const alerts = [];
    if (parseFloat(delinquencyRate) > 5) {
      alerts.push({ type: 'warning', text: `Inadimplência acima de 5% (${delinquencyRate}%). Avaliar cobrança e medidas.` });
    }
    if (reserveFund && reserveFund.target_balance > 0 && (reserveFund.target_percent || 0) < 100) {
      alerts.push({ type: 'info', text: `Fundo de reserva em ${(reserveFund.target_percent || 0).toFixed(1)}% da meta.` });
    }
    if (periodBalance < 0) {
      alerts.push({ type: 'danger', text: 'Saldo do período negativo. Atenção ao fluxo de caixa.' });
    }
    if (payableOverdueCount > 0) {
      alerts.push({ type: 'warning', text: `${payableOverdueCount} conta(s) a pagar vencida(s). Valor total: R$ ${payableOverdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.` });
    }

    res.render('conselho/dashboard', {
      title: 'Dashboard Conselho - Prestação de Contas',
      user: req.user,
      categoryLabels: ALL_CATEGORY_LABELS,
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
      },
      reserveFund: reserveFund,
      balanceAtStartOfPeriod,
      balanceAtEndOfPeriod,
      payablePaidInPeriod,
      payableOverdueCount,
      payableOverdueAmount,
      payableUpcoming60DaysAmount,
      periodLabelForComparison,
      filterDateForPrint,
      executiveSummary,
      alerts,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard conselho:', error);
    renderError(res, 500, 'Erro ao carregar dashboard conselho', error);
  }
};

module.exports = {
  showDashboard,
};

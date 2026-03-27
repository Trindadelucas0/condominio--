// Controller do módulo SINDICO/SUBSINDICO
// Gerencia requisições do painel do síndico
// Apenas usuários com perfil SINDICO ou SUBSINDICO podem acessar

const sindicoService = require('../services/sindicoService'); // Service do módulo síndico
const dashboardAnalyticsService = require('../services/dashboardAnalyticsService'); // Analytics avançados
const dashboardConfigService = require('../services/dashboardConfigService'); // Configuração do dashboard
const cacheService = require('../services/cacheService'); // Cache service
const criticalItemsService = require('../services/criticalItemsService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros
const { getErrorMessage } = require('../utils/errorMessages'); // Mensagens de erro amigáveis

// Função para exibir dashboard do síndico
// GET /sindico/dashboard
const showDashboard = async (req, res) => {
  try {
    // Valida se usuário tem condomínio associado
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    // Busca estatísticas do condomínio
    const stats = await sindicoService.getDashboardStats(req.user.condominiumId, {
      dataInicio: req.query.dataInicio,
      dataFim: req.query.dataFim,
    });

    // Buscar configuração do dashboard do usuário
    const dashboardConfig = await dashboardConfigService.getUserConfig(
      req.user.id,
      req.user.condominiumId
    );
    
    // Buscar nome do condomínio para exibição
    const condominiumResult = await require('../config/database').query(
      `SELECT name FROM condominiums WHERE id = $1`,
      [req.user.condominiumId]
    );
    const condominiumName = condominiumResult.rows.length > 0 ? condominiumResult.rows[0].name : 'Condomínio';

    // Busca analytics avançados (com cache)
    const analyticsCacheKey = `dashboard:analytics:${req.user.condominiumId}`;
    let analytics = cacheService.get(analyticsCacheKey);
    
    if (!analytics) {
      analytics = {
        historical: await dashboardAnalyticsService.getHistoricalData(req.user.condominiumId, 12),
        projections: await dashboardAnalyticsService.getProjections(req.user.condominiumId, 3),
        trend: await dashboardAnalyticsService.getTrend(req.user.condominiumId, 'balance'),
        categoryData: await dashboardAnalyticsService.getDataByCategory(req.user.condominiumId, 6),
      };
      
      // Comparação com mês anterior
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      analytics.comparison = await dashboardAnalyticsService.comparePeriods(
        req.user.condominiumId,
        { month: lastMonth, year: lastMonthYear },
        { month: currentMonth, year: currentYear }
      );
      
      // Cache por 5 minutos
      cacheService.set(analyticsCacheKey, analytics, 300);
    }

    const userRoles = req.user.roles || [];
    const criticalItemsData = await criticalItemsService.getCriticalItemsList(
      req.user.condominiumId,
      req.user.id,
      userRoles
    );

    const showGettingStarted = (stats.pendingApprovals || 0) > 0;

    res.render('sindico/dashboard', {
      title: 'Dashboard Síndico',
      user: req.user,
      stats: stats,
      analytics: analytics,
      dashboardConfig: dashboardConfig,
      condominiumName: condominiumName,
      criticalItems: criticalItemsData.items || [],
      condominiumId: req.user.condominiumId,
      showGettingStarted,
      periodo: stats.periodo || null,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard síndico:', error);
    renderError(res, 500, 'Erro ao carregar dashboard síndico', error);
  }
};

// Função para listar aprovações pendentes
// GET /sindico/aprovacoes
const showAprovacoes = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    // Extrair filtros da query string
    const filters = {
      search: req.query.search || '',
      page: parseInt(req.query.page) || 1,
      perPage: parseInt(req.query.perPage) || 20,
      orderBy: req.query.orderBy || 'created_at',
      orderDir: req.query.orderDir || 'DESC',
      approvalType: req.query.tipo || null,
    };

    // Buscar aprovações com filtros e paginação
    const result = await sindicoService.listPendingApprovals(
      req.user.condominiumId,
      filters
    );

    // Extrair approvals e pagination do resultado
    const approvals = result.approvals || result;
    const pagination = result.pagination || null;

    res.render('sindico/aprovacoes', {
      title: 'Aprovações Pendentes',
      user: req.user,
      approvals: approvals,
      pagination: pagination,
      filters: filters,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar aprovações:', error);
    renderError(res, 500, 'Erro ao carregar aprovações', error);
  }
};

// Função para processar aprovação (aprovar ou rejeitar)
// POST /sindico/aprovacoes/:id/processar
const processAprovacao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { action, reason } = req.body;
    const approvalId = req.params.id;

    if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
      return renderError(res, 400, 'Ação inválida');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await sindicoService.processApproval(
      approvalId,
      action,
      reason,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/sindico/aprovacoes?success=processed');
  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    res.redirect('/sindico/aprovacoes?error=' + encodeURIComponent(getErrorMessage(error)));
  }
};

// Função para listar alertas
// GET /sindico/alertas
const showAlertas = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const filters = {
      resolved: req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined,
      severity: req.query.severity || undefined,
      search: req.query.search || undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      perPage: req.query.perPage ? parseInt(req.query.perPage) : 20,
      orderBy: req.query.orderBy || 'created_at',
      orderDir: req.query.orderDir || 'DESC',
    };

    const result = await sindicoService.listAlerts(req.user.condominiumId, filters);

    res.render('sindico/alertas', {
      title: 'Alertas',
      user: req.user,
      alerts: result.alerts || result, // Compatibilidade com versão antiga
      pagination: result.pagination,
      filters: filters,
      query: req.query, // Para manter parâmetros na paginação
    });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    renderError(res, 500, 'Erro ao carregar alertas', error);
  }
};

// Função para resolver alerta
// POST /sindico/alertas/:id/resolver
const resolverAlerta = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const alertId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await sindicoService.resolveAlert(alertId, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/sindico/alertas?success=resolved');
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.redirect('/sindico/alertas?error=' + encodeURIComponent(getErrorMessage(error)));
  }
};

// Função para listar logs de auditoria
// GET /sindico/logs
const showLogs = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const filters = {
      module: req.query.module || undefined,
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      action: req.query.action || undefined,
      startDate: req.query.startDate || undefined,
      endDate: req.query.endDate || undefined,
      search: req.query.search || undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      perPage: req.query.perPage ? parseInt(req.query.perPage) : 20,
    };

    const result = await sindicoService.listAuditLogs(req.user.condominiumId, filters);
    const users = await sindicoService.listUsers(req.user.condominiumId);

    // Lista de módulos disponíveis (para filtro)
    const modules = ['USER', 'FINANCIAL', 'TASK', 'OCCURRENCE', 'DOCUMENT', 'APPROVAL', 'PATRIMONY', 'AUTH'];
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT', 'COMPLETE'];

    res.render('sindico/logs', {
      title: 'Logs de Auditoria',
      user: req.user,
      logs: result.logs || result, // Compatibilidade com versão antiga
      pagination: result.pagination,
      filters: filters,
      users: users,
      modules: modules,
      actions: actions,
      query: req.query, // Para manter parâmetros na paginação
    });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    renderError(res, 500, 'Erro ao carregar logs', error);
  }
};

// Função para listar tarefas do condomínio
// GET /sindico/tarefas
const showTarefas = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const sort = sindicoService.normalizeTaskListSort({
      orderBy: req.query.orderBy,
      orderDir: req.query.orderDir,
    });
    const filters = {
      status: req.query.status || undefined,
      search: req.query.search || undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      perPage: req.query.perPage ? parseInt(req.query.perPage) : 20,
      orderBy: sort.orderBy,
      orderDir: sort.orderDir,
    };

    const result = await sindicoService.listTasks(req.user.condominiumId, filters);

    res.render('sindico/tarefas', {
      title: 'Tarefas do Condomínio',
      user: req.user,
      tasks: result.tasks || result, // Compatibilidade com versão antiga
      pagination: result.pagination,
      filters: filters,
      query: req.query, // Para manter parâmetros na paginação
    });
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    renderError(res, 500, 'Erro ao carregar tarefas', error);
  }
};

// Função para exibir detalhes de uma tarefa
// GET /sindico/tarefas/:id
const showTask = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const task = await sindicoService.getTaskById(req.params.id, req.user.condominiumId);

    if (!task) {
      return renderError(res, 404, 'Tarefa não encontrada');
    }

    // Verifica se há mensagem de sucesso na query string
    const success = req.query.success || null;

    res.render('sindico/task-detail', {
      title: 'Detalhes da Tarefa',
      user: req.user,
      task: task,
      error: null,
      success: success,
    });
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    renderError(res, 500, 'Erro ao carregar tarefa', error);
  }
};

// Função para adicionar observação em tarefa
// POST /sindico/tarefas/:id/observacao
const addTaskObservation = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const taskId = req.params.id;
    const observation = req.body.observation;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await sindicoService.addObservation('tasks', taskId, observation, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/sindico/tarefas/' + taskId + '?success=observation_added');
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    // Volta para a página da tarefa com erro
    try {
      const task = await sindicoService.getTaskById(req.params.id, req.user.condominiumId);
      res.render('sindico/task-detail', {
        title: 'Detalhes da Tarefa',
        user: req.user,
        task: task,
        error: error.message,
      });
    } catch (renderError) {
      res.redirect('/sindico/tarefas?error=' + encodeURIComponent(getErrorMessage(error)));
    }
  }
};

// Função para listar ocorrências do condomínio
// GET /sindico/ocorrencias
const showOcorrencias = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const sortOcc = sindicoService.normalizeOccurrenceListSort({
      orderBy: req.query.orderBy,
      orderDir: req.query.orderDir,
    });
    const filters = {
      status: req.query.status || undefined,
      search: req.query.search || undefined,
      page: req.query.page ? parseInt(req.query.page) : 1,
      perPage: req.query.perPage ? parseInt(req.query.perPage) : 20,
      orderBy: sortOcc.orderBy,
      orderDir: sortOcc.orderDir,
    };

    const result = await sindicoService.listOccurrences(req.user.condominiumId, filters);

    res.render('sindico/ocorrencias', {
      title: 'Ocorrências do Condomínio',
      user: req.user,
      occurrences: result.occurrences || result, // Compatibilidade com versão antiga
      pagination: result.pagination,
      filters: filters,
      query: req.query, // Para manter parâmetros na paginação
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    renderError(res, 500, 'Erro ao carregar ocorrências', error);
  }
};

// Função para exibir detalhes de uma ocorrência
// GET /sindico/ocorrencias/:id
const showOccurrence = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const occurrence = await sindicoService.getOccurrenceById(req.params.id, req.user.condominiumId);

    if (!occurrence) {
      return renderError(res, 404, 'Ocorrência não encontrada');
    }

    // Verifica se há mensagem de sucesso na query string
    const success = req.query.success || null;

    res.render('sindico/occurrence-detail', {
      title: 'Detalhes da Ocorrência',
      user: req.user,
      occurrence: occurrence,
      error: null,
      success: success,
    });
  } catch (error) {
    console.error('Erro ao buscar ocorrência:', error);
    renderError(res, 500, 'Erro ao carregar ocorrência', error);
  }
};

// Função para adicionar observação em ocorrência
// POST /sindico/ocorrencias/:id/observacao
const addOccurrenceObservation = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const occurrenceId = req.params.id;
    const observation = req.body.observation;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await sindicoService.addObservation('occurrences', occurrenceId, observation, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/sindico/ocorrencias/' + occurrenceId + '?success=observation_added');
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    // Volta para a página da ocorrência com erro
    try {
      const occurrence = await sindicoService.getOccurrenceById(req.params.id, req.user.condominiumId);
      res.render('sindico/occurrence-detail', {
        title: 'Detalhes da Ocorrência',
        user: req.user,
        occurrence: occurrence,
        error: error.message,
      });
    } catch (renderError) {
      res.redirect('/sindico/ocorrencias?error=' + encodeURIComponent(getErrorMessage(error)));
    }
  }
};

// Exporta funções
module.exports = {
  showDashboard,
  showAprovacoes,
  processAprovacao,
  showAlertas,
  resolverAlerta,
  showLogs,
  showTarefas,
  showTask,
  addTaskObservation,
  showOcorrencias,
  showOccurrence,
  addOccurrenceObservation,
};

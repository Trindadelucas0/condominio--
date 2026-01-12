// Controller do módulo SINDICO/SUBSINDICO
// Gerencia requisições do painel do síndico
// Apenas usuários com perfil SINDICO ou SUBSINDICO podem acessar

const sindicoService = require('../services/sindicoService'); // Service do módulo síndico
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard do síndico
// GET /sindico/dashboard
const showDashboard = async (req, res) => {
  try {
    // Valida se usuário tem condomínio associado
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    // Busca estatísticas do condomínio
    const stats = await sindicoService.getDashboardStats(req.user.condominiumId);

    res.render('sindico/dashboard', {
      title: 'Dashboard Síndico',
      user: req.user,
      stats: stats,
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

    const approvals = await sindicoService.listPendingApprovals(req.user.condominiumId);

    res.render('sindico/aprovacoes', {
      title: 'Aprovações Pendentes',
      user: req.user,
      approvals: approvals,
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
    res.redirect('/sindico/aprovacoes?error=' + encodeURIComponent(error.message));
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
    };

    const alerts = await sindicoService.listAlerts(req.user.condominiumId, filters);

    res.render('sindico/alertas', {
      title: 'Alertas',
      user: req.user,
      alerts: alerts,
      filters: filters,
    });
  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).send('Erro ao carregar alertas');
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
    res.redirect('/sindico/alertas?error=' + encodeURIComponent(error.message));
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
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
    };

    const logs = await sindicoService.listAuditLogs(req.user.condominiumId, filters);
    const users = await sindicoService.listUsers(req.user.condominiumId);

    // Lista de módulos disponíveis (para filtro)
    const modules = ['USER', 'FINANCIAL', 'TASK', 'OCCURRENCE', 'DOCUMENT', 'APPROVAL', 'PATRIMONY', 'AUTH'];
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT', 'COMPLETE'];

    res.render('sindico/logs', {
      title: 'Logs de Auditoria',
      user: req.user,
      logs: logs,
      filters: filters,
      users: users,
      modules: modules,
      actions: actions,
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

    const filters = {
      status: req.query.status || undefined,
    };

    const tasks = await sindicoService.listTasks(req.user.condominiumId, filters);

    res.render('sindico/tarefas', {
      title: 'Tarefas do Condomínio',
      user: req.user,
      tasks: tasks,
      filters: filters,
    });
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).send('Erro ao carregar tarefas');
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
      return res.status(404).send('Tarefa não encontrada');
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
      res.redirect('/sindico/tarefas?error=' + encodeURIComponent(error.message));
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

    const filters = {
      status: req.query.status || undefined,
    };

    const occurrences = await sindicoService.listOccurrences(req.user.condominiumId, filters);

    res.render('sindico/ocorrencias', {
      title: 'Ocorrências do Condomínio',
      user: req.user,
      occurrences: occurrences,
      filters: filters,
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    res.status(500).send('Erro ao carregar ocorrências');
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
      res.redirect('/sindico/ocorrencias?error=' + encodeURIComponent(error.message));
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

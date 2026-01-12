// Controller do módulo OPERACIONAL
// Gerencia requisições do painel operacional (zeladoria)

const operacionalService = require('../services/operacionalService'); // Service do módulo operacional
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard operacional
// GET /operacional/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const stats = await operacionalService.getDashboardStats(req.user.id, req.user.condominiumId);

    res.render('operacional/dashboard', {
      title: 'Dashboard Operacional',
      user: req.user,
      stats: stats,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard operacional:', error);
    renderError(res, 500, 'Erro ao carregar dashboard operacional', error);
  }
};

// Função para listar checklist/tarefas
// GET /operacional/checklist
const showChecklist = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      status: req.query.status || undefined,
    };

    const tasks = await operacionalService.listTasks(req.user.id, req.user.condominiumId, filters);

    res.render('operacional/checklist', {
      title: 'Checklist',
      user: req.user,
      tasks: tasks,
    });
  } catch (error) {
    console.error('Erro ao listar checklist:', error);
    res.status(500).send('Erro ao carregar checklist');
  }
};

// Função para exibir detalhes de uma tarefa
// GET /operacional/tarefas/:id
const showTask = async (req, res) => {
  try {
    const task = await operacionalService.getTaskById(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).send('Tarefa não encontrada');
    }

    res.render('operacional/task', {
      title: 'Detalhes da Tarefa',
      user: req.user,
      task: task,
    });
  } catch (error) {
    console.error('Erro ao buscar tarefa:', error);
    res.status(500).send('Erro ao carregar tarefa');
  }
};

// Função para atualizar item de checklist
// POST /operacional/checklist/:id/atualizar
const updateChecklistItem = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const { status, comment } = req.body;
    const checklistId = req.params.id;

    if (!status || (status !== 'DONE' && status !== 'NOT_DONE')) {
      return res.status(400).send('Status inválido');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await operacionalService.updateChecklistItem(
      checklistId,
      status,
      comment,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    // Volta para a página anterior (seguro)
    const referrer = req.get('Referrer') || '/operacional/checklist';
    res.redirect(referrer);
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    const referrer = req.get('Referrer') || '/operacional/checklist';
    res.redirect(referrer + '?error=' + encodeURIComponent(error.message));
  }
};

// Função para exibir formulário de conclusão de tarefa
// GET /operacional/tarefas/:id/concluir
const showCompleteTask = async (req, res) => {
  try {
    const task = await operacionalService.getTaskById(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).send('Tarefa não encontrada');
    }

    if (task.status === 'COMPLETED') {
      return res.redirect('/operacional/checklist?error=' + encodeURIComponent('Tarefa já está concluída'));
    }

    res.render('operacional/complete-task', {
      title: 'Concluir Tarefa',
      user: req.user,
      task: task,
      error: null,
      formData: null,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de conclusão:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para finalizar tarefa com dados estruturados
// POST /operacional/tarefas/:id/finalizar
const completeTask = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const taskId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Prepara dados de conclusão estruturados
    const completionData = {
      completion_success: req.body.completion_success,
      completion_notes: req.body.completion_notes,
      had_issues: req.body.had_issues,
      issues_description: req.body.issues_description,
      completion_time_minutes: req.body.completion_time_minutes,
      completion_quality: req.body.completion_quality,
    };

    await operacionalService.completeTask(taskId, req.user.id, req.user.condominiumId, completionData, ipAddress, userAgent);

    res.redirect('/operacional/checklist?success=completed');
  } catch (error) {
    console.error('Erro ao finalizar tarefa:', error);
    // Se houver erro, volta para o formulário com os dados
    try {
      const task = await operacionalService.getTaskById(req.params.id, req.user.id);
      res.render('operacional/complete-task', {
        title: 'Concluir Tarefa',
        user: req.user,
        task: task,
        error: error.message,
        formData: req.body,
      });
    } catch (renderError) {
      res.redirect('/operacional/checklist?error=' + encodeURIComponent(error.message));
    }
  }
};

// Função para listar ocorrências
// GET /operacional/ocorrencias
const showOcorrencias = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      status: req.query.status || undefined,
    };

    const occurrences = await operacionalService.listOccurrences(req.user.id, req.user.condominiumId, filters);

    res.render('operacional/ocorrencias', {
      title: 'Ocorrências',
      user: req.user,
      occurrences: occurrences,
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    res.status(500).send('Erro ao carregar ocorrências');
  }
};

// Função para exibir formulário de criação de ocorrência
// GET /operacional/ocorrencias/nova
const showCreateOcorrencia = (req, res) => {
  res.render('operacional/ocorrencia-form', {
    title: 'Nova Ocorrência',
    user: req.user,
    ocorrencia: null,
  });
};

// Função para processar criação de ocorrência
// POST /operacional/ocorrencias
const createOcorrencia = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await operacionalService.createOccurrence(req.body, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/operacional/ocorrencias?success=created');
  } catch (error) {
    res.render('operacional/ocorrencia-form', {
      title: 'Nova Ocorrência',
      user: req.user,
      ocorrencia: req.body,
      error: error.message,
    });
  }
};

// Função para exibir detalhes de uma ocorrência
// GET /operacional/ocorrencias/:id
const showOcorrencia = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const occurrences = await operacionalService.listOccurrences(req.user.id, req.user.condominiumId);
    const occurrence = occurrences.find(o => o.id === parseInt(req.params.id));

    if (!occurrence) {
      return res.status(404).send('Ocorrência não encontrada');
    }

    res.render('operacional/ocorrencia-detail', {
      title: 'Detalhes da Ocorrência',
      user: req.user,
      occurrence: occurrence,
    });
  } catch (error) {
    console.error('Erro ao buscar ocorrência:', error);
    res.status(500).send('Erro ao carregar ocorrência');
  }
};

// Função para exibir formulário de resolução de ocorrência
// GET /operacional/ocorrencias/:id/resolver
const showResolveOcorrencia = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const occurrences = await operacionalService.listOccurrences(req.user.id, req.user.condominiumId);
    const occurrence = occurrences.find(o => o.id === parseInt(req.params.id));

    if (!occurrence) {
      return res.status(404).send('Ocorrência não encontrada');
    }

    if (occurrence.status === 'RESOLVIDA' || occurrence.status === 'ENCERRADA') {
      return res.redirect('/operacional/ocorrencias?error=' + encodeURIComponent('Ocorrência já está resolvida'));
    }

    res.render('operacional/resolve-occurrence', {
      title: 'Resolver Ocorrência',
      user: req.user,
      occurrence: occurrence,
      error: null,
      formData: null,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de resolução:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar resolução de ocorrência
// POST /operacional/ocorrencias/:id/resolver
const resolveOcorrencia = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const occurrenceId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Prepara dados de resolução estruturados
    const resolutionData = {
      resolution_success: req.body.resolution_success,
      resolution_notes: req.body.resolution_notes,
      resolution_method: req.body.resolution_method,
      resolution_cost: req.body.resolution_cost,
      had_complications: req.body.had_complications,
      complications_description: req.body.complications_description,
      resolution_time_minutes: req.body.resolution_time_minutes,
      preventive_measures: req.body.preventive_measures,
    };

    await operacionalService.resolveOccurrence(occurrenceId, req.user.id, req.user.condominiumId, resolutionData, ipAddress, userAgent);

    res.redirect('/operacional/ocorrencias?success=resolved');
  } catch (error) {
    console.error('Erro ao resolver ocorrência:', error);
    // Se houver erro, volta para o formulário com os dados
    try {
      const occurrences = await operacionalService.listOccurrences(req.user.id, req.user.condominiumId);
      const occurrence = occurrences.find(o => o.id === parseInt(req.params.id));
      res.render('operacional/resolve-occurrence', {
        title: 'Resolver Ocorrência',
        user: req.user,
        occurrence: occurrence,
        error: error.message,
        formData: req.body,
      });
    } catch (renderError) {
      res.redirect('/operacional/ocorrencias?error=' + encodeURIComponent(error.message));
    }
  }
};

module.exports = {
  showDashboard,
  showChecklist,
  showTask,
  updateChecklistItem,
  showCompleteTask,
  completeTask,
  showOcorrencias,
  showOcorrencia,
  showCreateOcorrencia,
  createOcorrencia,
  showResolveOcorrencia,
  resolveOcorrencia,
};

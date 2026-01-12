// Controller do módulo OPERACIONAL
// Gerencia requisições do painel operacional (zeladoria)

const operacionalService = require('../services/operacionalService'); // Service do módulo operacional

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
    res.status(500).send('Erro ao carregar dashboard');
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

// Função para finalizar tarefa
// POST /operacional/tarefas/:id/finalizar
const completeTask = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const taskId = req.params.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await operacionalService.completeTask(taskId, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/operacional/checklist?success=completed');
  } catch (error) {
    console.error('Erro ao finalizar tarefa:', error);
    res.redirect('/operacional/checklist?error=' + encodeURIComponent(error.message));
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

module.exports = {
  showDashboard,
  showChecklist,
  showTask,
  updateChecklistItem,
  completeTask,
  showOcorrencias,
  showCreateOcorrencia,
  createOcorrencia,
};

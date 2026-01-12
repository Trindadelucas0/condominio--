// Controller do módulo ADMINISTRATIVO
// Gerencia requisições do painel administrativo
// REGRA: ADMINISTRATIVO NÃO tem acesso financeiro nem patrimonial (separados em módulos próprios)

const administrativoService = require('../services/administrativoService'); // Service do módulo administrativo
// REMOVIDO: financeiroService e patrimonioService (movidos para controllers próprios)

// Função para exibir dashboard administrativo
// GET /administrativo/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const stats = await administrativoService.getDashboardStats(req.user.condominiumId);

    res.render('administrativo/dashboard', {
      title: 'Dashboard Administrativo',
      user: req.user,
      stats: stats,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard administrativo:', error);
    res.status(500).send('Erro ao carregar dashboard');
  }
};

// Função para listar tarefas
// GET /administrativo/tarefas
const showTarefas = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      status: req.query.status || undefined,
    };

    const tasks = await administrativoService.listTasks(req.user.id, req.user.condominiumId, filters);

    res.render('administrativo/tarefas/list', {
      title: 'Tarefas',
      user: req.user,
      tasks: tasks,
      query: req.query, // Para mensagens de sucesso
    });
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).send('Erro ao carregar tarefas');
  }
};

// Função para exibir formulário de criação de tarefa
// GET /administrativo/tarefas/nova
const showCreateTarefa = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const operacionais = await administrativoService.listOperacionais(req.user.condominiumId);

    res.render('administrativo/tarefas/form', {
      title: 'Nova Tarefa',
      user: req.user,
      tarefa: null,
      operacionais: operacionais,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar criação de tarefa
// POST /administrativo/tarefas
const createTarefa = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Processa itens de checklist (se houver)
    const checklistItems = req.body.checklistItems 
      ? (Array.isArray(req.body.checklistItems) 
          ? req.body.checklistItems.filter(item => item && item.trim() !== '')
          : [req.body.checklistItems].filter(item => item && item.trim() !== ''))
      : [];

    const data = {
      title: req.body.title,
      description: req.body.description,
      assignedTo: parseInt(req.body.assignedTo),
      dueDate: req.body.dueDate,
      priority: req.body.priority || 'NORMAL',
      taskType: req.body.taskType || 'CHECKLIST',
      checklistItems: checklistItems,
    };

    await administrativoService.createTask(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/tarefas?success=created');
  } catch (error) {
    try {
      const operacionais = await administrativoService.listOperacionais(req.user.condominiumId);

      res.render('administrativo/tarefas/form', {
        title: 'Nova Tarefa',
        user: req.user,
        tarefa: req.body,
        operacionais: operacionais,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar criação de tarefa');
    }
  }
};

// Função para listar documentos
// GET /administrativo/documentos
const showDocumentos = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
      status: req.query.status || undefined,
    };

    const documents = await administrativoService.listDocuments(req.user.condominiumId, filters);
    const categories = await administrativoService.listDocumentCategories(req.user.condominiumId);

    res.render('administrativo/documentos/list', {
      title: 'Documentos',
      user: req.user,
      documents: documents,
      categories: categories,
      filters: filters,
      query: req.query, // Para mensagens de sucesso
    });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).send('Erro ao carregar documentos');
  }
};

// Função para exibir formulário de criação de documento
// GET /administrativo/documentos/novo
const showCreateDocumento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const categories = await administrativoService.listDocumentCategories(req.user.condominiumId);

    res.render('administrativo/documentos/form', {
      title: 'Novo Documento',
      user: req.user,
      documento: null,
      categories: categories,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar criação de documento
// POST /administrativo/documentos
const createDocumento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      title: req.body.title,
      description: req.body.description,
      categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : null,
      documentType: req.body.documentType || 'DOCUMENT',
      expiryDate: req.body.expiryDate || null,
    };

    const files = req.files || [];

    // Se há arquivos, usa createDocumentWithFile, senão createDocument
    if (files.length > 0) {
      await administrativoService.createDocumentWithFile(data, files, req.user.id, req.user.condominiumId, ipAddress, userAgent);
    } else {
      await administrativoService.createDocument(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);
    }

    res.redirect('/administrativo/documentos?success=created');
  } catch (error) {
    try {
      const categories = await administrativoService.listDocumentCategories(req.user.condominiumId);

      res.render('administrativo/documentos/form', {
        title: 'Novo Documento',
        user: req.user,
        documento: req.body,
        categories: categories,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar criação de documento');
    }
  }
};

// Função para exibir formulário de edição de documento
// GET /administrativo/documentos/:id/editar
const showEditDocumento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const documents = await administrativoService.listDocuments(req.user.condominiumId);
    const documento = documents.find(d => d.id === parseInt(req.params.id));

    if (!documento) {
      return res.status(404).send('Documento não encontrado');
    }

    const categories = await administrativoService.listDocumentCategories(req.user.condominiumId);

    res.render('administrativo/documentos/form', {
      title: 'Editar Documento',
      user: req.user,
      documento: documento,
      categories: categories,
    });
  } catch (error) {
    console.error('Erro ao carregar documento:', error);
    res.status(500).send('Erro ao carregar documento');
  }
};

// Função para processar atualização de documento
// POST /administrativo/documentos/:id
const updateDocumento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      title: req.body.title,
      description: req.body.description,
      categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : null,
      documentType: req.body.documentType || 'DOCUMENT',
      expiryDate: req.body.expiryDate || null,
      status: req.body.status || 'ACTIVE',
    };

    await administrativoService.updateDocument(req.params.id, data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/documentos?success=updated');
  } catch (error) {
    try {
      const categories = await administrativoService.listDocumentCategories(req.user.condominiumId);

      res.render('administrativo/documentos/form', {
        title: 'Editar Documento',
        user: req.user,
        documento: { ...req.body, id: req.params.id },
        categories: categories,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar atualização de documento');
    }
  }
};

// Função para listar ocorrências (ADM vê todas)
// GET /administrativo/ocorrencias
const showOcorrencias = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const triagemService = require('../services/administrativoTriagemService');
    const filters = {
      status: req.query.status || undefined,
      priority: req.query.priority || undefined,
      occurrenceType: req.query.occurrenceType || undefined,
      triaged: req.query.triaged === 'true' ? true : req.query.triaged === 'false' ? false : undefined,
    };

    const occurrences = await triagemService.listAllOccurrences(req.user.condominiumId, filters);

    res.render('administrativo/ocorrencias/list', {
      title: 'Ocorrências',
      user: req.user,
      occurrences,
      filters,
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    res.status(500).send('Erro ao carregar ocorrências');
  }
};

// Função para exibir formulário de triagem
// GET /administrativo/ocorrencias/:id/triar
const showTriarOcorrencia = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const triagemService = require('../services/administrativoTriagemService');
    const administrativoService = require('../services/administrativoService');

    const occurrences = await triagemService.listAllOccurrences(req.user.condominiumId);
    const occurrence = occurrences.find(o => o.id === parseInt(req.params.id));

    if (!occurrence) {
      return res.status(404).send('Ocorrência não encontrada');
    }

    const operacionais = await administrativoService.listOperacionais(req.user.condominiumId);

    res.render('administrativo/ocorrencias/triar', {
      title: 'Triar Ocorrência',
      user: req.user,
      occurrence,
      operacionais,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de triagem:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar triagem
// POST /administrativo/ocorrencias/:id/triar
const triarOcorrencia = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const triagemService = require('../services/administrativoTriagemService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const triagemData = {
      priority: req.body.priority,
      classification: req.body.classification,
      slaHours: req.body.slaHours ? parseInt(req.body.slaHours) : null,
      assignTo: req.body.assignTo ? parseInt(req.body.assignTo) : null,
      convertToTask: req.body.convertToTask === 'true',
      taskData: req.body.convertToTask === 'true' ? {
        title: req.body.taskTitle || req.body.title,
        description: req.body.taskDescription || req.body.description,
        dueDate: req.body.taskDueDate,
        taskType: req.body.taskType || 'CORRECTIVE',
      } : null,
    };

    await triagemService.triageOccurrence(
      parseInt(req.params.id),
      triagemData,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/administrativo/ocorrencias?success=triaged');
  } catch (error) {
    console.error('Erro ao triar ocorrência:', error);
    res.redirect(`/administrativo/ocorrencias/${req.params.id}/triar?error=${encodeURIComponent(error.message)}`);
  }
};

// Função para listar ocorrências pendentes de triagem
// GET /administrativo/ocorrencias/pendentes
const showOcorrenciasPendentes = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const triagemService = require('../services/administrativoTriagemService');
    const occurrences = await triagemService.listOccurrencesPendingTriage(req.user.condominiumId);

    res.render('administrativo/ocorrencias/pendentes', {
      title: 'Ocorrências Pendentes de Triagem',
      user: req.user,
      occurrences,
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências pendentes:', error);
    res.status(500).send('Erro ao carregar ocorrências');
  }
};

// REMOVIDO: Todas as funções financeiras e patrimoniais foram movidas para controllers separados
module.exports = {
  showDashboard,
  showTarefas,
  showCreateTarefa,
  createTarefa,
  showDocumentos,
  showCreateDocumento,
  createDocumento,
  showEditDocumento,
  updateDocumento,
  showOcorrencias,
  showTriarOcorrencia,
  triarOcorrencia,
  showOcorrenciasPendentes,
  // REMOVIDO: Funções financeiras (movidas para financeiroController.js)
  // REMOVIDO: Funções patrimoniais (movidas para patrimonioController.js)
};

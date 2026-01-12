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

    await administrativoService.createDocument(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

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
  // REMOVIDO: Funções financeiras (movidas para financeiroController.js)
  // REMOVIDO: Funções patrimoniais (movidas para patrimonioController.js)
};

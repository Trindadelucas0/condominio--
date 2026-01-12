// Controller do módulo ADMINISTRATIVO
// Gerencia requisições do painel administrativo

const administrativoService = require('../services/administrativoService'); // Service do módulo administrativo
const financeiroService = require('../services/financeiroService'); // Service do módulo financeiro

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

// ========== FUNÇÕES FINANCEIRAS ==========

// Função para exibir dashboard financeiro
// GET /administrativo/financeiro/dashboard
const showFinanceiroDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const stats = await financeiroService.getDashboardStats(req.user.condominiumId);

    res.render('administrativo/financeiro/dashboard', {
      title: 'Dashboard Financeiro',
      user: req.user,
      stats: stats,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard financeiro:', error);
    res.status(500).send('Erro ao carregar dashboard financeiro');
  }
};

// Função para listar entradas financeiras
// GET /administrativo/financeiro/entradas
const showEntradas = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      received: req.query.received === 'true' ? true : req.query.received === 'false' ? false : undefined,
    };

    const entries = await financeiroService.listEntries(req.user.condominiumId, filters);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/entradas/list', {
      title: 'Entradas Financeiras',
      user: req.user,
      entries: entries,
      costCenters: costCenters,
      query: req.query, // Para mensagens de sucesso
    });
  } catch (error) {
    console.error('Erro ao listar entradas:', error);
    res.status(500).send('Erro ao carregar entradas');
  }
};

// Função para exibir formulário de criação de entrada
// GET /administrativo/financeiro/entradas/nova
const showCreateEntrada = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/entradas/form', {
      title: 'Nova Entrada',
      user: req.user,
      entrada: null,
      costCenters: costCenters,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar criação de entrada
// POST /administrativo/financeiro/entradas
const createEntrada = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      description: req.body.description,
      amount: req.body.amount,
      entryDate: req.body.entryDate,
      costCenterId: req.body.costCenterId ? parseInt(req.body.costCenterId) : null,
      category: req.body.category || 'TAXA',
    };

    await financeiroService.createEntry(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/financeiro/entradas?success=created');
  } catch (error) {
    try {
      const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

      res.render('administrativo/financeiro/entradas/form', {
        title: 'Nova Entrada',
        user: req.user,
        entrada: req.body,
        costCenters: costCenters,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar criação de entrada');
    }
  }
};

// Função para marcar entrada como recebida
// POST /administrativo/financeiro/entradas/:id/receber
const marcarEntradaRecebida = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await financeiroService.markEntryAsReceived(req.params.id, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/financeiro/entradas?success=received');
  } catch (error) {
    console.error('Erro ao marcar entrada como recebida:', error);
    res.redirect('/administrativo/financeiro/entradas?error=' + encodeURIComponent(error.message));
  }
};

// Função para listar saídas financeiras
// GET /administrativo/financeiro/saidas
const showSaidas = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      paymentStatus: req.query.status || undefined,
    };

    const exits = await financeiroService.listExits(req.user.condominiumId, filters);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    const bills = await financeiroService.listBills(req.user.condominiumId);

    res.render('administrativo/financeiro/saidas/list', {
      title: 'Saídas Financeiras',
      user: req.user,
      exits: exits,
      costCenters: costCenters,
      bills: bills,
      query: req.query, // Para mensagens de sucesso
    });
  } catch (error) {
    console.error('Erro ao listar saídas:', error);
    res.status(500).send('Erro ao carregar saídas');
  }
};

// Função para exibir formulário de criação de saída
// GET /administrativo/financeiro/saidas/nova
const showCreateSaida = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    const bills = await financeiroService.listBills(req.user.condominiumId);

    res.render('administrativo/financeiro/saidas/form', {
      title: 'Nova Saída',
      user: req.user,
      saida: null,
      costCenters: costCenters,
      bills: bills,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar criação de saída
// POST /administrativo/financeiro/saidas
const createSaida = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      description: req.body.description,
      amount: req.body.amount,
      exitDate: req.body.exitDate,
      costCenterId: req.body.costCenterId ? parseInt(req.body.costCenterId) : null,
      category: req.body.category || 'OUTRA',
      billId: req.body.billId ? parseInt(req.body.billId) : null,
      requiresApproval: req.body.requiresApproval === 'true' || req.body.requiresApproval === true,
      approvalLimit: req.body.approvalLimit ? parseFloat(req.body.approvalLimit) : 1000.00,
    };

    await financeiroService.createExit(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/financeiro/saidas?success=created');
  } catch (error) {
    try {
      const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
      const bills = await financeiroService.listBills(req.user.condominiumId);

      res.render('administrativo/financeiro/saidas/form', {
        title: 'Nova Saída',
        user: req.user,
        saida: req.body,
        costCenters: costCenters,
        bills: bills,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar criação de saída');
    }
  }
};

// Função para marcar saída como paga
// POST /administrativo/financeiro/saidas/:id/pagar
const marcarSaidaPaga = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await financeiroService.markExitAsPaid(req.params.id, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/financeiro/saidas?success=paid');
  } catch (error) {
    console.error('Erro ao marcar saída como paga:', error);
    res.redirect('/administrativo/financeiro/saidas?error=' + encodeURIComponent(error.message));
  }
};

// Função para listar contas (bills)
// GET /administrativo/financeiro/contas
const showContas = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const bills = await financeiroService.listBills(req.user.condominiumId);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/contas/list', {
      title: 'Contas (Água, Luz, Gás)',
      user: req.user,
      bills: bills,
      costCenters: costCenters,
      query: req.query, // Para mensagens de sucesso
    });
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    res.status(500).send('Erro ao carregar contas');
  }
};

// Função para exibir formulário de criação de conta
// GET /administrativo/financeiro/contas/nova
const showCreateConta = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/contas/form', {
      title: 'Nova Conta',
      user: req.user,
      conta: null,
      costCenters: costCenters,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar criação de conta
// POST /administrativo/financeiro/contas
const createConta = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      billType: req.body.billType,
      costCenterId: req.body.costCenterId ? parseInt(req.body.costCenterId) : null,
      provider: req.body.provider,
      accountNumber: req.body.accountNumber,
    };

    await financeiroService.createBill(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/financeiro/contas?success=created');
  } catch (error) {
    try {
      const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

      res.render('administrativo/financeiro/contas/form', {
        title: 'Nova Conta',
        user: req.user,
        conta: req.body,
        costCenters: costCenters,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar criação de conta');
    }
  }
};

// Função para listar centros de custo
// GET /administrativo/financeiro/centros-custo
const showCentrosCusto = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/centros-custo/list', {
      title: 'Centros de Custo',
      user: req.user,
      costCenters: costCenters,
      query: req.query, // Para mensagens de sucesso
    });
  } catch (error) {
    console.error('Erro ao listar centros de custo:', error);
    res.status(500).send('Erro ao carregar centros de custo');
  }
};

// Função para exibir formulário de criação de centro de custo
// GET /administrativo/financeiro/centros-custo/novo
const showCreateCentroCusto = (req, res) => {
  res.render('administrativo/financeiro/centros-custo/form', {
    title: 'Novo Centro de Custo',
    user: req.user,
    centroCusto: null,
  });
};

// Função para processar criação de centro de custo
// POST /administrativo/financeiro/centros-custo
const createCentroCusto = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      description: req.body.description,
    };

    await financeiroService.createCostCenter(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/financeiro/centros-custo?success=created');
  } catch (error) {
    res.render('administrativo/financeiro/centros-custo/form', {
      title: 'Novo Centro de Custo',
      user: req.user,
      centroCusto: req.body,
      error: error.message,
    });
  }
};

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
  // Funções financeiras
  showFinanceiroDashboard,
  showEntradas,
  showCreateEntrada,
  createEntrada,
  marcarEntradaRecebida,
  showSaidas,
  showCreateSaida,
  createSaida,
  marcarSaidaPaga,
  showContas,
  showCreateConta,
  createConta,
  showCentrosCusto,
  showCreateCentroCusto,
  createCentroCusto,
};

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

    // Valida assignedTo
    if (!req.body.assignedTo) {
      throw new Error('Responsável é obrigatório');
    }

    const assignedTo = parseInt(req.body.assignedTo);
    if (isNaN(assignedTo)) {
      throw new Error('Responsável inválido');
    }

    console.log(`[ADMINISTRATIVO] Criando tarefa - assignedTo: ${assignedTo}, condominiumId: ${req.user.condominiumId}`);

    const data = {
      title: req.body.title,
      description: req.body.description,
      assignedTo: assignedTo,
      dueDate: req.body.dueDate,
      priority: req.body.priority || 'NORMAL',
      taskType: req.body.taskType || 'CHECKLIST',
      checklistItems: checklistItems,
    };

    const task = await administrativoService.createTask(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);
    
    console.log(`[ADMINISTRATIVO] Tarefa criada com sucesso - ID: ${task.id}, assigned_to: ${task.assigned_to}, status: ${task.status}`);

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

    // Garante que campos opcionais existam
    const documentoCompleto = {
      ...documento,
      status: documento.status || 'ACTIVE',
      document_type: documento.document_type || 'DOCUMENT',
      category_id: documento.category_id || null,
      expiry_date: documento.expiry_date || null,
      description: documento.description || '',
    };

    const categories = await administrativoService.listDocumentCategories(req.user.condominiumId);

    res.render('administrativo/documentos/form', {
      title: 'Editar Documento',
      user: req.user,
      documento: documentoCompleto,
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

// Função para listar categorias de documentos
// GET /administrativo/documentos/categorias
const showCategorias = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const categories = await administrativoService.listDocumentCategories(req.user.condominiumId);

    res.render('administrativo/documentos/categorias/list', {
      title: 'Categorias de Documentos',
      user: req.user,
      categories,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).send('Erro ao carregar categorias');
  }
};

// Função para exibir formulário de criação de categoria
// GET /administrativo/documentos/categorias/nova
const showCreateCategoria = (req, res) => {
  res.render('administrativo/documentos/categorias/form', {
    title: 'Nova Categoria',
    user: req.user,
    categoria: null,
  });
};

// Função para criar categoria
// POST /administrativo/documentos/categorias
const createCategoria = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      description: req.body.description || null,
    };

    await administrativoService.createDocumentCategory(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/documentos/categorias?success=created');
  } catch (error) {
    res.render('administrativo/documentos/categorias/form', {
      title: 'Nova Categoria',
      user: req.user,
      categoria: req.body,
      error: error.message,
    });
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
      query: req.query, // Para mensagens de sucesso
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

    const result = await triagemService.triageOccurrence(
      parseInt(req.params.id),
      triagemData,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    // Se foi convertida em tarefa, mostra mensagem específica
    if (triagemData.convertToTask && result.taskCreated) {
      res.redirect('/administrativo/ocorrencias?success=triaged_and_task_created');
    } else {
      res.redirect('/administrativo/ocorrencias?success=triaged');
    }
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

// Função para listar solicitações de orçamento
// GET /administrativo/orcamentos
const showOrcamentos = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const orcamentoService = require('../services/orcamentoService');
    const filters = {
      status: req.query.status || undefined,
    };

    const requests = await orcamentoService.listBudgetRequests(req.user.condominiumId, filters);

    // Busca orçamentos (quotes) para cada solicitação
    for (const request of requests) {
      request.quotes = await orcamentoService.getBudgetQuotes(request.id);
    }

    res.render('administrativo/orcamentos/list', {
      title: 'Solicitações de Orçamento',
      user: req.user,
      requests,
      filters,
    });
  } catch (error) {
    console.error('Erro ao listar solicitações de orçamento:', error);
    res.status(500).send('Erro ao carregar solicitações');
  }
};

// Função para exibir formulário de solicitação de orçamento
// GET /administrativo/orcamentos/novo
const showCreateOrcamento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    // Busca ocorrências e tarefas para vincular (opcional)
    const triagemService = require('../services/administrativoTriagemService');
    const administrativoService = require('../services/administrativoService');
    
    const occurrences = await triagemService.listAllOccurrences(req.user.condominiumId, { status: 'ABERTA' });
    const tasks = await administrativoService.listTasks(req.user.id, req.user.condominiumId, { status: 'PENDING' });

    res.render('administrativo/orcamentos/form', {
      title: 'Nova Solicitação de Orçamento',
      user: req.user,
      request: null,
      occurrences,
      tasks,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para criar solicitação de orçamento
// POST /administrativo/orcamentos
const createOrcamento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const orcamentoService = require('../services/orcamentoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Processa múltiplos orçamentos do formulário
    // O formulário envia como quotes[1][supplierName], quotes[2][supplierName], etc.
    const quotes = [];
    const quoteKeys = Object.keys(req.body).filter(key => key.startsWith('quotes['));
    
    // Agrupa os dados por índice do orçamento
    const quoteIndices = new Set();
    quoteKeys.forEach(key => {
      const match = key.match(/quotes\[(\d+)\]/);
      if (match) {
        quoteIndices.add(match[1]);
      }
    });

    // Constrói array de orçamentos
    quoteIndices.forEach(index => {
      const supplierName = req.body[`quotes[${index}][supplierName]`];
      const supplierContact = req.body[`quotes[${index}][supplierContact]`];
      const quoteValue = req.body[`quotes[${index}][quoteValue]`];
      const quoteDescription = req.body[`quotes[${index}][quoteDescription]`];
      const quoteValidityDate = req.body[`quotes[${index}][quoteValidityDate]`];

      if (supplierName && quoteValue) {
        quotes.push({
          supplierName: supplierName.trim(),
          supplierContact: supplierContact ? supplierContact.trim() : null,
          quoteValue: parseFloat(quoteValue),
          quoteDescription: quoteDescription ? quoteDescription.trim() : null,
          quoteValidityDate: quoteValidityDate || null,
        });
      }
    });

    const data = {
      title: req.body.title,
      description: req.body.description,
      estimatedValue: req.body.estimatedValue,
      priority: req.body.priority || 'NORMAL',
      relatedOccurrenceId: req.body.relatedOccurrenceId || null,
      relatedTaskId: req.body.relatedTaskId || null,
      quotes: quotes, // Array de orçamentos
    };

    const files = req.files && req.files.attachments ? (Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments]) : [];

    await orcamentoService.createBudgetRequest(data, files, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/orcamentos?success=created');
  } catch (error) {
    try {
      const triagemService = require('../services/administrativoTriagemService');
      const administrativoService = require('../services/administrativoService');
      const occurrences = await triagemService.listAllOccurrences(req.user.condominiumId);
      const tasks = await administrativoService.listTasks(req.user.id, req.user.condominiumId);
      
      res.render('administrativo/orcamentos/form', {
        title: 'Nova Solicitação de Orçamento',
        user: req.user,
        request: req.body,
        occurrences,
        tasks,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar solicitação');
    }
  }
};

// Função para listar comunicados operacionais
// GET /administrativo/comunicados
const showComunicados = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const comunicadoService = require('../services/comunicadoService');
    const filters = {
      active: req.query.active !== 'false',
      targetAudience: req.query.targetAudience || undefined,
    };

    const communications = await comunicadoService.listCommunications(req.user.condominiumId, filters);

    res.render('administrativo/comunicados/list', {
      title: 'Comunicados Operacionais',
      user: req.user,
      communications,
      filters,
    });
  } catch (error) {
    console.error('Erro ao listar comunicados:', error);
    res.status(500).send('Erro ao carregar comunicados');
  }
};

// Função para exibir formulário de comunicado
// GET /administrativo/comunicados/novo
const showCreateComunicado = (req, res) => {
  res.render('administrativo/comunicados/form', {
    title: 'Novo Comunicado Operacional',
    user: req.user,
    comunicado: null,
  });
};

// Função para criar comunicado
// POST /administrativo/comunicados
const createComunicado = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const comunicadoService = require('../services/comunicadoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      title: req.body.title,
      message: req.body.message,
      communicationType: req.body.communicationType || 'INFO',
      targetAudience: req.body.targetAudience || 'ALL',
      expiresAt: req.body.expiresAt || null,
    };

    await comunicadoService.createCommunication(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/administrativo/comunicados?success=created');
  } catch (error) {
    res.render('administrativo/comunicados/form', {
      title: 'Novo Comunicado Operacional',
      user: req.user,
      comunicado: req.body,
      error: error.message,
    });
  }
};

// Função para desativar comunicado
// POST /administrativo/comunicados/:id/desativar
const deactivateComunicado = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const comunicadoService = require('../services/comunicadoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await comunicadoService.deactivateCommunication(
      parseInt(req.params.id),
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/administrativo/comunicados?success=deactivated');
  } catch (error) {
    console.error('Erro ao desativar comunicado:', error);
    res.redirect('/administrativo/comunicados?error=' + encodeURIComponent(error.message));
  }
};

// Função para exibir aprovações financeiras pendentes (ADMINISTRATIVO)
// GET /administrativo/aprovacoes-financeiras
const showAprovacoesFinanceiras = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const administrativoService = require('../services/administrativoService');
    const exits = await administrativoService.listPendingFinancialExitsForApproval(req.user.condominiumId);

    res.render('administrativo/aprovacoes-financeiras', {
      title: 'Aprovações Financeiras',
      user: req.user,
      exits: exits,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar aprovações financeiras:', error);
    res.status(500).send('Erro ao carregar aprovações');
  }
};

// Função para processar aprovação financeira (ADMINISTRATIVO)
// POST /administrativo/aprovacoes-financeiras/:id/processar
const processAprovacaoFinanceira = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const { action } = req.body;
    const exitId = parseInt(req.params.id);

    if (!action || action !== 'APPROVE') {
      return res.status(400).send('Ação inválida. Apenas aprovação é permitida para ADMINISTRATIVO.');
    }

    const administrativoService = require('../services/administrativoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await administrativoService.approveFinancialExit(
      exitId,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/administrativo/aprovacoes-financeiras?success=approved');
  } catch (error) {
    console.error('Erro ao processar aprovação financeira:', error);
    res.redirect(`/administrativo/aprovacoes-financeiras?error=${encodeURIComponent(error.message)}`);
  }
};

// REMOVIDO: Todas as funções financeiras e patrimoniais foram movidas para controllers separados
// Exporta funções para uso nas rotas (DEVEM VIR DEPOIS de todas as declarações)
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
  // Categorias de documentos
  showCategorias,
  showCreateCategoria,
  createCategoria,
  showOcorrencias,
  showTriarOcorrencia,
  triarOcorrencia,
  showOcorrenciasPendentes,
  // Solicitações de orçamento (ADM → Síndico)
  showOrcamentos,
  showCreateOrcamento,
  createOrcamento,
  // Comunicados operacionais
  showComunicados,
  showCreateComunicado,
  createComunicado,
  deactivateComunicado,
  // Aprovações financeiras (ADMINISTRATIVO aprova até limite)
  showAprovacoesFinanceiras,
  processAprovacaoFinanceira,
  // REMOVIDO: Funções patrimoniais (movidas para patrimonioController.js)
};

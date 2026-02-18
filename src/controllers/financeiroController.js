// Controller do módulo FINANCEIRO
// Gerencia requisições do painel financeiro

const path = require('path');
const financeiroService = require('../services/financeiroService');
const criticalItemsService = require('../services/criticalItemsService');
const monthlyClosureService = require('../services/monthlyClosureService');
const { renderError } = require('../utils/errorHandler');
const { getErrorMessage } = require('../utils/errorMessages');

// Função para exibir dashboard financeiro
// GET /financeiro/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const payableService = require('../services/payableService');
    await payableService.checkAndNotifyOverduePayables(req.user.condominiumId);

    const dashboardData = await financeiroService.getDashboardStats(req.user.condominiumId);
    const userRoles = req.user.roles || [];
    const criticalItemsData = await criticalItemsService.getCriticalItemsList(
      req.user.condominiumId,
      req.user.id,
      userRoles
    );

    const stats = dashboardData.stats || {};
    const showGettingStarted = (stats.totalEntradas === 0 && stats.totalSaidas === 0) || (typeof stats.totalEntradas !== 'undefined' && stats.totalEntradas === 0);

    res.render('administrativo/financeiro/dashboard', {
      title: 'Dashboard Financeiro',
      user: req.user,
      stats,
      kpis: dashboardData.kpis,
      criticalItems: criticalItemsData.items || [],
      condominiumId: req.user.condominiumId,
      showGettingStarted: !!showGettingStarted
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard financeiro:', error);
    renderError(res, 500, 'Erro ao carregar dashboard financeiro', error);
  }
};

// Função para exibir formulário de criação de entrada
// GET /financeiro/entradas/nova
const showCreateEntry = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/entradas/form', {
      title: 'Nova Entrada Financeira',
      user: req.user,
      entrada: null,
      costCenters,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de entrada:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para criar entrada financeira
// POST /financeiro/entradas
const createEntry = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      description: req.body.description,
      amount: req.body.amount,
      entryDate: req.body.entryDate,
      costCenterId: req.body.costCenterId || null,
      category: req.body.category || 'TAXA',
      received: req.body.received === 'true' || req.body.received === true,
    };

    await financeiroService.createEntry(req.user.condominiumId, req.user.id, data, ipAddress, userAgent);

    res.redirect('/financeiro/entradas?success=created');
  } catch (error) {
    console.error('Erro ao criar entrada:', error);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    res.render('administrativo/financeiro/entradas/form', {
      title: 'Nova Entrada Financeira',
      user: req.user,
      entrada: req.body,
      costCenters,
      error: getErrorMessage(error),
    });
  }
};

// Função para listar entradas
// GET /financeiro/entradas
const listEntries = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const entries = await financeiroService.listEntries(req.user.condominiumId);

    res.render('administrativo/financeiro/entradas/list', {
      title: 'Entradas Financeiras',
      user: req.user,
      entries,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar entradas:', error);
    renderError(res, 500, 'Erro ao carregar entradas', error);
  }
};

// Função para exibir formulário de criação de saída
// GET /financeiro/saidas/nova
const showCreateExit = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true });

    res.render('administrativo/financeiro/saidas/form', {
      title: 'Nova Saída Financeira',
      user: req.user,
      saida: null,
      costCenters,
      bills: bills || [],
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de saída:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para criar saída financeira
// POST /financeiro/saidas
const createExit = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      description: req.body.description,
      amount: req.body.amount,
      exitDate: req.body.exitDate,
      costCenterId: req.body.costCenterId || null,
      category: req.body.category || 'OUTRA',
      billId: req.body.billId || null,
      requiresApproval: req.body.requiresApproval === 'true' || req.body.requiresApproval === true,
      approvalLimit: req.body.approvalLimit || null,
    };

    await financeiroService.createExit(req.user.condominiumId, req.user.id, data, ipAddress, userAgent);

    res.redirect('/financeiro/saidas?success=created');
  } catch (error) {
    console.error('Erro ao criar saída:', error);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
    res.render('administrativo/financeiro/saidas/form', {
      title: 'Nova Saída Financeira',
      user: req.user,
      saida: req.body,
      costCenters,
      bills: bills || [],
      error: getErrorMessage(error),
    });
  }
};

// Função para listar saídas
// GET /financeiro/saidas
const listExits = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const exits = await financeiroService.listExits(req.user.condominiumId);

    res.render('administrativo/financeiro/saidas/list', {
      title: 'Saídas Financeiras',
      user: req.user,
      exits,
    });
  } catch (error) {
    console.error('Erro ao listar saídas:', error);
    renderError(res, 500, 'Erro ao carregar saídas', error);
  }
};

// Função para exibir formulário de criação de conta
// GET /financeiro/contas/nova
const showCreateAccount = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/contas/form', {
      title: 'Nova Conta',
      user: req.user,
      conta: null,
      costCenters,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de conta:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para criar conta
// POST /financeiro/contas
const createAccount = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      billType: req.body.billType,
      provider: req.body.provider || null,
      accountNumber: req.body.accountNumber || null,
      costCenterId: req.body.costCenterId || null,
    };

    await financeiroService.createAccount(req.user.condominiumId, req.user.id, data, ipAddress, userAgent);

    res.redirect('/financeiro/contas?success=created');
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    res.render('administrativo/financeiro/contas/form', {
      title: 'Nova Conta',
      user: req.user,
      conta: req.body,
      costCenters,
      error: getErrorMessage(error),
    });
  }
};

// Função para listar contas
// GET /financeiro/contas
const listAccounts = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const accounts = await financeiroService.listAccounts(req.user.condominiumId);

    res.render('administrativo/financeiro/contas/list', {
      title: 'Contas Recorrentes',
      user: req.user,
      accounts,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    renderError(res, 500, 'Erro ao carregar contas', error);
  }
};

// Função para exibir formulário de edição de conta
// GET /financeiro/contas/:id/editar
const showEditAccount = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const account = await financeiroService.getAccountById(req.params.id, req.user.condominiumId);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    // Adapta campos para o formato esperado pela view (camelCase)
    const contaView = {
      id: account.id,
      name: account.name,
      billType: account.bill_type,
      provider: account.provider,
      accountNumber: account.account_number,
      costCenterId: account.cost_center_id,
      dueDay: account.due_day,
      accountKind: account.account_kind,
      recurrence: account.recurrence,
      active: account.active,
    };

    res.render('administrativo/financeiro/contas/form', {
      title: 'Editar Conta',
      user: req.user,
      conta: contaView,
      costCenters,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição de conta:', error);
    renderError(res, 500, 'Erro ao carregar formulário de conta', error);
  }
};

// Função para atualizar conta recorrente
// POST /financeiro/contas/:id
const updateAccount = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      billType: req.body.billType,
      provider: req.body.provider || null,
      accountNumber: req.body.accountNumber || null,
      costCenterId: req.body.costCenterId || null,
    };

    await financeiroService.updateAccount(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/contas?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    const conta = {
      id: req.params.id,
      name: req.body.name,
      billType: req.body.billType,
      provider: req.body.provider,
      accountNumber: req.body.accountNumber,
      costCenterId: req.body.costCenterId,
    };
    res.render('administrativo/financeiro/contas/form', {
      title: 'Editar Conta',
      user: req.user,
      conta,
      costCenters,
      error: getErrorMessage(error),
    });
  }
};

// Função para exibir formulário de criação de consumo
// GET /financeiro/consumo/novo
const showCreateConsumption = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true });
    const now = new Date();

    res.render('administrativo/financeiro/consumo/form', {
      title: 'Registrar Consumo Mensal',
      user: req.user,
      consumo: null,
      bills,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de consumo:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para criar consumo
// POST /financeiro/consumo
const createConsumption = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      billId: req.body.billId,
      month: parseInt(req.body.month),
      year: parseInt(req.body.year),
      consumptionValue: req.body.consumptionValue || null,
      consumptionUnit: req.body.consumptionUnit || 'UNIDADE',
      billAmount: req.body.billAmount,
      dueDate: req.body.dueDate || null,
    };

    await financeiroService.createConsumption(req.user.condominiumId, req.user.id, data, ipAddress, userAgent);

    res.redirect('/financeiro/consumo?success=created');
  } catch (error) {
    console.error('Erro ao criar consumo:', error);
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
    const now = new Date();
    res.render('administrativo/financeiro/consumo/form', {
      title: 'Registrar Consumo Mensal',
      user: req.user,
      consumo: req.body,
      bills,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
      error: getErrorMessage(error),
    });
  }
};

// Função para exibir formulário de edição de entrada
// GET /financeiro/entradas/:id/editar
const showEditEntry = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);

    res.render('administrativo/financeiro/entradas/form', {
      title: 'Editar Entrada Financeira',
      user: req.user,
      entrada: entry,
      costCenters,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para atualizar entrada financeira
// POST /financeiro/entradas/:id
const updateEntry = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      description: req.body.description,
      amount: req.body.amount,
      entryDate: req.body.entryDate,
      costCenterId: req.body.costCenterId || null,
      category: req.body.category || 'TAXA',
    };

    await financeiroService.updateEntry(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/entradas?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar entrada:', error);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
    res.render('administrativo/financeiro/entradas/form', {
      title: 'Editar Entrada Financeira',
      user: req.user,
      entrada: entry || req.body,
      costCenters,
      error: getErrorMessage(error),
    });
  }
};

// Função para exibir formulário de desfazer recebimento
// GET /financeiro/entradas/:id/desfazer-recebimento
const showUnmarkEntryReceived = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);

    if (!entry.received) {
      return renderError(res, 400, 'Entrada ainda não está marcada como recebida');
    }

    res.render('administrativo/financeiro/entradas/desfazer-recebimento', {
      title: 'Desfazer recebimento da entrada',
      user: req.user,
      entrada: entry,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de desfazer recebimento:', error);
    renderError(res, 500, 'Erro ao carregar formulário de desfazer recebimento', error);
  }
};

// Função para desfazer recebimento de entrada
// POST /financeiro/entradas/:id/desfazer-recebimento
const unmarkEntryReceived = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const reason = req.body.reason;

    await financeiroService.unmarkEntryAsReceived(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      reason,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/entradas?success=unreceived');
  } catch (error) {
    console.error('Erro ao desfazer recebimento da entrada:', error);
    try {
      const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);
      res.render('administrativo/financeiro/entradas/desfazer-recebimento', {
        title: 'Desfazer recebimento da entrada',
        user: req.user,
        entrada: entry,
        error: getErrorMessage(error),
      });
    } catch (innerError) {
      console.error('Erro adicional ao carregar entrada para desfazer recebimento:', innerError);
      renderError(res, 500, 'Erro ao desfazer recebimento da entrada', error);
    }
  }
};

// Função para excluir entrada financeira
// POST /financeiro/entradas/:id/excluir
const deleteEntry = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await financeiroService.deleteEntry(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/entradas-rejeitadas?success=deleted');
  } catch (error) {
    console.error('Erro ao excluir entrada:', error);
    res.redirect('/financeiro/entradas-rejeitadas?error=' + encodeURIComponent(getErrorMessage(error)));
  }
};

// Listar entradas excluídas (soft delete) para recuperação
// GET /financeiro/entradas-excluidas
const listDeletedEntries = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const entries = await financeiroService.listDeletedEntries(req.user.condominiumId, 100);
    res.render('administrativo/financeiro/entradas/excluidas', {
      title: 'Entradas excluídas',
      user: req.user,
      entries,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar entradas excluídas:', error);
    renderError(res, 500, 'Erro ao carregar entradas excluídas', error);
  }
};

// Restaurar entrada excluída
// POST /financeiro/entradas/:id/restaurar
const restoreEntry = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await financeiroService.restoreEntry(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      ipAddress,
      userAgent
    );
    res.redirect('/financeiro/entradas?success=restored');
  } catch (error) {
    console.error('Erro ao restaurar entrada:', error);
    res.redirect('/financeiro/entradas-excluidas?error=' + encodeURIComponent(getErrorMessage(error)));
  }
};

// Função para exibir formulário de edição de saída
// GET /financeiro/saidas/:id/editar
const showEditExit = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 });
    const exit = exits.find(e => e.id === parseInt(req.params.id, 10));

    if (!exit) {
      return renderError(res, 404, 'Saída não encontrada');
    }

    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true });

    const saidaView = {
      id: exit.id,
      description: exit.description,
      amount: exit.amount,
      exitDate: exit.exit_date ? new Date(exit.exit_date).toISOString().split('T')[0] : '',
      costCenterId: exit.cost_center_id,
      category: exit.category,
      billId: exit.bill_id,
      requiresApproval: exit.requires_approval,
      approvalLimit: exit.approval_limit,
    };

    res.render('administrativo/financeiro/saidas/form', {
      title: 'Editar Saída Financeira',
      user: req.user,
      saida: saidaView,
      costCenters,
      bills: bills || [],
      error: null,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição de saída:', error);
    renderError(res, 500, 'Erro ao carregar formulário de saída', error);
  }
};

// Função para atualizar saída financeira
// POST /financeiro/saidas/:id
const updateExitController = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      description: req.body.description,
      amount: req.body.amount,
      exitDate: req.body.exitDate,
      costCenterId: req.body.costCenterId || null,
      category: req.body.category || 'OUTRA',
      billId: req.body.billId || null,
      approvalLimit: req.body.approvalLimit,
    };

    const userRoles = req.user.roles || [];

    await financeiroService.updateExit(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      data,
      userRoles,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/saidas?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar saída:', error);
    try {
      const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
      const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
      const saida = {
        id: req.params.id,
        description: req.body.description,
        amount: req.body.amount,
        exitDate: req.body.exitDate,
        costCenterId: req.body.costCenterId,
        category: req.body.category,
        billId: req.body.billId,
        requiresApproval: req.body.requiresApproval === 'true' || req.body.requiresApproval === 'on',
        approvalLimit: req.body.approvalLimit,
      };

      res.render('administrativo/financeiro/saidas/form', {
        title: 'Editar Saída Financeira',
        user: req.user,
        saida,
        costCenters,
        bills,
        error: getErrorMessage(error),
      });
    } catch (innerError) {
      console.error('Erro adicional ao preparar formulário de saída após erro:', innerError);
      renderError(res, 500, 'Erro ao atualizar saída financeira', error);
    }
  }
};

// Função para exibir formulário de solicitação de desfazer pagamento de saída
// GET /financeiro/saidas/:id/desfazer-pagamento
const showUnpayExit = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 });
    const exit = exits.find(e => e.id === parseInt(req.params.id, 10));

    if (!exit) {
      return renderError(res, 404, 'Saída não encontrada');
    }

    if (exit.payment_status !== 'PAID') {
      return renderError(res, 400, 'Somente saídas pagas podem ter o pagamento solicitado para desfazer');
    }

    res.render('administrativo/financeiro/saidas/desfazer-pagamento', {
      title: 'Solicitar desfazer pagamento da saída',
      user: req.user,
      saida: exit,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de solicitar desfazer pagamento da saída:', error);
    renderError(res, 500, 'Erro ao carregar formulário de solicitar desfazer pagamento da saída', error);
  }
};

// Função para solicitar desfazer pagamento de saída
// POST /financeiro/saidas/:id/desfazer-pagamento
const unpayExit = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const reason = req.body.reason;

    await financeiroService.requestUnpayExit(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      reason,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/saidas?success=unpay_requested');
  } catch (error) {
    console.error('Erro ao solicitar desfazer pagamento da saída:', error);
    try {
      const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 }).catch(() => []);
      const exit = exits.find(e => e.id === parseInt(req.params.id, 10)) || null;

      res.render('administrativo/financeiro/saidas/desfazer-pagamento', {
        title: 'Solicitar desfazer pagamento da saída',
        user: req.user,
        saida: exit,
        error: getErrorMessage(error),
      });
    } catch (innerError) {
      console.error('Erro adicional ao carregar saída para solicitar desfazer pagamento:', innerError);
      renderError(res, 500, 'Erro ao solicitar desfazer pagamento da saída', error);
    }
  }
};

// --- Fechamento Mensal ---

// GET /financeiro/fechamento-mensal
const showFechamentoMensal = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const filterYear = req.query.year ? parseInt(req.query.year, 10) : null;

    const currentMonthClosures = await monthlyClosureService.getClosuresByMonth(
      req.user.condominiumId,
      currentMonth,
      currentYear
    );
    const currentClosure = currentMonthClosures.length > 0
      ? (currentMonthClosures.find(c => c.status === 'CLOSED') || currentMonthClosures[0])
      : null;

    let closures = await monthlyClosureService.listClosures(req.user.condominiumId, { limit: 100 });
    const availableYears = [...new Set(closures.map(c => c.year))].sort((a, b) => b - a);
    if (availableYears.length === 0 && currentYear) availableYears.push(currentYear);
    if (filterYear) closures = closures.filter(c => c.year === filterYear);

    const validation = await monthlyClosureService.validateMonthClosure(
      req.user.condominiumId,
      currentMonth,
      currentYear
    );
    const totals = await monthlyClosureService.calculateMonthTotals(
      req.user.condominiumId,
      currentMonth,
      currentYear
    );

    const reopenableClosures = closures.filter(c => c.status === 'CLOSED');

    res.render('administrativo/financeiro/fechamento-mensal', {
      title: 'Fechamento Mensal',
      user: req.user,
      closures,
      currentMonthClosures,
      currentClosure,
      currentMonth,
      currentYear,
      validation,
      totals,
      reopenableClosures,
      availableYears,
      filterYear,
      req: req
    });
  } catch (error) {
    console.error('Erro ao carregar fechamento mensal:', error);
    renderError(res, 500, 'Erro ao carregar fechamento mensal', error);
  }
};

// POST /financeiro/fechamento-mensal/fechar
const closeFechamentoMensal = async (req, res) => {
  try {
    const { month, year, notes, createNewClosure, action, reserveFundAmount } = req.body;
    const isNewClosure = action === 'new' || createNewClosure === 'true' || createNewClosure === true;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('user-agent') || '';

    await monthlyClosureService.closeMonth(
      req.user.condominiumId,
      parseInt(month, 10),
      parseInt(year, 10),
      req.user.id,
      notes || null,
      ipAddress,
      userAgent,
      isNewClosure,
      reserveFundAmount ? parseFloat(reserveFundAmount) : 0
    );
    res.redirect('/financeiro/fechamento-mensal?success=closed');
  } catch (error) {
    console.error('Erro ao fechar mês:', error);
    res.redirect('/financeiro/fechamento-mensal?error=' + encodeURIComponent(error.message));
  }
};

// POST /financeiro/fechamento-mensal/:id/reabrir
const reopenFechamentoMensal = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !String(reason).trim()) {
      return res.redirect('/financeiro/fechamento-mensal?error=' + encodeURIComponent('Motivo da reabertura é obrigatório'));
    }
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('user-agent') || '';

    await monthlyClosureService.reopenMonth(
      parseInt(req.params.id, 10),
      req.user.condominiumId,
      req.user.id,
      String(reason).trim(),
      ipAddress,
      userAgent
    );
    res.redirect('/financeiro/fechamento-mensal?success=reopened');
  } catch (error) {
    console.error('Erro ao reabrir mês:', error);
    res.redirect('/financeiro/fechamento-mensal?error=' + encodeURIComponent(error.message));
  }
};

// Exporta funções para uso nas rotas
module.exports = {
  showDashboard,
  showCreateEntry,
  createEntry,
  showEditEntry,
  updateEntry,
  deleteEntry,
  listEntries,
  listDeletedEntries,
  restoreEntry,
  showUnmarkEntryReceived,
  unmarkEntryReceived,
  showCreateExit,
  createExit,
  listExits,
  showEditExit,
  updateExitController,
  showUnpayExit,
  unpayExit,
  showCreateAccount,
  createAccount,
  listAccounts,
  showEditAccount,
  updateAccount,
  showCreateConsumption,
  createConsumption,
  showFechamentoMensal,
  closeFechamentoMensal,
  reopenFechamentoMensal,
};

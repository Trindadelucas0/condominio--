// Controller do módulo FINANCEIRO
// Gerencia requisições do painel financeiro

const financeiroService = require('../services/financeiroService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard financeiro
// GET /financeiro/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const dashboardData = await financeiroService.getDashboardStats(req.user.condominiumId);

    res.render('administrativo/financeiro/dashboard', {
      title: 'Dashboard Financeiro',
      user: req.user,
      stats: dashboardData.stats,
      kpis: dashboardData.kpis,
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
      error: error.message,
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
      error: error.message,
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
      error: error.message,
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
    });
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    renderError(res, 500, 'Erro ao carregar contas', error);
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
      error: error.message,
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

    res.redirect('/financeiro/entradas-rejeitadas?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar entrada:', error);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId).catch(() => null);
    res.render('administrativo/financeiro/entradas/form', {
      title: 'Editar Entrada Financeira',
      user: req.user,
      entrada: entry || req.body,
      costCenters,
      error: error.message,
    });
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
    res.redirect('/financeiro/entradas-rejeitadas?error=' + encodeURIComponent(error.message));
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
  showCreateExit,
  createExit,
  listExits,
  showCreateAccount,
  createAccount,
  listAccounts,
  showCreateConsumption,
  createConsumption,
};

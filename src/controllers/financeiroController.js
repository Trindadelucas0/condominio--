// Controller do módulo FINANCEIRO
// Gerencia requisições do painel financeiro

const path = require('path');
const financeiroService = require('../services/financeiroService');
const criticalItemsService = require('../services/criticalItemsService');
const monthlyClosureService = require('../services/monthlyClosureService');
const reserveFundService = require('../services/reserveFundService');
const { renderError } = require('../utils/errorHandler');
const { getErrorMessage } = require('../utils/errorMessages');
const {
  RECEITA_CATEGORIES,
  DESPESA_CATEGORIES,
  DEFAULT_RECEITA_CATEGORY,
  DEFAULT_DESPESA_CATEGORY,
  ALL_CATEGORY_LABELS,
  normalizeReceitaCategoryForForm,
  normalizeDespesaCategoryForForm,
} = require('../constants/financialCategories');

// Função para exibir dashboard financeiro
// GET /financeiro/dashboard
const showDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const payableService = require('../services/payableService');
    await payableService.checkAndNotifyOverduePayables(req.user.condominiumId);

    const dashboardData = await financeiroService.getDashboardStats(req.user.condominiumId, {
      dataInicio: req.query.dataInicio,
      dataFim: req.query.dataFim,
    });
    const consumptionAnalytics = await financeiroService
      .getConsumptionAnalytics(req.user.condominiumId, {
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        consumoBillId: req.query.consumoBillId,
        consumoBillType: req.query.consumoBillType,
      })
      .catch(() => null);
    const billsForConsumptionFilter = await financeiroService
      .listAccounts(req.user.condominiumId, { active: true })
      .catch(() => []);
    const userRoles = req.user.roles || [];
    const criticalItemsData = await criticalItemsService.getCriticalItemsList(
      req.user.condominiumId,
      req.user.id,
      userRoles
    );

    const stats = dashboardData.stats || {};
    const showGettingStarted = (stats.totalEntradas === 0 && stats.totalSaidas === 0) || (typeof stats.totalEntradas !== 'undefined' && stats.totalEntradas === 0);

    const reserveFund = await reserveFundService.getReserveFund(req.user.condominiumId).catch(() => null);

    res.render('administrativo/financeiro/dashboard', {
      title: 'Dashboard Financeiro',
      user: req.user,
      stats,
      kpis: dashboardData.kpis,
      consumptionAnalytics: consumptionAnalytics || null,
      billsForConsumptionFilter: billsForConsumptionFilter || [],
      criticalItems: criticalItemsData.items || [],
      condominiumId: req.user.condominiumId,
      showGettingStarted: !!showGettingStarted,
      reserveFund,
      periodo: stats.periodo || null,
      consumoQuery: {
        consumoBillId: req.query.consumoBillId || '',
        consumoBillType: req.query.consumoBillType || '',
      },
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
    const reopenedOldMonths = await monthlyClosureService.getReopenedMonths(req.user.condominiumId, { excludeCurrentMonth: true });

    res.render('administrativo/financeiro/entradas/form', {
      title: 'Nova Entrada Financeira',
      user: req.user,
      entrada: null,
      costCenters,
      reopenedOldMonths: reopenedOldMonths || [],
      receitaCategories: RECEITA_CATEGORIES,
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
      category: req.body.category || DEFAULT_RECEITA_CATEGORY,
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
      receitaCategories: RECEITA_CATEGORIES,
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
      categoryLabels: ALL_CATEGORY_LABELS,
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
    const reopenedOldMonths = await monthlyClosureService.getReopenedMonths(req.user.condominiumId, { excludeCurrentMonth: true });

    res.render('administrativo/financeiro/saidas/form', {
      title: 'Nova Saída Financeira',
      user: req.user,
      saida: null,
      costCenters,
      bills: bills || [],
      reopenedOldMonths: reopenedOldMonths || [],
      despesaCategories: DESPESA_CATEGORIES,
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
    const files = req.files || {};
    const comprovanteFile = (files.comprovantePagamento && files.comprovantePagamento[0])
      || (files.paymentReceiptPdf && files.paymentReceiptPdf[0])
      || null;
    const notaFiscalFile = (files.notaFiscal && files.notaFiscal[0]) || null;
    const basePath = path.join(__dirname, '../../');

    const data = {
      description: req.body.description,
      amount: req.body.amount,
      exitDate: req.body.exitDate,
      costCenterId: req.body.costCenterId || null,
      category: req.body.category || DEFAULT_DESPESA_CATEGORY,
      billId: req.body.billId || null,
      requiresApproval: req.body.requiresApproval === 'true' || req.body.requiresApproval === true,
      approvalLimit: req.body.approvalLimit || null,
      paymentReceiptPdfPath: comprovanteFile ? path.relative(basePath, comprovanteFile.path).replace(/\\/g, '/') : null,
      invoicePath: notaFiscalFile ? path.relative(basePath, notaFiscalFile.path).replace(/\\/g, '/') : null,
      invoiceFileName: notaFiscalFile ? notaFiscalFile.originalname : null,
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
      despesaCategories: DESPESA_CATEGORIES,
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
      categoryLabels: ALL_CATEGORY_LABELS,
      query: req.query,
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
      returnTo: req.query.returnTo === 'consumo' ? 'consumo' : null,
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

    const account = await financeiroService.createAccount(req.user.condominiumId, req.user.id, data, ipAddress, userAgent);

    if (req.body.returnTo === 'consumo' && account && account.id) {
      return res.redirect(`/financeiro/consumo/novo?billId=${account.id}`);
    }

    res.redirect('/financeiro/contas?success=created');
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId).catch(() => []);
    res.render('administrativo/financeiro/contas/form', {
      title: 'Nova Conta',
      user: req.user,
      conta: req.body,
      costCenters,
      returnTo: req.body.returnTo === 'consumo' ? 'consumo' : null,
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
    const billIdQ = req.query.billId ? parseInt(req.query.billId, 10) : null;
    const selectedBillId =
      billIdQ && !Number.isNaN(billIdQ) && bills.some((b) => b.id === billIdQ) ? billIdQ : null;

    res.render('administrativo/financeiro/consumo/form', {
      title: 'Registrar Consumo Mensal',
      user: req.user,
      consumo: null,
      bills,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
      selectedBillId,
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
    const billIdQ = req.query.billId ? parseInt(req.query.billId, 10) : null;
    const selectedBillId =
      billIdQ && !Number.isNaN(billIdQ) && bills.some((b) => b.id === billIdQ)
        ? billIdQ
        : req.body.billId
          ? parseInt(req.body.billId, 10)
          : null;

    let duplicateEditUrl = null;
    let duplicateListUrl = null;
    if (error.message && error.message.includes('Já existe consumo') && req.body.billId && req.body.month && req.body.year) {
      const bid = parseInt(req.body.billId, 10);
      const mo = parseInt(req.body.month, 10);
      const yr = parseInt(req.body.year, 10);
      const dupId = await financeiroService
        .findConsumptionIdByBillPeriod(req.user.condominiumId, bid, mo, yr)
        .catch(() => null);
      if (dupId) duplicateEditUrl = `/financeiro/consumo/${dupId}/editar`;
      const pad = (n) => String(n).padStart(2, '0');
      const lastD = new Date(yr, mo, 0).getDate();
      duplicateListUrl = `/financeiro/consumo?dataInicio=${yr}-${pad(mo)}-01&dataFim=${yr}-${pad(mo)}-${pad(lastD)}&billId=${bid}`;
    }

    res.render('administrativo/financeiro/consumo/form', {
      title: 'Registrar Consumo Mensal',
      user: req.user,
      consumo: req.body,
      bills,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
      selectedBillId,
      duplicateEditUrl,
      duplicateListUrl,
      error: getErrorMessage(error),
    });
  }
};

// GET /financeiro/consumo/:id/editar
const showEditConsumption = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const row = await financeiroService.getConsumptionById(req.params.id, req.user.condominiumId);
    if (!row) {
      return renderError(res, 404, 'Registro de consumo não encontrado');
    }

    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true });
    const due = row.due_date ? String(row.due_date).slice(0, 10) : '';

    const consumo = {
      billId: row.bill_id,
      month: row.month,
      year: row.year,
      consumptionValue: row.consumption_value,
      consumptionUnit: row.consumption_unit,
      billAmount: row.bill_amount,
      dueDate: due,
    };

    res.render('administrativo/financeiro/consumo/form', {
      title: 'Editar Consumo Mensal',
      user: req.user,
      consumo,
      bills,
      editId: row.id,
      currentMonth: row.month,
      currentYear: row.year,
      selectedBillId: row.bill_id,
    });
  } catch (error) {
    console.error('Erro ao exibir edição de consumo:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// POST /financeiro/consumo/:id
const updateConsumption = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      billId: req.body.billId,
      month: parseInt(req.body.month, 10),
      year: parseInt(req.body.year, 10),
      consumptionValue: req.body.consumptionValue || null,
      consumptionUnit: req.body.consumptionUnit || 'UNIDADE',
      billAmount: req.body.billAmount,
      dueDate: req.body.dueDate || null,
    };

    await financeiroService.updateConsumption(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/consumo?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar consumo:', error);
    const bills = await financeiroService.listAccounts(req.user.condominiumId, { active: true }).catch(() => []);
    const row = await financeiroService.getConsumptionById(req.params.id, req.user.condominiumId).catch(() => null);
    res.render('administrativo/financeiro/consumo/form', {
      title: 'Editar Consumo Mensal',
      user: req.user,
      consumo: req.body,
      bills,
      editId: req.params.id,
      currentMonth: req.body.month ? parseInt(req.body.month, 10) : row?.month,
      currentYear: req.body.year ? parseInt(req.body.year, 10) : row?.year,
      selectedBillId: req.body.billId ? parseInt(req.body.billId, 10) : row?.bill_id,
      error: getErrorMessage(error),
    });
  }
};

// POST /financeiro/consumo/:id/excluir
const deleteConsumption = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await financeiroService.deleteConsumption(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/consumo?success=deleted');
  } catch (error) {
    console.error('Erro ao excluir consumo:', error);
    renderError(res, 500, 'Erro ao excluir consumo', error);
  }
};

// POST /financeiro/api/contas-json — cria conta e retorna JSON (modal consumo)
const createAccountJson = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ ok: false, error: 'Condomínio não associado' });
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

    const account = await financeiroService.createAccount(
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    res.json({
      ok: true,
      account: {
        id: account.id,
        name: account.name,
        bill_type: account.bill_type,
      },
    });
  } catch (error) {
    console.error('Erro ao criar conta (JSON):', error);
    res.status(400).json({ ok: false, error: getErrorMessage(error) });
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
    const entrada = entry ? { ...entry, categoryForSelect: normalizeReceitaCategoryForForm(entry.category) } : entry;

    res.render('administrativo/financeiro/entradas/form', {
      title: 'Editar Entrada Financeira',
      user: req.user,
      entrada,
      costCenters,
      receitaCategories: RECEITA_CATEGORIES,
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
      category: req.body.category || DEFAULT_RECEITA_CATEGORY,
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
    const entrada = entry ? { ...entry, categoryForSelect: normalizeReceitaCategoryForForm(entry.category) } : req.body;
    res.render('administrativo/financeiro/entradas/form', {
      title: 'Editar Entrada Financeira',
      user: req.user,
      entrada,
      costCenters,
      receitaCategories: RECEITA_CATEGORIES,
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
      categoryForSelect: normalizeDespesaCategoryForForm(exit.category),
      billId: exit.bill_id,
      requiresApproval: exit.requires_approval,
      approvalLimit: exit.approval_limit,
      paymentReceiptPdfPath: exit.payment_receipt_pdf_path,
      invoicePath: exit.invoice_path,
      invoiceFileName: exit.invoice_file_name,
    };

    res.render('administrativo/financeiro/saidas/form', {
      title: 'Editar Saída Financeira',
      user: req.user,
      saida: saidaView,
      costCenters,
      bills: bills || [],
      despesaCategories: DESPESA_CATEGORIES,
      query: req.query,
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
      category: req.body.category || DEFAULT_DESPESA_CATEGORY,
      billId: req.body.billId || null,
      requiresApproval: req.body.requiresApproval === 'true' || req.body.requiresApproval === true || req.body.requiresApproval === 'on',
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

    const files = req.files || {};
    const comprovanteFile = (files.comprovantePagamento && files.comprovantePagamento[0])
      || (files.paymentReceiptPdf && files.paymentReceiptPdf[0])
      || null;
    const notaFiscalFile = (files.notaFiscal && files.notaFiscal[0]) || null;
    const hasAttachmentUpdate = !!(comprovanteFile || notaFiscalFile);
    if (hasAttachmentUpdate) {
      const basePath = path.join(__dirname, '../../');
      await financeiroService.updateExitAttachments(
        req.params.id,
        req.user.condominiumId,
        req.user.id,
        {
          ...(comprovanteFile ? { comprovantePagamentoPath: path.relative(basePath, comprovanteFile.path).replace(/\\/g, '/') } : {}),
          ...(notaFiscalFile
            ? {
                notaFiscalPath: path.relative(basePath, notaFiscalFile.path).replace(/\\/g, '/'),
                notaFiscalFileName: notaFiscalFile.originalname,
              }
            : {}),
        },
        ipAddress,
        userAgent
      );
    }

    if (hasAttachmentUpdate) {
      return res.redirect('/financeiro/saidas/' + req.params.id + '/editar?success=attachments_updated');
    }
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
        paymentReceiptPdfPath: req.body.currentComprovantePagamentoPath || null,
        invoicePath: req.body.currentNotaFiscalPath || null,
        invoiceFileName: req.body.currentNotaFiscalFileName || null,
      };

      res.render('administrativo/financeiro/saidas/form', {
        title: 'Editar Saída Financeira',
        user: req.user,
        saida,
        costCenters,
        bills,
        despesaCategories: DESPESA_CATEGORIES,
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

// Função para desfazer pagamento de saída
// POST /financeiro/saidas/:id/desfazer-pagamento
const unpayExit = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const reason = (req.body.reason && String(req.body.reason).trim())
      ? String(req.body.reason).trim()
      : 'Desfazer pagamento solicitado na listagem de despesas';

    await financeiroService.unmarkExitAsPaid(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      reason,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/saidas?success=unpaid');
  } catch (error) {
    console.error('Erro ao desfazer pagamento da saída:', error);
    try {
      const exits = await financeiroService.listExits(req.user.condominiumId, { limit: 1000 }).catch(() => []);
      const exit = exits.find(e => e.id === parseInt(req.params.id, 10)) || null;

      res.render('administrativo/financeiro/saidas/desfazer-pagamento', {
        title: 'Desfazer pagamento da saída',
        user: req.user,
        saida: exit,
        error: getErrorMessage(error),
      });
    } catch (innerError) {
      console.error('Erro adicional ao carregar saída para desfazer pagamento:', innerError);
      renderError(res, 500, 'Erro ao desfazer pagamento da saída', error);
    }
  }
};

// Função para excluir saída financeira
// POST /financeiro/saidas/:id/excluir
const deleteExit = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const reason = (req.body.reason && String(req.body.reason).trim())
      ? String(req.body.reason).trim()
      : 'Exclusão manual realizada na listagem de despesas';

    await financeiroService.deleteExit(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      reason,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/saidas?success=deleted');
  } catch (error) {
    console.error('Erro ao excluir saída:', error);
    res.redirect('/financeiro/saidas?error=' + encodeURIComponent(getErrorMessage(error)));
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
    const reopenedOldMonths = await monthlyClosureService.getReopenedMonths(req.user.condominiumId, { excludeCurrentMonth: true });

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
      reopenedOldMonths,
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
  deleteExit,
  showCreateAccount,
  createAccount,
  listAccounts,
  showEditAccount,
  updateAccount,
  showCreateConsumption,
  createConsumption,
  showEditConsumption,
  updateConsumption,
  deleteConsumption,
  createAccountJson,
  showFechamentoMensal,
  closeFechamentoMensal,
  reopenFechamentoMensal,
};

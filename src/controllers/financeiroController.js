// Controller do módulo FINANCEIRO
// Gerencia requisições do painel financeiro
// SEPARADO do ADMINISTRATIVO conforme regras do sistema

const financeiroService = require('../services/financeiroService'); // Service do módulo financeiro

// Função para exibir dashboard financeiro
// GET /financeiro/dashboard
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
// GET /financeiro/entradas
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
// GET /financeiro/entradas/nova
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
// POST /financeiro/entradas
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

    res.redirect('/financeiro/entradas?success=created');
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
// POST /financeiro/entradas/:id/receber
const marcarEntradaRecebida = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await financeiroService.markEntryAsReceived(req.params.id, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/financeiro/entradas?success=received');
  } catch (error) {
    console.error('Erro ao marcar entrada como recebida:', error);
    res.redirect('/financeiro/entradas?error=' + encodeURIComponent(error.message));
  }
};

// Função para listar saídas financeiras
// GET /financeiro/saidas
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
// GET /financeiro/saidas/nova
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
// POST /financeiro/saidas
// REGRA: Financeiro cria despesa, mas apenas SINDICO/SUBSINDICO aprova
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

    res.redirect('/financeiro/saidas?success=created');
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
// POST /financeiro/saidas/:id/pagar
// REGRA: Só pode pagar se estiver aprovada (aprovada por SINDICO/SUBSINDICO)
const marcarSaidaPaga = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await financeiroService.markExitAsPaid(req.params.id, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/financeiro/saidas?success=paid');
  } catch (error) {
    console.error('Erro ao marcar saída como paga:', error);
    res.redirect('/financeiro/saidas?error=' + encodeURIComponent(error.message));
  }
};

// Função para listar contas (bills)
// GET /financeiro/contas
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
// GET /financeiro/contas/nova
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
// POST /financeiro/contas
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

    res.redirect('/financeiro/contas?success=created');
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
// GET /financeiro/centros-custo
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
// GET /financeiro/centros-custo/novo
const showCreateCentroCusto = (req, res) => {
  res.render('administrativo/financeiro/centros-custo/form', {
    title: 'Novo Centro de Custo',
    user: req.user,
    centroCusto: null,
  });
};

// Função para processar criação de centro de custo
// POST /financeiro/centros-custo
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

    res.redirect('/financeiro/centros-custo?success=created');
  } catch (error) {
    res.render('administrativo/financeiro/centros-custo/form', {
      title: 'Novo Centro de Custo',
      user: req.user,
      centroCusto: req.body,
      error: error.message,
    });
  }
};

// Exporta funções para uso nas rotas
module.exports = {
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

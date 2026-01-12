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
    const kpis = await financeiroService.getFinancialKPIs(req.user.condominiumId);
    const bills = await financeiroService.listBills(req.user.condominiumId);

    res.render('administrativo/financeiro/dashboard', {
      title: 'Dashboard Financeiro',
      user: req.user,
      stats: stats,
      kpis: kpis,
      bills: bills,
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
      isRecurring: req.body.isRecurring,
      recurrenceType: req.body.recurrenceType || 'UNIQUE',
      isVariable: req.body.isVariable,
      averageAmount: req.body.averageAmount || null,
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

// Função para exibir formulário de recebimento
// GET /financeiro/entradas/:id/receber
const showMarcarEntradaRecebida = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);

    if (entry.received) {
      return res.redirect('/financeiro/entradas?error=' + encodeURIComponent('Entrada já foi marcada como recebida'));
    }

    res.render('administrativo/financeiro/entradas/receber', {
      title: 'Marcar como Recebido',
      user: req.user,
      entry: entry,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de recebimento:', error);
    res.redirect('/financeiro/entradas?error=' + encodeURIComponent(error.message));
  }
};

// Função para visualizar comprovante PDF
// GET /financeiro/entradas/:id/comprovante
const verComprovante = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);

    if (!entry.received || !entry.receipt_pdf_path) {
      return res.status(404).send('Comprovante não encontrado');
    }

    // Redireciona para o arquivo estático (servido via express.static)
    res.redirect('/' + entry.receipt_pdf_path);
  } catch (error) {
    console.error('Erro ao visualizar comprovante:', error);
    res.status(500).send('Erro ao carregar comprovante');
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

    // Prepara dados do recebimento
    const path = require('path');
    let receiptPdfPath = null;
    if (req.file) {
      receiptPdfPath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');
    }

    const receiptData = {
      receiptPdfPath: receiptPdfPath,
      receiptDetails: req.body.receiptDetails || null,
      receiptMethod: req.body.receiptMethod || null,
      receiptNotes: req.body.receiptNotes || null,
    };

    await financeiroService.markEntryAsReceived(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      receiptData,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/entradas?success=received');
  } catch (error) {
    console.error('Erro ao marcar entrada como recebida:', error);
    
    try {
      const entry = await financeiroService.getEntryById(req.params.id, req.user.condominiumId);
      res.render('administrativo/financeiro/entradas/receber', {
        title: 'Marcar como Recebido',
        user: req.user,
        entry: entry,
        error: error.message,
        formData: req.body,
      });
    } catch (renderError) {
      res.redirect('/financeiro/entradas?error=' + encodeURIComponent(error.message));
    }
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
      isRecurring: req.body.isRecurring,
      recurrenceType: req.body.recurrenceType || 'UNIQUE',
      isVariable: req.body.isVariable,
      averageAmount: req.body.averageAmount || null,
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

// Função para exibir formulário de pagamento
// GET /financeiro/saidas/:id/pagar
const showMarcarSaidaPaga = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const exit = await financeiroService.getExitById(req.params.id, req.user.condominiumId);

    if (exit.payment_status !== 'APPROVED') {
      return res.redirect('/financeiro/saidas?error=' + encodeURIComponent('Saída deve estar aprovada antes de ser paga'));
    }

    if (exit.payment_status === 'PAID') {
      return res.redirect('/financeiro/saidas?error=' + encodeURIComponent('Saída já foi marcada como paga'));
    }

    res.render('administrativo/financeiro/saidas/pagar', {
      title: 'Marcar como Paga',
      user: req.user,
      exit: exit,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário de pagamento:', error);
    res.redirect('/financeiro/saidas?error=' + encodeURIComponent(error.message));
  }
};

// Função para visualizar comprovante de pagamento PDF
// GET /financeiro/saidas/:id/comprovante
const verComprovantePagamento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const exit = await financeiroService.getExitById(req.params.id, req.user.condominiumId);

    if (exit.payment_status !== 'PAID' || !exit.payment_receipt_pdf_path) {
      return res.status(404).send('Comprovante não encontrado');
    }

    res.redirect('/' + exit.payment_receipt_pdf_path);
  } catch (error) {
    console.error('Erro ao visualizar comprovante de pagamento:', error);
    res.status(500).send('Erro ao carregar comprovante');
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

    // Prepara dados do pagamento
    const path = require('path');
    let paymentReceiptPdfPath = null;
    if (req.file) {
      paymentReceiptPdfPath = path.relative(path.join(__dirname, '../../'), req.file.path).replace(/\\/g, '/');
    }

    const paymentData = {
      paymentReceiptPdfPath: paymentReceiptPdfPath,
      paymentDetails: req.body.paymentDetails || null,
      paymentMethod: req.body.paymentMethod || null,
      paymentNotes: req.body.paymentNotes || null,
    };

    await financeiroService.markExitAsPaid(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      paymentData,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/saidas?success=paid');
  } catch (error) {
    console.error('Erro ao marcar saída como paga:', error);
    
    try {
      const exit = await financeiroService.getExitById(req.params.id, req.user.condominiumId);
      res.render('administrativo/financeiro/saidas/pagar', {
        title: 'Marcar como Paga',
        user: req.user,
        exit: exit,
        error: error.message,
        formData: req.body,
      });
    } catch (renderError) {
      res.redirect('/financeiro/saidas?error=' + encodeURIComponent(error.message));
    }
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

// Função para listar consumo mensal
// GET /financeiro/consumo
const showConsumo = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      year: req.query.year ? parseInt(req.query.year) : new Date().getFullYear(),
      month: req.query.month ? parseInt(req.query.month) : undefined,
      billId: req.query.billId ? parseInt(req.query.billId) : undefined,
    };

    const consumption = await financeiroService.listMonthlyConsumption(req.user.condominiumId, filters);
    const bills = await financeiroService.listBills(req.user.condominiumId);

    res.render('administrativo/financeiro/consumo/list', {
      title: 'Consumo Mensal',
      user: req.user,
      consumption: consumption,
      bills: bills,
      filters: filters,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar consumo:', error);
    res.status(500).send('Erro ao carregar consumo');
  }
};

// Função para exibir formulário de registro de consumo
// GET /financeiro/consumo/novo
const showCreateConsumo = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const bills = await financeiroService.listBills(req.user.condominiumId);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    res.render('administrativo/financeiro/consumo/form', {
      title: 'Registrar Consumo Mensal',
      user: req.user,
      consumo: null,
      bills: bills,
      currentMonth: currentMonth,
      currentYear: currentYear,
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
};

// Função para processar registro de consumo
// POST /financeiro/consumo
const createConsumo = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      billId: parseInt(req.body.billId),
      month: parseInt(req.body.month),
      year: parseInt(req.body.year),
      consumptionValue: req.body.consumptionValue ? parseFloat(req.body.consumptionValue) : null,
      consumptionUnit: req.body.consumptionUnit || 'UNIDADE',
      billAmount: parseFloat(req.body.billAmount),
      dueDate: req.body.dueDate || null,
    };

    await financeiroService.createMonthlyConsumption(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/financeiro/consumo?success=created');
  } catch (error) {
    try {
      const bills = await financeiroService.listBills(req.user.condominiumId);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      res.render('administrativo/financeiro/consumo/form', {
        title: 'Registrar Consumo Mensal',
        user: req.user,
        consumo: req.body,
        bills: bills,
        currentMonth: currentMonth,
        currentYear: currentYear,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar registro de consumo');
    }
  }
};

// Exporta funções para uso nas rotas
// Função para obter comparação de consumo (API)
// GET /financeiro/api/consumption-comparison
const getConsumptionComparison = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está associado a um condomínio' });
    }

    const data = await financeiroService.getConsumptionComparison(req.user.condominiumId);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar comparação de consumo:', error);
    res.status(500).json({ error: 'Erro ao carregar dados de comparação' });
  }
};

// Função para obter projeções financeiras (API)
// GET /financeiro/api/projections
const getFinancialProjections = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está associado a um condomínio' });
    }

    const monthsAhead = parseInt(req.query.months) || 3;
    const data = await financeiroService.getFinancialProjections(req.user.condominiumId, monthsAhead);
    res.json(data);
  } catch (error) {
    console.error('Erro ao calcular projeções:', error);
    res.status(500).json({ error: 'Erro ao calcular projeções' });
  }
};

module.exports = {
  showFinanceiroDashboard,
  showEntradas,
  showCreateEntrada,
  createEntrada,
  showMarcarEntradaRecebida,
  marcarEntradaRecebida,
  verComprovante,
  showSaidas,
  showCreateSaida,
  createSaida,
  showMarcarSaidaPaga,
  marcarSaidaPaga,
  verComprovantePagamento,
  showContas,
  showCreateConta,
  createConta,
  showCentrosCusto,
  showCreateCentroCusto,
  createCentroCusto,
  showConsumo,
  showCreateConsumo,
  createConsumo,
  getConsumptionComparison,
  getFinancialProjections,
};

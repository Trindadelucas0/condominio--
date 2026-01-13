// Rotas do módulo FINANCEIRO
// Gerencia requisições do painel financeiro

const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil FINANCEIRO
router.use(authorize('FINANCEIRO'));

// Dashboard
router.get('/dashboard', financeiroController.showDashboard);

// Entradas
router.get('/entradas/nova', financeiroController.showCreateEntry);
router.get('/entradas/:id/editar', financeiroController.showEditEntry);
// Rota de exclusão deve vir ANTES da rota genérica /:id para evitar conflito
router.post('/entradas/:id/excluir', financeiroController.deleteEntry);
// Rota de atualização
router.post('/entradas/:id', financeiroController.updateEntry);
router.post('/entradas', financeiroController.createEntry);
router.get('/entradas', financeiroController.listEntries);

// Saídas
router.get('/saidas/nova', financeiroController.showCreateExit);
router.post('/saidas', financeiroController.createExit);
router.get('/saidas', financeiroController.listExits);

// Contas
router.get('/contas/nova', financeiroController.showCreateAccount);
router.post('/contas', financeiroController.createAccount);
router.get('/contas', financeiroController.listAccounts);

// Consumo
router.get('/consumo/novo', financeiroController.showCreateConsumption);
router.post('/consumo', financeiroController.createConsumption);

// Centros de Custo
router.get('/centros-custo', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const financeiroService = require('../services/financeiroService');
    const costCenters = await financeiroService.listCostCenters(req.user.condominiumId);
    res.render('administrativo/financeiro/centros-custo/list', {
      title: 'Centros de Custo',
      user: req.user,
      costCenters: costCenters || [],
    });
  } catch (error) {
    console.error('Erro ao listar centros de custo:', error);
    res.status(500).send('Erro ao carregar centros de custo');
  }
});

router.get('/centros-custo/novo', async (req, res) => {
  try {
    res.render('administrativo/financeiro/centros-custo/form', {
      title: 'Novo Centro de Custo',
      user: req.user,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de centro de custo:', error);
    res.status(500).send('Erro ao carregar formulário');
  }
});

router.post('/centros-custo', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const financeiroService = require('../services/financeiroService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      description: req.body.description || null,
      active: req.body.active !== undefined ? req.body.active : true,
    };

    await financeiroService.createCostCenter(
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    res.redirect('/financeiro/centros-custo?success=created');
  } catch (error) {
    console.error('Erro ao criar centro de custo:', error);
    res.render('administrativo/financeiro/centros-custo/form', {
      title: 'Novo Centro de Custo',
      user: req.user,
      centroCusto: req.body,
      error: error.message,
    });
  }
});

// Entradas rejeitadas (para corrigir)
router.get('/entradas-rejeitadas', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const financeiroService = require('../services/financeiroService');
    const entries = await financeiroService.listRejectedEntries(req.user.condominiumId);
    res.render('financeiro/entradas-rejeitadas', {
      title: 'Entradas Rejeitadas',
      user: req.user,
      entries: entries,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar entradas rejeitadas:', error);
    res.status(500).send('Erro ao carregar entradas');
  }
});

// Orçamentos aguardando análise do financeiro
router.get('/orcamentos-pendentes', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const orcamentoService = require('../services/orcamentoService');
    const budgets = await orcamentoService.listBudgetRequestsByStatus(req.user.condominiumId, 'PENDING_FINANCEIRO');
    res.render('financeiro/orcamentos-pendentes', {
      title: 'Orçamentos Aguardando Análise',
      user: req.user,
      budgets: budgets,
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos pendentes:', error);
    res.status(500).send('Erro ao carregar orçamentos');
  }
});

// Revisar orçamento (financeiro)
router.post('/orcamentos/:id/revisar', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const orcamentoService = require('../services/orcamentoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await orcamentoService.reviewByFinanceiro(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      {
        financeiroNotes: req.body.financeiroNotes,
        costCenterId: req.body.costCenterId,
      },
      ipAddress,
      userAgent
    );
    res.redirect('/financeiro/orcamentos-pendentes?success=reviewed');
  } catch (error) {
    console.error('Erro ao revisar orçamento:', error);
    res.redirect('/financeiro/orcamentos-pendentes?error=' + encodeURIComponent(error.message));
  }
});

// Orçamentos aprovados (para liberar)
router.get('/orcamentos-aprovados', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const orcamentoService = require('../services/orcamentoService');
    const budgets = await orcamentoService.listBudgetRequestsByStatus(req.user.condominiumId, 'APPROVED');
    res.render('financeiro/orcamentos-aprovados', {
      title: 'Orçamentos Aprovados',
      user: req.user,
      budgets: budgets,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos aprovados:', error);
    res.status(500).send('Erro ao carregar orçamentos');
  }
});

// Liberar ou retornar orçamento (financeiro)
router.post('/orcamentos/:id/:action', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const { action } = req.params; // 'liberar' ou 'retornar'
    if (action !== 'liberar' && action !== 'retornar') {
      return res.status(400).send('Ação inválida');
    }
    const orcamentoService = require('../services/orcamentoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await orcamentoService.releaseOrReturnByFinanceiro(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      action === 'liberar' ? 'RELEASE' : 'RETURN',
      req.body.financeiroNotes,
      ipAddress,
      userAgent
    );
    const redirectPath = action === 'liberar' 
      ? '/financeiro/orcamentos-aprovados?success=released'
      : '/financeiro/orcamentos-aprovados?success=returned';
    res.redirect(redirectPath);
  } catch (error) {
    console.error('Erro ao liberar/retornar orçamento:', error);
    res.redirect('/financeiro/orcamentos-aprovados?error=' + encodeURIComponent(error.message));
  }
});

module.exports = router;

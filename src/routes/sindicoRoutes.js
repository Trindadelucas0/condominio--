// Rotas do módulo SÍNDICO
// Gerencia requisições do painel do síndico

const express = require('express');
const router = express.Router();
const sindicoController = require('../controllers/sindicoController');
const checklistModelController = require('../controllers/checklistModelController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil SINDICO ou SUBSINDICO
router.use(authorize('SINDICO', 'SUBSINDICO'));

// Dashboard
router.get('/dashboard', sindicoController.showDashboard);

// Aprovações
router.get('/aprovacoes', sindicoController.showAprovacoes);
router.post('/aprovacoes/:id/processar', sindicoController.processAprovacao);

// Alertas
router.get('/alertas', sindicoController.showAlertas);
router.post('/alertas/:id/resolver', sindicoController.resolverAlerta);

// Logs
router.get('/logs', sindicoController.showLogs);

// Tarefas
router.get('/tarefas', sindicoController.showTarefas);
router.get('/tarefas/:id', sindicoController.showTask);
router.post('/tarefas/:id/observacao', sindicoController.addTaskObservation);

// Ocorrências
router.get('/ocorrencias', sindicoController.showOcorrencias);
router.get('/ocorrencias/:id', sindicoController.showOccurrence);
router.post('/ocorrencias/:id/observacao', sindicoController.addOccurrenceObservation);

// Modelos de Checklist (Síndico cria regras)
router.get('/checklist-modelos', checklistModelController.showModels);
router.get('/checklist-modelos/novo', checklistModelController.showCreateModel);
router.post('/checklist-modelos', checklistModelController.createModel);
router.get('/checklist-modelos/:id/editar', checklistModelController.showEditModel);
router.post('/checklist-modelos/:id', checklistModelController.updateModel);
router.post('/checklist-modelos/:id/toggle', checklistModelController.toggleModel);

// Manutenções
const manutencaoController = require('../controllers/manutencaoController');
router.get('/manutencoes', manutencaoController.listManutencoes);
router.get('/manutencoes/novo', manutencaoController.showCreateManutencao);
router.post('/manutencoes', manutencaoController.createManutencao);
router.get('/manutencoes/:id', manutencaoController.showManutencao);

// Aprovação de entradas financeiras
const financeiroService = require('../services/financeiroService');
router.get('/entradas-pendentes', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const entries = await financeiroService.listPendingEntries(req.user.condominiumId);
    res.render('sindico/entradas-pendentes', {
      title: 'Entradas Aguardando Análise',
      user: req.user,
      entries: entries,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar entradas pendentes:', error);
    res.status(500).send('Erro ao carregar entradas');
  }
});
router.post('/entradas/:id/aprovar', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await financeiroService.approveEntry(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      req.body.reviewNotes,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/entradas-pendentes?success=approved');
  } catch (error) {
    console.error('Erro ao aprovar entrada:', error);
    res.redirect('/sindico/entradas-pendentes?error=' + encodeURIComponent(error.message));
  }
});
router.post('/entradas/:id/rejeitar', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await financeiroService.rejectEntry(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      req.body.rejectionReason,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/entradas-pendentes?success=rejected');
  } catch (error) {
    console.error('Erro ao rejeitar entrada:', error);
    res.redirect('/sindico/entradas-pendentes?error=' + encodeURIComponent(error.message));
  }
});

// Aprovação de ocorrências
router.get('/ocorrencias-pendentes-aprovacao', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const sindicoService = require('../services/sindicoService');
    const occurrences = await sindicoService.listPendingOccurrencesForApproval(req.user.condominiumId, req.user.id);
    res.render('sindico/ocorrencias-aprovacao', {
      title: 'Ocorrências Aguardando Aprovação',
      user: req.user,
      occurrences: occurrences,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências pendentes:', error);
    res.status(500).send('Erro ao carregar ocorrências');
  }
});
router.post('/ocorrencias/:id/aprovar', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const sindicoService = require('../services/sindicoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await sindicoService.approveOccurrence(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?success=approved');
  } catch (error) {
    console.error('Erro ao aprovar ocorrência:', error);
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?error=' + encodeURIComponent(error.message));
  }
});
router.post('/ocorrencias/:id/rejeitar', async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const sindicoService = require('../services/sindicoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await sindicoService.rejectOccurrence(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      req.body.rejectionReason,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?success=rejected');
  } catch (error) {
    console.error('Erro ao rejeitar ocorrência:', error);
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?error=' + encodeURIComponent(error.message));
  }
});

module.exports = router;

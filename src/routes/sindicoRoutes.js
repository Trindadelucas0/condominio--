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

module.exports = router;

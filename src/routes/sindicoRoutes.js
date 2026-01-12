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
router.use(authorize(['SINDICO', 'SUBSINDICO']));

// Dashboard
router.get('/dashboard', sindicoController.showDashboard);

// Aprovações
router.get('/aprovacoes', sindicoController.showAprovacoes);

// Modelos de Checklist (Síndico cria regras)
router.get('/checklist-modelos', checklistModelController.showModels);
router.get('/checklist-modelos/novo', checklistModelController.showCreateModel);
router.post('/checklist-modelos', checklistModelController.createModel);
router.get('/checklist-modelos/:id/editar', checklistModelController.showEditModel);
router.post('/checklist-modelos/:id', checklistModelController.updateModel);
router.post('/checklist-modelos/:id/toggle', checklistModelController.toggleModel);

module.exports = router;

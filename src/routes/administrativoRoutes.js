// Rotas do módulo ADMINISTRATIVO

const express = require('express');
const router = express.Router();
const administrativoController = require('../controllers/administrativoController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.use(authorize('ADMINISTRATIVO'));

router.get('/dashboard', administrativoController.showDashboard);
router.get('/tarefas', administrativoController.showTarefas);
router.get('/tarefas/nova', administrativoController.showCreateTarefa);
router.post('/tarefas', administrativoController.createTarefa);
router.get('/documentos', administrativoController.showDocumentos);
router.get('/documentos/novo', administrativoController.showCreateDocumento);
router.post('/documentos', administrativoController.createDocumento);
router.get('/documentos/:id/editar', administrativoController.showEditDocumento);
router.post('/documentos/:id', administrativoController.updateDocumento);

// REGRA: Rotas financeiras e patrimoniais foram MOVIDAS para módulos separados
// Financeiro: /financeiro/* (requer role FINANCEIRO)
// Patrimônio: /patrimonio/* (requer role PATRIMONIO)
// ADMINISTRATIVO NÃO tem mais acesso direto a essas funcionalidades

module.exports = router;

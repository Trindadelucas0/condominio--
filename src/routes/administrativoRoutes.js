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

// Rotas Financeiras
router.get('/financeiro/dashboard', administrativoController.showFinanceiroDashboard);
router.get('/financeiro/entradas', administrativoController.showEntradas);
router.get('/financeiro/entradas/nova', administrativoController.showCreateEntrada);
router.post('/financeiro/entradas', administrativoController.createEntrada);
router.post('/financeiro/entradas/:id/receber', administrativoController.marcarEntradaRecebida);
router.get('/financeiro/saidas', administrativoController.showSaidas);
router.get('/financeiro/saidas/nova', administrativoController.showCreateSaida);
router.post('/financeiro/saidas', administrativoController.createSaida);
router.post('/financeiro/saidas/:id/pagar', administrativoController.marcarSaidaPaga);
router.get('/financeiro/contas', administrativoController.showContas);
router.get('/financeiro/contas/nova', administrativoController.showCreateConta);
router.post('/financeiro/contas', administrativoController.createConta);
router.get('/financeiro/centros-custo', administrativoController.showCentrosCusto);
router.get('/financeiro/centros-custo/novo', administrativoController.showCreateCentroCusto);
router.post('/financeiro/centros-custo', administrativoController.createCentroCusto);

module.exports = router;

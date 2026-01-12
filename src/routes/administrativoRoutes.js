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

// Rotas Patrimoniais
router.get('/patrimonio/dashboard', administrativoController.showPatrimonioDashboard);
router.get('/patrimonio/ativos', administrativoController.showAtivos);
router.get('/patrimonio/ativos/novo', administrativoController.showCreateAtivo);
router.post('/patrimonio/ativos', administrativoController.createAtivo);
router.get('/patrimonio/ativos/:id', administrativoController.showAtivo);
router.get('/patrimonio/ativos/:id/editar', administrativoController.showEditAtivo);
router.post('/patrimonio/ativos/:id', administrativoController.updateAtivo);
router.get('/patrimonio/ativos/:id/manutencao/nova', administrativoController.showCreateManutencao);
router.post('/patrimonio/ativos/:id/manutencao', administrativoController.createManutencao);
router.post('/patrimonio/ativos/:id/calcular-depreciacao', administrativoController.calculateDepreciation);

module.exports = router;

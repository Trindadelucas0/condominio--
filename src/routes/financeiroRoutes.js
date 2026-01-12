// Rotas do módulo FINANCEIRO
// SEPARADO do ADMINISTRATIVO conforme regras do sistema
// Apenas usuários com role FINANCEIRO podem acessar

const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const reaberturaController = require('../controllers/reaberturaController');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadReceipt, uploadPayment } = require('../middlewares/upload');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil FINANCEIRO
router.use(authorize('FINANCEIRO'));

// Dashboard
router.get('/dashboard', financeiroController.showFinanceiroDashboard);

// Rotas de Entradas
router.get('/entradas', financeiroController.showEntradas);
router.get('/entradas/nova', financeiroController.showCreateEntrada);
router.post('/entradas', financeiroController.createEntrada);
router.get('/entradas/:id/receber', financeiroController.showMarcarEntradaRecebida);
router.post('/entradas/:id/receber', uploadReceipt, financeiroController.marcarEntradaRecebida);
router.get('/entradas/:id/comprovante', financeiroController.verComprovante);

// Rotas de Saídas
router.get('/saidas', financeiroController.showSaidas);
router.get('/saidas/nova', financeiroController.showCreateSaida);
router.post('/saidas', financeiroController.createSaida);
router.get('/saidas/:id/pagar', financeiroController.showMarcarSaidaPaga);
router.post('/saidas/:id/pagar', uploadPayment, financeiroController.marcarSaidaPaga);
router.get('/saidas/:id/comprovante', financeiroController.verComprovantePagamento);

// Rotas de Contas (Bills)
router.get('/contas', financeiroController.showContas);
router.get('/contas/nova', financeiroController.showCreateConta);
router.post('/contas', financeiroController.createConta);

// Rotas de Centros de Custo
router.get('/centros-custo', financeiroController.showCentrosCusto);
router.get('/centros-custo/novo', financeiroController.showCreateCentroCusto);
router.post('/centros-custo', financeiroController.createCentroCusto);

// Rotas de Consumo Mensal
router.get('/consumo', financeiroController.showConsumo);
router.get('/consumo/novo', financeiroController.showCreateConsumo);
router.post('/consumo', financeiroController.createConsumo);

// Rotas de API para gráficos e projeções
router.get('/api/consumption-comparison', financeiroController.getConsumptionComparison);
router.get('/api/projections', financeiroController.getFinancialProjections);

// Reabertura de despesas rejeitadas
router.get('/saidas/:id/reabrir', reaberturaController.showReopenExpense);
router.post('/saidas/:id/reabrir', reaberturaController.reopenExpense);

module.exports = router;

// Rotas do módulo FINANCEIRO
// SEPARADO do ADMINISTRATIVO conforme regras do sistema
// Apenas usuários com role FINANCEIRO podem acessar

const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const { authenticate, authorize } = require('../middlewares/auth');

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
router.post('/entradas/:id/receber', financeiroController.marcarEntradaRecebida);

// Rotas de Saídas
router.get('/saidas', financeiroController.showSaidas);
router.get('/saidas/nova', financeiroController.showCreateSaida);
router.post('/saidas', financeiroController.createSaida);
router.post('/saidas/:id/pagar', financeiroController.marcarSaidaPaga);

// Rotas de Contas (Bills)
router.get('/contas', financeiroController.showContas);
router.get('/contas/nova', financeiroController.showCreateConta);
router.post('/contas', financeiroController.createConta);

// Rotas de Centros de Custo
router.get('/centros-custo', financeiroController.showCentrosCusto);
router.get('/centros-custo/novo', financeiroController.showCreateCentroCusto);
router.post('/centros-custo', financeiroController.createCentroCusto);

module.exports = router;

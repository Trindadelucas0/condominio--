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

module.exports = router;

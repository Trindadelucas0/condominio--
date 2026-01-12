// Rotas do módulo ADMINISTRATIVO
// Gerencia requisições do painel administrativo

const express = require('express');
const router = express.Router();
const administrativoController = require('../controllers/administrativoController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil ADMINISTRATIVO
router.use(authorize('ADMINISTRATIVO'));

// Dashboard
router.get('/dashboard', administrativoController.showDashboard);

module.exports = router;

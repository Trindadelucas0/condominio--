// Rotas do módulo SINDICO/SUBSINDICO
// Todas as rotas exigem autenticação e perfil SINDICO ou SUBSINDICO

const express = require('express');
const router = express.Router();
const sindicoController = require('../controllers/sindicoController');
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

// Exporta roteador
module.exports = router;

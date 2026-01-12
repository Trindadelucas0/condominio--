// Rotas do módulo PATRIMONIO
// SEPARADO do ADMINISTRATIVO conforme regras do sistema
// Apenas usuários com role PATRIMONIO podem acessar

const express = require('express');
const router = express.Router();
const patrimonioController = require('../controllers/patrimonioController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil PATRIMONIO
router.use(authorize('PATRIMONIO'));

// Dashboard
router.get('/dashboard', patrimonioController.showPatrimonioDashboard);

// Rotas de Ativos
router.get('/ativos', patrimonioController.showAtivos);
router.get('/ativos/novo', patrimonioController.showCreateAtivo);
router.post('/ativos', patrimonioController.createAtivo);
router.get('/ativos/:id', patrimonioController.showAtivo);
router.get('/ativos/:id/editar', patrimonioController.showEditAtivo);
router.post('/ativos/:id', patrimonioController.updateAtivo);

// Rotas de Manutenções
router.get('/ativos/:id/manutencao/nova', patrimonioController.showCreateManutencao);
router.post('/ativos/:id/manutencao', patrimonioController.createManutencao);

// Rotas de Depreciação
router.post('/ativos/:id/calcular-depreciacao', patrimonioController.calculateDepreciation);

module.exports = router;

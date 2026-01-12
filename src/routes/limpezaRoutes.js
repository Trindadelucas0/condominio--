// Rotas do módulo LIMPEZA
// Gerencia ocorrências específicas da equipe de limpeza
// REGRA: LIMPEZA pode reportar, mas problemas técnicos viram ocorrências de ZELADORIA automaticamente

const express = require('express');
const router = express.Router();
const limpezaController = require('../controllers/limpezaController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil LIMPEZA
router.use(authorize('LIMPEZA'));

// Dashboard
router.get('/dashboard', limpezaController.showDashboard);

// Ocorrências de limpeza
router.get('/ocorrencias', limpezaController.showOccurrences);
router.get('/ocorrencias/nova', limpezaController.showCreateOccurrence);
router.post('/ocorrencias', limpezaController.createOccurrence);
router.get('/ocorrencias/:id', limpezaController.showOccurrence);

// Checklist (compartilha com operacional, mas com restrições)
// LIMPEZA pode executar checklists de limpeza, mas não pode criar ocorrências de zeladoria
// Isso já está implementado no operacionalRoutes com o middleware blockLimpezaFromOccurrences

module.exports = router;

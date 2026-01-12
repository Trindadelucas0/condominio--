// Rotas do módulo OPERACIONAL
// REGRA: OPERACIONAL e LIMPEZA compartilham rotas, mas LIMPEZA tem restrições

const express = require('express');
const router = express.Router();
const operacionalController = require('../controllers/operacionalController');
const { authenticate, authorize } = require('../middlewares/auth');
const { blockLimpezaFromOccurrences } = require('../middlewares/checkRole');

router.use(authenticate);
// OPERACIONAL e LIMPEZA compartilham as mesmas rotas (LIMPEZA é subset operacional)
router.use(authorize('OPERACIONAL', 'LIMPEZA'));

router.get('/dashboard', operacionalController.showDashboard);
router.get('/checklist', operacionalController.showChecklist);
router.get('/tarefas/:id', operacionalController.showTask);
router.post('/checklist/:id/atualizar', operacionalController.updateChecklistItem);
router.post('/tarefas/:id/finalizar', operacionalController.completeTask);
// REGRA: LIMPEZA NÃO pode criar ocorrências (apenas OPERACIONAL pode)
router.get('/ocorrencias', operacionalController.showOcorrencias);
router.get('/ocorrencias/nova', blockLimpezaFromOccurrences, operacionalController.showCreateOcorrencia);
router.post('/ocorrencias', blockLimpezaFromOccurrences, operacionalController.createOcorrencia);

module.exports = router;

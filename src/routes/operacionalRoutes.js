// Rotas do módulo OPERACIONAL

const express = require('express');
const router = express.Router();
const operacionalController = require('../controllers/operacionalController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.use(authorize('OPERACIONAL'));

router.get('/dashboard', operacionalController.showDashboard);
router.get('/checklist', operacionalController.showChecklist);
router.get('/tarefas/:id', operacionalController.showTask);
router.post('/checklist/:id/atualizar', operacionalController.updateChecklistItem);
router.post('/tarefas/:id/finalizar', operacionalController.completeTask);
router.get('/ocorrencias', operacionalController.showOcorrencias);
router.get('/ocorrencias/nova', operacionalController.showCreateOcorrencia);
router.post('/ocorrencias', operacionalController.createOcorrencia);

module.exports = router;

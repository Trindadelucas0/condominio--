// Rotas do módulo OPERACIONAL
// Gerencia requisições do painel operacional (zeladoria)

const express = require('express');
const router = express.Router();
const operacionalController = require('../controllers/operacionalController');
const dailyChecklistController = require('../controllers/dailyChecklistController');
const { authenticate, authorize } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil OPERACIONAL
router.use(authorize('OPERACIONAL'));

// Dashboard
router.get('/dashboard', operacionalController.showDashboard);

// Checklists diários (novos - baseados em regras)
router.get('/checklists-diarios', dailyChecklistController.showDailyChecklists);
router.get('/checklists-diarios/:id', dailyChecklistController.showChecklist);
router.post('/checklists-diarios/:id/iniciar', dailyChecklistController.startChecklist);
router.post('/checklists-diarios/:checklistId/items/:itemId', dailyChecklistController.updateItem);
router.post('/checklists-diarios/:id/finalizar', dailyChecklistController.completeChecklist);

// Upload de evidências (fotos)
const storageEvidence = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/checklists';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'evidence_' + req.params.id + '_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadEvidence = multer({
  storage: storageEvidence,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

router.post('/checklists-diarios/:id/evidencias', uploadEvidence.single('evidence'), dailyChecklistController.addEvidence);

// Tarefas antigas (mantidas para compatibilidade)
router.get('/checklist', operacionalController.showChecklist);
router.post('/checklist/:id/atualizar', operacionalController.updateChecklistItem);
router.post('/checklist/:id/completar', operacionalController.completeTask);

// Ocorrências
router.get('/ocorrencias', operacionalController.showOcorrencias);
router.get('/ocorrencias/nova', operacionalController.showCreateOcorrencia);
router.post('/ocorrencias', operacionalController.createOcorrencia);
router.get('/ocorrencias/:id', operacionalController.showOcorrencia);

module.exports = router;

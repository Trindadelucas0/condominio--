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

// Dashboard - apenas OPERACIONAL
router.get('/dashboard', authorize('OPERACIONAL'), operacionalController.showDashboard);

// Checklists diários (novos - baseados em regras)
// OPERACIONAL e LIMPEZA podem acessar checklists
router.get('/checklists-diarios', authorize('OPERACIONAL', 'LIMPEZA'), dailyChecklistController.showDailyChecklists);
router.get('/checklists-diarios/:id', authorize('OPERACIONAL', 'LIMPEZA'), dailyChecklistController.showChecklist);
router.post('/checklists-diarios/:id/iniciar', authorize('OPERACIONAL', 'LIMPEZA'), dailyChecklistController.startChecklist);
router.post('/checklists-diarios/:checklistId/items/:itemId', authorize('OPERACIONAL', 'LIMPEZA'), dailyChecklistController.updateItem);
router.post('/checklists-diarios/:id/finalizar', authorize('OPERACIONAL', 'LIMPEZA'), dailyChecklistController.completeChecklist);

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

router.post('/checklists-diarios/:id/evidencias', authorize('OPERACIONAL', 'LIMPEZA'), uploadEvidence.single('evidence'), dailyChecklistController.addEvidence);

// Tarefas antigas (mantidas para compatibilidade)
// OPERACIONAL e LIMPEZA podem acessar checklist antigo
router.get('/checklist', authorize('OPERACIONAL', 'LIMPEZA'), operacionalController.showChecklist);
router.post('/checklist/:id/atualizar', authorize('OPERACIONAL', 'LIMPEZA'), operacionalController.updateChecklistItem);
router.post('/checklist/:id/completar', authorize('OPERACIONAL', 'LIMPEZA'), operacionalController.completeTask);

// Ocorrências - apenas OPERACIONAL (LIMPEZA tem suas próprias rotas)
router.get('/ocorrencias', authorize('OPERACIONAL'), operacionalController.showOcorrencias);
router.get('/ocorrencias/nova', authorize('OPERACIONAL'), operacionalController.showCreateOcorrencia);
router.post('/ocorrencias', authorize('OPERACIONAL'), operacionalController.createOcorrencia);
router.get('/ocorrencias/:id', authorize('OPERACIONAL'), operacionalController.showOcorrencia);
router.get('/ocorrencias/:id/resolver', authorize('OPERACIONAL'), operacionalController.showResolveOcorrencia);
router.post('/ocorrencias/:id/resolver', authorize('OPERACIONAL'), operacionalController.resolveOcorrencia);

// Manutenções - apenas OPERACIONAL
const manutencaoController = require('../controllers/manutencaoController');
router.get('/manutencoes', authorize('OPERACIONAL'), manutencaoController.listManutencoes);
router.get('/manutencoes/:id', authorize('OPERACIONAL'), manutencaoController.showManutencao);
router.post('/manutencoes/:id/iniciar', authorize('OPERACIONAL'), manutencaoController.startManutencao);
router.get('/manutencoes/:id/concluir', authorize('OPERACIONAL'), manutencaoController.showCompleteManutencao);
router.post('/manutencoes/:id/concluir', authorize('OPERACIONAL'), manutencaoController.completeManutencao);

// Orçamentos liberados - apenas OPERACIONAL
router.get('/orcamentos', authorize('OPERACIONAL'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const orcamentoService = require('../services/orcamentoService');
    // Lista todos os orçamentos liberados do condomínio (operacional pode ver os seus)
    const allBudgets = await orcamentoService.listBudgetRequests(req.user.condominiumId, { 
      status: 'LIBERATED'
    });
    // Filtra apenas os orçamentos solicitados pelo usuário atual
    const budgets = allBudgets.filter(b => b.requested_by === req.user.id);
    res.render('operacional/orcamentos', {
      title: 'Orçamentos Liberados',
      user: req.user,
      budgets: budgets || [],
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).send('Erro ao carregar orçamentos');
  }
});

module.exports = router;

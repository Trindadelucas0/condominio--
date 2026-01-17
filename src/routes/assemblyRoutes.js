// Rotas do módulo ASSEMBLEIAS
// Gerencia requisições de gestão de assembleias

const express = require('express');
const router = express.Router();
const assemblyController = require('../controllers/assemblyController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil SINDICO, SUBSINDICO ou ADMINISTRATIVO
router.use(authorize('SINDICO', 'SUBSINDICO', 'ADMINISTRATIVO'));

// Listar assembleias
router.get('/', assemblyController.listAssemblies);

// Criar assembleia
router.get('/novo', (req, res) => {
  res.render('administrativo/assembleias/form', {
    title: 'Nova Assembleia',
    user: req.user,
    assembly: null,
    req: req,
  });
});

router.post('/', assemblyController.createAssembly);

// Detalhes da assembleia
router.get('/:id', assemblyController.showAssembly);

// Adicionar participante
router.post('/:id/participantes', assemblyController.addParticipant);

// Adicionar decisão
router.post('/:id/decisoes', assemblyController.addDecision);

// Anexar documento
router.post('/:id/documentos', assemblyController.attachDocument);

// Finalizar assembleia
router.post('/:id/finalizar', assemblyController.completeAssembly);

module.exports = router;

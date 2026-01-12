// Rotas de configurações do condomínio
// Gerencia configurações centralizadas do sistema
// REGRA: Síndico e Super Master podem alterar configurações

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Apenas Síndico e Super Master podem acessar
router.use(authorize('SINDICO', 'SUBSINDICO', 'SUPER_MASTER'));

// Listar configurações
router.get('/', configController.showConfig);

// Exibir formulário de criação
router.get('/nova', configController.showEditConfig);

// Criar configuração
router.post('/', configController.createConfig);

// Exibir formulário de edição
router.get('/:key/edit', configController.showEditConfig);

// Atualizar configuração
router.post('/:key', configController.updateConfig);

module.exports = router;

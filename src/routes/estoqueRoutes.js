// Rotas de estoque/insumos
// Gerencia cadastro de insumos e movimentações
// REGRA: Operacional baixa, Administrativo controla, Financeiro vê impacto

const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');
const { authenticate, authorize } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Administrativo, Financeiro e Operacional podem acessar
router.use(authorize('ADMINISTRATIVO', 'FINANCEIRO', 'OPERACIONAL'));

// Dashboard de estoque
router.get('/', estoqueController.showDashboard);

// Listar itens
router.get('/items', estoqueController.listItems);

// Exibir formulário de criação de item
router.get('/items/novo', estoqueController.showCreateItem);

// Criar item
router.post('/items', estoqueController.createItem);

// Exibir detalhes de item
router.get('/items/:id', estoqueController.showItem);

// Exibir formulário de edição de item
router.get('/items/:id/editar', estoqueController.showEditItem);

// Atualizar item
router.post('/items/:id', estoqueController.updateItem);

// Exibir formulário de movimentação
router.get('/items/:id/movimentacao', estoqueController.showCreateMovement);

// Criar movimentação
router.post('/items/:id/movimentacao', estoqueController.createMovement);

module.exports = router;

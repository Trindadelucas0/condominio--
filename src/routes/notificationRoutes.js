// Rotas de notificações
// Gerencia ações relacionadas a notificações
// REGRA: Notificação não pode ser apagada, apenas resolvida ou justificada

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar notificações do usuário
router.get('/', notificationController.listNotifications);

// Marcar notificação como lida
router.post('/:id/read', notificationController.markAsRead);

// Marcar todas as notificações como lidas
router.post('/read-all', notificationController.markAllAsRead);

// Obter contador de notificações não lidas (API)
router.get('/unread-count', notificationController.getUnreadCount);

module.exports = router;

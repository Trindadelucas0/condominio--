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

// Resolver notificação
router.post('/:id/resolve', notificationController.resolveNotification);

// Justificar notificação
router.post('/:id/justify', notificationController.justifyNotification);

module.exports = router;

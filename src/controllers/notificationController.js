// Controller de Notificações
// Gerencia requisições relacionadas a notificações

const notificationService = require('../services/notificationService');
const { renderError } = require('../utils/errorHandler');

// Função para listar notificações do usuário
// GET /notifications
const listNotifications = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { read, limit = 50, offset = 0 } = req.query;
    const options = {
      read: read !== undefined ? read === 'true' : null,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    const notifications = await notificationService.getUserNotifications(
      req.user.id,
      req.user.condominiumId,
      options
    );

    const unreadCount = await notificationService.getUnreadCount(
      req.user.id,
      req.user.condominiumId
    );

    res.render('notifications/list', {
      title: 'Notificações',
      user: req.user,
      notifications: notifications,
      unreadCount: unreadCount,
      filters: { read },
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    renderError(res, 500, 'Erro ao carregar notificações', error);
  }
};

// Função para marcar notificação como lida
// POST /notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    await notificationService.markAsRead(notificationId, req.user.id);

    // Se for requisição AJAX, retorna JSON; caso contrário, redireciona
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/notifications?read=false');
    }
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ error: error.message });
    } else {
      res.redirect('/notifications?error=' + encodeURIComponent(error.message));
    }
  }
};

// Função para marcar todas as notificações como lidas
// POST /notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ error: 'Usuário não está associado a um condomínio' });
      }
      return res.redirect('/notifications?error=' + encodeURIComponent('Usuário não está associado a um condomínio'));
    }

    const count = await notificationService.markAllAsRead(
      req.user.id,
      req.user.condominiumId
    );

    // Se for requisição AJAX, retorna JSON; caso contrário, redireciona
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
      res.json({ success: true, count: count });
    } else {
      res.redirect('/notifications?read=true&success=all_read');
    }
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ error: error.message });
    } else {
      res.redirect('/notifications?error=' + encodeURIComponent(error.message));
    }
  }
};

// Função para obter contador de notificações não lidas (API)
// GET /notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está associado a um condomínio' });
    }

    const count = await notificationService.getUnreadCount(
      req.user.id,
      req.user.condominiumId
    );

    res.json({ count: count });
  } catch (error) {
    console.error('Erro ao obter contador de notificações:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};

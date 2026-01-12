// Controller de notificações
// Gerencia ações relacionadas a notificações (resolver, justificar, listar)
// REGRA: Notificação não pode ser apagada, apenas resolvida ou justificada

const notificationService = require('../services/automationService');

// Função para listar notificações do usuário
// GET /notifications
const listNotifications = async (req, res) => {
  try {
    const { read, resolved, justified } = req.query;
    const filters = {};

    if (read !== undefined) filters.read = read === 'true';
    if (resolved !== undefined) filters.resolved = resolved === 'true';
    if (justified !== undefined) filters.justified = justified === 'true';

    const notifications = await notificationService.listNotifications(
      req.user.id,
      req.user.condominiumId,
      filters
    );

    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: error.message });
  }
};

// Função para marcar notificação como lida
// POST /notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markNotificationAsRead(id, req.user.id);

    res.json({ notification });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: error.message });
  }
};

// Função para resolver notificação
// POST /notifications/:id/resolve
const resolveNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.resolveNotification(id, req.user.id);

    res.json({ notification });
  } catch (error) {
    console.error('Erro ao resolver notificação:', error);
    res.status(500).json({ error: error.message });
  }
};

// Função para justificar notificação
// POST /notifications/:id/justify
const justifyNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { justification } = req.body;

    if (!justification || justification.trim() === '') {
      return res.status(400).json({ error: 'Justificativa é obrigatória' });
    }

    const notification = await notificationService.justifyNotification(
      id,
      req.user.id,
      justification
    );

    res.json({ notification });
  } catch (error) {
    console.error('Erro ao justificar notificação:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  resolveNotification,
  justifyNotification,
};

// Rotas de automações (endpoint administrativo para executar automações manualmente)
// Em produção, isso deve ser executado via cron/job

const express = require('express');
const router = express.Router();
const automationService = require('../services/automationService');
const { authenticate, authorize } = require('../middlewares/auth');
const { query } = require('../config/database');

// Endpoint para executar automações manualmente (apenas ADMINISTRATIVO)
// SUPER_MASTER NÃO tem acesso operacional (regra: quem governa o sistema não governa o condomínio)
// GET /automation/run
router.get('/run', authenticate, authorize('ADMINISTRATIVO'), async (req, res) => {
  try {
    // Verifica explicitamente que não é SUPER_MASTER (segurança extra)
    if (req.user.roles.includes('SUPER_MASTER')) {
      return res.status(403).json({ error: 'Acesso negado. SUPER_MASTER não tem acesso operacional.' });
    }

    const condominiumId = req.user.condominiumId;

    if (!condominiumId) {
      return res.status(400).json({ error: 'Condomínio não especificado' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const result = await automationService.runAutomations(condominiumId, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Automações executadas com sucesso',
      result: result,
    });
  } catch (error) {
    console.error('Erro ao executar automações:', error);
    res.status(500).json({ error: 'Erro ao executar automações', message: error.message });
  }
});

// Endpoint para obter notificações do usuário logado
// GET /automation/notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ error: 'Usuário não está associado a um condomínio' });
    }

    const notifications = await automationService.getUnreadNotifications(req.user.id, req.user.condominiumId);

    res.json({
      success: true,
      notifications: notifications,
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações', message: error.message });
  }
});

// Endpoint para marcar notificação como lida
// POST /automation/notifications/:id/read
router.post('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await automationService.markNotificationAsRead(req.params.id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    res.json({
      success: true,
      notification: notification,
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida', message: error.message });
  }
});

module.exports = router;

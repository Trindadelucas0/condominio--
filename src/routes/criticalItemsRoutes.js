// Rotas da API de itens críticos
// GET /api/critical-items - retorna resumo para o modal ao login

const express = require('express');
const router = express.Router();
const criticalItemsService = require('../services/criticalItemsService');
const { authenticate } = require('../middlewares/auth');

// Rota protegida - requer autenticação
router.use(authenticate);

// GET / - Resumo de itens críticos (contas vencidas, documentos, alertas, notificações)
router.get('/', async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    const result = await criticalItemsService.getCriticalItemsSummary(
      req.user.condominiumId,
      req.user.id,
      userRoles
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar itens críticos:', error);
    res.status(500).json({ showModal: false, hasCritical: false, summary: {}, links: {}, notifications: [] });
  }
});

module.exports = router;

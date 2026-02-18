// Rotas de autenticação
// Define endpoints HTTP relacionados a login/logout

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// GET /auth/login
router.get('/login', authController.showLogin);

// GET /auth/sem-acesso - página elegante quando área não está vinculada ao perfil
router.get('/sem-acesso', authenticate, authController.showSemAcesso);

// POST /auth/login
// Processa tentativa de login (recebe username e senha)
router.post('/login', authController.processLogin);

// POST /auth/logout
// Processa logout (remove cookie e redireciona)
router.post('/logout', authController.processLogout);

// Exporta roteador para uso no app.js
module.exports = router;

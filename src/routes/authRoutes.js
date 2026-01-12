// Rotas de autenticação
// Define endpoints HTTP relacionados a login/logout

const express = require('express'); // Framework Express
const router = express.Router(); // Cria roteador do Express
const authController = require('../controllers/authController'); // Controller de autenticação

// GET /auth/login
// Exibe página de login
router.get('/login', authController.showLogin);

// POST /auth/login
// Processa tentativa de login (recebe username e senha)
router.post('/login', authController.processLogin);

// POST /auth/logout
// Processa logout (remove cookie e redireciona)
router.post('/logout', authController.processLogout);

// Exporta roteador para uso no app.js
module.exports = router;

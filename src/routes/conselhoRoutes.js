// Rotas do módulo CONSELHO

const express = require('express');
const router = express.Router();
const conselhoController = require('../controllers/conselhoController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);
router.use(authorize('CONSELHO'));

router.get('/dashboard', conselhoController.showDashboard);

module.exports = router;

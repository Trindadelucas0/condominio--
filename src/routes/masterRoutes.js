// Rotas do módulo SUPER_MASTER
// Todas as rotas exigem autenticação e perfil SUPER_MASTER

const express = require('express'); // Framework Express
const router = express.Router(); // Cria roteador
const masterController = require('../controllers/masterController'); // Controller do módulo master
const { authenticate, authorize } = require('../middlewares/auth'); // Middlewares de autenticação e autorização

// Todas as rotas exigem autenticação
router.use(authenticate);

// Todas as rotas exigem perfil SUPER_MASTER
router.use(authorize('SUPER_MASTER'));

// Dashboard
router.get('/dashboard', masterController.showDashboard);
router.get('/ia-relatorios', masterController.showIaReportsCenter);

// Rotas de condomínios
router.get('/condominios', masterController.listCondominios);
router.get('/condominios/novo', masterController.showCreateCondominio);
router.post('/condominios', masterController.createCondominio);
router.get('/condominios/:id/editar', masterController.showEditCondominio);
router.post('/condominios/:id', masterController.updateCondominio);
router.get('/condominios/:id/relatorios', masterController.showCondominioReportConfig);
router.post('/condominios/:id/relatorios/preferencias', masterController.updateCondominioReportPreferences);
router.post('/condominios/:id/relatorios/destinatarios', masterController.addCondominioReportRecipient);
router.post('/condominios/:id/relatorios/destinatarios/:recipientId/remover', masterController.removeCondominioReportRecipient);
router.post('/condominios/:id/relatorios/disparar', masterController.dispatchCondominioReportNow);

// Rotas de usuários
router.get('/usuarios', masterController.listUsuarios);
router.get('/usuarios/novo', masterController.showCreateUsuario);
router.post('/usuarios', masterController.createUsuario);
router.get('/usuarios/:id/editar', masterController.showEditUsuario);
router.post('/usuarios/:id', masterController.updateUsuario);

// Exporta roteador
module.exports = router;

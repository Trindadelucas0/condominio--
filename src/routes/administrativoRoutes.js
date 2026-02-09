// Rotas do módulo ADMINISTRATIVO

const express = require('express');
const router = express.Router();
const administrativoController = require('../controllers/administrativoController');
const reaberturaController = require('../controllers/reaberturaController');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadContract, uploadBudgetAttachments } = require('../middlewares/upload');

router.use(authenticate);
router.use(authorize('ADMINISTRATIVO'));

router.get('/dashboard', administrativoController.showDashboard);

// Como funciona o sistema (fluxo e conceitos do Administrativo)
router.get('/como-funciona', (req, res) => {
  res.render('administrativo/como-funciona', { title: 'Como funciona o sistema', user: req.user });
});

router.get('/tarefas', administrativoController.showTarefas);
router.get('/tarefas/nova', administrativoController.showCreateTarefa);
router.post('/tarefas', administrativoController.createTarefa);
router.get('/documentos', administrativoController.showDocumentos);
router.get('/documentos/novo', administrativoController.showCreateDocumento);
router.post('/documentos', uploadContract, administrativoController.createDocumento);
// Categorias de documentos (DEVEM VIR ANTES das rotas com :id)
router.get('/documentos/categorias', administrativoController.showCategorias);
router.get('/documentos/categorias/nova', administrativoController.showCreateCategoria);
router.post('/documentos/categorias', administrativoController.createCategoria);
// Rotas com parâmetros dinâmicos vêm por último
router.get('/documentos/:id/editar', administrativoController.showEditDocumento);
router.post('/documentos/:id', administrativoController.updateDocumento);

// Reabertura de tarefas (GET = formulário, POST = enviar)
router.get('/tarefas/:id/reabrir', reaberturaController.showReopenTask);
router.post('/tarefas/:id/reabrir', reaberturaController.reopenTask);

// Ocorrências (triagem)
router.get('/ocorrencias', administrativoController.showOcorrencias);
router.get('/ocorrencias/pendentes', administrativoController.showOcorrenciasPendentes);
router.get('/ocorrencias/:id/triar', administrativoController.showTriarOcorrencia);
router.post('/ocorrencias/:id/triar', administrativoController.triarOcorrencia);

// Solicitações de orçamento (ADM → Síndico)
router.get('/orcamentos', administrativoController.showOrcamentos);
router.get('/orcamentos/novo', administrativoController.showCreateOrcamento);
router.post('/orcamentos', uploadBudgetAttachments, administrativoController.createOrcamento);
// Rota de detalhes DEVE vir DEPOIS de /novo para evitar conflito (novo não é um ID numérico)
router.get('/orcamentos/:id', administrativoController.showOrcamentoDetail);

// Comunicados operacionais
router.get('/comunicados', administrativoController.showComunicados);
router.get('/comunicados/novo', administrativoController.showCreateComunicado);
router.post('/comunicados', administrativoController.createComunicado);
router.post('/comunicados/:id/desativar', administrativoController.deactivateComunicado);

// Aprovações financeiras (ADMINISTRATIVO aprova até limite)
router.get('/aprovacoes-financeiras', administrativoController.showAprovacoesFinanceiras);
router.post('/aprovacoes-financeiras/:id/processar', administrativoController.processAprovacaoFinanceira);

// Alertas SLA
router.get('/alertas', administrativoController.showAlertasSLA);

// REGRA: Rotas financeiras e patrimoniais foram MOVIDAS para módulos separados
// Financeiro: /financeiro/* (requer role FINANCEIRO)
// Patrimônio: /patrimonio/* (requer role PATRIMONIO)
// ADMINISTRATIVO NÃO tem mais acesso direto a essas funcionalidades

module.exports = router;

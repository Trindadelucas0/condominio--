// Rotas do módulo SÍNDICO
// Gerencia requisições do painel do síndico

const express = require('express');
const router = express.Router();
const sindicoController = require('../controllers/sindicoController');
const checklistModelController = require('../controllers/checklistModelController');
const sindicoChecklistController = require('../controllers/sindicoChecklistController');
const reportService = require('../services/reportService');
const dashboardConfigService = require('../services/dashboardConfigService');
const { authenticate, authorize } = require('../middlewares/auth');
const { getErrorMessage } = require('../utils/errorMessages');
const fs = require('fs');

// Todas as rotas exigem autenticação
router.use(authenticate);

// Rotas GET (leitura): FINANCEIRO pode visualizar (só olhar)
// Rotas POST (ação): apenas SINDICO e SUBSINDICO

// Dashboard - FINANCEIRO pode visualizar
router.get('/dashboard', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showDashboard);

// Aprovações - FINANCEIRO pode visualizar, mas só SINDICO/SUBSINDICO pode aprovar
router.get('/aprovacoes', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showAprovacoes);
router.post('/aprovacoes/:id/processar', authorize('SINDICO', 'SUBSINDICO'), sindicoController.processAprovacao);

// Alertas - FINANCEIRO pode visualizar, mas só SINDICO/SUBSINDICO pode resolver
router.get('/alertas', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showAlertas);
router.post('/alertas/:id/resolver', authorize('SINDICO', 'SUBSINDICO'), sindicoController.resolverAlerta);

// Logs - FINANCEIRO pode visualizar (apenas leitura)
router.get('/logs', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showLogs);

// Tarefas - FINANCEIRO pode visualizar, mas só SINDICO/SUBSINDICO pode adicionar observação
router.get('/tarefas', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showTarefas);
// Relatório de tarefas - FINANCEIRO pode gerar (DEVE vir ANTES da rota com parâmetro :id)
router.get('/tarefas/relatorio', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    
    const filters = {
      status: req.query.status,
      search: req.query.search,
      page: 1,
      perPage: 1000,
    };
    
    // Buscar nome do condomínio
    const { query } = require('../config/database');
    const condominiumResult = await query(
      `SELECT name FROM condominiums WHERE id = $1`,
      [req.user.condominiumId]
    );
    const condominiumName = condominiumResult.rows.length > 0 ? condominiumResult.rows[0].name : 'Condomínio';
    
    // Buscar tarefas
    const sindicoService = require('../services/sindicoService');
    const result = await sindicoService.listTasks(req.user.condominiumId, filters);
    const tasks = result.tasks || result;
    
    const format = req.query.format || 'excel';
    const reportService = require('../services/reportService');
    
    if (format === 'pdf') {
      // Gerar PDF de tarefas
      const result = await reportService.generateTasksPDF(tasks, filters, condominiumName);
      const filePath = result.filePath || result;
      const fileName = result.fileName || `tarefas-${Date.now()}.pdf`;
      
      if (typeof filePath !== 'string') {
        throw new Error('Erro ao gerar PDF: caminho do arquivo inválido');
      }
      
      res.download(filePath, fileName, (err) => {
        if (!err) {
          // Deletar arquivo após download
          setTimeout(() => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }, 5000);
        }
      });
    } else {
      // Gerar Excel de tarefas
      const result = await reportService.generateTasksExcel(tasks, filters, condominiumName);
      const filePath = result.filePath || result;
      const fileName = result.fileName || `tarefas-${Date.now()}.xlsx`;
      
      if (typeof filePath !== 'string') {
        throw new Error('Erro ao gerar Excel: caminho do arquivo inválido');
      }
      
      res.download(filePath, fileName, (err) => {
        if (!err) {
          // Deletar arquivo após download
          setTimeout(() => {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }, 5000);
        }
      });
    }
  } catch (error) {
    console.error('Erro ao gerar relatório de tarefas:', error);
    res.status(500).send('Erro ao gerar relatório: ' + getErrorMessage(error));
  }
});
router.get('/tarefas/:id', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showTask);
router.post('/tarefas/:id/observacao', authorize('SINDICO', 'SUBSINDICO'), sindicoController.addTaskObservation);

// Ocorrências - FINANCEIRO pode visualizar, mas só SINDICO/SUBSINDICO pode adicionar observação
router.get('/ocorrencias', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showOcorrencias);
router.get('/ocorrencias/:id', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoController.showOccurrence);
router.post('/ocorrencias/:id/observacao', authorize('SINDICO', 'SUBSINDICO'), sindicoController.addOccurrenceObservation);

// Modelos de Checklist - Apenas SINDICO/SUBSINDICO (criação/edição)
router.get('/checklist-modelos', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), checklistModelController.showModels);
router.get('/checklist-modelos/novo', authorize('SINDICO', 'SUBSINDICO'), checklistModelController.showCreateModel);
router.post('/checklist-modelos', authorize('SINDICO', 'SUBSINDICO'), checklistModelController.createModel);
router.get('/checklist-modelos/:id/editar', authorize('SINDICO', 'SUBSINDICO'), checklistModelController.showEditModel);
router.post('/checklist-modelos/:id', authorize('SINDICO', 'SUBSINDICO'), checklistModelController.updateModel);
router.post('/checklist-modelos/:id/toggle', authorize('SINDICO', 'SUBSINDICO'), checklistModelController.toggleModel);

// Acompanhar checklists completos e questionar itens não feitos (rotas específicas antes de :id)
router.get('/checklists-acompanhamento', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoChecklistController.list);
router.post('/checklists-acompanhamento/items/:id/questionar', authorize('SINDICO', 'SUBSINDICO'), sindicoChecklistController.questionar);
router.get('/checklists-acompanhamento/:id', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), sindicoChecklistController.show);

// Manutenções - FINANCEIRO pode visualizar, mas só SINDICO/SUBSINDICO pode criar/editar
const manutencaoController = require('../controllers/manutencaoController');
router.get('/manutencoes', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), manutencaoController.listManutencoes);
router.get('/manutencoes/novo', authorize('SINDICO', 'SUBSINDICO'), manutencaoController.showCreateManutencao);
router.post('/manutencoes', authorize('SINDICO', 'SUBSINDICO'), manutencaoController.createManutencao);
router.get('/manutencoes/:id', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), manutencaoController.showManutencao);

// Aprovação de entradas financeiras - FINANCEIRO pode visualizar, mas só SINDICO/SUBSINDICO aprova
const financeiroService = require('../services/financeiroService');
router.get('/entradas-pendentes', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const entries = await financeiroService.listPendingEntries(req.user.condominiumId);
    res.render('sindico/entradas-pendentes', {
      title: 'Entradas Aguardando Análise',
      user: req.user,
      entries: entries,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar entradas pendentes:', error);
    res.status(500).send('Erro ao carregar entradas');
  }
});

// Aprovação de saídas financeiras - FINANCEIRO pode visualizar, mas só SINDICO/SUBSINDICO aprova
router.get('/saidas-pendentes', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const exits = await financeiroService.listExits(req.user.condominiumId, { 
      paymentStatus: 'PENDING',
      limit: 1000 
    });
    res.render('sindico/saidas-pendentes', {
      title: 'Saídas Aguardando Aprovação',
      user: req.user,
      exits: exits,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar saídas pendentes:', error);
    res.status(500).send('Erro ao carregar saídas');
  }
});
router.post('/entradas/:id/aprovar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await financeiroService.approveEntry(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      req.body.reviewNotes,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/entradas-pendentes?success=approved');
  } catch (error) {
    console.error('Erro ao aprovar entrada:', error);
    res.redirect('/sindico/entradas-pendentes?error=' + encodeURIComponent(error.message));
  }
});
router.post('/entradas/:id/rejeitar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await financeiroService.rejectEntry(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      req.body.rejectionReason,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/entradas-pendentes?success=rejected');
  } catch (error) {
    console.error('Erro ao rejeitar entrada:', error);
    res.redirect('/sindico/entradas-pendentes?error=' + encodeURIComponent(error.message));
  }
});

// Aprovar ou rejeitar saída financeira
router.post('/saidas/:id/aprovar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const userRoles = [req.user.role];
    
    const result = await financeiroService.approveExit(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      userRoles,
      ipAddress,
      userAgent
    );
    
    // Se retornar mensagem de multi-aprovação pendente
    if (result && result.message) {
      return res.redirect('/sindico/saidas-pendentes?info=' + encodeURIComponent(result.message));
    }
    
    res.redirect('/sindico/saidas-pendentes?success=approved');
  } catch (error) {
    console.error('Erro ao aprovar saída:', error);
    const errorMessage = getErrorMessage(error);
    const errorParams = error.details 
      ? `error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(JSON.stringify(error.details))}`
      : `error=${encodeURIComponent(errorMessage)}`;
    res.redirect('/sindico/saidas-pendentes?' + errorParams);
  }
});

router.post('/saidas/:id/rejeitar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    if (!req.body.rejectionReason || !req.body.rejectionReason.trim()) {
      const errorMessage = getErrorMessage({ message: 'REJECTION_REASON_REQUIRED' });
      return res.redirect('/sindico/saidas-pendentes?error=' + encodeURIComponent(errorMessage));
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await financeiroService.rejectExit(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      req.body.rejectionReason,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/saidas-pendentes?success=rejected');
  } catch (error) {
    console.error('Erro ao rejeitar saída:', error);
    const errorMessage = getErrorMessage(error);
    res.redirect('/sindico/saidas-pendentes?error=' + encodeURIComponent(errorMessage));
  }
});

// Orçamentos pendentes de aprovação
router.get('/orcamentos-pendentes', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const orcamentoService = require('../services/orcamentoService');
    const budgets = await orcamentoService.listBudgetRequestsByStatus(req.user.condominiumId, 'PENDING_SINDICO');
    res.render('sindico/orcamentos-pendentes', {
      title: 'Orçamentos Aguardando Aprovação',
      user: req.user,
      budgets: budgets,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar orçamentos pendentes:', error);
    res.status(500).send('Erro ao carregar orçamentos');
  }
});

// Aprovar ou rejeitar orçamento
router.post('/orcamentos/:id/aprovar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const orcamentoService = require('../services/orcamentoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await orcamentoService.approveOrRejectBySindico(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      'APPROVE',
      {
        budgetApprovedAmount: req.body.budgetApprovedAmount,
        sindicoNotes: req.body.approvalNotes,
      },
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/orcamentos-pendentes?success=approved');
  } catch (error) {
    console.error('Erro ao aprovar orçamento:', error);
    res.redirect('/sindico/orcamentos-pendentes?error=' + encodeURIComponent(error.message));
  }
});

router.post('/orcamentos/:id/rejeitar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const orcamentoService = require('../services/orcamentoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await orcamentoService.approveOrRejectBySindico(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      'REJECT',
      {
        rejectionReason: req.body.rejectionReason,
      },
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/orcamentos-pendentes?success=rejected');
  } catch (error) {
    console.error('Erro ao rejeitar orçamento:', error);
    res.redirect('/sindico/orcamentos-pendentes?error=' + encodeURIComponent(error.message));
  }
});

// Aprovação de ocorrências
router.get('/ocorrencias-pendentes-aprovacao', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const sindicoService = require('../services/sindicoService');
    const occurrences = await sindicoService.listPendingOccurrencesForApproval(req.user.condominiumId, req.user.id);
    res.render('sindico/ocorrencias-aprovacao', {
      title: 'Ocorrências Aguardando Aprovação',
      user: req.user,
      occurrences: occurrences,
      req: req,
    });
  } catch (error) {
    console.error('Erro ao listar ocorrências pendentes:', error);
    res.status(500).send('Erro ao carregar ocorrências');
  }
});
router.post('/ocorrencias/:id/aprovar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const sindicoService = require('../services/sindicoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await sindicoService.approveOccurrence(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?success=approved');
  } catch (error) {
    console.error('Erro ao aprovar ocorrência:', error);
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?error=' + encodeURIComponent(error.message));
  }
});
router.post('/ocorrencias/:id/rejeitar', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    const sindicoService = require('../services/sindicoService');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await sindicoService.rejectOccurrence(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      req.body.rejectionReason,
      ipAddress,
      userAgent
    );
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?success=rejected');
  } catch (error) {
    console.error('Erro ao rejeitar ocorrência:', error);
    const { getErrorMessage } = require('../utils/errorMessages');
    const errorMessage = getErrorMessage(error);
    res.redirect('/sindico/ocorrencias-pendentes-aprovacao?error=' + encodeURIComponent(errorMessage));
  }
});

// Relatórios
router.get('/aprovacoes/relatorio', authorize('FINANCEIRO', 'SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }
    
    const format = req.query.format || 'pdf'; // pdf ou excel
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    
    // Buscar nome do condomínio
    const { query } = require('../config/database');
    const condominiumResult = await query(
      `SELECT name FROM condominiums WHERE id = $1`,
      [req.user.condominiumId]
    );
    const condominiumName = condominiumResult.rows.length > 0 ? condominiumResult.rows[0].name : 'Condomínio';
    
    // Buscar aprovações
    const sindicoService = require('../services/sindicoService');
    const approvalResult = await sindicoService.listPendingApprovals(req.user.condominiumId, { page: 1, perPage: 1000 });
    const approvals = approvalResult.approvals || approvalResult;
    
    // Gerar relatório
    if (format === 'excel') {
      const reportResult = await reportService.generateApprovalsExcel(approvals, filters, condominiumName);
      res.download(reportResult.filePath, reportResult.fileName, (err) => {
        if (!err) {
          setTimeout(() => {
            try {
              if (fs.existsSync(reportResult.filePath)) {
                fs.unlinkSync(reportResult.filePath);
              }
            } catch (error) {
              console.error('Erro ao deletar arquivo:', error);
            }
          }, 5000);
        }
      });
    } else {
      const reportResult = await reportService.generateApprovalsPDF(approvals, filters, condominiumName);
      res.download(reportResult.filePath, reportResult.fileName, (err) => {
        if (!err) {
          setTimeout(() => {
            try {
              if (fs.existsSync(reportResult.filePath)) {
                fs.unlinkSync(reportResult.filePath);
              }
            } catch (error) {
              console.error('Erro ao deletar arquivo:', error);
            }
          }, 5000);
        }
      });
    }
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).send('Erro ao gerar relatório: ' + error.message);
  }
});

// Configuração do dashboard
router.post('/dashboard/config', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ success: false, error: 'Usuário não está associado a um condomínio' });
    }
    
    const widgets = req.body.widgets;
    
    await dashboardConfigService.saveUserConfig(
      req.user.id,
      req.user.condominiumId,
      widgets
    );
    
    // Invalidar cache do dashboard
    const cacheService = require('../services/cacheService');
    cacheService.deletePattern(`dashboard:stats:${req.user.condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${req.user.condominiumId}`);
    
    res.json({ success: true, message: 'Configuração salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar configuração do dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Resetar configuração do dashboard
router.post('/dashboard/config/reset', authorize('SINDICO', 'SUBSINDICO'), async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).json({ success: false, error: 'Usuário não está associado a um condomínio' });
    }
    
    await dashboardConfigService.resetToDefault(req.user.id, req.user.condominiumId);
    
    const cacheService = require('../services/cacheService');
    cacheService.deletePattern(`dashboard:stats:${req.user.condominiumId}`);
    cacheService.deletePattern(`dashboard:analytics:${req.user.condominiumId}`);
    
    res.json({ success: true, message: 'Configuração resetada para padrão' });
  } catch (error) {
    console.error('Erro ao resetar configuração do dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

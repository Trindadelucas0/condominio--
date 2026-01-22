// Controller para executar checklists diários
// OPERACIONAL e LIMPEZA executam checklists

const dailyChecklistService = require('../services/dailyChecklistService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para listar checklists do dia
// GET /operacional/checklists-diarios
const showDailyChecklists = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    // Data pode ser passada como query param (?date=YYYY-MM-DD) ou usa hoje
    let date;
    if (req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date).trim())) {
      date = new Date(String(req.query.date).trim() + 'T12:00:00');
      if (isNaN(date.getTime())) date = new Date();
    } else {
      date = new Date();
    }
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Gera checklists do dia ANTES de listar (se não existirem)
    // Assim o operacional/limpeza sempre vê os checklists ao abrir a página
    try {
      await dailyChecklistService.generateDailyChecklists(req.user.condominiumId, date);
    } catch (genErr) {
      console.warn('Aviso ao gerar checklists do dia:', genErr.message);
    }

    const checklists = await dailyChecklistService.listDailyChecklists(
      req.user.id,
      req.user.condominiumId,
      date
    );

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    res.render('operacional/checklists-diarios/list', {
      title: 'Checklists do Dia',
      user: req.user,
      checklists,
      date: dateStr,
      isToday,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar checklists:', error);
    renderError(res, 500, 'Erro ao carregar checklists', error);
  }
};

// Função para exibir checklist específico para execução
// GET /operacional/checklists-diarios/:id
const showChecklist = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const checklist = await dailyChecklistService.getChecklistById(
      parseInt(req.params.id),
      req.user.id,
      req.user.condominiumId
    );

    if (!checklist) {
      return renderError(res, 404, 'Checklist não encontrado');
    }

    res.render('operacional/checklists-diarios/execute', {
      title: 'Executar Checklist',
      user: req.user,
      checklist,
      query: req.query || {},
    });
  } catch (error) {
    console.error('Erro ao carregar checklist:', error);
    renderError(res, 500, 'Erro ao carregar checklist', error);
  }
};

// Função para iniciar checklist
// POST /operacional/checklists-diarios/:id/iniciar
const startChecklist = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await dailyChecklistService.startChecklist(
      parseInt(req.params.id),
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect(`/operacional/checklists-diarios/${req.params.id}?success=started`);
  } catch (error) {
    console.error('Erro ao iniciar checklist:', error);
    res.redirect(`/operacional/checklists-diarios/${req.params.id}?error=${encodeURIComponent(error.message)}`);
  }
};

// Função para atualizar item do checklist
// POST /operacional/checklists-diarios/:checklistId/items/:itemId
// Se Accept: application/json ou X-Requested-With: XMLHttpRequest, retorna JSON (para atualização sem reload)
const updateItem = async (req, res) => {
  const isAjax = req.get('Accept')?.includes('application/json') || req.get('X-Requested-With') === 'XMLHttpRequest';

  try {
    if (!req.user.condominiumId) {
      if (isAjax) return res.status(400).json({ error: 'Usuário não está associado a um condomínio' });
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const { item, progress, checklistStatus } = await dailyChecklistService.updateChecklistItem(
      parseInt(req.params.itemId),
      req.body.status,
      req.body.comment || null,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    if (isAjax) {
      return res.json({
        success: true,
        item: { id: item.id, status: item.status, comment: item.comment },
        progress: { done: progress.done, total: progress.total },
        checklistStatus
      });
    }
    res.redirect(`/operacional/checklists-diarios/${req.params.checklistId}?success=updated`);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    if (isAjax) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar item' });
    }
    res.redirect(`/operacional/checklists-diarios/${req.params.checklistId}?error=${encodeURIComponent(error.message)}`);
  }
};

// Função para adicionar evidência (foto)
// POST /operacional/checklists-diarios/:id/evidencias
const addEvidence = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    if (!req.file) {
      return res.redirect(`/operacional/checklists-diarios/${req.params.id}?error=${encodeURIComponent('Arquivo não enviado')}`);
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await dailyChecklistService.addEvidence(
      parseInt(req.params.id),
      req.file.path,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      req.body.checklistItemId ? parseInt(req.body.checklistItemId) : null,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect(`/operacional/checklists-diarios/${req.params.id}?success=evidence_added`);
  } catch (error) {
    console.error('Erro ao adicionar evidência:', error);
    res.redirect(`/operacional/checklists-diarios/${req.params.id}?error=${encodeURIComponent(error.message)}`);
  }
};

// Função para finalizar checklist
// POST /operacional/checklists-diarios/:id/finalizar
const completeChecklist = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await dailyChecklistService.completeChecklist(
      parseInt(req.params.id),
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect('/operacional/checklists-diarios?success=completed');
  } catch (error) {
    console.error('Erro ao finalizar checklist:', error);
    res.redirect(`/operacional/checklists-diarios/${req.params.id}?error=${encodeURIComponent(error.message)}`);
  }
};

// POST /operacional/checklists-diarios/:checklistId/items/:itemId/responder-questionamento
const responderQuestionamento = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.get('user-agent');

    await dailyChecklistService.addRespostaQuestionamento(
      parseInt(req.params.itemId),
      req.body.resposta || '',
      req.user.id,
      req.user.condominiumId,
      ip,
      ua
    );

    res.redirect(`/operacional/checklists-diarios/${req.params.checklistId}?success=responder`);
  } catch (error) {
    console.error('Erro ao responder questionamento:', error);
    res.redirect(`/operacional/checklists-diarios/${req.params.checklistId}?error=${encodeURIComponent(error.message)}`);
  }
};

module.exports = {
  showDailyChecklists,
  showChecklist,
  startChecklist,
  updateItem,
  addEvidence,
  completeChecklist,
  responderQuestionamento
};

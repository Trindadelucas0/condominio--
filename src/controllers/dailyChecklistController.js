// Controller para executar checklists diários
// OPERACIONAL e LIMPEZA executam checklists

const dailyChecklistService = require('../services/dailyChecklistService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para listar checklists do dia
// GET /operacional/checklists-diarios
const showDailyChecklists = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    // Data pode ser passada como query param ou usa hoje
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const checklists = await dailyChecklistService.listDailyChecklists(
      req.user.id,
      req.user.condominiumId,
      date
    );

    res.render('operacional/checklists-diarios/list', {
      title: 'Checklists do Dia',
      user: req.user,
      checklists,
      date: date.toISOString().split('T')[0],
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
      return res.status(400).send('Usuário não está associado a um condomínio');
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
      return res.status(400).send('Usuário não está associado a um condomínio');
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
const updateItem = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await dailyChecklistService.updateChecklistItem(
      parseInt(req.params.itemId),
      req.body.status,
      req.body.comment || null,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    res.redirect(`/operacional/checklists-diarios/${req.params.checklistId}?success=updated`);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.redirect(`/operacional/checklists-diarios/${req.params.checklistId}?error=${encodeURIComponent(error.message)}`);
  }
};

// Função para adicionar evidência (foto)
// POST /operacional/checklists-diarios/:id/evidencias
const addEvidence = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
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
      return res.status(400).send('Usuário não está associado a um condomínio');
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

module.exports = {
  showDailyChecklists,
  showChecklist,
  startChecklist,
  updateItem,
  addEvidence,
  completeChecklist
};

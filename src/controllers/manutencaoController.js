// Controller de Manutenções
// Gerencia requisições relacionadas a manutenções preventivas e corretivas

const manutencaoService = require('../services/manutencaoService');
const { renderError } = require('../utils/errorHandler');

const isAjaxRequest = (req) =>
  req.xhr ||
  (req.get('X-Requested-With') || '').toLowerCase() === 'xmlhttprequest' ||
  (req.get('accept') || '').includes('application/json');

const mapStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pendente') return 'Pendente';
  if (normalized === 'em_andamento') return 'Em andamento';
  if (normalized === 'concluida') return 'Concluída';
  if (normalized === 'cancelada') return 'Cancelada';
  return status;
};

const loadFormDependencies = async (condominiumId) => {
  const administrativoService = require('../services/administrativoService');
  const patrimonioService = require('../services/patrimonioService');
  const operacionais = await administrativoService.listOperacionais(condominiumId);
  const ativos = await patrimonioService.listAssets(condominiumId, { status: 'ACTIVE' });
  return { operacionais, ativos };
};

// Função para exibir lista de manutenções
// GET /sindico/manutencoes ou /operacional/manutencoes
const listManutencoes = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const filters = {
      status: req.query.status,
      maintenanceType: req.query.type,
      assignedTo: req.query.assignedTo,
      myMaintenances: req.query.myMaintenances === 'true', // Para operacional ver só as suas
    };

    const manutencoes = await manutencaoService.listMaintenances(
      req.user.condominiumId,
      req.user.id,
      filters
    );

    res.render('manutencoes/list', {
      title: 'Manutenções',
      user: req.user,
      manutencoes: manutencoes,
      filters: filters,
      success: req.query.success,
      error: req.query.error,
    });
  } catch (error) {
    console.error('Erro ao listar manutenções:', error);
    renderError(res, 500, 'Erro ao carregar manutenções', error);
  }
};

// Função para exibir formulário de criação de manutenção (Síndico)
// GET /sindico/manutencoes/novo
const showCreateManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const { operacionais, ativos } = await loadFormDependencies(req.user.condominiumId);

    res.render('manutencoes/form', {
      title: 'Nova Manutenção',
      user: req.user,
      operacionais: operacionais,
      ativos: ativos,
      manutencao: null,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de manutenção:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para criar manutenção (Síndico)
// POST /sindico/manutencoes
const createManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      maintenanceType: req.body.maintenanceType,
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      priority: req.body.priority,
      scheduledDate: req.body.scheduledDate,
      assignedTo: parseInt(req.body.assignedTo),
      assetId: req.body.assetId ? parseInt(req.body.assetId) : null,
      idempotencyKey: req.body.idempotencyKey || req.get('Idempotency-Key') || null,
    };

    const maintenance = await manutencaoService.createMaintenance(
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    if (isAjaxRequest(req)) {
      return res.json({
        success: true,
        maintenance: maintenance,
        message: 'Manutenção criada com sucesso.',
        redirectUrl: '/sindico/manutencoes?success=created',
      });
    }

    res.redirect('/sindico/manutencoes?success=created');
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    if (isAjaxRequest(req)) {
      return res.status(error.statusCode || 400).json({
        success: false,
        error: error.message || 'Erro ao criar manutenção',
        code: error.code || 'CREATE_MAINTENANCE_ERROR',
      });
    }
    try {
      const { operacionais, ativos } = await loadFormDependencies(req.user.condominiumId);

      res.render('manutencoes/form', {
        title: 'Nova Manutenção',
        user: req.user,
        operacionais: operacionais,
        ativos: ativos,
        manutencao: req.body,
        error: error.message,
      });
    } catch (renderError) {
      res.redirect('/sindico/manutencoes?error=' + encodeURIComponent(error.message));
    }
  }
};

const showEditManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const manutencao = await manutencaoService.getMaintenanceById(req.params.id, req.user.condominiumId);
    const { operacionais, ativos } = await loadFormDependencies(req.user.condominiumId);
    res.render('manutencoes/form', {
      title: 'Editar Manutenção',
      user: req.user,
      operacionais,
      ativos,
      manutencao,
    });
  } catch (error) {
    console.error('Erro ao exibir edição de manutenção:', error);
    res.redirect('/sindico/manutencoes?error=' + encodeURIComponent(error.message));
  }
};

const updateManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const data = {
      maintenanceType: req.body.maintenanceType,
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      priority: req.body.priority,
      scheduledDate: req.body.scheduledDate,
      assignedTo: parseInt(req.body.assignedTo),
      assetId: req.body.assetId ? parseInt(req.body.assetId) : null,
    };
    const maintenance = await manutencaoService.updateMaintenance(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    if (isAjaxRequest(req)) {
      return res.json({
        success: true,
        maintenance,
        message: 'Manutenção atualizada com sucesso.',
        redirectUrl: '/sindico/manutencoes?success=updated',
      });
    }

    return res.redirect('/sindico/manutencoes?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    if (isAjaxRequest(req)) {
      return res.status(error.statusCode || 400).json({
        success: false,
        error: error.message || 'Erro ao atualizar manutenção',
        code: error.code || 'UPDATE_MAINTENANCE_ERROR',
      });
    }
    try {
      const { operacionais, ativos } = await loadFormDependencies(req.user.condominiumId);
      return res.render('manutencoes/form', {
        title: 'Editar Manutenção',
        user: req.user,
        operacionais,
        ativos,
        manutencao: { ...req.body, id: req.params.id },
        error: error.message,
        formData: req.body,
      });
    } catch (renderErr) {
      return res.redirect('/sindico/manutencoes?error=' + encodeURIComponent(error.message));
    }
  }
};

const deleteManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    await manutencaoService.deleteMaintenance(
      req.params.id,
      req.user.condominiumId,
      req.user.id,
      ipAddress,
      userAgent
    );
    if (isAjaxRequest(req)) {
      return res.json({ success: true, message: 'Manutenção excluída com sucesso.' });
    }
    return res.redirect('/sindico/manutencoes?success=deleted');
  } catch (error) {
    console.error('Erro ao excluir manutenção:', error);
    if (isAjaxRequest(req)) {
      return res.status(error.statusCode || 400).json({
        success: false,
        error: error.message || 'Erro ao excluir manutenção',
        code: error.code || 'DELETE_MAINTENANCE_ERROR',
      });
    }
    return res.redirect('/sindico/manutencoes?error=' + encodeURIComponent(error.message));
  }
};

// Função para exibir detalhes de manutenção
// GET /manutencoes/:id
const showManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const manutencao = await manutencaoService.getMaintenanceById(
      req.params.id,
      req.user.condominiumId
    );

    res.render('manutencoes/detail', {
      title: `Manutenção: ${manutencao.title}`,
      user: req.user,
      manutencao: manutencao,
    });
  } catch (error) {
    console.error('Erro ao exibir manutenção:', error);
    renderError(res, 500, 'Erro ao carregar manutenção', error);
  }
};

// Função para iniciar manutenção (Operacional)
// POST /operacional/manutencoes/:id/iniciar
const startManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const updated = await manutencaoService.startMaintenance(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

    if (isAjaxRequest(req)) {
      return res.json({
        success: true,
        maintenance: updated,
        message: 'Manutenção iniciada com sucesso.',
      });
    }

    res.redirect('/operacional/manutencoes?success=started');
  } catch (error) {
    console.error('Erro ao iniciar manutenção:', error);
    res.redirect('/operacional/manutencoes?error=' + encodeURIComponent(error.message));
  }
};

// Função para exibir formulário de conclusão de manutenção (Operacional)
// GET /operacional/manutencoes/:id/concluir
const showCompleteManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const manutencao = await manutencaoService.getMaintenanceById(
      req.params.id,
      req.user.condominiumId
    );

    res.render('manutencoes/complete', {
      title: 'Concluir Manutenção',
      user: req.user,
      manutencao: manutencao,
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de conclusão:', error);
    renderError(res, 500, 'Erro ao carregar formulário', error);
  }
};

// Função para completar manutenção (Operacional)
// POST /operacional/manutencoes/:id/concluir
const completeManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      completionNotes: req.body.completionNotes,
      cost: req.body.cost,
    };

    const updated = await manutencaoService.completeMaintenance(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      data,
      ipAddress,
      userAgent
    );

    if (isAjaxRequest(req)) {
      return res.json({
        success: true,
        maintenance: updated,
        message: 'Dar baixa realizada com sucesso.',
      });
    }

    res.redirect('/operacional/manutencoes?success=completed');
  } catch (error) {
    console.error('Erro ao completar manutenção:', error);
    try {
      const manutencao = await manutencaoService.getMaintenanceById(
        req.params.id,
        req.user.condominiumId
      );

      res.render('manutencoes/complete', {
        title: 'Concluir Manutenção',
        user: req.user,
        manutencao: manutencao,
        error: error.message,
        formData: req.body,
      });
    } catch (renderError) {
      res.redirect('/operacional/manutencoes?error=' + encodeURIComponent(error.message));
    }
  }
};

// PATCH /sindico/manutencoes/:id/status ou /operacional/manutencoes/:id/status
const patchStatusManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return renderError(res, 400, 'Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    const data = {
      completionNotes: req.body.completionNotes || req.body.notes || null,
      cost: req.body.cost || null,
    };

    const updated = await manutencaoService.updateMaintenanceStatus(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      req.body.status,
      data,
      ipAddress,
      userAgent,
      { actorRoles: req.user.roles || [] }
    );

    return res.json({
      success: true,
      maintenance: updated,
      statusLabel: mapStatusLabel(updated.status),
      message: `Status atualizado para ${mapStatusLabel(updated.status)}.`,
    });
  } catch (error) {
    console.error('Erro ao atualizar status da manutenção:', error);
    return res.status(error.statusCode || 400).json({
      success: false,
      error: error.message || 'Erro ao atualizar status da manutenção',
      code: error.code || 'PATCH_MAINTENANCE_STATUS_ERROR',
    });
  }
};

module.exports = {
  listManutencoes,
  showCreateManutencao,
  createManutencao,
  showEditManutencao,
  updateManutencao,
  deleteManutencao,
  showManutencao,
  startManutencao,
  showCompleteManutencao,
  completeManutencao,
  patchStatusManutencao,
};

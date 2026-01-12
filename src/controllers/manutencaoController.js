// Controller de Manutenções
// Gerencia requisições relacionadas a manutenções preventivas e corretivas

const manutencaoService = require('../services/manutencaoService');
const { renderError } = require('../utils/errorHandler');

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

    // Busca operacionais para atribuir
    const administrativoService = require('../services/administrativoService');
    const operacionais = await administrativoService.listOperacionais(req.user.condominiumId);

    // Busca ativos (opcional)
    const patrimonioService = require('../services/patrimonioService');
    const ativos = await patrimonioService.listAssets(req.user.condominiumId, { status: 'ACTIVE' });

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
    };

    await manutencaoService.createMaintenance(
      req.user.condominiumId,
      req.user.id,
      data,
      ipAddress,
      userAgent
    );

    res.redirect('/sindico/manutencoes?success=created');
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    try {
      const administrativoService = require('../services/administrativoService');
      const patrimonioService = require('../services/patrimonioService');
      const operacionais = await administrativoService.listOperacionais(req.user.condominiumId);
      const ativos = await patrimonioService.listAssets(req.user.condominiumId, { status: 'ACTIVE' });

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

    await manutencaoService.startMaintenance(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      ipAddress,
      userAgent
    );

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

    await manutencaoService.completeMaintenance(
      req.params.id,
      req.user.id,
      req.user.condominiumId,
      data,
      ipAddress,
      userAgent
    );

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

module.exports = {
  listManutencoes,
  showCreateManutencao,
  createManutencao,
  showManutencao,
  startManutencao,
  showCompleteManutencao,
  completeManutencao,
};

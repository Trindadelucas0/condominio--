// Controller do módulo PATRIMONIO
// Gerencia requisições do painel patrimonial
// SEPARADO do ADMINISTRATIVO conforme regras do sistema

const patrimonioService = require('../services/patrimonioService'); // Service do módulo patrimônio

// Função para exibir dashboard patrimonial
// GET /patrimonio/dashboard
const showPatrimonioDashboard = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const stats = await patrimonioService.getDashboardStats(req.user.condominiumId);

    res.render('administrativo/patrimonio/dashboard', {
      title: 'Dashboard Patrimonial',
      user: req.user,
      stats: stats,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard patrimonial:', error);
    res.status(500).send('Erro ao carregar dashboard patrimonial');
  }
};

// Função para listar ativos
// GET /patrimonio/ativos
const showAtivos = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const filters = {
      assetType: req.query.tipo || undefined,
      status: req.query.status || undefined,
    };

    const assets = await patrimonioService.listAssets(req.user.condominiumId, filters);

    res.render('administrativo/patrimonio/ativos/list', {
      title: 'Ativos',
      user: req.user,
      assets: assets,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar ativos:', error);
    res.status(500).send('Erro ao carregar ativos');
  }
};

// Função para exibir formulário de criação de ativo
// GET /patrimonio/ativos/novo
const showCreateAtivo = (req, res) => {
  res.render('administrativo/patrimonio/ativos/form', {
    title: 'Novo Ativo',
    user: req.user,
    ativo: null,
  });
};

// Função para processar criação de ativo
// POST /patrimonio/ativos
// REGRA: Patrimônio registra ativos, NÃO cria despesas
const createAtivo = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      description: req.body.description,
      assetType: req.body.assetType,
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      serialNumber: req.body.serialNumber,
      acquisitionDate: req.body.acquisitionDate,
      acquisitionCost: req.body.acquisitionCost,
      depreciationRate: req.body.depreciationRate,
      usefulLifeYears: req.body.usefulLifeYears,
      location: req.body.location,
    };

    await patrimonioService.createAsset(data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/patrimonio/ativos?success=created');
  } catch (error) {
    res.render('administrativo/patrimonio/ativos/form', {
      title: 'Novo Ativo',
      user: req.user,
      ativo: req.body,
      error: error.message,
    });
  }
};

// Função para exibir detalhes do ativo
// GET /patrimonio/ativos/:id
const showAtivo = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const asset = await patrimonioService.getAssetById(req.params.id, req.user.condominiumId);

    res.render('administrativo/patrimonio/ativos/detail', {
      title: asset.name,
      user: req.user,
      asset: asset,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao buscar ativo:', error);
    res.redirect('/patrimonio/ativos?error=' + encodeURIComponent(error.message));
  }
};

// Função para exibir formulário de edição de ativo
// GET /patrimonio/ativos/:id/editar
const showEditAtivo = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const asset = await patrimonioService.getAssetById(req.params.id, req.user.condominiumId);

    res.render('administrativo/patrimonio/ativos/form', {
      title: 'Editar Ativo',
      user: req.user,
      ativo: asset,
    });
  } catch (error) {
    console.error('Erro ao carregar ativo:', error);
    res.redirect('/patrimonio/ativos?error=' + encodeURIComponent(error.message));
  }
};

// Função para processar atualização de ativo
// POST /patrimonio/ativos/:id
const updateAtivo = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      name: req.body.name,
      description: req.body.description,
      assetType: req.body.assetType,
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      serialNumber: req.body.serialNumber,
      acquisitionDate: req.body.acquisitionDate,
      acquisitionCost: req.body.acquisitionCost,
      depreciationRate: req.body.depreciationRate,
      usefulLifeYears: req.body.usefulLifeYears,
      location: req.body.location,
      status: req.body.status,
    };

    await patrimonioService.updateAsset(req.params.id, data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/patrimonio/ativos/' + req.params.id + '?success=updated');
  } catch (error) {
    try {
      const asset = await patrimonioService.getAssetById(req.params.id, req.user.condominiumId);

      res.render('administrativo/patrimonio/ativos/form', {
        title: 'Editar Ativo',
        user: req.user,
        ativo: { ...asset, ...req.body },
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar atualização de ativo');
    }
  }
};

// Função para exibir formulário de criação de manutenção
// GET /patrimonio/ativos/:id/manutencao/nova
const showCreateManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const asset = await patrimonioService.getAssetById(req.params.id, req.user.condominiumId);

    res.render('administrativo/patrimonio/manutencoes/form', {
      title: 'Nova Manutenção',
      user: req.user,
      asset: asset,
      manutencao: null,
    });
  } catch (error) {
    console.error('Erro ao carregar ativo:', error);
    res.redirect('/patrimonio/ativos?error=' + encodeURIComponent(error.message));
  }
};

// Função para processar criação de manutenção
// POST /patrimonio/ativos/:id/manutencao
// REGRA: Patrimônio vincula manutenção ao ativo, NÃO aprova compra
const createManutencao = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const data = {
      maintenanceType: req.body.maintenanceType,
      description: req.body.description,
      cost: req.body.cost,
      maintenanceDate: req.body.maintenanceDate,
      nextMaintenanceDate: req.body.nextMaintenanceDate,
      performedBy: req.body.performedBy,
      notes: req.body.notes,
    };

    await patrimonioService.createMaintenance(req.params.id, data, req.user.id, req.user.condominiumId, ipAddress, userAgent);

    res.redirect('/patrimonio/ativos/' + req.params.id + '?success=maintenance_created');
  } catch (error) {
    try {
      const asset = await patrimonioService.getAssetById(req.params.id, req.user.condominiumId);

      res.render('administrativo/patrimonio/manutencoes/form', {
        title: 'Nova Manutenção',
        user: req.user,
        asset: asset,
        manutencao: req.body,
        error: error.message,
      });
    } catch (renderError) {
      res.status(500).send('Erro ao processar criação de manutenção');
    }
  }
};

// Função para calcular depreciação
// POST /patrimonio/ativos/:id/calcular-depreciacao
const calculateDepreciation = async (req, res) => {
  try {
    if (!req.user.condominiumId) {
      return res.status(400).send('Usuário não está associado a um condomínio');
    }

    await patrimonioService.calculateDepreciation(req.params.id, req.user.condominiumId);

    res.redirect('/patrimonio/ativos/' + req.params.id + '?success=depreciation_calculated');
  } catch (error) {
    console.error('Erro ao calcular depreciação:', error);
    res.redirect('/patrimonio/ativos/' + req.params.id + '?error=' + encodeURIComponent(error.message));
  }
};

// Exporta funções para uso nas rotas
module.exports = {
  showPatrimonioDashboard,
  showAtivos,
  showCreateAtivo,
  createAtivo,
  showAtivo,
  showEditAtivo,
  updateAtivo,
  showCreateManutencao,
  createManutencao,
  calculateDepreciation,
};

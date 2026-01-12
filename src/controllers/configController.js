// Controller de configurações do condomínio
// Gerencia configurações centralizadas do sistema
// REGRA: Síndico e Super Master podem alterar configurações

const configService = require('../services/configService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir página de configurações
// GET /config
const showConfig = async (req, res) => {
  try {
    const settings = await configService.listSettings(req.user.condominiumId);

    // Agrupa por categoria
    const settingsByCategory = {};
    settings.forEach((setting) => {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = [];
      }
      settingsByCategory[setting.category].push(setting);
    });

    res.render('config/index', {
      title: 'Configurações do Condomínio',
      user: req.user,
      settingsByCategory,
    });
  } catch (error) {
    console.error('Erro ao exibir configurações:', error);
    renderError(res, 500, 'Erro ao carregar configurações', error);
  }
};

// Função para exibir formulário de edição de configuração
// GET /config/:key/edit
const showEditConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await configService.getSetting(req.user.condominiumId, key);

    if (!setting) {
      return renderError(res, 404, 'Configuração não encontrada');
    }

    res.render('config/edit', {
      title: 'Editar Configuração',
      user: req.user,
      setting,
    });
  } catch (error) {
    console.error('Erro ao exibir edição de configuração:', error);
    renderError(res, 500, 'Erro ao carregar configuração', error);
  }
};

// Função para atualizar configuração
// POST /config/:key
const updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { settingValue, settingType, description, category } = req.body;

    if (!settingValue || !settingType || !category) {
      return renderError(res, 400, 'Valor, tipo e categoria são obrigatórios');
    }

    await configService.setSetting(
      req.user.condominiumId,
      key,
      settingValue,
      settingType,
      description,
      category,
      req.user.id,
      req.ip,
      req.get('user-agent')
    );

    res.redirect('/config?success=Configuração atualizada com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    renderError(res, 500, 'Erro ao atualizar configuração: ' + error.message, error);
  }
};

// Função para criar nova configuração
// POST /config
const createConfig = async (req, res) => {
  try {
    const { settingKey, settingValue, settingType, description, category } = req.body;

    if (!settingKey || !settingValue || !settingType || !category) {
      return renderError(res, 400, 'Chave, valor, tipo e categoria são obrigatórios');
    }

    await configService.setSetting(
      req.user.condominiumId,
      settingKey,
      settingValue,
      settingType,
      description,
      category,
      req.user.id,
      req.ip,
      req.get('user-agent')
    );

    res.redirect('/config?success=Configuração criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    renderError(res, 500, 'Erro ao criar configuração: ' + error.message, error);
  }
};

module.exports = {
  showConfig,
  showEditConfig,
  updateConfig,
  createConfig,
};

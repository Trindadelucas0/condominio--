// Controller do módulo SUPER_MASTER
// Gerencia requisições do painel master
// Apenas usuários com perfil SUPER_MASTER podem acessar

const masterService = require('../services/masterService');
const { renderError } = require('../utils/errorHandler'); // Helper para tratamento de erros

// Função para exibir dashboard master
// GET /master/dashboard
const showDashboard = async (req, res) => {
  try {
    const stats = await masterService.getDashboardStats();

    res.render('master/dashboard', {
      title: 'Dashboard Master',
      user: req.user,
      stats: stats,
    });
  } catch (error) {
    console.error('Erro ao exibir dashboard master:', error);
    renderError(res, 500, 'Erro ao carregar dashboard master', error);
  }
};

// Função para listar condomínios
// GET /master/condominios
const listCondominios = async (req, res) => {
  try {
    // Verifica se deve incluir inativos (query parameter ?includeInactive=true)
    const includeInactive = req.query.includeInactive === 'true';
    const condominios = await masterService.listCondominios(includeInactive);

    res.render('master/condominios/list', {
      title: 'Condomínios',
      user: req.user,
      condominios: condominios,
      includeInactive: includeInactive,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar condomínios:', error);
    renderError(res, 500, 'Erro ao carregar condomínios', error);
  }
};

// Função para exibir formulário de criação de condomínio
// GET /master/condominios/novo
const showCreateCondominio = async (req, res) => {
  try {
    res.render('master/condominios/form', {
      title: 'Novo Condomínio',
      user: req.user,
      condominio: null,
      action: 'create',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de condomínio:', error);
    renderError(res, 500, 'Erro ao carregar formulário de condomínio', error);
  }
};

// Função para criar condomínio
// POST /master/condominios
const createCondominio = async (req, res) => {
  try {
    // Valida que não está tentando criar com ID válido (deve ser criação, não atualização)
    // Só redireciona se o ID for um número válido
    if (req.body.id) {
      const id = parseInt(req.body.id, 10);
      if (!isNaN(id) && id > 0) {
        console.warn('⚠️ Tentativa de criar condomínio com ID fornecido. Redirecionando para atualização.');
        return res.redirect(`/master/condominios/${id}/editar`);
      }
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await masterService.createCondominium(
      req.body,
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/condominios?success=created');
  } catch (error) {
    console.error('Erro ao criar condomínio:', error);
    // Remove ID do req.body se existir (para garantir que é criação, não edição)
    // Mantém outros campos para preservar dados preenchidos pelo usuário
    const condominioData = { ...req.body };
    delete condominioData.id;
    // Garante que não tem ID para o formulário não tentar usar rota de atualização
    condominioData.id = undefined;
    
    res.render('master/condominios/form', {
      title: 'Novo Condomínio',
      user: req.user,
      condominio: condominioData, // Passa dados sem ID para manter valores preenchidos
      action: 'create',
      error: error.message,
    });
  }
};

// Função para exibir formulário de edição de condomínio
// GET /master/condominios/:id/editar
const showEditCondominio = async (req, res) => {
  try {
    // Valida se ID existe
    if (!req.params.id || req.params.id === 'undefined') {
      return renderError(res, 400, 'ID do condomínio não fornecido');
    }

    const condominio = await masterService.getCondominiumById(req.params.id);

    res.render('master/condominios/form', {
      title: 'Editar Condomínio',
      user: req.user,
      condominio: condominio,
      action: 'edit',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição de condomínio:', error);
    renderError(res, 500, 'Erro ao carregar formulário de edição de condomínio', error);
  }
};

// Função para atualizar condomínio
// POST /master/condominios/:id
const updateCondominio = async (req, res) => {
  try {
    // Valida se ID existe
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).render('master/condominios/form', {
        title: 'Editar Condomínio',
        user: req.user,
        condominio: req.body,
        action: 'edit',
        error: 'ID do condomínio não fornecido',
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte active para boolean
    // O campo hidden sempre envia "true" ou "false" como string
    let active = false;
    if (req.body.active !== undefined) {
      if (typeof req.body.active === 'string') {
        active = req.body.active === 'true' || req.body.active === '1';
      } else if (typeof req.body.active === 'boolean') {
        active = req.body.active;
      } else {
        active = Boolean(req.body.active);
      }
    }

    console.log('🔍 [DEBUG] Active recebido:', req.body.active, 'Tipo:', typeof req.body.active, 'Convertido:', active);

    await masterService.updateCondominium(
      req.params.id,
      { ...req.body, active },
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/condominios?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar condomínio:', error);
    
    // Se ID não existe ou é inválido, usa req.body como fallback
    let condominio = req.body;
    if (req.params.id && req.params.id !== 'undefined') {
      try {
        condominio = await masterService.getCondominiumById(req.params.id);
      } catch (err) {
        console.error('Erro ao buscar condomínio para exibir erro:', err);
        // Mantém req.body como fallback
      }
    }
    
    res.render('master/condominios/form', {
      title: 'Editar Condomínio',
      user: req.user,
      condominio: condominio,
      action: 'edit',
      error: error.message,
    });
  }
};

// Função para listar usuários
// GET /master/usuarios
const listUsuarios = async (req, res) => {
  try {
    const usuarios = await masterService.listUsuarios();

    res.render('master/usuarios/list', {
      title: 'Usuários',
      user: req.user,
      usuarios: usuarios,
      query: req.query,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    renderError(res, 500, 'Erro ao carregar usuários', error);
  }
};

// Função para exibir formulário de criação de usuário
// GET /master/usuarios/novo
const showCreateUsuario = async (req, res) => {
  try {
    const roles = await masterService.listRoles();
    const condominios = await masterService.listCondominios();

    res.render('master/usuarios/form', {
      title: 'Novo Usuário',
      user: req.user,
      usuario: null,
      roles: roles,
      condominios: condominios,
      action: 'create',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de usuário:', error);
    renderError(res, 500, 'Erro ao carregar formulário de usuário', error);
  }
};

// Função para criar usuário
// POST /master/usuarios
const createUsuario = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte roleIds para array se for string
    const roleIds = req.body.roleIds 
      ? (Array.isArray(req.body.roleIds) ? req.body.roleIds : [req.body.roleIds])
      : [];

    await masterService.createUser(
      { ...req.body, roleIds },
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/usuarios?success=created');
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    const roles = await masterService.listRoles().catch(() => []);
    const condominios = await masterService.listCondominios().catch(() => []);
    
    res.render('master/usuarios/form', {
      title: 'Novo Usuário',
      user: req.user,
      usuario: req.body,
      roles: roles,
      condominios: condominios,
      action: 'create',
      error: error.message,
    });
  }
};

// Função para exibir formulário de edição de usuário
// GET /master/usuarios/:id/editar
const showEditUsuario = async (req, res) => {
  try {
    const usuario = await masterService.getUsuarioById(req.params.id);
    const roles = await masterService.listRoles();
    const condominios = await masterService.listCondominios();

    res.render('master/usuarios/form', {
      title: 'Editar Usuário',
      user: req.user,
      usuario: usuario,
      roles: roles,
      condominios: condominios,
      action: 'edit',
    });
  } catch (error) {
    console.error('Erro ao exibir formulário de edição de usuário:', error);
    renderError(res, 500, 'Erro ao carregar formulário de edição de usuário', error);
  }
};

// Função para atualizar usuário
// POST /master/usuarios/:id
const updateUsuario = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Converte roleIds para array se for string
    const roleIds = req.body.roleIds 
      ? (Array.isArray(req.body.roleIds) ? req.body.roleIds : [req.body.roleIds])
      : [];

    await masterService.updateUsuario(
      req.params.id,
      { ...req.body, roleIds },
      req.user.id,
      ipAddress,
      userAgent
    );

    res.redirect('/master/usuarios?success=updated');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    const usuario = await masterService.getUsuarioById(req.params.id).catch(() => req.body);
    const roles = await masterService.listRoles().catch(() => []);
    const condominios = await masterService.listCondominios().catch(() => []);
    
    res.render('master/usuarios/form', {
      title: 'Editar Usuário',
      user: req.user,
      usuario: usuario,
      roles: roles,
      condominios: condominios,
      action: 'edit',
      error: error.message,
    });
  }
};

// Exporta funções para uso nas rotas
module.exports = {
  showDashboard,
  listCondominios,
  showCreateCondominio,
  createCondominio,
  showEditCondominio,
  updateCondominio,
  listUsuarios,
  showCreateUsuario,
  createUsuario,
  showEditUsuario,
  updateUsuario,
};
